# FI-00 through FI-12 Direct Playground Migration Handoff

HANDOFF_STATUS: FM_PROVIDER_LOCK_HELD_PREDEPLOY
WORKTREE_AND_BRANCH: D:/Documents/Codex/HAU-USC Logistics/worktrees/fi00-fi12-playground-candidate @ release/v0.8.3-fi12-playground
HEAD: GIT_HEAD (dynamic lock-only deployment checkpoint; use only after fresh rebuild/re-hash)
UPSTREAM: origin/release/v0.8.3-fi12-playground
LANE: FM / FRONTEND MIGRATION
ACTIVE_WRITER: TERRA_HIGH:/root/fi00_fi12_candidate_resume
WRITER_LOCK: ACQUIRED
FM_WRITER_LOCK: HELD
LOCK_EVENT: Canonical FM/provider lock acquired at clean 2401ad36d848aec70eb7a5304f3578066fcf2273; lock-only commit becomes deployment vehicle.
LOCK_DEPENDENCIES: Accepted amendment; sealed private preflight/rollback evidence; clean candidate; no concurrent writer.
LOCK_OUTPUTS: Fresh manifest/config, build/artifact evidence, dry-run, and single deploy receipt.
ACTIVE_AMENDMENT: .codex/specs/accepted/2026-08-27-fi00-fi12-playground-migration-only-amendment.md

FREEZE_EVIDENCE: Pre-documentation candidate `88f4cd238ad1d6392e49e4aa16471583fb20fafd`; tree `47b9941e28a046d3aa3c98dbf3ff262796fbaa1c`; staging artifact `23ef0be59aab1b740610c8f105e837be08fe27168444bd4302f3206f46521b02`; shareable `d72c215e61cf5768f04a7776cb684e1c55c0d2c23a691f783b3b4c68a7249965`; schema 32; migration 0032_staff_account_activity_history.sql. The post-documentation HEAD must be rebuilt and re-hashed as the exact deploy candidate.
TARGET_GATES: PASS — isolated live D1/R2/email; schema 32/migration 0032; no schedule or Production route crossover; current live staging version sealed privately as rollback/redeploy target.
GITHUB_ACTIONS: Authoritative dispatch not used. A queued different-ref run older than 120 minutes has jobs=[]; its exact-ref guard would fail before package and no provider-capable step started. Preserve evidence; do not cancel or dispatch.
DIRECT_PATH: Under the migration-only amendment, use existing `scripts/playground/create-private-config.mjs` then `scripts/playground/deploy-playground.mjs` against current live isolated resources only after a fresh private live-state manifest, dry-run preflight, and exact rebuild/re-hash pass.
FORBIDDEN: New resources; baseline refresh/export/import; data/schema migration; Production; FI-13+; cleanup/retirement; product/frontend scope; and provider action in this checkpoint.
NEXT_ACTION: Commit/push the lock-only checkpoint; prove zero product/FI-13+ delta; derive private manifest; run dry-run/artifact freeze; deploy exactly once only if every guard passes.
EXTERNAL_STATE: No provider, deployment, workflow, Production, data, schema, secret, or resource mutation at lock acquisition.
