(() => {
  'use strict';

  const CATEGORY = 'barextra';
  const TITLE = 'LE NOSTRE SPECIALITÀ TI HANNO CONQUISTATO?';
  const MESSAGE = 'Dalla colazione all’aperitivo, prepariamo ogni giorno delizie e prodotti genuini per rendere speciale ogni momento. Raccontaci la tua esperienza! Bastano 2 secondi!';

  function install() {
    const activityType = document.getElementById('activityType');
    const templateInfo = document.getElementById('templateInfo');
    const generateBtn = document.getElementById('generateBtn');
    const previewBtn = document.getElementById('previewBtn');
    const addClientBtn = document.getElementById('addClientBtn');
    const finalLinkBox = document.getElementById('finalLinkBox');
    const finalLinkValue = document.getElementById('finalLinkValue');
    const finalLinkLabel = document.querySelector('.final-link-label');
    const logoFile = document.getElementById('logoFile');
    const msg = document.getElementById('msg');

    if (!activityType || !generateBtn || !previewBtn) return;

    if (!activityType.querySelector('option[value="barextra"]')) {
      const option = document.createElement('option');
      option.value = CATEGORY;
      option.textContent = 'Bar extra';
      const bar = activityType.querySelector('option[value="bar"]');
      if (bar) bar.insertAdjacentElement('afterend', option);
      else activityType.appendChild(option);
    }

    function isBarExtra() {
      return activityType.value === CATEGORY;
    }

    function showInfo() {
      if (!isBarExtra()) return;
      if (templateInfo) {
        templateInfo.hidden = false;
        templateInfo.innerHTML = '<span>Tipologia selezionata</span><strong>Bar extra</strong>';
      }
      const logoField = logoFile?.closest('.field');
      if (logoField) logoField.style.display = '';
      if (logoFile) logoFile.disabled = false;
      previewBtn.textContent = 'Anteprima pagina';
    }

    activityType.addEventListener('change', () => setTimeout(showInfo, 0));

    const incomingCategory = new URLSearchParams(location.search).get('category');
    if (incomingCategory === CATEGORY) {
      activityType.value = CATEGORY;
      activityType.dispatchEvent(new Event('change'));
    }

    generateBtn.addEventListener('click', (event) => {
      if (!isBarExtra()) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      try {
        const reviewUrl = normalizeReviewUrl(destinationUrl.value);
        destinationUrl.value = reviewUrl;
        const businessName = incomingBusiness || '';

        if (!operatorSelect.value) return warn('Seleziona l’operatore.');
        if (!logoDataUrl) return warn('Carica il logo dell’attività.');
        if (!reviewUrl) return warn('Il link recensioni non è presente.');
        if (!businessName) return warn('Nome attività non disponibile. Torna indietro e inseriscilo.');

        const slug = slugifyBusinessName(businessName);
        if (!slug) return warn('Non riesco a creare il nome del link finale.');
        finalNfcUrl = 'https://tapreputa.github.io/' + slug + '/';

        finalLinkLabel.textContent = 'Link pagina personalizzata da scrivere sulla NFC';
        finalLinkValue.textContent = finalNfcUrl;
        finalLinkBox.classList.add('show');
        previewBtn.classList.add('show');
        previewBtn.textContent = 'Anteprima pagina';
        addClientBtn?.classList.add('show');
        if (addClientBtn) {
          addClientBtn.disabled = false;
          addClientBtn.textContent = '+ Aggiungi cliente';
        }
        msg.className = 'message';
        msg.textContent = '';
      } catch (error) {
        console.error('[Bar extra generate]', error);
        warn('Non riesco a generare il link finale.');
      }
    }, true);

    previewBtn.addEventListener('click', async (event) => {
      if (!isBarExtra()) return;
      event.preventDefault();
      event.stopImmediatePropagation();

      try {
        const reviewUrl = normalizeReviewUrl(destinationUrl.value);
        destinationUrl.value = reviewUrl;
        if (!logoDataUrl) return warn('Carica il logo dell’attività.');
        if (!reviewUrl) return warn('Il link recensioni non è presente.');
        if (!window.TAP_BAREXTRA_BG) return warn('Sfondo Bar extra non disponibile.');

        msg.className = 'message show ok';
        msg.textContent = 'Preparazione anteprima...';

        const cfg = {
          title: TITLE,
          accent: '#ead9bd',
          accent2: '#c9ae84',
          theme: '#18221f',
          box: 'rgba(18,20,18,.40)',
          text: '#ffffff',
          message: MESSAGE,
          shift: 'none',
          footerSize: '9px',
          footerStrong: '18px'
        };

        let html = buildPremiumTemplate(logoDataUrl, reviewUrl, window.TAP_BAREXTRA_BG, cfg);
        html = html.replace('</head>', `<style id="barextra-layout-v2">
          html,body{background:#18221f!important}
          .pagina{background-color:#18221f!important;background-image:linear-gradient(180deg,rgba(8,10,9,.06),rgba(8,10,9,.03) 48%,rgba(8,10,9,.18)),url("${window.TAP_BAREXTRA_BG}")!important;background-size:cover!important;background-position:center center!important;background-repeat:no-repeat!important;padding-top:max(18px,env(safe-area-inset-top))!important;padding-bottom:max(86px,calc(env(safe-area-inset-bottom) + 72px))!important;transform:none!important}
          .card{width:min(100%,500px)!important;padding:0 12px 12px!important}
          .logo{width:min(220px,58vw)!important;max-height:108px!important;margin:0 auto clamp(62px,9vh,96px)!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;backdrop-filter:none!important;-webkit-backdrop-filter:none!important;filter:drop-shadow(0 6px 16px rgba(0,0,0,.55))!important}
          .eyebrow{max-width:455px!important;margin:0 auto 11px!important;font-size:clamp(18px,4.2vw,25px)!important;line-height:1.12!important;letter-spacing:.055em!important;color:#fff!important;text-shadow:0 3px 15px rgba(0,0,0,.92)!important}
          .messaggio-box{max-width:455px!important;margin:0 auto 14px!important;padding:11px 14px!important;border-radius:16px!important;background:rgba(16,18,16,.40)!important;border:1px solid rgba(255,255,255,.28)!important;box-shadow:0 8px 22px rgba(0,0,0,.18)!important;backdrop-filter:blur(3px)!important;-webkit-backdrop-filter:blur(3px)!important}
          .messaggio{font-size:clamp(14px,3.3vw,16px)!important;line-height:1.36!important;font-weight:650!important}
          .bottone-google{display:inline-flex!important;width:auto!important;min-width:190px!important;min-height:44px!important;padding:9px 24px!important;border-radius:999px!important;background:rgba(245,236,220,.80)!important;color:#4c3927!important;border:1px solid rgba(255,255,255,.72)!important;box-shadow:0 8px 20px rgba(0,0,0,.18)!important;font-size:15px!important;font-weight:850!important;animation:none!important;backdrop-filter:blur(4px)!important;-webkit-backdrop-filter:blur(4px)!important}
          .bottone-google:before,.bottone-google:after{display:none!important;content:none!important}
          .stelle{margin-top:13px!important;font-size:30px!important;letter-spacing:.17em!important;color:#ffd552!important;text-shadow:0 0 8px rgba(255,213,82,.95),0 0 22px rgba(255,170,55,.72),0 4px 12px rgba(0,0,0,.62)!important}
          footer{right:max(16px,env(safe-area-inset-right))!important;bottom:max(14px,env(safe-area-inset-bottom))!important;color:rgba(255,255,255,.92)!important}
          footer strong{color:#f5dca8!important}
          @media(max-width:640px){.logo{width:min(205px,56vw)!important;max-height:98px!important;margin-bottom:clamp(52px,8vh,82px)!important}.eyebrow{font-size:20px!important}.messaggio-box{max-width:420px!important}.bottone-google{min-width:178px!important;min-height:42px!important;padding:8px 21px!important;font-size:14px!important}.stelle{font-size:29px!important}}
          @media(max-width:340px) and (max-height:600px){.pagina{padding-top:8px!important;padding-bottom:58px!important}.logo{width:150px!important;max-height:72px!important;margin-bottom:28px!important}.eyebrow{font-size:15px!important;margin-bottom:7px!important}.messaggio-box{padding:8px 10px!important;margin-bottom:8px!important}.messaggio{font-size:12px!important}.bottone-google{min-width:156px!important;min-height:36px!important;font-size:12px!important;padding:7px 16px!important}.stelle{font-size:23px!important;margin-top:8px!important}footer{bottom:7px!important;right:8px!important}}
        </style></head>`);

        openInlinePreview(html);
        msg.className = 'message show ok';
        msg.textContent = 'Anteprima pronta.';
      } catch (error) {
        console.error('[Bar extra preview]', error);
        warn('Non riesco a preparare l’anteprima Bar extra.');
      }
    }, true);

    showInfo();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
