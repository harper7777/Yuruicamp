// ========================================
// Yuruicamp 應用入口
// ========================================
// 此文件初始化應用並設置全局事件監聽器
// ===================================================



// 用來記錄「全局組件是否已被初始化」的旗標
// Guard flag: prevent double-initialization when page JS already called init functions
window._appComponentsInitialized = false;

/**
 * 應用初始化函數（被各頁面 JS 呼叫，或由 main.js 自行呼叫）
 * App init function - called by page JS or by main.js itself
 *
 * 若頁面 JS（如 home.js、product-list.js）已自行初始化過，
 * 這裡只補跑「全局事件監聽」，不重複跑 header/modal/cart。
 */
window.initApp = async () => {
  console.log('========================================');
  console.log('Yuruicamp 應用初始化');
  console.log('========================================');

  // 全局事件監聽（online/offline/beforeunload）始終需要設定
  window.initGlobalListeners();
  // 先載入 header/footer HTML 與 header.js
  await initGlobalLayout();

  // 若頁面 JS 尚未初始化全局組件，在此補上
  // If page JS hasn't initialized global components yet, do it now
  if (!window._appComponentsInitialized) {
    window.initNavbar();
    window.initModalListeners();
    window.initCartListeners();
    window.initPersonalizationModal();
    window._appComponentsInitialized = true;
  }

  initFloatingActions(); // 懸浮按鈕
  window.initLazyLoadingFallback?.();



  // 第 13 階段：offcanvas 開啟時鎖住 body 捲動（iOS Safari 需要）
  // Stage 13: Lock body scroll when offcanvas is open (required for iOS Safari)
  window.initBodyScrollLock();
  // 偵測目前頁面，呼叫對應的頁面初始化函式
  if (typeof window.initHomePage === 'function') {
    await window.initHomePage();
  }

  console.log('✓ 應用初始化完成');
  console.log('AppState:', window.AppState);
};


window.initGlobalListeners = () => { 
  // 記錄頁面卸載
  window.addEventListener('beforeunload', () => {
    window.saveAppState();
  });
  
  // 性能監測（使用 PerformanceObserver 更精確）
  // Performance monitoring using PerformanceObserver
  window.addEventListener('load', () => {
    // 基本計算方式（舊版）
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log(`⏱️ 頁面加載時間: ${pageLoadTime}ms`);

    // 現代 API：LCP（最大內容繪製）監測
    // Largest Contentful Paint monitoring (modern browsers only)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log(`🎨 LCP（最大內容繪製）: ${lastEntry.startTime.toFixed(0)}ms`);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        // LCP 不支援時靜默跳過 / Silently ignore if LCP not supported
      }
    }

    // 頁面加載時間警告（超過 3 秒提醒）
    // Warn if page takes over 3 seconds to load
    if (pageLoadTime > 3000) {
      console.warn(`⚠️ 頁面加載超過 3 秒（${pageLoadTime}ms），建議優化資源`);
    }
  });
};


/**
 * 第 13 階段：Body Scroll Lock（鎖定 body 捲動）
 * 當 Offcanvas 或 Modal 開啟時，防止背景頁面繼續捲動
 * 特別是 iOS Safari 需要 position: fixed 才有效
 *
 * Body scroll lock for offcanvas/modal open state
 * iOS Safari requires position:fixed to truly prevent background scroll
 */
window.initBodyScrollLock = () => {
  let scrollY = 0; // 記錄捲動位置，關閉時還原

  // 觀察 body 是否有 offcanvas-open class
  // Watch for offcanvas-open class on body
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const isOpen = document.body.classList.contains('offcanvas-open');
        if (isOpen) {
          // 記住目前捲動位置，套用固定
          // Remember scroll position and fix body
          scrollY = window.scrollY;
          document.body.style.top = `-${scrollY}px`;
        } else {
          // 還原捲動位置
          // Restore scroll position
          document.body.style.top = '';
          window.scrollTo(0, scrollY);
        }
      }
    });
  });

  observer.observe(document.body, { attributes: true, attributeFilter: ['class'] });
};

// 全局佈局動態載入 (Header & Footer)
// ===================================================

// 輔助函式：載入局部 HTML
async function loadPartial(targetId, url) {
  const target = document.getElementById(targetId);
  if (!target) return;
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`無法載入組件: ${url}`);
    target.innerHTML = await response.text();
  } catch (error) {
    console.error(error);
  }
}

// 輔助函式：動態載入 JS 腳本
function loadComponentScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

// 主初始化流程
async function initGlobalLayout() {
  // 1. 根據目錄樹，從 pages/* 往上找頂層的 components/
  await Promise.all([
    loadPartial("header", "../components/header.html"),
    loadPartial("footer", "../components/footer.html") 
  ]);

  // 2. 確定 HTML 結構長到網頁上後，才動態載入原本的互動 JS
  try {
    // 這樣可以確保手機版漢堡選單、登入彈出視窗的功能不會失效
    await loadComponentScript("../js/components/header.js");
    
  } catch (error) {
    console.error("組件腳本載入失敗:", error);
  }
}

function initFloatingActions() {
  if (document.querySelector(".floating-actions")) return;

  const floatingActions = document.createElement("div");
  floatingActions.className = "floating-actions";

  floatingActions.innerHTML = `
    <a
      class="floating-line-btn"
      href="#"
      target="_blank"
      rel="noopener noreferrer"
      title="Line 客服"
    >
      
      <span class="floating-line-icon" aria-hidden="true">
        <i class="bi bi-chat-dots-fill"></i>
      </span>
    </a>

    <button
      class="floating-top-btn"
      type="button"
      aria-label="回到頁面頂部"
      title="回到頂部"
    >
      <i class="bi bi-chevron-up"></i>
    </button>
  `;

  document.body.appendChild(floatingActions);

  const topButton = floatingActions.querySelector(".floating-top-btn");

  function toggleTopButton() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;

    const isNearBottom = scrollTop + windowHeight >= documentHeight - 280;

    topButton.classList.toggle("is-visible", isNearBottom);
  }

  topButton.addEventListener("click", function () {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  });

  window.addEventListener("scroll", toggleTopButton, { passive: true });
  window.addEventListener("resize", toggleTopButton);

  toggleTopButton();
}
async function initLayout() {
  await Promise.all([
    loadPartial("site-header", "./partials/header.html"),
    loadPartial("site-footer", "./partials/footer.html")
  ]);

  setActiveNav();
  initMenuToggle();
  initHeaderScroll();
  initFloatingActions();
}

document.addEventListener("DOMContentLoaded", initLayout);
/**
 * 應用啟動入口
 * 等待 DOM 完全加載後執行
 */
if (document.readyState === 'loading') {
  // DOM 仍在加載中
  document.addEventListener('DOMContentLoaded', window.initApp);
} else {
  // DOM 已加載完成
  window.initApp();
}

console.log('✓ Main.js 已加載');
