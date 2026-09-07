(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '') !== 'clienti.html') return;

  const STORAGE_KEY = 'tapreputa_clienti_filters_v1';
  const SESSION_KEY = 'tapnfc_supabase_session_v1';
  const SUPABASE_URL = 'https://rqzgdgdoulgjwlxtdxhi.supabase.co';
  const PUBLISHABLE_KEY = 'sb_publishable_Hc_FOVPSOkuNC-mz25VknA_5O0fWJ6p';
  const search = document.getElementById('clientSearch');
  const filterOperator = document.getElementById('filterOperator');
  const filterCategory = document.getElementById('filterCategory');
  const filterStatus = document.getElementById('filterStatus');
  const filterOrder = document.getElementById('filterOrder');
  const resetFilters = document.getElementById('resetFilters');
  const overlay = document.getElementById('overlay');
  const actionGrid = overlay?.querySelector('.action-grid');

  const CATEGORIES = Object.freeze([
    ['abbigliamento','Abbigliamento'],['autolavaggio','Autolavaggio'],['bar','Bar / Caffetterie'],['barbershop','Barber Shop'],['cartolibreria','Cartolibreria'],['centroestetico','Centri estetici'],['detersivi','Detersivi e casalinghi'],['farmacia','Farmacie'],['fitness','Palestre / Fitness'],['gelateria','Gelaterie'],['gioielleria','Gioielleria'],['macelleria','Macelleria'],['ottica','Ottica / vendita occhiali'],['panificio','Panificio / Biscottificio'],['panineria_hamburgeria','Panineria/Hamburgeria'],['parrucchiere','Parrucchieri'],['pasticceria','Pasticcerie'],['pizzeria','Pizzerie'],['polli_spiedo','Polli allo spiedo'],['pub','Pub / Cocktail bar'],['ristorante','Ristoranti'],['ristorantemare','Ristoranti Mare'],['stabilimento','Stabilimenti balneari'],['strumentimusicali','Strumenti musicali'],['svapostore','Svapo Store'],['veterinario','Veterinario'],['yogurteria','Yogurterie']
  ]);

  function safeParse(value) {
    try { return JSON.parse(value); } catch { return null; }
  }

  function normalizeStatusValue(value) {
    return String(value || '') === 'Consegnato' ? 'Consegnato' : 'Da consegnare';
  }

  function paintStatus(select) {
    if (!select) return;
    select.classList.toggle('tap-status-red', select.value === 'Da consegnare');
    select.classList.toggle('tap-status-green', select.value === 'Consegnato');
  }

  function limitStatusSelect(select, includeAll = false) {
    if (!select) return;
    const previous = String(select.value || '');
    const normalized = previous ? normalizeStatusValue(previous) : '';
    select.innerHTML = includeAll
      ? '<option value="">Tutti gli stati</option><option>Da consegnare</option><option>Consegnato</option>'
      : '<option>Da consegnare</option><option>Consegnato</option>';
    if (includeAll && !previous) select.value = '';
    else select.value = normalized || 'Da consegnare';
    paintStatus(select);
    if (!select.dataset.tapStatusPaintBound) {
      select.dataset.tapStatusPaintBound = '1';
      select.addEventListener('change', () => paintStatus(select));
    }
  }

  limitStatusSelect(filterStatus, true);

  function saveFilters() {
    const state = {
      search: search?.value || '',
      operator: filterOperator?.value || '',
      category: filterCategory?.value || '',
      status: filterStatus?.value || '',
      order: filterOrder?.value || 'id'
    };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function setIfAvailable(select, value) {
    if (!select || !value) return;
    if (Array.from(select.options).some(option => option.value === value || option.textContent === value)) {
      select.value = value;
    }
  }

  function restoreFilters() {
    const state = safeParse(sessionStorage.getItem(STORAGE_KEY) || 'null');
    if (!state) return;
    if (search) search.value = state.search || '';
    setIfAvailable(filterOperator, state.operator);
    setIfAvailable(filterCategory, state.category);
    if (state.status === 'Da consegnare' || state.status === 'Consegnato') setIfAvailable(filterStatus, state.status);
    setIfAvailable(filterOrder, state.order || 'id');
    paintStatus(filterStatus);
    [search, filterOperator, filterCategory, filterStatus, filterOrder].forEach(el => {
      if (!el) return;
      el.dispatchEvent(new Event(el === search ? 'input' : 'change', { bubbles:true }));
    });
  }

  [search, filterOperator, filterCategory, filterStatus, filterOrder].forEach(el => {
    if (!el) return;
    el.addEventListener(el === search ? 'input' : 'change', saveFilters);
  });
  resetFilters?.addEventListener('click', () => setTimeout(() => sessionStorage.removeItem(STORAGE_KEY), 0));

  let restored = false;
  const tryRestore = () => {
    if (restored) return;
    const operatorsReady = !filterOperator || filterOperator.options.length > 1;
    const categoriesReady = !filterCategory || filterCategory.options.length > 1;
    if (!operatorsReady || !categoriesReady) return;
    restored = true;
    restoreFilters();
  };
  tryRestore();
  if (!restored && filterOperator) {
    const observer = new MutationObserver(() => {
      tryRestore();
      if (restored) observer.disconnect();
    });
    observer.observe(filterOperator, { childList:true });
    if (filterCategory) observer.observe(filterCategory, { childList:true });
    setTimeout(() => { tryRestore(); observer.disconnect(); }, 2500);
  }

  function currentClient() {
    try {
      if (typeof currentId === 'undefined' || typeof clienti === 'undefined') return null;
      return clienti.find(client => client.id === currentId) || null;
    } catch {
      return null;
    }
  }

  if (actionGrid && !document.getElementById('duplicateClient')) {
    const duplicate = document.createElement('button');
    duplicate.id = 'duplicateClient';
    duplicate.className = 'action';
    duplicate.type = 'button';
    duplicate.textContent = 'Duplica cliente';
    duplicate.title = 'Avvia un nuovo cliente riutilizzando la stessa categoria';
    const danger = actionGrid.querySelector('.danger');
    if (danger) actionGrid.insertBefore(duplicate, danger);
    else actionGrid.appendChild(duplicate);

    duplicate.addEventListener('click', () => {
      const client = currentClient();
      if (!client) return;
      const params = new URLSearchParams();
      if (client.categoria_codice) params.set('duplicateCategory', client.categoria_codice);
      if (client.nome) params.set('duplicateFrom', client.nome);
      location.href = 'index.html?' + params.toString();
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    .tap-shortcut-hint{margin:14px 0 0;color:#748196;font-size:11px;text-align:right}
    .table-wrap table{width:860px!important;min-width:860px!important}
    .tap-hidden-column{display:none!important}
    .tap-status-col,.tap-status-cell{width:146px!important;min-width:146px!important}
    .tap-total-col,.tap-total-cell{width:96px!important;min-width:96px!important;text-align:center!important}
    .tap-actions-col,.tap-actions-cell{width:112px!important;min-width:112px!important}
    thead th:nth-child(1),tbody td.id{position:sticky!important;left:0!important;z-index:8!important}
    tbody td.id{z-index:6!important;background:#fff!important}
    thead th:nth-child(2),tbody td.nome{position:sticky!important;left:56px!important;z-index:8!important;background:#fff!important;box-shadow:9px 0 12px -12px rgba(0,45,37,.55)!important}
    tbody td.nome{z-index:6!important}
    .tap-status-red{background:#fff0ed!important;border-color:#efb8af!important;color:#a72d20!important;font-weight:900!important}
    .tap-status-green{background:#e9f8f1!important;border-color:#acdcca!important;color:#08735f!important;font-weight:900!important}
    .tap-edit-overlay{display:none;position:fixed;inset:0;background:rgba(0,25,20,.52);padding:18px;z-index:80;overflow:auto}.tap-edit-overlay.show{display:flex;align-items:flex-start;justify-content:center}.tap-edit-panel{width:min(680px,100%);margin:22px auto;background:#fff;border-radius:24px;padding:22px;box-shadow:0 28px 80px rgba(0,0,0,.28)}.tap-edit-top{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;margin-bottom:18px}.tap-edit-top h2{margin:0;font-size:27px}.tap-edit-lock{font-size:12px;color:#70807a;margin-top:5px}.tap-edit-close{width:42px;height:42px;border-radius:50%;border:1px solid #d5dfdc;background:#fff;font-size:21px}.tap-edit-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.tap-edit-field{display:grid;gap:6px}.tap-edit-field.wide{grid-column:1/-1}.tap-edit-field label{font-size:11px;text-transform:uppercase;font-weight:850;color:#70807a;letter-spacing:.04em}.tap-edit-input,.tap-edit-select{width:100%;height:48px;border:1px solid #ccd9d5;border-radius:12px;background:#fff;color:#17332d;font:inherit;font-size:14px;padding:0 12px;outline:none}.tap-edit-input:focus,.tap-edit-select:focus{border-color:#0c9b80;box-shadow:0 0 0 3px rgba(12,155,128,.10)}.tap-edit-readonly{background:#f3f6f5!important;color:#70807a!important}.tap-edit-products{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.tap-edit-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:18px}.tap-edit-save,.tap-edit-cancel{min-height:52px;border-radius:13px;font:inherit;font-weight:900;cursor:pointer}.tap-edit-save{border:0;background:#003c33;color:#fff}.tap-edit-cancel{border:1px solid #ccd9d5;background:#fff;color:#34544d}.tap-edit-msg{display:none;margin-top:12px;padding:11px 12px;border-radius:10px;font-size:13px}.tap-edit-msg.show{display:block}.tap-edit-msg.error{background:#fff0ed;color:#8c2d21;border:1px solid #efc0b8}.tap-edit-msg.ok{background:#eaf8f4;color:#096450;border:1px solid #b8e4d8}
    @media(max-width:760px){
      .tap-shortcut-hint{display:none}
      .table-wrap table{width:812px!important;min-width:812px!important}
      thead th:nth-child(1),tbody td.id{width:52px!important;min-width:52px!important;max-width:52px!important}
      thead th:nth-child(2),tbody td.nome{left:52px!important;width:132px!important;min-width:132px!important;max-width:132px!important}
      .tap-edit-overlay{padding:10px}.tap-edit-panel{margin:8px auto;padding:18px}.tap-edit-grid{grid-template-columns:1fr}.tap-edit-field.wide,.tap-edit-products{grid-column:1}.tap-edit-products{grid-template-columns:1fr 1fr 1fr}.tap-edit-actions{grid-template-columns:1fr}
    }
  `;
  document.head.appendChild(style);

  function compactHeader() {
    const row = document.querySelector('table thead tr');
    if (!row || row.dataset.tapCompact === '1') return;
    const cells = Array.from(row.children);
    if (cells.length < 13) return;

    const hidden = [4, 5, 6, 7, 8, 10];
    hidden.forEach(index => cells[index]?.classList.add('tap-hidden-column'));

    const status = cells[11];
    const total = cells[9];
    const actions = cells[12];
    if (status && total) row.insertBefore(status, total);

    if (cells[1]) cells[1].textContent = 'NOME ATTIVITÀ';
    if (status) {
      status.textContent = 'STATO';
      status.classList.add('tap-status-col');
    }
    if (total) {
      total.textContent = 'TOTALE €';
      total.classList.add('tap-total-col');
    }
    if (actions) {
      actions.textContent = 'AZIONI';
      actions.classList.add('tap-actions-col');
    }
    row.dataset.tapCompact = '1';
  }

  function compactRow(row) {
    if (!row || row.dataset.tapCompact === '1') return;
    const cells = Array.from(row.children);
    if (cells.length < 13) return;

    const hidden = [4, 5, 6, 7, 8, 10];
    hidden.forEach(index => cells[index]?.classList.add('tap-hidden-column'));

    const status = cells[11];
    const total = cells[9];
    const actions = cells[12];
    if (status && total) row.insertBefore(status, total);
    status?.classList.add('tap-status-cell');
    total?.classList.add('tap-total-cell');
    actions?.classList.add('tap-actions-cell');
    const statusSelect = status?.querySelector('select');
    if (statusSelect) limitStatusSelect(statusSelect, false);
    row.dataset.tapCompact = '1';
  }

  function applyCompactTable() {
    compactHeader();
    document.querySelectorAll('#rows > tr').forEach(compactRow);
  }

  applyCompactTable();
  const rowsRoot = document.getElementById('rows');
  if (rowsRoot) {
    new MutationObserver(() => applyCompactTable()).observe(rowsRoot, { childList:true });
  }

  function createEditPanel() {
    if (document.getElementById('tapEditOverlay')) return document.getElementById('tapEditOverlay');
    const host = document.createElement('div');
    host.id = 'tapEditOverlay';
    host.className = 'tap-edit-overlay';
    host.innerHTML = `
      <div class="tap-edit-panel" role="dialog" aria-modal="true" aria-labelledby="tapEditTitle">
        <div class="tap-edit-top"><div><h2 id="tapEditTitle">Modifica cliente</h2><div class="tap-edit-lock">Nome attività, operatore e link restano bloccati.</div></div><button class="tap-edit-close" type="button" aria-label="Chiudi">×</button></div>
        <div class="tap-edit-grid">
          <div class="tap-edit-field wide"><label>Nome attività</label><input id="tapEditName" class="tap-edit-input tap-edit-readonly" readonly></div>
          <div class="tap-edit-field"><label>Categoria</label><select id="tapEditCategory" class="tap-edit-select"></select></div>
          <div class="tap-edit-field"><label>Stato</label><select id="tapEditStatus" class="tap-edit-select"><option>Da consegnare</option><option>Consegnato</option></select></div>
          <div class="tap-edit-field"><label>Totale €</label><input id="tapEditSpend" class="tap-edit-input" type="number" min="0" step="0.01" inputmode="decimal"></div>
          <div class="tap-edit-products">
            <div class="tap-edit-field"><label>Targhe</label><input id="tapEditTarghe" class="tap-edit-input" type="number" min="0" step="1" inputmode="numeric"></div>
            <div class="tap-edit-field"><label>Cards</label><input id="tapEditCards" class="tap-edit-input" type="number" min="0" step="1" inputmode="numeric"></div>
            <div class="tap-edit-field"><label>Adesivi</label><input id="tapEditAdesivi" class="tap-edit-input" type="number" min="0" step="1" inputmode="numeric"></div>
          </div>
          <div class="tap-edit-field wide"><label>Data</label><input id="tapEditDate" class="tap-edit-input" type="date"></div>
        </div>
        <div class="tap-edit-actions"><button id="tapEditSave" class="tap-edit-save" type="button">Salva modifiche</button><button class="tap-edit-cancel" type="button">Annulla</button></div>
        <div id="tapEditMsg" class="tap-edit-msg" aria-live="polite"></div>
      </div>`;
    document.body.appendChild(host);
    const categorySelect = host.querySelector('#tapEditCategory');
    CATEGORIES.forEach(([id,label]) => {
      const option = document.createElement('option');
      option.value = id;
      option.textContent = label;
      categorySelect.appendChild(option);
    });
    const editStatus = host.querySelector('#tapEditStatus');
    limitStatusSelect(editStatus, false);
    host.querySelector('.tap-edit-close').addEventListener('click', () => host.classList.remove('show'));
    host.querySelector('.tap-edit-cancel').addEventListener('click', () => host.classList.remove('show'));
    host.addEventListener('click', event => { if (event.target === host) host.classList.remove('show'); });
    host.querySelector('#tapEditSave').addEventListener('click', saveCurrentEdit);
    return host;
  }

  function formatDateInput(value) {
    const text = String(value || '').trim();
    if (!text) return '';
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? `${match[1]}-${match[2]}-${match[3]}` : '';
  }

  function showEdit(client) {
    const host = createEditPanel();
    host.dataset.clientId = client.id || '';
    host.querySelector('#tapEditName').value = client.nome || '';
    const category = host.querySelector('#tapEditCategory');
    const categoryId = client.categoria_codice || '';
    if (categoryId && Array.from(category.options).some(o => o.value === categoryId)) category.value = categoryId;
    else if (client.categoria) {
      const option = Array.from(category.options).find(o => o.textContent === client.categoria);
      if (option) category.value = option.value;
    }
    const editStatus = host.querySelector('#tapEditStatus');
    editStatus.value = normalizeStatusValue(client.stato);
    paintStatus(editStatus);
    host.querySelector('#tapEditSpend').value = Number(client.spesa || 0);
    host.querySelector('#tapEditTarghe').value = Number(client.targhe || 0);
    host.querySelector('#tapEditCards').value = Number(client.carte || 0);
    host.querySelector('#tapEditAdesivi').value = Number(client.adesivi || 0);
    host.querySelector('#tapEditDate').value = formatDateInput(client.created_at || client.data || '');
    const msg = host.querySelector('#tapEditMsg');
    msg.className = 'tap-edit-msg';
    msg.textContent = '';
    host.classList.add('show');
  }

  function numberValue(id, integer = false) {
    const raw = Number(document.getElementById(id)?.value || 0);
    const safe = Number.isFinite(raw) ? Math.max(0, raw) : 0;
    return integer ? Math.floor(safe) : safe;
  }

  function loadSession() {
    const a = safeParse(sessionStorage.getItem(SESSION_KEY) || 'null');
    if (a?.access_token) return { ...a, _storage:'session' };
    const b = safeParse(localStorage.getItem(SESSION_KEY) || 'null');
    if (b?.access_token) return { ...b, _storage:'local' };
    return null;
  }

  async function ensureSession() {
    let session = loadSession();
    if (!session?.access_token) throw new Error('Sessione non disponibile.');
    if (session.expires_at && session.expires_at - Date.now() > 90000) return session;
    if (!session.refresh_token) return session;
    const response = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=refresh_token', {
      method:'POST',
      headers:{ apikey:PUBLISHABLE_KEY, 'Content-Type':'application/json' },
      body:JSON.stringify({ refresh_token:session.refresh_token })
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.access_token) throw new Error('Sessione scaduta.');
    const refreshed = {
      access_token:data.access_token,
      refresh_token:data.refresh_token,
      expires_at:Date.now() + Math.max(30, Number(data.expires_in || 3600)) * 1000,
      user:data.user || session.user || null
    };
    const target = session._storage === 'local' ? localStorage : sessionStorage;
    target.setItem(SESSION_KEY, JSON.stringify(refreshed));
    return { ...refreshed, _storage:session._storage };
  }

  async function patchClient(id, patch) {
    const session = await ensureSession();
    const response = await fetch(SUPABASE_URL + '/rest/v1/clienti?id=eq.' + encodeURIComponent(id), {
      method:'PATCH',
      headers:{ apikey:PUBLISHABLE_KEY, Authorization:'Bearer ' + session.access_token, 'Content-Type':'application/json', Prefer:'return=representation' },
      body:JSON.stringify(patch)
    });
    const text = await response.text();
    const data = text ? safeParse(text) : null;
    if (!response.ok) throw new Error(data?.message || data?.hint || 'Salvataggio non riuscito.');
    return Array.isArray(data) ? data[0] : data;
  }

  async function saveCurrentEdit() {
    const host = document.getElementById('tapEditOverlay');
    const client = currentClient();
    if (!host || !client) return;
    const save = host.querySelector('#tapEditSave');
    const msg = host.querySelector('#tapEditMsg');
    save.disabled = true;
    save.textContent = 'Salvataggio…';
    msg.className = 'tap-edit-msg';
    msg.textContent = '';
    try {
      const category = host.querySelector('#tapEditCategory');
      const selected = category.options[category.selectedIndex];
      const patch = {
        categoria_codice: category.value || null,
        categoria: selected?.textContent || null,
        stato: normalizeStatusValue(host.querySelector('#tapEditStatus').value),
        targhe: numberValue('tapEditTarghe', true),
        carte: numberValue('tapEditCards', true),
        adesivi: numberValue('tapEditAdesivi', true),
        spesa: numberValue('tapEditSpend', false)
      };
      const dateValue = host.querySelector('#tapEditDate').value;
      if (dateValue && client.created_at) {
        const original = String(client.created_at);
        patch.created_at = original.match(/^\d{4}-\d{2}-\d{2}/) ? dateValue + original.slice(10) : dateValue + 'T12:00:00.000Z';
      }
      await patchClient(client.id, patch);
      msg.className = 'tap-edit-msg show ok';
      msg.textContent = 'Modifiche salvate.';
      setTimeout(() => location.reload(), 350);
    } catch (error) {
      msg.className = 'tap-edit-msg show error';
      msg.textContent = error?.message || 'Salvataggio non riuscito.';
      save.disabled = false;
      save.textContent = 'Salva modifiche';
    }
  }

  overlay?.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || String(button.textContent || '').trim().toLowerCase() !== 'modifica') return;
    const client = currentClient();
    if (!client) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    showEdit(client);
  }, true);

  const tools = document.querySelector('.tools');
  if (tools && !document.querySelector('.tap-shortcut-hint')) {
    const hint = document.createElement('div');
    hint.className = 'tap-shortcut-hint';
    hint.textContent = 'Scorciatoie: / cerca · N nuovo cliente · Esc chiudi scheda';
    tools.insertAdjacentElement('afterend', hint);
  }

  document.addEventListener('keydown', event => {
    const editOverlay = document.getElementById('tapEditOverlay');
    const target = event.target;
    const typing = target && (target.matches?.('input,select,textarea') || target.isContentEditable);
    if (event.key === 'Escape' && editOverlay?.classList.contains('show')) {
      editOverlay.classList.remove('show');
      return;
    }
    if (event.key === 'Escape' && overlay?.classList.contains('show')) {
      overlay.classList.remove('show');
      return;
    }
    if (typing || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.key === '/') {
      event.preventDefault();
      search?.focus();
      search?.select();
    } else if (event.key.toLowerCase() === 'n') {
      location.href = 'index.html';
    }
  });
})();
