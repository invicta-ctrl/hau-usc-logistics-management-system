# Current Work Pointer — FI-00 through FI-12 Direct Playground Migration

PROGRAM: HAU-USC Logistics FI-00 through FI-12 isolated Playground migration
STATUS: FI00_FI12_PUBLIC_SMOKE_COMPLETE_AUTH_READ_BLOCKED
PHASE: FM / FRONTEND MIGRATION — final acceptance
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/fi00-fi12-playground-candidate
BRANCH: release/v0.8.3-fi12-playground
HEAD: GIT_HEAD (dynamic smoke-lock documentation checkpoint; deployed source remains fixed below)
UPSTREAM: origin/release/v0.8.3-fi12-playground
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
LANE: FM / FRONTEND MIGRATION
FM_WRITER_LOCK: RELEASED
LOCK_EVENT: Canonical FM smoke/receipt lock released after one corrected fresh local public-smoke PASS.
LOCK_DEPENDENCIES: Accepted migration-only amendment; deployed source 8992e670861f136ce803ef03b68aa4687dcda8fc; private deployment receipt; no concurrent writer.
LOCK_OUTPUTS: Private corrected local public-smoke receipt; no login/session/data/provider mutation.
DEPLOYED_SOURCE_SHA: 8992e670861f136ce803ef03b68aa4687dcda8fc
DEPLOYMENT_RECEIPT: Private/redacted local evidence; upload count 1; retries 0; deployed version identity retained privately.
VERIFIER_NOTE: Private deployment verifier history-order correction is closed; no repository deployment-code change.
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-27-fi00-fi12-playground-migration.md
ACTIVE_AMENDMENT: .codex/specs/accepted/2026-08-27-fi00-fi12-playground-migration-only-amendment.md

FROZEN_PRE_DOCUMENTATION_CANDIDATE: 88f4cd238ad1d6392e49e4aa16471583fb20fafd
FROZEN_PRE_DOCUMENTATION_TREE: 47b9941e28a046d3aa3c98dbf3ff262796fbaa1c
FROZEN_STAGING_ARTIFACT_SHA256: 23ef0be59aab1b740610c8f105e837be08fe27168444bd4302f3206f46521b02
FROZEN_SHAREABLE_ARTIFACT_SHA256: d72c215e61cf5768f04a7776cb684e1c55c0d2c23a691f783b3b4c68a7249965
FROZEN_SCHEMA_AND_MIGRATION: schema 32; 0032_staff_account_activity_history.sql
FROZEN_SCOPE: FI-00 through FI-12 only; no product/frontend source delta or FI-13+ behavior relative to accepted baseline.

MINIMUM_TARGET_GATES: PASS — exact locked candidate/tree/artifact; authenticated identity; staging environment/playground label; live isolated D1/R2 tuple; schema 32/migration 0032; email disabled; no scheduled trigger or Production route crossover; sealed rollback remains valid; current Production unchanged.
DEPLOYMENT_OUTCOME: FI00_FI12_PLAYGROUND_DEPLOYED=TRUE; PLAYGROUND_AVAILABLE_FOR_TESTING=TRUE; PRODUCTION_UNTOUCHED=TRUE; MIGRATION_PERCENTAGE=100 (deployment only, not final acceptance); MIGRATION_JOB_STATUS=COMPLETE; FINAL_ACCEPTANCE=PARTIAL.
GITHUB_ACTIONS_DISPATCH: Not used. Previous different-ref queued run remained deployment-incapable; no dispatch or cancellation occurred.
EXCLUSIONS: No new resources; baseline refresh/export/import; data/schema migration; Production deployment/action; FI-13+; cleanup/retirement; frontend integration/design/polish; workflow dispatch; login/session creation or inspection; data mutation; or source/product change.
EXTERNAL_MUTATIONS: No mutation is authorized in this smoke checkpoint. Existing deployment is fixed: one isolated Playground Worker upload; Production deployment, traffic, resource, data, schema, secret, and workflow mutation: ZERO.
ROLLBACK: READY — sealed pre-deploy staging version and D1/brand-R2/evidence-R2 tuple remain present, matched, and isolated; exact identifiers are private.
SMOKE_RECEIPT: PUBLIC_SMOKE=PASS — fresh headless non-persistent local Chromium verified version/readiness exact deployed candidate, staging/playground, schema 32 and migration 0032; `/`, `/login`, `/portals`, `/request`, and `/lending` rendered 200 with visible controls; `/login` semantic auth-entry surface passed at desktop and mobile; denied access-directory POST returned 401 before service access; missing API route returned 404; desktop/mobile had no horizontal overflow; no fatal pageerror, Production traffic, unexpected external host, unexpected non-GET/HEAD request, or mutation. KNOWN_NONBLOCKING_CSP_FONT_REQUESTS=7 — configured `src/frontend/styles/fonts.css` Google Fonts stylesheet attempts were CSP-blocked before third-party contact/content load, are not Production or application-provider traffic, and did not impair UI. AUTHORIZED_READ_SMOKE=BLOCKED_NO_EXISTING_SESSION.
HANDOFF_STATUS: BLOCKED_OWNER_INTERACTION
NEXT_ACTION: Owner exposes an already-authenticated isolated Playground target tab; then a sole operator must source-review and perform one read-only, non-sliding/non-auditing authenticated request. No login or session/storage inspection is authorized.
