# Current Bounded Task — FI-07 intake and handshake only

INTENT: SOFTWARE_FEATURE
MODE: INTAKE
OBJECTIVE: Establish FI-07 authority, accepted scope, dependencies, and repository state without implementing FI-07.
TARGET: FI-07 intake records and read-only authority/repository handshake only.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-24-fi06-internal-request-hub-frontend-integration.md
FI07_ACCEPTED_SPEC: NONE — an FI-07 packet is required before implementation.
AUTHORITY: Earl's continuing FI-04→FI-17 directive; R1/A2; accepted A3/A4; FI-06 accepted receipt and current repository state.
REQUIRED_MODEL: GPT-5.6 Sol intake/orchestration; a new GPT-5.6-Terra lock is required for any future write.
TASK_STATUS: FI07_INTAKE_ONLY
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
RISK: MEDIUM
SCOPE: Read the bounded authority chain, confirm the next FI-07 packet and dependencies, perform the required Git handshake, and record a truthful next action.
OUT_OF_SCOPE: FI-07 source, tests, artifacts, package changes, backend/server/Worker/auth/capability changes, provider/Figma/Playground/Production/main/deployment/migration/D1/R2 writes, `.ai-bridge/`, commit, and push.
VERIFICATION: Git handshake and accepted FI-07 authority only; no implementation verification is authorized during intake.
STOP_CONDITIONS: Missing or contradictory FI-07 authority, unknown tracked dirt, conflicting writer, protected-preview traffic, backend/auth/capability semantic change, or any request to implement before acceptance and a new writer lock.
DELEGATION_LEDGER:

- writer=/root/fi05_inventory_writer | model=gpt-5.6-terra | role=FI-06 predecessor writer | mode=execute | scope=initial FI-06 integration handoff | excluded=backend/provider/deployments/.ai-bridge/FI-07+ | status=RELEASED | evidence=FI-05 lock-release transfer records.
- writer=/root/fi06_request_hub_writer | model=gpt-5.6-terra | role=FI-06 successor sole canonical integration writer | mode=execute | scope=accepted FI-06 frontend integration, artifacts, and continuity closeout | excluded=backend/provider/deployments/.ai-bridge/FI-07+ | status=COMPLETED | evidence=.codex/FI06_INTERNAL_REQUEST_HUB_RECEIPT.md.

NEXT_EXACT_ACTION: Perform FI-07 intake and repository handshake only. Do not implement FI-07 or acquire a writer lock before an FI-07 packet is accepted.
