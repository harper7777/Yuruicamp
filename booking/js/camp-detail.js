/**
 * camp-detail.js
 * 功能：營區詳情頁邏輯
 *   ① 解析 URL 參數取得 campground_id
 *   ② 讀取 JSON 並渲染詳情
 *   ③ Flatpickr 日期範圍選擇 + 平日/假日計算
 *   ④ 營位選擇 → 計算費用小計
 *   ⑤ 確認後寫入 LocalStorage 並前往下一頁
 *
 * Handles: URL param parsing, data rendering, date calculation,
 *          zone selection, LocalStorage write
 */

// ============================================================
// 全域狀態 / Global State
// ============================================================
let currentCamp   = null;  // 當前營區完整資料 / Current campground data
let selectedZoneId = null; // 使用者選擇的 zone_id / Selected zone ID
let checkInDate   = null;  // 入住日期（Date 物件）/ Check-in Date object
let checkOutDate  = null;  // 退房日期（Date 物件）/ Check-out Date object
let weekdayCount  = 0;     // 平日天數 / Weekday nights count
let holidayCount  = 0;     // 假日天數 / Holiday nights count

// ============================================================
// 頁面初始化 / Page Initialization
// ============================================================
$(document).ready(function () {

  // 步驟 1：從 URL 取得 id 參數 / Step 1: Get id from URL
  const params = new URLSearchParams(window.location.search);
  const campId  = params.get('id');

  // 防呆：缺少 id 時返回搜尋頁 / Guard: redirect if id missing
  if (!campId) {
    alert('找不到營區資訊，即將返回搜尋頁。');
    window.location.href = './camp-search.html';
    return;
  }

  // 步驟 2：載入資料 / Step 2: Load data
  loadCampDetail(campId);

  // 步驟 3：確認按鈕綁定 / Step 3: Bind confirm button
  $('#confirmBookingBtn').on('click', saveToLocalStorageAndNext);

});

// ============================================================
// 載入營區詳情資料
// ============================================================

/**
 * 透過 AJAX 讀取 campgrounds.json，找到對應的營區資料
 * Load campground data via AJAX, find matching entry by ID
 *
 * @param {string} campId - URL 傳入的 campground_id
 */
function loadCampDetail(campId) {

  // TODO: 未來在此替換為 fetch Java 後端 API
  // Future backend endpoint: GET /api/campgrounds/{campId}
  // Response: { success: true, data: { campground } }
  $.ajax({
    url: '../data/campgrounds.json',
    method: 'GET',
    dataType: 'json'
  })
  .done(function (data) {
    // 從陣列中找到指定 ID 的營區 / Find campground by ID in array
    currentCamp = data.find(c => c.campground_id === campId);

    if (!currentCamp) {
      alert('找不到此營區（ID: ' + campId + '），即將返回搜尋頁。');
      window.location.href = './camp-search.html';
      return;
    }

    renderCampDetail(currentCamp);
    initDatePicker();
  })
  .fail(function (xhr, textStatus) {
    console.error('[camp-detail] AJAX 失敗:', textStatus);
    $('#campHeader').html('<p class="error-msg">資料載入失敗，請重新整理頁面。</p>');
  });
}

// ============================================================
// 渲染頁面內容
// ============================================================

/**
 * 將營區資料填入各個 DOM 元素
 * Render campground data into DOM elements
 *
 * @param {Object} camp - 單一營區物件
 */
function renderCampDetail(camp) {

  // 更新頁面標題與麵包屑 / Update page title and breadcrumb
  document.title = camp.name + ' - Yuruicamp 露營選物';
  $('#breadcrumbName').text(camp.name);

  // 渲染 Header 區塊 / Render camp header section
  const envTagsHTML = camp.environment_tags
    .map(t => `<span class="tag tag--env">${t}</span>`).join('');
  const facTagsHTML = camp.facility_tags
    .map(t => `<span class="tag tag--facility">${t}</span>`).join('');

  $('#campHeader').html(`
    <h1>${camp.name}</h1>
    <p class="camp-header__region">
      <i class="bi bi-geo-alt-fill"></i> ${camp.region}
    </p>
    <div class="camp-header__tags">${envTagsHTML}${facTagsHTML}</div>
  `);

  // 渲染圖片區（3 張 picsum 佔位圖）/ Render gallery with picsum placeholders
  const galleryHTML = [0, 1, 2].map(i => `
    <img src="https://picsum.photos/seed/${camp.campground_id}_${i}/600/400"
         alt="${camp.name} 第 ${i + 1} 張圖"
         class="gallery-img"
         loading="lazy">
  `).join('');
  $('#campGallery').html(galleryHTML);

  // 渲染介紹文字與設施 / Render description and facilities
  const allFacHTML = camp.facility_tags
    .map(t => `<span class="tag tag--facility">${t}</span>`).join('');
  $('#campDescription').html(`
    <h3 style="color:var(--bk-primary);margin-bottom:.75rem;">營區介紹</h3>
    <p>${camp.description}</p>
    <div style="margin-top:.75rem;">${allFacHTML}</div>
  `);

  // 渲染營位選擇器 / Render zone selector
  renderZoneSelector(camp.zones);

  // 渲染資訊表格 / Render info table
  renderZoneTable(camp.zones);
}

