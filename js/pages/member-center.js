// ============================================================
// 會員中心頁面邏輯 (Member Center Page Logic)
// 負責：Tab 切換、訂單載入、折價券、通知、個人資料儲存
// Handles: tab switching, orders, coupons, notifications, profile saving
// ============================================================

// ============================================================
// 靜態 Mock 資料
// Static mock data used when API is unavailable
// ============================================================

/** 折價券資料 (Coupon mock data) */
const MOCK_COUPONS = [
  {
    id: 'cp-001',
    discountVal: '100',      // 折扣金額 / discount amount
    discountUnit: '元折抵',   // 單位文字 / unit label
    title: '全館滿千折百優惠券',
    condition: '消費滿 NT$1,000 使用',
    expiry: '2026-08-31 到期',
    code: 'YURUI100',
    expired: false
  },
  {
    id: 'cp-002',
    discountVal: '10%',
    discountUnit: 'OFF',
    title: '會員專屬九折券',
    condition: '無最低消費限制',
    expiry: '2026-12-31 到期',
    code: 'MEMBER10',
    expired: false
  },
  {
    id: 'cp-003',
    discountVal: '200',
    discountUnit: '元折抵',
    title: '新年活動折扣券',
    condition: '消費滿 NT$2,000 使用',
    expiry: '2026-01-31 到期',
    code: 'NY2026',
    expired: true  // 已過期
  }
];

/** 通知資料 (Notification mock data) */
const MOCK_NOTIFICATIONS = [
  {
    id: 'notif-001',
    icon: '📦',
    title: '您的訂單已出貨！',
    message: '訂單 #ORD-20260215 已由黑貓宅急便出貨，預計 2 個工作天送達。',
    time: '2 小時前',
    unread: true
  },
  {
    id: 'notif-002',
    icon: '🎫',
    title: '折價券即將到期提醒',
    message: '您有 1 張折價券（YURUI100）將在 7 天內到期，快去使用吧！',
    time: '1 天前',
    unread: true
  },
  {
    id: 'notif-003',
    icon: '✅',
    title: '訂單已完成',
    message: '訂單 #ORD-20260101 已完成，歡迎為商品留下評價！',
    time: '3 天前',
    unread: false
  },
  {
    id: 'notif-004',
    icon: '🎁',
    title: '會員生日禮遇',
    message: '生日快樂！本月可享購物全額 95 折優惠，優惠碼：BIRTHDAY95。',
    time: '2026-06-01',
    unread: false
  }
];

// ============================================================
// 工具函數
// Utility functions
// ============================================================

/**
 * 狀態文字對照表
 * Maps status code to Chinese display text
 * @param {string} status - 訂單狀態代碼
 * @returns {{ label: string, cls: string }} 顯示文字 + CSS class
 */
function _getStatusInfo(status) {
  const map = {
    processing: { label: '處理中', cls: 'status-processing' },
    shipped:    { label: '已出貨', cls: 'status-shipped' },
    delivered:  { label: '已完成', cls: 'status-delivered' },
    cancelled:  { label: '已取消', cls: 'status-cancelled' }
  };
  return map[status] || { label: status, cls: '' };
}

function _getRentalStatusInfo(status) {
  // 重點：租借訂單沿用購買訂單狀態色票，但改成租借流程用語。
  const map = {
    processing: { label: '預約成立', cls: 'status-processing' },
    shipped:    { label: '待取件', cls: 'status-shipped' },
    delivered:  { label: '已歸還', cls: 'status-delivered' },
    cancelled:  { label: '已取消', cls: 'status-cancelled' }
  };
  return map[status] || _getStatusInfo(status);
}

/**
 * 付款方式對照表
 * Maps payment code to Chinese display text
 * @param {string} payment - 付款代碼
 * @returns {string} 中文顯示文字
 */
function _getPaymentLabel(payment) {
  const map = {
    'credit-card': '信用卡',
    'line-pay':    'LINE Pay',
    'cod':         '貨到付款'
  };
  return map[payment] || payment;
}

/**
 * 取得訂單使用過的 coupon 清單
 * 重點：優先讀取 data/orders.json 的 coupons 陣列，也相容單一 coupon 欄位，讓一張或多張折扣券都能顯示。
 * @param {Object} order - 訂單資料
 * @returns {Array} coupon 陣列
 */
function _getOrderCoupons(order) {
  if (Array.isArray(order.coupons)) return order.coupons;
  if (order.coupon) return [order.coupon];
  return [];
}

/**
 * 格式化訂單 coupon 顯示文字
 * 重點：金額券顯示折抵 NT$ 金額，百分比券顯示折數 / 百分比，並補上實際折抵金額。
 * @param {Object} coupon - 訂單 coupon 資料
 * @returns {string} 顯示文字
 */
function _formatOrderCoupon(coupon) {
  const code = coupon.code || '未命名折扣碼';

  if (coupon.type === 'percent') {
    const percentText = `${coupon.discount}%`;
    const amountText = coupon.amount ? `，折抵 NT$ ${Number(coupon.amount).toLocaleString('zh-TW')}` : '';
    return `${code}（${percentText}${amountText}）`;
  }

  const discountAmount = Number(coupon.amount || coupon.discount || 0).toLocaleString('zh-TW');
  return `${code}（折抵 NT$ ${discountAmount}）`;
}

