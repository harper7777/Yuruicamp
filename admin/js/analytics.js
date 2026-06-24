/**
 * admin/js/analytics.js
 * 分析報表模組 v2 — 裝備商城 / 預約・租借 雙 Tab 分析
 *
 * 架構說明：
 *   - 兩個 Tab 各自維護獨立的 shopState / bookingState 期間狀態
 *   - 四份 JSON（orders, products, bookings, reantal）只 fetch 一次，
 *     存入 window.analyticsXxxCache 供重複計算使用
 *   - 每次期間改變，呼叫 refreshShopSection() / refreshBookingSection()
 *     重新計算 KPI 並重繪 Chart.js 圖表
 *   - Chart.js 實例存於模組級變數，重繪前先 destroy() 避免 Canvas 衝突
 *
 * 由 core.js 在 AJAX 載入 partials/analytics.html 後呼叫 window.initAnalytics()
 */

// ─── Chart.js 實例（重繪前必須 destroy，否則舊 Canvas 報錯）────────
var _shopLineChart    = null; // 裝備商城：銷售額折線圖
var _shopDonutChart   = null; // 裝備商城：類別營收甜甜圈
var _bookLineChart    = null; // 預約/租借：收入折線圖
var _rentalDonut      = null; // 預約/租借：租借類別甜甜圈
var _campgroundBar    = null; // 預約/租借：各營地長條圖
var _regionBar        = null; // 預約/租借：各地區長條圖

// ─── 篩選狀態物件（兩個 Tab 各自獨立，不互相影響）──────────────
var shopState    = { days: 30, startDate: null, endDate: null };
var bookingState = { days: 30, startDate: null, endDate: null };

// ─── 品牌色系（圖表用）──────────────────────────────────────────
var ANALYTICS_COLORS = [
  '#244d4d', '#3d7d7d', '#779988', '#aabbaa', '#d0e4d0',
  '#4e91a0', '#7ab8c3', '#e07040', '#f0a080', '#6f42c1'
];

// ═══════════════════════════════════════════════════════════════
// 主入口：由 core.js 呼叫
// ═══════════════════════════════════════════════════════════════

window.initAnalytics = function () {
  // 1. 清除舊的 document 事件監聽（防止切換頁面後重複觸發）
  $(document).off('.analytics');

  // 2. 銷毀舊圖表實例（DOM 被替換後，舊 Chart 若殘留會出錯）
  destroyAllCharts();

  // 3. 兩個 Tab 預設都是近 30 天
  applyDayRange(shopState, 30);
  applyDayRange(bookingState, 30);

  // 4. 載入四份 JSON 資料後，再初始化 UI
  loadAllAnalyticsData(function () {
    initFlatpickr();
    setupPeriodFilter(
      'shopPeriodBtns', 'shopDateRangePicker',
      shopState, 'shopPeriodLabel',
      refreshShopSection
    );
    setupPeriodFilter(
      'bookingPeriodBtns', 'bookingDateRangePicker',
      bookingState, 'bookingPeriodLabel',
      refreshBookingSection
    );

    // 初次渲染兩個 Tab 的 KPI + 圖表
    refreshShopSection();
    refreshBookingSection();

    // Tab 切換後修正圖表寬度（Bootstrap Tab 切換完成才觸發 resize）
    setupTabResizeHandler();

    // KPI 卡片點擊：導航至對應管理頁面並預先套用篩選條件
    // Click a KPI card → set window.pendingNavFilter → trigger sidebar navigation
    setupKpiCardNavigation();
  });
};

// ═══════════════════════════════════════════════════════════════
// 資料載入（只 fetch 一次，之後從 window cache 讀）
// ═══════════════════════════════════════════════════════════════

/**
 * 並行載入五份 JSON（orders / products / min_stock / bookings / reantal），
 * 全部完成才呼叫 callback。
 * 任何一份失敗時，對應 cache 設為空陣列 / 空物件，不阻斷其他資料顯示。
 *
 * Loads 5 JSON files in parallel; invokes callback when all are done.
 * Any individual failure silently falls back to an empty array/object.
 */
function loadAllAnalyticsData(callback) {
  var loaded = 0;
  var total  = 5; // orders + products + min_stock + bookings + reantal

  // 每份完成時 +1，全部完成才 callback
  function onDone() {
    loaded++;
    if (loaded >= total) callback();
  }

  // orders.json
  if (window.analyticsOrdersCache && window.analyticsOrdersCache.length) {
    onDone();
  } else {
    $.getJSON('data/orders.json')
      .done(function (data) { window.analyticsOrdersCache = data; })
      .fail(function ()     { window.analyticsOrdersCache = []; })
      .always(onDone);
  }

  // products.json
  if (window.analyticsProductsCache && window.analyticsProductsCache.length) {
    onDone();
  } else {
    $.getJSON('data/products.json')
      .done(function (data) { window.analyticsProductsCache = data; })
      .fail(function ()     { window.analyticsProductsCache = []; })
      .always(onDone);
  }

  // min_stock.json：最低庫存設定，失敗時降級為空物件（全用預設值 5）
  // min_stock.json: min-stock thresholds; fall back to {} on failure (uses default 5)
  if (window.analyticsMinStockCache && typeof window.analyticsMinStockCache === 'object') {
    onDone();
  } else {
    $.getJSON('data/min_stock.json')
      .done(function (data) { window.analyticsMinStockCache = data; })
      .fail(function ()     { window.analyticsMinStockCache = {}; })
      .always(onDone);
  }

  // bookings.json
  if (window.analyticsBookingsCache && window.analyticsBookingsCache.length) {
    onDone();
  } else {
    $.getJSON('data/bookings.json')
      .done(function (data) { window.analyticsBookingsCache = data; })
      .fail(function ()     { window.analyticsBookingsCache = []; })
      .always(onDone);
  }

  // reantal.json（注意：檔名有拼字錯誤 reantal，保持與現有一致）
  if (window.analyticsRentalCache && window.analyticsRentalCache.length) {
    onDone();
  } else {
    $.getJSON('data/reantal.json')
      .done(function (data) { window.analyticsRentalCache = data; })
      .fail(function ()     { window.analyticsRentalCache = []; })
      .always(onDone);
  }
}

