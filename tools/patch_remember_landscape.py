from pathlib import Path

# ---------- tap-auth.js ----------
p = Path('tap-auth.js')
text = p.read_text(encoding='utf-8')

old = "  'use strict';\n\n  const SUPABASE_URL"
new = """  'use strict';

  const PAGE_NAME = location.pathname.split('/').pop() || 'index.html';
  document.documentElement.dataset.tapPage = PAGE_NAME;
  if (!document.querySelector('link[data-tap-landscape]')) {
    const responsiveLink = document.createElement('link');
    responsiveLink.rel = 'stylesheet';
    responsiveLink.href = 'landscape.css';
    responsiveLink.dataset.tapLandscape = '1';
    document.head.appendChild(responsiveLink);
  }

  const SUPABASE_URL"""
if old not in text:
    raise SystemExit('Punto inserimento landscape non trovato')
text = text.replace(old, new, 1)

old = """  function loadSession() {
    return safeJson(localStorage.getItem(SESSION_KEY) || 'null');
  }

  function saveSession(data) {
    const session = {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: Date.now() + Math.max(30, Number(data.expires_in || 3600)) * 1000,
      user: data.user || null
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }
"""
new = """  function loadSession() {
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
"""
if old not in text:
    raise SystemExit('Blocco sessione originale non trovato')
text = text.replace(old, new, 1)

old = "async function login(email, password)"
new = "async function login(email, password, remember = false)"
if old not in text:
    raise SystemExit('Firma login non trovata')
text = text.replace(old, new, 1)

old = "    return saveSession(data);\n  }\n\n  async function refreshSession(session)"
new = "    return saveSession(data, Boolean(remember));\n  }\n\n  async function refreshSession(session)"
if old not in text:
    raise SystemExit('Salvataggio login non trovato')
text = text.replace(old, new, 1)

old = "    return saveSession(data);\n  }\n\n  async function getSession()"
new = "    return saveSession(data, session?._storage === 'local', session?._storage || 'session');\n  }\n\n  async function getSession()"
if old not in text:
    raise SystemExit('Salvataggio refresh non trovato')
text = text.replace(old, new, 1)

old = """    session.user = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return user;
"""
new = """    session.user = user;
    persistSession(session, session._storage || 'session');
    return user;
"""
if old not in text:
    raise SystemExit('Persistenza getUser non trovata')
text = text.replace(old, new, 1)

p.write_text(text, encoding='utf-8')

# ---------- login.html ----------
p = Path('login.html')
text = p.read_text(encoding='utf-8')

old = ".message.ok{background:#eaf8f4;border:1px solid #b8e4d8;color:#096450}.foot{text-align:center;color:#6f7c78;font-size:12px;margin-top:18px}"
new = ".message.ok{background:#eaf8f4;border:1px solid #b8e4d8;color:#096450}.remember-row{display:flex;align-items:center;gap:10px;margin:-2px 0 16px;color:#40534d;font-size:14px;font-weight:700;cursor:pointer}.remember-row input{width:20px;height:20px;min-width:20px;margin:0;accent-color:var(--green-600)}.remember-row span{line-height:1.25}.foot{text-align:center;color:#6f7c78;font-size:12px;margin-top:18px}"
if old not in text:
    raise SystemExit('CSS login non trovato')
text = text.replace(old, new, 1)

old = """      <div class=\"field\">
        <label for=\"password\">Password</label>
        <input id=\"password\" type=\"password\" autocomplete=\"current-password\" required placeholder=\"Inserisci la password\">
      </div>
      <button id=\"loginBtn\" class=\"primary\" type=\"submit\">Entra in Tap NFC</button>
"""
new = """      <div class=\"field\">
        <label for=\"password\">Password</label>
        <input id=\"password\" type=\"password\" autocomplete=\"current-password\" required placeholder=\"Inserisci la password\">
      </div>
      <label class=\"remember-row\" for=\"remember\">
        <input id=\"remember\" type=\"checkbox\">
        <span>Resta connesso</span>
      </label>
      <button id=\"loginBtn\" class=\"primary\" type=\"submit\">Entra in Tap NFC</button>
"""
if old not in text:
    raise SystemExit('Punto checkbox non trovato')
text = text.replace(old, new, 1)

old = "const password=document.getElementById('password');\nconst button=document.getElementById('loginBtn');"
new = "const password=document.getElementById('password');\nconst remember=document.getElementById('remember');\nconst button=document.getElementById('loginBtn');"
if old not in text:
    raise SystemExit('Const login non trovate')
text = text.replace(old, new, 1)

old = "await TapNfc.login(operator.value,password.value);"
new = "await TapNfc.login(operator.value,password.value,remember.checked);"
if old not in text:
    raise SystemExit('Chiamata login non trovata')
text = text.replace(old, new, 1)

p.write_text(text, encoding='utf-8')
