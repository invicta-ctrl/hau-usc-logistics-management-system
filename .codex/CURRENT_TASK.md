# Current Bounded Task — FI-08 Release Desk frontend integration

INTENT: SOFTWARE_FEATURE
MODE: EXECUTE
OBJECTIVE: Integrate the already-present Make-v44-parity Release Desk into the existing authenticated route and accepted A4 local Preview Index inspection path without changing backend, auth, permission, release, inventory, or ledger behavior.
TARGET: `.codex/specs/accepted/2026-08-25-fi08-release-desk-frontend-integration.md`; `src/frontend/app/AppRouteRenderer.tsx`; `src/frontend/preview/index/PreviewInspectionRoute.tsx`; `src/frontend/preview/index/registry.ts`; focused FI-08 tests and required Preview Index assertions.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-25-fi08-release-desk-frontend-integration.md
LAST_COMPLETED_SPEC: .codex/specs/accepted/2026-08-24-fi07-internal-lending-hub-frontend-integration.md
LAST_COMPLETED_FI07: INDEPENDENT_SOL_ACCEPTED_NO_FINDINGS__ROOT_INDEPENDENT_EVIDENCE_RECORDED__ARTIFACT_SHA256_707A00FDF4DC4BC6EB2C2053007B21F9997A9D51ADDF65F7EE1B65CAA091F738
FI08_PACKET_STATUS: ACCEPTED_FOR_IMPLEMENTATION__OWNER_AUTHORIZED_2026-08-25
AUTHORITY: Earl's 2026-08-25 owner instruction; accepted R1 one-shot/R1-A2/A3/A4 amendments; TOKEN-OPT-001-A8; .agents/PROJECT_POLICY.md; live repository contract truth; current Figma Make visual authority; accepted FI-08 packet.
REQUIRED_MODEL: GPT-5.6 Terra / Max sole canonical frontend writer; Sol remains read-only orchestrator/final reviewer.
TASK_STATUS: FI08_EXECUTION_AUTHORIZED__WRITER_LOCK_ACQUIRED
ACTIVE_WRITER: TERRA_MAX:/root/fi08_terra_writer
WRITER_LOCK: ACQUIRED__SINGLE_CANONICAL_FRONTEND_WORKTREE_WRITER
RISK: MEDIUM
SCOPE: Wire the existing deterministic Release Desk UI into the authenticated route and A4 local Preview Index inspection, update truthful registry metadata, preserve synthetic states/interactions and visual/accessibility behavior, and add focused coverage. Reuse existing architecture; modify `ReleaseDeskRoute.tsx` only when direct live Make comparison proves a bounded fidelity defect.
OUT_OF_SCOPE: Backend/API/Worker/auth/capability/permission/schema/migration/provider/Figma write/Playground/Production/main/deployment/D1/R2/release or ledger domain semantics; real release mutation binding; `.ai-bridge/`; and any unrelated frontend work.
VERIFICATION: Canonical 4173 preview status/reachability; live Make comparison; focused FI-08 units; Preview Index foundation/targeted browser assertions; no protected request/mutation traffic through A4; semantic/keyboard/focus/responsive inspection; console; frontend build; `git diff --check`; complete logical-diff review.
STOP_CONDITIONS: Missing or contradictory authority; unknown tracked dirt other than preserved `.ai-bridge/`; conflicting writer; a needed backend/auth/capability/release-domain semantic change; provider/deploy/destructive action; live design access failure after documented recovery; or failed verification that cannot be resolved within this scope.
DELEGATION_LEDGER:

- writer=/root/fi05_inventory_writer | model=gpt-5.6-terra | role=FI-06 predecessor writer | mode=execute | scope=initial FI-06 integration handoff | excluded=backend/provider/deployments/.ai-bridge/FI-07+ | status=RELEASED | evidence=FI-05 lock-release transfer records.
- writer=/root/fi06_request_hub_writer | model=gpt-5.6-terra | role=FI-06 successor sole canonical integration writer | mode=execute | scope=accepted FI-06 frontend integration, artifacts, and continuity closeout | excluded=backend/provider/deployments/.ai-bridge/FI-07+ | status=COMPLETED | evidence=.codex/FI06_INTERNAL_REQUEST_HUB_RECEIPT.md.
- writer=/root/fi07_lending_hub_writer | model=gpt-5.6-terra | role=FI-07 sole canonical integration writer | mode=execute | scope=accepted FI-07 frontend integration, A4 fixture, focused tests/artifacts/continuity | excluded=backend/auth/permissions/schema/provider/Figma/deployments/.ai-bridge/FI-08+ | status=COMPLETED__RELEASED | evidence=independent Sol ACCEPTED_NO_FINDINGS; root independent evidence; artifact SHA-256 707A00FDF4DC4BC6EB2C2053007B21F9997A9D51ADDF65F7EE1B65CAA091F738.
- writer=/root/fi08_terra_writer | model=gpt-5.6-terra | role=FI-08 sole canonical frontend writer | mode=execute | scope=accepted Release Desk route/Preview Index integration, focused tests, local preview verification | owned=FI-08 packet/current-chain,AppRouteRenderer,PreviewInspectionRoute,registry,focused tests | excluded=backend/auth/permissions/schema/provider/Figma/deployments/.ai-bridge | status=ACTIVE__LOCK_ACQUIRED | evidence=owner instruction and accepted FI-08 packet.

PREVIEW_TARGET: http://127.0.0.1:4173/
NEXT_EXACT_ACTION: Check `npm.cmd run preview:frontend:status`; use the canonical `preview:frontend:stop` only after its own proven-dead/closed-port safety gate passes, then start through the existing supervisor. Inspect live Make visual authority before UI edits, then implement the scoped route/Preview Index/registry integration.
