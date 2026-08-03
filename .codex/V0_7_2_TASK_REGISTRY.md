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
| PARENT-INTEGRATION | RUNNING | Review mapper output, resolve contradictions, and create the first implementation slice. | `.codex/V0_7_2_SOURCE_MAP_AND_CONTRACT_LOCK.md` |
| DATA-0030 | RUNNING | Add the forward-only schema-30 identity, operations, Link Registry, and Announcement structures and prove a clean local migration rehearsal. | Fresh local D1 applied migrations 0001-0030; direct SQLite `integrity_check=ok`, zero foreign-key findings, schema 30, eight required tables, and valid defaults; static contract tests 4/4 |
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
| IDENTITY-CORE | RUNNING | `e44625316404bce3e293eb4cf71195f7052e04f1` | Isolated `task/v072-identity-core`; new `src/server/account-application/*`, new D1 repository, new focused tests only | State/transition, replay, revision, privacy, enumeration, and repository-contract tests |
| OPERATIONS-DOMAIN | RUNNING | `e44625316404bce3e293eb4cf71195f7052e04f1` | Isolated `task/v072-operations-domain`; new `src/domain/operational-integers.js`, `src/domain/request-purpose.js`, new focused tests only | Strict integer matrix and contradictory request-branch validation |
| REFERENCE-LINK-SERVER | PLANNED | `e44625316404bce3e293eb4cf71195f7052e04f1` | Isolated `task/v072-reference-link-server`; new Link Registry service/repository and new focused tests only | Queued because the runtime thread limit remained occupied by the completed mapping thread; start after one writer slot releases |

## Integration rules

- Parent is the sole writer to the release branch.
- Read-only child results do not become accepted evidence until parent review.
- Writer work, if later delegated, uses isolated worktrees and disjoint files.
- Every child receives the exact base SHA, objective, scope, deliverable,
  verification, stop conditions, and no-grandchildren rule.
- A completed slot is released before a later dependency-ready task starts.
- Production work is never delegated and remains separately owner gated.
