# Current Bounded Task — Frontend Integration Preparation (complete)

INTENT: FRONTEND_INTEGRATION_PREPARATION
MODE: DOCUMENTATION_AND_REFERENCE_EVIDENCE_ONLY
OBJECTIVE: Prepare `frontend-design-integration` so the next Codex session can integrate the accepted Figma / Figma Make design into the frozen v0.8.3 backend contract without repeating the design audit, route archaeology, backend-contract discovery, source classification, or migration planning.
TARGET: frontend-design-integration branch-local documentation packet reconciled against frozen main 86553349f5c2ebefaa637c30828c560a301f99ba and Production candidate f8e63372bc8afcb6d092970b7f9fc9ee72fd3580.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/frontend-integration-fi00-branch-reconciliation.md
AUTHORITY: Earl explicit 2026-08-21 frontend-integration preparation instruction -> root AGENTS.md -> .agents/PROJECT_POLICY.md -> branch-local current chain -> .codex/PHASE_AND_CONTEXT_POLICY.md -> frozen v0.8.3 main source and tests -> Figma Design and Figma Make for visual intent only.
REQUIRED_MODEL: Claude Opus 5 performed this preparation under Earl's explicit instruction. Subsequent FI slices use one Terra-class sole branch writer per accepted slice.
RISK: HIGH;THIS_BRANCH_BECOMES_THE_TEMPORARY_FRONTEND_INTEGRATION_WORK_BRANCH_AND_IS_LATER_PROMOTED_THROUGH_PROTECTED_MAIN
SCOPE: Seven preparation documents under docs/design/, branch-local continuity records, and reconciliation notes on the Phase 9 intake documents. Verified frozen-main contract inventory, Figma and Make source register with hashes, complete source-disposition classification, FI-00 to FI-16 execution plan, and the Playground and Production acceptance matrix.
OUT_OF_SCOPE: Any frontend implementation, runtime source, dependency, build, or generated artifact; any backend, service-contract, API, auth, capability, or data change; any migration; any provider, D1, R2, or Google write; any Figma mutation; any Playground or Production deployment; any merge or rebase into main; any tag; any recovery-pointer move; any worktree or branch deletion.
VERIFICATION: Exact branch and main identity and ancestry facts; deterministic route, capability, operation, and state extraction from frozen main; Figma Make hash reconciliation against the durable baseline register; path existence checks for every referenced file; contract-matrix coverage check; source-disposition completeness check; Markdown formatting; git diff --check; check:governance and handoff:verify; complete diff review; normal push and readback. No product test suite was run because no runtime code changed.
STOP_CONDITIONS: Missing or contradictory authority; a conflicting active writer or unknown dirty work; a required backend, API, auth, capability, data, or migration change; privacy or authorization uncertainty; a Production or provider boundary; an unclassifiable load-bearing artifact; any failed integrity gate.
ACTIVE_WRITER: CLAUDE_OPUS5_HIGH:FI00_FRONTEND_BRANCH_RECONCILIATION
TERRA_WRITER: NONE
LOCK_HOLDER: CLAUDE_OPUS5_HIGH:FI00_FRONTEND_BRANCH_RECONCILIATION
WRITER_LOCK: HELD
LOCK_STATUS: HELD
HANDOFF_STATUS: FI00_IN_PROGRESS
GIT_UPSTREAM: origin/frontend-design-integration@GIT_HEAD;PUSH_PARITY_VERIFIED
PREPARATION_START_SHA: c4356570bd0442304303989e0e7cc97e31d481f7
PREPARATION_START_TREE: cf0f28dc794afc32492057ab14d80aa086431cc6
FROZEN_MAIN_SHA: 86553349f5c2ebefaa637c30828c560a301f99ba
FROZEN_MAIN_TREE: db95ebaafb7de421d02b12f0158bc1a93953edde
FROZEN_PRODUCTION_CANDIDATE: f8e63372bc8afcb6d092970b7f9fc9ee72fd3580
ROLLBACK_POINT: c4356570bd0442304303989e0e7cc97e31d481f7
STATUS: FRONTEND_INTEGRATION_PREPARATION_COMPLETE
FUNCTIONAL_BASELINE: FROZEN_V083_MAIN
FRONTEND_IMPLEMENTATION: NOT_STARTED
DEPLOY: NOT_AUTHORIZED
NEXT_EXACT_ACTION: FI00_MERGE_CURRENT_MAIN_INTO_FRONTEND_BRANCH

