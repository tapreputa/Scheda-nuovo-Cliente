(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const BUILD_ID = '20260915-stable5.3';

  function syncAuthenticatedOperator() {
    const select = document.getElementById('operatorSelect');
    if (!select) return;
    const authenticatedName = String(document.body?.dataset?.tapOperator || '').trim();
    if (!authenticatedName) return;

    let option = Array.from(select.options).find(item => item.value === authenticatedName);
    if (!option) {
      option = document.createElement('option');
      option.value = authenticatedName;
      option.textContent = authenticatedName;
      select.appendChild(option);
    }
    select.value = authenticatedName;
  }

  const originalFetch = window.fetch.bind(window);
  window.fetch = function(input, init = {}) {
    try {
      const rawUrl = typeof input === 'string' ? input : input?.url;
      if (rawUrl) {
        const url = new URL(rawUrl, location.href);
        const fileName = decodeURIComponent(url.pathname.split('/').pop() || '');
        const isPreviewBackground = url.origin === location.origin && /^Sfondo/i.test(fileName);
        if (isPreviewBackground && init?.cache === 'no-store') {
          init = { ...init, cache: 'force-cache' };
        }
      }
    } catch {}
    return originalFetch(input, init);
  };

  const PREVIEW_BACKGROUNDS = Object.freeze({
    abbigliamento: 'Sfondoabbigliamento.png',
    autolavaggio: 'Sfondoautolavaggio.png',
    bar: 'Sfondobar.png',
    barextra: 'Sfondobarextra.webp?v=20260911-0035',
    barbershop: 'Sfondobarbershop.jpg',
    cartolibreria: 'Sfondocartolibreria.png',
    centroestetico: 'Sfondocentroestetico.jpg',
    detersivi: 'Sfondodetersivi.jpg',
    farmacia: 'Sfondofarmacia.jpg',
    fitness: 'Sfondofitness.jpg',
    gelateria: 'Sfondogelateria.jpg',
    hamburgeria: 'Sfondohamburgeria.png',
    ottica: 'Sfondoottica.png',
    panificio: 'Sfondopanificio.webp',
    parrucchiere: 'Sfondoparrucchiere.jpg',
    pasticceria: 'Sfondopasticceria.jpg',
    pizzeria: 'Sfondopizzeria.jpg',
    pub: 'Sfondopub.jpg',
    ristorante: 'Sfondoristorante.png',
    ristorantemare: 'Sfondoristorantemare.png',
    stabilimento: 'Sfondostabilimento.jpg',
    strumentimusicali: 'Sfondostrumentimusicali.png',
    svapostore: 'Sfondosvapostore.png',
    yogurteria: 'Sfondoyogurteria.jpg'
  });

  const warmedBackgrounds = new Set();
  function warmPreviewBackground() {
    const activity = document.getElementById('activityType');
    const file = PREVIEW_BACKGROUNDS[String(activity?.value || '')];
    if (!file || warmedBackgrounds.has(file)) return;
    warmedBackgrounds.add(file);
    const url = new URL(file, location.href).href;
    originalFetch(url, { cache: 'force-cache' }).catch(() => warmedBackgrounds.delete(file));
  }

  function installOperatorAndPreviewFixes() {
    syncAuthenticatedOperator();
    const activity = document.getElementById('activityType');
    if (activity && activity.dataset.tapPreviewWarm !== '1') {
      activity.dataset.tapPreviewWarm = '1';
      activity.addEventListener('change', warmPreviewBackground);
    }
    warmPreviewBackground();
    setTimeout(syncAuthenticatedOperator, 100);
    setTimeout(syncAuthenticatedOperator, 500);
  }

  const CORE_MODULES = Object.freeze([
    'tap-categories.js',
    'tap-template-manifest.js',
    'tap-project-config.js',
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
    'tap-template-stability.js',
    'tap-system-checks.js'
  ]);

  const MODULES = Object.freeze([...CORE_MODULES, ...APPROVED_CATEGORY_MODULES, ...FINAL_MODULES]);

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const selector = `script[data-tap-module="${src}"]`;
      const existing = document.querySelector(selector);
      if (existing) {
        if (existing.dataset.loaded === '1') return resolve();
        existing.addEventListener('load', resolve, { once:true });
        existing.addEventListener('error', () => reject(new Error('Modulo non caricato: ' + src)), { once:true });
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
      script.addEventListener('error', () => reject(new Error('Modulo non caricato: ' + src)), { once:true });
      document.head.appendChild(script);
    });
  }

  installOperatorAndPreviewFixes();

  (async () => {
    try {
      for (const src of MODULES) await loadScript(src);
      installOperatorAndPreviewFixes();
      document.documentElement.dataset.tapModulesBuild = BUILD_ID;
      window.TapPersonalizzaBuild = Object.freeze({
        id: BUILD_ID,
        modules: MODULES,
        core: CORE_MODULES,
        approvedCategoryModules: APPROVED_CATEGORY_MODULES,
        final: FINAL_MODULES
      });
    } catch (error) {
      console.error('Tapreputa: inizializzazione moduli Personalizza non riuscita.', error);
      const msg = document.getElementById('msg');
      if (msg) {
        msg.className = 'message show warn';
        msg.textContent = 'Un modulo dell’app non è stato caricato correttamente. Premi ↻ oppure riapri Personalizza prima di continuare.';
      }
    }
  })();
})();
