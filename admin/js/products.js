/**
 * admin/js/products.js
 * 商品 & 庫存管理模組
 * 使用 jQuery Event Namespace (.products) 防止重複導覽時事件堆疊
 *
 * products.json 欄位對應：thumbnail（非 image）、status:"active"/"disabled"（非 active:bool）
 * 分店庫存由 branch.branch-001 / branch-002 / branch-003 保存，總庫存由 total-stock 保存。
 * 低庫存（total-stock < 5）的 <tr> 加上 table-danger class，整列顯示淡紅色背景
 */

var PRODUCT_IMAGE_PLACEHOLDER = 'https://placehold.co/48x48/cccccc/555555?text=No+Image';
var ADMIN_PRODUCT_BRANCH_IDS = ['branch-001', 'branch-002', 'branch-003'];
var ADMIN_PRODUCT_BRANCH_LABELS = {
  'branch-001': '分店 A',
  'branch-002': '分店 B',
  'branch-003': '分店 C'
};
var adminProductsCache = [];
var adminRentalsCache = [];
var adminRentalsLoaded = false;
var pendingMovementItems = [];

window.initProducts = function () {
  $(document).off('.products');
  bindProductViewTabs();

  $.getJSON('data/products.json', function (products) {
    adminProductsCache = (products || []).map(normalizeProductBranch);
    renderProductsTable(adminProductsCache);
  }).fail(function () {
    $('#productsTableBody').html(
      '<tr><td colspan="8" class="text-center text-danger py-4">' +
      '<i class="fas fa-exclamation-triangle me-2"></i>載入商品數據失敗' +
      '</td></tr>'
    );
  });

  loadProductSpecOptions();

  // 從列表開啟新增商品 Modal 時，清空上一次編輯狀態
  $(document).on('click.products', '[data-bs-target="#addProductModal"]:not(.edit-product-btn)', function () {
    resetProductModalForm();
  });

  // 新增商品 Modal：切換租借商品時，顯示 / 隱藏多營地庫存欄位。
  $(document).on('change.products', '#newProductIsRental', function () {
    syncRentalFormState($(this).is(':checked'));
  });

  // 租借商品營地欄位：每次點擊都新增一列營地名稱與該營地存放數量。
  $(document).on('click.products', '#addRentalCamp', function () {
    appendRentalCampField('', 0);
    updateRentalStockFromCampFields();
  });

  // 租借營地資料異動時，重新加總各營地數量並同步到唯讀庫存欄位。
  $(document).on('input.products change.products', '.rental-camp-name-input, .rental-camp-quantity-input', function () {
    updateRentalStockFromCampFields();
  });

  // 租借營地列可移除；移除後若沒有任何列，保留一列空白輸入方便繼續新增。
  $(document).on('click.products', '.remove-rental-camp-btn', function () {
    $(this).closest('.rental-camp-row').remove();
    if ($('#rentalCampList .rental-camp-row').length === 0) {
      appendRentalCampField('', 0);
    }
    updateRentalStockFromCampFields();
  });

  // 庫存數量步進：總庫存與分店庫存共用同一組事件。
  $(document).on('click.products', '.stock-step-btn', function () {
    var $control = $(this).closest('.admin-stock-control');
    var $input = $control.find('.stock-input');
    var action = $(this).data('stock-action');
    var currentQty = getStockInputValue($input);
    var nextQty = action === 'decrement' ? currentQty - 1 : currentQty + 1;

    $input.val(Math.max(nextQty, 0)).trigger('input');
  });

  // 欄位資料有異動才顯示同列的確定按鈕，未異動時維持隱藏。
  $(document).on('input.products change.products', '.stock-input', function () {
    syncStockConfirmState($(this).closest('tr'));
  });

  // 庫存確認：檢查總庫存必須等於分店 A/B/C 加總後才更新畫面資料。
  $(document).on('click.products', '.stock-confirm-btn', function () {
    var $button = $(this);
    var $row = $button.closest('tr');
    var inventoryType = $row.data('inventory-type') || 'store';
    var productId = $row.data('product-id');

    if (inventoryType === 'rental') {
      confirmRentalStockChange($row, productId, $button);
      return;
    }

    var product = findAdminProductById(productId);

    if (!product) {
      window.showAdminToast('找不到商品 ' + productId + ' 的資料', 'danger');
      return;
    }

    var totalStock = getRowStockValue($row, 'total-stock');
    var branchStock = {};
    ADMIN_PRODUCT_BRANCH_IDS.forEach(function (branchId) {
      branchStock[branchId] = getRowStockValue($row, branchId);
    });

    var branchTotal = getBranchTotal(branchStock);
    if (branchTotal !== totalStock) {
      window.showAdminToast(
        '分店數量加總 ' + branchTotal + ' 與總庫存 ' + totalStock + ' 不一致，請調整後再確定',
        'danger'
      );
      return;
    }

    var movementResult = buildMovementItemsForBranchChange(product, branchStock);
    if (!movementResult.valid) {
      window.showAdminToast(movementResult.message, 'danger');
      return;
    }

    product['total-stock'] = totalStock;
    product.branch = branchStock;
    delete product.stock;

    $row.toggleClass('table-danger', totalStock < 5);
    setRowOriginalStockValues($row);
    syncStockConfirmState($row);

    if (movementResult.items.length > 0) {
      pendingMovementItems = pendingMovementItems.concat(movementResult.items);
      updateMovementGenerateButtonState();
    }

    window.showAdminToast('商品 ' + productId + ' 庫存數量已更新');
  });

  // 將已通過確定檢查的庫存異動整合成一筆庫存異動紀錄。
  $(document).on('click.products', '#generateMovementRecord', function () {
    if (pendingMovementItems.length === 0) {
      window.showAdminToast('目前沒有可生成的庫存異動明細', 'info');
      return;
    }

    var record = {
      id: createMovementRecordId(),
      date: formatMovementDate(new Date()),
      employeeId: getCurrentAdminId(),
      items: pendingMovementItems.slice()
    };

    if (typeof window.addMovementRecord === 'function') {
      window.addMovementRecord(record);
    } else {
      window.generatedMovementRecords = window.generatedMovementRecords || [];
      window.generatedMovementRecords.unshift(record);
    }

    pendingMovementItems = [];
    updateMovementGenerateButtonState();
    window.showAdminToast('已生產庫存異動紀錄 ' + record.id);
  });

  // 編輯商品：使用同一個新增商品 Modal，並從 admin/data/products.json 帶入資料
  $(document).on('click.products', '.edit-product-btn', function () {
    var $row = $(this).closest('tr');
    var inventoryType = $row.data('inventory-type') || 'store';
    var productId = $row.data('product-id');

    if (inventoryType === 'rental') {
      var rental = findAdminRentalById(productId);

      if (!rental) {
        window.showAdminToast('找不到租借商品 ' + productId + ' 的資料', 'danger');
        return;
      }

      fillRentalModal(rental);
      bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal')).show();
      return;
    }

    var product = findAdminProductById(productId);

    if (!product) {
      window.showAdminToast('找不到商品 ' + productId + ' 的資料', 'danger');
      return;
    }

    fillProductModal(product);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal')).show();
  });

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
    var isRental           = $('#newProductIsRental').is(':checked');
    var rentalCampState    = collectRentalCampFields();
    var mainImageInput     = $('#newProductMainImage')[0];
    var secondaryImageInput = $('#newProductImages')[0];
    var mainImageFile      = mainImageInput && mainImageInput.files.length > 0
      ? mainImageInput.files[0]
      : null;
    var secondaryImageFiles = secondaryImageInput
      ? Array.prototype.slice.call(secondaryImageInput.files)
      : [];
    var specifications = getAddedSpecifications();
    var $form = $('#addProductForm');
    var editProductId = $form.data('edit-product-id');
    var existingThumbnail = $form.data('existing-thumbnail');
    var existingImages = $form.data('existing-images') || [];
    var existingStatus = $form.data('existing-status') || 'active';
    var editType = $form.data('edit-type') || 'store';

    if (!name || (!isRental && price <= 0)) {
      window.showAdminToast(isRental ? '請填寫商品名稱' : '請填寫商品名稱和有效的價格', 'danger');
      return;
    }

    if (isRental && !rentalCampState.valid) {
      window.showAdminToast('請至少新增 1 個存放營地，並填寫營地名稱', 'danger');
      return;
    }

    if (isRental) {
      var rentalEditId = editType === 'rental' ? editProductId : null;
      var rentalCamps = rentalCampState.camps;
      var rentalItem = {
        id: rentalEditId || 'R-NEW-' + Date.now(),
        image: mainImageFile ? URL.createObjectURL(mainImageFile) : (existingThumbnail || PRODUCT_IMAGE_PLACEHOLDER),
        name: name,
        category: category || '其他',
        camp: rentalCamps
      };

      rentalItem = upsertAdminRentalCache(rentalItem);

      if (rentalEditId) {
        $('#rentalProductsTableBody tr[data-product-id="' + escapeSelector(rentalEditId) + '"]')
          .replaceWith($(buildRentalRow(rentalItem)).hide().fadeIn(400));
      } else {
        $('#rentalProductsTableBody').prepend($(buildRentalRow(rentalItem)).hide().fadeIn(400));
      }

      resetProductModalForm();
      switchProductView('rental');
      var rentalModal = bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal'));
      rentalModal.hide();
      window.showAdminToast('租借商品「' + name + '」已' + (editProductId ? '更新' : '新增'));
      return;
    }

    var storeEditId = editType === 'store' ? editProductId : null;
    var newProduct = {
      id: storeEditId || 'P-NEW-' + Date.now(),
      thumbnail: mainImageFile ? URL.createObjectURL(mainImageFile) : (existingThumbnail || PRODUCT_IMAGE_PLACEHOLDER),
      name: name,
      category: category || '其他',
      spec: $('#newProductSpec').val().trim(),
      price: price,
      'total-stock': stock,
      branch: splitBranchStock(stock),
      status: existingStatus,
      images: secondaryImageFiles.length > 0
        ? secondaryImageFiles.map(function (file) {
          return file.name;
        })
        : existingImages,
      specifications: specifications
    };

    upsertAdminProductCache(newProduct);

    if (storeEditId) {
      $('#productsTableBody tr[data-product-id="' + escapeSelector(storeEditId) + '"]')
        .replaceWith($(buildProductRow(newProduct)).hide().fadeIn(400));
    } else {
      $('#productsTableBody').prepend($(buildProductRow(newProduct)).hide().fadeIn(400));
    }

    resetProductModalForm();

    var modal = bootstrap.Modal.getOrCreateInstance(document.getElementById('addProductModal'));
    modal.hide();

    window.showAdminToast('商品「' + name + '」已' + (editProductId ? '更新' : '新增'));
  });
};

