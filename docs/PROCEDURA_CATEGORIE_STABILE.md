# TAPREPUTA — Procedura stabile per nuove categorie e controllo finale
Data di riferimento: 2026-10-09. Documento operativo; non esegue codice.

## Regola fondamentale
Non ricostruire o modificare l'app per aggiungere una categoria se il meccanismo esistente può riutilizzare un template. Separare SEMPRE: aspetto della pagina, Place ID/link recensioni, pagina salvata, link NFC.
Per clienti/potenziali con composizione manuale salvata, il percorso effettivo è:
tap.html?c=SLUG → RPC register_nfc_tap → manual-logo.html?c=SLUG → RPC get_public_manual_logo_page → HTML salvato su manual_logo_pages → tap-manual-page-viewport.js.
Non giudicare la pagina definitiva aprendo soltanto cliente.html. Se non esiste una composizione salvata, il router può utilizzare cliente.html (cliente) o demo.html (potenziale); la categoria standard può andare direttamente su Google.
Le composizioni già salvate sono la fonte autorevole dell'aspetto pubblicato. Evitare script o CSS che le sovrascrivono.

## Prima di aggiungere una categoria
1. Controllare se esiste già categoria equivalente; usare codice slug minuscolo e stabile, senza spazi. Evitare doppioni.
2. Registrare nome visibile, codice tecnico, file sfondo, titolo, didascalia e classe CSS nel registro categorie già esistente; NON creare mapping alternativo o generazione separata senza motivo.
3. Verificare nell'attuale flusso UI la selezione categoria, Personalizza, anteprima, pubblicazione, recupero in Modifica cliente, demo/potenziale e pagina definitiva. Controllare le dipendenze caricate dinamicamente da tap-auth.js, tap-clienti-tools.js e gli eventuali moduli di editor.
4. Caricare soltanto gli asset approvati. Immagine dello sfondo ottimizzata e adeguata per verticale; evitare duplicati inutili. Non generare immagini salvo richiesta esplicita dell'utente.
5. Usare il componente esistente per logo, testo, stelle e pulsante. Le posizioni/scale definite in anteprima devono essere SALVATE nell'HTML finale (composizione) e recuperate senza nuove regole CSS incompatibili.
6. Il pulsante recensioni non è specifico della categoria: usare il Place ID corretto e il formato https://search.google.com/local/writereview?placeid=PLACE_ID. Non usare Google Maps Search come URL di scrittura recensioni. Google deve aprirsi fuori dall'iframe di manual-logo (target=_blank, rel=noopener noreferrer); l'iframe conserva sandbox con allow-popups e allow-popups-to-escape-sandbox. Non sostituire il click con ritardi o navigazione nell'iframe.
7. Non cambiare mai un link NFC consegnato. Il router tap.html e i dati cliente già esistenti rimangono intatti.
8. Per il test creare prima un POTENZIALE, senza vendite o consumo inventario; cercare attività reale, confermare Place ID, scegliere la categoria, configurare e SALVARE composizione, confrontare anteprima e pagina NFC reale.
9. Test da Android: pagina intera senza bande, logo coerente, didascalia/sfondo/stelle/bottone identici, apertura Google cinque stelle, nessun 401, prova anche dopo refresh e browser esterno.
10. Test regressione: almeno un cliente pagante con composizione salvata e una categoria storica; verificare che NFC e Google non siano cambiati. Testare Modifica cliente: riaprire, modificare e salvare solo sul record test; riconfermare anteprima=finale.
11. Per ogni cambiamento: verificare stato repository/deployment, diff limitato ai file necessari, versione cache degli asset aggiornata in tutte le pagine coinvolte, rollback documentato. Non applicare correzioni globali ai loghi senza validare tutte le categorie.
12. Al termine documentare nuova categoria nel registro, file coinvolti, commit, test svolti, risultato e link NFC test; non considerare completa finché il test reale su telefono non è riuscito.

## Checklist pre-rilascio / invarianti
- [ ] I clienti già esistenti non sono modificati; nessun link NFC cambia.
- [ ] Nessun record di vendita, giacenza, costo o ordine toccato.
- [ ] Le pagine manual_logo_pages restano immutate, salvo salvataggio autorizzato della singola composizione.
- [ ] Anteprima e composizione finale coincidono in dimensioni e layout.
- [ ] Recensioni: link diretto Place ID, Google fuori dall'iframe, nessun 401.
- [ ] Operatori: autorizzazioni lato database, non solo pulsanti UI.
- [ ] Nessuna cancellazione di asset/file senza verifica referenze e backup.
- [ ] Fumo test su cliente reale e potenziale; risultati documentati.

## Rischi noti dall'audit 2026-10-09 — NON correggere alla cieca
- manual_logo_pages contiene composizione orfana mamaia-burger-e-grill (non cliente/potenziale): candidata ad archiviazione, NON eliminare senza backup.
- L'INSERT su inventario_movimenti per tipo 'ordine' è consentito dalle policy agli operatori autorizzati; UPDATE/DELETE ordine sono limitati a Francesco. Verificare il requisito di inserimento ordine prima di cambiare RLS.
- Pagine cliente.html e demo.html sono grandi e simili ma potrebbero avere utilizzi diversi; NON cancellarle come 'duplicati' senza mappare chiamanti/route.
- I file JS/CSS di varie generazioni possono essere tuttora referenziati dinamicamente; verificare prima di cancellare.
- Verifica database non equivale a certificazione end-to-end su Android.
- Per il test dei clienti salvati, il link canonico è tap.html?c=SLUG, non cliente.html?c=SLUG.
