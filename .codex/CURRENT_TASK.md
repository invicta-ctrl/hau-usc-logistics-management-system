# Current Bounded Task — FI-03 Sign-In, Verification, Application, and Application Status

INTENT: SOFTWARE_FEATURE; FRONTEND_INTEGRATION; AUTHENTICATION_UI; ACCOUNT_APPLICATION_UI; ACCESSIBILITY
MODE: COMPLETE
OBJECTIVE: Implement FI-03 frontend presentation only on frozen v0.8.3 behavior: real sign-in, email verification, account application, application status, and directly coupled supported activation/recovery presentation.
TARGET: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration at starting SHA 095fa2531d7cd898a57032573acc7809e0cd7b9d / tree a1b1bf9bd56aae666eec469a0dd78003e4e4829c.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/frontend-integration-fi03-auth-application-shell.md
AUTHORITY: Earl FI-03 task -> FI-LIVE-PREVIEW-02 persistent-preview amendment -> canonical/project governance -> FI-02 PASS receipt/handoff -> accepted FI-03 spec -> FI-LIVE-PREVIEW-01/02 -> frozen v0.8.3 auth/application contracts -> DESIGN_BASELINE_2026-08-20-F/Figma Make v39 accepted Git mirror.
RISK: HIGH; auth/security-adjacent UI.
SCOPE: public.js signin/verify/application/applicationStatus and directly coupled supported activation/recovery; live accepted auth stylesheet after path proof; direct frontend tests/generated build outputs; current-chain/receipt/continuation/changelog closeout records.
OUT_OF_SCOPE: all backend/auth/session/CSRF/rate-limit/verification/approval/provider behavior and src/server/auth/**, src/server/account-application/**, src/auth/http-contract.js, all src/v5/integration/** except the accepted FI-03 `admin-parity.js` publicPanels/afterRender/onSubmit result projection and proven `runtime.js` afterRender static-fallback removal; worker/server/services/domain/migrations/apps-script/wrangler/dependencies/Cloudflare/D1/R2/Google/secrets/permissions; public.register; Figma/Playground/Production writes/deploy; main merge/rebase/reset/clean/force-push/history rewrite.
DELIVERABLE: FI03_STATUS PASS; real accessible responsive UI preserving current contracts; zero mock Production behavior, backend/auth-contract/migration/dependency/provider/Production changes; one coherent commit/push/readback; READY_FOR_FI04.
VERIFICATION: scoped governance/lint/format; targeted auth/account-application/password-visibility/public-current-app/backend-integration tests; build and verify:dist; four bounded browser milestones over guarded loopback preview at 320/390/768/1024/1440, 200% zoom, keyboard/focus/reduced-motion/light/dark/no overflow; full check only once if required by repository closeout policy.
STOP_CONDITIONS: branch/upstream/dirty/lock/predecessor conflict; missing/contradictory authority; any required excluded-path, security, privacy/enumeration, provider, real mutation, Production, registration, migration/dependency, or verification change/failure.

REQUIRED_MODEL: TERRA_INTEGRATION_WRITER
ORCHESTRATOR_MODEL: GPT-5.6 SOL; ORCHESTRATOR_WRITES: FORBIDDEN
ACTIVE_WRITER: NONE
TERRA_WRITER: NONE
WRITER_LOCK: RELEASED
LOCK_STATUS: RELEASED
HANDOFF_STATUS: READY_FOR_FI04
STATUS: FI03_STATUS_PASS
GIT_UPSTREAM: origin/frontend-design-integration@095fa2531d7cd898a57032573acc7809e0cd7b9d;NORMAL_FI02_PUSH_READBACK_0_0
FI02_END_SHA: 095fa2531d7cd898a57032573acc7809e0cd7b9d
FI02_SCOPE_AUDIT: PASS; only explicit FI-02 advertisement presentation exception in runtime.js/registry.js; no unauthorized backend/auth/migration diff.
VISUAL_BASELINE: DESIGN_BASELINE_2026-08-20-F + FIGMA_MAKE_V39; FIGMA_MCP: BLOCKED_REAUTHENTICATION; WEB_FETCH: NOT_USED; FALLBACK: REPOSITORY_PRESERVED_EXPORTS.
FUNCTIONAL_BASELINE: CURRENT_FROZEN_V083_MAIN; backend/API/auth/data contracts win.
ACCEPTED_AMENDMENT: FI-LIVE-PREVIEW-01/02; FI03 bounded result projection (OWNER_ACCEPTED_2026-08-22); FI02 contract-projection correction.
LOCAL_PREVIEW: RUNNING_PERSISTENT
LOCAL_PREVIEW_URL: http://127.0.0.1:4173
LOCAL_PREVIEW_HOST: 127.0.0.1
LOCAL_PREVIEW_PORT: 4173
LOCAL_PREVIEW_WORKTREE: frontend-design-integration worktree
LOCAL_PREVIEW_MODE: GUARDED_PLAYGROUND_PROXY
PLAYGROUND_PROXY_VERIFIED: PASS
PREVIEW_PRODUCTION_CROSSOVER: NONE
PREVIEW_REUSED_OR_RESTARTED: RESTARTED_AFTER_SAFE_STARTUP_ARGUMENT_REPAIR
PREVIEW_TEMPORARILY_PAUSED_FOR_TEST: NO
PREVIEW_HMR_STATUS: HEALTHY
PREVIEW_BACKEND_WRITES: 0
VISUAL_CHECKPOINTS_PERFORMED: 4
PREVIEW_STOPPED_AT_HANDOFF: NO

## Delegation ledger

| Agent ID                        | Model         | Role                     | Mode    | Scope      | Worktree                                       | Owned paths                                                         | Excluded paths              | Status |
| ------------------------------- | ------------- | ------------------------ | ------- | ---------- | ---------------------------------------------- | ------------------------------------------------------------------- | --------------------------- | ------ |
| `/root/fi03_integration_writer` | gpt-5.6-terra | TERRA_INTEGRATION_WRITER | execute | FI-03 only | canonical frontend-design-integration worktree | FI-03 records, owned frontend surface/style, direct tests/artifacts | all listed FI-03 exclusions | ACTIVE |

CONTRACT_REALIZATION_GATE: signin=REALIZED; verify/application/application-status=RESPONSE_DISCARDED; static-status=STATIC_FALLBACK_CONFLICT; unsupported backend contracts=NONE.
CONDITIONAL_PROJECTION_SCOPE: admin-parity publicPanels/afterRender/onSubmit for FI03 public verify/application/status; runtime afterRender only if fallback conflict requires it; dispatch/backend/security frozen.
BLOCKER: FALSE; owner amendment accepted and persisted.
NEXT_EXACT_ACTION: FI-04_AUTHENTICATED_SHELL_NAVIGATION_PROFILE after accepted handoff.
