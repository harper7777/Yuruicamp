// ========================================
// 商品列表頁面邏輯 (Product List Page)
// 步驟 5.1 ~ 5.4
// ========================================

// ----------------------------------------
// 應用狀態（只在這個頁面用到）
// Page-level state
// ----------------------------------------
const _state = {
  allProducts:      [],   // 從 API 取得的全部商品
  filteredProducts: [],   // 套用篩選後的商品
  currentPage:      1,    // 當前頁碼
  pageSize:         12,   // 每頁顯示幾筆

  // 篩選條件
  filters: {
    category:   '',      // 分類（空 = 全部）
    brands:     [],      // 品牌（空陣列 = 全部）
    minPrice:   null,    // 最低價格
    maxPrice:   null,    // 最高價格
    tag:        '',      // 快選標籤（'new' | 'bestseller' | ''）
  },

  sortBy: 'default',    // 排序方式
};

// ----------------------------------------
// 工具：計算折扣百分比
// ----------------------------------------
function _calcDiscount(original, current) {
  if (!original || original <= current) return '';
  return `-${Math.round((1 - current / original) * 100)}%`;
}

// ----------------------------------------
// 工具：渲染星星
// ----------------------------------------
function _renderStars(rating) {
  const full  = Math.floor(rating);
  const empty = 5 - full;
  let html    = '';
  for (let i = 0; i < full; i++)  html += '<span class="star">★</span>';
  for (let i = 0; i < empty; i++) html += '<span class="star empty">★</span>';
  return `<span class="star-rating">${html}</span>`;
}

// ----------------------------------------
// 工具：建立商品卡片 HTML
// Build product card HTML
// ----------------------------------------
function _buildCard(product) {
  const discount = _calcDiscount(product.originalPrice, product.price);

  let badgeHTML = '';
  if (product.isNew)          badgeHTML = '<span class="product-card-badge badge-new">NEW</span>';
  else if (product.isBestSeller) badgeHTML = '<span class="product-card-badge badge-hot">熱銷</span>';

  const priceFormatted    = product.price.toLocaleString('zh-TW');
  const origPriceFormatted = product.originalPrice
    ? product.originalPrice.toLocaleString('zh-TW')
    : null;

  return `
    <div class="product-card" data-product-id="${product.id}" role="article">
      <div class="product-card-image-wrap">
        <img
          src="${product.image}"
          alt="${product.name}"
          loading="lazy"
          onerror="this.src='https://placehold.co/400x300/f2f2f2/999?text=${encodeURIComponent(product.name)}'"
        >
        ${badgeHTML}
      </div>
      <div class="product-card-body">
        <p class="product-card-brand">${product.brand}</p>
        <h3 class="product-card-name">${product.name}</h3>
        <div class="product-card-rating">
          ${_renderStars(product.rating)}
          <span>${product.rating}</span>
          <span>(${product.reviews})</span>
        </div>
        <div class="product-card-price">
          <span class="price-current">NT$ ${priceFormatted}</span>
          ${origPriceFormatted ? `<span class="price-original">NT$ ${origPriceFormatted}</span>` : ''}
        </div>
        ${discount ? `<span class="price-discount">${discount}</span>` : ''}
        <button class="product-card-add-btn" data-product-id="${product.id}">
          加入購物車
        </button>
      </div>
    </div>
  `;
}

