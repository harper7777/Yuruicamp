// ========================================
// Yuruicamp Storage Helpers
// ========================================

/**
 * Centralizes localStorage JSON access so corrupted values do not break pages.
 */
window.YuruiStorage = (() => {
  /**
   * Reads and parses a JSON value from localStorage.
   * @param {string} key - localStorage key.
   * @param {*} fallback - Value returned when key is missing or malformed.
   * @returns {*} Parsed JSON value or fallback.
   */
  function readJson(key, fallback) {
    try {
      const rawValue = localStorage.getItem(key);
      return rawValue ? JSON.parse(rawValue) : fallback;
    } catch (error) {
      console.warn(`localStorage ${key} 解析失敗，已改用預設值`, error);
      return fallback;
    }
  }

  /**
   * Serializes a value into localStorage using JSON format.
   * @param {string} key - localStorage key.
   * @param {*} value - Value to store.
   */
  function writeJson(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  }

  /**
   * Removes only the provided keys to avoid clearing unrelated same-domain data.
   * @param {string[]} keys - localStorage keys to remove.
   */
  function removeKeys(keys) {
    keys.forEach((key) => localStorage.removeItem(key));
  }

  /**
   * Reads the shared auth user from both main-site and booking-compatible keys.
   * @returns {Object|null} Stored user or null.
   */
  function readAuthUser() {
    return readJson('currentUser', null) || readJson('yuruiUser', null);
  }

  return {
    readJson,
    writeJson,
    removeKeys,
    readAuthUser,
  };
})();

console.log('✓ Storage helpers 已初始化');
