(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const BUILD_ID = '20260906-stable1';

  const CORE_MODULES = Object.freeze([
    'tap-categories.js',
    'tap-personalizza-controller.js',
    'tap-logo-optional.js',
    'tap-custom-categories.js',
    'tap-personalizza-ux.js',
    'tap-personalizza-save.js',
    'tap-personalizza-reliability.js',
    'tap-preview-refresh.js',
    'tap-global-stars.js',
    'tap-category-review-fixes.js',
    'tap-category-mode-separation.js'
  ]);

  const APPROVED_CATEGORY_MODULES = Object.freeze([
    'tap-cartolibreria-review.js',
    'tap-macelleria-review.js',
    'tap-ottica-review.js',
    'tap-panificio-review.js',
    'tap-logo-autocrop.js',
    'tap-panineria-review.js',
    'tap-parrucchiere-review.js',
    'tap-pasticceria-review.js',
    'tap-pizzeria-review.js',
    'tap-polli-review.js',
    'tap-pub-review.js',
    'tap-ristorante-review.js',
    'tap-ristorantemare-review.js',
    'tap-stabilimento-review.js',
    'tap-strumentimusicali-review.js',
    'tap-svapostore-review.js'
  ]);

  const FINAL_MODULES = Object.freeze([
    'tap-template-stability.js'
  ]);

  const MODULES = Object.freeze([...CORE_MODULES, ...APPROVED_CATEGORY_MODULES, ...FINAL_MODULES]);

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
      script.src = `${src}?build=${encodeURIComponent(BUILD_ID)}`;
      script.async = false;
      script.dataset.tapModule = src;
      script.dataset.tapBuild = BUILD_ID;
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
      for (const src of MODULES) await loadScript(src);
      document.documentElement.dataset.tapModulesBuild = BUILD_ID;
      window.TapPersonalizzaBuild = Object.freeze({
        id: BUILD_ID,
        modules: MODULES,
        core: CORE_MODULES,
        approvedCategoryModules: APPROVED_CATEGORY_MODULES
      });
    } catch (error) {
      console.error('Tapreputa: inizializzazione moduli Personalizza non riuscita.', error);
    }
  })();
})();