// ═══════════════════════════════════════════════════════════════
// 期間篩選器
// ═══════════════════════════════════════════════════════════════

/**
 * 依 days 設定 state 的 startDate / endDate
 * @param {Object} state - shopState 或 bookingState
 * @param {number} days  - 天數（例：7 / 30 / 90）
 */
function applyDayRange(state, days) {
  if (days === 'month') {
    // 本月：從本月 1 日到今天
    // new Date(year, month, 1) 的 month 是 0-indexed，getMonth() 回傳值剛好吻合
    var now   = new Date();
    var start = new Date(now.getFullYear(), now.getMonth(), 1);
    state.days      = 'month';
    state.startDate = start;
    state.endDate   = new Date(now);
    return;
  }
  var now   = new Date();
  var start = new Date(now);
  start.setDate(start.getDate() - (days - 1)); // 往前推 days-1 天，包含今天共 days 天
  state.days      = days;
  state.startDate = start;
  state.endDate   = new Date(now);
}

/**
 * 設定期間篩選器的按鈕點擊事件
 * @param {string}   btnGroupId  - 按鈕群組的 DOM id
 * @param {string}   pickerId    - flatpickr input 的 DOM id
 * @param {Object}   state       - 對應的篩選狀態物件
 * @param {string}   labelId     - 期間說明文字的 DOM id
 * @param {Function} refreshFn  - 狀態更新後要呼叫的刷新函式
 */
function setupPeriodFilter(btnGroupId, pickerId, state, labelId, refreshFn) {
  $(document).on('click.analytics', '#' + btnGroupId + ' button[data-days]', function () {
    var days = $(this).data('days');

    // 更新 active 樣式
    $('#' + btnGroupId + ' button').removeClass('active');
    $(this).addClass('active');

    if (days === 'custom') {
      // 顯示 flatpickr 日期選擇器 input
      $('#' + pickerId).show().trigger('click');
    } else if (days === 'month') {
      // 本月按鈕：必須在 parseInt 之前處理，因為 parseInt('month', 10) === NaN
      // 分析報表頁不做 toggle off，點了就鎖定（與其他快速選鈕一致）
      $('#' + pickerId).hide();
      applyDayRange(state, 'month');
      updatePeriodLabel(labelId, state);
      refreshFn();
    } else {
      $('#' + pickerId).hide();
      applyDayRange(state, parseInt(days, 10));
      updatePeriodLabel(labelId, state);
      refreshFn();
    }
  });

  // 初始顯示期間文字
  updatePeriodLabel(labelId, state);
}

/**
 * 更新期間說明文字（例：2026/05/22 ～ 2026/06/21）
 */
function updatePeriodLabel(labelId, state) {
  if (!state.startDate || !state.endDate) return;
  var fmt = function (d) {
    return d.getFullYear() + '/' +
      String(d.getMonth() + 1).padStart(2, '0') + '/' +
      String(d.getDate()).padStart(2, '0');
  };
  $('#' + labelId).text(fmt(state.startDate) + ' ～ ' + fmt(state.endDate));
}

/**
 * 初始化兩個 flatpickr 日期範圍選擇器
 * 需要在 DOM 和 flatpickr CDN 都載入後才呼叫
 */
function initFlatpickr() {
  if (typeof flatpickr === 'undefined') return; // flatpickr CDN 未載入時跳過

  // 取繁體中文語系（CDN 載入 zh-tw.js 後會設定 flatpickr.l10ns.zh_tw）
  var locale = (flatpickr.l10ns && flatpickr.l10ns.zh_tw)
    ? flatpickr.l10ns.zh_tw
    : 'default';

  // 裝備商城篩選器
  flatpickr('#shopDateRangePicker', {
    mode: 'range',
    dateFormat: 'Y-m-d',
    locale: locale,
    onClose: function (selectedDates) {
      // 兩個日期都選完才觸發更新
      if (selectedDates.length === 2) {
        shopState.startDate = selectedDates[0];
        shopState.endDate   = selectedDates[1];
        shopState.days      = 'custom';
        updatePeriodLabel('shopPeriodLabel', shopState);
        refreshShopSection();
      }
    }
  });

  // 預約/租借篩選器
  flatpickr('#bookingDateRangePicker', {
    mode: 'range',
    dateFormat: 'Y-m-d',
    locale: locale,
    onClose: function (selectedDates) {
      if (selectedDates.length === 2) {
        bookingState.startDate = selectedDates[0];
        bookingState.endDate   = selectedDates[1];
        bookingState.days      = 'custom';
        updatePeriodLabel('bookingPeriodLabel', bookingState);
        refreshBookingSection();
      }
    }
  });

  // 更新初始文字（flatpickr 初始化後才確保 state 有值）
  updatePeriodLabel('shopPeriodLabel', shopState);
  updatePeriodLabel('bookingPeriodLabel', bookingState);
}

