# Current Task

INTENT: FEATURE, MIGRATION, TESTING, DEPLOYMENT PREPARATION
SECONDARY INTENTS: SECURITY, ACCESSIBILITY, OPERATIONS, RELEASE
MODE: freeze and review the exact repository candidate; stop before blocked pre-production
TARGET: HAU-USC Logistics v0.7.2 Production Access and Operations release
SKILLS: lean-ctx; Hallmark audit for bounded critical-screen polish; Cloudflare deployment workflow only at accepted pre-production/production stages; GitHub release workflow for branch/PR integration
AUTHORITY: `.codex/specs/v0.7.2-production-access-operations.md`; owner-approved v0.7.2 final plan and MAX16 execution prompt; repository invariants; complete v0.7.1 production handoff
RISK: critical because identity, authorization, migration, providers, and production are in scope
DELIVERABLE: exact reviewed/pushed v0.7.2 repository candidate and truthful blocked pre-production handoff
VERIFICATION: state/API/access contracts; focused tests; full repository gates; generated parity; R1/R2 review; distinct pre-production migration and full matrix; recovery/rollback; exact-SHA CI; production canary/reconciliation only after exact owner GO
STOP CONDITIONS: unknown work or target; contract/spec conflict; unaccepted destructive migration; missing recovery/rollback; email/roster/provider or sensitive-access uncertainty; privacy leak risk; external MFA; unresolved P0/P1
STATUS: REPOSITORY_CANDIDATE_READY_PREPRODUCTION_BLOCKED_PRIVATE_PROVIDER_CONFIGURATION

Starting SHA: `589970d31d0dab4fe876107276d9b808eb44b9c3`

Branch: `release/v0.7.2-production-access-operations`

Accepted specification:
`.codex/specs/v0.7.2-production-access-operations.md`

Current exact action: freeze the integrated repository candidate, run the fresh
R2 review, push and verify exact-head PR CI, then stop before external mutation
because the approved email provider and private identity-class configuration
are absent.

Concurrency: no more than three child tasks are possible alongside the parent in
this environment, despite the owner's higher ceiling. Children may not spawn
grandchildren. The parent remains release-branch integration owner.

The owner already supplied `AUTHORIZE V0.7.2 PRODUCTION` and waived another
confirmation wait. Production remains untouched because mandatory provider,
pre-production, backup, rollback, and reconciliation gates have not passed.

Local acceptance: schema 30 migration integrity `ok` with zero foreign-key
findings; `npm run check` 109 files / 726 tests; browser 136 passed / 356
intentional skips; local Worker/D1 39/39. Handoff:
`.codex/V0_7_2_RELEASE_CANDIDATE_HANDOFF.md`.

---

## Completed v0.7.1 predecessor task

INTENT: PRODUCTION LAUNCH CLOSURE
MODE: complete; ready for accepted v0.7.2 cold start
TARGET: immutable v0.7.1 repository, staging, and production baseline
AUTHORITY: `.codex/specs/v0.7.1-production-recovery.md`; owner-authorized release runbook; repository invariants
RISK: closed and reconciled
DELIVERABLE: complete verifiable v0.7.1 predecessor handoff
VERIFICATION: exact merge/tag/release identity; green PR checks; cache-busted production health/readiness/version; schema and recovery reconciliation
STATUS: COMPLETE_V0_7_1_PRODUCTION_OPERATIONAL

Release SHA: `e49311f7a712b56da3d5d2913e3c8bf2d0fe4f90`

Canonical branch/upstream: `main` / `origin/main`

Durable handoff: `.codex/V0_7_1_PRODUCTION_LAUNCH_HANDOFF.md`

Next exact action: create and accept the repository-native v0.7.2
Production Access and Operations specification, create
`release/v0.7.2-production-access-operations` from current clean `main`, and
start only dependency-ready work. Production deployment remains separately
gated by the exact-candidate owner authorization required by the v0.7.2
execution prompt.

---

## Historical v0.7.1 repository-side task

