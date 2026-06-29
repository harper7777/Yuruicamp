/**
 * admin/js/movement.js
 * 庫存異動紀錄模組
 * 從 admin/data/movement.json 載入主檔，點擊異動 ID 後顯示明細清單。
 *
 * 功能：
 *   - 期間篩選：近 7/30 天、本月、近 3 個月、自定義（flatpickr）
 *   - 欄位排序（可疊加）：異動日期
 *   - 多選篩選（可疊加）：負責員工 ID、異動性質
 *
 * 使用 jQuery Event Namespace (.movement) 防止重複導覽時事件堆疊
 */

window.generatedMovementRecords = window.generatedMovementRecords || [];
window.movementBaseLoaded = false;

/**
 * 排序堆疊：依點擊時間順序排列
 * 初始值設為日期降冪（最新異動在最上面）
 */
var movementSortStack = [{ key: 'date', dir: 'desc' }];

/**
 * 日期篩選 UI 狀態（對齊 orders.js orderDateState）
 */
var movementDateState = { days: 30, startDate: null, endDate: null };

/**
 * 篩選條件：各欄位目前勾選的值
 * 空陣列 = 不篩選（顯示全部）
 * dateStart / dateEnd 為 YYYY-MM-DD 字串，null = 不限制
 */
var movementFilterState = {
  employeeId:   [],   // e.g. ['01', '02']
  movementType: [],   // e.g. ['進貨', '損耗']
  dateStart:    null,
  dateEnd:      null
};

window.initMovement = function () {
  // 清除 orders / movement 舊事件（共用 .sortable-th / .filter-icon 選擇器）
  $(document).off('.orders');
  $(document).off('.movement');

  // 每次進入頁面重置排序與篩選（預設：日期降冪 + 近 30 天）
  movementSortStack = [{ key: 'date', dir: 'desc' }];
  movementFilterState = { employeeId: [], movementType: [], dateStart: null, dateEnd: null };
  movementDateState = { days: 30, startDate: null, endDate: null };

  setupMovementPeriodFilter();
  initMovementFlatpickr();
  applyMovementDayRange(30);

  if (window.movementBaseLoaded) {
    populateEmployeeFilterOptions(window.movementCache || []);
    applyMovementFiltersAndSort();
  } else {
    $.getJSON('data/movement.json', function (records) {
      window.movementCache = mergeMovementRecords(
        window.generatedMovementRecords,
        (records || []).map(normalizeMovementRecord)
      );
      window.movementBaseLoaded = true;
      populateEmployeeFilterOptions(window.movementCache);
      applyMovementFiltersAndSort();
    }).fail(function () {
      $('#movementTableBody').html(
        '<tr><td colspan="5" class="text-center text-danger py-4">' +
        '<i class="fas fa-exclamation-triangle me-2"></i>載入庫存異動紀錄失敗' +
        '</td></tr>'
      );
    });
  }

  // ── 排序：點擊 .sortable-th 標頭（三段式：無 → asc → desc → 移除） ──
  $(document).on('click.movement', '#movementTable .sortable-th', function () {
    var key = $(this).data('sort-key');
    var idx = movementSortStack.findIndex(function (s) { return s.key === key; });

    if (idx === -1) {
      movementSortStack.push({ key: key, dir: 'asc' });
    } else if (movementSortStack[idx].dir === 'asc') {
      movementSortStack[idx].dir = 'desc';
    } else {
      movementSortStack.splice(idx, 1);
    }

    applyMovementFiltersAndSort();
  });

  // ── 篩選 Dropdown 開關：點擊漏斗 icon ──
  $(document).on('click.movement', '#movementTable .filter-icon', function (e) {
    e.stopPropagation();
    var $th = $(this).closest('.filter-th');
    var $dropdown = $th.find('.filter-dropdown');

    $('#movementTable .filter-dropdown').not($dropdown).addClass('d-none');
    $dropdown.toggleClass('d-none');
  });

  // 點擊 Dropdown 內部時阻止冒泡關閉
  $(document).on('click.movement', '#movementTable .filter-dropdown', function (e) {
    e.stopPropagation();
  });

  // 點擊頁面其他地方 → 關閉所有 Dropdown
  $(document).on('click.movement', function () {
    $('#movementTable .filter-dropdown').addClass('d-none');
  });

  // ── 篩選 checkbox 勾選/取消 ──
  $(document).on('change.movement', '#movementTable .filter-dropdown input[type="checkbox"]', function () {
    var $th = $(this).closest('.filter-th');
    var key = $th.data('filter-key');

    var selected = [];
    $th.find('input[type="checkbox"]:checked').each(function () {
      selected.push($(this).val());
    });

    movementFilterState[key] = selected;
    applyMovementFiltersAndSort();
  });

  // ── 清除條件按鈕：還原預設排序 + 清空欄位篩選 + 還原近 30 天 ──
  $(document).on('click.movement', '#btnClearMovementSort', function () {
    movementSortStack = [{ key: 'date', dir: 'desc' }];
    movementFilterState.employeeId = [];
    movementFilterState.movementType = [];
    applyMovementDayRange(30);
  });

  // ── 點擊異動 ID → 開啟明細 Modal ──
  $(document).on('click.movement', '.movement-detail-link', function () {
    var movementId = $(this).data('movement-id');
    var record = (window.movementCache || []).find(function (item) {
      return item.id === movementId;
    });

    if (record) {
      showMovementDetailModal(record);
    }
  });
};

