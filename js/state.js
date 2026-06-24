// ========================================
// Yuruicamp Application State
// ========================================

const APP_RESET_STORAGE_KEYS = [
  'isLoggedIn',
  'currentUser',
  'yuruiUser',
  'cart',
  'preferences',
  'theme',
  'memberProfile',
  'bookingCart',
  'mockOrders',
  'mockUserPointDeltas',
];

/**
 * Resolves the login flag while keeping legacy stored users compatible.
 * @param {string|null} storedFlag - Raw localStorage isLoggedIn value.
 * @param {Object|null} storedUser - Stored auth user.
 * @returns {boolean} Current login state.
 */
function _resolveStoredLoginState(storedFlag, storedUser) {
  if (storedFlag === 'true') return true;
  if (storedFlag === 'false') return false;
  return Boolean(storedUser);
}

const _storedAuthUser = window.YuruiStorage.readAuthUser();

/**
 * Stores mutable runtime state shared by main-site components.
 */
window.AppState = {
  isLoggedIn: _resolveStoredLoginState(localStorage.getItem('isLoggedIn'), _storedAuthUser),
  currentUser: _storedAuthUser,
  cart: window.YuruiStorage.readJson('cart', []),
  preferences: window.YuruiStorage.readJson('preferences', {}),
  theme: localStorage.getItem('theme') || 'light',
};

/**
 * Persists the current AppState fields that must survive page navigation.
 */
window.saveAppState = () => {
  window.YuruiStorage.writeJson('isLoggedIn', Boolean(window.AppState.isLoggedIn));
  window.YuruiStorage.writeJson('currentUser', window.AppState.currentUser);
  if (window.AppState.currentUser) {
    window.YuruiStorage.writeJson('yuruiUser', window.AppState.currentUser);
  } else {
    localStorage.removeItem('yuruiUser');
  }
  window.YuruiStorage.writeJson('cart', window.AppState.cart || []);
  window.YuruiStorage.writeJson('preferences', window.AppState.preferences || {});
  localStorage.setItem('theme', window.AppState.theme || 'light');
};

/**
 * Logs out through the shared auth service when available while preserving carts.
 */
window.logout = () => {
  if (window.YuruiAuth && typeof window.YuruiAuth.logout === 'function') {
    window.YuruiAuth.logout({ showToast: false });
    return;
  }

  window.AppState.isLoggedIn = false;
  window.AppState.currentUser = null;
  localStorage.setItem('isLoggedIn', 'false');
  localStorage.removeItem('currentUser');
  localStorage.removeItem('yuruiUser');
  window.dispatchEvent(new CustomEvent('yurui:auth-changed', {
    detail: { type: 'logout', user: null },
  }));
};

/**
 * Resets only known Yuruicamp state keys instead of clearing the whole origin.
 * @deprecated Prefer logout() for normal sign-out behavior.
 */
window.resetAppState = () => {
  window.AppState = {
    isLoggedIn: false,
    currentUser: null,
    cart: [],
    preferences: {},
    theme: 'light',
  };
  window.YuruiStorage.removeKeys(APP_RESET_STORAGE_KEYS);
};

console.log('✓ AppState 已初始化');
