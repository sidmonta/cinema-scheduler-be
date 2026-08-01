# Progetto: Gestionale Palinsesto Cinema Multisala — Backend

Repository di riferimento: `cinema-scheduler-be`
Stack: Node.js, TypeScript, Express 5, Zod 4, Drizzle ORM, PostgreSQL, Redis, Vitest, OpenAPI/Swagger

Le issue sono ordinate per essere lavorate in sequenza. Ogni issue è pensata per essere chiusa con una PR singola. Le stime sono indicative per un developer junior.

---

## Milestone 1 — Setup progetto

### Issue #1 — Setup iniziale del progetto
**Labels**: `setup`, `good-first-issue`
**Stima**: 0.5g

**Descrizione**
Inizializzare il repository con la struttura base del progetto TypeScript/Node.

**Task**
- [ ] Init progetto npm, TypeScript con `tsconfig.json` in modalità `strict`
- [ ] Setup ESLint + Prettier con config condivisa
- [ ] Struttura cartelle a layer: `src/{routes,controllers,services,repositories,schemas,db,config,middlewares}`
- [ ] Script `npm run dev` (con watch), `build`, `lint`, `typecheck`
- [ ] `.env.example` con variabili di configurazione (DB, Redis, JWT secret, porta)
- [ ] README con istruzioni di setup locale

**Criteri di accettazione**
- `npm run typecheck` passa senza errori su progetto vuoto
- `npm run lint` non riporta warning
- Il progetto parte in locale con `npm run dev`

---

### Issue #2 — Setup database PostgreSQL con Drizzle
**Labels**: `setup`, `database`
**Stima**: 1g
**Dipende da**: #1

**Descrizione**
Configurare la connessione a PostgreSQL e Drizzle ORM, con la prima migration per le entità base del dominio (Cinema, Sala, Film).

**Task**
- [ ] Setup client Drizzle + pool di connessione PostgreSQL
- [ ] Configurare `drizzle-kit` per generazione/esecuzione migration
- [ ] Schema Drizzle per `cinema`, `sala` (con riferimento a cinema, capienza, righe/colonne), `film` (titolo, durata minuti, genere, rating età)
- [ ] Prima migration generata ed eseguibile
- [ ] Docker Compose con Postgres per sviluppo locale

**Criteri di accettazione**
- `docker-compose up` avvia un Postgres funzionante
- La migration si applica senza errori su db vuoto
- Esiste uno script npm per eseguire le migration (`db:migrate`)

**Note tecniche**
Usare tipi Drizzle nativi per i timestamp, non stringhe. Il campo capienza sala deve essere coerente con la griglia righe/colonne (es. capienza = righe × colonne, oppure validata a livello applicativo).

---

### Issue #3 — Error handling centralizzato (Express 5)
**Labels**: `setup`, `backend`
**Stima**: 0.5g
**Dipende da**: #1

**Descrizione**
Implementare un middleware di gestione errori centralizzato, sfruttando la nuova gestione automatica dei reject nelle route async introdotta in Express 5.

**Task**
- [ ] Definire una gerarchia di errori applicativi (`AppError`, `NotFoundError`, `ValidationError`, `ConflictError`, ...) con status HTTP associato
- [ ] Middleware di error handling che intercetta questi errori e produce risposta JSON coerente (`{ error: { code, message, details? } }`)
- [ ] Verificare che un errore lanciato dentro una route `async` venga correttamente catturato senza try/catch esplicito (comportamento nuovo di Express 5)
- [ ] Handler per rotte non trovate (404)

**Criteri di accettazione**
- Una route di test che lancia un errore async senza try/catch restituisce risposta 500 gestita, non crash del processo
- Il formato di errore è documentato nel README

---

## Milestone 2 — CRUD base e validazione

### Issue #4 — CRUD Film
**Labels**: `feature`, `backend`
**Stima**: 1g
**Dipende da**: #2, #3

**Descrizione**
Implementare le API CRUD per l'entità Film.

