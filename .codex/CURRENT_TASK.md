# Current Task

- **Task ID:** `SLICE-9-VENUE-EQUIPMENT-REFERENCE-VERTICAL`
- **Original instruction:** accept all prior gates and continue from Phase 4
  onward without another manager-approval pause.
- **Intent and mode:** `SOFTWARE_FEATURE`; execute one bounded accepted slice.
- **Matched skill:** `pdf`; the attached operating guide fixes phase order,
  verification gates, and program-completion conditions.
- **Objective:** add the accepted Venue and Equipment reference/request vertical
  with versioned server-owned routing and truthful requestability, without a
  fourth permanent committee or an admin editor.
- **Verified starting state:** authoritative checkout
  `D:\Documents\HAU-USC Logistics\active\hau-usc-logistics-management-system`
  on `integration/v0.5-baseline` at
  `a0b4e7f46620056b5fc73036bea69bfcf8da0f83`; upstream `0 0`; clean; draft
  PR #7 open/mergeable. Final Slice 8 evidence runs `29390266015` and
  `29390265681` passed `validate`, `verify`, and `browser-smoke`.
- **Authorization:** owner acceptance permits the bounded implementation,
  focused commit, feature-branch push, CI verification, and direct transition
  to the next bounded slice after all gates pass. It does not authorize a
  deployment, migration, PR merge, or operational data write.
- **Authoritative specification:** root `AGENTS.md`, attached master prompt and
  operating guide, `.plans/hau-usc-v1-release-planning-and-recommendation-package.todo.md`,
  and `docs/VENUE_EQUIPMENT_REFERENCE_WORKFLOW.md`.
- **In scope:** additive versioned reference/routing schema; safe bounded lookup;
  venue combobox and predictive equipment selection; quantity/unit and summary;
  constrained Other triage; effective requestability; lead time/office/
  authority/instructions; server-selected existing-committee routing; immutable
  child snapshots; confirmation/blocker/return/evidence state; scoped queue;
  revision/idempotency/authorization; tests/docs/generated parity.
- **Out of scope:** institutional directory scraping, invented production
  reference values, confirmed booking/real-time availability, fourth committee,
  admin editor, raw-sheet import/backfill, private contacts, posted ledger
  mutation, deployment, migration execution, Apps Script/Sheets/Drive external
  writes, PR merge, Cloudflare, database, staging, or production.
- **Writer boundary:** the parent is the only writer. The required independent
  implementation review is read-only.
- **Rollback:** disable `HAU_VENUE_EQUIPMENT_REQUESTS_ENABLED` for new
  specialized selections, retain versioned stored children/history, and use a
  focused revert for code rollback.
- **Acceptance:** safe approved references are searchable and historically
  stable; requestability never claims booking; Other remains visible pending
  triage; server routing selects only an existing committee/owner and conflicts
  fail closed; confirmation/return/evidence gates and parent derivation hold;
  full local gates, independent review, push, CI, and clean parity pass.
- **Current stage:** `SLICE_9_LOCAL_GATES_AND_INDEPENDENT_REVIEW_PASS_READY_COMMIT`.
  Domain, Apps Script, service contracts, active UI, generated artifacts, and
  focused browser coverage are implemented. Governance, lint, 32 Vitest files /
  262 tests, the 32-module build, 32 Apps Script sources / 54 functions,
  deterministic parity, standalone verification, sensitive scan, full
  Playwright (61 passed / 101 intentional skips / 0 failed), and
  `git diff --check` pass. Independent review is final PASS after repairing
  effective-revision selection, server-owned lookup time, legacy preview
  parity, replay immutability, and exact uploaded evidence validation. The
  focused commit and push are next.
