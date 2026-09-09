(() => {
  'use strict';

  if (document.documentElement.dataset.tapBottomNavLoaderBooted === '1') return;
  document.documentElement.dataset.tapBottomNavLoaderBooted = '1';

  const page = location.pathname.split('/').pop() || '';

  function loadExtras() {
    if (!document.querySelector('script[data-tap-potenziali-nav]')) {
      const patch = document.createElement('script');
      patch.src = 'tap-potenziali-nav.js?v=1';
      patch.dataset.tapPotenzialiNav = '1';
      document.head.appendChild(patch);
    }

    if (page === 'personalizza-potenziale.html' && !document.querySelector('script[data-tap-potenziale-save-v3]')) {
      const savePatch = document.createElement('script');
      savePatch.src = 'tap-potenziale-save-v3.js?v=2';
      savePatch.dataset.tapPotenzialeSaveV3 = '1';
      document.head.appendChild(savePatch);
    }
  }

  const existingNav = [...document.scripts].find(s => (s.src || '').includes('tap-global-bottom-nav.js'));
  if (existingNav) {
    loadExtras();
    return;
  }

  const script = document.createElement('script');
  script.src = 'tap-global-bottom-nav.js?v=2';
  script.dataset.tapGlobalBottomNav = '1';
  script.addEventListener('load', loadExtras, { once: true });
  document.head.appendChild(script);
})();
