# Work Continuation

## Latest verified checkpoint — staging isolation complete

- Date/time: `2026-07-12 17:15 PHT` (`Asia/Manila`)
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Pull request: draft PR #2, open, mergeable, and unmerged
- Starting manager checkpoint: `91bf7453ba23b96ea589029308a358f2b5ed8d98`
- CI-verified staging-isolation implementation head: `57a9abf41406fc43c3cdff0ef357220f1a62176f`
- GitHub `CI`: passed, including `npm run check` and browser smoke
- GitHub `Apps Script static check`: passed
- No Google Sheets, Drive, Apps Script deployment, migration, production, or PR-merge action was performed

## What this milestone completed

- Removed hardcoded operational and backup spreadsheet IDs from Apps Script runtime code.
- Added required Apps Script Script Properties:
  - `HAU_ENVIRONMENT`
  - `HAU_SPREADSHEET_ID`
  - `HAU_BACKUP_SPREADSHEET_ID`
- Accepted environments are only `STAGING` and `PRODUCTION`.
- Missing, placeholder, malformed, unsupported, or identical operational/backup values fail closed.
- There is no silent production fallback.
- `getDatabase_()` opens only the explicitly configured operational spreadsheet.
- Setup, schema validation, Drive configuration rows, migration/reconciliation access, launch backups, and health checks now use the resolved environment target.
- `setupDatabase()` can bootstrap a setup administrator before `14_USERS_ACCESS` exists or contains rows.
- `healthCheck()` now reports the active environment and target spreadsheet IDs and is restricted to administrators.
- Added regression tests for missing properties, staging selection, production selection, and no hardcoded fallback.
- Updated setup, security, overview, changelog, and project-status documentation.

## Files changed in the staging-isolation milestone

- `apps-script/Config.gs`
- `apps-script/Setup.gs`
- `apps-script/BackupService.gs`
- `apps-script/Code.gs`
- `tests/unit/apps-script-pure.test.js`
- `docs/APPS_SCRIPT_SETUP.md`
- `docs/SECURITY_AND_ACCESS.md`
- `README.md`
- `CHANGELOG.md`
- `PROJECT_STATUS.md`
- `docs/WORK_CONTINUATION.md`

Generated visual artifacts and the authoritative visual baseline were not intentionally changed.

## Current demo-readiness estimate

- Full live demo deployment: approximately **75% complete**
- Application/repository code for a controlled demo: approximately **90% complete**
- Live Google Workspace integration and deployment: approximately **25% complete**

These are management estimates. The percentage should increase only after verified staging evidence.

## What already works

- Approved responsive interface and request-only portal
- Request Center and predictive catalog search
- Inventory Management
- Office Lending Hub
- Release Desk
- Restocking and receiving
- Procurement and deliverables
- Canvass and supplier references
- Mock-mode local/shareable demo
- Apps Script service adapter and backend workflow modules
- Server authorization, locks, idempotency, server IDs, status history, audit/error logging
- Append-only inventory ledger and reservations
- Evidence validation, privacy-safe labels/filenames, Drive routing, digest duplicate detection, and recovery logic
- Migration dry-run, reconciliation, backup, setup, schema validation, and health-check functions
- Automated lint, unit tests, build, static Apps Script checks, artifact verification, and remote browser-smoke tests

## Remaining blockers for a real live demo

- Create a disposable staging operational spreadsheet.
- Create a separate staging baseline/backup spreadsheet.
- Create a dedicated staging Drive root folder.
- Create a standalone staging Apps Script project.
- Configure the three required Script Properties.
- Configure an untracked `.clasp.json` and authenticate `clasp` locally.
- Push the reviewed bundle to staging.
- Assign and validate all seven Drive folder IDs.
- Seed reviewed institutional access rows in `14_USERS_ACCESS`.
- Run setup, schema validation, Drive validation, migration dry-run, reconciliation, launch backup, and health check.
- Deploy the staging web app and complete one real Sheet/Drive end-to-end workflow.

## Next recommended action

Prepare the three disposable Google staging resources:

1. Demo operational spreadsheet copy
2. Separate demo baseline/backup spreadsheet copy
3. Dedicated Drive root folder

Then create a standalone staging Apps Script project and set:

```text
HAU_ENVIRONMENT = STAGING
HAU_SPREADSHEET_ID = <demo operational spreadsheet ID>
HAU_BACKUP_SPREADSHEET_ID = <separate demo backup spreadsheet ID>
```

After the staging Script ID exists, configure untracked `.clasp.json`, run `npm run check`, `npm run build`, `clasp status`, and `clasp push --dry-run`. Do not push or run Google writes until the displayed target is reviewed.

## Fresh-chat recovery instructions

A new project chat should begin with:

> Verify GitHub repository `invicta-ctrl/hau-usc-logistics-management-system`, branch `feat/apps-script-backend-and-launch-readiness`, draft PR #2. Read `AGENTS.md`, `README.md`, `PROJECT_STATUS.md`, and `docs/WORK_CONTINUATION.md` first. Then read the setup/security/launch documents relevant to the requested milestone. Confirm the current head and CI before editing. Work directly in GitHub when supported and use Codex only for genuinely local or authenticated operations.

Required reading order:

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

Always verify GitHub instead of trusting an old commit written in this file. Stop if another agent is writing to the same branch.

## Safety rules that remain mandatory

- Never transact `VERIFY` items.
- Never edit or delete posted ledger entries; use reversals/adjustments.
- Never write to the pre-rework backup spreadsheet.
- Never allow missing Drive configuration to fall back to My Drive root.
- Never commit `.clasp.json`, credentials, institutional accounts, personal records, supplier TINs, or evidence files.
- Request-only users must not receive internal quantities, users, ledgers, reservations, suppliers, evidence internals, audits, errors, health reports, or configuration values.
- Do not apply migration or deploy production without explicit DOL approval.
