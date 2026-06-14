/**
 * admin/js/core.js
 * 後台核心功能：
 *  1. Auth 守衛：未登入自動跳轉登入頁
 *  2. Sidebar 導覽點擊 → AJAX 載入對應 partial + 呼叫初始化函式
 *  3. Topbar 頁面標題動態更新
 *  4. 登出邏輯
 *  5. Toast 工廠函式（供所有模組呼叫）
 */

$(document).ready(function () {

  // ==========================================================
  // === 1. Auth 守衛：驗證是否已登入 ===
  // ==========================================================
  // 說明：進入 dashboard.html 時，先檢查 sessionStorage 是否有登入標記
  //       若未登入則踢回 login.html
  // API 預留：實際串接後，改為向後端驗證 token 是否有效
  const isLoggedIn = sessionStorage.getItem('adminLoggedIn');
  if (!isLoggedIn) {
    window.location.href = 'login.html';
    return; // 停止後續 JS 執行
  }

  // 顯示管理員名稱（從 sessionStorage 取出）
  const adminName = sessionStorage.getItem('adminName') || '管理員';
  $('#sidebarAdminName').text(adminName);
  $('#topbarAdminName').html(`<i class="fas fa-user me-2"></i>${adminName}`);

  // 頭像縮寫（取名字第一個字）
  const initial = adminName.charAt(0).toUpperCase();
  $('#adminAvatarBtn').text(initial);

  // ==========================================================
  // === 2. 預設載入分析報表 ===
  // ==========================================================
  loadSection('analytics');

  // ==========================================================
  // === 3. Sidebar 導覽點擊事件 ===
  // ==========================================================
  // 說明：使用 $(document).on() 是因為手機版 Offcanvas 裡也有一份 Sidebar
  //       $(document).on() 能同時捕捉靜態 Sidebar 與 Offcanvas 裡的連結點擊
  $(document).on('click', '.sidebar-link', function (e) {
    e.preventDefault(); // 阻止連結跳頁

    const section = $(this).data('section');   // 取得模組名稱（例："orders"）
    const title = $(this).data('title');       // 取得頁面標題（例："訂單管理"）

    // 更新 Active 狀態：移除所有 active，只加在被點擊的連結
    // 注意：使用 class 選擇器 `.sidebar-link` 同時更新兩個 Sidebar（桌面版 + 手機版）
    $('.sidebar-link').removeClass('active');
    // 找到所有 data-section 相同的連結（桌面版 + Offcanvas 各一個）
    $(`.sidebar-link[data-section="${section}"]`).addClass('active');

    // 更新 Topbar 頁面標題
    $('#pageTitle').text(title || '後台管理');

    // 載入對應模組的 partial HTML
    loadSection(section);

    // 手機版：關閉 Offcanvas（如果目前是手機版且 Offcanvas 是開著的）
    const offcanvasEl = document.getElementById('mobileSidebar');
    if (offcanvasEl) {
      const offcanvasInstance = bootstrap.Offcanvas.getInstance(offcanvasEl);
      if (offcanvasInstance) offcanvasInstance.hide();
    }
  });

  // ==========================================================
  // === 4. 登出邏輯（Sidebar 底部 + Topbar 下拉選單）===
  // ==========================================================
  // 說明：點擊任意登出按鈕，清除 sessionStorage 並跳回登入頁
  $(document).on('click', '#logoutBtn, #logoutBtnTopbar, .sidebar-logout-mobile', function (e) {
    e.preventDefault();

    // 清除登入狀態
    sessionStorage.removeItem('adminLoggedIn');
    sessionStorage.removeItem('adminName');

    // 跳回登入頁
    window.location.href = 'login.html';
  });

}); // end $(document).ready()

// ==========================================================
// === loadSection(sectionName) — AJAX Partial 載入系統 ===
// ==========================================================
/**
 * 功能：載入指定功能模組的 HTML partial 到 #contentArea，
 *       載入完成後呼叫對應模組的初始化函式
 *
 * @param {string} sectionName - 模組名稱
 *   可選值：'analytics' | 'orders' | 'movement' | 'products' | 'customers' | 'discounts' | 'reviews' | 'bookings'
 *
 * --- API 預留說明 ---
 * 目前從本地 partials/ 資料夾載入靜態 HTML。
 * 若要串接後端，只需將 url 變數改為：
 *   const url = `/api/admin/partials/${sectionName}`;
 * 後端回傳動態 HTML 即可，其餘邏輯完全不變。
 */
