#!/usr/bin/env node
/**
 * Bootstrap di milestone, label e issue su GitHub a partire da issues-progetto-cinema.md.
 *
 * Perché esiste questo script
 * ----------------------------
 * Quando un repository viene forkato, GitHub NON copia issue, milestone né label:
 * porta con sé solo il codice (commit, branch, tag). Ogni junior che forka questo
 * repository riparte quindi già "pulito" lato issue — questo script serve a
 * ripopolarle nel fork, leggendo l'unica fonte di verità (il markdown), invece di
 * doverle ricreare a mano una per una.
 *
 * È IDEMPOTENTE: prima di creare una milestone/label/issue verifica se esiste già
 * (per titolo/nome) e in quel caso la salta. Rilanciarlo per errore sullo stesso
 * repository non duplica nulla e non cancella lavoro esistente — questo script non
 * cancella MAI nulla, di proposito: l'API REST di GitHub non permette comunque di
 * cancellare issue (serve GraphQL con permessi da admin), quindi non abbiamo nemmeno
 * provato a fingere di poterlo fare in sicurezza.
 *
 * Uso
 * ----
 * In GitHub Actions (consigliato): vedi .github/workflows/bootstrap-issues.yml,
 * si lancia da tab "Actions" → "Run workflow", nessun setup richiesto.
 *
 * In locale:
 *   GITHUB_TOKEN=<personal access token con scope 'repo'> \
 *   GITHUB_REPOSITORY=<owner>/<repo> \
 *   node scripts/bootstrap-github.mjs [--dry-run]
 *
 * Il token locale serve solo se non lo lanci da Actions (dove GITHUB_TOKEN è già
 * fornito automaticamente dal runner, con permessi limitati al repository corrente).
 */

import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ISSUES_MD_PATH = path.join(__dirname, "..", "issues-progetto-cinema.md");

const DRY_RUN = process.argv.includes("--dry-run");

const TOKEN = process.env.GITHUB_TOKEN;
const REPOSITORY = process.env.GITHUB_REPOSITORY; // formato "owner/repo"

if (!TOKEN) {
  console.error("Errore: variabile d'ambiente GITHUB_TOKEN mancante.");
  process.exit(1);
}
if (!REPOSITORY || !REPOSITORY.includes("/")) {
  console.error("Errore: variabile d'ambiente GITHUB_REPOSITORY mancante o non nel formato 'owner/repo'.");
  process.exit(1);
}
const [OWNER, REPO] = REPOSITORY.split("/");

const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;

// Colori pensati solo per leggibilità nella UI di GitHub: nessun impatto funzionale.
const LABEL_COLORS = {
  setup: "0e8a16",
  "good-first-issue": "7057ff",
  database: "1d76db",
  backend: "5319e7",
  feature: "0052cc",
  docs: "c5def5",
  "business-logic": "b60205",
  refactor: "fbca04",
  performance: "d93f0b",
  security: "e11d21",
  testing: "bfd4f2",
  "ci-cd": "006b75",
};

/**
 * Estrae milestone e issue dal markdown. Assunzioni sul formato (coerenti con
 * issues-progetto-cinema.md così com'è scritto):
 *  - "## Milestone N — Titolo" apre una milestone; il testo fino alla prima
 *    "### Issue" successiva (se presente) ne diventa la descrizione.
 *  - "### Issue #N — Titolo" apre una issue.
 *  - Riga "**Labels**: `a`, `b`" subito sotto il titolo → diventa labels dell'issue
 *    (rimossa dal corpo, per non duplicarla nel testo).
 *  - Il corpo dell'issue è tutto il testo successivo fino alla prossima
 *    "### Issue", "## Milestone" o fine file, ripulito dai separatori "---".
 */
