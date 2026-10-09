(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || '') !== 'personalizza.html' || !window.TapNfc) return;
  const add = document.getElementById('addClientBtn');
  const activity = document.getElementById('activityType');
  const finalLink = document.getElementById('finalLinkValue');
  const msg = document.getElementById('msg');
  if (!add || !activity || !finalLink) return;

  let saving = false;
  const params = new URLSearchParams(location.search);
  if(params.has('client')) return;
  const editing = params.get('potential');
  // Registered personalized prospects use the saved composition editor.
  // Standard prospects retain their direct Google link and proposal flow.
  if (editing && activity.value !== 'standard') return;
  if (params.get('mode') === 'potential' || editing) {
    const eyebrow = document.querySelector('main .eyebrow');
    if (eyebrow) eyebrow.textContent = editing ? 'Modifica potenziale' : 'Nuovo potenziale';
  }
  const button = document.createElement('button');
  button.id = 'savePotentialBtn';
  button.type = 'button';
  button.className = 'add-client';
  button.textContent = editing ? 'Salva modifiche potenziale' : 'Salva potenziale';
  button.style.cssText = 'background:#fff;color:#086b5a;border:2px solid #69bcab;min-height:56px';
  add.insertAdjacentElement('beforebegin', button);

  const style = document.createElement('style');
  style.textContent = '.tap-proposal-overlay{display:none;position:fixed;inset:0;z-index:100010;background:#061c36aa;align-items:center;justify-content:center;padding:16px}.tap-proposal-overlay.show{display:flex}.tap-proposal-modal{max-width:490px;width:100%;background:#fff;border-radius:22px;padding:22px;box-shadow:0 20px 60px #0004}.tap-proposal-modal h3{margin:0;color:#12344a}.tap-proposal-modal p{color:#5d7382;font-size:13px;line-height:1.45}.tap-proposal-fields{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.tap-proposal-fields label{display:block;font-size:11px;font-weight:800;color:#5c7083}.tap-proposal-fields input{width:100%;height:46px;margin-top:5px;border:1px solid #ccdae3;border-radius:10px;padding:8px;font:inherit}.tap-proposal-fields .total{grid-column:1/-1}.tap-proposal-actions{display:flex;gap:10px;margin-top:18px}.tap-proposal-actions button{flex:1;min-height:48px;border-radius:12px;font:inherit;font-weight:800}.tap-proposal-confirm{border:0;background:#006c59;color:white}.tap-proposal-cancel{border:1px solid #ccdae3;background:white}';
  document.head.appendChild(style);

  function warn(message) {
    msg.className = 'message show warn';
    msg.textContent = message;
  }
  function syncButton() {
    button.classList.toggle('show', Boolean(finalLink.textContent.trim() && activity.value));
    const standardProxy = document.getElementById('tapStandardAddClientBtn');
    if (standardProxy) standardProxy.textContent = 'Salva come cliente';
  }
  new MutationObserver(syncButton).observe(finalLink, {childList:true,characterData:true,subtree:true});
  new MutationObserver(() => {
    if (!add.disabled && add.textContent.trim() === '+ Aggiungi cliente') add.textContent = 'Salva come cliente';
  }).observe(add, {childList:true,characterData:true,subtree:true});
  activity.addEventListener('change', syncButton);
  syncButton();
  add.textContent = 'Salva come cliente';

  function askProposal(initial) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'tap-proposal-overlay show';
      overlay.innerHTML = '<div class="tap-proposal-modal" role="dialog" aria-modal="true" aria-label="Prodotti proposti"><h3>Salva potenziale</h3><p>Inserisci le quantità e l’importo proposti, se li conosci. Non saranno conteggiati come vendita.</p><div class="tap-proposal-fields"><div><label>Targhe<input data-field="targhe" type="number" min="0" step="1" inputmode="numeric"></label></div><div><label>Cards<input data-field="carte" type="number" min="0" step="1" inputmode="numeric"></label></div><div><label>Adesivi<input data-field="adesivi" type="number" min="0" step="1" inputmode="numeric"></label></div><div class="total"><label>Totale proposto €<input data-field="spesa" type="number" min="0" step="0.01" inputmode="decimal"></label></div></div><div class="tap-proposal-actions"><button class="tap-proposal-cancel" type="button">Annulla</button><button class="tap-proposal-confirm" type="button">Conferma</button></div></div>';
      document.body.appendChild(overlay);
      for (const key of ['targhe','carte','adesivi','spesa']) {
        const input = overlay.querySelector(`[data-field="${key}"]`);
        input.value = initial?.[key] || '';
      }
      function done(value) { overlay.remove(); document.removeEventListener('keydown', escape); resolve(value); }
      function escape(event) { if (event.key === 'Escape') done(null); }
      overlay.querySelector('.tap-proposal-cancel').onclick = () => done(null);
      overlay.onclick = event => { if (event.target === overlay) done(null); };
      overlay.querySelector('.tap-proposal-confirm').onclick = () => {
        const proposed = {};
        for (const key of ['targhe','carte','adesivi','spesa']) {
          const n = Number(overlay.querySelector(`[data-field="${key}"]`).value || 0);
          if (!Number.isFinite(n) || n < 0 || (key !== 'spesa' && !Number.isInteger(n))) {
            overlay.querySelector(`[data-field="${key}"]`).focus(); return;
          }
          proposed[key] = key === 'spesa' ? Math.round(n*100)/100 : n;
        }
        done(proposed);
      };
      document.addEventListener('keydown', escape);
    });
  }

  function currentLogo() {
    if (window.tapLogoSkipped || activity.value === 'standard') return null;
    try { return String(logoDataUrl || '') || null; }
    catch { return String(window.logoDataUrl || '') || null; }
  }

  async function restorePotential() {
    if (!editing) return;
    button.disabled = true;
    add.disabled = true;
    try {
      const user = await TapNfc.getUser();
      const p = await TapNfc.getPotential(editing);
      if (!p || p.created_by !== user?.id) throw new Error('La scheda non è disponibile per la modifica.');
      if (p.categoria_codice && activity.value !== p.categoria_codice) {
        activity.value = p.categoria_codice;
        activity.dispatchEvent(new Event('change', {bubbles:true}));
      }
      if (p.logo_data) {
        try { logoDataUrl = p.logo_data; } catch { window.logoDataUrl = p.logo_data; }
        window.tapLogoSkipped = false;
        const preview = document.getElementById('logoPreview');
        const img = document.getElementById('logoPreviewImg');
        if (img) img.src = p.logo_data;
        preview?.classList.add('show');
        const label = document.getElementById('logoName');
        if (label) label.textContent = 'Logo salvato';
      } else if (p.categoria_codice !== 'standard') {
        window.tapLogoSkipped = true;
        try { logoDataUrl = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw=='; } catch {}
        window.dispatchEvent(new CustomEvent('tap-logo-skip-change', {detail:{skipped:true,restored:true}}));
      }
      window.TapPotentialEdit = p;
      warn('Potenziale caricato. Controlla l’anteprima, rigenera il link e salva le modifiche.');
    } catch (error) {
      warn(error.message || 'Impossibile caricare il potenziale.');
      button.hidden = true;
      add.hidden = true;
    } finally {
      if (!button.hidden) button.disabled = false;
      if (!add.hidden) add.disabled = false;
    }
  }

  button.addEventListener('click', async () => {
    if (saving) return;
    const check = window.TapSystemChecks?.validateCurrentForm?.({requireGenerated:true});
    if (check && !check.ok) return warn(check.message);
    const stable = window.TapTemplateStability?.validateForSave?.();
    if (stable && !stable.ok) return warn(stable.message);
    const name = (new URLSearchParams(location.search).get('business') || '').trim();
    const reviewUrl = (document.getElementById('destinationUrl')?.value || '').trim();
    const link = finalLink.textContent.trim();
    if (!name || !activity.value || !reviewUrl || !link) return warn('Completa l’attività, la categoria e il link finale.');

    saving = true;
    button.disabled = true;
    try {
      const user = await TapNfc.getUser();
      if (!user) throw new Error('Sessione non disponibile.');
      const currentId = new URLSearchParams(location.search).get('potential');
      const old = currentId ? await TapNfc.getPotential(currentId) : null;
      if (currentId && (!old || old.created_by !== user.id)) throw new Error('Potenziale non modificabile.');
      const proposal = await askProposal(old);
      if (!proposal) return;

      const duplicateClient = (await TapNfc.listClients()).some(c => c.link_nfc === link || c.nome?.trim().toLocaleLowerCase('it') === name.toLocaleLowerCase('it'));
      if (duplicateClient) throw new Error('L’attività è già presente in «I miei clienti». Non verrà creata una scheda potenziale.');
      if (!currentId) {
        const duplicatePotential = (await TapNfc.listPotentials()).find(p => p.link_nfc === link || p.nome?.trim().toLocaleLowerCase('it') === name.toLocaleLowerCase('it'));
        if (duplicatePotential) throw new Error('Potenziale già presente: apri la scheda ' + 'P-' + String(duplicatePotential.potential_no).padStart(3,'0') + '.');
      }

      const values = {
        nome:name, operatore:TapNfc.operatorName(user),
        categoria:activity.options[activity.selectedIndex]?.textContent?.trim() || '',
        categoria_codice:activity.value,
        place_id:new URLSearchParams(location.search).get('placeid') || null,
        link_recensioni:reviewUrl, link_nfc:link, logo_data:currentLogo(),
        ...proposal, updated_by:user.id,updated_at:new Date().toISOString()
      };
      const potential = currentId
        ? await TapNfc.updatePotential(currentId, values)
        : await TapNfc.createPotential({...values,created_by:user.id});
      if (!potential?.id) throw new Error('Salvataggio non confermato dal database.');
      const url = new URL(location.href);
      url.searchParams.set('potential', potential.id);
      history.replaceState(null, '', url);
      window.TapPotentialEdit = potential;
      button.textContent = 'Potenziale salvato ✓';
      button.classList.add('show');
      const panel = document.createElement('div');
      panel.className = 'tap-save-success';
      panel.innerHTML = '<h3>Potenziale salvato</h3><p>La proposta è separata da clienti, vendite e scorte.</p>';
      const linkToCard = document.createElement('a');
      linkToCard.className = 'tap-open-card';
      linkToCard.href = 'potenziali.html?open=' + encodeURIComponent(potential.id);
      linkToCard.textContent = 'Apri scheda potenziale';
      panel.appendChild(linkToCard);
      document.getElementById('tapPotentialSuccess')?.remove();
      panel.id = 'tapPotentialSuccess';
      button.insertAdjacentElement('afterend', panel);
      msg.className = 'message show ok';
      msg.textContent = 'Potenziale registrato. I dati dei clienti paganti non sono stati modificati.';
    } catch (error) {
      warn('Potenziale non salvato: ' + (error.message || 'riprova.'));
    } finally { saving = false; button.disabled = false; }
  });

  restorePotential();
})();

