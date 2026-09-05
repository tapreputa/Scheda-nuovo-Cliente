(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const activity = document.getElementById('activityType');
  const generate = document.getElementById('generateBtn');
  const preview = document.getElementById('previewBtn');
  if (!activity || !generate || !preview) return;

  const NO_LOGO_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==';
  window.tapLogoSkipped = false;

  function ensureMissingLogoDialog() {
    let overlay = document.getElementById('tapMissingLogoOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'tapMissingLogoOverlay';
    overlay.style.cssText = 'display:none;position:fixed;inset:0;z-index:99999;background:rgba(3,22,19,.48);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:20px';
    overlay.innerHTML = '<div role="dialog" aria-modal="true" aria-labelledby="tapMissingLogoTitle" style="width:min(92vw,430px);background:#fff;border:1px solid #d8e5e1;border-radius:24px;padding:26px;box-shadow:0 24px 70px rgba(0,0,0,.25);text-align:center;font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif"><div style="width:54px;height:54px;margin:0 auto 14px;border-radius:16px;background:#fff4dc;display:grid;place-items:center;font-size:26px">⚠️</div><h3 id="tapMissingLogoTitle" style="margin:0;color:#102d28;font-size:23px;line-height:1.2">Logo mancante</h3><p style="margin:12px 0 22px;color:#61726e;font-size:16px;line-height:1.45">Non hai caricato il logo dell’attività.<br><strong style="color:#294b44">Proseguire senza logo?</strong></p><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px"><button type="button" data-answer="no" style="min-height:52px;border:1px solid #cbd8d4;border-radius:14px;background:#fff;color:#31544d;font:inherit;font-weight:850;cursor:pointer">No</button><button type="button" data-answer="yes" style="min-height:52px;border:0;border-radius:14px;background:#009477;color:#fff;font:inherit;font-weight:850;cursor:pointer">Sì</button></div></div>';
    document.body.appendChild(overlay);
    return overlay;
  }

  function confirmMissingLogo() {
    return new Promise(resolve => {
      const overlay = ensureMissingLogoDialog();
      overlay.style.display = 'flex';
      const yes = overlay.querySelector('[data-answer="yes"]');
      const no = overlay.querySelector('[data-answer="no"]');
      const finish = value => {
        overlay.style.display = 'none';
        yes.onclick = null;
        no.onclick = null;
        overlay.onclick = null;
        document.removeEventListener('keydown', onKey);
        resolve(value);
      };
      const onKey = e => { if (e.key === 'Escape') finish(false); };
      yes.onclick = () => finish(true);
      no.onclick = () => finish(false);
      overlay.onclick = e => { if (e.target === overlay) finish(false); };
      document.addEventListener('keydown', onKey);
      setTimeout(() => yes.focus(), 0);
    });
  }

  function currentType() {
    const registry = window.TapCategories;
    return registry ? registry.normalizeId(activity.value) : activity.value;
  }

  function hasRealLogo() {
    let value = '';
    try { value = logoDataUrl; } catch (_) { value = window.logoDataUrl || ''; }
    return Boolean(value) && value !== NO_LOGO_PIXEL && !window.tapLogoSkipped;
  }

  function applyNoLogoState() {
    window.tapLogoSkipped = true;
    try { logoDataUrl = NO_LOGO_PIXEL; } catch (_) { window.logoDataUrl = NO_LOGO_PIXEL; }
    window.dispatchEvent(new CustomEvent('tap-logo-skip-change', { detail: { skipped: true } }));
  }

  function guardWithoutLogo(button) {
    button.addEventListener('click', event => {
      const type = currentType();
      if (!type || type === 'standard' || hasRealLogo() || window.tapLogoSkipped) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      confirmMissingLogo().then(ok => {
        if (!ok) return;
        applyNoLogoState();
        button.click();
      });
    }, true);
  }

  guardWithoutLogo(preview);
  guardWithoutLogo(generate);

  const logoInput = document.getElementById('logoFile');
  if (logoInput) {
    logoInput.addEventListener('change', () => {
      if (logoInput.files && logoInput.files[0]) {
        window.tapLogoSkipped = false;
        window.dispatchEvent(new CustomEvent('tap-logo-skip-change', { detail: { skipped: false } }));
      }
    });
  }

  if (typeof openInlinePreview === 'function') {
    const originalOpenInlinePreview = openInlinePreview;
    openInlinePreview = function(html) {
      if (window.tapLogoSkipped && typeof html === 'string') {
        html = html.replace('</head>', '<style id="tap-no-logo-global">.logo,.logo-wrap,.logo-box,.logo-container{display:none!important}</style></head>');
      }
      return originalOpenInlinePreview(html);
    };
  }
})();
