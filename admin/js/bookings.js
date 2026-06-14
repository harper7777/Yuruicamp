/**
 * admin/js/bookings.js
 * 預約/租借管理模組
 *
 * 設計重點：
 *   1. 從 bookings.json 載入後存入 window.bookingsCache，避免重複 fetch
 *   2. 付款狀態 2 種：已付款 / 已退款（顧客結帳即付款，取消時自動退款）
 *   3. 訂單狀態 4 種：待確認 / 已確認 / 已完成 / 已取消
 *   4. 點擊預約單號開啟明細 Modal（#bookingDetailModal）
 *   5. 「確認預約」直接更新狀態 + Toast
 *   6. 「取消」開啟取消確認 Modal（#bookingCancelModal），填寫原因後確認
 *   7. 「標記已完成」在明細 Modal 內，僅 confirmed 狀態顯示
 *   8. 顧客姓名連結：設定 window.pendingCustomerId 後觸發切換至客戶管理
 *
 * 使用 jQuery Event Namespace (.bookings) 防止重複導覽時事件堆疊
 */

window.initBookings = function () {
  // 移除舊有事件，防止切換頁面時事件重複綁定
  $(document).off('.bookings');

  // 確保 customersCache 已載入，再載入 bookings（顧客姓名查詢需要）
  // 若 customersCache 不存在（直接進入預約管理而未經過客戶管理頁），先 fetch customers
  function loadBookingsData() {
    if (window.bookingsCache && window.bookingsCache.length > 0) {
      renderBookingsTable(window.bookingsCache);
    } else {
      $.getJSON('data/bookings.json', function (bookings) {
        window.bookingsCache = bookings;
        renderBookingsTable(bookings);
      }).fail(function () {
        $('#bookingsTableBody').html(
          '<tr><td colspan="9" class="text-center text-danger py-4">' +
          '<i class="fas fa-exclamation-triangle me-2"></i>載入預約數據失敗' +
          '</td></tr>'
        );
      });
    }
  }

  if (window.customersCache && window.customersCache.length > 0) {
    // customersCache 已有資料，直接渲染
    loadBookingsData();
  } else {
    // 尚未載入客戶資料，先 fetch customers.json 再渲染 bookings
    $.getJSON('data/customers.json', function (customers) {
      window.customersCache = customers;
      loadBookingsData();
    }).fail(function () {
      // customers 載入失敗不阻斷 bookings 渲染（顧客名稱顯示 id 即可）
      loadBookingsData();
    });
  }

  // ── 雙篩選（訂單狀態 + 付款狀態，AND 邏輯）──────────────────
  $(document).on('change.bookings', '#bookingStatusFilter, #paymentStatusFilter', function () {
    applyBookingFilters();
  });

  // ── 點擊預約單號 → 開啟明細 Modal ────────────────────────────
  $(document).on('click.bookings', '.booking-id-link', function () {
    var bookingId = $(this).data('booking-id');
    var booking = (window.bookingsCache || []).find(function (b) {
      return b.id === bookingId;
    });
    if (!booking) return;
    showBookingModal(booking);
  });

  // ── 確認預約按鈕 ──────────────────────────────────────────────
  // 直接更新狀態為 confirmed，不需額外確認框（正向操作）
  $(document).on('click.bookings', '.btn-confirm-booking', function () {
    var $btn = $(this);
    var $row = $btn.closest('tr');
    var bookingId = $row.data('booking-id');

    var booking = (window.bookingsCache || []).find(function (b) {
      return b.id === bookingId;
    });
    if (!booking) return;

    // 更新記憶體快取
    booking.status = 'confirmed';
    var timeStr = getCurrentTimeStr();
    booking.history = booking.history || [];
    booking.history.push({ time: timeStr, action: '已確認預約' });

    // 更新畫面：badge、data 屬性、操作欄
    $row.find('.booking-status-badge')
        .removeClass('bg-warning text-dark')
        .addClass('bg-primary')
        .text('已確認');
    $row.attr('data-booking-status', 'confirmed');

    // 確認後操作欄改為只顯示「取消」
    $row.find('.btn-confirm-booking').remove();

    window.showAdminToast('預約 ' + bookingId + ' 已確認');
  });

  // ── 取消按鈕 → 開啟取消確認 Modal ───────────────────────────
  $(document).on('click.bookings', '.btn-cancel-booking', function () {
    var $row = $(this).closest('tr');
    // 暫存目標 booking id，供 #confirmCancelBtn click 讀取
    window._cancelTargetId = $row.data('booking-id');
    // 清空上次輸入的原因
    $('#cancelReasonInput').val('');
    new bootstrap.Modal('#bookingCancelModal').show();
  });

  // ── 確認取消（取消 Modal 內的按鈕）─────────────────────────
  $(document).on('click.bookings', '#confirmCancelBtn', function () {
    var bookingId = window._cancelTargetId;
    if (!bookingId) return;

    var reason = $('#cancelReasonInput').val().trim();
    var actionText = reason
      ? '已取消（原因：' + reason + '）'
      : '已取消';

    var booking = (window.bookingsCache || []).find(function (b) {
      return b.id === bookingId;
    });
    if (booking) {
      booking.status = 'cancelled';
      booking.payment_status = 'refunded';
      var timeStr = getCurrentTimeStr();
      booking.history = booking.history || [];
      booking.history.push({ time: timeStr, action: actionText });
      booking.history.push({ time: timeStr, action: '已退款' });
    }

    // 更新畫面上的 badge
    var $row = $('#bookingsTableBody tr[data-booking-id="' + bookingId + '"]');
    $row.find('.booking-status-badge')
        .removeClass('bg-warning text-dark bg-primary bg-success')
        .addClass('bg-danger')
        .text('已取消');
    $row.attr('data-booking-status', 'cancelled');
    $row.attr('data-payment-status', 'refunded');
    $row.find('.payment-status-badge').replaceWith(getPayBadgeHtml('refunded'));
    // 清空操作欄（已取消無操作）
    $row.find('td:last-child').empty();

    // 關閉 Modal
    bootstrap.Modal.getInstance(document.getElementById('bookingCancelModal')).hide();
    window._cancelTargetId = null;

    window.showAdminToast('預約 ' + bookingId + ' 已取消', 'info');
  });

  // ── 顧客名稱連結 → 切換至客戶管理並展開該顧客 ───────────────
  $(document).on('click.bookings', '.booking-customer-link', function (e) {
    e.preventDefault();
    var customerId = $(this).data('customer-id');
    // 設定全域目標顧客 id，customers.js 渲染後會讀取此值並自動展開
    window.pendingCustomerId = customerId;
    // 觸發 Sidebar 切換至客戶管理（桌面版第一個符合的連結）
    $('.sidebar-link[data-section="customers"]').first().trigger('click');
  });

  // ── 標記已完成（在明細 Modal 內）──────────────────────────
  $(document).on('click.bookings', '#btnCompleteBooking', function () {
    var bookingId = $('#bkModalId').text();
    var booking = (window.bookingsCache || []).find(function (b) {
      return b.id === bookingId;
    });
    if (!booking) return;

    booking.status = 'completed';
    booking.equipment_returned = true;
    var timeStr = getCurrentTimeStr();
    booking.history = booking.history || [];
    booking.history.push({ time: timeStr, action: '已完成' });

    // 更新表格列的 badge
    var $row = $('#bookingsTableBody tr[data-booking-id="' + bookingId + '"]');
    $row.find('.booking-status-badge')
        .removeClass('bg-primary bg-warning text-dark')
        .addClass('bg-success')
        .text('已完成');
    $row.attr('data-booking-status', 'completed');
    // 已完成無操作按鈕
    $row.find('td:last-child').empty();

    // 關閉 Modal
    bootstrap.Modal.getInstance(document.getElementById('bookingDetailModal')).hide();

    window.showAdminToast('預約 ' + bookingId + ' 已標記為完成');
  });

  if (typeof window.applyEditPermission === 'function') {
    window.applyEditPermission('bookings', $('#contentArea'));
  }
};

