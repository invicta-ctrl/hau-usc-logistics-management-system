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
COMPLETED: New isolated staging D1/R2 resources, canonical schema 30, exact-SHA Worker, private secrets/one-recipient containment, deterministic synthetic generation 3, backup/restore/reset/reseed, invariants, UI identity, authentication and denial acceptance are complete. Protected prior staging and production are unchanged.
VALIDATION: Focused staging/config/recovery tests passed 23/23; lint has zero errors and one pre-existing warning. Guarded isolated deploy build/dry-run passed. Fresh current export restored with integrity `ok`, zero FK violations, schema 30 and 30 migrations. Runtime readiness/protected configuration, exact SHA, generation 3, synthetic-only/reset eligibility, direct routes, banners, owner login, owner-only denial, disabled denial, and non-allowlisted zero-provider containment passed.
EXTERNAL_ACTIONS: Created and bound only Worker `hau-usc-logistics-staging`, D1 `hau-usc-logistics-staging-sandbox-v0721`, and the two `hau-usc-logistics-staging-sandbox-v0721-*` R2 buckets. Full IDs/rollback versions are private; safe D1 fingerprint `c50b9b3d`. Applied migrations 0001-0030, staged secrets, seeded/reset through generation 3, and made one negative plus one approved-recipient email-start probe. Neither probe contacted the provider; no email challenge exists.
BLOCKER: NONE - owner authorization now permits a private isolated staging-only exact-recipient identity fixture while preserving production policy and protected-directory matching.
NEXT_EXACT_ACTION: Implement and test the generic private exact-recipient staging fixture, configure it outside Git, deploy the exact candidate, and run positive delivery/redemption acceptance.
RESUME_COMMANDS: git status --short --branch; git rev-parse HEAD; npm run handoff:verify; npm run check:governance
PROHIBITED_ACTIONS: Do not mutate production or the protected old staging D1; do not copy production identities, weaken roster checks, infer recipient eligibility, expose private values, create a runtime release/tag, delete resources/evidence, or bypass protected GitHub checks.

Private target IDs, rollback version, allowlist address, credentials, exports, bookmarks, and recovery manifests remain outside Git. The new D1 safe fingerprint is the only tracked identifier.

Rollback uses the privately captured prior Worker version and exact binding readback. New resource deletion is not automatic and requires exact private identity, zero-binding, recovery/evidence review, and explicit owner approval. Preserve the old staging D1 as read-only evidence.