// ═══════════════════════════════════════════════════════════════
// 工具函式：日期計算
// ═══════════════════════════════════════════════════════════════

/**
 * 判斷 dateStr 是否在 [startDate, endDate] 範圍內（含首尾）
 * @param {string} dateStr   - "2026-05-27 15:44:18" 或 "2026-05-27" 皆可
 * @param {Date}   startDate
 * @param {Date}   endDate
 * @returns {boolean}
 */
function isInRange(dateStr, startDate, endDate) {
  if (!dateStr) return false;
  // 只取前 10 碼 YYYY-MM-DD 做比較
  var d = dateStr.slice(0, 10);
  var s = startDate.toISOString().slice(0, 10);
  var e = endDate.toISOString().slice(0, 10);
  return d >= s && d <= e;
}

/**
 * 產生 startDate ~ endDate 之間的所有日期字串陣列
 * @returns {string[]} ["2026-05-22", "2026-05-23", ...]
 */
function generateDateRange(startDate, endDate) {
  var dates = [];
  var cur   = new Date(startDate.toISOString().slice(0, 10));
  var end   = new Date(endDate.toISOString().slice(0, 10));
  while (cur <= end) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

/**
 * 將 "YYYY-MM-DD" 轉為圖表 X 軸顯示用的 "MM/DD"
 */
function fmtLabel(dateStr) {
  return dateStr.slice(5, 7) + '/' + dateStr.slice(8, 10);
}

/**
 * 顯示圖表空狀態
 * @param {string} emptyId  - 空狀態提示 div 的 id
 * @param {string} targetId - 要隱藏的元素 id（canvas 或 canvas wrapper div）
 */
function showChartEmpty(emptyId, targetId) {
  $('#' + emptyId).removeClass('d-none');
  $('#' + targetId).hide();
}

/**
 * 隱藏空狀態提示（恢復顯示圖表）
 * @param {string} emptyId  - 空狀態提示 div 的 id
 * @param {string} targetId - 要顯示的元素 id（canvas 或 canvas wrapper div）
 */
function hideChartEmpty(emptyId, targetId) {
  $('#' + emptyId).addClass('d-none');
  $('#' + targetId).show();
}

// ═══════════════════════════════════════════════════════════════
// ═══ 裝備商城 Tab ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════

/** 期間改變時，重新渲染商城所有 KPI 與圖表 */
function refreshShopSection() {
  renderShopKpis();
  renderShopLineChart();
  renderShopDonut();
}

/**
 * 計算並填入商城 6 張 KPI 卡片數值
 * 卡片 3（待出貨）、卡片 6（低庫存）不受期間篩選影響
 */
function renderShopKpis() {
  var orders   = window.analyticsOrdersCache   || [];
  var products = window.analyticsProductsCache || [];
  var s = shopState.startDate;
  var e = shopState.endDate;

  // 期間內訂單（依 createdAt 篩選）
  var periodOrders = orders.filter(function (o) {
    return isInRange(o.createdAt, s, e);
  });

  // ── 卡片 1：本期訂單數（含各狀態）──
  // 注意：銷售額已移至折線圖標題，由 updateShopLineTotal() 負責更新
  var orderCount = periodOrders.length;
  $('#shopKpiOrders').text(orderCount);
  $('#shopKpiOrdersNote').text('含各狀態訂單');

  // ── 卡片 3：待出貨（不受期間限制，永遠顯示全部 unshipped）──
  var pendingCount = orders.filter(function (o) {
    return o.orderStatus === 'unshipped';
  }).length;
  $('#shopKpiPending').text(pendingCount);

  // ── 卡片 4：退貨/退款（期間內 returned 訂單）──
  var refundCount = periodOrders.filter(function (o) {
    return o.orderStatus === 'returned';
  }).length;
  var refundRate = orderCount > 0
    ? Math.round(refundCount / orderCount * 100) : 0;
  $('#shopKpiRefund').text(refundCount);
  $('#shopKpiRefundNote').text('退款率 ' + refundRate + '%');

  // ── 卡片 5：已售商品件數（已出貨訂單的 items.qty 加總）──
  var soldQty = periodOrders
    .filter(function (o) { return o.orderStatus === 'shipped'; })
    .reduce(function (sum, o) {
      return sum + (o.items || []).reduce(function (s2, item) {
        return s2 + (item.qty || 0);
      }, 0);
    }, 0);
  $('#shopKpiSoldQty').text(soldQty);

  // ── 卡片 6：低庫存商品（不受期間限制，任一分店庫存 < 最低閾值即計入）──
  // Low-stock products: any branch below its minimum threshold counts, regardless of date filter
  var lowStock = products.filter(function (p) {
    return isAnalyticsProductLowStock(p);
  }).length;
  $('#shopKpiLowStock').text(lowStock);
}

/**
 * 繪製商城銷售額折線圖（真實資料，依期間計算每日/每週銷售額）
 * 超過 60 天時改為週分組，避免 X 軸過密
 */
function renderShopLineChart() {
  var orders = window.analyticsOrdersCache || [];
  var s = shopState.startDate;
  var e = shopState.endDate;
  var dateRange = generateDateRange(s, e);
  var labels, data;

  if (dateRange.length > 60) {
    // 超過 60 天 → 按週分組
    var grouped = groupByWeek(
      orders, dateRange,
      function (o, d) {
        return o.orderStatus === 'shipped' && (o.createdAt || '').slice(0, 10) === d;
      },
      function (o) { return o.total || 0; }
    );
    labels = grouped.labels;
    data   = grouped.data;
  } else {
    // 60 天以內 → 按日
    labels = dateRange.map(fmtLabel);
    data   = dateRange.map(function (d) {
      return orders
        .filter(function (o) {
          return o.orderStatus === 'shipped' && (o.createdAt || '').slice(0, 10) === d;
        })
        .reduce(function (sum, o) { return sum + (o.total || 0); }, 0);
    });
  }

  var hasData = data.some(function (v) { return v > 0; });
  if (!hasData) {
    showChartEmpty('shopLineChartEmpty', 'shopSalesLineChart');
    if (_shopLineChart) { _shopLineChart.destroy(); _shopLineChart = null; }
    updateShopLineTotal(); // 無資料時仍更新合計（顯示 NT$ 0）
    return;
  }
  hideChartEmpty('shopLineChartEmpty', 'shopSalesLineChart');
  if (_shopLineChart) { _shopLineChart.destroy(); }

  _shopLineChart = new Chart(document.getElementById('shopSalesLineChart'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '銷售額 (NT$)',
        data: data,
        borderColor: '#244d4d',
        backgroundColor: 'rgba(36,77,77,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#244d4d',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return 'NT$ ' + ctx.parsed.y.toLocaleString();
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (val) {
              return val >= 1000
                ? 'NT$ ' + (val / 1000).toFixed(0) + 'K'
                : 'NT$ ' + val;
            }
          },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 12 }
        }
      }
    }
  });

  updateShopLineTotal(); // 有資料時更新合計 badge
}