// ═══════════════════════════════════════════════════════════════
// renderBookingsTable(bookings)
// 將 bookings 陣列渲染成 HTML 表格列，填入 #bookingsTableBody
// ═══════════════════════════════════════════════════════════════
/**
 * @param {Array} bookings - bookings.json 的資料陣列
 */
function renderBookingsTable(bookings) {
  if (!bookings || bookings.length === 0) {
    $('#bookingsTableBody').html(
      '<tr><td colspan="9" class="text-center text-muted py-4">目前沒有預約資料</td></tr>'
    );
    return;
  }

  // 訂單狀態 badge（4 種）
  var statusBadgeMap = {
    pending:   '<span class="badge bg-warning text-dark booking-status-badge">待確認</span>',
    confirmed: '<span class="badge bg-primary booking-status-badge">已確認</span>',
    completed: '<span class="badge bg-success booking-status-badge">已完成</span>',
    cancelled: '<span class="badge bg-danger booking-status-badge">已取消</span>'
  };

  var html = bookings.map(function (booking) {
    var info = booking.booking_info;

    // ── 付款 / 狀態 badge ──
    var payBadge    = getPayBadgeHtml(booking.payment_status);
    var statusBadge = statusBadgeMap[booking.status] || '';

    // ── 含租借 badge ──
    var hasRental = booking.selected_rentals && booking.selected_rentals.length > 0;
    var rentalBadge = hasRental
      ? '<span class="badge bg-success">有租借</span>'
      : '<span class="badge bg-secondary">無</span>';

    // ── 操作按鈕（依狀態顯示）──
    var actionBtns = '';
    if (booking.status === 'pending') {
      actionBtns =
        '<button class="btn btn-sm btn-outline-primary btn-confirm-booking me-1" ' +
        'title="確認預約"><i class="fas fa-check me-1"></i>確認預約</button>' +
        '<button class="btn btn-sm btn-outline-danger btn-cancel-booking" ' +
        'title="取消預約"><i class="fas fa-times me-1"></i>取消</button>';
    } else if (booking.status === 'confirmed') {
      actionBtns =
        '<button class="btn btn-sm btn-outline-danger btn-cancel-booking" ' +
        'title="取消預約"><i class="fas fa-times me-1"></i>取消</button>';
    }

    // ── 下單日期拆分日期 + 時間 ──
    var dateParts = (booking.submitted_at || '').split(' ');
    var dateStr = dateParts[0] || '';
    var timeStr = dateParts[1] || '';

    // ── 入住・退營（幾晚）──
    var checkIn  = info.check_in  || '';
    var checkOut = info.check_out || '';
    var nights   = info.total_days || 0;
    var stayStr  = checkIn + ' ～ ' + checkOut +
                   '<br><small class="text-muted">共 ' + nights + ' 晚</small>';

    // ── 營區 + 地區 badge ──
    var campStr = info.campground_name +
                  '<br><span class="badge bg-secondary bg-opacity-50 text-dark small">' +
                  info.region + '</span>';

    // ── 預約單號連結 ──
    var idLink =
      '<span class="booking-id-link text-primary fw-semibold" ' +
      'data-booking-id="' + booking.id + '" ' +
      'style="cursor:pointer; text-decoration:underline dotted;" ' +
      'title="點擊查看預約明細">' + booking.id + '</span>';

    // ── 顧客姓名超連結（帶 customer_id，點擊後跳轉至客戶管理）──
    var customerLink =
      '<a href="#" class="booking-customer-link text-decoration-underline" ' +
      'data-customer-id="' + booking.customer_id + '" ' +
      'title="查看顧客檔案">' +
      // 從 customers 快取查名字；快取未載入時顯示 customer_id
      getCustomerName(booking.customer_id) +
      '</a>';

    return '<tr data-booking-id="' + booking.id + '"' +
           ' data-booking-status="' + booking.status + '"' +
           ' data-payment-status="' + booking.payment_status + '">' +
           '<td>' + idLink + '</td>' +
           '<td>' + dateStr + '<br><small class="text-muted">' + timeStr + '</small></td>' +
           '<td>' + customerLink + '</td>' +
           '<td>' + stayStr + '</td>' +
           '<td>' + campStr + '</td>' +
           '<td class="text-center">' + rentalBadge + '</td>' +
           '<td>' + payBadge + '</td>' +
           '<td>' + statusBadge + '</td>' +
           '<td>' + actionBtns + '</td>' +
           '</tr>';
  }).join('');

  $('#bookingsTableBody').html(html);
  applyBookingFilters();

  if (typeof window.applyEditPermission === 'function') {
    window.applyEditPermission('bookings', $('#contentArea'));
  }
}

