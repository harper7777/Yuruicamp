/**
 * admin/js/customers.js
 * 客戶管理模組（已適配最新訂單 JSON 結構）
 * 使用 jQuery Event Namespace (.customers) 防止重複導覽時事件堆疊
 *
 * tagColorMap 的鍵值必須與 customers.json 的 tags 陣列完全一致（含中文）
 * inline editing 支援：按鈕儲存 + Enter 鍵儲存
 */

var tagColorMap = {
  VIP: "bg-warning text-dark",
  SVIP: "bg-danger",
  高消費: "bg-success",
  新會員: "bg-info text-dark",
  高退貨率: "bg-danger",
};

// 全域快取，避免切換頁面時重新 fetch 導致修改消失
window.customersData = window.customersData || null;
window.ordersData = window.ordersData || null; // 訂單資料全域快取

// ============================================================
// 工具函數 (已針對新訂單 JSON 調整)
// ============================================================
function _getStatusInfo(orderStatus) {
  var map = {
    unshipped: { label: "待出貨", cls: "bg-warning text-dark" },
    shipped: { label: "已出貨", cls: "bg-info text-dark" },
    delivered: { label: "已完成", cls: "bg-success" },
    returned: { label: "已退貨", cls: "bg-danger" },
    cancelled: { label: "已取消", cls: "bg-secondary" },
  };
  return map[orderStatus] || { label: orderStatus, cls: "bg-secondary" };
}

function _getPaymentLabel(paymentStatus) {
  var map = {
    paid: "已付款 (線上支付)",
    unpaid: "未付款",
    cod: "貨到付款",
  };
  return map[paymentStatus] || paymentStatus;
}

function getTagBadge(tag) {
  var cls = tagColorMap[tag] || "bg-secondary";
  return '<span class="badge ' + cls + ' me-1">' + tag + "</span>";
}

