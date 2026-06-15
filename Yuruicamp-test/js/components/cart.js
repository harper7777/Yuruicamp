// ========================================
// 購物車組件
// ========================================

/**
 * 添加商品到購物車
 * @param {Object} product - 商品對象 {id, name, price, image}
 * @param {number} quantity - 數量
 */
window.addToCart = (product, quantity = 1) => {
  const existingItem = window.AppState.cart.find(item => item.id === product.id);
  
  if (existingItem) {
    existingItem.quantity += quantity;
  } else {
    window.AppState.cart.push({
      ...product,
      quantity,
    });
  }
  
  window.saveAppState();
  window.updateCartBadge();
  window.showToast(`已加入購物車`, 'success');
};

/**
 * 從購物車移除商品
 * @param {string} productId - 商品 ID
 */
window.removeFromCart = (productId) => {
  window.AppState.cart = window.AppState.cart.filter(item => item.id !== productId);
  window.saveAppState();
  window.updateCartBadge();
  window.showToast('已從購物車移除', 'info');
};

/**
 * 更新購物車商品數量
 * @param {string} productId - 商品 ID
 * @param {number} quantity - 新數量
 */
window.updateCartQuantity = (productId, quantity) => {
  const item = window.AppState.cart.find(item => item.id === productId);
  
  if (item) {
    if (quantity <= 0) {
      window.removeFromCart(productId);
    } else if (quantity <= window.AppConfig.CART.MAX_QUANTITY) {
      item.quantity = quantity;
      window.saveAppState();
      window.updateCartBadge();
    }
  }
};

/**
 * 清空購物車
 */
window.clearCart = () => {
  window.AppState.cart = [];
  window.saveAppState();
  window.updateCartBadge();
};

/**
 * 初始化購物車面板事件
 */
window.initCartListeners = () => {
  // 購物車中數量增減
  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('cart-qty-increase')) {
      const productId = e.target.dataset.productId;
      const item = window.AppState.cart.find(i => i.id === productId);
      if (item) {
        window.updateCartQuantity(productId, item.quantity + 1);
      }
    }
    
    if (e.target.classList.contains('cart-qty-decrease')) {
      const productId = e.target.dataset.productId;
      const item = window.AppState.cart.find(i => i.id === productId);
      if (item) {
        window.updateCartQuantity(productId, item.quantity - 1);
      }
    }
    
    if (e.target.classList.contains('cart-remove-btn')) {
      const productId = e.target.dataset.productId;
      window.removeFromCart(productId);
    }
  });
};

console.log('✓ Cart 組件已初始化');
