/**
 * member-center.js — 預約系統 會員中心 互動邏輯
 */

/* ============================================================
   Mock 資料
============================================================ */
var MOCK_COUPONS_MC = [
  {
    id: 'cp-001',
    discountVal: '100',
    discountUnit: '元折抵',
    title: '全館滿千折百優惠券',
    condition: '消費滿 NT$1,000 使用',
    expiry: '2026-08-31 到期',
    code: 'YURUI100',
    expired: false
  },
  {
    id: 'cp-002',
    discountVal: '10%',
    discountUnit: 'OFF',
    title: '會員專屬九折券',
    condition: '無最低消費限制',
    expiry: '2026-12-31 到期',
    code: 'MEMBER10',
    expired: false
  },
  {
    id: 'cp-003',
    discountVal: '200',
    discountUnit: '元折抵',
    title: '新年活動折扣券',
    condition: '消費滿 NT$2,000 使用',
    expiry: '2026-01-31 到期',
    code: 'NY2026',
    expired: true
  }
];

var MOCK_ORDERS_MC = [
  {
    id: 'ord-001',
    orderNumber: '#ORD-20260401',
    createdAt: '2026-04-01',
    status: 'cancelled',
    statusLabel: '已取消',
    statusCls: 'bk-status-cancelled',
    items: [
      { name: '攜帶式淨水器', quantity: 1, price: 899 },
      { name: '登山健行手杖（一對）', quantity: 1, price: 1299 }
    ],
    subtotal: 2198,
    shippingFee: 60,
    total: 2258,
    payment: '貨到付款',
    shippingAddress: '台北市信義區信義路五段100號'
  },
  {
    id: 'ord-002',
    orderNumber: '#ORD-20260310',
    createdAt: '2026-03-10',
    status: 'delivered',
    statusLabel: '已完成',
    statusCls: 'bk-status-delivered',
    items: [
      { name: '輕量化露營帳篷 2人', quantity: 1, price: 2999 }
    ],
    subtotal: 2999,
    shippingFee: 0,
    total: 2999,
    payment: '信用卡',
    shippingAddress: '台北市信義區信義路五段100號'
  },
  {
    id: 'ord-003',
    orderNumber: '#ORD-20260215',
    createdAt: '2026-02-15',
    status: 'delivered',
    statusLabel: '已完成',
    statusCls: 'bk-status-delivered',
    items: [
      { name: '四季防水睡袋 -5°C', quantity: 2, price: 1999 }
    ],
    subtotal: 3998,
    shippingFee: 0,
    total: 3998,
    payment: 'LINE Pay',
    shippingAddress: '台北市信義區信義路五段100號'
  },
  {
    id: 'ord-004',
    orderNumber: '#ORD-20260501',
    createdAt: '2026-05-01',
    status: 'shipped',
    statusLabel: '待出貨',
    statusCls: 'bk-status-shipped',
    items: [
      { name: '戶外登山頭燈 350流明', quantity: 1, price: 649 }
    ],
    subtotal: 649,
    shippingFee: 60,
    total: 709,
    payment: '信用卡',
    shippingAddress: '台北市信義區信義路五段100號'
  }
];

var MOCK_BOOKINGS_MC = [
  {
    id: 'bk-001',
    bookingNumber: '#BK-20260620',
    campground: '合歡山露營區',
    zone: '松景營位',
    checkIn: '2026-07-10',
    checkOut: '2026-07-12',
    nights: 2,
    guests: 4,
    statusLabel: '即將入住',
    statusCls: 'bk-status-shipped',
    zoneTotal: 4400,
    serviceFee: 400,
    total: 4800,
    payment: '信用卡',
    contactName: '露友小明',
    contactPhone: '0912-345-678'
  },
  {
    id: 'bk-002',
    bookingNumber: '#BK-20260501',
    campground: '太平山露營區',
    zone: '雲海營位',
    checkIn: '2026-05-03',
    checkOut: '2026-05-05',
    nights: 2,
    guests: 2,
    statusLabel: '已完成',
    statusCls: 'bk-status-delivered',
    zoneTotal: 3200,
    serviceFee: 400,
    total: 3600,
    payment: 'LINE Pay',
    contactName: '露友小明',
    contactPhone: '0912-345-678'
  },
  {
    id: 'bk-003',
    bookingNumber: '#BK-20260110',
    campground: '武陵農場露營區',
    zone: '桃花營位',
    checkIn: '2026-01-15',
    checkOut: '2026-01-16',
    nights: 1,
    guests: 3,
    statusLabel: '已完成',
    statusCls: 'bk-status-delivered',
    zoneTotal: 1900,
    serviceFee: 300,
    total: 2200,
    payment: '信用卡',
    contactName: '露友小明',
    contactPhone: '0912-345-678'
  },
  {
    id: 'bk-004',
    bookingNumber: '#BK-20251205',
    campground: '奧萬大露營區',
    zone: '楓葉營位',
    checkIn: '2025-12-10',
    checkOut: '2025-12-11',
    nights: 1,
    guests: 2,
    statusLabel: '已取消',
    statusCls: 'bk-status-cancelled',
    zoneTotal: 1500,
    serviceFee: 300,
    total: 1800,
    payment: '信用卡',
    cancelReason: '個人因素取消',
    contactName: '露友小明',
    contactPhone: '0912-345-678'
  }
];

