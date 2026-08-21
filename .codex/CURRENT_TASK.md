# Current Task — V0.8.3 Isolated Playground Migration 0031 and Reconciliation

INTENT: ISOLATED_PLAYGROUND_MIGRATION
MODE: EXECUTE
OBJECTIVE: Preserve the frozen v0.8.3 candidate and its verified isolated Playground deployment, retain the owner-authorized reset-reconciled CLEAN working state, then apply only migration 0031 to the isolated Playground D1 and reconcile it before any 0032 action.
TARGET: Frozen candidate f8e63372bc8afcb6d092970b7f9fc9ee72fd3580, tree 5788251d483f23ec5e19048e1a946b3a00450436, deployed to the isolated Playground at reset-reconciled schema 30 / migration 0030.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md
CONTROLLING_AMENDMENT: .codex/specs/active/v0.8.3-v1r7-a7-r2-final-acceleration-s17-closure-amendment.md#18-isolated-playground-release
AUTHORITY: Earl explicit current instruction -> V1R7-A7-R2 -> accepted v0.8.3 A5 specification -> checked-in AGENTS.md -> current continuity chain.
REQUIRED_MODEL: Terra MAX canonical writer; the accepted ID-H Luna implementation review is complete and this task must not reopen an audit loop.
ACTIVE_WRITER: TERRA_MAX:/root/v83_completion_terra_writer
TERRA_WRITER: TERRA_MAX:/root/v83_completion_terra_writer
LOCK_HOLDER: TERRA_MAX:/root/v83_completion_terra_writer
WRITER_LOCK: HELD
LOCK_STATUS: ACTIVE
BRANCH: GIT_BRANCH
HEAD: GIT_HEAD
UPSTREAM: origin/release/v0.8.3-identity-foundation@GIT_HEAD;PUSH_PARITY_REQUIRED
WORKTREE: D:/Documents/Codex/_verification/v83-final-gate-f8e6337
WORKTREE_STATE: GIT_STATUS
RISK: HIGH;FROZEN_CANDIDATE_IDENTITY_REMOTE_D1_MIGRATION_RECOVERY_PRIVACY_AND_EXTERNAL_GATE_BOUNDARY
SCOPE: A7-R2 Section 18 only: the exact owner-authorized Playground reset is complete and terminally reconciled; recheck redacted recovery, exact f8 runtime/binding identity, and the remote 0030 ledger immediately before mutation; apply only 0031 to the isolated Playground D1; then prove its ledger, schema, foreign keys, canonical-identity invariants, and Production non-crossover. Record sanitized durable evidence before considering 0032.
OUT_OF_SCOPE: Any source, dependency, build, workflow, or repository-runtime-config edit; Production read/write/migration/deploy; recovery-pointer rotation; fabricated backfill; provider values, recipient disclosure, or email send; source-projection probe; browser/manual acceptance; branch cleanup; AGENTS/project-policy sync; any new ID-G/ID-H audit loop; or v0.8.4 work.
ID_G_INTEGRATION_SCOPE: HISTORICAL_ACCEPTED_26_PATHS;OUTSIDE_AUTHORIZED_PATHS=0;THE_ID_G_TASK_WORKTREE_REMAINS_PRESERVED
ID_G_IMPLEMENTATION_IDENTITY: IMPLEMENTATION=2aa73aeaf965d4eb55449e87c3cbda675730ba97;REPAIR_CURRENT=c13bbdadf7fa46829a3a78dece66f08bfe111013;REPAIR_TREE=9fd68d4e8c4b4d19e9e23793834365d35467b499;MERGE=45bbc1caf661d64a1abfdf1f775878ec89d88853;MERGE_TREE=4baebecc466b258d1b3729cff376bfafb2640ef6;OWNED_PATHS=26;CANONICAL_FAST_FORWARD=PASS
ID_G_PRIOR_REVIEW: LUNA_ACCEPT_WITH_REQUIRED_REPAIRS;P1_REQUIRED_REAL_MINIFLARE_PRODUCER_EXECUTION_AND_V5_NAVIGATION_RACE;REPAIR_COMPLETE;FOCUSED_LUNA_REREVIEW=ACCEPT;P0=0;P1=0;P2=0
ID_G_MERGE_PARITY: PRODUCT_26_BLOBS_TO_C13=PASS;A7_ADOPTION_7_BLOBS_TO_0D=PASS;MERGE_PARENTS=c13bbdadf7fa46829a3a78dece66f08bfe111013,0d784ba348a82101b7c7e6a794b7a35f0ab82452
ID_G_FOCUSED_EVIDENCE: PORTABLE_NODE=22.23.2;REAL_MINIFLARE_PRODUCER_SAFETY=PASS_1_FILE;ACCESS_MANAGEMENT_REPOSITORY=PASS_14_OF_14;RELATED_UNITS=PASS_55_OF_55;V5_STAFF_DIRECTORY=PASS_5_OF_5;LOCAL_WORKER_DTO_AND_400=PASS_1_OF_1;NODE_SYNTAX_ESLINT_PRETTIER_PRIVACY_SCOPE_DIFF=PASS
ID_H_INTEGRATION: PASS;IMPLEMENTATION_AND_CANONICAL_COMMIT=fb93da76cbf71ec0419036d86c0b780b18bfeff4;TREE=0947c934bd40a9bb8d4fe8bbae99e09e13f235df;TASK_BRANCH=release/v0.8.3-eight-digit-verification;OWNED_PATHS=9;CANONICAL_FAST_FORWARD=PASS
ID_H_FOCUSED_EVIDENCE: PORTABLE_NODE=22.23.2;UNIT_SQLITE_D1_PROVIDER_RESEND_WORKER_V5=PASS_80_OF_80;LEGACY_EIGHT_DIGIT_BROWSER=PASS_1_OF_1;V5_BROWSER=PASS_29_WITH_7_INTENTIONAL_SKIPS;SYNTAX_ESLINT_PRETTIER_PRIVACY_SCOPE_DIFF=PASS
ID_H_LUNA_REVIEW: ACCEPT;P0=0;P1=0;P2=0;P3=NONBLOCKING_UNREPAIRED_COMMITTED_HARNESS_PORT_4173_ADVISORY
ID_MAPPING: ID-A=auth/session/security preservation;ID-B=canonical person and assignment domain;ID-C=email/provenance and explicit account linkage;ID-D=existing active-access preservation;ID-E=two-stage approval;ID-F=Staff Directory;ID-G=staff/account operational activity history;ID-H=secure eight-digit verification lifecycle.
ID_D_RECONCILIATION: PASS;UNCHANGED_ACTIVE_ACCESS_AND_NO_INFERRED_PRIVILEGE_EVIDENCE;SOURCE_RECONCILIATION_PLAYGROUND_GATE=PENDING;HISTORICAL_ID_D_ZERO_NOT_ACTIVE
PRODUCT_MATRIX: ID_A=VERIFIED_NO_OP;ID_B=PASS;ID_C=PASS;ID_D=PASS;ID_E=VERIFIED_NO_OP;ID_F=PASS;ID_G=PASS;ID_H_IMPLEMENTATION=PASS;ID_H_PLAYGROUND_DELIVERY_GATE=PENDING;PASSWORD_VISIBILITY=PASS;PASSWORD_BROWSER_EVIDENCE=PASS
MIGRATION_DECISIONS: SCHEMA_TARGET=32;0031=REQUIRED_FROM_RESET_RECONCILED_PLAYGROUND_SCHEMA30;0032=SOURCE_PRESENT_AND_REQUIRED_BECAUSE_ACCEPTED_ID_G_INCLUDES_IT;ORDER=0031_THEN_0032;PLAYGROUND_RESET=PASS;PLAYGROUND_0031=AUTHORIZED_PENDING;PRODUCTION_APPLICATION=PROHIBITED
FROZEN_CANDIDATE_RECEIPT: SHA=f8e63372bc8afcb6d092970b7f9fc9ee72fd3580;TREE=5788251d483f23ec5e19048e1a946b3a00450436;PACKAGE_VERSION=0.8.3;LOCKFILE_SHA256=28c8436fa65cefacb1b7d5ac0ad95ae136af10a765e928efb53c5b23f85967cd;STAGING_APPLICATION_ARTIFACT_SHA256=60dd9c63a99d347dfa4f7a4315639cc2fb9725578bf6e194e0d84cc8f5415a99;WORKER_SOURCE_SHA256=5b37974f449b659e89ddb480a6fa09ea403c1329d303623932f38240738a44ca
PRE_MIGRATION_PLAYGROUND_RECEIPT: SECTION_16=PASS;WORKFLOW_DISPATCH=ONCE;PACKAGE_AND_DEPLOY=PASS;RUN=REDACTED_SUCCESS;RUNTIME_SHA_TREE_ARTIFACT_BINDING_ISOLATION=PASS;SCHEMA30_LEDGER0030_FOREIGN_KEYS=PASS;D1_TIME_TRAVEL_BOOKMARK_AND_WORKER_ROLLBACK_HISTORY=VERIFIED_REDACTED;PRODUCTION_MUTATION=0
PLAYGROUND_RUNTIME_IDENTITY_RECONCILIATION: PASS;GITHUB_WORKFLOW_PACKAGE_DEPLOY_ARTIFACT=PASS;WRANGLER_LATEST_DEPLOYMENT_SELECTED_BY_TIMESTAMP=PASS;DEPLOYMENT_LIST_ORDER=OLDEST_FIRST;SAFE_ENDPOINTS=EXACT_F8;NO_RUNTIME_MUTATION
PLAYGROUND_RESET_RECEIPT: PASS;OWNER_AUTHORIZATION=RESET_PLAYGROUND;PRE_RESET_RECOVERY=CAPTURED_PRIVATE;WORKING_STATE=CLEAN;SCHEMA30_LEDGER0030_FOREIGN_KEYS=PASS;RESET_PROBE=ABSENT;R2_BASELINE_WORKING_IDENTITY_AND_EMPTY_WORKING_EVIDENCE=PASS;EXACT_F8_RUNTIME_BINDING_ISOLATION=PASS;PRODUCTION_MUTATION=0
PRIVACY_INCIDENT: METADATA_ONLY_LOCAL_FILENAMES_NO_CONTENT_NO_MUTATION;RECONCILED_BY_ROOT;NO_FILENAMES_RECORDED
VERIFICATION: Reuse accepted Node 22.23.2 product evidence because f8 product blobs are unchanged. The owner-authorized reset has terminally proven CLEAN schema30/0030, foreign keys, reset-probe absence, R2 baseline parity, exact f8 runtime/bindings, and Production non-crossover. Before and after the one remote 0031 action, run only redacted recovery/identity/ledger/schema/foreign-key/invariant/reconciliation checks plus governance, handoff, continuity, scope, and diff checks; do not rerun broad suites.
STOP_CONDITIONS: Conflicting candidate, writer, account, binding, or D1 identity; missing reversible recovery evidence; any Production crossover; migration already applied with inconsistent ledger/schema; P0/P1 security/privacy/data-integrity regression; private-data exposure; unexpected source/config mutation; failed 0031 reconciliation; or any action beyond isolated Playground 0031.
NEXT_ACTION_SCOPE: V83_ISOLATED_PLAYGROUND_MIGRATION_0031_AND_RECONCILIATION
NEXT_EXACT_ACTION: V83_ISOLATED_PLAYGROUND_MIGRATION_0031_AND_RECONCILIATION — from the owner-authorized reset-reconciled CLEAN Playground state, recheck redacted recovery and remote 0030 ledger immediately before mutation; use the accepted private Playground manifest/config and standard remote D1 operator mechanism to apply only 0031 to isolated Playground D1; then prove ledger/schema/foreign keys/invariants and record sanitized evidence before 0032.

## A7-R2 continuity facts

A7-R2 is controlling execution authority, adopted under Earl's explicit current instruction at 2026-08-20T23:33:37+08:00. Section 16 passed and Section 17 froze f8/tree 5788; the authorized workflow dispatched once and completed its exact-f8 package plus pre-migration isolated Playground deployment. Source reconciliation and live ID-H delivery remain distinct later candidate-bound gates. No routine owner pause is requested until the later Playground manual-test and explicit Production-GO gate. No v0.8.4 work is allowed in this session.
