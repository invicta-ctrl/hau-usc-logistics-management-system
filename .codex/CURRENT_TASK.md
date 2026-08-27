# Current Task — FM-R02 through FM-R07 Frontend and Module Repair

STATUS: IN_PROGRESS
INTENT: bug fix and integration
MODE: execute
TARGET: `https://playground.hausc.org/`
ACTIVE_WRITER: SOL_OWNER_SESSION
WRITER_LOCK: HELD
ROUTE: SOLO
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-28-playground-audit-frontend-repair-data-reset-owner-amendment.md
OBJECTIVE: Repair the confirmed adapter and permission crashes, replace Overview and normal-runtime design fixtures, and connect all named modules to real isolated backend contracts.
IN_SCOPE: focused regressions; canonical Request/Lending response projection; Events/Admin capability projection; Overview; Release; Restocking; Procurement; Events; Administration; truthful loading/empty/error/success states.
OUT_OF_SCOPE: reset execution, deployment, Production writes, provider/email writes, FI-18, Figma changes, unknown-work cleanup.
VERIFICATION: focused unit/e2e tests, deterministic build, local route matrix, absence of normal-runtime fixture labels and mock-service dependencies.
STOP_CONDITIONS: changed provider identity or bindings, lost rollback, Production overlap/mutation, privacy leakage, unavailable authorized session, or an unexpected dirty candidate worktree.
NEXT_ACTION: Implement the smallest regression-backed repairs from `.codex/FM_R01_LIVE_PLAYGROUND_AUDIT_CHECKPOINT.md`.
