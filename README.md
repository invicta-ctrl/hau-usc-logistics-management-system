# HAU-USC Logistics Management System

Version 0.5.0 is the repository-only live synchronization, lending search, and catalog-controls revision for the Holy Angel University – University Student Council Department of Logistics. It builds on the 0.4.0 launch-readiness foundation while preserving the approved maroon, burgundy, gold, cream, paper, and white prototype and the production Google Apps Script boundary.

> **Safety status:** local Vite builds default to `backendMode = 'mock'`. The generated Apps Script package uses `backendMode = 'apps-script'` for staging. Slices 1-3 were accepted on staging Version 18 with Version 13 preserved for rollback; the current Slice 4 roster implementation is repository-only and has not been deployed. No Slice 4 Sheet, Drive, trigger, or other external write was performed; production remains untouched.

## Version 0.5.0 scope

- Successful Apps Script mutations reload authoritative bootstrap state before the interface renders success. A recorded mutation is never submitted again merely because the follow-up reload failed.
- Internal sessions use a fail-closed 15-second jittered scoped-revision check only while visible, online, and focused or recently active. Unchanged checks fetch no module data; changed checks refresh only the active bounded module. This is polling, not WebSockets or server push.
- Direct human edits can advance the revision through an idempotently installed operational spreadsheet edit trigger.
- Dirty forms and active modal work defer background reloads and show a non-blocking “New operational data is available” choice instead of discarding input.
- The Lending Hub uses an accessible predictive item search with borrower-aware audience, handling, stock, verification, and quantity explanations. Final eligibility is always revalidated on the server.
- Authorized catalog managers can create, edit, relocate, archive, and restore items through audited Apps Script APIs. Item IDs, ledger history, quantity truth, provenance, and unsafe unit changes remain protected.

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

The accepted Slices 1-3 repository and staging evidence is recorded in `PROJECT_STATUS.md`. The current Slice 4 local gates pass: `npm run check` (21 Vitest files / 177 tests, build, Apps Script validation, generated parity, and standalone verification), `npm run verify`, full Playwright (50 passed / 100 intentional skips / 0 failures across 150), lint, diff check, and the changed-scope sensitive scan. Live staging and production actions remain separately gated.

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

Controlled staging Version 9 passed the diagnostic, authorized internal `/exec`, and request-only `/exec?request=1` privacy checks. Version 0.5.0 remains repository-only and has not changed that deployment. No production deployment or operational workflow write was performed for this revision.

## First steps for a maintainer

1. Read `AGENTS.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, `docs/AI_COLLABORATION.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_RULES.md`, `docs/SECURITY_AND_ACCESS.md`, and `docs/LAUNCH_RUNBOOK.md`.
2. Run `npm install && npm run check`.
3. Work on the feature branch; do not edit the default branch directly.
4. Never transact a `VERIFY` item or expose internal bootstrap data to request-only users.
5. Update tests, `PROJECT_STATUS.md`, `CHANGELOG.md`, and `docs/WORK_CONTINUATION.md` with verified facts.

The preservation-first local workspace classification and recovery map is in
[`docs/WORKSPACE_CONSOLIDATION.md`](docs/WORKSPACE_CONSOLIDATION.md).
The live Phase 3.5 folder, branch, PR, preservation, and execution plan is in
[`docs/REPOSITORY_AND_WORKSPACE_CONSOLIDATION_PLAN.md`](docs/REPOSITORY_AND_WORKSPACE_CONSOLIDATION_PLAN.md).

## AI collaboration

ChatGPT web and Codex do not rely on shared chat memory. They coordinate through the active GitHub branch, pull request, `AGENTS.md`, and the continuation record. Use the one-writer manager/implementer protocol in `docs/AI_COLLABORATION.md` before starting a coding milestone.