function bindProductViewTabs() {
  $(document).on('click.products', '.admin-product-tab', function () {
    switchProductView($(this).data('products-view'));
  });
}

function switchProductView(view) {
  var nextView = view === 'rental' ? 'rental' : 'store';

  $('.admin-product-tab')
    .removeClass('active')
    .attr('aria-selected', 'false');

  $('.admin-product-tab[data-products-view="' + nextView + '"]')
    .addClass('active')
    .attr('aria-selected', 'true');

  $('.admin-products-panel').each(function () {
    var $panel = $(this);
    $panel.toggleClass('d-none', $panel.data('products-panel') !== nextView);
  });

  if (nextView === 'rental') {
    loadRentalProducts();
  }
}

function loadRentalProducts() {
  if (adminRentalsLoaded) {
    renderRentalProductsTable(adminRentalsCache);
    return;
  }

  $('#rentalProductsTableBody').html(
    '<tr><td colspan="5" class="text-center py-4">' +
    '<div class="spinner-border spinner-border-sm me-2" style="color: var(--admin-brand-accent);"></div>' +
    '<span class="text-muted">載入租借商品中...</span>' +
    '</td></tr>'
  );

  $.getJSON('data/reantal.json', function (rentals) {
    var pendingItems = adminRentalsCache.slice();
    var rentalIdMap = {};

    adminRentalsCache = (rentals || []).map(normalizeRentalItem);
    adminRentalsCache.forEach(function (item) {
      rentalIdMap[item.id] = true;
    });

    pendingItems.forEach(function (item) {
      if (!rentalIdMap[item.id]) {
        adminRentalsCache.unshift(item);
      }
    });

    adminRentalsLoaded = true;
    renderRentalProductsTable(adminRentalsCache);
  }).fail(function () {
    $('#rentalProductsTableBody').html(
      '<tr><td colspan="5" class="text-center text-danger py-4">' +
      '<i class="fas fa-exclamation-triangle me-2"></i>載入租借商品數據失敗' +
      '</td></tr>'
    );
  });
}

