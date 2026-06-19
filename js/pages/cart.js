// ========================================
// 購物車頁面邏輯 Cart Page Logic
// ========================================
// 此檔案負責：
// 1. 讀取 window.AppState.cart 並渲染商品列表
// 2. 數量 Stepper（+ / -）即時更新金額
// 3. 刪除商品（含 fadeOut 動畫）
// 4. 清空購物車
// 5. 折扣碼套用（選項與規則來自 data/users.json）
// 6. 右側 Order Summary 即時更新
// 7. 前往結帳按鈕的登入狀態檢查

// 目前套用的折扣金額（模組作用域變數）
// Currently applied discount amount (module-scoped variable)
let currentDiscount = 0;

/** 重點：購物車 coupon 清單只載入一次，供 datalist、套用按鈕與結帳前帶值共用。 */
let cartCouponCatalogPromise = null;
let cartCouponCatalog = [];

/** 重點：已套用 coupon code 以陣列管理，讓同一張訂單可連續套用多張 coupon。 */
let appliedCartCouponCodes = [];

/**
 * 初始化購物車頁面
 * Initialize cart page
 * 這是頁面主入口，DOMContentLoaded 後呼叫
 */
window.initCartPage = () => {
  console.log('🛒 購物車頁面初始化...');

  // 渲染購物車 Render cart
  renderCartPage();

  // 綁定折扣碼套用按鈕 Bind coupon apply button
  initCouponBtn();

  // 綁定前往結帳按鈕 Bind checkout button
  initCheckoutBtn();

  // 綁定清空購物車按鈕 Bind clear cart button
  initClearCartBtn();

  // 初始化全局組件 Initialize global components
  window.initNavbar();
  window.initModalListeners();
  window.initCartListeners();
  window.initPersonalizationModal();

  // 標記全局組件已初始化
  // Flag to prevent double-initialization in main.js
  window._appComponentsInitialized = true;
};

async function loadCartCouponCatalog() {
  if (!cartCouponCatalogPromise) {
    cartCouponCatalogPromise = window.YuruiCoupons.loadCoupons()
      .then(coupons => {
        cartCouponCatalog = coupons;
        // 重點：couponInput 的可選項全部來自 data/users.json 的 coupons.code。
        window.YuruiCoupons.renderCouponOptions('cartCouponCodeOptions', coupons);
        return coupons;
      })
      .catch(error => {
        console.error('載入折扣碼清單失敗 / Failed to load coupon catalog:', error);
        return [];
      });
  }

  return cartCouponCatalogPromise;
}

function syncCartAppliedCoupons() {
  const subtotal = window.calculateCartTotal(window.AppState.cart);
  const applied = window.YuruiCoupons.calculateAppliedCoupons(cartCouponCatalog, appliedCartCouponCodes, subtotal);

  currentDiscount = applied.totalDiscount;
  appliedCartCouponCodes = applied.items.map(item => item.code);
  window.YuruiCoupons.renderAppliedCouponTexts('appliedCouponTexts', applied.items);

  // 重點：多張 coupon 以陣列暫存，讓 checkoutCouponInput 下方可還原相同已套用文字。
  if (appliedCartCouponCodes.length > 0) {
    window.YuruiCoupons.saveAppliedCouponCodes(appliedCartCouponCodes);
  } else {
    window.YuruiCoupons.clearAppliedCouponCode();
  }
}