// ═══════════════════════════════════════════════════════════════
// showBookingModal(booking)
// 將預約資料填入 #bookingDetailModal 並開啟
// ═══════════════════════════════════════════════════════════════
/**
 * @param {Object} booking - 來自 window.bookingsCache 的單筆預約物件
 */
function showBookingModal(booking) {
  var info    = booking.booking_info;
  var rentals = booking.selected_rentals || [];
  var zones   = booking.selected_zones   || [];
  var summary = booking.summary          || {};

  // ── 標題：預約單號 + 狀態 badge ──
  $('#bkModalId').text(booking.id);

  var statusLabelMap = {
    pending:   '<span class="badge bg-warning text-dark">待確認</span>',
    confirmed: '<span class="badge bg-primary">已確認</span>',
    completed: '<span class="badge bg-success">已完成</span>',
    cancelled: '<span class="badge bg-danger">已取消</span>'
  };
  $('#bkModalStatus').html(statusLabelMap[booking.status] || '');

  // ── 訂購人資訊（需查詢 customersCache 取得電話/Email）──
  var customerName  = getCustomerName(booking.customer_id);
  var customerPhone = getCustomerField(booking.customer_id, 'phone');
  var customerEmail = getCustomerField(booking.customer_id, 'email');
  $('#bkModalName').text(customerName);
  $('#bkModalPhone').text(customerPhone || '—');
  $('#bkModalEmail').text(customerEmail || '—');
  $('#bkModalPaymentStatus').html(getPayBadgeHtml(booking.payment_status));

  // ── 住宿明細 ──
  var zoneRows = zones.map(function (z) {
    return '<tr>' +
      '<td>' + z.zone_type + '</td>' +
      '<td class="text-center">× ' + z.quantity + ' 個營位</td>' +
      '<td class="text-end">NT$ ' + z.subtotal.toLocaleString() + '</td>' +
      '</tr>';
  }).join('');

  $('#bkModalStayDetail').html(
    '<div class="mb-2 text-muted small">' +
    '<i class="fas fa-campground me-1"></i>' + info.campground_name +
    '&ensp;<span class="badge bg-secondary bg-opacity-50 text-dark">' + info.region + '</span>' +
    '</div>' +
    '<div class="mb-2 text-muted small">' +
    '<i class="fas fa-calendar-alt me-1"></i>' +
    info.check_in + ' ～ ' + info.check_out +
    '（共 ' + info.total_days + ' 晚，平日 ' + info.weekday_count +
    ' 晚・假日 ' + info.holiday_count + ' 晚）' +
    '</div>' +
    '<div class="mb-2 text-muted small">' +
    '<i class="fas fa-users me-1"></i>' + info.guest_count + ' 人' +
    '</div>' +
    '<table class="table table-sm table-bordered mt-2 mb-0">' +
    '<thead class="table-light"><tr>' +
    '<th>營位類型</th><th class="text-center">數量</th><th class="text-end">小計</th>' +
    '</tr></thead>' +
    '<tbody>' + zoneRows + '</tbody>' +
    '</table>'
  );

  // ── 裝備租借明細 ──
  if (rentals.length === 0) {
    $('#bkModalRentalDetail').html(
      '<p class="text-muted small mb-0"><i class="fas fa-info-circle me-1"></i>本次未選擇租借裝備。</p>'
    );
  } else {
    var rentalRows = rentals.map(function (r) {
      return '<tr>' +
        '<td>' + r.name + '</td>' +
        '<td class="text-center">× ' + r.quantity + '</td>' +
        '<td class="text-end">NT$ ' + r.subtotal.toLocaleString() + '</td>' +
        '</tr>';
    }).join('');
    $('#bkModalRentalDetail').html(
      '<table class="table table-sm table-bordered mb-0">' +
      '<thead class="table-light"><tr>' +
      '<th>裝備名稱</th><th class="text-center">數量</th><th class="text-end">小計</th>' +
      '</tr></thead>' +
      '<tbody>' + rentalRows + '</tbody>' +
      '</table>'
    );
  }

  // ── 費用明細 ──
  var costHtml =
    '<div class="d-flex justify-content-between mb-1">' +
    '<span class="text-muted">住宿費</span>' +
    '<span>NT$ ' + (summary.zone_total || 0).toLocaleString() + '</span></div>' +
    '<div class="d-flex justify-content-between mb-1">' +
    '<span class="text-muted">裝備租借費</span>' +
    '<span>NT$ ' + (summary.rental_total || 0).toLocaleString() + '</span></div>';

  if (summary.applied_discount > 0) {
    costHtml +=
      '<div class="d-flex justify-content-between mb-1 text-success">' +
      '<span><i class="fas fa-tag me-1"></i>租借折扣</span>' +
      '<span>- NT$ ' + summary.applied_discount.toLocaleString() + '</span></div>';
  }

  costHtml +=
    '<hr class="my-2">' +
    '<div class="d-flex justify-content-between fw-bold">' +
    '<span>合計</span>' +
    '<span>NT$ ' + (summary.final_amount || 0).toLocaleString() + '</span></div>';

  $('#bkModalCostBreakdown').html(costHtml);

  // ── 裝備歸還區塊：僅 confirmed + 有租借時顯示 ──
  var showReturn = (booking.status === 'confirmed') && (rentals.length > 0);
  if (showReturn) {
    $('#equipmentReturnSection').removeClass('d-none');
    // 重置 checkbox 勾選狀態
    $('#equipmentReturnedCheck').prop('checked', booking.equipment_returned || false);
  } else {
    $('#equipmentReturnSection').addClass('d-none');
  }

  // ── 完成按鈕：僅 confirmed 狀態顯示 ──
  if (booking.status === 'confirmed') {
    $('#btnCompleteBooking').removeClass('d-none');
  } else {
    $('#btnCompleteBooking').addClass('d-none');
  }

  // ── 狀態紀錄時間軸 ──
  var historyHtml = (booking.history || []).map(function (entry) {
    return '<li class="d-flex align-items-start gap-2 mb-1">' +
           '<i class="fas fa-circle mt-1" ' +
           'style="font-size:6px; color:var(--admin-brand-accent); flex-shrink:0;"></i>' +
           '<span><span class="text-muted me-2">' + entry.time + '</span>' +
           entry.action + '</span>' +
           '</li>';
  }).join('');
  $('#bkModalHistory').html(historyHtml || '<li class="text-muted">無紀錄</li>');

  // 開啟 Modal
  new bootstrap.Modal('#bookingDetailModal').show();

  if (typeof window.applyEditPermission === 'function') {
    window.applyEditPermission('bookings', $('#contentArea'));
  }
}

