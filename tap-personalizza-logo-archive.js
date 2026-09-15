(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const SUPABASE_URL = 'https://rqzgdgdoulgjwlxtdxhi.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_Hc_FOVPSOkuNC-mz25VknA_5O0fWJ6p';
  const SESSION_KEY = 'tapnfc_supabase_session_v1';
  const BUCKET = 'tapnfc-logo-archive';
  const LIMIT = 40;

  const logoInput = document.getElementById('logoFile');
  if (!logoInput || !window.TapNfc?.rest) return;
  if (document.getElementById('tapLogoArchiveButton')) return;

  function session() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const value = JSON.parse(storage.getItem(SESSION_KEY) || 'null');
        if (value?.access_token) return value;
      } catch {}
    }
    return null;
  }

  async function token() {
    let current = session();
    if (!current?.access_token || !current.expires_at || current.expires_at - Date.now() < 90000) {
      await TapNfc.getUser();
      current = session();
    }
    if (!current?.access_token) throw new Error('Sessione scaduta. Accedi nuovamente.');
    return current.access_token;
  }

  async function storage(path, options = {}) {
    const accessToken = await token();
    const headers = new Headers(options.headers || {});
    headers.set('apikey', PUBLISHABLE_KEY);
    headers.set('Authorization', 'Bearer ' + accessToken);
    return fetch(SUPABASE_URL + '/storage/v1/' + path, { ...options, headers });
  }

  async function json(response, fallback) {
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    if (!response.ok) throw new Error(data?.message || data?.error || data?.hint || fallback || 'Operazione non riuscita.');
    return data;
  }

  async function signedUrl(path) {
    const encoded = String(path || '').split('/').map(encodeURIComponent).join('/');
    const response = await storage('object/sign/' + BUCKET + '/' + encoded, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ expiresIn:600 })
    });
    const data = await json(response, 'Impossibile aprire il logo.');
    const signed = data?.signedURL || data?.signedUrl || '';
    if (!signed) throw new Error('Link temporaneo del logo non disponibile.');
    return /^https?:/i.test(signed) ? signed : SUPABASE_URL + '/storage/v1' + (signed.startsWith('/') ? signed : '/' + signed);
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ''));
      reader.onerror = () => reject(reader.error || new Error('Impossibile preparare il logo.'));
      reader.readAsDataURL(blob);
    });
  }

  function safeTerm(value) {
    return String(value || '').trim().replace(/[*,()]/g, ' ').replace(/\s+/g, ' ').slice(0,80);
  }

  async function findLogos(term = '') {
    const q = safeTerm(term);
    let path = 'logo_archive?select=id,business_name,storage_path,thumb_path,file_size,uploaded_by_name,created_at&order=created_at.desc&limit=' + LIMIT;
    if (q) path += '&business_name=ilike.' + encodeURIComponent('*' + q + '*');
    const response = await TapNfc.rest(path);
    return json(response, 'Impossibile caricare l’Archivio Logo.');
  }

  function injectStyles() {
    if (document.getElementById('tapLogoArchivePersonalizzaStyle')) return;
    const style = document.createElement('style');
    style.id = 'tapLogoArchivePersonalizzaStyle';
    style.textContent = `
      .tap-logo-source-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-top:12px}
      .tap-logo-archive-btn{min-height:48px;border:1px solid #b9cfea;border-radius:14px;background:#eef5ff;color:#125fca;font:inherit;font-size:14px;font-weight:850;cursor:pointer;padding:0 14px}
      .tap-logo-archive-btn:disabled{opacity:.5;cursor:not-allowed}
      .tap-logo-source-note{grid-column:1/-1;color:#758494;font-size:12px;line-height:1.4}
      .tap-logo-archive-overlay{position:fixed;inset:0;z-index:1000000;background:rgba(4,15,31,.58);display:none;align-items:flex-end;justify-content:center;padding:18px}
      .tap-logo-archive-overlay.show{display:flex}
      .tap-logo-archive-modal{width:min(720px,100%);max-height:min(82vh,760px);background:#f7f9fd;border-radius:24px 24px 18px 18px;box-shadow:0 26px 80px rgba(0,0,0,.28);display:flex;flex-direction:column;overflow:hidden;border:1px solid rgba(255,255,255,.55)}
      .tap-logo-archive-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:17px 18px;background:#fff;border-bottom:1px solid #dfe6ef}
      .tap-logo-archive-title{font-size:19px;font-weight:900;color:#0b2142}
      .tap-logo-archive-close{width:42px;height:42px;border-radius:12px;border:1px solid #d6dfeb;background:#fff;color:#1e3554;font-size:22px;cursor:pointer}
      .tap-logo-archive-search-wrap{padding:14px 16px 10px;background:#fff}
      .tap-logo-archive-search{width:100%;height:50px;border:1.5px solid #cad7e6;border-radius:14px;padding:0 14px;font:inherit;font-size:15px;outline:none;background:#fff;color:#10233f}
      .tap-logo-archive-search:focus{border-color:#1769ff;box-shadow:0 0 0 4px rgba(23,105,255,.10)}
      .tap-logo-archive-status{padding:0 17px 10px;background:#fff;color:#718097;font-size:12px;font-weight:700}
      .tap-logo-archive-grid{overflow:auto;padding:14px;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:11px;-webkit-overflow-scrolling:touch}
      .tap-logo-choice{border:1px solid #dbe4ef;background:#fff;border-radius:16px;overflow:hidden;padding:0;text-align:left;cursor:pointer;box-shadow:0 7px 18px rgba(20,42,74,.06)}
      .tap-logo-choice:active{transform:scale(.985)}
      .tap-logo-choice-img{aspect-ratio:1.3/1;background:#eef3f8;display:grid;place-items:center;padding:10px;color:#7f8c9c;font-size:11px}
      .tap-logo-choice-img img{width:100%;height:100%;object-fit:contain;display:block}
      .tap-logo-choice-copy{padding:11px}
      .tap-logo-choice-name{font-size:13px;font-weight:900;color:#0b2142;overflow-wrap:anywhere}
      .tap-logo-choice-meta{margin-top:4px;color:#8090a3;font-size:10px;line-height:1.35}
      .tap-logo-archive-empty{grid-column:1/-1;padding:38px 12px;text-align:center;color:#728096;font-size:13px}
      .tap-logo-loading{opacity:.65;pointer-events:none}
      @media(max-width:760px){.tap-logo-source-row{grid-template-columns:1fr}.tap-logo-archive-overlay{padding:0;align-items:flex-end}.tap-logo-archive-modal{width:100%;max-height:88dvh;border-radius:24px 24px 0 0}.tap-logo-archive-grid{grid-template-columns:repeat(2,minmax(0,1fr));padding-bottom:calc(18px + env(safe-area-inset-bottom))}}
      @media(max-width:360px){.tap-logo-archive-grid{grid-template-columns:1fr 1fr;gap:8px}.tap-logo-choice-copy{padding:9px}.tap-logo-choice-name{font-size:12px}}
    `;
    document.head.appendChild(style);
  }

  injectStyles();

  const uploadBox = logoInput.closest('.upload-box') || logoInput.parentElement;
  const sourceRow = document.createElement('div');
  sourceRow.className = 'tap-logo-source-row';

  const archiveBtn = document.createElement('button');
  archiveBtn.type = 'button';
  archiveBtn.id = 'tapLogoArchiveButton';
  archiveBtn.className = 'tap-logo-archive-btn';
  archiveBtn.textContent = 'Archivio Logo';

  const note = document.createElement('div');
  note.className = 'tap-logo-source-note';
  note.textContent = 'Puoi continuare a scegliere un file dal telefono oppure usare un logo già preparato nell’archivio condiviso.';

  sourceRow.append(archiveBtn, note);
  uploadBox.appendChild(sourceRow);

  const overlay = document.createElement('div');
  overlay.className = 'tap-logo-archive-overlay';
  overlay.setAttribute('aria-hidden', 'true');
  overlay.innerHTML = `
    <section class="tap-logo-archive-modal" role="dialog" aria-modal="true" aria-label="Scegli logo dall’archivio">
      <div class="tap-logo-archive-head">
        <div class="tap-logo-archive-title">Archivio Logo</div>
        <button class="tap-logo-archive-close" type="button" aria-label="Chiudi">×</button>
      </div>
      <div class="tap-logo-archive-search-wrap"><input class="tap-logo-archive-search" type="search" autocomplete="off" placeholder="Cerca nome attività…"></div>
      <div class="tap-logo-archive-status">Caricamento…</div>
      <div class="tap-logo-archive-grid"></div>
    </section>`;
  document.body.appendChild(overlay);

  const closeBtn = overlay.querySelector('.tap-logo-archive-close');
  const search = overlay.querySelector('.tap-logo-archive-search');
  const status = overlay.querySelector('.tap-logo-archive-status');
  const grid = overlay.querySelector('.tap-logo-archive-grid');
  const modal = overlay.querySelector('.tap-logo-archive-modal');
  let timer = null;
  let requestId = 0;

  function close() {
    overlay.classList.remove('show');
    overlay.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  async function choose(item, button) {
    button.classList.add('tap-logo-loading');
    status.textContent = 'Carico il logo selezionato…';
    try {
      const url = await signedUrl(item.storage_path);
      const response = await fetch(url, { cache:'no-store' });
      if (!response.ok) throw new Error('Impossibile scaricare il logo selezionato.');
      const blob = await response.blob();
      const dataUrl = await blobToDataUrl(blob);
      if (!dataUrl) throw new Error('Impossibile preparare il logo selezionato.');
      const fileName = (String(item.business_name || 'logo').trim().replace(/[^a-z0-9àèéìòù_-]+/gi, '-').replace(/^-+|-+$/g, '') || 'logo') + '.webp';
      const file = new File([blob], fileName, { type:blob.type || 'image/webp', lastModified:Date.now() });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      logoInput.files = transfer.files;
      try { logoDataUrl = dataUrl; } catch (_) { window.logoDataUrl = dataUrl; }
      const previewImg = document.getElementById('logoPreviewImg');
      const previewBox = document.getElementById('logoPreview');
      const previewName = document.getElementById('logoName');
      if (previewImg) previewImg.src = dataUrl;
      if (previewName) previewName.textContent = fileName;
      if (previewBox) previewBox.classList.add('show');
      logoInput.dispatchEvent(new Event('change', { bubbles:true }));
      await new Promise(resolve => setTimeout(resolve, 0));
      close();
    } catch (error) {
      console.error('[Archivio Logo → Personalizza]', error);
      status.textContent = error.message || 'Impossibile usare questo logo.';
      button.classList.remove('tap-logo-loading');
    }
  }

  async function render(term = '') {
    const ownRequest = ++requestId;
    status.textContent = 'Ricerca…';
    grid.innerHTML = '';
    try {
      const rows = await findLogos(term);
      if (ownRequest !== requestId) return;
      const items = Array.isArray(rows) ? rows : [];
      status.textContent = items.length ? `${items.length}${items.length === LIMIT ? '+' : ''} risultati · tocca un logo per usarlo` : '0 risultati';
      if (!items.length) {
        const empty = document.createElement('div');
        empty.className = 'tap-logo-archive-empty';
        empty.textContent = term.trim() ? 'Nessun logo trovato. Prova con un altro nome.' : 'L’archivio è vuoto.';
        grid.appendChild(empty);
        return;
      }
      for (const item of items) {
        const choice = document.createElement('button');
        choice.type = 'button';
        choice.className = 'tap-logo-choice';
        const imageBox = document.createElement('div');
        imageBox.className = 'tap-logo-choice-img';
        imageBox.textContent = 'Anteprima…';
        const copy = document.createElement('div');
        copy.className = 'tap-logo-choice-copy';
        const name = document.createElement('div');
        name.className = 'tap-logo-choice-name';
        name.textContent = item.business_name;
        const meta = document.createElement('div');
        meta.className = 'tap-logo-choice-meta';
        meta.textContent = 'Caricato da ' + (item.uploaded_by_name || 'Operatore');
        copy.append(name, meta);
        choice.append(imageBox, copy);
        choice.addEventListener('click', () => choose(item, choice));
        grid.appendChild(choice);
        signedUrl(item.thumb_path).then(url => {
          const img = document.createElement('img');
          img.loading = 'lazy';
          img.decoding = 'async';
          img.alt = 'Logo ' + item.business_name;
          img.src = url;
          imageBox.replaceChildren(img);
        }).catch(() => { imageBox.textContent = 'Anteprima non disponibile'; });
      }
    } catch (error) {
      console.error('[Archivio Logo → Personalizza]', error);
      if (ownRequest !== requestId) return;
      status.textContent = 'Archivio non disponibile';
      const empty = document.createElement('div');
      empty.className = 'tap-logo-archive-empty';
      empty.textContent = error.message || 'Riprova tra poco.';
      grid.replaceChildren(empty);
    }
  }

  archiveBtn.addEventListener('click', () => {
    if (logoInput.disabled) return;
    overlay.classList.add('show');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    search.value = '';
    render('');
    setTimeout(() => search.focus(), 80);
  });

  closeBtn.addEventListener('click', close);
  overlay.addEventListener('click', event => { if (event.target === overlay) close(); });
  modal.addEventListener('click', event => event.stopPropagation());
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && overlay.classList.contains('show')) close(); });
  search.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(() => render(search.value), 220);
  });

  const activityType = document.getElementById('activityType');
  function syncDisabled() {
    archiveBtn.disabled = !!logoInput.disabled || activityType?.value === 'standard';
  }
  activityType?.addEventListener('change', syncDisabled);
  syncDisabled();
})();