/**
 * 計算商城期間銷售總額並更新折線圖標題右側的合計 badge
 * 計算邏輯：已出貨（shipped）且在篩選期間內的訂單 total 加總
 * 觸發時機：renderShopLineChart() 的有資料和無資料兩個分支皆會呼叫
 */
function updateShopLineTotal() {
  var orders = window.analyticsOrdersCache || [];
  var s = shopState.startDate;
  var e = shopState.endDate;

  var total = orders
    .filter(function (o) {
      return o.orderStatus === 'shipped' && isInRange(o.createdAt, s, e);
    })
    .reduce(function (sum, o) { return sum + (o.total || 0); }, 0);

  // 更新 DOM，格式例：NT$ 16,800
  $('#shopLineTotalBadge').text('NT$ ' + total.toLocaleString());
}

/**
 * 繪製商城商品類別營收甜甜圈（真實資料）
 * 用商品名稱比對 products.json 取得 category，再加總金額
 */
function renderShopDonut() {
  var orders   = window.analyticsOrdersCache   || [];
  var products = window.analyticsProductsCache || [];
  var s = shopState.startDate;
  var e = shopState.endDate;

  // 建立「商品名稱 → 類別」的 Map
  var nameToCategory = {};
  products.forEach(function (p) {
    if (p.name && p.category) nameToCategory[p.name] = p.category;
  });

  // 期間內已出貨訂單的 items，按類別加總金額
  var categoryRevenue = {};
  orders
    .filter(function (o) {
      return o.orderStatus === 'shipped' && isInRange(o.createdAt, s, e);
    })
    .forEach(function (o) {
      (o.items || []).forEach(function (item) {
        // 若商品名稱在 products 找不到對應，歸入「其他」
        var cat = nameToCategory[item.name] || '其他';
        var amt = (item.qty || 0) * (item.price || 0);
        categoryRevenue[cat] = (categoryRevenue[cat] || 0) + amt;
      });
    });

  var catLabels = Object.keys(categoryRevenue);
  var catData   = catLabels.map(function (c) { return categoryRevenue[c]; });

  if (catLabels.length === 0) {
    showChartEmpty('shopDonutEmpty', 'shopCategoryDonutChart');
    if (_shopDonutChart) { _shopDonutChart.destroy(); _shopDonutChart = null; }
    return;
  }
  hideChartEmpty('shopDonutEmpty', 'shopCategoryDonutChart');
  if (_shopDonutChart) { _shopDonutChart.destroy(); }

  _shopDonutChart = new Chart(document.getElementById('shopCategoryDonutChart'), {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{
        data: catData,
        backgroundColor: ANALYTICS_COLORS.slice(0, catLabels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, padding: 14, font: { size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              var total = ctx.dataset.data.reduce(function (a, b) { return a + b; }, 0);
              var pct   = total > 0 ? Math.round(ctx.parsed / total * 100) : 0;
              return ' ' + ctx.label + ': NT$ ' +
                ctx.parsed.toLocaleString() + ' (' + pct + '%)';
            }
          }
        }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// ═══ 預約/租借 Tab ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════

/** 期間改變時，重新渲染預約/租借所有 KPI 與圖表 */
function refreshBookingSection() {
  renderBookingKpis();
  renderBookingLineChart();
  renderRentalDonut();
  renderCampgroundBar();
  renderRegionBar();
}

/**
 * 計算並填入預約/租借 6 張 KPI 卡片數值
 * 卡片 2（待確認）不受期間篩選影響
 */
function renderBookingKpis() {
  var bookings = window.analyticsBookingsCache || [];
  var s = bookingState.startDate;
  var e = bookingState.endDate;

  // 期間內預約（依 submitted_at 篩選）
  var periodBookings = bookings.filter(function (b) {
    return isInRange(b.submitted_at, s, e);
  });

  // 預約收入總額（供卡片 6「租借費佔比」計算使用）
  // 注意：此值不再顯示在 KPI 卡片，改由 updateBookingLineTotal() 更新折線圖標題
  var revenue = periodBookings
    .filter(function (b) { return b.payment_status === 'paid'; })
    .reduce(function (sum, b) {
      return sum + ((b.summary && b.summary.final_amount) || 0);
    }, 0);

  // ── 卡片 1：待確認預約（不受期間限制，永遠顯示全部 pending）──
  var pendingCount = bookings.filter(function (b) {
    return b.status === 'pending';
  }).length;
  $('#bookKpiPending').text(pendingCount);

  // ── 卡片 3：取消率（期間內 cancelled / 總筆數）──
  var totalCount    = periodBookings.length;
  var cancelledCount = periodBookings.filter(function (b) {
    return b.status === 'cancelled';
  }).length;
  var cancelRate = totalCount > 0
    ? Math.round(cancelledCount / totalCount * 100) : 0;
  $('#bookKpiCancelRate').text(cancelRate + '%');
  $('#bookKpiCancelNote').text(cancelledCount + ' 筆取消 / ' + totalCount + ' 筆總計');

  // ── 卡片 4：已完成預約（期間內 completed）──
  var completedCount = periodBookings.filter(function (b) {
    return b.status === 'completed';
  }).length;
  $('#bookKpiCompleted').text(completedCount);

  // ── 卡片 5：裝備租借費（已付款預約的 rental_total 加總）──
  var rentalAmt = periodBookings
    .filter(function (b) { return b.payment_status === 'paid'; })
    .reduce(function (sum, b) {
      return sum + ((b.summary && b.summary.rental_total) || 0);
    }, 0);
  $('#bookKpiRentalAmt').text('NT$ ' + rentalAmt.toLocaleString());

  // ── 卡片 6：租借費佔比（rental_total / final_amount × 100%）──
  var rentalRatio = revenue > 0
    ? Math.round(rentalAmt / revenue * 100) : 0;
  $('#bookKpiRentalRatio').text(rentalRatio + '%');
}

/**
 * 繪製預約收入折線圖（依 submitted_at 日期分組統計 final_amount）
 */
function renderBookingLineChart() {
  var bookings  = window.analyticsBookingsCache || [];
  var s = bookingState.startDate;
  var e = bookingState.endDate;
  var dateRange = generateDateRange(s, e);
  var labels, data;

  if (dateRange.length > 60) {
    var grouped = groupByWeek(
      bookings, dateRange,
      function (b, d) {
        return b.payment_status === 'paid' && (b.submitted_at || '').slice(0, 10) === d;
      },
      function (b) { return (b.summary && b.summary.final_amount) || 0; }
    );
    labels = grouped.labels;
    data   = grouped.data;
  } else {
    labels = dateRange.map(fmtLabel);
    data   = dateRange.map(function (d) {
      return bookings
        .filter(function (b) {
          return b.payment_status === 'paid' &&
                 (b.submitted_at || '').slice(0, 10) === d;
        })
        .reduce(function (sum, b) {
          return sum + ((b.summary && b.summary.final_amount) || 0);
        }, 0);
    });
  }

  var hasData = data.some(function (v) { return v > 0; });
  if (!hasData) {
    showChartEmpty('bookLineChartEmpty', 'bookingRevenueLineChart');
    if (_bookLineChart) { _bookLineChart.destroy(); _bookLineChart = null; }
    updateBookingLineTotal(); // 無資料時仍更新合計（顯示 NT$ 0）
    return;
  }
  hideChartEmpty('bookLineChartEmpty', 'bookingRevenueLineChart');
  if (_bookLineChart) { _bookLineChart.destroy(); }

  _bookLineChart = new Chart(document.getElementById('bookingRevenueLineChart'), {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: '預約收入 (NT$)',
        data: data,
        borderColor: '#3d7d7d',
        backgroundColor: 'rgba(61,125,125,0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#3d7d7d',
        pointRadius: 4,
        pointHoverRadius: 6,
        tension: 0.4,
        fill: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return 'NT$ ' + ctx.parsed.y.toLocaleString();
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (val) {
              return val >= 1000
                ? 'NT$ ' + (val / 1000).toFixed(0) + 'K'
                : 'NT$ ' + val;
            }
          },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: {
          grid: { display: false },
          ticks: { maxTicksLimit: 12 }
        }
      }
    }
  });

  updateBookingLineTotal(); // 有資料時更新合計 badge
}

