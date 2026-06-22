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

// 主倉固定 ID 與顯示名稱，統一使用此常數，避免魔法字串散落各函式
// Warehouse main ID/label constants — use these everywhere to avoid magic strings
var ADMIN_WAREHOUSE_MAIN_ID = 'main';
var ADMIN_WAREHOUSE_MAIN_LABEL = '主倉';

// 商店分店 ID 清單：主倉排第一，其餘為實體分店
// Store branch IDs: main warehouse first, then physical branches
var ADMIN_PRODUCT_BRANCH_IDS = ['main', 'branch-001', 'branch-002', 'branch-003'];
var ADMIN_PRODUCT_BRANCH_LABELS = {
  'main': '主倉',
  'branch-001': '分店 A',
  'branch-002': '分店 B',
  'branch-003': '分店 C'
};
// 租借商品固定營地 ID：主倉排第一，其餘為實體營地（對應 ADMIN_RENTAL_CAMP_LABELS 的 key）
// Rental camp IDs: main warehouse first, then fixed camp IDs (keys for ADMIN_RENTAL_CAMP_LABELS)
var ADMIN_RENTAL_CAMP_IDS = ['main', 'camp-001', 'camp-002', 'camp-003', 'camp-004', 'camp-005'];

// 租借商品固定營地顯示名稱（對應 reantal.json 內的 camp[].name）
// Display labels for fixed rental camps (matched against camp[].name in reantal.json)
var ADMIN_RENTAL_CAMP_LABELS = {
  'main': '主倉',
  'camp-001': '湖畔星空',
  'camp-002': '松林野營',
  'camp-003': '溪谷森林',
  'camp-004': '雲海高原',
  'camp-005': '海岸微風'
};

// 完整名稱（用於 reantal.json 寫回與 Modal 顯示）
// Full names used when writing back to reantal.json and displaying in Modal
var ADMIN_RENTAL_CAMP_FULL_NAMES = {
  'main': '主倉',
  'camp-001': '湖畔星空營地',
  'camp-002': '松林野營基地',
  'camp-003': '溪谷森林營地',
  'camp-004': '雲海高原營地',
  'camp-005': '海岸微風營地'
};

var adminProductsCache = [];
var adminRentalsCache = [];
var adminRentalsLoaded = false;
var pendingMovementItems = [];
// 租借待處理的庫存異動明細（與商店的 pendingMovementItems 分開追蹤）
// Pending rental movement items, tracked separately from store items
var pendingRentalMovementItems = [];

