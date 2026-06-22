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

document.addEventListener("DOMContentLoaded", initFloatingActions);