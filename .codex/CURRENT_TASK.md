# Current Task

INTENT: SOFTWARE_FEATURE / UI_UX_IMPLEMENTATION
MODE: stop
TARGET: HAU-USC Logistics v0.6 Phase 2 Administrator experience on `chore/v0.6-codex-continuity-bootstrap`
AUTHORITY: `.codex/specs/v0.6-phase-2-terra.md`; `AGENTS.md`; `.codex/PHASE_AND_CONTEXT_POLICY.md`; `.codex/DESIGN_REFERENCE_DIGEST.md`; `ADMIN.html`
RISK: medium
DELIVERABLE: complete Administrator control-desk presentation within the shared shell, using existing server-authorized administration controls
VERIFICATION: focused reference-administration tests, relevant browser/responsive checks, build/parity checks, and complete milestone gate
STOP CONDITION: Administrator slice complete; do not ingest or implement another role without a new bounded task

## Active bounded unit

Phase 1 remains complete and locked at `c07e6e6ad5777710a68bef4d1d2aa553b964c108`.
The S0003 shared-shell checkpoint is pushed as `feaccf7ed1256085d5950b315fd8d7ce2afbc773`;
the Administrator code checkpoint is pushed as `658410b24b6556131d11901551911d553a1832b7`.
This Administrator-only slice read `ADMIN.html` at SHA-256
`88e13f1e34cb9175d943f362444655f0f10d4bc6179f9e4af2be825ef2e6c5a3`,
appended its durable decisions to the digest, and adapted only the existing
Reference Administration workspace. The control desk selects existing domains
only; it does not alter authorization semantics or backend services.

Verification passed: focused unit tests 10 / 10; focused Reference Administration
browser proof 6 passed / 24 intentional skips; `npm run check` with 45 Vitest
files / 341 tests, build/parity, and Apps Script validation. Do not ingest
another role-specific S0002 HTML reference until a new bounded task starts.
