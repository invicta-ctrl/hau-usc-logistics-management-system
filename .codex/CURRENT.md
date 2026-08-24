# Current Work Pointer — frontend-design-integration

PROGRAM: HAU-USC Logistics FI-04 → FI-17 R1
MILESTONE: R3_A1_A2_FOUNDATION_PLUS_A3_PERSISTENT_LOCAL_PREVIEW
STATUS: FI04_SOL_ACCEPTED_CHECKPOINT_READY
PHASE: FI04_AUTHENTICATED_SHELL
BRANCH: frontend-design-integration
HEAD: GIT_HEAD
UPSTREAM: origin/frontend-design-integration
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
WORKTREE_STATE: GIT_STATUS
POST_CHECKPOINT_WORKTREE: OWNED_FI04_DIFF_PRESENT__PREEXISTING_UNTRACKED_AIBRIDGE_EXCLUDED_AND_PRESERVED
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
HANDOFF_STATUS: FI04_SOL_ACCEPTED_CHECKPOINT_READY
REQUIRED_MODEL: GPT-5.6-Terra integration writer
CURRENT_TASK: .codex/CURRENT_TASK.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-24-fi04-fi17-r1-a3-persistent-local-live-preview-4173-visual-fix-gate.md
ACCEPTED_AMENDMENTS: R1 one-shot; R1-A2 reconciliation; accepted A3 persistent local live-preview gate
R3A1A2_RECEIPT: .codex/R3_A1_A2_ROUTING_IDENTITY_RECEIPT.md
F2_BASELINE: .codex/FRONTEND_F2_R3A1A2.md
A3_PREVIEW_RECEIPT: .codex/A3_LOCAL_PREVIEW_RECEIPT.md
FI04_RECEIPT: .codex/FI04_AUTHENTICATED_SHELL_RECEIPT.md
BLOCKER: NONE — Sol accepted FI-04; the single checkpoint is staged only after final governance and must stop before FI-05 implementation
NEXT_EXACT_ACTION: Perform the bounded FI-05 intake and repository handshake only; do not begin FI-05 implementation without a newly acquired writer lock and accepted authority.

## Completed FI-04 slice

The authorized authenticated `AuthRoute` now mounts the capability-filtered shell. FI-05+ internal routes are explicitly truthful placeholders within that shell; no fixture business module was mounted. The read-only Profile route uses the strict same-origin `/api/me/profile` contract adapter with loading, incomplete/empty, error/retry, dark, and mobile states. The generic staff-home resolver deliberately excludes personal-only Profile so an account with no workspace capabilities stays denied even though authenticated Profile remains directly reachable.

Sol-requested formatting closeout ran local Prettier only on `entryIntent.ts`, `AuthShellTopbar.tsx`, `SidebarNavItem.tsx`, and `frontend-entry-intent.test.js`. The targeted FI-04 Prettier check passed, behavior-focused source/artifact identity remained unchanged, and the lock was released again.

Sol accepted the complete FI-04 logical diff. Root independent evidence confirms targeted Prettier cleanliness; adapter/entry units 34/34; focused AUTH-01 5/5; deterministic dist verification at SHA-256 `A07FCE9DF042C7244A7B1CCCC32F88573E47433BBDAAECA05B233797454BB1C6`; governance/handoff/diff checks; and runtime-identity diff scan clean. TypeScript source lint is not configured and standalone `tsc --noEmit` is unavailable; the Vite build passed.

Desktop has the Design-verified 76px compact rail at 1024 and 272px full rail at 1440. The full rail uses governed USC and DOL marks; its command band is paper/cream in light mode under the truthful maroon environment strip, with search/theme at compact desktop and a filled light-mode Navigate control. Mobile preserves the truthful compact identity, capability-filtered dock/drawer, drawer focus trapping/Escape/body-lock/opener restoration, and the existing public-drawer focus repair without changing public routing semantics.

## A3 local-preview and visual evidence

The accepted repository-owned supervisor remained healthy at `http://127.0.0.1:4173/`; it was reused and never restarted by FI-04. Root observed the required source-save HMR gate and all subsequent material shell/profile saves: each existing 4173 tab stayed mounted with no Vite overlay or module failure. Safe local Playwright mocks intercepted all business API access and did not mutate business data. Current captures are outside Git at `C:/Users/adria/AppData/Local/Temp/fi04-visual-20260824/`; 320, 390, 1024, and 1440 surfaces were within viewport and console warning/error count was zero. Runtime-only supervisor identity remains excluded.

## Boundaries and review frontier

No Figma or Make write, backend/auth/capability semantic change, Profile PATCH, business-data write, Playground/Production/provider mutation, deployment, migration, D1/R2 mutation, commit, or push occurred. The preexisting untracked `.ai-bridge/` remains untouched. Sol must review the complete dirty logical diff, including deterministic generated frontend artifacts, before any commit decision.
