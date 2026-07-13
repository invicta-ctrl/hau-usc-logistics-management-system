# Operations and Deployment Runbook

## Authority and release principle

This runbook defines evidence and gates; it does not itself authorize an external action. Only the named institutional owner may approve staging/production configuration, source upload, immutable version creation, deployment-pointer update, backup, migration, trigger, Drive, or user-access changes.

Release identity is a tuple, not a label:

```text
git commit + reviewed branch/tag + artifact digest + Apps Script remote parity
+ immutable Apps Script version + existing deployment pointer + schema/config state
+ access/folder/trigger state + acceptance evidence + rollback version
```

A passing local build, clasp exit code, source upload, or immutable version alone is not a deployment.

### Current V1 handoff gate

For `1.0.0-rc.1`, local source and artifact work may proceed. The exact staging and production projects and immutable rollback versions are privately inventoried, but Google mutations remain blocked until an owner-authorized Sheets/Drive session proves Script Properties, operational/backup separation, authoritative folder mappings, restorable backups, and the approved web-app audience. No production promotion may begin until staging setup, two-account acceptance, reconciliation, rollback, privacy, and owner approvals pass.

## Environment matrix

| Environment        | Data and identity                                          | External writes                     | Release evidence                                                                        | Rollback                                                           |
| ------------------ | ---------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| Local DEMO         | Fictional deterministic browser data; simulated roles      | None                                | Commit, local checks, artifact verification, Playwright where available                 | Reset fictional state or return to prior commit                    |
| Staging CURRENT    | Separate reviewed staging Apps Script, Sheet, Drive, users | Only in an authorized test window   | Full source parity, setup/health, acceptance, immutable version, pointer, evidence pack | Preceding staging version plus data reconciliation                 |
| Production CURRENT | Restricted institutional production resources              | Owner-approved window only          | Staging acceptance, fresh backup, production parity/setup/privacy smoke, sign-off       | Preceding production version; stop writes; forward data correction |
| FUTURE hosted      | Not implemented or deployed                                | Prohibited until separate milestone | Provider, IaC, auth, database/storage migration, observability, restore/exit proof      | Blue/green app rollback and database/object migration plan         |

Keep all Script, deployment, Sheet, Drive, backup, account, group, and evidence identifiers in the restricted release record—not git, CI artifacts, screenshots, or public chat.

## Pre-release code gate

From the exact reviewed clean commit:

```powershell
npm ci
npm run check
npm run test:e2e
git diff --check
git status --short
```

Run Playwright only where Chromium is installed; record an honest “not run” with reason otherwise. `npm run check` covers governance, lint, unit/integration tests, build, Apps Script static checks, and generated-artifact verification. Record Node/npm versions, command results, test counts, and generated artifact digests. Do not stage generated drift separately from its source.

Before staging source upload, confirm:

- manager-approved branch/base and review scope;
- no unrelated/uncommitted files;
- no tracked sensitive config, real resource IDs, personal/commercial data, or evidence;
- visual baseline/extraction provenance;
- canonical docs and current resume block agree;
- known gaps and unrun checks are explicit;
- prior immutable staging version and owner are privately recorded.

## Clasp 3.3 remote snapshot and parity safeguard

Clasp 3.3 has no supported simulated push. `clasp status` shows local files considered for upload; it does not compare remote content. A non-interactive manifest confirmation can be declined while the command still appears non-fatal, so source parity must be independently proven.

1. Configure ignored `.clasp.json` for the reviewed **staging** project only.
2. Run `clasp status` and compare the bounded file list with the generated Apps Script bundle.
3. In a separate ignored temporary directory configured for the same staging project, run a read-only `clasp pull` snapshot.
4. Compare the complete remote/local filename set and content. Review `appsscript.json` separately and preserve its approved `webapp` access settings exactly. Keep config files/output containing IDs private.
5. Stop on any unexplained remote-only/local-only source, manifest drift, wrong environment, or missing reviewer approval.
6. With explicit staging authorization, run `clasp push --force` from the clean reviewed package.
7. Pull a second fresh remote snapshot into a new temporary directory. Require exact source and manifest parity with the reviewed local bundle.
8. Only after parity may the owner create an immutable Apps Script version or update the existing staging deployment pointer.

Never use `clasp push` as production evidence or create an immutable version merely because a command exited successfully. Production repeats the same safeguard against the separately configured production project only after staging sign-off.

## Staging release sequence

