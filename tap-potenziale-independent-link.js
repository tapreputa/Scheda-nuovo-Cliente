(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '') !== 'personalizza-potenziale.html') return;

  const btn = document.getElementById('generateCustom');
  const category = document.getElementById('customCategory');
  const customLink = document.getElementById('customLink');
  const copyCustom = document.getElementById('copyCustom');
  const summary = document.getElementById('summary');
  const status = document.getElementById('customStatus');
  if (!btn || !category || !customLink || !copyCustom || !summary) return;

  const params = new URLSearchParams(location.search);
  const initialLink = params.get('customlink') || '';

  function statusMsg(text, type='ok') {
    if (!status) return;
    status.className = 'status show ' + type;
    status.textContent = text;
  }

  function newToken() {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return [...bytes].map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function tokenFromLink(link) {
    try {
      const u = new URL(link, location.href);
      if (!/prospect\.html$/i.test(u.pathname)) return '';
      return u.searchParams.get('p') || '';
    } catch { return ''; }
  }

  let token = tokenFromLink(initialLink) || window.tapProspectToken || '';

  function ensureToken() {
    if (!token) token = newToken();
    window.tapProspectToken = token;
    return token;
  }

  function prospectUrl() {
    const u = new URL('prospect.html', location.href);
    u.searchParams.set('p', ensureToken());
    return u.href;
  }

  async function copy(text, button) {
    try {
      await navigator.clipboard.writeText(text);
      const old = button.textContent;
      button.textContent = 'Copiato ✓';
      setTimeout(() => button.textContent = old, 1000);
    } catch {
      prompt('Copia il link:', text);
    }
  }

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopImmediatePropagation();

    if (!category.value) {
      statusMsg('Seleziona prima la categoria personalizzata.', 'warn');
      return;
    }

    if (category.value !== 'bar') {
      statusMsg('Il nuovo motore indipendente è in validazione su Bar / Caffetterie. Per ora genera il link usando questa categoria.', 'warn');
      return;
    }

    const url = prospectUrl();
    customLink.textContent = url;
    customLink.classList.remove('empty');
    copyCustom.disabled = false;
    copyCustom.onclick = () => copy(url, copyCustom);
    summary.classList.add('show');
    statusMsg('Link personalizzato indipendente pronto.', 'ok');

    window.tapGeneratedProspectLink = url;
  }, true);

  if (initialLink && tokenFromLink(initialLink)) {
    window.tapProspectToken = token;
  }
})();