// 將租借商品資料統一成 camp 陣列，庫存由各營地 quantity 加總取得。
function normalizeRentalItem(item) {
  var camps = normalizeRentalCamps(item && (item.camp || item.storageCamp), item && item.quantity);

  return {
    id: item && item.id ? item.id : 'R-NEW-' + Date.now(),
    image: (item && (item.image || item.thumbnail)) || PRODUCT_IMAGE_PLACEHOLDER,
    name: (item && item.name) || '未命名租借商品',
    category: (item && item.category) || '其他',
    camp: camps
  };
}

// 依租借商品 ID 從目前快取中取出資料。
function findAdminRentalById(rentalId) {
  return (adminRentalsCache || []).find(function (item) {
    return item.id === rentalId;
  });
}

// 新增或更新租借商品快取，保留與 reantal.json 相同的 camp 陣列格式。
function upsertAdminRentalCache(rentalItem) {
  var normalizedItem = normalizeRentalItem(rentalItem);
  var index = adminRentalsCache.findIndex(function (item) {
    return item.id === normalizedItem.id;
  });

  if (index >= 0) {
    adminRentalsCache[index] = normalizedItem;
  } else {
    adminRentalsCache.unshift(normalizedItem);
  }

  return normalizedItem;
}

// 租借列表的快速庫存調整會改寫 camp 陣列總量，維持列表總庫存與營地明細一致。
function confirmRentalStockChange($row, rentalId, $button) {
  var rental = findAdminRentalById(rentalId);

  if (!rental) {
    window.showAdminToast('找不到租借商品 ' + rentalId + ' 的資料', 'danger');
    return;
  }

  var quantity = getRowStockValue($row, 'quantity');
  rental.camp = setRentalCampTotal(rental.camp, quantity);

  $row.toggleClass('table-danger', quantity < 5);
  setRowOriginalStockValues($row);
  syncStockConfirmState($row);

  window.showAdminToast('租借商品 ' + rentalId + ' 數量已更新');
}

