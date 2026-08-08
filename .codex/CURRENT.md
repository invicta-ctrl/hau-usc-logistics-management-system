# Current Work Pointer

PROGRAM: HAU-USC Logistics
MILESTONE: V0.7.2.1 Repository Normalization and Permanent Staging Sandbox
STATUS: SAFETY STOP - ISOLATED RESOURCES CREATED; APPROVED RECIPIENT ALLOWLIST MISSING
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
LAST_VALID_RUNTIME_EVIDENCE: Existing staging Worker deployment remains unchanged at v0.7.2 release SHA 84eacfcdb47a3985fed48e3ba14bb413946d4410; production and the protected prior staging D1 remain unchanged. New sandbox D1 has zero application schema objects.
BLOCKER: No exact owner-approved staging email recipient allowlist value is present in repository authority or discoverable private staging configuration. Do not infer a recipient.
NEXT_EXACT_ACTION: Owner supplies or identifies the exact approved test-recipient allowlist through a private out-of-Git source; then regenerate the private exact-SHA config, re-run static containment preflight, and resume migrations/deploy/seed.
HANDOFF_STATUS: ACTIVE

Resolve BRANCH, HEAD, UPSTREAM, and WORKTREE_STATE during the Git handshake; their markers avoid a commit invalidating its own continuity record. Gate 0 confirmed the v0.7.2 tag/release and unchanged staging/production release state. The maintenance work began with accepted-spec commit 4181d869275fc81fc05631a38320fd68a232db8d atop main closeout 7f4eb25eac915a3a98453b4cda8df01ca4dbaf8c.

Repository normalization and fail-closed staging safeguards, including exact D1 inventory matching, strict staging-config allowlisting, and private-path error redaction, are committed through 6848bb77ca61f542df953ffb2bd43feca5ffca08. The final independent Sol review of that implementation reported no P0/P1. The remaining accepted work is external staging recovery/reseed/acceptance and protected PR integration after the owner resolves the data boundary.

Owner decision 2026-08-08 authorizes a new permanently isolated synthetic-only staging D1 and only the minimum dedicated Worker/R2/binding/secret writes required by the accepted specification. The existing operational staging D1 is protected read-only evidence and must not be migrated, seeded, reset, reclassified, or otherwise modified.

Read-only Cloudflare inventory verified the exact authenticated account and the existing staging/production separation. The new resource plan is the existing dedicated staging Worker `hau-usc-logistics-staging`, new D1 `hau-usc-logistics-staging-sandbox-v0721`, and new R2 buckets `hau-usc-logistics-staging-sandbox-v0721-assets` and `hau-usc-logistics-staging-sandbox-v0721-evidence`. Raw identifiers, the approved recipient, credentials, and recovery data remain only in an owner-private manifest outside Git. Repository guards now recognize only those names and reject routes, foreign bindings, production names, ID mismatch, SHA/branch drift, and missing recipient containment.

Rollback is defined before creation: privately capture the current staging Worker version; on failure, roll that exact version back so the protected prior staging bindings are restored, verify its release identity and binding fingerprints, and leave every new sandbox resource isolated and unbound. Remove a new D1 or bucket only after exact-name/ID re-verification, zero-binding proof, emptiness/evidence review, and explicit owner confirmation; otherwise preserve it read-only. Secret/allowlist changes are versioned with the Worker and roll back with the captured prior staging version. Production has no step in this rollback plan.

At exact clean commit `c3251d64cbe9818fa68fb1db1b26380657603bb5`, the owner-authorized D1 and two R2 buckets were created with the planned names. Full provider identifiers and the prior Worker rollback version are stored in the owner-private manifest outside Git; the new D1 safe fingerprint is `c50b9b3d`. Readback found zero application schema objects. No migration, secret change, Worker deployment, seed, reset, email send, production write, or protected-prior-staging write occurred. The program stopped before further provider mutation because the exact approved recipient value could not be verified.
