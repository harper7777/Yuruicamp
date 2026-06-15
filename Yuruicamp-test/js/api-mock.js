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
        const response = await fetch(`${window.API._getDataPath()}/products.json`);
        let products = await response.json();
        
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
        const response = await fetch(`${window.API._getDataPath()}/products.json`);
        const products = await response.json();
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
        const response = await fetch(`${window.API._getDataPath()}/products.json`);
        const products = await response.json();
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
        const response = await fetch(`${window.API._getDataPath()}/orders.json`);
        const orders = await response.json();
        return Promise.resolve(orders);
      } catch (error) {
        console.error('Error fetching all orders:', error);
        return Promise.reject(error);
      }
    },

    getByUserId: async (userId, status = null) => {
      try {
        const response = await fetch(`${window.API._getDataPath()}/orders.json`);
        let orders = await response.json();
        
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
        // 生成結構化的訂單編號，格式：#ORD-YYYYMMDD-XXXX
        const now = new Date();
        const dateStr = now.toISOString().slice(0,10).replace(/-/g,'');
        const seq = Math.floor(Math.random() * 9000) + 1000;
        const newOrder = {
          id: `ord-${Date.now()}`,
          orderNumber: `#ORD-${dateStr}-${seq}`,
          ...orderData,
          status: 'processing',
          createdAt: now.toISOString(),
        };
        
        // 模擬保存到 localStorage
        const orders = JSON.parse(localStorage.getItem('mockOrders') || '[]');
        orders.push(newOrder);
        localStorage.setItem('mockOrders', JSON.stringify(orders));
        
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
     * 登入（模擬）
     * @param {string} email - 電子郵件
     * @param {string} password - 密碼
     * @returns {Promise<Object>}
     */
    login: async (email, password) => {
      try {
        const response = await fetch(`${window.API._getDataPath()}/users.json`);
        const users = await response.json();
        
        const user = users.find(u => u.email === email && u.password === password);
        
        if (!user) {
          return Promise.reject(new Error('Invalid credentials'));
        }
        
        const loggedInUser = { ...user };
        delete loggedInUser.password; // 不返回密碼
        
        // 更新全局狀態
        window.AppState.isLoggedIn = true;
        window.AppState.currentUser = loggedInUser;
        window.saveAppState();
        
        return Promise.resolve(loggedInUser);
      } catch (error) {
        console.error('Error logging in:', error);
        return Promise.reject(error);
      }
    },
    
    /**
     * 登出
     * @returns {Promise<void>}
     */
    logout: async () => {
      window.AppState.isLoggedIn = false;
      window.AppState.currentUser = null;
      window.saveAppState();
      return Promise.resolve();
    },
    
    /**
     * 註冊（模擬）
     * @param {Object} userData - 用戶數據
     * @returns {Promise<Object>}
     */
    register: async (userData) => {
      try {
        const newUser = {
          id: window.generateId(),
          ...userData,
          createdAt: new Date().toISOString(),
          tier: 'beginner',
        };
        
        // 模擬保存
        const users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
        users.push(newUser);
        localStorage.setItem('mockUsers', JSON.stringify(users));
        
        // 自動登入
        window.AppState.isLoggedIn = true;
        const userCopy = { ...newUser };
        delete userCopy.password;
        window.AppState.currentUser = userCopy;
        window.saveAppState();
        
        return Promise.resolve(userCopy);
      } catch (error) {
        console.error('Error registering:', error);
        return Promise.reject(error);
      }
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
