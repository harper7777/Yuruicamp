/**
 * admin/js/customers.js
 * 客戶管理模組
 * 使用 jQuery Event Namespace (.customers) 防止重複導覽時事件堆疊
 *
 * window.tagColorMap 的鍵值必須與 customers.json 的 tags 陣列完全一致（含中文）
 * inline editing 支援：
 *   - phone（手機）、email（信箱）、tier（會員等級）、points（點數）：按鈕儲存 + Enter 鍵儲存
 *   - tags（標籤）：下拉 checkbox 多選 + 新增 / 刪除標籤
 * 主列為唯讀摘要（桌面 table / 手機卡片）；展開後才可編輯，儲存後同步更新主列
 * 篩選：會員等級/標籤（欄內 OR，兩欄 AND 疊加）；排序：註冊日期/消費總額（三段式）
 */

// ─────────────────────────────────────────────
// 篩選 / 排序狀態（每次進入會員列表重置）
// ─────────────────────────────────────────────

/** @type {Array<{key: string, dir: 'asc'|'desc'}>} */
var customerSortStack = [];

/** @type {{ tier: string[], tags: string[] }} */
var customerFilterState = {
  tier: [],
  tags: []
};

// ==========================================================================
// Step 1 — 全域標籤顏色對應表
//   改掛在 window 上，讓新增 / 刪除標籤時全頁共用同一份資料
//   || 語法：若已存在（例如切換頁面回來）就保留舊值，不重置
// ==========================================================================
window.tagColorMap = window.tagColorMap || {
  '高消費':   'bg-success',
  '新會員':   'bg-info text-dark',
  '高退貨率': 'bg-danger',
};

/**
 * 產生單一標籤的 Bootstrap badge HTML
 * @param {string} tag - 標籤名稱
 * @returns {string} badge HTML 字串
 */
function getTagBadge(tag) {
  // Step 1 — 改為讀取 window.tagColorMap（可動態增刪）
  var cls = window.tagColorMap[tag] || 'bg-secondary';
  return '<span class="badge ' + cls + ' me-1">' + tag + '</span>';
}

/**
 * 手機顯示格式：去掉 dash 和空格
 * Display phone without dashes or spaces — e.g. "0912-345-678" → "0912345678"
 * @param {string} phone
 * @returns {string}
 */
function formatPhoneDisplay(phone) {
  if (!phone) { return '—'; }
  return String(phone).replace(/[\s-]/g, '');
}

/**
 * 將 ISO 日期轉成 YYYY-MM-DD 顯示
 * Format ISO date for display — e.g. "2023-08-15"
 * @param {string} isoDate
 * @returns {string}
 */
function formatRegisteredDate(isoDate) {
  if (!isoDate) { return '—'; }
  return String(isoDate).slice(0, 10);
}

/**
 * 從展開區的編輯控制項向上找到客戶 ID
 * @param {jQuery} $el
 * @returns {string|undefined}
 */
function getCustomerIdFromDetail($el) {
  return $el.closest('.customer-detail-panel').data('customer-id');
}

/**
 * 編輯儲存後，同步更新主列（桌面 table 列 + 手機卡片）的唯讀顯示
 * @param {string} customerId
 * @param {Object} fields - { phone, email, tier, tagsHtml }
 */
function syncCustomerMainRow(customerId, fields) {
  var $summary = $('.customer-summary-row[data-customer-id="' + customerId + '"]');
  var $card    = $('.customer-mobile-card[data-customer-id="' + customerId + '"]');
  var $details = $('.customer-detail-panel[data-customer-id="' + customerId + '"]');

  if (fields.phone !== undefined) {
    var displayPhone = formatPhoneDisplay(fields.phone);
    $summary.find('.cell-phone').text(displayPhone);
    $card.find('.card-field-phone .card-value').text(displayPhone);
    $details.find('.phone-display').text(displayPhone);
  }
  if (fields.email !== undefined) {
    var emailText = fields.email || '—';
    $summary.find('.cell-email').text(emailText);
    $card.find('.card-field-email .card-value').text(emailText);
    $details.find('.email-display').text(emailText);
  }
  if (fields.tier !== undefined) {
    var tierText = fields.tier || '一般';
    $summary.find('.cell-tier').text(tierText);
    $card.find('.card-field-tier .card-value').text(tierText);
    $details.find('.tier-display').text(tierText);
  }
  if (fields.tagsHtml !== undefined) {
    $summary.find('.cell-tags').html(fields.tagsHtml);
    $card.find('.card-field-tags .card-value').html(fields.tagsHtml);
    $details.find('.tags-display').html(fields.tagsHtml);
  }
}

// ==========================================================================
// Step 3 — buildTagsDropdown：依 window.tagColorMap 產生 checkbox 清單
// ==========================================================================
/**
 * 依據 window.tagColorMap 動態產生標籤 checkbox 清單的 HTML
 * @param {string[]} currentTags - 此客戶目前已有的標籤（會預先勾選）
 * @returns {string} 填入 .tags-checkbox-list 的 HTML 字串
 */
function buildTagsDropdown(currentTags) {
  var keys = Object.keys(window.tagColorMap);
  if (keys.length === 0) {
    return '<div class="text-muted small py-1 px-1">尚無可用標籤，請在下方新增</div>';
  }
  return keys.map(function (tag) {
    var cls     = window.tagColorMap[tag];
    var checked = currentTags.indexOf(tag) !== -1 ? ' checked' : '';
    // 對標籤名稱做基本跳脫，防止特殊字元破壞 HTML 結構
    var safeTag = tag.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    return (
      '<div class="d-flex align-items-center gap-2 py-1 px-1">' +
        '<input type="checkbox" class="form-check-input tag-checkbox flex-shrink-0" ' +
               'value="' + safeTag + '"' + checked + '>' +
        '<span class="flex-grow-1">' +
          '<span class="badge ' + cls + '">' + safeTag + '</span>' +
        '</span>' +
        '<button type="button" class="btn btn-link btn-sm p-0 tag-delete-btn" ' +
                'data-tag="' + safeTag + '" title="從標籤庫刪除此標籤">' +
          '<i class="fas fa-times text-danger" style="font-size:0.75rem"></i>' +
        '</button>' +
      '</div>'
    );
  }).join('');
}