**Task**
- [ ] Repository `FilmRepository` (query Drizzle: create, findById, findAll con paginazione, update, delete)
- [ ] Schema Zod per input di creazione/update film (titolo obbligatorio, durata minuti positiva, genere da enum chiuso, rating età da enum)
- [ ] Service `FilmService` con la business logic (nessuna logica particolare qui, ma deve restare separato dal controller)
- [ ] Controller + routing Express: `POST /films`, `GET /films`, `GET /films/:id`, `PATCH /films/:id`, `DELETE /films/:id`
- [ ] Middleware di validazione generico che usa lo schema Zod sul body/query/params

**Criteri di accettazione**
- Tutti gli endpoint rispondono con status code corretti (201 su create, 200 su get/update, 204 su delete, 404 su film inesistente)
- Un payload non valido (es. durata negativa) restituisce 400 con dettaglio dell'errore di validazione Zod
- Il tipo TypeScript dell'input è derivato dallo schema Zod (`z.infer`), non duplicato a mano

---

### Issue #5 — CRUD Sale
**Labels**: `feature`, `backend`
**Stima**: 0.5g
**Dipende da**: #4

**Descrizione**
Stessa logica dell'issue #4 applicata all'entità Sala. Issue volutamente ripetitiva: obiettivo è consolidare il pattern CRUD prima di passare a logica più complessa.

**Task**
- [ ] `SalaRepository`, `SalaSchema` Zod, `SalaService`, controller e routing
- [ ] Endpoint `GET /cinemas/:cinemaId/sale` per elenco sale di un cinema

**Criteri di accettazione**
- Stessi criteri dell'issue #4, adattati a Sala
- Creare una sala con cinema inesistente restituisce 400/404 (foreign key gestita a livello applicativo, non solo DB)

---

### Issue #6 — Documentazione OpenAPI generata da Zod
**Labels**: `feature`, `docs`
**Stima**: 1g
**Dipende da**: #5

**Descrizione**
Esporre la documentazione OpenAPI delle API esistenti generandola dagli schemi Zod, per avere un'unica fonte di verità tra validazione runtime e contratto API.

**Task**
- [ ] Integrare `@asteasolutions/zod-to-openapi` (o equivalente) nel progetto
- [ ] Registrare gli schemi Film e Sala con i relativi metadati OpenAPI
- [ ] Generare lo spec OpenAPI 3.1 ed esporlo su `/openapi.json`
- [ ] Montare Swagger UI su `/docs`

**Criteri di accettazione**
- `/docs` mostra la documentazione interattiva di tutti gli endpoint Film e Sala
- Modificando uno schema Zod, lo spec OpenAPI si aggiorna senza duplicare la definizione a mano

---

## Milestone 3 — Proiezioni e business logic

### Issue #7 — Creazione Proiezione con controllo sovrapposizioni
**Labels**: `feature`, `backend`, `business-logic`
**Stima**: 1.5g
**Dipende da**: #6

**Descrizione**
Implementare la creazione di una Proiezione (film + sala + orario), impedendo che due proiezioni nella stessa sala si sovrappongano temporalmente. L'orario di fine si calcola dalla durata del film più un buffer fisso di pulizia sala (es. 15 minuti), configurabile.

**Task**
- [ ] Schema Drizzle per `proiezione` (film, sala, data/ora inizio; data/ora fine calcolata e persistita)
- [ ] Zod schema per la richiesta di creazione (film id, sala id, data/ora inizio)
- [ ] Query Drizzle di overlap check: nessuna proiezione esistente nella stessa sala deve avere un intervallo `[inizio, fine]` che si sovrappone al nuovo intervallo
- [ ] In caso di sovrapposizione, restituire un errore applicativo dedicato (`ConflictError`, HTTP 409) con indicazione della proiezione in conflitto
- [ ] Endpoint `POST /proiezioni`, `GET /proiezioni?cinemaId=&data=`

**Criteri di accettazione**
- Creare due proiezioni sovrapposte nella stessa sala restituisce 409
- Creare due proiezioni sovrapposte in sale diverse è permesso
- Esiste almeno un test che verifica il caso limite: proiezioni "adiacenti" (fine della prima = inizio della seconda) NON sono considerate in conflitto — da decidere e documentare esplicitamente nel PR

