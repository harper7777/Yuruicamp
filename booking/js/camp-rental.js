/**
 * camp-rental.js
 * 功能：裝備租借頁邏輯
 *   ① 讀取 LocalStorage 取得 campground_id 與日期資訊
 *   ② 過濾只顯示對應營區的可租借裝備
 *   ③ 渲染情境推薦橫幅（依據 terrain_tag）
 *   ④ 加入 / 移除裝備，即時更新側欄已選清單
 *   ⑤ 確認後更新 LocalStorage 並前往結帳頁
 *
 * Handles: LocalStorage read, equipment filtering, recommendation
 *          banner, cart management, LocalStorage update
 */

// ============================================================
// 全域狀態 / Global State
// ============================================================
let bookingCart      = null;  // 從 LocalStorage 讀取的預約資料
let allRentals       = [];    // 所有裝備原始資料（完整陣列）
let selectedRentals  = {};    // 已選裝備：{ equipment_id: { ...item, quantity } }

// ============================================================
// 頁面初始化 / Page Initialization
// ============================================================
$(document).ready(function () {

  // 步驟 1：讀取 LocalStorage / Step 1: Read LocalStorage
  const stored = localStorage.getItem('bookingCart');

  // 防呆：若 LocalStorage 無資料，代表使用者跳過了前面的流程
  // Guard: if no booking data in storage, user skipped the flow
  if (!stored) {
    showToast('預約資訊已遺失，請重新搜尋營區。', 'warning');
    window.location.href = './camp-search.html';
    return;
  }

  bookingCart = JSON.parse(stored);

  // 步驟 2：渲染頂部預約摘要列 / Step 2: Render summary bar
  renderSummaryBar(bookingCart.booking_info);

  // 修改連結帶上 campground_id / Edit link with campground_id
  $('#summaryEditLink').attr(
    'href',
    `./camp-detail.html?id=${bookingCart.booking_info.campground_id}`
  );

  // 步驟 3：載入裝備資料 / Step 3: Load rental data
  loadRentals(bookingCart.booking_info.campground_id);

  // 步驟 4：綁定「前往結帳」按鈕 / Step 4: Bind checkout button
  $('#goToBookingCartBtn').on('click', saveRentalsAndNext);

});

// ============================================================
// 渲染頂部預約摘要列
// ============================================================

/**
 * 從 booking_info 產生頂部摘要列文字
 * Generate summary bar text from booking_info
 *
 * @param {Object} info - bookingCart.booking_info
 */
function renderSummaryBar(info) {
  const text = `
    <strong>${info.campground_name}</strong>
    <span class="summary-sep">|</span>
    ${info.check_in} ～ ${info.check_out}
    <span class="summary-sep">|</span>
    共 ${info.total_days} 晚（平日 ${info.weekday_count}、假日 ${info.holiday_count}）
    <span class="summary-sep">|</span>
    ${info.guest_count} 人
  `;
  $('#summaryText').html(text);
}

// ============================================================
// 載入裝備資料
// ============================================================

/**
 * 載入 rentals.json 並過濾出屬於當前 campground_id 的裝備
 * Load rentals.json and filter by current campground_id
 *
 * @param {string} campId - 要過濾的 campground_id
 */
function loadRentals(campId) {

  // TODO: 未來在此替換為 fetch Java 後端 API
  // Future backend endpoint: GET /api/rentals?campground_id=C001
  // Response: { success: true, data: [...rentals] }
  $.ajax({
    url: '../data/rentals.json',
    method: 'GET',
    dataType: 'json'
  })
  .done(function (data) {
    allRentals = data;

    // 只保留屬於此 campground 的裝備 / Keep only this campground's rentals
    const filtered = allRentals.filter(r => r.campground_id === campId);

    // 渲染推薦橫幅 / Render recommendation banner
    renderRecommendationBanner(filtered, bookingCart.booking_info);

    // 渲染裝備卡片 / Render rental cards
    renderRentalItems(filtered);

    // 更新數量顯示 / Update count badge
    if (filtered.length > 0) {
      $('#rentalCount').text(`（共 ${filtered.length} 件）`);
    }
  })
  .fail(function (xhr, textStatus) {
    console.error('[camp-rental] 裝備資料載入失敗:', textStatus);
    $('#rentalGrid').html(`
      <div class="error-msg">
        <i class="bi bi-exclamation-triangle"></i>
        裝備資料載入失敗。
      </div>
    `);
  });
}

// ============================================================
// 渲染情境推薦橫幅
// ============================================================

/**
 * 依據裝備的 terrain_tag 顯示推薦橫幅
 * Show recommendation banner based on equipment terrain_tags
 *
 * @param {Array}  rentals     - 已過濾的裝備陣列
 * @param {Object} bookingInfo - 預約資訊（含營區名稱）
 */