1. Open a restricted change record with commit, intended version, owner, window, acceptance owner, prior rollback version, and explicit authorized actions.
2. Capture pre-change health/schema/Drive/access/trigger/deployment state without exposing identifiers.
3. Create and privately verify a fresh staging backup before schema, migration, or acceptance writes.
4. Complete the remote snapshot and post-upload parity safeguard above.
5. Run additive `setupDatabase()`; validate expected tabs/headers/defaults and preserved legacy/data rows. Repeated setup must be idempotent.
6. Validate operational/backup routing is correct and different. Validate all eleven canonical Drive folders as exact-name direct children with unique mappings, accepted legacy aliases, and private least-privilege sharing.
7. Seed/review explicit staging users. Run idempotent operational-edit and time-trigger setup; require one intended trigger per handler/source.
8. Run migration dry-run and reconciliation. Apply only explicitly approved mappings in a separate recorded step; unresolved rows stay VERIFY.
9. Run admin health check and prove expected environment without publishing resource IDs.
10. Exercise reviewed source through an authorized test mechanism before moving the existing deployment pointer. Stop if no approved mechanism is available.
11. Complete functional, authorization, request-only privacy, evidence, concurrency/idempotency, revision sync, responsive/accessibility, and rollback smoke tests.
12. Reconcile ledger, reservations, request lines, lending, releases, receipts, deliverables, evidence, status history, audit, errors, revision, and quarantine.
13. Create one immutable staging version, update the existing restricted staging deployment, and verify which version it serves.
14. Repeat internal/request-only smoke tests against the deployed URL with authorized and unauthorized identities.
15. Close with the complete evidence pack and explicit pass/fail/unresolved decision.

## Production promotion sequence

Production is a separate approval, not an automatic consequence of staging:

1. Freeze the exact staging-accepted commit/artifact/source manifest, schema/defaults, migration package, access plan, Drive plan, triggers, content/branding, and acceptance results.
2. Obtain DOL data owner, system/deployment owner, privacy/security owner, and release manager sign-off as applicable.
3. Confirm production audience, account ownership/MFA/recovery, access groups, retention, incident contacts, backup/evidence retention, notification sender, and unresolved risks.
4. Record the current production deployment pointer/version and prove the rollback version remains available.
5. Create and privately verify a fresh production backup.
6. Repeat production remote snapshot, manifest review, authorized source upload, and fresh-pull parity.
7. Before pointer activation, run only the approved additive setup/migration/Drive/access/trigger steps and verify preserved data.
8. Create one immutable production version and move the **existing** restricted deployment pointer. Record owner, version, commit, time, and source parity.
9. Run bounded smoke: internal and unauthorized/request-only bootstrap, exact privacy exclusions, one authorized test mutation with idempotent replay and revision refresh, audit/history/ledger/evidence, and no secret/personal error leakage.
10. Reconcile the test entity and every touched record. Stop and roll back on inventory, privacy, authorization, evidence, revision, trigger, or parity failure.

## Required release evidence pack

Store the pack in the approved restricted location with a sanitized summary for repository handoff.

| Area               | Required evidence                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Git/review         | Repository, branch, exact commit, clean state, reviewer/approvals, optional immutable tag after acceptance, changed-file scope           |
| Toolchain          | Node/npm/clasp versions and OS/runtime context                                                                                           |
| Checks             | Exact commands, exit results, test counts, Playwright browser/version or reason unrun, known warnings                                    |
| Artifacts          | Build time, source commit, filenames, cryptographic digests, generated-file parity                                                       |
| Apps Script source | Pre/post remote snapshot times, complete file-set/manifest comparison, preserved webapp access, post-upload exact parity                 |
| Deployment         | Project/environment (identifier kept private), immutable version, existing deployment pointer, owner, audience, prior rollback version   |
| Sheets             | Schema version, tab/header validation, row/count reconciliation, data revision, migration/version result, operational/backup distinction |
| Drive              | Eleven-folder exact-name/parent/mapping/alias validation, owner/group/share review, sample upload/signature/image-bound/digest/metadata/quarantine result without IDs |
| Identity/access    | Audience, active-role/permission review, unauthorized tests, owner/MFA/recovery evidence                                                 |
| Triggers/jobs      | Expected handlers, count, source/environment, owner, last success, duplicate absence                                                     |
| Functional         | Screen/workflow acceptance with entity references, correlations, ledger/history/audit outcomes                                           |
| Privacy/security   | Request-only field diff, hostile direct calls, safe errors/log review, upload rules, sensitive-content scan                              |
| UX/content         | Responsive/accessibility matrix, approved wording/branding/assets, no stale preview/production claim                                     |
| Backup/recovery    | Backup time/custodian, restore verification status, rollback drill/result                                                                |
| Decision           | Pass/fail, approvers, unresolved risk owners/dates, monitoring window, next action                                                       |

## Rollback triggers

