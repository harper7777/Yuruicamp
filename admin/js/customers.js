/**
 * admin/js/customers.js
 * 客戶管理模組
 * 使用 jQuery Event Namespace (.customers) 防止重複導覽時事件堆疊
 *
 * tagColorMap 的鍵值必須與 customers.json 的 tags 陣列完全一致（含中文）
 * inline editing 支援：按鈕儲存 + Enter 鍵儲存
 */

var tagColorMap = {
  'VIP':      'bg-warning text-dark',
  'SVIP':     'bg-danger',
  '高消費':   'bg-success',
  '新會員':   'bg-info text-dark',
  '高退貨率': 'bg-danger',
};

function getTagBadge(tag) {
  var cls = tagColorMap[tag] || 'bg-secondary';
  return '<span class="badge ' + cls + ' me-1">' + tag + '</span>';
}

window.initCustomers = function () {
  $(document).off('.customers');

  $.getJSON('data/customers.json', function (customers) {
    window.customersCache = customers; // 供 bookings.js 查詢顧客姓名/電話/Email
    renderCustomersAccordion(customers);
  }).fail(function () {
    $('#customersAccordion').html(
      '<div class="alert alert-danger">' +
      '<i class="fas fa-exclamation-triangle me-2"></i>載入客戶數據失敗' +
      '</div>'
    );
  });

  // === Enter 鍵觸發儲存（適用所有 inline input）===
  $(document).on('keydown.customers', '.tier-select, .points-input, .coupons-input', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var $wrap = $(this).closest('.tier-wrap, .points-wrap, .coupons-wrap');
      $wrap.find('.tier-save-btn, .points-save-btn, .coupons-save-btn').trigger('click');
    }
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
    var customerId = $(this).closest('tr').data('customer-id');
    $wrap.find('.tier-select').replaceWith('<span class="tier-display">' + newTier + '</span>');
    $(this).hide();
    $wrap.find('.tier-cancel-btn').hide();
    $wrap.find('.tier-edit-btn').show();
    window.showAdminToast('客戶 ' + customerId + ' 等級已更新為 ' + newTier);
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
    var customerId = $(this).closest('tr').data('customer-id');
    $wrap.find('.points-input').replaceWith('<span class="points-display">' + newVal + '</span>');
    $(this).hide();
    $wrap.find('.points-cancel-btn').hide();
    $wrap.find('.points-edit-btn').show();
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

  // === 優惠券數量 inline 編輯 ===
  $(document).on('click.customers', '.coupons-edit-btn', function () {
    var $span   = $(this).siblings('.coupons-display');
    var current = parseInt($span.text().trim(), 10) || 0;
    $span.replaceWith(
      '<input type="number" class="form-control form-control-sm coupons-input d-inline-block" ' +
      'value="' + current + '" min="0" style="width:75px">'
    );
    $(this).hide();
    $(this).siblings('.coupons-save-btn').show();
    $(this).siblings('.coupons-cancel-btn').show().data('original', current);
  });

  $(document).on('click.customers', '.coupons-save-btn', function () {
    var $wrap  = $(this).closest('.coupons-wrap');
    var newVal = parseInt($wrap.find('.coupons-input').val(), 10) || 0;
    var customerId = $(this).closest('tr').data('customer-id');
    $wrap.find('.coupons-input').replaceWith('<span class="coupons-display">' + newVal + '</span>');
    $(this).hide();
    $wrap.find('.coupons-cancel-btn').hide();
    $wrap.find('.coupons-edit-btn').show();
    window.showAdminToast('客戶 ' + customerId + ' 優惠券已更新為 ' + newVal + ' 張');
  });

  $(document).on('click.customers', '.coupons-cancel-btn', function () {
    var $wrap    = $(this).closest('.coupons-wrap');
    var original = $(this).data('original');
    $wrap.find('.coupons-input').replaceWith('<span class="coupons-display">' + original + '</span>');
    $(this).hide();
    $wrap.find('.coupons-save-btn').hide();
    $wrap.find('.coupons-edit-btn').show();
  });
};

/**
 * 渲染客戶管理頁面的 Accordion
 * @param {Array} customers - customers.json 的資料陣列
 */
