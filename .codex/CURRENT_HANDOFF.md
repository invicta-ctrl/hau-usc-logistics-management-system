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
COMPLETED: Accepted specification, canonical governance/handoff normalization, repository cleanup, isolated artifact builds, CI simplification, exact staging target/config guards, private-error redaction, recipient containment, and staging identity banner are committed locally through 6848bb77ca61f542df953ffb2bd43feca5ffca08; live staging classification stopped reset before mutation.
VALIDATION: `npm run check` passed 119 files/827 tests; `npm run test:e2e` passed 138 tests with 360 intentional project skips; local Worker/D1 acceptance passed 58 tests; focused safeguard tests, handoff verification, link/reference and deleted-symbol scans, generated parity, isolated staging/production builds, production-banner exclusion, and private-path redaction passed. Final independent Sol review of 6848bb77ca61f542df953ffb2bd43feca5ffca08 reported no P0/P1. One pre-existing lint warning remains and no lint errors exist.
EXTERNAL_ACTIONS: Read-only GitHub and Cloudflare inventory/version/binding inspection only so far; no provider write has occurred in this continuation. The exact authenticated account contains the protected existing staging D1 and distinct production resources. Proposed new names are available. No production or existing-staging mutation is authorized.
BLOCKER: Provider writes remain gated on a clean committed exact SHA and a final recheck of the private target/rollback manifest.
NEXT_EXACT_ACTION: Finish focused verification, review and commit the bounded sandbox lifecycle implementation, generate the private exact-SHA configuration/rollback manifest, then recheck account and resource isolation before the first provider write.
RESUME_COMMANDS: git status --short --branch; npm run handoff:verify; npm run check:governance; git diff --check
PROHIBITED_ACTIONS: Do not mutate production or the protected existing staging D1; do not clone production data, rewrite migrations/history/evidence, merge/release/tag/clean branches, expose private values, or release the writer lock before a verified draft-PR handoff.

Private configuration, credentials, provider identifiers, recipient values, and recovery material remain outside Git.
Resolve the Git marker fields with the resume commands; they are intentionally not self-referential commit literals.

Planned exact resource labels: Worker `hau-usc-logistics-staging`; D1 `hau-usc-logistics-staging-sandbox-v0721`; R2 `hau-usc-logistics-staging-sandbox-v0721-assets` and `hau-usc-logistics-staging-sandbox-v0721-evidence`. Existing staging and all production labels/IDs are prohibited by the sandbox command guards. Raw IDs are private evidence, not tracked status.

Rollback/removal: capture the current staging Worker version privately before creation. On any failure, roll back that exact version and verify its prior release/binding identity; new sandbox resources then remain isolated and unbound. Do not delete them automatically. Removal requires a fresh private exact-name/ID and zero-binding/emptiness check plus explicit owner confirmation. Worker-version rollback also reverts its staged binding/variable/secret version. Production is never a rollback target.
