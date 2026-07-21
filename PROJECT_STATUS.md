# Project Status

## Current implemented baseline

- Implemented version: `0.4.0`
- v0.6 transition preparation date: `2026-07-21`
- Active continuity branch: `chore/v0.6-codex-continuity-bootstrap`
- Preserved launch-readiness predecessor: `81efe82618048b79a821f93bd95a0be00eaeff43`
- `main` / merge-base checkpoint at continuity setup: `91a30ee2de015bce1471a2d4fd71d9325af3e936`
- Preserved predecessor relationship at continuity setup: `63` commits ahead / `0` behind `main`
- Historical PR #2: **closed, not merged**
- Historical branch `feat/apps-script-backend-and-launch-readiness`: no longer present as a remote branch when continuity setup began
- Local/demo backend: `mock`
- Apps Script bundle mode: `apps-script` with explicit Script Property environment
- Current known staging deployment: immutable Version 9 on the existing deployment ID
- Production deployment/promotion: **not performed**

The deleted historical branch did not erase its implementation history: the preserved predecessor commit still exists and was used as the non-destructive base of the current continuity branch.

## Canonical v0.6 control files

The repository now carries account/session-independent continuation state under `.codex/`:

- `.codex/CURRENT.md` — active operational pointer
- `.codex/BOOTSTRAP.md` — fresh-session continuity procedure
- `.codex/specs/v0.6-phase-1-sol-high.md`
- `.codex/specs/v0.6-phase-2-terra.md`
- `.codex/specs/v0.6-phase-3-sol-high.md`
- `.codex/specs/README.md` — model/phase routing index

The active v0.6 phase is **Phase 1 — SOL High**. The next bounded task is a read-only baseline reconciliation before application-code changes.

## Important documentation reconciliation

The inherited launch-readiness documents at commit `81efe826...` contain stale text saying PR #2 is still open/draft. Current GitHub state at continuity setup showed PR #2 closed and unmerged, and the old feature branch ref was absent.

For branch/commit/PR/CI facts, verify current GitHub state first. Preserve historical evidence, but do not execute a stale “next action” merely because an older continuation block still contains it.

## Completed launch-readiness implementation preserved in history

The preserved 0.4.0 implementation includes:

- approved visual baseline and generated visual modules;
- strict browser adapters for mock, Apps Script, and future authenticated HTTP implementations;
- Apps Script repositories, setup/schema validation, authorization, collision-safe IDs, locks, idempotency, structured errors, audit/status history, append-only inventory, reservations, request routing, lending, release, restocking, procurement, canvass, evidence, migration/reconciliation, backup, and triggers;
- privacy-safe evidence labels/filenames, MIME/extension/size checks, digest deduplication, configured Drive routing, and quarantine recovery;
- sanitized request-only bootstrap behavior that hides exact stock balances and legacy trace fields;
- permission-gated evidence processing;
- fail-closed staging/production environment selection via Script Properties;
- deterministic parser-safe Apps Script packaging from separate Vite outputs;
- raw-text closing-sequence escaping and generated-package validation;
- browser/package regressions and staging diagnostics;
- runtime environment labels and request-only mode propagation through trusted server-rendered body attributes.

See `docs/WORK_CONTINUATION.md` and `docs/INCIDENT_APPS_SCRIPT_STAGING_WEBAPP_2026-07-12.md` for detailed historical packaging/staging evidence.

## Known staging state preserved from the predecessor

The following staging preparation had already been performed before the v0.6 continuity bootstrap and must not be repeated merely because the Codex account/session changes:

- dedicated staging Apps Script project and local authenticated clasp setup;
- required `STAGING` Script Properties;
- staging database/schema setup;
- staging Drive root/evidence-folder setup and validation;
- migration dry-run and reconciliation;
- timestamped launch backup;
- overdue-lending and scheduled-backup triggers;
- parser-safe staging deployment through Version 9;
- read-only acceptance of diagnostic, authorized internal, and request-only entry points for Version 9.

No production migration was applied and no production resource was modified as part of those checkpoints.

## Data/invariant facts retained from earlier validation

- The four original legacy tabs matched the supplied backup value-for-value at the earlier read-only validation checkpoint.
- `01_ITEM_MASTER` contained 397 records (`ITM-0001`–`ITM-0397`): 394 `ACTIVE`, 3 `VERIFY`, 2 zero-quantity, and no missing units.
- Known date-serial anomalies remain `VERIFY`; no quantity was corrected.
- Posted ledger/history records remain immutable; adjustments/reversals are required instead of destructive edits.

See `docs/SCHEMA_VALIDATION_2026-07-12.md`.

## Verification status

### Preserved application verification

At runtime-truthfulness checkpoint `7156c256414b797f4b0f19431b399009f31feebd`:

- focused Vitest: 2 files / 14 tests passed;
- `npm run check`: passed;
- Vitest: 10 files / 69 tests passed;
- Vite build: passed with 17 modules transformed;
- Apps Script static validation: passed;
- deterministic generated-package checks: passed;
- standalone artifact verification: passed at 210,112 bytes each;
- `npm run test:e2e`: 29 passed, 25 intentionally skipped, 0 failed.

At preserved predecessor `81efe82618048b79a821f93bd95a0be00eaeff43`, GitHub workflow runs for both `CI` and `Apps Script static check` completed successfully.

### v0.6 continuity-bootstrap verification

The current continuity commits modify repository instructions/specification/status documentation only. No application source, generated artifact, Apps Script source, dependency, Sheet, Drive, deployment, migration, or production state has been changed by this bootstrap.

No new runtime test suite is claimed for the documentation-only continuity changes. The unchanged application code inherits the verified predecessor evidence above; the first Phase 1 task must independently verify the current local checkout/Git state before implementation.

## Current blockers / hard boundaries

- Do not begin from stale `main` if that would discard the preserved 63-commit launch-readiness history.
- Do not treat the deleted historical branch as lost work; its preserved predecessor is now anchored by the continuity branch.
- Do not deploy Apps Script or create a new immutable staging version from this continuity checkpoint.
- Do not apply migrations, seed final institutional access, perform operational Sheet/Drive writes, or touch production without explicit authorization and required safety gates.
- Do not begin Phase 2 until Phase 1 produces a verified handoff and advances `.codex/CURRENT.md`.

## Next recommended task

Start a fresh Codex task from the Git root and follow:

1. `AGENTS.md`
2. `.codex/CURRENT.md`
3. `.codex/specs/v0.6-phase-1-sol-high.md`

Then perform **READ / VERIFY / REPORT only** for the Phase 1 baseline reconciliation:

- verify local branch/HEAD/upstream/working tree;
- fetch/prune and compare with remote;
- verify the preserved launch-readiness history;
- reconcile stale PR/branch documentation;
- determine the safe baseline integration path for v0.6;
- report whether implementation is authorized before editing application code.
