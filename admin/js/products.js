/**
 * admin/js/products.js
 * 商品 & 庫存管理模組
 * 使用 jQuery Event Namespace (.products) 防止重複導覽時事件堆疊
 *
 * products.json 欄位對應：thumbnail（非 image）、status:"active"/"disabled"（非 active:bool）
 * 低庫存（stock < 5）的 <tr> 加上 table-danger class，整列顯示淡紅色背景
 */

var PRODUCT_IMAGE_PLACEHOLDER = 'https://placehold.co/48x48/cccccc/555555?text=No+Image';
<<<<<<< HEAD
var adminProductsCache = [];
=======
>>>>>>> 9489ac4d690115f33aaa55281082eba388b9f6da

window.initProducts = function () {
  $(document).off('.products');

  $.getJSON('data/products.json', function (products) {
    adminProductsCache = products || [];
    renderProductsTable(products);
  }).fail(function () {
    $('#productsTableBody').html(
      '<tr><td colspan="8" class="text-center text-danger py-4">' +
      '<i class="fas fa-exclamation-triangle me-2"></i>載入商品數據失敗' +
      '</td></tr>'
    );
  });

  loadProductSpecOptions();

<<<<<<< HEAD
  // 從列表開啟新增商品 Modal 時，清空上一次編輯狀態
  $(document).on('click.products', '[data-bs-target="#addProductModal"]:not(.edit-product-btn)', function () {
    resetProductModalForm();
  });

=======
>>>>>>> 9489ac4d690115f33aaa55281082eba388b9f6da
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

<<<<<<< HEAD
  // 編輯商品：使用同一個新增商品 Modal，並從 admin/data/products.json 帶入資料
  $(document).on('click.products', '.edit-product-btn', function () {
    var productId = $(this).closest('tr').data('product-id');
    var product = findAdminProductById(productId);

    if (!product) {
      window.showAdminToast('找不到商品 ' + productId + ' 的資料', 'danger');
      return;
    }

    fillProductModal(product);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal')).show();
  });

=======
>>>>>>> 9489ac4d690115f33aaa55281082eba388b9f6da
  // 新增規格欄位
  $(document).on('click.products', '#addSpec', function () {
    var specKey = $('#newProductSpec').val().trim();
    if (!specKey) {
      window.showAdminToast('請先輸入或選擇規格名稱', 'danger');
      return;
    }

    var isDuplicate = $('#productSpecFields input[data-spec-key]').toArray().some(function (input) {
      return input.id === specKey;
    });

    if (isDuplicate) {
      window.showAdminToast('此規格欄位已存在', 'danger');
      return;
    }

    var $field = $('<div>', { class: 'mb-2 product-spec-field' });
    var $label = $('<label>', { class: 'form-label small text-muted mb-1' })
      .attr('for', specKey)
      .text(specKey);
    var $input = $('<input>', {
      type: 'text',
      class: 'form-control form-control-sm'
    })
      .attr('id', specKey)
      .attr('data-spec-key', specKey);

    $field.append($label, $input);
    $('#productSpecFields').append($field);
    $('#newProductSpec').val('').trigger('focus');
  });

  // 新增商品
  $(document).on('click.products', '#submitAddProduct', function () {
    var name               = $('#newProductName').val().trim();
    var price              = parseInt($('#newProductPrice').val(), 10) || 0;
    var stock              = parseInt($('#newProductStock').val(), 10) || 0;
    var category           = $('#newProductCategory').val().trim();
    var mainImageInput     = $('#newProductMainImage')[0];
    var secondaryImageInput = $('#newProductImages')[0];
    var mainImageFile      = mainImageInput && mainImageInput.files.length > 0
      ? mainImageInput.files[0]
      : null;
    var secondaryImageFiles = secondaryImageInput
      ? Array.prototype.slice.call(secondaryImageInput.files)
      : [];
    var specifications = getAddedSpecifications();
<<<<<<< HEAD
    var $form = $('#addProductForm');
    var editProductId = $form.data('edit-product-id');
    var existingThumbnail = $form.data('existing-thumbnail');
    var existingImages = $form.data('existing-images') || [];
    var existingStatus = $form.data('existing-status') || 'active';
=======
>>>>>>> 9489ac4d690115f33aaa55281082eba388b9f6da

    if (!name || price <= 0) {
      window.showAdminToast('請填寫商品名稱和有效的價格', 'danger');
      return;
    }

    var newProduct = {
      id: editProductId || 'P-NEW-' + Date.now(),
      thumbnail: mainImageFile ? URL.createObjectURL(mainImageFile) : (existingThumbnail || PRODUCT_IMAGE_PLACEHOLDER),
      name: name,
      category: category || '其他',
      spec: $('#newProductSpec').val().trim(),
      price: price,
      stock: stock,
      status: existingStatus,
      images: secondaryImageFiles.length > 0
        ? secondaryImageFiles.map(function (file) {
          return file.name;
        })
        : existingImages,
      specifications: specifications
    };

<<<<<<< HEAD
    upsertAdminProductCache(newProduct);

    if (editProductId) {
      $('#productsTableBody tr[data-product-id="' + escapeSelector(editProductId) + '"]')
        .replaceWith($(buildProductRow(newProduct)).hide().fadeIn(400));
    } else {
      $('#productsTableBody').prepend($(buildProductRow(newProduct)).hide().fadeIn(400));
    }

    resetProductModalForm();
=======
    var tempId = 'P-NEW-' + Date.now();
    var newProduct = {
      id: tempId,
      thumbnail: mainImageFile ? URL.createObjectURL(mainImageFile) : PRODUCT_IMAGE_PLACEHOLDER,
      name: name,
      category: category || '其他',
      price: price,
      stock: stock,
      status: 'active',
      images: secondaryImageFiles.map(function (file) {
        return file.name;
      }),
      specifications: specifications
    };

    var newRow =
      '<tr data-product-id="' + escapeHtml(newProduct.id) + '"' + (isLow ? ' class="table-danger"' : '') + '>' +
      '<td><img src="' + escapeHtml(newProduct.thumbnail) + '" width="48" height="48" class="rounded object-fit-cover"' +
      ' onerror="this.src=\'' + PRODUCT_IMAGE_PLACEHOLDER + '\'"></td>' +
      '<td>' + escapeHtml(newProduct.name) + '</td>' +
      '<td><span class="badge bg-light text-dark border">' + escapeHtml(newProduct.category) + '</span></td>' +
      '<td>NT$ ' + newProduct.price.toLocaleString() + '</td>' +
      '<td class="stock-cell">' +
      qtyDisplay +
      ' <button class="btn btn-link btn-sm p-0 ms-1 stock-edit-btn" data-qty="' + newProduct.stock + '" title="編輯庫存">' +
      '<i class="fas fa-pencil-alt text-secondary"></i></button>' +
      '</td>' +
      '<td><span class="badge bg-success status-badge">上架中</span></td>' +
      '<td><div class="form-check form-switch">' +
      '<input class="form-check-input product-status-toggle" type="checkbox" checked>' +
      '</div></td>' +
      '</tr>';

    $('#productsTableBody').prepend($(newRow).hide().fadeIn(400));
    $('#addProductForm')[0].reset();
    $('#productSpecFields').empty();
>>>>>>> 9489ac4d690115f33aaa55281082eba388b9f6da

    var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal'));
    modal.hide();

<<<<<<< HEAD
    window.showAdminToast('商品「' + name + '」已' + (editProductId ? '更新' : '新增'));
=======
    window.showAdminToast('商品「' + name + '」已新增');
>>>>>>> 9489ac4d690115f33aaa55281082eba388b9f6da
  });
};

