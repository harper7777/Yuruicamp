// ========================================
// 結帳頁面邏輯 Checkout Page Logic
// ========================================
// 此檔案負責：
// 1. 渲染右側商品清單（從 window.AppState.cart）
// 2. 計算並顯示小計、運費、折扣、總計
// 3. 手風琴面板展開/收合邏輯
// 4. 物流選擇變更 → 即時更新右側運費
// 5. 付款方式選擇 → 顯示/隱藏信用卡輸入框
// 6. 「帶入會員資料」按鈕
// 7. 「確認結帳」按鈕：驗證 → 建立訂單 → 清空購物車 → 跳轉

// 目前套用的折扣 Currently applied discount
let checkoutDiscount = 0;

/** 重點：結帳頁 coupon 清單與購物車頁共用 data/users.json，避免兩頁可用 code 不一致。 */
let checkoutCouponCatalogPromise = null;
let checkoutCouponCatalog = [];

/** 重點：結帳頁保留多張已套用 coupon，讓使用者可從購物車帶入後再繼續套用。 */
let appliedCheckoutCouponCodes = [];

// 目前選擇的物流方式 Currently selected shipping method
let selectedShippingMethod = 'delivery';

/**
 * 初始化結帳頁面
 * Initialize checkout page
 */
window.initCheckoutPage = () => {
  console.log('📋 結帳頁面初始化...');

  // 若購物車為空，跳回購物車頁
  // If cart is empty, redirect back to cart page
  if (!window.AppState.cart || window.AppState.cart.length === 0) {
    window.showToast('購物車是空的，請先加入商品', 'warning');
    setTimeout(() => {
      window.location.href = 'cart.html';
    }, 1500);
    return;
  }

  // 渲染右側商品清單 Render order item list on the right
  renderCheckoutItems();

  // 計算並渲染金額摘要 Calculate and render price summary
  updateCheckoutSummary();

  // 初始化手風琴面板 Initialize accordion panels
  initAccordionPanels();

  // 初始化物流選擇事件 Initialize shipping method change event
  initShippingMethodChange();

  // 初始化付款方式選擇事件 Initialize payment method change event
  initPaymentMethodChange();

  // 初始化「帶入會員資料」按鈕 Initialize fill-profile button
  initFillProfileBtn();

  // 初始化「確認結帳」按鈕 Initialize confirm order button
  initConfirmOrderBtn();

  // 初始化折扣碼 Initialize coupon code
  initCheckoutCoupon();

  // 初始化全局組件 Initialize global components
  window.initNavbar();
  window.initModalListeners();
  window.initCartListeners();
  window.initPersonalizationModal();

  // 標記已初始化 Flag as initialized
  window._appComponentsInitialized = true;
};

async function loadCheckoutCouponCatalog() {
  if (!checkoutCouponCatalogPromise) {
    checkoutCouponCatalogPromise = window.YuruiCoupons.loadCoupons()
      .then(coupons => {
        checkoutCouponCatalog = coupons;
        // 重點：checkoutCouponInput 的 datalist 選項全部來自 data/users.json 的 coupons.code。
        window.YuruiCoupons.renderCouponOptions('checkoutCouponCodeOptions', coupons);
        return coupons;
      })
      .catch(error => {
        console.error('載入結帳折扣碼清單失敗 / Failed to load checkout coupon catalog:', error);
        return [];
      });
  }

  return checkoutCouponCatalogPromise;
}

function syncCheckoutAppliedCoupons() {
  const subtotal = window.calculateCartTotal(window.AppState.cart);
  const applied = window.YuruiCoupons.calculateAppliedCoupons(checkoutCouponCatalog, appliedCheckoutCouponCodes, subtotal);

  checkoutDiscount = applied.totalDiscount;
  appliedCheckoutCouponCodes = applied.items.map(item => item.code);
  window.YuruiCoupons.renderAppliedCouponTexts('checkoutAppliedCouponTexts', applied.items);

  // 重點：結帳頁新增的 coupon 也會回寫暫存，重新整理後仍能顯示在 input 下方。
  if (appliedCheckoutCouponCodes.length > 0) {
    window.YuruiCoupons.saveAppliedCouponCodes(appliedCheckoutCouponCodes);
  } else {
    window.YuruiCoupons.clearAppliedCouponCode();
  }
}

