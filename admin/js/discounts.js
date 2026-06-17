/**
 * admin/js/discounts.js
 * 折扣優惠管理模組
 * 使用 jQuery Event Namespace (.discounts) 防止重複導覽時事件堆疊
 *
 * 表單為 inline（非 Modal），欄位 ID：
 *   #newCouponCode, #newCouponDiscount, #newCouponQty
 *   #newCouponStart, #newCouponEnd（起始/結束時間，datetime-local）
 *   #discountTypeSwitch（折扣類型切換，checkbox form-switch）
 *   #generateCouponCode（隨機產生按鈕）, #submitAddCoupon（新增按鈕）
 *
 * 「總數量」欄位多了 .btn-edit-qty 按鈕，讓管理者可手動調整該優惠券的總數量，
 * 編輯後會自動重新計算「剩餘」欄位（剩餘 = 總數量 - 已使用）。
 *
 * 持久化說明：
 *   目前網站為純前端，coupons.json 是靜態檔案無法被寫入。
 *   因此調整後的「總數量」會額外存一份到 localStorage（key: couponQuantityOverrides），
 *   下次載入 coupons.json 後會用 localStorage 裡的數字覆蓋對應優惠碼的 quantity，
 *   讓重新整理頁面後數字不會跑掉。
 *   這只在「同一台電腦 / 同一個瀏覽器」有效；換瀏覽器、無痕模式、或清除瀏覽器資料
 *   會讓覆蓋值消失（會還原成 coupons.json 裡原本寫的數字）。
 *   未來若改用後端 API，只需把 saveQuantityOverride() 內的 localStorage 寫入
 *   換成呼叫 API 即可，其他邏輯不需更動。
 */

var COUPON_QTY_STORAGE_KEY = "couponQuantityOverrides";

/**
 * 讀取 localStorage 裡所有「優惠碼 -> 總數量」的覆蓋值
 * @returns {Object} 例如 { "YURUIKAMP20": 80, "CAMPFUN50": 120 }
 */
