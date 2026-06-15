/**
 * booking-cart.js
 * 功能：預約購物車 / 結帳頁邏輯
 *   ① 讀取 LocalStorage 取得完整 bookingCart
 *   ② 渲染住宿明細、裝備明細、費用加總
 *   ③ 聯絡資訊表單驗證
 *   ④ 模擬送出結帳（未來對接 Java 後端）
 *   ⑤ 結帳成功後清除 LocalStorage，顯示導購橫幅
 *
 * Handles: LocalStorage read, order summary rendering,
 *          form validation, checkout simulation, post-checkout
 */

// ============================================================
// 頁面初始化 / Page Initialization
// ============================================================
$(document).ready(function () {

  // 步驟 1：讀取 LocalStorage / Step 1: Read LocalStorage
  const stored = localStorage.getItem('bookingCart');

  // 防呆：無資料時引導回搜尋頁 / Guard: redirect if no data
  if (!stored) {
    alert('購物車資料為空，請重新搜尋並選擇營區。');
    window.location.href = './camp-search.html';
    return;
  }

  const bookingCart = JSON.parse(stored);

  // 步驟 2：渲染全頁明細 / Step 2: Render full cart summary
  renderBookingCartPage(bookingCart);

  // 步驟 3：修改「返回」連結（帶上 campground_id）
  // Fix "back" link with campground_id
  $('#backToRentalLink').attr('href', './camp-rental.html');

  // 步驟 4：手風琴面板 / Step 4: Accordion panels
  initAccordionPanels();

  // 步驟 5：付款方式互動 / Step 5: Payment method interaction
  initPaymentMethod();

  // 步驟 6：綁定確認結帳按鈕 / Step 6: Bind checkout button
  $('#confirmPayBtn').on('click', function () {
    handleCheckout(bookingCart);
  });

});

// ============================================================
// 渲染整頁預約明細
// ============================================================

/**
 * 將 bookingCart 的所有資訊渲染到頁面上
 * Render all bookingCart information to the page
 *
 * @param {Object} cart - 從 LocalStorage 讀取的 bookingCart 物件
 */
function renderBookingCartPage(cart) {
  const info    = cart.booking_info;
  const zones   = cart.selected_zones;
  const rentals = cart.selected_rentals;
  const summary = cart.summary;

  // -----------------------------------------------------------
  // 渲染住宿資訊 / Render stay info
  // -----------------------------------------------------------
  const zoneRowsHTML = zones.map(z => `
    <div class="detail-row">
      <span>
        <strong>${info.campground_name}</strong>・${z.zone_type}・×${z.quantity} 個營位
      </span>
      <span><strong>NT$${z.subtotal.toLocaleString()}</strong></span>
    </div>
  `).join('');

  $('#stayDetail').html(`
    <div class="detail-row detail-row--meta">
      <i class="bi bi-calendar3"></i>
      ${info.check_in} ～ ${info.check_out}
      （${info.total_days} 晚｜平日 ${info.weekday_count} 晚、假日 ${info.holiday_count} 晚）
    </div>
    <div class="detail-row detail-row--meta">
      <i class="bi bi-geo-alt"></i> ${info.region}
      &nbsp;&nbsp;
      <i class="bi bi-people"></i> ${info.guest_count} 人
    </div>
    ${zoneRowsHTML}
  `);

  // -----------------------------------------------------------
  // 渲染租借裝備 / Render rental equipment
  // -----------------------------------------------------------
  if (!rentals || rentals.length === 0) {
    $('#rentalDetail').html(
      '<p class="no-rental">本次未選擇租借裝備。</p>'
    );
  } else {
    const rentalRowsHTML = rentals.map(r => `
      <div class="detail-row">
        <span>${r.name} ×${r.quantity}</span>
        <span><strong>NT$${r.subtotal.toLocaleString()}</strong></span>
      </div>
    `).join('');
    $('#rentalDetail').html(rentalRowsHTML);
  }

  // -----------------------------------------------------------
  // 渲染費用明細 / Render cost breakdown
  // -----------------------------------------------------------
  let breakdownHTML = `
    <div class="cost-row">
      <span>住宿費</span>
      <span>NT$${summary.zone_total.toLocaleString()}</span>
    </div>
    <div class="cost-row">
      <span>裝備租借費</span>
      <span>NT$${summary.rental_total.toLocaleString()}</span>
    </div>
  `;

  // 若有折扣才顯示 / Only show discount row if > 0
  if (summary.applied_discount > 0) {
    breakdownHTML += `
      <div class="cost-row cost-row--discount">
        <span><i class="bi bi-tag"></i> 租借折扣優惠</span>
        <span>-NT$${summary.applied_discount.toLocaleString()}</span>
      </div>
    `;
  }

  $('#costBreakdown').html(breakdownHTML);
  $('#finalAmount').text(`NT$${summary.final_amount.toLocaleString()}`);
}

