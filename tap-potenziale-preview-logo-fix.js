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
    if (!hasLogo) return new Promise(r => setTimeout(r, 140));
    return new Promise((resolve, reject) => {
      let tries = 0;
      const timer = setInterval(() => {
        tries++;
        const img = doc.getElementById('logoPreviewImg');
        const src = img?.getAttribute('src') || img?.src || '';
        if (/^data:image\//i.test(src)) {
          clearInterval(timer);
          resolve();
        } else if (tries > 100) {
          clearInterval(timer);
          reject(new Error('Il logo non è stato caricato nel renderer. Riprova.'));
        }
      }, 50);
    });
  }

  function hideInnerBack(doc) {
    const hide = () => {
      [...doc.querySelectorAll('button,a')].forEach(el => {
        if (/Torna a Personalizza/i.test((el.textContent || '').trim())) {
          el.style.setProperty('display', 'none', 'important');
        }
      });
    };
    hide();
    let tries = 0;
    const timer = setInterval(() => {
      tries++;
      hide();
      if (tries > 60) clearInterval(timer);
    }, 60);
  }

  function forceLogoIntoFinalPreview(editorDoc, logoDataUrl, hasLogo) {
    return new Promise((resolve) => {
      let tries = 0;
      const timer = setInterval(() => {
        tries++;
        const previewFrame = editorDoc.getElementById('tapPreviewFrame');
        const previewDoc = previewFrame?.contentDocument;
        if (!previewDoc?.body) {
          if (tries > 120) { clearInterval(timer); resolve(false); }
          return;
        }

        const candidates = [...previewDoc.querySelectorAll(
          'img.logo, img#logo, img[id*="logo" i], img[class*="logo" i]'
        )];

        if (candidates.length) {
          candidates.forEach(img => {
            const wrapper = img.closest('.logo-wrap,.logo-box,.logo-container');
            if (hasLogo && logoDataUrl) {
              img.src = logoDataUrl;
              img.removeAttribute('srcset');
              img.style.setProperty('display', 'block', 'important');
              img.style.setProperty('visibility', 'visible', 'important');
              img.style.setProperty('opacity', '1', 'important');
              img.style.setProperty('object-fit', 'contain', 'important');
              img.style.setProperty('background', 'transparent', 'important');
              if (wrapper) {
                wrapper.style.setProperty('display', '', 'important');
                wrapper.style.setProperty('visibility', 'visible', 'important');
                wrapper.style.setProperty('background', 'transparent', 'important');
              }
            } else {
              img.style.setProperty('display', 'none', 'important');
              if (wrapper) wrapper.style.setProperty('display', 'none', 'important');
            }
          });
          clearInterval(timer);
          resolve(true);
          return;
        }

        if (tries > 120) {
          clearInterval(timer);
          resolve(false);
        }
      }, 50);
    });
  }

  async function openPreview() {
    if (!category.value) return showStatus('Seleziona la categoria personalizzata.');
    const selectedFile = logoInput.files?.[0] || null;
    const logoDataUrl = selectedFile ? await fileToDataUrl(selectedFile) : '';

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

      hideInnerBack(editorDoc);
      const applied = await forceLogoIntoFinalPreview(editorDoc, logoDataUrl, !!selectedFile);
      if (selectedFile && !applied) {
        showStatus('Anteprima aperta, ma non riesco a individuare il contenitore del logo.', 'warn');
      } else {
        showStatus('Anteprima pronta.', 'ok');
      }
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
