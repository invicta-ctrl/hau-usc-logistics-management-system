# HAU-USC Logistics Management System

Version `1.0.0-rc.1` is the repository-ready V1 release candidate for the Holy Angel University University Student Council Department of Logistics. It preserves the approved maroon, oxblood, gold, cream, and white visual baseline while adding secure request, lending, inventory, release/return, procurement, evidence, content, branding, and administration workflows.

> **Release truth:** the repository is a release candidate with a verified Apps Script staging and production deployment record. The current staging pointer is immutable Version 13 and the current production pointer is immutable Version 3; both were pulled back with exact 33-file source parity. Live read-only portal smoke passed, but the full mutation acceptance matrix, release approval, merge, tag, and GitHub release remain intentionally incomplete.

## Verified deployment snapshot

The current Apps Script backend is serving the reviewed package in both staging and production. Staging uses the existing web deployment at Version 13, and production uses the existing web deployment at Version 3. Both environments report the expected Apps Script mode in the live browser. Fresh private predeployment spreadsheet backups were created and verified for both environments, schema 1.2.0 setup and health/reconciliation checks completed, and canonical Drive configuration was validated.

The live acceptance evidence is deliberately bounded: internal, request-only, and requester-safe lending pages load without the tested private-data fields; invalid legacy handling values remain blocked as VERIFY/non-circulating. No operational workflow mutation, evidence upload, content/branding change, or production transaction was executed. See [Project Status](PROJECT_STATUS.md), [Work Continuation](docs/WORK_CONTINUATION.md), and [V1 Readiness Audit](docs/V1_READINESS_AUDIT.md) for the exact gate state.

## Ready in this release candidate

- Main staff workspace with dynamic event readiness, Request Center, inventory/catalog controls, restocking, procurement, canvass history, Lending Hub, Release Desk, returns, Roadmap, What Changed, and a permission-gated Admin Dashboard.
- Dedicated request-only and lending-only portal modes with server-owned routing and sanitized bootstraps. Public/requester responses exclude protected balances, ledger, suppliers, contacts, tax fields, users, permissions, audit data, private notes, Drive configuration, and private evidence references.
- Apps Script services with server-side authorization, locks for racing mutations, idempotency, stable IDs/errors, audit/status history, additive Sheets setup, append-only stock movements, content revision conflicts, and recovery-required release diagnostics.
- Fail-closed Drive configuration with eleven canonical folders, private-sharing checks, deterministic filenames, MIME/extension/magic-byte/size/image-bound validation, checksum deduplication, quarantine recovery, and protected branding upload/version activation.
- Fictional local demo data with explicit `Demo` identities and reserved `.invalid`, contact, student, and tax tokens.
- A future-platform proposal comparing current providers and retaining PostgreSQL command authority, a transactional outbox, asynchronous Sheets projection, reconciliation, retry, and dead-letter handling.

## Shareable portal HTML files

`npm run build` creates self-contained classic-script HTML files with inline CSS and JavaScript. They can be opened directly from disk and do not require a server:

| Portal | Artifact | Pinned mode |
| --- | --- | --- |
| Main Hub | [HAU-USC_Logistics-Main-Hub-Shareable.html](HAU-USC_Logistics-Main-Hub-Shareable.html) | Internal demo workspace |
| Request Center | [HAU-USC_Logistics-Request-Center-Shareable.html](HAU-USC_Logistics-Request-Center-Shareable.html) | Sanitized request portal |
| Lending Hub | [HAU-USC_Logistics-Lending-Hub-Shareable.html](HAU-USC_Logistics-Lending-Hub-Shareable.html) | Sanitized lending portal |

The historical [HAU-USC_Logistics-Prototype-Shareable.html](HAU-USC_Logistics-Prototype-Shareable.html) remains a byte-identical alias of `dist/index.html`. All standalone files use fictional browser-local data; they are demonstrations, not authenticated operational systems. Do not place real student, supplier, finance, or evidence data in them.

## Start locally

```bash
npm ci
npm run dev
```

Open the URL printed by Vite. Use `?request=1` for Request Center or `?lending=1` for Lending Hub when testing through the development server.

## Verification

```bash
npm test
npm run check
npm run verify
npm run check:agents
npm run check:continuation
npm run check:sensitive
npm run check:docs
npm run test:e2e
```

Playwright covers 320, 390, 768, 1024, 1366, and 1440 px. The portal-specific browser suite also opens each root shareable through `file://`, confirms its pinned mode, and checks page-level overflow at every required width. Current exact results are recorded in [Project Status](PROJECT_STATUS.md) and [V1 Readiness Audit](docs/V1_READINESS_AUDIT.md).

## Generated-file ownership

`npm run build` owns these files:

- `dist/index.html`
- all four root `*-Shareable.html` artifacts listed above, including the compatibility alias
- `apps-script/Index.html`
- `apps-script/AppBody.html`
- `apps-script/AppStyles.html`
- `apps-script/AppScript.html`

Do not hand-edit generated HTML. Change source or the generator, rebuild, and require `npm run check:apps-script` plus `npm run verify:dist` to pass.

## Approved visual baseline

`legacy/HAU-USC_Logistics-Prototype.original.html` remains the approved visual authority. Run `npm run extract:visual` only when intentionally regenerating the visual modules; do not casually redesign or replace it with a generic dashboard.

## Runtime boundaries

| Mode | Purpose | Authority |
| --- | --- | --- |
| `mock` | Local and standalone fictional demo | Browser-local state only |
| `apps-script` | Current deployed staging and production backend | Apps Script authorization, Sheets repositories, Drive storage |
| `rest` | Future hosted system | Reserved HTTP adapter boundary; no hosted API exists yet |

Browser features call semantic service adapters. Only `src/services/apps-script-adapter.js` may invoke `google.script.run`. UI hiding is never authorization.

## Google Workspace configuration

Each Apps Script environment must resolve these restricted Script Properties:

- `HAU_ENVIRONMENT`
- `HAU_SPREADSHEET_ID`
- `HAU_BACKUP_SPREADSHEET_ID`

The operational and backup IDs must be different. The configured Drive root and eleven canonical child-folder mappings must also validate as private, exact, direct children. Missing, conflicting, unsafe, or wrong-target configuration stops setup and uploads; there is no My Drive root fallback.

See [Apps Script Setup](docs/APPS_SCRIPT_SETUP.md), [Google Drive Evidence](docs/GOOGLE_DRIVE_EVIDENCE.md), and [Launch Runbook](docs/LAUNCH_RUNBOOK.md). Never commit `.clasp.json`, credentials, private resource IDs, personal records, supplier tax data, or evidence files.

## Documentation map

Start with [Documentation Index](docs/DOCUMENTATION_INDEX.md). The canonical architecture, domain, security, API, Sheets, Drive, testing, operations, requester, administrator, future-platform, and recovery guides are linked there.

Maintainers must first read `AGENTS.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, `docs/AI_COLLABORATION.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_RULES.md`, `docs/SECURITY_AND_ACCESS.md`, and `docs/LAUNCH_RUNBOOK.md`.
