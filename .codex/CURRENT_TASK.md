# Current Task

- **Task ID:** `SLICE-12-BOUNDED-NEAR-LIVE-REFRESH`
- **Original instruction:** accept all prior gates and continue from Phase 4
  onward without another manager-approval pause.
- **Routing envelope:** `INTENT: SOFTWARE_FEATURE`; `MODE: execute`;
  `TARGET: repository Slice 12 bounded near-live active-module refresh`;
  `RISK: high`; `DELIVERABLE: scoped revision signaling and safe active-module
  refresh`; `STOP CONDITIONS: unsafe Git state, failed mandatory gate after
  two targeted repair rounds, missing external authority, or scope expansion`.
- **Matched skills:** `pdf` fixed the accepted phase/gate contract;
  `impl-validator` is required for the independent final implementation audit;
  `github:yeet` governs the focused publish checkpoint.
- **Verified starting state:** authoritative checkout
  `D:\Documents\HAU-USC Logistics\active\hau-usc-logistics-management-system`
  on `integration/v0.5-baseline` at
  `6fa6222adde5e8314d2defc40e0cd6686fff953b`; upstream `0 0`; clean. Run
  `29475144749` passed `validate`; run `29475144793` passed `verify` and
  `browser-smoke`.
- **Scope checkpoint:** `ef05589015af636ff0fef820681e72cc54f6bb76` is pushed
  at local/upstream/PR parity; runs `29475376088` and `29475376055` passed
  `validate`, `verify`, and `browser-smoke` before implementation began.
- **Authorization:** owner acceptance permits this bounded implementation,
  focused commit, feature-branch push, CI verification, and direct transition
  to the next program gate after all Slice 12 gates pass. It does not authorize
  deployment, migration/import, PR merge, `main`, or operational Google writes.
- **Authoritative specification:** accepted master prompt, accepted planning
  package Slice 12, and `docs/NEAR_LIVE_REFRESH.md`.
- **Decision lock:** use a 15-second default plus bounded deterministic jitter;
  check at most one scoped revision per internal session while visible, online,
  and focused or recently active; an unchanged token performs no module read;
  a changed token refreshes only the active bounded module; dirty input is
  never overwritten. Manual and post-mutation refresh remain available.
- **In scope:** per-scope revision DTO/service; sole adapter; active-module
  controller; visibility/focus/online/dirty/in-flight policy; bounded
  backoff/jitter; out-of-order protection; last-updated/stale/manual UX;
  fail-closed remote disable; request/read instrumentation; tests, docs, and
  generated parity.
- **Out of scope:** WebSockets, five-second polling, background/full-bootstrap
  polling, inactive-module refresh, cached-client authorization, write replay,
  new database/realtime/hosting service, deployment, migration, external Apps
  Script/Sheets/Drive writes, PR merge, staging, or production.
- **Current quota preflight:** official Google documentation rechecked
  2026-07-16: six-minute execution limit, 30 simultaneous executions per user,
  1,000 per script, and ten concurrent `google.script.run` calls per page. These
  are ceilings, not targets; the design minimizes and batches service reads.
- **Load-model boundary:** repository evidence will report parameterized 1, 10,
  and 30 active-session scenarios. These are engineering scenarios, not a claim
  about institutional usage; live p95/concurrency acceptance remains Slice 13
  staging work and requires separately authorized resources and named owners.
- **Writer boundary:** the parent is the only writer; final validation is
  independently read-only.
- **Rollback:** set the near-live feature flag false; preserve manual and
  post-mutation refresh, accepted revision state, and all immutable records;
  use a focused Slice 12 revert only for code rollback.
- **Local result:** scoped CONFIG tokens, strict internal endpoint, active-module
  polling/controller, clean/dirty/modal lifecycle policy, fail-closed remote
  flag, request-only token isolation, instrumentation, UX, docs, tests, and
  generated parity are implemented. Final validation is PASS after repairing
  first-navigation token baselining, request-only token exposure, and abandoned
  modal dirty-state retention.
- **Local proof:** `npm run check` passes 36 Vitest files / 303 tests, a
  34-module build, 33 Apps Script sources / 55 required functions,
  deterministic generated parity, and two 411,048-byte artifacts. Full
  Playwright passes 67 / 119 intentional skips / 0 failed; focused 390 px
  near-live proof, `git diff --check`, artifact hashing, and sensitive review
  pass.
- **Remote proof:** focused implementation commit
  `a563f2f179b710ac7c0d46a8af05a4349a5e625b` is pushed at
  local/upstream/PR parity. Run `29477031867` passed `validate`; run
  `29477031799` passed `verify` and `browser-smoke`. PR #7 remains open,
  draft, and mergeable.
- **Current stage:** `SLICE_12_COMMITTED_PUSHED_CI_GREEN_ACCEPTED`.
- **Next gate:** record this evidence checkpoint, verify its exact-SHA CI, then
  enter Slice 13 staging-readiness preflight without deploying or mutating an
  external resource.
