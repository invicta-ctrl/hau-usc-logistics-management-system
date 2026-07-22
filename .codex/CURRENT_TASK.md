# Current Task

INTENT: SOFTWARE_FEATURE / UI_UX_IMPLEMENTATION
MODE: stop
TARGET: HAU-USC Logistics v0.6 Phase 2 Inventory & Pantry experience on `chore/v0.6-codex-continuity-bootstrap`
AUTHORITY: Earl's 2026-07-22 authorization to finish Phase 2; `.codex/specs/v0.6-phase-2-terra.md`; `AGENTS.md`; `.codex/PHASE_AND_CONTEXT_POLICY.md`; `.codex/DESIGN_REFERENCE_DIGEST.md`; `INVENTORY.html`
RISK: medium
DELIVERABLE: complete the Inventory & Pantry exception-first experience inside the shared shell without widening authorization
VERIFICATION: focused role-experience unit and browser/responsive proofs, build/parity checks, and the complete milestone gate
STOP CONDITION: Inventory & Pantry slice verified and committed; push and remote CI verification required before beginning Materials & Documentation

## Active bounded unit

Phase 1 remains complete and locked at `c07e6e6ad5777710a68bef4d1d2aa553b964c108`.
The S0003 shared shell and earlier role checkpoints remain the accepted Phase 2 baseline.
Earl explicitly authorized completion of all remaining Phase 2 work, one bounded slice at a time.

The Food implementation `a6bcd7e3be934479496ce6fc05e43903989420a0` is pushed through handoff
checkpoint `cfde03a1e717334e629a466bf72666f5ff5030b5`; PR #9 validation, verification,
browser smoke, build, and repository-triggered Pages checks pass.

This slice read `D:\Documents\UIUX workshop\Inventory\INVENTORY.html` at SHA-256
`107f447e9aef8d3b9a377b5d059a745807e744833272e02d55150c5ed30fbf19` and implements only
the Inventory & Pantry experience: exception-first catalog attention, visibly distinct
on-hand/reserved/available-to-promise semantics, circulation attention, replenishment, and
capability-bound controlled release. All actions delegate to existing shared workspaces and
server-owned authorization and ledger controls.

Implementation checkpoint: `bf350fe1f1bbd06c547cdcf8bbf71fa66b5035c6`.
Verification passed: focused role unit tests 3 / 3; responsive role browser proof 6 passed / 12
intentional skips, including Inventory at 390px and 1366px; `npm run check` with governance,
lint, 46 Vitest files / 344 tests, deterministic build/parity, Apps Script validation, and
standalone verification. The generated `dist/index.html` is 442,740 bytes / SHA-256
`294987c65799bfb750610fa13d6ae597d0ee0ec1ba76f44c09e75a5ade141f65`.
