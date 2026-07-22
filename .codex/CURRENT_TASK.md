# Current Task

INTENT: SOFTWARE_FEATURE / UI_UX_IMPLEMENTATION
MODE: execute
TARGET: HAU-USC Logistics v0.6 Phase 2 shared shell on `chore/v0.6-codex-continuity-bootstrap`
AUTHORITY: `.codex/specs/v0.6-phase-2-terra.md`; `AGENTS.md`; `.codex/PHASE_AND_CONTEXT_POLICY.md`; `.codex/DESIGN_REFERENCE_DIGEST.md`
RISK: medium
DELIVERABLE: complete S0003-backed shared shell and shared design-system slice
VERIFICATION: focused source checks, build/parity checks, and desktop/mobile browser checks for the shell
STOP CONDITION: shared-shell slice is complete; do not begin Administrator work until the next bounded slice is explicitly started

## Active bounded unit

Phase 1 remains complete and locked at `c07e6e6ad5777710a68bef4d1d2aa553b964c108`.
This slice ingested S0003 once, recorded `.codex/DESIGN_REFERENCE_DIGEST.md`,
and implemented the shared shell and component/design-system foundations. The
S0003 source hash is `89d7741b25146806c2ffed8c0bcf85dd58cdba1d84144c6dd65c54ada0318429`.

Next bounded slice: Administrator only. Do not ingest another role-specific
S0002 HTML reference until that role becomes active. Do not alter authentication/session architecture,
authorization semantics, ledger/atomicity contracts, production configuration,
or generated visual-baseline files.
