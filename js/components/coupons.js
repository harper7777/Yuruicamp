// ========================================
// Coupon utilities shared by cart and checkout pages
// ========================================

(function () {
  /** 重點：購物車套用成功的 coupon codes 會暫存成陣列，讓結帳頁可一次帶入多張 coupon。 */
  const CHECKOUT_COUPON_STORAGE_KEY = 'checkoutCouponCode';

  let couponCache = null;

  function _getDataPath() {
    if (window.API && typeof window.API._getDataPath === 'function') {
      return window.API._getDataPath();
    }
    return window.location.pathname.includes('/pages/') ? '../data' : '/data';
  }

  function _escapeAttr(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/"/g, '&quot;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function _formatMoney(amount) {
    return Number(amount || 0).toLocaleString('zh-TW');
  }

  /**
   * 讀取 data/users.json 內所有會員 coupons。
   * 重點：依需求提供 users.json 內所有 coupons.code 給購物車與結帳頁 datalist 使用。
   * @returns {Promise<Array>}
   */
  async function loadCoupons() {
    if (couponCache) return couponCache;

    const response = await fetch(`${_getDataPath()}/users.json`);
    const users = await response.json();

    couponCache = users.flatMap(user => (user.coupons || []).map(coupon => ({
      ...coupon,
      userId: user.id,
    })));

    return couponCache;
  }

  function describeCoupon(coupon) {
    const discountText = coupon.type === 'percent'
      ? `${coupon.discount}% OFF`
      : `折 NT$ ${coupon.discount}`;
    const minOrderText = coupon.minOrder ? ` / 滿 NT$ ${_formatMoney(coupon.minOrder)}` : '';
    return `${coupon.code} - ${discountText}${minOrderText}`;
  }

  /**
   * 將 coupon code 渲染成 input[list] 的選項。
   * 重點：保留 input 可手動輸入，同時提供 select 下拉選取 coupon code。
   * @param {string} datalistId - datalist DOM id
   * @param {Array} coupons - coupon 資料
   */
  function renderCouponOptions(datalistId, coupons) {
    const datalist = document.getElementById(datalistId);
    if (!datalist) return;

    datalist.innerHTML = (coupons || []).map(coupon => (
      `<option value="${_escapeAttr(coupon.code)}" label="${_escapeAttr(describeCoupon(coupon))}"></option>`
    )).join('');
  }

  function findCouponByCode(coupons, rawCode) {
    const code = String(rawCode || '').trim().toUpperCase();
    return (coupons || []).find(coupon => String(coupon.code || '').toUpperCase() === code) || null;
  }

  function calculateDiscount(coupon, subtotal) {
    if (!coupon) return 0;

    const discount = coupon.type === 'percent'
      ? Math.round(Number(subtotal || 0) * Number(coupon.discount || 0) / 100)
      : Number(coupon.discount || 0);

    return Math.min(discount, Number(subtotal || 0));
  }

  function normalizeCouponCodes(codes) {
    const list = Array.isArray(codes) ? codes : [codes];
    return [...new Set(list
      .map(code => String(code || '').trim().toUpperCase())
      .filter(Boolean))];
  }

  /**
   * 依已套用 coupon codes 計算折扣合計與文字資料。
   * 重點：多張 coupon 可累加折扣，但折扣合計最多不超過商品小計 subtotal。
   * @param {Array} coupons - data/users.json 載入的 coupon 清單
   * @param {Array|string} codes - 已套用 coupon code
   * @param {number} subtotal - 商品小計
   * @returns {{ items: Array, totalDiscount: number }}
   */
  function calculateAppliedCoupons(coupons, codes, subtotal) {
    let remainingSubtotal = Number(subtotal || 0);
    const items = normalizeCouponCodes(codes)
      .map(code => findCouponByCode(coupons, code))
      .filter(Boolean)
      .map(coupon => {
        const discount = Math.min(calculateDiscount(coupon, subtotal), remainingSubtotal);
        remainingSubtotal = Math.max(remainingSubtotal - discount, 0);

        return {
          code: coupon.code,
          label: describeCoupon(coupon),
          discount,
          coupon,
        };
      });

    const totalDiscount = items.reduce((sum, item) => sum + item.discount, 0);

    return { items, totalDiscount };
  }

  /**
   * 驗證 coupon code 是否存在於 data/users.json。
   * 重點：本次需求以 users.json 是否存在 code 作為正確判斷，used / expiry 欄位保留給後續規則擴充。
   * @param {Array} coupons - coupon 清單
   * @param {string} rawCode - 使用者輸入或選取的 code
   * @param {number} subtotal - 商品小計
   * @returns {{ valid: boolean, message: string, code?: string, coupon?: Object, discount?: number, label?: string }}
   */
  function validateCoupon(coupons, rawCode, subtotal) {
    const code = String(rawCode || '').trim().toUpperCase();
    if (!code) {
      return { valid: false, message: '請輸入折扣碼' };
    }

    const coupon = findCouponByCode(coupons, code);
    if (!coupon) {
      return { valid: false, message: '折扣碼無效，請確認後再試' };
    }

    return {
      valid: true,
      code: coupon.code,
      coupon,
      discount: calculateDiscount(coupon, subtotal),
      label: describeCoupon(coupon),
      message: `折扣碼「${coupon.code}」已套用`,
    };
  }

  function saveAppliedCouponCodes(codes) {
    localStorage.setItem(CHECKOUT_COUPON_STORAGE_KEY, JSON.stringify(normalizeCouponCodes(codes)));
  }

  function saveAppliedCouponCode(code) {
    saveAppliedCouponCodes([code]);
  }

  function getAppliedCouponCode() {
    return getAppliedCouponCodes()[0] || '';
  }

  function getAppliedCouponCodes() {
    const raw = localStorage.getItem(CHECKOUT_COUPON_STORAGE_KEY) || '';
    if (!raw) return [];

    try {
      const parsed = JSON.parse(raw);
      return normalizeCouponCodes(parsed);
    } catch (error) {
      // 重點：相容舊版單一字串暫存，避免升級後原本已套用的 coupon 遺失。
      return normalizeCouponCodes(raw);
    }
  }

  function clearAppliedCouponCode() {
    localStorage.removeItem(CHECKOUT_COUPON_STORAGE_KEY);
  }

  /**
   * 將已套用 coupon 顯示為 input 下方的文字清單。
   * 重點：成功套用的 coupon 從 input 轉成文字顯示，input 保持可繼續輸入下一張 coupon。
   * @param {string} containerId - 顯示容器 id
   * @param {Array} appliedItems - calculateAppliedCoupons 回傳的 items
   */
  function renderAppliedCouponTexts(containerId, appliedItems) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!appliedItems || appliedItems.length === 0) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = appliedItems.map(item => (
      `<div>已套用：${_escapeAttr(item.code)}（折抵 NT$ ${_formatMoney(item.discount)}）</div>`
    )).join('');
  }

  window.YuruiCoupons = {
    loadCoupons,
    renderCouponOptions,
    findCouponByCode,
    calculateDiscount,
    calculateAppliedCoupons,
    validateCoupon,
    normalizeCouponCodes,
    saveAppliedCouponCode,
    saveAppliedCouponCodes,
    getAppliedCouponCode,
    getAppliedCouponCodes,
    clearAppliedCouponCode,
    renderAppliedCouponTexts,
  };
})();