/* ============================================================
   折價券渲染
============================================================ */
function renderMcCoupons() {
  var activeContainer  = document.getElementById('activeCoupons');
  var expiredContainer = document.getElementById('expiredCoupons');
  if (!activeContainer || !expiredContainer) return;

  var active  = MOCK_COUPONS_MC.filter(function (c) { return !c.expired; });
  var expired = MOCK_COUPONS_MC.filter(function (c) { return  c.expired; });

  function buildCouponHTML(c) {
    return '<div class="coupon-ticket' + (c.expired ? ' expired' : '') + '">'
      + '<div class="coupon-left">'
      + '<div class="coupon-discount-val">' + c.discountVal + '</div>'
      + '<div class="coupon-discount-unit">' + c.discountUnit + '</div>'
      + '</div>'
      + '<div class="coupon-sep"></div>'
      + '<div class="coupon-right">'
      + '<div class="coupon-title">' + c.title + '</div>'
      + '<div class="coupon-condition">' + c.condition + '</div>'
      + '<div class="coupon-expiry"><i class="bi bi-clock"></i> ' + c.expiry + '</div>'
      + '<div class="coupon-code-row">'
      + '<span class="coupon-code">' + c.code + '</span>'
      + (!c.expired ? '<button class="copy-btn" onclick="copyMcCouponCode(\'' + c.code + '\')">複製</button>' : '')
      + '</div>'
      + '</div>'
      + '</div>';
  }

  activeContainer.innerHTML = active.length
    ? active.map(buildCouponHTML).join('')
    : '<div class="rec-empty">目前沒有可使用的折價券</div>';

  expiredContainer.innerHTML = expired.length
    ? expired.map(buildCouponHTML).join('')
    : '<div class="rec-empty">沒有已失效的折價券</div>';
}

window.copyMcCouponCode = function (code) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(code)
      .then(function () { showToast('已複製折扣碼：' + code, 'success'); })
      .catch(function () { fallbackMcCopy(code); });
  } else {
    fallbackMcCopy(code);
  }
};

function fallbackMcCopy(code) {
  var el = document.createElement('textarea');
  el.value = code;
  el.style.cssText = 'position:fixed;opacity:0;';
  document.body.appendChild(el);
  el.select();
  document.execCommand('copy');
  document.body.removeChild(el);
  showToast('已複製折扣碼：' + code, 'success');
}

