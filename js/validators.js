// ========================================
// Yuruicamp Validators
// ========================================

/**
 * Validates a basic email address format before form submission.
 * @param {string} email - Email input.
 * @returns {boolean} Whether email is valid.
 */
window.isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ''));

/**
 * Validates Taiwan-style phone numbers after removing visual separators.
 * @param {string} phone - Phone input.
 * @returns {boolean} Whether phone is valid.
 */
window.isValidPhone = (phone) => {
  const normalizedPhone = String(phone || '').replace(/[\s\-()]/g, '');
  return /^(\+886|886|0)[1-9]\d{1,9}$/.test(normalizedPhone);
};

console.log('✓ Validators 已初始化');
