(() => {
  'use strict';

  const PAGE_NAME = location.pathname.split('/').pop() || 'index.html';
  document.documentElement.dataset.tapPage = PAGE_NAME;
  if (!document.querySelector('link[data-tap-landscape]')) {
    const responsiveLink = document.createElement('link');
    responsiveLink.rel = 'stylesheet';
    responsiveLink.href = 'landscape.css';
    responsiveLink.dataset.tapLandscape = '1';
    document.head.appendChild(responsiveLink);
  }

  if (PAGE_NAME !== 'login.html' && !document.querySelector('link[data-tap-chat-nav]')) {
    const chatNavLink = document.createElement('link');
    chatNavLink.rel = 'stylesheet';
    chatNavLink.href = 'chat-nav.css?v=1';
    chatNavLink.dataset.tapChatNav = '1';
    document.head.appendChild(chatNavLink);
  }

  const SUPABASE_URL = 'https://rqzgdgdoulgjwlxtdxhi.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_Hc_FOVPSOkuNC-mz25VknA_5O0fWJ6p';
  const SESSION_KEY = 'tapnfc_supabase_session_v1';
  const LOCAL_CLIENTS_KEY = 'tapreputa_clienti_v1';
  const MIGRATION_KEY = 'tapnfc_local_migration_v1';

  const OPERATORS = Object.freeze({
    'francesco@tapnfc.local': 'Francesco',
    'gisberto@tapnfc.local': 'Gisberto'
  });

  function safeJson(text) {
    try { return JSON.parse(text); } catch { return null; }
  }

  function loadSession() {
    const temporary = safeJson(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (temporary?.access_token) return { ...temporary, _storage: 'session' };
    const persistent = safeJson(localStorage.getItem(SESSION_KEY) || 'null');
    if (persistent?.access_token) return { ...persistent, _storage: 'local' };
    return null;
  }

  function persistSession(session, storageName) {
    const targetName = storageName === 'local' ? 'local' : 'session';
    const target = targetName === 'local' ? localStorage : sessionStorage;
    const other = targetName === 'local' ? sessionStorage : localStorage;
    const clean = { ...session };
    delete clean._storage;
    target.setItem(SESSION_KEY, JSON.stringify(clean));
    other.removeItem(SESSION_KEY);
  }

  function saveSession(data, remember = false, storageName = '') {
    const targetName = storageName || (remember ? 'local' : 'session');
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + Math.max(30, Number(data.expires_in || 3600)) * 1000,
      user: data.user || null
    };
    persistSession(session, targetName);
    return { ...session, _storage: targetName };
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_KEY);
  }

  async function authFetch(path, options = {}) {
    const headers = new Headers(options.headers || {});
    headers.set('apikey', PUBLISHABLE_KEY);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return fetch(SUPABASE_URL + path, { ...options, headers });
  }

  async function login(email, password, remember = false) {
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!OPERATORS[normalizedEmail]) throw new Error('Operatore non autorizzato.');

    const response = await authFetch('/auth/v1/token?grant_type=password', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail, password: String(password || '') })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) {
      throw new Error(data.error_description || data.msg || data.message || 'Credenziali non corrette.');
    }
    return saveSession(data, Boolean(remember));
  }

  async function refreshSession(session) {
    if (!session?.refresh_token) return null;
    const response = await authFetch('/auth/v1/token?grant_type=refresh_token', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: session.refresh_token })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) {
      clearSession();
      return null;
    }
    return saveSession(data, session?._storage === 'local', session?._storage || 'session');
  }

  async function getSession() {
    let session = loadSession();
    if (!session?.access_token) return null;
    if (!session.expires_at || session.expires_at - Date.now() < 90000) {
      session = await refreshSession(session);
    }
    return session;
  }

  async function getUser() {
    const session = await getSession();
    if (!session) return null;
    const response = await authFetch('/auth/v1/user', {
      headers: { Authorization: 'Bearer ' + session.access_token }
    });
    const user = await response.json().catch(() => null);
    if (!response.ok || !user?.email) {
      clearSession();
      return null;
    }
    const email = String(user.email).toLowerCase();
    if (!OPERATORS[email]) {
      clearSession();
      return null;
    }
    session.user = user;
    persistSession(session, session._storage || 'session');
    return user;
  }

  function operatorName(user) {
    return OPERATORS[String(user?.email || '').toLowerCase()] || '';
  }

  function loginUrl() {
    const page = location.pathname.split('/').pop() || 'index.html';
    const target = page + location.search + location.hash;
    return 'login.html?next=' + encodeURIComponent(target);
  }

  async function requireAuth() {
    const user = await getUser();
    if (!user) {
      location.replace(loginUrl());
      return null;
    }
    return user;
  }

  async function logout() {
    const session = loadSession();
    try {
      if (session?.access_token) {
        await authFetch('/auth/v1/logout', {
          method: 'POST',
          headers: { Authorization: 'Bearer ' + session.access_token }
        });
      }
    } catch {}
    clearSession();
    location.replace('login.html');
  }

  async function rest(path, options = {}) {
    let session = await getSession();
    if (!session) {
      location.replace(loginUrl());
      throw new Error('Sessione scaduta.');
    }

    const headers = new Headers(options.headers || {});
    headers.set('apikey', PUBLISHABLE_KEY);
    headers.set('Authorization', 'Bearer ' + session.access_token);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

    let response = await fetch(SUPABASE_URL + '/rest/v1/' + path, { ...options, headers });
    if (response.status === 401) {
      session = await refreshSession(session);
      if (!session) throw new Error('Sessione scaduta.');
      headers.set('Authorization', 'Bearer ' + session.access_token);
      response = await fetch(SUPABASE_URL + '/rest/v1/' + path, { ...options, headers });
    }
    return response;
  }

  async function responseData(response) {
    const text = await response.text();
    const data = text ? safeJson(text) : null;
    if (!response.ok) {
      const message = data?.message || data?.hint || data?.details || 'Operazione database non riuscita.';
      throw new Error(message);
    }
    return data;
  }

  async function listClients() {
    const r = await rest('clienti?select=*&order=client_no.asc');
    return (await responseData(r)) || [];
  }

  async function findExistingClient(nome, linkNfc) {
    if (linkNfc) {
      const r1 = await rest('clienti?select=*&link_nfc=eq.' + encodeURIComponent(linkNfc) + '&limit=1');
      const a1 = (await responseData(r1)) || [];
      if (a1[0]) return a1[0];
    }
    if (nome) {
      const r2 = await rest('clienti?select=*&nome=eq.' + encodeURIComponent(nome) + '&limit=1');
      const a2 = (await responseData(r2)) || [];
      if (a2[0]) return a2[0];
    }
    return null;
  }

  async function createClient(payload) {
    const r = await rest('clienti', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(payload)
    });
    const data = await responseData(r);
    return Array.isArray(data) ? data[0] : data;
  }

  async function updateClient(uuid, patch) {
    const r = await rest('clienti?id=eq.' + encodeURIComponent(uuid), {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify(patch)
    });
    const data = await responseData(r);
    return Array.isArray(data) ? data[0] : data;
  }

  async function deleteClient(uuid) {
    const r = await rest('clienti?id=eq.' + encodeURIComponent(uuid), { method: 'DELETE' });
    await responseData(r);
  }

  async function upsertBusinessClient(values, user, options = {}) {
    const currentName = operatorName(user);
    if (!currentName) throw new Error('Operatore non autorizzato.');
    const existing = await findExistingClient(values.nome, values.link_nfc);

    const common = {
      nome: values.nome,
      categoria: values.categoria || null,
      categoria_codice: values.categoria_codice || null,
      place_id: values.place_id || null,
      link_recensioni: values.link_recensioni || null,
      link_nfc: values.link_nfc || null,
      updated_by: user.id
    };

    if (existing) {
      return updateClient(existing.id, common);
    }

    const importedOperator = options.importedOperator;
    const creatorName = importedOperator === 'Francesco' || importedOperator === 'Gisberto'
      ? importedOperator
      : currentName;

    return createClient({
      ...common,
      operatore: creatorName,
      stato: values.stato || 'Da consegnare',
      targhe: Number.isFinite(Number(values.targhe)) ? Math.max(0, Math.floor(Number(values.targhe))) : 0,
      carte: Number.isFinite(Number(values.carte)) ? Math.max(0, Math.floor(Number(values.carte))) : 0,
      adesivi: Number.isFinite(Number(values.adesivi)) ? Math.max(0, Math.floor(Number(values.adesivi))) : 0,
      spesa: Number.isFinite(Number(values.spesa)) ? Math.max(0, Number(values.spesa)) : 0,
      created_by: user.id,
      updated_by: user.id
    });
  }

  async function migrateLocalClients(user) {
    if (localStorage.getItem(MIGRATION_KEY) === 'done') return { migrated: 0 };
    const local = safeJson(localStorage.getItem(LOCAL_CLIENTS_KEY) || '[]');
    if (!Array.isArray(local) || !local.length) {
      localStorage.setItem(MIGRATION_KEY, 'done');
      return { migrated: 0 };
    }

    let migrated = 0;
    for (const c of local) {
      if (!c || !c.nome) continue;
      await upsertBusinessClient({
        nome: String(c.nome),
        categoria: c.categoria || null,
        categoria_codice: c.categoriaCodice || null,
        place_id: c.placeId || null,
        link_recensioni: c.linkRecensioni || null,
        link_nfc: c.linkNfc || null,
        stato: c.stato || 'Da consegnare',
        targhe: c.targhe,
        carte: c.carte,
        adesivi: c.adesivi,
        spesa: c.spesa
      }, user, { importedOperator: c.operatore });
      migrated++;
    }
    localStorage.setItem(MIGRATION_KEY, 'done');
    return { migrated };
  }

  async function getUnreadChatCount(user) {
    const email = String(user?.email || '').toLowerCase();
    if (!email || !OPERATORS[email]) return 0;
    const response = await rest('chat_messages?select=id&recipient_email=eq.' + encodeURIComponent(email) + '&read_at=is.null&limit=100');
    if (!response.ok) return 0;
    const rows = await response.json().catch(() => []);
    return Array.isArray(rows) ? rows.length : 0;
  }

  async function refreshChatBadge(user = window.__tapChatUser) {
    const badge = document.querySelector('.chat-badge');
    if (!badge || !user) return 0;
    try {
      const count = await getUnreadChatCount(user);
      badge.textContent = count > 99 ? '99+' : String(count);
      badge.hidden = count < 1;
      const link = badge.closest('.chat-top');
      if (link) link.setAttribute('aria-label', count ? 'Chat, ' + count + ' messaggi non letti' : 'Chat');
      return count;
    } catch {
      badge.hidden = true;
      return 0;
    }
  }

  function installChatNav(user) {
    if (!user || PAGE_NAME === 'login.html') return;
    window.__tapChatUser = user;
    const topActions = document.querySelector('.top-actions');
    if (!topActions) return;

    let link = topActions.querySelector('.chat-top');
    if (!link) {
      link = document.createElement('a');
      link.className = 'chat-top';
      link.href = 'chat.html';
      link.innerHTML = '<span class="chat-top-icon" aria-hidden="true">💬</span><span class="chat-top-label">Chat</span><span class="chat-badge" hidden>0</span>';
      link.setAttribute('aria-label','Chat');
      if (PAGE_NAME === 'chat.html') link.setAttribute('aria-current','page');
      const logoutButton = topActions.querySelector('[data-logout]');
      if (logoutButton) topActions.insertBefore(link, logoutButton);
      else topActions.appendChild(link);
    }

    refreshChatBadge(user).catch(() => {});
    if (!window.__tapChatBadgeTimer) {
      window.__tapChatBadgeTimer = setInterval(() => {
        if (document.visibilityState !== 'hidden') refreshChatBadge().catch(() => {});
      }, 20000);
    }
    if (!window.__tapChatVisibilityBound) {
      window.__tapChatVisibilityBound = true;
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') refreshChatBadge().catch(() => {});
      });
    }
  }

  function decoratePage(user) {
    const name = operatorName(user);
    document.body.dataset.tapOperator = name || '';
    installChatNav(user);
    const operatorHost = document.querySelector('main');
    if (operatorHost) operatorHost.dataset.tapOperator = name || '';
    document.querySelectorAll('[data-operator-name], .user-pill').forEach(el => {
      el.textContent = name || 'Operatore';
    });

    const select = document.getElementById('operatorSelect');
    if (select && name) {
      select.value = name;
      select.disabled = true;
      select.setAttribute('aria-disabled', 'true');
      const field = select.closest('.field');
      if (field && !field.querySelector('.auth-operator-note')) {
        const note = document.createElement('div');
        note.className = 'hint auth-operator-note';
        note.textContent = 'Operatore collegato automaticamente dal login.';
        field.appendChild(note);
      }
    }

    document.querySelectorAll('[data-logout]').forEach(btn => {
      btn.addEventListener('click', logout);
    });

    const pill = document.querySelector('.user-pill');
    if (pill && !document.querySelector('[data-logout]')) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.logout = '1';
      button.textContent = 'Esci';
      button.style.cssText = 'border:1px solid rgba(255,255,255,.25);background:transparent;color:#fff;border-radius:999px;padding:11px 14px;font:inherit;font-size:13px;font-weight:800;cursor:pointer';
      pill.insertAdjacentElement('afterend', button);
      button.addEventListener('click', logout);
    }
  }

  async function handlePersonalizzaAddClient(event, user) {
    event.preventDefault();
    event.stopImmediatePropagation();

    const button = event.currentTarget;
    const msg = document.getElementById('msg');
    const incoming = new URLSearchParams(location.search);
    const businessName = (incoming.get('business') || '').trim();
    const placeId = (incoming.get('placeid') || '').trim();
    const reviewUrl = (document.getElementById('destinationUrl')?.value || '').trim();
    const activity = document.getElementById('activityType');
    const finalNfcUrl = (document.getElementById('finalLinkValue')?.textContent || '').trim();
    const categoryCode = activity?.value || '';
    const categoryText = activity?.selectedIndex >= 0 ? activity.options[activity.selectedIndex]?.text : '';

    function warn(text) {
      if (!msg) return;
      msg.className = 'message show warn';
      msg.textContent = text;
    }

    if (!businessName) return warn('Nome attività non disponibile.');
    if (!reviewUrl) return warn('Link recensioni non disponibile.');
    if (!finalNfcUrl) return warn('Genera prima il link finale.');
    if (!categoryCode) return warn('Seleziona la tipologia di attività.');

    button.disabled = true;
    button.textContent = 'Salvataggio...';
    try {
      await upsertBusinessClient({
        nome: businessName,
        categoria: categoryText,
        categoria_codice: categoryCode,
        place_id: placeId,
        link_recensioni: reviewUrl,
        link_nfc: finalNfcUrl,
        stato: 'Da consegnare'
      }, user);
      button.textContent = 'Cliente salvato ✓';
      if (msg) {
        msg.className = 'message show ok';
        msg.textContent = 'Cliente salvato nel database condiviso. Francesco e Gisberto lo vedono entrambi.';
      }
    } catch (err) {
      console.error(err);
      button.disabled = false;
      button.textContent = '+ Aggiungi cliente';
      warn('Errore durante il salvataggio condiviso: ' + (err.message || 'riprova.'));
    }
  }

  function installPersonalizzaBridge(user) {
    const button = document.getElementById('addClientBtn');
    if (!button || button.dataset.sharedDbBound === '1') return;
    button.dataset.sharedDbBound = '1';
    button.addEventListener('click', event => handlePersonalizzaAddClient(event, user), true);
  }

  function loadVeterinarioSupport() {
    if (PAGE_NAME !== 'personalizza.html' || document.querySelector('script[data-tap-veterinario]')) return;
    const script = document.createElement('script');
    script.src = 'tap-veterinario.js?v=1';
    script.dataset.tapVeterinario = '1';
    document.body.appendChild(script);
  }

  function loadPageTools() {
    const modules = {
      'index.html': 'tap-index-tools.js',
      'clienti.html': 'tap-clienti-tools.js'
    };
    const src = modules[PAGE_NAME];
    if (!src || document.querySelector(`script[data-tap-page-tools="${src}"]`)) return;
    const script = document.createElement('script');
    script.src = src + '?v=1';
    script.dataset.tapPageTools = src;
    document.body.appendChild(script);
  }

  async function autoProtect() {
    const body = document.body;
    if (!body || body.dataset.auth !== 'required') return;
    const user = await requireAuth();
    if (!user) return;
    decoratePage(user);
    try { await migrateLocalClients(user); } catch (err) { console.warn('Migrazione locale non completata:', err); }
    if ((location.pathname.split('/').pop() || '') === 'personalizza.html') {
      installPersonalizzaBridge(user);
      loadVeterinarioSupport();
    }
  }

  window.TapNfc = {
    login, logout, getUser, requireAuth, operatorName, decoratePage,
    listClients, createClient, updateClient, deleteClient, upsertBusinessClient,
    migrateLocalClients, rest, refreshChatBadge
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', autoProtect);
    document.addEventListener('DOMContentLoaded', loadPageTools);
  } else {
    autoProtect();
    loadPageTools();
  }
})();