/**
 * 渲染左側可選營位清單
 * Render zone selection cards
 *
 * @param {Array} zones - 該營區的 zones 陣列
 */
function renderZoneSelector(zones) {
  const $list = $('#zoneList').empty();

  zones.forEach(function (zone) {
    const html = `
      <div class="zone-card" data-zone-id="${zone.zone_id}">
        <div class="zone-card__info">
          <strong>${zone.type}</strong>
          <span>最多 ${zone.capacity_per_site} 人</span>
        </div>
        <div class="zone-card__price">
          平日 NT$${zone.price_weekday.toLocaleString()} ／ 假日 NT$${zone.price_holiday.toLocaleString()}
        </div>
        <div class="zone-card__stock">
          <i class="bi bi-tent"></i> 剩餘 <strong>${zone.total_sites}</strong> 個營位
        </div>
        <button class="btn btn--outline zone-select-btn">
          <i class="bi bi-check-circle"></i> 選擇此類型
        </button>
      </div>
    `;
    $list.append(html);
  });

  // 綁定選擇事件 / Bind zone selection event
  $list.on('click', '.zone-select-btn', function () {
    const $card = $(this).closest('.zone-card');

    // 移除其他卡片的選中狀態 / Remove selected state from others
    $('.zone-card').removeClass('is-selected');
    $('.zone-select-btn').html('<i class="bi bi-check-circle"></i> 選擇此類型');

    // 選中當前卡片 / Select current card
    $card.addClass('is-selected');
    $(this).html('<i class="bi bi-check-circle-fill"></i> ✓ 已選擇');
    selectedZoneId = $card.data('zone-id');

    // 若日期已選擇，立即更新費用 / If dates already selected, update price
    if (weekdayCount + holidayCount > 0) {
      updatePriceSummary();
    }
  });
}

/**
 * 渲染下方的詳細資訊表格
 * Render zone info table at the bottom of page
 *
 * @param {Array} zones - zones 陣列
 */
function renderZoneTable(zones) {
  const $tbody = $('#zoneTableBody').empty();
  zones.forEach(function (zone) {
    $tbody.append(`
      <tr>
        <td><strong>${zone.type}</strong></td>
        <td>${zone.capacity_per_site} 人</td>
        <td>NT$${zone.price_weekday.toLocaleString()}</td>
        <td>NT$${zone.price_holiday.toLocaleString()}</td>
        <td>${zone.total_sites} 個</td>
      </tr>
    `);
  });
}

// ============================================================
// Flatpickr 日期選擇器
// ============================================================

/**
 * 初始化 Flatpickr 日期範圍選擇器
 * Initialize Flatpickr date range picker
 */
function initDatePicker() {
  flatpickr('#dateRange', {
    mode: 'range',        // 範圍模式：選擇開始與結束日期 / Range mode
    locale: 'zh_tw',      // 繁體中文 / Traditional Chinese locale
    minDate: 'today',     // 最早可選今天 / Minimum: today
    dateFormat: 'Y-m-d',  // 儲存格式 / Storage format: YYYY-MM-DD
    showMonths: 1,

    // 使用者選完日期後觸發 / Fires when user finishes selecting a range
    onChange: function (selectedDates) {
      if (selectedDates.length === 2) {
        checkInDate  = selectedDates[0];
        checkOutDate = selectedDates[1];

        // 計算平日/假日天數 / Calculate weekday/holiday nights
        calculateDays(checkInDate, checkOutDate);

        // 若已選營位，更新費用 / Update price if zone already selected
        if (selectedZoneId) {
          updatePriceSummary();
        }
      }
    }
  });
}

// ============================================================
// 平日 / 假日計算
// ============================================================

/**
 * 計算日期區間內的平日與假日夜晚數
 *
 * 計算規則：
 *   入住日（含）到退房日（不含），逐天計算。
 *   週五（dayOfWeek=5）與週六（dayOfWeek=6）算「假日」
 *   其餘（週日~週四）算「平日」
 *
 * Calculate weekday and holiday nights in a date range.
 * Rule: Friday(5) & Saturday(6) = holiday; others = weekday.
 * Counts from check-in (inclusive) to check-out (exclusive).
 *
 * @param {Date} start - 入住日期 / Check-in date
 * @param {Date} end   - 退房日期 / Check-out date
 */