function parseIssuesMarkdown(markdown) {
  const lines = markdown.split("\n");

  const milestones = []; // { title, description }
  const issues = []; // { number, title, labels, body, milestoneTitle }

  let currentMilestone = null;
  let currentMilestoneDescLines = [];
  let currentIssue = null;
  let currentIssueBodyLines = [];

  const flushMilestone = () => {
    if (currentMilestone) {
      currentMilestone.description = currentMilestoneDescLines.join("\n").trim();
      milestones.push(currentMilestone);
    }
    currentMilestone = null;
    currentMilestoneDescLines = [];
  };

  const flushIssue = () => {
    if (currentIssue) {
      currentIssue.body = currentIssueBodyLines
        .join("\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
      issues.push(currentIssue);
    }
    currentIssue = null;
    currentIssueBodyLines = [];
  };

  for (const line of lines) {
    const milestoneMatch = line.match(/^## (Milestone \d+ — .+)$/);
    const issueMatch = line.match(/^### Issue #(\d+) — (.+)$/);

    if (milestoneMatch) {
      flushIssue();
      flushMilestone();
      currentMilestone = { title: milestoneMatch[1].trim(), description: "" };
      continue;
    }

    if (issueMatch) {
      flushIssue();
      currentIssue = {
        number: Number(issueMatch[1]),
        title: issueMatch[2].trim(),
        labels: [],
        body: "",
        milestoneTitle: currentMilestone ? currentMilestone.title : null,
      };
      continue;
    }

    if (currentIssue) {
      const labelsMatch = line.match(/^\*\*Labels\*\*:\s*(.+)$/);
      if (labelsMatch) {
        currentIssue.labels = labelsMatch[1]
          .split(",")
          .map((s) => s.trim().replace(/`/g, ""))
          .filter(Boolean);
        continue; // non finisce nel corpo, evitiamo di duplicarla
      }
      if (line.trim() === "---") continue;
      currentIssueBodyLines.push(line);
    } else if (currentMilestone) {
      // testo introduttivo della milestone, prima della prima issue
      if (line.trim() === "---") continue;
      if (line.trim().startsWith("#")) continue; // non risalire ad altre sezioni (es. checklist finale)
      currentMilestoneDescLines.push(line);
    }
  }

  flushIssue();
  flushMilestone();

  return { milestones, issues };
}

async function githubRequest(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API ${options.method || "GET"} ${endpoint} → ${res.status}: ${text}`);
  }
  return res.status === 204 ? null : res.json();
}

async function paginateAll(endpoint) {
  const results = [];
  let page = 1;
  // 100 è il massimo per_page consentito dall'API REST di GitHub
  while (true) {
    const batch = await githubRequest(`${endpoint}${endpoint.includes("?") ? "&" : "?"}per_page=100&page=${page}&state=all`);
    results.push(...batch);
    if (batch.length < 100) break;
    page++;
  }
  return results;
}

async function ensureLabels(labelNames) {
  console.log(`\n→ Label (${labelNames.length} da verificare/creare)`);
  const existing = await paginateAll("/labels");
  const existingNames = new Set(existing.map((l) => l.name));

  for (const name of labelNames) {
    if (existingNames.has(name)) {
      console.log(`  già presente: ${name}`);
      continue;
    }
    console.log(`  ${DRY_RUN ? "[dry-run] creerei" : "creo"}: ${name}`);
    if (DRY_RUN) continue;
    await githubRequest("/labels", {
      method: "POST",
      body: JSON.stringify({
        name,
        color: LABEL_COLORS[name] || "ededed",
      }),
    });
  }
}

async function ensureMilestones(milestones) {
  console.log(`\n→ Milestone (${milestones.length} da verificare/creare)`);
  const existing = await paginateAll("/milestones");
  const byTitle = new Map(existing.map((m) => [m.title, m]));

  const titleToNumber = new Map();
  for (const m of milestones) {
    const found = byTitle.get(m.title);
    if (found) {
      console.log(`  già presente: ${m.title}`);
      titleToNumber.set(m.title, found.number);
      continue;
    }
    console.log(`  ${DRY_RUN ? "[dry-run] creerei" : "creo"}: ${m.title}`);
    if (DRY_RUN) continue;
    const created = await githubRequest("/milestones", {
      method: "POST",
      body: JSON.stringify({
        title: m.title,
        description: m.description || undefined,
      }),
    });
    titleToNumber.set(m.title, created.number);
  }
  return titleToNumber;
}

async function ensureIssues(issues, milestoneTitleToNumber) {
  console.log(`\n→ Issue (${issues.length} da verificare/creare)`);
  const existing = await paginateAll("/issues");
  const existingTitles = new Set(existing.map((i) => i.title));

  for (const issue of issues) {
    const fullTitle = `#${issue.number} — ${issue.title}`;
    if (existingTitles.has(fullTitle)) {
      console.log(`  già presente: ${fullTitle}`);
      continue;
    }
    console.log(`  ${DRY_RUN ? "[dry-run] creerei" : "creo"}: ${fullTitle}`);
    if (DRY_RUN) continue;

    const payload = {
      title: fullTitle,
      body: issue.body,
      labels: issue.labels,
    };
    if (issue.milestoneTitle && milestoneTitleToNumber.has(issue.milestoneTitle)) {
      payload.milestone = milestoneTitleToNumber.get(issue.milestoneTitle);
    }

    await githubRequest("/issues", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }
}

async function main() {
  console.log(`Repository target: ${OWNER}/${REPO}`);
  if (DRY_RUN) console.log("Modalità DRY-RUN: nessuna scrittura verrà effettuata su GitHub.\n");

  const markdown = await readFile(ISSUES_MD_PATH, "utf-8");
  const { milestones, issues } = parseIssuesMarkdown(markdown);

  console.log(`Trovate nel markdown: ${milestones.length} milestone, ${issues.length} issue.`);

  const allLabels = [...new Set(issues.flatMap((i) => i.labels))].sort();

  await ensureLabels(allLabels);
  const milestoneTitleToNumber = await ensureMilestones(milestones);
  await ensureIssues(issues, milestoneTitleToNumber);

  console.log("\nCompletato.");
}

main().catch((err) => {
  console.error("\nErrore durante il bootstrap:", err.message);
  process.exit(1);
});