Immediately stop new writes and begin rollback for unauthorized data/action, wrong environment/resource, source/manifest mismatch, inventory/ledger/reservation inconsistency, VERIFY transaction, duplicate non-idempotent mutation, evidence misrouting/public sharing, schema/data loss, trigger storm, unreconciled recorded timeout, wrong content/branding that changes legal or operational meaning, or failed critical smoke.

Cosmetic defects without data/privacy risk may use an approved forward fix, but only after documenting why rollback is riskier. Never let schedule pressure redefine a stop condition.

## Complete rollback procedure

### 1. Contain and preserve

Stop new operational writes, announce the bounded incident window, and record environment, times, current/prior version, commit, source parity state, data revision, correlation IDs, affected entities, triggers/jobs, evidence objects, and reporter. Preserve logs, audit/history, screenshots with redaction, remote snapshot, and backup. Do not delete records or files.

### 2. Application and Git release identity

- Repoint the existing Apps Script deployment to the preceding approved immutable version; do not create a substitute deployment ID.
- Verify internal and request-only rendering and which version is served.
- Keep the failed commit/tag/artifact immutable for investigation. Do not reset/discard the repository or rewrite a release tag to hide it.
- If a source package rollback is needed for the next version, create a reviewed revert/forward-fix commit and new immutable version; never overwrite history.
- For future static hosting, restore the preceding immutable artifact/deployment and confirm CDN origin/version headers before reopening.

### 3. Sheets and business data

- Application version rollback does not undo completed commands, schema columns, config rows, catalog changes, migration mappings, or revision increments.
- Reconcile every mutation completed before containment using audit/idempotency/correlation and ledger authority.
- Never edit/delete posted ledger, status history, audit, release, lending, receipt, request, or evidence rows.
- Correct quantity/status only through a documented reversal, adjustment, or forward migration approved by the data owner.
- Retain additive schema that the prior version safely ignores unless a separate tested forward migration removes it; destructive column rollback is prohibited during incident response.
- Restore a backup into an isolated resource for analysis. Replacing production data from backup requires separate owner approval and a plan for post-backup events.

### 4. Drive and evidence

- Stop affected uploads/sharing and restrict exposed folders/files without breaking preservation.
- Inventory objects created during the failed window and match them to metadata by digest/entity/correlation.
- Quarantine orphaned objects; do not silently delete or attach them.
- Revoke public/excess sharing and signed links where the platform permits; record access remediation.
- Use audited forward metadata/file correction after privacy/legal-hold review.

### 5. Configuration, access, triggers, and background jobs

- Restore the prior reviewed Script Properties/config values from the restricted change record; verify environment and operational/backup routing without publishing values.
- Revert accidental role/group/Drive shares and invalidate affected sessions/tokens through institutional controls.
- Disable only the trigger/job implicated in harm, with owner approval. Otherwise keep the operational edit trigger if the prior version depends on it.
- Remove duplicate triggers, pause projection/notification/import jobs, and record their checkpoints/dead-letter state.
- Before restart, prove exactly one expected handler/source and decide how missed jobs will be replayed idempotently.

### 6. Content, branding, caches, and client state

- Restore the prior approved text, policy links, logo/assets, and environment labels with the prior artifact.
- The CURRENT app has no service worker; verify browsers load the restored deployed version and advise a normal refresh if necessary.
- Do not clear browser storage or institutional caches as a substitute for fixing the served release. DEMO reset affects fictional data only.
- A FUTURE PWA rollback must retire incompatible service-worker/cache versions, preserve unsent drafts safely, and prevent an old client from calling an incompatible API.

### 7. Verify, reconcile, and reopen

Run health/schema/Drive/access/trigger checks; test authorized internal and unauthorized/request-only entry; verify balances and revision; reconcile all affected entities/evidence; and repeat critical smoke. Reopen writes only with named owner approval. Record recovery time, data corrections, residual risk, monitoring, and follow-up commit/milestone.

## Roll-forward after rollback

Diagnose in repository/staging, add a regression test, implement a small reviewed correction, regenerate/verify artifacts, repeat full staging parity/setup/acceptance, and create a **new** immutable version. A rolled-back version is never edited in place or relabeled as accepted.

## Provider-independent future additions

Before a future hosted cutover, extend this runbook with infrastructure-as-code plan/apply evidence, secret versions, DNS/TLS/CDN rollback, database migration and point-in-time restore drill, object-store replication/retention, queue/outbox checkpoint and dead-letter replay, identity-provider rollback, observability alert tests, vendor status/exit export, and cost guardrails. The proposed phases are in [Future Hosting and Database](FUTURE_HOSTING_AND_DATABASE.md).
