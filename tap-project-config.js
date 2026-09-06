(() => {
  'use strict';

  const BUILD_ID = '20260906-stable5';
  const GLOBAL_POLICY_VERSION = '1.2';

  const GLOBAL_RULES = Object.freeze({
    luminousStars: true,
    logoAutocrop: true,
    preserveClosedLayouts: true,
    separateLogoModes: true,
    previewBeforeGenerate: true,
    bindGeneratedLinkToPreview: true,
    validateBeforeSave: true,
    cacheBustModulesByBuild: true,
    canonicalCategoryRegistry: true,
    centralizedCategoryAssets: true,
    centralizedTemplateManifest: true,
    persistentDraftState: true
  });

  const IMMUTABLE_LAYOUT_FIELDS = Object.freeze([
    'background',
    'title',
    'accent',
    'accent2',
    'theme'
  ]);

  function normalizeCategoryId(id) {
    return window.TapCategories
      ? window.TapCategories.normalizeId(id)
      : String(id || '').trim();
  }

  function categoryPolicy(id) {
    const categoryId = normalizeCategoryId(id);
    const category = window.TapCategories?.get(categoryId) || null;
    if (!category) return null;
    return Object.freeze({
      id: category.id,
      label: category.label,
      background: category.background || '',
      templateVersion: category.version || '1.0',
      templateSignature: window.TapTemplateManifest?.signature?.(category.id) || '',
      closed: Boolean(category.closed),
      approvedAt: category.approvedAt || '',
      layoutLocked: Boolean(category.closed && GLOBAL_RULES.preserveClosedLayouts),
      logoModesSeparated: GLOBAL_RULES.separateLogoModes
    });
  }

  function mayChangeLayout(id, explicitUserRequest = false) {
    const policy = categoryPolicy(id);
    if (!policy) return false;
    if (!policy.layoutLocked) return true;
    return explicitUserRequest === true;
  }

  function extractPreviewAssets(html) {
    if (typeof html !== 'string' || !html) return Object.freeze([]);
    const assets = new Set();
    const patterns = [
      /(?:src|href)=["']([^"']+)["']/gi,
      /url\(\s*["']?([^"')]+)["']?\s*\)/gi
    ];
    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(html))) {
        const value = String(match[1] || '').trim();
        if (!value || value.startsWith('data:') || value.startsWith('#') || /^https?:/i.test(value)) continue;
        assets.add(value.split('?')[0].split('#')[0]);
      }
    });
    return Object.freeze([...assets]);
  }

  async function checkAsset(path) {
    const value = String(path || '').trim();
    if (!value || value.startsWith('data:')) return true;
    try {
      const response = await fetch(value, { method:'HEAD', cache:'no-store' });
      return response.ok;
    } catch (_) {
      return false;
    }
  }

  function categoryAsset(id) {
    return window.TapCategories?.get(normalizeCategoryId(id))?.background || '';
  }

  async function validateCategoryAsset(id) {
    const asset = categoryAsset(id);
    if (!asset) return { ok:false, asset:'', reason:'missing-metadata' };
    const ok = await checkAsset(asset);
    return { ok, asset, reason:ok ? '' : 'not-found' };
  }

  window.TapProjectConfig = Object.freeze({
    build: BUILD_ID,
    globalPolicyVersion: GLOBAL_POLICY_VERSION,
    globalRules: GLOBAL_RULES,
    immutableLayoutFields: IMMUTABLE_LAYOUT_FIELDS,
    categoryPolicy,
    mayChangeLayout,
    categoryAsset,
    validateCategoryAsset,
    extractPreviewAssets,
    checkAsset
  });
})();