// ============================================================
// 主初始化函數
// ============================================================
window.initCustomers = function () {
  $(document).off(".customers");

  var customersDeferred = $.Deferred();
  var ordersDeferred = $.Deferred();

  // 1. 檢查/載入 客戶資料
  if (window.customersData) {
    customersDeferred.resolve(window.customersData);
  } else {
    $.getJSON("data/customers.json", function (customers) {
      window.customersData = customers;
      customersDeferred.resolve(customers);
    }).fail(function () {
      customersDeferred.reject();
    });
  }

  // 2. 檢查/載入 訂單資料 (自動相容相對路徑與絕對路徑)
  if (window.ordersData) {
    ordersDeferred.resolve(window.ordersData);
  } else {
    // 優先嘗試後台目錄下的 data/orders.json
    $.getJSON("data/orders.json", function (orders) {
      window.ordersData = orders;
      ordersDeferred.resolve(orders);
    }).fail(function () {
      // 失敗則嘗試前台相對路徑 ../data/orders.json
      $.getJSON("../data/orders.json", function (orders) {
        window.ordersData = orders;
        ordersDeferred.resolve(orders);
      }).fail(function () {
        console.error("【後台提示】找不到訂單 JSON 檔案，請確認路徑。");
        ordersDeferred.resolve([]); // 避免卡死客戶列表
      });
    });
  }

  // 3. 兩者都完成後進行渲染
  $.when(customersDeferred, ordersDeferred)
    .done(function (customers) {
      renderCustomersAccordion(customers);
    })
    .fail(function () {
      $("#customersAccordion").html(
        '<div class="alert alert-danger">' +
          '<i class="fas fa-exclamation-triangle me-2"></i>載入客戶或訂單數據失敗' +
          "</div>",
      );
    });

  // === Enter 鍵觸發儲存（適用所有 inline input）===
  $(document).on(
    "keydown.customers",
    ".tier-select, .points-input, .coupons-input",
    function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        var $wrap = $(this).closest(".tier-wrap, .points-wrap, .coupons-wrap");
        $wrap
          .find(".tier-save-btn, .points-save-btn, .coupons-save-btn")
          .trigger("click");
      }
    },
  );

  // === 會員等級 inline 編輯 ===
  $(document).on("click.customers", ".tier-edit-btn", function () {
    var $span = $(this).siblings(".tier-display");
    var currentTier = $span.text().trim();
    $span.replaceWith(
      '<select class="form-select form-select-sm tier-select d-inline-block" style="width:auto">' +
        '<option value="一般"' +
        (currentTier === "一般" ? " selected" : "") +
        ">一般</option>" +
        '<option value="VIP"' +
        (currentTier === "VIP" ? " selected" : "") +
        ">VIP</option>" +
        '<option value="SVIP"' +
        (currentTier === "SVIP" ? " selected" : "") +
        ">SVIP</option>" +
        "</select>",
    );
    $(this).hide();
    $(this).siblings(".tier-save-btn").show();
    $(this).siblings(".tier-cancel-btn").show().data("original", currentTier);
  });

  $(document).on("click.customers", ".tier-save-btn", function () {
    var $wrap = $(this).closest(".tier-wrap");
    var newTier = $wrap.find(".tier-select").val();
    var customerId = $(this).closest("tr").data("customer-id");

    if (window.customersData) {
      var customer = window.customersData.find(function (c) {
        return c.id == customerId;
      });
      if (customer) customer.tier = newTier;
    }

    $wrap
      .find(".tier-select")
      .replaceWith('<span class="tier-display">' + newTier + "</span>");
    $(this).hide();
    $wrap.find(".tier-cancel-btn").hide();
    $wrap.find(".tier-edit-btn").show();
    window.showAdminToast("客戶 " + customerId + " 等級已更新為 " + newTier);
  });

  $(document).on("click.customers", ".tier-cancel-btn", function () {
    var $wrap = $(this).closest(".tier-wrap");
    var original = $(this).data("original");
    $wrap
      .find(".tier-select")
      .replaceWith('<span class="tier-display">' + original + "</span>");
    $(this).hide();
    $wrap.find(".tier-save-btn").hide();
    $wrap.find(".tier-edit-btn").show();
  });

  // === 點數 inline 編輯 ===
  $(document).on("click.customers", ".points-edit-btn", function () {
    var $span = $(this).siblings(".points-display");
    var current = parseInt($span.text().trim(), 10) || 0;
    $span.replaceWith(
      '<input type="number" class="form-control form-control-sm points-input d-inline-block" ' +
        'value="' +
        current +
        '" min="0" style="width:90px">',
    );
    $(this).hide();
    $(this).siblings(".points-save-btn").show();
    $(this).siblings(".points-cancel-btn").show().data("original", current);
  });

  $(document).on("click.customers", ".points-save-btn", function () {
    var $wrap = $(this).closest(".points-wrap");
    var newVal = parseInt($wrap.find(".points-input").val(), 10) || 0;
    var customerId = $(this).closest("tr").data("customer-id");

    if (window.customersData) {
      var customer = window.customersData.find(function (c) {
        return c.id == customerId;
      });
      if (customer) customer.points = newVal;
    }

    $wrap
      .find(".points-input")
      .replaceWith('<span class="points-display">' + newVal + "</span>");
    $(this).hide();
    $wrap.find(".points-cancel-btn").hide();
    $wrap.find(".points-edit-btn").show();
    window.showAdminToast("客戶 " + customerId + " 點數已更新為 " + newVal);
  });

  $(document).on("click.customers", ".points-cancel-btn", function () {
    var $wrap = $(this).closest(".points-wrap");
    var original = $(this).data("original");
    $wrap
      .find(".points-input")
      .replaceWith('<span class="points-display">' + original + "</span>");
    $(this).hide();
    $wrap.find(".points-save-btn").hide();
    $wrap.find(".points-edit-btn").show();
  });

  // === 優惠券數量 inline 編輯 ===
  $(document).on("click.customers", ".coupons-edit-btn", function () {
    var $span = $(this).siblings(".coupons-display");
    var current = parseInt($span.text().trim(), 10) || 0;
    $span.replaceWith(
      '<input type="number" class="form-control form-control-sm coupons-input d-inline-block" ' +
        'value="' +
        current +
        '" min="0" style="width:75px">',
    );
    $(this).hide();
    $(this).siblings(".coupons-save-btn").show();
    $(this).siblings(".coupons-cancel-btn").show().data("original", current);
  });

  $(document).on("click.customers", ".coupons-save-btn", function () {
    var $wrap = $(this).closest(".coupons-wrap");
    var newVal = parseInt($wrap.find(".coupons-input").val(), 10) || 0;
    var customerId = $(this).closest("tr").data("customer-id");

    if (window.customersData) {
      var customer = window.customersData.find(function (c) {
        return c.id == customerId;
      });
      if (customer) customer.coupons = newVal;
    }

    $wrap
      .find(".coupons-input")
      .replaceWith('<span class="coupons-display">' + newVal + "</span>");
    $(this).hide();
    $wrap.find(".coupons-cancel-btn").hide();
    $wrap.find(".coupons-edit-btn").show();
    window.showAdminToast(
      "客戶 " + customerId + " 優惠券已更新為 " + newVal + " 張",
    );
  });

  $(document).on("click.customers", ".coupons-cancel-btn", function () {
    var $wrap = $(this).closest(".coupons-wrap");
    var original = $(this).data("original");
    $wrap
      .find(".coupons-input")
      .replaceWith('<span class="coupons-display">' + original + "</span>");
    $(this).hide();
    $wrap.find(".coupons-save-btn").hide();
    $wrap.find(".coupons-edit-btn").show();
  });

  // === 標籤 inline 編輯 ===
  $(document).on("click.customers", ".tags-edit-btn", function () {
    var $wrap = $(this).closest(".tags-wrap");
    var $display = $wrap.find(".tags-display");

    var currentTags = [];
    $display.find(".badge").each(function () {
      currentTags.push($(this).text().trim());
    });

    var checkboxesHtml =
      '<div class="tags-editor d-inline-flex flex-wrap gap-2">';
    Object.keys(tagColorMap).forEach(function (tag) {
      var isChecked = currentTags.indexOf(tag) !== -1 ? "checked" : "";
      checkboxesHtml +=
        '<div class="form-check form-check-inline mb-0 me-0">' +
        '<input class="form-check-input tag-checkbox" type="checkbox" value="' +
        tag +
        '" id="tag-' +
        tag +
        '" ' +
        isChecked +
        ">" +
        '<label class="form-check-label small" for="tag-' +
        tag +
        '">' +
        tag +
        "</label>" +
        "</div>";
    });
    checkboxesHtml += "</div>";

    $display.hide();
    $wrap.find(".tags-edit-container").prepend(checkboxesHtml);
    $(this).hide();
    $wrap.find(".tags-save-btn").removeClass("d-none");
    $wrap.find(".tags-cancel-btn").removeClass("d-none");
  });

  $(document).on("click.customers", ".tags-save-btn", function () {
    var $wrap = $(this).closest(".tags-wrap");
    var customerId = $(this).closest("tr").data("customer-id");

    var newTags = [];
    $wrap.find(".tag-checkbox:checked").each(function () {
      newTags.push($(this).val());
    });

    if (window.customersData) {
      var customer = window.customersData.find(function (c) {
        return c.id == customerId;
      });
      if (customer) customer.tags = newTags;
    }

    var tagsHtml =
      newTags.length > 0
        ? newTags.map(getTagBadge).join("")
        : '<span class="text-muted small">無標籤</span>';

    $("#heading-" + customerId)
      .find(".d-none.d-md-block")
      .html(tagsHtml);

    var $display = $wrap.find(".tags-display");
    $display.html(tagsHtml).show();

    $wrap.find(".tags-editor").remove();
    $(this).addClass("d-none");
    $wrap.find(".tags-cancel-btn").addClass("d-none");
    $wrap.find(".tags-edit-btn").show();

    window.showAdminToast("客戶 " + customerId + " 標籤已更新");
  });

  $(document).on("click.customers", ".tags-cancel-btn", function () {
    var $wrap = $(this).closest(".tags-wrap");
    $wrap.find(".tags-editor").remove();
    $wrap.find(".tags-display").show();
    $(this).addClass("d-none");
    $wrap.find(".tags-save-btn").addClass("d-none");
    $wrap.find(".tags-edit-btn").show();
  });

  // === 監聽點擊「查看明細」按鈕事件 ===
  $(document).on("click.customers", ".view-order-detail-btn", function () {
    var orderId = $(this).data("order-id");
    openAdminOrderDetail(orderId);
  });
};

