(() => {
  'use strict';

  const registry = window.TapCategories;
  if (!registry) return;

  const activity = document.getElementById('activityType');
  const info = document.getElementById('templateInfo');
  const logoFile = document.getElementById('logoFile');
  const logoPreview = document.getElementById('logoPreview');
  const previewButton = document.getElementById('previewBtn');
  const generateButton = document.getElementById('generateBtn');
  const finalLinkBox = document.getElementById('finalLinkBox');
  const finalLinkValue = document.getElementById('finalLinkValue');
  const copyFinalButton = document.getElementById('copyFinalBtn');
  const addClientButton = document.getElementById('addClientBtn');
  const destinationUrl = document.getElementById('destinationUrl');
  const msg = document.getElementById('msg');

  if (!activity) return;

  function getReviewUrl() {
    const params = new URLSearchParams(location.search);
    return String(destinationUrl?.value || params.get('reviewurl') || '').trim();
  }

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

  function forceStandardAddClientVisible() {
    if (!addClientButton) return;
    if (registry.normalizeId(activity.value) !== 'standard') return;
    if (!String(finalLinkValue?.textContent || '').trim()) return;

    addClientButton.hidden = false;
    addClientButton.removeAttribute('aria-hidden');
    addClientButton.classList.add('show');
    addClientButton.disabled = false;
    addClientButton.textContent = '+ Aggiungi cliente';
    addClientButton.style.setProperty('display', 'block', 'important');
    addClientButton.style.setProperty('visibility', 'visible', 'important');
    addClientButton.style.setProperty('opacity', '1', 'important');
    addClientButton.style.setProperty('pointer-events', 'auto', 'important');
    addClientButton.style.setProperty('width', '100%', 'important');
    addClientButton.style.setProperty('margin-top', '18px', 'important');

    if (msg && addClientButton.nextElementSibling !== msg) {
      msg.parentNode?.insertBefore(addClientButton, msg);
    }
  }

  function resetForcedAddClient() {
    if (!addClientButton) return;
    addClientButton.style.removeProperty('display');
    addClientButton.style.removeProperty('visibility');
    addClientButton.style.removeProperty('opacity');
    addClientButton.style.removeProperty('pointer-events');
    addClientButton.style.removeProperty('width');
    addClientButton.style.removeProperty('margin-top');
  }

  function syncStandardControls(isStandard) {
    if (generateButton) {
      generateButton.style.display = '';
      generateButton.hidden = false;
      generateButton.textContent = isStandard ? 'Genera link diretto Google' : 'Genera link finale';
    }
    if (previewButton) previewButton.textContent = isStandard ? 'Apri pagina recensioni Google' : 'Anteprima pagina';

    if (!isStandard) {
      resetForcedAddClient();
      return;
    }

    const directUrl = getReviewUrl();
    if (!directUrl) {
      finalLinkBox?.classList.remove('show');
      addClientButton?.classList.remove('show');
      resetForcedAddClient();
      if (finalLinkValue) finalLinkValue.textContent = '';
    }
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
    syncStandardControls(isStandard);
  }

  function generateStandardDirectLink(event) {
    if (registry.normalizeId(activity.value) !== 'standard') return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const directUrl = getReviewUrl();
    if (!directUrl) {
      if (msg) {
        msg.className = 'message show warn';
        msg.textContent = 'Link recensioni Google non disponibile. Torna indietro e seleziona nuovamente l’attività.';
      }
      return;
    }

    if (finalLinkValue) finalLinkValue.textContent = directUrl;
    finalLinkBox?.classList.add('show');
    forceStandardAddClientVisible();
    setTimeout(forceStandardAddClientVisible, 0);
    setTimeout(forceStandardAddClientVisible, 150);
    setTimeout(forceStandardAddClientVisible, 500);

    if (msg) {
      msg.className = 'message show ok';
      msg.textContent = 'Link diretto Google pronto. Copialo e scrivilo sulla NFC.';
    }
    finalLinkBox?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function previewStandardDirectLink(event) {
    if (registry.normalizeId(activity.value) !== 'standard') return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const directUrl = getReviewUrl();
    if (!directUrl) return;
    window.open(directUrl, '_blank', 'noopener,noreferrer');
    if (msg) {
      msg.className = 'message show ok';
      msg.textContent = 'Pagina recensioni Google aperta correttamente.';
    }
  }

  async function copyStandardDirectLink(event) {
    if (registry.normalizeId(activity.value) !== 'standard') return;
    const directUrl = String(finalLinkValue?.textContent || getReviewUrl()).trim();
    if (!directUrl) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    try {
      await navigator.clipboard.writeText(directUrl);
    } catch {
      const area = document.createElement('textarea');
      area.value = directUrl;
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      document.execCommand('copy');
      area.remove();
    }

    forceStandardAddClientVisible();

    if (copyFinalButton) {
      const oldText = copyFinalButton.textContent;
      copyFinalButton.textContent = 'Copiato ✓';
      setTimeout(() => { copyFinalButton.textContent = oldText || 'Copia link'; }, 1400);
    }
    if (msg) {
      msg.className = 'message show ok';
      msg.textContent = 'Link diretto Google copiato negli appunti.';
    }
  }

  renderCategories();

  const params = new URLSearchParams(location.search);
  const incomingCategory = registry.normalizeId(params.get('category'));
  if (registry.get(incomingCategory)) activity.value = incomingCategory;

  activity.addEventListener('change', syncUI);
  generateButton?.addEventListener('click', generateStandardDirectLink, true);
  previewButton?.addEventListener('click', previewStandardDirectLink, true);
  copyFinalButton?.addEventListener('click', copyStandardDirectLink, true);

  if (addClientButton) {
    new MutationObserver(() => {
      if (registry.normalizeId(activity.value) === 'standard' && String(finalLinkValue?.textContent || '').trim()) {
        forceStandardAddClientVisible();
      }
    }).observe(addClientButton, { attributes:true, attributeFilter:['class','style','hidden','disabled'] });
  }

  syncUI();

  window.TapPersonalizza = Object.freeze({
    getCategory: () => registry.get(activity.value),
    getCategoryId: () => registry.normalizeId(activity.value),
    refreshCategories: () => { renderCategories(); syncUI(); }
  });
})();