// ========================================
// 導航欄（Navbar）組件
// ========================================

// 搜尋關鍵字建議清單（模擬資料）
// Search suggestion keywords (mock data)
const SEARCH_SUGGESTIONS = [
  '帳篷', '睡袋', '登山背包', '折疊椅', '露營燈',
  '炊具組', '防水外套', '登山杖', '野餐墊', '保溫瓶',
  '頭燈', '急救包', '防蚊液', '地釘', '帳篷地布',
  'Coleman', 'Snow Peak', 'Ogawa', 'MSR', 'Primus',
];

/**
 * 初始化導航欄功能
 * Initialize all navbar features
 */
window.initNavbar = () => {
  // 初始化漢堡選單（手機版側邊欄）
  _initHamburgerMenu();

  // 初始化搜尋框
  _initSearchBar();

  // 初始化登入狀態顯示
  window.updateNavbarLoginState();

  // 初始化購物車 Badge
  window.updateCartBadge();
};

/**
 * 私有函數：初始化漢堡選單
 * Private: Initialize hamburger menu for mobile
 */
function _initHamburgerMenu() {
  const hamburger = document.querySelector('.navbar-hamburger');
  const offcanvas = document.querySelector('.navbar-offcanvas');
  const backdrop = document.querySelector('.offcanvas-backdrop');

  if (!hamburger || !offcanvas) return;

  // 點擊漢堡圖示 → 打開側邊欄
  hamburger.addEventListener('click', () => {
    offcanvas.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden'; // 防止背景滾動
  });

  // 點擊關閉按鈕 → 收合側邊欄
  const closeBtn = offcanvas.querySelector('.offcanvas-close');
  if (closeBtn) {
    closeBtn.addEventListener('click', _closeOffcanvas);
  }

  // 點擊背景遮罩 → 收合側邊欄
  if (backdrop) {
    backdrop.addEventListener('click', _closeOffcanvas);
  }

  function _closeOffcanvas() {
    offcanvas.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = ''; // 恢復背景滾動
  }
}

/**
 * 私有函數：初始化搜尋框（含下拉建議）
 * Private: Initialize search bar with dropdown suggestions
 */
function _initSearchBar() {
  const searchInput = document.querySelector('.navbar-search-input');
  const searchDropdown = document.querySelector('.navbar-search-dropdown');
  const searchForm = document.querySelector('.navbar-search-form');

  if (!searchInput || !searchDropdown) return;

  // 當使用者在搜尋框輸入時，過濾並顯示建議
  searchInput.addEventListener('input', window.debounce(() => {
    const query = searchInput.value.trim().toLowerCase();

    if (query.length < 1) {
      // 無輸入：顯示熱門搜尋
      _renderDropdown(SEARCH_SUGGESTIONS.slice(0, 6), searchDropdown, '熱門搜尋');
    } else {
      // 有輸入：過濾符合的關鍵字
      const filtered = SEARCH_SUGGESTIONS.filter(k => k.toLowerCase().includes(query));
      if (filtered.length > 0) {
        _renderDropdown(filtered.slice(0, 6), searchDropdown, '搜尋建議');
      } else {
        _renderDropdown([], searchDropdown, '');
      }
    }
  }, 200));

  // 搜尋框獲得焦點 → 顯示熱門搜尋下拉
  searchInput.addEventListener('focus', () => {
    _renderDropdown(SEARCH_SUGGESTIONS.slice(0, 6), searchDropdown, '熱門搜尋');
    searchDropdown.classList.add('active');
  });

  // 點擊頁面其他地方 → 隱藏下拉
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar-search-wrapper')) {
      searchDropdown.classList.remove('active');
    }
  });

  // 送出搜尋表單（模擬）
  if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = searchInput.value.trim();
      if (query) {
        window.showToast(`搜尋：${query}`, 'info');
        searchDropdown.classList.remove('active');
        // 實際頁面跳轉：window.location.href = `/pages/products.html?q=${encodeURIComponent(query)}`;
      }
    });
  }
}

/**
 * 私有函數：渲染搜尋下拉選單
 * Private: Render search dropdown list
 * @param {string[]} items - 建議關鍵字列表
 * @param {HTMLElement} dropdown - 下拉容器
 * @param {string} title - 標題文字
 */
function _renderDropdown(items, dropdown, title) {
  if (items.length === 0) {
    dropdown.innerHTML = '<div class="search-dropdown-empty">找不到相關搜尋</div>';
    dropdown.classList.add('active');
    return;
  }

  const html = `
    ${title ? `<div class="search-dropdown-title">${title}</div>` : ''}
    <ul class="search-dropdown-list">
      ${items.map(item => `
        <li class="search-dropdown-item" data-keyword="${item}">
          🔍 ${item}
        </li>
      `).join('')}
    </ul>
  `;

  dropdown.innerHTML = html;
  dropdown.classList.add('active');

  // 點擊建議項目 → 填入搜尋框並送出
  dropdown.querySelectorAll('.search-dropdown-item').forEach(el => {
    el.addEventListener('click', () => {
      const keyword = el.dataset.keyword;
      const searchInput = document.querySelector('.navbar-search-input');
      if (searchInput) searchInput.value = keyword;
      dropdown.classList.remove('active');
      window.showToast(`搜尋：${keyword}`, 'info');
    });
  });
}

/**
 * 更新購物車 Badge 計數
 * Update cart badge number
 */
window.updateCartBadge = () => {
  const cartBadge = document.querySelector('.cart-badge');
  if (!cartBadge) return;

  // 計算購物車中商品的總數量
  const count = window.AppState.cart.reduce((sum, item) => sum + item.quantity, 0);
  cartBadge.textContent = count;

  // 有商品才顯示 Badge，沒有則隱藏
  cartBadge.style.display = count > 0 ? 'flex' : 'none';
};

/**
 * 根據登入狀態更新導航欄顯示
 * Update navbar UI based on login state
 */
window.updateNavbarLoginState = () => {
  const loginBtn = document.querySelector('.navbar-login-btn');
  const userMenu = document.querySelector('.navbar-user-menu');

  if (window.AppState.isLoggedIn && window.AppState.currentUser) {
    // 已登入：隱藏「登入」按鈕，顯示用戶選單
    if (loginBtn) loginBtn.style.display = 'none';
    if (userMenu) {
      userMenu.style.display = 'flex';
      const userName = userMenu.querySelector('.user-name');
      const userAvatar = userMenu.querySelector('.user-avatar');
      if (userName) userName.textContent = window.AppState.currentUser.name;
      if (userAvatar) userAvatar.textContent = window.AppState.currentUser.name.charAt(0).toUpperCase();
    }
  } else {
    // 未登入：顯示「登入」按鈕，隱藏用戶選單
    if (loginBtn) loginBtn.style.display = '';
    if (userMenu) userMenu.style.display = 'none';
  }
};

console.log('✓ Navbar 組件已初始化');
