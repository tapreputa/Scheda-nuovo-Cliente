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

  function fileToDataUrl(file) {
    if (!file) return Promise.resolve('');
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(new Error('Non riesco a leggere il logo selezionato.'));
      reader.readAsDataURL(file);
    });
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

  function waitForEditorLogo(doc, hasLogo) {
    if (!hasLogo) return new Promise(r => setTimeout(r, 160));
    return new Promise((resolve, reject) => {
      let tries = 0;
      const timer = setInterval(() => {
        tries++;
        const img = doc.getElementById('logoPreviewImg');
        const src = img?.getAttribute('src') || img?.src || '';
        if (/^data:image\//i.test(src)) {
          clearInterval(timer);
          resolve();
        } else if (tries > 120) {
          clearInterval(timer);
          reject(new Error('Il logo non è stato caricato nel renderer. Riprova.'));
        }
      }, 50);
    });
  }

  function installPreviewInterceptor(win, logoDataUrl, hasLogo) {
    const current = win.openInlinePreview;
    if (typeof current !== 'function') return false;

    win.openInlinePreview = function(html) {
      let out = String(html || '');

      if (hasLogo && logoDataUrl) {
        out = out.replace(
          /(<img\b[^>]*class=["'][^"']*\blogo\b[^"']*["'][^>]*\bsrc=["'])[^"']*(["'][^>]*>)/i,
          '$1' + logoDataUrl + '$2'
        );
      } else {
        out = out.replace(
          /<img\b[^>]*class=["'][^"']*\blogo\b[^"']*["'][^>]*>/i,
          '<img class="logo" alt="Logo attività" style="display:none!important">'
        );
      }

      return current.call(win, out);
    };
    return true;
  }

  function removeInnerPreviewBar(doc) {
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      const overlay = doc.getElementById('tapPreviewOverlay');
      if (overlay) {
        const topbar = overlay.firstElementChild;
        if (topbar) topbar.style.setProperty('display', 'none', 'important');

        const innerFrame = doc.getElementById('tapPreviewFrame');
        if (innerFrame) {
          innerFrame.style.setProperty('width', '100%', 'important');
          innerFrame.style.setProperty('height', '100%', 'important');
          innerFrame.style.setProperty('flex', '1 1 100%', 'important');
        }

        clearInterval(timer);
      }
      if (tries > 120) clearInterval(timer);
    }, 50);
  }

  async function openPreview() {
    if (!category.value) return showStatus('Seleziona la categoria personalizzata.');

    const selectedFile = logoInput.files?.[0] || null;
    let logoDataUrl = '';

    try {
      logoDataUrl = selectedFile ? await fileToDataUrl(selectedFile) : '';
    } catch (err) {
      return showStatus(err?.message || 'Non riesco a leggere il logo selezionato.');
    }

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

            await waitForEditorLogo(doc, !!selectedFile);

            if (!installPreviewInterceptor(win, logoDataUrl, !!selectedFile)) {
              throw new Error('Motore anteprima non disponibile.');
            }

            resolve();
          } catch (err) {
            reject(err);
          }
        };
        frame.src = rendererUrl();
      });

      const editorDoc = frame.contentDocument;
      shell.classList.add('show');
      document.body.style.overflow = 'hidden';

      editorDoc.getElementById('previewBtn')?.click();
      removeInnerPreviewBar(editorDoc);
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
    openPreview().catch(err => showStatus(err?.message || 'Non riesco a preparare l’anteprima.'));
  }, true);
})();