// 切換租借模式時，顯示多營地欄位，並讓初始庫存改由營地數量加總決定。
function syncRentalFormState(isRental) {
  $('#rentalCampField').toggleClass('d-none', !isRental);
  $('.rental-camp-name-input').prop('required', isRental);
  $('#newProductPrice').prop('required', !isRental);
  $('#newProductStock')
    .prop('readonly', isRental)
    .toggleClass('bg-light', isRental);

  if (isRental && $('#rentalCampList .rental-camp-row').length === 0) {
    appendRentalCampField('', 0);
  }

  if (isRental) {
    updateRentalStockFromCampFields();
  }
}

// 產生一列租借營地輸入，第一列名稱欄位會保留 #newRentalCamp 供既有 selector 使用。
function appendRentalCampField(campName, quantity) {
  var shouldAssignId = $('#newRentalCamp').length === 0;
  var $row = $('<div>', { class: 'input-group input-group-sm rental-camp-row' });
  var $label = $('<span>', { class: 'input-group-text' }).text('營地');
  var $nameInput = $('<input>', {
    type: 'text',
    class: 'form-control rental-camp-name-input',
    placeholder: '例：湖畔星空營地'
  }).val(campName || '');
  var $quantityInput = $('<input>', {
    type: 'number',
    class: 'form-control rental-camp-quantity-input',
    min: '0',
    value: normalizeStockValue(quantity),
    'aria-label': '營地存放數量'
  });
  var $removeButton = $('<button>', {
    type: 'button',
    class: 'btn btn-outline-danger remove-rental-camp-btn',
    title: '移除營地'
  }).html('<i class="fas fa-times"></i>');

  if (shouldAssignId) {
    $nameInput.attr('id', 'newRentalCamp');
  }

  if ($('#newProductIsRental').is(':checked')) {
    $nameInput.prop('required', true);
  }

  $row.append($label, $nameInput, $quantityInput, $removeButton);
  $('#rentalCampList').append($row);
  ensureRentalCampInputId();
  return $row;
}

// 移除或重建營地列後，確保第一個營地名稱欄位固定使用 #newRentalCamp。
function ensureRentalCampInputId() {
  var $inputs = $('#rentalCampList .rental-camp-name-input');
  $inputs.removeAttr('id');
  $inputs.first().attr('id', 'newRentalCamp');
}

// 將既有 camp 陣列回填到 Modal 的多營地輸入列。
function populateRentalCampFields(camps) {
  var normalizedCamps = normalizeRentalCamps(camps);

  $('#rentalCampList').empty();

  if (normalizedCamps.length === 0) {
    appendRentalCampField('', 0);
  } else {
    normalizedCamps.forEach(function (camp) {
      appendRentalCampField(camp.name, camp.quantity);
    });
  }

  ensureRentalCampInputId();
  updateRentalStockFromCampFields();
}

// 收集 Modal 內的營地資料，空白列不寫入 camp 陣列。
function collectRentalCampFields() {
  var camps = [];
  var hasInvalidCamp = false;
  var rowCount = $('#rentalCampList .rental-camp-row').length;

  $('#rentalCampList .rental-camp-row').each(function () {
    var $row = $(this);
    var $nameInput = $row.find('.rental-camp-name-input');
    var name = $nameInput.val().trim();
    var quantity = normalizeStockValue($row.find('.rental-camp-quantity-input').val());
    var isBlankExtraRow = !name && quantity === 0 && rowCount > 1;

    $nameInput.toggleClass('is-invalid', !name && !isBlankExtraRow);

    if (isBlankExtraRow) {
      return;
    }

    if (!name) {
      hasInvalidCamp = true;
      return;
    }

    camps.push({
      name: name,
      quantity: quantity
    });
  });

  return {
    valid: !hasInvalidCamp && camps.length > 0,
    camps: camps
  };
}

// 依目前營地數量欄位加總，回填租借商品的唯讀初始庫存。
function updateRentalStockFromCampFields() {
  var total = 0;

  $('#rentalCampList .rental-camp-quantity-input').each(function () {
    total += normalizeStockValue($(this).val());
  });

  $('#newProductStock').val(total);
}

// 統一設定新增 / 編輯商品 Modal 的標題與送出按鈕文字。
function setProductModalMode(mode) {
  var isEdit = mode === 'edit';
  var iconClass = isEdit ? 'fa-pen' : 'fa-plus';

  $('#addProductModalLabel').html(
    '<i class="fas ' + iconClass + ' me-2"></i>' + (isEdit ? '編輯商品' : '新增商品')
  );
  $('#submitAddProduct').html(
    '<i class="fas ' + iconClass + ' me-1"></i>' + (isEdit ? '更新商品' : '建立商品')
  );
}

function normalizeProductBranch(product) {
  if (!product) {
    return product;
  }

  var totalStock = getProductTotalStock(product);

  if (!product.branch || typeof product.branch !== 'object') {
    product.branch = splitBranchStock(totalStock);
  } else {
    ADMIN_PRODUCT_BRANCH_IDS.forEach(function (branchId) {
      product.branch[branchId] = normalizeStockValue(product.branch[branchId]);
    });
  }

  product['total-stock'] = totalStock;
  delete product.stock;
  return product;
}

