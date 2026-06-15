/**
 * booking-header.js
 * 預約系統 Header 專屬邏輯
 * 功能：
 *   1. updateBookingBadge()  — 讀取 localStorage.bookingCart，計算並更新背包 Badge
 *   2. checkLoginState()     — 讀取登入狀態，切換「登入按鈕 ↔ 用戶頭像」
 *   3. initOffcanvas()       — 手機版漢堡選單展開 / 收起
 *   4. openPanel() / closePanels() — 共用 Slide Panel 開關
 *   5. initLoginPanel()      — 登入 Slide Panel（右側滑入）
 *   6. renderCartPanel()     — 渲染預約背包 Panel 內容
 *   7. initCartPanel()       — 預約背包 Slide Panel（右側滑入）
 *   8. setActiveNavLink()    — 根據目前頁面 URL，自動為對應導覽連結加上 active 樣式
 */

(function () {
  'use strict';

  /* ============================================================
     1. Badge 更新
     ============================================================ */
  function updateBookingBadge() {
    var badge       = document.getElementById('bookingBadge');
    var badgeMobile = document.getElementById('bookingBadgeMobile');

    if (!badge && !badgeMobile) return;

    var stored = localStorage.getItem('bookingCart');
    if (!stored) {
      if (badge)       badge.style.display       = 'none';
      if (badgeMobile) badgeMobile.style.display = 'none';
      return;
    }

    var cart;
    try { cart = JSON.parse(stored); } catch (e) {
      if (badge)       badge.style.display       = 'none';
      if (badgeMobile) badgeMobile.style.display = 'none';
      return;
    }

    var zoneCount = (cart.selected_zones || []).reduce(function (sum, zone) {
      return sum + (zone.quantity || 0);
    }, 0);
    var rentalCount = (cart.selected_rentals || []).reduce(function (sum, rental) {
      return sum + (rental.quantity || 0);
    }, 0);
    var total = zoneCount + rentalCount;

    if (total > 0) {
      var displayText = total > 9 ? '9+' : String(total);
      if (badge)       { badge.textContent       = displayText; badge.style.display       = 'inline-flex'; }
      if (badgeMobile) { badgeMobile.textContent = displayText; badgeMobile.style.display = 'inline-flex'; }
    } else {
      if (badge)       badge.style.display       = 'none';
      if (badgeMobile) badgeMobile.style.display = 'none';
    }
  }

  /* ============================================================
     2. 登入狀態判斷
     ============================================================ */
  function checkLoginState() {
    var loginBtn   = document.getElementById('bkLoginBtn');
    var userMenu   = document.getElementById('bkUserMenu');
    var userAvatar = document.getElementById('bkUserAvatar');
    var userName   = document.getElementById('bkUserName');

    if (!loginBtn || !userMenu) return;

    var user = null;
    try { user = JSON.parse(localStorage.getItem('yuruiUser')); } catch (e) {}

    if (user && user.name) {
      loginBtn.style.display = 'none';
      userMenu.style.display = 'flex';
      if (userAvatar) userAvatar.textContent = user.name.charAt(0).toUpperCase();
      if (userName)   userName.textContent   = user.name;
    } else {
      loginBtn.style.display = 'inline-flex';
      userMenu.style.display = 'none';
    }
  }

  /* ============================================================
     3. Offcanvas 開關邏輯（手機版漢堡選單）
     ============================================================ */
  function initOffcanvas() {
    var hamburger = document.getElementById('bkHamburger');
    var offcanvas = document.getElementById('bkOffcanvas');
    var backdrop  = document.getElementById('bkBackdrop');
    var closeBtn  = document.getElementById('bkOffcanvasClose');

    if (!hamburger || !offcanvas) return;

    function openOffcanvas() {
      offcanvas.classList.add('is-open');
      if (backdrop) backdrop.classList.add('is-visible');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
    }

    function closeOffcanvas() {
      offcanvas.classList.remove('is-open');
      if (backdrop) backdrop.classList.remove('is-visible');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }

    hamburger.addEventListener('click', openOffcanvas);
    if (closeBtn) closeBtn.addEventListener('click', closeOffcanvas);
    if (backdrop) backdrop.addEventListener('click', closeOffcanvas);

    // Esc 關閉 offcanvas
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && offcanvas.classList.contains('is-open')) {
        closeOffcanvas();
      }
    });

    // 手機版「預約背包」按鈕：關閉 offcanvas 再開啟 Cart Panel
    var cartBtnMobile = document.getElementById('bkCartBtnMobile');
    if (cartBtnMobile) {
      cartBtnMobile.addEventListener('click', function () {
        closeOffcanvas();
        var cartPanel = document.getElementById('cartPanel');
        if (cartPanel) {
          renderCartPanel();
          openPanel(cartPanel);
        }
      });
    }
  }

  /* ============================================================
     4. 共用 Slide Panel 開關
     ============================================================ */
  function openPanel(panelEl) {
    panelEl.classList.add('is-open');
    console.log('[BK] openPanel — id:', panelEl.id, 'right (computed):', getComputedStyle(panelEl).right);
    var bd = document.getElementById('bkPanelBackdrop');
    if (bd) bd.classList.add('is-visible');
    document.body.style.overflow = 'hidden';
  }

  function closePanels() {
    var loginPanel = document.getElementById('loginModal');
    var cartPanel  = document.getElementById('cartPanel');
    if (loginPanel) loginPanel.classList.remove('is-open');
    if (cartPanel)  cartPanel.classList.remove('is-open');
    var bd = document.getElementById('bkPanelBackdrop');
    if (bd) bd.classList.remove('is-visible');
    document.body.style.overflow = '';
  }

  /* ============================================================
     5. Login Slide Panel
     ============================================================ */
  function initLoginPanel() {
    var loginBtn = document.getElementById('bkLoginBtn');
    var panel    = document.getElementById('loginModal');

    if (!panel) return;

    // 對外暴露：member-center.js / booking-cart.js 可呼叫 window.openModal('loginModal')
    window.openModal = function (modalId) {
      if (modalId === 'loginModal') openPanel(panel);
    };

    // Header 登入按鈕
    if (loginBtn) {
      loginBtn.addEventListener('click', function (e) {
        e.preventDefault();
        openPanel(panel);
      });
    }

    // ✕ 關閉按鈕
    var closeBtn = document.getElementById('loginPanelClose');
    if (closeBtn) closeBtn.addEventListener('click', closePanels);

    // OAuth 佔位邏輯（未來替換為真實 OAuth redirect）
    function handleOAuth(provider) {
      console.log('[OAuth] 準備使用', provider, '登入');
      alert('【開發中】即將導向 ' + provider + ' 授權頁面');
    }

    var btnGoogle   = document.getElementById('oauthGoogle');
    var btnLine     = document.getElementById('oauthLine');
    var btnFacebook = document.getElementById('oauthFacebook');
    if (btnGoogle)   btnGoogle.addEventListener('click',   function () { handleOAuth('Google'); });
    if (btnLine)     btnLine.addEventListener('click',     function () { handleOAuth('LINE'); });
    if (btnFacebook) btnFacebook.addEventListener('click', function () { handleOAuth('Facebook'); });
  }

  /* ============================================================
     6. 渲染 Cart Panel 內容（從 localStorage 讀取）
     ============================================================ */
  function renderCartPanel() {
    var body   = document.getElementById('cartPanelBody');
    var footer = document.getElementById('cartPanelFooter');
    if (!body) return;

    var stored = localStorage.getItem('bookingCart');
    if (!stored) {
      body.innerHTML = [
        '<div class="cart-panel__empty">',
        '  <i class="bi bi-bag-x"></i>',
        '  <p>背包是空的</p>',
        '  <a href="./camp-search.html" class="btn btn--outline" style="margin-top:0.75rem;">去探索營地</a>',
        '</div>'
      ].join('');
      if (footer) footer.style.display = 'none';
      return;
    }

    var cart;
    try { cart = JSON.parse(stored); } catch (e) { return; }

    var info    = cart.booking_info     || {};
    var zones   = cart.selected_zones   || [];
    var rentals = cart.selected_rentals || [];
    var summary = cart.summary          || {};
    var html    = '';

    // ── 住宿區塊 ──
    if (zones.length > 0) {
      html += '<div class="cart-panel__section">';
      html += '<div class="cart-panel__label">住宿</div>';
      zones.forEach(function (z) {
        html += '<div class="cart-panel__row">';
        html += '<span>' + (info.campground_name || '') + '・' + (z.zone_type || '') + ' ×' + z.quantity + '</span>';
        html += '<span>NT$' + ((z.subtotal || 0).toLocaleString()) + '</span>';
        html += '</div>';
      });
      if (info.check_in) {
        html += '<div class="cart-panel__meta">'
              + '<i class="bi bi-calendar3"></i> '
              + info.check_in + ' ～ ' + info.check_out
              + '（' + (info.total_days || 0) + ' 晚）'
              + '</div>';
      }
      if (info.guest_count) {
        html += '<div class="cart-panel__meta">'
              + '<i class="bi bi-people"></i> ' + info.guest_count + ' 人'
              + (info.region ? '&nbsp;&nbsp;<i class="bi bi-geo-alt"></i> ' + info.region : '')
              + '</div>';
      }
      html += '</div>';
    }

    // ── 裝備租借區塊 ──
    if (rentals.length > 0) {
      html += '<div class="cart-panel__section">';
      html += '<div class="cart-panel__label">裝備租借</div>';
      rentals.forEach(function (r) {
        html += '<div class="cart-panel__row">';
        html += '<span>' + (r.name || '') + ' ×' + r.quantity + '</span>';
        html += '<span>NT$' + ((r.subtotal || 0).toLocaleString()) + '</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    // ── 合計 ──
    if (summary.final_amount !== undefined) {
      html += '<div class="cart-panel__total">'
            + '<span>合計</span>'
            + '<span>NT$' + summary.final_amount.toLocaleString() + '</span>'
            + '</div>';
    }

    // ── 清除背包 ──
    html += '<button class="cart-panel__clear" id="cartPanelClear">清除背包</button>';

    body.innerHTML = html;
    if (footer) footer.style.display = '';

    // 清除背包按鈕
    var clearBtn = document.getElementById('cartPanelClear');
    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (window.confirm('確定清除背包中的所有預約資料？')) {
          localStorage.removeItem('bookingCart');
          updateBookingBadge();
          renderCartPanel();
        }
      });
    }
  }

  /* ============================================================
     7. Cart Slide Panel 初始化
     ============================================================ */
  function initCartPanel() {
    var cartBtn  = document.getElementById('bkCartBtn');
    var panel    = document.getElementById('cartPanel');
    var closeBtn = document.getElementById('cartPanelClose');

    console.log('[BK] initCartPanel — cartBtn:', cartBtn, 'panel:', panel);
    if (!cartBtn || !panel) return;

    cartBtn.addEventListener('click', function (e) {
      e.preventDefault();
      console.log('[BK] cart button clicked');
      try { renderCartPanel(); } catch (err) { console.error('[CartPanel] render error:', err); }
      openPanel(panel);
    });

    if (closeBtn) closeBtn.addEventListener('click', closePanels);
  }

  /* ============================================================
     8. Active 導覽連結標記
     ============================================================ */
  function setActiveNavLink() {
    var path = window.location.pathname;
    var navMap = [
      ['navSearch',      'camp-search'],
      ['navRentalGuide', 'rental-guide'],
      ['navFaq',         'booking-faq'],
    ];
    navMap.forEach(function (item) {
      var el = document.getElementById(item[0]);
      if (el && path.indexOf(item[1]) !== -1) el.classList.add('active');
    });
  }

  /* ============================================================
     初始化
     ============================================================ */
  updateBookingBadge();
  checkLoginState();
  initOffcanvas();
  initLoginPanel();
  initCartPanel();
  setActiveNavLink();

  // 共用：點背景遮罩關閉所有 Panel
  var panelBackdrop = document.getElementById('bkPanelBackdrop');
  if (panelBackdrop) panelBackdrop.addEventListener('click', closePanels);

  // 共用：Esc 鍵關閉所有 Panel
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePanels();
  });

  // 監聽 storage 事件：跨頁籤同步 Badge 與登入狀態
  window.addEventListener('storage', function (e) {
    if (e.key === 'bookingCart') updateBookingBadge();
    if (e.key === 'yuruiUser')   checkLoginState();
  });

})();

// booking-header.html 以 jQuery.getScript 載入此檔後，通知頁面層級的 ready callback。
// 目前僅 booking-cart.js 有定義 window.onBookingHeaderReady；其他頁面不存在，跳過。
if (typeof window.onBookingHeaderReady === 'function') {
  window.onBookingHeaderReady();
}
