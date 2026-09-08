(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || 'index.html') !== 'index.html') return;

  const CONFIG_SRC = 'tap-google-places-config.js?v=2';

  function loadScript(src, attrs = {}) {
    return new Promise((resolve, reject) => {
      const existing = [...document.scripts].find(s => s.src && s.src.includes(src.split('?')[0]));
      if (existing) {
        if (existing.dataset.loaded === '1') return resolve(existing);
        existing.addEventListener('load', () => resolve(existing), { once: true });
        existing.addEventListener('error', reject, { once: true });
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      Object.entries(attrs).forEach(([k, v]) => { if (v != null) s.setAttribute(k, v); });
      s.addEventListener('load', () => { s.dataset.loaded = '1'; resolve(s); }, { once: true });
      s.addEventListener('error', reject, { once: true });
      document.head.appendChild(s);
    });
  }

  function showMessage(text, type = 'warn') {
    const msg = document.getElementById('msg');
    if (!msg) return;
    msg.className = 'message show ' + type;
    msg.textContent = text;
  }

  function installStyles() {
    if (document.getElementById('tapPlacesStyles')) return;
    const style = document.createElement('style');
    style.id = 'tapPlacesStyles';
    style.textContent = `
      .tap-places-field{margin-bottom:16px}
      .tap-places-label{display:block;font-size:12px;font-weight:900;margin:0 0 8px;color:#34445a}
      .tap-places-shell{position:relative}
      .tap-places-status{margin-top:7px;font-size:11px;line-height:1.35;color:#748195}
      .tap-places-status.ok{color:#08735f;font-weight:800}
      .tap-places-status.warn{color:#8a6410}
      gmp-place-autocomplete{display:block;width:100%;min-height:56px}
      gmp-place-autocomplete::part(input){width:100%;height:56px;border:1.5px solid #cfdae7;border-radius:15px;background:#fff;color:#11243f;padding:0 16px;font:inherit;font-size:15px;outline:none}
      #placeid.tap-auto-filled{border-color:#9fd9c8;background:#f4fbf8;box-shadow:0 0 0 3px rgba(0,148,119,.08)}
      .tap-place-manual-note{margin:-8px 0 14px;font-size:10px;color:#8995a5}
    `;
    document.head.appendChild(style);
  }

  async function initPlaces() {
    try {
      if (!window.TapGooglePlacesConfig) await loadScript(CONFIG_SRC);
      const apiKey = String(window.TapGooglePlacesConfig?.apiKey || '').trim();
      if (!apiKey || apiKey.includes('INSERISCI_QUI')) {
        showMessage('Configura prima la chiave Google Maps nel file tap-google-places-config.js.');
        return;
      }

      installStyles();
      const business = document.getElementById('business');
      const placeid = document.getElementById('placeid');
      const grid = document.querySelector('#nuovo .field-grid');
      if (!business || !placeid || !grid) return;

      const oldToolField = [...grid.children].find(el => el.querySelector?.('.place-finder-btn'));
      const hostField = oldToolField || document.createElement('div');
      hostField.className = 'tap-places-field';
      hostField.innerHTML = '<label class="tap-places-label">Cerca attività su Google</label><div class="tap-places-shell" id="tapPlacesHost"></div><div class="tap-places-status" id="tapPlacesStatus">Inizia a scrivere e seleziona l’attività corretta.</div>';
      if (!oldToolField) grid.appendChild(hostField);

      const note = document.createElement('div');
      note.className = 'tap-place-manual-note';
      note.textContent = 'Il Place ID viene compilato automaticamente. Puoi modificarlo manualmente solo se necessario.';
      placeid.closest('.field')?.insertAdjacentElement('afterend', note);

      await loadScript('https://maps.googleapis.com/maps/api/js?key=' + encodeURIComponent(apiKey) + '&loading=async&libraries=places&v=weekly');
      const { PlaceAutocompleteElement } = await google.maps.importLibrary('places');
      const autocomplete = new PlaceAutocompleteElement({});
      autocomplete.placeholder = 'Es. Maxim Bar Palermo';
      const host = document.getElementById('tapPlacesHost');
      host.replaceChildren(autocomplete);

      const status = document.getElementById('tapPlacesStatus');
      autocomplete.addEventListener('gmp-select', async event => {
        try {
          const prediction = event.placePrediction;
          if (!prediction) return;
          const place = prediction.toPlace();
          await place.fetchFields({ fields: ['id', 'displayName', 'formattedAddress'] });
          if (!place.id) throw new Error('Place ID non disponibile');
          business.value = place.displayName || business.value || '';
          placeid.value = place.id;
          placeid.classList.add('tap-auto-filled');
          placeid.dispatchEvent(new Event('input', { bubbles: true }));
          if (status) {
            status.className = 'tap-places-status ok';
            status.textContent = '✓ Attività selezionata' + (place.formattedAddress ? ' · ' + place.formattedAddress : '');
          }
          const msg = document.getElementById('msg');
          if (msg) { msg.className = 'message'; msg.textContent = ''; }
        } catch (err) {
          console.error('[Tap Places select]', err);
          if (status) { status.className = 'tap-places-status warn'; status.textContent = 'Non riesco a leggere questa attività. Prova un altro risultato.'; }
        }
      });

      placeid.addEventListener('input', () => {
        if (!placeid.value.trim()) placeid.classList.remove('tap-auto-filled');
      });
    } catch (err) {
      console.error('[Tap Places]', err);
      showMessage('Ricerca Google non disponibile. Puoi comunque inserire manualmente il Place ID.');
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initPlaces, { once: true });
  else initPlaces();
})();
