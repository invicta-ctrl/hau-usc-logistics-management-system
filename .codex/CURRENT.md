# Current Work Pointer

PROGRAM: HAU-USC Logistics
MILESTONE: V0.7.3 Product Work Intake
STATUS: READY - V0.7.2.1 COMPLETE
BRANCH: GIT_BRANCH
HEAD: GIT_HEAD
UPSTREAM: GIT_UPSTREAM
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/active/hau-usc-logistics-management-system
WORKTREE_STATE: GIT_STATUS
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED - a future writer must claim the lock before changing the repository or an environment
REQUIRED_MODEL: Route by .codex/PHASE_AND_CONTEXT_POLICY.md after an accepted v0.7.3 task exists
CURRENT_TASK: .codex/CURRENT_TASK.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.7.3-product-work-intake.md
MAINTENANCE_MERGE_SHA: 6a30ab482a1e9884870fcfb6e88b7c57f879a44c
LAST_VALID_VERIFICATION_SHA: c4fa46f267733eeceb5d82a825431c6337f8e4e0
LAST_VALID_RUNTIME_EVIDENCE: Isolated staging runs v0.7.2 at c4fa46f267733eeceb5d82a825431c6337f8e4e0 with schema 30 / migration 0030, readiness and protected configuration true, private exact identity/recipient containment, provider-accepted delivery, successful one-time redemption, same-code replay denial, altered-code denial, and a synthetic-only generation 4 dataset. Production remains the canonical v0.7.2 runtime and has no blocker.
BLOCKER: NONE
NEXT_EXACT_ACTION: Ask Earl for the first bounded v0.7.3 product objective, then adopt a task-specific implementation specification before claiming the writer lock or changing code or an environment.
HANDOFF_STATUS: READY_FOR_HANDOFF

Resolve BRANCH, HEAD, UPSTREAM, and WORKTREE_STATE during the Git handshake. The accepted v0.7.3 intake specification authorizes planning only; it does not authorize implementation or an environment write.

PR #17 merged through protected `main`; its temporary maintenance branch was deleted locally and remotely. Exact-head repository verification, browser smoke, CodeQL, secret/PII scans, governance checks, handoff verification, and fresh Sol review passed. No runtime v0.7.2.1 tag or release was created.

The permanent sandbox uses Worker `hau-usc-logistics-staging`, D1 `hau-usc-logistics-staging-sandbox-v0721`, and R2 buckets `hau-usc-logistics-staging-sandbox-v0721-assets` and `hau-usc-logistics-staging-sandbox-v0721-evidence`. Full IDs, recipient, credentials, secrets, provider references, exports, bookmarks, rollback versions, and recovery hashes remain owner-private outside Git. The protected prior staging D1 remains read-only evidence.

Post-merge cleanup removed the two clean contained Phase 18 worktrees, three clean patch-equivalent v0.7.2 task worktrees/branches, the clean tooling worktree, the maintenance branch, and merged release/docs/integration branches. PR #10 was closed as superseded; its useful CodeQL and Renovate content is on `main`, while its unique branch commit remains preserved locally and remotely. The dirty unique design worktree/branch was retained untouched.

Rollback uses the private pre-reset export and manifest, the verified isolated restore (`integrity_check = ok`, zero foreign-key violations), and the retained prior staging Worker version. Production is never a rollback target. Sandbox reset remains fail-closed while verification/application lifecycle state is active.
