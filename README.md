# HAU-USC Logistics Management System

Version 0.4.0 is the launch-readiness branch for the Holy Angel University – University Student Council Department of Logistics. It preserves the approved maroon, burgundy, gold, cream, paper, and white prototype while adding a production Google Apps Script boundary for the prepared Google Sheet and future Drive evidence folders.

> **Safety status:** local Vite builds default to `backendMode = 'mock'`. `apps-script/Index.html` is generated with `backendMode = 'apps-script'` for staging. No production deployment or spreadsheet mutation is performed by repository commands. The application must remain in staging until the launch runbook passes.

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

`npm run build` creates three self-contained files:

- `dist/index.html` – canonical standalone production build.
- `HAU-USC_Logistics-Prototype-Shareable.html` – reviewer-facing copy with the same bytes.
- `apps-script/Index.html` – Apps Script HTML Service bundle with the staging adapter enabled.

Do not edit generated HTML directly. Change source and rebuild.

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
apps-script/    V8 Apps Script backend, repositories, workflows, setup, migration, backup
tests/          Vitest domain/backend tests and Playwright responsive checks
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

## First steps for a maintainer

1. Read `AGENTS.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, `docs/AI_COLLABORATION.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_RULES.md`, `docs/SECURITY_AND_ACCESS.md`, and `docs/LAUNCH_RUNBOOK.md`.
2. Run `npm install && npm run check`.
3. Work on the feature branch; do not edit the default branch directly.
4. Never transact a `VERIFY` item or expose internal bootstrap data to request-only users.
5. Update tests, `PROJECT_STATUS.md`, `CHANGELOG.md`, and `docs/WORK_CONTINUATION.md` with verified facts.

## AI collaboration

ChatGPT web and Codex do not rely on shared chat memory. They coordinate through the active GitHub branch, pull request, `AGENTS.md`, and the continuation record. Use the one-writer manager/implementer protocol in `docs/AI_COLLABORATION.md` before starting a coding milestone.
