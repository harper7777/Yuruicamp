/**
 * booking-cart.js
 * 功能：預約背包確認頁（步驟 4）
 *   ① 讀取 LocalStorage，渲染住宿 + 裝備項目（含數量調整器）
 *   ② 「修改日期」連結帶入正確 campground_id
 *   ③ 住宿：調整營位數量，即時重算小計
 *   ④ 裝備：調整數量 / 刪除項目，即時重算小計
 *   ⑤ 右側摘要隨數量變化同步更新
 *   ⑥ 所有變更即時寫回 localStorage
 */

// 目前操作中的 bookingCart，初始從 localStorage 讀取
var bookingCart = null;

$(document).ready(function () {

  var stored = localStorage.getItem('bookingCart');

  if (!stored) {
    showEmptyState();
    return;
  }

  try {
    bookingCart = JSON.parse(stored);
  } catch (e) {
    showEmptyState();
    return;
  }

  renderAll();

  // 清除背包
  $('#bkClearCartBtn').on('click', function () {
    showConfirmToast('確定清除背包中的所有預約資料？', function () {
      localStorage.removeItem('bookingCart');
      bookingCart = null;
      showToast('背包已清除', 'info');
      $('#bkCartContent').fadeOut(250, function () {
        showEmptyState();
      });
    });
  });

  // 住宿數量調整：事件委派到 stayBody
  $('#bkStayBody').on('click', '.bk-qty-btn', function () {
    var $btn   = $(this);
    var action = $btn.data('action');
    var idx    = parseInt($btn.data('idx'));
    var zone   = bookingCart.selected_zones[idx];
    if (!zone) return;

    var unitPrice = zone.subtotal / zone.quantity;
    var newQty    = zone.quantity + (action === 'inc' ? 1 : -1);
    if (newQty < 1 || newQty > 10) return;

    zone.quantity = newQty;
    zone.subtotal = Math.round(unitPrice * newQty);

    recalcSummary();
    saveCart();
    renderStayBody();
    renderSummary();
  });

  // 裝備數量調整：事件委派到 rentalBody
  $('#bkRentalBody').on('click', '.bk-qty-btn', function () {
    var $btn   = $(this);
    var action = $btn.data('action');
    var idx    = parseInt($btn.data('idx'));
    var rental = bookingCart.selected_rentals[idx];
    if (!rental) return;

    var unitPrice = rental.subtotal / rental.quantity;
    var newQty    = rental.quantity + (action === 'inc' ? 1 : -1);
    if (newQty < 1 || newQty > 20) return;

    rental.quantity = newQty;
    rental.subtotal = Math.round(unitPrice * newQty);

    recalcSummary();
    saveCart();
    renderRentalBody();
    renderSummary();
  });

  // 裝備刪除
  $('#bkRentalBody').on('click', '.bk-rental-remove', function () {
    var idx = parseInt($(this).data('idx'));
    bookingCart.selected_rentals.splice(idx, 1);

    recalcSummary();
    saveCart();
    renderRentalBody();
    renderSummary();

    if (bookingCart.selected_rentals.length === 0) {
      showToast('裝備已全部移除', 'info');
    }
  });

});

// ============================================================
// 渲染整頁
// ============================================================

function renderAll() {
  var info = bookingCart.booking_info || {};

  // 設定「修改日期」連結：帶入 campground_id
  var campId = info.campground_id || '';
  $('#bkEditDateLink').attr('href', './camp-detail.html?id=' + encodeURIComponent(campId));

  // 項目總數
  updateItemCount();

  renderStayBody();
  renderRentalBody();
  renderSummary();

  $('#bkCartEmpty').hide();
  $('#bkCartContent').show();
}

// ── 住宿卡內容 ──
function renderStayBody() {
  var info  = bookingCart.booking_info || {};
  var zones = bookingCart.selected_zones || [];

  if (zones.length === 0) {
    $('#bkStayCard').hide();
    return;
  }

  var html = zones.map(function (z, idx) {
    var atMin = z.quantity <= 1;
    var atMax = z.quantity >= 10;
    return `
      <div class="bk-cart-item">
        <div class="bk-cart-item__info">
          <div class="bk-cart-item__name">${esc(info.campground_name || '')} · ${esc(z.zone_type || '')}</div>
          <div class="bk-cart-item__meta">
            <span><i class="bi bi-calendar3"></i> ${esc(info.check_in || '')} ～ ${esc(info.check_out || '')}</span>
            <span><i class="bi bi-moon"></i> ${info.total_days || 0} 晚</span>
            <span><i class="bi bi-people"></i> ${info.guest_count || ''} 人</span>
          </div>
        </div>
        <div class="bk-cart-item__right">
          <div class="bk-qty-stepper">
            <button class="bk-qty-btn" data-action="dec" data-idx="${idx}"${atMin ? ' disabled' : ''}>−</button>
            <span class="bk-qty-val">${z.quantity}</span>
            <button class="bk-qty-btn" data-action="inc" data-idx="${idx}"${atMax ? ' disabled' : ''}>+</button>
          </div>
          <div class="bk-cart-item__price" id="zonePrice${idx}">NT$${z.subtotal.toLocaleString()}</div>
          <div style="font-size:0.72rem;color:var(--bk-text-muted);">營位數量</div>
        </div>
      </div>
    `;
  }).join('');

  $('#bkStayBody').html(html);
  $('#bkStayCard').show();
}

