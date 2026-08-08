# Current Task

INTENT: BUG_FIX, TESTING, DEPLOYMENT, RELEASE_CLOSEOUT
SECONDARY INTENTS: SECURITY, PRIVACY, OPERATIONS, RELEASE
MODE: execute the owner-authorized final identity, staging, and production closeout
TARGET: HAU-USC Logistics v0.7.2 Production Access and Operations release
SKILLS: lean-ctx for targeted repository work; Cloudflare deployment workflow only after repository, review, backup, identity-class, and private-config gates pass; GitHub release workflow for PR integration
AUTHORITY: `.codex/specs/v0.7.2-production-access-operations.md`; `.codex/specs/v0.7.2-rv-01-request-visibility-amendment.md`; owner-supplied final identity/staging/production closeout prompt dated 2026-08-08; repository invariants
RISK: critical because protected identity reconciliation, email verification, D1 migration, release integration, and production are in scope
DELIVERABLE: project the protected USC staff directory from approved Working Email values only; preserve strict Option A exact ACTIVE+VERIFIED matching; complete staging acceptance; merge, tag, and release v0.7.2; back up, migrate, deploy, reconcile production; rebaseline staging
VERIFICATION: aggregate-only source/D1 reconciliation; focused identity regression; exact-head CI; fresh private exact-SHA configuration and backup/recovery evidence; migration 0030 identity; readiness; real Resend single-use flow; negative non-roster Gmail proof; production backup, smoke, integrity, reconciliation, and staging parity
STOP CONDITIONS: unsafe protected projection; inability to deliver real Resend mail to an eligible owner-controlled mailbox; unresolved P0/P1; backup/restore, target/binding, migration/integrity, SHA, secret, rollback, privacy, or external owner-action blocker
STATUS: COMPLETE_V0_7_2_PRODUCTION_OPERATIONAL

Starting SHA: `1f216a107d67a69403df1573875e2b93a95d12c2`

Canonical release SHA/tag: `84eacfcdb47a3985fed48e3ba14bb413946d4410`
/ `v0.7.2`

Accepted specification:
`.codex/specs/v0.7.2-production-access-operations.md`

Accepted amendment:
`.codex/specs/v0.7.2-rv-01-request-visibility-amendment.md`

Completed exact action: the protected projection uses owner-authoritative
Working Email values; strict Option A identity authorization is preserved;
staging acceptance, PR #15 integration, annotated tag/GitHub Release,
production backup/migration/deployment/reconciliation, and isolated staging
rebaseline are complete at the canonical release SHA. The private Gmail
identity class remains only a coarse first-stage filter and is never staff
authorization.

Next exact action: start a new task from synchronized `main` and prepare a
bounded v0.7.2.1 repository-normalization/staging-sandbox specification or
approved amendment. Do not begin implementation or move the v0.7.2 tag before
that authority is adopted.

Historical exact-SHA review blockers repaired before release:

- `reserveStock` accepted a caller-selected active item without proving it was
  the item assigned to the request line. A wrong-item reservation could hold
  unrelated ATP while preventing the authoritative item from ever releasing.
- public Request replay returned a prior tracking token by public actor and
  retry key before proving the new payload matched. The existing
  `idempotency_keys` table will bind actor, protected fingerprint, and safe
  result in the same atomic submission batch.
- the first replacement review confirmed both prior P1s closed, but found the
  capacity guard still counted fully consumed ACTIVE reservations. A partial
  release could therefore make the remaining same-line demand permanently
  unreservable even though authoritative remaining coverage was zero.

Local repair proof on 2026-08-08:

- focused unit contracts: 22/22;
- focused real Worker/D1 regressions: 2/2;
- `npm run check`: 117 files / 811 tests;
- `npm run test:e2e:cloudflare:local`: 58/58;
- `npx playwright test --workers=2`: 138 passed / 360 intentional skips;
- `npm run build`: deterministic preview artifact restored;
- staging artifact preflight: expected exit 1 because the tracked artifact is
  the safe preview build, not a live D1 deployable.

Consumed-reservation correction proof on 2026-08-08:

- pre-fix real Worker/D1 sequence request 4 -> reserve 1 -> release 1 ->
  restock -> reserve remaining 3 returned 409 at the remainder reservation;
- post-fix the same sequence succeeds, an additional reservation returns 409,
  and releasing the remaining 3 completes the request;
- focused unit contracts: 31/31;
- repeated `npm run check`: 117 files / 811 tests;
- repeated local Worker/D1: 58/58;
- repeated browser matrix: 138 passed / 360 intentional skips;
- deterministic preview artifact restored and staging preflight again failed
  closed with expected exit 1.

N-1 repair: `reserveStock` now evaluates requested reservation quantity against
`requested_quantity - released_quantity - SUM(unconsumed ACTIVE reservation
coverage)` before the new reservation is inserted. The guarded batch accepts the reachable
`READY_TO_RESERVE`, `READY_TO_RELEASE`, and `PARTIALLY_RELEASED` line states,
preserves `PARTIALLY_RELEASED`, and keeps the insert, audit, idempotency receipt,
parent timestamp, and revision bumps in one atomic batch.

Pre-fix behavioral proof:

- procurement line at `READY_TO_RELEASE`: reached `reserveStock`, returned 409;
- partial reservation after a completed restock: reached the remainder
  `reserveStock`, returned 409.

Post-fix focused proof:

- `tests/unit/request-visibility-rv01.test.js`: 8/8;
- real local Worker/D1 reservation selection: 4/4, including procurement
  reserve/release, restock top-up, partly released parent, and concurrent one
  winner / one safe 409 / one inventory effect.

Complete local gates on 2026-08-08:

- `npm run check`: 117 files / 810 tests;
- `npm run test:e2e:cloudflare:local`: 58/58;
- `npx playwright test --workers=2`: 138 passed / 360 intentional skips;
- `npm run build`: deterministic preview artifact restored;
- `node scripts/verify-deploy-artifact.mjs staging`: expected exit 1 because the
  tracked artifact is the safe preview build.

The owner supplied `AUTHORIZE V0.7.2 PRODUCTION`. Every required repository,
identity-class, private configuration, backup/recovery, migration, staging,
readiness, provider, production, rollback-readiness, reconciliation, smoke,
merge, tag, release, and rebaseline gate passed. Private values and recovery
material remain outside Git.

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