// ----------------------------------------
// 渲染商品網格（含空狀態）
// Render products grid
// ----------------------------------------
function _renderGrid() {
  const grid = document.getElementById('productsGrid');
  const countEl = document.getElementById('productCount');
  if (!grid) return;

  // 計算當前頁的商品
  const start    = (_state.currentPage - 1) * _state.pageSize;
  const end      = start + _state.pageSize;
  const paginated = _state.filteredProducts.slice(start, end);

  // 更新商品數量顯示
  if (countEl) {
    countEl.textContent = `共 ${_state.filteredProducts.length} 件商品`;
  }

  // 沒有商品 → 顯示空狀態
  if (_state.filteredProducts.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column:1/-1;">
        <span class="empty-state-icon">🔍</span>
        <p class="empty-state-title">沒有符合條件的商品</p>
        <p class="empty-state-desc">試著調整篩選條件看看</p>
        <button class="btn btn-outline" style="margin-top:1rem;" onclick="_resetAllFilters()">
          清除篩選
        </button>
      </div>
    `;
    _renderPagination();
    return;
  }

  grid.innerHTML = paginated.map(p => _buildCard(p)).join('');
  _renderPagination();
  _bindCardEvents();
}

// ----------------------------------------
// 渲染分頁控制列
// Render pagination buttons
// ----------------------------------------
function _renderPagination() {
  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;

  const totalPages = Math.ceil(_state.filteredProducts.length / _state.pageSize);

  // 商品數不超過一頁就不顯示分頁
  if (totalPages <= 1) {
    paginationEl.style.display = 'none';
    return;
  }

  paginationEl.style.display = 'flex';

  let html = '';

  // 上一頁按鈕
  html += `<button
    class="pagination-btn"
    ${_state.currentPage === 1 ? 'disabled' : ''}
    data-page="${_state.currentPage - 1}"
    aria-label="上一頁"
  >‹</button>`;

  // 頁碼按鈕（最多顯示 5 頁）
  const range = 2;
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= _state.currentPage - range && i <= _state.currentPage + range)
    ) {
      html += `<button
        class="pagination-btn${i === _state.currentPage ? ' active' : ''}"
        data-page="${i}"
        aria-label="第 ${i} 頁"
        ${i === _state.currentPage ? 'aria-current="page"' : ''}
      >${i}</button>`;
    } else if (
      i === _state.currentPage - range - 1 ||
      i === _state.currentPage + range + 1
    ) {
      html += `<span style="padding:0 0.25rem; color:#999;">…</span>`;
    }
  }

  // 下一頁按鈕
  html += `<button
    class="pagination-btn"
    ${_state.currentPage === totalPages ? 'disabled' : ''}
    data-page="${_state.currentPage + 1}"
    aria-label="下一頁"
  >›</button>`;

  paginationEl.innerHTML = html;

  // 綁定頁碼點擊
  paginationEl.querySelectorAll('.pagination-btn:not([disabled])').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = parseInt(btn.dataset.page, 10);
      _goToPage(page);
    });
  });
}

// ----------------------------------------
// 跳轉至指定頁
// ----------------------------------------
function _goToPage(page) {
  const totalPages = Math.ceil(_state.filteredProducts.length / _state.pageSize);
  if (page < 1 || page > totalPages) return;
  _state.currentPage = page;
  _renderGrid();
  // 捲回頂部
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ----------------------------------------
// 套用所有篩選條件，更新 filteredProducts
// Apply all current filters to allProducts
// ----------------------------------------
function _applyFilters() {
  let result = [..._state.allProducts];
  const f = _state.filters;

  // ① 分類篩選
  if (f.category) {
    result = result.filter(p => p.category === f.category);
  }

  // ② 品牌篩選（多選）
  if (f.brands.length > 0) {
    result = result.filter(p => f.brands.includes(p.brand));
  }

  // ③ 價格範圍
  if (f.minPrice !== null) {
    result = result.filter(p => p.price >= f.minPrice);
  }
  if (f.maxPrice !== null) {
    result = result.filter(p => p.price <= f.maxPrice);
  }

  // ④ 快選標籤
  if (f.tag === 'new') {
    result = result.filter(p => p.isNew === true);
  } else if (f.tag === 'bestseller') {
    result = result.filter(p => p.isBestSeller === true);
  }

  // ⑤ 排序
  switch (_state.sortBy) {
    case 'price-asc':
      result.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      result.sort((a, b) => b.price - a.price);
      break;
    case 'rating':
      result.sort((a, b) => b.rating - a.rating);
      break;
    case 'reviews':
      result.sort((a, b) => b.reviews - a.reviews);
      break;
    default:
      break;
  }

  _state.filteredProducts = result;
  _state.currentPage = 1; // 篩選後從第一頁開始
  _renderGrid();
}

// ----------------------------------------
// 重置全部篩選
// ----------------------------------------
window._resetAllFilters = function () {
  _state.filters = { category: '', brands: [], minPrice: null, maxPrice: null, tag: '' };

  // 重置 UI
  document.querySelectorAll('.filter-category-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.category === '');
  });
  document.querySelectorAll('.filter-brand-list input[type="checkbox"]').forEach(cb => {
    cb.checked = false;
  });

  const priceMinEls = document.querySelectorAll('#priceMin, #mobilePriceMin');
  const priceMaxEls = document.querySelectorAll('#priceMax, #mobilePriceMax');
  priceMinEls.forEach(el => { if (el) el.value = ''; });
  priceMaxEls.forEach(el => { if (el) el.value = ''; });

  // 快選標籤
  document.querySelectorAll('[data-tag]').forEach(b => b.classList.remove('active'));

  _applyFilters();
};

// ----------------------------------------
// 步驟 5.1：初始化 PC 版篩選器
// Initialize desktop sidebar filters
// ----------------------------------------
function _initSidebarFilters() {
  // 從所有商品取得不重複的分類和品牌
  const categories = ['全部', ...new Set(_state.allProducts.map(p => p.category))];
  const brands     = [...new Set(_state.allProducts.map(p => p.brand))].sort();

  // 渲染分類按鈕（Desktop + Mobile）
  ['categoryFilterList', 'mobileCategoryFilterList'].forEach(listId => {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = categories.map(cat => {
      const value = cat === '全部' ? '' : cat;
      return `<li><button class="filter-category-btn${value === '' ? ' active' : ''}" data-category="${value}">${cat}</button></li>`;
    }).join('');

    // 點擊事件
    list.querySelectorAll('.filter-category-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        list.querySelectorAll('.filter-category-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        _state.filters.category = btn.dataset.category;

        // 同步兩個篩選器的選中狀態
        _syncCategoryFilters(btn.dataset.category);

        if (listId === 'categoryFilterList') {
          _applyFilters();
        }
      });
    });
  });

  // 渲染品牌 Checkbox（Desktop + Mobile）
  ['brandFilterList', 'mobileBrandFilterList'].forEach(listId => {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = brands.map(brand => `
      <li class="filter-brand-item">
        <input
          type="checkbox"
          id="${listId}-${brand}"
          name="brand"
          value="${brand}"
          aria-label="${brand}"
        >
        <label for="${listId}-${brand}">${brand}</label>
      </li>
    `).join('');

    // PC 版品牌 Checkbox 直接觸發篩選
    if (listId === 'brandFilterList') {
      list.querySelectorAll('input[type="checkbox"]').forEach(cb => {
        cb.addEventListener('change', () => {
          _state.filters.brands = Array.from(
            document.querySelectorAll('#brandFilterList input:checked')
          ).map(el => el.value);
          _applyFilters();
        });
      });
    }
  });

  // PC 版：套用價格
  const applyPriceBtn = document.getElementById('applyPriceBtn');
  if (applyPriceBtn) {
    applyPriceBtn.addEventListener('click', () => {
      const minVal = parseFloat(document.getElementById('priceMin').value);
      const maxVal = parseFloat(document.getElementById('priceMax').value);
      _state.filters.minPrice = isNaN(minVal) ? null : minVal;
      _state.filters.maxPrice = isNaN(maxVal) ? null : maxVal;
      _applyFilters();
    });
  }

  // PC 版：重置按鈕
  const resetBtn = document.getElementById('resetFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', window._resetAllFilters);
  }

  // 快選標籤（最新/熱銷）
  const filterNewBtn  = document.getElementById('filterNewBtn');
  const filterBestBtn = document.getElementById('filterBestBtn');

  if (filterNewBtn) {
    filterNewBtn.addEventListener('click', () => {
      const isActive = filterNewBtn.classList.toggle('active');
      _state.filters.tag = isActive ? 'new' : '';
      if (filterBestBtn) filterBestBtn.classList.remove('active');
      _applyFilters();
    });
  }

  if (filterBestBtn) {
    filterBestBtn.addEventListener('click', () => {
      const isActive = filterBestBtn.classList.toggle('active');
      _state.filters.tag = isActive ? 'bestseller' : '';
      if (filterNewBtn) filterNewBtn.classList.remove('active');
      _applyFilters();
    });
  }
}

// ----------------------------------------
// 同步兩個篩選器的分類選中狀態
// Sync category selection between desktop and mobile
// ----------------------------------------
function _syncCategoryFilters(category) {
  ['categoryFilterList', 'mobileCategoryFilterList'].forEach(listId => {
    const list = document.getElementById(listId);
    if (!list) return;
    list.querySelectorAll('.filter-category-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.category === category);
    });
  });
}

// ----------------------------------------
// 步驟 5.3：初始化手機版 Bottom Sheet
// Initialize mobile filter sheet
// ----------------------------------------
function _initMobileFilterSheet() {
  const openBtn   = document.getElementById('mobileFilterBtn');
  const sheet     = document.getElementById('filterSheet');
  const closeBtn  = document.getElementById('filterSheetClose');
  const backdrop  = document.getElementById('filterSheetBackdrop');
  const applyBtn  = document.getElementById('mobileApplyBtn');
  const resetBtn  = document.getElementById('mobileResetBtn');

  if (!openBtn || !sheet) return;

  // 開啟 Sheet
  function openSheet() {
    sheet.classList.add('active');
    if (backdrop) backdrop.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  // 關閉 Sheet
  function closeSheet() {
    sheet.classList.remove('active');
    if (backdrop) backdrop.classList.remove('active');
    document.body.style.overflow = '';
  }

  openBtn.addEventListener('click', openSheet);
  if (closeBtn)  closeBtn.addEventListener('click', closeSheet);
  if (backdrop)  backdrop.addEventListener('click', closeSheet);

  // 套用篩選
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      // 讀取手機篩選表單的值
      _state.filters.brands = Array.from(
        document.querySelectorAll('#mobileBrandFilterList input:checked')
      ).map(el => el.value);

      const mobileMin = parseFloat(document.getElementById('mobilePriceMin')?.value);
      const mobileMax = parseFloat(document.getElementById('mobilePriceMax')?.value);
      _state.filters.minPrice = isNaN(mobileMin) ? null : mobileMin;
      _state.filters.maxPrice = isNaN(mobileMax) ? null : mobileMax;

      closeSheet();
      _applyFilters();
    });
  }

  // 重置
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      window._resetAllFilters();
      closeSheet();
    });
  }
}

// ----------------------------------------
// 初始化排序下拉
// Initialize sort dropdown
// ----------------------------------------
function _initSortSelect() {
  const select = document.getElementById('sortSelect');
  if (!select) return;

  select.addEventListener('change', () => {
    _state.sortBy = select.value;
    _applyFilters();
  });
}

// ----------------------------------------
// 處理從 URL 參數帶入的快選篩選
// Handle URL query params (e.g. ?filter=new)
// ----------------------------------------
function _handleUrlParams() {
  const params = new URLSearchParams(window.location.search);
  const filter = params.get('filter');

  if (filter === 'new') {
    _state.filters.tag = 'new';
    const btn = document.getElementById('filterNewBtn');
    if (btn) btn.classList.add('active');
  } else if (filter === 'bestseller') {
    _state.filters.tag = 'bestseller';
    const btn = document.getElementById('filterBestBtn');
    if (btn) btn.classList.add('active');
  }
}

// ----------------------------------------
// 綁定商品卡片點擊事件
// Bind click events on product cards
// ----------------------------------------
function _bindCardEvents() {
  const grid = document.getElementById('productsGrid');
  if (!grid) return;

  // 移除舊的監聽器再加新的，避免重複綁定
  const newGrid = grid.cloneNode(true);
  grid.parentNode.replaceChild(newGrid, grid);

  newGrid.addEventListener('click', async (e) => {
    // ① 底部「加入購物車」按鈕
    if (e.target.classList.contains('product-card-add-btn')) {
      e.stopPropagation();
      await _handleAddToCart(e.target.dataset.productId);
      return;
    }

    // ② 點卡片其他區域 → 跳轉詳情頁
    const card = e.target.closest('.product-card');
    if (card) {
      window.location.href = `product-detail.html?id=${card.dataset.productId}`;
    }
  });
}

// ----------------------------------------
// 處理加入購物車
// ----------------------------------------
async function _handleAddToCart(productId) {
  try {
    const product = _state.allProducts.find(p => p.id === productId);
    if (!product) return;

    window.addToCart({
      id:    product.id,
      name:  product.name,
      price: product.price,
      image: product.image,
      brand: product.brand,
    }, 1);

    // Badge 動畫
    const badge = document.querySelector('.cart-badge');
    if (badge) {
      badge.classList.add('badge-bounce');
      setTimeout(() => badge.classList.remove('badge-bounce'), 600);
    }
  } catch (error) {
    console.error('加入購物車失敗:', error);
    window.showToast('加入失敗，請稍後再試', 'error');
  }
}

// ========================================
// 廣告輪播初始化（抓取 NEW 商品）
// ========================================
function _initAdCarousel() {
  const newProducts = _state.allProducts.filter(p => p.isNew);
  if (!newProducts || newProducts.length === 0) {
    // 如果沒有 NEW 商品，隱藏廣告輪播
    const container = document.querySelector('.ad-carousel-container');
    if (container) container.style.display = 'none';
    return;
  }

  const slidesContainer = document.getElementById('adCarouselSlides');
  const dotsContainer = document.getElementById('adCarouselDots');
  
  if (!slidesContainer || !dotsContainer) return;

  let currentSlide = 0;

  // 生成 slides 和 dots
  slidesContainer.innerHTML = newProducts.map((product, idx) => `
    <div class="ad-carousel-slide" data-product-id="${product.id}">
      <div class="ad-carousel-content">
        <span class="ad-carousel-badge">🆕 NEW</span>
        <h3 class="ad-carousel-title">${product.name}</h3>
        <p class="ad-carousel-desc">${product.brand}</p>
        <p class="ad-carousel-price">NT$ ${product.price.toLocaleString('zh-TW')}</p>
      </div>
      <img src="${product.image}" alt="${product.name}" class="ad-carousel-image" loading="lazy" onerror="this.src='https://placehold.co/200x200/f2f2f2/999?text=Image'">
    </div>
  `).join('');

  dotsContainer.innerHTML = newProducts.map((_, idx) => 
    `<button class="ad-carousel-dot ${idx === 0 ? 'active' : ''}" data-slide="${idx}" title="第 ${idx + 1} 個廣告"></button>`
  ).join('');

  // 輪播邏輯
  function goToSlide(n) {
    if (n >= newProducts.length) currentSlide = 0;
    else if (n < 0) currentSlide = newProducts.length - 1;
    else currentSlide = n;

    const offset = -currentSlide * 100;
    slidesContainer.style.transform = `translateX(${offset}%)`;

    // 更新 dots
    document.querySelectorAll('.ad-carousel-dot').forEach((dot, idx) => {
      dot.classList.toggle('active', idx === currentSlide);
    });
  }

  // 按鈕事件
  document.getElementById('adCarouselPrev').addEventListener('click', () => goToSlide(currentSlide - 1));
  document.getElementById('adCarouselNext').addEventListener('click', () => goToSlide(currentSlide + 1));

  // Dots 點擊
  document.querySelectorAll('.ad-carousel-dot').forEach(dot => {
    dot.addEventListener('click', () => goToSlide(parseInt(dot.dataset.slide)));
  });

  // Slide 點擊進入商品詳情
  slidesContainer.addEventListener('click', (e) => {
    const slide = e.target.closest('.ad-carousel-slide');
    if (slide) {
      window.location.href = `product-detail.html?id=${slide.dataset.productId}`;
    }
  });

  // 自動輪播（可選）
  setInterval(() => goToSlide(currentSlide + 1), 5000);
}

// ========================================
// 商品列表頁初始化入口
// Product list page init entry point
// ========================================
window.initProductListPage = async () => {
  console.log('📌 商品列表頁初始化中...');

  // 初始化全局組件，並設旗標告知 main.js 已完成
  // Initialize global components, set flag so main.js won't run them again
  window.initNavbar();
  window.initModalListeners();
  window.initPersonalizationModal();
  window.initCartListeners();
  window._appComponentsInitialized = true;

  try {
    // ① 從 Mock API 取得所有商品
    _state.allProducts = await window.API.products.getAll();

    // ② 處理 URL 參數（如 ?filter=new）
    _handleUrlParams();

    // ③ 初始化各種篩選 UI
    _initSidebarFilters();
    _initMobileFilterSheet();
    _initSortSelect();

    // ④ 套用初始篩選（可能來自 URL 參數）並渲染
    _applyFilters();

    // ⑤ 初始化廣告輪播（抓取 NEW 商品）
    _initAdCarousel();

    console.log(`✓ 商品列表載入完成，共 ${_state.allProducts.length} 件商品`);

  } catch (error) {
    console.error('商品列表載入失敗:', error);
    const grid = document.getElementById('productsGrid');
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1;">
          <span class="empty-state-icon">⚠️</span>
          <p class="empty-state-title">商品載入失敗</p>
          <p class="empty-state-desc">請重新整理頁面，或稍後再試</p>
        </div>
      `;
    }
  }
};

// 等 DOM 完成後自動執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.initProductListPage);
} else {
  window.initProductListPage();
}

console.log('✓ product-list.js 已載入');