window.addMovementRecord = function (record) {
  var normalizedRecord = normalizeMovementRecord(record);

  window.generatedMovementRecords = window.generatedMovementRecords || [];
  window.generatedMovementRecords.unshift(normalizedRecord);

  if (Array.isArray(window.movementCache)) {
    window.movementCache.unshift(normalizedRecord);
  }

  if ($('#movementTableBody').length > 0) {
    populateEmployeeFilterOptions(window.movementCache || window.generatedMovementRecords);
    applyMovementFiltersAndSort();
  }
};

function mergeMovementRecords(generatedRecords, baseRecords) {
  var merged = [];
  var idMap = {};

  (generatedRecords || []).concat(baseRecords || []).forEach(function (record) {
    var normalizedRecord = normalizeMovementRecord(record);

    if (!idMap[normalizedRecord.id]) {
      merged.push(normalizedRecord);
      idMap[normalizedRecord.id] = true;
    }
  });

  return merged;
}

function normalizeMovementRecord(record) {
  var items = Array.isArray(record && record.items)
    ? record.items
    : [{
      productName: record && record.productName,
      quantity: record && record.quantity,
      fromStore: record && record.fromStore,
      toStore: record && record.toStore,
      type: record && record.type
    }];

  return {
    id: (record && record.id) || 'MV-NEW-' + Date.now(),
    date: (record && record.date) || '',
    employeeId: (record && (record.employeeId || record.adminId || record.staffId)) || '—',
    items: items.map(function (item) {
      return {
        productName: (item && item.productName) || '未命名商品',
        quantity: parseInt(item && item.quantity, 10) || 0,
        fromStore: (item && item.fromStore) || '—',
        toStore:   (item && item.toStore)   || '—',
        type:      (item && item.type)      || '—'
      };
    })
  };
}

/**
 * 取得一筆紀錄所有不重複的異動性質（供篩選使用）
 * Get unique movement types from a record's items array.
 */
function getRecordMovementTypes(record) {
  var types = {};
  (record.items || []).forEach(function (item) {
    types[item.type || '—'] = true;
  });
  return Object.keys(types);
}

/**
 * 從 items 陣列摘要顯示「異動性質」（取各 item type 的唯一值集合）。
 * 若有多種 type，用頓號連接。
 */
function summarizeMovementTypes(items) {
  var types = {};
  (items || []).forEach(function (item) {
    var t = item.type || '—';
    types[t] = true;
  });
  var keys = Object.keys(types);
  return keys.length > 0 ? keys.join('、') : '—';
}

