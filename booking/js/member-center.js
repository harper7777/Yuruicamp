/**
 * member-center.js — 預約系統會員中心整合版
 * 重點：版型沿用 booking/pages/member-center.html，資料與互動整合 pages/member-center.html 的共用功能。
 */
(function () {
  'use strict';

  var DATA_PATHS = {
    users: '../../data/users.json',
    orders: '../../data/orders.json',
    rentalOrders: '../../data/rentalOrders.json'
  };

  var REWARD_POINT_RATE = 0.1;
  var MEMBER_POINTS_REFRESH_MS = 5000;

  var state = {
    user: null,
    orders: [],
    rentalOrders: [],
    activeFilters: {
      purchase: 'all',
      rental: 'all'
    },
    activeRecordPanel: 'store',
    pointsTimer: null
  };

  /** 重點：購買紀錄狀態沿用前台會員中心定義，讓兩邊篩選結果一致。 */
  var PURCHASE_ORDER_STATUS_META = [
    { value: 'paid', label: '待付款', cls: 'status--pending' },
    { value: 'unpaid', label: '已付款', cls: 'status--upcoming' },
    { value: 'unshipped', label: '待出貨', cls: 'status--pending' },
    { value: 'shipped', label: '已出貨', cls: 'status--upcoming' },
    { value: 'delivered', label: '已完成', cls: 'status--done' },
    { value: 'returned', label: '已退貨', cls: 'status--cancelled' },
    { value: 'cancelled', label: '已取消', cls: 'status--cancelled' }
  ];

  /** 重點：租借紀錄狀態沿用 data/rentalOrders.json 的新版流程。 */
  var RENTAL_ORDER_STATUS_META = [
    { value: 'refunded', label: '已退款', cls: 'status--cancelled' },
    { value: 'paid', label: '已付款', cls: 'status--upcoming' },
    { value: 'pending', label: '待確認', cls: 'status--pending' },
    { value: 'confirmed', label: '已確認', cls: 'status--upcoming' },
    { value: 'completed', label: '已完成', cls: 'status--done' },
    { value: 'cancelled', label: '已取消', cls: 'status--cancelled' }
  ];

  var PURCHASE_ORDER_ALIASES = {
    processing: 'unshipped',
    cod: 'paid'
  };

  var RENTAL_ORDER_ALIASES = {
    processing: 'pending',
    shipped: 'confirmed',
    delivered: 'completed'
  };

  var PURCHASE_META_MAP = toMetaMap(PURCHASE_ORDER_STATUS_META);
  var RENTAL_META_MAP = toMetaMap(RENTAL_ORDER_STATUS_META);

  function toMetaMap(items) {
    return items.reduce(function (map, item) {
      map[item.value] = item;
      return map;
    }, {});
  }

  function safeJsonParse(value, fallback) {
    try {
      return value ? JSON.parse(value) : fallback;
    } catch (error) {
      return fallback;
    }
  }

  function showMcToast(message, type) {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type || 'info');
      return;
    }
    console.log(message);
  }

  async function fetchJson(path, fallback) {
    try {
      var response = await fetch(path, { cache: 'no-store' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      return await response.json();
    } catch (error) {
      console.error('載入資料失敗：' + path, error);
      return fallback;
    }
  }

  function formatMoney(value) {
    return 'NT$ ' + Number(value || 0).toLocaleString('zh-TW');
  }

  function formatDate(value) {
    return value || '--';
  }

  function getBookingLoginUser() {
    return safeJsonParse(localStorage.getItem('yuruiUser'), null);
  }

  function getSavedProfile() {
    return safeJsonParse(localStorage.getItem('yurui_profile'), {});
  }

  function getCurrentMemberId() {
    var bookingUser = getBookingLoginUser();
    return (bookingUser && bookingUser.id) || 'user-001';
  }

  function normalizePreferenceValues(preferences) {
    if (Array.isArray(preferences)) return preferences;
    if (typeof preferences === 'string' && preferences) return [preferences];
    if (!preferences || typeof preferences !== 'object') return [];

    // 重點：header 問卷分成 styles / equipment，booking 會員中心和前台會員中心都使用攤平後的 survey-tags。
    return []
      .concat(preferences.styles || [])
      .concat(preferences.equipment || []);
  }

  function getStoredPreferenceValues() {
    var appPrefs = normalizePreferenceValues(window.AppState && window.AppState.preferences);
    if (appPrefs.length) return appPrefs;

    var profilePrefs = normalizePreferenceValues(getSavedProfile().preferences);
    if (profilePrefs.length) return profilePrefs;

    var localPrefs = normalizePreferenceValues(safeJsonParse(localStorage.getItem('preferences'), {}));
    if (localPrefs.length) return localPrefs;

    return normalizePreferenceValues(state.user && state.user.preferences);
  }

  function getStatusInfo(status) {
    var normalized = PURCHASE_ORDER_ALIASES[status] || status;
    return PURCHASE_META_MAP[normalized] || { value: normalized, label: normalized || '未設定', cls: 'status--pending' };
  }

  function getRentalStatusInfo(status) {
    var normalized = RENTAL_ORDER_ALIASES[status] || status;
    return RENTAL_META_MAP[normalized] || getStatusInfo(status);
  }

  function normalizeFilterValue(orderType, value) {
    var aliases = orderType === 'rental' ? RENTAL_ORDER_ALIASES : PURCHASE_ORDER_ALIASES;
    return aliases[value] || value;
  }

  function orderMatchesFilter(order, filter, orderType) {
    if (!filter || filter === 'all') return true;

    var normalizedStatus = normalizeFilterValue(orderType, order.status);
    var normalizedPayment = normalizeFilterValue(orderType, order.paymentStatus);

    // 重點：已退貨可獨立篩選，但不能因 paymentStatus=paid 混入待付款清單。
    if (orderType === 'purchase' && filter === 'paid' && normalizedStatus === 'returned') {
      return false;
    }

    return normalizedStatus === filter || normalizedPayment === filter;
  }

  function buildFilterDefinitions(orderType, orders) {
    var available = new Set(['all']);
    var meta = orderType === 'rental' ? RENTAL_ORDER_STATUS_META : PURCHASE_ORDER_STATUS_META;
    var known = new Set(meta.map(function (item) { return item.value; }));

    (orders || []).forEach(function (order) {
      if (order.status) available.add(normalizeFilterValue(orderType, order.status));
      if (order.paymentStatus) available.add(normalizeFilterValue(orderType, order.paymentStatus));
    });

    var dynamic = meta.filter(function (item) { return available.has(item.value); });
    var unknown = Array.from(available)
      .filter(function (value) { return value !== 'all' && !known.has(value); })
      .map(function (value) { return { value: value, label: value, cls: 'status--pending' }; });

    return [{ value: 'all', label: '全部', cls: '' }].concat(dynamic, unknown);
  }

  function renderOrderStatusTabs(orderType, orders) {
    var container = document.getElementById(orderType === 'rental' ? 'rentalOrderStatusTabs' : 'purchaseOrderStatusTabs');
    if (!container) return;

    var filters = buildFilterDefinitions(orderType, orders);
    var active = filters.some(function (item) { return item.value === state.activeFilters[orderType]; })
      ? state.activeFilters[orderType]
      : 'all';
    state.activeFilters[orderType] = active;

    // 重點：篩選按鈕不寫死，根據 orders.json / rentalOrders.json 真的出現的狀態動態生成。
    container.innerHTML = filters.map(function (item) {
      var isActive = item.value === active;
      return '<button class="order-status-tab' + (isActive ? ' active' : '') + '"'
        + ' type="button" data-filter="' + item.value + '" aria-pressed="' + isActive + '">'
        + item.label
        + '</button>';
    }).join('');
  }

  function buildItemSummary(items) {
    var safeItems = Array.isArray(items) ? items : [];
    if (safeItems.length === 0) return '未命名項目';
    if (safeItems.length === 1) return safeItems[0].name;
    return safeItems[0].name + ' 等 ' + safeItems.length + ' 項';
  }

  function buildThumbsHtml(items) {
    var safeItems = Array.isArray(items) ? items : [];
    if (safeItems.length === 0) return '';

    return '<div class="rec-item__thumbs">'
      + safeItems.slice(0, 3).map(function (item) {
        var image = item.image || 'https://picsum.photos/seed/fallback/80/80';
        return '<img src="' + image + '" alt="' + item.name + '" class="rec-item__thumb"'
          + ' onerror="this.src=\'https://picsum.photos/seed/fallback/80/80\'">';
      }).join('')
      + (safeItems.length > 3 ? '<span class="rec-item__more">+' + (safeItems.length - 3) + '</span>' : '')
      + '</div>';
  }

  function renderPurchaseOrders() {
    var container = document.getElementById('ordersList');
    if (!container) return;

    var filtered = state.orders.filter(function (order) {
      return orderMatchesFilter(order, state.activeFilters.purchase, 'purchase');
    });

    if (filtered.length === 0) {
      container.innerHTML = '<div class="rec-empty"><div class="rec-empty__icon"><i class="bi bi-bag-x"></i></div>沒有符合條件的購買紀錄</div>';
      return;
    }

    container.innerHTML = filtered.map(function (order) {
      var status = getStatusInfo(order.status);
      return '<div class="rec-item" data-order-id="' + order.id + '">'
        + '<div class="rec-item__info">'
        + '<div class="rec-item__title">' + buildItemSummary(order.items) + '</div>'
        + '<div class="rec-item__meta">' + order.orderNumber + ' · ' + formatDate(order.createdAt) + ' · ' + ((order.items || []).length || 0) + ' 項商品</div>'
        + buildThumbsHtml(order.items)
        + '</div>'
        + '<div class="rec-item__right">'
        + '<div class="rec-item__amount">' + formatMoney(order.total) + '</div>'
        + '<span class="rec-item__status ' + status.cls + '">' + status.label + '</span>'
        + '<button class="rec-item__detail-btn" type="button" data-order-detail="' + order.id + '">查看明細</button>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  function renderRentalOrders() {
    var container = document.getElementById('rentalOrdersList');
    if (!container) return;

    var filtered = state.rentalOrders.filter(function (order) {
      return orderMatchesFilter(order, state.activeFilters.rental, 'rental');
    });

    if (filtered.length === 0) {
      container.innerHTML = '<div class="rec-empty"><div class="rec-empty__icon"><i class="bi bi-tent-x"></i></div>沒有符合條件的預約或租借紀錄</div>';
      return;
    }

    container.innerHTML = filtered.map(function (order) {
      var status = getRentalStatusInfo(order.status);
      return '<div class="rec-item" data-rental-order-id="' + order.id + '">'
        + '<div class="rec-item__info">'
        + '<div class="rec-item__title">' + buildItemSummary(order.items) + '</div>'
        + '<div class="rec-item__meta">' + order.orderNumber + ' · ' + order.rentalStart + ' ～ ' + order.rentalEnd + ' · ' + order.pickupStore + ' / ' + order.returnStore + '</div>'
        + buildThumbsHtml(order.items)
        + '</div>'
        + '<div class="rec-item__right">'
        + '<div class="rec-item__amount">' + formatMoney(order.total) + '</div>'
        + '<span class="rec-item__status ' + status.cls + '">' + status.label + '</span>'
        + '<button class="rec-item__detail-btn" type="button" data-rental-detail="' + order.id + '">查看明細</button>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  function calculateOrderRewardPoints(subtotal) {
    return Math.ceil((Number(subtotal) || 0) * REWARD_POINT_RATE);
  }

  function getOrderRewardPoints(order) {
    var points = Number(order && order.points);
    return Number.isFinite(points) ? points : calculateOrderRewardPoints(order && order.subtotal);
  }

  function getOrderCoupons(order) {
    if (Array.isArray(order.coupons)) return order.coupons;
    return order.coupon ? [order.coupon] : [];
  }

  function formatOrderCoupon(coupon) {
    var code = coupon.code || '未命名折扣碼';
    if (coupon.type === 'percent') {
      var amountText = coupon.amount ? '，折抵 ' + formatMoney(coupon.amount) : '';
      return code + '（' + coupon.discount + '%' + amountText + '）';
    }
    return code + '（折抵 ' + formatMoney(coupon.amount || coupon.discount || 0) + '）';
  }

  function buildOrderCouponRow(order) {
    var coupons = getOrderCoupons(order);
    if (!coupons.length) return '';

    return '<div class="bk-detail-row bk-detail-row--success">'
      + '<span>使用折扣卷</span><span>' + coupons.map(formatOrderCoupon).join('、') + '</span>'
      + '</div>';
  }

  function buildOrderPointsRow(order) {
    return '<div class="bk-detail-row bk-detail-row--success">'
      + '<span>本筆回饋點數</span><span>' + getOrderRewardPoints(order).toLocaleString('zh-TW') + ' 點</span>'
      + '</div>';
  }

  function getPaymentLabel(payment) {
    var map = {
      'credit-card': '信用卡',
      'line-pay': 'LINE Pay',
      cod: '貨到付款'
    };
    return map[payment] || payment || '未設定';
  }

  function openDetailModal(title, bodyHtml) {
    var titleEl = document.getElementById('orderDetailTitle');
    var bodyEl = document.getElementById('orderDetailBody');
    var overlay = document.getElementById('orderDetailOverlay');
    if (!titleEl || !bodyEl || !overlay) return;

    titleEl.textContent = title;
    bodyEl.innerHTML = bodyHtml;
    overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeDetailModal() {
    var overlay = document.getElementById('orderDetailOverlay');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  window.openOrderDetail = function (orderId) {
    var order = state.orders.find(function (item) { return item.id === orderId; });
    if (!order) return;

    var status = getStatusInfo(order.status);
    var itemsHtml = (order.items || []).map(function (item) {
      return '<div class="bk-order-item-row">'
        + '<img src="' + (item.image || 'https://picsum.photos/seed/fallback/80/80') + '" alt="' + item.name + '" class="bk-order-item-img"'
        + ' onerror="this.src=\'https://picsum.photos/seed/fallback/80/80\'">'
        + '<div>'
        + '<div class="bk-order-item-name">' + item.name + '</div>'
        + '<div class="bk-order-item-qty">× ' + item.quantity + ' ｜ ' + formatMoney(item.price * item.quantity) + '</div>'
        + '</div>'
        + '</div>';
    }).join('');

    // 重點：購買訂單明細整合 coupon、discount 與 points，欄位來源以 data/orders.json 為主。
    openDetailModal('訂單詳情 ' + order.orderNumber, ''
      + '<div class="bk-detail-head">'
      + '<div class="bk-detail-date">' + formatDate(order.createdAt) + '</div>'
      + '<span class="bk-status-badge ' + status.cls + '">' + status.label + '</span>'
      + '</div>'
      + '<div class="bk-detail-section-title"><i class="bi bi-receipt"></i> 商品明細</div>'
      + itemsHtml
      + '<hr class="bk-detail-sep">'
      + '<div class="bk-detail-rows">'
      + '<div class="bk-detail-row"><span>商品小計</span><span>' + formatMoney(order.subtotal) + '</span></div>'
      + '<div class="bk-detail-row"><span>運費</span><span>' + (Number(order.shippingFee) === 0 ? '免運' : formatMoney(order.shippingFee)) + '</span></div>'
      + (order.discount ? '<div class="bk-detail-row bk-detail-row--danger"><span>折扣</span><span>- ' + formatMoney(order.discount) + '</span></div>' : '')
      + buildOrderCouponRow(order)
      + '<div class="bk-detail-row bk-detail-row--total"><span>訂單總計</span><span>' + formatMoney(order.total) + '</span></div>'
      + buildOrderPointsRow(order)
      + '</div>'
      + '<div class="bk-detail-note"><i class="bi bi-credit-card"></i> 付款方式：' + getPaymentLabel(order.payment) + '</div>'
      + (order.shippingAddress ? '<div class="bk-detail-note"><i class="bi bi-geo-alt"></i> 配送地址：' + order.shippingAddress + '</div>' : '')
      + (order.trackingNumber ? '<div class="bk-detail-note"><i class="bi bi-truck"></i> 物流追蹤：' + order.trackingNumber + '</div>' : '')
      + buildLineSupportLink('詢問訂單'));
  };

  window.openRentalOrderDetail = function (orderId) {
    var order = state.rentalOrders.find(function (item) { return item.id === orderId; });
    if (!order) return;

    var status = getRentalStatusInfo(order.status);
    var itemsHtml = (order.items || []).map(function (item) {
      return '<div class="bk-order-item-row">'
        + '<img src="' + (item.image || 'https://picsum.photos/seed/fallback/80/80') + '" alt="' + item.name + '" class="bk-order-item-img"'
        + ' onerror="this.src=\'https://picsum.photos/seed/fallback/80/80\'">'
        + '<div>'
        + '<div class="bk-order-item-name">' + item.name + '</div>'
        + '<div class="bk-order-item-qty">× ' + item.quantity + ' ｜ ' + formatMoney(item.price * item.quantity) + '</div>'
        + '</div>'
        + '</div>';
    }).join('');

    // 重點：預約 & 租借紀錄明細沿用同一個 booking Modal，欄位來源以 data/rentalOrders.json 為主。
    openDetailModal('預約 & 租借詳情 ' + order.orderNumber, ''
      + '<div class="bk-detail-head">'
      + '<div class="bk-detail-date">' + formatDate(order.createdAt) + '</div>'
      + '<span class="bk-status-badge ' + status.cls + '">' + status.label + '</span>'
      + '</div>'
      + '<div class="bk-detail-section-title"><i class="bi bi-tent"></i> 租借裝備</div>'
      + itemsHtml
      + '<hr class="bk-detail-sep">'
      + '<div class="bk-detail-rows">'
      + '<div class="bk-detail-row"><span>租借費用</span><span>' + formatMoney(order.subtotal) + '</span></div>'
      + '<div class="bk-detail-row"><span>押金</span><span>' + formatMoney(order.deposit) + '</span></div>'
      + '<div class="bk-detail-row bk-detail-row--total"><span>訂單總額</span><span>' + formatMoney(order.total) + '</span></div>'
      + '</div>'
      + '<div class="bk-detail-note">租借期間：' + order.rentalStart + ' ～ ' + order.rentalEnd + '</div>'
      + '<div class="bk-detail-note">取件 / 歸還：' + order.pickupStore + ' / ' + order.returnStore + '</div>'
      + '<div class="bk-detail-note"><i class="bi bi-credit-card"></i> 付款方式：' + getPaymentLabel(order.payment) + '</div>'
      + (order.cancelReason ? '<div class="bk-detail-note bk-detail-row--danger">取消原因：' + order.cancelReason + '</div>' : '')
      + buildLineSupportLink('確認預約 & 租借'));
  };

  window.openMcOrderDetail = window.openOrderDetail;
  window.openMcBookingDetail = window.openRentalOrderDetail;

  function buildLineSupportLink(label) {
    return '<div class="bk-detail-support">'
      + '<a href="https://line.me/R/ti/p/@yuruicamp" target="_blank">'
      + '<i class="bi bi-chat-dots"></i> 聯絡 LINE 客服' + label
      + '</a>'
      + '</div>';
  }

  function renderMemberRewardPoints(points) {
    var pointsEl = document.getElementById('cardPoints');
    if (!pointsEl) return;
    var safePoints = Number.isFinite(Number(points)) ? Number(points) : 0;
    pointsEl.textContent = '回饋點數：' + safePoints.toLocaleString('zh-TW') + ' 點';
  }

  async function refreshMemberRewardPoints() {
    // 重點：點數固定以 users.json 的 points 為主，與前台會員中心顯示規則一致。
    var users = await fetchJson(DATA_PATHS.users, []);
    var user = selectUser(users);
    state.user = user || state.user;
    renderMemberRewardPoints(state.user ? state.user.points : 0);
  }

  function initMemberRewardPoints() {
    refreshMemberRewardPoints();
    if (state.pointsTimer) clearInterval(state.pointsTimer);
    state.pointsTimer = setInterval(refreshMemberRewardPoints, MEMBER_POINTS_REFRESH_MS);
  }

  function selectUser(users) {
    if (!Array.isArray(users) || users.length === 0) return null;
    var bookingUser = getBookingLoginUser();
    var memberId = getCurrentMemberId();
    return users.find(function (user) { return user.id === memberId; })
      || users.find(function (user) { return bookingUser && bookingUser.email && user.email === bookingUser.email; })
      || users[0];
  }

  function applyProfileData() {
    var saved = getSavedProfile();
    var user = state.user || {};
    var bookingUser = getBookingLoginUser() || {};
    var displayName = saved.name || bookingUser.name || user.name || '露友小明';
    var displayEmail = saved.email || bookingUser.email || user.email || 'camper@example.com';

    setText('mcAvatar', displayName.charAt(0).toUpperCase());
    setText('mcName', displayName);
    setText('mcEmail', displayEmail);
    setText('cardName', displayName);
    setText('cardSince', '加入日期：' + (user.joinDate || user.joinedAt || '2026-01-01'));

    setInputValue('profileName', saved.name || user.name || displayName);
    setInputValue('profilePhone', saved.phone || user.phone || '0912-345-678');
    setInputValue('profileEmail', saved.email || user.email || displayEmail);
    setInputValue('profileBirthday', saved.birthday || user.birthday || '1990-06-15');
    setInputValue('profileAddress', saved.address || user.address || '台北市信義區信義路五段100號');

    renderMemberRewardPoints(user.points);
    syncPreferenceTags(getStoredPreferenceValues());
  }

  function setText(id, value) {
    var el = document.getElementById(id);
    if (el) el.textContent = value;
  }

  function setInputValue(id, value) {
    var el = document.getElementById(id);
    if (el) el.value = value || '';
  }

  function syncPreferenceTags(preferences) {
    var selected = new Set(normalizePreferenceValues(preferences));
    document.querySelectorAll('#prefTags .survey-tag').forEach(function (tag) {
      tag.classList.toggle('active', selected.has(tag.dataset.value));
    });
  }

  window.syncMemberPreferenceTags = function (preferences) {
    var selectedPrefs = normalizePreferenceValues(preferences);
    syncPreferenceTags(selectedPrefs);

    // 重點：booking 版也寫回 yurui_profile.preferences，與前台會員中心使用同一個 localStorage contract。
    var savedProfile = getSavedProfile();
    savedProfile.preferences = selectedPrefs;
    localStorage.setItem('yurui_profile', JSON.stringify(savedProfile));
  };

  function initPreferenceTags() {
    syncPreferenceTags(getStoredPreferenceValues());
    document.querySelectorAll('#prefTags .survey-tag').forEach(function (tag) {
      if (tag.dataset.prefToggleBound === 'true') return;
      tag.dataset.prefToggleBound = 'true';
      tag.addEventListener('click', function () {
        tag.classList.toggle('active');
      });
    });

    window.addEventListener('yurui:preferences-updated', function (event) {
      window.syncMemberPreferenceTags(event.detail || []);
    });
  }

  function initProfileForm() {
    var form = document.getElementById('profileForm');
    if (!form || form.dataset.bound === 'true') return;
    form.dataset.bound = 'true';

    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var profileData = {
        name: getInputValue('profileName'),
        phone: getInputValue('profilePhone'),
        email: getInputValue('profileEmail'),
        birthday: getInputValue('profileBirthday'),
        address: getInputValue('profileAddress'),
        preferences: Array.from(document.querySelectorAll('#prefTags .survey-tag.active')).map(function (tag) {
          return tag.dataset.value;
        })
      };

      // 重點：手動調整喜好後同步寫回 yurui_profile，讓商品推薦與前台會員中心讀到同一份 survey-tags。
      localStorage.setItem('yurui_profile', JSON.stringify(profileData));

      var bookingUser = getBookingLoginUser();
      if (bookingUser) {
        bookingUser.name = profileData.name || bookingUser.name;
        bookingUser.email = profileData.email || bookingUser.email;
        localStorage.setItem('yuruiUser', JSON.stringify(bookingUser));
      }

      applyProfileData();
      showMcToast('個人資料已儲存', 'success');
    });
  }

  function getInputValue(id) {
    var el = document.getElementById(id);
    return el ? el.value.trim() : '';
  }

  function isCouponExpired(coupon) {
    if (coupon.used) return true;
    if (!coupon.expiry) return false;
    var expiry = new Date(coupon.expiry + 'T23:59:59');
    return Number.isFinite(expiry.getTime()) && expiry < new Date();
  }

  function formatCoupon(coupon) {
    var isPercent = coupon.type === 'percent';
    var discountVal = isPercent ? coupon.discount + '%' : Number(coupon.discount || 0).toLocaleString('zh-TW');
    var discountUnit = isPercent ? 'OFF' : '元折抵';
    var title = isPercent ? '會員折扣券' : '現金折抵券';
    var condition = coupon.minOrder ? '消費滿 NT$' + Number(coupon.minOrder).toLocaleString('zh-TW') + ' 使用' : '無最低消費限制';
    return {
      code: coupon.code,
      expired: isCouponExpired(coupon),
      discountVal: discountVal,
      discountUnit: discountUnit,
      title: title,
      condition: condition,
      expiry: coupon.expiry ? coupon.expiry + ' 到期' : '無期限'
    };
  }

  function renderCoupons() {
    var activeContainer = document.getElementById('activeCoupons');
    var expiredContainer = document.getElementById('expiredCoupons');
    if (!activeContainer || !expiredContainer) return;

    var coupons = ((state.user && state.user.coupons) || []).map(formatCoupon);
    var active = coupons.filter(function (coupon) { return !coupon.expired; });
    var expired = coupons.filter(function (coupon) { return coupon.expired; });

    activeContainer.innerHTML = active.length
      ? active.map(buildCouponHtml).join('')
      : '<div class="rec-empty">目前沒有可使用的折價券</div>';

    expiredContainer.innerHTML = expired.length
      ? expired.map(buildCouponHtml).join('')
      : '<div class="rec-empty">沒有已失效的折價券</div>';
  }

  function buildCouponHtml(coupon) {
    return '<div class="coupon-ticket' + (coupon.expired ? ' expired' : '') + '">'
      + '<div class="coupon-left">'
      + '<div class="coupon-discount-val">' + coupon.discountVal + '</div>'
      + '<div class="coupon-discount-unit">' + coupon.discountUnit + '</div>'
      + '</div>'
      + '<div class="coupon-sep"></div>'
      + '<div class="coupon-right">'
      + '<div class="coupon-title">' + coupon.title + '</div>'
      + '<div class="coupon-condition">' + coupon.condition + '</div>'
      + '<div class="coupon-expiry"><i class="bi bi-clock"></i> ' + coupon.expiry + '</div>'
      + '<div class="coupon-code-row">'
      + '<span class="coupon-code">' + coupon.code + '</span>'
      + (!coupon.expired ? '<button class="copy-btn" type="button" data-copy-coupon="' + coupon.code + '">複製</button>' : '')
      + '</div>'
      + '</div>'
      + '</div>';
  }

  window.copyMcCouponCode = function (code) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(code)
        .then(function () { showMcToast('已複製折扣碼：' + code, 'success'); })
        .catch(function () { fallbackCopy(code); });
      return;
    }
    fallbackCopy(code);
  };

  function fallbackCopy(code) {
    var el = document.createElement('textarea');
    el.value = code;
    el.style.cssText = 'position:fixed;opacity:0;';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    document.body.removeChild(el);
    showMcToast('已複製折扣碼：' + code, 'success');
  }

  function renderNotifications() {
    var container = document.getElementById('notificationList');
    if (!container) return;

    var notifications = (state.user && state.user.notifications) || [];
    if (!notifications.length) {
      container.innerHTML = '<div class="rec-empty">目前沒有通知</div>';
      return;
    }

    // 重點：通知中心改讀 users.json，已讀狀態用 read 欄位控制。
    container.innerHTML = notifications.map(function (notification) {
      var read = Boolean(notification.read);
      return '<div class="notif-item" id="notif-' + notification.id + '" data-notif-id="' + notification.id + '">'
        + '<div class="notif-item__dot' + (read ? ' read' : '') + '"></div>'
        + '<div>'
        + '<div class="notif-item__title">' + notification.title + '</div>'
        + '<div class="notif-item__body">' + notification.message + '</div>'
        + '<div class="notif-item__date">' + notification.time + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  function renderRecentActivity() {
    var container = document.getElementById('recentActivity');
    if (!container) return;

    var activities = [];
    state.orders.slice(0, 3).forEach(function (order) {
      activities.push({
        date: order.createdAt,
        title: '訂單 ' + order.orderNumber + ' ' + getStatusInfo(order.status).label
      });
    });
    state.rentalOrders.slice(0, 2).forEach(function (order) {
      activities.push({
        date: order.createdAt,
        title: '預約 & 租借 ' + order.orderNumber + ' ' + getRentalStatusInfo(order.status).label
      });
    });
    ((state.user && state.user.notifications) || []).slice(0, 2).forEach(function (notification) {
      activities.push({
        date: notification.time,
        title: notification.title
      });
    });

    activities.sort(function (a, b) {
      return String(b.date || '').localeCompare(String(a.date || ''));
    });

    if (!activities.length) {
      container.innerHTML = '<div class="rec-empty">目前沒有最近活動</div>';
      return;
    }

    // 重點：最近活動整合購買、預約租借與通知，讓 booking / 前台會員中心資訊來源一致。
    container.innerHTML = activities.slice(0, 4).map(function (activity) {
      return '<div class="mc-activity-item">'
        + '<div>'
        + '<div class="mc-activity-item__title">' + activity.title + '</div>'
        + '<div class="mc-activity-item__date">' + formatDate(activity.date) + '</div>'
        + '</div>'
        + '</div>';
    }).join('');
  }

  function updateStats() {
    var activeCoupons = ((state.user && state.user.coupons) || []).filter(function (coupon) {
      return !isCouponExpired(coupon);
    }).length;
    var unread = ((state.user && state.user.notifications) || []).filter(function (item) {
      return !item.read;
    }).length;
    var pendingOrders = state.orders.filter(function (order) {
      return ['paid', 'unshipped', 'shipped'].includes(normalizeFilterValue('purchase', order.status));
    }).length;
    var upcomingRentals = state.rentalOrders.filter(function (order) {
      return ['paid', 'pending', 'confirmed'].includes(normalizeFilterValue('rental', order.status));
    }).length;

    setText('statOrders', String(pendingOrders));
    setText('statBookings', String(upcomingRentals));
    setText('statCoupons', String(activeCoupons));
    setText('statUnread', String(unread));
  }

  function initCouponTabs() {
    document.querySelectorAll('.rec-tab[data-coupon-tab]').forEach(function (tab) {
      if (tab.dataset.bound === 'true') return;
      tab.dataset.bound = 'true';
      tab.addEventListener('click', function () {
        var selected = tab.dataset.couponTab;
        document.querySelectorAll('.rec-tab[data-coupon-tab]').forEach(function (item) {
          item.classList.toggle('active', item.dataset.couponTab === selected);
        });
        var active = document.getElementById('activeCoupons');
        var expired = document.getElementById('expiredCoupons');
        if (active) active.style.display = selected === 'active' ? '' : 'none';
        if (expired) expired.style.display = selected === 'expired' ? '' : 'none';
      });
    });
  }

  function initOrderStatusTabs() {
    document.querySelectorAll('.order-status-tabs[data-order-status-tabs]').forEach(function (container) {
      if (container.dataset.bound === 'true') return;
      container.dataset.bound = 'true';

      container.addEventListener('click', function (event) {
        var tab = event.target.closest('.order-status-tab[data-filter]');
        if (!tab || !container.contains(tab)) return;

        var orderType = container.dataset.orderStatusTabs === 'rental' ? 'rental' : 'purchase';
        state.activeFilters[orderType] = tab.dataset.filter || 'all';

        if (orderType === 'rental') {
          renderOrderStatusTabs('rental', state.rentalOrders);
          renderRentalOrders();
          return;
        }

        renderOrderStatusTabs('purchase', state.orders);
        renderPurchaseOrders();
      });
    });
  }

  function initDynamicActionButtons() {
    if (document.body.dataset.memberCenterActionsBound === 'true') return;
    document.body.dataset.memberCenterActionsBound = 'true';

    // 重點：動態列表按鈕統一用 data-* 委派，方便之後抽成共用模組。
    document.addEventListener('click', function (event) {
      var purchaseBtn = event.target.closest('[data-order-detail]');
      if (purchaseBtn) {
        window.openOrderDetail(purchaseBtn.dataset.orderDetail);
        return;
      }

      var rentalBtn = event.target.closest('[data-rental-detail]');
      if (rentalBtn) {
        window.openRentalOrderDetail(rentalBtn.dataset.rentalDetail);
        return;
      }

      var copyBtn = event.target.closest('[data-copy-coupon]');
      if (copyBtn) {
        window.copyMcCouponCode(copyBtn.dataset.copyCoupon);
      }
    });
  }

  function initRecordTabs() {
    document.querySelectorAll('.rec-tab[data-rec]').forEach(function (tab) {
      if (tab.dataset.bound === 'true') return;
      tab.dataset.bound = 'true';

      tab.addEventListener('click', function () {
        var rec = tab.dataset.rec;
        state.activeRecordPanel = rec;
        document.querySelectorAll('.rec-tab[data-rec]').forEach(function (item) {
          item.classList.toggle('active', item.dataset.rec === rec);
        });
        document.querySelectorAll('.rec-panel[data-rec-panel]').forEach(function (panel) {
          panel.classList.toggle('active', panel.dataset.recPanel === rec);
        });
      });
    });
  }

  function initPanelTabs() {
    function switchPanel(tab) {
      document.querySelectorAll('.mc-nav-item').forEach(function (item) {
        item.classList.toggle('active', item.dataset.tab === tab);
      });
      document.querySelectorAll('.mc-tab-mobile').forEach(function (button) {
        button.classList.toggle('active', button.dataset.tab === tab);
      });
      document.querySelectorAll('.mc-panel').forEach(function (panel) {
        panel.classList.toggle('active', panel.dataset.panel === tab);
      });
    }

    document.querySelectorAll('.mc-nav-item').forEach(function (item) {
      if (item.dataset.bound === 'true') return;
      item.dataset.bound = 'true';
      item.addEventListener('click', function () {
        switchPanel(item.dataset.tab);
      });
    });

    document.querySelectorAll('.mc-tab-mobile').forEach(function (button) {
      if (button.dataset.bound === 'true') return;
      button.dataset.bound = 'true';
      button.addEventListener('click', function () {
        switchPanel(button.dataset.tab);
      });
    });

    var urlTab = new URLSearchParams(window.location.search).get('tab');
    if (urlTab) switchPanel(urlTab);
  }

  function applyLoginState() {
    var guard = document.getElementById('mcLoginGuard');
    var page = document.getElementById('mcPage');
    var bookingUser = getBookingLoginUser();
    var isLoggedIn = Boolean(bookingUser && bookingUser.name);

    if (guard) guard.style.display = isLoggedIn ? 'none' : 'flex';
    if (page) page.style.display = isLoggedIn ? '' : 'none';

    if (isLoggedIn) {
      applyProfileData();
    }
  }

  function initLoginGuard() {
    applyLoginState();

    var guardLoginBtn = document.getElementById('guardLoginBtn');
    if (guardLoginBtn && guardLoginBtn.dataset.bound !== 'true') {
      guardLoginBtn.dataset.bound = 'true';
      guardLoginBtn.addEventListener('click', function () {
        if (typeof window.openModal === 'function') {
          window.openModal('loginModal');
        }
      });
    }

    window.addEventListener('storage', function (event) {
      if (['yuruiUser', 'yurui_profile', 'preferences', 'mockUserPointDeltas'].includes(event.key)) {
        applyLoginState();
        if (event.key === 'mockUserPointDeltas') refreshMemberRewardPoints();
      }
    });
  }

  function initNotificationActions() {
    var list = document.getElementById('notificationList');
    if (list && list.dataset.bound !== 'true') {
      list.dataset.bound = 'true';
      list.addEventListener('click', function (event) {
        var item = event.target.closest('.notif-item[data-notif-id]');
        if (!item || !state.user) return;

        var notification = (state.user.notifications || []).find(function (entry) {
          return entry.id === item.dataset.notifId;
        });
        if (notification) notification.read = true;
        renderNotifications();
        updateStats();
      });
    }

    var markAllBtn = document.getElementById('markAllReadBtn');
    if (markAllBtn && markAllBtn.dataset.bound !== 'true') {
      markAllBtn.dataset.bound = 'true';
      markAllBtn.addEventListener('click', function () {
        if (state.user && Array.isArray(state.user.notifications)) {
          state.user.notifications.forEach(function (item) { item.read = true; });
        }
        renderNotifications();
        updateStats();
      });
    }
  }

  function initModalClose() {
    var overlay = document.getElementById('orderDetailOverlay');
    var closeBtn = document.getElementById('orderDetailClose');
    if (closeBtn && closeBtn.dataset.bound !== 'true') {
      closeBtn.dataset.bound = 'true';
      closeBtn.addEventListener('click', closeDetailModal);
    }
    if (overlay && overlay.dataset.bound !== 'true') {
      overlay.dataset.bound = 'true';
      overlay.addEventListener('click', function (event) {
        if (event.target === overlay) closeDetailModal();
      });
    }
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && overlay && overlay.classList.contains('is-open')) {
        closeDetailModal();
      }
    });
  }

  async function loadMemberData() {
    var results = await Promise.all([
      fetchJson(DATA_PATHS.users, []),
      fetchJson(DATA_PATHS.orders, []),
      fetchJson(DATA_PATHS.rentalOrders, [])
    ]);

    state.user = selectUser(results[0]);
    state.orders = Array.isArray(results[1]) ? results[1] : [];
    state.rentalOrders = Array.isArray(results[2]) ? results[2] : [];

    applyProfileData();
    renderOrderStatusTabs('purchase', state.orders);
    renderOrderStatusTabs('rental', state.rentalOrders);
    renderPurchaseOrders();
    renderRentalOrders();
    renderCoupons();
    renderNotifications();
    renderRecentActivity();
    updateStats();
  }

  function initAll() {
    initPanelTabs();
    initRecordTabs();
    initCouponTabs();
    initOrderStatusTabs();
    initDynamicActionButtons();
    initPreferenceTags();
    initProfileForm();
    initNotificationActions();
    initModalClose();
    initLoginGuard();

    // 重點：初始化後一次載入三份共用 JSON，讓 booking 會員中心和前台會員中心資料一致。
    loadMemberData();
    initMemberRewardPoints();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
