# Cinema Scheduler BE — Multiplex Aurora

Servizio backend per la gestione del palinsesto e delle prenotazioni di Multiplex Aurora, cinema multisala a 4 sale.

Progetto didattico di onboarding: replica lo stack e le convenzioni usate nei progetti reali del team.

## Documenti di riferimento

Prima di iniziare, leggi in ordine:

1. [`project-context.md`](./project-context.md) — chi è Multiplex Aurora, il problema di business che il progetto risolve, i vincoli (buffer pulizia sala, termini di cancellazione)
2. [`CONTRIBUTING.md`](./CONTRIBUTING.md) — workflow, convenzioni di branch/commit/PR, Definition of Done
3. Le issue su GitHub, lavorate in ordine di dipendenza (indicato in ciascuna issue)

## Stack tecnologico

| Ambito | Tecnologia |
|---|---|
| Runtime | Node.js |
| Linguaggio | TypeScript (strict mode) |
| Web framework | Express 5 |
| Validazione | Zod 4 |
| ORM | Drizzle |
| Database | PostgreSQL |
| Cache | Redis |
| Test | Vitest + Testcontainers |
| Documentazione API | OpenAPI 3.1 (generata da Zod) + Swagger UI |
| CI | GitHub Actions |

## Requisiti

- Node.js ≥ 25
- Docker e Docker Compose (per Postgres, Redis e i test di integrazione)
- npm

## Setup locale

```bash
# 1. Clona il repository
git clone <repo-url>
cd cinema-scheduler-be

# 2. Installa le dipendenze
npm install

# 3. Copia il file di configurazione
cp .env.example .env
# Compila le variabili se necessario: i default vanno bene per lo sviluppo locale

# 4. Avvia Postgres e Redis
docker-compose up -d

# 5. Applica le migration al database
npm run db:migrate

# 6. (opzionale) Popola il database con dati di esempio
npm run db:seed

# 7. Avvia il server in modalità sviluppo
npm run dev
```

Il server parte di default su `http://localhost:3000`.

- Documentazione API interattiva: `http://localhost:3000/docs`
- Health check: `http://localhost:3000/health`

## Variabili d'ambiente

| Variabile | Descrizione | Default (sviluppo) |
|---|---|---|
| `PORT` | Porta su cui il server ascolta | `3000` |
| `DATABASE_URL` | Connection string PostgreSQL | `postgres://postgres:postgres@localhost:5432/cinema` |
| `REDIS_URL` | Connection string Redis | `redis://localhost:6379` |
| `JWT_SECRET` | Segreto per la firma dei token JWT | — (obbligatorio, nessun default in `.env.example`) |
| `JWT_EXPIRES_IN` | Durata dei token JWT | `1h` |
| `CACHE_TTL_SECONDS` | TTL della cache del palinsesto | `300` |
| `SALA_CLEANUP_BUFFER_MINUTES` | Buffer di pulizia tra due proiezioni nella stessa sala | `15` |
| `CANCELLATION_DEADLINE_HOURS` | Ore minime prima dello spettacolo per poter cancellare una prenotazione | `3` |

## Script disponibili

| Comando | Descrizione |
|---|---|
| `npm run dev` | Avvia il server in modalità sviluppo (con watch) |
| `npm run build` | Compila il TypeScript in `dist/` |
| `npm start` | Avvia il server compilato (produzione) |
| `npm run lint` | Esegue ESLint |
| `npm run typecheck` | Verifica i tipi senza emettere output |
| `npm run db:generate` | Genera una nuova migration Drizzle a partire dallo schema |
| `npm run db:migrate` | Applica le migration al database |
| `npm run db:seed` | Popola il database con dati di esempio (film, sale, proiezioni) |
| `npm run test:unit` | Esegue i soli unit test |
| `npm run test:integration` | Esegue i soli integration test (richiede Docker per Testcontainers) |
| `npm test` | Esegue l'intera suite di test |

## Struttura del progetto

```
src/
├── routes/         # Definizione delle route Express, nessuna logica
├── controllers/     # Estrazione input, chiamata al service, mapping della risposta HTTP
├── services/         # Business logic, indipendente da Express e dal DB concreto
├── repositories/    # Accesso ai dati tramite Drizzle
├── schemas/          # Schemi Zod (fonte di verità per validazione e tipi)
├── db/                # Client Drizzle, schema tabelle, migration
├── middlewares/     # Autenticazione, autorizzazione, validazione, error handling
└── config/           # Lettura e validazione delle variabili d'ambiente
```

Regola generale: le dipendenze vanno in una sola direzione — `routes → controllers → services → repositories`. Un layer non richiama mai un layer "superiore".

## Database

Lo schema e le migration sono gestiti con Drizzle. Dopo aver modificato lo schema in `src/db/schema/`:

```bash
npm run db:generate   # genera la migration SQL a partire dal diff dello schema
npm run db:migrate    # la applica al database
```

Non modificare mai a mano i file di migration generati, salvo casi eccezionali da discutere in PR.

## Test

```bash
npm run test:unit          # veloci, nessuna dipendenza esterna, repository/cache mockati
npm run test:integration   # Postgres e Redis reali via Testcontainers, richiede Docker attivo
npm test                   # entrambi
```

Gli integration test includono anche i test di concorrenza (es. prenotazione simultanea degli stessi posti): se falliscono in modo intermittente, non ignorarli — è il tipo di test che questo progetto vuole intenzionalmente mettere alla prova.

## Convenzioni

Vedi [`CONTRIBUTING.md`](./CONTRIBUTING.md) per il dettaglio completo. In sintesi:

- Branch: `<tipo>/<numero-issue>-<descrizione>`
- Commit: [Conventional Commits](https://www.conventionalcommits.org/)
- Ogni issue si considera chiusa solo a fronte della Definition of Done, non del solo "funziona in locale"

## Licenza

Progetto didattico ad uso interno.

## Formato errore
-400: bad request - formato dati errato o dato obblgatorio mancante
-404: not found - rotta non trovata o dato non trovato
-401: unauthorized - ruolo che non consente l'accesso all'API
-403: forbidden - token JWT richiesto e mancante o scaduto (login necessario)