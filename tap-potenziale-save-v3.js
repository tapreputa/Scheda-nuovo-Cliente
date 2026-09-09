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
      <h2>Salva potenziale cliente</h2>
      <div class="section-sub">Il salvataggio avviene esclusivamente in “Potenziali clienti” e non crea alcuna scheda in “I miei clienti”.</div>
      <div class="field">
        <label for="prospectStateSelect">Stato</label>
        <select id="prospectStateSelect" class="select">
          <option value="Da visitare" selected>Da visitare</option>
          <option value="Visitato">Visitato</option>
          <option value="Acquisito">Acquisito</option>
          <option value="Non interessato">Non interessato</option>
        </select>
      </div>
      <button id="saveProspectBtn" class="btn generate" type="button" style="width:100%">Salva potenziale cliente</button>
      <div id="saveProspectStatus" class="status"></div>
    `;
    summary.insertAdjacentElement('afterend', section);

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

  async function saveProspect() {
    const btn = document.getElementById('saveProspectBtn');
    const category = document.getElementById('customCategory');
    const customLink = String(document.getElementById('customLink')?.textContent || '').trim();
    const customLinkReady = customLink && !document.getElementById('customLink')?.classList.contains('empty');
    const standardLink = String(document.getElementById('standardLink')?.textContent || '').trim();
    const state = document.getElementById('prospectStateSelect')?.value || 'Da visitare';

    if (!category?.value) return setSaveStatus('Seleziona prima la categoria personalizzata.');
    if (!customLinkReady) return setSaveStatus('Genera prima il link della versione personalizzata.');

    const categoryLabel = category.options[category.selectedIndex]?.text || category.value;
    const logoFile = document.getElementById('customLogo')?.files?.[0] || null;
    const session = getSession();
    if (!session?.user?.id && !session?.access_token) return setSaveStatus('Sessione non disponibile.');

    const payload = {
      nome: business,
      operatore: operatorName(),
      categoria: categoryLabel,
      categoria_codice: category.value,
      place_id: placeId || null,
      link_standard: standardLink && !document.getElementById('standardLink')?.classList.contains('empty') ? standardLink : reviewUrl,
      link_personalizzato: customLink,
      logo_url: null,
      stato: state,
      personalizzazione: {
        categoria_standard: 'standard',
        categoria_personalizzata: category.value,
        categoria_personalizzata_label: categoryLabel,
        logo_presente: !!logoFile,
        logo_nome: logoFile?.name || null
      },
      updated_by: session?.user?.id || null
    };

    btn.disabled = true;
    btn.textContent = 'Salvataggio…';
    setSaveStatus('Salvataggio del potenziale in corso…', 'ok');

    try {
      let existing = [];
      if (placeId) {
        const r = await rest('potenziali_clienti?select=id,created_by&place_id=eq.' + encodeURIComponent(placeId) + '&limit=1');
        existing = (await responseJson(r)) || [];
      }

      if (existing[0]?.id) {
        const r = await rest('potenziali_clienti?id=eq.' + encodeURIComponent(existing[0].id), {
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

      btn.textContent = 'Potenziale salvato ✓';
      setSaveStatus('Salvato correttamente in “Potenziali clienti”.', 'ok');
      setTimeout(() => { location.href = 'potenziali.html'; }, 800);
    } catch (err) {
      console.warn('[Salva potenziale]', err);
      btn.disabled = false;
      btn.textContent = 'Salva potenziale cliente';
      setSaveStatus(err?.message || 'Non riesco a salvare il potenziale.');
    }
  }

  function fixDuplicatePreviewBack() {
    const preview = document.getElementById('previewCustom');
    const frame = document.getElementById('rendererFrame');
    if (!preview || !frame) return;
    preview.addEventListener('click', () => {
      let tries = 0;
      const timer = setInterval(() => {
        tries++;
        try {
          const doc = frame.contentDocument;
          const overlay = doc?.getElementById('tapPreviewOverlay');
          if (overlay) {
            const buttons = [...overlay.querySelectorAll('button')];
            const innerBack = buttons.find(b => /Torna a Personalizza/i.test(b.textContent || ''));
            if (innerBack) innerBack.style.display = 'none';
            clearInterval(timer);
          }
        } catch {}
        if (tries > 40) clearInterval(timer);
      }, 75);
    }, true);
  }

  function boot() {
    installSaveUi();
    fixDuplicatePreviewBack();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
  else boot();
})();