// -----------------------------------------------
// 渲染整個購物車頁面
// Render the entire cart page
// -----------------------------------------------
function renderCartPage() {
  const cart = window.AppState.cart;
  const cartEmpty = document.getElementById('cartEmpty');
  const cartContent = document.getElementById('cartContent');
  const cartItemCount = document.getElementById('cartItemCount');

  if (!cart || cart.length === 0) {
    // 空購物車 Empty cart
    if (cartEmpty) cartEmpty.style.display = 'block';
    if (cartContent) cartContent.style.display = 'none';
    if (cartItemCount) cartItemCount.textContent = '';
  } else {
    // 有商品 Has items
    if (cartEmpty) cartEmpty.style.display = 'none';
    if (cartContent) cartContent.style.display = 'grid';
    if (cartItemCount) {
      const totalQty = cart.reduce((sum, item) => sum + item.quantity, 0);
      cartItemCount.textContent = `共 ${cart.length} 種商品，合計 ${totalQty} 件`;
    }

    // 渲染商品列表 Render items list
    renderCartItems();
  }

  // 更新右側金額摘要 Update right side summary
  updateSummary();
}

// -----------------------------------------------
// 渲染購物車商品列表
// Render cart item cards
// -----------------------------------------------
function renderCartItems() {
  const listEl = document.getElementById('cartItemsList');
  if (!listEl) return;

  const cart = window.AppState.cart;

  // 將每個商品渲染成一張卡片
  // Render each item as a card
  listEl.innerHTML = cart.map(item => `
    <div class="cart-item-card"
         data-product-id="${item.id}"
         style="display:flex;gap:1rem;padding:1.25rem;border-bottom:1px solid #f0f0f0;transition:opacity 0.3s ease,max-height 0.3s ease;align-items:flex-start;">

      <!-- 商品圖片 Product image -->
      <a href="product-detail.html?id=${item.id}" style="flex-shrink:0;">
        <img src="${item.image || 'https://picsum.photos/seed/default/80/80'}"
             alt="${item.name}"
             style="width:88px;height:88px;object-fit:cover;border-radius:8px;border:1px solid #f0f0f0;">
      </a>

      <!-- 商品資訊 Product info -->
      <div style="flex:1;min-width:0;">
        <!-- 品牌 Brand -->
        <div style="font-size:0.78rem;color:#244d4d;font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin-bottom:0.2rem;">
          ${item.brand || ''}
        </div>
        <!-- 商品名稱 Name (可能包含規格) -->
        <a href="product-detail.html?id=${item.id}"
           style="display:block;font-weight:600;color:#1a1a1a;font-size:0.95rem;text-decoration:none;margin-bottom:0.5rem;line-height:1.4;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;"
           title="${item.name}">
          ${item.name}
        </a>
        <!-- 單價 Unit price -->
        <div style="font-size:0.875rem;color:#6b7280;margin-bottom:0.75rem;">
          單價：${window.formatCurrency(item.price)}
        </div>

        <!-- 底部：數量 stepper + 小計 + 刪除 -->
        <div style="display:flex;align-items:center;gap:1rem;flex-wrap:wrap;">
          <!-- 數量 Stepper -->
          <div class="qty-stepper" style="display:flex;align-items:center;border:1px solid #e5e7eb;border-radius:6px;overflow:hidden;">
            <button class="qty-btn cart-page-decrease"
                    data-product-id="${item.id}"
                    type="button"
                    style="width:32px;height:32px;border:none;background:#f9fafb;cursor:pointer;font-size:1.1rem;color:#374151;display:flex;align-items:center;justify-content:center;">−</button>
            <span class="cart-page-qty"
                  data-product-id="${item.id}"
                  style="width:36px;text-align:center;font-weight:600;color:#1a1a1a;font-size:0.9rem;">${item.quantity}</span>
            <button class="qty-btn cart-page-increase"
                    data-product-id="${item.id}"
                    type="button"
                    style="width:32px;height:32px;border:none;background:#f9fafb;cursor:pointer;font-size:1.1rem;color:#374151;display:flex;align-items:center;justify-content:center;">+</button>
          </div>

          <!-- 小計 Item subtotal -->
          <div class="cart-item-subtotal"
               data-product-id="${item.id}"
               style="font-weight:700;color:#244d4d;font-size:1rem;">
            ${window.formatCurrency(item.price * item.quantity)}
          </div>

          <!-- 刪除按鈕 Delete button -->
          <button class="cart-page-remove"
                  data-product-id="${item.id}"
                  type="button"
                  title="移除此商品"
                  style="margin-left:auto;background:none;border:none;color:#9ca3af;cursor:pointer;font-size:1.1rem;padding:0.25rem;border-radius:4px;transition:color 0.2s;">
            🗑️
          </button>
        </div>
      </div>

    </div>
  `).join('');

  // 綁定購物車商品的按鈕事件
  // Bind button events for cart items
  bindCartItemEvents();
}

