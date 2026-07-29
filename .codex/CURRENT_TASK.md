# Current Task

INTENT: DEPLOYMENT
SECONDARY INTENTS: BACKUP, CLEANUP, RETENTION, ROLLBACK, STAGING_ACCEPTANCE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 24 Backup, Cleanup, Retention, and Rollback
SKILLS: lean-ctx, cloudflare-deploy, browser:control-in-app-browser
AUTHORITY: autonomous Phase 18–29 master prompt; `.codex/specs/v0.7.0-production-master.md`; accepted amendments; repository invariants
RISK: critical
DELIVERABLE: complete private recovery capture, retention and cleanup verification, and a real staging rollback/restoration rehearsal without production mutation
VERIFICATION: D1 export and recovery bookmark; Google source snapshot; R2 metadata; approved rollback target; retention and synthetic-account state; append-only history; prior-runtime switch; compatibility smoke; exact-candidate restoration; health/auth/request/lending/release smoke; D1 reconciliation; exact-head CI
STOP CONDITIONS: production binding or mutation; missing/invalid backup; unapproved rollback target; destructive cleanup without exact targets; secret or personal-data exposure; incompatible rollback; unreconciled D1 state

## Active Phase 24 contract

- Create a private D1 backup/export and capture the recovery bookmark.
- Preserve the approved Google source snapshot and private R2 asset metadata.
- Verify the rollback target, retention contract, synthetic account labels or
  disablement, and append-only history.
- Perform a real staging rollback rehearsal: deploy the approved prior safe
  version, verify compatibility, restore exact final candidate `d095685`, run
  health/auth/request/lending/release smoke, reconcile D1, and retain evidence.
- Production remains out of scope during Phase 24.

The primary agent is the only writer, credential handler, provider mutator,
migration executor, deployer, merger, tagger, release manager, and rollback
operator.

## Current execution checkpoint

- Phase 23: accepted on staging at exact runtime
  `d095685e223be2697cc72582d35967e70cfd5163`, schema 29.
- Repository: `npm run check` passes 74 Vitest files / 480 tests and every
  repository gate; focused capacity and idempotency tests pass 52 / 52.
- Deployed staging: responsive accessibility and measured performance suite
  passes 5 / 5 at 390 px, approximately 820 px, and 1366 px.
- Reconciliation: temporary owner disabled, sessions zero, final credential
  denied, zero Phase 23 limiter rows, immutable enable/disable/correction
  audits retained.
- Phase 24: active. Begin with private backup/bookmark/source/R2 capture and
  exact rollback-target verification before changing the staging deployment.
- Production: untouched and prohibited.
