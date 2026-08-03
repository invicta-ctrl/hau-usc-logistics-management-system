# v0.7.2 Release-Candidate Handoff

Updated: 2026-08-03 (Asia/Manila)

## Status

`REPOSITORY_REPAIR_CANDIDATE_READY - EXACT_SHA_R2_AND_PREPRODUCTION_BLOCKED`

The v0.7.2 product, schema, generated artifacts, and local verification are
complete at the R2-repaired release-branch working tree prepared for candidate
freeze. The exact repair SHA is recorded by the freeze commit that contains
this handoff and must receive a fresh exact-SHA review and PR CI before any
external release step.

The owner supplied `AUTHORIZE V0.7.2 PRODUCTION` and explicitly waived another
confirmation wait. That authorization is retained. It does not bypass the
mandatory exact-target, provider, pre-production, backup, recovery, or
reconciliation gates.

## Repository truth

- Branch: `release/v0.7.2-production-access-operations`.
- Starting clean `main` SHA: `589970d31d0dab4fe876107276d9b808eb44b9c3`.
- Draft PR: `#15`.
- Release identity: `0.7.2` in package, runtime, Wrangler, private-config
  generator, and release workflows.
- Migration: additive `0030_production_access_and_operations.sql`.
- Local schema rehearsal: migrations 0001 through 0030 applied to a fresh
  isolated D1; `PRAGMA integrity_check=ok`, zero foreign-key findings,
  operational schema version 30.
- Production remains on the accepted v0.7.1 baseline. No v0.7.2 provider,
  staging, production, D1, R2, Google, domain, merge, tag, or release write has
  occurred.

## Delivered scope

- Public staff application: email-start/confirm contracts, private status
  receipt, identity/affiliation and credential submission, private status,
  withdrawal, safe conflict handling, and corrected resubmission from
  `CHANGES_REQUESTED`.
- Review and activation: Administrator queue/detail/decision, distinct
  Director decision, audited owner override, starter-account handoff, and
  activation reconciliation before authenticated session issuance.
- Access separation: new account-application capabilities are server-owned,
  bootstrap-allowlisted, and role-specific; applicant and requester state does
  not grant internal access.
- Profile: protected self-profile read, contact update, username change,
  password change, identity-correction request, and accessible My Profile UI.
- Operations: accepted Request purpose branches, strict integer rules,
  explicit low-stock controls, private public-Lending tracking, and preserved
  Inventory/Release/Lending invariants.
- Administration: canonical Link Registry remains additive to the existing
  second-review Routing domain; announcement lifecycle remains revision
  guarded.
- Release safety: version 0.7.2 identity, privacy-preserving login limiter
  reset on authorized unlock, deterministic artifacts, and fail-closed
  non-development readiness.

## Complete-candidate R2 repair cycle

The first R2 review rejected the prior candidate before push. It identified a
verification-purpose/nullability schema mismatch, activation reconciliation
that could be bypassed by a later login, split profile/access/announcement
transactions, a raceable last-Administrator check, and incomplete limiter
cleanup for username/email aliases.

The repair tree aligns schema and runtime purpose, permits an unsent challenge
to truthfully retain a null send time, exercises migrations 0001-0030 through
the real repository, keeps login fail closed until activation reconciliation
succeeds, and atomically couples authoritative mutations with history, audit,
idempotency, and session revocation. The last active unlocked Administrator is
protected in the guarded SQL write, and authorized unlock clears digested
account-code, username, and verified-email limiter aliases. A fresh exact-SHA
R2 review remains mandatory; no prior review acceptance is reused.

## Verification evidence

- Focused identity/access: 14 files / 73 tests passed; focused lint passed.
- Focused final regressions: 2 files / 12 tests and 14 browser tests passed
  with 8 intentional skips.
- Release identity: 3 files / 15 tests and 10/10 focused browser tests passed.
- Final `npm run check`: 112 files / 740 tests passed; lint, two deterministic
  builds, 34 Apps Script sources / 57 required functions, generated parity,
  Cloudflare type/dry-run checks, and all standalone artifacts passed.
- Full browser matrix: 136 passed / 356 intentionally scoped skips / 0 failed.
- Local Worker/D1 matrix: 39/39 passed against schema 30.
- `git diff --check`: passed before freeze.

Primary capped logs are under `.codex/runtime/logs/` and remain ignored local
evidence:

- `2026-08-03T13-09-54-765Z-full-repository-check-v072-candidate.log`
- `2026-08-03T13-16-49-695Z-full-playwright-v072-candidate-green.log`
- `2026-08-03T13-08-25-131Z-local-worker-d1-v072-final-green.log`
- `2026-08-03T13-38-48-746Z-full-repository-check-v072-r2-repairs.log`
- `2026-08-03T13-39-37-953Z-full-playwright-v072-r2-repairs.log`
- `2026-08-03T13-41-49-325Z-local-worker-d1-v072-r2-repairs.log`
- `2026-08-03T13-43-48-825Z-migration-0030-rehearsal-r2-repairs-2.log`

## Blocking pre-production gate

Pre-production is fail-closed because both of these mandatory private inputs
are absent/unapproved:

1. an owner-approved and implemented live email-delivery provider; and
2. approved private `ACCOUNT_APPLICATION_IDENTITY_CLASSES_JSON` values.

The Worker intentionally reports
`ACCOUNT_APPLICATION_EMAIL_PROVIDER_NOT_CONFIGURED` and, when absent,
`ACCOUNT_APPLICATION_IDENTITY_CLASSES_MISSING`. Do not weaken these checks,
invent values, or hardcode private configuration. Because live delivery and
redemption cannot be proven, Stage 9 pre-production, production deployment,
tag/release, staging rebaseline, and DOL rollout are not started.

## Recovery and rollback

- Migration 0030 is forward-only and additive. Before any external migration,
  capture the exact target, D1 export/Time Travel bookmark, migration list,
  current immutable Worker/static rollback, and required R2/Google recovery
  metadata.
- Follow `docs/D1_MIGRATION_AND_ROLLBACK.md` and
  `docs/PRODUCTION_INCIDENT_GUIDE.md`.
- On any identity, authorization, privacy, migration, readiness, version, or
  reconciliation mismatch: contain, preserve evidence, restore the prior
  Worker/static target, recover D1 from the captured point when required, and
  rerun affected staging gates. Never rewrite append-only history.

## Next exact action

Owner/operator provides the approved private identity-class configuration and
selects/authorizes an email provider implementation. Then implement and test
that provider in the repository, rerun the complete exact-SHA gates, execute
isolated pre-production acceptance with no mandatory `UNRUN`, and only then use
the already-recorded production authorization for the verified exact target.