/**
 * 計算預約期間收入總額並更新折線圖標題右側的合計 badge
 * 計算邏輯：已付款（paid）且在篩選期間內的預約 final_amount 加總
 * 觸發時機：renderBookingLineChart() 的有資料和無資料兩個分支皆會呼叫
 */
function updateBookingLineTotal() {
  var bookings = window.analyticsBookingsCache || [];
  var s = bookingState.startDate;
  var e = bookingState.endDate;

  var total = bookings
    .filter(function (b) {
      return b.payment_status === 'paid' && isInRange(b.submitted_at, s, e);
    })
    .reduce(function (sum, b) {
      return sum + ((b.summary && b.summary.final_amount) || 0);
    }, 0);

  // 更新 DOM，格式例：NT$ 9,600
  $('#bookingLineTotalBadge').text('NT$ ' + total.toLocaleString());
}

/**
 * 繪製租借裝備類別甜甜圈
 * 用 selected_rentals[].name 對照 reantal.json 取得 category，統計使用次數
 */
function renderRentalDonut() {
  var bookings = window.analyticsBookingsCache || [];
  var rentals  = window.analyticsRentalCache   || [];
  var s = bookingState.startDate;
  var e = bookingState.endDate;

  // 建立「裝備名稱 → 類別」的 Map（來自 reantal.json）
  var nameToCategory = {};
  rentals.forEach(function (r) {
    if (r.name && r.category) nameToCategory[r.name] = r.category;
  });

  // 期間內已付款預約的 selected_rentals，按類別加總 quantity
  var categoryCount = {};
  bookings
    .filter(function (b) {
      return b.payment_status === 'paid' && isInRange(b.submitted_at, s, e);
    })
    .forEach(function (b) {
      (b.selected_rentals || []).forEach(function (item) {
        var cat = nameToCategory[item.name] || '其他';
        categoryCount[cat] = (categoryCount[cat] || 0) + (item.quantity || 1);
      });
    });

  var catLabels = Object.keys(categoryCount);
  var catData   = catLabels.map(function (c) { return categoryCount[c]; });

  if (catLabels.length === 0) {
    showChartEmpty('rentalDonutEmpty', 'rentalCategoryDonutChart');
    if (_rentalDonut) { _rentalDonut.destroy(); _rentalDonut = null; }
    return;
  }
  hideChartEmpty('rentalDonutEmpty', 'rentalCategoryDonutChart');
  if (_rentalDonut) { _rentalDonut.destroy(); }

  _rentalDonut = new Chart(document.getElementById('rentalCategoryDonutChart'), {
    type: 'doughnut',
    data: {
      labels: catLabels,
      datasets: [{
        data: catData,
        backgroundColor: ANALYTICS_COLORS.slice(0, catLabels.length),
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8
      }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, padding: 14, font: { size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ' ' + ctx.label + ': ' + ctx.parsed + ' 件';
            }
          }
        }
      }
    }
  });
}