// ==========================================================================
// Step 8 — refreshAllCustomerTagsDisplay：全域同步所有客戶的標籤顯示
// ==========================================================================
/**
 * 遍歷所有客戶 DOM，依據 window.customersCache 同步更新標籤顯示
 * 呼叫時機：刪除標籤後，讓所有已渲染客戶即時反映最新狀態
 */
function refreshAllCustomerTagsDisplay() {
  applyCustomerFiltersAndSort();
}

// ==========================================================================
// 篩選 / 排序管線
// ==========================================================================

/**
 * 依 tagColorMap 重建桌面/手機的標籤篩選選項
 */
function buildCustomerTagsFilterOptions() {
  var tags = Object.keys(window.tagColorMap);
  var desktopHtml = tags.map(function (tag) {
    var safe = tag.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return '<label><input type="checkbox" value="' + safe + '"> ' + tag + '</label>';
  }).join('');
  if (!desktopHtml) {
    desktopHtml = '<div class="text-muted small px-2 py-1">尚無可用標籤</div>';
  }
  $('#customerTagsFilterDropdown').html(desktopHtml);

  var mobileHtml = tags.map(function (tag) {
    var safe = tag.replace(/&/g, '&amp;').replace(/"/g, '&quot;');
    return '<label class="small"><input type="checkbox" class="mobile-tags-cb" value="' +
           safe + '"> ' + tag + '</label>';
  }).join('');
  if (!mobileHtml) {
    mobileHtml = '<span class="text-muted small">尚無可用標籤</span>';
  }
  $('#mobileTagsFilters').html(mobileHtml);

  syncCustomerFilterCheckboxes();
}

/**
 * 同步 filterState 到桌面/手機 checkbox 勾選狀態
 */
function syncCustomerFilterCheckboxes() {
  $('#customersTable .filter-th[data-filter-key="tier"] input').each(function () {
    $(this).prop('checked', customerFilterState.tier.indexOf($(this).val()) !== -1);
  });
  $('#customerTagsFilterDropdown input, #mobileTagsFilters input').each(function () {
    $(this).prop('checked', customerFilterState.tags.indexOf($(this).val()) !== -1);
  });
  $('.mobile-tier-cb').each(function () {
    $(this).prop('checked', customerFilterState.tier.indexOf($(this).val()) !== -1);
  });

  var sortEntry = customerSortStack.find(function (s) { return s.key === 'totalSpent'; });
  var sortVal = sortEntry ? sortEntry.dir : '';
  $('#mobileCustomerSort').val(sortVal);
}

/**
 * 更新排序 icon 顯示
 */
function updateCustomerSortUI() {
  $('#customersTable .sort-icon')
    .removeClass('fa-sort-up fa-sort-down sort-active')
    .addClass('fa-sort');

  customerSortStack.forEach(function (s) {
    $('#customersTable .sortable-th[data-sort-key="' + s.key + '"] .sort-icon')
      .removeClass('fa-sort')
      .addClass(s.dir === 'asc' ? 'fa-sort-up' : 'fa-sort-down')
      .addClass('sort-active');
  });
}

/**
 * 更新漏斗 icon、紅點
 */
function updateCustomerFilterUI() {
  ['tier', 'tags'].forEach(function (key) {
    var $th = $('#customersTable .filter-th[data-filter-key="' + key + '"]');
    if (!$th.length) { return; }
    if (customerFilterState[key].length > 0) {
      $th.find('.filter-icon').addClass('active');
      $th.find('.filter-dot').removeClass('d-none');
      $th.find('input[type="checkbox"]').each(function () {
        $(this).prop('checked', customerFilterState[key].indexOf($(this).val()) !== -1);
      });
    } else {
      $th.find('.filter-icon').removeClass('active');
      $th.find('.filter-dot').addClass('d-none');
      $th.find('input[type="checkbox"]').prop('checked', false);
    }
  });

  syncCustomerFilterCheckboxes();
}

/**
 * 有篩選或排序時顯示「清除條件」按鈕
 */
function updateCustomerClearButtonUI() {
  var hasFilter = customerFilterState.tier.length > 0 || customerFilterState.tags.length > 0;
  var hasSort   = customerSortStack.length > 0;
  var showBtn   = hasFilter || hasSort;

  $('#btnClearCustomerConditions, #btnClearCustomerConditionsMobile')
    .toggleClass('d-none', !showBtn);
}

/**
 * 依欄位型別比較兩筆客戶資料（供排序用）
 * Compare customer field values for sorting
 * @param {string} key - 欄位名稱
 * @param {*} valA
 * @param {*} valB
 * @returns {number} -1 | 0 | 1
 */
function compareCustomerValues(key, valA, valB) {
  if (key === 'totalSpent') {
    var numA = Number(valA) || 0;
    var numB = Number(valB) || 0;
    if (numA < numB) { return -1; }
    if (numA > numB) { return  1; }
    return 0;
  }
  // 日期 / 字串欄：registeredAt（ISO YYYY-MM-DD 可直接字串比較）
  var strA = String(valA || '');
  var strB = String(valB || '');
  if (strA < strB) { return -1; }
  if (strA > strB) { return  1; }
  return 0;
}

/**
 * 先篩選再排序，然後重新渲染列表
 */
function applyCustomerFiltersAndSort() {
  var data = (window.customersCache || []).slice();

  // 會員等級 OR
  if (customerFilterState.tier.length > 0) {
    data = data.filter(function (c) {
      var tier = c.tier || '一般';
      return customerFilterState.tier.indexOf(tier) !== -1;
    });
  }

  // 標籤 OR（至少含一個已勾選標籤）
  if (customerFilterState.tags.length > 0) {
    data = data.filter(function (c) {
      var customerTags = c.tags || [];
      return customerFilterState.tags.some(function (selected) {
        return customerTags.indexOf(selected) !== -1;
      });
    });
  }

  // 註冊日期 / 消費總額排序
  if (customerSortStack.length > 0) {
    data.sort(function (a, b) {
      for (var i = 0; i < customerSortStack.length; i++) {
        var key = customerSortStack[i].key;
        var dir = customerSortStack[i].dir === 'asc' ? 1 : -1;
        var cmp = compareCustomerValues(key, a[key], b[key]);
        if (cmp !== 0) { return cmp * dir; }
      }
      return 0;
    });
  }

  renderCustomersList(data);
  updateCustomerSortUI();
  updateCustomerFilterUI();
  updateCustomerClearButtonUI();
}

/**
 * 從桌面或手機 checkbox 收集某一欄的篩選值
 * 只讀觸發來源那一側，避免桌面/手機重複 UI 導致無法取消勾選
 * @param {string} key - 'tier' | 'tags'
 * @param {'desktop'|'mobile'} source - 觸發 change 的來源
 */
function collectCustomerFilterFromUI(key, source) {
  var selected = [];
  var $inputs;

  if (key === 'tier') {
    $inputs = source === 'mobile'
      ? $('.mobile-tier-cb:checked')
      : $('#customersTable .filter-th[data-filter-key="tier"] .filter-dropdown input:checked');
  } else if (key === 'tags') {
    $inputs = source === 'mobile'
      ? $('#mobileTagsFilters .mobile-tags-cb:checked')
      : $('#customerTagsFilterDropdown input:checked');
  }

  if ($inputs) {
    $inputs.each(function () {
      var v = $(this).val();
      if (selected.indexOf(v) === -1) { selected.push(v); }
    });
  }
  customerFilterState[key] = selected;
  syncCustomerFilterCheckboxes();
}

// ==========================================================================
// initCustomers — 頁面初始化進入點
// ==========================================================================
window.initCustomers = function () {
  // 清除舊的事件綁定，防止重複導覽時事件堆疊
  // 同時清除其他模組：orders/bookings 使用全域 .sortable-th 選擇器，殘留會干擾本頁
  $(document).off('.customers');
  $(document).off('.orders');
  $(document).off('.bookings');
  $(document).off('.movement');

  // 每次進入重置篩選與排序
  customerSortStack   = [];
  customerFilterState = { tier: [], tags: [] };

  buildCustomerTagsFilterOptions();

  // 載入客戶資料並渲染列表
  $.getJSON('data/customers.json', function (customers) {
    window.customersCache = customers;
    applyCustomerFiltersAndSort();
  }).fail(function () {
    var errHtml = '<i class="fas fa-exclamation-triangle me-2"></i>載入客戶數據失敗';
    $('#customersTableBody').html(
      '<tr><td colspan="8" class="text-center py-4 text-danger">' + errHtml + '</td></tr>'
    );
    $('#customersCardList').html('<div class="alert alert-danger m-3">' + errHtml + '</div>');
  });

  // ── 排序：點擊消費總額表頭（三段式 asc → desc → 取消）──
  $(document).on('click.customers', '#customersTable .sortable-th', function () {
    var key = $(this).data('sort-key');
    var idx = customerSortStack.findIndex(function (s) { return s.key === key; });
    if (idx === -1) {
      customerSortStack.push({ key: key, dir: 'asc' });
    } else if (customerSortStack[idx].dir === 'asc') {
      customerSortStack[idx].dir = 'desc';
    } else {
      customerSortStack.splice(idx, 1);
    }
    applyCustomerFiltersAndSort();
  });

  // ── 篩選：桌面漏斗 dropdown ──
  $(document).on('click.customers', '#customersTable .filter-icon', function (e) {
    e.stopPropagation();
    var $dropdown = $(this).closest('.filter-th').find('.filter-dropdown');
    $('#customersTable .filter-dropdown').not($dropdown).addClass('d-none');
    $dropdown.toggleClass('d-none');
  });

  $(document).on('click.customers', '#customersTable .filter-dropdown', function (e) {
    e.stopPropagation();
  });

  $(document).on('change.customers', '#customersTable .filter-dropdown input[type="checkbox"]', function () {
    var key = $(this).closest('.filter-th').data('filter-key');
    collectCustomerFilterFromUI(key, 'desktop');
    applyCustomerFiltersAndSort();
  });

  // ── 篩選 / 排序：手機版 ──
  $(document).on('change.customers', '.mobile-tier-cb', function () {
    collectCustomerFilterFromUI('tier', 'mobile');
    applyCustomerFiltersAndSort();
  });

  $(document).on('change.customers', '.mobile-tags-cb', function () {
    collectCustomerFilterFromUI('tags', 'mobile');
    applyCustomerFiltersAndSort();
  });

  $(document).on('change.customers', '#mobileCustomerSort', function () {
    var val = $(this).val();
    customerSortStack = customerSortStack.filter(function (s) { return s.key !== 'totalSpent'; });
    if (val === 'asc' || val === 'desc') {
      customerSortStack.push({ key: 'totalSpent', dir: val });
    }
    applyCustomerFiltersAndSort();
  });

  // ── 清除條件：同時重置篩選 + 排序 ──
  $(document).on('click.customers', '#btnClearCustomerConditions, #btnClearCustomerConditionsMobile', function () {
    customerFilterState = { tier: [], tags: [] };
    customerSortStack   = [];
    applyCustomerFiltersAndSort();
  });

  // 點擊頁面其他地方 → 關閉桌面篩選 dropdown + 標籤編輯 dropdown
  $(document).on('click.customers', function () {
    $('#customersTable .filter-dropdown').addClass('d-none');
    $('.tags-dropdown-menu').hide();
  });

  // 展開區點擊不冒泡（避免誤觸收合）
  $(document).on('click.customers', '.customer-detail-panel', function (e) {
    e.stopPropagation();
  });

  // === Enter 鍵觸發儲存（適用 phone / email / tier / points inline input）===
  $(document).on('keydown.customers', '.phone-input, .email-input, .tier-select, .points-input', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var $wrap = $(this).closest('.phone-wrap, .email-wrap, .tier-wrap, .points-wrap');
      $wrap.find('.phone-save-btn, .email-save-btn, .tier-save-btn, .points-save-btn').trigger('click');
    }
  });

  // === 手機 inline 編輯 ===
  $(document).on('click.customers', '.phone-edit-btn', function () {
    var $wrap   = $(this).closest('.phone-wrap');
    var current = $wrap.find('.phone-display').text().trim();
    if (current === '—') { current = ''; }

    $wrap.find('.phone-display').replaceWith(
      '<input type="tel" class="form-control form-control-sm phone-input d-inline-block" ' +
      'value="' + current + '" maxlength="10" inputmode="numeric" style="width:140px">'
    );
    $(this).hide();
    $(this).siblings('.phone-save-btn, .phone-cancel-btn').show();
    $(this).siblings('.phone-cancel-btn').data('original', current);
  });

  $(document).on('click.customers', '.phone-save-btn', function () {
    var $wrap      = $(this).closest('.phone-wrap');
    var rawPhone   = $wrap.find('.phone-input').val().trim();
    var customerId = getCustomerIdFromDetail($(this));
    var cleanPhone = rawPhone.replace(/\D/g, '');

    $wrap.find('.phone-input').replaceWith(
      '<span class="phone-display">' + formatPhoneDisplay(cleanPhone) + '</span>'
    );
    $(this).hide();
    $wrap.find('.phone-cancel-btn').hide();
    $wrap.find('.phone-edit-btn').show();

    if (window.customersCache) {
      var customer = window.customersCache.find(function (c) { return c.id === customerId; });
      if (customer) { customer.phone = cleanPhone; }
    }
    syncCustomerMainRow(customerId, { phone: cleanPhone });
    window.showAdminToast('客戶 ' + customerId + ' 手機已更新');
  });

  $(document).on('click.customers', '.phone-cancel-btn', function () {
    var $wrap    = $(this).closest('.phone-wrap');
    var original = $(this).data('original') || '';
    $wrap.find('.phone-input').replaceWith(
      '<span class="phone-display">' + formatPhoneDisplay(original) + '</span>'
    );
    $(this).hide();
    $wrap.find('.phone-save-btn').hide();
    $wrap.find('.phone-edit-btn').show();
  });

  // === Email inline 編輯 ===
  $(document).on('click.customers', '.email-edit-btn', function () {
    var $wrap   = $(this).closest('.email-wrap');
    var current = $wrap.find('.email-display').text().trim();
    if (current === '—') { current = ''; }

    $wrap.find('.email-display').replaceWith(
      '<input type="email" class="form-control form-control-sm email-input d-inline-block" ' +
      'value="' + current + '" style="width:220px">'
    );
    $(this).hide();
    $(this).siblings('.email-save-btn, .email-cancel-btn').show();
    $(this).siblings('.email-cancel-btn').data('original', current);
  });

  $(document).on('click.customers', '.email-save-btn', function () {
    var $wrap      = $(this).closest('.email-wrap');
    var newEmail   = $wrap.find('.email-input').val().trim();
    var customerId = getCustomerIdFromDetail($(this));

    $wrap.find('.email-input').replaceWith(
      '<span class="email-display">' + (newEmail || '—') + '</span>'
    );
    $(this).hide();
    $wrap.find('.email-cancel-btn').hide();
    $wrap.find('.email-edit-btn').show();

    if (window.customersCache) {
      var customer = window.customersCache.find(function (c) { return c.id === customerId; });
      if (customer) { customer.email = newEmail; }
    }
    syncCustomerMainRow(customerId, { email: newEmail });
    window.showAdminToast('客戶 ' + customerId + ' Email 已更新');
  });

  $(document).on('click.customers', '.email-cancel-btn', function () {
    var $wrap    = $(this).closest('.email-wrap');
    var original = $(this).data('original') || '';
    $wrap.find('.email-input').replaceWith(
      '<span class="email-display">' + (original || '—') + '</span>'
    );
    $(this).hide();
    $wrap.find('.email-save-btn').hide();
    $wrap.find('.email-edit-btn').show();
  });

  // === 會員等級 inline 編輯 ===
  $(document).on('click.customers', '.tier-edit-btn', function () {
    var $span = $(this).siblings('.tier-display');
    var currentTier = $span.text().trim();
    $span.replaceWith(
      '<select class="form-select form-select-sm tier-select d-inline-block" style="width:auto">' +
      '<option value="一般"' + (currentTier === '一般' ? ' selected' : '') + '>一般</option>' +
      '<option value="VIP"'  + (currentTier === 'VIP'  ? ' selected' : '') + '>VIP</option>'  +
      '<option value="SVIP"' + (currentTier === 'SVIP' ? ' selected' : '') + '>SVIP</option>' +
      '</select>'
    );
    $(this).hide();
    $(this).siblings('.tier-save-btn').show();
    $(this).siblings('.tier-cancel-btn').show().data('original', currentTier);
  });

  $(document).on('click.customers', '.tier-save-btn', function () {
    var $wrap = $(this).closest('.tier-wrap');
    var newTier = $wrap.find('.tier-select').val();
    var customerId = getCustomerIdFromDetail($(this));
    $wrap.find('.tier-select').replaceWith('<span class="tier-display">' + newTier + '</span>');
    $(this).hide();
    $wrap.find('.tier-cancel-btn').hide();
    $wrap.find('.tier-edit-btn').show();

    if (window.customersCache) {
      var customer = window.customersCache.find(function (c) { return c.id === customerId; });
      if (customer) { customer.tier = newTier; }
    }
    window.showAdminToast('客戶 ' + customerId + ' 等級已更新為 ' + newTier);
    applyCustomerFiltersAndSort();
  });

  $(document).on('click.customers', '.tier-cancel-btn', function () {
    var $wrap    = $(this).closest('.tier-wrap');
    var original = $(this).data('original');
    $wrap.find('.tier-select').replaceWith('<span class="tier-display">' + original + '</span>');
    $(this).hide();
    $wrap.find('.tier-save-btn').hide();
    $wrap.find('.tier-edit-btn').show();
  });

  // === 點數 inline 編輯 ===
  $(document).on('click.customers', '.points-edit-btn', function () {
    var $span   = $(this).siblings('.points-display');
    var current = parseInt($span.text().trim(), 10) || 0;
    $span.replaceWith(
      '<input type="number" class="form-control form-control-sm points-input d-inline-block" ' +
      'value="' + current + '" min="0" style="width:90px">'
    );
    $(this).hide();
    $(this).siblings('.points-save-btn').show();
    $(this).siblings('.points-cancel-btn').show().data('original', current);
  });

  $(document).on('click.customers', '.points-save-btn', function () {
    var $wrap  = $(this).closest('.points-wrap');
    var newVal = parseInt($wrap.find('.points-input').val(), 10) || 0;
    var customerId = getCustomerIdFromDetail($(this));
    $wrap.find('.points-input').replaceWith('<span class="points-display">' + newVal + '</span>');
    $(this).hide();
    $wrap.find('.points-cancel-btn').hide();
    $wrap.find('.points-edit-btn').show();

    if (window.customersCache) {
      var customer = window.customersCache.find(function (c) { return c.id === customerId; });
      if (customer) { customer.points = newVal; }
    }
    $('.customer-detail-panel[data-customer-id="' + customerId + '"] .points-display').text(newVal);
    window.showAdminToast('客戶 ' + customerId + ' 點數已更新為 ' + newVal);
  });

  $(document).on('click.customers', '.points-cancel-btn', function () {
    var $wrap    = $(this).closest('.points-wrap');
    var original = $(this).data('original');
    $wrap.find('.points-input').replaceWith('<span class="points-display">' + original + '</span>');
    $(this).hide();
    $wrap.find('.points-save-btn').hide();
    $wrap.find('.points-edit-btn').show();
  });

  // ==========================================================================
  // Step 4 — 標籤 inline 編輯：進入 / 離開編輯模式
  // ==========================================================================

  // 點鉛筆按鈕 → 進入編輯模式
  $(document).on('click.customers', '.tags-edit-btn', function () {
    var $wrap      = $(this).closest('.tags-wrap');
    var customerId = $wrap.data('customer-id');

    // 從 customersCache 取得目前已有的標籤
    var customer   = (window.customersCache || []).find(function (c) { return c.id === customerId; });
    var currentTags = (customer && customer.tags) ? customer.tags.slice() : [];

    // 填入 checkbox 清單（依 window.tagColorMap 動態建立）
    $wrap.find('.tags-checkbox-list').html(buildTagsDropdown(currentTags));

    // 儲存原始標籤到取消按鈕的 data，供取消時還原
    $wrap.find('.tags-cancel-btn').data('original', currentTags);

    // 切換 DOM 顯示狀態
    $wrap.find('.tags-display').hide();
    $(this).hide();
    $wrap.find('.tags-editor').removeClass('d-none');
    $wrap.find('.tags-save-btn').removeClass('d-none');
    $wrap.find('.tags-cancel-btn').removeClass('d-none');
  });

  // 點下拉觸發按鈕 → 切換（toggle）下拉選單
  $(document).on('click.customers', '.tags-dropdown-toggle', function (e) {
    e.stopPropagation(); // 阻止冒泡，避免觸發下方的「外部點擊關閉」
    var $menu = $(this).closest('.tags-editor').find('.tags-dropdown-menu');
    $menu.toggle();
  });

  // 點擊選單內部 → 阻止冒泡，讓選單保持開啟
  $(document).on('click.customers', '.tags-dropdown-menu', function (e) {
    e.stopPropagation();
  });

  // 點擊頁面任意其他地方 → 收起所有標籤編輯下拉選單（篩選 dropdown 由上方統一處理）
  $(document).on('click.customers', '.tags-editor', function (e) {
    e.stopPropagation();
  });

  // 點取消按鈕 → 還原原始標籤，離開編輯模式
  $(document).on('click.customers', '.tags-cancel-btn', function () {
    var $wrap    = $(this).closest('.tags-wrap');
    var original = $(this).data('original') || [];
    var tagsHtml = (original.length > 0)
      ? original.map(getTagBadge).join('')
      : '<span class="text-muted small">無標籤</span>';

    $wrap.find('.tags-display').html(tagsHtml).show();
    $wrap.find('.tags-dropdown-menu').hide();
    $wrap.find('.tags-editor').addClass('d-none');
    $(this).addClass('d-none');
    $wrap.find('.tags-save-btn').addClass('d-none');
    $wrap.find('.tags-edit-btn').show();
  });

  // ==========================================================================
  // Step 5 — 標籤儲存
  // ==========================================================================
  $(document).on('click.customers', '.tags-save-btn', function () {
    var $wrap      = $(this).closest('.tags-wrap');
    var customerId = $wrap.data('customer-id');

    // 收集目前勾選的標籤
    var newTags = [];
    $wrap.find('.tag-checkbox:checked').each(function () {
      newTags.push($(this).val());
    });

    // 更新記憶體快取（window.customersCache）
    if (window.customersCache) {
      var customer = window.customersCache.find(function (c) { return c.id === customerId; });
      if (customer) { customer.tags = newTags; }
    }

    // 更新表格列的靜態標籤顯示
    var newTagsHtml = (newTags.length > 0)
      ? newTags.map(getTagBadge).join('')
      : '<span class="text-muted small">無標籤</span>';
    $wrap.find('.tags-display').html(newTagsHtml).show();

    // 同步主列標籤（桌面 grid + 手機卡片）
    syncCustomerMainRow(customerId, { tagsHtml: newTagsHtml });

    // 離開編輯模式
    $wrap.find('.tags-dropdown-menu').hide();
    $wrap.find('.tags-editor').addClass('d-none');
    $(this).addClass('d-none');
    $wrap.find('.tags-cancel-btn').addClass('d-none');
    $wrap.find('.tags-edit-btn').show();

    // TODO: PATCH /api/customers/:id/tags  { tags: newTags }
    window.showAdminToast('客戶 ' + customerId + ' 標籤已更新');
    applyCustomerFiltersAndSort();
  });

  // ==========================================================================
  // Step 6 — 新增標籤到標籤庫
  // ==========================================================================
  $(document).on('click.customers', '.tag-add-btn', function (e) {
    e.stopPropagation(); // 阻止冒泡，避免觸發外部點擊關閉
    var $wrap    = $(this).closest('.tags-wrap');
    var rawName  = $wrap.find('.new-tag-input').val().trim();
    var newColor = $wrap.find('.new-tag-color').val();

    // 過濾可能造成 XSS 的特殊字元
    var newName = rawName.replace(/[<>"&]/g, '');

    if (!newName) {
      window.showAdminToast('標籤名稱不能為空');
      return;
    }
    if (Object.prototype.hasOwnProperty.call(window.tagColorMap, newName)) {
      window.showAdminToast('標籤「' + newName + '」已存在');
      return;
    }

    // 新增到全域標籤池
    window.tagColorMap[newName] = newColor;

    // 保留目前已勾選的狀態，重建 checkbox 清單
    var checkedTags = [];
    $wrap.find('.tag-checkbox:checked').each(function () {
      checkedTags.push($(this).val());
    });
    $wrap.find('.tags-checkbox-list').html(buildTagsDropdown(checkedTags));

    // 清空輸入欄位
    $wrap.find('.new-tag-input').val('');

    buildCustomerTagsFilterOptions();

    // TODO: PUT /api/tag-pool  { tagColorMap: window.tagColorMap }
    window.showAdminToast('標籤「' + newName + '」已新增');
  });

  // ==========================================================================
  // Step 7 — 從標籤庫刪除標籤（同步移除所有客戶身上的此標籤）
  // ==========================================================================
  $(document).on('click.customers', '.tag-delete-btn', function (e) {
    e.stopPropagation(); // 阻止冒泡，避免觸發外部點擊關閉
    var tagName = $(this).data('tag');

    if (!window.confirm('確定要刪除標籤「' + tagName + '」嗎？\n這將移除所有客戶身上的此標籤。')) {
      return;
    }

    // 從全域標籤池刪除
    delete window.tagColorMap[tagName];

    // 從所有客戶的 tags 陣列移除
    if (window.customersCache) {
      window.customersCache.forEach(function (c) {
        if (c.tags) {
          c.tags = c.tags.filter(function (t) { return t !== tagName; });
        }
      });
    }

    // 從篩選條件移除已刪除的標籤
    customerFilterState.tags = customerFilterState.tags.filter(function (t) {
      return t !== tagName;
    });

    buildCustomerTagsFilterOptions();

    // 保留其他已勾選狀態（排除剛刪掉的），重建 checkbox 清單
    var $wrap = $(this).closest('.tags-wrap');
    var checkedTags = [];
    $wrap.find('.tag-checkbox:checked').each(function () {
      var v = $(this).val();
      if (v !== tagName) { checkedTags.push(v); }
    });
    $wrap.find('.tags-checkbox-list').html(buildTagsDropdown(checkedTags));

    applyCustomerFiltersAndSort();

    // TODO: PUT /api/tag-pool  { tagColorMap: window.tagColorMap }
    window.showAdminToast('標籤「' + tagName + '」已刪除');
  });

  // === 購買記錄：點擊訂單 ID 開啟訂單明細 Modal ===
  // 若 ordersCache 已存在（曾進過訂單管理頁）就直接用；否則先 fetch orders.json
  $(document).on('click.customers', '.customer-order-link', function () {
    var orderId = $(this).data('order-id');

    function openModal(orders) {
      var order = orders.find(function (o) { return o.id === orderId; });
      if (!order) {
        window.showAdminToast('找不到訂單 ' + orderId + ' 的資料');
        return;
      }
      window.showOrderModal(order);
    }

    if (window.ordersCache && window.ordersCache.length > 0) {
      openModal(window.ordersCache);
    } else {
      $.getJSON('data/orders.json', function (orders) {
        window.ordersCache = orders; // 存入全域快取，後續不需重複 fetch
        openModal(orders);
      }).fail(function () {
        window.showAdminToast('載入訂單資料失敗，請稍後再試');
      });
    }
  });

};

// ==========================================================================
// 展開區 HTML 建構 helper
// ==========================================================================

var EDIT_BTN_ICON = '<i class="fas fa-pencil-alt text-secondary"></i>';

function buildSaveCancelBtns(saveClass, cancelClass) {
  return (
    '<button class="btn btn-sm btn-success ' + saveClass + ' d-none py-0 px-1">' +
      '<i class="fas fa-check"></i>' +
    '</button>' +
    '<button class="btn btn-sm btn-secondary ' + cancelClass + ' d-none py-0 px-1">' +
      '<i class="fas fa-times"></i>' +
    '</button>'
  );
}

/**
 * 產生標籤列 HTML（展開區可 inline 編輯）
 */
function buildTagsRowHtml(customerId, tagsHtml) {
  return (
    '<tr>' +
      '<th class="text-muted">標籤</th>' +
      '<td>' +
        '<div class="tags-wrap d-flex align-items-center gap-2 flex-wrap" ' +
             'data-customer-id="' + customerId + '">' +
          '<span class="tags-display">' + tagsHtml + '</span>' +
          '<button type="button" class="btn btn-link btn-sm p-0 ms-1 tags-edit-btn" title="編輯標籤">' +
            EDIT_BTN_ICON +
          '</button>' +
          '<div class="tags-editor d-none">' +
            '<div class="position-relative d-inline-block">' +
              '<button type="button" class="btn btn-outline-secondary btn-sm tags-dropdown-toggle">' +
                '選擇標籤 <i class="fas fa-chevron-down ms-1"></i>' +
              '</button>' +
              '<div class="tags-dropdown-menu position-absolute bg-white border rounded shadow-sm p-2" ' +
                   'style="min-width:240px; z-index:1050; top:calc(100% + 4px); left:0; display:none;">' +
                '<div class="tags-checkbox-list"></div>' +
                '<hr class="my-2">' +
                '<div class="d-flex gap-1 align-items-center">' +
                  '<input type="text" class="form-control form-control-sm new-tag-input" ' +
                         'placeholder="新標籤名稱" style="flex:1; min-width:80px">' +
                  '<select class="form-select form-select-sm new-tag-color" style="width:80px">' +
                    '<option value="bg-warning text-dark">🟡 黃</option>' +
                    '<option value="bg-success">🟢 綠</option>' +
                    '<option value="bg-danger">🔴 紅</option>' +
                    '<option value="bg-info text-dark">🔵 藍</option>' +
                    '<option value="bg-primary">🟣 靛</option>' +
                    '<option value="bg-secondary" selected>⚫ 灰</option>' +
                    '<option value="bg-dark">⬛ 深</option>' +
                  '</select>' +
                  '<button type="button" class="btn btn-sm btn-success tag-add-btn" title="新增標籤">' +
                    '<i class="fas fa-plus"></i>' +
                  '</button>' +
                '</div>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<button type="button" class="btn btn-sm btn-success tags-save-btn d-none py-0 px-1" title="儲存標籤">' +
            '<i class="fas fa-check"></i>' +
          '</button>' +
          '<button type="button" class="btn btn-sm btn-secondary tags-cancel-btn d-none py-0 px-1" title="取消編輯">' +
            '<i class="fas fa-times"></i>' +
          '</button>' +
        '</div>' +
      '</td>' +
    '</tr>'
  );
}

/**
 * 產生展開區完整 HTML（手機/Email/等級/點數/標籤/購買紀錄）
 */
function buildDetailPanelHtml(c, phoneDisplay, emailDisplay, tierDisplay, tagsHtml, ordersHtml) {
  var saveCancel = buildSaveCancelBtns;
  return (
    '<div class="customer-detail-panel" data-customer-id="' + c.id + '">' +
      '<table class="table table-sm mb-3 customer-detail-table"><tbody>' +
        '<tr>' +
          '<th class="text-muted" style="width:100px">手機號碼</th>' +
          '<td>' +
            '<div class="phone-wrap d-flex align-items-center gap-1">' +
              '<span class="phone-display">' + phoneDisplay + '</span>' +
              '<button class="btn btn-link btn-sm p-0 phone-edit-btn" title="編輯手機">' + EDIT_BTN_ICON + '</button>' +
              saveCancel('phone-save-btn', 'phone-cancel-btn') +
            '</div>' +
          '</td>' +
        '</tr>' +
        '<tr>' +
          '<th class="text-muted">電子信箱</th>' +
          '<td>' +
            '<div class="email-wrap d-flex align-items-center gap-1">' +
              '<span class="email-display">' + emailDisplay + '</span>' +
              '<button class="btn btn-link btn-sm p-0 email-edit-btn" title="編輯 Email">' + EDIT_BTN_ICON + '</button>' +
              saveCancel('email-save-btn', 'email-cancel-btn') +
            '</div>' +
          '</td>' +
        '</tr>' +
        '<tr>' +
          '<th class="text-muted">會員等級</th>' +
          '<td>' +
            '<div class="tier-wrap d-flex align-items-center gap-1">' +
              '<span class="tier-display">' + tierDisplay + '</span>' +
              '<button class="btn btn-link btn-sm p-0 tier-edit-btn">' + EDIT_BTN_ICON + '</button>' +
              saveCancel('tier-save-btn', 'tier-cancel-btn') +
            '</div>' +
          '</td>' +
        '</tr>' +
        '<tr>' +
          '<th class="text-muted">點數</th>' +
          '<td>' +
            '<div class="points-wrap d-flex align-items-center gap-1">' +
              '<span class="points-display">' + (c.points || 0) + '</span>' +
              '<button class="btn btn-link btn-sm p-0 points-edit-btn">' + EDIT_BTN_ICON + '</button>' +
              saveCancel('points-save-btn', 'points-cancel-btn') +
            '</div>' +
          '</td>' +
        '</tr>' +
        buildTagsRowHtml(c.id, tagsHtml) +
      '</tbody></table>' +
      '<p class="mb-1 fw-semibold small text-muted">購買記錄</p>' +
      '<ul class="list-group list-group-flush mb-0">' + ordersHtml + '</ul>' +
    '</div>'
  );
}

/**
 * 綁定表格 collapse 展開/收合樣式
 */
function bindCustomerCollapseEvents() {
  $('#customersTableBody').off('show.bs.collapse hide.bs.collapse');

  $('#customersTableBody').on('show.bs.collapse', '.collapse', function () {
    var $target = $(this);
    // 收合其他已展開列
    $('#customersTableBody .collapse.show').not($target).each(function () {
      bootstrap.Collapse.getOrCreateInstance(this, { toggle: false }).hide();
    });
    var customerId = this.id.replace('collapse-', '');
    $('.customer-summary-row').removeClass('is-expanded');
    $('.customer-summary-row[data-customer-id="' + customerId + '"]').addClass('is-expanded');
  });

  $('#customersTableBody').on('hide.bs.collapse', '.collapse', function () {
    var customerId = this.id.replace('collapse-', '');
    $('.customer-summary-row[data-customer-id="' + customerId + '"]').removeClass('is-expanded');
  });

  $('#customersCardList').off('show.bs.collapse hide.bs.collapse');

  $('#customersCardList').on('show.bs.collapse', '.collapse', function () {
    var $target = $(this);
    $('#customersCardList .collapse.show').not($target).each(function () {
      bootstrap.Collapse.getOrCreateInstance(this, { toggle: false }).hide();
    });
    var customerId = this.id.replace('collapse-mobile-', '');
    $('.customer-mobile-card').removeClass('is-expanded');
    $('.customer-mobile-card[data-customer-id="' + customerId + '"]').addClass('is-expanded');
  });

  $('#customersCardList').on('hide.bs.collapse', '.collapse', function () {
    var customerId = this.id.replace('collapse-mobile-', '');
    $('.customer-mobile-card[data-customer-id="' + customerId + '"]').removeClass('is-expanded');
  });
}

/**
 * 從預約管理跳轉時自動展開目標客戶
 */
function handlePendingCustomerId() {
  if (!window.pendingCustomerId) { return; }
  var targetId = window.pendingCustomerId;
  window.pendingCustomerId = null;

  var $desktopCollapse = $('#collapse-' + targetId);
  if ($desktopCollapse.length) {
    bootstrap.Collapse.getOrCreateInstance($desktopCollapse[0], { toggle: false }).show();
    setTimeout(function () {
      var $row = $('.customer-summary-row[data-customer-id="' + targetId + '"]');
      if ($row.length) {
        $row[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
    return;
  }

  var $mobileCollapse = $('#collapse-mobile-' + targetId);
  if ($mobileCollapse.length) {
    bootstrap.Collapse.getOrCreateInstance($mobileCollapse[0], { toggle: false }).show();
    setTimeout(function () {
      var $card = $('.customer-mobile-card[data-customer-id="' + targetId + '"]');
      if ($card.length) {
        $card[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 300);
  }
}

// ==========================================================================
// renderCustomersList — 渲染客戶列表（桌面 table + 手機卡片）
// ==========================================================================
/**
 * 渲染客戶管理頁面
 * @param {Array} customers - customers.json 的資料陣列
 */
function renderCustomersList(customers) {
  if (!customers || customers.length === 0) {
    var hasCache = window.customersCache && window.customersCache.length > 0;
    var emptyMsg = hasCache
      ? '<i class="fas fa-inbox me-2"></i>沒有符合條件的會員'
      : '目前沒有客戶資料';
    $('#customersTableBody').html(
      '<tr><td colspan="8" class="text-center text-muted py-4">' + emptyMsg + '</td></tr>'
    );
    $('#customersCardList').html(
      '<div class="text-center text-muted py-4">' + emptyMsg + '</div>'
    );
    return;
  }

  var tableHtml = '';
  var cardHtml  = '';

  customers.forEach(function (c) {
    var collapseId       = 'collapse-' + c.id;
    var mobileCollapseId = 'collapse-mobile-' + c.id;
    var phoneDisplay     = formatPhoneDisplay(c.phone);
    var tierDisplay      = c.tier || '一般';
    var spentDisplay     = 'NT$ ' + c.totalSpent.toLocaleString();
    var emailDisplay     = c.email || '—';
    var registeredDisplay = formatRegisteredDate(c.registeredAt);
    var tagsHtml         = (c.tags && c.tags.length > 0)
      ? c.tags.map(getTagBadge).join('')
      : '<span class="text-muted small">無標籤</span>';

    var ordersHtml = (c.orders && c.orders.length > 0)
      ? c.orders.map(function (orderId) {
          return '<li class="list-group-item list-group-item-action py-1 small">' +
            '<i class="fas fa-receipt me-2 text-muted"></i>' +
            '<span class="customer-order-link text-primary fw-semibold" ' +
            'data-order-id="' + orderId + '" ' +
            'style="cursor:pointer; text-decoration:underline dotted;" ' +
            'title="點擊查看訂單明細">' + orderId + '</span></li>';
        }).join('')
      : '<li class="list-group-item text-muted small">無購買記錄</li>';

    var detailHtml = buildDetailPanelHtml(c, phoneDisplay, emailDisplay, tierDisplay, tagsHtml, ordersHtml);

    // 桌面：摘要列 + 展開列
    tableHtml +=
      '<tr class="customer-summary-row" data-customer-id="' + c.id + '"' +
          ' data-bs-toggle="collapse" data-bs-target="#' + collapseId + '"' +
          ' aria-expanded="false" role="button">' +
        '<td class="cell-name">' + c.name + '</td>' +
        '<td class="cell-phone">' + phoneDisplay + '</td>' +
        '<td class="cell-email">' + emailDisplay + '</td>' +
        '<td class="cell-registered">' + registeredDisplay + '</td>' +
        '<td class="cell-tier">' + tierDisplay + '</td>' +
        '<td class="cell-spent text-end fw-bold text-success">' + spentDisplay + '</td>' +
        '<td class="cell-tags">' + tagsHtml + '</td>' +
        '<td class="cell-expand text-center text-muted">' +
          '<i class="fas fa-chevron-down customer-row-chevron" aria-hidden="true"></i>' +
        '</td>' +
      '</tr>' +
      '<tr class="customer-detail-row">' +
        '<td colspan="8" class="p-0">' +
          '<div id="' + collapseId + '" class="collapse">' + detailHtml + '</div>' +
        '</td>' +
      '</tr>';

    // 手機：卡片 + 展開詳情
    cardHtml +=
      '<div class="customer-mobile-card" data-customer-id="' + c.id + '"' +
           ' data-bs-toggle="collapse" data-bs-target="#' + mobileCollapseId + '"' +
           ' aria-expanded="false" role="button">' +
        '<div class="d-flex align-items-start gap-2">' +
          '<div class="mobile-card-grid flex-grow-1">' +
          '<div class="card-field card-field-name">' +
            '<div class="card-label">客戶姓名</div>' +
            '<div class="card-value fw-semibold">' + c.name + '</div>' +
          '</div>' +
          '<div class="card-field card-field-phone">' +
            '<div class="card-label">手機號碼</div>' +
            '<div class="card-value">' + phoneDisplay + '</div>' +
          '</div>' +
          '<div class="card-field card-field-email">' +
            '<div class="card-label">電子信箱</div>' +
            '<div class="card-value text-muted">' + emailDisplay + '</div>' +
          '</div>' +
          '<div class="card-field card-field-registered">' +
            '<div class="card-label">註冊日期</div>' +
            '<div class="card-value">' + registeredDisplay + '</div>' +
          '</div>' +
          '<div class="card-field card-field-tier">' +
            '<div class="card-label">會員等級</div>' +
            '<div class="card-value">' + tierDisplay + '</div>' +
          '</div>' +
          '<div class="card-field card-field-spent">' +
            '<div class="card-label">消費總額</div>' +
            '<div class="card-value fw-bold text-success">' + spentDisplay + '</div>' +
          '</div>' +
          '<div class="card-field card-field-tags">' +
            '<div class="card-label">標籤</div>' +
            '<div class="card-value">' + tagsHtml + '</div>' +
          '</div>' +
          '</div>' +
          '<i class="fas fa-chevron-down customer-row-chevron mt-1 flex-shrink-0" aria-hidden="true"></i>' +
        '</div>' +
      '</div>' +
      '<div id="' + mobileCollapseId + '" class="collapse customer-mobile-detail">' +
        detailHtml +
      '</div>';
  });

  $('#customersTableBody').html(tableHtml);
  $('#customersCardList').html(cardHtml);

  bindCustomerCollapseEvents();
  handlePendingCustomerId();

  if (typeof window.applyEditPermission === 'function') {
    window.applyEditPermission('customers', $('#contentArea'));
  }
}

/** @deprecated 保留舊函式名稱相容 */
function renderCustomersAccordion(customers) {
  renderCustomersList(customers);
}
