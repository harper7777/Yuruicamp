// ========================================
// Modal 模態窗口組件
// ========================================

// ----------------------------------------
// 基礎 Modal 開關
// Basic Modal open/close functions
// ----------------------------------------

/**
 * 打開指定 Modal
 * Open a modal by ID
 * @param {string} modalId - Modal 的 id 屬性值
 */
window.openModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('active');
    document.body.style.overflow = 'hidden'; // 防止背景頁面滾動
  }
};

/**
 * Validate a survey step before allowing the next action.
 * @param {number} count - Selected tag count
 * @param {number} minimum - Required selected tag count
 * @returns {boolean} Whether the step can continue
 */
function _validateSurveySelection(count, minimum) {
  if (count >= minimum) return true;

  // Empty selections use the exact product prompt requested by review.
  const message = count === 0 ? SURVEY_MIN_ONE_MESSAGE : SURVEY_MIN_TWO_MESSAGE;
  window.showToast && window.showToast(message, 'warning');
  return false;
}

/**
 * Ask before closing an unfinished personalization survey.
 */
function _requestPersonalizationClose() {
  if (_personalizationCompleted) {
    window.closeModal('personalizationModal', { force: true });
    return;
  }

  // Close button is the only exit path and requires confirmation while unfinished.
  if (window.confirm(SURVEY_UNFINISHED_CLOSE_MESSAGE)) {
    window.closeModal('personalizationModal', { force: true });
  }
}

/**
 * Flatten step 1 and step 2 survey answers into one member-center preference list.
 * @param {{ styles?: string[], equipment?: string[] }} preferences
 * @returns {string[]} Combined selected values
 */
function _flattenSurveyPreferences(preferences) {
  return [
    ...(preferences.styles || []),
    ...(preferences.equipment || []),
  ];
}

/**
 * Persist survey preferences to the profile storage used by member-center.
 * @param {{ styles?: string[], equipment?: string[] }} preferences
 */
function _syncProfilePreferenceStorage(preferences) {
  const profile = JSON.parse(localStorage.getItem('yurui_profile') || '{}');
  profile.preferences = _flattenSurveyPreferences(preferences);
  localStorage.setItem('yurui_profile', JSON.stringify(profile));
}

/**
 * Notify member-center to repaint visible preference tags when it is on the page.
 * @param {{ styles?: string[], equipment?: string[] }} preferences
 */
function _syncVisibleMemberPreferenceTags(preferences) {
  // Direct hook updates the current member-center page without reloading.
  window.syncMemberPreferenceTags && window.syncMemberPreferenceTags(preferences);

  // Event hook lets member-center subscribe when loaded after this module.
  window.dispatchEvent(new CustomEvent('yurui:preferences-updated', {
    detail: preferences,
  }));
}

/**
 * 關閉指定 Modal
 * Close a modal by ID
 * @param {string} modalId - Modal 的 id 屬性值
 */
window.closeModal = (modalId, options = {}) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    // Guard action: unfinished personalization surveys must confirm before closing.
    if (modalId === 'personalizationModal' && !options.force && !_personalizationCompleted) {
      _requestPersonalizationClose();
      return;
    }

    modal.classList.remove('active');
    document.body.style.overflow = ''; // 恢復頁面滾動
  }
};

// ----------------------------------------
// 初始化全局 Modal 監聽器
// Initialize global modal event listeners
// ----------------------------------------

/**
 * 初始化所有 Modal 的通用事件
 * - 點擊背景關閉
 * - 點擊關閉按鈕
 * - ESC 鍵關閉
 */
