# v0.7.2 Live Child-Task Registry

Updated: 2026-08-03 (Asia/Manila)

Parent integration branch: `release/v0.7.2-production-access-operations`

Parent checkpoint SHA: `e44625316404bce3e293eb4cf71195f7052e04f1`

Owner child ceiling: 16

Environment child ceiling: 3 (four total active agents including parent)

Grandchildren: prohibited by the v0.7.2 execution prompt

## Status vocabulary

`PLANNED`, `RUNNING`, `COMPLETE_UNREVIEWED`, `ACCEPTED`, `REJECTED`, `BLOCKED`,
or `CANCELLED`.

## Active registry

| ID | Class | Status | Mode | Objective | Read scope | Write ownership | Acceptance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MAP-IDENTITY | Explorer | ACCEPTED | Read only | Verify authentication, account application, access, profile, roster, migration, and directly covering test paths against the locked contract. | Auth/access/identity server, Worker routes, auth UI/client, relevant migrations/tests | None | Exact clean source map accepted; application/profile absent; activation, concurrency, targeting, limiter, and access-separation gaps recorded |
| MAP-OPERATIONS | Explorer | ACCEPTED | Read only | Verify Request purpose, strict integer, low stock, public/internal Lending, Release, return, and inventory paths. | Request/Lending/Inventory/Release domain, service, UI, adapter, migration, and tests | None | Exact clean source map accepted; purpose, hidden-field, integer, low-stock, and public-tracking gaps recorded |
| MAP-REFERENCE-UI | Explorer | ACCEPTED | Read only | Verify Link Registry, Announcement, critical UI, generated pipeline, accessibility, and directly covering test paths. | Reference/advertisement services, UI/views/styles, adapters, build pipeline, browser/unit tests | None | Exact clean source map accepted; dead production Link Registry and Announcement/a11y gaps recorded |

## Parent-owned active work

| ID | Status | Objective | Evidence |
| --- | --- | --- | --- |
| PARENT-CONTRACT | ACCEPTED | Adopt repository specification and lock source/API/state/data/access contracts. | Spec commit `39ea6a2`; governance and diff checks passed; draft PR #15 |
| PARENT-INTEGRATION | ACCEPTED | Integrate identity/access, operations, Link Registry/Announcement, release identity, tests, generated artifacts, and durable candidate handoff. | `npm run check` 109 files / 726 tests; browser 136 / 356 intentional skips; local Worker/D1 39/39 |
| DATA-0030 | ACCEPTED | Add the forward-only schema-30 identity, operations, Link Registry, and Announcement structures and prove a clean local migration rehearsal. | Fresh local D1 applied migrations 0001-0030; direct SQLite `integrity_check=ok`, zero foreign-key findings, schema 30, required tables/columns, and valid defaults |
| PARENT-PROVIDER-GATE | BLOCKED | Prove owner-approved identity classes and email provider in private pre-production configuration. | No provider/domain values found in Git; implementation must remain fail closed |

## Queue after mapping

| ID | Dependency | Planned result |
| --- | --- | --- |
| DATA-0030 | MAP-IDENTITY + MAP-OPERATIONS + MAP-REFERENCE-UI | Additive migration and fresh/upgrade/recovery tests (active parent work) |
| IDENTITY-CORE | DATA-0030 | Verification/application state machine and repository |
| ACCESS-PROFILE | IDENTITY-CORE | Review, activation, access separation, username/profile/security |
| IDENTITY-UI | ACCESS-PROFILE | Login/register/status/Admin/Director/Profile critical UI |
| OPERATIONS-P0 | MAP-OPERATIONS | Request choice, strict integers, low stock, core regression repairs |
| REFERENCE-P0 | MAP-REFERENCE-UI | Canonical Link Registry and USC Announcement repair |
| R1 | Integrated identity/access candidate | Fresh independent review; zero unresolved P0/P1 |
| FREEZE-R2 | All implementation slices | Full repository gate, Hallmark audit, security/migration/accessibility review, R2 |
| PREPROD | FREEZE-R2 + private provider/identity config | Isolated migration, complete acceptance matrix, recovery/rollback, reconciliation |
| PROD-GO | PREPROD | Exact-candidate GO package; wait for exact owner phrase |

## First isolated writer wave

| ID | Status | Exact base | Isolated ownership | Required verification |
| --- | --- | --- | --- | --- |
| IDENTITY-CORE | ACCEPTED | `e44625316404bce3e293eb4cf71195f7052e04f1` | Isolated account-application service/repository result, reviewed and integrated by the parent. | State/transition, replay, revision, privacy, enumeration, queue/detail, and repository contracts pass. |
| OPERATIONS-DOMAIN | ACCEPTED | `e44625316404bce3e293eb4cf71195f7052e04f1` | Isolated operational integer/request-purpose result, reviewed and integrated by the parent. | Strict integer and contradictory request-branch validation pass. |
| REFERENCE-LINK-SERVER | ACCEPTED | `e44625316404bce3e293eb4cf71195f7052e04f1` | Link Registry server and public portal/announcement integration reviewed and integrated by the parent. | Local Worker Link Registry and announcement lifecycle plus browser portal coverage pass. |

## Integration rules

- Parent is the sole writer to the release branch.
- Read-only child results do not become accepted evidence until parent review.
- Writer work, if later delegated, uses isolated worktrees and disjoint files.
- Every child receives the exact base SHA, objective, scope, deliverable,
  verification, stop conditions, and no-grandchildren rule.
- A completed slot is released before a later dependency-ready task starts.
- Production work is never delegated and remains separately owner gated.
