# HAU-USC Logistics — FI-03 Sign-In, Verification, Account Application, and Application Status

**SLICE:** FI-03  
**STATUS:** ACCEPTED  
**OWNER:** Earl  
**ACCEPTED:** 2026-08-21 Asia/Manila — durable transcription of the owner task at `C:\Users\adria\.codex\attachments\0ce47ec8-78f9-4d30-889c-7c6b20a8fafe\pasted-text.txt`  
**TARGET:** `frontend-design-integration`  
**WRITER:** `TERRA_HIGH:/root/fi03_integration_writer`

**ACCEPTED AMENDMENTS:** FI-LIVE-PREVIEW-01/02; FI-03 bounded
auth/application result projection (2026-08-22 Asia/Manila); FI-02
contract-projection clarification.

## INTENT

```text
INTENT: SOFTWARE_FEATURE; FRONTEND_INTEGRATION; AUTHENTICATION_UI; ACCOUNT_APPLICATION_UI; ACCESSIBILITY
MODE: EXECUTE
TARGET: sign-in, email verification, account application, application status, and directly coupled supported activation/recovery presentation
AUTHORITY: owner task -> canonical/project governance -> FI-02 PASS handoff -> this accepted spec -> frozen v0.8.3 functional contracts -> DESIGN_BASELINE_2026-08-20-F + Figma Make v39 accepted Git mirror
RISK: HIGH
DELIVERABLE: FI03_STATUS PASS; one coherent normal commit/push/readback; READY_FOR_FI04
STOP: any security/contract/backend/auth/session/CSRF/provider/registration/migration/dependency/Production boundary or verification failure
```

## Scope and authority

The functional authority is the current accepted v0.8.3 authentication and account-application contract. Backend/security behavior wins over visual reference. The visual authority is FI-01 foundation plus DESIGN_BASELINE_2026-08-20-F and Figma Make v39 from the accepted Git mirror. On 2026-08-22 Asia/Manila, authenticated Figma MCP returned reauthentication-required for the exact Design/Make context; `FIGMA_MCP: BLOCKED_REAUTHENTICATION; WEB_FETCH: NOT_USED; FALLBACK: REPOSITORY_PRESERVED_EXPORTS`. No live-Figma retry loop or Figma write is authorized.

Owned product scope is `src/v5/src/surfaces/public.js` for `signin`, `verify`, `application`, `applicationStatus`, and only directly coupled supported activation/recovery presentation. The execution plan's historical `src/styles/visual/auth.css` path must be resolved against the live project; if an accepted existing live auth stylesheet is used, record the path and justification before editing. Directly coupled frontend tests, canonical generated build outputs, and the required current-chain/receipt/continuation/changelog records are owned.

**Resolved stylesheet:** `src/v5/styles/surfaces.css` is the live V5 stylesheet
loaded by `src/index.html`; it already owns `.auth-card` and the public-shell
layout. `src/styles/visual/auth.css` is historical and not imported by the V5
entry, so FI-03 styling changes, if required, stay in `surfaces.css`.

Excluded: `src/server/auth/**`, `src/server/account-application/**`, `src/auth/http-contract.js`, all `src/v5/integration/**` except the exact accepted result-projection amendment, `src/worker/**`, `src/server/**`, `src/services/**`, `src/domain/**`, migrations, Apps Script, wrangler/bindings, dependencies, provider/configuration/secrets/permissions, Figma writes, Playground deployment/writes, Production, main merge, rebase/reset/clean/force-push/history rewrite. `public.register` remains unsupported.

Contract Realization Gate: `public.signin=REALIZED`,
`public.verify/public.application/public.application-status=RESPONSE_DISCARDED`,
and static status is `STATIC_FALLBACK_CONFLICT`. Only `admin-parity.js`
`publicPanels()`, `afterRender()`, and `onSubmit()` for those three routes are
conditionally authorized; `runtime.js` `afterRender()` is conditional on proof.
`dispatch()` and all contracts remain frozen.

The first live FI-03 checkpoint proved the prior `runtime.js` application-status
`afterRender()` fallback overwrote owned, truthful status guidance. Its exact
static-summary/timeline block is therefore removed under the accepted amendment;
the route-local protected-token controller remains the sole status presentation.

## Preserved functional and security contracts

- Preserve only `AUTH_STATE = SIGNED_OUT | ACTIVATION_REQUIRED | AUTHENTICATED`; no client-invented fourth state.
- Preserve secure session-cookie behavior, credential-version revocation, expiry, login semantics, CSRF transport owned by existing `backend.js`, and rate limits.
- Preserve generic authentication failure semantics; never disclose account existence, lock, pending, or identity details beyond the live contract.
- Reuse shared password visibility without changing value, name, selection, autocomplete, validation, payload, or password-manager behavior.
- Treat verification code as text: exactly eight decimal digits, leading zero retained, paste/keyboard/autocomplete/accessibility supported, never logged or put in a URL. Server remains authoritative for single use, expiry, resend invalidation, and attempt/rate limits.
- Keep lifecycle explicit: email verification -> application -> administrator review -> separate Director approval -> activation -> sign-in/workspace. Verification never implies approval or activation.
- Render only fields, status vocabulary, withdrawal behavior, tokens, validation, and error semantics supplied by the live account-application contract. Do not expose private review notes, roster data, raw enums, provider/database/audit internals, or invented approval state.

## Required presentation states

Sign-in: idle, submitting, real routing success, generic auth failure, validation error, rate limited, session error, unavailable. Verification: code entry, verifying, invalid/expired/rate-limited, resend available/resending/success/failure, verified/continue. Application and status: live supported loading/populated/success/error/validation/unavailable states plus authorized withdrawal confirmation only.

Use FI-01 semantic tokens, real labels, semantic heading/form structure, aria-live/error association, visible focus, reduced motion, light/dark themes, and responsive behavior at 320/390/768/1024/1440 plus 200% zoom. No overflow, clipped content, inaccessible password toggle, or unusable verification input may remain.

## Preview and verification

Use exactly one guarded private-manifest preview at `http://127.0.0.1:4173`, only after the lock is active. FI-LIVE-PREVIEW-02 is adopted in-place: retain the healthy loopback-only current-worktree preview through FI-03 closeout for FI-04 reuse; use HMR and do not record private manifest material. Verify the isolated Playground proxy and no Production crossover before recording PASS. No real provider send, account mutation, or Production crossover is authorized for visual inspection.

Use targeted source/tests while editing; final evidence includes governance/handoff validation, scoped lint/format, focused public/auth/account-application/password-visibility/current-app/backend-integration tests, build, `verify:dist`, complete diff and prohibited-path counters, and the scoped browser checkpoints: (1) sign-in/verification structure, (2) application/status structure, (3) responsive/accessibility, (4) final acceptance. Run broader `npm run check` once only if repository FI-03 closeout policy requires it after source stabilizes.

## Rollback and handoff

Rollback is a normal Git revert of the one FI-03 commit; no external mutation is permitted. Before transfer update `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`, receipt/status/continuation/changelog records, run `npm.cmd run handoff:verify`, push and read back exact remote SHA/tree, then set `ACTIVE_WRITER: NONE`, `WRITER_LOCK: RELEASED`, and `HANDOFF_STATUS: READY_FOR_FI04`. Stop after FI-03.
