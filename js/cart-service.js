// ========================================
// Yuruicamp Cart Service
// ========================================

/**
 * Calculates the merchandise subtotal for a cart.
 * @param {Array} cart - Cart items with price and quantity.
 * @returns {number} Cart subtotal.
 */
window.calculateCartTotal = (cart = window.AppState.cart) => {
  return (cart || []).reduce((total, item) => {
    return total + (Number(item.price) || 0) * (Number(item.quantity) || 0);
  }, 0);
};

/**
 * Calculates shipping fee from subtotal and shipping method.
 * @param {number} total - Merchandise subtotal.
 * @param {string} method - Shipping method key.
 * @returns {number} Shipping fee.
 */
window.calculateShippingFee = (total, method = 'delivery') => {
  if (total >= window.AppConfig.CART.FREE_SHIPPING_THRESHOLD) return 0;
  if (method === 'store') return 0;
  return 60;
};

console.log('✓ Cart service 已初始化');