// ============================================================
// 登入守衛（Header 載入後由 booking-cart.html 觸發）
// ============================================================

/**
 * 由 booking-cart.html 的 $.load() 回呼觸發。
 * Header 的 booking-header.js 此時已執行，window.openModal 可用。
 */
window.onBookingHeaderReady = function () {
  initLoginGuard();
};

function initLoginGuard() {

  function isLoggedIn() {
    try {
      var user = JSON.parse(localStorage.getItem('yuruiUser'));
      return !!(user && user.name);
    } catch (e) { return false; }
  }

  function showNotice() { $('#loginNotice').slideDown(250); }
  function hideNotice() { $('#loginNotice').slideUp(250); }

  // 未登入 → 自動彈出登入 Modal + 顯示提示橫幅
  if (!isLoggedIn()) {
    setTimeout(function () {
      if (typeof window.openModal === 'function') {
        window.openModal('loginModal');
      }
      showNotice();
    }, 400);
  }

  // 提示橫幅的「立即登入 / 註冊」按鈕
  $('#loginNoticeBtn').on('click', function () {
    if (typeof window.openModal === 'function') {
      window.openModal('loginModal');
    }
  });

  // 其他頁籤完成登入後同步更新
  window.addEventListener('storage', function (e) {
    if (e.key === 'yuruiUser') {
      isLoggedIn() ? hideNotice() : showNotice();
    }
  });
}

// ============================================================
// 手風琴面板
// ============================================================

function initAccordionPanels() {
  $('.bk-panel__header').on('click', function () {
    const $panel = $(this).closest('.bk-panel');
    const $body  = $panel.find('> .bk-panel__body');
    const isOpen = $panel.hasClass('is-open');

    if (isOpen) {
      $body.slideUp(200);
      $panel.removeClass('is-open');
    } else {
      $body.slideDown(200);
      $panel.addClass('is-open');
    }
  });
}

// ============================================================
// 付款方式互動
// ============================================================

function initPaymentMethod() {

  // 切換選取樣式 + 顯示/隱藏信用卡欄位
  $('input[name="paymentMethod"]').on('change', function () {
    const val = $(this).val();

    $('#payOptCredit').toggleClass('is-selected', val === 'credit');
    $('#payOptLine').toggleClass('is-selected',   val === 'linepay');

    if (val === 'credit') {
      $('#creditCardSection').slideDown(200);
    } else {
      $('#creditCardSection').slideUp(200);
    }
  });

  // 卡號自動加空格（每 4 位）/ Auto-format card number with spaces
  $('#cardNumber').on('input', function () {
    let v = $(this).val().replace(/\D/g, '').substring(0, 16);
    v = v.replace(/(.{4})/g, '$1 ').trim();
    $(this).val(v);
  });

  // 到期日自動補斜線 MM / YY / Auto-format expiry MM / YY
  $('#cardExpiry').on('input', function () {
    let v = $(this).val().replace(/\D/g, '').substring(0, 4);
    if (v.length >= 3) v = v.slice(0, 2) + ' / ' + v.slice(2);
    $(this).val(v);
  });

  // CVV 只允許數字 / CVV digits only
  $('#cardCvv').on('input', function () {
    $(this).val($(this).val().replace(/\D/g, '').substring(0, 4));
  });
}

// ============================================================
// 送出結帳
// ============================================================

/**
 * 驗證聯絡資訊，送出結帳（模擬），成功後清除資料
 * Validate contact info, submit checkout (mock), then clear data
 *
 * @param {Object} cart - bookingCart 物件（附加聯絡資訊後送出）
 */