/**
 * 開啟訂單詳情 Modal (已對接最新 JSON 格式欄位)
 * @param {string} orderId - 訂單 ID (例如：#0001)
 */
function openAdminOrderDetail(orderId) {
  if (!window.ordersData || window.ordersData.length === 0) {
    alert("目前沒有任何訂單快取資料，請檢查 orders.json 載入路徑是否正確。");
    return;
  }

  // 尋找對應的訂單
  var order = window.ordersData.find(function (o) {
    return o.id === orderId;
  });

  if (!order) {
    alert("找不到該筆訂單的詳細紀錄 (" + orderId + ")");
    return;
  }

  var statusInfo = _getStatusInfo(order.orderStatus);

  // 1. 解析商品明細 HTML（對應欄位：item.name, item.qty, item.price）
  var itemsHTML = "";
  if (order.items && order.items.length > 0) {
    itemsHTML = order.items
      .map(function (item) {
        var subTotal = (
          item.price * (item.qty || item.quantity || 0)
        ).toLocaleString();
        return (
          '<div class="d-flex align-items-center gap-3 mb-2 pb-2 border-bottom">' +
          '<div class="bg-secondary rounded text-white d-flex align-items-center justify-content-center" style="width:45px; height:45px; font-size:12px;">🏕️</div>' +
          '<div class="flex-grow-1">' +
          '<div class="fw-semibold small">' +
          item.name +
          "</div>" +
          '<div class="text-muted" style="font-size:0.75rem;">單價: NT$ ' +
          item.price.toLocaleString() +
          " &nbsp;｜&nbsp; 數量: " +
          (item.qty || item.quantity) +
          "</div>" +
          "</div>" +
          '<div class="fw-bold text-dark small">NT$ ' +
          subTotal +
          "</div>" +
          "</div>"
        );
      })
      .join("");
  } else {
    itemsHTML = '<div class="text-muted small py-2">無商品明細</div>';
  }

  // 2. 歷史狀態時間軸 (History Timeline)
  var historyHTML = "";
  if (order.history && order.history.length > 0) {
    historyHTML =
      '<div class="mt-3 bg-white p-2 rounded border" style="max-height: 120px; overflow-y: auto;">' +
      '<div class="fw-bold text-secondary mb-1" style="font-size:0.75rem;"><i class="fas fa-history me-1"></i> 訂單處理狀態紀錄</div>' +
      order.history
        .map(function (h) {
          return (
            '<div class="d-flex justify-content-between text-muted" style="font-size:0.7rem; line-height: 1.4;">' +
            "<span>• " +
            h.action +
            "</span><span>" +
            h.time +
            "</span>" +
            "</div>"
          );
        })
        .join("") +
      "</div>";
  }

  // 3. 檢查或建立 Modal 彈窗結構
  var $modal = $("#adminOrderDetailModal");
  if ($modal.length === 0) {
    var modalStructure =
      '<div class="modal fade" id="adminOrderDetailModal" tabindex="-1" aria-hidden="true">' +
      '<div class="modal-dialog modal-dialog-centered">' +
      '<div class="modal-content">' +
      '<div class="modal-header py-2 bg-light">' +
      '<h5 class="modal-title fs-6 fw-bold" id="adminOrderDetailTitle"></h5>' +
      '<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>' +
      "</div>" +
      '<div class="modal-body bg-light-subtle" id="adminOrderDetailBody"></div>' +
      "</div>" +
      "</div>" +
      "</div>";
    $("body").append(modalStructure);
    $modal = $("#adminOrderDetailModal");
  }

  // 4. 填充 Modal 抬頭與主體內容
  $("#adminOrderDetailTitle").text("訂單管理詳情 — " + order.id);

  var bodyContent =
    '<div class="d-flex justify-content-between align-items-center mb-3 bg-white p-2 rounded border">' +
    "<div>" +
    '<div class="small text-muted">成立時間: ' +
    order.createdAt +
    "</div>" +
    '<div class="small text-dark fw-semibold">購買人: ' +
    (order.buyerName || "未知客戶") +
    "</div>" +
    "</div>" +
    '<span class="badge ' +
    statusInfo.cls +
    ' fs-7 py-2 px-2">' +
    statusInfo.label +
    "</span>" +
    "</div>" +
    '<div class="bg-white p-2 rounded border mb-3">' +
    '<div class="fw-bold small text-success border-bottom pb-1 mb-2"><i class="fas fa-shopping-bag me-1"></i> 商品清單</div>' +
    itemsHTML +
    "</div>" +
    '<div class="bg-dark text-white p-2 rounded small mb-3 shadow-sm">' +
    '<div class="d-flex justify-content-between fw-bold fs-6"><span>訂單應繳總計</span><span>NT$ ' +
    order.total.toLocaleString() +
    "</span></div>" +
    "</div>" +
    '<div class="bg-white p-2 rounded border small text-secondary">' +
    '<div class="mb-1"><i class="fas fa-wallet me-1"></i> 付款狀態：<strong class="text-dark">' +
    _getPaymentLabel(order.paymentStatus) +
    "</strong></div>" +
    '<div><i class="fas fa-map-marker-alt me-1"></i> 配送地址：' +
    (order.address || "未提供配送地址") +
    "</div>" +
    "</div>" +
    historyHTML;

  $("#adminOrderDetailBody").html(bodyContent);

  // 5. 呼叫開彈窗
  var bsModal = new bootstrap.Modal(
    document.getElementById("adminOrderDetailModal"),
  );
  bsModal.show();
}

