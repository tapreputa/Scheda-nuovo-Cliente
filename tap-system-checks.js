(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const BUILD_ID = window.TapTemplateStability?.build || '20260906-stable1';
  const registry = window.TapCategories;
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
      if (category.id !== 'standard' && !category.closed) addWarning('Categoria non marcata come chiusa: ' + category.id);
    });

    Object.entries(registry.aliases || {}).forEach(([alias, target]) => {
      if (!registry.get(target)) addError(`Alias ${alias} punta a una categoria inesistente: ${target}`);
    });

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
    const scripts = [...document.querySelectorAll('script[data-tap-module]')];
    const missing = scripts.filter(script => script.dataset.loaded !== '1').map(script => script.dataset.tapModule);
    return {
      total: scripts.length,
      loaded: scripts.length - missing.length,
      missing
    };
  }

  function report() {
    return Object.freeze({
      build: BUILD_ID,
      registryOk: errors.length === 0,
      errors: Object.freeze(errors.slice()),
      warnings: Object.freeze(warnings.slice()),
      modules: moduleStatus(),
      currentCategory: currentCategory()
    });
  }

  validateRegistry();
  if (errors.length) showProblem('Controllo sistema: ' + errors[0]);

  window.TapSystemChecks = Object.freeze({
    build: BUILD_ID,
    validateRegistry,
    validateCurrentForm,
    moduleStatus,
    report
  });
})();
