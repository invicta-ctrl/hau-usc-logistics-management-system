# Current Work Pointer

PROGRAM: HAU-USC Logistics
MILESTONE: V0.7.2.1 Repository Normalization and Permanent Staging Sandbox
STATUS: BLOCKED - OWNER STAGING DATA DISPOSITION REQUIRED
BRANCH: GIT_BRANCH
HEAD: GIT_HEAD
UPSTREAM: GIT_UPSTREAM
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/active/hau-usc-logistics-management-system
WORKTREE_STATE: GIT_STATUS
ACTIVE_WRITER: CODEX
WRITER_LOCK: CODEX owns the maintenance branch for the active batch
REQUIRED_MODEL: GPT-5.6 Terra for governance/documentation; escalate protected-boundary decisions
CURRENT_TASK: .codex/CURRENT_TASK.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.7.2.1-repository-normalization-and-staging-sandbox.md
LAST_VALID_RUNTIME_EVIDENCE: v0.7.2 release SHA 84eacfcdb47a3985fed48e3ba14bb413946d4410; staging and production are unchanged
BLOCKER: Private staging reset and deployment are blocked by live non-synthetic/unclassified operational rows; no approved lifecycle manifest can classify or mutate them.
NEXT_EXACT_ACTION: Obtain owner-approved disposition for non-synthetic staging rows or authorize a new isolated staging D1; then complete backup/restore, lifecycle reseed, staging deploy/acceptance, and PR integration.
HANDOFF_STATUS: BLOCKED_OWNER_DECISION

Resolve BRANCH, HEAD, UPSTREAM, and WORKTREE_STATE during the Git handshake; their markers avoid a commit invalidating its own continuity record. Gate 0 confirmed the v0.7.2 tag/release and unchanged staging/production release state. The maintenance work began with accepted-spec commit 4181d869275fc81fc05631a38320fd68a232db8d atop main closeout 7f4eb25eac915a3a98453b4cda8df01ca4dbaf8c.

Repository normalization and fail-closed staging safeguards are committed at 9ebe5d1571eea6ee84e35bada5b8658730eb40eb. Local verification passed; the remaining accepted work is external staging recovery/reseed/acceptance and protected PR integration after the owner resolves the data boundary.
