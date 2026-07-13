# Launch Runbook

## Current `1.0.0-rc.1` release gate

The repository candidate and standalone portal artifacts may be built and reviewed locally. The exact title-labeled staging project is privately reconciled at immutable Version 10 with Version 9 retained, and the production target retains Version 1. Google mutation remains blocked until an owner-authorized Sheets/Drive access mechanism verifies Script Properties, operational/backup separation, authoritative Drive mappings, a restorable pre-push backup, and the intended web-app audience. Production remains a later gate after staging acceptance and owner/privacy/security approval.

## Staging

1. Confirm branch/commit and passing CI.
2. Build; only after target confirmation, run `clasp status` and complete the remote snapshot/status/manifest comparison below against staging.
3. Run schema setup/validation, configure and validate all eleven canonical Drive folders, seed reviewed users, and create triggers.
4. Run migration dry-run and reconciliation; resolve all launch-blocking `VERIFY` decisions without modifying legacy cells.
5. Create a launch backup; record backup ID privately.
6. Deploy staging web app. Test internal and `?request=1` entry points with separate authorized/unauthorized accounts.
7. Run the complete staging acceptance matrix and verify audit/history/error/evidence records.

### Clasp 3.3 manifest safeguard

Clasp 3.3.0 does not provide a supported simulated-push flag. Use `clasp status` for the bounded file list and retain generated hashes/sizes from `npm run check:apps-script`.

Do not interpret `Skipping push` as proof that Apps Script is current. When `appsscript.json` differs, clasp 3.3 attempts an overwrite confirmation; in a non-interactive session it can decline and skip every file. Before creating a version:

1. pull a read-only remote snapshot into a separate temporary checkout;
2. compare the complete remote/local file set without exposing the Script ID;
3. preserve reviewed remote `webapp` access settings exactly;
4. use `clasp push --force` only with explicit staging authorization and only after the manifest comparison is approved;
5. pull again and require exact file parity before versioning or updating the existing deployment.

Never create a new immutable version merely because a push command exited successfully; first verify that remote source actually changed to the reviewed package.

### Apps Script request-flag boundary

Do not derive access mode solely from `location.search` in client JavaScript. Apps Script serves the application inside a sandbox iframe whose URL may not retain the outer `/exec` query. Parse access flags in `doGet(e)`, inject the server result into evaluated HTML, and make the browser send that trusted value to bootstrap. Test both the internal and request-only template evaluations in a browser before deployment.

## V1 staging migration and acceptance sequence

This sequence is a handoff plan only. It does not authorize external actions.

1. Verify the exact reviewed `1.0.0-rc.1` commit, clean checkout, CI, `npm run check`, `npm run verify`, deterministic artifact hashes, and the complete browser matrix including the three named shareable portals. Confirm `.clasp.json`, Script IDs, spreadsheet/Drive IDs, credentials, personal records, supplier TINs, and evidence files are untracked and not staged.
2. Create and privately record a fresh staging schema backup before changing source or headers.
3. Use the clasp manifest safeguard above to compare remote/local files, preserve the existing staging `webapp` access block, push the reviewed package only with explicit authorization, and pull again for exact parity.
4. Before activating the new web version, run additive `setupDatabase()` against the configured staging operational spreadsheet.
5. Confirm schema `1.2.0`: expected headers through `22_COMMAND_JOURNAL`; additive catalog/access/revision fields; `20_CONTENT`, `21_BRANDING`, and the command journal; preserved existing values and four legacy tabs; formula-safe central writes; data validations/warning protections; and least-privilege defaults.
6. Run idempotent `setupOperationalEditTrigger()` and confirm there is exactly one matching trigger for the configured staging spreadsheet.
7. Run schema, health, all-eleven-folder, private-sharing, and access validation. Verify the expected environment without exposing resource IDs in public evidence.
8. Using an explicitly authorized Apps Script test deployment that executes the reviewed source without changing the privately verified current staging deployment, exercise revision reads, exactly-one increment per mutation, no increment on reads/replays, a direct human edit, authoritative refresh, two-session polling, dirty-form deferral, predictive lending search, audience/handling rules, catalog permission/edit persistence, unit/archive protection, and request-only privacy. If that test mechanism is unavailable, stop before moving any deployment pointer.
9. Exercise the admin surface with a second non-admin identity: user/event creation and update, last-admin/self-deactivation guards, content expected-revision conflict/save/publish/revert, branding signature/dimension/private-storage upload and activation, and protected-field exclusion. Exercise multi-line release preflight and prove invalid later lines produce no earlier-line mutation; rehearse `RELEASE_RECOVERY_REQUIRED` reconciliation.
10. Reconcile command journal, ledger, reservations, lending, releases, status history, content/branding versions, audit, errors, Drive metadata, and quarantine. Stop on any inventory, authorization, revision, formula-safety, evidence, privacy, or reconciliation failure.
11. Only after acceptance, create one immutable staging version and update the existing deployment ID. Record version, commit, owner, time, and results.

