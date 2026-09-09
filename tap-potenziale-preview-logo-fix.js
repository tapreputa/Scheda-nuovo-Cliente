(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '') !== 'personalizza-potenziale.html') return;

  const previewBtn = document.getElementById('previewCustom');
  const category = document.getElementById('customCategory');
  const logoInput = document.getElementById('customLogo');
  const shell = document.getElementById('rendererShell');
  const frame = document.getElementById('rendererFrame');
  const status = document.getElementById('customStatus');
  if (!previewBtn || !category || !logoInput || !shell || !frame) return;

  function showStatus(text, type = 'warn') {
    if (!status) return;
    status.className = 'status show ' + type;
    status.textContent = text;
  }

  function transparentFile() {
    const bin = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScL8WQAAAABJRU5ErkJggg==');
    const a = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return new File([a], 'tap-no-logo.png', { type: 'image/png' });
  }

  function rendererUrl() {
    const p = new URLSearchParams(location.search);
    const q = new URLSearchParams();
    q.set('reviewurl', p.get('reviewurl') || ('https://search.google.com/local/writereview?placeid=' + encodeURIComponent(p.get('placeid') || '')));
    q.set('business', p.get('business') || 'Attività');
    q.set('placeid', p.get('placeid') || '');
    q.set('category', category.value);
    return 'personalizza.html?' + q.toString() + '&_preview_fix=' + Date.now();
  }

  function waitForLogo(doc, hasLogo) {
    if (!hasLogo) return new Promise(r => setTimeout(r, 120));
    return new Promise((resolve, reject) => {
      let tries = 0;
      const timer = setInterval(() => {
        tries++;
        const img = doc.getElementById('logoPreviewImg');
        const src = img?.getAttribute('src') || img?.src || '';
        if (/^data:image\//i.test(src)) {
          clearInterval(timer);
          resolve();
        } else if (tries > 80) {
          clearInterval(timer);
          reject(new Error('Il logo non è stato caricato nell’anteprima. Riprova.'));
        }
      }, 50);
    });
  }

  function hideInnerBack(doc) {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      const overlay = doc.getElementById('tapPreviewOverlay');
      if (overlay) {
        [...overlay.querySelectorAll('button')].forEach(b => {
          if (/Torna a Personalizza/i.test(b.textContent || '')) b.style.display = 'none';
        });
        clearInterval(timer);
      }
      if (tries > 60) clearInterval(timer);
    }, 60);
  }

  async function openPreview() {
    if (!category.value) return showStatus('Seleziona la categoria personalizzata.');
    const selectedFile = logoInput.files?.[0] || null;

    previewBtn.disabled = true;
    showStatus(selectedFile ? 'Preparazione anteprima con logo…' : 'Preparazione anteprima senza logo…', 'ok');

    try {
      await new Promise((resolve, reject) => {
        frame.onload = async () => {
          try {
            const doc = frame.contentDocument;
            const win = frame.contentWindow;
            const cat = doc.getElementById('activityType');
            if (cat) {
              cat.value = category.value;
              cat.dispatchEvent(new Event('change', { bubbles: true }));
            }

            const fileInput = doc.getElementById('logoFile');
            if (!fileInput) throw new Error('Renderer logo non disponibile.');
            win.tapLogoSkipped = !selectedFile;
            const dt = new DataTransfer();
            dt.items.add(selectedFile || transparentFile());
            fileInput.files = dt.files;
            fileInput.dispatchEvent(new Event('change', { bubbles: true }));

            const add = doc.getElementById('addClientBtn');
            if (add) add.style.display = 'none';

            await waitForLogo(doc, !!selectedFile);
            resolve();
          } catch (err) {
            reject(err);
          }
        };
        frame.src = rendererUrl();
      });

      const doc = frame.contentDocument;
      shell.classList.add('show');
      document.body.style.overflow = 'hidden';
      doc.getElementById('previewBtn')?.click();
      hideInnerBack(doc);
      showStatus('Anteprima pronta.', 'ok');
    } catch (err) {
      showStatus(err?.message || 'Non riesco a preparare l’anteprima.');
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
