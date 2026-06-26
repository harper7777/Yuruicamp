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
  _bindAuthStateEvents();

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
  const body = document.body;

  if (!hamburger || !offcanvas) return;

  function _lockBodyScroll() {
    body.classList.add('offcanvas-open');
    body.style.overflow = 'hidden';
  }

  function _unlockBodyScroll() {
    body.classList.remove('offcanvas-open');
    body.style.overflow = '';
  }

  // 點擊漢堡圖示 → 關閉其他 dialog 後打開左側導覽
  hamburger.addEventListener('click', () => {
    window.closeMainHeaderDialogs?.();
    offcanvas.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    hamburger.setAttribute('aria-expanded', 'true');
    _lockBodyScroll();
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
    hamburger.setAttribute('aria-expanded', 'false');
    _unlockBodyScroll();
  }

  _closeOffcanvas();

  /**
   * Exposes the main navigation close action so cart/search can avoid overlapping dialogs.
   */
  window.closeMainNavOffcanvas = _closeOffcanvas;
}

/**
 * 私有函數：初始化搜尋框（含下拉建議）
 * Private: Initialize search bar with dropdown suggestions
 */
function _initSearchBar() {
  const searchInput = document.querySelector('.navbar-search-input');
  const searchDropdown = document.querySelector('.navbar-search-dropdown');
  const searchForm = document.querySelector('.navbar-search-form');
  const searchWrapper = document.querySelector('.navbar-search-wrapper');
  const searchToggle = document.querySelector('.navbar-search-toggle');

  if (!searchInput || !searchDropdown || !searchWrapper) return;

  // Search form starts collapsed; clicking the icon reveals it under the header.
  if (searchToggle && searchToggle.dataset.searchBound !== 'true') {
    searchToggle.dataset.searchBound = 'true';
    searchToggle.addEventListener('click', (e) => {
      e.preventDefault();
      const willOpen = !searchWrapper.classList.contains('is-open');
      searchWrapper.classList.toggle('is-open', willOpen);
      searchForm?.setAttribute('aria-hidden', String(!willOpen));
      searchToggle.setAttribute('aria-expanded', String(willOpen));
      if (willOpen) searchInput.focus();
    });
  }

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
      searchWrapper.classList.remove('is-open');
      searchForm?.setAttribute('aria-hidden', 'true');
      searchToggle?.setAttribute('aria-expanded', 'false');
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
        searchWrapper.classList.remove('is-open');
        searchForm?.setAttribute('aria-hidden', 'true');
        searchToggle?.setAttribute('aria-expanded', 'false');
        searchDropdown.classList.remove('active');
        // 實際頁面跳轉：window.location.href = `/pages/products.html?q=${encodeURIComponent(query)}`;
      }
    });
  }
}

/**
 * Closes visible main-site dialogs before opening another layer.
 */
window.closeMainHeaderDialogs = () => {
  document.querySelector('.navbar-search-wrapper')?.classList.remove('is-open');
  document.querySelector('.navbar-search-form')?.setAttribute('aria-hidden', 'true');
  document.querySelector('.navbar-search-toggle')?.setAttribute('aria-expanded', 'false');
  document.querySelector('.navbar-search-dropdown')?.classList.remove('active');
  document.querySelector('.navbar-user-dropdown')?.setAttribute('hidden', '');
  window.closeMainNavOffcanvas?.();
  document.querySelectorAll('#loginModal.active, #personalizationModal.active').forEach((modal) => {
    modal.classList.remove('active');
  });
};

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
          <i class="bi bi-search" aria-hidden="true"></i> ${item}
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
  cartBadge.hidden = count <= 0;
};

/**
 * 根據登入狀態更新導航欄顯示
 * Update navbar UI based on login state
 */
window.updateNavbarLoginState = () => {
  const loginBtn = document.querySelector('.navbar-login-btn');
  const userMenu = document.querySelector('.navbar-user-menu');
  const user = window.YuruiAuth && typeof window.YuruiAuth.getUser === 'function'
    ? window.YuruiAuth.getUser()
    : (window.AppState.isLoggedIn && window.AppState.currentUser ? window.AppState.currentUser : null);

  if (user) {
    // 已登入：隱藏「登入」按鈕，顯示用戶選單
    if (loginBtn) loginBtn.hidden = true;
    if (userMenu) {
      userMenu.hidden = false;
      const userName = userMenu.querySelector('.user-name');
      const userAvatar = userMenu.querySelector('.user-avatar');
      if (userName) userName.textContent = user.name;
      if (userAvatar) userAvatar.textContent = (user.avatar || user.name.charAt(0)).toUpperCase();
      
      // 初始化用戶選單下拉功能
      _initUserMenuDropdown(userMenu);
    }
  } else {
    // 未登入：顯示「登入」按鈕，隱藏用戶選單
    if (loginBtn) loginBtn.hidden = false;
    if (userMenu) userMenu.hidden = true;
  }
};

/**
 * 綁定共用 auth 事件，讓主站與 booking 的登入狀態即時同步。
 */
function _bindAuthStateEvents() {
  if (document.body.dataset.mainAuthStateBound === 'true') return;
  document.body.dataset.mainAuthStateBound = 'true';

  window.addEventListener('yurui:auth-changed', window.updateNavbarLoginState);
  window.addEventListener('storage', (event) => {
    if (['isLoggedIn', 'currentUser', 'yuruiUser'].includes(event.key)) {
      window.updateNavbarLoginState();
    }
  });
}

/**
 * 私有函數：初始化用戶選單下拉菜單
 * Private: Initialize user menu dropdown
 */
function _initUserMenuDropdown(userMenu) {
  const userInfo = userMenu.querySelector('.user-info');
  const dropdown = userMenu.querySelector('.navbar-user-dropdown');
  const logoutBtn = userMenu.querySelector('.navbar-logout-btn');

  if (!userInfo || !dropdown) return;
  if (userMenu.dataset.dropdownBound === 'true') return;
  userMenu.dataset.dropdownBound = 'true';

  // 點擊用戶信息區 → 打開/關閉下拉菜單
  userInfo.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.hidden = !dropdown.hidden;
  });

  // 點擊登出按鈕 → 執行登出
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      window.handleLogout();
    });
  }

  // 點擊頁面其他地方 → 關閉下拉菜單
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.navbar-user-menu')) {
      dropdown.hidden = true;
    }
  });

  // 點擊下拉菜單中的連結 → 自動關閉下拉
  dropdown.querySelectorAll('.dropdown-item').forEach(item => {
    item.addEventListener('click', () => {
      dropdown.hidden = true;
    });
  });
}

console.log('✓ Navbar 組件已初始化');

/**
 * ========================================
 * 登出功能模組
 * Logout functionality module
 * ========================================
 */

/**
 * 關閉共用會員下拉選單。
 */
function _closeNavbarUserDropdown() {
  const dropdown = document.querySelector('.navbar-user-dropdown');
  if (dropdown) dropdown.hidden = true;
}

/**
 * 執行主站與 booking 共用登出流程。
 */
window.handleLogout = () => {
  if (window.YuruiAuth && typeof window.YuruiAuth.logout === 'function') {
    window.YuruiAuth.logout({ close: _closeNavbarUserDropdown });
    return;
  }

  window.logout();
  _closeNavbarUserDropdown();
  window.updateNavbarLoginState();
  window.showToast && window.showToast('已成功登出', 'success');
};