window.initProducts = function () {
  $(document).off('.products');
  bindProductViewTabs();

  // ── 讀取並消費 pendingNavFilter（從 KPI 卡片「低庫存商品」跳來時） ──
  var _showLowStock = false;
  if (window.pendingNavFilter && window.pendingNavFilter.section === 'products') {
    _showLowStock           = !!window.pendingNavFilter.lowStockOnly;
    window.pendingNavFilter = null; // 消費後立即清除
  }

  $.getJSON('data/products.json', function (products) {
    adminProductsCache = (products || []).map(normalizeProductBranch);
    renderProductsTable(adminProductsCache);

    // 低庫存導航：渲染完成後，捲動到第一列紅色（低庫存）商品並顯示提示
    if (_showLowStock) {
      // 稍微延遲確保 DOM 已完整插入
      setTimeout(function () {
        var $firstLowStock = $('#productsTableBody tr.table-danger').first();
        if ($firstLowStock.length) {
          // 滾動到低庫存列（目標頁上方保留 80px 間距，避免被 topbar 遮住）
          $('html, body').animate({
            scrollTop: $firstLowStock.offset().top - 80
          }, 300);
          window.showAdminToast('已標示庫存不足的商品（紅色列）', 'info');
        } else {
          window.showAdminToast('目前所有商品庫存充足', 'info');
        }
      }, 100);
    }
  }).fail(function () {
    $('#productsTableBody').html(
      '<tr><td colspan="8" class="text-center text-danger py-4">' +
      '<i class="fas fa-exclamation-triangle me-2"></i>載入商品數據失敗' +
      '</td></tr>'
    );
  });

  // 頁面初始化時即預載租借資料（Eager Loading）
  // 確保使用者尚未切換到租借頁籤就開啟調撥 Modal 時，adminRentalsCache 已可用
  // loadRentalProducts() 內有 adminRentalsLoaded 冪等保護，不會重複請求
  loadRentalProducts();

  loadProductSpecOptions();

  // 從列表開啟新增商品 Modal 時，清空上一次編輯狀態
  $(document).on('click.products', '[data-bs-target="#addProductModal"]:not(.edit-product-btn)', function () {
    resetProductModalForm();
  });

  // 新增商品 Modal：切換租借商品時，顯示 / 隱藏多營地庫存欄位。
  $(document).on('change.products', '#newProductIsRental', function () {
    syncRentalFormState($(this).is(':checked'));
  });

  // 固定營地 checkbox：勾選時啟用數量輸入；取消勾選時清零並 disabled。
  // Preset camp checkbox: enable qty input on check, clear and disable on uncheck.
  // 編輯模式額外防呆：數量 > 0 時不允許取消勾選，需先歸零。
  // Edit mode extra guard: prevent unchecking if qty > 0, user must zero first.
  $(document).on('change.products', '.rental-camp-check', function () {
    var $checkbox = $(this);
    var $row = $checkbox.closest('.rental-camp-preset-row');
    var $qty = $row.find('.rental-camp-quantity-input');
    var checked = $checkbox.is(':checked');

    // 只在「編輯租借商品」模式下啟用防呆（新增時不限制）
    // Only apply the guard when editing a rental product, not when adding a new one
    var isEditingRental = ($('#addProductForm').data('edit-type') === 'rental');

    if (!checked && isEditingRental) {
      var qty = normalizeStockValue($qty.val());
      if (qty > 0) {
        // 阻止：恢復勾選，顯示警告
        $checkbox.prop('checked', true);
        var campName = $row.find('.input-group-text').last().text().trim();
        window.showAdminToast('請先將「' + campName + '」庫存歸零，才能取消勾選', 'danger');
        return;
      }
    }

    $qty.prop('disabled', !checked);
    if (!checked) {
      $qty.val(0);
    }

    updateRentalStockFromCampFields();
  });

  // 新增自訂營地按鈕：每次點擊新增一列自訂名稱 + 數量欄位。
  // Add custom camp row on button click.
  $(document).on('click.products', '#addRentalCamp', function () {
    appendRentalCampField('', 0);
    updateRentalStockFromCampFields();
  });

  // 租借營地資料異動時，重新加總各營地數量並同步到唯讀庫存欄位。
  $(document).on('input.products change.products', '.rental-camp-name-input, .rental-camp-quantity-input', function () {
    updateRentalStockFromCampFields();
  });

  // 自訂營地列可移除。
  // Custom camp rows can be removed.
  $(document).on('click.products', '.remove-rental-camp-btn', function () {
    $(this).closest('.rental-camp-row').remove();
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

  // 庫存確認：讀取所有分店（含主倉）的數值，自動計算 total，寫回快取並更新畫面。
  // Stock confirm: read all branch values (including main), auto-compute total, update cache and UI.
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

    // 讀取所有分店（含主倉）的數值
    // Read all branch values including main warehouse
    var branchStock = {};
    ADMIN_PRODUCT_BRANCH_IDS.forEach(function (branchId) {
      branchStock[branchId] = getRowStockValue($row, branchId);
    });

    // total 由各分店加總自動計算（不再手動輸入）
    // total is always auto-computed from branch sum — no manual input
    var totalStock = getBranchTotal(branchStock);

    var movementResult = buildMovementItemsForBranchChange(product, branchStock);
    if (!movementResult.valid) {
      window.showAdminToast(movementResult.message, 'danger');
      return;
    }

    product['total-stock'] = totalStock;
    product.branch = branchStock;
    delete product.stock;

    // 更新唯讀 total 欄位的靜態顯示數字
    // Refresh the read-only total display cell
    $row.find('.total-stock-value').text(totalStock);
    $row.toggleClass('table-danger', totalStock < 5);
    setRowOriginalStockValues($row);
    syncStockConfirmState($row);

    if (movementResult.items.length > 0) {
      pendingMovementItems = pendingMovementItems.concat(movementResult.items);
      updateMovementGenerateButtonState();
    }

    window.showAdminToast('商品 ' + productId + ' 庫存數量已更新');
  });

  // 將商店與租借已通過確定檢查的庫存異動，合併成一筆庫存異動紀錄。
  // Merge store and rental pending items into one movement record.
  $(document).on('click.products', '#generateMovementRecord', function () {
    var allItems = pendingMovementItems.concat(pendingRentalMovementItems);

    if (allItems.length === 0) {
      window.showAdminToast('目前沒有可生成的庫存異動明細', 'info');
      return;
    }

    var record = {
      id: createMovementRecordId(),
      date: formatMovementDate(new Date()),
      employeeId: getCurrentAdminId(),
      items: allItems
    };

    if (typeof window.addMovementRecord === 'function') {
      window.addMovementRecord(record);
    } else {
      window.generatedMovementRecords = window.generatedMovementRecords || [];
      window.generatedMovementRecords.unshift(record);
    }

    // 清空兩個佇列
    // Clear both store and rental pending queues
    pendingMovementItems = [];
    pendingRentalMovementItems = [];
    updateMovementGenerateButtonState();
    window.showAdminToast('已產生庫存異動紀錄 ' + record.id);
  });

  // 調至租借按鈕：開啟調撥 Modal 並帶入商品資料
  // Transfer-to-rental button: open the modal and populate product data
  $(document).on('click.products', '.transfer-to-rental-btn', function () {
    var productId = $(this).data('product-id');
    openTransferToRentalModal(productId);
  });

  // 來源分店切換：更新「目前庫存」顯示，並重新計算分配計數器（auto-trim 依據來源庫存）
  // Source branch changed: update stock display and recalculate distribution counter
  $(document).on('change.products', '#transferSourceBranch', function () {
    syncTransferSourceStock();
    syncTransferDistributionCounter();
  });

  // 「新增營地」按鈕：在 #transferCampRows 新增一列
  // Add camp row button: append a new distribution row
  $(document).on('click.products', '#addTransferCampRow', function () {
    var rentalId = $('#transferToRentalModal').data('target-rental-id');
    var rental   = findAdminRentalById(rentalId);
    if (rental) {
      appendTransferCampRow(rental);
    }
    syncTransferDistributionCounter();
  });

  // 刪除營地列
  // Remove camp row: remove the clicked row and update counter
  $(document).on('click.products', '.remove-transfer-camp-row', function () {
    $(this).closest('.transfer-camp-row').remove();
    refreshTransferCampSelectOptions();
    syncTransferDistributionCounter();
  });

  // 數量輸入 auto-trim：防止所有行合計超過來源庫存
  // Quantity input: auto-trim if total exceeds source stock
  $(document).on('input.products', '.transfer-camp-qty', function () {
    applyTransferCampQtyAutoTrim($(this));
    syncTransferDistributionCounter();
  });

  // 營地選單切換：過濾其他行已選用的選項
  // Camp select change: refresh all rows' options to hide already-selected camps
  $(document).on('change.products', '.transfer-camp-select', function () {
    refreshTransferCampSelectOptions();
  });

  // 確認調撥
  $(document).on('click.products', '#submitTransferToRental', function () {
    submitTransferToRental();
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

  // ── Task 5：分店庫存 checkbox 防呆 ──────────────────────────────────────────
  // 試圖取消勾選時，若該分店庫存 > 0 則阻止，並提示先歸零。
  // Prevent unchecking a branch if its quantity > 0; guide user to zero it first.
  $(document).on('change.products', '.edit-branch-check', function () {
    var $checkbox = $(this);
    var $row = $checkbox.closest('.edit-branch-row');
    var $qtyInput = $row.find('.edit-branch-quantity-input');
    var branchLabel = $row.find('.input-group-text').last().text().trim();
    var isChecked = $checkbox.is(':checked');

    if (!isChecked) {
      // 試圖取消勾選：檢查數量是否 > 0
      // Attempting to uncheck: validate quantity is zero first
      var qty = normalizeStockValue($qtyInput.val());
      if (qty > 0) {
        // 阻止：恢復勾選狀態，顯示警告
        $checkbox.prop('checked', true);
        window.showAdminToast('請先將「' + branchLabel + '」庫存歸零，才能取消勾選', 'danger');
        return;
      }
      // 數量已為 0：允許取消，禁用數量輸入框
      $qtyInput.prop('disabled', true);
    } else {
      // 勾選：啟用數量輸入框
      $qtyInput.prop('disabled', false);
    }

    updateEditBranchTotal();
  });

  // ── Task 6：分店庫存數量即時加總 ────────────────────────────────────────────
  // 每次輸入數量時，加總所有勾選分店並更新唯讀總庫存顯示。
  // Update the read-only total whenever any branch quantity changes.
  $(document).on('input.products', '.edit-branch-quantity-input', function () {
    updateEditBranchTotal();
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
      window.showAdminToast('請至少勾選 1 個存放營地（或填寫自訂營地名稱）', 'danger');
      return;
    }

    if (isRental) {
      var rentalEditId = editType === 'rental' ? editProductId : null;
      var rentalCamps = rentalCampState.camps;

      // 編輯租借商品：先做異動驗證，通過後才寫入快取與更新 UI
      // Edit rental: validate movement first, then upsert cache and update UI
      var oldRentalForMovement = rentalEditId ? findAdminRentalById(rentalEditId) : null;
      var rentalMovementItemsToAdd = [];

      if (rentalEditId && oldRentalForMovement) {
        // 將新 camp 陣列轉換為 campByKey 格式，以便與舊的 campByKey 比對
        // Convert new camp[] to campByKey for diff with old campByKey
        var nextCampByKey = {};
        ADMIN_RENTAL_CAMP_IDS.forEach(function (id) { nextCampByKey[id] = 0; });
        rentalCamps.forEach(function (camp) {
          var campId = getCampIdByName(camp.name);
          if (campId) {
            nextCampByKey[campId] = normalizeStockValue(camp.quantity);
          } else {
            nextCampByKey[camp.name] = normalizeStockValue(camp.quantity);
          }
        });

        var rentalMovementResult = buildMovementItemsForRentalChange(oldRentalForMovement, nextCampByKey);
        // 驗證失敗（例如庫存全部減少）：阻止提交，快取不做任何修改
        // Validation failed: block submit, cache is untouched
        if (!rentalMovementResult.valid) {
          window.showAdminToast(rentalMovementResult.message, 'danger');
          return;
        }
        rentalMovementItemsToAdd = rentalMovementResult.items;
      }

      // 驗證通過：寫入快取
      var rentalItem = {
        id: rentalEditId || 'R-NEW-' + Date.now(),
        image: mainImageFile ? URL.createObjectURL(mainImageFile) : (existingThumbnail || PRODUCT_IMAGE_PLACEHOLDER),
        name: name,
        category: category || '其他',
        camp: rentalCamps
      };

      rentalItem = upsertAdminRentalCache(rentalItem);

      // 異動紀錄推入待處理佇列
      // Push validated movement items into the pending queue
      if (rentalMovementItemsToAdd.length > 0) {
        pendingRentalMovementItems = pendingRentalMovementItems.concat(rentalMovementItemsToAdd);
        updateMovementGenerateButtonState();
      }

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

    // 編輯模式：從 #editBranchPresetList 讀取各分店庫存；新增模式：平均分配。
    // Edit mode: read branch quantities from modal fields; add mode: spread evenly.
    var newBranchStock;
    if (storeEditId) {
      newBranchStock = collectEditBranchStockFields();
    } else {
      newBranchStock = splitBranchStock(stock);
    }

    var newTotalStock = getBranchTotal(newBranchStock);
    var newProduct = {
      id: storeEditId || 'P-NEW-' + Date.now(),
      thumbnail: mainImageFile ? URL.createObjectURL(mainImageFile) : (existingThumbnail || PRODUCT_IMAGE_PLACEHOLDER),
      name: name,
      category: category || '其他',
      spec: $('#newProductSpec').val().trim(),
      price: price,
      'total-stock': newTotalStock,
      branch: newBranchStock,
      status: existingStatus,
      images: secondaryImageFiles.length > 0
        ? secondaryImageFiles.map(function (file) {
          return file.name;
        })
        : existingImages,
      specifications: specifications
    };

    // 編輯模式：比對舊分店庫存，產生異動紀錄（進貨 / 調撥）
    // Edit mode: compare old branch values and generate movement items if changed
    if (storeEditId) {
      var oldProduct = findAdminProductById(storeEditId);
      if (oldProduct) {
        var movementResult = buildMovementItemsForBranchChange(oldProduct, newBranchStock);
        if (!movementResult.valid) {
          window.showAdminToast(movementResult.message, 'danger');
          return;
        }
        if (movementResult.items.length > 0) {
          pendingMovementItems = pendingMovementItems.concat(movementResult.items);
          updateMovementGenerateButtonState();
        }
      }
    }

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
    '<tr><td colspan="10" class="text-center py-4">' +
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
      '<tr><td colspan="10" class="text-center text-danger py-4">' +
      '<i class="fas fa-exclamation-triangle me-2"></i>載入租借商品數據失敗' +
      '</td></tr>'
    );
  });
}

// 將租借商品資料統一成 camp 陣列，庫存由各營地 quantity 加總取得。
// 同時產生 campByKey 物件（含 main + camp-001~005），方便表格按欄位讀取。
// Also builds campByKey {campId: quantity} including 'main', so the table can read each column easily.
function normalizeRentalItem(item) {
  var camps = normalizeRentalCamps(item && (item.camp || item.storageCamp), item && item.quantity);

  // 建立 campByKey：主倉 + 所有固定營地預設 0，再依 camp[] 寫入對應數量
  // Build campByKey: main + all fixed camps default to 0, then fill from camp[]
  var campByKey = {};
  ADMIN_RENTAL_CAMP_IDS.forEach(function (id) {
    campByKey[id] = 0;
  });

  camps.forEach(function (camp) {
    var campId = getCampIdByName(camp.name);

    if (campId) {
      // 固定營地（含主倉）：用 campId 寫入
      // Fixed camp (including main): write by campId
      campByKey[campId] = camp.quantity;
    } else {
      // 自訂營地：用完整名稱作為 key（保留自訂）
      campByKey[camp.name] = camp.quantity;
    }
  });

  return {
    id: item && item.id ? item.id : 'R-NEW-' + Date.now(),
    image: (item && (item.image || item.thumbnail)) || PRODUCT_IMAGE_PLACEHOLDER,
    name: (item && item.name) || '未命名租借商品',
    category: (item && item.category) || '其他',
    camp: camps,
    campByKey: campByKey
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

// 租借列表的庫存確認：讀取所有營地（含主倉）的數值，自動計算 total，寫回快取並更新畫面。
// Rental stock confirm: read all camp values (including main), auto-compute total, update cache and UI.
function confirmRentalStockChange($row, rentalId, $button) {
  var rental = findAdminRentalById(rentalId);

  if (!rental) {
    window.showAdminToast('找不到租借商品 ' + rentalId + ' 的資料', 'danger');
    return;
  }

  // 讀取所有固定營地（含主倉）欄位值
  // Read all fixed camp values including main warehouse
  var nextCampByKey = {};

  ADMIN_RENTAL_CAMP_IDS.forEach(function (campId) {
    nextCampByKey[campId] = getRowStockValue($row, campId);
  });

  // 自訂營地（非固定 ID 的 stock-input）也收集進來
  // Also collect custom camp fields (non-fixed IDs)
  var fixedIdSet = {};
  ADMIN_RENTAL_CAMP_IDS.forEach(function (id) { fixedIdSet[id] = true; });

  $row.find('.stock-input').each(function () {
    var fieldName = String($(this).data('stock-field') || '');
    if (fieldName && !fixedIdSet[fieldName]) {
      nextCampByKey[fieldName] = getStockInputValue($(this));
    }
  });

  // total 由各營地加總自動計算（不再驗證手動輸入的 rental-total）
  // total is always auto-computed from camp sum — validation check removed
  var totalStock = Object.keys(nextCampByKey).reduce(function (sum, key) {
    return sum + normalizeStockValue(nextCampByKey[key]);
  }, 0);

  // 先產生異動 items（需在寫回快取前，才能比對舊數量）
  // Must build movement items before updating rental.campByKey (needs old values for comparison)
  var movementResult = buildMovementItemsForRentalChange(rental, nextCampByKey);
  if (!movementResult.valid) {
    window.showAdminToast(movementResult.message, 'danger');
    return;
  }

  // 寫回快取的 campByKey 與 camp 陣列
  rental.campByKey = nextCampByKey;
  rental.camp = buildCampArrayFromKey(nextCampByKey);

  // 更新唯讀 total 欄位的靜態顯示數字
  // Refresh the read-only rental-total display cell
  $row.find('.total-stock-value').text(totalStock);
  $row.toggleClass('table-danger', totalStock < 5);
  setRowOriginalStockValues($row);
  syncStockConfirmState($row);

  // 將異動明細推入租借待處理佇列，並同步按鈕啟用狀態
  // Push movement items to rental pending queue and refresh button state
  if (movementResult.items.length > 0) {
    pendingRentalMovementItems = pendingRentalMovementItems.concat(movementResult.items);
    updateMovementGenerateButtonState();
  }

  window.showAdminToast('租借商品 ' + rentalId + ' 數量已更新');
}

// 依 campByKey 物件重建 camp 陣列（寫回 reantal.json 格式用）。
// Rebuilds camp[] from campByKey for persistence.
function buildCampArrayFromKey(campByKey) {
  var fixedIdSet = {};
  ADMIN_RENTAL_CAMP_IDS.forEach(function (id) { fixedIdSet[id] = true; });

  var result = [];

  // 先放固定營地（按固定順序）
  ADMIN_RENTAL_CAMP_IDS.forEach(function (id) {
    if (campByKey[id] !== undefined) {
      result.push({
        name: ADMIN_RENTAL_CAMP_FULL_NAMES[id],
        quantity: normalizeStockValue(campByKey[id])
      });
    }
  });

  // 再放自訂營地
  Object.keys(campByKey).forEach(function (key) {
    if (!fixedIdSet[key]) {
      result.push({
        name: key,
        quantity: normalizeStockValue(campByKey[key])
      });
    }
  });

  return result;
}

// 切換租借模式時，顯示固定營地清單，並讓初始庫存改由營地數量加總決定。
// Show/hide rental camp section and toggle readonly on stock input.
function syncRentalFormState(isRental) {
  $('#rentalCampField').toggleClass('d-none', !isRental);
  $('#newProductPrice').prop('required', !isRental);
  $('#newProductStock')
    .prop('readonly', isRental)
    .toggleClass('bg-light', isRental);

  if (isRental) {
    updateRentalStockFromCampFields();
  }
}

// 產生一列「自訂營地」輸入列，附加到 #rentalCampList。
// Appends a custom camp input row (name + quantity + remove button) to #rentalCampList.
function appendRentalCampField(campName, quantity) {
  var $row = $('<div>', { class: 'input-group input-group-sm rental-camp-row' });
  var $label = $('<span>', { class: 'input-group-text' }).text('自訂');
  var $nameInput = $('<input>', {
    type: 'text',
    class: 'form-control rental-camp-name-input',
    placeholder: '例：山頂日出營地'
  }).val(campName || '');
  var $quantityInput = $('<input>', {
    type: 'number',
    class: 'form-control rental-camp-quantity-input',
    min: '0',
    value: normalizeStockValue(quantity),
    'aria-label': '自訂營地存放數量'
  });
  var $removeButton = $('<button>', {
    type: 'button',
    class: 'btn btn-outline-danger remove-rental-camp-btn',
    title: '移除自訂營地'
  }).html('<i class="fas fa-times"></i>');

  $row.append($label, $nameInput, $quantityInput, $removeButton);
  $('#rentalCampList').append($row);
  return $row;
}

// 將既有 camp 陣列回填到 Modal：固定營地勾選 + 帶入數量，主倉與自訂營地動態新增列。
// Populates the modal from camp[]: checks preset checkboxes; main warehouse and custom camps get their own rows.
function populateRentalCampFields(camps) {
  var normalizedCamps = normalizeRentalCamps(camps);

  // 重置固定營地（camp-001~005）：全部取消勾選、數量清零、disabled
  $('#rentalCampPresetList .rental-camp-preset-row').each(function () {
    $(this).find('.rental-camp-check').prop('checked', false);
    $(this).find('.rental-camp-quantity-input').val(0).prop('disabled', true);
  });

  // 清空自訂營地列
  $('#rentalCampList').empty();

  normalizedCamps.forEach(function (camp) {
    var campId = getCampIdByName(camp.name);

    if (campId && campId !== ADMIN_WAREHOUSE_MAIN_ID) {
      // 固定營地（camp-001~005）：找到對應列，勾選並填入數量
      // Fixed camp (camp-001~005): find the preset row, check and fill quantity
      var $presetRow = $('#rentalCampPresetList .rental-camp-preset-row[data-camp-id="' + campId + '"]');
      $presetRow.find('.rental-camp-check').prop('checked', true);
      $presetRow.find('.rental-camp-quantity-input').val(camp.quantity).prop('disabled', false);
    } else {
      // 主倉 或 自訂營地：一律動態新增一列（名稱帶入，保留數量）
      // Main warehouse or custom camp: always append as a dynamic row to preserve quantity
      appendRentalCampField(camp.name, camp.quantity);
    }
  });

  updateRentalStockFromCampFields();
}

/**
 * 從 #editBranchPresetList 收集各分店庫存值，組成 { branchId: qty } 物件。
 * 未勾選的分店視為 0（使用者已歸零後才能取消勾選）。
 *
 * Reads each branch row from #editBranchPresetList and builds a branch stock object.
 * Unchecked branches are treated as 0 (user must zero before unchecking).
 * @returns {Object} { 'main': 0, 'branch-001': 5, ... }
 */
function collectEditBranchStockFields() {
  var branchStock = {};

  ADMIN_PRODUCT_BRANCH_IDS.forEach(function (branchId) {
    branchStock[branchId] = 0;
  });

  $('#editBranchPresetList .edit-branch-row').each(function () {
    var $row = $(this);
    var branchId = $row.data('branch-id');
    var isChecked = $row.find('.edit-branch-check').is(':checked');

    if (isChecked) {
      branchStock[branchId] = normalizeStockValue($row.find('.edit-branch-quantity-input').val());
    }
  });

  return branchStock;
}

// 收集 Modal 內的所有營地資料（固定勾選 + 自訂列）。
// Collects all camp data: checked presets + custom rows.
function collectRentalCampFields() {
  var camps = [];
  var hasInvalidCamp = false;

  // 收集固定營地（只加已勾選的）
  // Collect checked preset camps
  $('#rentalCampPresetList .rental-camp-preset-row').each(function () {
    var $row = $(this);
    if (!$row.find('.rental-camp-check').is(':checked')) {
      return;
    }

    var campId = $row.data('camp-id');
    var name = ADMIN_RENTAL_CAMP_FULL_NAMES[campId] || campId;
    var quantity = normalizeStockValue($row.find('.rental-camp-quantity-input').val());

    camps.push({ name: name, quantity: quantity });
  });

  // 收集自訂營地（名稱不能為空）
  // Collect custom camp rows (name must not be empty)
  $('#rentalCampList .rental-camp-row').each(function () {
    var $row = $(this);
    var $nameInput = $row.find('.rental-camp-name-input');
    var name = $nameInput.val().trim();
    var quantity = normalizeStockValue($row.find('.rental-camp-quantity-input').val());

    $nameInput.toggleClass('is-invalid', !name);

    if (!name) {
      hasInvalidCamp = true;
      return;
    }

    camps.push({ name: name, quantity: quantity });
  });

  return {
    valid: !hasInvalidCamp && camps.length > 0,
    camps: camps
  };
}

// 加總所有「已勾選的固定營地」與「自訂營地」數量，回填唯讀初始庫存欄位。
// Sums checked preset camps + custom camps and updates the readonly stock field.
function updateRentalStockFromCampFields() {
  var total = 0;

  // 固定營地：只加已勾選的列
  // Preset camps: only sum checked rows
  $('#rentalCampPresetList .rental-camp-preset-row').each(function () {
    if ($(this).find('.rental-camp-check').is(':checked')) {
      total += normalizeStockValue($(this).find('.rental-camp-quantity-input').val());
    }
  });

  // 自訂營地：全部加總
  // Custom camps: always sum
  $('#rentalCampList .rental-camp-row .rental-camp-quantity-input').each(function () {
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

  if (!product.branch || typeof product.branch !== 'object') {
    // 全新商品或無分店資料：依總庫存平均分配到實體分店，主倉設為 0
    // Brand new product or missing branch data: spread across physical branches, main = 0
    var totalForSplit = getProductTotalStock(product);
    product.branch = splitBranchStock(totalForSplit);
  } else {
    // 確保所有分店（含主倉）都有合法的數字，舊資料補 main: 0
    // Ensure every branch (including main) has a valid number; backfill main: 0 for old data
    ADMIN_PRODUCT_BRANCH_IDS.forEach(function (branchId) {
      product.branch[branchId] = normalizeStockValue(product.branch[branchId]);
    });
  }

  // total-stock 永遠由所有分店（含主倉）加總自動計算，不以原始 JSON 值為準
  // total-stock is always auto-computed from all branches including main
  product['total-stock'] = getBranchTotal(product.branch);
  delete product.stock;
  return product;
}

function splitBranchStock(totalStock) {
  // 主倉設為 0，只將庫存平均分配給實體分店（不含 main）
  // Main warehouse starts at 0; only distribute among physical branches (excluding main)
  var total = Math.max(parseInt(totalStock, 10) || 0, 0);
  var physicalBranches = ADMIN_PRODUCT_BRANCH_IDS.filter(function (id) {
    return id !== ADMIN_WAREHOUSE_MAIN_ID;
  });
  var baseQty = Math.floor(total / physicalBranches.length);
  var remainder = total % physicalBranches.length;
  var branchStock = {};

  branchStock[ADMIN_WAREHOUSE_MAIN_ID] = 0;
  physicalBranches.forEach(function (branchId, index) {
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

// 依營地完整名稱反查固定 camp ID；找不到時回傳 null（代表自訂營地）。
// 「主倉」直接對應 ADMIN_WAREHOUSE_MAIN_ID ('main')。
// Returns the fixed camp ID for a given full camp name, or null if custom.
// "主倉" always maps to ADMIN_WAREHOUSE_MAIN_ID ('main').
function getCampIdByName(name) {
  var trimmed = String(name || '').trim();

  // 主倉特判：名稱完全等於 ADMIN_WAREHOUSE_MAIN_LABEL 就回傳 'main'
  // Special case: match main warehouse label directly
  if (trimmed === ADMIN_WAREHOUSE_MAIN_LABEL) {
    return ADMIN_WAREHOUSE_MAIN_ID;
  }

  var found = null;

  Object.keys(ADMIN_RENTAL_CAMP_FULL_NAMES).forEach(function (id) {
    if (ADMIN_RENTAL_CAMP_FULL_NAMES[id] === trimmed) {
      found = id;
    }
  });

  // 同時嘗試比對簡稱（例如 campByKey 存的是簡稱）
  // Also try short labels
  if (!found) {
    Object.keys(ADMIN_RENTAL_CAMP_LABELS).forEach(function (id) {
      if (ADMIN_RENTAL_CAMP_LABELS[id] === trimmed) {
        found = id;
      }
    });
  }

  return found;
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
  // 加總所有分店（含主倉 main）的庫存
  // Sum all branches including the main warehouse
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

  // 全部只有減少（含主倉）→ 報廢場景，本系統不支援，提示聯繫管理員
  // All locations (including main) decreased → disposal scenario, not supported here
  if (sources.length > 0 && receivers.length === 0) {
    return {
      valid: false,
      message: '所有倉庫庫存全部為減少，如需報廢請聯繫系統管理員',
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
    // 只有增加（全部來自進貨）→ fromStore 標記為「進貨」
    // Only increases → all come from procurement, mark fromStore as '進貨'
    receivers.forEach(function (receiver) {
      items.push({
        productName: product.name,
        quantity: receiver.quantity,
        fromStore: '進貨',
        toStore: receiver.storeName,
        type: '進貨'
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

  // 減少量 > 增加量 → 淨庫存下降，屬於報廢場景，擋住
  // Net decrease in total stock → disposal scenario, block
  if (sourceTotal > receiverTotal) {
    return {
      valid: false,
      message: '倉庫減少數量大於增加數量，如需報廢請聯繫系統管理員',
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
        toStore: receiver.storeName,
        type: '調撥'
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
        toStore: receiver.storeName,
        type: '進貨'
      });
    }
  });

  return {
    valid: true,
    message: '',
    items: items
  };
}

/**
 * 比對租借商品各營地的舊數量（rental.campByKey）與新數量（nextCampByKey），
 * 產生庫存異動 items 陣列，格式與商店異動相同。
 *
 * Compare old camp quantities (rental.campByKey) with new (nextCampByKey),
 * return movement items with campName as fromStore/toStore.
 *
 * @param {Object} rental       - 租借商品物件（含 campByKey 舊值）
 * @param {Object} nextCampByKey - 確認後的新數量 { 'camp-001': 5, ... }
 * @returns {{ valid: boolean, message: string, items: Array }}
 */
function buildMovementItemsForRentalChange(rental, nextCampByKey) {
  var sources = [];
  var receivers = [];
  var items = [];

  // 收集所有需比對的 key（舊的聯集新的，確保自訂營地也被涵蓋）
  var allKeys = {};
  Object.keys(rental.campByKey || {}).forEach(function (k) { allKeys[k] = true; });
  Object.keys(nextCampByKey || {}).forEach(function (k) { allKeys[k] = true; });

  Object.keys(allKeys).forEach(function (key) {
    var previousQty = normalizeStockValue((rental.campByKey || {})[key]);
    var nextQty = normalizeStockValue((nextCampByKey || {})[key]);
    var delta = nextQty - previousQty;

    // 將 camp ID 轉換為顯示名稱（固定 ID 用 LABELS，自訂用 key 本身）
    var campLabel = ADMIN_RENTAL_CAMP_LABELS[key] || key;

    if (delta < 0) {
      sources.push({ campKey: key, campLabel: campLabel, quantity: Math.abs(delta) });
    } else if (delta > 0) {
      receivers.push({ campKey: key, campLabel: campLabel, quantity: delta });
    }
  });

  // 全部只有減少（含主倉）→ 報廢場景，本系統不支援
  // All camps (including main) decreased → disposal scenario, not supported
  if (sources.length > 0 && receivers.length === 0) {
    return {
      valid: false,
      message: '所有營地庫存全部為減少，如需報廢請聯繫系統管理員',
      items: []
    };
  }

  // 沒有任何變動
  if (sources.length === 0 && receivers.length === 0) {
    return { valid: true, message: '', items: [] };
  }

  // 只有增加 → 全部標記為「進貨」
  // Only increases → mark all as '進貨'
  if (sources.length === 0) {
    receivers.forEach(function (receiver) {
      items.push({
        productName: rental.name,
        quantity: receiver.quantity,
        fromStore: '進貨',
        toStore: receiver.campLabel,
        type: '進貨'
      });
    });
    return { valid: true, message: '', items: items };
  }

  // 有增有減 → 配對配送（與商店邏輯完全對稱）
  var sourceTotal = sources.reduce(function (sum, s) { return sum + s.quantity; }, 0);
  var receiverTotal = receivers.reduce(function (sum, r) { return sum + r.quantity; }, 0);

  // 淨庫存下降 → 報廢場景，擋住
  if (sourceTotal > receiverTotal) {
    return {
      valid: false,
      message: '營地減少數量大於增加數量，如需報廢請聯繫系統管理員',
      items: []
    };
  }

  var sourceIndex = 0;
  receivers.forEach(function (receiver) {
    var remaining = receiver.quantity;

    while (remaining > 0 && sourceIndex < sources.length) {
      var source = sources[sourceIndex];
      var moveQty = Math.min(source.quantity, remaining);

      items.push({
        productName: rental.name,
        quantity: moveQty,
        fromStore: source.campLabel,
        toStore: receiver.campLabel,
        type: '調撥'
      });

      source.quantity -= moveQty;
      remaining -= moveQty;

      if (source.quantity === 0) {
        sourceIndex += 1;
      }
    }

    if (remaining > 0) {
      items.push({
        productName: rental.name,
        quantity: remaining,
        fromStore: '進貨',
        toStore: receiver.campLabel,
        type: '進貨'
      });
    }
  });

  return { valid: true, message: '', items: items };
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

// 依變更方向標示庫存欄位顏色。
// total-stock / rental-total 已改為靜態顯示，不再是 stock-input，無需處理。
// Colors stock inputs based on change direction.
// total-stock / rental-total are now static displays (not stock-inputs), so skip them.
function syncStockInputFeedback($row) {
  $row.find('.stock-input').each(function () {
    var $input = $(this);
    var currentQty = getStockInputValue($input);
    var originalQty = normalizeStockValue($input.attr('data-original-qty'));

    $input.removeClass('stock-input-increase stock-input-decrease');

    // 所有可編輯的分店/主倉/營地欄位：直接與原始值比較
    // All editable branch / main / camp fields: compare directly to original value
    if (currentQty > originalQty) {
      $input.addClass('stock-input-increase');
    } else if (currentQty < originalQty) {
      $input.addClass('stock-input-decrease');
    }
  });
}

// 商店或租借任一有待處理異動，就啟用「產生異動紀錄」按鈕。
// Enable the button if either store or rental pending queue has items.
function updateMovementGenerateButtonState() {
  var hasItems = pendingMovementItems.length > 0 || pendingRentalMovementItems.length > 0;
  $('#generateMovementRecord').prop('disabled', !hasItems);
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
// Populates the modal with store product data and switches to edit mode.
function fillProductModal(product) {
  resetProductModalForm();
  setProductModalMode('edit');

  $('#addProductForm')
    .data('edit-product-id', product.id)
    .data('edit-type', 'store')
    .data('existing-thumbnail', product.thumbnail || PRODUCT_IMAGE_PLACEHOLDER)
    .data('existing-images', product.images || [])
    .data('existing-status', product.status || 'active');

  // 編輯模式：隱藏「是否為租借商品」toggle（類型已確定，不可切換）
  // Edit mode: hide the rental toggle — product type is already determined
  $('#newProductIsRentalWrapper').addClass('d-none');

  syncRentalFormState(false);
  $('#newProductIsRental').prop('checked', false);
  $('#newProductStock').prop('readonly', false).removeClass('bg-light');
  $('#newProductName').val(product.name || '');
  $('#newProductCategory').val(product.category || '');
  $('#newProductSpec').val(product.spec || '');
  $('#newProductPrice').val(product.price || '');
  $('#newProductStock').val(getProductTotalStock(product));

  // 顯示分店庫存區塊，並帶入各分店目前庫存值
  // Show branch stock section and fill in each branch's current quantity
  $('#editBranchStockField').removeClass('d-none');
  fillEditBranchStockFields(product);

  if (product.specifications && typeof product.specifications === 'object') {
    Object.keys(product.specifications).forEach(function (key) {
      addSpecificationField(key, product.specifications[key]);
    });
  }
}

/**
 * 將商品各分店庫存帶入 #editBranchPresetList 的輸入欄，
 * 並更新總庫存顯示。
 * Fills #editBranchPresetList inputs with product.branch values and updates total.
 * @param {Object} product - 商店商品物件（含 branch 欄位）
 */
function fillEditBranchStockFields(product) {
  $('#editBranchPresetList .edit-branch-row').each(function () {
    var $row = $(this);
    var branchId = $row.data('branch-id');
    var qty = getProductBranchStock(product, branchId);

    // 全部預設勾選且啟用
    $row.find('.edit-branch-check').prop('checked', true);
    $row.find('.edit-branch-quantity-input')
      .prop('disabled', false)
      .val(qty);
  });

  updateEditBranchTotal();
}

/**
 * 加總所有已勾選分店的數量，更新 #editBranchTotalStock 的顯示。
 * Sums all checked branch quantities and updates the read-only total display.
 */
function updateEditBranchTotal() {
  var total = 0;
  $('#editBranchPresetList .edit-branch-row').each(function () {
    var $row = $(this);
    if ($row.find('.edit-branch-check').is(':checked')) {
      total += normalizeStockValue($row.find('.edit-branch-quantity-input').val());
    }
  });
  $('#editBranchTotalStock').text(total);
}

// 將租借商品資料回填到新增商品 Modal，並帶入各營地庫存明細。
// Populates the modal with rental product data and switches to edit mode.
function fillRentalModal(rental) {
  resetProductModalForm();
  setProductModalMode('edit');

  $('#addProductForm')
    .data('edit-product-id', rental.id)
    .data('edit-type', 'rental')
    .data('existing-thumbnail', rental.image || PRODUCT_IMAGE_PLACEHOLDER)
    .data('existing-images', [])
    .data('existing-status', 'active');

  // 編輯模式：隱藏「是否為租借商品」toggle（類型已確定，不可切換）
  // Edit mode: hide the rental toggle — product type is already determined
  $('#newProductIsRentalWrapper').addClass('d-none');

  // 分店庫存區塊不顯示（租借商品使用營地區塊）
  // Branch stock section stays hidden for rental products
  $('#editBranchStockField').addClass('d-none');

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
// Resets all form fields, data attributes, and rental camp states.
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

  // 重置固定營地 checkbox：全部取消勾選、數量清零、disabled
  $('#rentalCampPresetList .rental-camp-preset-row').each(function () {
    $(this).find('.rental-camp-check').prop('checked', false);
    $(this).find('.rental-camp-quantity-input').val(0).prop('disabled', true);
  });

  $('#newProductIsRental').prop('checked', false);
  $('#newProductStock').prop('readonly', false).removeClass('bg-light').val('0');
  setProductModalMode('add');
  syncRentalFormState(false);

  // 恢復新增模式：顯示 toggle、隱藏分店庫存區塊、清空分店欄位
  // Restore add mode: show toggle, hide branch stock section, clear branch fields
  $('#newProductIsRentalWrapper').removeClass('d-none');
  $('#editBranchStockField').addClass('d-none');
  resetEditBranchStockFields();
}

/**
 * 將分店庫存區塊的所有欄位歸零、全部勾選並啟用，準備下一次編輯使用。
 * Resets all branch stock inputs to 0, checks all checkboxes, and enables all inputs.
 */
function resetEditBranchStockFields() {
  $('#editBranchPresetList .edit-branch-row').each(function () {
    $(this).find('.edit-branch-check').prop('checked', true);
    $(this).find('.edit-branch-quantity-input').prop('disabled', false).val(0);
  });
  $('#editBranchTotalStock').text(0);
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
  var imgSrc   = p.thumbnail || PRODUCT_IMAGE_PLACEHOLDER;

  // 欄位順序（依 SDD v1.0）：圖片 | 名稱 | 分類 | 操作 | 總庫存(唯讀) | 主倉 | 分店A | 分店B | 分店C
  // Column order (SDD v1.0): img | name | category | action | total(readonly) | main | branchA | branchB | branchC
  return '<tr data-product-id="' + escapeHtml(p.id) + '" data-inventory-type="store"' + rowClass + '>' +

    // ── 固定欄 1：圖片 ──
    '<td class="sticky-col sticky-col-img">' +
    '<img src="' + escapeHtml(imgSrc) + '" width="48" height="48" class="rounded object-fit-cover"' +
    ' onerror="this.src=\'' + PRODUCT_IMAGE_PLACEHOLDER + '\'">' +
    '</td>' +

    // ── 固定欄 2：商品名稱（超過欄寬截斷，hover 顯示完整名稱）──
    '<td class="sticky-col sticky-col-name fw-semibold">' +
    '<span class="product-name-cell" title="' + escapeHtml(p.name) + '">' +
    escapeHtml(p.name) +
    '</span>' +
    '</td>' +

    // ── 固定欄 3：分類 ──
    '<td class="sticky-col sticky-col-category">' +
    '<span class="badge bg-light text-dark border">' + escapeHtml(p.category || '—') + '</span>' +
    '</td>' +

    // ── 固定欄 4：操作（編輯 + 調撥 + 確定按鈕）確定按鈕有異動後才顯示 ──
    '<td class="sticky-col sticky-col-action">' +
    '<div class="d-flex flex-column gap-1">' +
    '<button type="button" class="btn btn-sm btn-outline-secondary edit-product-btn" title="編輯商品">' +
    '<i class="fas fa-pen me-1"></i>編輯' +
    '</button>' +
    '<button type="button" class="btn btn-sm btn-outline-primary transfer-to-rental-btn" title="調撥" ' +
    'data-product-id="' + escapeHtml(p.id) + '">' +
    '<i class="fas fa-exchange-alt me-1"></i>調撥' +
    '</button>' +
    '<button type="button" class="btn btn-sm btn-success stock-confirm-btn d-none" title="確定庫存異動" disabled>' +
    '<i class="fas fa-check me-1"></i>確定' +
    '</button>' +
    '</div>' +
    '</td>' +

    // ── 固定欄 5：總庫存量（唯讀靜態顯示，由分店加總自動計算）──
    // total-stock is read-only; auto-computed as sum of all branches including main
    '<td class="sticky-col sticky-col-total-stock stock-cell text-center fw-semibold" ' +
    'data-total-stock-display>' +
    '<span class="total-stock-value">' + stock + '</span>' +
    '</td>' +

    // ── 可捲動欄：主倉 + 分店 A / B / C ──
    '<td class="stock-cell">' + buildStockControl('main', getProductBranchStock(p, 'main'), '主倉') + '</td>' +
    '<td class="stock-cell">' + buildStockControl('branch-001', getProductBranchStock(p, 'branch-001'), '分店 A') + '</td>' +
    '<td class="stock-cell">' + buildStockControl('branch-002', getProductBranchStock(p, 'branch-002'), '分店 B') + '</td>' +
    '<td class="stock-cell">' + buildStockControl('branch-003', getProductBranchStock(p, 'branch-003'), '分店 C') + '</td>' +

    '</tr>';
}

function buildRentalRow(item) {
  var rental     = normalizeRentalItem(item);
  var stock      = getRentalTotalStock(rental);
  var isLow      = stock < 5;
  var rowClass   = isLow ? ' class="table-danger"' : '';
  var campByKey  = rental.campByKey || {};

  // 固定營地欄（不含 main，main 獨立置於總庫存後）：每個欄位都是獨立的步進器
  // Fixed camp columns (excluding main, which has its own slot): each gets its own ± stepper
  var fixedCampCols = ADMIN_RENTAL_CAMP_IDS.filter(function (id) {
    return id !== ADMIN_WAREHOUSE_MAIN_ID;
  }).map(function (campId) {
    var qty = normalizeStockValue(campByKey[campId]);
    return '<td class="stock-cell">' +
      buildStockControl(campId, qty, ADMIN_RENTAL_CAMP_LABELS[campId]) +
      '</td>';
  }).join('');

  // 自訂營地：若 campByKey 有非固定 ID 的 key，附加到最後
  // Custom camps: extra keys not in ADMIN_RENTAL_CAMP_IDS (also in scrollable area)
  var fixedIdSet = {};
  ADMIN_RENTAL_CAMP_IDS.forEach(function (id) { fixedIdSet[id] = true; });
  var customCampCols = Object.keys(campByKey).filter(function (key) {
    return !fixedIdSet[key];
  }).map(function (customName) {
    var qty = normalizeStockValue(campByKey[customName]);
    return '<td class="stock-cell">' +
      buildStockControl(customName, qty, customName) +
      '</td>';
  }).join('');

  // 欄位順序（依 SDD v1.0）：圖片 | 名稱 | 分類 | 操作 | 總租借庫存(唯讀) | 主倉 | 各營區（可捲動）
  // Column order (SDD v1.0): img | name | category | action | rental-total(readonly) | main | camps (scrollable)
  return '<tr data-product-id="' + escapeHtml(rental.id) + '" data-inventory-type="rental"' + rowClass + '>' +

    // ── 固定欄 1：圖片 ──
    '<td class="sticky-col sticky-col-img">' +
    '<img src="' + escapeHtml(rental.image) + '" width="48" height="48" class="rounded object-fit-cover"' +
    ' onerror="this.src=\'' + PRODUCT_IMAGE_PLACEHOLDER + '\'">' +
    '</td>' +

    // ── 固定欄 2：商品名稱（超過欄寬截斷，hover 顯示完整名稱）──
    '<td class="sticky-col sticky-col-name fw-semibold">' +
    '<span class="product-name-cell" title="' + escapeHtml(rental.name) + '">' +
    escapeHtml(rental.name) +
    '</span>' +
    '</td>' +

    // ── 固定欄 3：分類 ──
    '<td class="sticky-col sticky-col-category">' +
    '<span class="badge bg-light text-dark border">' + escapeHtml(rental.category || '其他') + '</span>' +
    '</td>' +

    // ── 固定欄 4：操作（編輯按鈕 + 確定按鈕，確定按鈕有庫存異動後才顯示）──
    '<td class="sticky-col sticky-col-action">' +
    '<div class="d-flex flex-column gap-1">' +
    '<button type="button" class="btn btn-sm btn-outline-secondary edit-product-btn" title="編輯商品">' +
    '<i class="fas fa-pen me-1"></i>編輯' +
    '</button>' +
    '<button type="button" class="btn btn-sm btn-success stock-confirm-btn d-none" title="確定庫存異動" disabled>' +
    '<i class="fas fa-check me-1"></i>確定' +
    '</button>' +
    '</div>' +
    '</td>' +

    // ── 固定欄 5：總租借庫存（唯讀靜態顯示，由各營地加總自動計算）──
    // rental-total is read-only; auto-computed as sum of all camps including main
    '<td class="sticky-col sticky-col-total-stock stock-cell text-center fw-semibold" ' +
    'data-total-stock-display>' +
    '<span class="total-stock-value">' + stock + '</span>' +
    '</td>' +

    // ── 可捲動欄：主倉 + 各固定營區 + 自訂營區 ──
    '<td class="stock-cell">' + buildStockControl('main', normalizeStockValue(campByKey[ADMIN_WAREHOUSE_MAIN_ID]), '主倉') + '</td>' +
    fixedCampCols +
    customCampCols +

    '</tr>';
}

// ════════════════════════════════════════════════════════════
// 跨類型調撥：商店 → 租借（單向，不可逆）
// Cross-type transfer: Store → Rental (one-way, irreversible)
// ════════════════════════════════════════════════════════════

/**
 * 開啟調至租借 Modal，並將商品資料帶入各欄位。
 * Opens the transfer-to-rental modal and populates it with product data.
 * 依 product.rentalId 自動對應目標租借商品；無對應則封鎖並顯示 Toast。
 * Uses product.rentalId to auto-match target rental; blocks if not set.
 * @param {string} productId - 商店商品 ID
 */
function openTransferToRentalModal(productId) {
  var product = findAdminProductById(productId);

  if (!product) {
    window.showAdminToast('找不到商品 ' + productId + ' 的資料', 'danger');
    return;
  }

  // 驗證：必須有 rentalId 才可調撥
  // Validate: rentalId must be set on the store product
  if (!product.rentalId) {
    window.showAdminToast('此商品尚未設定對應租借商品，無法調撥', 'danger');
    return;
  }

  var rental = findAdminRentalById(product.rentalId);
  if (!rental) {
    window.showAdminToast('租借商品資料不存在，請聯繫管理員', 'danger');
    return;
  }

  // 儲存商品 ID 與租借 ID，供確認調撥時使用
  // Store both IDs for use when confirming transfer
  $('#transferToRentalModal')
    .data('source-product-id', productId)
    .data('target-rental-id', product.rentalId);

  // 填入商品名稱（唯讀）
  $('#transferProductName').text(product.name);

  // 填入來源分店下拉選單（主倉 + 各實體分店）
  // Populate source branch dropdown (main + physical branches)
  var $sourceBranch = $('#transferSourceBranch').empty();
  ADMIN_PRODUCT_BRANCH_IDS.forEach(function (branchId) {
    var qty = getProductBranchStock(product, branchId);
    var label = ADMIN_PRODUCT_BRANCH_LABELS[branchId] || branchId;
    $('<option>', { value: branchId }).text(label + '（' + qty + ' 件）').appendTo($sourceBranch);
  });

  // 預設選主倉（index 0），並同步目前庫存顯示
  $sourceBranch.prop('selectedIndex', 0);
  syncTransferSourceStock();

  // 重置多行營地分配清單（清空並建立第一列空白行）
  // Reset multi-row camp distribution (clear and add one empty row)
  resetTransferCampRows(rental);
  syncTransferDistributionCounter();

  // 開啟 Modal
  bootstrap.Modal.getOrCreateInstance(document.getElementById('transferToRentalModal')).show();
}

/**
 * 依目前選取的來源分店，更新「目前庫存」靜態顯示。
 * Updates the current stock display based on the selected source branch.
 */
function syncTransferSourceStock() {
  var productId = $('#transferToRentalModal').data('source-product-id');
  var product = findAdminProductById(productId);
  var branchId = $('#transferSourceBranch').val();

  if (!product || !branchId) {
    $('#transferSourceStock').text('0');
    return;
  }

  var qty = getProductBranchStock(product, branchId);
  $('#transferSourceStock').text(qty + ' 件');
}

// ════════════════════════════════════════════════════════════
// 多行營地分配輔助函式群
// Multi-row camp distribution helper functions
// ════════════════════════════════════════════════════════════

/**
 * 取得目前來源分店的庫存（數字）。
 * Returns the current source branch stock as a number.
 */
function getTransferSourceStockValue() {
  var productId = $('#transferToRentalModal').data('source-product-id');
  var product   = findAdminProductById(productId);
  var branchId  = $('#transferSourceBranch').val();
  return getProductBranchStock(product, branchId);
}

/**
 * 清空 #transferCampRows 並新增第一列空白行。
 * Clears the camp rows container and appends the first empty row.
 * @param {Object} rental - 目標租借商品物件
 */
function resetTransferCampRows(rental) {
  $('#transferCampRows').empty();
  appendTransferCampRow(rental);
}

/**
 * 產生租借商品所有可選的營地選項清單（主倉優先，再固定營地，再自訂營地）。
 * Builds an ordered array of { value, label, currentQty } for all camps.
 * @param {Object} rental - 目標租借商品物件
 * @returns {Array} 選項陣列
 */
function buildTransferCampOptions(rental) {
  var campByKey  = rental.campByKey || {};
  var fixedIdSet = {};
  ADMIN_RENTAL_CAMP_IDS.forEach(function (id) { fixedIdSet[id] = true; });

  var options = [];

  // 固定營地（含主倉）依預設順序排列
  ADMIN_RENTAL_CAMP_IDS.forEach(function (campId) {
    var label = ADMIN_RENTAL_CAMP_LABELS[campId] || campId;
    var qty   = normalizeStockValue(campByKey[campId]);
    options.push({ value: campId, label: label, currentQty: qty });
  });

  // 自訂營地排在最後
  Object.keys(campByKey).forEach(function (key) {
    if (!fixedIdSet[key]) {
      options.push({ value: key, label: key, currentQty: normalizeStockValue(campByKey[key]) });
    }
  });

  return options;
}

/**
 * 在 #transferCampRows 新增一列 [營地下拉] [數量輸入] [刪除按鈕]。
 * 已被其他行選取的營地在本行下拉中 disabled。
 * Appends a new camp distribution row; already-selected camps are disabled.
 * @param {Object} rental - 目標租借商品物件
 */
function appendTransferCampRow(rental) {
  // 收集已被其他行選用的 campKey
  // Collect campKeys already selected by other rows
  var usedKeys = {};
  $('#transferCampRows .transfer-camp-select').each(function () {
    var v = $(this).val();
    if (v) { usedKeys[v] = true; }
  });

  var campOptions = buildTransferCampOptions(rental);

  // 找第一個尚未被選用的選項作為預設值
  var defaultValue = '';
  campOptions.some(function (opt) {
    if (!usedKeys[opt.value]) {
      defaultValue = opt.value;
      return true;
    }
  });

  // 建立下拉選單 HTML
  var $select = $('<select>', { class: 'form-select form-select-sm transfer-camp-select' });
  campOptions.forEach(function (opt) {
    var $opt = $('<option>', { value: opt.value })
      .text(opt.label + '（目前 ' + opt.currentQty + ' 件）')
      .prop('disabled', !!usedKeys[opt.value]);
    $select.append($opt);
  });
  $select.val(defaultValue);

  // 計算剩餘可分配量（其他行合計已佔用）
  var sourceStock  = getTransferSourceStockValue();
  var otherTotal   = 0;
  $('#transferCampRows .transfer-camp-qty').each(function () {
    otherTotal += normalizeStockValue($(this).val());
  });
  var remaining = Math.max(sourceStock - otherTotal, 0);

  // 數量輸入
  var $qty = $('<input>', {
    type:  'number',
    class: 'form-control form-control-sm transfer-camp-qty',
    min:   0,
    max:   remaining,
    value: Math.min(1, remaining),
    style: 'width: 80px;'
  });

  // 刪除按鈕
  var $removeBtn = $('<button>', {
    type:  'button',
    class: 'btn btn-outline-danger btn-sm remove-transfer-camp-row',
    title: '移除此行'
  }).html('<i class="fas fa-times"></i>');

  // 組合成一列（row）
  var $row = $('<div>', { class: 'd-flex gap-2 align-items-center transfer-camp-row' })
    .append($select)
    .append($qty)
    .append($removeBtn);

  $('#transferCampRows').append($row);

  // 新增後立即同步其他行的 disabled 狀態
  refreshTransferCampSelectOptions();
}

/**
 * 更新計數器「已分配 N / M 件」。
 * Updates the #transferDistributionCounter display.
 */
function syncTransferDistributionCounter() {
  var allocated = 0;
  $('#transferCampRows .transfer-camp-qty').each(function () {
    allocated += normalizeStockValue($(this).val());
  });

  var sourceStock = getTransferSourceStockValue();
  $('#transferDistributionCounter').text('已分配 ' + allocated + ' / ' + sourceStock + ' 件');
}

/**
 * Auto-trim：若目前行的數量導致總計超過來源庫存，自動截斷。
 * Auto-trim: cap the input value so the total does not exceed source stock.
 * @param {jQuery} $input - 被觸發的 .transfer-camp-qty 輸入欄
 */
function applyTransferCampQtyAutoTrim($input) {
  var sourceStock = getTransferSourceStockValue();

  // 計算其他行的合計（不含目前行）
  var otherTotal = 0;
  $('#transferCampRows .transfer-camp-qty').each(function () {
    if (this !== $input[0]) {
      otherTotal += normalizeStockValue($(this).val());
    }
  });

  // 剩餘可分配量
  var remaining = Math.max(sourceStock - otherTotal, 0);
  var currentVal = normalizeStockValue($input.val());

  if (currentVal > remaining) {
    $input.val(remaining);
  }

  // 更新本行 max 屬性，並更新其他行的 max（來源庫存 - 本行 - 其他行各自的 otherTotal）
  // Update all rows' max to prevent over-allocation
  var newVal = normalizeStockValue($input.val());
  $('#transferCampRows .transfer-camp-qty').each(function () {
    if (this !== $input[0]) {
      var siblingsTotal = newVal + otherTotal - normalizeStockValue($(this).val());
      var siblingRemaining = Math.max(sourceStock - siblingsTotal, 0);
      $(this).attr('max', siblingRemaining);
    } else {
      $input.attr('max', remaining);
    }
  });
}

/**
 * 重新整理所有行的營地下拉選單：已被其他行選取的選項設為 disabled。
 * Refreshes all rows' camp dropdowns: disables options already selected in other rows.
 */
function refreshTransferCampSelectOptions() {
  // 收集所有已選取的 campKey
  var usedKeys = {};
  $('#transferCampRows .transfer-camp-select').each(function () {
    var v = $(this).val();
    if (v) { usedKeys[v] = true; }
  });

  // 對每個下拉：除了自己目前選取的選項外，其他已被別行選取的 disabled
  $('#transferCampRows .transfer-camp-select').each(function () {
    var $sel   = $(this);
    var ownVal = $sel.val();

    $sel.find('option').each(function () {
      var optVal = $(this).val();
      // 自己選取的不 disabled；其他行已選取的 disabled
      $(this).prop('disabled', optVal !== ownVal && !!usedKeys[optVal]);
    });
  });
}

/**
 * 執行調撥：收集多行營地分配 → 驗證 → 更新商店快取 → 更新租借快取 → 產生 1+N 筆異動記錄 → 更新畫面。
 * Executes the transfer: collect multi-row distributions → validate → update caches → generate 1+N movement items.
 */
function submitTransferToRental() {
  var productId = $('#transferToRentalModal').data('source-product-id');
  var rentalId  = $('#transferToRentalModal').data('target-rental-id');
  var branchId  = $('#transferSourceBranch').val();

  var product = findAdminProductById(productId);
  var rental  = findAdminRentalById(rentalId);

  // ── 驗證：來源商品與租借商品必須存在 ──────────
  if (!product) {
    window.showAdminToast('找不到來源商品資料', 'danger');
    return;
  }

  if (!rental) {
    window.showAdminToast('找不到對應租借商品資料', 'danger');
    return;
  }

  // ── 收集所有有效的 [campKey, quantity] 行 ──────
  // Collect all valid [campKey, quantity] rows (qty > 0 and camp selected)
  var distributions = [];
  $('#transferCampRows .transfer-camp-row').each(function () {
    var campKey = $(this).find('.transfer-camp-select').val();
    var qty     = normalizeStockValue($(this).find('.transfer-camp-qty').val());
    if (campKey && qty > 0) {
      distributions.push({ campKey: campKey, quantity: qty });
    }
  });

  // ── 驗證：合計必須 > 0 ─────────────────────────
  var totalQty = distributions.reduce(function (sum, d) {
    return sum + d.quantity;
  }, 0);

  if (totalQty === 0) {
    window.showAdminToast('調撥數量必須大於 0，請填寫至少一個營地的數量', 'danger');
    return;
  }

  // ── 驗證：合計不得超過來源庫存 ────────────────
  var sourceQty = getProductBranchStock(product, branchId);
  if (totalQty > sourceQty) {
    window.showAdminToast(
      '調撥合計（' + totalQty + '）超過來源「' + (ADMIN_PRODUCT_BRANCH_LABELS[branchId] || branchId) + '」可用庫存（' + sourceQty + '）',
      'danger'
    );
    return;
  }

  // ── 更新商店快取：來源分店 -totalQty ──────────
  product.branch[branchId] = sourceQty - totalQty;
  product['total-stock']   = getBranchTotal(product.branch);

  // ── 更新租借快取：各目標營地各自 +qty ──────────
  distributions.forEach(function (d) {
    var prev = normalizeStockValue((rental.campByKey || {})[d.campKey]);
    rental.campByKey[d.campKey] = prev + d.quantity;
  });
  rental.camp = buildCampArrayFromKey(rental.campByKey);

  // ── 更新商店表格列畫面 ─────────────────────────
  var $storeRow = $('#productsTableBody tr[data-product-id="' + escapeSelector(productId) + '"]');
  if ($storeRow.length) {
    $storeRow.find('.total-stock-value').text(product['total-stock']);
    $storeRow.toggleClass('table-danger', product['total-stock'] < 5);
    var $branchInput = $storeRow.find('.stock-input[data-stock-field="' + branchId + '"]');
    $branchInput
      .val(product.branch[branchId])
      .attr('data-original-qty', product.branch[branchId])
      .data('original-qty', product.branch[branchId]);
    syncStockInputFeedback($storeRow);
  }

  // ── 更新租借表格列畫面（若已載入）──────────────
  var $rentalRow = $('#rentalProductsTableBody tr[data-product-id="' + escapeSelector(rentalId) + '"]');
  if ($rentalRow.length) {
    var rentalTotal = Object.keys(rental.campByKey).reduce(function (sum, key) {
      return sum + normalizeStockValue(rental.campByKey[key]);
    }, 0);
    $rentalRow.find('.total-stock-value').text(rentalTotal);
    $rentalRow.toggleClass('table-danger', rentalTotal < 5);

    // 逐一更新各目標營地的步進器數值
    // Update each target camp's stepper input
    distributions.forEach(function (d) {
      var $campInput = $rentalRow.find('.stock-input[data-stock-field="' + d.campKey + '"]');
      $campInput
        .val(rental.campByKey[d.campKey])
        .attr('data-original-qty', rental.campByKey[d.campKey])
        .data('original-qty', rental.campByKey[d.campKey]);
    });
    syncStockInputFeedback($rentalRow);
  }

  // ── 產生 1+N 筆跨類型調撥異動記錄 ────────────
  var movementItems = buildMultiCampTransferMovementItems(product, branchId, rental, distributions, totalQty);
  pendingMovementItems = pendingMovementItems.concat(movementItems);
  updateMovementGenerateButtonState();

  // ── 關閉 Modal 並顯示成功訊息 ─────────────────
  bootstrap.Modal.getOrCreateInstance(document.getElementById('transferToRentalModal')).hide();

  var campSummary = distributions.map(function (d) {
    return (ADMIN_RENTAL_CAMP_LABELS[d.campKey] || d.campKey) + ' ' + d.quantity + ' 件';
  }).join('、');

  window.showAdminToast(
    '已將「' + product.name + '」共 ' + totalQty + ' 件從「' +
    (ADMIN_PRODUCT_BRANCH_LABELS[branchId] || branchId) +
    '」調至租借（' + campSummary + '）'
  );
}

/**
 * 產生跨類型調撥的 1+N 筆異動 items。
 * 第 1 筆：商店來源分店扣減（合計）。
 * 第 2~N+1 筆：租借各目標營地各自增加。
 *
 * Builds 1+N movement items: one debit from store, one credit per target camp.
 * @param {Object} product       - 商店商品物件
 * @param {string} branchId      - 來源分店 ID
 * @param {Object} rental        - 租借商品物件
 * @param {Array}  distributions - [{ campKey, quantity }, ...] 各目標營地分配
 * @param {number} totalQty      - 本次調撥合計數量
 * @returns {Array} items 陣列（1 + distributions.length 筆）
 */
function buildMultiCampTransferMovementItems(product, branchId, rental, distributions, totalQty) {
  var branchLabel = ADMIN_PRODUCT_BRANCH_LABELS[branchId] || branchId;
  var items = [];

  // 第 1 筆：商店扣減（總量）
  items.push({
    productName: product.name,
    quantity:    totalQty,
    fromStore:   branchLabel + ' →（調至租借）',
    toStore:     rental.name,
    type:        '跨類型調撥'
  });

  // 第 2~N+1 筆：各目標營地各自增加
  distributions.forEach(function (d) {
    var campLabel = ADMIN_RENTAL_CAMP_LABELS[d.campKey] || d.campKey;
    items.push({
      productName: rental.name + '（租借）',
      quantity:    d.quantity,
      fromStore:   '←（來自商店）' + product.name,
      toStore:     campLabel,
      type:        '跨類型調撥'
    });
  });

  return items;
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
      '<tr><td colspan="8" class="text-center text-muted py-4">目前沒有商品</td></tr>'
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

  $('#productsTableBody').html(html);
  updateMovementGenerateButtonState();

  if (typeof window.applyEditPermission === 'function') {
    window.applyEditPermission('products', $('#contentArea'));
  }
}


// 將租借商品快取渲染到租借表格，庫存欄位使用 camp 數量加總。
function renderRentalProductsTable(rentals) {
  if (!rentals || rentals.length === 0) {
    $('#rentalProductsTableBody').html(
      '<tr><td colspan="10" class="text-center text-muted py-4">目前沒有租借商品</td></tr>'
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
