(() => {
  'use strict';

  function syncCategorySelect() {
    const select = document.getElementById('activityType');
    const registry = window.TapCategories;
    if (!select || !registry || !Array.isArray(registry.list)) return false;

    const current = registry.normalizeId(select.value || '');
    const placeholder = select.querySelector('option[value=""]')?.textContent || 'Seleziona la tipologia di attività';

    const frag = document.createDocumentFragment();
    const first = document.createElement('option');
    first.value = '';
    first.disabled = true;
    first.textContent = placeholder;
    frag.appendChild(first);

    registry.list.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.label;
      frag.appendChild(option);
    });

    select.replaceChildren(frag);

    const incoming = new URLSearchParams(location.search).get('category');
    const wanted = registry.normalizeId(incoming || current || '');
    if (wanted && registry.get(wanted)) select.value = wanted;
    else select.value = '';

    select.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  }

  function boot(attempt = 0) {
    if (syncCategorySelect()) return;
    if (attempt < 30) setTimeout(() => boot(attempt + 1), 100);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => boot(), { once: true });
  } else {
    boot();
  }
})();
