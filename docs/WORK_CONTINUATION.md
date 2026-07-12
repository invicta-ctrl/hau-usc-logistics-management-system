# Work Continuation

## Manager-verified demo deployment checkpoint

- Timestamp: `2026-07-12 16:48 PHT` (`Asia/Manila`)
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Verified remote head: `743450a8cdf9bfa01e68b2ddf548e13af9b3504c`
- Pull request: draft PR #2, open, mergeable, and unmerged.
- GitHub checks at the verified head: `CI` passed and `Apps Script static check` passed, including the remote browser-smoke suite.
- Latest milestone review: approved. The LF/CRLF visual-baseline compatibility change is test-only and did not change authoritative or generated visual artifacts.

### Current demo-readiness estimate

- Full live demo deployment: approximately **70% complete**.
- Application and repository code: approximately **85% complete** for the intended controlled demo.
- Live Google Workspace integration and deployment: approximately **25% complete** because Apps Script, Drive, access rows, and end-to-end staging workflows have not yet been configured or exercised.
- These are management estimates, not automated measurements. Completion changes only after verified staging evidence.

### Next bounded milestone

Implement **staging isolation** before any Google write:

1. Resolve environment, operational spreadsheet ID, and backup spreadsheet ID from required Apps Script Script Properties.
2. Support explicit `STAGING` and `PRODUCTION` values.
3. Fail closed when required properties are missing, placeholders, or invalid.
4. Never silently fall back to the currently hardcoded production spreadsheet IDs.
5. Make setup, migration, reconciliation, backup, and health-check operations use the resolved environment configuration.
6. Make `healthCheck()` report the active environment and target spreadsheet ID for operator verification.
7. Add regression tests, run `npm run check`, update status documentation, commit, push, and verify CI.

No Google Sheets, Drive, Apps Script deployment, migration, or production write is authorized during this repository-only milestone. ChatGPT web may implement this directly; Codex is only needed if a local terminal-only operation becomes unavoidable.

### Steps after staging isolation passes

1. Create a disposable demo copy of the Google Sheet.
2. Create a dedicated Drive root folder for the demo.
3. Create a standalone staging Apps Script project.
4. Configure an untracked `.clasp.json` and authenticate `clasp` locally.
5. Build, inspect `clasp push --dry-run`, then push to staging.
6. Run `setupDatabase()`, schema validation, Drive setup/validation, reviewed access seeding, migration dry-run, reconciliation, launch backup, and `healthCheck()`.
7. Deploy the staging web app.
8. Demonstrate one end-to-end request, review, reservation/procurement, evidence upload, receiving, and release flow.
9. Verify Sheet rows, Drive files, ledger, status history, audit log, idempotent retry, and request-only privacy.

### New-chat recovery instructions

A fresh project chat should begin by reading, in order:

1. `AGENTS.md`
2. `README.md`
3. `PROJECT_STATUS.md`
4. `docs/WORK_CONTINUATION.md`
5. `docs/ROADMAP_TO_V1.md`
6. `docs/ARCHITECTURE.md`
7. `docs/DOMAIN_RULES.md`
8. `docs/SECURITY_AND_ACCESS.md`
9. `docs/APPS_SCRIPT_SETUP.md`
10. `docs/LAUNCH_RUNBOOK.md`

Then verify the active branch, remote head, PR #2, and CI before editing. The expected starting point for the next milestone is commit `743450a8cdf9bfa01e68b2ddf548e13af9b3504c`, unless GitHub shows a newer reviewed head.

## Windows visual-baseline compatibility checkpoint

- Timestamp: `2026-07-12 16:32 PHT` (`Asia/Manila`)
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Starting commit: `50b8c32dd04d489f05f80e40dbc9b01d771010ac`
- Local and upstream were synchronized at `0` ahead / `0` behind before implementation.
- Scope: test-only LF/CRLF compatibility plus status documentation; no approved visual source, extracted fragment, style module, backend, dependency, or production-system change.

### Completed

- Replaced LF-only generated-notice removal with exact prefix matching that consumes at most one optional LF or CRLF ending.
- Added explicit LF, CRLF, no-newline, and unrelated-comment regression assertions.
- Preserved strict comparison of all actual visual markup.

### Verified Windows results

- Environment: Windows PowerShell with Git `core.autocrlf=true`.
- Focused command: `npx vitest run tests/unit/visual-baseline.test.js` passed, 1 file / 4 tests.
- `npm test` passed, 9 files / 55 tests.
- `npm run check` passed: ESLint, 9 files / 55 tests, Vite build, 23 Apps Script files / 16 required functions, and artifact verification.
- Build output: `dist/index.html` 210.17 kB, 53.32 kB gzip; both standalone artifacts verified at 209,952 bytes during the full check.
- The Windows build introduced generated-file line-ending churn only; those unintended generated changes were removed, and `npm run verify:dist` then passed against the unchanged committed artifacts at 209,953 bytes each.
- Final generated-artifact diff: none.
- `npm run test:e2e`: not run because the configured Playwright Chromium executable was absent; no browser was installed as part of this milestone.

### Files changed

- `tests/unit/visual-baseline.test.js`
- `CHANGELOG.md`
- `PROJECT_STATUS.md`
- `docs/WORK_CONTINUATION.md`

### External actions