// ═══════════════════════════════════════════════════════════════
// applyBookingFilters()
// 依 #bookingStatusFilter 與 #paymentStatusFilter 雙條件（AND）顯示列
// ═══════════════════════════════════════════════════════════════
function applyBookingFilters() {
  var orderStatus  = $('#bookingStatusFilter').val()  || 'all';
  var paymentStatus = $('#paymentStatusFilter').val() || 'all';

  $('#bookingsTableBody tr[data-booking-id]').each(function () {
    var $row = $(this);
    var matchOrder   = (orderStatus === 'all') ||
                       ($row.attr('data-booking-status') === orderStatus);
    var matchPayment = (paymentStatus === 'all') ||
                       ($row.attr('data-payment-status') === paymentStatus);
    $row.toggle(matchOrder && matchPayment);
  });
}

/**
 * 產生付款狀態 badge HTML
 * @param {string} paymentStatus - paid | refunded
 * @returns {string}
 */
function getPayBadgeHtml(paymentStatus) {
  var map = {
    paid:     '<span class="badge bg-success payment-status-badge">已付款</span>',
    refunded: '<span class="badge bg-secondary payment-status-badge">已退款</span>'
  };
  return map[paymentStatus] || '';
}

// ═══════════════════════════════════════════════════════════════
// 工具函式
// ═══════════════════════════════════════════════════════════════

