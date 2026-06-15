// ========================================
// Yuruicamp 全局配置與狀態管理
// ========================================

/**
 * 應用全局狀態
 * 存儲應用運行時的狀態數據
 * 可使用 localStorage 持久化
 */
window.AppState = {
  // 認證狀態
  isLoggedIn: JSON.parse(localStorage.getItem('isLoggedIn') || 'false'),
  currentUser: JSON.parse(localStorage.getItem('currentUser') || 'null'),
  
  // 購物車
  cart: JSON.parse(localStorage.getItem('cart') || '[]'),
  
  // 用戶喜好
  preferences: JSON.parse(localStorage.getItem('preferences') || '{}'),
  
  // 主題設定
  theme: localStorage.getItem('theme') || 'light',
};

/**
 * 應用配置常數
 */
window.AppConfig = {
  // API 基礎 URL（預留後端接入點）
  API_BASE_URL: 'http://localhost:3000/api',
  
  // 應用版本
  VERSION: '1.0.0',
  
  // 環境
  ENVIRONMENT: 'development',
  
  // 購物車相關
  CART: {
    MAX_QUANTITY: 999,
    MIN_QUANTITY: 1,
    FREE_SHIPPING_THRESHOLD: 3000, // 免運門檻 NT$3000
  },
  
  // 分頁相關
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 12,
    MAX_PAGE_SIZE: 50,
  },
  
  // 文件上傳相關
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },
  
  // 時間相關
  TIMEOUT: 5000, // 請求超時 5秒
  CACHE_DURATION: 3600000, // 緩存時長 1小時
  
  // 貨幣相關
  CURRENCY: {
    SYMBOL: 'NT$',
    CODE: 'TWD',
    DECIMALS: 0,
  },
  
  // 分店信息
  COMPANY: {
    NAME: 'Yuruicamp',
    SLOGAN: '探索戶外，從這裡開始',
    PHONE: '0800-123-456',
    EMAIL: 'support@yuruicamp.com',
    ADDRESS: '台北市信義區信義路五段 100 號',
  },
};

/**
 * 工具函數：持久化應用狀態
 */
window.saveAppState = () => {
  localStorage.setItem('isLoggedIn', JSON.stringify(window.AppState.isLoggedIn));
  localStorage.setItem('currentUser', JSON.stringify(window.AppState.currentUser));
  localStorage.setItem('cart', JSON.stringify(window.AppState.cart));
  localStorage.setItem('preferences', JSON.stringify(window.AppState.preferences));
};

/**
 * 工具函數：重置應用狀態
 */
window.resetAppState = () => {
  window.AppState = {
    isLoggedIn: false,
    currentUser: null,
    cart: [],
    preferences: {},
    theme: 'light',
  };
  localStorage.clear();
};

/**
 * 工具函數：格式化金額
 */
window.formatCurrency = (amount) => {
  const formatter = new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
  });
  return formatter.format(amount);
};

/**
 * 工具函數：格式化日期
 */
window.formatDate = (dateString) => {
  const date = new Date(dateString);
  const formatter = new Intl.DateTimeFormat('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
};

/**
 * 工具函數：生成唯一 ID
 */
window.generateId = () => {
  return `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * 工具函數：防抖函數
 */
window.debounce = (func, delay) => {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
};

/**
 * 工具函數：節流函數
 */
window.throttle = (func, delay) => {
  let lastCall = 0;
  return function (...args) {
    const now = Date.now();
    if (now - lastCall >= delay) {
      func.apply(this, args);
      lastCall = now;
    }
  };
};

/**
 * 工具函數：深度複製
 */
window.deepClone = (obj) => {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => window.deepClone(item));
  }
  
  const cloned = {};
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      cloned[key] = window.deepClone(obj[key]);
    }
  }
  
  return cloned;
};

/**
 * 工具函數：驗證電子郵件
 */
window.isValidEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

/**
 * 工具函數：驗證電話號碼（台灣格式）
 */
window.isValidPhone = (phone) => {
  const regex = /^(\+886|886|0)[1-9]\d{1,9}$/;
  return regex.test(phone.replace(/[\s\-()]/g, ''));
};

/**
 * 工具函數：計算購物車總金額
 */
window.calculateCartTotal = (cart = window.AppState.cart) => {
  return cart.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
};

/**
 * 工具函數：計算運費
 */
window.calculateShippingFee = (total, method = 'delivery') => {
  if (total >= window.AppConfig.CART.FREE_SHIPPING_THRESHOLD) {
    return 0; // 免運費
  }
  
  switch (method) {
    case 'delivery':
      return 60; // 宅配運費
    case 'store':
      return 0; // 門市取貨免運費
    default:
      return 60;
  }
};

console.log('✓ AppConfig 與 AppState 已初始化');