/**
 * 繪製各營地預約筆數水平長條圖
 */
function renderCampgroundBar() {
  var bookings = window.analyticsBookingsCache || [];
  var s = bookingState.startDate;
  var e = bookingState.endDate;

  // 依營地名稱分組計數
  var campCount = {};
  bookings
    .filter(function (b) { return isInRange(b.submitted_at, s, e); })
    .forEach(function (b) {
      var name = b.booking_info && b.booking_info.campground_name;
      if (name) campCount[name] = (campCount[name] || 0) + 1;
    });

  var labels = Object.keys(campCount);
  var data   = labels.map(function (k) { return campCount[k]; });

  if (labels.length === 0) {
    showChartEmpty('campgroundBarEmpty', 'campgroundBarCanvasWrap');
    if (_campgroundBar) { _campgroundBar.destroy(); _campgroundBar = null; }
    return;
  }
  hideChartEmpty('campgroundBarEmpty', 'campgroundBarCanvasWrap');
  if (_campgroundBar) { _campgroundBar.destroy(); }

  _campgroundBar = new Chart(document.getElementById('campgroundBookingBarChart'), {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: '預約筆數',
        data: data,
        backgroundColor: 'rgba(36,77,77,0.75)',
        borderColor: '#244d4d',
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      indexAxis: 'y', // 水平長條圖
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) { return ' ' + ctx.parsed.x + ' 筆預約'; }
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1 },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        y: { grid: { display: false } }
      }
    }
  });
}

/**
 * 繪製各地區預約收入垂直長條圖（北/中/南/東 固定順序）
 */
function renderRegionBar() {
  var bookings = window.analyticsBookingsCache || [];
  var s = bookingState.startDate;
  var e = bookingState.endDate;

  // 固定地區順序，確保圖表穩定
  var regionOrder = ['北部', '中部', '南部', '東部'];
  var regionRevenue = {};
  regionOrder.forEach(function (r) { regionRevenue[r] = 0; });

  bookings
    .filter(function (b) {
      return b.payment_status === 'paid' && isInRange(b.submitted_at, s, e);
    })
    .forEach(function (b) {
      var region = b.booking_info && b.booking_info.region;
      if (region) {
        regionRevenue[region] = (regionRevenue[region] || 0) +
          ((b.summary && b.summary.final_amount) || 0);
      }
    });

  var data = regionOrder.map(function (r) { return regionRevenue[r]; });
  var hasData = data.some(function (v) { return v > 0; });

  if (!hasData) {
    showChartEmpty('regionBarEmpty', 'regionBarCanvasWrap');
    if (_regionBar) { _regionBar.destroy(); _regionBar = null; }
    return;
  }
  hideChartEmpty('regionBarEmpty', 'regionBarCanvasWrap');
  if (_regionBar) { _regionBar.destroy(); }

  _regionBar = new Chart(document.getElementById('regionRevenueBarChart'), {
    type: 'bar',
    data: {
      labels: regionOrder,
      datasets: [{
        label: '預約收入 (NT$)',
        data: data,
        backgroundColor: ['#244d4d', '#3d7d7d', '#779988', '#aabbaa'],
        borderWidth: 0,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ' NT$ ' + ctx.parsed.y.toLocaleString();
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            callback: function (val) {
              return val >= 1000
                ? 'NT$ ' + (val / 1000).toFixed(0) + 'K'
                : 'NT$ ' + val;
            }
          },
          grid: { color: 'rgba(0,0,0,0.05)' }
        },
        x: { grid: { display: false } }
      }
    }
  });
}

// ═══════════════════════════════════════════════════════════════
// Tab 切換後圖表 resize
// ═══════════════════════════════════════════════════════════════

/**
 * Bootstrap Tab 切換完成後，調整對應 Tab 內所有圖表的寬度
 * 原因：被隱藏的 Tab 內 Canvas 寬度為 0，顯示後需要 resize 才正確
 */