// ── 裝備租借卡內容 ──
function renderRentalBody() {
  var rentals = bookingCart.selected_rentals || [];

  if (rentals.length === 0) {
    $('#bkRentalBody').html(
      '<div style="padding:1rem 1.25rem;color:var(--bk-text-muted);font-size:0.85rem;">本次未選擇租借裝備。</div>'
    );
    return;
  }

  var html = rentals.map(function (r, idx) {
    var atMax = r.quantity >= 20;
    return `
      <div class="bk-cart-item">
        <div class="bk-cart-item__info">
          <div class="bk-cart-item__name">${esc(r.name || '')}</div>
          <div class="bk-cart-item__meta">
            <span>單價 NT$${Math.round(r.subtotal / r.quantity).toLocaleString()}</span>
          </div>
        </div>
        <div class="bk-cart-item__right">
          <div class="bk-qty-stepper">
            <button class="bk-qty-btn" data-action="dec" data-idx="${idx}">−</button>
            <span class="bk-qty-val">${r.quantity}</span>
            <button class="bk-qty-btn" data-action="inc" data-idx="${idx}"${atMax ? ' disabled' : ''}>+</button>
          </div>
          <div class="bk-cart-item__price">NT$${r.subtotal.toLocaleString()}</div>
          <button class="bk-rental-remove" data-idx="${idx}">
            <i class="bi bi-trash3"></i> 移除
          </button>
        </div>
      </div>
    `;
  }).join('');

  $('#bkRentalBody').html(html);
  $('#bkRentalCard').show();
}

// ── 右側費用摘要 ──
function renderSummary() {
  var s = bookingCart.summary || {};

  var html = `
    <div class="cost-row">
      <span>住宿費</span>
      <span>NT$${(s.zone_total || 0).toLocaleString()}</span>
    </div>
    <div class="cost-row">
      <span>裝備租借費</span>
      <span>NT$${(s.rental_total || 0).toLocaleString()}</span>
    </div>
  `;

  if (s.applied_discount > 0) {
    html += `
      <div class="cost-row cost-row--discount">
        <span><i class="bi bi-tag"></i> 租借折扣優惠</span>
        <span>-NT$${s.applied_discount.toLocaleString()}</span>
      </div>
    `;
  }

  $('#bkCostRows').html(html);
  $('#bkFinalAmount').text('NT$' + (s.final_amount || 0).toLocaleString());
}

// ============================================================
// 工具函式
// ============================================================

// 重新計算 summary（zone_total / rental_total / final_amount）
function recalcSummary() {
  var zones   = bookingCart.selected_zones   || [];
  var rentals = bookingCart.selected_rentals || [];

  var zoneTotal   = zones.reduce(function (s, z) { return s + (z.subtotal || 0); }, 0);
  var rentalTotal = rentals.reduce(function (s, r) { return s + (r.subtotal || 0); }, 0);

  // discount 保持不變（沒有儲存單件折扣，無法精確重算）
  var discount = bookingCart.summary ? (bookingCart.summary.applied_discount || 0) : 0;

  bookingCart.summary = {
    zone_total:       zoneTotal,
    rental_total:     rentalTotal,
    applied_discount: discount,
    final_amount:     zoneTotal + rentalTotal - discount
  };

  updateItemCount();
}

function updateItemCount() {
  var zones   = bookingCart.selected_zones   || [];
  var rentals = bookingCart.selected_rentals || [];
  var total   = zones.reduce(function (s, z) { return s + (z.quantity || 0); }, 0)
              + rentals.reduce(function (s, r) { return s + (r.quantity || 0); }, 0);
  $('#bkCartCount').text('共 ' + total + ' 項');
}

function saveCart() {
  localStorage.setItem('bookingCart', JSON.stringify(bookingCart));
}

function showEmptyState() {
  $('#bkCartEmpty').show();
  $('#bkCartContent').hide();
  $('#bkCartCount').text('');
}

// XSS 防護：轉義 HTML 特殊字元
function esc(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// showConfirmToast 定義在 booking-header.js，此處不重複