**Note tecniche**
Discutere in PR se il controllo overlap deve avvenire solo a livello applicativo o anche con un constraint DB (es. `EXCLUDE` constraint su range in Postgres) come rete di sicurezza contro race condition. Per questa issue è sufficiente il controllo applicativo; la protezione a DB si affronta nell'issue sulle prenotazioni concorrenti.

---

### Issue #8 — Result type per gestione errori tipizzata
**Labels**: `refactor`, `backend`
**Stima**: 0.5g
**Dipende da**: #7

**Descrizione**
Introdurre un tipo `Result<T, E>` discriminated union nei service, come alternativa esplicita al lancio di eccezioni per i casi di business attesi (es. conflitto orario), riservando le eccezioni ai soli errori non previsti.

**Task**
- [ ] Definire `type Result<T, E = AppError> = { success: true; data: T } | { success: false; error: E }`
- [ ] Refactoring del `ProiezioneService` per usare `Result` invece di `throw` sui casi di conflitto
- [ ] Il controller mappa il `Result` alla risposta HTTP appropriata

**Criteri di accettazione**
- Nessun `throw` per il caso di conflitto orario: il chiamante è costretto dal type system a gestire entrambi i rami (narrowing su `success`)
- I test esistenti sul conflitto orario continuano a passare

---

### Issue #9 — Cache Redis del palinsesto giornaliero
**Labels**: `feature`, `backend`, `performance`
**Stima**: 1g
**Dipende da**: #7

**Descrizione**
L'endpoint di consultazione palinsesto (`GET /proiezioni?cinemaId=&data=`) è letto molto più spesso di quanto venga scritto: è il candidato ideale per una cache Redis con pattern cache-aside.

**Task**
- [ ] Setup client Redis
- [ ] Cache-aside sull'endpoint di lista proiezioni per cinema+data, con TTL configurabile (es. 5 minuti)
- [ ] Invalidazione esplicita della chiave di cache quando viene creata una nuova proiezione per quel cinema+data
- [ ] Convenzione di naming delle chiavi documentata (es. `palinsesto:{cinemaId}:{data}`)

**Criteri di accettazione**
- Prima richiesta va a DB, seconda richiesta identica va a cache (verificabile nei log/test)
- Dopo la creazione di una nuova proiezione, la richiesta successiva riflette il dato aggiornato (no stale cache)
- Test che verifica esplicitamente l'invalidazione

---

## Milestone 4 — Prenotazioni, concorrenza, auth

### Issue #10 — Autenticazione JWT e ruoli
**Labels**: `feature`, `security`
**Stima**: 1g
**Dipende da**: #6

**Descrizione**
Implementare login e autenticazione JWT con due ruoli: `customer` e `admin`. Le API di scrittura su Film/Sala/Proiezioni devono essere riservate ad `admin`.

**Task**
- [ ] Schema Drizzle `utente` (email, password hash, ruolo)
- [ ] Endpoint `POST /auth/register`, `POST /auth/login` (hash password con bcrypt/argon2)
- [ ] Middleware `authenticate` che verifica il JWT ed espone l'utente su `req` (con estensione tipizzata di `Request`/`Locals`, coerente con Express 5)
- [ ] Middleware `authorize(roles: Role[])` per la protezione per ruolo
- [ ] Applicare i middleware alle route di scrittura di Film/Sala/Proiezioni create nelle issue precedenti

**Criteri di accettazione**
- Un utente non autenticato riceve 401 sulle route protette
- Un customer autenticato riceve 403 sulle route riservate ad admin
- Le password non sono mai salvate in chiaro né restituite nelle risposte API

---

### Issue #11 — Prenotazione posti con gestione concorrenza
**Labels**: `feature`, `backend`, `business-logic`
**Stima**: 2g
**Dipende da**: #9, #10

**Descrizione**
Implementare la prenotazione di posti per una proiezione. È il cuore del progetto: due richieste concorrenti non devono mai poter prenotare lo stesso posto per la stessa proiezione.

