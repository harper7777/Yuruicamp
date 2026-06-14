/**
 * admin/js/reviews.js
 * 評論管理模組
 * 使用 jQuery Event Namespace (.reviews) 防止重複導覽時事件堆疊
 *
 * 容器 ID：#reviewsContainer
 * 篩選按鈕：.filter-btn（帶 data-filter="all|unreplied|replied"）
 * Tab Badge：#tabCountAll, #tabCountUnreplied, #tabCountReplied
 */

window.initReviews = function () {
  $(document).off('.reviews');

  $.getJSON('data/reviews.json', function (reviews) {
    renderReviewCards(reviews);

    // 更新 Tab 計數 Badge
    var totalCount    = reviews.length;
    var repliedCount  = reviews.filter(function (r) { return r.replied === true; }).length;
    var unrepCount    = totalCount - repliedCount;
    $('#tabCountAll').text(totalCount);
    $('#tabCountUnreplied').text(unrepCount);
    $('#tabCountReplied').text(repliedCount);
  }).fail(function () {
    $('#reviewsContainer').html(
      '<div class="alert alert-danger">' +
      '<i class="fas fa-exclamation-triangle me-2"></i>載入評論數據失敗' +
      '</div>'
    );
  });

  // 篩選切換（.filter-btn 帶 data-filter 屬性）
  $(document).on('click.reviews', '.filter-btn', function () {
    var filter = $(this).data('filter');

    // 更新按鈕 active 樣式
    $('.filter-btn').removeClass('active btn-dark').addClass('btn-outline-secondary');
    $(this).removeClass('btn-outline-secondary').addClass('active btn-dark');

    if (filter === 'all') {
      $('.review-card').show();
    } else if (filter === 'unreplied') {
      $('.review-card').hide();
      $('.review-card[data-replied="false"]').show();
    } else if (filter === 'replied') {
      $('.review-card').hide();
      $('.review-card[data-replied="true"]').show();
    }
  });

  // 展開回覆輸入框
  $(document).on('click.reviews', '.btn-reply-toggle', function () {
    var $form = $(this).closest('.review-card').find('.reply-form');
    $form.toggleClass('d-none');
    if (!$form.hasClass('d-none')) {
      $form.find('textarea').trigger('focus');
    }
  });

  // 提交回覆
  $(document).on('click.reviews', '.btn-submit-reply', function () {
    var $card     = $(this).closest('.review-card');
    var reviewId  = $card.data('review-id');
    var $textarea = $card.find('.reply-form textarea');
    var replyText = $textarea.val().trim();

    if (!replyText) {
      window.showAdminToast('回覆內容不能為空', 'danger');
      return;
    }

    $card.find('.reply-form').addClass('d-none');
    $card.attr('data-replied', 'true');
    $card.find('.replied-badge')
         .removeClass('bg-warning text-dark')
         .addClass('bg-success')
         .text('已回覆');
    $card.find('.btn-reply-toggle').hide();
    $card.find('.reply-display').remove();
    $card.find('.card-body').append(
      '<div class="reply-display mt-3 p-3 bg-light border-start border-3 border-success rounded-end">' +
      '<div class="small text-muted mb-1"><i class="fas fa-store me-1"></i>賣家回覆</div>' +
      '<p class="mb-0 small">' + $('<div>').text(replyText).html() + '</p>' +
      '</div>'
    );

    // 更新 Tab 計數 Badge
    var totalCards    = $('.review-card').length;
    var repliedCards  = $('.review-card[data-replied="true"]').length;
    $('#tabCountAll').text(totalCards);
    $('#tabCountReplied').text(repliedCards);
    $('#tabCountUnreplied').text(totalCards - repliedCards);

    window.showAdminToast('評論 ' + reviewId + ' 已送出回覆');
  });
};

/**
 * 渲染星星評分（1-5 顆）
 * @param {number} rating
 */
function renderStars(rating) {
  var html = '';
  for (var i = 1; i <= 5; i++) {
    html += i <= rating
      ? '<i class="fas fa-star text-warning"></i>'
      : '<i class="far fa-star text-muted"></i>';
  }
  return html;
}

/**
 * 將 reviews 陣列渲染成卡片清單，填入 #reviewsContainer
 * @param {Array} reviews - reviews.json 的資料陣列
 */
function renderReviewCards(reviews) {
  if (!reviews || reviews.length === 0) {
    $('#reviewsContainer').html('<div class="text-center text-muted py-4">目前沒有評論</div>');
    return;
  }

  var html = '<div class="row g-3">' +
    reviews.map(function (r) {
      var isReplied    = r.replied === true;
      var repliedBadge = isReplied
        ? '<span class="badge bg-success replied-badge">已回覆</span>'
        : '<span class="badge bg-warning text-dark replied-badge">待回覆</span>';

      var replyDisplayHtml = (isReplied && r.replyText)
        ? '<div class="reply-display mt-3 p-3 bg-light border-start border-3 border-success rounded-end">' +
          '<div class="small text-muted mb-1"><i class="fas fa-store me-1"></i>賣家回覆</div>' +
          '<p class="mb-0 small">' + r.replyText + '</p>' +
          '</div>'
        : '';

      var replyToggleBtn = isReplied ? '' :
        '<button class="btn btn-sm btn-outline-secondary btn-reply-toggle mt-2">' +
        '<i class="fas fa-reply me-1"></i>回覆</button>';

      var avatarSrc = r.buyerAvatar || 'https://placehold.co/40x40/cccccc/555555?text=U';

      return '<div class="col-12 col-md-6">' +
        '<div class="card shadow-sm review-card' + (isReplied ? '' : ' border-start border-3 border-danger') + '"' +
        ' data-review-id="' + r.id + '"' +
        ' data-replied="' + isReplied + '">' +
        '<div class="card-body">' +
        '<div class="d-flex align-items-start gap-3 mb-2">' +
        '<img src="' + avatarSrc + '" width="40" height="40"' +
        ' class="rounded-circle border object-fit-cover flex-shrink-0"' +
        ' onerror="this.src=\'https://placehold.co/40x40/cccccc/555555?text=U\'">' +
        '<div class="flex-grow-1">' +
        '<div class="d-flex justify-content-between align-items-center">' +
        '<span class="fw-semibold">' + r.buyerName + '</span>' +
        repliedBadge +
        '</div>' +
        '<div class="small text-muted">' + r.createdAt + ' · ' + r.productName + '</div>' +
        '<div class="mt-1">' + renderStars(r.rating) + '</div>' +
        '</div></div>' +
        '<p class="mb-1 small">' + r.comment + '</p>' +
        replyDisplayHtml +
        replyToggleBtn +
        '<div class="reply-form d-none mt-2">' +
        '<textarea class="form-control form-control-sm mb-1" rows="3" placeholder="輸入回覆內容..."></textarea>' +
        '<button class="btn btn-sm btn-success btn-submit-reply">' +
        '<i class="fas fa-paper-plane me-1"></i>送出回覆</button>' +
        '</div>' +
        '</div></div></div>';
    }).join('') +
    '</div>';

  $('#reviewsContainer').html(html);

  if (typeof window.applyEditPermission === 'function') {
    window.applyEditPermission('reviews', $('#contentArea'));
  }
}