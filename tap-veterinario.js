(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  const info = document.getElementById('templateInfo');
  const generate = document.getElementById('generateBtn');
  const preview = document.getElementById('previewBtn');
  const msgBox = document.getElementById('msg');

  if (!activity || !generate || !preview) return;

  if (!activity.querySelector('option[value="veterinario"]')) {
    const option = document.createElement('option');
    option.value = 'veterinario';
    option.textContent = 'Veterinario';
    const yogurt = activity.querySelector('option[value="yogurteria"]');
    activity.insertBefore(option, yogurt || null);
  }

  function updateInfo() {
    if (activity.value !== 'veterinario') return;
    if (info) {
      info.hidden = false;
      info.innerHTML = '<span>Tipologia selezionata</span><strong>Veterinario</strong>';
    }
  }

  activity.addEventListener('change', updateInfo);

  const incoming = new URLSearchParams(location.search);
  if (incoming.get('category') === 'veterinario') {
    activity.value = 'veterinario';
    activity.dispatchEvent(new Event('change'));
  }

  function warnVet(text) {
    if (typeof warn === 'function') return warn(text);
    if (msgBox) {
      msgBox.className = 'message show warn';
      msgBox.textContent = text;
    }
  }

  generate.addEventListener('click', event => {
    if (activity.value !== 'veterinario') return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const reviewUrl = typeof normalizeReviewUrl === 'function'
      ? normalizeReviewUrl(document.getElementById('destinationUrl')?.value || '')
      : (document.getElementById('destinationUrl')?.value || '').trim();
    const businessName = incoming.get('business') || '';
    const operator = document.getElementById('operatorSelect');

    if (!operator?.value) return warnVet('Seleziona l’operatore.');
    if (!logoDataUrl) return warnVet('Carica il logo dell’attività.');
    if (!reviewUrl) return warnVet('Il link recensioni non è presente.');
    if (!businessName) return warnVet('Nome attività non disponibile. Torna indietro e inseriscilo.');

    const slug = typeof slugifyBusinessName === 'function'
      ? slugifyBusinessName(businessName)
      : String(businessName).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (!slug) return warnVet('Non riesco a creare il nome del link finale.');

    finalNfcUrl = 'https://tapreputa.github.io/' + slug + '/';
    finalLinkValue.textContent = finalNfcUrl;
    finalLinkBox.classList.add('show');
    previewBtn.classList.add('show');
    addClientBtn.classList.add('show');
    msg.className = 'message';
    msg.textContent = '';
  }, true);

  preview.addEventListener('click', async event => {
    if (activity.value !== 'veterinario') return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const reviewUrl = typeof normalizeReviewUrl === 'function'
      ? normalizeReviewUrl(document.getElementById('destinationUrl')?.value || '')
      : (document.getElementById('destinationUrl')?.value || '').trim();

    if (!logoDataUrl) return warnVet('Carica il logo dell’attività.');
    if (!reviewUrl) return warnVet('Il link recensioni non è presente.');

    try {
      msg.className = 'message show ok';
      msg.textContent = 'Preparazione anteprima...';

      const backgroundDataUrl = await loadBackgroundDataUrl('Sfondoveterinario.png');
      const cfg = {
        title: 'Ti sei trovato bene con noi?',
        accent: '#2b8f9f',
        accent2: '#176b78',
        theme: '#315e63',
        box: 'rgba(255,255,255,.86)',
        text: '#173b40',
        message: 'La tua opinione ci aiuta a migliorare ogni giorno accoglienza, attenzione e servizio. Raccontaci la tua esperienza! Bastano 2 secondi!',
        shift: 'translateY(-10px)',
        footerSize: '8px',
        footerStrong: '16px'
      };

      const html = buildPremiumTemplate(logoDataUrl, reviewUrl, backgroundDataUrl, cfg);
      openInlinePreview(html);
      msg.className = 'message show ok';
      msg.textContent = 'Anteprima aperta correttamente.';
    } catch (err) {
      console.error(err);
      warnVet('Non riesco a caricare Sfondoveterinario.png. Verifica che il file sia presente accanto a personalizza.html.');
    }
  }, true);
})();
