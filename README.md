# HAU-USC Logistics Management System

The repository preserves the implemented **v0.5 operations baseline** and its **0.4.0 launch-readiness foundation** while preparing the accepted **v0.6 multi-portal, role-aware program**.

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

The active pointer records **Phase 2 — TERRA complete** at exact delivery checkpoint
`de194f5c37cadf2eb2983cfe3450a1c99ceed735`. The next action is a manual switch to
**Phase 3 — Sol High** followed by a fresh repository/PR/CI handshake. Phase 3 is not active
and production remains gated until that handoff is verified.

Phase 2 system and role guidance is in `docs/V0_6_SYSTEM_GUIDE.md`; its exact completion
evidence and remaining gates are in `.codex/PHASE_2_TERRA_HANDOFF.md`.

## Preserved launch-readiness history

The former launch-readiness branch was no longer present as a remote ref when the v0.6 continuity bootstrap began. Its preserved final known commit:

`81efe82618048b79a821f93bd95a0be00eaeff43`

still existed and was verified 63 commits ahead / 0 behind `main` at that checkpoint. It was used as the non-destructive base of:

`chore/v0.6-codex-continuity-bootstrap`

Historical PR #2 is closed and was not merged. Older documentation mentioning an open/draft PR is historical and must not override freshly verified GitHub state.

## Safety status

- Local Vite builds default to `backendMode = 'mock'`.
- Generated Apps Script builds use the Apps Script adapter and explicit environment Script Properties.
- The accepted staging demo is immutable Version 13; immutable Version 12 is the verified rollback, and isolated Version 26 remains a non-accepted Gate E candidate.
- Production promotion has not been performed.
- Phase 2 repository completion does not authorize Apps Script pushes, operational Sheet/Drive writes, Worker/D1 migration, access seeding, trigger changes, PR merge, or production actions.

Follow `docs/LAUNCH_RUNBOOK.md` for any explicitly authorized staging/production action.

## Version 0.5.0 baseline

Version 0.5.0 is the repository-only live synchronization, lending search, and catalog-controls revision for the Holy Angel University – University Student Council Department of Logistics. It builds on the 0.4.0 launch-readiness foundation while preserving the approved maroon, burgundy, gold, cream, paper, and white prototype and the production Google Apps Script boundary.

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

`npm run build` creates the standalone reviewer artifacts and a parser-safe Apps Script package:

- `dist/index.html` – canonical standalone production build.
- `HAU-USC_Logistics-Prototype-Shareable.html` – reviewer-facing copy with the same bytes.
- `hau-usc-logistics-guided-demo.html` – self-contained offline application
  with an accessible seven-step presenter guide.
- `shareable-html-modules/*.html` – seven ordered, self-contained entry points
  that open directly in Overview, Request Center, Office Lending, Release,
  Restocking, Procurement, or Inventory while retaining shared navigation.
- `apps-script/Index.html` – small Apps Script template shell.
- `apps-script/AppBody.html` – generated approved body markup.
- `apps-script/AppStyles.html` – generated complete application style element.
- `apps-script/AppScript.html` – generated complete application script element with staging runtime configuration.

The module filenames use numeric ordering and lowercase kebab-case; the full
contract is in `docs/SHAREABLE_HTML_MODULES.md`. The Apps Script body, CSS, and
JavaScript are produced from separate Vite outputs. The generator does not
parse minified JavaScript out of `dist/index.html`, and it escapes raw-text
closing sequences before embedding code in HTML. Do not edit generated HTML
directly. Change source or the generator, then rebuild.

## Preserved visual baseline and v0.6 visual direction

`legacy/HAU-USC_Logistics-Prototype.original.html` remains the preserved approved historical visual baseline for the 0.4.0 implementation.

For v0.6, follow the accepted source-grounded visual specification referenced by the active phase. Preserve successful structural/interaction patterns instead of rebuilding unrelated modules from scratch.

## Runtime boundaries in the preserved implementation

| Mode          | Use                                 | Authority                                  |
| ------------- | ----------------------------------- | ------------------------------------------ |
| `mock`        | Local demo/shareable prototype      | Browser-only fictional state               |
| `apps-script` | Existing staging/pilot boundary     | Server authorization, Google Sheets, Drive |
| `rest`        | Future hosted frontend/API boundary | Reserved/transition path                   |

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
- successful CI/static-check evidence associated with the preserved predecessor;
- recovery to accepted immutable Version 13 with Version 12 retained as rollback;
- isolated Version 26 Gate E evidence without production promotion.

Detailed incident and staging evidence remains in:

- `PROJECT_STATUS.md`
- `docs/WORK_CONTINUATION.md`
- `docs/INCIDENT_APPS_SCRIPT_STAGING_WEBAPP_2026-07-12.md`

Do not repeat staging setup, migration dry-runs, Drive setup, backups, or triggers merely because the coding account/session changed.

The preservation-first local workspace classification and recovery map is in
[`docs/WORKSPACE_CONSOLIDATION.md`](docs/WORKSPACE_CONSOLIDATION.md).
The live Phase 3.5 folder, branch, PR, preservation, and execution plan is in
[`docs/REPOSITORY_AND_WORKSPACE_CONSOLIDATION_PLAN.md`](docs/REPOSITORY_AND_WORKSPACE_CONSOLIDATION_PLAN.md).

## First action for a new Codex session

Do **not** begin feature implementation immediately.

1. Open the Git root.
2. Start a fresh task.
3. Read `AGENTS.md` and `.codex/CURRENT.md`.
4. Perform the required Git handshake and fetch/prune.
5. Read `.codex/PHASE_2_TERRA_HANDOFF.md`.
6. Manually switch to GPT-5.6 Sol High before reading the Phase 3 specification.
7. Reconcile local HEAD, upstream, worktrees, draft PR #9 head, and CI with the exact Phase 2 delivery checkpoint.
8. Report whether the Phase 3 start condition is satisfied before editing application code, migrating data, deploying, or promoting production.

The account/session is replaceable; the repository continuity chain is not.
