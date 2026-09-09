(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '') !== 'personalizza-potenziale.html') return;

  const previewBtn = document.getElementById('previewCustom');
  const category = document.getElementById('customCategory');
  const logoInput = document.getElementById('customLogo');
  const shell = document.getElementById('rendererShell');
  const frame = document.getElementById('rendererFrame');
  const status = document.getElementById('customStatus');
  const backBtn = document.getElementById('rendererBack');
  if (!previewBtn || !category || !logoInput || !shell || !frame) return;

  function showStatus(text, type = 'warn') {
    if (!status) return;
    status.className = 'status show ' + type;
    status.textContent = text;
  }

  function fileToDataUrl(file) {
    if (!file) return Promise.resolve('');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Non riesco a leggere il logo selezionato.'));
      reader.readAsDataURL(file);
    });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  async function loadCanonicalBarCss() {
    const response = await fetch('personalizza.html?_bar_template=' + Date.now(), { cache: 'no-store' });
    if (!response.ok) throw new Error('Template Bar non disponibile.');
    const source = await response.text();
    const startMarker = 'const BAR_CSS = `';
    const endMarker = '`;\n\nfunction buildBarTemplate';
    const start = source.indexOf(startMarker);
    if (start < 0) throw new Error('Template Bar non trovato.');
    const contentStart = start + startMarker.length;
    const end = source.indexOf(endMarker, contentStart);
    if (end < 0) throw new Error('Template Bar incompleto.');
    return source.slice(contentStart, end);
  }

  function reviewUrl() {
    const p = new URLSearchParams(location.search);
    return p.get('reviewurl') || ('https://search.google.com/local/writereview?placeid=' + encodeURIComponent(p.get('placeid') || ''));
  }

  function buildBarPreview(css, logoDataUrl) {
    const backgroundUrl = new URL('Sfondobar.png', location.href).href;
    let finalCss = css.replace('__BAR_BACKGROUND_DATA__', backgroundUrl);
    if (!logoDataUrl) {
      finalCss += '\n.brand{display:none!important}.centro{margin-top:0!important}';
    }
    const logoMarkup = logoDataUrl
      ? `<div class="brand"><img id="logo" class="logo" src="${logoDataUrl}" alt="Logo attività"></div>`
      : '';
    const safeUrl = escapeHtml(reviewUrl());

    return `<!DOCTYPE html>
<html lang="it">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#2b160d">
<title>Anteprima Bar</title>
<style>${finalCss}</style>
</head>
<body>
<main class="pagina">
${logoMarkup}
<section class="centro">
<div class="eyebrow">Ti è piaciuto il nostro caffè?</div>
<div class="messaggio-box"><p class="messaggio">La tua opinione ci aiuta a rendere ogni pausa ancora più piacevole. Dicci la tua! Bastano 2 secondi!</p></div>
</section>
<section class="recensione">
<a id="bottoneGoogle" class="bottone-google" href="${safeUrl}" target="_blank" rel="noopener noreferrer" aria-label="Lascia una recensione Google">
<span class="chicco chicco1"></span><span class="chicco chicco2"></span><span class="chicco chicco3"></span><span class="testo-bottone">Recensione Google</span>
</a>
<div class="stelle" aria-label="5 stelle">★★★★★</div>
</section>
<footer>Powered by <strong>Tapreputa</strong></footer>
</main>
</body>
</html>`;
  }

  function closePreview() {
    frame.srcdoc = '';
    shell.classList.remove('show');
    document.body.style.overflow = '';
  }

  if (backBtn) {
    backBtn.onclick = closePreview;
    backBtn.textContent = '← Torna a Personalizza potenziale';
  }

  async function openPreview() {
    if (!category.value) return showStatus('Seleziona la categoria personalizzata.');
    if (category.value !== 'bar') {
      return showStatus('Nuovo motore indipendente in validazione: per ora prova Bar / Caffetterie.');
    }

    previewBtn.disabled = true;
    const selectedFile = logoInput.files?.[0] || null;
    showStatus(selectedFile ? 'Preparazione anteprima Bar con logo…' : 'Preparazione anteprima Bar senza logo…', 'ok');

    try {
      const [css, logoDataUrl] = await Promise.all([
        loadCanonicalBarCss(),
        fileToDataUrl(selectedFile)
      ]);
      frame.removeAttribute('src');
      frame.srcdoc = buildBarPreview(css, logoDataUrl);
      shell.classList.add('show');
      document.body.style.overflow = 'hidden';
      showStatus('Anteprima Bar pronta.', 'ok');
    } catch (err) {
      showStatus(err?.message || 'Non riesco a preparare l’anteprima Bar.');
    } finally {
      previewBtn.disabled = false;
    }
  }

  previewBtn.addEventListener('click', e => {
    e.preventDefault();
    e.stopImmediatePropagation();
    openPreview();
  }, true);
})();
