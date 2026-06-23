function initFloatingActions() {
  if (document.querySelector(".floating-actions")) return;

  const floatingActions = document.createElement("div");
  floatingActions.className = "floating-actions";

  floatingActions.innerHTML = `
    <button
      class="floating-top-btn"
      type="button"
      aria-label="回到頁面頂部"
      title="回到頂部"
    >
      <i class="bi bi-chevron-up"></i>
    </button>

    <a
      class="floating-line-btn"
      href="https://line.me"
      target="_blank"
      rel="noopener noreferrer"
      aria-label=" Line 客服"
      title="Line客服"
    >
      <span class="floating-line-label">Line客服</span>

      <span class="floating-line-icon" aria-hidden="true">
        <i class="bi bi-chat-dots-fill"></i>
      </span>
    </a>
  `;

  document.body.appendChild(floatingActions);

  const topButton = floatingActions.querySelector(".floating-top-btn");

  function toggleTopButton() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight;

    // 修改點：當往下滑動超過「網頁總高度的 1/5」時就顯示
    const shouldShow = scrollTop > (window.innerHeight / 5);

    /* 補充提示：
      如果你的網頁非常長，導致「網頁總高度的 1/5」還是要滑很久，
      你可以改成依照「螢幕視窗高度的 1/5」來觸發，程式碼如下：
      const shouldShow = scrollTop > (window.innerHeight / 5);
    */

    topButton.classList.toggle("is-visible", shouldShow);
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

function loadBookingHeaderScript() {
  if (window.__bookingHeaderScriptLoaded) return;
  window.__bookingHeaderScriptLoaded = true;

  const script = document.createElement("script");
  script.src = "../js/booking-header.js";
  script.onerror = function () {
    window.__bookingHeaderScriptLoaded = false;
  };
  document.body.appendChild(script);
}

function loadBookingLayoutPartial(targetSelector, url, partSelector, callback) {
  const target = document.querySelector(targetSelector);
  if (!target) {
    callback && callback(false);
    return Promise.resolve(false);
  }

  return fetch(url)
    .then(function (response) {
      if (!response.ok) throw new Error("booking layout partial 載入失敗: " + url);
      return response.text();
    })
    .then(function (html) {
      const template = document.createElement("template");
      template.innerHTML = html;
      const part = template.content.querySelector(partSelector);
      // 重點：統一 partial 檔內同時保留主站與 booking 版型，booking 頁面只注入 booking-* 區塊內容。
      target.innerHTML = part ? part.innerHTML : html;
      callback && callback(true);
      return true;
    })
    .catch(function (error) {
      console.error(error);
      callback && callback(false);
      return false;
    });
}

window.loadBookingSharedLayout = function () {
  loadBookingLayoutPartial("#booking-header", "../../components/header.partial", '[data-layout-part="booking-header"]', function (ok) {
    if (ok) loadBookingHeaderScript();
  });
  loadBookingLayoutPartial("#booking-footer", "../../components/footer.partial", '[data-layout-part="booking-footer"]');
};

document.addEventListener("DOMContentLoaded", initFloatingActions);