/**
 * 依資料動態產生「負責員工 ID」篩選選項
 * Dynamically build employee ID filter checkboxes from cache.
 */
function populateEmployeeFilterOptions(records) {
  var ids = {};
  (records || []).forEach(function (record) {
    var id = record.employeeId;
    if (id && id !== '—') {
      ids[id] = true;
    }
  });

  var html = Object.keys(ids).sort().map(function (id) {
    return '<label><input type="checkbox" value="' + escapeMovementHtml(id) + '"> ' +
      escapeMovementHtml(id) + '</label>';
  }).join('');

  var $dropdown = $('#movementTable .filter-th[data-filter-key="employeeId"] .filter-dropdown');
  if (!$dropdown.length) return;

  $dropdown.html(
    html || '<span class="text-muted small px-2">尚無員工資料</span>'
  );
}

// ─────────────────────────────────────────────
// 日期篩選器（邏輯對齊 orders.js）
// ─────────────────────────────────────────────

function fmtMovementDateISO(d) {
  if (!d) return null;
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

function applyMovementDayRange(days) {
  if (days === 'all') {
    movementDateState.days      = 'all';
    movementDateState.startDate = null;
    movementDateState.endDate   = null;
    movementFilterState.dateStart = null;
    movementFilterState.dateEnd   = null;
  } else if (days === 'month') {
    var now   = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), 1);
    movementDateState.days      = 'month';
    movementDateState.startDate = start;
    movementDateState.endDate   = new Date(now);
    movementFilterState.dateStart = fmtMovementDateISO(start);
    movementFilterState.dateEnd   = fmtMovementDateISO(new Date(now));
  } else {
    var now   = new Date();
    var start = new Date(now);
    start.setDate(start.getDate() - (days - 1));
    movementDateState.days      = days;
    movementDateState.startDate = start;
    movementDateState.endDate   = new Date(now);
    movementFilterState.dateStart = fmtMovementDateISO(start);
    movementFilterState.dateEnd   = fmtMovementDateISO(new Date(now));
  }

  if (days !== 'custom') {
    $('#movementDateRangePicker').hide();
  }
  updateMovementPeriodLabel();
  applyMovementFiltersAndSort();
}

function applyMovementCustomRange(dateStart, dateEnd) {
  movementDateState.days      = 'custom';
  movementDateState.startDate = dateStart ? new Date(dateStart + 'T00:00:00') : null;
  movementDateState.endDate   = dateEnd   ? new Date(dateEnd   + 'T00:00:00') : null;
  movementFilterState.dateStart = dateStart || null;
  movementFilterState.dateEnd   = dateEnd   || null;
  updateMovementPeriodLabel();
  applyMovementFiltersAndSort();

  var pickerEl = document.querySelector('#movementDateRangePicker');
  if (pickerEl && pickerEl._flatpickr && movementDateState.startDate && movementDateState.endDate) {
    pickerEl._flatpickr.setDate(
      [movementDateState.startDate, movementDateState.endDate],
      false
    );
  }
  $('#movementDateRangePicker').show();
}

function updateMovementPeriodLabel() {
  var days = movementDateState.days;

  $('#movementPeriodBtns button').removeClass('active');
  if (days !== 'all') {
    $('#movementPeriodBtns button[data-days="' + days + '"]').addClass('active');
  }

  var $label = $('#movementPeriodLabel');

  if (days === 'custom') {
    $label.addClass('d-none').text('');
    return;
  }

  $label.removeClass('d-none');

  if (days === 'all') {
    $label.text('全部期間');
  } else if (movementDateState.startDate && movementDateState.endDate) {
    $label.text(
      fmtMovementDateISO(movementDateState.startDate) + ' 至 ' +
      fmtMovementDateISO(movementDateState.endDate)
    );
  } else {
    $label.text('');
  }
}

