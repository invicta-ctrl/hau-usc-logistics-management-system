# Current Task — V0.8.3 Activity History Focused Luna Re-review

INTENT: CODE_REVIEW
MODE: READ_ONLY_REVIEW
OBJECTIVE: Independently review the exact repaired ID-G implementation evidence once, focused only on the invalidated three-path repair, real Miniflare/D1 producer execution evidence, and the V5 navigation race before any canonical integration decision.
TARGET: Isolated branch release/v0.8.3-staff-account-activity-history at c13bbdadf7fa46829a3a78dece66f08bfe111013, compared with canonical governance base f3c28ba257e80fabb532979969ddd27cab0959db.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md
CONTROLLING_AMENDMENT: .codex/specs/active/v0.8.3-v1r7-a7-r2-final-acceleration-s17-closure-amendment.md
AUTHORITY: Earl explicit current instruction -> V1R7-A7-R2 -> accepted v0.8.3 A5 specification -> checked-in AGENTS.md -> current continuity chain.
REQUIRED_MODEL: Luna MAX read-only reviewer; no Luna writes or child agents.
ACTIVE_WRITER: TERRA_MAX:/root/v83_completion_terra_writer
TERRA_WRITER: TERRA_MAX:/root/v83_completion_terra_writer
LOCK_HOLDER: TERRA_MAX:/root/v83_completion_terra_writer
WRITER_LOCK: HELD
LOCK_STATUS: ACTIVE
BRANCH: GIT_BRANCH
HEAD: GIT_HEAD
UPSTREAM: origin/release/v0.8.3-identity-foundation@GIT_HEAD;PUSH_PARITY_REQUIRED
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/v081-production-execution-eb14cd81
WORKTREE_STATE: GIT_STATUS
RISK: HIGH;MIGRATION_APPEND_ONLY_IDENTITY_IMMUTABILITY_EVENT_TIME_ATTRIBUTION_PRIVACY_AND_V5_RACE
SCOPE: One focused read-only Luna implementation re-review of the exact ID-G repair at c13bbdadf7fa46829a3a78dece66f08bfe111013. Verify that real Miniflare/D1 executes migration 0032 and actual producer statements across the named safety branches, and that navigation-away/reload cannot leave stale Activity History state. Review the complete logical ID-G diff from f3c28ba257e80fabb532979969ddd27cab0959db only as necessary to assess those repaired paths and evidence.
OUT_OF_SCOPE: Any write by Luna; a new Activity History plan audit or plan rewrite; any source, test, migration, canonical-current-chain, provider, private-source, shared/provider D1, candidate-freeze, Playground, Production, deployment, recovery, branch-cleanup, or v0.8.4 action. Canonical integration remains forbidden in this review step.
IMPLEMENTATION_OWNED_PATHS: migrations/0032_staff_account_activity_history.sql;src/server/d1/identity-foundation-repository.js;src/server/access/service.js;src/server/d1/access-management-repository.js;src/server/account-application/service.js;src/server/d1/account-application-repository.js;src/server/identity-foundation/staff-account-activity-history-service.js;src/worker/index.js;src/services/http-api-adapter.js;src/services/rest-service.js;src/v5/integration/runtime.js;src/v5/integration/view-models.js;src/v5/src/surfaces/admin.js;src/v5/integration/admin-parity.js;tests/unit/staff-account-activity-history-service.test.js;tests/unit/identity-foundation-migration.test.js;tests/unit/account-application-migration-integration.test.js;tests/unit/identity-foundation-gate-a-fixture.test.js;tests/unit/v072-migration-contract.test.js;tests/unit/access-management-repository.test.js;tests/unit/account-application-service.test.js;tests/unit/account-application-repository.test.js;tests/unit/identity-foundation-worker-route-contract.test.js;tests/e2e/v5-current-application-fixtures.js;tests/e2e/v5-current-application.spec.js;tests/cloudflare-e2e/local-worker.spec.js
ID_G_IMPLEMENTATION_IDENTITY: IMPLEMENTATION=2aa73aeaf965d4eb55449e87c3cbda675730ba97;REPAIR_CURRENT=c13bbdadf7fa46829a3a78dece66f08bfe111013;REPAIR_TREE=9fd68d4e8c4b4d19e9e23793834365d35467b499;OWNED_PATHS=26;OUTSIDE_SCOPE=0
ID_G_PRIOR_REVIEW: LUNA_ACCEPT_WITH_REQUIRED_REPAIRS;P1_REQUIRED_REAL_MINIFLARE_PRODUCER_EXECUTION_AND_V5_NAVIGATION_RACE;REPAIR_COMPLETE
ID_G_REPAIR_PATHS: src/v5/integration/runtime.js;tests/e2e/v5-current-application.spec.js;tests/unit/access-management-repository.test.js
ID_G_FOCUSED_EVIDENCE: PORTABLE_NODE=22.23.2;REAL_MINIFLARE_PRODUCER_SAFETY=PASS_1_FILE;ACCESS_MANAGEMENT_REPOSITORY=PASS_14_OF_14;RELATED_UNITS=PASS_55_OF_55;V5_STAFF_DIRECTORY=PASS_5_OF_5;LOCAL_WORKER_DTO_AND_400=PASS_1_OF_1;NODE_SYNTAX_ESLINT_PRETTIER_PRIVACY_SCOPE_DIFF=PASS
ID_MAPPING: ID-A=auth/session/security preservation;ID-B=canonical person and assignment domain;ID-C=email/provenance and explicit account linkage;ID-D=existing active-access preservation;ID-E=two-stage approval;ID-F=Staff Directory;ID-G=staff/account operational activity history;ID-H=secure eight-digit verification lifecycle.
ID_D_RECONCILIATION: PASS;UNCHANGED_ACTIVE_ACCESS_AND_NO_INFERRED_PRIVILEGE_EVIDENCE;SOURCE_RECONCILIATION_PLAYGROUND_GATE=PENDING;HISTORICAL_ID_D_ZERO_NOT_ACTIVE
PRODUCT_MATRIX: ID_A=VERIFIED_NO_OP;ID_B=PASS;ID_C=PASS;ID_D=PASS;ID_E=VERIFIED_NO_OP;ID_F=PASS;ID_G=ACTIVE_REMAINING_UNTIL_VERIFIED_CANONICAL_INTEGRATION;ID_H=REMAINING;PASSWORD_VISIBILITY=PASS;PASSWORD_BROWSER_EVIDENCE=PASS
MIGRATION_DECISIONS: 0031=REQUIRED_IF_TARGET_SCHEMA_REMAINS_30;0032=REQUIRED_BECAUSE_ACCEPTED_ID_G_INCLUDES_IT;ORDER=0031_THEN_0032;PROVIDER_EXECUTION=STAGE_GATED
VERIFICATION: Confirm isolated branch/head/tree/26-path scope, examine actual tests and their real Miniflare/D1 execution, inspect the V5 race regression, review protected-field/privacy and full logical diff, and report P0/P1/P2/P3 disposition. Reuse the already-green Node 22.23.2 focused evidence unless the review proves it invalid.
STOP_CONDITIONS: Conflicting identity or writer; uncommitted/out-of-scope path; material accepted-spec contradiction; P0/P1 security/privacy/migration/data-integrity regression; private-data exposure; provider crossover; or any action beyond read-only review.
NEXT_ACTION_SCOPE: V83_STAFF_ACCOUNT_ACTIVITY_HISTORY_FOCUSED_LUNA_REVIEW
NEXT_EXACT_ACTION: Run ONE focused Luna re-review of the invalidated three-path ID-G repair, including P1 real-Miniflare producer execution evidence and the V5 navigation race, then stop for the audit disposition before canonical integration.

## A7-R2 continuity facts

A7-R2 is controlling execution authority, adopted under Earl's explicit current instruction at 2026-08-20T23:33:37+08:00. It prohibits reopening accepted Activity History plan audits. This one re-review is allowed by A7-R2 because the prior Luna implementation review named the P1 repaired at c13bbdadf7fa46829a3a78dece66f08bfe111013. No routine owner pause is requested until the later Playground manual-test and explicit Production-GO gate. No v0.8.4 work is allowed in this session.