/**
 * 從前台 data/products.json 的 specifications 物件收集不重複 key，填入 datalist。
 */
function loadProductSpecOptions() {
  var $specOptions = $('#productSpecOptions');
  if ($specOptions.length === 0) {
    return;
  }

  $.getJSON('../data/products.json', function (products) {
    var keyMap = {};
    (products || []).forEach(function (product) {
      if (!product.specifications || typeof product.specifications !== 'object') {
        return;
      }

      Object.keys(product.specifications).forEach(function (key) {
        keyMap[key] = true;
      });
    });

    var optionsHtml = Object.keys(keyMap).sort().map(function (key) {
      return '<option value="' + escapeHtml(key) + '"></option>';
    }).join('');

    $specOptions.html(optionsHtml);
  }).fail(function () {
    window.showAdminToast('載入規格選項失敗', 'danger');
  });
}

function getAddedSpecifications() {
  var specifications = {};

  $('#productSpecFields input[data-spec-key]').each(function () {
    var key = $(this).attr('data-spec-key');
    var value = $(this).val().trim();

    if (key && value) {
      specifications[key] = value;
    }
  });

  return specifications;
}

<<<<<<< HEAD
function findAdminProductById(productId) {
  return (adminProductsCache || []).find(function (product) {
    return product.id === productId;
  });
}