window.initModalListeners = () => {
  // 點擊 Modal 最外層（背景遮罩）→ 關閉
  if (!document.body.dataset.modalBackdropBound) {
    document.body.dataset.modalBackdropBound = 'true';
    // Backdrop click: personalization survey must stay open until the close button is used.
    document.addEventListener('click', (e) => {
      if (!e.target.classList.contains('modal')) return;
      if (e.target.id === 'personalizationModal') return;
      window.closeModal(e.target.id);
    });
  }

  // 點擊 .modal-close 按鈕 → 關閉所在 Modal
  document.querySelectorAll('.modal-close').forEach(btn => {
    if (btn.dataset.modalCloseBound === 'true') return;
    btn.dataset.modalCloseBound = 'true';
    btn.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (!modal) return;
      // Personalization close button requires an unfinished-survey confirmation.
      if (modal.id === 'personalizationModal') {
        _requestPersonalizationClose();
        return;
      }
      window.closeModal(modal.id);
    });
  });

  // ESC 鍵 → 關閉當前開啟的 Modal
  if (!document.body.dataset.modalEscBound) {
    document.body.dataset.modalEscBound = 'true';
    // ESC close is disabled for personalization so users do not lose unfinished choices.
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      const activeModal = document.querySelector('.modal.active');
      if (!activeModal || activeModal.id === 'personalizationModal') return;
      window.closeModal(activeModal.id);
    });
  }

  // 初始化登入 Modal 的互動邏輯
  _initLoginModal();
};

// ----------------------------------------
// 步驟 3.2：登入/註冊 Modal
// Step 3.2: Login/Register Modal
// ----------------------------------------

/**
 * 初始化登入/註冊 Modal 的所有互動
 * Initialize login modal interactions:
 * - Google 社群登入（模擬）
 * - LINE 社群登入（模擬）
 */
function _initLoginModal() {
  const loginModal = document.getElementById('loginModal');
  if (!loginModal) return;

  // Google 登入按鈕（模擬）
  const googleBtns = loginModal.querySelectorAll('.btn-google-login, .btn-facebook-login');
  googleBtns.forEach(btn => {
    if (btn.dataset.loginBound === 'true') return;
    btn.dataset.loginBound = 'true';
    btn.addEventListener('click', () => {
      _handleLoginSuccess({
        name: 'Google 用戶',
        email: 'user@gmail.com',
        avatar: null,
        provider: 'google',
      });
    });
  });

  // LINE 登入按鈕（模擬）
  const lineBtns = loginModal.querySelectorAll('.btn-line-login');
  lineBtns.forEach(btn => {
    if (btn.dataset.loginBound === 'true') return;
    btn.dataset.loginBound = 'true';
    btn.addEventListener('click', () => {
      _handleLoginSuccess({
        name: 'LINE 用戶',
        email: 'user@line.me',
        avatar: null,
        provider: 'line',
      });
    });
  });
}

/**
 * 處理登入成功後的一系列動作
 * Handle post-login actions:
 * 1. 更新全局狀態
 * 2. 更新導航欄顯示
 * 3. 關閉登入 Modal
 * 4. 開啟個人化問卷 Modal
 *
 * @param {{ name: string, email: string, avatar: string|null, provider: string }} user
 */
function _handleLoginSuccess(user) {
  // 1. 更新全局狀態
  // 社群登入成功後必須標記為已登入，Navbar 才會顯示使用者頭像與名稱。
  window.AppState.isLoggedIn = true;
  window.AppState.currentUser = user;
  window.saveAppState();

  // 2. 更新導航欄（顯示用戶名稱，隱藏登入按鈕）
  window.updateNavbarLoginState();

  // 3. 關閉登入 Modal
  window.closeModal('loginModal');

  // 4. 延遲 300ms 再開啟問卷（視覺上更流暢）
  setTimeout(() => {
    window.openPersonalizationModal();
  }, 300);
}

// ----------------------------------------
// 步驟 3.3：個人化問卷 Modal（Stepper）
// Step 3.3: Personalization Questionnaire Modal (Stepper)
// ----------------------------------------

// 儲存用戶選擇的答案
// Store user's selected answers
let _surveyAnswers = {
  styles: [],    // 問題 1：偏好風格
  equipment: [], // 問題 2：想添購的裝備
};

// Survey validation messages shown before users can move between steps or finish.
const SURVEY_MIN_ONE_MESSAGE = '請至少選擇一個選項';
const SURVEY_MIN_TWO_MESSAGE = '請至少選擇兩個選項';
const SURVEY_UNFINISHED_CLOSE_MESSAGE = '選項還未完成要關閉視窗之後再來填寫嗎?';

