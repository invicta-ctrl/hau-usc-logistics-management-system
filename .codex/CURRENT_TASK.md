# Current Task

INTENT: SOFTWARE_FEATURE
SECONDARY INTENTS: OWNER_DECISION, DATA_MIGRATION, TESTING, STAGING_ACCEPTANCE, RELEASE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 18 approved event hierarchy and protected event management
SKILLS: lean-ctx
AUTHORITY: current owner decision resolving Phase 18; approved record `HAU_USC_Logistics_v0.7.0_Complete_Continuation_From_Phase16_OAuth_2026-07-26.md`; `.codex/specs/v0.7.0-production-master.md`; accepted amendments; repository invariants
RISK: high
DELIVERABLE: accepted and reconciled September 1–2 Youth Development Days 2026 hierarchy on staging, with truthful unknown operational fields and protected audited Admin/Director management
VERIFICATION: source/supersession record, migration and seed replay, focused authorization/history/linking tests, repository gate, local Worker/D1, deployed desktop/mobile acceptance, reconciliation, exact-head CI
STOP CONDITIONS: unknown work; source contradiction; unreconciled duplicate/superseded schedule; authorization or audit defect; privacy exposure; irreversible data-loss risk; unresolved P0/P1; production mutation

## Active Phase 18 decision

- The September 1–2, 2026 Youth Development Days schedule supplied in the
  current owner decision is authoritative.
- It supersedes the August 10 and August 12 schedule from the July 4 meeting
  notes. The schedules must not be merged; the earlier schedule remains
  historical planning context only.
- Use the repository's server-owned IDs and accepted event-code convention.
- Use the safest existing pre-event status; do not add a new enum solely for
  this event.
- Unknown committees, deadlines, windows, readiness, progress, and notes remain
  null/not assessed and enter protected owner review. They do not block Phase
  18 staging acceptance and must not render as fabricated percentages.
- Authorized Administrators and Directors must manage the hierarchy and
  missing fields through the protected website. Unauthorized roles must be
  denied server-side. Every correction requires activity history and audit.
- Production remains out of scope. Do not begin Phase 19 until Phase 18 is
  accepted, but do not stop at the Phase 18 boundary after its gate passes.

The primary agent is the only writer, credential handler, provider mutator,
migration executor, deployer, merger, tagger, release manager, and rollback
operator.

## Current execution checkpoint

- Owner-data blocker: resolved.
- Schema 27 and protected event-management implementation: complete locally.
- Deterministic approved YDD 2026 seed and duplicate/supersession checks:
  complete locally.
- Local verification: ESLint pass; 71 / 464 Vitest pass; fresh migrations
  0001–0027 pass; focused Worker and mobile/desktop browser cases pass; exact
  implementation commit `d54e733f3936513bb2305e53fa95d984060c28a4` passes the
  complete repository `npm run check`, including deterministic Apps Script
  parity and Cloudflare dry-run.
- Private staging backup verified; migration 0027 applied; initial exact
  candidate deployed; approved seed and replay reconciled to one series / two
  active days / seven activities with no active August schedule or duplicates.
- Live mobile review rejected omitted TBA activity, fabricated `0%` readiness,
  and `NaN%` empty-roadmap output. Repair
  `a342c7a2d8b03b21ad400705575adada0a69591a` passes focused Worker/browser,
  ESLint, 71 / 464 Vitest, and generated build verification.
- Exact repair push/redeploy, deployed mobile/desktop acceptance,
  reconciliation, and exact-head CI: pending.
- Production: untouched and prohibited.
