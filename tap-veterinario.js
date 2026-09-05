(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  const info = document.getElementById('templateInfo');
  const generate = document.getElementById('generateBtn');
  const preview = document.getElementById('previewBtn');
  const msgBox = document.getElementById('msg');

  if (!activity || !generate || !preview) return;

  function ensureOption(value, label, beforeValue) {
    if (activity.querySelector(`option[value="${value}"]`)) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    const before = beforeValue ? activity.querySelector(`option[value="${beforeValue}"]`) : null;
    activity.insertBefore(option, before || null);
  }

  ensureOption('veterinario', 'Veterinario', 'yogurteria');
  ensureOption('macelleria', 'Macelleria', 'veterinario');

  function updateInfo() {
    if (!info) return;
    if (activity.value === 'veterinario') {
      info.hidden = false;
      info.innerHTML = '<span>Tipologia selezionata</span><strong>Veterinario</strong>';
    } else if (activity.value === 'macelleria') {
      info.hidden = false;
      info.innerHTML = '<span>Tipologia selezionata</span><strong>Macelleria</strong>';
    }
  }

  activity.addEventListener('change', updateInfo);

  const incoming = new URLSearchParams(location.search);
  if (['veterinario','macelleria'].includes(incoming.get('category'))) {
    activity.value = incoming.get('category');
    activity.dispatchEvent(new Event('change'));
  }

  function warnCustom(text) {
    if (typeof warn === 'function') return warn(text);
    if (msgBox) {
      msgBox.className = 'message show warn';
      msgBox.textContent = text;
    }
  }

  function isManaged() {
    return activity.value === 'veterinario' || activity.value === 'macelleria';
  }

  generate.addEventListener('click', event => {
    if (!isManaged()) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const reviewUrl = typeof normalizeReviewUrl === 'function'
      ? normalizeReviewUrl(document.getElementById('destinationUrl')?.value || '')
      : (document.getElementById('destinationUrl')?.value || '').trim();
    const businessName = incoming.get('business') || '';
    const operator = document.getElementById('operatorSelect');

    if (!operator?.value) return warnCustom('Seleziona l’operatore.');
    if (!reviewUrl) return warnCustom('Il link recensioni non è presente.');
    if (!businessName) return warnCustom('Nome attività non disponibile. Torna indietro e inseriscilo.');

    const slug = typeof slugifyBusinessName === 'function'
      ? slugifyBusinessName(businessName)
      : String(businessName).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

    if (!slug) return warnCustom('Non riesco a creare il nome del link finale.');

    finalNfcUrl = 'https://tapreputa.github.io/' + slug + '/';
    finalLinkValue.textContent = finalNfcUrl;
    finalLinkBox.classList.add('show');
    previewBtn.classList.add('show');
    addClientBtn.classList.add('show');
    msg.className = 'message';
    msg.textContent = '';
  }, true);

  preview.addEventListener('click', async event => {
    if (!isManaged()) return;
    event.preventDefault();
    event.stopImmediatePropagation();

    const reviewUrl = typeof normalizeReviewUrl === 'function'
      ? normalizeReviewUrl(document.getElementById('destinationUrl')?.value || '')
      : (document.getElementById('destinationUrl')?.value || '').trim();

    if (!reviewUrl) return warnCustom('Il link recensioni non è presente.');

    try {
      msg.className = 'message show ok';
      msg.textContent = 'Preparazione anteprima...';

      const hasLogo = Boolean(logoDataUrl);
      const placeholderPixel = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';

      if (activity.value === 'macelleria') {
        const backgroundDataUrl = await loadBackgroundDataUrl('Sfondomacelleria.png');
        const cfg = {
          title: 'Ti sei trovato bene con noi?',
          accent: '#8f2f2f',
          accent2: '#5f1717',
          theme: '#4a241f',
          box: 'transparent',
          text: '#ffffff',
          message: '',
          shift: 'none',
          footerSize: '8px',
          footerStrong: '16px'
        };

        let html = buildPremiumTemplate(hasLogo ? logoDataUrl : placeholderPixel, reviewUrl, backgroundDataUrl, cfg);
        const css = `<style id="macelleria-final-v1">
          body{background-size:cover!important;background-position:center top!important;background-repeat:no-repeat!important;background-attachment:fixed!important}
          .pagina{position:relative!important;min-height:100vh!important;padding:0!important;transform:none!important}
          .card{position:static!important;padding:0!important;margin:0!important;min-height:100vh!important}
          .logo{${hasLogo ? 'position:absolute!important;top:2.5vh!important;left:50%!important;transform:translateX(-50%)!important;width:min(190px,54vw)!important;max-height:105px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;filter:drop-shadow(0 5px 14px rgba(0,0,0,.45))!important;' : 'display:none!important;'}}
          .eyebrow{position:absolute!important;top:${hasLogo ? '16.5vh' : '7vh'}!important;left:5%!important;right:5%!important;max-width:none!important;margin:0!important;font-size:clamp(24px,6.6vw,34px)!important;line-height:1.06!important;letter-spacing:.045em!important;color:#fff!important;text-shadow:0 3px 12px rgba(0,0,0,.88)!important}
          .messaggio-box{display:none!important}
          .bottone-google{position:absolute!important;top:69vh!important;left:5%!important;right:5%!important;width:auto!important;margin:0!important;min-height:58px!important;background:linear-gradient(135deg,#9d3b34,#651d19 62%,#8a2d28)!important;border:1px solid rgba(255,255,255,.28)!important;box-shadow:0 10px 28px rgba(0,0,0,.28)!important}
          .stelle{position:absolute!important;top:80.5vh!important;left:0!important;right:0!important;margin:0!important}
          footer{font-size:8px!important}footer strong{font-size:16px!important}
          @media(max-width:640px){
            body{background-position:center top!important}
            .logo{${hasLogo ? 'top:2.2vh!important;width:min(178px,52vw)!important;max-height:96px!important;' : ''}}
            .eyebrow{top:${hasLogo ? '16vh' : '6.5vh'}!important;font-size:clamp(24px,7.1vw,32px)!important}
            .bottone-google{top:70vh!important;min-height:56px!important}
            .stelle{top:81.5vh!important}
          }
          @media(max-height:690px){
            .bottone-google{top:67vh!important}
            .stelle{top:79vh!important}
          }
        </style>`;
        html = html.replace('</head>', css + '</head>');
        openInlinePreview(html);
      } else {
        const backgroundDataUrl = await loadBackgroundDataUrl('Sfondoveterinario.png');
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
        const vetCss = `<style id="veterinario-final-v5">
          body{background-size:cover!important;background-position:left top!important;background-repeat:no-repeat!important;background-attachment:fixed!important}
          .pagina{padding-top:${hasLogo ? '22px' : '68px'}!important;padding-bottom:96px!important;transform:none!important}
          .card{padding-top:0!important}
          .logo{${hasLogo ? 'width:min(210px,62%)!important;max-height:118px!important;margin-bottom:34px!important;padding:0!important;background:transparent!important;border:none!important;box-shadow:none!important;filter:drop-shadow(0 7px 18px rgba(0,0,0,.32))!important;' : 'display:none!important;'} }
          .eyebrow{max-width:560px!important;margin:0 auto!important;font-size:clamp(24px,6vw,36px)!important;line-height:1.08!important;letter-spacing:.055em!important;color:#fff!important;text-shadow:0 3px 12px rgba(0,0,0,.78)!important}
          .messaggio-box{display:none!important}
          .bottone-google{margin-top:195px!important;min-height:60px!important;background:linear-gradient(135deg,#3f8f73,#23644f 60%,#3f8f73)!important;border:1px solid rgba(255,255,255,.28)!important}
          .stelle{margin-top:38px!important}
          footer{font-size:8px!important}footer strong{font-size:16px!important}
          @media(max-width:640px){
            body{background-position:left top!important}
            .pagina{padding-top:${hasLogo ? '16px' : '58px'}!important}
            .logo{${hasLogo ? 'width:min(195px,60%)!important;max-height:108px!important;margin-bottom:28px!important;' : ''}}
            .eyebrow{font-size:clamp(25px,7.3vw,34px)!important;line-height:1.08!important;letter-spacing:.045em!important}
            .bottone-google{margin-top:190px!important;min-height:58px!important}
            .stelle{margin-top:38px!important}
          }
          @media(max-width:340px) and (max-height:600px){
            .pagina{padding-top:${hasLogo ? '6px' : '32px'}!important;padding-bottom:64px!important}
            .logo{${hasLogo ? 'width:160px!important;max-height:78px!important;margin-bottom:15px!important;' : ''}}
            .eyebrow{font-size:21px!important;line-height:1.05!important}
            .bottone-google{margin-top:72px!important;min-height:46px!important}
            .stelle{margin-top:18px!important;font-size:23px!important}
          }
        </style>`;
        html = html.replace('</head>', vetCss + '</head>');
        openInlinePreview(html);
      }

      msg.className = 'message show ok';
      msg.textContent = 'Anteprima aperta correttamente.';
    } catch (err) {
      console.error(err);
      const file = activity.value === 'macelleria' ? 'Sfondomacelleria.png' : 'Sfondoveterinario.png';
      warnCustom('Non riesco a caricare ' + file + '. Verifica che il file sia presente accanto a personalizza.html.');
    }
  }, true);
})();