// -----------------------------------------------
// 綁定購物車商品操作按鈕的事件
// Bind events for cart item action buttons
// 用事件委派（Event Delegation）提升效能：
// 只在父元素上設一個監聽器，不用對每個按鈕設監聽
// -----------------------------------------------
function bindCartItemEvents() {
  const listEl = document.getElementById('cartItemsList');
  if (!listEl) return;

  // 移除舊的事件監聽器（防止重複綁定）
  // Remove old listener (prevent duplicate binding)
  const newListEl = listEl.cloneNode(true);
  listEl.parentNode.replaceChild(newListEl, listEl);

  newListEl.addEventListener('click', (e) => {
    const target = e.target;

    // 點擊「+」增加數量 Increase quantity
    if (target.classList.contains('cart-page-increase')) {
      const productId = target.dataset.productId;
      const item = window.AppState.cart.find(i => i.id === productId);
      if (item && item.quantity < 99) {
        item.quantity += 1;
        window.saveAppState();
        window.updateCartBadge();
        updateItemDisplay(productId, item.quantity, item.price);
        updateSummary();
      }
      return;
    }

    // 點擊「-」減少數量 Decrease quantity
    if (target.classList.contains('cart-page-decrease')) {
      const productId = target.dataset.productId;
      const item = window.AppState.cart.find(i => i.id === productId);
      if (item) {
        if (item.quantity <= 1) {
          // 數量為 1 時再減，詢問是否刪除（這裡直接刪除）
          // When quantity is 1, remove the item
          removeCartItemWithAnimation(productId);
        } else {
          item.quantity -= 1;
          window.saveAppState();
          window.updateCartBadge();
          updateItemDisplay(productId, item.quantity, item.price);
          updateSummary();
        }
      }
      return;
    }

    // 點擊刪除按鈕 Remove button
    if (target.classList.contains('cart-page-remove')) {
      const productId = target.dataset.productId;
      removeCartItemWithAnimation(productId);
      return;
    }
  });
}

/**
 * 即時更新購物車商品的數量顯示和小計
 * Immediately update quantity display and item subtotal
 * @param {string} productId - 商品 ID
 * @param {number} qty - 新數量
 * @param {number} price - 單價
 */
function updateItemDisplay(productId, qty, price) {
  // 更新數量文字 Update quantity text
  const qtyEl = document.querySelector(`.cart-page-qty[data-product-id="${productId}"]`);
  if (qtyEl) qtyEl.textContent = qty;

  // 更新小計 Update item subtotal
  const subtotalEl = document.querySelector(`.cart-item-subtotal[data-product-id="${productId}"]`);
  if (subtotalEl) subtotalEl.textContent = window.formatCurrency(price * qty);
}

/**
 * 刪除商品（含淡出動畫）
 * Remove item with fade-out animation
 * @param {string} productId - 商品 ID
 */
