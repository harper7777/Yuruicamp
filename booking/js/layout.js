/**
 * Creates the floating scroll-to-top and LINE shortcut buttons on booking pages.
 */
function initFloatingActions() {
  if (document.querySelector('.floating-actions')) return;

  const floatingActions = document.createElement('div');
  floatingActions.className = 'floating-actions';
  floatingActions.innerHTML = `
    <button
      class="floating-top-btn"
      type="button"
      aria-label="回到頁面頂端"
      title="回到頁面頂端"
    >
      <i class="bi bi-chevron-up"></i>
    </button>
    <a
      class="floating-line-btn"
      href="https://line.me"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="LINE 聯絡"
      title="LINE 聯絡"
    >
      <span class="floating-line-label">LINE 聯絡</span>
      <span class="floating-line-icon" aria-hidden="true">
        <i class="bi bi-chat-dots-fill"></i>
      </span>
    </a>
  `;

  document.body.appendChild(floatingActions);

  const topButton = floatingActions.querySelector('.floating-top-btn');

  /**
   * Shows the top button only after the user scrolls past the first viewport segment.
   */
  function toggleTopButton() {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const shouldShow = scrollTop > (window.innerHeight / 5);
    topButton.classList.toggle('is-visible', shouldShow);
  }

  topButton.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  window.addEventListener('scroll', toggleTopButton, { passive: true });
  window.addEventListener('resize', toggleTopButton);
  toggleTopButton();
}

/**
 * Loads a script once and uses a window flag to prevent duplicate event bindings.
 * @param {string} src - Script URL to load.
 * @param {string} flagName - Window flag used to mark a loaded script.
 * @returns {Promise<void>} Resolves after the script loads.
 */
function loadScriptOnce(src, flagName) {
  return new Promise(function (resolve, reject) {
    if (window[flagName]) {
      resolve();
      return;
    }

    window[flagName] = true;
    const script = document.createElement('script');
    script.src = src;
    script.onload = function () { resolve(); };
    script.onerror = function () {
      window[flagName] = false;
      reject(new Error('script load failed: ' + src));
    };
    document.body.appendChild(script);
  });
}

/**
 * Loads shared auth first, then the booking header controller.
 */
function loadBookingHeaderScript() {
  loadScriptOnce('../../js/components/auth.js', '__yuruiAuthScriptLoaded')
    .then(function () {
      return loadScriptOnce('../js/booking-header.js', '__bookingHeaderScriptLoaded');
    })
    .catch(function (error) {
      console.error(error);
    });
}

/**
 * Loads one data-layout-part from a shared partial into a booking page target.
 * @param {string} targetSelector - Target element selector.
 * @param {string} url - Partial URL.
 * @param {string} partSelector - data-layout-part selector to extract.
 * @param {Function=} callback - Optional completion callback.
 * @returns {Promise<boolean>} Whether the partial was loaded.
 */
function loadBookingLayoutPartial(targetSelector, url, partSelector, callback) {
  const target = document.querySelector(targetSelector);
  if (!target) {
    if (callback) callback(false);
    return Promise.resolve(false);
  }

  return fetch(url)
    .then(function (response) {
      if (!response.ok) throw new Error('booking layout partial load failed: ' + url);
      return response.text();
    })
    .then(function (html) {
      const template = document.createElement('template');
      template.innerHTML = html;
      const part = template.content.querySelector(partSelector);
      const content = part ? part.innerHTML : html;

      // Shared auth is appended after the booking header so both systems use one modal.
      if (partSelector === '[data-layout-part="shared-auth"]') {
        target.insertAdjacentHTML('beforeend', content);
      } else {
        target.innerHTML = content;
      }

      if (callback) callback(true);
      return true;
    })
    .catch(function (error) {
      console.error(error);
      if (callback) callback(false);
      return false;
    });
}

/**
 * Loads the booking header, shared auth modal, and footer for booking pages.
 */
window.loadBookingSharedLayout = function () {
  loadBookingLayoutPartial('#booking-header', '../../components/header.partial', '[data-layout-part="booking-header"]', function (ok) {
    if (!ok) return;
    loadBookingLayoutPartial('#booking-header', '../../components/header.partial', '[data-layout-part="shared-auth"]', function () {
      loadBookingHeaderScript();
    });
  });
  loadBookingLayoutPartial('#booking-footer', '../../components/footer.partial', '[data-layout-part="booking-footer"]');
};

document.addEventListener('DOMContentLoaded', initFloatingActions);
