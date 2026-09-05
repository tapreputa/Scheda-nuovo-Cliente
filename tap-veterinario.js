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

    if (!reviewUrl) return warnVet('Il link recensioni non è presente.');

    try {
      msg.className = 'message show ok';
      msg.textContent = 'Preparazione anteprima...';

      const backgroundDataUrl = await loadBackgroundDataUrl('Sfondoveterinario.png');
      const hasLogo = Boolean(logoDataUrl);
      const placeholderPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
      const cfg = {
        title: 'Il tuo amico a 4 zampe è stato bene con noi?',
        accent: '#3f8f73',
        accent2: '#23644f',
        theme: '#315e52',
        box: 'transparent',
        text: '#173b40',
        message: '',
        shift: 'none',
        footerSize: '8px',
        footerStrong: '16px'
      };

      let html = buildPremiumTemplate(hasLogo ? logoDataUrl : placeholderPixel, reviewUrl, backgroundDataUrl, cfg);
      const vetCss = `<style id="veterinario-final-v3">
        body{background-size:cover!important;background-position:42% top!important;background-repeat:no-repeat!important;background-attachment:fixed!important}
        .pagina{padding-top:${hasLogo ? '22px' : '68px'}!important;padding-bottom:96px!important;transform:none!important}
        .card{padding-top:0!important}
        .logo{${hasLogo ? 'width:min(245px,70%)!important;max-height:132px!important;margin-bottom:34px!important;padding:0!important;background:transparent!important;border:none!important;box-shadow:none!important;filter:drop-shadow(0 7px 18px rgba(0,0,0,.32))!important;' : 'display:none!important;'} }
        .eyebrow{max-width:560px!important;margin:0 auto!important;font-size:clamp(24px,6vw,36px)!important;line-height:1.08!important;letter-spacing:.055em!important;color:#fff!important;text-shadow:0 3px 12px rgba(0,0,0,.78)!important}
        .messaggio-box{display:none!important}
        .bottone-google{margin-top:72px!important;min-height:60px!important;background:linear-gradient(135deg,#3f8f73,#23644f 60%,#3f8f73)!important;border:1px solid rgba(255,255,255,.28)!important}
        .stelle{margin-top:34px!important}
        footer{font-size:8px!important}footer strong{font-size:16px!important}
        @media(max-width:640px){
          body{background-position:40% top!important}
          .pagina{padding-top:${hasLogo ? '16px' : '58px'}!important}
          .logo{${hasLogo ? 'width:min(225px,68%)!important;max-height:120px!important;margin-bottom:28px!important;' : ''}}
          .eyebrow{font-size:clamp(25px,7.3vw,34px)!important;line-height:1.08!important;letter-spacing:.045em!important}
          .bottone-google{margin-top:68px!important;min-height:58px!important}
          .stelle{margin-top:32px!important}
        }
        @media(max-width:340px) and (max-height:600px){
          .pagina{padding-top:${hasLogo ? '6px' : '32px'}!important;padding-bottom:64px!important}
          .logo{${hasLogo ? 'width:175px!important;max-height:82px!important;margin-bottom:15px!important;' : ''}}
          .eyebrow{font-size:21px!important;line-height:1.05!important}
          .bottone-google{margin-top:34px!important;min-height:46px!important}
          .stelle{margin-top:16px!important;font-size:23px!important}
        }
      </style>`;
      html = html.replace('</head>', vetCss + '</head>');

      openInlinePreview(html);
      msg.className = 'message show ok';
      msg.textContent = 'Anteprima aperta correttamente.';
    } catch (err) {
      console.error(err);
      warnVet('Non riesco a caricare Sfondoveterinario.png. Verifica che il file sia presente accanto a personalizza.html.');
    }
  }, true);
})();
