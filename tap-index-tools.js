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

  function installStyles() {
    if (document.getElementById('tapPlacesAutocompleteStyle')) return;
    const style = document.createElement('style');
    style.id = 'tapPlacesAutocompleteStyle';
    style.textContent = `
      .tap-places-box{grid-column:1/-1;margin-bottom:3px;padding:16px;border:1px solid #cfe0f3;border-radius:18px;background:linear-gradient(145deg,#f8fbff,#f2f7ff)}
      .tap-places-head{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:11px}
      .tap-places-title{font-size:12px;font-weight:950;color:#173d70;letter-spacing:.02em}
      .tap-places-badge{padding:6px 9px;border-radius:999px;background:#e9f2ff;color:#145fc4;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em}
      .tap-places-help{margin-top:8px;color:#75859a;font-size:10px;line-height:1.35}
      .tap-places-state{display:flex;align-items:center;gap:8px;margin-top:10px;padding:9px 11px;border-radius:12px;background:#fff;border:1px solid #d9e5f3;color:#687991;font-size:10px;font-weight:800}
      .tap-places-state.ok{border-color:#b9e4d9;background:#effaf7;color:#08705d}
      .tap-places-state.warn{border-color:#efd79e;background:#fff9eb;color:#7b5a11}
      .tap-manual-wrap{grid-column:1/-1;border-top:1px dashed #d6e0ec;margin-top:3px;padding-top:12px}
      .tap-manual-toggle{appearance:none;border:0;background:transparent;color:#61758f;font:inherit;font-size:10px;font-weight:900;padding:3px 0;cursor:pointer;text-decoration:underline;text-underline-offset:3px}
      .tap-manual-fields{display:none;margin-top:12px}
      .tap-manual-fields.open{display:block}
      .tap-duplicate-note{grid-column:1/-1;margin:0 0 14px;padding:13px 14px;border:1px solid #c9d9f2;border-radius:15px;background:linear-gradient(145deg,#f3f7ff,#fbfcff);color:#17385f}
      .tap-duplicate-note strong{display:block;margin-bottom:4px;font-size:12px;color:#174b9d}
      .tap-duplicate-note span{display:block;font-size:10px;line-height:1.45;color:#68758a}
      gmp-place-autocomplete{display:block;width:100%}
      gmp-place-autocomplete::part(input){min-height:54px;border-radius:14px}
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
    const finder = card.querySelector('.place-finder-btn');
    const finderField = finder?.closest('.field');
    if (!grid || !businessField || !placeField || card.querySelector('.tap-manual-wrap')) return;

    const manual = document.createElement('div');
    manual.className = 'tap-manual-wrap';
    manual.innerHTML = '<button class="tap-manual-toggle" type="button">Inserimento manuale / Place ID</button><div class="tap-manual-fields"></div>';
    grid.appendChild(manual);
    const fields = manual.querySelector('.tap-manual-fields');
    fields.appendChild(businessField);
    fields.appendChild(placeField);
    if (finderField) finderField.remove();
    manual.querySelector('.tap-manual-toggle').addEventListener('click', () => fields.classList.toggle('open'));
  }

  function addAutocompleteShell() {
    const grid = card.querySelector('.field-grid');
    if (!grid || grid.querySelector('.tap-places-box')) return null;
    const box = document.createElement('div');
    box.className = 'tap-places-box';
    box.innerHTML = `
      <div class="tap-places-head"><div class="tap-places-title">Cerca attività su Google</div><div class="tap-places-badge">Automatico</div></div>
      <div id="tapPlacesHost"></div>
      <div class="tap-places-help">Scrivi il nome dell’attività e, se necessario, anche città o indirizzo. Seleziona il risultato corretto: nome e Place ID verranno compilati automaticamente.</div>
      <div id="tapPlacesState" class="tap-places-state">Preparazione ricerca Google…</div>`;
    grid.insertAdjacentElement('afterbegin', box);
    return box;
  }

  function setPlacesState(text, type = '') {
    const el = document.getElementById('tapPlacesState');
    if (!el) return;
    el.className = 'tap-places-state' + (type ? ' ' + type : '');
    el.textContent = text;
  }

  function loadScript(src, marker) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector(`script[data-${marker}]`);
      if (existing) {
        if (existing.dataset.loaded === '1') resolve();
        else {
          existing.addEventListener('load', resolve, { once: true });
          existing.addEventListener('error', reject, { once: true });
        }
        return;
      }
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.defer = true;
      script.dataset[marker.replace(/-([a-z])/g, (_, c) => c.toUpperCase())] = '1';
      script.addEventListener('load', () => { script.dataset.loaded = '1'; resolve(); }, { once: true });
      script.addEventListener('error', reject, { once: true });
      document.head.appendChild(script);
    });
  }

  async function loadConfig() {
    if (window.TapGooglePlacesConfig) return;
    await loadScript('tap-google-places-config.js?v=1', 'tap-google-places-config');
  }

  async function installAutocomplete() {
    addAutocompleteShell();
    try {
      await loadConfig();
      const apiKey = String(window.TapGooglePlacesConfig?.apiKey || '').trim();
      if (!apiKey || apiKey.includes('INSERISCI_QUI')) {
        setPlacesState('Configurazione API Google da completare. Puoi usare temporaneamente l’inserimento manuale.', 'warn');
        return;
      }

      await loadScript('https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(apiKey) + '&v=weekly&libraries=places&loading=async', 'tap-google-maps');
      if (!window.google?.maps?.importLibrary) throw new Error('Google Maps non disponibile');
      const placesLib = await google.maps.importLibrary('places');
      const PlaceAutocompleteElement = placesLib.PlaceAutocompleteElement || google.maps.places?.PlaceAutocompleteElement;
      if (!PlaceAutocompleteElement) throw new Error('Autocomplete non disponibile');

      const host = document.getElementById('tapPlacesHost');
      const autocomplete = new PlaceAutocompleteElement();
      autocomplete.id = 'tapPlaceAutocomplete';
      autocomplete.setAttribute('placeholder', 'Es. Maxim Bar Palermo');
      autocomplete.includedRegionCodes = ['it'];
      host.replaceChildren(autocomplete);
      setPlacesState('Ricerca Google pronta. Seleziona un’attività dai suggerimenti.', 'ok');

      const handleSelection = async event => {
        try {
          const prediction = event.placePrediction || event.detail?.placePrediction;
          let place = event.place || event.detail?.place || null;
          if (!place && prediction?.toPlace) place = prediction.toPlace();
          if (!place) throw new Error('Luogo non disponibile');
          if (typeof place.fetchFields === 'function') await place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress'] });
          const id = String(place.id || place.placeId || '').trim();
          const name = String(place.displayName || place.name || prediction?.mainText?.text || '').trim();
          if (!id) throw new Error('Place ID non disponibile');
          placeid.value = id;
          business.value = name || business.value;
          placeid.dispatchEvent(new Event('input', { bubbles: true }));
          business.dispatchEvent(new Event('input', { bubbles: true }));
          setPlacesState('✓ Selezionato: ' + (name || 'attività') + (place.formattedAddress ? ' · ' + place.formattedAddress : ''), 'ok');
          if (msg) { msg.className = 'message'; msg.textContent = ''; }
        } catch (err) {
          console.warn('Google Places selection error:', err);
          setPlacesState('Non sono riuscito a recuperare il Place ID. Prova un altro risultato o usa l’inserimento manuale.', 'warn');
        }
      };
      autocomplete.addEventListener('gmp-select', handleSelection);
      autocomplete.addEventListener('gmp-placeselect', handleSelection);
    } catch (err) {
      console.warn('Google Places initialization error:', err);
      setPlacesState('Ricerca Google non disponibile. Puoi continuare con l’inserimento manuale.', 'warn');
    }
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