## Delivered

- `docs/design/FRONTEND_INTEGRATION_START_HERE.md` — the first file a fresh
  Codex session reads: baselines, authority order, minimum read set,
  do-not-read and do-not-migrate lists, architecture, slice order, gates.
- `docs/design/FRONTEND_BACKEND_CONTRACT_MATRIX.md` — every frontend-consumed
  route, surface, operation, capability, state, and data class on frozen main,
  extracted deterministically.
- `docs/design/FRONTEND_SOURCE_DISPOSITION.md` — one classification for every
  design and frontend artifact, with reasons for each `DO_NOT_MIGRATE` item.
- `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md` — the v39 Make source in Git with
  recomputed sha256 values, plus the v36 rollback baseline.
- `docs/design/FRONTEND_INTEGRATION_EXECUTION_PLAN.md` — FI-00 to FI-16.
- `docs/design/FRONTEND_INTEGRATION_ACCEPTANCE_MATRIX.md` — the reusable
  Playground and Production verification matrix.
- `docs/design/CODEX_FRONTEND_INTEGRATION_HANDOFF.md` — the exact resume packet.
- Branch-local continuity records updated to point at the preparation result.

## Verified facts a future session must not re-derive

```text
Route inventory      33 SURFACES, 34 V5_ROUTE_CLASSIFICATIONS
                     22 V5_NATIVE_FUNCTIONAL_PARITY_ADDITION - 6 BACKEND_READ_ONLY
                     4 FULLY_BACKEND_WIRED - 1 PLAYGROUND_ONLY
                     1 PROTOTYPE_ONLY_UNSUPPORTED (public.register)
Capabilities         40, src/domain/permissions.js
Operations           40, METHOD_CAPABILITIES in src/server/d1/operational-service.js
Adapter contract     29 SERVICE_METHODS, src/services/service-contract.js
Bootstrap modules    7; row bounds 100 standard / 500 inventory / 500 child
Migrations           32 files; Production at schema32 with 0031 and 0032
Tests                146 unit - 2 integration - 25 e2e - 2 cloudflare-e2e - 3 staging-e2e
Routing              hash-based #/<routeId>; SPA served by the Worker with
                     run_worker_first on /api/*, /brand/*, /media/*
Adapter boundary     src/v5/integration/backend.js is the only HTTP boundary
```

## Known blockers carried to FI-00

1. The branch is 191 commits behind `origin/main` and would delete 135 files
   main has, including `migrations/0031_canonical_identity_foundation.sql`,
   `migrations/0032_staff_account_activity_history.sql`, and the entire
   `src/v5/integration/*` adapter layer. FI-00 must merge `origin/main` into the
   branch and prove zero deletions before FI-01.
2. Frozen main has no `prototypes/`, `output/design/`, or `scripts/design/`.
   Promoting this branch adds 1,170 files totalling 138,815,428 bytes, of which
   134,737,146 bytes are 904 PNG screenshots. Earl must decide the disposition
   per group.
3. Figma defects D-08 (HIGH, contrast), D-04 (typography), and D-02 (blur
   ladder) are open and block FI-01 and FI-02.

## Do not repeat

- Do not re-audit the Figma Design file or re-capture Figma Make.
- Do not re-derive the route inventory, capability list, operation map, or
  status transition tables.
- Do not re-classify the design artifacts.
- Do not rerun the historical v5 browser matrix; it proves the historical
  candidate, not a v0.8.3 candidate.
- Do not use v0.7.2 routes, fields, or functionality as current authority.
- Do not hand-edit a generated artifact.
- Do not merge, rebase, tag, deploy, migrate, or touch a provider without the
  exact accepted authority for that action.
