# Current Task

INTENT: PRODUCTION RECOVERY
MODE: correction re-review of complete v0.7.1 release candidate
TARGET: exact committed release-candidate code, tests, workflows, and handoff
AUTHORITY: `.codex/specs/v0.7.1-production-recovery.md`; accepted v0.7.0 specifications; repository invariants
RISK: high
DELIVERABLE: one policy-authorized fresh Sol correction re-review and truthful owner-gated handoff without a production write
VERIFICATION: exact-SHA diff review; accepted-scope and invariant review; existing repository, browser, Worker, preview, rollback, and monitoring evidence
STATUS: ACTIVE

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
upload. One fresh correction re-review is the only remaining repository-side
gate, permitted because the P2 repairs materially changed workflow behavior.

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