function enterMovementCustomMode() {
  movementDateState.days = 'custom';
  updateMovementPeriodLabel();

  var pickerEl = document.querySelector('#movementDateRangePicker');
  if (pickerEl && pickerEl._flatpickr && movementDateState.startDate && movementDateState.endDate) {
    pickerEl._flatpickr.setDate(
      [movementDateState.startDate, movementDateState.endDate],
      false
    );
  }

  $('#movementDateRangePicker').show().trigger('click');
}

function initMovementFlatpickr() {
  if (typeof flatpickr === 'undefined') return;

  var locale = (flatpickr.l10ns && flatpickr.l10ns.zh_tw)
    ? flatpickr.l10ns.zh_tw
    : 'default';

  flatpickr('#movementDateRangePicker', {
    mode: 'range',
    dateFormat: 'Y-m-d',
    locale: locale,
    onClose: function (selectedDates) {
      if (selectedDates.length === 2) {
        applyMovementCustomRange(
          fmtMovementDateISO(selectedDates[0]),
          fmtMovementDateISO(selectedDates[1])
        );
      }
    }
  });
}

function setupMovementPeriodFilter() {
  $(document).on('click.movement', '#movementPeriodBtns button[data-days]', function () {
    var days = $(this).data('days');

    if (days === 'custom') {
      enterMovementCustomMode();
    } else if (days === 'month') {
      if ($(this).hasClass('active')) {
        applyMovementDayRange('all');
      } else {
        applyMovementDayRange('month');
      }
    } else if ($(this).hasClass('active')) {
      applyMovementDayRange('all');
    } else {
      applyMovementDayRange(parseInt(days, 10));
    }
  });
}

/**
 * 依 movementFilterState 篩選、依 movementSortStack 排序，再重新渲染表格
 * Filter → sort → render pipeline (same pattern as orders.js)
 */
function applyMovementFiltersAndSort() {
  var data = (window.movementCache || []).slice();

  // ── Step 1：篩選（欄位之間 AND，同欄多選 OR） ──

  if (movementFilterState.employeeId.length > 0) {
    data = data.filter(function (record) {
      return movementFilterState.employeeId.indexOf(record.employeeId) !== -1;
    });
  }

  if (movementFilterState.movementType.length > 0) {
    data = data.filter(function (record) {
      var types = getRecordMovementTypes(record);
      return types.some(function (type) {
        return movementFilterState.movementType.indexOf(type) !== -1;
      });
    });
  }

  // 日期範圍篩選（比對 record.date，格式 YYYY-MM-DD）
  if (movementFilterState.dateStart) {
    data = data.filter(function (record) {
      return (record.date || '').slice(0, 10) >= movementFilterState.dateStart;
    });
  }
  if (movementFilterState.dateEnd) {
    data = data.filter(function (record) {
      return (record.date || '').slice(0, 10) <= movementFilterState.dateEnd;
    });
  }

  // ── Step 2：排序（多鍵穩定排序） ──
  if (movementSortStack.length > 0) {
    data.sort(function (a, b) {
      for (var i = 0; i < movementSortStack.length; i++) {
        var key = movementSortStack[i].key;
        var dir = movementSortStack[i].dir === 'asc' ? 1 : -1;
        var valA = a[key] || '';
        var valB = b[key] || '';
        if (valA < valB) return -1 * dir;
        if (valA > valB) return  1 * dir;
      }
      return 0;
    });
  }

  // ── Step 3：渲染 + 更新 UI ──
  renderMovementTable(data);
  updateMovementSortUI();
  updateMovementFilterUI();
}

/**
 * 依 movementSortStack 更新欄位標頭箭頭 icon 與「清除條件」按鈕
 */
