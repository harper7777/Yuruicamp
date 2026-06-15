/**
 * member-center.js — 預約系統 會員中心 互動邏輯
 *
 * 負責：
 *   1. 側邊欄 nav / 手機 tab → 切換 mc-panel
 *   2. 購買紀錄 sub-tab（商城購買紀錄 ↔ 預約紀錄）
 *   3. 折價券 sub-tab（可使用 ↔ 已失效）
 *   4. 個人資料表單送出
 *   5. 通知全部標為已讀
 */

document.addEventListener('DOMContentLoaded', function () {

  /* ============================================================
     0. 登入守衛
     讀取 localStorage.yuruiUser；未登入則顯示守衛畫面並隱藏主內容。
  ============================================================ */
  var guard  = document.getElementById('mcLoginGuard');
  var mcPage = document.getElementById('mcPage');

  function getUser() {
    try { return JSON.parse(localStorage.getItem('yuruiUser')); } catch (e) { return null; }
  }

  function applyLoginState() {
    var user = getUser();
    if (user && user.name) {
      if (guard)  guard.style.display  = 'none';
      if (mcPage) mcPage.style.display = '';
      // 填入側邊欄使用者資訊
      var avatar = document.getElementById('mcAvatar');
      var name   = document.getElementById('mcName');
      var email  = document.getElementById('mcEmail');
      if (avatar) avatar.textContent = user.name.charAt(0).toUpperCase();
      if (name)   name.textContent   = user.name;
      if (email)  email.textContent  = user.email || '';
    } else {
      if (guard)  guard.style.display  = 'flex';
      if (mcPage) mcPage.style.display = 'none';
    }
  }

  applyLoginState();

  // 「立即登入」按鈕 → 開啟 Header 的登入 Modal
  var guardLoginBtn = document.getElementById('guardLoginBtn');
  if (guardLoginBtn) {
    guardLoginBtn.addEventListener('click', function () {
      if (typeof window.openModal === 'function') {
        window.openModal('loginModal');
      }
    });
  }

  // 其他頁籤完成登入後，同步更新本頁狀態
  window.addEventListener('storage', function (e) {
    if (e.key === 'yuruiUser') applyLoginState();
  });

  /* ============================================================
     1. 主 Panel 切換（側邊欄 + 手機 tab 共用）
  ============================================================ */
  function switchPanel(tab) {
    // 側邊欄 nav
    document.querySelectorAll('.mc-nav-item').forEach(function (item) {
      item.classList.toggle('active', item.dataset.tab === tab);
    });

    // 手機 tab
    document.querySelectorAll('.mc-tab-mobile').forEach(function (btn) {
      btn.classList.toggle('active', btn.dataset.tab === tab);
    });

    // Panel 顯示
    document.querySelectorAll('.mc-panel').forEach(function (panel) {
      panel.classList.toggle('active', panel.dataset.panel === tab);
    });
  }

  // 側邊欄點擊
  document.querySelectorAll('.mc-nav-item').forEach(function (item) {
    item.addEventListener('click', function () {
      switchPanel(this.dataset.tab);
    });
  });

  // 手機 tab 點擊
  document.querySelectorAll('.mc-tab-mobile').forEach(function (btn) {
    btn.addEventListener('click', function () {
      switchPanel(this.dataset.tab);
    });
  });

  // URL 帶 ?tab= 參數時自動切換
  var urlTab = new URLSearchParams(window.location.search).get('tab');
  if (urlTab) switchPanel(urlTab);

  /* ============================================================
     2. 購買紀錄 Sub-tab（商城購買紀錄 / 預約紀錄）
  ============================================================ */
  document.querySelectorAll('.rec-tab[data-rec]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var rec = this.dataset.rec;

      // 切換 tab 樣式
      document.querySelectorAll('.rec-tab[data-rec]').forEach(function (t) {
        t.classList.toggle('active', t.dataset.rec === rec);
      });

      // 切換 panel
      document.querySelectorAll('.rec-panel[data-rec-panel]').forEach(function (panel) {
        panel.classList.toggle('active', panel.dataset.recPanel === rec);
      });
    });
  });

  /* ============================================================
     3. 折價券 Sub-tab（可使用 / 已失效）
  ============================================================ */
  document.querySelectorAll('.rec-tab[data-coupon-tab]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var which = this.dataset.couponTab;

      document.querySelectorAll('.rec-tab[data-coupon-tab]').forEach(function (t) {
        t.classList.toggle('active', t.dataset.couponTab === which);
      });

      var usable  = document.getElementById('usableCoupons');
      var expired = document.getElementById('expiredCoupons');
      if (usable)  usable.style.display  = (which === 'usable')  ? '' : 'none';
      if (expired) expired.style.display = (which === 'expired') ? '' : 'none';
    });
  });

  /* ============================================================
     4. 個人資料表單
  ============================================================ */
  var profileForm = document.getElementById('profileForm');
  if (profileForm) {
    profileForm.addEventListener('submit', function (e) {
      e.preventDefault();
      // 實際專案應呼叫 API；此處以 alert 示意
      alert('個人資料已儲存！');
    });
  }

  /* ============================================================
     5. 通知：全部標為已讀
  ============================================================ */
  var markAllBtn = document.getElementById('markAllReadBtn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', function () {
      document.querySelectorAll('.notif-item__dot').forEach(function (dot) {
        dot.classList.add('read');
      });
      document.getElementById('statUnread').textContent = '0';
    });
  }

});
