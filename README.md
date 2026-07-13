# HAU-USC Logistics Management System

Version 0.4.0 is the launch-readiness branch for the Holy Angel University – University Student Council Department of Logistics. It preserves the approved maroon, burgundy, gold, cream, paper, and white prototype while adding a production Google Apps Script boundary for the prepared Google Sheet and future Drive evidence folders.

> **Safety status:** local Vite builds default to `backendMode = 'mock'`. The generated Apps Script package uses `backendMode = 'apps-script'` for staging. No production deployment or spreadsheet mutation is performed by repository commands. The application must remain in staging until the launch runbook passes.

## Start locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite. Add `?request=1` for the sanitized request-only portal.

## Verification and builds

```bash
npm run lint
npm test
npm run build
npm run check:apps-script
npm run verify:dist
npm run check
npm run test:e2e              # requires Playwright Chromium
```

## Codex instruction refinement and routing

Natural instructions may be used, but implementation starts only after the
project routing gate has classified and, when needed, refined them. The gate
reads the authoritative project guidance, preserves the original instruction
locally, validates a structured brief, selects a verified model/reasoning pair,
and blocks unsafe or ambiguous work. Complete prompts and precise named-file
commands are not unnecessarily expanded.

```powershell
# Validate the project routing policy
npm run codex:validate

# Refine only, then inspect the brief
.\scripts\codex-route.ps1 -Instruction "Fix the inventory search." -RefineOnly
Get-Content .codex\runtime\current-task-brief.md

# Assess a route without starting a worker
.\scripts\codex-route.ps1 -Instruction "Fix the inventory search." -Assess

# Execute only after reviewing the brief and route
.\scripts\codex-route.ps1 -Instruction "Fix the inventory search." -Execute
.\scripts\codex-route.ps1 -PromptFile .\tasks\approved-task.md -Execute

# Review the latest local route and review output
.\scripts\codex-route.ps1 -ReviewLatest
```

The launcher uses read-only structured refinement, explicit `codex exec`
sandbox flags, allowlisted verification profiles, and an independent review.
It never performs Apps Script, Sheet, Drive, deployment, migration, or merge
actions. See `.codex/routing/` for policy, schemas, examples, and limitations.

`npm run build` creates the standalone reviewer artifacts and a parser-safe Apps Script package:

- `dist/index.html` – canonical standalone production build.
- `HAU-USC_Logistics-Prototype-Shareable.html` – reviewer-facing copy with the same bytes.
- `apps-script/Index.html` – small Apps Script template shell.
- `apps-script/AppBody.html` – generated approved body markup.
- `apps-script/AppStyles.html` – generated complete application style element.
- `apps-script/AppScript.html` – generated complete application script element with staging runtime configuration.

The Apps Script body, CSS, and JavaScript are produced from separate Vite outputs. The generator does not parse minified JavaScript out of `dist/index.html`, and it escapes raw-text closing sequences before embedding code in HTML. Do not edit generated HTML directly. Change source or the generator, then rebuild.

## Approved visual baseline

`legacy/HAU-USC_Logistics-Prototype.original.html` remains the authoritative visual source. `npm run extract:visual` reproducibly extracts its shell, seven view fragments, ordered CSS modules, and compatibility runtime. Small backend changes must not regenerate the design or replace it with a generic dashboard.

## Runtime modes

| Mode | Use | Authority |
|---|---|---|
| `mock` | Local demo and shareable prototype | Browser-only fictional state |
| `apps-script` | Staging and initial production web app | Server authorization, Google Sheets, and Drive |
| `rest` | Future hosted frontend | Reserved secure HTTP adapter boundary |

Feature code calls service adapters; it never reads Google Sheets or `google.script.run` directly. `src/services/apps-script-adapter.js` is the only browser-to-Apps-Script gateway.

## Repository map

```text
src/            approved browser UI, modules, domain rules, and adapters
apps-script/    V8 Apps Script backend, generated web package, setup, migration, backup
scripts/        visual extraction, standalone build, Apps Script package generation/checks
tests/          Vitest domain/package tests and Playwright browser checks
docs/           architecture, schema, security, deployment, migration, and launch runbooks
legacy/         preserved approved prototype
dist/           generated standalone artifact
.github/        pull-request template and CI workflows
```

## Google Workspace target

Apps Script does not contain a hardcoded operational or backup spreadsheet ID. Each deployment must set these Script Properties explicitly:

- `HAU_ENVIRONMENT`
- `HAU_SPREADSHEET_ID`
- `HAU_BACKUP_SPREADSHEET_ID`

The backend accepts only `STAGING` or `PRODUCTION`, rejects unresolved placeholders, requires separate operational and backup spreadsheets, and fails closed before opening a Sheet when configuration is invalid. Drive folder IDs remain controlled configuration values. See `docs/APPS_SCRIPT_SETUP.md`.

## Staging HTML diagnostic

The repository includes an isolated `DiagnosticShell.html`. After a reviewed staging push and deployment, `?diagnostic=1` is available only when `HAU_ENVIRONMENT=STAGING`. It proves template evaluation, body rendering, style application, inline JavaScript, and one harmless `google.script.run` round trip without reading or writing operational data. The admin-only `htmlTemplateDiagnostics()` function reports bounded lengths, prefixes, and suffixes; it never logs the complete generated application.

Controlled staging Version 8 passed all four diagnostic checks and the authorized internal `/exec` entry point rendered without raw JavaScript or a loading-overlay stall. Its live `?request=1` privacy test failed because the outer query was lost inside the Apps Script sandbox iframe. The repository now injects the server-trusted request-only value into the generated body and tests both bootstrap modes, but that repair is not yet deployed. No production deployment or operational workflow write has been performed as part of this recovery.

## First steps for a maintainer

1. Read `AGENTS.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, `docs/AI_COLLABORATION.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_RULES.md`, `docs/SECURITY_AND_ACCESS.md`, and `docs/LAUNCH_RUNBOOK.md`.
2. Run `npm install && npm run check`.
3. Work on the feature branch; do not edit the default branch directly.
4. Never transact a `VERIFY` item or expose internal bootstrap data to request-only users.
5. Update tests, `PROJECT_STATUS.md`, `CHANGELOG.md`, and `docs/WORK_CONTINUATION.md` with verified facts.

## AI collaboration

ChatGPT web and Codex do not rely on shared chat memory. They coordinate through the active GitHub branch, pull request, `AGENTS.md`, and the continuation record. Use the one-writer manager/implementer protocol in `docs/AI_COLLABORATION.md` before starting a coding milestone.
