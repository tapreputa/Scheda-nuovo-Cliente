(() => {
  'use strict';

  const registry = window.TapCategories;
  if (!registry) return;

  const activity = document.getElementById('activityType');
  const info = document.getElementById('templateInfo');
  const logoFile = document.getElementById('logoFile');
  const logoPreview = document.getElementById('logoPreview');
  const previewButton = document.getElementById('previewBtn');

  if (!activity) return;

  function renderCategories() {
    const current = registry.normalizeId(activity.value);
    activity.innerHTML = '';

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.textContent = 'Seleziona la tipologia di attività';
    activity.appendChild(placeholder);

    registry.list.forEach(category => {
      const option = document.createElement('option');
      option.value = category.id;
      option.textContent = category.label;
      activity.appendChild(option);
    });

    if (registry.get(current)) activity.value = current;
    else activity.value = '';
  }

  function syncUI() {
    const id = registry.normalizeId(activity.value);
    const category = registry.get(id);

    if (id && id !== activity.value && registry.get(id)) activity.value = id;

    if (info) {
      if (category) {
        info.hidden = false;
        info.innerHTML = `<span>Tipologia selezionata</span><strong>${category.label}</strong>`;
      } else {
        info.hidden = true;
        info.innerHTML = '';
      }
    }

    const isStandard = id === 'standard';
    if (logoFile) {
      const logoField = logoFile.closest('.field');
      if (logoField) logoField.style.display = isStandard ? 'none' : '';
      logoFile.disabled = isStandard;
    }
    if (isStandard && logoPreview) logoPreview.classList.remove('show');
    if (previewButton) previewButton.textContent = isStandard ? 'Anteprima link' : 'Anteprima pagina';
  }

  renderCategories();

  const params = new URLSearchParams(location.search);
  const incomingCategory = registry.normalizeId(params.get('category'));
  if (registry.get(incomingCategory)) activity.value = incomingCategory;

  activity.addEventListener('change', syncUI);
  syncUI();

  window.TapPersonalizza = Object.freeze({
    getCategory: () => registry.get(activity.value),
    getCategoryId: () => registry.normalizeId(activity.value),
    refreshCategories: () => { renderCategories(); syncUI(); }
  });
})();
