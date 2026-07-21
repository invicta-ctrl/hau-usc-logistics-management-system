# v0.6 Three-Model Execution Sequence

Use the phase specifications in this order.

Mandatory cross-phase policy:
`.codex/PHASE_AND_CONTEXT_POLICY.md`

That policy controls:
- minimal context reads;
- no broad/redundant rereads;
- one bounded milestone at a time;
- mandatory manual model-switch stops;
- Terra-to-Sol escalation stops.

## Phase 1 — SOL High

File: `v0.6-phase-1-sol-high.md`

Purpose:
- repository safety and baseline reconciliation;
- architecture/specification lock;
- authentication/onboarding;
- role/capability/security contracts.

When Phase 1 is complete:
- update `.codex/CURRENT.md` to Phase 2;
- set status `READY FOR MANUAL MODEL SWITCH`;
- next model: `GPT-5.6 Terra`;
- print the required Phase 1 completion message;
- **stop the current task**.

Do not begin Phase 2 from the Sol task.

## Phase 2 — TERRA

File: `v0.6-phase-2-terra.md`

Purpose:
- shared UI/component shell;
- Administrator, Director, Food, Inventory & Pantry, Materials experiences;
- Request Center;
- Lending Hub;
- Release Desk and ordinary operational implementation;
- responsive design and deterministic experience previews.

Remain on Terra unless the work changes authentication/session architecture, authorization semantics, ledger/transaction invariants, security boundaries, or migration/database architecture. On an escalation trigger, follow the central policy, set `SOL ESCALATION REQUIRED`, and stop for a manual Sol High switch.

When Phase 2 is complete:
- update `.codex/CURRENT.md` to Phase 3;
- set status `READY FOR MANUAL MODEL SWITCH`;
- next model: `GPT-5.6 Sol — High`;
- print the required Phase 2 completion message;
- **stop the current task**.

Do not begin Phase 3 from the Terra task.

## Phase 3 — SOL High

File: `v0.6-phase-3-sol-high.md`

Purpose:
- integration review;
- Cloudflare/API transition;
- D1 migration;
- Drive/Sheets sidecars;
- transactional/security/performance hardening;
- full repository acceptance.

When Phase 3 repository-side acceptance is complete:
- set `.codex/CURRENT.md` to `PROGRAM COMPLETE — PRODUCTION STILL GATED`;
- print the required Phase 3 completion message;
- stop the current task before production promotion unless Earl separately authorizes that exact action.

## Context-efficiency requirement

On a fresh task, read only:

1. `AGENTS.md`
2. `.codex/CURRENT.md`
3. `.codex/PHASE_AND_CONTEXT_POLICY.md`
4. the active phase specification

Then perform the Git handshake. Read other files only when the current milestone requires a specific fact or directly relevant source/test.

Do not reread unchanged long documents or historical sections merely because a new task started.

## Continuation requirement

At each verified milestone or phase boundary:

1. update `.codex/CURRENT.md`;
2. update only the canonical status/continuation records required by the milestone;
3. record exact branch/SHA evidence;
4. record tests/checks actually run or valid evidence reused;
5. identify one next bounded action;
6. preserve rollback and stop conditions.

A chat/account change never authorizes a phase change. A completed phase always requires the manual model-switch stop defined by the central policy.