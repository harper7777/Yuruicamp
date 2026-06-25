// ========================================
// 輪播組件
// ========================================

/**
 * 初始化輪播功能
 * @param {string} carouselSelector - 輪播容器選擇器
 * @param {Object} options - 配置選項
 */
window.initCarousel = (carouselSelector, options = {}) => {
  const carousel = document.querySelector(carouselSelector);
  if (!carousel) return;
  
  const defaultOptions = {
    autoplay: true,
    interval: 5000,
    duration: 500,
    loop: true,
  };
  
  const config = { ...defaultOptions, ...options };
  
  const track = carousel.querySelector('.carousel-track');
  const items = carousel.querySelectorAll('.carousel-item');
  const prevBtn = carousel.querySelector('.carousel-prev');
  const nextBtn = carousel.querySelector('.carousel-next');
  
  let currentIndex = 0;
  let autoplayTimer = null;
  
  const showSlide = (index) => {
    if (items.length === 0) return;
    
    if (config.loop) {
      currentIndex = (index + items.length) % items.length;
    } else {
      currentIndex = Math.max(0, Math.min(index, items.length - 1));
    }
    
    const offset = -currentIndex * 100;
    track.style.transform = `translateX(${offset}%)`;
  };
  
  const goToSlide = (index) => {
    showSlide(index);
    resetAutoplay();
  };
  
  const nextSlide = () => goToSlide(currentIndex + 1);
  const prevSlide = () => goToSlide(currentIndex - 1);
  
  const resetAutoplay = () => {
    clearInterval(autoplayTimer);
    if (config.autoplay) {
      autoplayTimer = setInterval(nextSlide, config.interval);
    }
  };
  
  // 事件監聽
  prevBtn?.addEventListener('click', prevSlide);
  nextBtn?.addEventListener('click', nextSlide);
  
  // 懸停暫停自動播放
  carousel?.addEventListener('mouseenter', () => clearInterval(autoplayTimer));
  carousel?.addEventListener('mouseleave', resetAutoplay);
  
  // 初始化
  showSlide(0);
  resetAutoplay();
  
  // 保存控制方法
  carousel.carouselControl = {
    next: nextSlide,
    prev: prevSlide,
    goTo: goToSlide,
  };
};

console.log('✓ Carousel 組件已初始化');
