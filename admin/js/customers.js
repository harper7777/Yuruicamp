/**
 * admin/js/customers.js
 * 客戶管理模組
 * 使用 jQuery Event Namespace (.customers) 防止重複導覽時事件堆疊
 *
 * window.tagColorMap 的鍵值必須與 customers.json 的 tags 陣列完全一致（含中文）
 * inline editing 支援：
 *   - tier（會員等級）、points（點數）：按鈕儲存 + Enter 鍵儲存
 *   - tags（標籤）：下拉 checkbox 多選 + 新增 / 刪除標籤
 */

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
  if (!window.customersCache) { return; }
  window.customersCache.forEach(function (c) {
    var newTagsHtml = (c.tags && c.tags.length > 0)
      ? c.tags.map(getTagBadge).join('')
      : '<span class="text-muted small">無標籤</span>';

    // 更新表格列的標籤靜態顯示區
    $('.tags-wrap[data-customer-id="' + c.id + '"] .tags-display').html(newTagsHtml);

    // 更新 Accordion header 的標籤顯示（class="customer-header-tags"）
    $('#collapse-' + c.id)
      .siblings('.accordion-header')
      .find('.customer-header-tags')
      .html(newTagsHtml);
  });
}

// ==========================================================================
// initCustomers — 頁面初始化進入點
// ==========================================================================
window.initCustomers = function () {
  // 清除舊的事件綁定，防止重複導覽時事件堆疊
  $(document).off('.customers');

  // 載入客戶資料並渲染 Accordion
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

  // === Enter 鍵觸發儲存（適用 tier / points inline input）===
  $(document).on('keydown.customers', '.tier-select, .points-input', function (e) {
    if (e.key === 'Enter') {
      e.preventDefault();
      var $wrap = $(this).closest('.tier-wrap, .points-wrap');
      $wrap.find('.tier-save-btn, .points-save-btn').trigger('click');
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

  // 點擊頁面任意其他地方 → 收起所有標籤下拉選單
  $(document).on('click.customers', function () {
    $('.tags-dropdown-menu').hide();
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

    // 同步更新 Accordion header 的標籤顯示
    $('#collapse-' + customerId)
      .siblings('.accordion-header')
      .find('.customer-header-tags')
      .html(newTagsHtml);

    // 離開編輯模式
    $wrap.find('.tags-dropdown-menu').hide();
    $wrap.find('.tags-editor').addClass('d-none');
    $(this).addClass('d-none');
    $wrap.find('.tags-cancel-btn').addClass('d-none');
    $wrap.find('.tags-edit-btn').show();

    // TODO: PATCH /api/customers/:id/tags  { tags: newTags }
    window.showAdminToast('客戶 ' + customerId + ' 標籤已更新');
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

    // 更新畫面上所有客戶的標籤顯示（Step 8 函式）
    refreshAllCustomerTagsDisplay();

    // 保留其他已勾選狀態（排除剛刪掉的），重建 checkbox 清單
    var $wrap = $(this).closest('.tags-wrap');
    var checkedTags = [];
    $wrap.find('.tag-checkbox:checked').each(function () {
      var v = $(this).val();
      if (v !== tagName) { checkedTags.push(v); }
    });
    $wrap.find('.tags-checkbox-list').html(buildTagsDropdown(checkedTags));

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
// renderCustomersAccordion — 渲染客戶列表 Accordion
// ==========================================================================
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
    // 靜態顯示用的 badges HTML（Accordion header 和表格列共用）
    var tagsHtml = (c.tags && c.tags.length > 0)
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

    var collapseId = 'collapse-' + c.id;
    var headingId  = 'heading-' + c.id;
    var isFirst    = idx === 0;
    var avatarSrc  = c.avatar || 'https://placehold.co/40x40/cccccc/555555?text=U';

    // Step 2 — 標籤列改為完整的 tags-wrap 結構，支援 inline 編輯
    var tagsRowHtml = (
      '<tr>' +
        '<th class="text-muted">標籤</th>' +
        '<td colspan="5">' +
          // tags-wrap：掛 data-customer-id 供事件處理器讀取客戶 ID
          '<div class="tags-wrap d-flex align-items-center gap-2 flex-wrap" ' +
               'data-customer-id="' + c.id + '">' +

            // 靜態顯示區（編輯時隱藏）
            '<span class="tags-display">' + tagsHtml + '</span>' +

            // 鉛筆按鈕（靜態模式顯示）
            '<button type="button" class="btn btn-link btn-sm p-0 ms-1 tags-edit-btn" ' +
                    'title="編輯標籤">' +
              '<i class="fas fa-pencil-alt text-secondary"></i>' +
            '</button>' +

            // ── 以下為編輯模式區塊（預設隱藏 d-none）──
            '<div class="tags-editor d-none">' +
              '<div class="position-relative d-inline-block">' +

                // 下拉觸發按鈕
                '<button type="button" class="btn btn-outline-secondary btn-sm tags-dropdown-toggle">' +
                  '選擇標籤 <i class="fas fa-chevron-down ms-1"></i>' +
                '</button>' +

                // 浮動下拉選單（預設隱藏，由 JS toggle）
                '<div class="tags-dropdown-menu position-absolute bg-white border rounded shadow-sm p-2" ' +
                     'style="min-width:240px; z-index:1050; top:calc(100% + 4px); left:0; display:none;">' +

                  // checkbox 清單（由 buildTagsDropdown 動態填入）
                  '<div class="tags-checkbox-list"></div>' +

                  '<hr class="my-2">' +

                  // 新增標籤區
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
            // ── 編輯模式區塊結束 ──

            // 確認按鈕（編輯模式才顯示）
            '<button type="button" class="btn btn-sm btn-success tags-save-btn d-none py-0 px-1" ' +
                    'title="儲存標籤">' +
              '<i class="fas fa-check"></i>' +
            '</button>' +

            // 取消按鈕（編輯模式才顯示）
            '<button type="button" class="btn btn-sm btn-secondary tags-cancel-btn d-none py-0 px-1" ' +
                    'title="取消編輯">' +
              '<i class="fas fa-times"></i>' +
            '</button>' +

          '</div>' +
        '</td>' +
      '</tr>'
    );

    return (
      '<div class="accordion-item">' +
        '<h2 class="accordion-header" id="' + headingId + '">' +
          '<button class="accordion-button collapsed"' +
                  ' type="button" data-bs-toggle="collapse"' +
                  ' data-bs-target="#' + collapseId + '"' +
                  ' aria-expanded="false"' +
                  ' aria-controls="' + collapseId + '">' +
            '<img src="' + avatarSrc + '" width="40" height="40"' +
                 ' class="rounded-circle me-3 border object-fit-cover"' +
                 ' onerror="this.src=\'https://placehold.co/40x40/cccccc/555555?text=U\'">' +
            '<div class="flex-grow-1">' +
              '<div class="fw-semibold">' + c.name + '</div>' +
              '<div class="small text-muted">' + c.email + '</div>' +
            '</div>' +
            // Step 2 — 加上 customer-header-tags class，供儲存後同步更新
            '<div class="me-3 d-none d-md-block customer-header-tags">' + tagsHtml + '</div>' +
            '<div class="text-end me-3">' +
              '<div class="fw-bold text-success">NT$ ' + c.totalSpent.toLocaleString() + '</div>' +
              '<div class="small text-muted">累計消費</div>' +
            '</div>' +
          '</button>' +
        '</h2>' +
        '<div id="' + collapseId + '"' +
             ' class="accordion-collapse collapse"' + 
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
              '</tr>' +
              '<tr><th class="text-muted">聯絡電話</th><td colspan="5">' + (c.phone || '—') + '</td></tr>' +
              tagsRowHtml +
            '</tbody></table>' +
            '<p class="mb-1 fw-semibold small text-muted">購買記錄</p>' +
            '<ul class="list-group list-group-flush mb-0">' + ordersHtml + '</ul>' +
          '</div>' +
        '</div>' +
      '</div>'
    );
  }).join('');

  $('#customersAccordion').html(html);

  // 若從預約管理的顧客連結跳轉過來，自動展開目標顧客的 Accordion 並滾動至該位置
  // window.pendingCustomerId 由 bookings.js 的顧客連結點擊事件設定
  if (window.pendingCustomerId) {
    var targetId = window.pendingCustomerId;
    window.pendingCustomerId = null; // 用完即清，防止下次進入客戶管理時重複觸發

    var $target = $('#collapse-' + targetId);
    if ($target.length) {
      var $firstCollapse = $('#customersAccordion .accordion-collapse.show').not($target);
      if ($firstCollapse.length) {
        new bootstrap.Collapse($firstCollapse[0], { toggle: false }).hide();
        $firstCollapse.siblings('.accordion-header')
                      .find('.accordion-button')
                      .addClass('collapsed');
      }
      new bootstrap.Collapse($target[0], { toggle: false }).show();
      $target.siblings('.accordion-header')
             .find('.accordion-button')
             .removeClass('collapsed');
      setTimeout(function () {
        $target[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }

  if (typeof window.applyEditPermission === 'function') {
    window.applyEditPermission('customers', $('#contentArea'));
  }
}
