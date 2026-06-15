/**
 * admin/js/movement.js
 * 庫存異動紀錄模組
 * 從 admin/data/movement.json 載入主檔，點擊異動 ID 後顯示明細清單。
 */

window.generatedMovementRecords = window.generatedMovementRecords || [];
window.movementBaseLoaded = false;

window.initMovement = function () {
  $(document).off('.movement');

  if (window.movementBaseLoaded) {
    renderMovementTable(window.movementCache || []);
  } else {
    $.getJSON('data/movement.json', function (records) {
      window.movementCache = mergeMovementRecords(
        window.generatedMovementRecords,
        (records || []).map(normalizeMovementRecord)
      );
      window.movementBaseLoaded = true;
      renderMovementTable(window.movementCache);
    }).fail(function () {
      $('#movementTableBody').html(
        '<tr><td colspan="4" class="text-center text-danger py-4">' +
        '<i class="fas fa-exclamation-triangle me-2"></i>載入庫存異動紀錄失敗' +
        '</td></tr>'
      );
    });
  }

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
    renderMovementTable(window.movementCache || window.generatedMovementRecords);
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
      toStore: record && record.toStore
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
        toStore: (item && item.toStore) || '—'
      };
    })
  };
}

function renderMovementTable(records) {
  if (!records || records.length === 0) {
    $('#movementTableBody').html(
      '<tr><td colspan="4" class="text-center text-muted py-4">目前沒有庫存異動紀錄</td></tr>'
    );
    return;
  }

  var html = records.map(function (record) {
    var itemCount = (record.items || []).length;

    return '<tr data-movement-id="' + escapeMovementHtml(record.id) + '">' +
      '<td>' +
      '<button type="button" class="btn btn-link p-0 fw-semibold movement-detail-link" ' +
      'data-movement-id="' + escapeMovementHtml(record.id) + '">' +
      escapeMovementHtml(record.id) +
      '</button>' +
      '</td>' +
      '<td>' + escapeMovementHtml(record.date) + '</td>' +
      '<td>' + escapeMovementHtml(record.employeeId || '—') + '</td>' +
      '<td>' + itemCount + ' 筆</td>' +
      '</tr>';
  }).join('');

  $('#movementTableBody').html(html);
}

function showMovementDetailModal(record) {
  $('#modalMovementId').text(record.id);
  $('#modalMovementDate').text(record.date);
  $('#modalMovementEmployeeId').text(record.employeeId || '—');

  var itemsHtml = (record.items || []).map(function (item) {
    return '<tr>' +
      '<td>' + escapeMovementHtml(item.productName) + '</td>' +
      '<td class="text-center fw-semibold">' + escapeMovementHtml(item.quantity) + '</td>' +
      '<td>' + escapeMovementHtml(item.fromStore) + '</td>' +
      '<td>' + escapeMovementHtml(item.toStore) + '</td>' +
      '</tr>';
  }).join('');

  $('#modalMovementItems').html(
    itemsHtml || '<tr><td colspan="4" class="text-center text-muted">沒有異動明細</td></tr>'
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
