# HAU-USC Logistics Management System

The repository currently preserves the implemented **0.4.0 launch-readiness baseline** while preparing the accepted **v0.6 multi-portal, role-aware program**.

The v0.6 transition is intentionally repository-driven so development can continue across fresh Codex/ChatGPT tasks, accounts, or machines without relying on old chat history.

## Start here

For any new maintainer or Codex task, read in this order:

1. `AGENTS.md`
2. `.codex/CURRENT.md`
3. the active specification referenced by `.codex/CURRENT.md`
4. `PROJECT_STATUS.md`
5. `docs/WORK_CONTINUATION.md`
6. `docs/AI_COLLABORATION.md`
7. only the additional architecture/domain/security/source/tests needed by the active milestone

Do not assume `main` contains the newest implementation. Verify the active branch, commit graph, upstream, and current pointer first.

## Current v0.6 routing

The accepted model-routed implementation specifications are:

- `.codex/specs/v0.6-phase-1-sol-high.md`
- `.codex/specs/v0.6-phase-2-terra.md`
- `.codex/specs/v0.6-phase-3-sol-high.md`

See `.codex/specs/README.md` for the phase split.

The active pointer currently starts at **Phase 1 — Sol High** for baseline reconciliation, architecture, authentication, and security contracts.

## Preserved launch-readiness history

The former launch-readiness branch was no longer present as a remote ref when the v0.6 continuity bootstrap began. Its preserved final known commit:

`81efe82618048b79a821f93bd95a0be00eaeff43`

still existed and was verified 63 commits ahead / 0 behind `main` at that checkpoint. It was used as the non-destructive base of:

`chore/v0.6-codex-continuity-bootstrap`

Historical PR #2 is closed and was not merged. Older documentation mentioning an open/draft PR is historical and must not override freshly verified GitHub state.

## Safety status

- Local Vite builds default to `backendMode = 'mock'`.
- Generated Apps Script builds use the Apps Script adapter and explicit environment Script Properties.
- The known staging deployment inherited from the preserved launch-readiness state is immutable Version 9.
- Production promotion has not been performed.
- The v0.6 continuity bootstrap changes repository instructions/specification/status documentation only; it does not authorize Apps Script pushes, operational Sheet/Drive writes, migrations, access seeding, trigger changes, or production actions.

Follow `docs/LAUNCH_RUNBOOK.md` for any explicitly authorized staging/production action.

## Start locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite. In the preserved 0.4.0 implementation, add `?request=1` for the sanitized request-only portal.

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

`npm run build` creates the standalone reviewer artifacts and the parser-safe Apps Script package used by the preserved launch-readiness implementation:

- `dist/index.html` — canonical standalone build
- `HAU-USC_Logistics-Prototype-Shareable.html` — reviewer-facing copy
- `apps-script/Index.html` — Apps Script template shell
- `apps-script/AppBody.html` — generated approved body markup
- `apps-script/AppStyles.html` — generated complete application style element
- `apps-script/AppScript.html` — generated complete application script element

Do not hand-edit generated HTML. Change source/generator files and rebuild.

## Preserved visual baseline and v0.6 visual direction

`legacy/HAU-USC_Logistics-Prototype.original.html` remains the preserved approved historical visual baseline for the 0.4.0 implementation.

For v0.6, follow the accepted source-grounded visual specification referenced by the active phase. Preserve successful structural/interaction patterns instead of rebuilding unrelated modules from scratch.

## Runtime boundaries in the preserved implementation

| Mode | Use | Authority |
|---|---|---|
| `mock` | Local demo/shareable prototype | Browser-only fictional state |
| `apps-script` | Existing staging/pilot boundary | Server authorization, Google Sheets, Drive |
| `rest` | Future hosted frontend/API boundary | Reserved/transition path |

Feature code calls service adapters; it does not read Google Sheets or `google.script.run` directly. While Apps Script remains active, `src/services/apps-script-adapter.js` is the browser-to-Apps-Script gateway.

The accepted v0.6 program later moves toward Cloudflare Workers/API + D1 while retaining Google Drive evidence and Google Sheets reporting sidecars. That migration must occur only through the active v0.6 phase specification and its rollback/reconciliation gates.

## Repository map

```text
.codex/         active Codex pointer, fresh-session bootstrap, accepted phase specs
src/            browser UI, modules, domain rules, adapters
apps-script/    preserved Apps Script backend and generated web package
scripts/        extraction/build/package generation/checks
tests/          Vitest and Playwright coverage
docs/           status, architecture, security, migration, launch, continuation
legacy/         preserved prototype/reference source
dist/           generated standalone artifact
.github/        CI workflows and PR templates
```

## Google Workspace configuration boundary

The preserved Apps Script backend does not contain a hardcoded operational or backup spreadsheet ID. Deployments require explicit Script Properties including:

- `HAU_ENVIRONMENT`
- `HAU_SPREADSHEET_ID`
- `HAU_BACKUP_SPREADSHEET_ID`

Missing/placeholder/malformed values fail closed. Drive folder IDs are controlled configuration values. Do not commit private configuration.

## Historical staging acceptance

The preserved launch-readiness history includes:

- parser-safe staging packaging;
- controlled staging recovery through Version 8;
- Version 9 read-only acceptance of the diagnostic route, authorized internal route, and request-only privacy boundary;
- verified runtime-truthfulness repository repair at `7156c256414b797f4b0f19431b399009f31feebd`;
- successful CI/static-check evidence associated with the preserved predecessor.

Detailed incident and staging evidence remains in:

- `PROJECT_STATUS.md`
- `docs/WORK_CONTINUATION.md`
- `docs/INCIDENT_APPS_SCRIPT_STAGING_WEBAPP_2026-07-12.md`

Do not repeat staging setup, migration dry-runs, Drive setup, backups, or triggers merely because the coding account/session changed.

## First action for a new Codex session

Do **not** begin feature implementation immediately.

1. Open the Git root.
2. Start a fresh task.
3. Read `AGENTS.md` and `.codex/CURRENT.md`.
4. Perform the required Git handshake and fetch/prune.
5. Read the active Phase 1 spec.
6. Reconcile current remote state with the preserved launch-readiness history.
7. Report whether implementation is authorized before editing application code.

The account/session is replaceable; the repository continuity chain is not.
