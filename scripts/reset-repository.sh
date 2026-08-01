#!/usr/bin/env bash
#
# Riporta il branch di default (tipicamente 'main') allo stato del commit di
# inizializzazione del progetto, ed elimina tutti gli altri branch remoti.
#
# ============================== ATTENZIONE ==================================
# QUESTA È UN'OPERAZIONE DISTRUTTIVA E IRREVERSIBILE:
#   - riscrive la storia del branch di default con un force-push
#     (chiunque abbia già clonato/pullato avrà una history divergente)
#   - elimina PERMANENTEMENTE tutti gli altri branch remoti (il codice sugli
#     altri branch non recuperabile da GitHub una volta cancellato, a meno
#     di non avere il SHA a portata di mano e rigenerare il ref manualmente
#     entro la finestra di garbage collection di GitHub, non garantita)
# Usalo solo quando vuoi davvero azzerare un repository per riconsegnarlo a
# un nuovo junior via fork. Non lanciarlo su un repository con lavoro che ti
# serve ancora.
# ==============================================================================
#
# Perché un TAG e non "il terzo commit" contato a mano
# -----------------------------------------------------
# Contare i commit in modo ordinale ("il terzo") è fragile: se in futuro
# aggiungi anche un solo commit prima di quelli previsti, "il terzo" smette
# di essere quello giusto — e sbagliare bersaglio qui significa perdere
# lavoro, non un bug innocuo. Usiamo invece un tag creato una tantum subito
# dopo l'ultimo commit di setup (default: "template-init"), che resta un
# riferimento stabile indipendentemente da quanti commit ci sono prima o dopo.
#
# Per crearlo la prima volta (una tantum, dopo aver completato i commit di
# inizializzazione del progetto):
#   git tag -a template-init -m "Stato iniziale dell'esercizio"
#   git push origin template-init
#
# Uso
# ----
#   CONFIRM=RESET \
#   RESET_TARGET_REF=template-init \
#   GITHUB_TOKEN=<token> GITHUB_REPOSITORY=<owner>/<repo> \
#   ./scripts/reset-repository.sh [--dry-run]
#
# In GitHub Actions: vedi .github/workflows/reset-repository.yml — richiede di
# digitare "RESET" nel campo di conferma del workflow_dispatch.

set -euo pipefail

DRY_RUN=false
for arg in "$@"; do
  if [ "$arg" = "--dry-run" ]; then
    DRY_RUN=true
  fi
done

TARGET_REF="${RESET_TARGET_REF:-template-init}"

if [ -z "${GITHUB_REPOSITORY:-}" ]; then
  echo "Errore: variabile d'ambiente GITHUB_REPOSITORY mancante (formato 'owner/repo')." >&2
  exit 1
fi
if [ -z "${GITHUB_TOKEN:-}" ]; then
  echo "Errore: variabile d'ambiente GITHUB_TOKEN mancante." >&2
  exit 1
fi

# Sicurezza: senza questa conferma esplicita, lo script si rifiuta di procedere.
if [ "${CONFIRM:-}" != "RESET" ]; then
  echo "Operazione distruttiva NON confermata."
  echo "Per procedere, esporta la variabile CONFIRM=RESET (esattamente quel valore)."
  exit 1
fi

echo "Repository target: ${GITHUB_REPOSITORY}"
echo "Ref di riferimento per il reset: ${TARGET_REF}"
$DRY_RUN && echo "Modalità DRY-RUN: nessuna scrittura verrà effettuata."
echo

# gh CLI: preinstallata sui runner GitHub-hosted, autenticata via GITHUB_TOKEN
export GH_TOKEN="${GITHUB_TOKEN}"

DEFAULT_BRANCH="$(gh api "repos/${GITHUB_REPOSITORY}" --jq '.default_branch')"
echo "Branch di default rilevato: ${DEFAULT_BRANCH}"

# --- 1. Verifica che il ref target esista ---
git fetch --all --tags --quiet
if ! git rev-parse --verify --quiet "${TARGET_REF}" > /dev/null; then
  echo "Errore: il ref '${TARGET_REF}' non esiste in questo repository." >&2
  echo "Crealo con: git tag -a ${TARGET_REF} -m \"Stato iniziale dell'esercizio\" && git push origin ${TARGET_REF}" >&2
  exit 1
fi
TARGET_SHA="$(git rev-parse "${TARGET_REF}")"
echo "Il branch '${DEFAULT_BRANCH}' verrà riportato al commit: ${TARGET_SHA}"
git log -1 --format="  %h %s (%ad)" --date=short "${TARGET_SHA}"
echo

# --- 2. Reset del branch di default al commit target ---
echo "→ Reset di '${DEFAULT_BRANCH}' a ${TARGET_REF}"
if $DRY_RUN; then
  echo "  [dry-run] eseguirei: git checkout ${DEFAULT_BRANCH} && git reset --hard ${TARGET_REF} && git push --force origin ${DEFAULT_BRANCH}"
else
  git checkout "${DEFAULT_BRANCH}"
  git reset --hard "${TARGET_REF}"
  git push --force origin "${DEFAULT_BRANCH}"
fi

# --- 3. Eliminazione di tutti i branch remoti tranne quello di default ---
echo
echo "→ Branch remoti da eliminare (tutti tranne '${DEFAULT_BRANCH}')"
BRANCHES_TO_DELETE="$(gh api "repos/${GITHUB_REPOSITORY}/branches" --paginate --jq '.[].name' | grep -v "^${DEFAULT_BRANCH}$" || true)"

if [ -z "${BRANCHES_TO_DELETE}" ]; then
  echo "  Nessun altro branch presente."
else
  while IFS= read -r branch; do
    [ -z "$branch" ] && continue
    if $DRY_RUN; then
      echo "  [dry-run] eliminerei: ${branch}"
    else
      echo "  elimino: ${branch}"
      gh api -X DELETE "repos/${GITHUB_REPOSITORY}/git/refs/heads/${branch}" \
        || echo "    impossibile eliminare '${branch}' (potrebbe essere protetto): salto e continuo"
    fi
  done <<< "${BRANCHES_TO_DELETE}"
fi

echo
echo "Completato."
$DRY_RUN && echo "(nessuna modifica reale: era una dry-run)"