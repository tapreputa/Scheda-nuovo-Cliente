(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;
  if (typeof openInlinePreview !== 'function') return;

  const previousOpenInlinePreview = openInlinePreview;
  const cache = new Map();

  function colorDistance(a, b) {
    const dr = a[0] - b[0];
    const dg = a[1] - b[1];
    const db = a[2] - b[2];
    return Math.sqrt(dr * dr + dg * dg + db * db);
  }

  function getCornerColor(data, w, h) {
    const pts = [
      [0, 0], [w - 1, 0], [0, h - 1], [w - 1, h - 1],
      [Math.min(2, w - 1), Math.min(2, h - 1)],
      [Math.max(0, w - 3), Math.min(2, h - 1)],
      [Math.min(2, w - 1), Math.max(0, h - 3)],
      [Math.max(0, w - 3), Math.max(0, h - 3)]
    ];
    const sum = [0, 0, 0];
    let count = 0;
    for (const [x, y] of pts) {
      const i = (y * w + x) * 4;
      if (data[i + 3] < 20) continue;
      sum[0] += data[i]; sum[1] += data[i + 1]; sum[2] += data[i + 2]; count++;
    }
    if (!count) return null;
    return [sum[0] / count, sum[1] / count, sum[2] / count];
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

  function sampleOpaqueBorderColor(d, w, h, b) {
    const samples = [];
    const stepX = Math.max(1, Math.floor((b.maxX - b.minX + 1) / 40));
    const stepY = Math.max(1, Math.floor((b.maxY - b.minY + 1) / 40));
    const take = (x, y) => {
      const i = (y * w + x) * 4;
      if (d[i + 3] > 180) samples.push([d[i], d[i + 1], d[i + 2]]);
    };
    for (let x = b.minX; x <= b.maxX; x += stepX) { take(x, b.minY); take(x, b.maxY); }
    for (let y = b.minY; y <= b.maxY; y += stepY) { take(b.minX, y); take(b.maxX, y); }
    if (!samples.length) return null;

    // Median-like robust representative to avoid one bright logo detail influencing the background sample.
    const avg = [0, 0, 0];
    for (const s of samples) { avg[0] += s[0]; avg[1] += s[1]; avg[2] += s[2]; }
    avg[0] /= samples.length; avg[1] /= samples.length; avg[2] /= samples.length;
    return avg;
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

          // Pass 1: remove the uniform color connected to the actual image edges.
          const bg = getCornerColor(d, w, h);
          removeConnectedBackground(d, w, h, bg, 34);

          // Pass 2: handles logos with transparent rounded corners around a solid rectangle.
          // After trimming the transparent exterior, sample the first opaque border and remove
          // only the connected uniform area. This keeps the real logo artwork intact.
          const firstBounds = alphaBounds(d, w, h);
          if (firstBounds) {
            const innerBg = sampleOpaqueBorderColor(d, w, h, firstBounds);
            if (innerBg) removeConnectedBackground(d, w, h, innerBg, 28, firstBounds);
          }

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

  function extractLogoDataUrl(html) {
    const tagMatch = html.match(/<img\b[^>]*class=["'][^"']*\blogo\b[^"']*["'][^>]*>/i) ||
                     html.match(/<img\b[^>]*id=["'][^"']*logo[^"']*["'][^>]*>/i);
    if (!tagMatch) return null;
    const srcMatch = tagMatch[0].match(/src=["'](data:image\/[^"']+)["']/i);
    return srcMatch ? srcMatch[1] : null;
  }

  openInlinePreview = function(html) {
    const noLogo = !!window.tapLogoSkipped;
    if (noLogo || typeof html !== 'string') return previousOpenInlinePreview(html);

    const src = extractLogoDataUrl(html);
    if (!src) return previousOpenInlinePreview(html);

    processLogoDataUrl(src).then((processed) => {
      let finalHtml = html;
      if (processed && processed !== src) finalHtml = finalHtml.split(src).join(processed);
      finalHtml = finalHtml.replace('</head>', `<style id="tap-global-logo-harmony-v2">
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
          filter:drop-shadow(0 5px 12px rgba(0,0,0,.24))!important;
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
      if (!file || !file.type.startsWith('image/') || file.type.includes('svg')) return;
      const reader = new FileReader();
      reader.onload = () => processLogoDataUrl(String(reader.result || '')).then((processed) => {
        if (processed) previewImg.src = processed;
      });
      reader.readAsDataURL(file);
    });
  }
})();
