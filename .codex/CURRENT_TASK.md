# Current Task

INTENT: TESTING
SECONDARY INTENTS: ACCESSIBILITY, PERFORMANCE, CAPACITY, STAGING_ACCEPTANCE, RELEASE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 23 Accessibility, Responsiveness, Performance, and Capacity
SKILLS: lean-ctx, browser:control-in-app-browser, cloudflare-deploy
AUTHORITY: autonomous Phase 18–29 master prompt; `.codex/specs/v0.7.0-production-master.md`; accepted amendments; repository invariants
RISK: high
DELIVERABLE: complete responsive accessibility, performance, and bounded non-abusive capacity acceptance on the exact staging candidate
VERIFICATION: 390px, approximately 820px, and 1366px keyboard/zoom/overflow/contrast checks; measured load/API/D1/payload/polling behavior; bounded rate-limit/contention/concurrency/idempotency proof; reconciliation; exact-head CI
STOP CONDITIONS: production binding or mutation; abusive load; secret or personal-data exposure; inaccessible required action; unresolved P0/P1; unreconciled synthetic effect

## Active Phase 23 contract

- Test keyboard use, visible focus, labels and errors, screen-reader names,
  contrast, 200% zoom, touch targets, clipping, required-action visibility,
  horizontal overflow, and reduced motion at 390px, approximately 820px, and
  1366px.
- Measure initial page load, login bootstrap, public portal load, route
  transitions, API/D1 timings, payload size, repeated requests, and polling.
- Run only bounded, non-abusive capacity checks for login rate limits, public
  request and lending bursts, D1 contention, concurrent reservations, and
  idempotent retries.
- Reconcile every synthetic effect and retain immutable history and audit.
- Production remains out of scope during Phase 23.

The primary agent is the only writer, credential handler, provider mutator,
migration executor, deployer, merger, tagger, release manager, and rollback
operator.

## Current execution checkpoint

- Phase 22: accepted on staging at exact runtime
  `7c47f229c43e36bcf28273998a48b36aeb3aaedd`, schema 29.
- Repository: `npm run check` passes 74 Vitest files / 477 tests and every
  repository gate.
- Deployed staging: final operations matrix passes 10 / 10; focused Materials
  and Request Center reruns pass.
- Observability: six private sampled traces and six structured application logs
  passed timing, correlation, redaction, and staging-only binding checks.
- Reconciliation: temporary credentials denied; zero fixture sessions, active
  reservations, active requests, and active public lending; synthetic items and
  seven asset instances archived; prior account/event snapshots restored; 50
  final-cleanup audits retained.
- Phase 23: active. Begin with the existing responsive/accessibility automation
  inventory, then run only the missing exact-candidate deployed checks.
- Production: untouched and prohibited.
