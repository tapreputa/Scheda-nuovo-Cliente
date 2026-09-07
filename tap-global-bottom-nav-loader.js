(() => {
  'use strict';
  if (document.querySelector('script[data-tap-global-bottom-nav-loader]')) return;
  const script=document.createElement('script');
  script.src='tap-global-bottom-nav.js?v=2';
  script.dataset.tapGlobalBottomNavLoader='1';
  document.head.appendChild(script);
})();