/**
 * 建立訂單明細中的 coupon 列
 * 重點：只有訂單資料存在 coupon 時才顯示「使用折扣卷：」，避免無折扣訂單出現空列。
 * @param {Object} order - 訂單資料
 * @returns {string} HTML 字串
 */
function _buildOrderCouponRow(order) {
  const coupons = _getOrderCoupons(order);
  if (coupons.length === 0) return '';

  return `
        <div style="display:flex;justify-content:space-between;gap:1rem;margin-bottom:0.35rem;color:#16a34a;">
          <span style="white-space:nowrap;">使用折扣卷：</span>
          <span style="text-align:right;">${coupons.map(_formatOrderCoupon).join('、')}</span>
        </div>`;
}

/** 回饋點數比例：訂單商品小計 subtotal 的 10% */
const REWARD_POINT_RATE = 0.1;

/**
 * 計算會員回饋點數
 * 重點：只採計 data/orders.json 中 status 為 delivered 的訂單 subtotal，未完成或取消訂單不給點。
 * @param {Array} orders - 訂單資料陣列
 * @returns {number} subtotal 加總後的 10% 回饋點數
 */
function _calculateRewardPoints(orders) {
  const deliveredSubtotal = (Array.isArray(orders) ? orders : []).reduce((sum, order) => {
    if (order.status !== 'delivered') return sum;
    return sum + (Number(order.subtotal) || 0);
  }, 0);

  // 重點：保留 10% 計算結果，最多顯示 1 位小數，避免浮點數尾差出現在畫面上。
  return Number((deliveredSubtotal * REWARD_POINT_RATE).toFixed(1));
}

/**
 * 更新會員卡上的回饋點數
 * 重點：點數顯示跟訂單快取共用同一份資料，避免會員卡與訂單列表數字不同步。
 * @param {Array} orders - 已載入的會員訂單資料
 */
function _renderMemberRewardPoints(orders) {
  const pointsEl = document.getElementById('cardPoints');
  if (!pointsEl) return;

  const points = _calculateRewardPoints(orders);
  pointsEl.textContent = `回饋點數：${points.toLocaleString('zh-TW', { maximumFractionDigits: 1 })} 點`;
}

// ============================================================
// Tab 切換邏輯
// Tab switching logic
// ============================================================

/**
 * 切換顯示的 Panel
 * Switch active panel when user clicks a tab item
 * @param {string} tabName - 目標 panel 名稱 (overview/profile/orders/coupons/notifications)
 */
function switchTab(tabName) {
  // 切換側邊欄 active class（PC 版）
  // Update sidebar nav active state (desktop)
  document.querySelectorAll('.member-nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.tab === tabName);
  });

  // 切換手機版 tab active class
  // Update mobile tab active state
  document.querySelectorAll('.member-tab-mobile').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });

  // 切換右側 Panel 顯示
  // Show the matching panel, hide others
  document.querySelectorAll('.member-panel').forEach(panel => {
    panel.classList.toggle('active', panel.dataset.panel === tabName);
  });
}

/**
 * 設定所有 Tab 按鈕的點擊事件
 * Bind click events to all tab buttons (sidebar + mobile)
 */
