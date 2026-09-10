(() => {
  'use strict';

  const BUILD_ID = '20260910-barextra1';
  const registry = window.TapCategories;

  function normalize(id) {
    return registry ? registry.normalizeId(id) : String(id || '').trim();
  }

  function entry(id) {
    const category = registry?.get(normalize(id));
    if (!category) return null;
    return Object.freeze({
      id: category.id,
      label: category.label,
      version: category.version || '1.0',
      approvedAt: category.approvedAt || '',
      closed: Boolean(category.closed),
      background: category.background || null,
      modePolicy: category.id === 'standard' ? 'direct' : 'logo-or-no-logo'
    });
  }

  const entries = Object.freeze((registry?.list || []).map(category => entry(category.id)).filter(Boolean));
  const byId = Object.freeze(Object.fromEntries(entries.map(item => [item.id, item])));

  function signature(id) {
    const item = byId[normalize(id)] || null;
    if (!item) return '';
    return [item.id, item.version, item.approvedAt, item.background || '', item.modePolicy].join('|');
  }

  window.TapTemplateManifest = Object.freeze({
    build: BUILD_ID,
    entries,
    byId,
    get: id => byId[normalize(id)] || null,
    signature
  });
})();