// -----------------------------------------------
// 渲染右側商品清單
// Render checkout items list on the right side
// -----------------------------------------------
function renderCheckoutItems() {
  const listEl = document.getElementById('checkoutItemsList');
  if (!listEl) return;

  const cart = window.AppState.cart;

  listEl.innerHTML = cart.map(item => `
    <div style="display:flex;gap:0.75rem;align-items:flex-start;padding-bottom:0.875rem;margin-bottom:0.875rem;border-bottom:1px solid #f0f0f0;">
      <!-- 商品圖片 Product image -->
      <div style="position:relative;flex-shrink:0;">
        <img src="${item.image || 'https://picsum.photos/seed/default/60/60'}"
             alt="${item.name}"
             style="width:56px;height:56px;object-fit:cover;border-radius:6px;border:1px solid #e5e7eb;">
        <!-- 數量小標籤 Quantity badge -->
        <span style="position:absolute;top:-6px;right:-6px;background:#244d4d;color:#fff;font-size:0.7rem;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center;">${item.quantity}</span>
      </div>

      <!-- 商品名稱和價格 Name and price -->
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.875rem;font-weight:600;color:#1a1a1a;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="${item.name}">
          ${item.name}
        </div>
        ${item.brand ? `<div style="font-size:0.75rem;color:#9ca3af;margin-top:0.1rem;">${item.brand}</div>` : ''}
      </div>

      <!-- 小計 Subtotal -->
      <div style="font-weight:700;color:#374151;font-size:0.9rem;flex-shrink:0;">
        ${window.formatCurrency(item.price * item.quantity)}
      </div>
    </div>
  `).join('');
}

// -----------------------------------------------
// 更新右側金額摘要
// Update right-side price summary
// -----------------------------------------------
function updateCheckoutSummary() {
  const cart = window.AppState.cart;
  const subtotal = window.calculateCartTotal(cart);

  // 計算運費：依照選擇的物流方式
  // Calculate shipping fee based on selected method
  const shipping = window.calculateShippingFee(subtotal, selectedShippingMethod);

  if (checkoutCouponCatalog.length > 0) {
    syncCheckoutAppliedCoupons();
  }

  const total = Math.max(subtotal - checkoutDiscount + shipping, 0);

  // 更新 DOM Update DOM
  const subtotalEl = document.getElementById('checkoutSubtotal');
  if (subtotalEl) subtotalEl.textContent = window.formatCurrency(subtotal);

  const shippingEl = document.getElementById('checkoutShipping');
  if (shippingEl) {
    if (shipping === 0) {
      shippingEl.textContent = '免費 🎉';
      shippingEl.style.color = '#16a34a';
    } else {
      shippingEl.textContent = window.formatCurrency(shipping);
      shippingEl.style.color = '#374151';
    }
  }

  const discountRow = document.getElementById('checkoutDiscountRow');
  const discountEl = document.getElementById('checkoutDiscount');
  if (discountRow && discountEl) {
    if (checkoutDiscount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-${window.formatCurrency(checkoutDiscount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  const totalEl = document.getElementById('checkoutTotal');
  if (totalEl) totalEl.textContent = window.formatCurrency(total);
}

// -----------------------------------------------
// 手風琴面板展開/收合邏輯
// Accordion panel expand/collapse logic
//
// 運作方式：
// - HTML 中每個面板由 .checkout-panel 包裝
// - 標頭：.checkout-panel-header（點擊觸發）
// - 內容：.checkout-panel-body（控制顯示/隱藏）
// - 有 .open class 的面板預設展開
// -----------------------------------------------
function initAccordionPanels() {
  const headers = document.querySelectorAll('.checkout-panel-header');

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const panelId = header.dataset.panel;
      const panel = document.getElementById(`panel-${panelId}`);
      if (!panel) return;

      const body = panel.querySelector('.checkout-panel-body');
      const arrow = panel.querySelector('.panel-arrow');
      const isOpen = panel.classList.contains('open');

      if (isOpen) {
        // 收合：隱藏 body，移除 open，旋轉箭頭
        // Collapse: hide body, remove open, rotate arrow
        panel.classList.remove('open');
        if (body) body.style.display = 'none';
        if (arrow) arrow.style.transform = 'rotate(-90deg)';

        // 更新面板 border-radius（收合時四角都圓）
        header.style.borderRadius = '12px';
      } else {
        // 展開：顯示 body，加上 open，還原箭頭
        // Expand: show body, add open, restore arrow
        panel.classList.add('open');
        if (body) {
          body.style.display = 'block';
        }
        if (arrow) arrow.style.transform = 'rotate(0deg)';

        // 更新面板 border-radius（展開時上方圓、下方直）
        header.style.borderRadius = '12px 12px 0 0';
      }
    });
  });
}

