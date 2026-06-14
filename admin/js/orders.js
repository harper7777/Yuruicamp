/**
 * admin/js/orders.js
 * 訂單管理模組
 *
 * 設計重點：
 *   1. 從 orders.json 載入後存入 window.ordersCache，避免重複 fetch
 *   2. 付款狀態支援 3 種：已付款 / 未付款 / 貨到付款
 *   3. 訂單狀態支援 3 種：未出貨 / 已出貨 / 已退貨
 *   4. 點擊訂單編號開啟 modal，modal 內顯示訂單紀錄時間軸
 *   5. 點擊出貨按鈕後更新 orderStatus 並 push 新 history 紀錄
 *
 * 使用 jQuery Event Namespace (.orders) 防止重複導覽時事件堆疊
 */

window.initOrders = function () {
  // 移除舊有事件，防止切換頁面時事件重複綁定
  $(document).off('.orders');

  // 若快取已存在（例如切換頁面後回來），直接使用，不重新 fetch JSON
  if (window.ordersCache && window.ordersCache.length > 0) {
    renderOrdersTable(window.ordersCache);
  } else {
    $.getJSON('data/orders.json', function (orders) {
      window.ordersCache = orders;   // 存入全域快取，供 modal 讀取
      renderOrdersTable(orders);
    }).fail(function () {
      $('#ordersTableBody').html(
        '<tr><td colspan="6" class="text-center text-danger py-4">' +
        '<i class="fas fa-exclamation-triangle me-2"></i>載入訂單數據失敗' +
        '</td></tr>'
      );
    });
  }

  // 監聽 Select 的 change 事件，依 data-order-status 屬性顯示/隱藏列
  $(document).on('change.orders', '#orderStatusFilter', function () {
    var status = $(this).val();
    if (status === 'all') {
      $('#ordersTableBody tr').show();
    } else {
      $('#ordersTableBody tr').hide();
      $('#ordersTableBody tr[data-order-status="' + status + '"]').show();
    }
  });

  // 點擊訂單編號 → 開啟訂單明細 modal
  // .order-id-link 是 renderOrdersTable() 渲染時加上的 class
  $(document).on('click.orders', '.order-id-link', function () {
    var orderId = $(this).data('order-id');
    // 直接從快取取資料，確保 history 是最新的（反映出貨操作）
    var order = (window.ordersCache || []).find(function (o) { return o.id === orderId; });
    if (!order) return;
    showOrderModal(order);
  });

  // 出貨按鈕
  $(document).on('click.orders', '.btn-ship-order', function () {
    var $btn    = $(this);
    var $row    = $btn.closest('tr');
    var orderId = $row.data('order-id');

    // 更新記憶體中的快取資料
    var order = (window.ordersCache || []).find(function (o) { return o.id === orderId; });
    if (order) {
      order.orderStatus = 'shipped';

      // 產生當下時間字串，格式：YYYY-MM-DD HH:MM:SS
      var now = new Date();
      var pad = function (n) { return String(n).padStart(2, '0'); };
      var timeStr = now.getFullYear() + '-' +
                    pad(now.getMonth() + 1) + '-' +
                    pad(now.getDate()) + ' ' +
                    pad(now.getHours()) + ':' +
                    pad(now.getMinutes()) + ':' +
                    pad(now.getSeconds());

      order.history = order.history || [];
      order.history.push({ time: timeStr, action: '已出貨' });
    }

    // 更新畫面上的 badge 樣式與文字
    $row.find('.order-status-badge')
        .removeClass('bg-warning text-dark bg-danger')
        .addClass('bg-success')
        .text('已出貨');

    // 同步更新 data 屬性，讓篩選器仍能正確作用
    $row.attr('data-order-status', 'shipped');

    // 隱藏出貨按鈕（已出貨就不再顯示）
    $btn.hide();

    window.showAdminToast('訂單 ' + orderId + ' 已更新為「已出貨」');
  });
};

/**
 * 將 orders 陣列渲染成 HTML 表格列，填入 #ordersTableBody
 * @param {Array} orders - orders.json 的資料陣列
 */
