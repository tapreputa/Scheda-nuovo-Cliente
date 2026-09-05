(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  const info = document.getElementById('templateInfo');
  const generate = document.getElementById('generateBtn');
  const preview = document.getElementById('previewBtn');
  const msgBox = document.getElementById('msg');

  if (!activity || !generate || !preview) return;

  const legacyHamburgeria = activity.querySelector('option[value="hamburgeria"]');
  if (legacyHamburgeria) legacyHamburgeria.remove();

  function ensureOption(value, label) {
    if (activity.querySelector(`option[value="${value}"]`)) return;
    const option = document.createElement('option');
    option.value = value;
    option.textContent = label;
    activity.appendChild(option);
  }

  function sortActivityOptions() {
    const selected = activity.value;
    const options = Array.from(activity.options);
    const placeholders = options.filter(opt => !opt.value);
    const realOptions = options.filter(opt => opt.value);
    realOptions.sort((a, b) => a.textContent.trim().localeCompare(b.textContent.trim(), 'it', { sensitivity: 'base' }));
    activity.innerHTML = '';
    placeholders.forEach(opt => activity.appendChild(opt));
    realOptions.forEach(opt => activity.appendChild(opt));
    if (selected && activity.querySelector(`option[value="${CSS.escape(selected)}"]`)) activity.value = selected;
  }

  ensureOption('gioielleria', 'Gioielleria');
  ensureOption('macelleria', 'Macelleria');
  ensureOption('panineria_hamburgeria', 'Panineria/Hamburgeria');
  ensureOption('polli_spiedo', 'Polli allo spiedo');
  ensureOption('veterinario', 'Veterinario');
  sortActivityOptions();

  const managed = new Set(['gioielleria','macelleria','panineria_hamburgeria','polli_spiedo','veterinario']);

  function updateInfo() {
    if (!info || !managed.has(activity.value)) return;
    info.hidden = false;
    info.innerHTML = `<span>Tipologia selezionata</span><strong>${activity.options[activity.selectedIndex]?.text || ''}</strong>`;
  }

  activity.addEventListener('change', updateInfo);

  const incoming = new URLSearchParams(location.search);
  if (managed.has(incoming.get('category'))) {
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

  generate.addEventListener('click', event => {
    if (!managed.has(activity.value)) return;
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

  function inject(html, css) {
    return html.replace('</head>', css + '</head>');
  }

  preview.addEventListener('click', async event => {
    if (!managed.has(activity.value)) return;
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
      let html = '';

      if (activity.value === 'gioielleria') {
        const bg = await loadBackgroundDataUrl('Sfondogioielleria.png');
        const cfg = {title:'La qualità e la cura dei nostri gioielli ti hanno conquistato?',accent:'#b9975b',accent2:'#7d6238',theme:'#8a744a',box:'transparent',text:'#ffffff',message:'',shift:'none',footerSize:'8px',footerStrong:'16px'};
        html = buildPremiumTemplate(hasLogo ? logoDataUrl : placeholderPixel, reviewUrl, bg, cfg);
        const css = `<style id="gioielleria-final-v2">body{background-size:cover!important;background-position:center top!important;background-repeat:no-repeat!important;background-attachment:fixed!important}.pagina{position:relative!important;min-height:100vh!important;padding:0!important;transform:none!important}.card{position:static!important;padding:0!important;margin:0!important;min-height:100vh!important}.logo{${hasLogo ? 'position:absolute!important;top:2.8vh!important;left:50%!important;transform:translateX(-50%)!important;width:min(185px,52vw)!important;max-height:100px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;filter:drop-shadow(0 5px 14px rgba(0,0,0,.28))!important;' : 'display:none!important;'}}.eyebrow{position:absolute!important;top:${hasLogo ? '23vh' : '13vh'}!important;left:6%!important;right:6%!important;max-width:none!important;margin:0!important;font-size:clamp(23px,6.4vw,32px)!important;line-height:1.08!important;letter-spacing:.035em!important;color:#fff!important;text-shadow:0 3px 12px rgba(60,45,20,.72)!important}.messaggio-box{display:none!important}.bottone-google{position:absolute!important;top:65vh!important;left:6%!important;right:6%!important;width:auto!important;margin:0!important;min-height:57px!important;background:linear-gradient(135deg,#c4a56b,#8f7240 62%,#b18f55)!important;border:1px solid rgba(255,255,255,.42)!important;box-shadow:0 10px 26px rgba(70,50,20,.24)!important}.stelle{position:absolute!important;top:76.5vh!important;left:0!important;right:0!important;margin:0!important}footer{font-size:8px!important}footer strong{font-size:16px!important}@media(max-width:640px){.logo{${hasLogo ? 'top:2.5vh!important;width:min(174px,50vw)!important;max-height:94px!important;' : ''}}.eyebrow{top:${hasLogo ? '22.5vh' : '12.5vh'}!important;font-size:clamp(22px,6.8vw,30px)!important}.bottone-google{top:65.5vh!important;min-height:55px!important}.stelle{top:77vh!important}}@media(max-height:690px){.eyebrow{top:${hasLogo ? '21vh' : '11vh'}!important}.bottone-google{top:63vh!important}.stelle{top:75vh!important}}</style>`;
        html = inject(html, css);
      } else if (activity.value === 'macelleria') {
        const bg = await loadBackgroundDataUrl('Sfondomacelleria.png');
        const cfg = {title:'Freschezza e qualità della nostra carne ti hanno soddisfatto?',accent:'#8f2f2f',accent2:'#5f1717',theme:'#4a241f',box:'transparent',text:'#fff',message:'',shift:'none',footerSize:'8px',footerStrong:'16px'};
        html = buildPremiumTemplate(hasLogo ? logoDataUrl : placeholderPixel, reviewUrl, bg, cfg);
        const css = `<style id="macelleria-final-v2">body{background-size:cover!important;background-position:center top!important;background-repeat:no-repeat!important;background-attachment:fixed!important}.pagina{position:relative!important;min-height:100vh!important;padding:0!important;transform:none!important}.card{position:static!important;padding:0!important;margin:0!important;min-height:100vh!important}.logo{${hasLogo ? 'position:absolute!important;top:2.5vh!important;left:50%!important;transform:translateX(-50%)!important;width:min(190px,54vw)!important;max-height:105px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;filter:drop-shadow(0 5px 14px rgba(0,0,0,.45))!important;' : 'display:none!important;'}}.eyebrow{position:absolute!important;top:${hasLogo ? '22vh' : '12vh'}!important;left:5%!important;right:5%!important;max-width:none!important;margin:0!important;font-size:clamp(24px,6.4vw,33px)!important;line-height:1.06!important;letter-spacing:.035em!important;color:#fff!important;text-shadow:0 3px 12px rgba(0,0,0,.88)!important}.messaggio-box{display:none!important}.bottone-google{position:absolute!important;top:62vh!important;left:5%!important;right:5%!important;width:auto!important;margin:0!important;min-height:58px!important;background:linear-gradient(135deg,#9d3b34,#651d19 62%,#8a2d28)!important;border:1px solid rgba(255,255,255,.28)!important}.stelle{position:absolute!important;top:73.5vh!important;left:0!important;right:0!important;margin:0!important}footer{font-size:8px!important}footer strong{font-size:16px!important}</style>`;
        html = inject(html, css);
      } else if (activity.value === 'panineria_hamburgeria') {
        const bg = await loadBackgroundDataUrl('Sfondopanineria.png');
        const cfg = {title:'Panini e hamburger preparati con gusto: ti abbiamo conquistato?',accent:'#d9852f',accent2:'#9f4d18',theme:'#5b321d',box:'transparent',text:'#ffffff',message:'',shift:'none',footerSize:'8px',footerStrong:'16px'};
        html = buildPremiumTemplate(hasLogo ? logoDataUrl : placeholderPixel, reviewUrl, bg, cfg);
        const css = `<style id="panineria-hamburgeria-v5">body{background-color:#15110d!important;background-size:100% auto!important;background-position:center center!important;background-repeat:no-repeat!important;background-attachment:fixed!important}.pagina{position:relative!important;min-height:100vh!important;padding:0!important;transform:none!important;overflow:hidden!important}.pagina::before{content:""!important;position:absolute!important;z-index:1!important;top:0!important;left:0!important;width:30vw!important;height:17vh!important;pointer-events:none!important;background:radial-gradient(circle at 18% 14%,rgba(12,11,10,.98) 0 32%,rgba(12,11,10,.84) 45%,rgba(12,11,10,.38) 62%,rgba(12,11,10,0) 78%)!important}.card{position:static!important;padding:0!important;margin:0!important;min-height:100vh!important}.logo{${hasLogo ? 'position:absolute!important;z-index:3!important;top:2.5vh!important;left:50%!important;transform:translateX(-50%)!important;width:min(185px,52vw)!important;max-height:100px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;filter:drop-shadow(0 5px 14px rgba(0,0,0,.42))!important;' : 'display:none!important;'}}.eyebrow{position:absolute!important;z-index:3!important;top:${hasLogo ? '21vh' : '11vh'}!important;left:5%!important;right:5%!important;max-width:none!important;margin:0!important;font-size:clamp(23px,6.2vw,32px)!important;line-height:1.07!important;letter-spacing:.03em!important;color:#fff!important;text-shadow:0 3px 12px rgba(0,0,0,.9)!important}.messaggio-box{display:none!important}.stelle{position:absolute!important;z-index:3!important;top:40.5vh!important;left:0!important;right:0!important;margin:0!important}.bottone-google{position:absolute!important;z-index:3!important;top:46.5vh!important;left:5%!important;right:5%!important;width:auto!important;margin:0!important;min-height:57px!important;background:linear-gradient(135deg,#e39a45,#a95c21 62%,#c7742c)!important;border:1px solid rgba(255,255,255,.32)!important;box-shadow:0 10px 28px rgba(0,0,0,.3)!important}footer{z-index:3!important;font-size:8px!important}footer strong{font-size:16px!important}@media(max-width:640px){body{background-size:100% auto!important;background-position:center center!important}.pagina::before{width:32vw!important;height:18vh!important}.logo{${hasLogo ? 'top:2.3vh!important;width:min(174px,50vw)!important;max-height:94px!important;' : ''}}.eyebrow{top:${hasLogo ? '20.5vh' : '10.5vh'}!important;font-size:clamp(22px,6.8vw,30px)!important}.stelle{top:40.5vh!important}.bottone-google{top:46.8vh!important;min-height:55px!important}}@media(max-height:690px){.eyebrow{top:${hasLogo ? '19.5vh' : '9.5vh'}!important}.stelle{top:39vh!important}.bottone-google{top:45.5vh!important}}</style>`;
        html = inject(html, css);
      } else if (activity.value === 'polli_spiedo') {
        const bg = await loadBackgroundDataUrl('SfondopollialloSpiedo.png');
        const cfg = {title:'Il nostro pollo allo spiedo ti ha conquistato?',accent:'#d8862f',accent2:'#9a4d19',theme:'#5a321f',box:'transparent',text:'#ffffff',message:'',shift:'none',footerSize:'8px',footerStrong:'16px'};
        html = buildPremiumTemplate(hasLogo ? logoDataUrl : placeholderPixel, reviewUrl, bg, cfg);
        const css = `<style id="polli-spiedo-v2">body{background-color:#2a160c!important;background-size:cover!important;background-position:center top!important;background-repeat:no-repeat!important;background-attachment:fixed!important}.pagina{position:relative!important;min-height:100vh!important;padding:0!important;transform:none!important}.card{position:static!important;padding:0!important;margin:0!important;min-height:100vh!important}.logo{${hasLogo ? 'position:absolute!important;top:2.5vh!important;left:50%!important;transform:translateX(-50%)!important;width:min(185px,52vw)!important;max-height:100px!important;padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important;filter:drop-shadow(0 5px 14px rgba(0,0,0,.45))!important;' : 'display:none!important;'}}.eyebrow{position:absolute!important;top:${hasLogo ? '21vh' : '12vh'}!important;left:5%!important;right:5%!important;max-width:none!important;margin:0!important;font-size:clamp(23px,6.4vw,32px)!important;line-height:1.07!important;letter-spacing:.03em!important;color:#fff!important;text-shadow:0 3px 12px rgba(0,0,0,.9)!important}.messaggio-box{display:none!important}.bottone-google{position:absolute!important;top:66vh!important;left:5%!important;right:5%!important;width:auto!important;margin:0!important;min-height:57px!important;background:linear-gradient(135deg,#e39a45,#a95c21 62%,#c7742c)!important;border:1px solid rgba(255,255,255,.32)!important;box-shadow:0 10px 28px rgba(0,0,0,.32)!important}.stelle{position:absolute!important;top:77vh!important;left:0!important;right:0!important;margin:0!important}footer{font-size:8px!important}footer strong{font-size:16px!important}@media(max-width:640px){.logo{${hasLogo ? 'top:2.3vh!important;width:min(174px,50vw)!important;max-height:94px!important;' : ''}}.eyebrow{top:${hasLogo ? '20.5vh' : '11.5vh'}!important;font-size:clamp(22px,6.8vw,30px)!important}.bottone-google{top:65.5vh!important;min-height:55px!important}.stelle{top:76.5vh!important}}@media(max-height:690px){.eyebrow{top:${hasLogo ? '19vh' : '10.5vh'}!important}.bottone-google{top:63vh!important}.stelle{top:74vh!important}}</style>`;
        html = inject(html, css);
      } else {
        const bg = await loadBackgroundDataUrl('Sfondoveterinario.png');
        const cfg = {title:'Il tuo amico a 4 zampe è stato bene con noi?',accent:'#3f8f73',accent2:'#23644f',theme:'#315e52',box:'transparent',text:'#173b40',message:'',shift:'none',footerSize:'8px',footerStrong:'16px'};
        html = buildPremiumTemplate(hasLogo ? logoDataUrl : placeholderPixel, reviewUrl, bg, cfg);
        const css = `<style id="veterinario-final-v5">body{background-size:cover!important;background-position:left top!important;background-repeat:no-repeat!important;background-attachment:fixed!important}.pagina{padding-top:${hasLogo ? '22px' : '68px'}!important;padding-bottom:96px!important;transform:none!important}.card{padding-top:0!important}.logo{${hasLogo ? 'width:min(210px,62%)!important;max-height:118px!important;margin-bottom:34px!important;padding:0!important;background:transparent!important;border:none!important;box-shadow:none!important;filter:drop-shadow(0 7px 18px rgba(0,0,0,.32))!important;' : 'display:none!important;'}}.eyebrow{max-width:560px!important;margin:0 auto!important;font-size:clamp(24px,6vw,36px)!important;line-height:1.08!important;letter-spacing:.055em!important;color:#fff!important;text-shadow:0 3px 12px rgba(0,0,0,.78)!important}.messaggio-box{display:none!important}.bottone-google{margin-top:195px!important;min-height:60px!important;background:linear-gradient(135deg,#3f8f73,#23644f 60%,#3f8f73)!important;border:1px solid rgba(255,255,255,.28)!important}.stelle{margin-top:38px!important}footer{font-size:8px!important}footer strong{font-size:16px!important}</style>`;
        html = inject(html, css);
      }

      openInlinePreview(html);
      msg.className = 'message show ok';
      msg.textContent = 'Anteprima aperta correttamente.';
    } catch (err) {
      console.error(err);
      const files = {
        gioielleria:'Sfondogioielleria.png',
        macelleria:'Sfondomacelleria.png',
        panineria_hamburgeria:'Sfondopanineria.png',
        polli_spiedo:'SfondopollialloSpiedo.png',
        veterinario:'Sfondoveterinario.png'
      };
      warnCustom('Non riesco a caricare ' + files[activity.value] + '. Verifica che il file sia presente accanto a personalizza.html.');
    }
  }, true);
})();