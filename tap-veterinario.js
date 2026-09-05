(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const selector = `script[data-tap-module="${src}"]`;
      const existing = document.querySelector(selector);
      if (existing) {
        if (existing.dataset.loaded === '1') return resolve();
        existing.addEventListener('load', resolve, { once:true });
        existing.addEventListener('error', reject, { once:true });
        return;
      }

      const script = document.createElement('script');
      script.src = src + '?v=1';
      script.async = false;
      script.dataset.tapModule = src;
      script.addEventListener('load', () => {
        script.dataset.loaded = '1';
        resolve();
      }, { once:true });
      script.addEventListener('error', reject, { once:true });
      document.head.appendChild(script);
    });
  }

  (async () => {
    try {
      await loadScript('tap-categories.js');
      await loadScript('tap-personalizza-controller.js');
      await loadScript('tap-logo-optional.js');
      await loadScript('tap-custom-categories.js');
      await loadScript('tap-personalizza-ux.js');
      await loadScript('tap-personalizza-save.js');
      await loadScript('tap-personalizza-reliability.js');
      await loadScript('tap-preview-refresh.js');
    } catch (error) {
      console.error('Tapreputa: inizializzazione moduli Personalizza non riuscita.', error);
    }
  })();
})();