function updateMovementSortUI() {
  $('#movementTable .sort-icon')
    .removeClass('fa-sort-up fa-sort-down sort-active')
    .addClass('fa-sort');

  movementSortStack.forEach(function (s) {
    var $icon = $('#movementTable .sortable-th[data-sort-key="' + s.key + '"] .sort-icon');
    $icon
      .removeClass('fa-sort')
      .addClass(s.dir === 'asc' ? 'fa-sort-up' : 'fa-sort-down')
      .addClass('sort-active');
  });

  var isDefaultSort = (
    movementSortStack.length === 1 &&
    movementSortStack[0].key === 'date' &&
    movementSortStack[0].dir === 'desc'
  );

  var hasActiveFilter = (
    movementFilterState.employeeId.length > 0 ||
    movementFilterState.movementType.length > 0
  );

  var isDefaultDate = movementDateState.days === 30;

  if (!isDefaultSort || hasActiveFilter || !isDefaultDate) {
    $('#btnClearMovementSort').removeClass('d-none');
  } else {
    $('#btnClearMovementSort').addClass('d-none');
  }
}

/**
 * 依 movementFilterState 更新漏斗 icon 顏色、紅點與 checkbox 勾選狀態
 */
function updateMovementFilterUI() {
  ['employeeId', 'movementType'].forEach(function (key) {
    var $th   = $('#movementTable .filter-th[data-filter-key="' + key + '"]');
    var $icon = $th.find('.filter-icon');
    var $dot  = $th.find('.filter-dot');

    if (movementFilterState[key].length > 0) {
      $icon.addClass('active');
      $dot.removeClass('d-none');
      $th.find('input[type="checkbox"]').each(function () {
        $(this).prop('checked', movementFilterState[key].indexOf($(this).val()) !== -1);
      });
    } else {
      $icon.removeClass('active');
      $dot.addClass('d-none');
      $th.find('input[type="checkbox"]').prop('checked', false);
    }
  });
}

function renderMovementTable(records) {
  if (!records || records.length === 0) {
    $('#movementTableBody').html(
      '<tr><td colspan="5" class="text-center text-muted py-4">目前沒有符合條件的庫存異動紀錄</td></tr>'
    );
    return;
  }

  var html = records.map(function (record) {
    var itemCount = (record.items || []).length;
    var typesSummary = summarizeMovementTypes(record.items);

    return '<tr data-movement-id="' + escapeMovementHtml(record.id) + '">' +
      '<td>' +
      '<span class="admin-cell-link movement-detail-link" ' +
      'data-movement-id="' + escapeMovementHtml(record.id) + '">' +
      escapeMovementHtml(record.id) +
      '</span>' +
      '</td>' +
      '<td>' + escapeMovementHtml(record.date) + '</td>' +
      '<td>' + escapeMovementHtml(record.employeeId || '—') + '</td>' +
      '<td>' + itemCount + ' 筆</td>' +
      '<td>' + escapeMovementHtml(typesSummary) + '</td>' +
      '</tr>';
  }).join('');

  $('#movementTableBody').html(html);
}

function showMovementDetailModal(record) {
  $('#modalMovementId').text(record.id);
  $('#modalMovementDate').text(record.date);
  $('#modalMovementEmployeeId').text(record.employeeId || '—');

  var itemsHtml = (record.items || []).map(function (item) {
    var typeBadge = item.type || '—';
    var typeCellContent = item.type === '損耗'
      ? '<span class="badge bg-warning text-dark">' + escapeMovementHtml(typeBadge) + '</span>'
      : escapeMovementHtml(typeBadge);

    return '<tr>' +
      '<td>' + escapeMovementHtml(item.productName) + '</td>' +
      '<td class="text-center fw-semibold">' + escapeMovementHtml(item.quantity) + '</td>' +
      '<td>' + escapeMovementHtml(item.fromStore) + '</td>' +
      '<td>' + escapeMovementHtml(item.toStore) + '</td>' +
      '<td>' + typeCellContent + '</td>' +
      '</tr>';
  }).join('');

  $('#modalMovementItems').html(
    itemsHtml || '<tr><td colspan="5" class="text-center text-muted">沒有異動明細</td></tr>'
  );

  bootstrap.Modal.getOrCreateInstance(document.getElementById('movementDetailModal')).show();
}

function escapeMovementHtml(value) {
  return String(value === null || value === undefined ? '' : value).replace(/[&<>"']/g, function (char) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char];
  });
}
