# Work Continuation

## Checkpoint

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