function removeCartItemWithAnimation(productId) {
  const card = document.querySelector(`.cart-item-card[data-product-id="${productId}"]`);

  if (card) {
    // Step 1: 先淡出（opacity 漸變到 0）
    // Step 1: Fade out (opacity to 0)
    card.style.opacity = '0';
    card.style.overflow = 'hidden';

    // Step 2: 等 300ms 後（動畫完成）再從 DOM 移除並更新資料
    // Step 2: After 300ms animation, remove from DOM and update state
    setTimeout(() => {
      // 從 AppState 移除商品 Remove from AppState
      window.AppState.cart = window.AppState.cart.filter(i => i.id !== productId);
      window.saveAppState();
      window.updateCartBadge();

      // 重新渲染整個購物車（因為需要處理空購物車狀態）
      // Re-render cart (need to handle empty state)
      renderCartPage();

      window.showToast('已從購物車移除', 'info');
    }, 300);
  } else {
    // 若找不到卡片（不正常情況），直接移除
    window.removeFromCart(productId);
    renderCartPage();
  }
}

// -----------------------------------------------
// 更新右側訂單摘要
// Update right-side order summary
// -----------------------------------------------
function updateSummary() {
  const cart = window.AppState.cart;
  const subtotal = window.calculateCartTotal(cart);
  const shipping = window.calculateShippingFee(subtotal);

  if (cartCouponCatalog.length > 0) {
    syncCartAppliedCoupons();
  }

  const total = subtotal - currentDiscount + shipping;

  // 更新小計 Update subtotal
  const subtotalEl = document.getElementById('summarySubtotal');
  if (subtotalEl) subtotalEl.textContent = window.formatCurrency(subtotal);

  // 更新運費 Update shipping
  const shippingEl = document.getElementById('summaryShipping');
  const freeHint = document.getElementById('freeShippingHint');
  if (shippingEl) {
    if (shipping === 0) {
      shippingEl.textContent = '免費 🎉';
      shippingEl.style.color = '#16a34a';
      if (freeHint) freeHint.style.display = 'block';
    } else {
      shippingEl.textContent = window.formatCurrency(shipping);
      shippingEl.style.color = '#374151';
      if (freeHint) freeHint.style.display = 'none';
    }
  }

  // 更新折扣金額顯示 Update discount display
  const discountRow = document.getElementById('summaryDiscountRow');
  const discountEl = document.getElementById('summaryDiscount');
  if (discountRow && discountEl) {
    if (currentDiscount > 0) {
      discountRow.style.display = 'flex';
      discountEl.textContent = `-${window.formatCurrency(currentDiscount)}`;
    } else {
      discountRow.style.display = 'none';
    }
  }

  // 更新總計 Update total
  const totalEl = document.getElementById('summaryTotal');
  if (totalEl) totalEl.textContent = window.formatCurrency(Math.max(total, 0));
}

// -----------------------------------------------
// 初始化折扣碼套用功能
// Initialize coupon code apply feature
// -----------------------------------------------
function initCouponBtn() {
  const applyBtn = document.getElementById('applyCouponBtn');
  const couponInput = document.getElementById('couponInput');
  const couponMsg = document.getElementById('couponMessage');

  if (!applyBtn || !couponInput) return;

  loadCartCouponCatalog();

  applyBtn.addEventListener('click', async () => {
    const code = couponInput.value.trim().toUpperCase();
    const coupons = await loadCartCouponCatalog();
    const subtotal = window.calculateCartTotal(window.AppState.cart);
    const result = window.YuruiCoupons.validateCoupon(coupons, code, subtotal);

    if (!result.valid) {
      // 重點：無效 code 不會帶到 checkoutCouponInput，避免結帳頁延續錯誤折扣碼。
      currentDiscount = 0;
      window.YuruiCoupons.clearAppliedCouponCode();
      showCouponMessage(`❌ ${result.message}`, 'error');
      updateSummary();
      return;
    }

    if (appliedCartCouponCodes.includes(result.code)) {
      showCouponMessage(`「${result.code}」已套用，請選擇其他折扣碼`, 'error');
      couponInput.value = '';
      return;
    }

    // 折扣碼有效 Valid coupon code
    appliedCartCouponCodes.push(result.code);
    syncCartAppliedCoupons();
    showCouponMessage(`✅ ${result.message}！${result.label}，折抵 NT$${result.discount.toLocaleString('zh-TW')}`, 'success');
    // 重點：成功後清空 input，不停用欄位，讓使用者可繼續輸入或選取下一張 coupon。
    couponInput.value = '';
    updateSummary();
    window.showToast(`折扣碼套用成功！折抵 NT$${result.discount.toLocaleString('zh-TW')}`, 'success');
  });

  // 按 Enter 也能套用 Also apply on Enter key
  couponInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      applyBtn.click();
    }
  });
}

