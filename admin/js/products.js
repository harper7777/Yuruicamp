/**
 * admin/js/products.js
 * 商品 & 庫存管理模組
 * 使用 jQuery Event Namespace (.products) 防止重複導覽時事件堆疊
 *
 * products.json 欄位對應：thumbnail（非 image）、status:"active"/"disabled"（非 active:bool）
 * 低庫存（stock < 5）的 <tr> 加上 table-danger class，整列顯示淡紅色背景
 */

window.initProducts = function () {
  $(document).off('.products');

  $.getJSON('data/products.json', function (products) {
    renderProductsTable(products);
  }).fail(function () {
    $('#productsTableBody').html(
      '<tr><td colspan="7" class="text-center text-danger py-4">' +
      '<i class="fas fa-exclamation-triangle me-2"></i>載入商品數據失敗' +
      '</td></tr>'
    );
  });

  // 庫存 inline editing：點擊鉛筆圖示進入編輯
  $(document).on('click.products', '.stock-edit-btn', function () {
    var $cell = $(this).closest('.stock-cell');
    var currentQty = $(this).data('qty');
    $cell.html(
      '<div class="d-flex align-items-center gap-1">' +
      '<input type="number" class="form-control form-control-sm stock-input" ' +
      'value="' + currentQty + '" min="0" style="width:75px">' +
      '<button class="btn btn-sm btn-success stock-save-btn" title="儲存">' +
      '<i class="fas fa-check"></i></button>' +
      '<button class="btn btn-sm btn-secondary stock-cancel-btn" ' +
      'data-qty="' + currentQty + '" title="取消">' +
      '<i class="fas fa-times"></i></button>' +
      '</div>'
    );
    $cell.find('.stock-input').trigger('focus').trigger('select');
  });

  // 庫存 inline editing：儲存（同時更新列背景色）
  $(document).on('click.products', '.stock-save-btn', function () {
    var $cell = $(this).closest('.stock-cell');
    var $row  = $(this).closest('tr');
    var productId = $row.data('product-id');
    var newQty = parseInt($cell.find('.stock-input').val(), 10) || 0;
    var isLow  = newQty < 5;

    // 更新列背景色（低庫存 = 淡紅色，否則移除）
    if (isLow) {
      $row.addClass('table-danger');
    } else {
      $row.removeClass('table-danger');
    }

    var qtyDisplay = isLow
      ? '<span class="text-danger fw-bold">' + newQty + ' <i class="fas fa-exclamation-triangle"></i></span>'
      : '<span>' + newQty + '</span>';

    $cell.html(
      qtyDisplay +
      ' <button class="btn btn-link btn-sm p-0 ms-1 stock-edit-btn" data-qty="' + newQty + '" title="編輯庫存">' +
      '<i class="fas fa-pencil-alt text-secondary"></i></button>'
    );
    window.showAdminToast('商品 ' + productId + ' 庫存已更新為 ' + newQty);
  });

  // 庫存 inline editing：取消
  $(document).on('click.products', '.stock-cancel-btn', function () {
    var $cell  = $(this).closest('.stock-cell');
    var oldQty = parseInt($(this).data('qty'), 10);
    var isLow  = oldQty < 5;

    var qtyDisplay = isLow
      ? '<span class="text-danger fw-bold">' + oldQty + ' <i class="fas fa-exclamation-triangle"></i></span>'
      : '<span>' + oldQty + '</span>';

    $cell.html(
      qtyDisplay +
      ' <button class="btn btn-link btn-sm p-0 ms-1 stock-edit-btn" data-qty="' + oldQty + '" title="編輯庫存">' +
      '<i class="fas fa-pencil-alt text-secondary"></i></button>'
    );
  });

  // 上架 / 下架切換
  $(document).on('change.products', '.product-status-toggle', function () {
    var $toggle   = $(this);
    var $row      = $toggle.closest('tr');
    var productId = $row.data('product-id');
    var isOnline  = $toggle.is(':checked');

    var $badge = $row.find('.status-badge');
    if (isOnline) {
      $badge.text('上架中').removeClass('bg-secondary').addClass('bg-success');
    } else {
      $badge.text('已下架').removeClass('bg-success').addClass('bg-secondary');
    }
    window.showAdminToast('商品 ' + productId + ' 已更新為' + (isOnline ? '「上架中」' : '「已下架」'));
  });

  // 新增商品
  $(document).on('click.products', '#submitAddProduct', function () {
    var name     = $('#newProductName').val().trim();
    var price    = parseInt($('#newProductPrice').val(), 10) || 0;
    var stock    = parseInt($('#newProductStock').val(), 10) || 0;
    var category = $('#newProductCategory').val().trim();

    if (!name || price <= 0) {
      window.showAdminToast('請填寫商品名稱和有效的價格', 'danger');
      return;
    }

    var isLow = stock < 5;
    var qtyDisplay = isLow
      ? '<span class="text-danger fw-bold">' + stock + ' <i class="fas fa-exclamation-triangle"></i></span>'
      : '<span>' + stock + '</span>';

    var tempId = 'P-NEW-' + Date.now();
    var newRow =
      '<tr data-product-id="' + tempId + '"' + (isLow ? ' class="table-danger"' : '') + '>' +
      '<td><img src="https://placehold.co/48x48/cccccc/555555?text=No+Image"' +
      ' width="48" height="48" class="rounded object-fit-cover"></td>' +
      '<td>' + name + '</td>' +
      '<td><span class="badge bg-light text-dark border">' + (category || '其他') + '</span></td>' +
      '<td>NT$ ' + price.toLocaleString() + '</td>' +
      '<td class="stock-cell">' +
      qtyDisplay +
      ' <button class="btn btn-link btn-sm p-0 ms-1 stock-edit-btn" data-qty="' + stock + '" title="編輯庫存">' +
      '<i class="fas fa-pencil-alt text-secondary"></i></button>' +
      '</td>' +
      '<td><span class="badge bg-success status-badge">上架中</span></td>' +
      '<td><div class="form-check form-switch">' +
      '<input class="form-check-input product-status-toggle" type="checkbox" checked>' +
      '</div></td>' +
      '</tr>';

    $('#productsTableBody').prepend($(newRow).hide().fadeIn(400));
    $('#addProductForm')[0].reset();
    bootstrap.Modal.getInstance('#addProductModal').hide();
    window.showAdminToast('商品「' + name + '」已新增');
  });
};