**Task**
- [ ] Schema Drizzle `prenotazione` (proiezione, utente, stato: `pending`/`confirmed`/`cancelled`) e `posto_prenotato` (prenotazione, riga, colonna) con **constraint di unicità DB** su (proiezione, riga, colonna) per gli stati attivi
- [ ] Endpoint `POST /proiezioni/:id/prenotazioni` con lista posti richiesti
- [ ] Transazione Drizzle che verifica disponibilità e crea la prenotazione atomicamente
- [ ] Gestione esplicita della violazione del constraint di unicità come `ConflictError` (409), non come 500
- [ ] Invalidazione della cache di disponibilità posti (se introdotta) su nuova prenotazione
- [ ] Endpoint `DELETE /prenotazioni/:id` per la cancellazione, con vincolo "non cancellabile a meno di N ore dall'inizio proiezione"

**Criteri di accettazione**
- Test di integrazione con due richieste concorrenti (in parallelo) sugli stessi posti: una sola deve avere successo, l'altra deve ricevere 409
- Tentare di cancellare una prenotazione a ridosso dell'orario di inizio restituisce errore esplicito
- Nessuna race condition rilevabile lanciando il test di concorrenza ripetutamente (almeno 20 run in CI)

**Note tecniche**
Il controllo applicativo (query di disponibilità prima dell'insert) non basta da solo a prevenire la race condition: il constraint DB è la vera rete di sicurezza. Discuterne esplicitamente in PR, è un obiettivo didattico chiave di questa issue.

---

## Milestone 5 — Single thread e asincronicità

Node.js esegue il codice JavaScript su un **singolo thread**. Questo va bene finché il lavoro è I/O-bound (query DB, chiamate Redis, chiamate HTTP), perché in quel caso l'event loop resta libero di gestire altre richieste mentre l'I/O è in corso. Diventa un problema nel momento in cui si scrive codice **CPU-bound** eseguito in modo sincrono: mentre quel codice gira, l'intero processo è bloccato e non può rispondere a nessun'altra richiesta, nemmeno a un banale health check. Le due issue di questa milestone servono a fartelo scoprire sul campo, non a leggerlo su un articolo.

### Issue #12 — Report occupazione mensile per sala
**Labels**: `feature`, `backend`, `performance`
**Stima**: 1.5g
**Dipende da**: #9, #11

**Descrizione**
Il gestore di Multiplex Aurora ha chiesto un report: per un dato mese, per ciascuna sala, la percentuale di occupazione di ogni proiezione (posti prenotati / capienza sala), più una "matrice occupazione" (griglia riga/colonna con indicazione posto libero/occupato) per ogni proiezione del mese, restituita nella risposta.

Implementa l'endpoint `GET /report/occupazione?cinemaId=&mese=&anno=`. Recupera da DB le proiezioni del mese con le relative prenotazioni, quindi calcola in Node.js (non con aggregazioni SQL, per questa prima versione) le percentuali e le matrici di occupazione per ogni proiezione, e restituisci tutto in un'unica risposta JSON.

**Task**
- [ ] Script di seed che popola il DB con un mese di dati realistici per le 4 sale di Multiplex Aurora (più proiezioni al giorno, ciascuna con centinaia di posti e un buon numero di prenotazioni — il volume deve essere sufficiente a rendere il calcolo non istantaneo)
- [ ] Implementazione dell'endpoint con il calcolo delle percentuali e delle matrici fatto interamente in memoria, con cicli JavaScript
- [ ] Endpoint `GET /health` che risponde `{ status: "ok" }` (se non esiste già, va aggiunto: serve come sonda per il test successivo)
- [ ] Test che, mentre è in corso una richiesta al report, esegue in parallelo una richiesta a `/health` e misura quanto tempo impiega a rispondere

**Criteri di accettazione**
- Il report restituisce dati corretti (percentuali e matrici coerenti con i dati seedati)
- Il test di `/health` in parallelo viene scritto e eseguito **prima** di ottimizzare qualsiasi cosa: l'obiettivo di questa issue, in questa fase, è misurare il problema, non ancora risolverlo
- Nella PR, riporta esplicitamente il tempo di risposta di `/health` misurato durante l'esecuzione del report, e una tua spiegazione del perché si comporta così (anche se a questo punto la spiegazione è ancora un'ipotesi)

