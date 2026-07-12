# Work Continuation

## Latest verified checkpoint — staging backend ready, web app packaging blocked

- Date/time: `2026-07-12 19:40 PHT` (`Asia/Manila`)
- Repository: `invicta-ctrl/hau-usc-logistics-management-system`
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Pull request: draft PR #2, open, mergeable, unmerged
- Last code head before incident documentation: `cc878ea8b89e9af98eeda3c949a4ed1595242806`
- Incident report commit: `fff79c8779909ae0b25ccbe4008fa26491b24737`
- GitHub Apps Script static check on `cc878ea...`: passed
- GitHub CI on `cc878ea...`: passed
- Current blocker: Apps Script HTML generation / template evaluation
- Production state: untouched by this staging incident

Always verify the current remote head and CI. Documentation commits after the code checkpoint change the branch head without changing application behavior.

## Read this incident report first

`docs/INCIDENT_APPS_SCRIPT_STAGING_WEBAPP_2026-07-12.md`

It contains the failure timeline, observed evidence, attempted packaging fixes, safety boundary, recommended investigation plan, and a bounded Codex task.

## Staging work already completed

The following are complete and must not be repeated merely to debug rendering:

- Dedicated staging Apps Script project created
- Apps Script API enabled
- Local `clasp` authenticated and source pushed
- Required Script Properties configured for `STAGING`
- Runtime configuration validated
- `setupDatabase()` completed against the staging operational spreadsheet
- Database schema validated
- Dedicated staging Drive root and evidence child folders created/configured
- Drive configuration validated
- Migration dry-run completed
- Reconciliation completed
- Timestamped launch backup created
- Daily triggers created and verified:
  - `updateOverdueLending`
  - `scheduledBackup`
- Initial web app deployments created for staging testing

Exact resource IDs and deployment URLs are intentionally not committed. They remain in Script Properties, the user's Workspace resources, and local untracked `.clasp.json`.

## What currently works

- Approved responsive interface and request-only portal in mock/shareable mode
- Request Center and predictive catalog search
- Inventory Management
- Office Lending Hub
- Release Desk
- Restocking and receiving
- Procurement and deliverables
- Canvass and supplier references
- Apps Script service adapter and backend workflow modules
- Server authorization, locks, idempotency, server IDs, status history, audit/error logging
- Append-only inventory ledger and reservations
- Evidence validation, privacy-safe labels/filenames, Drive routing, duplicate detection, and recovery logic
- Staging database setup and schema validation
- Staging Drive configuration
- Migration dry-run and reconciliation
- Launch backup and scheduled triggers
- Repository lint, unit tests, build, Apps Script static check, artifact verification, and browser smoke at the last verified code checkpoint

## Current incident state

The web app progressed through these stages:

1. Initial deployment showed a blank white page.
2. Browser inspection showed a title but zero body HTML.
3. The Apps Script bundle was split into `Index.html`, `AppBody.html`, `AppStyles.html`, and `AppScript.html`.
4. The interface shell then rendered, but remained on the loading overlay.
5. Apps Script Executions showed only `doGet`; `api_getBootstrapData` was never reached.
6. Generator changes attempted to harden bootstrap timing and minified function handling.
7. Web app Version 6 now fails inside `doGet` in roughly half a second.
8. Apps Script reports only: `The log entry was too large and was omitted.`
9. The browser displays raw minified JavaScript as visible page text.

The root cause is unresolved. It is isolated to Apps Script HTML generation/template evaluation before normal backend bootstrap.

## Relevant recent commits

- `fc51d85a9d3a6f35094840003486ac2bd0e236e1` — initialize after late script evaluation
- `e5d73cabc4a39799cae94ee39daac20e1106bdf4` — wrap Apps Script partials in executable shell tags
- `a5a359afa22c69834f04b701996dbec5ced52a98` — support minified bootstrap identifiers
- `cc878ea8b89e9af98eeda3c949a4ed1595242806` — validate minified bootstrap identifiers
- `fff79c8779909ae0b25ccbe4008fa26491b24737` — record the staging web app incident

