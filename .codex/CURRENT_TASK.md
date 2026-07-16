# Current Task

- **Task ID:** `SLICE-10-AUTHORIZED-REFERENCE-ADMINISTRATION`
- **Original instruction:** accept all prior gates and continue from Phase 4
  onward without another manager-approval pause.
- **Intent and mode:** `SOFTWARE_FEATURE`; execute one bounded accepted slice.
- **Matched skills:** `pdf` fixed the accepted phase/gate contract;
  `impl-validator` drove the independent implementation audit; `github:yeet`
  governs the focused publish checkpoint.
- **Objective:** provide a controlled administrator workspace for reference,
  routing, lifecycle, permission, roster-ownership, and sync-health domains so
  operators do not edit raw Sheets.
- **Verified starting state:** authoritative checkout
  `D:\Documents\HAU-USC Logistics\active\hau-usc-logistics-management-system`
  on `integration/v0.5-baseline` at
  `4374fad7d3420c650abbe565bf03be00f2e208d4`; upstream `0 0`; clean. Slice 9
  final runs `29392777117` and `29392777176` passed `validate`, `verify`, and
  `browser-smoke`.
- **Authorization:** owner acceptance permits the bounded implementation,
  focused commit, feature-branch push, CI verification, and direct transition
  to the next slice after all gates pass. It does not authorize deployment,
  migration/import, PR merge, `main`, or operational Google writes.
- **Authoritative specification:** accepted master prompt/operating guide,
  `.plans/hau-usc-v1-release-planning-and-recommendation-package.todo.md`, and
  `docs/REFERENCE_DATA_ADMINISTRATION.md`.
- **In scope:** bounded domain projections; controlled add/update/archive/
  restore; effective dates and aliases; optimistic revisions; dependency
  warnings; before/after confirmation; idempotency/lock/history/audit;
  roster-owned read-only data; permission/routing second review; emergency
  revocation; fail-closed reconciliation; active mobile/desktop UI; tests,
  docs, and generated parity.
- **Out of scope:** permanent delete, raw-grid editing, roster-source editing,
  production bulk import, direct ledger/history mutation, self-escalation,
  deployment, live schema execution, external Apps Script/Sheets/Drive writes,
  PR merge, Cloudflare/database, staging, or production.
- **Writer boundary:** the parent is the only writer; validation was read-only.
- **Rollback:** set `HAU_REFERENCE_ADMIN_WRITES_ENABLED=false`, preserve every
  version/change/history/audit row, use compensating revisions for data repair,
  and use a focused Slice 10 revert for code rollback.
- **Acceptance result:** server authorization, allowlisted DTOs and fields,
  append-before-supersede versioning, dependency protection, revision conflict,
  idempotency, reconciliation state, review separation, requester/reviewer
  self-escalation denial, emergency revocation-only validation, and actionable
  review UI all pass synthetic verification.
- **Current proof:** governance/lint pass; 34 Vitest files / 284 tests pass; the
  build transforms 33 modules; 33 Apps Script sources / 54 required functions,
  generated parity, and both 393,977-byte standalone artifacts pass; full
  Playwright passes 65 / 115 intentional skips / 0 failures; sensitive scan
  and `git diff --check` pass. Independent validation is final PASS after
  repairing self-review, dormant emergency grants, partial-write ordering,
  reconciliation, actionable review, and an eager-bootstrap fetch regression.
- **Current stage:** `SLICE_10_LOCAL_GATES_AND_INDEPENDENT_REVIEW_PASS_READY_COMMIT`.
  Focused commit/push and PR #7 CI verification are next.