function fillProductModal(product) {
  resetProductModalForm();

  $('#addProductForm')
    .data('edit-product-id', product.id)
    .data('existing-thumbnail', product.thumbnail || PRODUCT_IMAGE_PLACEHOLDER)
    .data('existing-images', product.images || [])
    .data('existing-status', product.status || 'active');

  $('#newProductName').val(product.name || '');
  $('#newProductCategory').val(product.category || '');
  $('#newProductSpec').val(product.spec || '');
  $('#newProductPrice').val(product.price || '');
  $('#newProductStock').val(product.stock || 0);

  if (product.specifications && typeof product.specifications === 'object') {
    Object.keys(product.specifications).forEach(function (key) {
      addSpecificationField(key, product.specifications[key]);
    });
  }
}

function resetProductModalForm() {
  var form = $('#addProductForm')[0];
  if (form) {
    form.reset();
  }

  $('#addProductForm')
    .removeData('edit-product-id')
    .removeData('existing-thumbnail')
    .removeData('existing-images')
    .removeData('existing-status');
  $('#productSpecFields').empty();
}

function addSpecificationField(specKey, value) {
  if (!specKey) {
    return;
  }

  var $field = $('<div>', { class: 'mb-2 product-spec-field' });
  var $label = $('<label>', { class: 'form-label small text-muted mb-1' })
    .attr('for', specKey)
    .text(specKey);
  var $input = $('<input>', {
    type: 'text',
    class: 'form-control form-control-sm'
  })
    .attr('id', specKey)
    .attr('data-spec-key', specKey)
    .val(value || '');

  $field.append($label, $input);
  $('#productSpecFields').append($field);
}

function upsertAdminProductCache(product) {
  var index = adminProductsCache.findIndex(function (item) {
    return item.id === product.id;
  });

  if (index >= 0) {
    adminProductsCache[index] = product;
  } else {
    adminProductsCache.unshift(product);
  }
}

function buildProductRow(p) {
  var isLow    = p.stock < 5;
  var isActive = p.status === 'active';
  var rowClass = isLow ? ' class="table-danger"' : '';
  var stockDisplay = isLow
    ? '<span class="text-danger fw-bold">' + p.stock +
      ' <i class="fas fa-exclamation-triangle" title="低庫存警告"></i></span>'
    : '<span>' + p.stock + '</span>';
  var statusBadge = isActive
    ? '<span class="badge bg-success status-badge">上架中</span>'
    : '<span class="badge bg-secondary status-badge">已下架</span>';
  var imgSrc = p.thumbnail || PRODUCT_IMAGE_PLACEHOLDER;

  return '<tr data-product-id="' + escapeHtml(p.id) + '"' + rowClass + '>' +
    '<td><img src="' + escapeHtml(imgSrc) + '" width="48" height="48" class="rounded object-fit-cover"' +
    ' onerror="this.src=\'' + PRODUCT_IMAGE_PLACEHOLDER + '\'"></td>' +
    '<td class="fw-semibold">' + escapeHtml(p.name) + '</td>' +
    '<td><span class="badge bg-light text-dark border">' + escapeHtml(p.category || '—') + '</span></td>' +
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
    '<td>' +
    '<button type="button" class="btn btn-sm btn-outline-secondary edit-product-btn" title="編輯商品">' +
    '<i class="fas fa-pen me-1"></i>編輯' +
    '</button>' +
    '</td>' +
    '</tr>';
}

function escapeSelector(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

=======
>>>>>>> 9489ac4d690115f33aaa55281082eba388b9f6da
function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, function (char) {
    return {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[char];
  });
}

/**
 * 將 products 陣列渲染成 HTML 表格列，填入 #productsTableBody
 * @param {Array} products - products.json 的資料陣列
 */
function renderProductsTable(products) {
  if (!products || products.length === 0) {
    $('#productsTableBody').html(
      '<tr><td colspan="8" class="text-center text-muted py-4">目前沒有商品</td></tr>'
    );
    return;
  }

  var html = products.map(function (p) {
<<<<<<< HEAD
    return buildProductRow(p);
=======
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

    var imgSrc = p.thumbnail || PRODUCT_IMAGE_PLACEHOLDER;

    return '<tr data-product-id="' + escapeHtml(p.id) + '"' + rowClass + '>' +
      '<td><img src="' + escapeHtml(imgSrc) + '" width="48" height="48" class="rounded object-fit-cover"' +
      ' onerror="this.src=\'' + PRODUCT_IMAGE_PLACEHOLDER + '\'"></td>' +
      '<td class="fw-semibold">' + escapeHtml(p.name) + '</td>' +
      '<td><span class="badge bg-light text-dark border">' + escapeHtml(p.category || '—') + '</span></td>' +
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
>>>>>>> 9489ac4d690115f33aaa55281082eba388b9f6da
  }).join('');

  $('#productsTableBody').html(html);
}