/* ============================================================
   訂單詳情 Modal
============================================================ */
window.openMcOrderDetail = function (orderId) {
  var order = MOCK_ORDERS_MC.find(function (o) { return o.id === orderId; });
  if (!order) return;

  var titleEl = document.getElementById('orderDetailTitle');
  var bodyEl  = document.getElementById('orderDetailBody');
  var overlay = document.getElementById('orderDetailOverlay');
  if (!titleEl || !bodyEl || !overlay) return;

  titleEl.textContent = '訂單詳情 ' + order.orderNumber;

  var itemsHTML = order.items.map(function (item) {
    return '<div class="bk-order-item-row">'
      + '<div>'
      + '<div class="bk-order-item-name">' + item.name + '</div>'
      + '<div class="bk-order-item-qty">× ' + item.quantity
      + ' &nbsp;｜&nbsp; NT$ ' + (item.price * item.quantity).toLocaleString() + '</div>'
      + '</div>'
      + '</div>';
  }).join('');

  bodyEl.innerHTML = ''
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">'
    + '<div style="font-size:0.8rem;color:#999;">' + order.createdAt + '</div>'
    + '<span class="bk-status-badge ' + order.statusCls + '">' + order.statusLabel + '</span>'
    + '</div>'
    + '<div style="margin-bottom:1rem;">'
    + '<div style="font-size:0.8rem;font-weight:700;color:#244d4d;margin-bottom:0.5rem;"><i class="bi bi-receipt"></i> 商品明細</div>'
    + itemsHTML
    + '</div>'
    + '<hr style="margin:0.75rem 0;border-color:#f0f0f0;">'
    + '<div style="font-size:0.82rem;color:#555;">'
    + '<div style="display:flex;justify-content:space-between;margin-bottom:0.3rem;">'
    + '<span>商品小計</span><span>NT$ ' + order.subtotal.toLocaleString() + '</span></div>'
    + '<div style="display:flex;justify-content:space-between;margin-bottom:0.3rem;">'
    + '<span>運費</span><span>' + (order.shippingFee === 0 ? '免運' : 'NT$ ' + order.shippingFee) + '</span></div>'
    + '<div style="display:flex;justify-content:space-between;font-weight:700;font-size:0.95rem;'
    + 'color:#244d4d;margin-top:0.5rem;border-top:1px solid #f0f0f0;padding-top:0.5rem;">'
    + '<span>訂單總計</span><span>NT$ ' + order.total.toLocaleString() + '</span></div>'
    + '</div>'
    + '<div style="margin-top:0.75rem;font-size:0.8rem;color:#777;">'
    + '<i class="bi bi-credit-card"></i> 付款方式：' + order.payment + '</div>'
    + (order.shippingAddress
      ? '<div style="font-size:0.8rem;color:#777;margin-top:0.2rem;">'
        + '<i class="bi bi-geo-alt"></i> 配送地址：' + order.shippingAddress + '</div>'
      : '')
    + '<div style="margin-top:1.25rem;">'
    + '<a href="https://line.me/R/ti/p/@yuruicamp" target="_blank" '
    + 'style="display:flex;align-items:center;justify-content:center;gap:0.4rem;'
    + 'padding:0.7rem;border:2px solid #06c755;border-radius:8px;'
    + 'color:#06c755;font-size:0.85rem;font-weight:600;text-decoration:none;">'
    + '<i class="bi bi-chat-dots"></i> 聯絡 LINE 客服詢問訂單</a>'
    + '</div>';

  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
};

window.openMcBookingDetail = function (bookingId) {
  var bk = MOCK_BOOKINGS_MC.find(function (b) { return b.id === bookingId; });
  if (!bk) return;

  var titleEl = document.getElementById('orderDetailTitle');
  var bodyEl  = document.getElementById('orderDetailBody');
  var overlay = document.getElementById('orderDetailOverlay');
  if (!titleEl || !bodyEl || !overlay) return;

  titleEl.textContent = '預約詳情 ' + bk.bookingNumber;

  bodyEl.innerHTML = ''
    + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem;">'
    + '<div style="font-size:0.8rem;color:#999;">預約日期：' + bk.checkIn + '</div>'
    + '<span class="bk-status-badge ' + bk.statusCls + '">' + bk.statusLabel + '</span>'
    + '</div>'

    + '<div style="margin-bottom:1rem;">'
    + '<div style="font-size:0.8rem;font-weight:700;color:#244d4d;margin-bottom:0.65rem;">'
    + '<i class="bi bi-tent"></i> 預約資訊</div>'
    + '<div class="bk-order-item-row">'
    + '<div>'
    + '<div class="bk-order-item-name">' + bk.campground + '・' + bk.zone + '</div>'
    + '<div class="bk-order-item-qty">'
    + '<i class="bi bi-calendar3"></i> ' + bk.checkIn + ' ～ ' + bk.checkOut
    + '（' + bk.nights + ' 晚）'
    + '&nbsp;&nbsp;<i class="bi bi-people"></i> ' + bk.guests + ' 人'
    + '</div>'
    + '</div>'
    + '</div>'
    + '</div>'

    + '<hr style="margin:0.75rem 0;border-color:#f0f0f0;">'

    + '<div style="font-size:0.82rem;color:#555;">'
    + '<div style="display:flex;justify-content:space-between;margin-bottom:0.3rem;">'
    + '<span>營地費用</span><span>NT$ ' + bk.zoneTotal.toLocaleString() + '</span></div>'
    + '<div style="display:flex;justify-content:space-between;margin-bottom:0.3rem;">'
    + '<span>服務費</span><span>NT$ ' + bk.serviceFee.toLocaleString() + '</span></div>'
    + '<div style="display:flex;justify-content:space-between;font-weight:700;font-size:0.95rem;'
    + 'color:#244d4d;margin-top:0.5rem;border-top:1px solid #f0f0f0;padding-top:0.5rem;">'
    + '<span>訂單總計</span><span>NT$ ' + bk.total.toLocaleString() + '</span></div>'
    + '</div>'

    + '<div style="margin-top:0.75rem;font-size:0.8rem;color:#777;">'
    + '<i class="bi bi-credit-card"></i> 付款方式：' + bk.payment + '</div>'
    + '<div style="font-size:0.8rem;color:#777;margin-top:0.2rem;">'
    + '<i class="bi bi-person"></i> 聯絡人：' + bk.contactName
    + '&nbsp;&nbsp;<i class="bi bi-telephone"></i> ' + bk.contactPhone + '</div>'
    + (bk.cancelReason
      ? '<div style="font-size:0.8rem;color:#c0392b;margin-top:0.5rem;">'
        + '<i class="bi bi-x-circle"></i> 取消原因：' + bk.cancelReason + '</div>'
      : '')

    + '<div style="margin-top:1.25rem;">'
    + '<a href="https://line.me/R/ti/p/@yuruicamp" target="_blank" '
    + 'style="display:flex;align-items:center;justify-content:center;gap:0.4rem;'
    + 'padding:0.7rem;border:2px solid #06c755;border-radius:8px;'
    + 'color:#06c755;font-size:0.85rem;font-weight:600;text-decoration:none;">'
    + '<i class="bi bi-chat-dots"></i> 聯絡 LINE 客服詢問預約</a>'
    + '</div>';

  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
};

