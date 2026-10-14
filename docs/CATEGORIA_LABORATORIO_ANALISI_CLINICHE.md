# Categoria: Laboratorio analisi cliniche

Codice stabile: `laboratorioanalisi`
Creazione: 2026-10-14
Sfondo attuale: `Sfondolaboratorioanalisi.svg`, contenitore SVG 720 × 1280 con fotografia WebP incorporata (non più il precedente disegno vettoriale). Fotografia installata sul ramo `main` dal commit `4e76ac2f775eaac7a244635d18a7086e3dcab68e` del 2026-10-14, descritto nel commit come fotografia luminosa approvata. Il file PNG originale `laboratorio_clinico_moderno_e_luminoso.png` non è conservato separatamente nel repository.
Testo di default: "La tua esperienza conta per noi". Invito alla recensione basato su accoglienza, organizzazione e qualità del servizio.

## Integrazione effettuata
- Registro centrale: `tap-categories.js`. Categoria visibile nel selettore dinamico dell'editor.
- Compatibilità selezione statica: `personalizza.html`.
- Generazione anteprima col motore premium preesistente, senza creare nuovi renderer o sostituire quelli delle categorie storiche: `personalizza.html`.
- Modifica della categoria dalle schede cliente: `tap-clienti-tools.js`.
- Sezione potenziali clienti: passa `categoria_codice` a `personalizza.html` e usa la selezione da registro, senza un secondo elenco.
- Precaricamento sfondo: `tap-veterinario.js`.
- Percorsi di riserva quando non c'è composizione salvata: `cliente.html` e `demo.html` includono sfondo e testi della categoria.
- Recensioni Google: apertura esterna tramite link nativo; eccezione specifica nel listener analytics `tap-public-analytics.js`, senza alterare le altre categorie.
- Le composizioni definitive restano gestite dall'editor e da `manual-logo.html`, con template HTML salvato su Supabase e percorso NFC `tap.html`.

## Verifiche di repository aggiornate al 2026-10-14
- Commit fotografia `4e76ac2f775eaac7a244635d18a7086e3dcab68e` verificato come HEAD di `main`.
- Sfondo SVG esistente, con `image` incorporata in formato WebP e dimensioni 720 × 1280.
- Mappatura della categoria riscontrata in `tap-categories.js`, `personalizza.html`, `tap-clienti-tools.js`, `tap-veterinario.js`, `cliente.html` e `demo.html`.
- Gestione logo facoltativo in `tap-logo-optional.js` e interventi sull'editor in `tap-manual-logo-editor.js` riscontrati nel codice.
- NON verificati tramite sessione interattiva: resa visuale esatta dell'immagine, navigazione Torna, salvataggi su Supabase, link recensioni di un potenziale reale, anteprima contro link finale, test Android e deploy effettivamente servito da GitHub Pages.
- Questa verifica documentale non certifica il collaudo end-to-end.

## Verifiche eseguite
- File SVG presente nel repository.
- Codice categoria coerente in editor, menu modifica, preload e percorsi cliente/demo.
- Verifica sintattica JavaScript e script inline HTML completata senza errori nei file interessati.
- Versioni cache aggiornate nel caricamento dei moduli editor e analytics.
- Nessun intervento su database clienti, ordini, statistiche, inventario, pagine personalizzate pregresse o altre categorie.

## Cosa resta da verificare sul dispositivo reale
1. Aprire "Nuovo potenziale cliente" e scegliere "Laboratorio analisi cliniche".
2. Inserire un'attività di test con Place ID valido e link recensioni, evitando clienti paganti.
3. Aprire anteprima editor: grafica a schermo pieno, logo/didascalia/stelle/pulsante leggibili e modificabili, nessuna banda laterale.
4. Salvare composizione di test e confrontarla con il vero link `tap.html?c=...`.
5. Premere "Lascia una recensione": deve aprire Google con cinque stelle, senza 401.
6. Riaprire la scheda potenziale, cambiare categoria, riportarla a laboratorio, salvare e ricontrollare; ripetere con un cliente test se possibile.
7. Assicurarsi che Fumetti/Giochi e una pagina cliente storica continuino a funzionare.

NOTA: test statici non equivalgono al collaudo finale su Android. Non dichiarare completa la prova end-to-end prima di questi passaggi.