/**
 * 將 products 陣列渲染成 HTML 表格列，填入 #productsTableBody
 * @param {Array} products - products.json 的資料陣列
 */
function renderProductsTable(products) {
  if (!products || products.length === 0) {
    $('#productsTableBody').html(
      '<tr><td colspan="7" class="text-center text-muted py-4">目前沒有商品</td></tr>'
    );
    return;
  }

  var html = products.map(function (p) {
    var isLow    = p.stock < 5;
    var isActive = p.status === 'active';

    // 低庫存整列套用 Bootstrap table-danger（淡紅色背景）
    var rowClass = isLow ? ' class="table-danger"' : '';

    var stockDisplay = isLow
      ? '<span class="text-danger fw-bold">' + p.stock +
        ' <i class="fas fa-exclamation-triangle" title="低庫存警告"></i></span>'
      : '<span>' + p.stock + '</span>';

    var statusBadge = isActive
      ? '<span class="badge bg-success status-badge">上架中</span>'
      : '<span class="badge bg-secondary status-badge">已下架</span>';

    var imgSrc = p.thumbnail || 'https://placehold.co/48x48/cccccc/555555?text=No+Image';

    return '<tr data-product-id="' + p.id + '"' + rowClass + '>' +
      '<td><img src="' + imgSrc + '" width="48" height="48" class="rounded object-fit-cover"' +
      ' onerror="this.src=\'https://placehold.co/48x48/cccccc/555555?text=No+Image\'"></td>' +
      '<td class="fw-semibold">' + p.name + '</td>' +
      '<td><span class="badge bg-light text-dark border">' + (p.category || '—') + '</span></td>' +
      '<td>NT$ ' + p.price.toLocaleString() + '</td>' +
      '<td class="stock-cell">' +
      stockDisplay +
      ' <button class="btn btn-link btn-sm p-0 ms-1 stock-edit-btn" data-qty="' + p.stock + '" title="編輯庫存">' +
      '<i class="fas fa-pencil-alt text-secondary"></i></button>' +
      '</td>' +
      '<td>' + statusBadge + '</td>' +
      '<td><div class="form-check form-switch">' +
      '<input class="form-check-input product-status-toggle" type="checkbox" ' + (isActive ? 'checked' : '') + '>' +
      '</div></td>' +
      '</tr>';
  }).join('');

  $('#productsTableBody').html(html);
}