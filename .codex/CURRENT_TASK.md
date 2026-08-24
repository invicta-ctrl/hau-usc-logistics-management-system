# Current Bounded Task — FI-04 Authenticated Shell review handoff

INTENT: FRONTEND_INTEGRATION
MODE: REVIEW_HANDOFF
OBJECTIVE: Deliver the bounded FI-04 Authenticated Shell, capability-filtered navigation, read-only Profile route, responsive Design-aligned shell, and focus restoration slice for read-only Sol review; do not advance to FI-05 or commit/push.
TARGET: `src/frontend/` FI-04 shell/profile/focus surfaces, strict profile adapter, direct focused tests, deterministic frontend artifacts, and continuity records only.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-24-fi04-fi17-r1-a3-persistent-local-live-preview-4173-visual-fix-gate.md
AUTHORITY: Earl current instruction → R1 one-shot program and R1-A2 reconciliation → accepted A3 gate → R3-A1-A2 accepted routing/identity foundation → current repository contracts → F2-recorded live Figma Design/Make roles.
REQUIRED_MODEL: GPT-5.6-Terra integration writer
TASK_STATUS: SOL_ACCEPTED_CHECKPOINT_READY
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
RISK: MEDIUM
SCOPE: Completed only the FI-04-owned authenticated shell/profile/focus slice: server-projected capability navigation; truthful FI-05+ placeholders; strict read-only `/api/me/profile`; generic-home denial for zero workspace capabilities; Design-aligned 76px/272px rails and responsive command band; controlled mobile/public drawer focus repair; coupled unit/E2E coverage and deterministic artifacts.
OUT_OF_SCOPE: FI-05 through FI-17 business modules; backend B1/auth/capability/data semantics; Profile PATCH; Figma/provider writes; Playground business-data writes; Production/main/deployment/migration/D1/R2 writes; `.ai-bridge/`; history rewrite/reset/clean/force-push; commit or push.
VERIFICATION: Root observed all material source-save HMR transitions in the healthy existing 4173 preview. Focused adapter/entry tests passed 34/34; full focused routing suite passed 97 with 3 intended mobile-only skips; post-final shell AUTH-01 passed 5/5; focused legacy cutover assertions passed; safe-mock captures at 320/390/1024/1440 had no overflow and zero console warnings/errors; deterministic build and `verify:dist` passed with identical artifact SHA-256 `A07FCE9DF042C7244A7B1CCCC32F88573E47433BBDAAECA05B233797454BB1C6`. Sol-requested local Prettier subsequently passed on all FI-04 source/test/docs after writing only `entryIntent.ts`, `AuthShellTopbar.tsx`, `SidebarNavItem.tsx`, and `frontend-entry-intent.test.js`; 34/34 units and the same deterministic artifact SHA passed again, so no behavior E2E rerun was needed.
STOP_CONDITIONS: Do not create a second commit, amend, broaden scope, deploy, merge, touch main, or start FI-05 implementation. Stop for a conflicting writer, unexpected tracked dirt, provider/runtime secret risk, failed governance check, or failed remote parity.
NEXT_EXACT_ACTION: Perform the bounded FI-05 intake and repository handshake only; do not begin FI-05 implementation without a newly acquired writer lock and accepted authority.

## Completed implementation evidence

See `.codex/FI04_AUTHENTICATED_SHELL_RECEIPT.md` for exact Design/Make read-only resources, source/test ownership, current temporary screenshot paths, HMR evidence, and commands. The Figma connector needed reauthentication for one final narrow read; that limitation was recorded and the implementation proceeded only from Root’s already-verified exact node evidence and the frozen F2 source, without repeated retrieval or any provider mutation.

## Sol acceptance

Sol accepted the complete FI-04 diff for the authorized single checkpoint. Root independently confirmed targeted Prettier cleanliness, adapter/entry units 34/34, focused AUTH-01 5/5, deterministic artifact verification at SHA-256 `A07FCE9DF042C7244A7B1CCCC32F88573E47433BBDAAECA05B233797454BB1C6`, governance/handoff/diff success, and a clean runtime-identity diff scan. TypeScript source lint is not configured; standalone `tsc --noEmit` is unavailable; Vite build passed.
