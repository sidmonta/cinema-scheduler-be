# Contributing — Cinema Scheduler BE

Queste sono le convenzioni di squadra da seguire per ogni issue del progetto. Trattale come faresti con le regole di un progetto reale: non sono suggerimenti, sono lo standard su cui verrà valutata ogni PR.

---

## Workflow

1. Assegnati l'issue prima di iniziare (evita sovrapposizioni)
2. Crea un branch dedicato dall'ultimo `main` aggiornato
3. Lavora con commit piccoli e frequenti, non un unico commit finale
4. Apri la PR quando il lavoro è pronto per la review, collegandola all'issue (`Closes #N`)
5. Non fare merge da solo: aspetta l'approvazione in review

## Naming dei branch

Formato: `<tipo>/<numero-issue>-<breve-descrizione>`

Tipi ammessi: `feature`, `fix`, `refactor`, `test`, `chore`, `docs`

Esempi:
- `feature/7-overlap-proiezioni`
- `fix/11-race-condition-posti`
- `test/13-integration-prenotazioni`

## Commit message

Formato [Conventional Commits](https://www.conventionalcommits.org/):

```
<tipo>(<scope opzionale>): <descrizione breve, imperativo, minuscolo>

[corpo opzionale: perché, non solo cosa]
```

Tipi: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `ci`

Esempi:
- `feat(proiezioni): aggiunge controllo sovrapposizione orari`
- `fix(prenotazioni): gestisce violazione constraint unicità come 409`
- `test(prenotazioni): aggiunge test di concorrenza su prenotazione posti`

Evita commit come `fix`, `wip`, `aggiornamenti vari`: ogni commit deve spiegare da solo cosa cambia e perché, guardando solo l'oggetto.

## Struttura della PR

Ogni PR deve contenere, nella descrizione:

- **Cosa cambia**: riassunto in 2-3 righe
- **Perché**: il problema che risolve, non solo la soluzione tecnica
- **Come testarlo**: comandi o passi per verificare manualmente, se rilevante
- **Decisioni prese**: se l'issue lasciava aperta una scelta di design (capita spesso in questo progetto), spiega qui cosa hai deciso e perché — è la parte più importante della PR, non un dettaglio

Dimensione: se una PR supera indicativamente le 400 righe di diff (esclusi file generati/migration), valuta se va spezzata. Non è un limite rigido, ma un campanello d'allarme.

## Definition of Done

Una issue si considera chiusa solo quando:

- [ ] Il codice compila senza errori (`npm run typecheck`)
- [ ] Il linter non riporta warning (`npm run lint`)
- [ ] Tutti i test esistenti passano, inclusi quelli nuovi richiesti dall'issue
- [ ] I criteri di accettazione elencati nell'issue sono soddisfatti uno per uno (verificali esplicitamente prima di chiedere review, non a occhio)
- [ ] Se l'issue tocca un endpoint, la documentazione OpenAPI è aggiornata (deve esserlo automaticamente se usi correttamente gli schemi Zod — se non lo è, è un segnale che qualcosa è stato scritto a mano invece che derivato)
- [ ] Il README è aggiornato se il setup locale cambia (nuove variabili d'ambiente, nuovi comandi, nuove dipendenze esterne)
- [ ] La PR è stata aperta collegata all'issue e revieweta da almeno una persona

## Convenzioni di codice

- **Niente `any`** senza commento che ne giustifichi il motivo. Se serve un tipo che non conosci, chiedi in review invece di aggirarlo.
- **I tipi si derivano dagli schemi Zod** (`z.infer<typeof schema>`), non si scrivono a mano in parallelo: altrimenti validazione runtime e tipi TS possono divergere silenziosamente.
- **Un file, una responsabilità**: un controller non contiene business logic, un service non fa query dirette al DB (passa dal repository).
- **Errori**: usa la gerarchia di `AppError` definita nel progetto (issue #3) invece di lanciare `Error` generici o stringhe.
- **Niente logica di business nei middleware di routing**: i middleware validano, autenticano, autorizzano — non decidono se una prenotazione è valida.
- **Query Drizzle**: preferisci il query builder alla raw SQL, salvo casi dove la query è genuinamente più leggibile in SQL puro (in quel caso commenta il perché).

## Come chiedere aiuto

Se sei bloccato su un'issue da più di un'ora senza progressi, chiedi. Non è un fallimento: fa parte del processo, ed è molto meglio di una PR che gira intorno al problema senza affrontarlo. Nella richiesta di aiuto, spiega cosa hai già provato: aiuta chi ti risponde e ti abitua a strutturare il problema prima di chiedere.