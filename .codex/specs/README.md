# v0.6 Three-Model Execution Sequence

Use the phase specifications in this order.

## Phase 1 — SOL High

File: `v0.6-phase-1-sol-high.md`

Purpose:
- repository safety and baseline reconciliation;
- architecture/specification lock;
- authentication/onboarding;
- role/capability/security contracts.

The current continuity pointer starts here.

## Phase 2 — TERRA

File: `v0.6-phase-2-terra.md`

Purpose:
- shared UI/component shell;
- Administrator, Director, Food, Inventory & Pantry, Materials experiences;
- Request Center;
- Lending Hub;
- Release Desk and ordinary operational implementation;
- responsive design and deterministic experience previews.

Remain on Terra unless the task changes authentication/session architecture, authorization semantics, ledger/transaction invariants, security boundaries, or migration/database architecture.

## Phase 3 — SOL High

File: `v0.6-phase-3-sol-high.md`

Purpose:
- integration review;
- Cloudflare/API transition;
- D1 migration;
- Drive/Sheets sidecars;
- transactional/security/performance hardening;
- full repository acceptance.

## Continuation requirement

At each verified phase/milestone boundary:

1. update `.codex/CURRENT.md`;
2. update canonical project status/continuation records;
3. record exact branch and SHA evidence;
4. record tests/checks actually run;
5. identify the next single bounded action;
6. preserve rollback and stop conditions.

Do not advance to the next model/phase solely because a chat ended or an account changed.