function handleCheckout(cart) {

  // 登入驗證：未登入時重新彈出 Modal
  try {
    var u = JSON.parse(localStorage.getItem('yuruiUser'));
    if (!u || !u.name) {
      if (typeof window.openModal === 'function') window.openModal('loginModal');
      return;
    }
  } catch (e) {
    if (typeof window.openModal === 'function') window.openModal('loginModal');
    return;
  }

  // 表單驗證 / Form validation
  const name  = $('#contactName').val().trim();
  const phone = $('#contactPhone').val().trim();
  const email = $('#contactEmail').val().trim();

  if (!name) {
    highlightError('#contactName', '請填寫訂購人姓名');
    return;
  }
  if (!phone || !/^[0-9]{8,12}$/.test(phone)) {
    highlightError('#contactPhone', '請填寫正確的手機號碼（8-12 位數字）');
    return;
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    highlightError('#contactEmail', '請填寫有效的電子信箱格式');
    return;
  }

  // 付款方式驗證 / Payment validation
  const paymentMethod = $('input[name="paymentMethod"]:checked').val();
  if (paymentMethod === 'credit') {
    const cardNum    = $('#cardNumber').val().replace(/\s/g, '');
    const cardExpiry = $('#cardExpiry').val().trim();
    const cardCvv    = $('#cardCvv').val().trim();
    if (cardNum.length < 16) {
      highlightError('#cardNumber', '請填寫完整的信用卡卡號（16 位）');
      return;
    }
    if (!/^\d{2} \/ \d{2}$/.test(cardExpiry)) {
      highlightError('#cardExpiry', '請填寫正確的到期日格式（MM / YY）');
      return;
    }
    if (cardCvv.length < 3) {
      highlightError('#cardCvv', '請填寫 CVV（3-4 位數字）');
      return;
    }
  }

  // 準備送出的資料 / Prepare submission payload
  const payload = {
    ...cart,
    contact:        { name, phone, email },
    payment_method: paymentMethod,
    submitted_at:   new Date().toISOString()
  };

  // 按鈕進入 loading 狀態 / Button loading state
  $('#confirmPayBtn')
    .prop('disabled', true)
    .html('<i class="bi bi-hourglass-split"></i> 送出中...');

  // TODO: 未來在此替換為 fetch Java 後端 API
  // Future backend endpoint: POST /api/bookings
  // Request body: { ...bookingCart, contact: { name, phone, email } }
  // Response: { success: true, booking_id: 'BK202606110001', message: '預約成功' }
  //
  // fetch('/api/bookings', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify(payload)
  // })
  // .then(res => res.json())
  // .then(data => { if (data.success) { onCheckoutSuccess(); } })
  // .catch(err => { console.error('結帳 API 失敗:', err); });

  // 目前 Mock：模擬 1 秒後成功 / Mock: simulate 1s then success
  console.log('[booking-cart] 預約送出資料:', payload);

  setTimeout(function () {
    onCheckoutSuccess();
  }, 1000);
}

// ============================================================
// 結帳成功後處理
// ============================================================

/**
 * 結帳成功後：
 *   1. 清除 LocalStorage bookingCart
 *   2. 更新按鈕樣式
 *   3. 顯示導購橫幅
 *   4. 顯示導購區塊
 *
 * After checkout success:
 *   1. Clear LocalStorage
 *   2. Update button
 *   3. Show upsell banner
 *   4. Show upsell section
 */
function onCheckoutSuccess() {

  // 1. 清除 LocalStorage / Clear LocalStorage
  localStorage.removeItem('bookingCart');
  console.log('[booking-cart] bookingCart 已清除');

  // 2. 按鈕改為成功狀態 / Update button to success state
  $('#confirmPayBtn')
    .removeClass('btn--primary')
    .addClass('btn--outline')
    .html('<i class="bi bi-check-circle-fill"></i> ✓ 預約已成功送出')
    .prop('disabled', true)
    .css({ 'color': 'var(--bk-success)', 'border-color': 'var(--bk-success)' });

  // 隱藏「返回」連結 / Hide back link
  $('#backToRentalLink').hide();

  // 3. 顯示導購橫幅（滑入動畫）/ Show upsell banner with slide
  $('#upsellBanner').slideDown(400);

  // 4. 顯示導購區塊 / Show upsell section
  $('#upsellSection').slideDown(400);

  // 5. 滾動至頁面頂部提示成功 / Scroll to top to show success
  $('html, body').animate({ scrollTop: 0 }, 600);
}

// ============================================================
// 工具函式 / Utility Functions
// ============================================================

/**
 * 將指定 input 標示為錯誤並顯示提示
 * Highlight an input as error and show alert
 *
 * @param {string} selector - jQuery 選擇器
 * @param {string} message  - 錯誤訊息
 */
function highlightError(selector, message) {
  const $input = $(selector);
  // 視覺提示 / Visual feedback
  $input.css('border-color', 'var(--bk-danger)');
  $input.focus();
  // 2 秒後恢復 / Restore after 2s
  setTimeout(() => $input.css('border-color', ''), 2000);
  alert(message);
}