/**
 * 渲染客戶管理頁面的 Accordion
 * @param {Array} customers - customers.json 的資料陣列
 */
function renderCustomersAccordion(customers) {
  if (!customers || customers.length === 0) {
    $("#customersAccordion").html(
      '<div class="text-center text-muted py-4">目前沒有客戶資料</div>',
    );
    return;
  }

  var html = customers
    .map(function (c, idx) {
      var tagsHtml =
        c.tags && c.tags.length > 0
          ? c.tags.map(getTagBadge).join("")
          : '<span class="text-muted small">無標籤</span>';

      var ordersHtml =
        c.orders && c.orders.length > 0
          ? c.orders
              .map(function (orderId) {
                return (
                  '<li class="list-group-item d-flex justify-content-between align-items-center py-1 px-2 small">' +
                  '<div><i class="fas fa-receipt me-2 text-muted"></i>' +
                  orderId +
                  "</div>" +
                  '<button class="btn btn-outline-success btn-sm py-0 px-2 view-order-detail-btn" style="font-size: 0.75rem" data-order-id="' +
                  orderId +
                  '">查看明細</button>' +
                  "</li>"
                );
              })
              .join("")
          : '<li class="list-group-item text-muted small py-1 px-2">無購買記錄</li>';

      var collapseId = "collapse-" + c.id;
      var headingId = "heading-" + c.id;
      var isFirst = idx === 0;
      var avatarSrc =
        c.avatar || "https://placehold.co/40x40/cccccc/555555?text=U";

      return (
        '<div class="accordion-item">' +
        '<h2 class="accordion-header" id="' +
        headingId +
        '">' +
        '<button class="accordion-button' +
        (isFirst ? "" : " collapsed") +
        '"' +
        ' type="button" data-bs-toggle="collapse"' +
        ' data-bs-target="#' +
        collapseId +
        '"' +
        ' aria-expanded="' +
        (isFirst ? "true" : "false") +
        '"' +
        ' aria-controls="' +
        collapseId +
        '">' +
        '<img src="' +
        avatarSrc +
        '" width="40" height="40"' +
        ' class="rounded-circle me-3 border object-fit-cover"' +
        " onerror=\"this.src='https://placehold.co/40x40/cccccc/555555?text=U'\">" +
        '<div class="flex-grow-1">' +
        '<div class="fw-semibold">' +
        c.name +
        "</div>" +
        '<div class="small text-muted">' +
        c.email +
        "</div>" +
        "</div>" +
        '<div class="me-3 d-none d-md-block">' +
        tagsHtml +
        "</div>" +
        '<div class="text-end me-3">' +
        '<div class="fw-bold text-success">NT$ ' +
        c.totalSpent.toLocaleString() +
        "</div>" +
        '<div class="small text-muted">累計消費</div>' +
        "</div>" +
        "</button></h2>" +
        '<div id="' +
        collapseId +
        '"' +
        ' class="accordion-collapse collapse' +
        (isFirst ? " show" : "") +
        '"' +
        ' aria-labelledby="' +
        headingId +
        '">' +
        '<div class="accordion-body pt-0">' +
        '<table class="table table-sm mb-3"><tbody>' +
        '<tr data-customer-id="' +
        c.id +
        '">' +
        '<th class="text-muted" style="width:100px">會員等級</th>' +
        '<td><div class="tier-wrap d-flex align-items-center gap-1">' +
        '<span class="tier-display">' +
        (c.tier || "一般") +
        "</span>" +
        '<button class="btn btn-link btn-sm p-0 tier-edit-btn"><i class="fas fa-pencil-alt text-secondary"></i></button>' +
        '<button class="btn btn-sm btn-success tier-save-btn d-none py-0 px-1"><i class="fas fa-check"></i></button>' +
        '<button class="btn btn-sm btn-secondary tier-cancel-btn d-none py-0 px-1"><i class="fas fa-times"></i></button>' +
        "</div></td>" +
        '<th class="text-muted" style="width:60px">點數</th>' +
        '<td><div class="points-wrap d-flex align-items-center gap-1">' +
        '<span class="points-display">' +
        (c.points || 0) +
        "</span>" +
        '<button class="btn btn-link btn-sm p-0 points-edit-btn"><i class="fas fa-pencil-alt text-secondary"></i></button>' +
        '<button class="btn btn-sm btn-success points-save-btn d-none py-0 px-1"><i class="fas fa-check"></i></button>' +
        '<button class="btn btn-sm btn-secondary points-cancel-btn d-none py-0 px-1"><i class="fas fa-times"></i></button>' +
        "</div></td>" +
        '<th class="text-muted" style="width:70px">優惠券</th>' +
        '<td><div class="coupons-wrap d-flex align-items-center gap-1">' +
        '<span class="coupons-display">' +
        (c.coupons || 0) +
        "</span>" +
        '<button class="btn btn-link btn-sm p-0 coupons-edit-btn"><i class="fas fa-pencil-alt text-secondary"></i></button>' +
        '<button class="btn btn-sm btn-success coupons-save-btn d-none py-0 px-1"><i class="fas fa-check"></i></button>' +
        '<button class="btn btn-sm btn-secondary coupons-cancel-btn d-none py-0 px-1"><i class="fas fa-times"></i></button>' +
        "</div></td>" +
        "</tr>" +
        '<tr><th class="text-muted">聯絡電話</th><td colspan="5">' +
        (c.phone || "—") +
        "</td></tr>" +
        '<tr><th class="text-muted">標籤</th><td colspan="5">' +
        '<div class="tags-wrap d-flex align-items-center gap-1">' +
        '<div class="tags-edit-container d-inline-flex align-items-center gap-1">' +
        '<span class="tags-display">' +
        tagsHtml +
        "</span>" +
        "</div>" +
        '<button class="btn btn-link btn-sm p-0 tags-edit-btn"><i class="fas fa-pencil-alt text-secondary"></i></button>' +
        '<button class="btn btn-sm btn-success tags-save-btn d-none py-0 px-1"><i class="fas fa-check"></i></button>' +
        '<button class="btn btn-sm btn-secondary tags-cancel-btn d-none py-0 px-1"><i class="fas fa-times"></i></button>' +
        "</div>" +
        "</td></tr>" +
        "</tbody></table>" +
        '<p class="mb-1 fw-semibold small text-muted">購買記錄</p>' +
        '<ul class="list-group list-group-flush mb-0">' +
        ordersHtml +
        "</ul>" +
        "</div></div></div>"
      );
    })
    .join("");

  $("#customersAccordion").html(html);
}
