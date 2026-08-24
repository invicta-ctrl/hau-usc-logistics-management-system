# Current Work Pointer — frontend-design-integration

PROGRAM: HAU-USC Logistics FI-04 → FI-17 R1
MILESTONE: R3_A1_A2_FOUNDATION_PLUS_A3_PERSISTENT_LOCAL_PREVIEW
STATUS: A3_PREVIEW_GATE_COMPLETE__FI04_NOT_STARTED
PHASE: PRE_FI04_F2_FROZEN
BRANCH: frontend-design-integration
HEAD: GIT_HEAD
UPSTREAM: origin/frontend-design-integration
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
WORKTREE_STATE: GIT_STATUS
POST_CHECKPOINT_WORKTREE: TRACKED_CLEAN_AT_A3_CHECKPOINT__UNTRACKED_AIBRIDGE_EXCLUDED_AND_PRESERVED
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
HANDOFF_STATUS: READY_FOR_SOL_REVIEW_AND_FI04_HANDOFF
REQUIRED_MODEL: GPT-5.6-Terra integration writer for the next product slice
CURRENT_TASK: .codex/CURRENT_TASK.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-24-fi04-fi17-r1-a3-persistent-local-live-preview-4173-visual-fix-gate.md
ACCEPTED_AMENDMENTS: R1 one-shot; R1-A2 reconciliation; accepted A3 persistent local live-preview gate
R3A1A2_RECEIPT: .codex/R3_A1_A2_ROUTING_IDENTITY_RECEIPT.md
F2_BASELINE: .codex/FRONTEND_F2_R3A1A2.md
A3_PREVIEW_RECEIPT: .codex/A3_LOCAL_PREVIEW_RECEIPT.md
BLOCKER: NONE — bounded FI-04 may begin after Sol review and a new writer-lock acquisition
NEXT_EXACT_ACTION: Acquire a new single Terra writer lock and implement the bounded FI-04 Authenticated Shell slice, then perform edit-to-HMR browser inspection at http://127.0.0.1:4173/ before advancement.

## Current authority and scope

The owner adopted A3 on 2026-08-24. It supplements, and does not replace, the FI-04→FI-17 R1 program and R1-A2 reconciliation. R3-A1-A2 remains the verified functional/routing foundation. The three contexts are preserved: public Lending needs no staff sign-in; External Request Center requires an eligible authenticated USC staff/officer; Main Logistics Hub is DOL/internal and capability-gated.

F2 freezes the live Figma Design and Make identities, node manifest, Make Version 44 / zero-pending state, preserved export identity, exact source anchors, and the rule that live repository contracts win for functional/security truth. F2 is a read-only baseline, not a provider-write authority.

## A3 local-preview state

The repository accepted supervisor is running and healthy at `http://127.0.0.1:4173/`. It is the persistent owner-facing local preview and not a deployment. Its guarded proxy remains isolated-Playground-only where authorized; Production fallback is forbidden and Production crossover remains zero. Runtime-only process identity, PIDs, owner token, control channel, manifest identity, health timestamp, and restart details remain exclusively in the existing untracked state mechanism and are not recorded here.

The A3 visual gate passed for landing, public Lending, the signed-out Start logistics request auth gate, Home, responsive widths 320/390/768/1024/1440, and zero browser warnings/errors. The supervisor-focused test passed 53/53 and Vite HMR transport is ready. Since this checkpoint changed no product source, the first FI-04 source edit must prove the actual edit-to-HMR-to-browser-inspection loop before FI-04 advances.

## Boundaries and next frontier

`FI04_IMPLEMENTATION` is not started. Existing internal components/design frames are not runnable/implementation-verified merely because they exist. The next bounded product task is FI-04 Authenticated Shell: capability-driven desktop/mobile shell, navigation, workspace frame, profile/account controls, sign-out affordance, responsive/focus behavior, and exact Figma intake. It must preserve server authority and must not invent backend, identity, or authorization semantics.

No product source, tests, scripts, package/config, Figma, backend branch, Playground business data, Production, D1/R2, deployment, migration, or main was changed by this A3 checkpoint. Do not touch the existing untracked `.ai-bridge/` directory.
