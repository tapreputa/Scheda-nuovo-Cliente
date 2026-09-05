(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const REOPEN_KEY = 'tap_preview_reopen_v2';

  function readLogoData() {
    try { return typeof logoDataUrl !== 'undefined' ? String(logoDataUrl || '') : String(window.logoDataUrl || ''); }
    catch (_) { return String(window.logoDataUrl || ''); }
  }

  function savePreviewState() {
    const activity = document.getElementById('activityType');
    const state = {
      category: activity?.value || '',
      logo: readLogoData(),
      skipped: Boolean(window.tapLogoSkipped),
      savedAt: Date.now()
    };
    sessionStorage.setItem(REOPEN_KEY, JSON.stringify(state));
  }

  function installRefreshButton() {
    const overlay = document.getElementById('tapPreviewOverlay');
    if (!overlay || overlay.querySelector('[data-tap-preview-refresh]')) return;

    const topbar = overlay.firstElementChild;
    if (!topbar) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.tapPreviewRefresh = '1';
    button.setAttribute('aria-label', 'Aggiorna anteprima');
    button.title = 'Aggiorna anteprima';
    button.textContent = '↻';
    button.style.cssText = 'width:44px;height:44px;flex:0 0 44px;border:1px solid rgba(255,255,255,.42);background:rgba(255,255,255,.12);color:#fff;border-radius:50%;font:900 25px/1 Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;display:grid;place-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent';

    button.addEventListener('click', () => {
      savePreviewState();
      button.disabled = true;
      button.textContent = '…';
      location.reload();
    });

    const close = Array.from(topbar.querySelectorAll('button')).find(el => el.textContent.includes('Torna a Personalizza'));
    if (close) topbar.insertBefore(button, close);
    else topbar.appendChild(button);
  }

  function restoreAndReopenPreview() {
    let state = null;
    try { state = JSON.parse(sessionStorage.getItem(REOPEN_KEY) || 'null'); } catch (_) {}
    if (!state) return;
    sessionStorage.removeItem(REOPEN_KEY);
    if (Date.now() - Number(state.savedAt || 0) > 120000) return;

    let attempts = 0;
    const timer = setInterval(() => {
      attempts++;
      const activity = document.getElementById('activityType');
      const preview = document.getElementById('previewBtn');
      const destination = document.getElementById('destinationUrl');
      if (!activity || !preview || !destination || !destination.value) {
        if (attempts > 80) clearInterval(timer);
        return;
      }

      if (state.category) {
        const normalized = window.TapCategories ? window.TapCategories.normalizeId(state.category) : state.category;
        if (activity.value !== normalized) {
          activity.value = normalized;
          activity.dispatchEvent(new Event('change', { bubbles:true }));
        }
      }

      try { logoDataUrl = state.logo || ''; } catch (_) { window.logoDataUrl = state.logo || ''; }
      window.tapLogoSkipped = Boolean(state.skipped);

      if (state.logo && !state.skipped) {
        const previewBox = document.getElementById('logoPreview');
        const previewImg = document.getElementById('logoPreviewImg');
        if (previewImg) previewImg.src = state.logo;
        if (previewBox) previewBox.classList.add('show');
      }

      clearInterval(timer);
      setTimeout(() => preview.click(), 120);
    }, 100);
  }

  const observer = new MutationObserver(installRefreshButton);
  observer.observe(document.body, { childList:true, subtree:true });
  installRefreshButton();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', restoreAndReopenPreview, { once:true });
  } else {
    restoreAndReopenPreview();
  }
})();