function calculateDays(start, end) {
  weekdayCount = 0;
  holidayCount = 0;

  // 複製一份，避免修改原始 Date 物件 / Clone to avoid mutating original
  const cursor = new Date(start);

  // 逐天遍歷到退房日（不含退房日當天，因為退房日不住）
  // Iterate day by day up to (not including) check-out
  while (cursor < end) {
    const dow = cursor.getDay(); // 0=週日, 1=一, ..., 5=五, 6=六

    if (dow === 5 || dow === 6) {
      // 週五 or 週六 → 假日 / Friday or Saturday = holiday
      holidayCount++;
    } else {
      // 其他 → 平日 / Other days = weekday
      weekdayCount++;
    }

    cursor.setDate(cursor.getDate() + 1); // 前進一天 / Advance by 1 day
  }

  const total = weekdayCount + holidayCount;

  // 更新 UI 顯示 / Update UI
  $('#totalDays').text(total);
  $('#weekdayLabel').text(`平日 ${weekdayCount} 晚`);
  $('#holidayLabel').text(`假日 ${holidayCount} 晚`);
  $('#dateSummary').show();
}

// ============================================================
// 費用小計計算
// ============================================================

/**
 * 根據選擇的營位類型與日期，計算並顯示費用小計
 * Calculate and display price subtotal based on zone + dates
 */
function updatePriceSummary() {
  if (!selectedZoneId) return;
  if (weekdayCount + holidayCount <= 0) return;

  // 找到選擇的 zone 資料 / Find selected zone data
  const zone = currentCamp.zones.find(z => z.zone_id === selectedZoneId);
  if (!zone) return;

  // 公式：(平日價 × 平日天數) + (假日價 × 假日天數)
  // Formula: (weekday_price × weekday_count) + (holiday_price × holiday_count)
  const subtotal = (zone.price_weekday * weekdayCount) + (zone.price_holiday * holidayCount);

  $('#zonePriceTotal').text(`NT$${subtotal.toLocaleString()}`);
  $('#priceSummary').show();

  // 啟用「下一步」按鈕 / Enable "next step" button
  $('#confirmBookingBtn').prop('disabled', false);
}

// ============================================================
// 儲存至 LocalStorage 並前往下一頁
// ============================================================

/**
 * 驗證選擇是否完整，將資料寫入 LocalStorage，然後跳轉至 camp-rental.html
 * Validate selections, write to LocalStorage, redirect to rental page
 */
function saveToLocalStorageAndNext() {

  // 驗證：日期是否已選 / Validate: dates selected?
  if (!checkInDate || !checkOutDate) {
    alert('請先選擇入住和退房日期。');
    return;
  }

  // 驗證：營位是否已選 / Validate: zone selected?
  if (!selectedZoneId) {
    alert('請選擇一種營位類型。');
    return;
  }

  const zone = currentCamp.zones.find(z => z.zone_id === selectedZoneId);
  if (!zone) return;

  // 計算費用 / Calculate cost
  const subtotal = (zone.price_weekday * weekdayCount) + (zone.price_holiday * holidayCount);
  const totalDays = weekdayCount + holidayCount;
  const guestCount = parseInt($('#guestNum').val()) || 2;

  // 建立 bookingCart 資料結構 / Build bookingCart data structure
  const bookingCart = {
    booking_info: {
      campground_id:    currentCamp.campground_id,
      campground_name:  currentCamp.name,
      region:           currentCamp.region,
      check_in:         formatDate(checkInDate),
      check_out:        formatDate(checkOutDate),
      total_days:       totalDays,
      weekday_count:    weekdayCount,
      holiday_count:    holidayCount,
      guest_count:      guestCount
    },
    selected_zones: [
      {
        zone_id:    zone.zone_id,
        zone_type:  zone.type,
        quantity:   1,
        subtotal:   subtotal
      }
    ],
    selected_rentals: [],  // 下一頁（camp-rental）填入 / Filled by next page
    summary: {
      zone_total:       subtotal,
      rental_total:     0,
      applied_discount: 0,
      final_amount:     subtotal
    }
  };

  // 寫入 LocalStorage / Write to LocalStorage
  localStorage.setItem('bookingCart', JSON.stringify(bookingCart));

  console.log('[camp-detail] 已寫入 LocalStorage bookingCart:', bookingCart);

  // 前往裝備租借頁 / Redirect to rental page
  window.location.href = './camp-rental.html';
}

// ============================================================
// 工具函式 / Utility Functions
// ============================================================

/**
 * 將 Date 物件格式化為 'YYYY-MM-DD' 字串
 * Format Date object to 'YYYY-MM-DD' string
 *
 * @param {Date} date - 要格式化的日期
 * @returns {string} 'YYYY-MM-DD'
 */
function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