function splitBranchStock(totalStock) {
  var total = Math.max(parseInt(totalStock, 10) || 0, 0);
  var baseQty = Math.floor(total / ADMIN_PRODUCT_BRANCH_IDS.length);
  var remainder = total % ADMIN_PRODUCT_BRANCH_IDS.length;
  var branchStock = {};

  ADMIN_PRODUCT_BRANCH_IDS.forEach(function (branchId, index) {
    branchStock[branchId] = baseQty + (index < remainder ? 1 : 0);
  });

  return branchStock;
}

function getProductTotalStock(product) {
  var totalStock = parseInt(product && product['total-stock'], 10);
  if (!isNaN(totalStock)) {
    return Math.max(totalStock, 0);
  }

  if (product && product.branch && typeof product.branch === 'object') {
    return getBranchTotal(product.branch);
  }

  var stock = parseInt(product && product.stock, 10);
  return isNaN(stock) ? 0 : Math.max(stock, 0);
}

function getProductBranchStock(product, branchId) {
  if (!product || !product.branch || typeof product.branch !== 'object') {
    return 0;
  }

  return normalizeStockValue(product.branch[branchId]);
}

function normalizeStockValue(value) {
  var qty = parseInt(value, 10);
  return isNaN(qty) ? 0 : Math.max(qty, 0);
}

// 正規化租借商品的 camp 欄位，支援新版陣列與舊版單一字串。
function normalizeRentalCamps(campValue, legacyQuantity) {
  var camps = [];

  if (Array.isArray(campValue)) {
    camps = campValue.map(function (camp) {
      if (typeof camp === 'string') {
        return { name: camp.trim(), quantity: 0 };
      }

      return {
        name: (camp && (camp.name || camp.camp || camp.title)) || '',
        quantity: normalizeStockValue(camp && camp.quantity !== undefined ? camp.quantity : camp && camp.stock)
      };
    });
  } else if (campValue && typeof campValue === 'object') {
    if (campValue.name || campValue.camp || campValue.title) {
      camps = [{
        name: campValue.name || campValue.camp || campValue.title,
        quantity: normalizeStockValue(campValue.quantity !== undefined ? campValue.quantity : campValue.stock)
      }];
    } else {
      camps = Object.keys(campValue).map(function (name) {
        return {
          name: name,
          quantity: normalizeStockValue(campValue[name])
        };
      });
    }
  } else if (typeof campValue === 'string' && campValue.trim()) {
    camps = [{
      name: campValue.trim(),
      quantity: normalizeStockValue(legacyQuantity)
    }];
  }

  return camps.filter(function (camp) {
    return camp.name;
  }).map(function (camp) {
    return {
      name: String(camp.name).trim(),
      quantity: normalizeStockValue(camp.quantity)
    };
  });
}

// 計算租借商品所有營地的庫存總量。
function getRentalCampTotal(camps) {
  return (camps || []).reduce(function (sum, camp) {
    return sum + normalizeStockValue(camp && camp.quantity);
  }, 0);
}

// 從租借商品物件計算列表要顯示的庫存總量。
function getRentalTotalStock(rental) {
  return getRentalCampTotal(normalizeRentalCamps(rental && rental.camp, rental && rental.quantity));
}

// 快速調整租借總量時，將差額寫回既有營地數量。
function setRentalCampTotal(camps, nextTotal) {
  var targetTotal = normalizeStockValue(nextTotal);
  var normalizedCamps = normalizeRentalCamps(camps);

  if (normalizedCamps.length === 0) {
    return [{ name: '未指定營地', quantity: targetTotal }];
  }

  var currentTotal = getRentalCampTotal(normalizedCamps);
  var delta = targetTotal - currentTotal;

  if (delta > 0) {
    normalizedCamps[0].quantity += delta;
  } else if (delta < 0) {
    var remaining = Math.abs(delta);
    for (var index = normalizedCamps.length - 1; index >= 0 && remaining > 0; index -= 1) {
      var reducibleQty = Math.min(normalizedCamps[index].quantity, remaining);
      normalizedCamps[index].quantity -= reducibleQty;
      remaining -= reducibleQty;
    }
  }

  return normalizedCamps;
}

function getBranchTotal(branchStock) {
  return ADMIN_PRODUCT_BRANCH_IDS.reduce(function (sum, branchId) {
    return sum + normalizeStockValue(branchStock && branchStock[branchId]);
  }, 0);
}

function getBranchLabel(branchId) {
  return ADMIN_PRODUCT_BRANCH_LABELS[branchId] || branchId;
}

