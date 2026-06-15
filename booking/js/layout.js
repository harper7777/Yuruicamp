function initFloatingActions() {
  if (document.querySelector(".floating-actions")) return;

  const floatingActions = document.createElement("div");
  floatingActions.className = "floating-actions";

  floatingActions.innerHTML = `
    <a
      class="floating-line-btn"
      href="https://line.me/R/ti/p/%40866acglg"
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

document.addEventListener("DOMContentLoaded", initFloatingActions);
