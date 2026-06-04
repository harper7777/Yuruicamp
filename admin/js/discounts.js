/**
 * admin/js/discounts.js
 * 折扣優惠管理模組
 * 使用 jQuery Event Namespace (.discounts) 防止重複導覽時事件堆疊
 *
 * 表單為 inline（非 Modal），欄位 ID：
 *   #newCouponCode, #newCouponDiscount, #newCouponQty, #newCouponExpiry
 *   #generateCouponCode（隨機產生按鈕）, #submitAddCoupon（新增按鈕）
 */

window.initDiscounts = function () {
  $(document).off('.discounts');

  $.getJSON('data/coupons.json', function (coupons) {
    renderCouponsTable(coupons);
  }).fail(function () {
    $('#couponsTableBody').html(
      '<tr><td colspan="8" class="text-center text-danger py-4">' +
      '<i class="fas fa-exclamation-triangle me-2"></i>載入優惠券數據失敗' +
      '</td></tr>'
    );
  });

  // 產生隨機優惠碼（8碼英數）
  $(document).on('click.discounts', '#generateCouponCode', function () {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var code  = '';
    for (var i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    $('#newCouponCode').val(code);
  });

  // 啟用 / 停用優惠券
  $(document).on('click.discounts', '.btn-toggle-coupon', function () {
    var $btn     = $(this);
    var $row     = $btn.closest('tr');
    var code     = $row.data('coupon-code');
    var isActive = $row.data('coupon-status') === 'active';

    if (isActive) {
      $row.data('coupon-status', 'disabled');
      $row.find('.status-badge').text('已停用').removeClass('bg-success').addClass('bg-secondary');
      $btn.text('啟用').removeClass('btn-outline-warning').addClass('btn-outline-success');
      window.showAdminToast('優惠券 ' + code + ' 已停用');
    } else {
      $row.data('coupon-status', 'active');
      $row.find('.status-badge').text('啟用中').removeClass('bg-secondary').addClass('bg-success');
      $btn.text('停用').removeClass('btn-outline-success').addClass('btn-outline-warning');
      window.showAdminToast('優惠券 ' + code + ' 已啟用');
    }
  });

  // 刪除優惠券
  $(document).on('click.discounts', '.btn-delete-coupon', function () {
    var $row = $(this).closest('tr');
    var code = $row.data('coupon-code');
    if (!window.confirm('確定要刪除優惠券「' + code + '」嗎？')) return;
    $row.fadeOut(300, function () { $(this).remove(); });
    window.showAdminToast('優惠券 ' + code + ' 已刪除', 'danger');
  });

  // 新增優惠券（inline form，無 Modal）
  $(document).on('click.discounts', '#submitAddCoupon', function () {
    var code     = $('#newCouponCode').val().trim().toUpperCase();
    var discount = parseInt($('#newCouponDiscount').val(), 10) || 0;
    var quantity = parseInt($('#newCouponQty').val(), 10) || 50;
    var expiry   = $('#newCouponExpiry').val();

    if (!code || discount <= 0) {
      window.showAdminToast('請填寫優惠碼與有效的折扣金額', 'danger');
      return;
    }

    var newRow =
      '<tr data-coupon-code="' + code + '" data-coupon-status="active">' +
      '<td><code class="fw-bold">' + code + '</code></td>' +
      '<td>折抵 NT$ ' + discount + '</td>' +
      '<td class="text-center">' + quantity + '</td>' +
      '<td class="text-center">0</td>' +
      '<td class="text-center">' + quantity + '</td>' +
      '<td>' + (expiry || '無限期') + '</td>' +
      '<td><span class="badge bg-success status-badge">啟用中</span></td>' +
      '<td>' +
      '<button class="btn btn-sm btn-outline-warning btn-toggle-coupon me-1">停用</button>' +
      '<button class="btn btn-sm btn-outline-danger btn-delete-coupon">刪除</button>' +
      '</td></tr>';

    $('#couponsTableBody').prepend($(newRow).hide().fadeIn(400));

    // 重設表單欄位
    $('#newCouponCode').val('');
    $('#newCouponDiscount').val('');
    $('#newCouponQty').val('50');
    $('#newCouponExpiry').val('');

    window.showAdminToast('優惠券「' + code + '」已新增');
  });
};

/**
 * 將 coupons 陣列渲染成 HTML 表格列，填入 #couponsTableBody
 * @param {Array} coupons - coupons.json 的資料陣列
 */
function renderCouponsTable(coupons) {
  if (!coupons || coupons.length === 0) {
    $('#couponsTableBody').html(
      '<tr><td colspan="8" class="text-center text-muted py-4">目前沒有優惠券</td></tr>'
    );
    return;
  }

  var html = coupons.map(function (coupon) {
    var isActive  = coupon.status === 'active';
    var remaining = coupon.quantity - coupon.used;

    var remainDisplay = remaining <= 5
      ? '<span class="text-danger fw-bold">' + remaining + '</span>'
      : remaining;

    var statusBadge = isActive
      ? '<span class="badge bg-success status-badge">啟用中</span>'
      : '<span class="badge bg-secondary status-badge">已停用</span>';

    var toggleBtn = isActive
      ? '<button class="btn btn-sm btn-outline-warning btn-toggle-coupon me-1">停用</button>'
      : '<button class="btn btn-sm btn-outline-success btn-toggle-coupon me-1">啟用</button>';

    return '<tr data-coupon-code="' + coupon.code + '" data-coupon-status="' + coupon.status + '">' +
      '<td><code class="fw-bold">' + coupon.code + '</code></td>' +
      '<td>折抵 NT$ ' + coupon.discount + '</td>' +
      '<td class="text-center">' + coupon.quantity + '</td>' +
      '<td class="text-center">' + coupon.used + '</td>' +
      '<td class="text-center">' + remainDisplay + '</td>' +
      '<td>' + (coupon.expiry || '無限期') + '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td>' + toggleBtn +
      '<button class="btn btn-sm btn-outline-danger btn-delete-coupon">刪除</button>' +
      '</td></tr>';
  }).join('');

  $('#couponsTableBody').html(html);
}