(() => {
  'use strict';

  const SUPABASE_URL = 'https://rqzgdgdoulgjwlxtdxhi.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_Hc_FOVPSOkuNC-mz25VknA_5O0fWJ6p';
  const SESSION_KEY = 'tapnfc_supabase_session_v1';
  const BUCKET = 'tapnfc-chat';
  const MAX_FILE_BYTES = 10 * 1024 * 1024;
  const COMPRESS_FROM_BYTES = 1800 * 1024;
  const MAX_IMAGE_EDGE = 1800;
  const ALLOWED_TYPES = new Set(['image/jpeg','image/png','image/webp','image/gif']);

  const messagesHost = document.getElementById('chatMessages');
  const form = document.getElementById('chatForm');
  const messageInput = document.getElementById('messageInput');
  const imageInput = document.getElementById('imageInput');
  const attachBtn = document.getElementById('attachBtn');
  const sendBtn = document.getElementById('sendBtn');
  const errorBox = document.getElementById('chatError');
  const preview = document.getElementById('attachmentPreview');
  const previewImg = document.getElementById('attachmentThumb');
  const previewName = document.getElementById('attachmentName');
  const previewSize = document.getElementById('attachmentSize');
  const removeAttachment = document.getElementById('removeAttachment');
  const peerName = document.getElementById('peerName');
  const peerAvatar = document.getElementById('peerAvatar');
  const peerNote = document.getElementById('peerNote');
  const realtimeState = document.getElementById('realtimeState');
  const realtimeText = document.getElementById('realtimeText');
  const lightbox = document.getElementById('lightbox');
  const lightboxImage = document.getElementById('lightboxImage');
  const lightboxClose = document.getElementById('lightboxClose');

  let user = null;
  let selectedFile = null;
  let selectedPreviewUrl = '';
  let realtimeClient = null;
  let realtimeChannel = null;
  let pollTimer = null;
  let reloadTimer = null;
  let lastSignature = '';
  let firstLoad = true;
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
    if (!session?.access_token) throw new Error('Sessione scaduta.');
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

  function otherOperator(currentUser) {
    const email = String(currentUser?.email || '').toLowerCase();
    return email === 'francesco@tapnfc.local'
      ? { name: 'Gisberto', initials: 'GI', email: 'gisberto@tapnfc.local' }
      : { name: 'Francesco', initials: 'FR', email: 'francesco@tapnfc.local' };
  }

  function showError(message) {
    if (!message) {
      errorBox.textContent = '';
      errorBox.classList.remove('show');
      return;
    }
    errorBox.textContent = message;
    errorBox.classList.add('show');
  }

  function formatBytes(bytes) {
    const n = Number(bytes || 0);
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1).replace('.', ',') + ' KB';
    return (n / (1024 * 1024)).toFixed(1).replace('.', ',') + ' MB';
  }

  function formatTime(value) {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  }

  function dayKey(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return [d.getFullYear(), String(d.getMonth()+1).padStart(2,'0'), String(d.getDate()).padStart(2,'0')].join('-');
  }

  function dayLabel(value) {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (dayKey(d) === dayKey(today)) return 'Oggi';
    if (dayKey(d) === dayKey(yesterday)) return 'Ieri';
    return d.toLocaleDateString('it-IT', { day:'2-digit', month:'long', year:'numeric' });
  }

  function shouldStickToBottom() {
    return messagesHost.scrollHeight - messagesHost.scrollTop - messagesHost.clientHeight < 120;
  }

  function scrollBottom(force = false) {
    if (force || shouldStickToBottom()) {
      requestAnimationFrame(() => { messagesHost.scrollTop = messagesHost.scrollHeight; });
    }
  }

  function createEmpty() {
    const host = document.createElement('div');
    host.className = 'chat-empty';
    const inner = document.createElement('div');
    const icon = document.createElement('div');
    icon.className = 'chat-empty-icon';
    icon.textContent = '💬';
    const strong = document.createElement('strong');
    strong.textContent = 'Iniziate la conversazione';
    const span = document.createElement('span');
    span.textContent = 'Puoi inviare testo, foto e screenshot.';
    inner.append(icon,strong,span);
    host.appendChild(inner);
    return host;
  }

  async function signedImageUrl(path) {
    const cached = signedUrlCache.get(path);
    if (cached && cached.expiresAt > Date.now() + 60000) return cached.url;
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    const response = await storageRequest('object/sign/' + BUCKET + '/' + encoded, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ expiresIn: 7200 })
    });
    const data = await parseResponse(response, 'Impossibile aprire l’immagine.');
    const signed = data?.signedURL || data?.signedUrl || '';
    if (!signed) throw new Error('URL immagine non disponibile.');
    const url = /^https?:/i.test(signed) ? signed : SUPABASE_URL + '/storage/v1' + (signed.startsWith('/') ? signed : '/' + signed);
    signedUrlCache.set(path, { url, expiresAt: Date.now() + 7000 * 1000 });
    return url;
  }

  function openLightbox(src) {
    if (!src) return;
    lightboxImage.src = src;
    lightbox.classList.add('show');
    document.body.style.overflow = 'hidden';
  }

  function closeLightbox() {
    lightbox.classList.remove('show');
    lightboxImage.removeAttribute('src');
    document.body.style.overflow = '';
  }

  function renderMessages(rows, forceBottom = false) {
    const wasBottom = shouldStickToBottom();
    messagesHost.innerHTML = '';
    if (!rows.length) {
      messagesHost.appendChild(createEmpty());
      return;
    }

    let lastDay = '';
    for (const msg of rows) {
      const currentDay = dayKey(msg.created_at);
      if (currentDay !== lastDay) {
        const separator = document.createElement('div');
        separator.className = 'chat-day';
        const span = document.createElement('span');
        span.textContent = dayLabel(msg.created_at);
        separator.appendChild(span);
        messagesHost.appendChild(separator);
        lastDay = currentDay;
      }

      const mine = msg.sender_id === user.id;
      const row = document.createElement('div');
      row.className = 'message-row ' + (mine ? 'mine' : 'theirs');
      row.dataset.messageId = msg.id;
      const bubble = document.createElement('div');
      bubble.className = 'message-bubble';

      const author = document.createElement('div');
      author.className = 'message-author';
      author.textContent = mine ? 'Tu' : (msg.sender_name || 'Operatore');
      bubble.appendChild(author);

      if (msg.image_path) {
        const imageWrap = document.createElement('div');
        imageWrap.className = 'message-image-wrap';
        const loading = document.createElement('div');
        loading.className = 'image-loading';
        loading.textContent = 'Caricamento immagine…';
        imageWrap.appendChild(loading);
        bubble.appendChild(imageWrap);
        signedImageUrl(msg.image_path).then(url => {
          const img = document.createElement('img');
          img.className = 'message-image';
          img.loading = 'lazy';
          img.alt = msg.image_name ? 'Immagine: ' + msg.image_name : 'Immagine condivisa';
          img.src = url;
          img.addEventListener('click', () => openLightbox(url));
          imageWrap.replaceChildren(img);
        }).catch(() => {
          loading.textContent = 'Immagine non disponibile';
        });
      }

      if (msg.message_text) {
        const text = document.createElement('div');
        text.className = 'message-text';
        text.textContent = msg.message_text;
        bubble.appendChild(text);
      }

      const meta = document.createElement('div');
      meta.className = 'message-meta';
      const time = document.createElement('span');
      time.textContent = formatTime(msg.created_at);
      meta.appendChild(time);
      if (mine) {
        const read = document.createElement('span');
        read.className = 'read-state' + (msg.read_at ? ' read' : '');
        read.textContent = msg.read_at ? '✓✓ Letto' : '✓ Inviato';
        meta.appendChild(read);
      }
      bubble.appendChild(meta);
      row.appendChild(bubble);
      messagesHost.appendChild(row);
    }

    if (forceBottom || firstLoad || wasBottom) scrollBottom(true);
    firstLoad = false;
  }

  function signature(rows) {
    if (!rows.length) return '0';
    const last = rows[rows.length - 1];
    const readCount = rows.reduce((sum,m) => sum + (m.read_at ? 1 : 0), 0);
    return rows.length + '|' + last.id + '|' + String(last.read_at || '') + '|' + readCount;
  }

  async function listMessages() {
    const response = await TapNfc.rest('chat_messages?select=*&order=created_at.desc&limit=250');
    const data = await parseResponse(response, 'Impossibile caricare la chat.');
    return (Array.isArray(data) ? data : []).reverse();
  }

  async function markIncomingRead() {
    if (!user || document.visibilityState === 'hidden') return;
    const email = encodeURIComponent(String(user.email || '').toLowerCase());
    const response = await TapNfc.rest('chat_messages?recipient_email=eq.' + email + '&read_at=is.null', {
      method: 'PATCH',
      headers: { Prefer:'return=minimal' },
      body: JSON.stringify({ read_at: new Date().toISOString() })
    });
    if (!response.ok) await parseResponse(response, 'Impossibile aggiornare lo stato di lettura.');
    if (typeof TapNfc.refreshChatBadge === 'function') TapNfc.refreshChatBadge(user).catch(() => {});
  }

  async function loadMessages({forceBottom=false, markRead=true} = {}) {
    try {
      const rows = await listMessages();
      const sig = signature(rows);
      if (sig !== lastSignature || firstLoad) {
        renderMessages(rows, forceBottom);
        lastSignature = sig;
      }
      if (markRead && rows.some(m => m.recipient_email === String(user.email).toLowerCase() && !m.read_at)) {
        await markIncomingRead();
      }
      showError('');
    } catch (err) {
      console.error(err);
      showError(err.message || 'Impossibile aggiornare la chat.');
    }
  }

  function clearAttachment() {
    selectedFile = null;
    imageInput.value = '';
    preview.hidden = true;
    previewImg.removeAttribute('src');
    previewName.textContent = '';
    previewSize.textContent = '';
    if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
    selectedPreviewUrl = '';
  }

  function chooseAttachment(file) {
    showError('');
    if (!file) return clearAttachment();
    if (!ALLOWED_TYPES.has(file.type)) {
      clearAttachment();
      return showError('Formato non supportato. Usa JPG, PNG, WEBP o GIF.');
    }
    if (file.size > MAX_FILE_BYTES) {
      clearAttachment();
      return showError('L’immagine supera il limite di 10 MB.');
    }
    selectedFile = file;
    if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
    selectedPreviewUrl = URL.createObjectURL(file);
    previewImg.src = selectedPreviewUrl;
    previewName.textContent = file.name || 'Immagine';
    previewSize.textContent = formatBytes(file.size) + (file.size > COMPRESS_FROM_BYTES && file.type !== 'image/gif' ? ' · verrà ottimizzata' : '');
    preview.hidden = false;
  }

  async function loadImage(file) {
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await new Promise((resolve,reject) => { img.onload=resolve; img.onerror=reject; });
      return img;
    } finally {
      // URL revocato dal chiamante dopo il draw, perché alcuni WebView lo usano fino al canvas.
    }
  }

  async function optimizedImage(file) {
    if (file.size <= COMPRESS_FROM_BYTES || file.type === 'image/gif') {
      return { blob:file, type:file.type, extension:(file.name.split('.').pop() || 'jpg').toLowerCase() };
    }

    const objectUrl = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = objectUrl;
      await new Promise((resolve,reject) => { img.onload=resolve; img.onerror=reject; });
      const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
      const width = Math.max(1, Math.round((img.naturalWidth || img.width) * scale));
      const height = Math.max(1, Math.round((img.naturalHeight || img.height) * scale));
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d', { alpha:false });
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0,0,width,height);
      ctx.drawImage(img,0,0,width,height);
      const blob = await new Promise(resolve => canvas.toBlob(resolve,'image/webp',0.90));
      if (blob && blob.size < file.size) return { blob, type:'image/webp', extension:'webp' };
      return { blob:file, type:file.type, extension:(file.name.split('.').pop() || 'jpg').toLowerCase() };
    } catch {
      return { blob:file, type:file.type, extension:(file.name.split('.').pop() || 'jpg').toLowerCase() };
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  function cleanFileName(name) {
    return String(name || 'immagine').replace(/[^a-zA-Z0-9._-]+/g,'-').replace(/-+/g,'-').slice(0,80) || 'immagine';
  }

  async function uploadImage(file) {
    const optimized = await optimizedImage(file);
    if (optimized.blob.size > MAX_FILE_BYTES) throw new Error('L’immagine resta troppo grande dopo l’ottimizzazione.');
    const now = new Date();
    const random = (crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2) + Date.now());
    const path = user.id + '/' + now.getFullYear() + '/' + String(now.getMonth()+1).padStart(2,'0') + '/' + random + '.' + optimized.extension;
    const encoded = path.split('/').map(encodeURIComponent).join('/');
    const response = await storageRequest('object/' + BUCKET + '/' + encoded, {
      method: 'POST',
      headers: { 'Content-Type':optimized.type, 'x-upsert':'false' },
      body: optimized.blob
    });
    await parseResponse(response, 'Caricamento immagine non riuscito.');
    return {
      image_path:path,
      image_name:cleanFileName(file.name),
      image_type:optimized.type,
      image_size:optimized.blob.size
    };
  }

  async function sendMessage(text, file) {
    const payload = {};
    if (text) payload.message_text = text;
    if (file) Object.assign(payload, await uploadImage(file));
    const response = await TapNfc.rest('chat_messages', {
      method:'POST',
      headers:{ Prefer:'return=representation' },
      body:JSON.stringify(payload)
    });
    return parseResponse(response, 'Invio messaggio non riuscito.');
  }

  function setSending(sending) {
    sendBtn.disabled = sending;
    attachBtn.disabled = sending;
    messageInput.disabled = sending;
    sendBtn.textContent = sending ? 'Invio…' : 'Invia';
  }

  function scheduleReload(forceBottom = false) {
    clearTimeout(reloadTimer);
    reloadTimer = setTimeout(() => loadMessages({ forceBottom, markRead:true }), 120);
  }

  function startPolling(ms) {
    clearInterval(pollTimer);
    pollTimer = setInterval(() => {
      if (document.visibilityState !== 'hidden') loadMessages({ markRead:true });
    }, ms);
  }

  async function startRealtime() {
    const session = storedSession();
    if (!window.supabase?.createClient || !session?.access_token) {
      realtimeText.textContent = 'Auto';
      startPolling(3500);
      return;
    }
    try {
      realtimeClient = window.supabase.createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
        auth:{ persistSession:false, autoRefreshToken:false, detectSessionInUrl:false }
      });
      realtimeClient.realtime.setAuth(session.access_token);
      realtimeChannel = realtimeClient.channel('tapnfc-operator-chat-' + user.id)
        .on('postgres_changes',{ event:'INSERT', schema:'public', table:'chat_messages' },() => scheduleReload(true))
        .on('postgres_changes',{ event:'UPDATE', schema:'public', table:'chat_messages' },() => scheduleReload(false))
        .subscribe(status => {
          if (status === 'SUBSCRIBED') {
            realtimeState.classList.add('live');
            realtimeText.textContent = 'Live';
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
            realtimeState.classList.remove('live');
            realtimeText.textContent = 'Auto';
          }
        });
      startPolling(30000);
    } catch (err) {
      console.warn('Realtime non disponibile, uso aggiornamento automatico.', err);
      realtimeText.textContent = 'Auto';
      startPolling(3500);
    }
  }

  async function init() {
    user = await TapNfc.getUser();
    if (!user) return;

    const peer = otherOperator(user);
    peerName.textContent = peer.name;
    peerAvatar.textContent = peer.initials;
    peerNote.textContent = 'Chat privata con ' + peer.name;

    attachBtn.addEventListener('click', () => imageInput.click());
    imageInput.addEventListener('change', () => chooseAttachment(imageInput.files?.[0] || null));
    removeAttachment.addEventListener('click', clearAttachment);

    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = Math.min(120, messageInput.scrollHeight) + 'px';
    });
    messageInput.addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault();
        form.requestSubmit();
      }
    });

    form.addEventListener('submit', async event => {
      event.preventDefault();
      const text = messageInput.value.trim();
      const file = selectedFile;
      if (!text && !file) return;
      setSending(true);
      showError('');
      try {
        await sendMessage(text,file);
        messageInput.value = '';
        messageInput.style.height = 'auto';
        clearAttachment();
        await loadMessages({ forceBottom:true, markRead:true });
      } catch (err) {
        console.error(err);
        showError(err.message || 'Invio non riuscito.');
      } finally {
        setSending(false);
        messageInput.focus();
      }
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightbox.addEventListener('click', event => { if (event.target === lightbox) closeLightbox(); });
    document.addEventListener('keydown', event => { if (event.key === 'Escape') closeLightbox(); });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') scheduleReload(false);
    });

    await loadMessages({ forceBottom:true, markRead:true });
    await startRealtime();
  }

  window.addEventListener('beforeunload', () => {
    clearInterval(pollTimer);
    clearTimeout(reloadTimer);
    if (realtimeClient && realtimeChannel) realtimeClient.removeChannel(realtimeChannel).catch(() => {});
    if (selectedPreviewUrl) URL.revokeObjectURL(selectedPreviewUrl);
  });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
