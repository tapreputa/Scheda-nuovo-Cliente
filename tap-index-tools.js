(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || 'index.html') !== 'index.html') return;

  const params = new URLSearchParams(location.search);
  const duplicateCategory = (params.get('duplicateCategory') || '').trim();
  const duplicateFrom = (params.get('duplicateFrom') || '').trim();
  const business = document.getElementById('business');
  const placeid = document.getElementById('placeid');
  const continueBtn = document.getElementById('continueBtn');
  const msg = document.getElementById('msg');
  const card = document.querySelector('.form-card') || document.querySelector('.card');
  if (!business || !placeid || !continueBtn || !card) return;

  const SUPABASE_URL = 'https://rqzgdgdoulgjwlxtdxhi.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_Hc_FOVPSOkuNC-mz25VknA_5O0fWJ6p';
  const SESSION_KEY = 'tapnfc_supabase_session_v1';
  const FUNCTION_NAME = 'google-places-autocomplete';

  function showMessage(text, type = 'warn') {
    if (!msg) return;
    msg.className = 'message show ' + type;
    msg.textContent = text;
  }

  function normalizePlaceIdInput(value) {
    let current = String(value || '').trim();
    for (let i = 0; i < 5; i++) {
      const match = current.match(/[?&]placeid=([^&#]+)/i);
      if (!match) break;
      let next = match[1];
      try { next = decodeURIComponent(next); } catch {}
      next = next.trim();
      if (!next || next === current) break;
      current = next;
    }
    return current;
  }

  function getSession() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const parsed = JSON.parse(storage.getItem(SESSION_KEY) || 'null');
        if (parsed?.access_token) return parsed;
      } catch {}
    }
    return null;
  }

  function installStyles() {
    if (document.getElementById('tapPlacesAutocompleteStyle')) return;
    const style = document.createElement('style');
    style.id = 'tapPlacesAutocompleteStyle';
    style.textContent = `
      .tap-places-box{grid-column:1/-1;margin-bottom:3px;padding:16px;border:1px solid #cfe0f3;border-radius:18px;background:linear-gradient(145deg,#f8fbff,#f2f7ff)}
      .tap-places-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px}
      .tap-places-title{font-size:12px;font-weight:950;color:#173d70;letter-spacing:.02em}
      .tap-places-badge{padding:6px 9px;border-radius:999px;background:#e9f2ff;color:#145fc4;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}
      .tap-places-input{width:100%;height:54px;border:1.5px solid #cbd9ea;border-radius:14px;background:#fff;padding:0 14px;font:inherit;font-size:14px;color:#11243f;outline:none}
      .tap-places-input:focus{border-color:#1769ff;box-shadow:0 0 0 4px rgba(23,105,255,.10)}
      .tap-places-results{display:none;margin-top:8px;border:1px solid #d7e2ef;border-radius:14px;background:#fff;overflow:hidden;box-shadow:0 14px 34px rgba(20,42,74,.13)}
      .tap-places-results.open{display:block}
      .tap-place-option{width:100%;border:0;border-bottom:1px solid #edf1f6;background:#fff;text-align:left;padding:12px 13px;cursor:pointer;color:#17324f}
      .tap-place-option:last-child{border-bottom:0}
      .tap-place-option:active{background:#f1f6ff}
      .tap-place-main{display:block;font-size:12px;font-weight:900;color:#123a68}
      .tap-place-secondary{display:block;margin-top:3px;font-size:10px;color:#7d8a9b;line-height:1.35}
      .tap-places-help{margin-top:8px;color:#75859a;font-size:10px;line-height:1.35}
      .tap-places-state{display:flex;align-items:center;gap:8px;margin-top:10px;padding:9px 11px;border-radius:12px;background:#fff;border:1px solid #d9e5f3;color:#687991;font-size:10px;font-weight:800}
      .tap-places-state.ok{border-color:#b9e4d9;background:#effaf7;color:#08705d}
      .tap-places-state.warn{border-color:#efd79e;background:#fff9eb;color:#7b5a11}
      .tap-manual-wrap{grid-column:1/-1;border-top:1px dashed #d6e0ec;margin-top:3px;padding-top:12px}
      .tap-manual-toggle{appearance:none;border:0;background:transparent;color:#61758f;font:inherit;font-size:10px;font-weight:900;padding:3px 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
      .tap-manual-fields{display:none;margin-top:12px}.tap-manual-fields.open{display:block}
      .tap-duplicate-note{grid-column:1/-1;margin:0 0 14px;padding:13px 14px;border:1px solid #c9d9f2;border-radius:15px;background:linear-gradient(145deg,#f3f7ff,#fbfcff);color:#17385f}
      .tap-duplicate-note strong{display:block;margin-bottom:4px;font-size:12px;color:#174b9d}.tap-duplicate-note span{display:block;font-size:10px;line-height:1.45;color:#68758a}
      @media(max-width:820px){.tap-places-box{padding:14px;border-radius:16px}.tap-places-head{align-items:flex-start}.tap-places-title{font-size:11px}}
    `;
    document.head.appendChild(style);
  }

  function installDuplicateNote() {
    if (!duplicateCategory || card.querySelector('.tap-duplicate-note')) return;
    const grid = card.querySelector('.field-grid') || card;
    const note = document.createElement('div');
    note.className = 'tap-duplicate-note';
    note.innerHTML = '<strong>Nuovo cliente simile</strong><span>La categoria del cliente precedente verrà riutilizzata automaticamente. Cerca e seleziona soltanto la nuova attività.</span>';
    grid.insertAdjacentElement('afterbegin', note);
    if (duplicateFrom) business.placeholder = 'Nuova attività simile a ' + duplicateFrom;
  }

  function installManualFallback() {
    const grid = card.querySelector('.field-grid');
    const businessField = business.closest('.field');
    const placeField = placeid.closest('.field');
    const finderField = card.querySelector('.place-finder-btn')?.closest('.field');
    if (!grid || !businessField || !placeField || card.querySelector('.tap-manual-wrap')) return;
    const manual = document.createElement('div');
    manual.className = 'tap-manual-wrap';
    manual.innerHTML = '<button class="tap-manual-toggle" type="button">Inserimento manuale / Place ID</button><div class="tap-manual-fields"></div>';
    grid.appendChild(manual);
    const fields = manual.querySelector('.tap-manual-fields');
    fields.appendChild(businessField);
    fields.appendChild(placeField);
    finderField?.remove();
    manual.querySelector('.tap-manual-toggle').addEventListener('click', () => fields.classList.toggle('open'));
  }

  function addAutocompleteShell() {
    const grid = card.querySelector('.field-grid');
    if (!grid || grid.querySelector('.tap-places-box')) return;
    const box = document.createElement('div');
    box.className = 'tap-places-box';
    box.innerHTML = `
      <div class="tap-places-head"><div class="tap-places-title">Cerca attività su Google</div><div class="tap-places-badge">Automatico</div></div>
      <input id="tapPlacesInput" class="tap-places-input" type="search" autocomplete="off" placeholder="Es. Maxim Bar Palermo">
      <div id="tapPlacesResults" class="tap-places-results"></div>
      <div class="tap-places-help">Scrivi il nome dell’attività e, se necessario, anche città o indirizzo. Seleziona il risultato corretto: nome e Place ID verranno compilati automaticamente.</div>
      <div id="tapPlacesState" class="tap-places-state">Ricerca protetta tramite Tapreputa…</div>`;
    grid.insertAdjacentElement('afterbegin', box);
  }

  function setPlacesState(text, type = '') {
    const el = document.getElementById('tapPlacesState');
    if (!el) return;
    el.className = 'tap-places-state' + (type ? ' ' + type : '');
    el.textContent = text;
  }

  function renderSuggestions(items) {
    const results = document.getElementById('tapPlacesResults');
    if (!results) return;
    results.innerHTML = '';
    if (!Array.isArray(items) || !items.length) {
      results.classList.remove('open');
      return;
    }
    for (const item of items) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'tap-place-option';
      button.innerHTML = `<span class="tap-place-main"></span><span class="tap-place-secondary"></span>`;
      button.querySelector('.tap-place-main').textContent = item.mainText || item.text || 'Attività';
      button.querySelector('.tap-place-secondary').textContent = item.secondaryText || item.text || '';
      button.addEventListener('click', () => {
        business.value = item.mainText || item.text || business.value;
        placeid.value = item.placeId || '';
        business.dispatchEvent(new Event('input', { bubbles: true }));
        placeid.dispatchEvent(new Event('input', { bubbles: true }));
        document.getElementById('tapPlacesInput').value = item.text || business.value;
        results.classList.remove('open');
        setPlacesState('✓ Selezionato: ' + (item.text || business.value), 'ok');
        if (msg) { msg.className = 'message'; msg.textContent = ''; }
      });
      results.appendChild(button);
    }
    results.classList.add('open');
  }

  async function searchPlaces(input) {
    const session = getSession();
    if (!session?.access_token) throw new Error('Sessione scaduta');
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': PUBLISHABLE_KEY,
        'Authorization': 'Bearer ' + session.access_token
      },
      body: JSON.stringify({ input })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data?.error || 'Ricerca Google non disponibile');
    return Array.isArray(data?.suggestions) ? data.suggestions : [];
  }

  function installAutocomplete() {
    addAutocompleteShell();
    const input = document.getElementById('tapPlacesInput');
    const results = document.getElementById('tapPlacesResults');
    if (!input || !results) return;
    let timer = 0;
    let requestSeq = 0;
    setPlacesState('Ricerca pronta. Scrivi almeno 2 caratteri.', 'ok');

    input.addEventListener('input', () => {
      clearTimeout(timer);
      const query = input.value.trim();
      renderSuggestions([]);
      if (query.length < 2) {
        setPlacesState('Scrivi almeno 2 caratteri per cercare.', '');
        return;
      }
      const seq = ++requestSeq;
      setPlacesState('Ricerca in corso…', '');
      timer = setTimeout(async () => {
        try {
          const items = await searchPlaces(query);
          if (seq !== requestSeq) return;
          renderSuggestions(items);
          setPlacesState(items.length ? 'Seleziona l’attività corretta dai risultati.' : 'Nessun risultato trovato. Prova ad aggiungere città o indirizzo.', items.length ? 'ok' : 'warn');
        } catch (err) {
          console.warn('Tap Places proxy error:', err);
          if (seq !== requestSeq) return;
          renderSuggestions([]);
          setPlacesState('Ricerca Google non disponibile. Controlla la configurazione del servizio oppure usa l’inserimento manuale.', 'warn');
        }
      }, 320);
    });

    document.addEventListener('click', event => {
      if (!results.contains(event.target) && event.target !== input) results.classList.remove('open');
    });
  }

  function installDuplicateFlow() {
    if (!duplicateCategory) return;
    continueBtn.addEventListener('click', event => {
      event.preventDefault();
      event.stopImmediatePropagation();
      const businessValue = business.value.trim();
      const placeIdValue = normalizePlaceIdInput(placeid.value);
      if (!businessValue) return showMessage('Seleziona o inserisci il nome dell’attività.');
      if (!placeIdValue) return showMessage('Seleziona l’attività dai risultati Google oppure inserisci il Google Place ID manualmente.');
      if (/^https?:\/\//i.test(placeIdValue)) return showMessage('Il valore inserito non contiene un Place ID valido.');
      placeid.value = placeIdValue;
      const next = new URLSearchParams();
      next.set('reviewurl', 'https://search.google.com/local/writereview?placeid=' + placeIdValue);
      next.set('business', businessValue);
      next.set('placeid', placeIdValue);
      next.set('category', duplicateCategory);
      location.href = 'personalizza.html?' + next.toString();
    }, true);
  }

  installStyles();
  installDuplicateNote();
  installManualFallback();
  installAutocomplete();
  installDuplicateFlow();
})();
