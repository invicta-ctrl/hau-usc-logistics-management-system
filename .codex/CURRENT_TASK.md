# Current Task

- **Task ID:** `SLICE-8-MATERIALS-COMMITTEE-WORKFLOW`
- **Original instruction:** accept all prior gates and continue from Phase 4
  onward without another manager-approval pause.
- **Intent and mode:** `SOFTWARE_FEATURE`; execute one bounded accepted slice.
- **Matched skill:** `pdf`; the attached operating guide fixes phase order,
  verification gates, and program-completion conditions.
- **Objective:** specialize the accepted composite-request foundation for the
  Materials Committee without expanding Venue & Equipment, vendor management,
  finance, deployment, or external operations.
- **Verified starting state:** authoritative checkout
  `D:\Documents\HAU-USC Logistics\active\hau-usc-logistics-management-system`
  on `integration/v0.5-baseline` at
  `290dc629fd9c0765bca39144224798c65b667eaa`; upstream `0 0`; clean; draft
  PR #7 open/mergeable with `validate`, `verify`, and `browser-smoke` green.
- **Authorization:** owner acceptance permits the bounded implementation,
  focused commit, feature-branch push, CI verification, and direct transition
  to the next bounded slice after all gates pass. It does not authorize a
  deployment, migration, PR merge, or operational data write.
- **Authoritative specification:** root `AGENTS.md`, attached master prompt and
  operating guide, `.plans/hau-usc-v1-release-planning-and-recommendation-package.todo.md`,
  and `docs/MATERIALS_COMMITTEE_WORKFLOW.md`.
- **In scope:** controlled Materials category/specification/quantity/unit;
  required-by and usage; sourcing preference; exact catalog provenance and
  `VERIFY` denial; one stock-or-procurement fulfillment path; explicitly
  approved substitutions; blockers; path-matching evidence; Materials-only
  server queue; revision/idempotency/authorization; active UI; tests/docs.
- **Out of scope:** automatic substitution/equivalence, arbitrary unit
  conversion, posted ledger mutation, vendor master redesign, Venue/Equipment,
  private supplier identifiers, deployment, migration, Apps Script/Sheets/
  Drive external writes, PR merge, Cloudflare, database, staging, or production.
- **Writer boundary:** the parent is the only writer. The required independent
  implementation review is read-only.
- **Rollback:** disable `HAU_MATERIALS_REQUESTS_ENABLED` for new submissions,
  retain versioned stored children and history, and use a focused revert for
  code rollback.
- **Acceptance:** Materials-only and combined requests persist; exact quantity,
  unit, and provenance remain auditable; `VERIFY` is denied; only one
  authoritative fulfillment path exists; substitutions and evidence are
  server-validated; scoped queue and parent derivation reconcile; full local
  gates, independent review, push, CI, and clean parity pass.
- **Current stage:**
  `SLICE_8_IMPLEMENTED_VERIFIED_INDEPENDENT_PASS_PENDING_COMMIT`.
  `npm run check` passes 30 Vitest files / 244 tests, a 31-module build,
  31 Apps Script sources / 51 required functions, deterministic generated
  parity, and two 329,544-byte standalone artifacts. Full Playwright passes
  61 / 101 intentional skips / 0 failures; the independent final verdict is
  PASS with no remaining findings; changed-scope sensitive and diff checks
  pass. The focused commit/push and GitHub CI remain before Slice 9 begins.