// -----------------------------------------------
// 初始化物流方式選擇事件
// Initialize shipping method change event
// 物流選擇改變時：
// 1. 更新 selectedShippingMethod
// 2. 即時更新右側運費金額
// 3. 顯示/隱藏送達地址輸入框
// 4. 更新 radio-option 的高亮邊框
// -----------------------------------------------
function initShippingMethodChange() {
  const shippingRadios = document.querySelectorAll('input[name="shippingMethod"]');
  const addressSection = document.getElementById('deliveryAddressSection');

  shippingRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      selectedShippingMethod = radio.value;

      // 即時更新金額摘要 Update price summary
      updateCheckoutSummary();

      // 顯示/隱藏地址欄位 Show/hide address field
      if (addressSection) {
        addressSection.style.display = selectedShippingMethod === 'delivery' ? 'block' : 'none';
      }

      // 更新 radio-option 的高亮邊框樣式
      // Update radio option highlight border styles
      document.querySelectorAll('input[name="shippingMethod"]').forEach(r => {
        const label = r.closest('label');
        if (label) {
          label.style.borderColor = r.checked ? '#244d4d' : '#e5e7eb';
          label.style.background = r.checked ? '#f0faf8' : '#fff';
        }
      });
    });
  });
}

// -----------------------------------------------
// 初始化付款方式選擇事件
// Initialize payment method change event
// 選擇信用卡時顯示信用卡輸入框
// -----------------------------------------------
function initPaymentMethodChange() {
  const paymentRadios = document.querySelectorAll('input[name="paymentMethod"]');
  const creditCardSection = document.getElementById('creditCardSection');

  paymentRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      // 信用卡輸入框顯示/隱藏 Show/hide credit card section
      if (creditCardSection) {
        creditCardSection.style.display = radio.value === 'credit' ? 'block' : 'none';
      }

      // 更新 radio-option 的高亮邊框樣式
      // Update radio option highlight border styles
      document.querySelectorAll('input[name="paymentMethod"]').forEach(r => {
        const label = r.closest('label');
        if (label) {
          label.style.borderColor = r.checked ? '#244d4d' : '#e5e7eb';
          label.style.background = r.checked ? '#f0faf8' : '#fff';
        }
      });

      // 格式化信用卡號（只在信用卡模式）Format card number input
      if (radio.value === 'credit') {
        initCardNumberFormat();
      }
    });
  });

  // 預設已選信用卡，初始化格式化
  initCardNumberFormat();
}

/**
 * 信用卡號格式化：自動插入空格（1234 5678 9012 3456）
 * Credit card number auto-formatting: insert spaces
 */
function initCardNumberFormat() {
  const cardInput = document.getElementById('cardNumber');
  if (!cardInput || cardInput._formatted) return; // 防止重複綁定

  cardInput._formatted = true;
  cardInput.addEventListener('input', (e) => {
    // 移除非數字字符，每 4 位加空格
    // Remove non-digits, add space every 4 digits
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    e.target.value = val.replace(/(.{4})/g, '$1 ').trim();
  });

  const expiryInput = document.getElementById('cardExpiry');
  if (expiryInput && !expiryInput._formatted) {
    expiryInput._formatted = true;
    expiryInput.addEventListener('input', (e) => {
      let val = e.target.value.replace(/\D/g, '').substring(0, 4);
      if (val.length > 2) {
        val = val.substring(0, 2) + ' / ' + val.substring(2);
      }
      e.target.value = val;
    });
  }
}

