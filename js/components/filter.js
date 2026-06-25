// ========================================
// 篩選組件
// ========================================

/**
 * 初始化篩選功能
 */
window.initFilters = () => {
  const filterForm = document.querySelector('.filter-form');
  
  if (filterForm) {
    filterForm.addEventListener('change', () => {
      window.applyFilters();
    });
  }
};

/**
 * 應用篩選條件
 */
window.applyFilters = () => {
  const filters = {
    category: document.querySelector('input[name="category"]:checked')?.value,
    minPrice: parseInt(document.querySelector('input[name="minPrice"]')?.value) || 0,
    maxPrice: parseInt(document.querySelector('input[name="maxPrice"]')?.value) || Infinity,
    brand: Array.from(document.querySelectorAll('input[name="brand"]:checked')).map(el => el.value),
  };
  
  // 觸發篩選事件（由頁面邏輯處理）
  window.dispatchEvent(new CustomEvent('filtersChanged', { detail: filters }));
};

/**
 * 重置篩選條件
 */
window.resetFilters = () => {
  const filterForm = document.querySelector('.filter-form');
  if (filterForm) {
    filterForm.reset();
    window.applyFilters();
  }
};

console.log('✓ Filter 組件已初始化');