function initTabSwitching() {
  // PC 側邊欄 tab 點擊
  document.querySelectorAll('.member-nav-item[data-tab]').forEach(item => {
    item.addEventListener('click', () => switchTab(item.dataset.tab));
  });

  // 手機版 tab 點擊
  document.querySelectorAll('.member-tab-mobile[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });
}

// ============================================================
// Panel 1：總覽 (Overview)
// ============================================================

/**
 * 初始化總覽 Panel
 * Fill overview panel with user data from AppState or defaults
 */
function initOverviewPanel() {
  const user = window.AppState && window.AppState.currentUser;

  // 取得用戶名稱，優先從 AppState，否則從 localStorage，否則預設值
  // Get user name: AppState > localStorage > default
  const savedProfile = JSON.parse(localStorage.getItem('yurui_profile') || '{}');
  const name  = (user && user.name)  || savedProfile.name  || '露友小明';
  const email = (user && user.email) || savedProfile.email || 'camper@example.com';

  // 設定側邊欄用戶資訊
  const avatarEl = document.getElementById('sidebarAvatar');
  const nameEl   = document.getElementById('sidebarName');
  const emailEl  = document.getElementById('sidebarEmail');
  if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
  if (nameEl)   nameEl.textContent   = name;
  if (emailEl)  emailEl.textContent  = email;

  // 設定會員卡上的姓名和加入日期
  const cardName  = document.getElementById('cardName');
  const cardSince = document.getElementById('cardSince');
  if (cardName)  cardName.textContent  = name;
  if (cardSince) cardSince.textContent = `加入日期：${(user && user.joinedAt) || '2026-01-01'}`;

  // 快捷統計數字（從 mock 資料計算）
  // Quick stat numbers from mock data
  const statPending  = document.getElementById('statPendingOrders');
  const statCoupons  = document.getElementById('statCoupons');
  const statUnread   = document.getElementById('statUnread');
  if (statPending) statPending.textContent = '1';  // processing 訂單
  if (statCoupons) statCoupons.textContent = MOCK_COUPONS.filter(c => !c.expired).length;
  if (statUnread)  statUnread.textContent  = MOCK_NOTIFICATIONS.filter(n => n.unread).length;
}

// ============================================================
// Panel 2：個人資料 (Profile)
// ============================================================

/**
 * 初始化個人資料 Panel
 * Initialize profile form with saved data and preference tag toggle
 */
function initProfilePanel() {
  // 從 localStorage 讀取已儲存的資料，預填表單
  // Pre-fill form from localStorage
  const saved = JSON.parse(localStorage.getItem('yurui_profile') || '{}');

  const fields = ['name', 'phone', 'email', 'birthday', 'address'];
  fields.forEach(field => {
    const el = document.getElementById('profile' + field.charAt(0).toUpperCase() + field.slice(1));
    if (el && saved[field]) el.value = saved[field];
  });

  // 喜好標籤 toggle（點擊 → 加/移除 active class）
  // Preference tag toggle on click
  const savedPrefs = saved.preferences || [];
  document.querySelectorAll('#prefTags .survey-tag').forEach(tag => {
    // 套用已儲存的選取狀態
    if (savedPrefs.includes(tag.dataset.value)) {
      tag.classList.add('active');
    }
    tag.addEventListener('click', () => {
      tag.classList.toggle('active');
    });
  });

  // 表單送出：儲存到 localStorage
  // Form submit: save to localStorage
  const form = document.getElementById('profileForm');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();  // 阻止頁面跳轉 / prevent default page reload

      // 收集表單資料
      // Collect form data
      const profileData = {
        name:        document.getElementById('profileName')?.value || '',
        phone:       document.getElementById('profilePhone')?.value || '',
        email:       document.getElementById('profileEmail')?.value || '',
        birthday:    document.getElementById('profileBirthday')?.value || '',
        address:     document.getElementById('profileAddress')?.value || '',
        preferences: [...document.querySelectorAll('#prefTags .survey-tag.active')]
                       .map(t => t.dataset.value)
      };

      // 儲存到 localStorage
      localStorage.setItem('yurui_profile', JSON.stringify(profileData));

      // 同步更新 AppState（如果已登入）
      // Sync AppState if user is logged in
      if (window.AppState && window.AppState.currentUser) {
        window.AppState.currentUser.name  = profileData.name;
        window.AppState.currentUser.email = profileData.email;
        window.saveAppState && window.saveAppState();
      }

      // 重新更新側邊欄顯示
      initOverviewPanel();

      // 顯示成功提示
      window.showToast && window.showToast('✅ 個人資料已儲存！', 'success');
    });
  }
}

// ============================================================
// Panel 3：我的訂單 (Orders)
// ============================================================

/** 當前訂單資料快取（避免重複 fetch）
 *  Current order data cache */
let _ordersCache = null;

/** 重點：租借訂單使用獨立快取，避免切換類型時重複讀取 data/reantalOrders.json。 */
let _rentalOrdersCache = null;

/** 重點：記錄目前顯示的訂單類型，讓狀態篩選只重繪當前清單。 */
let _activeOrderType = 'purchase';

function _buildOrderThumbsHTML(items) {
  // 重點：購買與租借訂單共用縮圖邏輯，保持卡片顯示方式一致。
  const safeItems = Array.isArray(items) ? items : [];
  const thumbsHTML = safeItems.slice(0, 3).map(item => `
      <img src="${item.image}" alt="${item.name}"
           class="order-item-img"
           title="${item.name} × ${item.quantity}"
           onerror="this.src='https://picsum.photos/seed/fallback/80/80'">
    `).join('');

  const moreCount = safeItems.length - 3;
  const moreHTML = moreCount > 0
    ? `<div class="order-item-img" style="background:#f6fbf6;display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:700;color:#244d4d;">+${moreCount}</div>`
    : '';

  return `${thumbsHTML}${moreHTML}`;
}

function _getActiveOrderFilter() {
  // 重點：購買 / 租借共用同一組狀態 Tab，切換類型時保留目前篩選條件。
  return document.querySelector('.order-status-tab[data-filter].active')?.dataset.filter || 'all';
}

function _showOrderTypePanel(orderType) {
  // 重點：只切換容器顯示，不重新建立 DOM，避免既有訂單事件遺失。
  const normalizedType = orderType === 'rental' ? 'rental' : 'purchase';
  _activeOrderType = normalizedType;

  document.querySelectorAll('.order-type-tab[data-order-type]').forEach(tab => {
    const isActive = tab.dataset.orderType === normalizedType;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-pressed', String(isActive));
    tab.setAttribute('aria-selected', String(isActive));
  });

  document.querySelectorAll('.order-list-panel[data-order-panel]').forEach(panel => {
    const shouldShow = panel.dataset.orderPanel === normalizedType;
    panel.classList.toggle('active', shouldShow);
    panel.hidden = !shouldShow;
  });
}

/**
 * 渲染訂單卡片列表
 * Render order cards into #ordersList container
 * @param {Array} orders - 訂單資料陣列
 * @param {string} filter - 狀態篩選 (all/processing/shipped/delivered/cancelled)
 */
