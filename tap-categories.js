(() => {
  'use strict';

  const categories = [
    { id:'standard', label:'Standard — collegamento diretto', description:'Collegamento diretto alla pagina recensioni Google. Nessun logo e nessuna pagina personalizzata richiesta.', customPage:false },
    { id:'abbigliamento', label:'Abbigliamento', background:'Sfondoabbigliamento.png', description:'Sfondo fotografico boutique premium + layout moda dedicato + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'autolavaggio', label:'Autolavaggio', background:'Sfondoautolavaggio.png', description:'Sfondo autolavaggio moderno + logo integrato nell’insegna superiore + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'bar', label:'Bar / Caffetterie', background:'Sfondobar.png', description:'Sfondo bar fisso + layout dedicato + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'barextra', label:'Bar extra', background:'Sfondobarextra.webp', title:'Le nostre specialità ti hanno conquistato?', accent:'#ead9bd', accent2:'#c9ae84', theme:'#18221f', description:'Bar multiservizio: caffè, pasticceria, gelato, rosticceria siciliana, aperitivi e cocktail + layout dedicato + 5 stelle + Powered by Tapreputa.' },
    { id:'barbershop', label:'Barber Shop', background:'Sfondobarbershop.jpg', description:'Sfondo barber moderno + stile deciso + pulsante premium + 5 stelle + Powered by Tapreputa.' },
    { id:'cartolibreria', label:'Cartolibreria', background:'Sfondocartolibreria.png', description:'Sfondo cartolibreria caldo + layout dedicato + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'centroestetico', label:'Centri estetici', background:'Sfondocentroestetico.jpg', description:'Sfondo wellness luminoso + stile raffinato + pulsante premium + 5 stelle + Powered by Tapreputa.' },
    { id:'detersivi', label:'Detersivi e casalinghi', background:'Sfondodetersivi.jpg', description:'Sfondo pulito e luminoso + layout dedicato + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'farmacia', label:'Farmacie', background:'Sfondofarmacia.jpg', description:'Sfondo farmacia luminoso + stile professionale + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'fitness', label:'Palestre / Fitness', background:'Sfondofitness.jpg', description:'Sfondo palestra moderno + stile energico + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'gelateria', label:'Gelaterie', background:'Sfondogelateria.jpg', description:'Sfondo gelateria luminoso + stile fresco + pulsante premium + 5 stelle + Powered by Tapreputa.' },
    { id:'gioielleria', label:'Gioielleria', background:'Sfondogioielleria.png', title:'La qualità e la cura dei nostri gioielli ti hanno conquistato?', accent:'#b9975b', accent2:'#7d6238', theme:'#8a744a', description:'Sfondo gioielleria premium + layout elegante dedicato + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'macelleria', label:'Macelleria', background:'Sfondomacelleria.png', title:'Freschezza e qualità della nostra carne ti hanno soddisfatto?', accent:'#8f2f2f', accent2:'#5f1717', theme:'#4a241f', description:'Sfondo macelleria premium + layout dedicato + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'ottica', label:'Ottica / vendita occhiali', background:'Sfondoottica.png', description:'Sfondo ottica moderno + layout elegante + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'panificio', label:'Panificio / Biscottificio', background:'Sfondopanificio.webp', description:'Sfondo artigianale caldo + layout dedicato + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'panineria_hamburgeria', label:'Panineria/Hamburgeria', background:'Sfondopanineria.png', title:'Panini e hamburger preparati con gusto: ti abbiamo conquistato?', accent:'#d9852f', accent2:'#9f4d18', theme:'#5b321d', description:'Sfondo panineria/hamburgeria premium + layout dedicato + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'parrucchiere', label:'Parrucchieri', background:'Sfondoparrucchiere.jpg', description:'Sfondo salone moderno + stile elegante + pulsante premium + 5 stelle + Powered by Tapreputa.' },
    { id:'pasticceria', label:'Pasticcerie', background:'Sfondopasticceria.jpg', description:'Sfondo elegante e goloso + stile caldo + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'pizzeria', label:'Pizzerie', background:'Sfondopizzeria.jpg', description:'Sfondo pizzeria con forno a legna + stile caldo + pulsante premium + 5 stelle + Powered by Tapreputa.' },
    { id:'polli_spiedo', label:'Polli allo spiedo', background:'SfondopollialloSpiedo.png', title:'Il nostro pollo allo spiedo ti ha conquistato?', accent:'#d8862f', accent2:'#9a4d19', theme:'#5a321f', description:'Sfondo polli allo spiedo + layout caldo dedicato + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'pub', label:'Pub / Cocktail bar', background:'Sfondopub.jpg', description:'Sfondo serale premium + stile blu/ambra + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'ristorante', label:'Ristoranti', background:'Sfondoristorante.png', description:'Sfondo ristorante fisso + layout elegante premium + 5 stelle + Powered by Tapreputa.' },
    { id:'ristorantemare', label:'Ristoranti Mare', background:'Sfondoristorantemare.png', description:'Sfondo ristorante mare fisso + stile mediterraneo + pulsante premium + 5 stelle + Powered by Tapreputa.' },
    { id:'stabilimento', label:'Stabilimenti balneari', background:'Sfondostabilimento.jpg', description:'Sfondo mare al tramonto + stile tropicale + pulsante premium + 5 stelle + Powered by Tapreputa.' },
    { id:'strumentimusicali', label:'Strumenti musicali', background:'Sfondostrumentimusicali.png', description:'Sfondo negozio di strumenti musicali + stile caldo e deciso + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'svapostore', label:'Svapo Store', background:'Sfondosvapostore.png', description:'Sfondo fotografico premium teal/viola + layout moderno dedicato + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'veterinario', label:'Veterinario', background:'Sfondoveterinario.png', title:'Il tuo amico a 4 zampe è stato bene con noi?', accent:'#3f8f73', accent2:'#23644f', theme:'#315e52', description:'Sfondo studio veterinario premium + layout dedicato + pulsante recensioni + 5 stelle + Powered by Tapreputa.' },
    { id:'yogurteria', label:'Yogurterie', background:'Sfondoyogurteria.jpg', description:'Sfondo luminoso turchese + layout fresco dedicato + pulsante recensioni + 5 stelle + Powered by Tapreputa.' }
  ];

  const aliases = Object.freeze({
    hamburgeria: 'panineria_hamburgeria'
  });

  const CLOSED_IDS = Object.freeze(categories.filter(item => item.id !== 'standard').map(item => item.id));
  const closedSet = new Set(CLOSED_IDS);
  const byId = Object.freeze(Object.fromEntries(categories.map(item => [item.id, Object.freeze({version:'1.0', closed:closedSet.has(item.id), approvedAt:'2026-09-06', ...item})])));
  const sorted = Object.freeze(categories.slice().sort((a,b) => {
    if (a.id === 'standard') return -1;
    if (b.id === 'standard') return 1;
    return a.label.localeCompare(b.label, 'it', { sensitivity:'base' });
  }).map(item => byId[item.id]));

  function normalizeId(id) {
    const value = String(id || '').trim();
    return aliases[value] || value;
  }

  function get(id) {
    return byId[normalizeId(id)] || null;
  }

  function templateVersion(id) {
    return get(id)?.version || '1.0';
  }

  function isClosed(id) {
    return Boolean(get(id)?.closed);
  }

  window.TapCategories = Object.freeze({
    list: sorted,
    byId,
    aliases,
    normalizeId,
    get,
    templateVersion,
    isClosed,
    closedIds: CLOSED_IDS,
    ids: Object.freeze(sorted.map(item => item.id))
  });
})();