function buildMovementItemsForBranchChange(product, nextBranchStock) {
  var sources = [];
  var receivers = [];
  var items = [];

  ADMIN_PRODUCT_BRANCH_IDS.forEach(function (branchId) {
    var previousQty = getProductBranchStock(product, branchId);
    var nextQty = normalizeStockValue(nextBranchStock && nextBranchStock[branchId]);
    var delta = nextQty - previousQty;

    if (delta < 0) {
      sources.push({
        branchId: branchId,
        storeName: getBranchLabel(branchId),
        quantity: Math.abs(delta)
      });
    } else if (delta > 0) {
      receivers.push({
        branchId: branchId,
        storeName: getBranchLabel(branchId),
        quantity: delta
      });
    }
  });

  if (sources.length > 0 && receivers.length === 0) {
    return {
      valid: false,
      message: '分店庫存全部為減少，這是不合法操作',
      items: []
    };
  }

  if (sources.length === 0 && receivers.length === 0) {
    return {
      valid: true,
      message: '',
      items: []
    };
  }

  if (sources.length === 0) {
    receivers.forEach(function (receiver) {
      items.push({
        productName: product.name,
        quantity: receiver.quantity,
        fromStore: '進貨',
        toStore: receiver.storeName
      });
    });

    return {
      valid: true,
      message: '',
      items: items
    };
  }

  var sourceTotal = sources.reduce(function (sum, source) {
    return sum + source.quantity;
  }, 0);
  var receiverTotal = receivers.reduce(function (sum, receiver) {
    return sum + receiver.quantity;
  }, 0);

  if (sourceTotal > receiverTotal) {
    return {
      valid: false,
      message: '分店減少數量大於增加數量，無法生成合法配送異動',
      items: []
    };
  }

  var sourceIndex = 0;
  receivers.forEach(function (receiver) {
    var remainingReceiverQty = receiver.quantity;

    while (remainingReceiverQty > 0 && sourceIndex < sources.length) {
      var source = sources[sourceIndex];
      var moveQty = Math.min(source.quantity, remainingReceiverQty);

      items.push({
        productName: product.name,
        quantity: moveQty,
        fromStore: source.storeName,
        toStore: receiver.storeName
      });

      source.quantity -= moveQty;
      remainingReceiverQty -= moveQty;

      if (source.quantity === 0) {
        sourceIndex += 1;
      }
    }

    if (remainingReceiverQty > 0) {
      items.push({
        productName: product.name,
        quantity: remainingReceiverQty,
        fromStore: '進貨',
        toStore: receiver.storeName
      });
    }
  });

  return {
    valid: true,
    message: '',
    items: items
  };
}

function getStockInputValue($input) {
  return normalizeStockValue($input.val());
}

function getRowStockValue($row, fieldName) {
  return getStockInputValue($row.find('.stock-input[data-stock-field="' + fieldName + '"]'));
}

// 檢查同一列庫存欄位是否異動，並同步確定按鈕顯示狀態。
function syncStockConfirmState($row) {
  var hasChanged = $row.find('.stock-input').toArray().some(function (input) {
    var $input = $(input);
    var originalQty = normalizeStockValue($input.attr('data-original-qty'));
    return getStockInputValue($input) !== originalQty;
  });

  syncStockInputFeedback($row);
  $row.find('.stock-confirm-btn')
    .prop('disabled', !hasChanged)
    .toggleClass('d-none', !hasChanged);
}

// 確認庫存後，將目前欄位值寫回原始值，作為下一次異動比較基準。
function setRowOriginalStockValues($row) {
  $row.find('.stock-input').each(function () {
    var $input = $(this);
    var qty = getStockInputValue($input);

    $input
      .val(qty)
      .attr('data-original-qty', qty)
      .data('original-qty', qty);
  });

  syncStockInputFeedback($row);
}

// 依變更方向標示庫存欄位顏色，總庫存欄位改以分店加總作為比較基準。
function syncStockInputFeedback($row) {
  var inventoryType = $row.data('inventory-type') || 'store';
  var branchTotal = 0;

  if (inventoryType === 'store') {
    ADMIN_PRODUCT_BRANCH_IDS.forEach(function (branchId) {
      branchTotal += getRowStockValue($row, branchId);
    });
  }

  $row.find('.stock-input').each(function () {
    var $input = $(this);
    var currentQty = getStockInputValue($input);
    var originalQty = normalizeStockValue($input.attr('data-original-qty'));
    var fieldName = String($input.data('stock-field') || '');

    $input.removeClass('stock-input-increase stock-input-decrease');

    if (inventoryType === 'store' && fieldName === 'total-stock') {
      if (currentQty < branchTotal) {
        $input.addClass('stock-input-decrease');
      } else if (currentQty > branchTotal) {
        $input.addClass('stock-input-increase');
      }
      return;
    }

    if (currentQty > originalQty) {
      $input.addClass('stock-input-increase');
    } else if (currentQty < originalQty) {
      $input.addClass('stock-input-decrease');
    }
  });
}

function updateMovementGenerateButtonState() {
  $('#generateMovementRecord').prop('disabled', pendingMovementItems.length === 0);
}