The schema migration is additive before deployment activation, but it is still an external write requiring the verified target and backup. The historically documented Version 9 ignores the earlier appended catalog/revision fields; do not assume that version belongs to the currently authenticated project until the owner confirms it.

## Production promotion

Obtain DOL owner sign-off and use this order:

1. Freeze the reviewed commit, access list, catalog defaults, configuration, and migration evidence.
2. Create and privately record a fresh production backup.
3. Push the exact staging-accepted package to the production Apps Script project using the same remote parity and manifest safeguards.
4. Before activating the web version, run additive `setupDatabase()` and validate schema `1.2.0`, preserved data, operational/backup distinction, environment routing, all eleven Drive mappings/private sharing, and command-journal/content/branding tables.
5. Run `setupOperationalEditTrigger()` once and confirm exactly one matching production trigger.
6. Recheck reviewed `Can_Manage_Catalog` grants; blank must not expose catalog management beyond ADMIN/DOL_DIRECTOR fallback.
7. Create one immutable production version, update the existing restricted deployment, and record deployment owner/version/commit/time/result.
8. Run bounded production acceptance for internal bootstrap, request-only privacy, revision reads, one authorized test mutation and immediate refresh, lending eligibility, catalog permission, admin denial, approved content/branding fallback, release preflight, audit/history/command journal, private evidence handling, and idempotent replay.
9. Stop writes and roll back the deployment pointer on any inventory, authorization, revision, evidence, or privacy failure.

Keep the preceding immutable deployment version available throughout acceptance.

## Rollback sequence

1. Stop new operational writes and capture the failing correlation IDs, revision, deployment version, and affected records.
2. Update the existing deployment ID back to the preceding immutable version; do not create an unrelated deployment ID.
3. Verify internal and request-only rendering and confirm the preceding version is serving.
4. Reconcile every mutation completed before rollback. Do not delete or edit ledger, audit, status-history, lending, request, or evidence records.
5. Retain all additive item/access columns, revision/config rows, content/branding/command-journal tables, and catalog metadata. Never delete posted or versioned data as application rollback.
6. Leave the operational edit trigger in place unless evidence identifies it as the failure source. Removing or disabling it requires explicit owner authorization and must be recorded.
7. Correct the repository, rerun the entire staging sequence, and create a new immutable version; never overwrite historical versions.

## Immediate smoke tests

- health/schema/Drive checks succeed;
- authorized staff bootstrap loads; unauthorized account is denied internal bootstrap;
- request-only portal exposes no internal navigation/data;
- test request submit/review/reserve/release produces one movement;
- test evidence gets safe label/filename and metadata;
- evidence and branding responses expose no Drive ID or URL, and storage remains private;
- a malformed later line makes a multi-line release fail before every operational write;
- content stale-revision mutation fails closed and branding activates only a verified stored version;
- unauthorized administration calls fail even if controls are unhidden in the browser;
- duplicate retry returns the original result;
- revision advances once for the test mutation, remains stable for reads/replays, and another idle session refreshes within approximately 5–10 seconds;
- dirty form input is preserved behind the updates-available banner;
- logs contain correlation IDs and no public stack trace.

If any inventory, authorization, evidence, or privacy test fails, stop writes and follow the recovery runbook. Never repair by deleting ledger rows.

## Unresolved manual values

All eleven canonical Drive folder mappings, staging/production Script IDs and deployment pointers, current/rollback immutable versions, deployment owner, approved access list, content/branding approvers, backup retention, evidence/quarantine retention, malware/PDF handling policy, notification sender, and production audience must be assigned by HAU/DOL.
