# Current Task

INTENT: PRODUCTION RECOVERY
MODE: execute bounded v0.7.1 slices
TARGET: preview/pipeline/domain preparation and integrated release verification
AUTHORITY: `.codex/specs/v0.7.1-production-recovery.md`; accepted v0.7.0 specifications; repository invariants
RISK: high
DELIVERABLE: release-candidate preparation, integrated verification, rollback and monitoring evidence, and owner-gated domain/deployment readiness without a production write
VERIFICATION: preview/pipeline dry runs; host-routing and protected browser journeys; rollback and monitoring evidence; repository-required gates; one final fresh Sol release-candidate review
STATUS: ACTIVE

Starting SHA: `9fb1b4e6b4e956419fa65dee55268b10c0a55da6`

Branch: `fix/v0.7.1-production-recovery`

Accepted previous slice: wording, naming, and Hallmark-bounded polish at
`9da6289de770a2d82083fbbaee815ae4a8b4e6b2`; full `npm run check` passes 86
files / 555 tests, focused presentation and Inventory proofs pass, generated
parity passes, and the replacement exact-head Sol review's localized P2 is
repaired with direct regression coverage.

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