function renderOrders(orders, filter = 'all') {
  const container = document.getElementById('ordersList');
  if (!container) return;

  // 套用篩選
  // Apply filter
  const filtered = filter === 'all'
    ? orders
    : orders.filter(o => o.status === filter);

  // 若無訂單，顯示空狀態
  // Empty state
  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;color:#999;">
        <div style="font-size:3rem;margin-bottom:0.75rem;">📭</div>
        <div>沒有符合條件的訂單</div>
      </div>`;
    return;
  }

  // 產生每筆訂單的 HTML
  // Build HTML for each order
  container.innerHTML = filtered.map(order => {
    const { label, cls } = _getStatusInfo(order.status);
    const thumbsHTML = _buildOrderThumbsHTML(order.items);

    // 「寫評價」按鈕（只有 delivered 且 canReview 且 !reviewed 才顯示）
    const reviewBtnHTML = (order.status === 'delivered' && order.canReview && !order.reviewed)
      ? `<button class="btn btn-outline" style="font-size:0.75rem;padding:0.3rem 0.75rem;"
           onclick="openReviewModal('${order.id}', '${order.items[0].name}')">⭐ 寫評價</button>`
      : '';

    return `
      <div class="order-card" data-order-id="${order.id}">
        <!-- 卡片頂部：訂單號 + 日期 + 狀態 badge -->
        <div class="order-card-header">
          <div>
            <div class="order-card-num">${order.orderNumber}</div>
            <div class="order-card-date">${order.createdAt}</div>
          </div>
          <span class="order-status-badge ${cls}">${label}</span>
        </div>
        <!-- 商品縮圖 -->
        <div class="order-card-body">
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            ${thumbsHTML}
          </div>
        </div>
        <!-- 底部：金額 + 操作按鈕 -->
        <div class="order-card-footer">
          <span class="order-total">NT$ ${order.total.toLocaleString()}</span>
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            ${reviewBtnHTML}
            <button class="btn btn-primary" style="font-size:0.75rem;padding:0.3rem 0.75rem;"
              onclick="openOrderDetail('${order.id}')">查看明細</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 渲染租借訂單列表
 * 重點：結構參照 renderOrders，但資料來源、狀態文案與明細事件改為租借訂單專用。
 * @param {Array} orders - 租借訂單資料陣列
 * @param {string} filter - 狀態篩選 (all/processing/shipped/delivered/cancelled)
 */
function renderRentalOrders(orders, filter = 'all') {
  const container = document.getElementById('rentalOrdersList');
  if (!container) return;

  const safeOrders = Array.isArray(orders) ? orders : [];
  const filtered = filter === 'all'
    ? safeOrders
    : safeOrders.filter(o => o.status === filter);

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align:center;padding:3rem;color:#999;">
        <div style="font-size:3rem;margin-bottom:0.75rem;">⛺</div>
        <div>沒有符合條件的租借訂單</div>
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(order => {
    const { label, cls } = _getRentalStatusInfo(order.status);
    const thumbsHTML = _buildOrderThumbsHTML(order.items);

    return `
      <div class="order-card" data-rental-order-id="${order.id}">
        <!-- 重點：租借卡片沿用訂單卡片結構，額外顯示租借期間與取還門市。 -->
        <div class="order-card-header">
          <div>
            <div class="order-card-num">${order.orderNumber}</div>
            <div class="order-card-date">${order.createdAt}</div>
          </div>
          <span class="order-status-badge ${cls}">${label}</span>
        </div>
        <div class="order-card-body">
          <div style="display:flex;gap:0.5rem;flex-wrap:wrap;">
            ${thumbsHTML}
          </div>
          <div class="rental-order-meta">
            租借期間：${order.rentalStart} ～ ${order.rentalEnd}<br>
            取件 / 歸還：${order.pickupStore} / ${order.returnStore}
          </div>
        </div>
        <div class="order-card-footer">
          <span class="order-total">NT$ ${order.total.toLocaleString()}</span>
          <button class="btn btn-primary" style="font-size:0.75rem;padding:0.3rem 0.75rem;"
            onclick="openRentalOrderDetail('${order.id}')">查看明細</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * 載入並渲染訂單
 * Fetch orders and render; uses cache to avoid duplicate fetches
 */
async function loadOrders() {
  if (_ordersCache) {
    // 已有快取，直接渲染
    renderOrders(_ordersCache, _getActiveOrderFilter());
    _renderMemberRewardPoints(_ordersCache); // 同步更新會員卡回饋點數
    return;
  }

  try {
    // 嘗試從 API 取得（window.API.orders.getByUserId）
    // Try via API mock
    if (window.API && window.API.orders && window.API.orders.getByUserId) {
      _ordersCache = await window.API.orders.getByUserId('user-001');
    } else {
      // Fallback：直接 fetch JSON 檔案
      // Fallback: fetch JSON directly
      const res = await fetch('../data/orders.json');
      _ordersCache = await res.json();
    }
    renderOrders(_ordersCache, _getActiveOrderFilter());
    _renderMemberRewardPoints(_ordersCache); // 訂單載入後依 delivered subtotal 更新點數
  } catch (err) {
    console.error('載入訂單失敗 / Failed to load orders:', err);
    _renderMemberRewardPoints([]); // 載入失敗時顯示 0 點，避免停留在載入中
    const container = document.getElementById('ordersList');
    if (container) {
      container.innerHTML = `
        <div style="text-align:center;padding:2rem;color:#e74c3c;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">⚠️</div>
          載入失敗，請稍後再試
        </div>`;
    }
  }
}

/**
 * 載入租借訂單
 * 重點：租借訂單固定讀取 data/reantalOrders.json，並使用獨立清單渲染避免覆蓋購買訂單。
 */
async function loadRentalOrders() {
  if (_rentalOrdersCache) {
    renderRentalOrders(_rentalOrdersCache, _getActiveOrderFilter());
    return;
  }

  try {
    const res = await fetch('../data/reantalOrders.json');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    _rentalOrdersCache = await res.json();
    renderRentalOrders(_rentalOrdersCache, _getActiveOrderFilter());
  } catch (err) {
    console.error('載入租借訂單失敗 / Failed to load rental orders:', err);
    const container = document.getElementById('rentalOrdersList');
    if (container) {
      container.innerHTML = `
        <div style="text-align:center;padding:2rem;color:#e74c3c;">
          <div style="font-size:2rem;margin-bottom:0.5rem;">⚠️</div>
          載入租借訂單失敗，請稍後再試
        </div>`;
    }
  }
}

/**
 * 綁定購買 / 租借訂單切換按鈕
 * 重點：切換後只顯示對應面板，租借資料在第一次點擊時才載入。
 */
function initOrderTypeTabs() {
  document.querySelectorAll('.order-type-tab[data-order-type]').forEach(tab => {
    tab.addEventListener('click', () => {
      const orderType = tab.dataset.orderType === 'rental' ? 'rental' : 'purchase';
      _showOrderTypePanel(orderType);

      if (orderType === 'rental') {
        loadRentalOrders();
        return;
      }

      if (_ordersCache) {
        renderOrders(_ordersCache, _getActiveOrderFilter());
      } else {
        loadOrders();
      }
    });
  });

  _showOrderTypePanel(_activeOrderType);
}

/**
 * 初始化訂單狀態篩選 Tab
 * Bind click events to order status filter tabs
 */
function initOrderStatusTabs() {
  document.querySelectorAll('.order-status-tab[data-filter]').forEach(tab => {
    tab.addEventListener('click', () => {
      // 切換 active class
      document.querySelectorAll('.order-status-tab[data-filter]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 用快取資料重新渲染（如果已載入）
      // 重點：狀態篩選依目前訂單類型重繪，避免租借 / 購買清單互相覆蓋。
      if (_activeOrderType === 'rental') {
        if (_rentalOrdersCache) {
          renderRentalOrders(_rentalOrdersCache, tab.dataset.filter);
        } else {
          loadRentalOrders();
        }
        return;
      }

      if (_ordersCache) {
        renderOrders(_ordersCache, tab.dataset.filter);
      }
    });
  });
}

/**
 * 開啟訂單詳情 Modal
 * Open order detail modal and populate with order data
 * @param {string} orderId - 訂單 ID
 */
window.openOrderDetail = function(orderId) {
  if (!_ordersCache) return;

  const order = _ordersCache.find(o => o.id === orderId);
  if (!order) return;

  const { label, cls } = _getStatusInfo(order.status);
  const couponRowHTML = _buildOrderCouponRow(order);

  // 產生商品明細列表 HTML
  // Build items detail HTML
  const itemsHTML = order.items.map(item => `
    <div class="order-item-row">
      <img src="${item.image}" alt="${item.name}"
           class="order-item-img"
           onerror="this.src='https://picsum.photos/seed/fallback/80/80'">
      <div>
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-qty">× ${item.quantity} &nbsp;｜&nbsp; NT$ ${(item.price * item.quantity).toLocaleString()}</div>
      </div>
    </div>
  `).join('');

  // 物流資訊
  // Shipping info
  const shippingHTML = order.trackingNumber
    ? `<div style="font-size:0.8rem;color:#555;margin-top:0.75rem;">
         🚚 物流追蹤號：<strong>${order.trackingNumber}</strong>
       </div>`
    : '';

  // 取貨地址
  const addressHTML = order.shippingAddress
    ? `<div style="font-size:0.8rem;color:#555;">📍 配送地址：${order.shippingAddress}</div>`
    : order.storeAddress
      ? `<div style="font-size:0.8rem;color:#555;">🏪 門市取貨：${order.storeAddress}</div>`
      : '';

  // 填充 Modal 標題
  const titleEl = document.getElementById('orderDetailTitle');
  if (titleEl) titleEl.textContent = `訂單詳情 ${order.orderNumber}`;

  // 填充 Modal 內容
  const bodyEl = document.getElementById('orderDetailBody');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <!-- 訂單基本資訊 -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <div style="font-size:0.8rem;color:#999;">${order.createdAt}</div>
        <span class="order-status-badge ${cls}">${label}</span>
      </div>

      <!-- 商品明細 -->
      <div style="margin-bottom:1rem;">
        <div style="font-size:0.8rem;font-weight:700;color:#244d4d;margin-bottom:0.65rem;">📋 商品明細</div>
        ${itemsHTML}
      </div>

      <!-- 分隔線 -->
      <hr style="margin:0.75rem 0;">

      <!-- 金額明細 -->
      <div style="font-size:0.82rem;color:#555;">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
          <span>商品小計</span><span>NT$ ${order.subtotal.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
          <span>運費</span><span>${order.shippingFee === 0 ? '免運' : 'NT$ ' + order.shippingFee}</span>
        </div>
        ${order.discount ? `
        <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;color:#e74c3c;">
          <span>折扣優惠</span><span>- NT$ ${order.discount.toLocaleString()}</span>
        </div>` : ''}
        ${couponRowHTML}
        <div style="display:flex;justify-content:space-between;font-weight:700;font-size:0.95rem;color:#244d4d;margin-top:0.5rem;border-top:1px solid #f0f0f0;padding-top:0.5rem;">
          <span>訂單總計</span><span>NT$ ${order.total.toLocaleString()}</span>
        </div>
      </div>

      <!-- 付款方式 -->
      <div style="margin-top:0.75rem;font-size:0.8rem;color:#777;">
        💳 付款方式：${_getPaymentLabel(order.payment)}
      </div>

      <!-- 物流 & 地址 -->
      ${addressHTML}
      ${shippingHTML}

      <!-- LINE 客服按鈕 -->
      <div style="margin-top:1.25rem;">
        <a href="https://line.me/R/ti/p/@yuruicamp" target="_blank" class="btn btn-outline btn-block"
           style="font-size:0.85rem;color:#06c755;border-color:#06c755;">
          💬 聯絡 LINE 客服詢問訂單
        </a>
      </div>
    `;
  }

  window.openModal && window.openModal('orderDetailModal');
};

/**
 * 開啟租借訂單詳情 Modal
 * 重點：沿用既有 orderDetailModal，避免新增重複 Modal，並補上租借期間、押金與取還門市。
 * @param {string} orderId - 租借訂單 ID
 */
window.openRentalOrderDetail = function(orderId) {
  if (!_rentalOrdersCache) return;

  const order = _rentalOrdersCache.find(o => o.id === orderId);
  if (!order) return;

  const { label, cls } = _getRentalStatusInfo(order.status);
  const itemsHTML = (order.items || []).map(item => `
    <div class="order-item-row">
      <img src="${item.image}" alt="${item.name}"
           class="order-item-img"
           onerror="this.src='https://picsum.photos/seed/fallback/80/80'">
      <div>
        <div class="order-item-name">${item.name}</div>
        <div class="order-item-qty">× ${item.quantity} &nbsp;｜&nbsp; NT$ ${(item.price * item.quantity).toLocaleString()}</div>
      </div>
    </div>
  `).join('');

  const cancelReasonHTML = order.cancelReason
    ? `<div style="font-size:0.8rem;color:#e74c3c;margin-top:0.75rem;">取消原因：${order.cancelReason}</div>`
    : '';

  const titleEl = document.getElementById('orderDetailTitle');
  if (titleEl) titleEl.textContent = `租借訂單詳情 ${order.orderNumber}`;

  const bodyEl = document.getElementById('orderDetailBody');
  if (bodyEl) {
    bodyEl.innerHTML = `
      <!-- 重點：租借訂單明細在同一個 Modal 中呈現，但欄位改為租借流程資訊。 -->
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">
        <div style="font-size:0.8rem;color:#999;">${order.createdAt}</div>
        <span class="order-status-badge ${cls}">${label}</span>
      </div>

      <div style="margin-bottom:1rem;">
        <div style="font-size:0.8rem;font-weight:700;color:#244d4d;margin-bottom:0.65rem;">租借裝備</div>
        ${itemsHTML}
      </div>

      <hr style="margin:0.75rem 0;">

      <div style="font-size:0.82rem;color:#555;">
        <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
          <span>租借費用</span><span>NT$ ${order.subtotal.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;margin-bottom:0.35rem;">
          <span>押金</span><span>NT$ ${order.deposit.toLocaleString()}</span>
        </div>
        <div style="display:flex;justify-content:space-between;font-weight:700;font-size:0.95rem;color:#244d4d;margin-top:0.5rem;border-top:1px solid #f0f0f0;padding-top:0.5rem;">
          <span>訂單總額</span><span>NT$ ${order.total.toLocaleString()}</span>
        </div>
      </div>

      <div style="margin-top:0.75rem;font-size:0.8rem;color:#555;">
        租借期間：${order.rentalStart} ～ ${order.rentalEnd}<br>
        取件門市：${order.pickupStore}<br>
        歸還門市：${order.returnStore}
      </div>

      <div style="margin-top:0.75rem;font-size:0.8rem;color:#777;">
        💳 付款方式：${_getPaymentLabel(order.payment)}
      </div>

      ${cancelReasonHTML}

      <div style="margin-top:1.25rem;">
        <a href="https://line.me/R/ti/p/@yuruicamp" target="_blank" class="btn btn-outline btn-block"
           style="font-size:0.85rem;color:#06c755;border-color:#06c755;">
          聯繫 LINE 客服確認租借訂單
        </a>
      </div>
    `;
  }

  window.openModal && window.openModal('orderDetailModal');
};

// ============================================================
// Panel 4：折價券 (Coupons)
// ============================================================

/**
 * 渲染折價券列表
 * Render coupon tickets into active/expired containers
 */
function renderCoupons() {
  const activeContainer  = document.getElementById('activeCoupons');
  const expiredContainer = document.getElementById('expiredCoupons');
  if (!activeContainer || !expiredContainer) return;

  // 分成可使用 / 已失效兩組
  // Split into active and expired groups
  const activeCoupons  = MOCK_COUPONS.filter(c => !c.expired);
  const expiredCoupons = MOCK_COUPONS.filter(c => c.expired);

  /**
   * 產生單張折價券 HTML
   * Build a single coupon ticket HTML
   * @param {Object} coupon - 折價券資料
   * @returns {string} HTML 字串
   */
  function buildCouponHTML(coupon) {
    return `
      <div class="coupon-ticket ${coupon.expired ? 'expired' : ''}">
        <!-- 左側：折扣金額 -->
        <div class="coupon-left">
          <div class="coupon-discount-val">${coupon.discountVal}</div>
          <div class="coupon-discount-unit">${coupon.discountUnit}</div>
        </div>
        <!-- 鋸齒分隔線 -->
        <div class="coupon-sep"></div>
        <!-- 右側：說明 + 折扣碼 -->
        <div class="coupon-right">
          <div class="coupon-title">${coupon.title}</div>
          <div class="coupon-condition">${coupon.condition}</div>
          <div class="coupon-expiry">⏰ ${coupon.expiry}</div>
          <div class="coupon-code-row">
            <span class="coupon-code">${coupon.code}</span>
            ${!coupon.expired ? `
            <button class="copy-btn" onclick="copyCouponCode('${coupon.code}')">複製</button>
            ` : ''}
          </div>
        </div>
      </div>
    `;
  }

  // 渲染可使用折價券
  activeContainer.innerHTML = activeCoupons.length
    ? activeCoupons.map(buildCouponHTML).join('')
    : '<div style="text-align:center;padding:2rem;color:#999;">目前沒有可使用的折價券</div>';

  // 渲染已失效折價券
  expiredContainer.innerHTML = expiredCoupons.length
    ? expiredCoupons.map(buildCouponHTML).join('')
    : '<div style="text-align:center;padding:2rem;color:#999;">沒有已失效的折價券</div>';
}

/**
 * 複製折扣碼到剪貼簿
 * Copy coupon code to clipboard
 * @param {string} code - 折扣碼字串
 */
window.copyCouponCode = function(code) {
  // 使用現代 Clipboard API（需 HTTPS 或 localhost）
  // Use modern Clipboard API
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code)
      .then(() => window.showToast && window.showToast(`已複製折扣碼：${code}`, 'success'))
      .catch(() => fallbackCopy(code));
  } else {
    // Fallback：使用舊方法
    fallbackCopy(code);
  }
};

