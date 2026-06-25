// ========================================
// Yuruicamp Formatters
// ========================================

/**
 * Formats a number as Taiwan Dollar currency.
 * @param {number} amount - Amount to format.
 * @returns {string} Localized currency text.
 */
window.formatCurrency = (amount) => {
  const formatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  });
  return formatter.format(Number(amount) || 0);
};

/**
 * Formats a date string for zh-TW users.
 * @param {string|Date} dateString - Date value accepted by Date constructor.
 * @returns {string} Localized date text.
 */
window.formatDate = (dateString) => {
  const formatter = new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date(dateString));
};

/**
 * Generates a lightweight unique id for mock records and UI nodes.
 * @returns {string} Unique id string.
 */
window.generateId = () => `id-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/**
 * Delays running a function until user input has paused.
 * @param {Function} func - Function to debounce.
 * @param {number} delay - Delay in milliseconds.
 * @returns {Function} Debounced function.
 */
window.debounce = (func, delay) => {
  let timeoutId;
  return function debouncedFunction(...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * Limits a function so it can run at most once per delay interval.
 * @param {Function} func - Function to throttle.
 * @param {number} delay - Minimum interval in milliseconds.
 * @returns {Function} Throttled function.
 */
window.throttle = (func, delay) => {
  let lastCall = 0;
  return function throttledFunction(...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      func.apply(this, args);
      lastCall = now;
    }
  };
};

/**
 * Deep clones plain objects and arrays used by mock front-end data.
 * @param {*} value - Value to clone.
 * @returns {*} Cloned value.
 */
window.deepClone = (value) => {
  if (value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((item) => window.deepClone(item));

  const cloned = {};
  Object.keys(value).forEach((key) => {
    cloned[key] = window.deepClone(value[key]);
  });
  return cloned;
};

console.log('✓ Formatters 已初始化');
