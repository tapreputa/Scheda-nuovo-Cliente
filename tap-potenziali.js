(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '') !== 'potenziali.html') return;

  const $ = id => document.getElementById(id);
  const money = value => new Intl.NumberFormat('it-IT', {style:'currency',currency:'EUR'}).format(Number(value) || 0);
  const date = value => value ? new Date(value).toLocaleDateString('it-IT') : '—';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  let user = null, potentials = [], selected = null, busy = false;

  function note(message, error = false) {
    let box = $('feedback');
    if (!box) {
      box = document.createElement('p');
      box.id = 'feedback';
      $('search').closest('.toolbar').insertAdjacentElement('afterend', box);
    }
    box.className = 'notice' + (error ? ' error' : '');
    box.textContent = message;
  }

  function isOwner(p) { return p && user && p.created_by === user.id; }
  function id(p) { return 'P-' + String(p.potential_no).padStart(3, '0'); }

  function render() {
    const search = String($('search').value || '').toLocaleLowerCase('it').trim();
    const filtered = potentials.filter(p => !search || [id(p), p.nome, p.operatore, p.categoria].join(' ').toLocaleLowerCase('it').includes(search));
    $('count').textContent = filtered.length + (filtered.length === 1 ? ' potenziale visualizzato' : ' potenziali visualizzati');
    $('rows').innerHTML = filtered.map(p => `<tr><td><strong>${escape(id(p))}</strong></td><td><strong>${escape(p.nome)}</strong></td><td>${escape(p.operatore)}</td><td>${escape(p.categoria || '—')}</td><td>${escape([p.targhe + ' targhe',p.carte + ' cards',p.adesivi + ' adesivi'].join(' · '))}</td><td>${escape(money(p.spesa))}</td><td>${escape(date(p.created_at))}</td><td><button class="secondary" type="button" data-open="${escape(p.id)}">Apri</button></td></tr>`).join('');
    $('empty').hidden = filtered.length > 0;
    for (const button of $('rows').querySelectorAll('[data-open]')) button.onclick = () => open(button.dataset.open);
  }

  async function refresh() {
    try {
      potentials = await TapNfc.listPotentials();
      render();
    } catch (error) {
      note('Impossibile caricare i potenziali: ' + error.message, true);
    }
  }

  function open(uuid) {
    selected = potentials.find(p => p.id === uuid) || null;
    if (!selected) return;
    $('potentialId').textContent = id(selected);
    $('modalTitle').textContent = selected.nome;
    for (const key of ['nome','operatore','categoria','place_id','link_recensioni','link_nfc','targhe','carte','adesivi','spesa']) {
      $(key).value = selected[key] ?? '';
    }
    $('created_at').value = date(selected.created_at);
    $('logoSaved').hidden = true;
    $('logoSaved').removeAttribute('src');
    $('logoMissing').hidden = false;
    const mine = isOwner(selected);
    $('ownership').textContent = mine ? 'Scheda modificabile da te.' : 'Scheda di ' + selected.operatore + ': disponibile in sola lettura.';
    for (const key of ['targhe','carte','adesivi','spesa']) $(key).disabled = !mine;
    for (const key of ['save','convert','delete']) $(key).disabled = !mine;
    $('overlay').classList.add('show');
    TapNfc.getPotential(uuid).then(full => {
      if (selected?.id !== uuid || !full?.logo_data) return;
      $('logoSaved').src = full.logo_data;
      $('logoSaved').hidden = false;
      $('logoMissing').hidden = true;
    }).catch(() => {});
  }

  function order() {
    const value = key => {
      const raw = $(key).value.trim();
      const n = Number(raw || 0);
      if (!Number.isFinite(n) || n < 0 || (key !== 'spesa' && !Number.isInteger(n))) {
        throw new Error('Controlla le quantità e l’importo della proposta.');
      }
      return n;
    };
    return {targhe:value('targhe'),carte:value('carte'),adesivi:value('adesivi'),spesa:Math.round(value('spesa')*100)/100};
  }

  async function execute(fn) {
    if (busy || !isOwner(selected)) return;
    busy = true;
    for (const key of ['save','convert','delete']) $(key).disabled = true;
    try { await fn(); }
    catch (error) { note(error.message || 'Operazione non riuscita.', true); }
    finally {
      busy = false;
      if (selected && isOwner(selected)) for (const key of ['save','convert','delete']) $(key).disabled = false;
    }
  }

  $('save').onclick = () => execute(async () => {
    const values = order();
    await TapNfc.updatePotential(selected.id, {...values, updated_by:user.id,updated_at:new Date().toISOString()});
    $('overlay').classList.remove('show');
    note('Proposta aggiornata. Clienti, vendite e scorte sono invariati.');
    await refresh();
  });

  $('convert').onclick = () => execute(async () => {
    const values = order();
    if (!confirm('Confermi la vendita di ' + selected.nome + ' per ' + money(values.spesa) + '?\nLe quantità saranno scalate dall’inventario e la scheda passerà in I miei clienti.')) return;
    const clientId = await TapNfc.convertPotential(selected.id, values);
    location.href = 'clienti.html?open=' + encodeURIComponent(clientId);
  });

  $('delete').onclick = () => execute(async () => {
    if (!confirm('Eliminare il potenziale ' + id(selected) + ' — ' + selected.nome + '?')) return;
    await TapNfc.deletePotential(selected.id);
    $('overlay').classList.remove('show');
    note('Potenziale eliminato. I clienti paganti non sono stati modificati.');
    await refresh();
  });

  $('preview').onclick = () => {
    if (!selected) return;
    location.href = 'index.html?potential=' + encodeURIComponent(selected.id) + '#nuovo';
  };
  $('copyReview').onclick = async () => {
    if (!selected?.link_recensioni) return note('Link recensioni non disponibile.', true);
    try { await navigator.clipboard.writeText(selected.link_recensioni); note('Link recensioni copiato.'); }
    catch { note('Copia non riuscita.', true); }
  };
  $('close').onclick = () => $('overlay').classList.remove('show');
  $('overlay').onclick = event => { if (event.target === $('overlay')) $('overlay').classList.remove('show'); };
  $('search').oninput = render;
  $('refresh').onclick = refresh;

  (async () => {
    user = await TapNfc.requireAuth();
    if (!user) return;
    TapNfc.decoratePage(user);
    await refresh();
    const requested = new URLSearchParams(location.search).get('open');
    if (requested) open(requested);
  })();
})();
