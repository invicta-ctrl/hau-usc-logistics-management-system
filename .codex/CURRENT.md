# Current Work Pointer

PROGRAM: HAU-USC Logistics
MILESTONE: V0.7.2.1 Repository Normalization and Permanent Staging Sandbox
STATUS: ACTIVE - ISOLATED SANDBOX IMPLEMENTATION VERIFIED LOCALLY; PROVIDER WRITE GATE PENDING COMMIT
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
LAST_VALID_RUNTIME_EVIDENCE: v0.7.2 release SHA 84eacfcdb47a3985fed48e3ba14bb413946d4410; staging and production remained unchanged during read-only preflight
BLOCKER: Provider writes remain gated on a clean committed exact SHA and a final recheck of the private target/rollback manifest.
NEXT_EXACT_ACTION: Finish focused verification, review and commit the bounded sandbox lifecycle implementation, generate the private exact-SHA configuration/rollback manifest, then recheck account and resource isolation before the first provider write.
HANDOFF_STATUS: ACTIVE

Resolve BRANCH, HEAD, UPSTREAM, and WORKTREE_STATE during the Git handshake; their markers avoid a commit invalidating its own continuity record. Gate 0 confirmed the v0.7.2 tag/release and unchanged staging/production release state. The maintenance work began with accepted-spec commit 4181d869275fc81fc05631a38320fd68a232db8d atop main closeout 7f4eb25eac915a3a98453b4cda8df01ca4dbaf8c.

Repository normalization and fail-closed staging safeguards, including exact D1 inventory matching, strict staging-config allowlisting, and private-path error redaction, are committed through 6848bb77ca61f542df953ffb2bd43feca5ffca08. The final independent Sol review of that implementation reported no P0/P1. The remaining accepted work is external staging recovery/reseed/acceptance and protected PR integration after the owner resolves the data boundary.

Owner decision 2026-08-08 authorizes a new permanently isolated synthetic-only staging D1 and only the minimum dedicated Worker/R2/binding/secret writes required by the accepted specification. The existing operational staging D1 is protected read-only evidence and must not be migrated, seeded, reset, reclassified, or otherwise modified.

Read-only Cloudflare inventory verified the exact authenticated account and the existing staging/production separation. The new resource plan is the existing dedicated staging Worker `hau-usc-logistics-staging`, new D1 `hau-usc-logistics-staging-sandbox-v0721`, and new R2 buckets `hau-usc-logistics-staging-sandbox-v0721-assets` and `hau-usc-logistics-staging-sandbox-v0721-evidence`. Raw identifiers, the approved recipient, credentials, and recovery data remain only in an owner-private manifest outside Git. Repository guards now recognize only those names and reject routes, foreign bindings, production names, ID mismatch, SHA/branch drift, and missing recipient containment.

Rollback is defined before creation: privately capture the current staging Worker version; on failure, roll that exact version back so the protected prior staging bindings are restored, verify its release identity and binding fingerprints, and leave every new sandbox resource isolated and unbound. Remove a new D1 or bucket only after exact-name/ID re-verification, zero-binding proof, emptiness/evidence review, and explicit owner confirmation; otherwise preserve it read-only. Secret/allowlist changes are versioned with the Worker and roll back with the captured prior staging version. Production has no step in this rollback plan.
