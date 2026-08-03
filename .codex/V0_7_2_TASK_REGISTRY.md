# v0.7.2 Live Child-Task Registry

Updated: 2026-08-03 (Asia/Manila)

Parent integration branch: `release/v0.7.2-production-access-operations`

Parent checkpoint SHA: `39ea6a285c3d52fd0da3fbabadf52f66c66481bc`

Owner child ceiling: 16

Environment child ceiling: 3 (four total active agents including parent)

Grandchildren: prohibited by the v0.7.2 execution prompt

## Status vocabulary

`PLANNED`, `RUNNING`, `COMPLETE_UNREVIEWED`, `ACCEPTED`, `REJECTED`, `BLOCKED`,
or `CANCELLED`.

## Active registry

| ID | Class | Status | Mode | Objective | Read scope | Write ownership | Acceptance |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MAP-IDENTITY | Explorer | PLANNED | Read only | Verify authentication, account application, access, profile, roster, migration, and directly covering test paths against the locked contract. | Auth/access/identity server, Worker routes, auth UI/client, relevant migrations/tests | None | Exact source map, gaps, risks, recommended implementation boundary |
| MAP-OPERATIONS | Explorer | PLANNED | Read only | Verify Request purpose, strict integer, low stock, public/internal Lending, Release, return, and inventory paths. | Request/Lending/Inventory/Release domain, service, UI, adapter, migration, and tests | None | Exact source map, invariants, gaps, recommended implementation boundary |
| MAP-REFERENCE-UI | Explorer | PLANNED | Read only | Verify Link Registry, Announcement, critical UI, generated pipeline, accessibility, and directly covering test paths. | Reference/advertisement services, UI/views/styles, adapters, build pipeline, browser/unit tests | None | Exact source map, dead/partial controls, test/a11y gaps, recommended boundary |

## Parent-owned active work

| ID | Status | Objective | Evidence |
| --- | --- | --- | --- |
| PARENT-CONTRACT | ACCEPTED | Adopt repository specification and lock source/API/state/data/access contracts. | Spec commit `39ea6a2`; governance and diff checks passed; draft PR #15 |
| PARENT-INTEGRATION | RUNNING | Review mapper output, resolve contradictions, and create the first implementation slice. | `.codex/V0_7_2_SOURCE_MAP_AND_CONTRACT_LOCK.md` |
| PARENT-PROVIDER-GATE | BLOCKED | Prove owner-approved identity classes and email provider in private pre-production configuration. | No provider/domain values found in Git; implementation must remain fail closed |

## Queue after mapping

| ID | Dependency | Planned result |
| --- | --- | --- |
| DATA-0030 | MAP-IDENTITY + MAP-OPERATIONS + MAP-REFERENCE-UI | Additive migration and fresh/upgrade/recovery tests |
| IDENTITY-CORE | DATA-0030 | Verification/application state machine and repository |
| ACCESS-PROFILE | IDENTITY-CORE | Review, activation, access separation, username/profile/security |
| IDENTITY-UI | ACCESS-PROFILE | Login/register/status/Admin/Director/Profile critical UI |
| OPERATIONS-P0 | MAP-OPERATIONS | Request choice, strict integers, low stock, core regression repairs |
| REFERENCE-P0 | MAP-REFERENCE-UI | Canonical Link Registry and USC Announcement repair |
| R1 | Integrated identity/access candidate | Fresh independent review; zero unresolved P0/P1 |
| FREEZE-R2 | All implementation slices | Full repository gate, Hallmark audit, security/migration/accessibility review, R2 |
| PREPROD | FREEZE-R2 + private provider/identity config | Isolated migration, complete acceptance matrix, recovery/rollback, reconciliation |
| PROD-GO | PREPROD | Exact-candidate GO package; wait for exact owner phrase |

## Integration rules

- Parent is the sole writer to the release branch.
- Read-only child results do not become accepted evidence until parent review.
- Writer work, if later delegated, uses isolated worktrees and disjoint files.
- Every child receives the exact base SHA, objective, scope, deliverable,
  verification, stop conditions, and no-grandchildren rule.
- A completed slot is released before a later dependency-ready task starts.
- Production work is never delegated and remains separately owner gated.