function loadSection(sectionName) {
  // 本地 partial 路徑
  const url = `partials/${sectionName}.html`;

  // 顯示 Loading 動畫（在內容出現之前給使用者視覺回饋）
  $('#contentArea').html(`
    <div class="text-center py-5">
      <div class="spinner-border" style="color: var(--admin-brand-accent);"></div>
      <p class="mt-2 text-muted small">載入中...</p>
    </div>
  `);

  // 使用 jQuery $.load() 載入 HTML 到 #contentArea
  // $.load() 說明：
  //   - 第一個參數：要載入的 URL
  //   - 第二個參數（callback）：載入完成後執行的函式
  //   - callback 的 status 參數：'success' 代表成功，'error' 代表失敗
  $('#contentArea').load(url, function (response, status) {

    // 載入失敗時顯示錯誤訊息
    if (status === 'error') {
      $('#contentArea').html(`
        <div class="alert alert-danger d-flex align-items-center gap-2">
          <i class="fas fa-exclamation-triangle"></i>
          <span>載入 <strong>${sectionName}</strong> 模組失敗，請重新整理頁面。</span>
        </div>
      `);
      return;
    }

    // 載入成功：加上淡入動畫效果
    $('#contentArea').addClass('section-fade-in');
    setTimeout(() => $('#contentArea').removeClass('section-fade-in'), 300);

    // 呼叫對應模組的初始化函式
    // 說明：各模組的 JS 檔（analytics.js、orders.js 等）都把初始化函式
    //       掛載到 window 上（window.initXxx = function(){}），
    //       這樣 core.js 就能統一用字典的方式呼叫，不需要 if/else 判斷
    const initFunctions = {
      analytics: window.initAnalytics,
      orders:    window.initOrders,
      movement:  window.initMovement,
      products:  window.initProducts,
      customers: window.initCustomers,
      discounts: window.initDiscounts,
      reviews:   window.initReviews,
      bookings:  window.initBookings,
    };

    // 確認初始化函式存在後再呼叫
    if (typeof initFunctions[sectionName] === 'function') {
      initFunctions[sectionName]();
    }
  });
}

// ==========================================================
// === showAdminToast(message, type) — Toast 工廠函式 ===
// ==========================================================
/**
 * 功能：在後台右下角顯示短暫提示訊息（Toast Notification）
 *
 * @param {string} message - 提示文字
 * @param {string} type    - 類型：'success'（預設）| 'error' | 'info'
 *
 * 呼叫範例：
 *   window.showAdminToast('訂單已更新');
 *   window.showAdminToast('請填寫完整資料', 'error');
 *   window.showAdminToast('操作記錄已儲存', 'info');
 */
window.showAdminToast = function (message, type = 'success') {

  // 顏色與圖示的對照表
  const colorMap = {
    success: 'bg-success',
    error:   'bg-danger',
    danger:  'bg-danger',
    info:    'bg-info',
  };
  const iconMap = {
    success: 'fa-check-circle',
    error:   'fa-times-circle',
    danger:  'fa-times-circle',
    info:    'fa-info-circle',
  };

  const bgClass  = colorMap[type] || colorMap.success;
  const iconClass = iconMap[type] || iconMap.success;

  // Toast HTML 結構（Bootstrap 5 原生 Toast 元件）
  const toastHtml = `
    <div class="toast align-items-center text-white border-0 ${bgClass}"
         role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="fas ${iconClass}"></i>
          <span>${message}</span>
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast" aria-label="關閉"></button>
      </div>
    </div>`;

  // 確保 Toast 容器存在（固定在右下角）
  // 若不存在則動態建立
  if ($('#toastContainer').length === 0) {
    $('body').append(
      '<div id="toastContainer" class="toast-container position-fixed bottom-0 end-0 p-3"' +
      ' style="z-index: 1100;"></div>'
    );
  }

  // 建立 Toast 並加到容器，然後顯示
  const $toast = $(toastHtml).appendTo('#toastContainer');
  const bsToast = new bootstrap.Toast($toast[0], {
    delay: 3000,    // 3 秒後自動消失
    autohide: true, // 自動隱藏
  });
  bsToast.show();

  // Toast 消失後從 DOM 移除，避免越堆越多造成記憶體浪費
  $toast[0].addEventListener('hidden.bs.toast', function () {
    $toast.remove();
  });
};