**Note tecniche**
Non ottimizzare nulla in questa issue. Il valore didattico sta nel vedere con i propri occhi cosa succede quando un endpoint fa lavoro sincrono pesante su un server single-thread. La issue #13 tratterà il fix.

---

### Issue #13 — Diagnosi e fix del blocco dell'event loop
**Labels**: `refactor`, `backend`, `performance`
**Stima**: 1g
**Dipende da**: #12

**Descrizione**
Nella issue #12 hai misurato un problema reale: mentre il report gira, il server smette di rispondere ad altre richieste. Questa issue chiede di spiegarlo correttamente e risolverlo.

**Task**
- [ ] Nella PR, spiega con parole tue: perché un ciclo JavaScript sincrono blocca *tutte* le richieste, incluse quelle che non c'entrano nulla con il report? Cosa succederebbe se, invece di un ciclo JS, il report facesse solo `await` su query al database per lo stesso tempo totale?
- [ ] Sposta il più possibile del calcolo dal Node.js all'aggregazione SQL (query Drizzle con `COUNT`, `GROUP BY`), riducendo il lavoro fatto in memoria a valle
- [ ] Per la parte di calcolo che resta necessariamente in JS (es. costruzione della matrice posti), rifattorizza il ciclo per **cedere periodicamente il controllo all'event loop** (es. spezzando il lavoro in chunk e usando `setImmediate` tra un chunk e l'altro), invece di eseguirlo tutto in un unico blocco sincrono
- [ ] Ripeti lo stesso test di `/health` in parallelo scritto nell'issue #12 e verifica il miglioramento

**Criteri di accettazione**
- Il tempo di risposta di `/health` misurato durante l'esecuzione del report, dopo il fix, è drasticamente inferiore a quello misurato prima (riporta entrambi i numeri in PR, prima/dopo)
- Il risultato del report resta corretto rispetto ai dati di test (stesso output della issue #12, solo calcolato diversamente)
- La PR spiega la differenza concettuale tra un'operazione **I/O-bound** (query DB, chiamata Redis: l'event loop resta libero durante l'attesa) e una **CPU-bound** (ciclo di calcolo puro: l'event loop è bloccato per tutta la sua durata) — è il concetto chiave di questa issue, la spiegazione conta quanto il codice

**Note tecniche**
Se dopo aver spostato più aggregazione possibile in SQL il calcolo residuo in JS fosse ancora genuinamente pesante (non è il caso di questo dataset, ma vale la pena saperlo), l'alternativa più corretta non sarebbe "spezzare in chunk" ma spostare il lavoro su un `worker_thread`, così da usare davvero un altro thread invece di cedere solo periodicamente il controllo su quello principale. Non è richiesto implementarlo in questa issue, ma discutine il compromesso in PR: quando ha senso l'uno e quando l'altro.

---

### Issue #14 — Pattern async: `Promise.all` vs `await` sequenziale
**Labels**: `refactor`, `backend`
**Stima**: 0.5g
**Dipende da**: #9

**Descrizione**
Quando una proiezione viene cancellata dall'admin, bisogna notificare (in questo progetto: loggare, simulando l'invio di una email con un `await delay(...)` di qualche centinaio di millisecondi) tutti i clienti che avevano una prenotazione attiva su quello spettacolo.

Una prima implementazione naive, molto comune tra chi inizia con async/await, itera sulle prenotazioni con un ciclo `for...of` e fa `await` della notifica dentro al ciclo, una alla volta. Implementala così per prima cosa, misura quanto impiega con una ventina di prenotazioni simulate, poi correggila.

**Task**
- [ ] Implementa prima la versione sequenziale (`for (const p of prenotazioni) { await notifica(p) }`) e misura il tempo totale con un test/log
- [ ] Rifattorizza usando l'approccio corretto per operazioni indipendenti tra loro (`Promise.all` o, se vuoi gestire il caso in cui alcune notifiche possono fallire senza bloccare le altre, `Promise.allSettled`)
- [ ] Gestisci esplicitamente il caso in cui una singola notifica fallisce: non deve far fallire l'intera cancellazione della proiezione né restare un `unhandled rejection` silenzioso
- [ ] Aggiungi un test che dimostra la differenza di tempo tra le due versioni

