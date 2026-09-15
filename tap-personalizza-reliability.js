(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  const msg = document.getElementById('msg');
  const logoFile = document.getElementById('logoFile');
  const reviewInput = document.getElementById('destinationUrl');
  if (!activity) return;

  const params = new URLSearchParams(location.search);
  const business = (params.get('business') || '').trim();
  const placeId = (params.get('placeid') || '').trim();
  const draftKey = 'tapreputa_personalizza_draft_v2:' + (placeId || business.toLowerCase() || 'nuovo');

  function readDraft() {
    try {
      const value = JSON.parse(sessionStorage.getItem(draftKey) || 'null');
      if (!value || typeof value !== 'object') return null;
      return value;
    } catch { return null; }
  }

  function writeDraft() {
    try {
      sessionStorage.setItem(draftKey, JSON.stringify({
        category: activity.value || '',
        logoSkipped: Boolean(window.tapLogoSkipped),
        reviewUrl: String(reviewInput?.value || '').trim(),
        templateSignature: window.TapTemplateManifest?.signature?.(activity.value) || '',
        updatedAt: Date.now()
      }));
    } catch {}
  }

  function clearDraft() {
    try { sessionStorage.removeItem(draftKey); } catch {}
  }

  const draft = readDraft();
  if (!params.get('category') && draft?.category && window.TapCategories?.get(draft.category)) {
    activity.value = window.TapCategories.normalizeId(draft.category);
    activity.dispatchEvent(new Event('change', { bubbles:true }));
  }
  if (!params.get('reviewurl') && draft?.reviewUrl && reviewInput && !reviewInput.value) {
    reviewInput.value = draft.reviewUrl;
    reviewInput.dispatchEvent(new Event('input', { bubbles:true }));
  }
  if (draft?.logoSkipped === true && activity.value !== 'standard') {
    window.tapLogoSkipped = true;
    window.dispatchEvent(new CustomEvent('tap-logo-skip-change', { detail:{ skipped:true, restored:true } }));
  }

  activity.addEventListener('change', writeDraft);
  logoFile?.addEventListener('change', writeDraft);
  reviewInput?.addEventListener('input', writeDraft);
  window.addEventListener('tap-logo-skip-change', writeDraft);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') writeDraft();
  });
  window.addEventListener('pagehide', writeDraft);

  const assetCache = new Map();
  async function validateBackground(category) {
    if (!category?.background) return true;
    const file = category.background;
    if (assetCache.get(file) === true) return true;
    try {
      const response = await fetch(file, { method:'HEAD', cache:'force-cache' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      assetCache.set(file, true);
      return true;
    } catch (error) {
      assetCache.delete(file);
      return false;
    }
  }

  // Controllo sfondo solo in background: non blocca più il primo tap su Anteprima/Genera.
  activity.addEventListener('change', () => {
    const category = window.TapCategories?.get(activity.value);
    if (category?.background) validateBackground(category).catch(() => {});
  });

  const currentCategory = window.TapCategories?.get(activity.value);
  if (currentCategory?.background) validateBackground(currentCategory).catch(() => {});

  const addClientBtn = document.getElementById('addClientBtn');
  if (addClientBtn && msg) {
    new MutationObserver(() => {
      if (/Cliente salvato/i.test(addClientBtn.textContent || '') || /salvato/i.test(msg.textContent || '')) {
        clearDraft();
      }
    }).observe(addClientBtn, { childList:true, characterData:true, subtree:true });
  }

  writeDraft();

  window.TapPersonalizzaReliability = Object.freeze({
    draftVersion: 2,
    saveDraft: writeDraft,
    readDraft,
    clearDraft,
    validateCurrent: () => validateBackground(window.TapCategories?.get(activity.value))
  });
})();