/**
 * @deprecated
 * 重點：會員中心功能已集中到 ../../js/components/member-center.js，本檔只保留舊引用相容。
 */
(function () {
  'use strict';

  if (window.initMemberCenterComponent) {
    window.initMemberCenterComponent();
    return;
  }

  var currentScript = document.currentScript || document.querySelector('script[src$="booking/js/member-center.js"]');
  var script = document.createElement('script');
  script.src = new URL('../../js/components/member-center.js', currentScript && currentScript.src ? currentScript.src : window.location.href).toString();
  script.onload = function () {
    window.initMemberCenterComponent && window.initMemberCenterComponent();
  };
  document.head.appendChild(script);
})();
