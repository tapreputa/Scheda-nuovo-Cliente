# Tapreputa — audit conservativo e congelamento operativo
Verifiche del 2026-10-09. Ambito: codice GitHub selezionato, schema e dati di Supabase, routing pagine personalizzate, giacenze e permessi. Nessuna modifica alle funzioni in produzione.

## Ripristino verificato
Branch: backup-stabile-2026-10-09
Commit di partenza: f2debf5ebd35f2a36d1d3e5b0251e91ce32695a2
Nota: questo è un riferimento completo al codice GitHub, NON un backup del database Supabase, dello storage o dell'APK Android. Richiede un backup separato per i dati.

## Riscontri verificati
- 11 clienti e 8 potenziali, nessun Place ID mancante, nessun link recensioni mancante; 19/19 link recensioni allineati al formato Place ID nel database.
- 10 tabelle applicative in public, RLS abilitata su tutte.
- 4 composizioni manual_logo_pages; 1 orfana: mamaia-burger-e-grill (da conservare fino a backup ed eventuale decisione di pulizia).
- 10 identificativi slug NFC fra gli 11 clienti: Friggitoria da Gaetano ha link NFC diretto a Google (modalità Standard); non è una collisione.
- Gacenze: 59 targhe, 100 card, 68 adesivi, spesa ordini 187 euro. Movimenti 2 ordini (63/110/68), 5 vendite (-5/-10/0), 1 rettifica (+1/0/0); somma torna con giacenza. Nessuna ripetizione di movimentazione per source_client_id nel raggruppamento esaminato.
- RLS inventario: modifica ed eliminazione ordine ristrette a identità Francesco, inserimento ordine consentito agli operatori autorizzati; occorre decidere se allineare INSERT, NON cambiare senza test.
- RPC pubblici: register_nfc_tap e get_public_client_by_slug concessi a anon; get_public_manual_logo_page a anon e authenticated; save_client_page_composition a authenticated.
- Percorso effettivo per composizioni salvate: tap.html → register_nfc_tap → manual-logo.html → get_public_manual_logo_page → HTML salvato, con tap-manual-page-viewport.js. Apertura recensioni esterna all'iframe.
- Test manuali dichiarati dall'utente: Funside Poseidon, Fimis Bar, Fresco Ristorante OK. Non generalizzare a tutti gli altri clienti.
- Ispezionati file centrali: index.html, personalizza.html, cliente.html, demo.html, manual-logo.html, tap.html, tap-auth.js, tap-nfc-analytics-ui.js, tap-fumetti-template.js, tap-logo-legibility.js, tap-public-analytics.js, tap-manual-page-viewport.js, tap-index-tools.js, tap-clienti-tools.js, tap-veterinario.js, tap-nfc-eraser.js.
- cliente.html e demo.html sono simili e corposi; non dimostrato che siano duplicati inutilizzati. Sono utilizzati dal routing in assenza di composizione manuale: NON ELIMINARE.
- Repository non inventariato esaustivamente: connettore non espone lista ricorsiva dei file; ricerca codici GitHub non ha restituito copertura utile. Vietato attribuire lo stato di 'inutilizzato' a file non analizzati.

## Risultati e limiti
Controlli statici e query coerenti non dimostrano assenza totale di bug. Non eseguiti: test su ogni categoria e su più dispositivi, test di scrittura/cancellazione tag NFC, verifica completa contabilità a confronto con documentazione esterna, snapshot di DB Supabase e Storage, build APK/release, fuzz/security audit, test di carico e monitoraggio live.
Nessuna pulizia automatica, modifiche SQL, migrazioni o modifiche dei template: tutti questi passi richiedono prova della dipendenza e strategia di rollback.

## Modalità manutenzione raccomandata
1. Considerare stabile il codice GitHub congelato nel branch backup.
2. Per nuove categorie seguire docs/PROCEDURA_CATEGORIE_STABILE.md.
3. Ogni nuova release: commit isolato, diff limitato, confronto anteprima-NFC reale, verifica pulsante Google e test di regressione su categoria storica.
4. Prima di eliminare file o record creare snapshot/referenze verificabili e documentare chiamanti.
5. Prima di cambiare policy RLS inventario concordare se Francesco è unico creatore di ordini oppure anche gli altri operatori possono crearli, e testare con ciascun account.
6. Pianificare backup Supabase DB e Storage con gli strumenti del progetto; non considerare il branch GitHub una copia dei dati.