function setupTabResizeHandler() {
  var shopTabEl    = document.getElementById('shopTab');
  var bookingTabEl = document.getElementById('bookingTab');

  if (shopTabEl) {
    shopTabEl.addEventListener('shown.bs.tab', function () {
      if (_shopLineChart)  _shopLineChart.resize();
      if (_shopDonutChart) _shopDonutChart.resize();
    });
  }

  if (bookingTabEl) {
    bookingTabEl.addEventListener('shown.bs.tab', function () {
      if (_bookLineChart)  _bookLineChart.resize();
      if (_rentalDonut)    _rentalDonut.resize();
      if (_campgroundBar)  _campgroundBar.resize();
      if (_regionBar)      _regionBar.resize();
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// 工具函式：週分組（超過 60 天時使用）
// ═══════════════════════════════════════════════════════════════

/**
 * 將資料按週分組加總
 * @param {Array}    items       - orders 或 bookings 陣列
 * @param {string[]} dateRange   - 完整日期陣列（由 generateDateRange 產生）
 * @param {Function} filterFn   - (item, dateStr) => boolean，判斷該 item 是否屬於該日
 * @param {Function} valueFn    - (item) => number，取得計算值
 * @returns {{ labels: string[], data: number[] }}
 */
function groupByWeek(items, dateRange, filterFn, valueFn) {
  var weekLabels = [];
  var weekData   = [];
  var i = 0;

  while (i < dateRange.length) {
    var weekDates = dateRange.slice(i, i + 7);
    var weekStart = weekDates[0];
    var weekEnd   = weekDates[weekDates.length - 1];

    weekLabels.push(fmtLabel(weekStart) + '~' + fmtLabel(weekEnd));

    var weekTotal = items
      .filter(function (item) {
        return weekDates.some(function (d) { return filterFn(item, d); });
      })
      .reduce(function (sum, item) { return sum + valueFn(item); }, 0);

    weekData.push(weekTotal);
    i += 7;
  }

  return { labels: weekLabels, data: weekData };
}

// ═══════════════════════════════════════════════════════════════
// 銷毀所有圖表實例（切換頁面或重新初始化時呼叫）
// ═══════════════════════════════════════════════════════════════

function destroyAllCharts() {
  [_shopLineChart, _shopDonutChart, _bookLineChart,
   _rentalDonut, _campgroundBar, _regionBar]
    .forEach(function (c) { if (c) c.destroy(); });

  _shopLineChart  = null;
  _shopDonutChart = null;
  _bookLineChart  = null;
  _rentalDonut    = null;
  _campgroundBar  = null;
  _regionBar      = null;
}

// ═══════════════════════════════════════════════════════════════
// 低庫存判斷（使用 min_stock.json 的閾值，避免硬編碼 < 5）
// Low-stock detection using per-product thresholds from min_stock.json
// ═══════════════════════════════════════════════════════════════

/** 分店 ID 清單（與 products.js 保持一致）— 不引入跨模組耦合 */
var ANALYTICS_BRANCH_IDS      = ['main', 'branch-001', 'branch-002', 'branch-003'];
var ANALYTICS_MIN_STOCK_DEFAULT = 5; // 找不到設定時的預設最低庫存

/**
 * 取得 analytics 模組內的最低庫存閾值。
 * 從 window.analyticsMinStockCache 讀取，找不到時回傳預設值 5。
 *
 * @param {string} productId  - 商品 ID（例如 'P001'）
 * @param {string} locationId - 分店 / 營地 ID（例如 'branch-001'）
 * @returns {number}
 */
function getAnalyticsMinStockValue(productId, locationId) {
  var cache       = (window.analyticsMinStockCache && window.analyticsMinStockCache['store']) || {};
  var productData = cache[productId] || {};
  var val         = productData[locationId];

  if (val !== undefined) {
    var parsed = parseInt(val, 10);
    return isNaN(parsed) ? ANALYTICS_MIN_STOCK_DEFAULT : Math.max(parsed, 0);
  }

  return ANALYTICS_MIN_STOCK_DEFAULT;
}

/**
 * 判斷商店商品是否低庫存（雙層判斷，與 products.js 邏輯一致）：
 * ① 任一分店實際庫存 < 該分店最低值
 * ② 總庫存 < 所有分店最低值加總
 *
 * Returns true if the store product is considered low-stock.
 * Mirrors isStoreProductLowStock() in products.js to avoid cross-module coupling.
 *
 * @param {Object} product - products.json 中的單一商品物件
 * @returns {boolean}
 */
function isAnalyticsProductLowStock(product) {
  if (!product) { return false; }

  var branch = product.branch || {};

  // 判斷①：任一分店庫存 < 最低值
  var anyBranchLow = ANALYTICS_BRANCH_IDS.some(function (branchId) {
    var actual  = parseInt(branch[branchId], 10);
    actual      = isNaN(actual) ? 0 : Math.max(actual, 0);
    var minimum = getAnalyticsMinStockValue(product.id, branchId);
    return actual < minimum;
  });

  if (anyBranchLow) { return true; }

  // 判斷②：總庫存 < 所有分店最低值加總
  var totalMinimum = ANALYTICS_BRANCH_IDS.reduce(function (sum, branchId) {
    return sum + getAnalyticsMinStockValue(product.id, branchId);
  }, 0);

  return getAnalyticsProductTotalStock(product) < totalMinimum;
}

// ═══════════════════════════════════════════════════════════════
// 保留原有工具函式：計算商品總庫存（相容多種 JSON 結構）
// ═══════════════════════════════════════════════════════════════

/**
 * 計算商品的總庫存數量
 * 相容三種可能的 JSON 結構：
 *   1. product["total-stock"]（數字欄位）
 *   2. product.branch（物件，各分店庫存加總）
 *   3. product.stock（簡易庫存欄位）
 * @param {Object} product - products.json 中的單一商品物件
 * @returns {number}
 */
function getAnalyticsProductTotalStock(product) {
  var totalStock = parseInt(product && product['total-stock'], 10);
  if (!isNaN(totalStock)) return totalStock;

  if (product && product.branch && typeof product.branch === 'object') {
    return Object.keys(product.branch).reduce(function (sum, branchId) {
      var qty = parseInt(product.branch[branchId], 10);
      return sum + (isNaN(qty) ? 0 : qty);
    }, 0);
  }

  var stock = parseInt(product && product.stock, 10);
  return isNaN(stock) ? 0 : stock;
}

// ═══════════════════════════════════════════════════════════════
// KPI 卡片導航
// ═══════════════════════════════════════════════════════════════

/**
 * 設定 KPI 卡片的點擊導航事件
 * 點擊任一 .kpi-clickable 卡片後，依 data-kpi-id 組成 window.pendingNavFilter，
 * 再觸發對應的 sidebar 連結切換頁面。
 * 目標模組的 init 函式會讀取並消費 pendingNavFilter。
 */
function setupKpiCardNavigation() {
  // 使用 .analytics 命名空間，防止重複綁定（切換回此頁再次 initAnalytics 時）
  $(document).on('click.analytics', '.kpi-clickable', function () {
    var kpiId = $(this).data('kpi-id');
    var filter = buildNavFilter(kpiId);
    if (!filter) return;                  // 不在對照表內則忽略

    window.pendingNavFilter = filter;

    // 觸發 sidebar 連結（core.js 的導航邏輯），與手動點選完全相同
    $('.sidebar-link[data-section="' + filter.section + '"]').first().trigger('click');
  });
}

/**
 * 將日期物件格式化為 "YYYY-MM-DD" 字串
 * @param {Date} d
 * @returns {string}
 */
function fmtDateISO(d) {
  if (!d) return null;
  return d.getFullYear() + '-' +
    String(d.getMonth() + 1).padStart(2, '0') + '-' +
    String(d.getDate()).padStart(2, '0');
}

/**
 * 依 kpiId 組成 window.pendingNavFilter 物件
 * 「當前期間」從 shopState / bookingState 讀取，轉為 YYYY-MM-DD 字串
 *
 * @param {string} kpiId - analytics.html 各卡片的 data-kpi-id 值
 * @returns {Object|null} - pendingNavFilter 物件，或 null（找不到對照時）
 */
function buildNavFilter(kpiId) {
  // 取得兩個 Tab 的當前期間日期字串
  var shopStart  = fmtDateISO(shopState.startDate);
  var shopEnd    = fmtDateISO(shopState.endDate);
  var bookStart  = fmtDateISO(bookingState.startDate);
  var bookEnd    = fmtDateISO(bookingState.endDate);

  // KPI ID → 篩選條件對照表
  var map = {
    // ── 裝備商城 ──────────────────────────────────────────────
    // 本期訂單數：當前期間所有狀態訂單
    shopKpiOrders: {
      section: 'orders',
      orderStatus: [], paymentStatus: [],
      dateStart: shopStart, dateEnd: shopEnd
    },
    // 待出貨訂單：全部未出貨，不帶日期
    shopKpiPending: {
      section: 'orders',
      orderStatus: ['unshipped'], paymentStatus: [],
      dateStart: null, dateEnd: null
    },
    // 退貨/退款：當前期間 returned 訂單
    shopKpiRefund: {
      section: 'orders',
      orderStatus: ['returned'], paymentStatus: [],
      dateStart: shopStart, dateEnd: shopEnd
    },
    // 已售商品件數：當前期間 shipped 訂單
    shopKpiSoldQty: {
      section: 'orders',
      orderStatus: ['shipped'], paymentStatus: [],
      dateStart: shopStart, dateEnd: shopEnd
    },
    // 低庫存商品：跳商品頁，顯示低庫存提示
    shopKpiLowStock: {
      section: 'products',
      lowStockOnly: true
    },

    // ── 預約 / 租借 ───────────────────────────────────────────
    // 待確認預約：全部 pending，不帶日期
    bookKpiPending: {
      section: 'bookings',
      bookingStatus: 'pending', paymentStatus: '',
      dateStart: null, dateEnd: null
    },
    // 取消率：當前期間 cancelled
    bookKpiCancelRate: {
      section: 'bookings',
      bookingStatus: 'cancelled', paymentStatus: '',
      dateStart: bookStart, dateEnd: bookEnd
    },
    // 已完成預約：當前期間 completed
    bookKpiCompleted: {
      section: 'bookings',
      bookingStatus: 'completed', paymentStatus: '',
      dateStart: bookStart, dateEnd: bookEnd
    },
    // 裝備租借費：當前期間已付款
    bookKpiRentalAmt: {
      section: 'bookings',
      bookingStatus: '', paymentStatus: 'paid',
      dateStart: bookStart, dateEnd: bookEnd
    },
    // 租借費佔比：同上（% 無獨立頁，顯示已付款清單）
    bookKpiRentalRatio: {
      section: 'bookings',
      bookingStatus: '', paymentStatus: 'paid',
      dateStart: bookStart, dateEnd: bookEnd
    }
  };

  return map[kpiId] || null;
}
