(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;
  if (typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;
  const cache = new Map();
  let pendingLogoProcess = Promise.resolve('');
  let processedLogoData = '';
  let selectionVersion = 0;
  let processing = false;

  function colorDistance(a, b) {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  // A transparent asset is already the preferred version: only trim its margins.
  // For opaque assets, require one uniform colour along all four edges.
  function getBackgroundColor(data, w, h) {
    const samples = [];
    const take = (x, y) => {
      const i = (y * w + x) * 4;
      samples.push([data[i], data[i + 1], data[i + 2], data[i + 3]]);
    };
    for (let x = 0; x < w; x += Math.max(1, Math.floor(w / 64))) {
      take(x, 0); take(x, h - 1);
    }
    for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 64))) {
      take(0, y); take(w - 1, y);
    }
    if (samples.some(s => s[3] < 250)) return null;
    const median = channel => samples.map(s => s[channel]).sort((a, b) => a - b)[Math.floor(samples.length / 2)];
    const bg = [median(0), median(1), median(2)];
    const matches = samples.filter(s => colorDistance(s, bg) <= 18).length;
    return matches / samples.length >= 0.95 ? bg : null;
  }

  function selectLogoPixels(original, w, h) {
    // Never strip a second background from the remaining lettering.
    for (let i = 3; i < original.length; i += 4) {
      if (original[i] < 250) return { data:original, mode:'transparent' };
    }
    const bg = getBackgroundColor(original, w, h);
    if (!bg) return { data:original, mode:'original' };
    const candidate = new Uint8ClampedArray(original);
    removeConnectedBackground(candidate, w, h, bg, 24);
    let remaining = 0, removed = 0, contrast = 0;
    for (let p = 0; p < w * h; p++) {
      const i = p * 4;
      if (candidate[i + 3] > 20) {
        remaining++;
        if (colorDistance([candidate[i], candidate[i + 1], candidate[i + 2]], bg) > 60) contrast++;
      } else removed++;
    }
    // Reject empty, near-empty and low-contrast cutouts; keep the source recoverable.
    const safe = remaining >= Math.max(8, w * h * 0.001) && contrast >= remaining * 0.1 && removed >= w * h * 0.05;
    return safe ? { data:candidate, mode:'cutout' } : { data:original, mode:'original' };
  }

  function alphaBounds(d, w, h, alphaMin = 20) {
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (d[i + 3] > alphaMin) {
          if (x < minX) minX = x;
          if (y < minY) minY = y;
          if (x > maxX) maxX = x;
          if (y > maxY) maxY = y;
        }
      }
    }
    return maxX < minX || maxY < minY ? null : { minX, minY, maxX, maxY };
  }

  function removeConnectedBackground(d, w, h, bg, threshold, bounds = null) {
    if (!bg) return;
    const seen = new Uint8Array(w * h);
    const qx = new Int32Array(w * h);
    const qy = new Int32Array(w * h);
    let head = 0, tail = 0;

    const minX = bounds ? bounds.minX : 0;
    const minY = bounds ? bounds.minY : 0;
    const maxX = bounds ? bounds.maxX : w - 1;
    const maxY = bounds ? bounds.maxY : h - 1;

    const isBackground = (x, y) => {
      const i = (y * w + x) * 4;
      if (d[i + 3] <= 18) return true;
      return colorDistance([d[i], d[i + 1], d[i + 2]], bg) <= threshold;
    };

    const push = (x, y) => {
      if (x < minX || x > maxX || y < minY || y > maxY) return;
      const p = y * w + x;
      if (seen[p] || !isBackground(x, y)) return;
      seen[p] = 1;
      qx[tail] = x; qy[tail] = y; tail++;
    };

    for (let x = minX; x <= maxX; x++) { push(x, minY); push(x, maxY); }
    for (let y = minY; y <= maxY; y++) { push(minX, y); push(maxX, y); }

    while (head < tail) {
      const x = qx[head], y = qy[head]; head++;
      const i = (y * w + x) * 4;
      d[i + 3] = 0;
      if (x > minX) push(x - 1, y);
      if (x < maxX) push(x + 1, y);
      if (y > minY) push(x, y - 1);
      if (y < maxY) push(x, y + 1);
    }
  }

  function processLogoDataUrl(src) {
    if (!src || !/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(src)) return Promise.resolve(src);
    if (cache.has(src)) return cache.get(src);

    const task = new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        try {
          const maxSide = 1200;
          const scale = Math.min(1, maxSide / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
          const w = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
          const h = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
          const canvas = document.createElement('canvas');
          canvas.width = w; canvas.height = h;
          const ctx = canvas.getContext('2d', { willReadFrequently:true });
          ctx.drawImage(img, 0, 0, w, h);
          const image = ctx.getImageData(0, 0, w, h);
          const d = image.data;

          const selected = selectLogoPixels(d, w, h);
          d.set(selected.data);
          const bounds = alphaBounds(d, w, h);
          if (!bounds) return resolve(src);
          let { minX, minY, maxX, maxY } = bounds;

          const padX = Math.max(4, Math.round((maxX - minX + 1) * 0.045));
          const padY = Math.max(4, Math.round((maxY - minY + 1) * 0.045));
          minX = Math.max(0, minX - padX); minY = Math.max(0, minY - padY);
          maxX = Math.min(w - 1, maxX + padX); maxY = Math.min(h - 1, maxY + padY);

          ctx.putImageData(image, 0, 0);
          const out = document.createElement('canvas');
          out.width = maxX - minX + 1;
          out.height = maxY - minY + 1;
          out.getContext('2d').drawImage(canvas, minX, minY, out.width, out.height, 0, 0, out.width, out.height);
          resolve(out.toDataURL('image/png'));
        } catch (e) {
          console.warn('Tapreputa: ritaglio automatico logo non riuscito.', e);
          resolve(src);
        }
      };
      img.onerror = () => resolve(src);
      img.src = src;
    });

    cache.set(src, task);
    return task;
  }

  function setCanonicalLogo(processed) {
    if (!processed) return;
    processedLogoData = String(processed);
    try { logoDataUrl = processedLogoData; } catch (_) {}
    window.logoDataUrl = processedLogoData;
    cache.set(processedLogoData, Promise.resolve(processedLogoData));

    const previewImg = document.getElementById('logoPreviewImg');
    const previewBox = document.getElementById('logoPreview');
    if (previewImg) previewImg.src = processedLogoData;
    if (previewBox) previewBox.classList.add('show');

    window.dispatchEvent(new CustomEvent('tap-logo-processed-ready', {
      detail: { dataUrl: processedLogoData }
    }));
  }

  function extractLogoDataUrl(html) {
    const tagMatch = html.match(/<img\b[^>]*class=["'][^"']*\blogo\b[^"']*["'][^>]*>/i) ||
                     html.match(/<img\b[^>]*id=["'][^"']*logo[^"']*["'][^>]*>/i);
    if (!tagMatch) return null;
    const srcMatch = tagMatch[0].match(/src=["'](data:image\/[^"']+)["']/i);
    return srcMatch ? srcMatch[1] : null;
  }

  openInlinePreview = function(html) {
    // Saved pages already contain the approved logo and composition. Reopening
    // them must be synchronous so the shared editor can install its controls.
    if (window.TapClientPageEdit?.active()) return previousOpenInlinePreview(html);
    const noLogo = !!window.tapLogoSkipped;
    if (noLogo || typeof html !== 'string') return previousOpenInlinePreview(html);

    const src = extractLogoDataUrl(html);
    if (!src) return previousOpenInlinePreview(html);

    const version = selectionVersion;
    processLogoDataUrl(src).then((processed) => {
      if (version !== selectionVersion || window.tapLogoSkipped) return;
      if (processed) setCanonicalLogo(processed);
      let finalHtml = html;
      if (processed && processed !== src) finalHtml = finalHtml.split(src).join(processed);
      finalHtml = finalHtml.replace('</head>', `<style id="tap-global-logo-harmony-v3">
        .logo-wrap,.logo-box,.logo-container{
          background:transparent!important;
          border:0!important;
          box-shadow:none!important;
          backdrop-filter:none!important;
          -webkit-backdrop-filter:none!important;
          padding:0!important;
        }
        .logo{
          background:transparent!important;
          border:0!important;
          box-shadow:none!important;
          padding:0!important;
          object-fit:contain!important;
          /* Dual contrast follows the alpha silhouette; original colours stay intact. */
          filter:drop-shadow(1px 0 0 rgba(255,255,255,.98)) drop-shadow(-1px 0 0 rgba(255,255,255,.98)) drop-shadow(0 1px 0 rgba(255,255,255,.98)) drop-shadow(0 -1px 0 rgba(255,255,255,.98)) drop-shadow(0 2px 2px rgba(0,0,0,.95)) drop-shadow(0 5px 10px rgba(0,0,0,.45))!important;
        }
      </style></head>`);
      previousOpenInlinePreview(finalHtml);
    });
  };

  const logoInput = document.getElementById('logoFile');
  const previewImg = document.getElementById('logoPreviewImg');
  if (logoInput && previewImg) {
    logoInput.addEventListener('change', () => {
      const file = logoInput.files && logoInput.files[0];
      const version = ++selectionVersion;
      processedLogoData = '';
      processing = Boolean(file);
      const name = document.getElementById('logoName');
      if (name) name.textContent = file?.name || '';
      try { logoDataUrl = ''; } catch (_) {}
      window.logoDataUrl = '';
      if (!file || !file.type.startsWith('image/')) {
        processing = false;
        pendingLogoProcess = Promise.resolve('');
        return;
      }
      pendingLogoProcess = new Promise(resolve => {
        const reader = new FileReader();
        reader.onload = () => {
          processLogoDataUrl(String(reader.result || '')).then(processed => {
            if (version === selectionVersion) {
              processing = false;
              if (processed && !window.tapLogoSkipped) setCanonicalLogo(processed);
            }
            resolve(processed || '');
          });
        };
        reader.onerror = () => {
          if (version === selectionVersion) processing = false;
          resolve('');
        };
        reader.readAsDataURL(file);
      });
    });
  }

  // Wait before template creation, so preview and publication use the same logo.
  document.addEventListener('click', event => {
    const button = event.target.closest?.('#previewBtn,#generateBtn,#addClientBtn,#tapSavePotentialBtn');
    if (!button || !processing || window.tapLogoSkipped) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const version = selectionVersion;
    pendingLogoProcess.then(() => {
      if (version === selectionVersion && !processing) button.click();
    });
  }, true);

  window.TapLogoAutocrop = Object.freeze({
    processLogoDataUrl,
    whenReady: () => pendingLogoProcess,
    getProcessedLogo: () => processedLogoData
  });
})();

