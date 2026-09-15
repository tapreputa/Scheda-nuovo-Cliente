(() => {
  'use strict';

  const SUPABASE_URL = 'https://rqzgdgdoulgjwlxtdxhi.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_Hc_FOVPSOkuNC-mz25VknA_5O0fWJ6p';
  const SESSION_KEY = 'tapnfc_supabase_session_v1';
  const BUCKET = 'tapnfc-logo-archive';
  const MAX_SOURCE_BYTES = 10 * 1024 * 1024;
  const MAX_LOGO_EDGE = 1600;
  const MAX_THUMB_EDGE = 360;
  const SEARCH_LIMIT = 40;
  const ALLOWED_TYPES = new Set(['image/jpeg','image/png','image/webp']);

  const businessName = document.getElementById('logoBusinessName');
  const fileInput = document.getElementById('logoFile');
  const filePicker = document.getElementById('logoFilePicker');
  const fileName = document.getElementById('logoFileName');
  const uploadBtn = document.getElementById('logoUploadBtn');
  const uploadStatus = document.getElementById('logoStatus');
  const searchInput = document.getElementById('logoSearch');
  const searchCount = document.getElementById('logoSearchCount');
  const archiveGrid = document.getElementById('logoArchiveGrid');

  let user = null;
  let selectedFile = null;
  let searchTimer = null;
  const signedUrlCache = new Map();

  function storedSession() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const value = JSON.parse(storage.getItem(SESSION_KEY) || 'null');
        if (value?.access_token) return value;
      } catch {}
    }
    return null;
  }

  async function accessToken() {
    let session = storedSession();
    if (!session?.access_token || !session.expires_at || session.expires_at - Date.now() < 90000) {
      await TapNfc.getUser();
      session = storedSession();
    }
    if (!session?.access_token) throw new Error('Sessione scaduta. Accedi nuovamente.');
    return session.access_token;
  }

  async function storageRequest(path, options = {}) {
    let token = await accessToken();
    const makeHeaders = () => {
      const headers = new Headers(options.headers || {});
      headers.set('apikey', PUBLISHABLE_KEY);
      headers.set('Authorization', 'Bearer ' + token);
      return headers;
    };
    let response = await fetch(SUPABASE_URL + '/storage/v1/' + path, { ...options, headers: makeHeaders() });
    if (response.status === 401) {
      await TapNfc.getUser();
      token = await accessToken();
      response = await fetch(SUPABASE_URL + '/storage/v1/' + path, { ...options, headers: makeHeaders() });
    }
    return response;
  }

  async function parseResponse(response, fallback) {
    const text = await response.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch {}
    if (!response.ok) throw new Error(data?.message || data?.error || data?.hint || fallback || 'Operazione non riuscita.');
    return data;
  }

  function operatorInfo(currentUser) {
    const email = String(currentUser?.email || '').toLowerCase();
    if (email === 'francesco@tapnfc.local') return { name:'Francesco', email };
    if (email === 'gisberto@tapnfc.local') return { name:'Gisberto', email };
    if (email === 'enzo@tapnfc.local') return { name:'Enzo', email };
    return null;
  }

  function setStatus(message, type = 'info') {
    uploadStatus.textContent = message || '';
    uploadStatus.className = 'status' + (message ? ' show ' + type : '');
  }

  function formatBytes(bytes) {
    const n = Number(bytes || 0);
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1).replace('.', ',') + ' KB';
    return (n / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
  }

  function safeUuid() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return String(Date.now()) + '-' + Math.random().toString(16).slice(2);
  }

  function loadImage(file) {
    return new Promise((resolve, reject) => {
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => resolve({ img, url });
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Impossibile leggere il file immagine.')); };
      img.src = url;
    });
  }

  async function renderWebp(file, maxEdge, quality) {
    const { img, url } = await loadImage(file);
    try {
      const naturalWidth = img.naturalWidth || img.width;
      const naturalHeight = img.naturalHeight || img.height;
      if (!naturalWidth || !naturalHeight) throw new Error('Dimensioni immagine non valide.');
      const scale = Math.min(1, maxEdge / Math.max(naturalWidth, naturalHeight));
      const width = Math.max(1, Math.round(naturalWidth * scale));
      const height = Math.max(1, Math.round(naturalHeight * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha:true });
      ctx.clearRect(0,0,width,height);
      ctx.drawImage(img,0,0,width,height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', quality));
      if (!blob) throw new Error('Ottimizzazione immagine non riuscita.');
      return blob;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function uploadObject(path, blob) {
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    const response = await storageRequest('object/' + BUCKET + '/' + encodedPath, {
      method:'POST',
      headers:{ 'Content-Type':'image/webp', 'x-upsert':'false' },
      body:blob
    });
    await parseResponse(response, 'Caricamento file non riuscito.');
  }

  async function deleteObject(path) {
    if (!path) return;
    try {
      const response = await storageRequest('object/' + BUCKET, {
        method:'DELETE',
        headers:{ 'Content-Type':'application/json' },
        body:JSON.stringify({ prefixes:[path] })
      });
      if (!response.ok) console.warn('[Logo Archive cleanup]', await response.text());
    } catch (err) {
      console.warn('[Logo Archive cleanup]', err);
    }
  }

  async function signedUrl(path) {
    const cached = signedUrlCache.get(path);
    if (cached && cached.expiresAt > Date.now() + 60000) return cached.url;
    const encodedPath = path.split('/').map(encodeURIComponent).join('/');
    const response = await storageRequest('object/sign/' + BUCKET + '/' + encodedPath, {
      method:'POST',
      headers:{ 'Content-Type':'application/json' },
      body:JSON.stringify({ expiresIn:3600 })
    });
    const data = await parseResponse(response, 'Anteprima non disponibile.');
    const signed = data?.signedURL || data?.signedUrl || '';
    if (!signed) throw new Error('Anteprima non disponibile.');
    const url = /^https?:/i.test(signed) ? signed : SUPABASE_URL + '/storage/v1' + (signed.startsWith('/') ? signed : '/' + signed);
    signedUrlCache.set(path, { url, expiresAt:Date.now() + 3300 * 1000 });
    return url;
  }

  function sanitizeSearch(value) {
    return String(value || '').trim().replace(/[*,()]/g, ' ').replace(/\s+/g, ' ').slice(0,80);
  }

  async function listLogos(term = '') {
    const q = sanitizeSearch(term);
    let path = 'logo_archive?select=id,business_name,storage_path,thumb_path,file_size,uploaded_by_name,created_at&order=created_at.desc&limit=' + SEARCH_LIMIT;
    if (q) path += '&business_name=ilike.' + encodeURIComponent('*' + q + '*');
    const response = await TapNfc.rest(path);
    return await parseResponse(response, 'Impossibile caricare l’archivio.');
  }

  function emptyState(title, text) {
    archiveGrid.innerHTML = '';
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.style.gridColumn = '1 / -1';
    const strong = document.createElement('strong');
    strong.textContent = title;
    const span = document.createElement('span');
    span.textContent = text;
    empty.append(strong, span);
    archiveGrid.appendChild(empty);
  }

  function renderRows(rows) {
    archiveGrid.innerHTML = '';
    const data = Array.isArray(rows) ? rows : [];
    searchCount.textContent = data.length ? (data.length + (data.length === SEARCH_LIMIT ? '+' : '') + ' risultati') : '0 risultati';
    if (!data.length) {
      emptyState(searchInput.value.trim() ? 'Nessun logo trovato' : 'Archivio vuoto', searchInput.value.trim() ? 'Prova con un altro nome.' : 'Carica il primo logo usando il modulo qui sopra.');
      return;
    }
    for (const item of data) {
      const card = document.createElement('article');
      card.className = 'logo-card';
      const thumb = document.createElement('div');
      thumb.className = 'logo-thumb';
      const placeholder = document.createElement('div');
      placeholder.className = 'thumb-placeholder';
      placeholder.textContent = 'Caricamento…';
      thumb.appendChild(placeholder);
      const copy = document.createElement('div');
      copy.className = 'logo-copy';
      const name = document.createElement('div');
      name.className = 'logo-name';
      name.textContent = item.business_name;
      const meta = document.createElement('div');
      meta.className = 'logo-meta';
      const date = item.created_at ? new Date(item.created_at) : null;
      const dateText = date && !Number.isNaN(date.getTime()) ? date.toLocaleDateString('it-IT') : '';
      meta.textContent = 'Caricato da ' + (item.uploaded_by_name || 'Operatore') + (dateText ? ' · ' + dateText : '') + ' · ' + formatBytes(item.file_size);
      const actions = document.createElement('div');
      actions.className = 'logo-actions';
      const renameBtn = document.createElement('button');
      renameBtn.type = 'button';
      renameBtn.className = 'logo-action logo-action-edit';
      renameBtn.textContent = 'Rinomina';
      renameBtn.setAttribute('aria-label', 'Rinomina ' + item.business_name);
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'logo-action logo-action-delete';
      deleteBtn.textContent = 'Elimina';
      deleteBtn.setAttribute('aria-label', 'Elimina ' + item.business_name);
      actions.append(renameBtn, deleteBtn);
      copy.append(name, meta, actions);
      card.append(thumb, copy);

      renameBtn.addEventListener('click', async () => {
        const proposed = window.prompt('Nuovo nome attività:', item.business_name);
        if (proposed === null) return;
        const nextName = proposed.trim().replace(/\s+/g, ' ');
        if (nextName.length < 2) return setStatus('Inserisci un nome attività valido.', 'err');
        if (nextName.length > 120) return setStatus('Il nome è troppo lungo.', 'err');
        renameBtn.disabled = true;
        deleteBtn.disabled = true;
        try {
          const response = await TapNfc.rest('logo_archive?id=eq.' + encodeURIComponent(item.id), {
            method:'PATCH',
            headers:{ Prefer:'return=minimal' },
            body:JSON.stringify({ business_name:nextName })
          });
          await parseResponse(response, 'Rinomina non riuscita.');
          setStatus('Nome aggiornato correttamente.', 'ok');
          await refresh(searchInput.value);
        } catch (err) {
          console.error(err);
          setStatus(err.message || 'Rinomina non riuscita.', 'err');
          renameBtn.disabled = false;
          deleteBtn.disabled = false;
        }
      });

      deleteBtn.addEventListener('click', async () => {
        const confirmed = window.confirm('Eliminare definitivamente "' + item.business_name + '" dall’Archivio Logo?\n\nQuesta operazione non modifica eventuali pagine cliente già create.');
        if (!confirmed) return;
        renameBtn.disabled = true;
        deleteBtn.disabled = true;
        try {
          const response = await TapNfc.rest('logo_archive?id=eq.' + encodeURIComponent(item.id), {
            method:'DELETE',
            headers:{ Prefer:'return=minimal' }
          });
          await parseResponse(response, 'Eliminazione non riuscita.');
          await Promise.all([deleteObject(item.storage_path), deleteObject(item.thumb_path)]);
          signedUrlCache.delete(item.thumb_path);
          signedUrlCache.delete(item.storage_path);
          setStatus('Logo eliminato correttamente dall’archivio.', 'ok');
          await refresh(searchInput.value);
        } catch (err) {
          console.error(err);
          setStatus(err.message || 'Eliminazione non riuscita.', 'err');
          renameBtn.disabled = false;
          deleteBtn.disabled = false;
        }
      });
      archiveGrid.appendChild(card);
      signedUrl(item.thumb_path).then(url => {
        const img = document.createElement('img');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.alt = 'Logo ' + item.business_name;
        img.src = url;
        thumb.replaceChildren(img);
      }).catch(() => { placeholder.textContent = 'Anteprima non disponibile'; });
    }
  }

  async function refresh(term = '') {
    try {
      searchCount.textContent = 'Ricerca…';
      const rows = await listLogos(term);
      renderRows(rows);
    } catch (err) {
      console.error(err);
      searchCount.textContent = '';
      emptyState('Archivio non disponibile', err.message || 'Riprova tra poco.');
    }
  }

  function resetUploadForm() {
    selectedFile = null;
    fileInput.value = '';
    fileName.textContent = 'Nessun file selezionato';
    businessName.value = '';
  }

  async function handleUpload() {
    const name = businessName.value.trim().replace(/\s+/g, ' ');
    if (!name || name.length < 2) return setStatus('Inserisci un nome attività chiaro.', 'err');
    if (!selectedFile) return setStatus('Seleziona prima il file del logo.', 'err');
    if (!ALLOWED_TYPES.has(selectedFile.type)) return setStatus('Formato non supportato. Usa JPG, PNG o WEBP.', 'err');
    if (selectedFile.size > MAX_SOURCE_BYTES) return setStatus('Il file supera 10 MB. Usa un file più leggero.', 'err');

    const op = operatorInfo(user);
    if (!op) return setStatus('Operatore non autorizzato.', 'err');

    uploadBtn.disabled = true;
    filePicker.disabled = true;
    setStatus('Ottimizzo il logo senza appesantire l’app…', 'info');

    let logoPath = '';
    let thumbPath = '';
    try {
      const [logoBlob, thumbBlob] = await Promise.all([
        renderWebp(selectedFile, MAX_LOGO_EDGE, .90),
        renderWebp(selectedFile, MAX_THUMB_EDGE, .84)
      ]);
      const folder = user.id + '/' + safeUuid();
      logoPath = folder + '/logo.webp';
      thumbPath = folder + '/thumb.webp';

      setStatus('Caricamento sicuro in archivio…', 'info');
      await uploadObject(logoPath, logoBlob);
      await uploadObject(thumbPath, thumbBlob);

      const response = await TapNfc.rest('logo_archive', {
        method:'POST',
        headers:{ Prefer:'return=representation' },
        body:JSON.stringify({
          business_name:name,
          storage_path:logoPath,
          thumb_path:thumbPath,
          mime_type:'image/webp',
          file_size:logoBlob.size,
          thumb_size:thumbBlob.size,
          uploaded_by:user.id,
          uploaded_by_email:op.email,
          uploaded_by_name:op.name
        })
      });
      await parseResponse(response, 'Salvataggio archivio non riuscito.');
      resetUploadForm();
      setStatus('Logo salvato correttamente nell’archivio condiviso.', 'ok');
      await refresh(searchInput.value);
    } catch (err) {
      console.error(err);
      if (thumbPath) await deleteObject(thumbPath);
      if (logoPath) await deleteObject(logoPath);
      setStatus(err.message || 'Caricamento non riuscito.', 'err');
    } finally {
      uploadBtn.disabled = false;
      filePicker.disabled = false;
    }
  }

  filePicker.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', () => {
    const file = fileInput.files?.[0] || null;
    setStatus('');
    if (!file) {
      selectedFile = null;
      fileName.textContent = 'Nessun file selezionato';
      return;
    }
    if (!ALLOWED_TYPES.has(file.type)) {
      fileInput.value = '';
      selectedFile = null;
      fileName.textContent = 'Nessun file selezionato';
      return setStatus('Formato non supportato. Usa JPG, PNG o WEBP.', 'err');
    }
    if (file.size > MAX_SOURCE_BYTES) {
      fileInput.value = '';
      selectedFile = null;
      fileName.textContent = 'Nessun file selezionato';
      return setStatus('Il file supera 10 MB.', 'err');
    }
    selectedFile = file;
    fileName.textContent = file.name + ' · ' + formatBytes(file.size);
  });
  uploadBtn.addEventListener('click', handleUpload);
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => refresh(searchInput.value), 240);
  });

  (async function init() {
    try {
      user = await TapNfc.getUser();
      if (!user) return;
      if (!operatorInfo(user)) throw new Error('Operatore non autorizzato.');
      await refresh('');
    } catch (err) {
      console.error(err);
      emptyState('Archivio non disponibile', err.message || 'Riprova tra poco.');
    }
  })();
})();
