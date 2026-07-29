# Launch Runbook

## v0.6 Cloudflare/D1 staging candidate

The v0.6 Worker/D1 candidate is governed separately from the preserved Apps Script staging runtime below. Repository/local completion does not authorize account access or deployment.

1. Freeze the exact commit and run `npm run check`, `npm run test:e2e`, the local workerd browser suite, audit checks, sensitive scans, and `git diff --check`.
2. Push the candidate branch and verify the draft PR head and all required CI at that exact commit.
3. Create the private package outside Git with `npm run phase3:authorization:init -- <absolute-private-json-path>`. Complete it privately with the exact Cloudflare account, staging Worker/D1/route, Google operator/workbook/Drive mapping, rollback, fixture, time-window, stop-authority, and evidence labels.
4. Require `npm run phase3:authorization:check -- <absolute-private-json-path>` to validate the candidate hashes and approve Gate B before the first `wrangler whoami` or Google read.
5. Perform only the read-only target/identity/capacity/source/rollback preflight authorized at Gate B. Stop on any drift or production binding.
6. Require Gate C before backup, secret setup, Sheet export, D1 migration, or import. Follow `docs/D1_MIGRATION_AND_ROLLBACK.md` and keep all exports, SQL, rejections, configs, backups, IDs, and evidence outside Git.
7. Require Gate D before deploying the exact candidate to the separately named staging Worker and route.
8. Require Gate E before synthetic workflow writes, evidence uploads, or rollback rehearsal. Run every row in the external prompt's staging acceptance matrix and stop on privacy, authorization, inventory, ledger, evidence, idempotency, or rollback failure.
9. Require Gate F before cleanup or retention changes. Record only safe labels, counts, hashes, commit, URL, and check results in public repository evidence.

Never target production, merge PR #9, update `main`, expose a private identifier, or claim Phase 3 complete until the externally reachable staging site, approved Sheet import, reconciliation, rollback rehearsal, final repository acceptance, commit/push, remote head, and CI all pass.

## Staging

Complete Gate A in `STAGING_OPERATIONAL_ACCEPTANCE.md` before step 1. An old
private config, deployment report, or blanket continuation instruction does not
identify the current authorized target, operator, fixture, testers, or allowed
write categories.

Create the private Gate A record outside Git with
`npm run staging:authorization:init -- <absolute-private-json-path>` and require
`npm run staging:authorization:check -- <absolute-private-json-path>` to report
at least Gate B before any remote source/status read. A structurally valid
record does not authorize a gate reported as `DENIED` or `PENDING`.

1. Confirm branch/commit, passing CI, and a valid outside-Git authorization
   package through Gate B.
2. Run read-only `clasp status` and pull/compare the remote source in a separate
   temporary location; stop on target, source, manifest, audience, rollback, or
   capacity drift.
3. Require Gate C authorization, create and verify the staging backup, and
   record its identifier privately before any setup or write.
4. Run additive schema setup/validation and configure/validate all seven Drive
   folders against the named staging resources only.
5. Run migration dry-run and reconciliation; apply nothing without a separately
   approved report, and resolve launch-blocking `VERIFY` decisions without
   modifying legacy cells.
6. Create or verify approved triggers idempotently.
7. Require Gate D authorization, push/pull the reviewed package with exact
   parity, and use an approved test deployment without moving the accepted
   deployment pointer.
8. Seed only the approved synthetic namespace and least-privilege test roles;
   verify revocation before functional writes.
9. Require Gate E authorization, run the complete staging acceptance and
   rollback-rehearsal matrix, and verify audit/history/error/evidence records.

### Clasp 3.3 manifest safeguard

Clasp 3.3.0 does not support `clasp push --dry-run`. Use `clasp status` for the bounded file list and retain generated hashes/sizes from `npm run check:apps-script`.

Do not interpret `Skipping push` as proof that Apps Script is current. When `appsscript.json` differs, clasp 3.3 attempts an overwrite confirmation; in a non-interactive session it can decline and skip every file. Before creating a version:

1. pull a read-only remote snapshot into a separate temporary checkout;
2. compare the complete remote/local file set without exposing the Script ID;
3. preserve reviewed remote `webapp` access settings exactly;
4. use `clasp push --force` only with explicit staging authorization and only after the manifest comparison is approved;
5. pull again and require exact file parity before versioning or updating the existing deployment.

Never create a new immutable version merely because a push command exited successfully; first verify that remote source actually changed to the reviewed package.

### Apps Script request-flag boundary

Do not derive access mode solely from `location.search` in client JavaScript. Apps Script serves the application inside a sandbox iframe whose URL may not retain the outer `/exec` query. Parse access flags in `doGet(e)`, inject the server result into evaluated HTML, and make the browser send that trusted value to bootstrap. Test both the internal and request-only template evaluations in a browser before deployment.

## Version 0.5.0 staging migration sequence

