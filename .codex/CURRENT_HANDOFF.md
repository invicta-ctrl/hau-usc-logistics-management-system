# Current Environment Handoff

FROM: CODEX
TO: EARL / NEXT AUTHORIZED AGENT
BRANCH: release/v0.8.1-isolated-staging-playground
HEAD: GIT_HEAD
UPSTREAM: GIT_UPSTREAM
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/active/hau-usc-logistics-management-system
WORKTREE_STATE: GIT_STATUS
ACTIVE_WRITER: NONE
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_TASK: .codex/CURRENT_TASK.md
ACCEPTED_SPEC: .codex/specs/active/isolated-staging-playground-and-git-governance.md
MILESTONE: Isolated Staging Playground + Git Branch Governance + Production Parity
SLICE: SINGLE BOUNDED UNIT
OUTCOME: COMPLETE_AWAITING_EARL_MANUAL_TESTING
STARTING_SHA: df3fdb96e62ab396c63e3300b58fb70c6ab960a5
PRODUCTION_SHA: 3059098ff2a2935fec59df52748ccae420aadba7
CANDIDATE_SHA: THIS_COMMIT_AT_EXACT_WORKFLOW_DISPATCH
PR: #23 DRAFT
TAG: NONE
RUNTIME_VERSION: 0.8.0
SCHEMA: 30
LATEST_MIGRATION: 0030_production_access_and_operations.sql
NEW_MIGRATION: NONE
MASTER_AUDIT: PASS
COMPLETED: accepted spec/root branch policy; five recovery pointers; isolated privacy-filtered D1 baseline; sealed/working R2 model; reset/refresh/session guards; private console/module switcher/real-login path; exact-freeze candidate workflow; denial tests; provisioning; dirty/reset rehearsal; draft PR #23
VALIDATION: production/prior-staging exports restore with integrity/FK/schema/migration checks; production D1 before/after exact fingerprint and table counts match; playground schema 30/migration 0030; R2 baseline/working manifests reconcile with documented privacy exceptions; live privileged console/session guard passes; Reset Workspace passes; npm run check passes with 133 files and 891 tests
EXTERNAL_ACTIONS: bounded GitHub recovery refs, environment secrets, branch, draft PR #23, and exact workflow dispatch; playground-only D1/R2 and Worker changes; temporary provider Workers removed; production read-only D1/R2 fingerprints only; no production mutation, Google write, or provider/email send
BLOCKER: NONE
LOCAL_VALIDATION: npm run check PASS; governance/handoff PASS; lint 0 errors/1 existing warning; build, Apps Script, dist parity, Cloudflare types/dry-run PASS; 133 test files and 891 tests PASS; playground suite 8 files/23 tests PASS
STAGING: exact frozen candidate deployed to the Isolated Staging Playground; readiness, version identity, D1/R2 isolation, module switcher, real-login path, session guard, and CLEAN reset state PASS
PRODUCTION: exact v0.8.0 / 3059098ff2a2935fec59df52748ccae420aadba7 identity verified read-only; D1 exact pre/post fingerprint and R2 safe pre/post fingerprints unchanged; mutation NONE
RECOVERY: prior staging Worker/D1/R2 preserved; fresh staging and production D1 exports restored locally; new playground D1 sealed Time Travel bookmark and pre-reset bookmark proof captured; R2 baseline manifests sealed privately
ROLLBACK_REQUIRED: NO
GOOGLE_WRITES: NONE
PROVIDER_EMAIL_SENDS: NONE
HANDOFF_STATUS: READY_FOR_HANDOFF
NEXT_EXACT_ACTION: Earl manually tests the exact PR #23 playground candidate. If accepted, submit a separate explicit production GO task; do not merge, deploy production, rotate pointers, start frontend integration, or begin M1/M2 from this handoff.
RESUME_COMMANDS: git status --short --branch; git fetch origin; git rev-parse origin/main; npm run handoff:verify; npm run check:governance
PROHIBITED_ACTIONS: no production deployment/business mutation/migration, automatic promotion, frontend baseline integration, v0.8.1 product features, M1/M2, Google write, provider/email send, force push, or unknown branch deletion
DO_NOT_REPEAT: Gate A baseline creation, resource provisioning, privacy sanitization, initial recovery-pointer creation, or reset rehearsal unless current provider evidence shows drift; do not dispatch a different candidate without invalidating Earl approval.