// Tracks whether the current personalization session reached the Finish action.
let _personalizationCompleted = false;

/**
 * 打開個人化問卷 Modal
 * Open the personalization survey modal
 */
window.openPersonalizationModal = () => {
  // 重置答案
  _surveyAnswers = { styles: [], equipment: [] };
  _personalizationCompleted = false;

  // Clear any stale active choices from a previous unfinished survey session.
  document.querySelectorAll('#personalizationModal .survey-tag.active').forEach(tag => {
    tag.classList.remove('active');
  });

  // 重置到第一步
  _goToSurveyStep(1);

  window.openModal('personalizationModal');
};

/**
 * 初始化個人化問卷的互動邏輯
 * Initialize personalization survey interactions
 */
window.initPersonalizationModal = () => {
  const modal = document.getElementById('personalizationModal');
  if (!modal) return;
  if (modal.dataset.personalizationBound === 'true') return;
  modal.dataset.personalizationBound = 'true';

  // 標籤（Tag）多選邏輯：點擊切換 active 狀態
  // Tag multi-select: toggle active class on click
  modal.addEventListener('click', (e) => {
    // 點擊選項標籤
    if (e.target.classList.contains('survey-tag')) {
      e.target.classList.toggle('active');
    }

    // 點擊「下一步」按鈕（第一步 → 第二步）
    if (e.target.id === 'surveyNextBtn') {
      // 收集第一步的選擇
      const step1Tags = modal.querySelectorAll('[data-step="1"] .survey-tag.active');
      // Next action: require at least 2 step-1 choices before moving forward.
      if (!_validateSurveySelection(step1Tags.length, 2)) return;
      _surveyAnswers.styles = Array.from(step1Tags).map(t => t.dataset.value);
      _goToSurveyStep(2);
    }

    // 點擊「完成」按鈕（第二步 → 完成）
    if (e.target.id === 'surveyFinishBtn') {
      // 收集第二步的選擇
      const step2Tags = modal.querySelectorAll('[data-step="2"] .survey-tag.active');
      const step1Tags = modal.querySelectorAll('[data-step="1"] .survey-tag.active');
      // Finish action: re-check step 1 and require at least 2 step-2 choices.
      if (!_validateSurveySelection(step1Tags.length, 2)) {
        _goToSurveyStep(1);
        return;
      }
      if (!_validateSurveySelection(step2Tags.length, 2)) return;
      _surveyAnswers.styles = Array.from(step1Tags).map(t => t.dataset.value);
      _surveyAnswers.equipment = Array.from(step2Tags).map(t => t.dataset.value);

      // 儲存偏好到全局狀態
      window.AppState.preferences = _surveyAnswers;
      window.saveAppState();
      _syncProfilePreferenceStorage(_surveyAnswers);
      _syncVisibleMemberPreferenceTags(_surveyAnswers);
      _personalizationCompleted = true;

      // 關閉 Modal
      window.closeModal('personalizationModal', { force: true });

      // 顯示成功 Toast
      window.showToast('✓ 個人偏好已儲存！我們會為您推薦最適合的商品 🏕️', 'success', 4000);
    }
  });
};

/**
 * 切換到指定步驟
 * Navigate to a specific survey step
 * @param {number} step - 步驟編號（1 或 2）
 */
function _goToSurveyStep(step) {
  const modal = document.getElementById('personalizationModal');
  if (!modal) return;

  // 切換步驟面板的顯示
  modal.querySelectorAll('.survey-step').forEach(panel => {
    panel.classList.toggle('active', parseInt(panel.dataset.step) === step);
  });

  // 更新進度條的 active 狀態
  modal.querySelectorAll('.stepper-dot').forEach((dot, index) => {
    // 已完成或當前步驟都標為 active
    dot.classList.toggle('active', index + 1 <= step);
  });

  // 更新步驟文字（如 1/2）
  const stepIndicator = modal.querySelector('.stepper-text');
  if (stepIndicator) stepIndicator.textContent = `${step} / 2`;
}

console.log('✓ Modal 組件已初始化');