This sequence is a handoff plan only. It does not authorize external actions.

1. Verify the exact reviewed 0.5.0 commit, clean checkout, CI, `npm run check`, `npm run verify`, and complete browser matrix. Confirm `.clasp.json`, Script IDs, spreadsheet/Drive IDs, credentials, personal records, supplier TINs, and evidence files are untracked and not staged.
2. Create and privately record a fresh staging schema backup before changing source or headers.
3. Use the clasp manifest safeguard above to compare remote/local files, preserve the existing staging `webapp` access block, push the reviewed package only with explicit authorization, and pull again for exact parity.
4. Before activating the new web version, run additive `setupDatabase()` against the configured staging operational spreadsheet.
5. Confirm the ten appended `01_ITEM_MASTER` columns, appended `Can_Manage_Catalog`, both revision rows, preserved existing values, preserved legacy tabs, preserved Drive configuration, and least-privilege defaults.
6. Run idempotent `setupOperationalEditTrigger()` and confirm there is exactly one matching trigger for the configured staging spreadsheet.
7. Run schema, health, Drive, and access validation. Verify the expected environment without exposing resource IDs in public evidence.
8. Using an explicitly authorized Apps Script test deployment that executes the reviewed source without changing the existing Version 9 deployment, exercise revision reads, exactly-one increment per mutation, no increment on reads/replays, a direct human edit, authoritative post-mutation refresh, two-session polling, dirty-form deferral, predictive lending search, audience/handling rules, catalog permission/edit persistence, unit/archive protection, and request-only privacy. If that test-deployment mechanism is unavailable, stop and obtain an approved alternative before changing the Version 9 deployment pointer.
9. Reconcile ledger, reservations, lending, status history, audit, errors, and evidence. Stop on any inventory, authorization, revision, evidence, or privacy failure.
10. Only after acceptance, create one immutable staging version and update the existing deployment ID. Record version, commit, owner, time, and results.

The schema migration is intentionally safe before deployment activation. Existing Version 9 ignores the appended columns and revision rows.

## Production promotion

Obtain DOL owner sign-off and use this order:

1. Freeze the reviewed commit, access list, catalog defaults, configuration, and migration evidence.
2. Create and privately record a fresh production backup.
3. Push the exact staging-accepted package to the production Apps Script project using the same remote parity and manifest safeguards.
4. Before activating the web version, run additive `setupDatabase()` and validate all appended fields/rows, preserved data, environment routing, and Drive configuration.
5. Run `setupOperationalEditTrigger()` once and confirm exactly one matching production trigger.
6. Recheck reviewed `Can_Manage_Catalog` grants; blank must not expose catalog management beyond ADMIN/DOL_DIRECTOR fallback.
7. Create one immutable production version, update the existing restricted deployment, and record deployment owner/version/commit/time/result.
8. Run bounded production acceptance for internal bootstrap, request-only privacy, revision reads, one authorized test mutation and immediate refresh, lending eligibility, catalog permission, audit/history, and idempotent replay.
9. Stop writes and roll back the deployment pointer on any inventory, authorization, revision, evidence, or privacy failure.

Keep the preceding immutable deployment version available throughout acceptance.

## Rollback sequence

1. Stop new operational writes and capture the failing correlation IDs, revision, deployment version, and affected records.
2. Update the existing deployment ID back to the preceding immutable version; do not create an unrelated deployment ID.
3. Verify internal and request-only rendering and confirm the preceding version is serving.
4. Reconcile every mutation completed before rollback. Do not delete or edit ledger, audit, status-history, lending, request, or evidence records.
5. Retain the appended item/access columns, revision config rows, and catalog metadata. They are additive and Version 9 safely ignores them.
6. Leave the operational edit trigger in place unless evidence identifies it as the failure source. Removing or disabling it requires explicit owner authorization and must be recorded.
7. Correct the repository, rerun the entire staging sequence, and create a new immutable version; never overwrite historical versions.

## Immediate smoke tests

- health/schema/Drive checks succeed;
- authorized staff bootstrap loads; unauthorized account is denied internal bootstrap;
- request-only portal exposes no internal navigation/data;
- test request submit/review/reserve/release produces one movement;
- test evidence gets safe label/filename and metadata;
- duplicate retry returns the original result;
- global and affected scoped revisions advance once for the test mutation, remain stable for reads/replays, and another eligible clean session meets the approved p95-at-or-below-25-second visibility target with no routine sample above 35 seconds;
- dirty form input is preserved behind the updates-available banner;
- logs contain correlation IDs and no public stack trace.

If any inventory, authorization, evidence, or privacy test fails, stop writes and follow the recovery runbook. Never repair by deleting ledger rows.

## Unresolved manual values

All seven Drive folder IDs, staging/production Script IDs, deployment owner, approved access list, backup retention, evidence retention, notification sender, and production audience must be assigned by HAU/DOL.