// -----------------------------------------------
// 「帶入會員資料」按鈕邏輯
// Fill-profile button logic
// 若已登入，自動填入姓名 / Email
// -----------------------------------------------
function initFillProfileBtn() {
  const btn = document.getElementById('fillProfileBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    if (!window.AppState.isLoggedIn || !window.AppState.currentUser) {
      // 未登入提示 Not logged in hint
      window.showToast('請先登入才能帶入會員資料', 'info');
      window.openModal('loginModal');
      return;
    }

    const user = window.AppState.currentUser;

    // 填入表單 Fill form fields
    const nameInput = document.getElementById('buyerName');
    const phoneInput = document.getElementById('buyerPhone');
    const emailInput = document.getElementById('buyerEmail');

    if (nameInput && user.name) nameInput.value = user.name;
    if (phoneInput && user.phone) phoneInput.value = user.phone;
    if (emailInput && user.email) emailInput.value = user.email;

    window.showToast('已帶入會員資料', 'success');
  });
}

// -----------------------------------------------
// 折扣碼套用（結帳頁版本）
// Checkout coupon code apply
// -----------------------------------------------
function initCheckoutCoupon() {
  const applyBtn = document.getElementById('checkoutApplyCouponBtn');
  const couponInput = document.getElementById('checkoutCouponInput');
  const couponMsg = document.getElementById('checkoutCouponMsg');

  if (!applyBtn || !couponInput) return;

  loadCheckoutCouponCatalog().then(async () => {
    const carriedCodes = window.YuruiCoupons.getAppliedCouponCodes();
    if (carriedCodes.length === 0) return;

    // 重點：若購物車頁已有正確 couponInput value，結帳頁會轉成 checkoutCouponInput 下方文字並同步折扣。
    appliedCheckoutCouponCodes = carriedCodes;
    syncCheckoutAppliedCoupons();
    updateCheckoutSummary();
  });

  applyBtn.addEventListener('click', async () => {
    await applyCheckoutCouponCode();
  });

  couponInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyBtn.click();
    }
  });
}

async function applyCheckoutCouponCode({ showToast = true } = {}) {
  const applyBtn = document.getElementById('checkoutApplyCouponBtn');
  const couponInput = document.getElementById('checkoutCouponInput');
  const couponMsg = document.getElementById('checkoutCouponMsg');

  if (!applyBtn || !couponInput) return;

  const code = couponInput.value.trim().toUpperCase();
  const coupons = await loadCheckoutCouponCatalog();
  const subtotal = window.calculateCartTotal(window.AppState.cart);
  const result = window.YuruiCoupons.validateCoupon(coupons, code, subtotal);

  if (!result.valid) {
    // 重點：無效輸入只顯示錯誤，不影響已成功套用並顯示在 input 下方的 coupon。
    showMsg(couponMsg, `❌ ${result.message}`, 'error');
    updateCheckoutSummary();
    return;
  }

  if (appliedCheckoutCouponCodes.includes(result.code)) {
    showMsg(couponMsg, `「${result.code}」已套用，請選擇其他折扣碼`, 'error');
    couponInput.value = '';
    return;
  }

  appliedCheckoutCouponCodes.push(result.code);
  syncCheckoutAppliedCoupons();
  showMsg(couponMsg, `✅ 折抵 NT$${result.discount.toLocaleString('zh-TW')}（${result.label}）`, 'success');
  // 重點：成功後清空 input，不停用欄位，讓 checkoutCouponInput 可繼續套用其他 coupon。
  couponInput.value = '';
  updateCheckoutSummary();

  if (showToast && window.showToast) {
    window.showToast(`折扣碼套用成功！折抵 NT$${result.discount.toLocaleString('zh-TW')}`, 'success');
  }
}

/**
 * 顯示折扣碼訊息
 * @param {HTMLElement} el - 訊息 DOM 元素
 * @param {string} msg - 訊息文字
 * @param {'success'|'error'} type - 類型
 */
function showMsg(el, msg, type) {
  if (!el) return;
  el.textContent = msg;
  el.style.display = 'block';
  el.style.color = type === 'success' ? '#16a34a' : '#ef4444';
}

