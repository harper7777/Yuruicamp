// ========================================
// Mock API 層 - 模擬後端接口
// ========================================
// 預留後端接入點：日後僅需將此層改為真實 API 調用
// 例：fetch(`${AppConfig.API_BASE_URL}/products`)

/**
 * API 模擬物件
 * 包含所有應用需要的模擬 API 方法
 * 數據來自 data/*.json 靜態檔案
 */
// 自動偵測 data 資料夾路徑（支援從 pages/ 子目錄載入）
// Auto-detect data folder path - works whether page is at root or in pages/
const _detectDataPath = () => {
  const path = window.location.pathname;
  if (path.includes('/pages/') || path.match(/\/pages\//)) {
    return '../data';
  }
  return '/data';
};

const MOCK_ORDERS_STORAGE_KEY = 'mockOrders';
const MOCK_USER_POINT_DELTAS_STORAGE_KEY = 'mockUserPointDeltas';
let productsCache = null;
let productsCacheExpiresAt = 0;

/** 重點：集中讀取 localStorage JSON，避免新增訂單或點數快取資料損壞時中斷整個 mock API。 */
const _readJsonStorage = (key, fallback) => {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch (error) {
    console.warn(`localStorage ${key} 解析失敗，已改用預設值`, error);
    return fallback;
  }
};

/** 重點：集中寫入 localStorage JSON，讓訂單與點數的 mock 持久化格式一致。 */
const _writeJsonStorage = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

/** 重點：新增訂單會和 data/orders.json 合併，會員中心讀取時可同時看到靜態與本機新增資料。 */
const _mergeOrders = (baseOrders = [], persistedOrders = []) => {
  const orderMap = new Map();
  [...baseOrders, ...persistedOrders].forEach(order => {
    if (order && order.id) orderMap.set(order.id, order);
  });
  return [...orderMap.values()];
};

/** 重點：訂單 ID 依目前最大 ord-數字 加 1，符合 data/orders.json 既有 ord-001 格式。 */
const _getNextOrderSerial = (orders = []) => {
  const serials = orders
    .map(order => String(order.id || '').match(/^ord-(\d+)$/))
    .filter(Boolean)
    .map(match => Number(match[1]))
    .filter(serial => Number.isFinite(serial) && serial > 0 && serial < 100000);
  return Math.max(0, ...serials) + 1;
};

/** 重點：createdAt 與訂單編號都用使用者本機日期，避免 ISO UTC 跨日時出現日期少一天。 */
const _formatLocalDate = (date = new Date()) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const _formatOrderId = (serial) => `ord-${String(serial).padStart(3, '0')}`;

const _formatOrderNumber = (date, serial) => (
  `#ORD-${_formatLocalDate(date).replace(/-/g, '')}-${String(serial).padStart(4, '0')}`
);

/** 重點：每筆訂單回饋點數固定為 subtotal 的 10% 並無條件進位。 */
const _calculateRewardPoints = (subtotal) => Math.ceil((Number(subtotal) || 0) * 0.1);

const _getStoredOrders = () => _readJsonStorage(MOCK_ORDERS_STORAGE_KEY, []);
const _getUserPointDeltas = () => _readJsonStorage(MOCK_USER_POINT_DELTAS_STORAGE_KEY, {});

/**
 * Loads products.json once per cache window so product APIs share one request.
 * @returns {Promise<Array>} Cached product list.
 */
const _getProducts = async () => {
  const now = Date.now();
  if (productsCache && now < productsCacheExpiresAt) {
    return productsCache;
  }

  const response = await fetch(`${window.API._getDataPath()}/products.json`);
  productsCache = await response.json();
  productsCacheExpiresAt = now + (window.AppConfig?.CACHE_DURATION || 3600000);
  return productsCache;
};

/** 重點：只有 delivered 的 mockOrders 才會回饋點數，避免 checkout 新建 unshipped 訂單先更新 cardPoints。 */
const _getDeliveredOrderPointDeltas = () => {
  return _getStoredOrders().reduce((deltas, order) => {
    if (!order || order.status !== 'delivered') return deltas;

    const userId = order.userId || 'user-001';
    const points = Number.isFinite(Number(order.points))
      ? Number(order.points)
      : _calculateRewardPoints(order.subtotal);
    deltas[userId] = (Number(deltas[userId]) || 0) + points;
    return deltas;
  }, {});
};

/** 重點：users.json 是基礎資料，結帳新增的點數只記錄增量，避免覆蓋日後更新的 points 原始值。 */
const _applyUserPointDeltas = (users = []) => {
  const deltas = _getDeliveredOrderPointDeltas();
  return users.map(user => ({
    ...user,
    points: (Number(user.points) || 0) + (Number(deltas[user.id]) || 0),
  }));
};

window.API = {
  // Base data path for JSON fetching - adjusts based on current page location
  _dataPath: null,
  _getDataPath() {
    if (!this._dataPath) {
      this._dataPath = _detectDataPath();
    }
    return this._dataPath;
  },

  /**
   * 產品相關 API
   */
  products: {
    /**
     * 獲取所有產品列表
     * @param {Object} filters - 篩選條件 {category, minPrice, maxPrice, brand}
     * @returns {Promise<Array>}
     */
    getAll: async (filters = {}) => {
      try {
        let products = await _getProducts();
        
        // 應用篩選
        if (filters.category) {
          products = products.filter(p => p.category === filters.category);
        }
        if (filters.minPrice !== undefined) {
          products = products.filter(p => p.price >= filters.minPrice);
        }
        if (filters.maxPrice !== undefined) {
          products = products.filter(p => p.price <= filters.maxPrice);
        }
        if (filters.brand) {
          products = products.filter(p => p.brand === filters.brand);
        }
        
        return Promise.resolve(products);
      } catch (error) {
        console.error('Error fetching products:', error);
        return Promise.reject(error);
      }
    },
    
    /**
     * 根據 ID 獲取單一產品詳情
     * @param {string} productId - 產品 ID
     * @returns {Promise<Object>}
     */
    getById: async (productId) => {
      try {
        const products = await _getProducts();
        const product = products.find(p => p.id === productId);
        
        if (!product) {
          return Promise.reject(new Error('Product not found'));
        }
        
        return Promise.resolve(product);
      } catch (error) {
        console.error('Error fetching product detail:', error);
        return Promise.reject(error);
      }
    },
    
    /**
     * 獲取分類列表
     * @returns {Promise<Array>}
     */
    getCategories: async () => {
      try {
        const products = await _getProducts();
        const categories = [...new Set(products.map(p => p.category))];
        return Promise.resolve(categories);
      } catch (error) {
        console.error('Error fetching categories:', error);
        return Promise.reject(error);
      }
    },
  },
  
  /**
   * 訂單相關 API
   */
  orders: {
    /**
     * 獲取用戶訂單列表
     * @param {string} userId - 用戶 ID
     * @param {string} status - 訂單狀態篩選
     * @returns {Promise<Array>}
     */
    getAll: async () => {
      try {
        const response = await fetch(`${window.API._getDataPath()}/orders.json`, { cache: 'no-store' });
        const orders = _mergeOrders(await response.json(), _getStoredOrders());
        return Promise.resolve(orders);
      } catch (error) {
        console.error('Error fetching all orders:', error);
        return Promise.reject(error);
      }
    },

    getByUserId: async (userId, status = null) => {
      try {
        const response = await fetch(`${window.API._getDataPath()}/orders.json`, { cache: 'no-store' });
        let orders = _mergeOrders(await response.json(), _getStoredOrders());
        
        orders = orders.filter(o => o.userId === userId);
        
        if (status) {
          orders = orders.filter(o => o.status === status);
        }
        
        return Promise.resolve(orders);
      } catch (error) {
        console.error('Error fetching orders:', error);
        return Promise.reject(error);
      }
    },
    
    /**
     * 創建訂單（模擬）
     * @param {Object} orderData - 訂單數據
     * @returns {Promise<Object>}
     */
    create: async (orderData) => {
      try {
        const now = new Date();
        const response = await fetch(`${window.API._getDataPath()}/orders.json`, { cache: 'no-store' });
        const baseOrders = await response.json();
        const storedOrders = _getStoredOrders();
        const serial = _getNextOrderSerial(_mergeOrders(baseOrders, storedOrders));
        const subtotal = Number(orderData.subtotal) || 0;
        const rewardPoints = Number.isFinite(Number(orderData.points))
          ? Number(orderData.points)
          : _calculateRewardPoints(subtotal);

        // 重點：新增訂單欄位依 checkout.js 整理後的頁面資料建立，狀態預設為待出貨 unshipped。
        const newOrder = {
          id: orderData.id || _formatOrderId(serial),
          userId: orderData.userId || 'user-001',
          orderNumber: orderData.orderNumber || _formatOrderNumber(now, serial),
          items: orderData.items || [],
          subtotal,
          points: rewardPoints,
          shippingFee: Number(orderData.shippingFee) || 0,
          ...(Array.isArray(orderData.coupons) && orderData.coupons.length > 0 ? { coupons: orderData.coupons } : {}),
          discount: Number(orderData.discount) || 0,
          total: Number(orderData.total) || 0,
          status: orderData.status || 'unshipped',
          shippingMethod: orderData.shippingMethod || 'delivery',
          shippingAddress: orderData.shippingAddress || orderData.deliveryAddress || '',
          payment: orderData.payment || orderData.paymentMethod || 'credit-card',
          paymentStatus: orderData.paymentStatus || ((orderData.payment || orderData.paymentMethod) === 'cod' ? 'paid' : 'unpaid'),
          createdAt: orderData.createdAt || _formatLocalDate(now),
          // 重點：checkout 傳入的空字串也要保留，讓會員中心訂單詳細欄位結構固定。
          deliveredAt: orderData.deliveredAt || '',
          trackingNumber: orderData.trackingNumber || '',
          canReview: false,
          review: false,
          reviewed: false,
          buyerName: orderData.buyerName || '',
          buyerPhone: orderData.buyerPhone || '',
          buyerEmail: orderData.buyerEmail || '',
          userNote: orderData.userNote || orderData.buyerNote || '',
          buyerNote: orderData.buyerNote || orderData.userNote || '',
        };
        
        // 重點：瀏覽器無法直接寫回 data/orders.json，這裡以 mockOrders 模擬追加後的 orders.json。
        const orders = [...storedOrders.filter(order => order.id !== newOrder.id), newOrder];
        _writeJsonStorage(MOCK_ORDERS_STORAGE_KEY, orders);

        // 重點：訂單成立時同步把本筆 points 加到會員點數增量，會員中心會即時讀到新總點數。
        // 重點：只有 delivered 訂單才可把 points 加到會員暫存點數，checkout 新訂單預設 unshipped 不更新 cardPoints。
        if (newOrder.status === 'delivered' && newOrder.userId && newOrder.points > 0 && window.API.users && window.API.users.addPoints) {
          await window.API.users.addPoints(newOrder.userId, newOrder.points);
        }
        
        return Promise.resolve(newOrder);
      } catch (error) {
        console.error('Error creating order:', error);
        return Promise.reject(error);
      }
    },
  },
  
/**
   * 用戶相關 API
   */
  users: {
    /**
     * 取得所有會員資料
     * 重點：每次都重新讀 data/users.json，再套用本機點數增量，讓 users.json points 更新後畫面也會跟著刷新。
     * @returns {Promise<Array>}
     */
    getAll: async () => {
      try {
        const response = await fetch(`${window.API._getDataPath()}/users.json`, { cache: 'no-store' });
        const users = await response.json();
        return Promise.resolve(_applyUserPointDeltas(users));
      } catch (error) {
        console.error('Error fetching users:', error);
        return Promise.reject(error);
      }
    },

    /**
     * 依會員 ID 取得單一會員資料
     * 重點：會員中心回饋點數固定從 users.json 的 points 欄位讀取，不再從訂單 delivered subtotal 推算。
     * @param {string} userId - 用戶 ID
     * @returns {Promise<Object>}
     */
    getById: async (userId) => {
      const users = await window.API.users.getAll();
      const user = users.find(item => item.id === userId) || users[0];
      if (!user) return Promise.reject(new Error('User not found'));
      return Promise.resolve(user);
    },

    /**
     * 累加會員回饋點數
     * 重點：瀏覽器不能直接修改 data/users.json，因此只保存「新增點數增量」，再與 users.json points 合併顯示。
     * @param {string} userId - 用戶 ID
     * @param {number} points - 本次新增點數
     * @returns {Promise<Object>}
     */
    addPoints: async (userId, points) => {
      const safeUserId = userId || 'user-001';
      const earnedPoints = Number(points) || 0;
      const deltas = _getUserPointDeltas();

      deltas[safeUserId] = (Number(deltas[safeUserId]) || 0) + earnedPoints;
      _writeJsonStorage(MOCK_USER_POINT_DELTAS_STORAGE_KEY, deltas);

      const updatedUser = await window.API.users.getById(safeUserId);

      // 重點：同步目前登入狀態，讓 Header 與其他頁面也可取得最新 points。
      if (window.AppState && window.AppState.currentUser && (!window.AppState.currentUser.id || window.AppState.currentUser.id === safeUserId)) {
        window.AppState.currentUser.id = safeUserId;
        window.AppState.currentUser.points = updatedUser.points;
        window.saveAppState && window.saveAppState();
      }

      window.dispatchEvent(new CustomEvent('yurui:user-points-updated', {
        detail: { userId: safeUserId, points: updatedUser.points, earnedPoints },
      }));

      return Promise.resolve(updatedUser);
    },

    /**
     * 登出
     * 設計說明：登出時只清除認證狀態（isLoggedIn、currentUser）
     *           購物車數據（cart）保留在 localStorage，不清空
     *           用戶可在登出後再次登入時看到原有的購物車
     * @returns {Promise<void>}
     */
    logout: async () => {
      if (window.YuruiAuth && typeof window.YuruiAuth.logout === 'function') {
        window.YuruiAuth.logout({ showToast: false });
        return Promise.resolve();
      }

      // 只清除認證相關狀態，保留購物車
      window.AppState.isLoggedIn = false;
      window.AppState.currentUser = null;
      // 注意：不清空 window.AppState.cart，購物車數據保留
      window.saveAppState();
      localStorage.removeItem('currentUser');
      localStorage.removeItem('yuruiUser');
      localStorage.setItem('isLoggedIn', 'false');
      window.dispatchEvent(new CustomEvent('yurui:auth-changed', {
        detail: { type: 'logout', user: null },
      }));
      return Promise.resolve();
    },
    
    /**
     * 更新用戶信息
     * @param {string} userId - 用戶 ID
     * @param {Object} updates - 要更新的字段
     * @returns {Promise<Object>}
     */
    update: async (userId, updates) => {
      try {
        const currentUser = window.AppState.currentUser;
        
        if (currentUser.id !== userId) {
          return Promise.reject(new Error('Unauthorized'));
        }
        
        const updatedUser = { ...currentUser, ...updates };
        window.AppState.currentUser = updatedUser;
        window.saveAppState();
        
        return Promise.resolve(updatedUser);
      } catch (error) {
        console.error('Error updating user:', error);
        return Promise.reject(error);
      }
    },
  },
  
  /**
   * 文章相關 API
   */
  articles: {
    /**
     * 獲取所有文章
     * @returns {Promise<Array>}
     */
    getAll: async () => {
      try {
        const response = await fetch(`${window.API._getDataPath()}/articles.json`);
        const articles = await response.json();
        return Promise.resolve(articles);
      } catch (error) {
        console.error('Error fetching articles:', error);
        return Promise.reject(error);
      }
    },
    
    /**
     * 根據 ID 獲取文章詳情
     * @param {string} articleId - 文章 ID
     * @returns {Promise<Object>}
     */
    getById: async (articleId) => {
      try {
        const response = await fetch(`${window.API._getDataPath()}/articles.json`);
        const articles = await response.json();
        const article = articles.find(a => a.id === articleId);
        
        if (!article) {
          return Promise.reject(new Error('Article not found'));
        }
        
        return Promise.resolve(article);
      } catch (error) {
        console.error('Error fetching article:', error);
        return Promise.reject(error);
      }
    },
  },
  
  /**
   * 分店相關 API
   */
  branches: {
    /**
     * 獲取所有分店
     * @returns {Promise<Array>}
     */
    getAll: async () => {
      try {
        const response = await fetch(`${window.API._getDataPath()}/branches.json`);
        const branches = await response.json();
        return Promise.resolve(branches);
      } catch (error) {
        console.error('Error fetching branches:', error);
        return Promise.reject(error);
      }
    },
  },
  
  /**
   * 通用錯誤處理
   */
  handleError: (error) => {
    console.error('API Error:', error.message);
    return {
      success: false,
      message: error.message || 'An error occurred',
      status: error.status || 500,
    };
  },
};

console.log('✓ Mock API 層已初始化');
