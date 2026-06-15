// ========================================
// Toast 提示組件
// ========================================

/**
 * 顯示 Toast 提示
 * @param {string} message - 提示消息
 * @param {string} type - 類型 ('success', 'error', 'warning', 'info')
 * @param {number} duration - 持續時間（毫秒）
 */
window.showToast = (message, type = 'info', duration = 3000) => {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  // 自動移除
  setTimeout(() => {
    toast.style.animation = 'slideOut 250ms ease-in-out forwards';
    setTimeout(() => toast.remove(), 250);
  }, duration);
};

// 定義 slideOut 動畫（如果 slideIn 已定義）
if (!document.querySelector('style[data-toast]')) {
  const style = document.createElement('style');
  style.setAttribute('data-toast', 'true');
  style.textContent = `
    @keyframes slideOut {
      from {
        transform: translateX(0);
        opacity: 1;
      }
      to {
        transform: translateX(400px);
        opacity: 0;
      }
    }
  `;
  document.head.appendChild(style);
}

console.log('✓ Toast 組件已初始化');