INTENT: PRODUCTION RECOVERY
MODE: repository complete; owner-gated release handoff
TARGET: reviewed deployable candidate and private staging/production sequence
AUTHORITY: `.codex/specs/v0.7.1-production-recovery.md`; accepted v0.7.0 specifications; repository invariants
RISK: high
DELIVERABLE: reviewed release candidate and truthful owner-gated handoff without a production write
VERIFICATION: exact-SHA correction re-review; repository, browser, Worker, preview, rollback, and monitoring evidence
STATUS: COMPLETE_REPOSITORY_SIDE_OWNER_GATES_REMAIN

Starting SHA: `9fb1b4e6b4e956419fa65dee55268b10c0a55da6`

Branch: `fix/v0.7.1-production-recovery`

Repaired release-candidate code/test head:
`42f1970efbccd8c275be2cc4bc77246b5a9c97ab`. Slice 8 adds safe static preview
and exact-SHA packaging workflows, canonical fail-closed host routing, exact
private recovery-host validation, request-only containment, opaque-origin Apps
Script startup, and owner-gated deployment/domain/rollback/monitoring runbooks.
The first final Sol review of `d3d4cc8de84e9b37d151b41b59ff19422d9a7ee1`
found two P2s and one P3: reusable assessments allowed `NOT_APPLICABLE`, preview
smoke was not bound to the deployed account/Worker, and one handoff domain was
wrong. All are repaired. `npm run check` passes 88 files / 576 tests; browser
130 passed / 326 intentional
skips; local Worker/D1 38/38; preview dry-run has no bindings and performs no
upload. Fresh Sol correction re-review at
`7338124554d5ad6f948587d69328dae731b38a6c` passes with no P0-P3 and all prior
findings closed. Upstream/PR/CI, private configuration, staging, production,
domain activation, external smoke, and monitoring remain owner-gated.

Stop on an unaccepted migration need, wrong production binding, privacy or
authorization uncertainty, unknown overlapping repository work, or a P0 data
integrity risk. Production and external provider writes remain owner-gated.

---

INTENT: PRODUCTION CLOSURE
MODE: complete
TARGET: HAU-USC Logistics v0.7.0 production baseline
AUTHORITY: autonomous Phase 18–29 master prompt; `.codex/specs/v0.7.0-production-master.md`; accepted amendments; repository invariants
RISK: controlled operations
DELIVERABLE: accepted v0.7.0 production release, reconciled launch state, durable operator evidence, and governed v1 readiness path
VERIFICATION: exact release identity; production smoke; authorization and privacy denial; inventory/event/brand reconciliation; D1 recovery; monitoring; branch containment; exact-head CI; zero unresolved P0/P1 or mandatory UNRUN
STATUS: COMPLETE

## Accepted baseline

- Canonical production source and annotated release tag:
  `dc98d670fdd63f649037616c5a2d51e5c62ca4ae`.
- Canonical branch: `main`; future work starts from current `main` through a
  short-lived branch and a green pull request.
- Production schema: 29; latest migration: 0029.
- Inventory: 397 approved rows imported; all 397 remain safely pending physical
  classification and are not lendable until an authorized review.
- Event truth: one Youth Development Days 2026 series, two active September
  days, seven activities, and no active superseded August schedule.
- Brand truth: six governed public slots backed by the dedicated production R2
  binding.
- Launch reconciliation: zero active synthetic requests, lending tickets,
  reservations, items, event series, sessions, limiter rows, or smoke actors;
  immutable audit/history and archived smoke evidence remain.

## Operating boundary

- Production is operational. Routine operation must use the protected website
  and normal audited server validation.
- Keep credentials, provider identifiers, private routes, object keys, OAuth
  values, exports, bookmarks, and recovery packages outside Git.
- Do not modify append-only audit, history, ledger, release, or evidence records;
  corrections use linked audited records.
- Numeric retention and deletion rules remain owner-policy decisions. No
  automated evidence purge is authorized.
- Durable closure evidence is
  `.codex/V0_7_PHASE_29_PRODUCTION_CLOSURE_HANDOFF.md`.
