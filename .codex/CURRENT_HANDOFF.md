# Current Environment Handoff

FROM: CODEX
TO: CODEX
BRANCH: GIT_BRANCH
HEAD: GIT_HEAD
UPSTREAM: GIT_UPSTREAM
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/active/hau-usc-logistics-management-system
WORKTREE_STATE: GIT_STATUS
ACTIVE_WRITER: CODEX
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_TASK: .codex/CURRENT_TASK.md
ACCEPTED_SPEC: .codex/specs/active/v0.7.2.1-repository-normalization-and-staging-sandbox.md
COMPLETED: Isolated staging D1/R2, schema 30, exact-SHA Worker, private exact identity/recipient/sender secrets, deterministic generation 4, backup/restore/reset/reseed, inherited Google/Drive binding removal, invariants, UI identity, authentication/denial, critical workflow reads, and provider acceptance are complete. Protected prior staging and production are unchanged.
VALIDATION: Focused identity/config/sandbox tests and lint pass. Guarded isolated deploy passed. Fresh export restored with integrity `ok`, zero FK violations, schema 30 and 30 migrations. Runtime readiness/protected configuration, exact SHA, generation 4, synthetic-only/reset eligibility, owner login, owner-only and disabled denials, critical module reads, negative zero-challenge containment, and one provider-accepted challenge passed.
EXTERNAL_ACTIONS: Used only Worker `hau-usc-logistics-staging`, D1 `hau-usc-logistics-staging-sandbox-v0721`, and the two `hau-usc-logistics-staging-sandbox-v0721-*` R2 buckets. Full IDs/rollback versions remain private; safe D1 fingerprint `c50b9b3d`. Added the private fixture/recipient/sender secrets, removed ten inherited Google/Drive staging secret bindings, deployed the exact candidate, reset/reseeded generation 4, made one negative probe, and created one provider-accepted challenge.
BLOCKER: The legitimate provider-accepted message contains a private one-time code that must be redeemed through the normal confirmation endpoint; no bypass is authorized.
NEXT_EXACT_ACTION: Redeem the legitimate staging verification code, prove replay denial, then run the one final repository gate and fresh Sol review before protected GitHub integration.
RESUME_COMMANDS: git status --short --branch; git rev-parse HEAD; npm run handoff:verify; npm run check:governance
PROHIBITED_ACTIONS: Do not mutate production or the protected old staging D1; do not copy production identities, weaken roster checks, infer recipient eligibility, expose private values, create a runtime release/tag, delete resources/evidence, or bypass protected GitHub checks.

Private target IDs, rollback version, allowlist address, credentials, exports, bookmarks, and recovery manifests remain outside Git. The new D1 safe fingerprint is the only tracked identifier.

Rollback uses the privately captured prior Worker version and exact binding readback. New resource deletion is not automatic and requires exact private identity, zero-binding, recovery/evidence review, and explicit owner approval. Preserve the old staging D1 as read-only evidence.
