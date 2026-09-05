(() => {
  'use strict';

  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html') return;

  const addBtn = document.getElementById('addClientBtn');
  const msg = document.getElementById('msg');
  const activity = document.getElementById('activityType');
  const finalLinkValue = document.getElementById('finalLinkValue');
  const reviewInput = document.getElementById('destinationUrl');
  if (!addBtn || !activity || !window.TapNfc) return;

  let saving = false;

  const style = document.createElement('style');
  style.id = 'tap-save-ux-v1';
  style.textContent = `
    .tap-save-overlay{display:none;position:fixed;inset:0;z-index:100000;background:rgba(3,22,19,.5);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px);align-items:center;justify-content:center;padding:18px}
    .tap-save-overlay.show{display:flex}
    .tap-save-modal{width:min(94vw,470px);max-height:88vh;overflow:auto;background:#fff;border:1px solid #d8e5e1;border-radius:24px;padding:24px;box-shadow:0 26px 80px rgba(0,0,0,.28);font-family:Inter,ui-sans-serif,-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif}
    .tap-save-icon{width:52px;height:52px;border-radius:16px;background:#eaf8f4;display:grid;place-items:center;font-size:24px;margin:0 auto 13px}
    .tap-save-modal h3{margin:0;text-align:center;color:#102d28;font-size:23px;line-height:1.2}
    .tap-save-modal p{margin:10px 0 18px;text-align:center;color:#65736f;font-size:14px;line-height:1.45}
    .tap-save-summary{display:grid;gap:8px;margin:0 0 18px}
    .tap-save-row{padding:11px 12px;border:1px solid #e0e8e5;border-radius:13px;background:#f8fbfa}
    .tap-save-row b{display:block;margin-bottom:3px;color:#74817d;font-size:10px;letter-spacing:.08em;text-transform:uppercase}
    .tap-save-row span{display:block;color:#17342e;font-size:14px;font-weight:800;word-break:break-word}
    .tap-save-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .tap-save-actions button,.tap-save-actions a{min-height:52px;border-radius:14px;font:inherit;font-size:14px;font-weight:850;display:flex;align-items:center;justify-content:center;text-decoration:none;cursor:pointer}
    .tap-save-cancel{border:1px solid #cbd8d4;background:#fff;color:#31544d}
    .tap-save-confirm{border:0;background:#009477;color:#fff}
    .tap-save-warning{margin:0 0 16px;padding:12px 13px;border-radius:13px;background:#fff7e8;border:1px solid #f0d6a4;color:#7b5410;font-size:13px;line-height:1.45}
    .tap-save-success{margin-top:16px;padding:18px;border:1px solid #b8e4d8;border-radius:18px;background:#f0fbf7;animation:tapSaveReveal .22s ease-out}
    .tap-save-success h3{margin:0 0 6px;color:#08735f;font-size:19px}
    .tap-save-success p{margin:0 0 14px;color:#5e716b;font-size:13px;line-height:1.45}
    .tap-save-success-actions{display:grid;grid-template-columns:1fr 1fr;gap:10px}
    .tap-save-success-actions a{min-height:48px;border-radius:13px;display:flex;align-items:center;justify-content:center;text-decoration:none;font-size:13px;font-weight:900}
    .tap-new-client{background:#003c33;color:#fff}.tap-client-list{background:#fff;color:#08735f;border:1px solid #b8ddd3}
    @keyframes tapSaveReveal{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    @media(max-width:520px){.tap-save-actions,.tap-save-success-actions{grid-template-columns:1fr}.tap-save-modal{padding:20px;border-radius:20px}}
  `;
  document.head.appendChild(style);

  function esc(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
  }

  function collect() {
    const params = new URLSearchParams(location.search);
    const option = activity.options[activity.selectedIndex];
    return {
      businessName: (params.get('business') || '').trim(),
      placeId: (params.get('placeid') || '').trim(),
      reviewUrl: (reviewInput?.value || '').trim(),
      finalNfcUrl: (finalLinkValue?.textContent || '').trim(),
      categoryCode: activity.value || '',
      categoryText: option?.textContent?.trim() || '',
      logoState: window.tapLogoSkipped ? 'Senza logo' : ((document.getElementById('logoFile')?.files?.[0]) ? 'Logo caricato' : 'Non specificato')
    };
  }

  function warn(text) {
    if (!msg) return;
    msg.className = 'message show warn';
    msg.textContent = text;
  }

  function ensureOverlay() {
    let overlay = document.getElementById('tapSaveOverlay');
    if (overlay) return overlay;
    overlay = document.createElement('div');
    overlay.id = 'tapSaveOverlay';
    overlay.className = 'tap-save-overlay';
    document.body.appendChild(overlay);
    return overlay;
  }

  function ask({title, text, rows = [], warning = '', confirmText = 'Conferma', icon = '✓'}) {
    return new Promise(resolve => {
      const overlay = ensureOverlay();
      overlay.innerHTML = `<div class="tap-save-modal" role="dialog" aria-modal="true"><div class="tap-save-icon">${esc(icon)}</div><h3>${esc(title)}</h3><p>${esc(text)}</p>${warning ? `<div class="tap-save-warning">${esc(warning)}</div>` : ''}<div class="tap-save-summary">${rows.map(r => `<div class="tap-save-row"><b>${esc(r[0])}</b><span>${esc(r[1] || '-')}</span></div>`).join('')}</div><div class="tap-save-actions"><button type="button" class="tap-save-cancel">Annulla</button><button type="button" class="tap-save-confirm">${esc(confirmText)}</button></div></div>`;
      overlay.classList.add('show');
      const cancel = overlay.querySelector('.tap-save-cancel');
      const confirm = overlay.querySelector('.tap-save-confirm');
      const finish = value => {
        overlay.classList.remove('show');
        document.removeEventListener('keydown', onKey);
        resolve(value);
      };
      const onKey = e => { if (e.key === 'Escape') finish(false); };
      cancel.onclick = () => finish(false);
      confirm.onclick = () => finish(true);
      overlay.onclick = e => { if (e.target === overlay) finish(false); };
      document.addEventListener('keydown', onKey);
      setTimeout(() => confirm.focus(), 0);
    });
  }

  function normalize(value) {
    return String(value || '').trim().toLocaleLowerCase('it');
  }

  async function findDuplicate(data) {
    const all = await TapNfc.listClients();
    return all.find(c =>
      (data.finalNfcUrl && String(c.link_nfc || '').trim() === data.finalNfcUrl) ||
      (data.businessName && normalize(c.nome) === normalize(data.businessName))
    ) || null;
  }

  function showSuccess(data, updated) {
    addBtn.textContent = updated ? 'Cliente aggiornato ✓' : 'Cliente salvato ✓';
    addBtn.disabled = true;
    let panel = document.getElementById('tapSaveSuccess');
    if (!panel) {
      panel = document.createElement('div');
      panel.id = 'tapSaveSuccess';
      panel.className = 'tap-save-success';
      addBtn.insertAdjacentElement('afterend', panel);
    }
    panel.innerHTML = `<h3>${updated ? 'Cliente aggiornato correttamente' : 'Cliente salvato correttamente'}</h3><p><strong>${esc(data.businessName)}</strong> è presente nel database condiviso.</p><div class="tap-save-success-actions"><a class="tap-new-client" href="index.html">＋ Nuovo cliente</a><a class="tap-client-list" href="clienti.html">I miei clienti</a></div>`;
    if (msg) {
      msg.className = 'message show ok';
      msg.textContent = updated ? 'Scheda cliente aggiornata nel database condiviso.' : 'Cliente salvato nel database condiviso.';
    }
    panel.scrollIntoView({behavior:'smooth', block:'nearest'});
  }

  async function handleSave(event) {
    if (saving) {
      event.preventDefault();
      event.stopImmediatePropagation();
      return;
    }

    event.preventDefault();
    event.stopImmediatePropagation();

    const data = collect();
    if (!data.businessName) return warn('Nome attività non disponibile.');
    if (!data.reviewUrl) return warn('Link recensioni non disponibile.');
    if (!data.finalNfcUrl) return warn('Genera prima il link finale.');
    if (!data.categoryCode) return warn('Seleziona la tipologia di attività.');

    const confirmed = await ask({
      title: 'Conferma salvataggio',
      text: 'Controlla i dati principali prima di aggiungere il cliente.',
      confirmText: 'Salva cliente',
      rows: [
        ['Attività', data.businessName],
        ['Categoria', data.categoryText],
        ['Logo', data.logoState],
        ['Link NFC', data.finalNfcUrl]
      ]
    });
    if (!confirmed) return;

    saving = true;
    addBtn.disabled = true;
    addBtn.textContent = 'Controllo cliente...';

    try {
      const user = await TapNfc.getUser();
      if (!user) throw new Error('Sessione non disponibile.');

      const duplicate = await findDuplicate(data);
      let updateExisting = false;
      if (duplicate) {
        const proceed = await ask({
          title: 'Cliente già presente',
          text: 'Ho trovato una scheda compatibile nel database.',
          warning: 'Per evitare duplicati non verrà creata una seconda scheda. Se prosegui, quella esistente verrà aggiornata.',
          confirmText: 'Aggiorna esistente',
          icon: '⚠',
          rows: [
            ['Cliente trovato', duplicate.nome || data.businessName],
            ['Categoria attuale', duplicate.categoria || '-'],
            ['Operatore', duplicate.operatore || '-']
          ]
        });
        if (!proceed) {
          addBtn.disabled = false;
          addBtn.textContent = '+ Aggiungi cliente';
          saving = false;
          return;
        }
        updateExisting = true;
      }

      addBtn.textContent = updateExisting ? 'Aggiornamento...' : 'Salvataggio...';
      await TapNfc.upsertBusinessClient({
        nome: data.businessName,
        categoria: data.categoryText,
        categoria_codice: data.categoryCode,
        place_id: data.placeId,
        link_recensioni: data.reviewUrl,
        link_nfc: data.finalNfcUrl,
        stato: 'Da consegnare'
      }, user);

      showSuccess(data, updateExisting);
    } catch (err) {
      console.error(err);
      addBtn.disabled = false;
      addBtn.textContent = '+ Aggiungi cliente';
      warn('Errore durante il salvataggio condiviso: ' + (err.message || 'riprova.'));
    } finally {
      saving = false;
    }
  }

  document.addEventListener('click', event => {
    const target = event.target.closest('#addClientBtn');
    if (!target) return;
    handleSave(event);
  }, true);
})();