Do not assume any of these packaging attempts solved the live Apps Script issue merely because static validation passed.

## Do not repeat these operations

Do not rerun the following for the rendering incident:

- `setupDatabase()`
- `setupDriveFolders()`
- migration dry-run
- reconciliation
- launch backup
- trigger setup

Do not run `applyApprovedMigration()`.
Do not touch production resources.
Do not merge PR #2.

## Next bounded milestone

Investigate and fix Apps Script HTML packaging before another deployment.

Required sequence:

1. Verify branch, head, upstream, and clean working tree.
2. Run `npm ci`, `npm run build`, and `npm run check:apps-script`.
3. Inspect the exact generated `apps-script/Index.html` and `apps-script/AppScript.html`.
4. Add a deterministic render/package regression test that proves:
   - body markup is included once
   - CSS is executable, not visible text
   - JavaScript is executable, not visible text
   - no nested script/style wrappers remain
   - bootstrap runs exactly once
   - a mocked `api_getBootstrapData` call is reached
5. Use a minimal diagnostic Apps Script shell before restoring the full bundle.
6. Do not `clasp push` or create another deployment until the local evidence is reviewed.

A general backend rewrite is not the next task. The backend and staging data setup should remain unchanged.

## Suggested Codex task

> Diagnose and fix the Apps Script HTML Service packaging failure on branch `feat/apps-script-backend-and-launch-readiness`. Start from the current remote head. Read `AGENTS.md`, `docs/WORK_CONTINUATION.md`, and `docs/INCIDENT_APPS_SCRIPT_STAGING_WEBAPP_2026-07-12.md`. Do not alter backend domain behavior, staging data, visual design, Script Properties, Drive resources, or production resources. Reproduce the build, inspect the generated Apps Script shell and partials, add a deterministic render/package regression test, and fix the generator so the evaluated page executes the browser bootstrap instead of displaying raw minified JavaScript. Run `npm run check`. Do not run `clasp push` or create a deployment without explicit authorization after review.

## Fresh-chat recovery prompt

> Continue the HAU-USC Logistics staging deployment incident. Verify GitHub repository `invicta-ctrl/hau-usc-logistics-management-system`, branch `feat/apps-script-backend-and-launch-readiness`, draft PR #2. Read `AGENTS.md`, `docs/WORK_CONTINUATION.md`, and `docs/INCIDENT_APPS_SCRIPT_STAGING_WEBAPP_2026-07-12.md` first. Confirm the current head and CI before editing. Staging database setup, Drive folders, migration dry-run, reconciliation, launch backup, and triggers are already complete; do not rerun them. Version 6 `doGet` fails with an omitted oversized log and the page displays raw minified JavaScript. Investigate generated HTML Service packaging and add a deterministic render test before another deployment.

## Required reading order

1. `AGENTS.md`
2. `docs/WORK_CONTINUATION.md`
3. `docs/INCIDENT_APPS_SCRIPT_STAGING_WEBAPP_2026-07-12.md`
4. `README.md`
5. `PROJECT_STATUS.md`
6. `docs/APPS_SCRIPT_SETUP.md`
7. `docs/SECURITY_AND_ACCESS.md`
8. `docs/LAUNCH_RUNBOOK.md`
9. `docs/ARCHITECTURE.md`
10. `docs/DOMAIN_RULES.md`

## Safety rules that remain mandatory

- Never transact `VERIFY` items.
- Never edit or delete posted ledger entries; use reversals/adjustments.
- Never write to the pre-rework backup spreadsheet.
- Never allow missing Drive configuration to fall back to My Drive root.
- Never commit `.clasp.json`, credentials, deployment IDs, personal records, supplier TINs, or evidence files.
- Request-only users must not receive internal quantities, users, ledgers, reservations, suppliers, evidence internals, audits, errors, health reports, or configuration values.
- Do not apply migration or deploy production without explicit DOL approval.
- Only one writer may modify the branch at a time.