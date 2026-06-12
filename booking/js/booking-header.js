/**
 * booking-header.js
 * 預約系統 Header 專屬邏輯
 * 功能：
 *   1. updateBookingBadge()  — 讀取 localStorage.bookingCart，計算並更新背包 Badge
 *   2. checkLoginState()     — 讀取登入狀態，切換「登入按鈕 ↔ 用戶頭像」
 *   3. Offcanvas 開關邏輯   — 手機版漢堡選單展開 / 收起
 *   4. storage 事件監聽     — 跨頁面同步 Badge（在其他頁籤改動購物車時即時更新）
 *   5. setActiveNavLink()   — 根據目前頁面 URL，自動為對應導覽連結加上 active 樣式
 *
 * 注意：此檔案由 booking-header.html 內部引入，
 *       確保在 Header DOM 元素載入後才執行。
 */

(function () {
  'use strict';

  /* ============================================================
     1. Badge 更新
     讀取 localStorage 中的 bookingCart，
     計算「已選營位數量 + 已選裝備數量」並顯示在 Badge 上。
     ============================================================ */
  function updateBookingBadge() {
    // 找到桌機版 Badge（id="bookingBadge"）與手機版 Badge（id="bookingBadgeMobile"）
    var badge       = document.getElementById('bookingBadge');
    var badgeMobile = document.getElementById('bookingBadgeMobile');

    // 如果 Badge 元素不存在，直接離開（避免錯誤）
    if (!badge && !badgeMobile) return;

    var stored = localStorage.getItem('bookingCart');

    // 沒有購物車資料 → 隱藏 Badge
    if (!stored) {
      if (badge)       badge.style.display       = 'none';
      if (badgeMobile) badgeMobile.style.display = 'none';
      return;
    }

    var cart;
    try {
      cart = JSON.parse(stored);
    } catch (e) {
      // JSON 解析失敗 → 資料異常，隱藏 Badge
      if (badge)       badge.style.display       = 'none';
      if (badgeMobile) badgeMobile.style.display = 'none';
      return;
    }

    // 計算：已選營位數量（selected_zones 每筆 quantity 加總）
    var zoneCount = (cart.selected_zones || []).reduce(function (sum, zone) {
      return sum + (zone.quantity || 0);
    }, 0);

    // 計算：已選租借裝備數量（selected_rentals 每筆 quantity 加總）
    var rentalCount = (cart.selected_rentals || []).reduce(function (sum, rental) {
      return sum + (rental.quantity || 0);
    }, 0);

    var total = zoneCount + rentalCount;

    if (total > 0) {
      // 超過 9 筆顯示「9+」，避免數字太長
      var displayText = total > 9 ? '9+' : String(total);
      if (badge) {
        badge.textContent    = displayText;
        badge.style.display  = 'inline-flex';
      }
      if (badgeMobile) {
        badgeMobile.textContent   = displayText;
        badgeMobile.style.display = 'inline-flex';
      }
    } else {
      // 數量為 0 → 隱藏 Badge，不顯示 0
      if (badge)       badge.style.display       = 'none';
      if (badgeMobile) badgeMobile.style.display = 'none';
    }
  }

  /* ============================================================
     2. 登入狀態判斷
     讀取 localStorage.yuruiUser（JSON 字串），
     已登入 → 顯示頭像 + 姓名；未登入 → 顯示「登入」按鈕。
     ============================================================ */
  function checkLoginState() {
    var loginBtn  = document.getElementById('bkLoginBtn');
    var userMenu  = document.getElementById('bkUserMenu');
    var userAvatar = document.getElementById('bkUserAvatar');
    var userName  = document.getElementById('bkUserName');

    // 元素不存在時安全離開
    if (!loginBtn || !userMenu) return;

    var storedUser = localStorage.getItem('yuruiUser');
    var user = null;

    if (storedUser) {
      try {
        user = JSON.parse(storedUser);
      } catch (e) {
        user = null;
      }
    }

    if (user && user.name) {
      // 已登入：隱藏登入按鈕，顯示頭像區塊
      loginBtn.style.display  = 'none';
      userMenu.style.display  = 'flex';

      // 顯示姓名首字作為頭像文字
      if (userAvatar) userAvatar.textContent = user.name.charAt(0).toUpperCase();
      if (userName)   userName.textContent   = user.name;
    } else {
      // 未登入：顯示登入按鈕，隱藏頭像區塊
      loginBtn.style.display  = 'inline-flex';
      userMenu.style.display  = 'none';
    }
  }

  /* ============================================================
     3. Offcanvas 開關邏輯（手機版漢堡選單）
     點擊漢堡圖示 → 展開側邊選單
     點擊 X 或背景遮罩 → 收起選單
     ============================================================ */
  function initOffcanvas() {
    var hamburger = document.getElementById('bkHamburger');
    var offcanvas = document.getElementById('bkOffcanvas');
    var backdrop  = document.getElementById('bkBackdrop');
    var closeBtn  = document.getElementById('bkOffcanvasClose');

    if (!hamburger || !offcanvas) return;

    // 展開 Offcanvas
    function openOffcanvas() {
      offcanvas.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-visible');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden'; // 防止背景捲動
    }

    // 收起 Offcanvas
    function closeOffcanvas() {
      offcanvas.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-visible');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', openOffcanvas);
    if (closeBtn) closeBtn.addEventListener('click', closeOffcanvas);
    if (backdrop) backdrop.addEventListener('click', closeOffcanvas);

    // 按下 Esc 鍵也可關閉
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && offcanvas.classList.contains('is-open')) {
        closeOffcanvas();
      }
    });
  }

  /* ============================================================
     4. Modal 開關邏輯（登入 Modal）
     ============================================================ */
  function initLoginModal() {
    var loginBtn     = document.getElementById('bkLoginBtn');
    var modalBackdrop = document.getElementById('bkModalBackdrop');
    var modal        = document.getElementById('loginModal');

    if (!modal) return;

    // 切換 Tab（登入 / 免費註冊）
    var tabBtns   = modal.querySelectorAll('.modal-tab-btn');
    var tabPanels = modal.querySelectorAll('.modal-tab-panel');

    tabBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-tab');
        tabBtns.forEach(function (b) { b.classList.remove('active'); });
        tabPanels.forEach(function (p) { p.classList.remove('active'); });
        btn.classList.add('active');
        var targetPanel = modal.querySelector('[data-panel="' + target + '"]');
        if (targetPanel) targetPanel.classList.add('active');
      });
    });

    // 開啟 Modal
    function openModal() {
      modal.style.display = 'flex';
      if (modalBackdrop) modalBackdrop.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }

    // 關閉 Modal
    function closeModal() {
      modal.style.display = 'none';
      if (modalBackdrop) modalBackdrop.style.display = 'none';
      document.body.style.overflow = '';
    }

    // 掛載全域方法，讓其他頁面也可呼叫 openModal('loginModal')
    window.openModal = function (modalId) {
      if (modalId === 'loginModal') openModal();
    };

    // 登入按鈕點擊事件（作為 onclick 的備用）
    if (loginBtn) {
      loginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        openModal();
      });
    }

    // 點 X 關閉
    var closeBtn = modal.querySelector('.modal-close');
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    // 點背景遮罩關閉
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);

    // Esc 關閉
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.style.display === 'flex') closeModal();
    });
  }

  /* ============================================================
     5. Active 導覽連結標記
     根據目前頁面的檔案名稱，為對應導覽連結加上 active class
     例如：URL 含 camp-search.html → navSearch 加 active
     ============================================================ */
  function setActiveNavLink() {
    var path = window.location.pathname;

    // 對應表：[元素 id, 對應頁面關鍵字]
    var navMap = [
      ['navSearch',      'camp-search'],
      ['navRentalGuide', 'rental-guide'],
      ['navFaq',         'booking-faq'],
    ];

    navMap.forEach(function (item) {
      var el = document.getElementById(item[0]);
      if (el && path.indexOf(item[1]) !== -1) {
        el.classList.add('active');
      }
    });
  }

  /* ============================================================
     初始化：頁面載入時執行一次，並監聽 storage 事件跨頁同步
     ============================================================ */
  updateBookingBadge();  // 初始化 Badge
  checkLoginState();     // 初始化登入狀態
  initOffcanvas();       // 初始化 Offcanvas
  initLoginModal();      // 初始化 Modal
  setActiveNavLink();    // 標記目前頁面對應導覽連結

  // 監聽 storage 事件：其他頁籤修改 bookingCart 或 yuruiUser 時即時同步
  window.addEventListener('storage', function (e) {
    if (e.key === 'bookingCart') updateBookingBadge();
    if (e.key === 'yuruiUser')   checkLoginState();
  });

})();