// -----------------------------------------------
// 「確認結帳」按鈕邏輯
// Confirm order button logic
// 1. 驗證必填欄位
// 2. 呼叫 window.API.orders.create()
// 3. 清空購物車
// 4. 跳轉到成功頁
// -----------------------------------------------
function initConfirmOrderBtn() {
  const confirmBtn = document.getElementById('confirmOrderBtn');
  if (!confirmBtn) return;

  confirmBtn.addEventListener('click', async () => {
    // ---- Step 1: 驗證必填欄位 Validate required fields ----
    const buyerName  = document.getElementById('buyerName')?.value.trim();
    const buyerPhone = document.getElementById('buyerPhone')?.value.trim();
    const buyerEmail = document.getElementById('buyerEmail')?.value.trim();
    const deliveryAddress = document.getElementById('deliveryAddress')?.value.trim();

    if (!buyerName) {
      window.showToast('請填寫姓名', 'warning');
      document.getElementById('buyerName')?.focus();
      return;
    }
    if (!buyerPhone) {
      window.showToast('請填寫電話', 'warning');
      document.getElementById('buyerPhone')?.focus();
      return;
    }
    if (!buyerEmail) {
      window.showToast('請填寫 Email', 'warning');
      document.getElementById('buyerEmail')?.focus();
      return;
    }
    if (!window.isValidEmail(buyerEmail)) {
      window.showToast('Email 格式不正確', 'warning');
      document.getElementById('buyerEmail')?.focus();
      return;
    }
    if (selectedShippingMethod === 'delivery' && !deliveryAddress) {
      window.showToast('請填寫送達地址', 'warning');
      document.getElementById('deliveryAddress')?.focus();
      return;
    }

    // ---- Step 2: 準備訂單資料 Prepare order data ----
    const cart = window.AppState.cart;
    const subtotal = window.calculateCartTotal(cart);
    const shipping = window.calculateShippingFee(subtotal, selectedShippingMethod);
    const total = Math.max(subtotal - checkoutDiscount + shipping, 0);

    const selectedPayment = document.querySelector('input[name="paymentMethod"]:checked')?.value || 'credit';
    const buyerNote = document.getElementById('buyerNote')?.value.trim() || '';

    const orderData = {
      userId: window.AppState.currentUser?.id || 'guest',
      buyerName,
      buyerPhone,
      buyerEmail,
      buyerNote,
      shippingMethod: selectedShippingMethod,
      deliveryAddress: selectedShippingMethod === 'delivery' ? deliveryAddress : '門市取貨',
      paymentMethod: selectedPayment,
      items: cart.map(item => ({
        productId: item.id,
        name: item.name,
        brand: item.brand,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.price * item.quantity,
      })),
      subtotal,
      shippingFee: shipping,
      discount: checkoutDiscount,
      total,
    };

    // ---- Step 3: 送出訂單 Submit order ----
    // 顯示載入中狀態 Show loading state
    confirmBtn.disabled = true;
    confirmBtn.textContent = '⏳ 處理中...';

    try {
      const newOrder = await window.API.orders.create(orderData);
      console.log('✅ 訂單建立成功:', newOrder);

      // Step 4: 清空購物車 Clear cart
      window.clearCart();
      appliedCheckoutCouponCodes = [];
      window.YuruiCoupons.clearAppliedCouponCode();

      // Step 5: 跳轉到成功頁，帶上訂單編號
      // Redirect to success page with order number
      const orderNum = newOrder.id || `ORD-${Date.now()}`;
      window.location.href = `checkout-success.html?orderNum=${orderNum}`;

    } catch (error) {
      console.error('❌ 訂單建立失敗:', error);
      window.showToast('訂單提交失敗，請稍後再試', 'error');
      confirmBtn.disabled = false;
      confirmBtn.textContent = '🔒 確認結帳';
    }
  });
}

// ========================================
// 頁面自動初始化
// Auto-initialize when DOM is ready
// ========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initCheckoutPage);
} else {
  window.initCheckoutPage();
}

console.log('✓ checkout.js 已載入');