function getQuantityOverrides() {
  try {
    var raw = localStorage.getItem(COUPON_QTY_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

/**
 * 將某優惠碼的新總數量寫入 localStorage
 * @param {string} code
 * @param {number} quantity
 */
function saveQuantityOverride(code, quantity) {
  var overrides = getQuantityOverrides();
  overrides[code] = quantity;
  try {
    localStorage.setItem(COUPON_QTY_STORAGE_KEY, JSON.stringify(overrides));
  } catch (e) {
    // localStorage 無法使用（例如被瀏覽器封鎖）時，僅畫面更新，重整後會還原
    console.warn("無法寫入 localStorage，總數量調整不會被保存：", e);
  }
}

window.initDiscounts = function () {
  $(document).off(".discounts");

  $.getJSON("data/coupons.json", function (coupons) {
    // 套用 localStorage 裡保存過的總數量覆蓋值
    var overrides = getQuantityOverrides();
    coupons.forEach(function (coupon) {
      if (Object.prototype.hasOwnProperty.call(overrides, coupon.code)) {
        coupon.quantity = overrides[coupon.code];
      }
    });

    renderCouponsTable(coupons);
  }).fail(function () {
    $("#couponsTableBody").html(
      '<tr><td colspan="8" class="text-center text-danger py-4">' +
        '<i class="fas fa-exclamation-triangle me-2"></i>載入優惠券數據失敗' +
        "</td></tr>",
    );
  });

  // 折扣類型 Switch：切換「折扣金額」和「折數」模式
  // Switch 勾選 = 折數模式；未勾選 = 折扣金額模式（預設）
  $(document).on('change.discounts', '#discountTypeSwitch', function () {
    var isPercent = $(this).is(':checked'); // true = 折數；false = 金額

    if (isPercent) {
      // 折數模式：輸入 0.1 ~ 9.9，step 0.1
      $('#discountLabel').html('折數（幾折）<span class="text-danger">*</span>');
      $('#newCouponDiscount')
        .attr('placeholder', '例：8')
        .attr('min', '0.1')
        .attr('max', '9.9')
        .attr('step', '0.1')
        .val('');
    } else {
      // 折扣金額模式：輸入正整數，無上限
      $('#discountLabel').html('折扣金額 (NT$) <span class="text-danger">*</span>');
      $('#newCouponDiscount')
        .attr('placeholder', '例：200')
        .attr('min', '1')
        .removeAttr('max')
        .attr('step', '1')
        .val('');
    }
  });

  // 「現在」按鈕：將起始時間填入當下時間（精度到分鐘）
  $(document).on('click.discounts', '#setCouponStartNow', function () {
    var now    = new Date();
    var year   = now.getFullYear();
    var month  = String(now.getMonth() + 1).padStart(2, '0');
    var day    = String(now.getDate()).padStart(2, '0');
    var hour   = String(now.getHours()).padStart(2, '0');
    var minute = String(now.getMinutes()).padStart(2, '0');
    // datetime-local 格式必須是 "YYYY-MM-DDTHH:MM"
    $('#newCouponStart').val(year + '-' + month + '-' + day + 'T' + hour + ':' + minute);
  });

  // 產生隨機優惠碼（8碼英數）
  $(document).on("click.discounts", "#generateCouponCode", function () {
    var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    var code = "";
    for (var i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    $("#newCouponCode").val(code);
  });

  // 啟用 / 停用優惠券
  $(document).on("click.discounts", ".btn-toggle-coupon", function () {
    var $btn = $(this);
    var $row = $btn.closest("tr");
    var code = $row.data("coupon-code");
    var isActive = $row.data("coupon-status") === "active";

    if (isActive) {
      $row.data("coupon-status", "disabled");
      $row
        .find(".status-badge")
        .text("已停用")
        .removeClass("bg-success")
        .addClass("bg-secondary");
      $btn
        .text("啟用")
        .removeClass("btn-outline-warning")
        .addClass("btn-outline-success");
      window.showAdminToast("優惠券 " + code + " 已停用");
    } else {
      $row.data("coupon-status", "active");
      $row
        .find(".status-badge")
        .text("啟用中")
        .removeClass("bg-secondary")
        .addClass("bg-success");
      $btn
        .text("停用")
        .removeClass("btn-outline-success")
        .addClass("btn-outline-warning");
      window.showAdminToast("優惠券 " + code + " 已啟用");
    }
  });

  // 編輯優惠券總數量
  $(document).on("click.discounts", ".btn-edit-qty", function () {
    var $row = $(this).closest("tr");
    var code = $row.data("coupon-code");
    var $qtySpan = $row.find(".qty-value");
    var $remainTd = $row.find(".remain-value");

    var currentQty = parseInt($qtySpan.text(), 10) || 0;
    var used = parseInt($row.find(".used-value").text(), 10) || 0;

    var input = window.prompt(
      "請輸入優惠券「" + code + "」的新總數量：",
      currentQty,
    );
    if (input === null) return; // 使用者取消

    var newQty = parseInt(input, 10);

    if (isNaN(newQty) || newQty < 0 || String(input).trim() === "") {
      window.showAdminToast("請輸入有效的數量（須為 0 以上的整數）", "danger");
      return;
    }

    if (newQty < used) {
      window.showAdminToast(
        "總數量不能小於已使用數量（" + used + "）",
        "danger",
      );
      return;
    }

    var remaining = newQty - used;

    $qtySpan.text(newQty);
    $remainTd.html(
      remaining <= 5
        ? '<span class="text-danger fw-bold">' + remaining + "</span>"
        : remaining,
    );

    // 保存到 localStorage，下次重整頁面會套用這個數量
    saveQuantityOverride(code, newQty);

    window.showAdminToast("優惠券「" + code + "」總數量已更新為 " + newQty);
  });

  // 刪除優惠券
  $(document).on("click.discounts", ".btn-delete-coupon", function () {
    var $row = $(this).closest("tr");
    var code = $row.data("coupon-code");
    if (!window.confirm("確定要刪除優惠券「" + code + "」嗎？")) return;
    $row.fadeOut(300, function () {
      $(this).remove();
    });
    window.showAdminToast("優惠券 " + code + " 已刪除", "danger");
  });

  // 新增優惠券（inline form，無 Modal）
  $(document).on('click.discounts', '#submitAddCoupon', function () {
    var code       = $('#newCouponCode').val().trim().toUpperCase();
    var discountRaw = parseFloat($('#newCouponDiscount').val()) || 0;
    var quantity   = parseInt($('#newCouponQty').val(), 10) || 50;
    var startVal   = $('#newCouponStart').val(); // "YYYY-MM-DDTHH:MM" 或空字串
    var endVal     = $('#newCouponEnd').val();   // "YYYY-MM-DDTHH:MM" 或空字串
    var isPercent  = $('#discountTypeSwitch').is(':checked'); // true = 折數

    // --- 驗證 ---
    if (!code) {
      window.showAdminToast('請填寫優惠碼', 'danger');
      return;
    }
    if (isPercent) {
      // 折數須在 0 < x < 10 之間，且最多一位小數
      if (discountRaw <= 0 || discountRaw >= 10) {
        window.showAdminToast('折數須介於 0 到 10 之間（不含）', 'danger');
        return;
      }
      // 確保最多一位小數（例如 8.55 不合法）
      if (Math.round(discountRaw * 10) / 10 !== discountRaw) {
        window.showAdminToast('折數最多輸入小數後一位，例如 8 或 8.5', 'danger');
        return;
      }
    } else {
      if (discountRaw <= 0) {
        window.showAdminToast('請填寫有效的折扣金額', 'danger');
        return;
      }
    }

    // --- 折扣欄位顯示文字 ---
    // 金額：折抵 NT$ 200；折數：8 折
    var discountDisplay = isPercent
      ? discountRaw + ' 折'
      : '折抵 NT$ ' + Math.floor(discountRaw);

    // --- 有效期限顯示文字 ---
    // 將 "YYYY-MM-DDTHH:MM" 轉為 "YYYY/MM/DD HH:MM" 格式
    function formatDatetime(val) {
      if (!val) return '';
      // val 格式："2026-06-14T18:00"
      var parts = val.split('T');           // ["2026-06-14", "18:00"]
      var datePart = parts[0].replace(/-/g, '/'); // "2026/06/14"
      return datePart + ' ' + parts[1];    // "2026/06/14 18:00"
    }

    var startDisplay = formatDatetime(startVal);
    var endDisplay   = formatDatetime(endVal);
    var expiryDisplay;

    if (startDisplay && endDisplay) {
      expiryDisplay = startDisplay + ' ～ ' + endDisplay;
    } else if (!startDisplay && endDisplay) {
      expiryDisplay = '即日起 ～ ' + endDisplay;
    } else if (startDisplay && !endDisplay) {
      expiryDisplay = startDisplay + ' ～ 無限期';
    } else {
      expiryDisplay = '無限期';
    }

    // --- 組合新表格列 ---
    var newRow =
      '<tr data-coupon-code="' +
      code +
      '" data-coupon-status="active">' +
      '<td><code class="fw-bold">' +
      code +
      "</code></td>" +
      "<td>折抵 NT$ " +
      discount +
      "</td>" +
      '<td class="text-center">' +
      '<span class="qty-value">' +
      quantity +
      "</span> " +
      '<button class="btn btn-sm btn-link btn-edit-qty p-0 ms-1" title="編輯總數量">' +
      '<i class="fas fa-pen fa-xs"></i></button>' +
      "</td>" +
      '<td class="text-center used-value">0</td>' +
      '<td class="text-center remain-value">' +
      quantity +
      "</td>" +
      "<td>" +
      (expiry || "無限期") +
      "</td>" +
      '<td><span class="badge bg-success status-badge">啟用中</span></td>' +
      "<td>" +
      '<button class="btn btn-sm btn-outline-warning btn-toggle-coupon me-1">停用</button>' +
      '<button class="btn btn-sm btn-outline-danger btn-delete-coupon">刪除</button>' +
      "</td></tr>";

    $("#couponsTableBody").prepend($(newRow).hide().fadeIn(400));

    // --- 重設表單欄位 ---
    $('#newCouponCode').val('');
    $('#newCouponDiscount').val('');
    $('#newCouponQty').val('50');
    $('#newCouponStart').val('');
    $('#newCouponEnd').val('');
    // Switch 重設回「折扣金額」模式
    $('#discountTypeSwitch').prop('checked', false).trigger('change');

    window.showAdminToast("優惠券「" + code + "」已新增");
  });
};

/**
 * 將 coupons 陣列渲染成 HTML 表格列，填入 #couponsTableBody
 * @param {Array} coupons - coupons.json 的資料陣列（quantity 已套用 localStorage 覆蓋值）
 */
function renderCouponsTable(coupons) {
  if (!coupons || coupons.length === 0) {
    $("#couponsTableBody").html(
      '<tr><td colspan="8" class="text-center text-muted py-4">目前沒有優惠券</td></tr>',
    );
    return;
  }

  var html = coupons
    .map(function (coupon) {
      var isActive = coupon.status === "active";
      var remaining = coupon.quantity - coupon.used;

      var remainDisplay =
        remaining <= 5
          ? '<span class="text-danger fw-bold">' + remaining + "</span>"
          : remaining;

      var statusBadge = isActive
        ? '<span class="badge bg-success status-badge">啟用中</span>'
        : '<span class="badge bg-secondary status-badge">已停用</span>';

      var toggleBtn = isActive
        ? '<button class="btn btn-sm btn-outline-warning btn-toggle-coupon me-1">停用</button>'
        : '<button class="btn btn-sm btn-outline-success btn-toggle-coupon me-1">啟用</button>';

      return (
        '<tr data-coupon-code="' +
        coupon.code +
        '" data-coupon-status="' +
        coupon.status +
        '">' +
        '<td><code class="fw-bold">' +
        coupon.code +
        "</code></td>" +
        "<td>折抵 NT$ " +
        coupon.discount +
        "</td>" +
        '<td class="text-center">' +
        '<span class="qty-value">' +
        coupon.quantity +
        "</span> " +
        '<button class="btn btn-sm btn-link btn-edit-qty p-0 ms-1" title="編輯總數量">' +
        '<i class="fas fa-pen fa-xs"></i></button>' +
        "</td>" +
        '<td class="text-center used-value">' +
        coupon.used +
        "</td>" +
        '<td class="text-center remain-value">' +
        remainDisplay +
        "</td>" +
        "<td>" +
        (coupon.expiry || "無限期") +
        "</td>" +
        "<td>" +
        statusBadge +
        "</td>" +
        "<td>" +
        toggleBtn +
        '<button class="btn btn-sm btn-outline-danger btn-delete-coupon">刪除</button>' +
        "</td></tr>"
      );
    })
    .join("");

  $('#couponsTableBody').html(html);

  if (typeof window.applyEditPermission === 'function') {
    window.applyEditPermission('discounts', $('#contentArea'));
  }
}
