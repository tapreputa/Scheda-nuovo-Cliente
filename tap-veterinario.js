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
      const versions = {
        'tap-custom-categories.js': '5',
        'tap-macelleria-review.js': '3',
        'tap-polli-review.js': '5',
        'tap-pub-review.js': '1',
        'tap-ristorante-review.js': '2',
        'tap-ristorantemare-review.js': '1',
        'tap-stabilimento-review.js': '1',
        'tap-strumentimusicali-review.js': '1',
        'tap-svapostore-review.js': '3',
        'tap-logo-autocrop.js': '1'
      };
      const version = versions[src] || '1';
      script.src = src + '?v=' + version;
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
      await loadScript('tap-global-stars.js');
      await loadScript('tap-category-review-fixes.js');
      await loadScript('tap-category-mode-separation.js');
      await loadScript('tap-cartolibreria-review.js');
      await loadScript('tap-macelleria-review.js');
      await loadScript('tap-ottica-review.js');
      await loadScript('tap-panificio-review.js');
      await loadScript('tap-logo-autocrop.js');
      await loadScript('tap-panineria-review.js');
      await loadScript('tap-parrucchiere-review.js');
      await loadScript('tap-pasticceria-review.js');
      await loadScript('tap-pizzeria-review.js');
      await loadScript('tap-polli-review.js');
      await loadScript('tap-pub-review.js');
      await loadScript('tap-ristorante-review.js');
      await loadScript('tap-ristorantemare-review.js');
      await loadScript('tap-stabilimento-review.js');
      await loadScript('tap-strumentimusicali-review.js');
      await loadScript('tap-svapostore-review.js');
    } catch (error) {
      console.error('Tapreputa: inizializzazione moduli Personalizza non riuscita.', error);
    }
  })();
})();
