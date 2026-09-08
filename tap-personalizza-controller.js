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

  function isStandard() {
    return registry.normalizeId(activity.value) === 'standard';
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

    activity.value = registry.get(current) ? current : '';
  }

  function removeStandardSaveProxy() {
    document.getElementById('tapStandardAddClientBtn')?.remove();
  }

  function showStandardSaveProxy() {
    if (!isStandard() || !addClientButton) return;
    const directUrl = String(finalLinkValue?.textContent || '').trim();
    if (!directUrl) return;

    let proxy = document.getElementById('tapStandardAddClientBtn');
    if (!proxy) {
      proxy = document.createElement('button');
      proxy.id = 'tapStandardAddClientBtn';
      proxy.type = 'button';
      proxy.className = 'add-client show';
      proxy.textContent = '+ Aggiungi cliente';
      proxy.style.cssText = 'display:block!important;visibility:visible!important;opacity:1!important;pointer-events:auto!important;width:100%!important;margin:18px 0 0!important;';
      proxy.addEventListener('click', () => {
        if (!isStandard()) return;
        addClientButton.click();
      });
      finalLinkBox?.insertAdjacentElement('afterend', proxy);
    }
  }

  function syncStandardControls(standard) {
    removeStandardSaveProxy();

    if (generateButton) {
      generateButton.hidden = false;
      generateButton.style.display = '';
      generateButton.textContent = standard ? 'Genera link diretto Google' : 'Genera link finale';
    }

    if (previewButton) {
      previewButton.textContent = standard ? 'Testa pagina recensioni Google' : 'Anteprima pagina';
      previewButton.disabled = standard ? !getReviewUrl() : previewButton.disabled;
      if (standard) previewButton.classList.add('show', 'tap-preview-enabled');
    }

    if (!standard) return;

    // Nella modalità Standard il pulsante originale resta disponibile solo come motore
    // di salvataggio; l'interfaccia usa un pulsante dedicato e stabile.
    if (addClientButton) addClientButton.classList.remove('show');
  }

  function syncUI() {
    const id = registry.normalizeId(activity.value);
    const category = registry.get(id);

    if (id && id !== activity.value && category) activity.value = id;

    if (info) {
      if (category) {
        info.hidden = false;
        info.innerHTML = `<span>Tipologia selezionata</span><strong>${category.label}</strong>`;
      } else {
        info.hidden = true;
        info.innerHTML = '';
      }
    }

    const standard = id === 'standard';
    if (logoFile) {
      const logoField = logoFile.closest('.field');
      if (logoField) logoField.style.display = standard ? 'none' : '';
      logoFile.disabled = standard;
    }
    if (standard && logoPreview) logoPreview.classList.remove('show');

    syncStandardControls(standard);
  }

  function generateStandardDirectLink(event) {
    if (!isStandard()) return;
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
    showStandardSaveProxy();

    if (msg) {
      msg.className = 'message show ok';
      msg.textContent = 'Link diretto Google pronto. Testalo, copialo e poi salva il cliente.';
    }
    finalLinkBox?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  function previewStandardDirectLink(event) {
    if (!isStandard()) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const directUrl = getReviewUrl();
    if (!directUrl) {
      if (msg) {
        msg.className = 'message show warn';
        msg.textContent = 'Link recensioni Google non disponibile.';
      }
      return;
    }

    // Salva prima lo stato della personalizzazione e usa la stessa WebView:
    // evita popup/window.open, più instabili nell'APK. Con Indietro si torna qui.
    try { window.TapPersonalizzaReliability?.saveDraft?.(); } catch (_) {}
    try { sessionStorage.setItem('tapreputa_standard_preview_url', directUrl); } catch (_) {}
    location.assign(directUrl);
  }

  async function copyStandardDirectLink(event) {
    if (!isStandard()) return;
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

    showStandardSaveProxy();

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

  // Nessun MutationObserver e nessun ciclo di retry: questa versione evita
  // aggiornamenti DOM continui che possono appesantire/crashare la WebView Android.
  syncUI();

  window.TapPersonalizza = Object.freeze({
    getCategory: () => registry.get(activity.value),
    getCategoryId: () => registry.normalizeId(activity.value),
    refreshCategories: () => { renderCategories(); syncUI(); }
  });
})();