function renderRecommendationBanner(rentals, bookingInfo) {
  const $banner = $('#recommendationBanner');

  if (rentals.length === 0) {
    $banner.hide();
    return;
  }

  // 收集所有不重複的 terrain_tag / Collect unique terrain_tags
  const tags = [...new Set(
    rentals.map(r => r.terrain_tag).filter(Boolean)
  )];

  if (tags.length === 0) {
    $banner.hide();
    return;
  }

  // 建立標籤 HTML / Build tags HTML
  const tagsHTML = tags
    .map(t => `<span class="recommendation-tag"><i class="bi bi-lightbulb-fill"></i> ${t}</span>`)
    .join('');

  $banner.html(`
    <div class="recommendation-banner__content">
      <div style="margin-bottom:.4rem;">
        <strong>📍 ${bookingInfo.campground_name}</strong> 的情境推薦裝備
      </div>
      <div class="recommendation-tags">${tagsHTML}</div>
    </div>
  `).show();
}

// ============================================================
// 渲染裝備卡片
// ============================================================

/**
 * 將裝備陣列渲染為卡片
 * Render equipment array as cards
 *
 * @param {Array} rentals - 要渲染的裝備陣列
 */
function renderRentalItems(rentals) {
  const $grid = $('#rentalGrid').empty();

  if (rentals.length === 0) {
    $grid.html(`
      <div class="no-result" style="grid-column:1/-1;">
        <i class="bi bi-bag-x" style="font-size:2rem;display:block;margin-bottom:.5rem;"></i>
        此營區目前沒有可租借的裝備。<br>
        <a href="./booking-cart.html" class="btn btn--outline" style="margin-top:1rem;">
          直接前往結帳
        </a>
      </div>
    `);
    return;
  }

  const info = bookingCart.booking_info;

  rentals.forEach(function (item) {
    const wPrice  = item.pricing.price_per_day_weekday;
    const hPrice  = item.pricing.price_per_day_holiday;
    const disc    = item.pricing.discount;

    // 預估本次租借費用（不含數量，數量預設 1）
    // Estimated cost for this trip (quantity = 1 by default)
    const estimated = Math.max(0,
      (wPrice * info.weekday_count) + (hPrice * info.holiday_count) - disc
    );

    // terrain_tag 推薦標籤 / Terrain recommendation tag
    const tagHTML = item.terrain_tag
      ? `<span class="tag tag--recommend" style="margin-bottom:.4rem;">${item.terrain_tag}</span>`
      : '';

    // 折扣說明 / Discount note
    const discHTML = disc > 0
      ? `<span style="color:#e07b39;font-size:.78rem;">（已折 NT$${disc.toLocaleString()}）</span>`
      : '';

    const card = `
      <div class="rental-item-card" data-id="${item.equipment_id}">
        <img src="${item.image_url}"
             alt="${item.name}"
             class="rental-item-card__img"
             loading="lazy"
             onerror="this.src='https://picsum.photos/seed/${item.equipment_id}/400/280'">
        <div class="rental-item-card__body">
          <h4 class="rental-item-card__name">${item.name}</h4>
          ${tagHTML}
          <p style="font-size:.8rem;color:#666;margin-bottom:.5rem;">${item.description}</p>
          <p class="rental-item-card__price">
            平日 NT$${wPrice}/天 ／ 假日 NT$${hPrice}/天
          </p>
          <p class="rental-item-card__estimated">
            本次預估：<strong>NT$${estimated.toLocaleString()}</strong>${discHTML}
          </p>
          <p class="rental-item-card__stock">
            <i class="bi bi-box-seam"></i> 庫存：${item.stock} 件
          </p>
        </div>
        <div class="rental-item-card__actions">
          <button class="btn btn--outline rental-add-btn" data-id="${item.equipment_id}">
            <i class="bi bi-plus-circle"></i> 加入租借
          </button>
        </div>
      </div>
    `;
    $grid.append(card);
  });

  // 綁定「加入租借」按鈕事件 / Bind "add" button events
  $grid.on('click', '.rental-add-btn', function () {
    const id = $(this).data('id');
    addRentalItem(id);

    // 按鈕短暫反饋 / Brief button feedback
    const $btn = $(this);
    $btn.html('<i class="bi bi-check-circle-fill"></i> 已加入').css('color', '#2d7a4f');
    setTimeout(() => {
      $btn.html('<i class="bi bi-plus-circle"></i> 再加一件').css('color', '');
    }, 1000);
  });
}

// ============================================================
// 加入 / 移除裝備邏輯
// ============================================================

/**
 * 將裝備加入已選清單（若已存在則 +1 數量）
 * Add rental item to selected map (increment qty if already added)
 *
 * @param {string} equipmentId - 裝備的 equipment_id
 */
