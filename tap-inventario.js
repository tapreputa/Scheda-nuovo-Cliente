(() => {
  'use strict';
  const fields = ['targhe', 'carte', 'adesivi'];
  const pageNotice = document.getElementById('pageNotice');
  const openingPanel = document.getElementById('openingPanel');
  const orderPanel = document.getElementById('orderPanel');
  const historyElement = document.getElementById('history');
  const openingForm = document.getElementById('openingForm');
  const orderForm = document.getElementById('orderForm');
  let currentUser = null;
  let openingRecorded = false;

  function localDate() {
    const date = new Date();
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 10);
  }
  document.getElementById('openingDate').value = localDate();
  document.getElementById('orderDate').value = localDate();
  document.querySelectorAll('input[type="number"]').forEach(input => {
    input.addEventListener('focus', () => { if (input.value === '0') input.value = ''; });
  });

  function showNotice(message, type) {
    pageNotice.textContent = message;
    pageNotice.className = 'notice show ' + (type || 'info');
  }
  function clearNotice() {
    pageNotice.textContent = '';
    pageNotice.className = 'notice';
  }
  async function readResponse(response) {
    const text = await response.text();
    const data = text ? JSON.parse(text) : null;
    if (!response.ok) throw new Error(data?.message || data?.details || data?.hint || 'Operazione non riuscita.');
    return data;
  }
  async function getRows(path) {
    const response = await TapNfc.rest(path, { headers: { Accept: 'application/json' } });
    return (await readResponse(response)) || [];
  }
  function renderBalance(row) {
    document.getElementById('stockTarghe').textContent = Number(row?.targhe || 0).toLocaleString('it-IT');
    document.getElementById('stockCarte').textContent = Number(row?.carte || 0).toLocaleString('it-IT');
    document.getElementById('stockAdesivi').textContent = Number(row?.adesivi || 0).toLocaleString('it-IT');
  }
  function labelFor(type) {
    return ({ apertura: 'Giacenza iniziale', ordine: 'Ordine ricevuto', vendita: 'Vendita cliente', rettifica_vendita: 'Modifica vendita', storno_vendita: 'Storno vendita' })[type] || 'Movimento';
  }
  function quantitySummary(row) {
    const labels = [['targhe', 'targhe'], ['carte', 'cards'], ['adesivi', 'adesivi']];
    return labels.map(([key, label]) => {
      const n = Number(row[key] || 0);
      return n ? (n > 0 ? '+' : '') + n + ' ' + label : '';
    }).filter(Boolean).join(' · ') || 'Nessuna variazione quantità';
  }
  function renderHistory(rows) {
    historyElement.replaceChildren();
    const visibleRows = rows.filter(row => Number(row.targhe || 0) || Number(row.carte || 0) || Number(row.adesivi || 0));
    if (!visibleRows.length) {
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = openingRecorded ? 'Ancora nessun ordine o movimento.' : 'Registra la giacenza iniziale per attivare il monitoraggio.';
      historyElement.append(empty);
      return;
    }
    for (const row of visibleRows) {
      const item = document.createElement('article');
      item.className = 'movement';
      const left = document.createElement('div');
      const title = document.createElement('div');
      title.className = 'movement-title';
      title.textContent = labelFor(row.tipo);
      const meta = document.createElement('div');
      meta.className = 'movement-meta';
      const date = row.data_movimento ? new Date(row.data_movimento + 'T12:00:00').toLocaleDateString('it-IT') : '';
      meta.textContent = [date, row.operatore || 'Operatore', row.note || ''].filter(Boolean).join(' · ');
      left.append(title, meta);
      const qty = document.createElement('div');
      qty.className = 'movement-qty' + (row.tipo === 'vendita' || row.tipo === 'rettifica_vendita' ? ' negative' : '');
      qty.textContent = quantitySummary(row);
      item.append(left, qty);
      historyElement.append(item);
    }
  }
  async function refresh() {
    clearNotice();
    try {
      const [balanceRows, movementRows, openingRows] = await Promise.all([
        getRows('inventario_giacenze?select=id,targhe,carte,adesivi,updated_at&id=eq.1&limit=1'),
        getRows('inventario_movimenti?select=id,tipo,data_movimento,targhe,carte,adesivi,operatore,note,created_at&order=created_at.desc&limit=50'),
        getRows('inventario_movimenti?select=id&tipo=eq.apertura&limit=1')
      ]);
      const opening = openingRows.length > 0;
      openingRecorded = opening;
      openingPanel.classList.toggle('hidden', opening);
      orderPanel.classList.toggle('hidden', !opening);
      renderBalance(balanceRows[0]);
      renderHistory(movementRows);
      if (!opening) showNotice('Per attivare le scorte, registra una volta le quantità fisicamente presenti. I clienti già esistenti non verranno conteggiati retroattivamente.', 'info');
    } catch (error) {
      showNotice('Non riesco a caricare l’inventario: ' + error.message, 'error');
      historyElement.replaceChildren();
      const empty = document.createElement('div');
      empty.className = 'empty';
      empty.textContent = 'Verifica la connessione e riprova.';
      historyElement.append(empty);
    }
  }
  function extractQuantities(form, tipo) {
    const data = new FormData(form);
    const values = {};
    for (const field of fields) {
      const raw = String(data.get(field) || '').trim();
      if (raw === '') { values[field] = 0; continue; }
      const amount = Number(raw);
      if (!/^\d+$/.test(raw) || !Number.isSafeInteger(amount) || amount < 0) throw new Error('Inserisci quantità intere pari o superiori a zero.');
      values[field] = amount;
    }
    if (values.targhe === 0 && values.carte === 0 && values.adesivi === 0 && tipo !== 'apertura') {
      throw new Error('Inserisci almeno una quantità maggiore di zero.');
    }
    return values;
  }
  async function submitMovement(form, tipo, buttonLabel) {
    clearNotice();
    const button = form.querySelector('button[type="submit"]');
    const original = button.textContent;
    button.disabled = true;
    button.textContent = 'Salvataggio…';
    try {
      if (!form.reportValidity()) return;
      const values = extractQuantities(form, tipo);
      const formData = new FormData(form);
      const payload = {
        tipo,
        data_movimento: formData.get('data_movimento'),
        ...values,
        operatore: TapNfc.operatorName(currentUser),
        created_by: currentUser.id,
        note: tipo === 'ordine' ? String(formData.get('note') || '').trim() || null : null
      };
      const response = await TapNfc.rest('inventario_movimenti', {
        method: 'POST',
        headers: { Prefer: 'return=representation' },
        body: JSON.stringify(payload)
      });
      await readResponse(response);
      form.reset();
      const dateInput = form.querySelector('input[type="date"]');
      if (dateInput) dateInput.value = localDate();
      for (const input of form.querySelectorAll('input[type="number"]')) input.value = '';
      await refresh();
      showNotice(tipo === 'ordine' ? 'Ordine registrato e scorte aggiornate.' : 'Giacenza iniziale salvata. Da ora le vendite aggiornano automaticamente le quantità.', 'ok');
    } catch (error) {
      const message = String(error.message || 'Riprova.');
      if (tipo === 'apertura' && /duplicate|unique|inventario_movimenti_una_apertura/i.test(message)) {
        showNotice('La giacenza iniziale è già stata registrata da un altro operatore. Aggiorno i dati condivisi.', 'info');
        await refresh();
      } else {
        showNotice(message, 'error');
      }
    } finally {
      button.disabled = false;
      button.textContent = original || buttonLabel;
    }
  }
  openingForm.addEventListener('submit', event => {
    event.preventDefault();
    submitMovement(openingForm, 'apertura', 'Salva giacenza iniziale');
  });
  orderForm.addEventListener('submit', event => {
    event.preventDefault();
    submitMovement(orderForm, 'ordine', 'Registra ordine');
  });
  document.getElementById('refreshButton').addEventListener('click', refresh);
  window.addEventListener('focus', () => { if (currentUser) refresh(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden && currentUser) refresh(); });
  document.addEventListener('tapnfc:authenticated', event => {
    currentUser = event.detail?.user || null;
    if (currentUser) refresh();
  });
  (async () => {
    try {
      currentUser = await TapNfc?.getUser?.();
      if (currentUser) await refresh();
    } catch (error) {
      showNotice('Accesso non disponibile: ' + error.message, 'error');
    }
  })();
})();
