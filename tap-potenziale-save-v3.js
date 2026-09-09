(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '') !== 'personalizza-potenziale.html') return;

  const SUPABASE_URL = 'https://rqzgdgdoulgjwlxtdxhi.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_Hc_FOVPSOkuNC-mz25VknA_5O0fWJ6p';
  const SESSION_KEY = 'tapnfc_supabase_session_v1';
  const params = new URLSearchParams(location.search);
  const business = params.get('business') || 'Attività';
  const placeId = params.get('placeid') || '';
  const reviewUrl = params.get('reviewurl') || ('https://search.google.com/local/writereview?placeid=' + encodeURIComponent(placeId));
  const editId = params.get('edit') || '';
  const initialCategory = params.get('category') || '';
  const initialCustomLink = params.get('customlink') || '';
  const initialState = params.get('state') || 'Da visitare';
  const autoPreview = params.get('preview') === '1';

  function getSession() {
    for (const storage of [sessionStorage, localStorage]) {
      try {
        const s = JSON.parse(storage.getItem(SESSION_KEY) || 'null');
        if (s?.access_token) return s;
      } catch {}
    }
    return null;
  }

  function operatorName() {
    return String(document.querySelector('[data-operator-name]')?.textContent || document.body.dataset.tapOperator || '').trim() || 'Operatore';
  }

  function installSaveUi() {
    if (document.getElementById('prospectSaveSection')) return;
    const summary = document.getElementById('summary');
    if (!summary) return;

    const section = document.createElement('section');
    section.id = 'prospectSaveSection';
    section.className = 'section';
    section.style.marginTop = '18px';
    section.innerHTML = `
      <div class="num">3</div>
      <h2>${editId ? 'Modifica potenziale cliente' : 'Salva potenziale cliente'}</h2>
      <div class="section-sub">Il salvataggio avviene esclusivamente in “Potenziali clienti” e non crea alcuna scheda in “I miei clienti”.</div>
      <div class="field">
        <label for="prospectStateSelect">Stato</label>
        <select id="prospectStateSelect" class="select">
          <option value="Da visitare">Da visitare</option>
          <option value="Visitato">Visitato</option>
          <option value="Acquisito">Acquisito</option>
          <option value="Non interessato">Non interessato</option>
        </select>
      </div>
      <button id="saveProspectBtn" class="btn generate" type="button" style="width:100%">${editId ? 'Salva modifiche' : 'Salva potenziale cliente'}</button>
      <div id="saveProspectStatus" class="status"></div>
    `;
    summary.insertAdjacentElement('afterend', section);
    const stateSelect=document.getElementById('prospectStateSelect');
    if(stateSelect && [...stateSelect.options].some(o=>o.value===initialState)) stateSelect.value=initialState;
    document.getElementById('saveProspectBtn').addEventListener('click', saveProspect);
  }

  function setSaveStatus(text, type = 'warn') {
    const box = document.getElementById('saveProspectStatus');
    if (!box) return;
    box.className = 'status show ' + type;
    box.textContent = text;
  }

  async function rest(path, options = {}) {
    const session = getSession();
    if (!session?.access_token) throw new Error('Sessione scaduta. Accedi di nuovo.');
    const headers = new Headers(options.headers || {});
    headers.set('apikey', PUBLISHABLE_KEY);
    headers.set('Authorization', 'Bearer ' + session.access_token);
    if (options.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    return fetch(SUPABASE_URL + '/rest/v1/' + path, { ...options, headers });
  }

  async function responseJson(response) {
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(data?.message || data?.details || data?.hint || 'Salvataggio non riuscito.');
    return data;
  }

  function tokenFromLink(link) {
    try {
      const u = new URL(link, location.href);
      if (!/prospect\.html$/i.test(u.pathname)) return '';
      return u.searchParams.get('p') || '';
    } catch { return ''; }
  }

  function makeToken() {
    const a = new Uint8Array(8);
    crypto.getRandomValues(a);
    return [...a].map(b => b.toString(16).padStart(2,'0')).join('');
  }

  function safeFileName(name) {
    return String(name || 'logo')
      .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
      .replace(/[^a-zA-Z0-9._-]+/g,'-')
      .replace(/^-+|-+$/g,'') || 'logo';
  }

  async function uploadLogo(token, file) {
    if (!file) return null;
    const session = getSession();
    if (!session?.access_token) throw new Error('Sessione scaduta. Accedi di nuovo.');
    const objectPath = token + '/' + Date.now() + '-' + safeFileName(file.name);
    const response = await fetch(SUPABASE_URL + '/storage/v1/object/prospect-logos/' + objectPath.split('/').map(encodeURIComponent).join('/'), {
      method: 'POST',
      headers: {
        apikey: PUBLISHABLE_KEY,
        Authorization: 'Bearer ' + session.access_token,
        'Content-Type': file.type || 'application/octet-stream',
        'x-upsert': 'true'
      },
      body: file
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || 'Caricamento logo non riuscito.');
    }
    return SUPABASE_URL + '/storage/v1/object/public/prospect-logos/' + objectPath.split('/').map(encodeURIComponent).join('/');
  }

  async function saveProspect() {
    const btn = document.getElementById('saveProspectBtn');
    const category = document.getElementById('customCategory');
    const customLinkEl = document.getElementById('customLink');
    const customLink = String(customLinkEl?.textContent || '').trim();
    const customLinkReady = customLink && !customLinkEl?.classList.contains('empty');
    const standardEl = document.getElementById('standardLink');
    const standardLink = String(standardEl?.textContent || '').trim();
    const state = document.getElementById('prospectStateSelect')?.value || 'Da visitare';

    if (!category?.value) return setSaveStatus('Seleziona prima la categoria personalizzata.');
    if (!customLinkReady) return setSaveStatus('Genera prima il link della versione personalizzata.');

    const categoryLabel = category.options[category.selectedIndex]?.text || category.value;
    const logoFile = document.getElementById('customLogo')?.files?.[0] || null;
    const session = getSession();
    if (!session?.user?.id && !session?.access_token) return setSaveStatus('Sessione non disponibile.');

    btn.disabled = true;
    btn.textContent = editId ? 'Salvataggio modifiche…' : 'Salvataggio…';
    setSaveStatus(editId ? 'Aggiornamento del potenziale in corso…' : 'Salvataggio del potenziale in corso…', 'ok');

    try {
      let targetId = editId;
      let existingRow = null;
      if (targetId) {
        const r = await rest('potenziali_clienti?select=id,logo_url,prospect_token&id=eq.' + encodeURIComponent(targetId) + '&limit=1');
        existingRow = ((await responseJson(r)) || [])[0] || null;
      } else if (placeId) {
        const r = await rest('potenziali_clienti?select=id,logo_url,prospect_token&place_id=eq.' + encodeURIComponent(placeId) + '&limit=1');
        existingRow = ((await responseJson(r)) || [])[0] || null;
        targetId = existingRow?.id || '';
      }

      const prospectToken = window.tapProspectToken || tokenFromLink(customLink) || existingRow?.prospect_token || makeToken();
      window.tapProspectToken = prospectToken;

      let logoUrl = existingRow?.logo_url || null;
      if (logoFile) {
        setSaveStatus('Caricamento logo e salvataggio del potenziale…', 'ok');
        logoUrl = await uploadLogo(prospectToken, logoFile);
      }

      const payload = {
        prospect_token: prospectToken,
        nome: business,
        operatore: operatorName(),
        categoria: categoryLabel,
        categoria_codice: category.value,
        place_id: placeId || null,
        link_standard: standardLink && !standardEl?.classList.contains('empty') ? standardLink : reviewUrl,
        link_personalizzato: customLink,
        logo_url: logoUrl,
        stato: state,
        personalizzazione: {
          categoria_standard: 'standard',
          categoria_personalizzata: category.value,
          categoria_personalizzata_label: categoryLabel,
          logo_presente: !!logoUrl,
          logo_nome: logoFile?.name || null
        },
        updated_by: session?.user?.id || null
      };

      if (targetId) {
        const r = await rest('potenziali_clienti?id=eq.' + encodeURIComponent(targetId), {
          method: 'PATCH',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(payload)
        });
        await responseJson(r);
      } else {
        const insertPayload = { ...payload, created_by: session?.user?.id || null };
        const r = await rest('potenziali_clienti', {
          method: 'POST',
          headers: { Prefer: 'return=representation' },
          body: JSON.stringify(insertPayload)
        });
        await responseJson(r);
      }

      btn.textContent = editId ? 'Modifiche salvate ✓' : 'Potenziale salvato ✓';
      setSaveStatus(editId ? 'Modifiche salvate correttamente.' : 'Salvato correttamente in “Potenziali clienti”.', 'ok');
      setTimeout(() => { location.href = 'potenziali.html'; }, 800);
    } catch (err) {
      console.warn('[Salva potenziale]', err);
      btn.disabled = false;
      btn.textContent = editId ? 'Salva modifiche' : 'Salva potenziale cliente';
      setSaveStatus(err?.message || 'Non riesco a salvare il potenziale.');
    }
  }

  function preloadEditData(){
    if(!editId) return;
    const category=document.getElementById('customCategory');
    if(category && initialCategory){
      category.value=initialCategory;
      category.dispatchEvent(new Event('change',{bubbles:true}));
    }
    const standard=document.getElementById('standardLink');
    if(standard && reviewUrl){
      standard.textContent=reviewUrl;
      standard.classList.remove('empty');
      const b=document.getElementById('copyStandard'); if(b)b.disabled=false;
    }
    const custom=document.getElementById('customLink');
    if(custom && initialCustomLink){
      custom.textContent=initialCustomLink;
      custom.classList.remove('empty');
      const b=document.getElementById('copyCustom');
      if(b){
        b.disabled=false;
        b.onclick=async()=>{try{await navigator.clipboard.writeText(initialCustomLink);const old=b.textContent;b.textContent='Copiato ✓';setTimeout(()=>b.textContent=old,1000)}catch{prompt('Copia il link:',initialCustomLink)}};
      }
      const t=tokenFromLink(initialCustomLink); if(t) window.tapProspectToken=t;
    }
    document.getElementById('summary')?.classList.add('show');
    if(autoPreview){
      setTimeout(()=>document.getElementById('previewCustom')?.click(),500);
    }
  }

  function boot() {
    installSaveUi();
    preloadEditData();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