// 取得目前登入員工 ID，寫入新建立的庫存異動紀錄。
function getCurrentAdminId() {
  return sessionStorage.getItem('adminId') || '—';
}

function createMovementRecordId() {
  var existingRecords = [];

  if (Array.isArray(window.movementCache)) {
    existingRecords = existingRecords.concat(window.movementCache);
  }

  if (Array.isArray(window.generatedMovementRecords)) {
    existingRecords = existingRecords.concat(window.generatedMovementRecords);
  }

  var maxNumber = existingRecords.reduce(function (max, record) {
    var match = String(record && record.id || '').match(/MV(\d+)/);
    var num = match ? parseInt(match[1], 10) : 0;
    return Math.max(max, isNaN(num) ? 0 : num);
  }, 20);

  return 'MV' + String(maxNumber + 1).padStart(3, '0');
}

function formatMovementDate(date) {
  var pad = function (num) {
    return String(num).padStart(2, '0');
  };

  return date.getFullYear() + '-' +
    pad(date.getMonth() + 1) + '-' +
    pad(date.getDate()) + ' ' +
    pad(date.getHours()) + ':' +
    pad(date.getMinutes()) + ':' +
    pad(date.getSeconds());
}

function buildStockControl(fieldName, qty, label) {
  var safeQty = normalizeStockValue(qty);

  return '<div class="input-group input-group-sm admin-stock-control">' +
    '<button type="button" class="btn btn-outline-secondary stock-step-btn" ' +
    'data-stock-action="decrement" title="' + escapeHtml(label) + ' 減少">' +
    '<i class="fas fa-minus"></i></button>' +
    '<input type="number" class="form-control text-center stock-input" ' +
    'min="0" value="' + safeQty + '" data-original-qty="' + safeQty + '" ' +
    'data-stock-field="' + escapeHtml(fieldName) + '" aria-label="' + escapeHtml(label) + '">' +
    '<button type="button" class="btn btn-outline-secondary stock-step-btn" ' +
    'data-stock-action="increment" title="' + escapeHtml(label) + ' 增加">' +
    '<i class="fas fa-plus"></i></button>' +
    '</div>';
}

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

function findAdminProductById(productId) {
  return (adminProductsCache || []).find(function (product) {
    return product.id === productId;
  });
}

// 將商店商品資料回填到新增商品 Modal，切換為編輯狀態。
function fillProductModal(product) {
  resetProductModalForm();
  setProductModalMode('edit');

  $('#addProductForm')
    .data('edit-product-id', product.id)
    .data('edit-type', 'store')
    .data('existing-thumbnail', product.thumbnail || PRODUCT_IMAGE_PLACEHOLDER)
    .data('existing-images', product.images || [])
    .data('existing-status', product.status || 'active');

  syncRentalFormState(false);
  $('#newProductIsRental').prop('checked', false);
  $('#newProductStock').prop('readonly', false).removeClass('bg-light');
  $('#newProductName').val(product.name || '');
  $('#newProductCategory').val(product.category || '');
  $('#newProductSpec').val(product.spec || '');
  $('#newProductPrice').val(product.price || '');
  $('#newProductStock').val(getProductTotalStock(product));

  if (product.specifications && typeof product.specifications === 'object') {
    Object.keys(product.specifications).forEach(function (key) {
      addSpecificationField(key, product.specifications[key]);
    });
  }
}

// 將租借商品資料回填到新增商品 Modal，並帶入各營地庫存明細。
function fillRentalModal(rental) {
  resetProductModalForm();
  setProductModalMode('edit');

  $('#addProductForm')
    .data('edit-product-id', rental.id)
    .data('edit-type', 'rental')
    .data('existing-thumbnail', rental.image || PRODUCT_IMAGE_PLACEHOLDER)
    .data('existing-images', [])
    .data('existing-status', 'active');

  $('#newProductIsRental').prop('checked', true);
  syncRentalFormState(true);
  $('#newProductName').val(rental.name || '');
  $('#newProductCategory').val(rental.category || '其他');
  $('#newProductSpec').val('');
  $('#newProductPrice').val('');
  populateRentalCampFields(rental.camp);
  $('#newProductStock').val(getRentalTotalStock(rental)).prop('readonly', true).addClass('bg-light');
}