/**
 * 複製 Fallback（不支援 Clipboard API 時使用）
 * Fallback copy using textarea + execCommand
 * @param {string} code - 折扣碼字串
 */
function fallbackCopy(code) {
  const el = document.createElement('textarea');
  el.value = code;
  el.style.position = 'fixed';
  el.style.opacity  = '0';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  window.showToast && window.showToast(`已複製折扣碼：${code}`, 'success');
}

/**
 * 初始化折價券狀態切換 Tab
 * Bind click events to coupon status filter tabs
 */
function initCouponTabs() {
  const activeContainer  = document.getElementById('activeCoupons');
  const expiredContainer = document.getElementById('expiredCoupons');

  document.querySelectorAll('.order-status-tab[data-coupon-tab]').forEach(tab => {
    tab.addEventListener('click', () => {
      // 切換 active class
      document.querySelectorAll('.order-status-tab[data-coupon-tab]').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // 切換顯示哪個容器
      // Toggle visibility
      if (tab.dataset.couponTab === 'active') {
        if (activeContainer)  activeContainer.style.display  = 'block';
        if (expiredContainer) expiredContainer.style.display = 'none';
      } else {
        if (activeContainer)  activeContainer.style.display  = 'none';
        if (expiredContainer) expiredContainer.style.display = 'block';
      }
    });
  });
}