document.addEventListener('DOMContentLoaded', function () {
  var overlay   = document.getElementById('orderDetailOverlay');
  var closeBtn  = document.getElementById('orderDetailClose');

  function closeMcOrderModal() {
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  if (closeBtn) closeBtn.addEventListener('click', closeMcOrderModal);
  if (overlay) {
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeMcOrderModal();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && overlay && overlay.classList.contains('is-open')) {
      closeMcOrderModal();
    }
  });
});

/* ============================================================
   記錄篩選（商城 / 預約各自獨立）
============================================================ */
function filterRecList(listId, emptyId, filter) {
  var list  = document.getElementById(listId);
  var empty = document.getElementById(emptyId);
  if (!list) return;

  var items = list.querySelectorAll('.rec-item');
  var visibleCount = 0;
  items.forEach(function (item) {
    var match = (filter === 'all') || (item.dataset.status === filter);
    item.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });

  if (empty) empty.style.display = visibleCount === 0 ? '' : 'none';
}

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
     3. 折價券 Sub-tab（可使用 / 已失效）+ 渲染
  ============================================================ */
  renderMcCoupons();

  document.querySelectorAll('.rec-tab[data-coupon-tab]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      var which = this.dataset.couponTab;

      document.querySelectorAll('.rec-tab[data-coupon-tab]').forEach(function (t) {
        t.classList.toggle('active', t.dataset.couponTab === which);
      });

      var active  = document.getElementById('activeCoupons');
      var expired = document.getElementById('expiredCoupons');
      if (active)  active.style.display  = (which === 'active')  ? '' : 'none';
      if (expired) expired.style.display = (which === 'expired') ? '' : 'none';
    });
  });

  /* ============================================================
     3b. 商城 / 預約紀錄 各自的狀態篩選 tabs
  ============================================================ */
  document.querySelectorAll('.order-status-tab[data-store-filter]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.order-status-tab[data-store-filter]').forEach(function (t) {
        t.classList.remove('active');
      });
      this.classList.add('active');
      filterRecList('storeRecList', 'storeEmptyState', this.dataset.storeFilter);
    });
  });

  document.querySelectorAll('.order-status-tab[data-booking-filter]').forEach(function (tab) {
    tab.addEventListener('click', function () {
      document.querySelectorAll('.order-status-tab[data-booking-filter]').forEach(function (t) {
        t.classList.remove('active');
      });
      this.classList.add('active');
      filterRecList('bookingRecList', 'bookingEmptyState', this.dataset.bookingFilter);
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
      showToast('個人資料已儲存！', 'success');
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
