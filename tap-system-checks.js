(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const BUILD_ID = window.TapProjectConfig?.build || window.TapTemplateStability?.build || '20260906-stable4';
  const registry = window.TapCategories;
  const project = window.TapProjectConfig;
  const msg = document.getElementById('msg');
  const activity = document.getElementById('activityType');
  const reviewInput = document.getElementById('destinationUrl');
  const operatorSelect = document.getElementById('operatorSelect');

  const errors = [];
  const warnings = [];

  function addError(text) {
    if (!errors.includes(text)) errors.push(text);
  }

  function addWarning(text) {
    if (!warnings.includes(text)) warnings.push(text);
  }

  function showProblem(text) {
    if (!msg) return;
    msg.className = 'message show warn';
    msg.textContent = text;
  }

  function validateRegistry() {
    if (!registry?.list?.length) {
      addError('Registro categorie non disponibile.');
      return false;
    }

    const seen = new Set();
    registry.list.forEach(category => {
      if (!category?.id) return addError('È presente una categoria senza ID.');
      if (seen.has(category.id)) addError('ID categoria duplicato: ' + category.id);
      seen.add(category.id);
      if (!category.label) addError('Etichetta mancante per la categoria ' + category.id + '.');
      if (category.id !== 'standard' && !category.background) addWarning('Sfondo non registrato per la categoria ' + category.id + '.');
      if (category.id !== 'standard' && !category.closed) addWarning('Categoria non marcata come chiusa: ' + category.id);
      if (category.closed && !category.approvedAt) addWarning('Data approvazione mancante per la categoria ' + category.id);
    });

    Object.entries(registry.aliases || {}).forEach(([alias, target]) => {
      if (!registry.get(target)) addError(`Alias ${alias} punta a una categoria inesistente: ${target}`);
    });

    if (!project) addWarning('Configurazione globale del progetto non disponibile.');
    else if (!project.globalRules?.preserveClosedLayouts) addWarning('Protezione layout categorie chiuse non attiva.');

    return errors.length === 0;
  }

  function currentCategory() {
    const raw = String(activity?.value || '').trim();
    return registry ? registry.normalizeId(raw) : raw;
  }

  function validateCurrentForm({ requirePreview = false, requireGenerated = false } = {}) {
    const categoryId = currentCategory();
    const category = registry?.get(categoryId);
    const reviewUrl = String(reviewInput?.value || '').trim();
    const operator = String(operatorSelect?.value || '').trim();

    if (!categoryId || !category) return { ok:false, message:'Seleziona una categoria valida.' };
    if (!reviewUrl) return { ok:false, message:'Link recensioni non disponibile.' };
    if (!operator) return { ok:false, message:'Operatore non disponibile.' };

    if (categoryId !== 'standard') {
      const skipped = Boolean(window.tapLogoSkipped);
      let logo = '';
      try { logo = typeof logoDataUrl !== 'undefined' ? String(logoDataUrl || '') : String(window.logoDataUrl || ''); }
      catch (_) { logo = String(window.logoDataUrl || ''); }
      if (!skipped && !logo) return { ok:false, message:'Carica il logo oppure scegli esplicitamente di proseguire senza logo.' };

      if (requirePreview && window.TapTemplateStability) {
        const check = window.TapTemplateStability.validateForGenerate();
        if (!check.ok) return check;
      }
      if (requireGenerated && window.TapTemplateStability) {
        const check = window.TapTemplateStability.validateForSave();
        if (!check.ok) return check;
      }
    }

    return { ok:true, category };
  }

  function moduleStatus() {
    const expected = window.TapPersonalizzaBuild?.modules || [];
    const scripts = [...document.querySelectorAll('script[data-tap-module]')];
    const loadedNames = new Set(scripts.filter(script => script.dataset.loaded === '1').map(script => script.dataset.tapModule));
    const missing = expected.length
      ? expected.filter(name => !loadedNames.has(name))
      : scripts.filter(script => script.dataset.loaded !== '1').map(script => script.dataset.tapModule);
    return {
      total: expected.length || scripts.length,
      loaded: (expected.length || scripts.length) - missing.length,
      missing
    };
  }

  async function validatePreviewAssets() {
    const html = window.TapTemplateStability?.getFinalPreviewHtml?.() || '';
    if (!html || !project?.extractPreviewAssets) return { ok:true, checked:0, missing:[] };
    const assets = project.extractPreviewAssets(html);
    const missing = [];
    for (const asset of assets) {
      if (!(await project.checkAsset(asset))) missing.push(asset);
    }
    return { ok:missing.length === 0, checked:assets.length, missing };
  }

  async function validateCurrentCategoryAsset() {
    const id = currentCategory();
    if (!id || id === 'standard' || !project?.validateCategoryAsset) return { ok:true, asset:'', reason:'' };
    return project.validateCategoryAsset(id);
  }

  function report() {
    const policy = project?.categoryPolicy?.(currentCategory()) || null;
    return Object.freeze({
      build: BUILD_ID,
      registryOk: errors.length === 0,
      errors: Object.freeze(errors.slice()),
      warnings: Object.freeze(warnings.slice()),
      modules: moduleStatus(),
      currentCategory: currentCategory(),
      currentAsset: project?.categoryAsset?.(currentCategory()) || '',
      categoryPolicy: policy,
      globalRules: project?.globalRules || null
    });
  }

  validateRegistry();
  if (errors.length) showProblem('Controllo sistema: ' + errors[0]);

  window.TapSystemChecks = Object.freeze({
    build: BUILD_ID,
    validateRegistry,
    validateCurrentForm,
    validatePreviewAssets,
    validateCurrentCategoryAsset,
    moduleStatus,
    report
  });
})();