// ============================================================
// Panel 5：通知 (Notifications)
// ============================================================

/**
 * 渲染通知清單
 * Render notification items into #notificationList
 */
function renderNotifications() {
  const container = document.getElementById('notificationList');
  if (!container) return;

  if (MOCK_NOTIFICATIONS.length === 0) {
    container.innerHTML = '<div style="text-align:center;padding:2rem;color:#999;">目前沒有通知</div>';
    return;
  }

  container.innerHTML = MOCK_NOTIFICATIONS.map(notif => `
    <div class="notification-item ${notif.unread ? 'unread' : ''}"
         id="notif-${notif.id}"
         onclick="markAsRead('${notif.id}')">
      <!-- 圓形圖示 + 未讀紅點 -->
      <div class="notification-icon-wrap">
        ${notif.icon}
        ${notif.unread ? '<span class="notification-dot"></span>' : ''}
      </div>
      <!-- 通知內容 -->
      <div class="notification-body">
        <div class="notification-title">${notif.title}</div>
        <div class="notification-message">${notif.message}</div>
        <div class="notification-time">${notif.time}</div>
      </div>
    </div>
  `).join('');
}

/**
 * 標記單則通知為已讀
 * Mark a notification as read by removing .unread class and dot
 * @param {string} notifId - 通知 ID
 */