function renderCustomersAccordion(customers) {
  if (!customers || customers.length === 0) {
    $('#customersAccordion').html('<div class="text-center text-muted py-4">目前沒有客戶資料</div>');
    return;
  }

  var html = customers.map(function (c, idx) {
    var tagsHtml = (c.tags && c.tags.length > 0)
      ? c.tags.map(getTagBadge).join('')
      : '<span class="text-muted small">無標籤</span>';

    var ordersHtml = (c.orders && c.orders.length > 0)
      ? c.orders.map(function (orderId) {
          return '<li class="list-group-item list-group-item-action py-1 small">' +
            '<i class="fas fa-receipt me-2 text-muted"></i>' + orderId + '</li>';
        }).join('')
      : '<li class="list-group-item text-muted small">無購買記錄</li>';

    var collapseId = 'collapse-' + c.id;
    var headingId  = 'heading-' + c.id;
    var isFirst    = idx === 0;
    var avatarSrc  = c.avatar || 'https://placehold.co/40x40/cccccc/555555?text=U';

    return '<div class="accordion-item">' +
      '<h2 class="accordion-header" id="' + headingId + '">' +
      '<button class="accordion-button' + (isFirst ? '' : ' collapsed') + '"' +
      ' type="button" data-bs-toggle="collapse"' +
      ' data-bs-target="#' + collapseId + '"' +
      ' aria-expanded="' + (isFirst ? 'true' : 'false') + '"' +
      ' aria-controls="' + collapseId + '">' +
      '<img src="' + avatarSrc + '" width="40" height="40"' +
      ' class="rounded-circle me-3 border object-fit-cover"' +
      ' onerror="this.src=\'https://placehold.co/40x40/cccccc/555555?text=U\'">' +
      '<div class="flex-grow-1">' +
      '<div class="fw-semibold">' + c.name + '</div>' +
      '<div class="small text-muted">' + c.email + '</div>' +
      '</div>' +
      '<div class="me-3 d-none d-md-block">' + tagsHtml + '</div>' +
      '<div class="text-end me-3">' +
      '<div class="fw-bold text-success">NT$ ' + c.totalSpent.toLocaleString() + '</div>' +
      '<div class="small text-muted">累計消費</div>' +
      '</div>' +
      '</button></h2>' +
      '<div id="' + collapseId + '"' +
      ' class="accordion-collapse collapse' + (isFirst ? ' show' : '') + '"' +
      ' aria-labelledby="' + headingId + '">' +
      '<div class="accordion-body pt-0">' +
      '<table class="table table-sm mb-3"><tbody>' +
      '<tr data-customer-id="' + c.id + '">' +
      '<th class="text-muted" style="width:100px">會員等級</th>' +
      '<td><div class="tier-wrap d-flex align-items-center gap-1">' +
      '<span class="tier-display">' + (c.tier || '一般') + '</span>' +
      '<button class="btn btn-link btn-sm p-0 tier-edit-btn"><i class="fas fa-pencil-alt text-secondary"></i></button>' +
      '<button class="btn btn-sm btn-success tier-save-btn d-none py-0 px-1"><i class="fas fa-check"></i></button>' +
      '<button class="btn btn-sm btn-secondary tier-cancel-btn d-none py-0 px-1"><i class="fas fa-times"></i></button>' +
      '</div></td>' +
      '<th class="text-muted" style="width:60px">點數</th>' +
      '<td><div class="points-wrap d-flex align-items-center gap-1">' +
      '<span class="points-display">' + (c.points || 0) + '</span>' +
      '<button class="btn btn-link btn-sm p-0 points-edit-btn"><i class="fas fa-pencil-alt text-secondary"></i></button>' +
      '<button class="btn btn-sm btn-success points-save-btn d-none py-0 px-1"><i class="fas fa-check"></i></button>' +
      '<button class="btn btn-sm btn-secondary points-cancel-btn d-none py-0 px-1"><i class="fas fa-times"></i></button>' +
      '</div></td>' +
      '<th class="text-muted" style="width:70px">優惠券</th>' +
      '<td><div class="coupons-wrap d-flex align-items-center gap-1">' +
      '<span class="coupons-display">' + (c.coupons || 0) + '</span>' +
      '<button class="btn btn-link btn-sm p-0 coupons-edit-btn"><i class="fas fa-pencil-alt text-secondary"></i></button>' +
      '<button class="btn btn-sm btn-success coupons-save-btn d-none py-0 px-1"><i class="fas fa-check"></i></button>' +
      '<button class="btn btn-sm btn-secondary coupons-cancel-btn d-none py-0 px-1"><i class="fas fa-times"></i></button>' +
      '</div></td>' +
      '</tr>' +
      '<tr><th class="text-muted">聯絡電話</th><td colspan="5">' + (c.phone || '—') + '</td></tr>' +
      '<tr><th class="text-muted">標籤</th><td colspan="5">' + tagsHtml + '</td></tr>' +
      '</tbody></table>' +
      '<p class="mb-1 fw-semibold small text-muted">購買記錄</p>' +
      '<ul class="list-group list-group-flush mb-0">' + ordersHtml + '</ul>' +
      '</div></div></div>';
  }).join('');

  $('#customersAccordion').html(html);

  // 若從預約管理的顧客連結跳轉過來，自動展開目標顧客的 Accordion 並滾動至該位置
  // window.pendingCustomerId 由 bookings.js 的顧客連結點擊事件設定
  if (window.pendingCustomerId) {
    var targetId = window.pendingCustomerId;
    window.pendingCustomerId = null; // 用完即清，防止下次進入客戶管理時重複觸發

    var $target = $('#collapse-' + targetId);
    if ($target.length) {
      // 先把第一個預設展開的 Accordion 收起來（若目標不是第一筆）
      var $firstCollapse = $('#customersAccordion .accordion-collapse.show').not($target);
      if ($firstCollapse.length) {
        new bootstrap.Collapse($firstCollapse[0], { toggle: false }).hide();
        $firstCollapse.siblings('.accordion-header')
                      .find('.accordion-button')
                      .addClass('collapsed');
      }
      // 展開目標顧客
      new bootstrap.Collapse($target[0], { toggle: false }).show();
      $target.siblings('.accordion-header')
             .find('.accordion-button')
             .removeClass('collapsed');
      // 300ms 後滾動至目標位置（等待展開動畫結束）
      setTimeout(function () {
        $target[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }
}