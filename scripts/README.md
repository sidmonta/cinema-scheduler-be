**NON MODIFICARE I FILE IN QUESTA CARTELLA**

# Bootstrap issue/milestone/label

## Perché esiste

Quando forki questo repository, GitHub **non copia issue, milestone né label**: il fork porta con sé solo il codice (commit, branch, tag). Ogni nuovo junior che forka il progetto riparte quindi già "pulito" su questo fronte — non serve nessun reset distruttivo, serve solo **ripopolare** quei dati nel nuovo fork a partire dall'unica fonte di verità: [`issues-progetto-cinema.md`](../issues-progetto-cinema.md).

`bootstrap-github.mjs` legge quel file, lo parsa, e crea su GitHub (via API REST):
- le 6 milestone
- tutte le label usate nelle issue (con colori assegnati per leggibilità)
- le 17 issue, ciascuna collegata alla milestone e alle label corrette

È **idempotente**: prima di creare qualcosa verifica se esiste già (per titolo/nome) e in quel caso lo salta. Rilanciarlo per sbaglio sullo stesso repository non duplica nulla. Per lo stesso motivo lo script **non cancella mai nulla** — tra l'altro l'API REST di GitHub non lo permetterebbe comunque per le issue (serve GraphQL con permessi da admin), quindi non abbiamo nemmeno provato a fingere un "reset" che in realtà non si può fare in sicurezza.

## Uso consigliato: GitHub Actions (dopo il fork)

1. Forka il repository
2. Vai su **Settings → Actions → General** del tuo fork e abilita le Actions (disabilitate di default sui fork, è un default di sicurezza di GitHub, va abilitato una volta manualmente)
3. Vai su **Actions → Bootstrap issue del progetto → Run workflow**
4. (opzionale) spunta "dry run" per vedere in anteprima cosa verrebbe creato, senza scrivere nulla
5. Lancia — in pochi secondi il fork ha milestone, label e 17 issue pronte

Non serve nessun token da configurare: il workflow usa il `GITHUB_TOKEN` che Actions fornisce automaticamente, con permessi limitati a issue/contenuti del solo repository corrente.

## Uso alternativo: in locale

Utile se vuoi testare modifiche al parser o alle issue prima di pubblicarle.

```bash
export GITHUB_TOKEN=<personal access token con scope 'repo'>
export GITHUB_REPOSITORY=<tuo-username>/<nome-repo>

node scripts/bootstrap-github.mjs --dry-run   # anteprima, nessuna scrittura
node scripts/bootstrap-github.mjs             # esecuzione reale
```

## Se modifichi le issue

Il markdown resta l'unica fonte di verità: modifica `issues-progetto-cinema.md`, poi rilancia il bootstrap. Le milestone/label/issue già esistenti (stesso titolo) vengono lasciate intatte — se hai cambiato il *contenuto* di una issue già creata su un repository esistente, questo script non la aggiorna (per design: non vogliamo che un rilancio automatico sovrascriva silenziosamente il lavoro/i commenti di un junior su una issue già in corso). In quel caso l'aggiornamento va fatto a mano sulla issue esistente.

---

## `reset-repository.sh` — reset del codice (⚠️ distruttivo)

A differenza del bootstrap sopra, questo script **non è sicuro da rilanciare senza pensarci**: riporta il branch di default allo stato del commit di inizializzazione del progetto (force-push, storia riscritta) ed **elimina permanentemente** tutti gli altri branch remoti. Serve per rimettere un repository — tipicamente un fork già usato da un junior — nello stato di partenza, prima di riassegnarlo a qualcun altro.

Tocca solo codice e branch: **non** riguarda le issue, che restano compito dello script sopra.

### Setup una tantum: il tag di riferimento

Lo script non conta "il terzo commit" a mano: punta a un **tag git** (default: `template-init`), perché contare i commit in modo ordinale è fragile — se in futuro aggiungi anche un solo commit prima dei tre iniziali, "il terzo" smette di essere quello giusto, e qui uno sbaglio del genere significa perdere lavoro, non un bug innocuo.

Dopo aver completato i commit di inizializzazione del progetto (i tre commit con cui hai messo a posto struttura, docs, docker-compose, ecc.), crea il tag una volta sola:

```bash
git tag -a template-init -m "Stato iniziale dell'esercizio"
git push origin template-init
```

Da quel momento il tag è il riferimento stabile, indipendentemente da quanti commit aggiungerai dopo (es. per correggere un typo nel README di setup).

### Uso consigliato: GitHub Actions

1. Vai su **Actions → Reset repository allo stato iniziale → Run workflow**
2. Nel campo di conferma digita esattamente `RESET` (qualsiasi altro valore blocca l'esecuzione)
3. (opzionale) spunta "dry run" per vedere l'anteprima di cosa verrebbe fatto
4. Lancia

Il workflow richiede la conferma testuale come seconda barriera di sicurezza, oltre al fatto che va comunque lanciato manualmente e volutamente.

### Uso alternativo: in locale

```bash
export GITHUB_TOKEN=<personal access token con scope 'repo'>
export GITHUB_REPOSITORY=<owner>/<repo>
export CONFIRM=RESET

./scripts/reset-repository.sh --dry-run   # anteprima, nessuna scrittura
./scripts/reset-repository.sh             # esecuzione reale
```

### Cosa NON fa (limiti da conoscere)

- Non tocca le issue/milestone/label: quelle restano quelle già create (eventualmente chiuse/commentate dal junior). Se vuoi anche quelle "pulite", ricordati che un nuovo fork le azzera comunque in automatico da solo (vedi sopra) — questo script serve per il caso in cui riusi *lo stesso* repository invece di far fare un nuovo fork.
- Non elimina Pull Request: eliminare il branch sorgente chiude automaticamente le PR aperte su di esso, ma l'oggetto PR resta visibile nello storico (chiuso), GitHub non lo cancella.
- Se il branch di default ha protezioni attive (branch protection rules) che bloccano il force-push, lo script fallisce a quel passaggio: va rimossa la protezione temporaneamente, oppure non impostarla su repository pensati per essere resettati.