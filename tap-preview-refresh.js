(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  function installRefreshButton() {
    const overlay = document.getElementById('tapPreviewOverlay');
    if (!overlay || overlay.querySelector('[data-tap-preview-refresh]')) return;

    const topbar = overlay.firstElementChild;
    if (!topbar) return;

    const button = document.createElement('button');
    button.type = 'button';
    button.dataset.tapPreviewRefresh = '1';
    button.setAttribute('aria-label', 'Aggiorna dopo una modifica');
    button.title = 'Aggiorna dopo una modifica';
    button.textContent = '↻';
    button.style.cssText = 'width:44px;height:44px;flex:0 0 44px;border:1px solid rgba(255,255,255,.42);background:rgba(255,255,255,.12);color:#fff;border-radius:50%;font:900 25px/1 Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Arial,sans-serif;display:grid;place-items:center;cursor:pointer;-webkit-tap-highlight-color:transparent';

    button.addEventListener('click', () => {
      button.disabled = true;
      button.textContent = '…';
      location.reload();
    });

    const close = Array.from(topbar.querySelectorAll('button')).find(el => el.textContent.includes('Torna a Personalizza'));
    if (close) topbar.insertBefore(button, close);
    else topbar.appendChild(button);
  }

  const observer = new MutationObserver(installRefreshButton);
  observer.observe(document.body, { childList:true, subtree:true });
  installRefreshButton();
})();