window.markAsRead = function(notifId) {
  const el = document.getElementById(`notif-${notifId}`);
  if (!el) return;

  // 移除 unread class（讓標題變回一般字重）
  el.classList.remove('unread');

  // 移除紅點
  const dot = el.querySelector('.notification-dot');
  if (dot) dot.remove();

  // 更新 mock 資料中的 unread 狀態（讓全部標已讀功能正確計算）
  const notif = MOCK_NOTIFICATIONS.find(n => n.id === notifId);
  if (notif) notif.unread = false;

  // 更新總覽的未讀數字
  const statUnread = document.getElementById('statUnread');
  if (statUnread) {
    const count = MOCK_NOTIFICATIONS.filter(n => n.unread).length;
    statUnread.textContent = count;
  }
};

/**
 * 初始化「全部標為已讀」按鈕
 * Bind click event to mark-all-read button
 */
function initMarkAllRead() {
  const btn = document.getElementById('markAllReadBtn');
  if (!btn) return;

  btn.addEventListener('click', () => {
    // 將所有通知標為已讀
    MOCK_NOTIFICATIONS.forEach(n => {
      n.unread = false;
      window.markAsRead(n.id);
    });
    window.showToast && window.showToast('所有通知已標為已讀', 'info');
  });
}

// ============================================================
// 評價 Modal
// Review Modal
// ============================================================