async function persistValidCouponInputForCheckout() {
  const couponInput = document.getElementById('couponInput');
  if (!couponInput || !couponInput.value.trim()) {
    window.YuruiCoupons.clearAppliedCouponCode();
    return;
  }

  const coupons = await loadCartCouponCatalog();
  const subtotal = window.calculateCartTotal(window.AppState.cart);
  const result = window.YuruiCoupons.validateCoupon(coupons, couponInput.value, subtotal);

  // 重點：即使使用者只輸入 / 選取正確 code 尚未按套用，也會在前往結帳前把 value 帶到 checkoutCouponInput。
  if (result.valid && !appliedCartCouponCodes.includes(result.code)) {
    appliedCartCouponCodes.push(result.code);
    couponInput.value = '';
  }

  syncCartAppliedCoupons();

  if (appliedCartCouponCodes.length === 0) {
    window.YuruiCoupons.clearAppliedCouponCode();
  }
}

/**
 * 顯示折扣碼訊息
 * Show coupon message
 * @param {string} message - 訊息文字
 * @param {'success'|'error'} type - 訊息類型
 */
function showCouponMessage(message, type) {
  const msgEl = document.getElementById('couponMessage');
  if (!msgEl) return;

  msgEl.textContent = message;
  msgEl.style.display = 'block';
  msgEl.style.color = type === 'success' ? '#16a34a' : '#ef4444';
}

// -----------------------------------------------
// 初始化前往結帳按鈕
// Initialize checkout button
// -----------------------------------------------
function initCheckoutBtn() {
  const checkoutBtn = document.getElementById('checkoutBtn');
  if (!checkoutBtn) return;

  checkoutBtn.addEventListener('click', async () => {
    const cart = window.AppState.cart;

    // 購物車為空時不能結帳 Cannot checkout with empty cart
    if (!cart || cart.length === 0) {
      window.showToast('購物車是空的，請先加入商品', 'warning');
      return;
    }

    // 檢查登入狀態 Check login status
    if (!window.AppState.isLoggedIn) {
      // 未登入：開啟登入 Modal
      // Not logged in: open login modal
      window.showToast('請先登入再結帳', 'info');
      window.openModal('loginModal');
    } else {
      // 已登入：跳轉到結帳頁
      // Logged in: redirect to checkout page
      await persistValidCouponInputForCheckout();
      window.location.href = 'checkout.html';
    }
  });
}

// -----------------------------------------------
// 初始化清空購物車按鈕
// Initialize clear cart button
// -----------------------------------------------
function initClearCartBtn() {
  const clearBtn = document.getElementById('clearCartBtn');
  if (!clearBtn) return;

  clearBtn.addEventListener('click', () => {
    // 簡單確認 Simple confirmation
    if (window.AppState.cart.length === 0) return;

    if (confirm('確定要清空購物車嗎？')) {
      window.clearCart();
      currentDiscount = 0;
      appliedCartCouponCodes = [];
      window.YuruiCoupons.clearAppliedCouponCode();
      window.YuruiCoupons.renderAppliedCouponTexts('appliedCouponTexts', []);
      renderCartPage();
      window.showToast('購物車已清空', 'info');
    }
  });
}

// ========================================
// 頁面自動初始化
// Auto-initialize when DOM is ready
// ========================================
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initCartPage);
} else {
  window.initCartPage();
}

console.log('✓ cart.js 已載入');
