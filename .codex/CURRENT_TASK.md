# Current Task

- **Task ID:** `SLICE-7-FOOD-COMMITTEE-WORKFLOW`
- **Original instruction:** accept the completed Phase 3.5 checkpoint and proceed
  from Phase 4 onward under the attached master operating guide.
- **Intent and mode:** `SOFTWARE_FEATURE`; execute one bounded accepted slice.
- **Matched skill:** `pdf`; the attached operating guide fixes the phase order,
  acceptance gates, and program-completion conditions.
- **Objective:** specialize the accepted composite-request foundation for the
  Food Committee without expanding Materials, Venue & Equipment, finance, or
  external operations.
- **Verified starting state:** authoritative checkout
  `D:\Documents\HAU-USC Logistics\active\hau-usc-logistics-management-system`
  on `integration/v0.5-baseline` at
  `5c9bb501e01eeee961bae01279f2c0188d0429ce`; upstream `0 0`; clean; draft
  PR #7 open/mergeable with all three checks green.
- **Authorization:** explicit user acceptance received 2026-07-15 for the
  Phase 3.5/naming baseline and continuation into Phase 4. This authorizes the
  repository implementation, focused commits, feature-branch pushes, and CI
  checks required by the accepted one-slice-at-a-time process.
- **Authoritative specification:** root `AGENTS.md`, attached master prompt and
  operating guide, `.plans/hau-usc-v1-release-planning-and-recommendation-package.todo.md`,
  and `docs/FOOD_COMMITTEE_WORKFLOW.md`.
- **In scope:** controlled Food request fields; privacy minimization; lead-time
  and sourcing prerequisites; Food-only server-scoped queue/detail; assignment,
  lifecycle, audit/history, completion-evidence validation; mock/service/UI
  parity; focused tests; generated parity; documentation and checkpoint proof.
- **Out of scope:** Materials/Venue specialization, vendor catalog, private
  contacts, supplier TINs, medical narratives, payments/accounting, ledger
  edits, historical backfill, deployment, migration, Apps Script/Sheets/Drive
  external writes, PR merge, Cloudflare, or database work.
- **Writer boundary:** the parent is the only writer. The required independent
  implementation review is read-only.
- **Rollback:** disable the Food specialization flag for new Food submissions;
  retain already-created versioned Food child payloads for safe read/service
  continuity; use a focused revert if code rollback is required.
- **Acceptance:** Food-only and combined requests validate; Food reviewers see
  only the Food child plus bounded safe parent context; dietary data is
  controlled and minimized; lead-time/sourcing/evidence prerequisites are
  enforced server-side; assignments/transitions/audit are durable; full local
  gates, independent review, push, CI, and a clean checkpoint pass.
- **Current stage:** `SLICE_7_COMMITTED_PUSHED_CI_GREEN_ACCEPTED`. Full
  `npm run check` passes 28 files / 231 tests, 30 modules, 30 Apps Script sources
  / 49 functions, generated parity, and standalone verification; full
  Playwright passes 61 / 101 intentional skips / 0 failures; the changed-file
  sensitive scan and `git diff --check` pass; final independent review is PASS.
  Implementation commit `e85e27558f02e6a1f8b3b51be514a0382df24a10` is
  pushed and PR #7 `validate`, `verify`, and `browser-smoke` checks are green in
  runs `29388258079` and `29388258076`. Owner authorization permits direct
  transition to bounded Slice 8 without another manager-approval prompt. No
  external operational system has been changed.
