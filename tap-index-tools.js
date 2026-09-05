(() => {
  'use strict';
  if ((location.pathname.split('/').pop() || 'index.html') !== 'index.html') return;

  const params = new URLSearchParams(location.search);
  const duplicateCategory = (params.get('duplicateCategory') || '').trim();
  const duplicateFrom = (params.get('duplicateFrom') || '').trim();
  if (!duplicateCategory) return;

  const business = document.getElementById('business');
  const placeid = document.getElementById('placeid');
  const continueBtn = document.getElementById('continueBtn');
  const msg = document.getElementById('msg');
  const card = document.querySelector('.card');
  if (!business || !placeid || !continueBtn || !card) return;

  const note = document.createElement('div');
  note.className = 'tap-duplicate-note';
  note.innerHTML = '<strong>Nuovo cliente simile</strong><span>La categoria del cliente precedente verrà riutilizzata automaticamente. Inserisci solo la nuova attività e il suo Place ID.</span>';
  card.insertAdjacentElement('afterbegin', note);

  if (duplicateFrom) {
    business.placeholder = 'Nuova attività simile a ' + duplicateFrom;
  }

  const style = document.createElement('style');
  style.textContent = `
    .tap-duplicate-note{margin:0 0 24px;padding:15px 16px;border:1px solid #c9d9f2;border-radius:15px;background:linear-gradient(145deg,#f3f7ff,#fbfcff);color:#17385f}
    .tap-duplicate-note strong{display:block;margin-bottom:5px;font-size:14px;color:#174b9d}
    .tap-duplicate-note span{display:block;font-size:13px;line-height:1.45;color:#68758a}
  `;
  document.head.appendChild(style);

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

  continueBtn.addEventListener('click', event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const businessValue = business.value.trim();
    let placeIdValue = normalizePlaceIdInput(placeid.value);
    if (!businessValue) {
      msg.className = 'message show warn';
      msg.textContent = 'Inserisci il nome dell’attività.';
      return;
    }
    if (!placeIdValue) {
      msg.className = 'message show warn';
      msg.textContent = 'Inserisci il Google Place ID.';
      return;
    }
    if (/^https?:\/\//i.test(placeIdValue)) {
      msg.className = 'message show warn';
      msg.textContent = 'Il valore inserito non contiene un Place ID valido.';
      return;
    }

    placeid.value = placeIdValue;
    const reviewUrl = 'https://search.google.com/local/writereview?placeid=' + placeIdValue;
    const next = new URLSearchParams();
    next.set('reviewurl', reviewUrl);
    next.set('business', businessValue);
    next.set('placeid', placeIdValue);
    next.set('category', duplicateCategory);
    location.href = 'personalizza.html?' + next.toString();
  }, true);
})();
