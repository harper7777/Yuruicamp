// ========================================
// Yuruicamp 全局配置
// ========================================

/**
 * Stores immutable application configuration used by every runtime module.
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
    FREE_SHIPPING_THRESHOLD: 3000,
  },

  // 分頁相關
  PAGINATION: {
    DEFAULT_PAGE_SIZE: 12,
    MAX_PAGE_SIZE: 50,
  },

  // 文件上傳相關
  UPLOAD: {
    MAX_FILE_SIZE: 5 * 1024 * 1024,
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  },

  // 時間與快取設定
  TIMEOUT: 5000,
  CACHE_DURATION: 3600000,

  // 貨幣相關
  CURRENCY: {
    SYMBOL: 'NT$',
    CODE: 'TWD',
    DECIMALS: 0,
  },

  // 品牌與門市資訊
  COMPANY: {
    NAME: 'Yuruicamp',
    SLOGAN: '探索戶外，從這裡開始',
    PHONE: '0800-123-456',
    EMAIL: 'support@yuruicamp.com',
    ADDRESS: '台北市信義區信義路五段 100 號',
  },
};

console.log('✓ AppConfig 已初始化');
