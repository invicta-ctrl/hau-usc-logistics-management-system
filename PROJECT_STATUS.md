# Project Status

## Current implemented baseline

- Implemented version: `0.4.0`
- v0.6 transition preparation date: `2026-07-21`
- Active continuity branch: `chore/v0.6-codex-continuity-bootstrap`
- Preserved launch-readiness predecessor: `81efe82618048b79a821f93bd95a0be00eaeff43`
- `main` / merge-base checkpoint at continuity setup: `91a30ee2de015bce1471a2d4fd71d9325af3e936`
- Preserved predecessor relationship at continuity setup: `63` commits ahead / `0` behind `main`
- Historical PR #2: **closed, not merged**
- Historical branch `feat/apps-script-backend-and-launch-readiness`: absent as a remote branch when continuity setup began
- Local/demo backend: `mock`
- Apps Script bundle mode: `apps-script` with explicit Script Property environment
- Current known staging deployment: immutable Version 9 on the existing deployment ID
- Production deployment/promotion: **not performed**

The removed historical branch ref did not erase its implementation history. The preserved predecessor commit is the non-destructive base of the current continuity branch.

## Current v0.6 control state

Active phase: **Phase 1 — SOL High**

Current mode: **READ / VERIFY / RECONCILE before application-code implementation**

Canonical control files:

- `.codex/CURRENT.md` — active operational pointer
- `.codex/PHASE_AND_CONTEXT_POLICY.md` — mandatory token-efficiency, phase-stop, manual model-switch, and escalation rules
- `.codex/BOOTSTRAP.md` — fresh-session continuity procedure
- `.codex/specs/v0.6-phase-1-sol-high.md`
- `.codex/specs/v0.6-phase-2-terra.md`
- `.codex/specs/v0.6-phase-3-sol-high.md`
- `.codex/specs/README.md`

## Context-efficiency rule

A fresh Codex task should not reread the entire repository.

Minimum cold-start set:

1. `AGENTS.md`
2. `.codex/CURRENT.md`
3. `.codex/PHASE_AND_CONTEXT_POLICY.md`
4. the active phase specification

Then run the Git handshake and read only the additional files/sections directly required by the current bounded milestone.

Do not repeatedly reread unchanged long documentation, generated artifacts, or historical continuation sections when their needed facts are already captured by the current pointer.

## Mandatory model-switch boundaries

Codex cannot automatically switch models, so phase completion is a hard task boundary.

- Phase 1 complete → pointer advances to Phase 2 / `GPT-5.6 Terra` / `READY FOR MANUAL MODEL SWITCH` → current Sol task stops.
- Phase 2 complete → pointer advances to Phase 3 / `GPT-5.6 Sol — High` / `READY FOR MANUAL MODEL SWITCH` → current Terra task stops.
- Phase 3 complete → pointer becomes `PROGRAM COMPLETE — PRODUCTION STILL GATED` → task stops before production promotion.

During Phase 2, a Sol-class architecture/security escalation sets the pointer to `SOL ESCALATION REQUIRED` and Terra stops for a manual model switch rather than improvising.

See `.codex/PHASE_AND_CONTEXT_POLICY.md` for the exact required terminal messages and transition procedure.

## Documentation reconciliation

Inherited 0.4.0 historical records may still contain old open/draft PR #2 wording. Current Git/GitHub state and `.codex/CURRENT.md` govern active branch/commit/PR/CI facts.

Do not execute a historical deployment or PR action merely because it appears in an old continuation block.

## Preserved 0.4.0 implementation

The preserved predecessor includes:

- approved visual baseline and generated visual modules;
- strict mock / Apps Script / future HTTP browser adapters;
- Apps Script authorization, server IDs, locks, idempotency, structured errors, audit/status history;
- append-only inventory, reservations, request routing, lending, release, restocking, procurement, canvass, evidence, migration/reconciliation, backup, and triggers;
- privacy-safe evidence labels/filenames and permission-gated processing;
- request-only bootstrap sanitization;
- fail-closed staging/production configuration via Script Properties;
- deterministic parser-safe Apps Script packaging;
- browser/package regressions and staging diagnostics;
- trusted server-rendered request-only/environment attributes.

Detailed historical evidence remains in `docs/WORK_CONTINUATION.md`, relevant incident/runbook documents, and Git history. Do not reread all of it unless the current milestone needs a specific historical fact.

## Known staging state preserved from predecessor

Already completed and not to be repeated merely because the Codex account/session changes:

- dedicated staging Apps Script project/authenticated clasp setup;
- required `STAGING` Script Properties;
- staging database/schema setup;
- staging Drive root/evidence folders;
- migration dry-run and reconciliation;
- timestamped launch backup;
- overdue-lending and scheduled-backup triggers;
- parser-safe staging through Version 9;
- read-only acceptance of diagnostic, authorized internal, and request-only Version 9 entry points.

No production migration was applied and no production resource was modified.

## Data/invariant facts retained

- Earlier read-only validation found the four original legacy tabs matched the supplied backup value-for-value.
- `01_ITEM_MASTER` contained 397 records: 394 `ACTIVE`, 3 `VERIFY`, 2 zero-quantity, no missing units.
- Known date-serial anomalies remain `VERIFY`; no quantity was corrected.
- Posted ledger/history records remain immutable; use adjustments/reversals rather than destructive edits.

## Preserved verification evidence

At runtime-truthfulness checkpoint `7156c256414b797f4b0f19431b399009f31feebd`:

- focused Vitest: 2 files / 14 tests passed;
- `npm run check`: passed;
- Vitest: 10 files / 69 tests passed;
- Vite build: passed with 17 modules transformed;
- Apps Script static validation: passed;
- deterministic generated-package checks: passed;
- standalone artifact verification: passed at 210,112 bytes each;
- `npm run test:e2e`: 29 passed, 25 intentionally skipped, 0 failed.

At preserved predecessor `81efe82618048b79a821f93bd95a0be00eaeff43`, associated GitHub `CI` and `Apps Script static check` workflow runs completed successfully.

The current continuity/policy updates are documentation, specification, and instruction changes only. No new runtime test suite is claimed for them.

## Current hard boundaries

- Do not start from stale `main` if that would discard preserved launch-readiness history.
- Do not reset, clean, discard, overwrite, or force-push unknown work.
- Do not deploy Apps Script or create another staging version from the current continuity pointer.
- Do not apply migrations, seed final institutional access, perform operational Sheet/Drive writes, or touch production without explicit authorization and the required gates.
- Do not begin Phase 2 in the Phase 1 Sol task.
- Do not continue past any completed phase boundary without the required manual model switch.

## Next task

Start a fresh Codex task using **GPT-5.6 Sol — High** and follow only:

1. `AGENTS.md`
2. `.codex/CURRENT.md`
3. `.codex/PHASE_AND_CONTEXT_POLICY.md`
4. `.codex/specs/v0.6-phase-1-sol-high.md`

Then perform the Git handshake and the current read-only baseline reconciliation. Read any additional files only when a specific reconciliation fact requires them.