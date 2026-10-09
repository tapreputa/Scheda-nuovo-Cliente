(() => {
  'use strict';
  const BUILD = '20261008-logo-surface1';
  const STYLE_ID = 'tap-logo-solid-contrast-v1';
  const css = `
    html body .page:not(.fumetti) img.logo,html body .page:not(.fumetti) img#logo{
      background:#fff!important;
      padding:10px 14px!important;
      border-radius:14px!important;
      border:1px solid rgba(0,0,0,.14)!important;
      box-sizing:border-box!important;
      object-fit:contain!important;
      opacity:1!important;
      mix-blend-mode:normal!important;
      backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
      filter:drop-shadow(0 0 1px rgba(0,0,0,.85))!important;
      box-shadow:0 4px 16px rgba(0,0,0,.2)!important;
    }
    html body .logo-wrap,html body .logo-box,html body .logo-container{
      background:transparent!important;border:0!important;padding:0!important;
      box-shadow:none!important;backdrop-filter:none!important;
      -webkit-backdrop-filter:none!important;
    }
  `;

  function surfaceForPixels(pixels) {
    let weight = 0, dark = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const alpha = pixels[i + 3] / 255;
      if (alpha < .1) continue;
      const brightness = (.2126 * pixels[i] + .7152 * pixels[i + 1] + .0722 * pixels[i + 2]) / 255;
      weight += alpha;
      if (brightness < .48) dark += alpha;
    }
    return !weight || dark / weight >= .3 ? '#ffffff' : '#17212b';
  }

  function applyToImage(img) {
    const update = () => {
      if (!img.naturalWidth || !img.naturalHeight) return;
      let surface = '#ffffff';
      try {
        const canvas = document.createElement('canvas');
        const scale = Math.min(1, 120 / Math.max(img.naturalWidth, img.naturalHeight));
        canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
        const ctx = canvas.getContext('2d', { willReadFrequently:true });
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        surface = surfaceForPixels(ctx.getImageData(0, 0, canvas.width, canvas.height).data);
      } catch (_) {}
      // Inline important wins over every category template, including old rules.
      img.style.setProperty('background', surface, 'important');
      img.style.setProperty('filter', surface === '#ffffff'
        ? 'drop-shadow(0 0 1px rgba(0,0,0,.85))'
        : 'drop-shadow(0 0 1px rgba(255,255,255,.85))', 'important');
    };
    img.addEventListener('load', update);
    if (img.complete) update();
  }

  function applyAll() {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement('style');
      style.id = STYLE_ID;
      style.textContent = css;
      document.head.appendChild(style);
    }
    document.querySelectorAll('img.logo,img#logo').forEach(img => { if (!img.closest('.page.fumetti')) applyToImage(img); });
  }

  function decorateHtml(html) {
    if (typeof html !== 'string' || !/<img\b[^>]*(?:class=["'][^"']*\blogo\b|id=["']logo["'])/i.test(html)) return html;
    const src = new URL('tap-logo-legibility.js?v=' + BUILD, location.href).href;
    if (!html.includes('id="' + STYLE_ID + '"')) {
      html = html.replace(/<\/head>/i, '<style id="' + STYLE_ID + '">' + css + '</style></head>');
      html = html.replace(/<\/body>/i, '<script src="' + src + '"></script></body>');
    }
    return html;
  }

  window.TapLogoLegibility = Object.freeze({ decorateHtml, surfaceForPixels });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', applyAll, { once:true });
  else applyAll();
})();