// 重設新增商品 Modal 的欄位、暫存狀態與租借營地清單。
function resetProductModalForm() {
  var form = $('#addProductForm')[0];
  if (form) {
    form.reset();
  }

  $('#addProductForm')
    .removeData('edit-product-id')
    .removeData('edit-type')
    .removeData('existing-thumbnail')
    .removeData('existing-images')
    .removeData('existing-status');
  $('#productSpecFields').empty();
  $('#rentalCampList').empty();
  $('#newProductIsRental').prop('checked', false);
  $('#newProductStock').prop('readonly', false).removeClass('bg-light').val('0');
  setProductModalMode('add');
  syncRentalFormState(false);
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
  var stock    = getProductTotalStock(p);
  var isLow    = stock < 5;
  var rowClass = isLow ? ' class="table-danger"' : '';
  var imgSrc = p.thumbnail || PRODUCT_IMAGE_PLACEHOLDER;

  return '<tr data-product-id="' + escapeHtml(p.id) + '" data-inventory-type="store"' + rowClass + '>' +
    '<td><img src="' + escapeHtml(imgSrc) + '" width="48" height="48" class="rounded object-fit-cover"' +
    ' onerror="this.src=\'' + PRODUCT_IMAGE_PLACEHOLDER + '\'"></td>' +
    '<td class="fw-semibold">' + escapeHtml(p.name) + '</td>' +
    '<td><span class="badge bg-light text-dark border">' + escapeHtml(p.category || '—') + '</span></td>' +
    '<td class="stock-cell">' + buildStockControl('total-stock', stock, '總庫存量') + '</td>' +
    '<td class="stock-cell">' + buildStockControl('branch-001', getProductBranchStock(p, 'branch-001'), '分店 A') + '</td>' +
    '<td class="stock-cell">' + buildStockControl('branch-002', getProductBranchStock(p, 'branch-002'), '分店 B') + '</td>' +
    '<td class="stock-cell">' + buildStockControl('branch-003', getProductBranchStock(p, 'branch-003'), '分店 C') + '</td>' +
    '<td>' +
    '<div class="d-flex flex-wrap gap-1">' +
    '<button type="button" class="btn btn-sm btn-outline-secondary edit-product-btn" title="編輯商品">' +
    '<i class="fas fa-pen me-1"></i>編輯' +
    '</button>' +
    '<button type="button" class="btn btn-sm btn-success stock-confirm-btn d-none" title="確定庫存異動" disabled>' +
    '<i class="fas fa-check me-1"></i>確定' +
    '</button>' +
    '</div>' +
    '</td>' +
    '</tr>';
}

function buildRentalRow(item) {
  var rental = normalizeRentalItem(item);
  var stock = getRentalTotalStock(rental);
  var isLow = stock < 5;
  var rowClass = isLow ? ' class="table-danger"' : '';

  return '<tr data-product-id="' + escapeHtml(rental.id) + '" data-inventory-type="rental"' + rowClass + '>' +
    '<td><img src="' + escapeHtml(rental.image) + '" width="48" height="48" class="rounded object-fit-cover"' +
    ' onerror="this.src=\'' + PRODUCT_IMAGE_PLACEHOLDER + '\'"></td>' +
    '<td class="fw-semibold">' + escapeHtml(rental.name) + '</td>' +
    '<td><span class="badge bg-light text-dark border">' + escapeHtml(rental.category || '其他') + '</span></td>' +
    '<td class="stock-cell">' + buildStockControl('quantity', stock, '租借庫存') + '</td>' +
    '<td>' +
    '<div class="d-flex flex-wrap gap-1">' +
    '<button type="button" class="btn btn-sm btn-outline-secondary edit-product-btn" title="編輯商品">' +
    '<i class="fas fa-pen me-1"></i>編輯' +
    '</button>' +
    '<button type="button" class="btn btn-sm btn-success stock-confirm-btn d-none" title="確定庫存異動" disabled>' +
    '<i class="fas fa-check me-1"></i>確定' +
    '</button>' +
    '</div>' +
    '</td>' +
    '</tr>';
}

function escapeSelector(value) {
  return String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

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
      '<tr><td colspan="8" class="text-center text-muted py-4">目前沒有商品</td></tr>' +
      buildMovementGenerateRow()
    );
    updateMovementGenerateButtonState();
    if (typeof window.applyEditPermission === 'function') {
      window.applyEditPermission('products', $('#contentArea'));
    }
    return;
  }

  var html = products.map(function (p) {
    return buildProductRow(p);
  }).join('');

  $('#productsTableBody').html(html + buildMovementGenerateRow());
  updateMovementGenerateButtonState();

  if (typeof window.applyEditPermission === 'function') {
    window.applyEditPermission('products', $('#contentArea'));
  }
}

function buildMovementGenerateRow() {
  return '<tr class="movement-generate-row">' +
    '<td colspan="8" class="text-end bg-white">' +
    '<button type="button" class="btn btn-sm btn-outline-success" id="generateMovementRecord" disabled>' +
    '生產異動紀錄' +
    '</button>' +
    '</td>' +
    '</tr>';
}

// 將租借商品快取渲染到租借表格，庫存欄位使用 camp 數量加總。
function renderRentalProductsTable(rentals) {
  if (!rentals || rentals.length === 0) {
    $('#rentalProductsTableBody').html(
      '<tr><td colspan="5" class="text-center text-muted py-4">目前沒有租借商品</td></tr>'
    );
    return;
  }

  var html = rentals.map(function (item) {
    return buildRentalRow(item);
  }).join('');

  $('#rentalProductsTableBody').html(html);

  if (typeof window.applyEditPermission === 'function') {
    window.applyEditPermission('products', $('#contentArea'));
  }
}