function renderOrdersTable(orders) {
  if (!orders || orders.length === 0) {
    $('#ordersTableBody').html(
      '<tr><td colspan="6" class="text-center text-muted py-4">目前沒有訂單</td></tr>'
    );
    return;
  }

  // 付款狀態 badge（3 種）
  // paid = 已付款（綠）/ unpaid = 未付款（黃）/ cod = 貨到付款（藍）
  var payBadgeMap = {
    paid:   '<span class="badge bg-success">已付款</span>',
    unpaid: '<span class="badge bg-warning text-dark">未付款</span>',
    cod:    '<span class="badge bg-info text-dark">貨到付款</span>'
  };

  // 訂單狀態 badge（3 種）
  var orderStatusMap = {
    unshipped: '<span class="badge bg-warning text-dark order-status-badge">未出貨</span>',
    shipped:   '<span class="badge bg-success order-status-badge">已出貨</span>',
    returned:  '<span class="badge bg-danger order-status-badge">已退貨</span>'
  };

  var html = orders.map(function (order) {
    var payBadge    = payBadgeMap[order.paymentStatus]  || '';
    var statusBadge = orderStatusMap[order.orderStatus] || '';

    // 出貨按鈕只在「未出貨」時顯示
    var shipBtn = (order.orderStatus === 'unshipped')
      ? '<button class="btn btn-sm btn-outline-success btn-ship-order" title="確認出貨">' +
        '<i class="fas fa-truck me-1"></i>出貨</button>'
      : '';

    // 拆解日期與時間，分兩行顯示
    var dateParts = order.createdAt.split(' ');
    var date = dateParts[0];
    var time = dateParts[1] || '';

    // 訂單編號：可點擊連結樣式，hover 顯示提示文字
    var idLink = '<span class="order-id-link text-primary fw-semibold" ' +
                 'data-order-id="' + order.id + '" ' +
                 'style="cursor:pointer; text-decoration:underline dotted;" ' +
                 'title="點擊查看訂單明細">' +
                 order.id + '</span>';

    return '<tr data-order-id="' + order.id + '"' +
           ' data-order-status="' + order.orderStatus + '">' +
           '<td>' + idLink + '</td>' +
           '<td>' + date + '<br><small class="text-muted">' + time + '</small></td>' +
           '<td class="fw-semibold">' + order.buyerName + '</td>' +
           '<td class="fw-semibold">NT$ ' + order.total.toLocaleString() + '</td>' +
           '<td>' + payBadge + '</td>' +
           '<td>' + statusBadge + '</td>' +
           '<td>' + shipBtn + '</td>' +
           '</tr>';
  }).join('');

  $('#ordersTableBody').html(html);

  // 依編輯權限停用出貨按鈕 / Disable ship buttons if no edit permission
  if (typeof window.applyEditPermission === 'function') {
    window.applyEditPermission('orders', $('#contentArea'));
  }
}

/**
 * 將訂單資料填入 #orderDetailModal 並開啟
 * @param {Object} order - 來自 window.ordersCache 的單筆訂單物件
 */
function showOrderModal(order) {
  // 基本資訊
  $('#modalOrderId').text(order.id);
  $('#modalBuyerName').text(order.buyerName);

  // 訂單狀態 badge
  var statusMap = {
    unshipped: '<span class="badge bg-warning text-dark">未出貨</span>',
    shipped:   '<span class="badge bg-success">已出貨</span>',
    returned:  '<span class="badge bg-danger">已退貨</span>'
  };
  $('#modalOrderStatus').html(statusMap[order.orderStatus] || '');

  // 商品清單
  var itemsHtml = (order.items || []).map(function (item) {
    return '<tr>' +
      '<td>' + item.name + '</td>' +
      '<td class="text-center">' + item.qty + '</td>' +
      '<td class="text-end">NT$ ' + item.price.toLocaleString() + '</td>' +
      '<td class="text-end">NT$ ' + (item.qty * item.price).toLocaleString() + '</td>' +
      '</tr>';
  }).join('');
  $('#modalItemsList').html(itemsHtml);
  $('#modalTotal').text('NT$ ' + order.total.toLocaleString());

  // 收件地址
  $('#modalAddress').text(order.address);

  // 訂單紀錄時間軸
  // 逐筆輸出 history，每筆格式：圓點 + 時間（灰色）+ 動作
  var historyHtml = (order.history || []).map(function (entry) {
    return '<li class="d-flex align-items-start gap-2 mb-1">' +
           '<i class="fas fa-circle mt-1" style="font-size:6px; color:var(--admin-brand-accent); flex-shrink:0;"></i>' +
           '<span><span class="text-muted me-2">' + entry.time + '</span>' + entry.action + '</span>' +
           '</li>';
  }).join('');
  $('#modalHistory').html(historyHtml || '<li class="text-muted">無紀錄</li>');

  // 開啟 modal
  new bootstrap.Modal('#orderDetailModal').show();
}