function addRentalItem(equipmentId) {
  const item = allRentals.find(r => r.equipment_id === equipmentId);
  if (!item) return;

  if (selectedRentals[equipmentId]) {
    // 已存在：數量 +1（不超過庫存）/ Increment, not exceeding stock
    if (selectedRentals[equipmentId].quantity < item.stock) {
      selectedRentals[equipmentId].quantity++;
    } else {
      showToast(`庫存不足，最多可租借 ${item.stock} 件。`, 'warning');
      return;
    }
  } else {
    // 新增 / New entry
    selectedRentals[equipmentId] = { ...item, quantity: 1 };
  }

  updateRentalCartUI();
}

/**
 * 從已選清單移除指定裝備
 * Remove rental item from selected map
 *
 * @param {string} equipmentId - 要移除的 equipment_id
 */
function removeRentalItem(equipmentId) {
  delete selectedRentals[equipmentId];
  updateRentalCartUI();
}

// ============================================================
// 更新右側已選清單 UI
// ============================================================

/**
 * 重新渲染右側已選裝備清單與費用小計
 * Re-render the selected rental list and cost subtotal
 */
function updateRentalCartUI() {
  const $list = $('#rentalCartList').empty();
  const items  = Object.values(selectedRentals);
  const info   = bookingCart.booking_info;

  // 無選擇時顯示空狀態 / Show empty state if nothing selected
  if (items.length === 0) {
    $list.html('<p class="rental-cart-list__empty">尚未選擇任何裝備</p>');
    $('#rentalSubtotal').text('NT$0');
    return;
  }

  let totalRental = 0;

  items.forEach(function (item) {
    // 單筆小計 = (平日租金 × 平日天數 + 假日租金 × 假日天數 - 折扣) × 數量
    // Item subtotal = (weekday × wdays + holiday × hdays - discount) × quantity
    const perUnit = Math.max(0,
      (item.pricing.price_per_day_weekday * info.weekday_count) +
      (item.pricing.price_per_day_holiday * info.holiday_count) -
      item.pricing.discount
    );
    const subtotal = perUnit * item.quantity;
    totalRental += subtotal;

    $list.append(`
      <div class="rental-cart-item">
        <span>${item.name} ×${item.quantity}</span>
        <span>NT$${subtotal.toLocaleString()}</span>
        <button class="rental-remove-btn" data-id="${item.equipment_id}" title="移除">
          <i class="bi bi-x"></i>
        </button>
      </div>
    `);
  });

  $('#rentalSubtotal').text(`NT$${totalRental.toLocaleString()}`);

  // 綁定移除按鈕事件（event delegation，每次重渲染後重新綁）
  // Bind remove buttons via event delegation
  $list.on('click', '.rental-remove-btn', function () {
    removeRentalItem($(this).data('id'));
  });
}

// ============================================================
// 儲存裝備選擇並前往結帳頁
// ============================================================

/**
 * 將 selectedRentals 合併進 bookingCart，更新 LocalStorage，然後跳轉
 * Merge selected rentals into bookingCart, update LocalStorage, redirect
 */
function saveRentalsAndNext() {
  const info  = bookingCart.booking_info;
  const items = Object.values(selectedRentals);

  // 計算每件裝備的小計 / Calculate subtotal for each rental
  const rentalList = items.map(function (item) {
    const perUnit = Math.max(0,
      (item.pricing.price_per_day_weekday * info.weekday_count) +
      (item.pricing.price_per_day_holiday * info.holiday_count) -
      item.pricing.discount
    );
    return {
      equipment_id: item.equipment_id,
      name:         item.name,
      quantity:     item.quantity,
      subtotal:     perUnit * item.quantity
    };
  });

  const rentalTotal = rentalList.reduce((sum, r) => sum + r.subtotal, 0);
  const zoneTotal   = bookingCart.summary.zone_total;

  // 計算總折扣（各件裝備的 discount × 數量加總）
  // Total discount across all selected rentals
  const totalDiscount = items.reduce(
    (sum, i) => sum + (i.pricing.discount * i.quantity), 0
  );

  // 更新 bookingCart / Update bookingCart
  bookingCart.selected_rentals = rentalList;
  bookingCart.summary = {
    zone_total:       zoneTotal,
    rental_total:     rentalTotal,
    applied_discount: totalDiscount,
    final_amount:     zoneTotal + rentalTotal
  };

  // 寫回 LocalStorage / Write back to LocalStorage
  localStorage.setItem('bookingCart', JSON.stringify(bookingCart));

  console.log('[camp-rental] 已更新 LocalStorage bookingCart:', bookingCart);

  // 前往結帳頁 / Redirect to checkout
  window.location.href = './booking-cart.html';
}
