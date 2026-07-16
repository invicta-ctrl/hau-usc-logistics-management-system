# Current Task

- **Task ID:** `SLICE-11-RESTOCK-SAFETY`
- **Original instruction:** accept all prior gates and continue from Phase 4
  onward without another manager-approval pause.
- **Routing envelope:** `INTENT: SOFTWARE_FEATURE`; `MODE: execute`;
  `TARGET: repository Slice 11 restock workflow`; `RISK: high`;
  `DELIVERABLE: durable server-owned restock review, transitions, and
  line-level receiving`; `STOP CONDITIONS: unsafe Git state, failed mandatory
  gate after two targeted repair rounds, missing external authority, or scope
  expansion`.
- **Matched skills:** `pdf` fixed the accepted phase/gate contract;
  `impl-validator` is required for the independent final implementation audit;
  `github:yeet` governs the focused publish checkpoint; `gh-fix-ci` diagnosed
  and repaired the Slice 10 continuation-label CI regression.
- **Verified starting state:** authoritative checkout
  `D:\Documents\HAU-USC Logistics\active\hau-usc-logistics-management-system`
  on `integration/v0.5-baseline` at
  `d067eb43e74e6da4fa5cc85977fafa1d6e1df55d`; upstream `0 0`; clean. Runs
  `29473310329` and `29473310294` passed `validate`, `verify`, and
  `browser-smoke`.
- **Authorization:** owner acceptance permits this bounded implementation,
  focused commit, feature-branch push, CI verification, and direct transition
  to Slice 12 after all gates pass. It does not authorize deployment,
  migration/import, PR merge, `main`, or operational Google writes.
- **Authoritative specification:** accepted master prompt, accepted planning
  package, and `docs/RESTOCK_SAFETY_WORKFLOW.md`.
- **Decision lock:** a restock workflow is the durable projection of one
  `CATALOG_RESTOCK` request line; its stable server identity is derived from
  that line. Review/procurement transitions and receipts mutate only that
  line, under an optimistic workflow revision. Completion is receipt-derived
  only; sibling lines are never changed implicitly.
- **In scope:** safe queue/detail DTOs; server-returned allowed actions and
  disabled reasons; transition/precondition matrix; explicit reason and
  confirmation; preferred-quote prerequisite; fail-closed write flag;
  idempotency, lock, revision conflict, history/audit; linked cumulative
  receipts and immutable ledger append; authoritative refresh; active
  desktop/mobile UI; tests, docs, schema, and generated parity.
- **Out of scope:** separate duplicate restock table, arbitrary status strings,
  one-click completion, client-only transitions, sibling completion,
  procurement redesign, ledger/history rewrite, legacy backfill, deployment,
  live schema execution, external Apps Script/Sheets/Drive writes, PR merge,
  Cloudflare/database, staging, or production.
- **Writer boundary:** the parent is the only writer; final validation is
  independently read-only.
- **Rollback:** set `HAU_RESTOCK_WORKFLOW_ENABLED=false`; retain read-only
  queue/detail and all request, receipt, ledger, history, and audit rows; use a
  focused Slice 11 revert only for code rollback.
- **Current stage:** `SLICE_11_LOCAL_GATES_GREEN_READY_TO_COMMIT`.