/**
 * 從 customersCache 查詢顧客姓名
 * 若快取尚未載入，回傳 customer_id 作為備用顯示
 * @param {string} customerId - 顧客 id（例："U001"）
 * @returns {string}
 */
function getCustomerName(customerId) {
  var cache = window.customersCache || [];
  var customer = cache.find(function (c) { return c.id === customerId; });
  return customer ? customer.name : customerId;
}

/**
 * 從 customersCache 查詢顧客的指定欄位
 * @param {string} customerId - 顧客 id
 * @param {string} field      - 欄位名稱（例："phone"、"email"）
 * @returns {string}
 */
function getCustomerField(customerId, field) {
  var cache = window.customersCache || [];
  var customer = cache.find(function (c) { return c.id === customerId; });
  return customer ? (customer[field] || '') : '';
}

/**
 * 產生當下時間字串，格式：YYYY-MM-DD HH:MM:SS
 * @returns {string}
 */
function getCurrentTimeStr() {
  var now = new Date();
  var pad = function (n) { return String(n).padStart(2, '0'); };
  return now.getFullYear() + '-' +
         pad(now.getMonth() + 1) + '-' +
         pad(now.getDate()) + ' ' +
         pad(now.getHours()) + ':' +
         pad(now.getMinutes()) + ':' +
         pad(now.getSeconds());
}