/**
 * 開啟寫評價 Modal
 * Open review modal for a delivered order item
 * @param {string} orderId   - 訂單 ID
 * @param {string} itemName  - 商品名稱
 */
window.openReviewModal = function(orderId, itemName) {
  const el = document.getElementById('reviewProductName');
  if (el) el.textContent = `📦 ${itemName}`;

  // 清空評分選取
  document.querySelectorAll('input[name="reviewRating"]').forEach(r => r.checked = false);
  const textarea = document.getElementById('reviewContent');
  if (textarea) textarea.value = '';

  // 設定送出按鈕的行為
  const submitBtn = document.getElementById('submitReviewBtn');
  if (submitBtn) {
    // 先移除舊的監聽器（避免重複綁定）
    // Remove old listener to prevent duplicate binds
    submitBtn.replaceWith(submitBtn.cloneNode(true));
    document.getElementById('submitReviewBtn').addEventListener('click', () => {
      const rating = document.querySelector('input[name="reviewRating"]:checked')?.value;
      const content = document.getElementById('reviewContent')?.value.trim();

      if (!rating) {
        window.showToast && window.showToast('請選擇評分星數', 'error');
        return;
      }
      if (!content) {
        window.showToast && window.showToast('請輸入評論內容', 'error');
        return;
      }

      // 更新 cache 中的 reviewed 狀態
      if (_ordersCache) {
        const order = _ordersCache.find(o => o.id === orderId);
        if (order) order.reviewed = true;
      }

      window.closeModal && window.closeModal('reviewModal');
      window.showToast && window.showToast('感謝您的評價！🌟', 'success');

      // 重新渲染訂單（移除「寫評價」按鈕）
      const activeFilter = document.querySelector('.order-status-tab[data-filter].active')?.dataset.filter || 'all';
      renderOrders(_ordersCache, activeFilter);
    });
  }

  window.openModal && window.openModal('reviewModal');
};

// ============================================================
// 主初始化函數
// Main initialization function
// ============================================================

/**
 * 初始化會員中心頁面
 * Initialize the member center page
 * 這個函數會被 main.js 的 initApp() 透過 _appComponentsInitialized 機制呼叫
 * Called by main.js initApp() mechanism
 */
window.initMemberCenterPage = function() {
  console.log('🏠 初始化會員中心頁面 / Initializing member center page...');

  // 告訴 main.js：全局組件（navbar/modal/cart）由這個頁面 JS 負責初始化
  // Inform main.js that global components are being initialized here
  window._appComponentsInitialized = true;

  // 初始化全局組件
  // Initialize global components
  if (window.initNavbar)              window.initNavbar();
  if (window.initModalListeners)      window.initModalListeners();
  if (window.initCartListeners)       window.initCartListeners();
  if (window.initPersonalizationModal) window.initPersonalizationModal();

  // 初始化頁面專屬功能
  // Initialize page-specific features
  initTabSwitching();    // Tab 切換
  initOverviewPanel();   // 總覽
  initProfilePanel();    // 個人資料
  initOrderTypeTabs();   // 重點：初始化購買 / 租借訂單切換面板
  loadOrders();          // 載入訂單
  initOrderStatusTabs(); // 訂單篩選 Tab
  renderCoupons();       // 渲染折價券
  initCouponTabs();      // 折價券 Tab 切換
  renderNotifications(); // 渲染通知
  initMarkAllRead();     // 全部標已讀按鈕

  console.log('✅ 會員中心頁面初始化完成 / Member center page initialized');
};

// ============================================================
// 頁面自動啟動
// Auto-start when DOM is ready
// ============================================================
if (document.readyState === 'loading') {
  // DOM 仍在載入中，等待 DOMContentLoaded 事件
  document.addEventListener('DOMContentLoaded', window.initMemberCenterPage);
} else {
  // DOM 已載入完成（script 在 body 底部時常見此情況）
  window.initMemberCenterPage();
}

console.log('✓ member-center.js 已載入 / member-center.js loaded');