**Criteri di accettazione**
- La versione finale usa l'approccio parallelo, con tempo totale prossimo al tempo di una singola notifica (non alla somma di tutte)
- Se una notifica simulata fallisce (es. inserendo un errore forzato in test), le altre notifiche vanno comunque a buon fine e il fallimento parziale è tracciato/loggato, non silenzioso
- La PR spiega quando `await` in sequenza dentro un ciclo è effettivamente corretto (es. quando ogni iterazione dipende dal risultato della precedente) e quando invece è solo un modo lento di fare le cose

---

## Milestone 6 — Testing e CI/CD

### Issue #15 — Unit test dei service
**Labels**: `testing`
**Stima**: 1g
**Dipende da**: #14

**Descrizione**
Coprire con unit test la business logic dei service, mockando repository e cache.

**Task**
- [ ] Setup Vitest con configurazione base del progetto
- [ ] Unit test `FilmService`, `ProiezioneService` (inclusi i casi di conflitto orario), `PrenotazioneService`
- [ ] Repository e client Redis mockati (no DB reale in questi test)

**Criteri di accettazione**
- Coverage dei service superiore all'80% (soglia indicativa, discutibile in review)
- I test girano in meno di qualche secondo (nessuna dipendenza esterna reale)

---

### Issue #16 — Integration test con Testcontainers
**Labels**: `testing`
**Stima**: 1.5g
**Dipende da**: #15

**Descrizione**
Test di integrazione end-to-end contro Postgres e Redis reali (via Testcontainers), incluso il test di concorrenza sulla prenotazione.

**Task**
- [ ] Setup Testcontainers per Postgres e Redis nell'ambiente di test
- [ ] Test del flusso completo: creazione film → sala → proiezione → prenotazione → cancellazione
- [ ] Test di concorrenza sulla prenotazione degli stessi posti (issue #11)
- [ ] Script npm dedicato per i soli integration test (separati dagli unit test, tempi di esecuzione diversi)

**Criteri di accettazione**
- I test passano in locale con Docker disponibile
- Il test di concorrenza fallisce deliberatamente se si rimuove il constraint DB di unicità (verificarlo manualmente una volta, come sanity check)

---

### Issue #17 — CI su GitHub Actions
**Labels**: `ci-cd`
**Stima**: 0.5g
**Dipende da**: #16

**Descrizione**
Pipeline CI che esegue lint, typecheck e l'intera test suite (unit + integration) ad ogni pull request.

**Task**
- [ ] Workflow GitHub Actions con job separati: lint, typecheck, unit test, integration test
- [ ] Servizi Postgres e Redis come container nella pipeline per gli integration test
- [ ] Badge di stato CI nel README

**Criteri di accettazione**
- Una PR con un test rotto non è mergeable (branch protection, se configurabile sul repo)
- L'intera pipeline gira in meno di 5 minuti

---

## Checklist di valutazione finale (trasversale a tutte le issue)

- **Type-safety**: nessun `any` non giustificato; i tipi sono derivati dagli schemi Zod, non duplicati
- **Error handling**: coerente in tutto il progetto, mai un errore non gestito che fa crashare il processo
- **Business logic testata**: in particolare i casi limite (overlap adiacente, concorrenza sui posti, cancellazione a ridosso dell'orario)
- **Cache**: invalidazione corretta, nessun dato stale osservabile nei test
- **Event loop e asincronicità**: nessun ciclo di calcolo sincrono e pesante lasciato in un endpoint senza consapevolezza del problema; uso corretto di `Promise.all`/`Promise.allSettled` per operazioni indipendenti; nessun `unhandled rejection`
- **Struttura del codice**: separazione netta tra routing, controller, service, repository
- **PR**: leggibili, con descrizione del problema e della soluzione, commit atomici, collegate all'issue corrispondente