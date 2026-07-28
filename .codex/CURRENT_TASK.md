# Current Task

INTENT: SOFTWARE_FEATURE
SECONDARY INTENTS: SECURITY_REVIEW, OBSERVABILITY, TESTING, STAGING_ACCEPTANCE, RELEASE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 21 System Owner Operational Health
SKILLS: lean-ctx, cloudflare-deploy, browser:control-in-app-browser
AUTHORITY: autonomous Phase 18–29 master prompt; `.codex/specs/v0.7.0-production-master.md`; accepted amendments; repository invariants
RISK: high
DELIVERABLE: complete protected System Owner operational-health surface with truthful redacted status for every required subsystem and recovery checkpoint
VERIFICATION: code/API/projection audit; owner-only authorization and redaction tests; repository gate; deployed desktop/mobile acceptance; exact-head CI
STOP CONDITIONS: secret or private identifier exposure; raw provider error/object key/OAuth/personal-data exposure; false healthy state; weakened authorization; unresolved P0/P1; production mutation

## Active Phase 21 contract

- Show safe status for Worker/API, deployed version/SHA, D1 schema/migration,
  staging/production bindings, authentication, email verification, identity
  roster synchronization, Google Drive, R2, evidence/backup failures, failed
  logins and rate limiting, inventory alerts, last backup, last successful
  reconciliation, and last rollback rehearsal.
- The page is protected and System Owner-only.
- Do not reveal secrets, account identifiers, private provider IDs, raw errors,
  object keys, OAuth values, or personal data.
- Unknown or unavailable state must render truthfully rather than as healthy.
- Production remains out of scope during the Phase 21 staging gate.

The primary agent is the only writer, credential handler, provider mutator,
migration executor, deployer, merger, tagger, release manager, and rollback
operator.

## Current execution checkpoint

- Phase 20: accepted on staging at exact runtime
  `4709e844f1bfcb0309cb1a2feeca2f66d9aeab89`; exact-head CI is 6 / 6.
- Staging: schema 28, ready true, public policy dialogs and server-enforced
  acknowledgments accepted on mobile and desktop; no live test records created.
- Phase 21: active. Audit the existing System Status/API projection and fill
  only verified gaps.
- Production: untouched and prohibited.
