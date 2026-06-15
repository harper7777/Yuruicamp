/**
 * admin/js/analytics.js
 * 分析報表模組，計算 KPI 統計卡片數值並初始化 Chart.js 圖表
 * 由 core.js 在 AJAX 載入 partials/analytics.html 後呼叫
 */

window.initAnalytics = function () {

  // === 1. KPI 動態計算：從 orders.json + products.json 讀取數據 ===
  $.getJSON('data/orders.json', function (orders) {
    var today = new Date().toISOString().slice(0, 10);

    // 今日已出貨訂單的總營業額（orderStatus === 'shipped'）
    var todayRevenue = orders
      .filter(function (o) {
        return o.orderStatus === 'shipped' && o.createdAt.startsWith(today);
      })
      .reduce(function (sum, o) { return sum + o.total; }, 0);

    // 所有未出貨的訂單數量（orderStatus === 'unshipped'）
    var pendingShip = orders.filter(function (o) {
      return o.orderStatus === 'unshipped';
    }).length;

    if (todayRevenue > 0) {
      $('#kpiRevenue').text('NT$ ' + todayRevenue.toLocaleString());
      $('#kpiRevenueNote').text('今日已完成訂單加總');
    } else {
      $('#kpiRevenue').text('NT$ 0');
      $('#kpiRevenueNote').text('今日尚無完成訂單');
    }
    $('#kpiPending').text(pendingShip);
  }).fail(function () {
    $('#kpiRevenue').text('讀取失敗').addClass('text-danger');
    $('#kpiPending').text('—');
  });

  // === 2. KPI：低庫存商品數（stock < 5）從 products.json 讀取 ===
  $.getJSON('data/products.json', function (products) {
    var lowStock = products.filter(function (p) { return p.stock < 5; }).length;
    $('#kpiLowStock').text(lowStock);
  }).fail(function () {
    $('#kpiLowStock').text('—');
  });

  // === 3. 折線圖：近七日銷售額趨勢 ===
  var lineCanvas = document.getElementById('salesLineChart');
  if (!lineCanvas) return;
  var lineCtx = lineCanvas.getContext('2d');

  new Chart(lineCtx, {
    type: 'line',
    data: {
      labels: ['5/28', '5/29', '5/30', '5/31', '6/1', '6/2', '6/3'],
      datasets: [{
        label: '銷售額 (NT$)',
        data: [18200, 21500, 16800, 29400, 22100, 31600, 24500],
        borderColor: '#244d4d',
        backgroundColor: 'rgba(36, 77, 77, 0.08)',
        borderWidth: 2.5,
        pointBackgroundColor: '#244d4d',
        pointRadius: 5,
        pointHoverRadius: 7,
        tension: 0.4,
        fill: true,
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
          beginAtZero: false,
          ticks: {
            callback: function (val) {
              return 'NT$ ' + (val / 1000).toFixed(0) + 'K';
            }
          },
          grid: { color: 'rgba(0, 0, 0, 0.05)' }
        },
        x: { grid: { display: false } }
      }
    }
  });

  // === 4. 甜甜圈圖：各商品類別營收佔比（Mock 數據）===
  var donutCanvas = document.getElementById('revenueDonutChart');
  if (!donutCanvas) return;
  var donutCtx = donutCanvas.getContext('2d');

  new Chart(donutCtx, {
    type: 'doughnut',
    data: {
      labels: ['帳篷', '睡袋', '炊具', '燈具', '其他'],
      datasets: [{
        data: [38, 25, 18, 12, 7],
        backgroundColor: ['#244d4d', '#3d7d7d', '#779988', '#aabbaa', '#d0e4d0'],
        borderWidth: 2,
        borderColor: '#ffffff',
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      cutout: '65%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, padding: 16, font: { size: 12 } }
        },
        tooltip: {
          callbacks: {
            label: function (ctx) {
              return ' ' + ctx.label + ': ' + ctx.parsed + '%';
            }
          }
        }
      }
    }
  });
};