- `git fetch origin --prune` and the authorized feature-branch push are the only external repository actions for this checkpoint.
- No Google Sheets, Google Drive, Apps Script, staging, production, deployment, or pull-request merge action was performed.

### Recommended next action

Have ChatGPT web verify the pushed commit diff and GitHub CI for draft PR #2 before assigning another milestone.

## Previous launch-readiness checkpoint

- Timestamp: `2026-07-12 15:00 PHT` (`Asia/Manila`)
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Latest locally and CI-verified implementation commit: `825730c28cccb88bfad5a8f3252671307bbe1505`
- Latest CI-verified documentation checkpoint: `a52e071fbda753af7bda4879994dc7577a511138`
- Current CI-verified repository head before the collaboration update: `4cf94f36fecf69728bd2525002dbf3457ac80d9b`
- Branch pushed: **yes**, through the head above
- Pull request: **draft PR #2**
- Pull request URL: https://github.com/invicta-ctrl/hau-usc-logistics-management-system/pull/2
- Recommended Codex checkout: `D:\Documents\DOL Website GitHub`. The user must verify its branch, upstream, commit, and working tree locally; the path alone is not proof that it is current.

## Verified current state

- Before this checkpoint the remote feature branch was 12 commits ahead and 0 behind `main`; PR #2 remains open, draft, mergeable, and unmerged.
- Commits `825730c2` and `a52e071f` were pushed successfully. Both passed the GitHub `CI` and `Apps Script static check` workflows, including Playwright on six configured viewport widths.
- `npm install`, `npm run lint`, `npm test`, `npm run build`, `npm run check:apps-script`, and `npm run verify:dist` pass locally.
- Current Vitest result: 9 files, 54 tests passed.
- Current build: self-contained `dist/index.html` and shareable artifact, 209,742 bytes each.
- Local `npm run test:e2e` cannot launch: the Playwright Chromium executable is absent. No local browser assertion ran.
- Production Sheet metadata and all backend headers were inspected read-only.
- All four production legacy tabs match the backup value-for-value in bounded full-tab reads.
- `01_ITEM_MASTER`: 397 records, 394 `ACTIVE`, 3 `VERIFY`, 2 zero quantity, 0 missing unit. The three date-serial quantities remain `VERIFY`.
- Backend operational tables and `14_USERS_ACCESS` currently have zero data rows.
- Drive root/receipts/canvass/release/deliverable values are `TO_BE_ASSIGNED`; lending and archive configuration rows are absent.

## Completed in this checkpoint

- Sanitized requester catalog/bootstrap records so exact stock quantities, reservation values, verification notes, and legacy trace fields are not returned.
- Changed request-only UI routing to `PENDING_REVIEW`; the server remains authoritative during locked DOL review.
- Added server-side permission mapping for all evidence types before file processing or Drive access.
- Added regression tests for requester record sanitization, requester event sanitization, and evidence permission routing.
- Updated generated standalone and Apps Script HTML artifacts through `npm run build`.
- Added a shared ChatGPT web/Codex repository workflow with mandatory Git synchronization, manager/implementer roles, one-writer control, and standard task/handoff packets.

## Files changed in this checkpoint

- `apps-script/InventoryService.gs`
- `apps-script/Router.gs`
- `apps-script/EvidenceService.gs`
- `src/visual/runtime.js`
- `tests/unit/apps-script-pure.test.js`
- `docs/SECURITY_AND_ACCESS.md`
- `PROJECT_STATUS.md`
- `CHANGELOG.md`
- `docs/WORK_CONTINUATION.md`
- generated: `dist/index.html`, `HAU-USC_Logistics-Prototype-Shareable.html`, `apps-script/Index.html`

## Unfinished work and known defects

- Apps Script has not been pushed to or exercised in a staging Script project.
- No Apps Script workflow test has executed against real staging Sheets/Drive services; current backend tests are VM/static/pure-function checks plus mock-domain integration tests.
- Drive upload recovery, idempotency, locks, authorization, setup, migration, reconciliation, backup, and triggers require staging verification.
- Spreadsheet row writes are not ACID transactions; launch acceptance needs controlled failure-injection and reconciliation tests.
- The generated compatibility runtime remains large and contains preview-only secondary actions.
- Local Playwright remains blocked by the missing Chromium binary.

## Blockers and missing configuration

- `DRIVE_ROOT_FOLDER_ID`
- `DRIVE_RECEIPTS_FOLDER_ID`
- `DRIVE_CANVASS_FOLDER_ID`
- `DRIVE_RELEASE_FOLDER_ID`
- `DRIVE_DELIVERABLE_FOLDER_ID`
- `DRIVE_LENDING_FOLDER_ID`
- `DRIVE_ARCHIVE_FOLDER_ID`
- reviewed institutional rows for `14_USERS_ACCESS`
- staging Apps Script ID and untracked `.clasp.json`
- authenticated clasp setup

## Next recommended action

Open `D:\Documents\DOL Website GitHub` in a new Codex Local task. Have Codex perform only the `AGENTS.md` handshake, confirm it matches the CI-verified GitHub head, read the shared context documents, and run `npm install` plus `npm run check`. Do not begin staging or backend mutations until ChatGPT web reviews that handoff.

## Exact local continuation commands

```bash
cd "D:\Documents\DOL Website GitHub"
npm install
npm run check
npm run test:e2e
```

After a staging Script ID is supplied in an untracked `.clasp.json`:

```bash
clasp status
clasp push --dry-run
```
