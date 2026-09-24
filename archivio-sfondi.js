(() => {
  'use strict';

  const categories = [
    ['Abbigliamento','Sfondoabbigliamento.png'],
    ['Autolavaggio','Sfondoautolavaggio.png'],
    ['B&B Isola','Sfondohotel.png'],
    ['Bar / Caffetterie','Sfondobar.png'],
    ['Bar extra','Sfondobarextra.webp?v=20260911-0035'],
    ['Barber Shop','Sfondobarbershop.jpg'],
    ['Cartolibreria','Sfondocartolibreria.png'],
    ['Centri estetici','Sfondocentroestetico.jpg'],
    ['Detersivi e casalinghi','Sfondodetersivi.jpg'],
    ['Enoteca','Sfondoenoteca.png'],
    ['Farmacie','Sfondofarmacia.jpg'],
    ['Fioraio','Sfondofioraio.png'],
    ['Fotografo','Sfondofotografo.png?v=20260918-hq-original'],
    ['Gelaterie','Sfondogelateria.jpg'],
    ['Gioielleria','Sfondogioielleria.png'],
    ['Hotel Isola','Sfondohotel.png'],
    ['Lavanderia','Sfondolavanderia.png'],
    ['Macelleria','Sfondomacelleria.png'],
    ['Negozio di animali / Pet Food','Sfondopetfood.png'],
    ['Ottica / vendita occhiali','Sfondoottica.png'],
    ['Palestre / Fitness','Sfondofitness.jpg'],
    ['Panificio / Biscottificio','Sfondopanificio.webp'],
    ['Panineria / Hamburgeria','Sfondopanineria.png'],
    ['Parrucchieri','Sfondoparrucchiere.jpg'],
    ['Pasticcerie','Sfondopasticceria.jpg'],
    ['Pizzerie','Sfondopizzeria.jpg'],
    ['Polli allo spiedo','SfondopollialloSpiedo.png'],
    ['Pub / Cocktail bar','Sfondopub.jpg'],
    ['Ristoranti','Sfondoristorante.png'],
    ['Ristoranti Mare','Sfondoristorantemare.png'],
    ['Stabilimenti balneari','Sfondostabilimento.jpg'],
    ['Studio tatuaggi','Sfondostudiotatuaggi.png'],
    ['Strumenti musicali','Sfondostrumentimusicali.png'],
    ['Svapo Store','Sfondosvapostore.png'],
    ['Toelettatura cani','Sfondotoelettaturacani.png'],
    ['Veterinario','Sfondoveterinario.png'],
    ['Yogurterie','Sfondoyogurteria.jpg']
  ].map(([name, image], index) => ({ name, image, index }));

  const grid = document.getElementById('backgroundGrid');
  const search = document.getElementById('backgroundSearch');
  const count = document.getElementById('visibleCount');
  const viewer = document.getElementById('backgroundViewer');
  const viewerImage = document.getElementById('viewerImage');
  const viewerTitle = document.getElementById('viewerTitle');
  const viewerIndex = document.getElementById('viewerIndex');
  let visible = categories.slice();
  let current = 0;
  let touchStart = 0;

  function escapeHtml(value) {
    return String(value).replace(/[&<>'"]/g, char => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
  }

  function render() {
    count.textContent = visible.length;
    if (!visible.length) {
      grid.innerHTML = '<div class="empty"><strong>Nessuna categoria trovata.</strong><br>Prova con un nome diverso.</div>';
      return;
    }
    grid.innerHTML = visible.map((item, index) => `
      <button class="background-card" type="button" data-index="${index}" aria-label="Apri ${escapeHtml(item.name)} a schermo intero">
        <div class="image-wrap"><img src="${escapeHtml(item.image)}" alt="Sfondo ${escapeHtml(item.name)}" loading="lazy" decoding="async"><span class="quality">ORIGINALE</span></div>
        <div class="card-body"><div class="category-name">${escapeHtml(item.name)}</div><div class="view-label"><span>Visualizza a schermo intero</span><span>→</span></div></div>
      </button>`).join('');
    grid.querySelectorAll('.background-card').forEach(button => button.addEventListener('click', () => openViewer(Number(button.dataset.index))));
  }

  function showCurrent() {
    const item = visible[current];
    if (!item) return closeViewer();
    viewerImage.src = item.image;
    viewerImage.alt = 'Sfondo ' + item.name;
    viewerTitle.textContent = item.name;
    viewerIndex.textContent = (current + 1) + ' di ' + visible.length;
  }

  function openViewer(index) {
    current = index;
    showCurrent();
    viewer.classList.add('show');
    document.body.style.overflow = 'hidden';
    document.getElementById('viewerClose').focus();
  }

  function closeViewer() {
    viewer.classList.remove('show');
    document.body.style.overflow = '';
    viewerImage.removeAttribute('src');
  }

  function move(step) {
    if (!visible.length) return;
    current = (current + step + visible.length) % visible.length;
    showCurrent();
  }

  search.addEventListener('input', () => {
    const query = search.value.trim().toLocaleLowerCase('it');
    visible = query ? categories.filter(item => item.name.toLocaleLowerCase('it').includes(query)) : categories.slice();
    render();
  });
  document.getElementById('viewerClose').addEventListener('click', closeViewer);
  document.getElementById('viewerPrev').addEventListener('click', () => move(-1));
  document.getElementById('viewerNext').addEventListener('click', () => move(1));
  viewer.addEventListener('click', event => { if (event.target === viewer) closeViewer(); });
  viewer.addEventListener('touchstart', event => { touchStart = event.changedTouches[0]?.clientX || 0; }, { passive:true });
  viewer.addEventListener('touchend', event => { const end = event.changedTouches[0]?.clientX || 0; const distance = end - touchStart; if (Math.abs(distance) > 55) move(distance > 0 ? -1 : 1); }, { passive:true });
  document.addEventListener('keydown', event => {
    if (!viewer.classList.contains('show')) return;
    if (event.key === 'Escape') closeViewer();
    if (event.key === 'ArrowLeft') move(-1);
    if (event.key === 'ArrowRight') move(1);
  });

  render();
})();
