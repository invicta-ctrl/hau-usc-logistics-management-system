# Current Bounded Task — FI-01 Shared Design Foundation

INTENT: SOFTWARE_FEATURE
MODE: REHYDRATE_VERIFY_IMPLEMENT_VERIFY_HANDOFF
OBJECTIVE: Establish one canonical shared runtime design foundation for the reconciled v0.8.3 frontend, resolving D-04 typography and D-02 glass/blur without changing product behavior or starting FI-02.
TARGET: frontend-design-integration at FI-00 identity eacdfcc951c687cfca5731ede245130266b1c3da, against functional baseline origin/main@86553349f5c2ebefaa637c30828c560a301f99ba.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/frontend-integration-fi01-shared-design-foundation.md
AUTHORITY: Earl FI-01 V2 prompt -> canonical governance -> project policy/current chain -> FI-00 PASS functional baseline -> DESIGN.md and DESIGN_AUTHORITY D08/D09/D12/D41 -> retained Make v39 source -> exact active CSS/import graph.
REQUIRED_MODEL: gpt-5.6-terra sole branch writer, recorded as TERRA_MAX:/root/fi01_integration_writer.
RISK: MEDIUM_HIGH;SHARED_RUNTIME_DESIGN_FOUNDATION
SCOPE: Persist FI-01 authority and lock; consolidate the live shared token/theme/font/glass/motion/focus layer; update only directly coupled shared primitive presentation and evidence; resolve D-04 and D-02; verify, push, and hand off ready for FI-02.
OUT_OF_SCOPE: FI-02/route redesign including landing hero D-08; API/backend/auth/session/CSRF/authorization/data/schema/migration/provider changes; dependency additions; Figma/Playground/Production/recovery writes; historical verifier esbuild; generated-artifact edits; rebase/reset/force/history rewrite or main merge.
VERIFICATION: Governance/current records, formatter, diff check, lint, production Vite build, authoritative theme/contrast/motion checks, focused shared-runtime tests, bounded existing browser visual smoke at 390/768/1440, secret/private scan, complete diff review, normal push/readback parity.
STOP_CONDITIONS: Baseline drift, dirty/conflicting writer state, material D-04/D-02 contradiction, missing approved local font, dependency/scope expansion, external mutation need, functional/security regression, private data, second runtime token system, unresolved P0/P1, or load-bearing unverified fact.
ACTIVE_WRITER: NONE
TERRA_WRITER: NONE
LOCK_HOLDER: NONE
WRITER_LOCK: RELEASED
LOCK_STATUS: RELEASED
HANDOFF_STATUS: READY_FOR_FI02
GIT_UPSTREAM: origin/frontend-design-integration@GIT_HEAD;PUSH_PARITY_VERIFIED
FI00_START_SHA: f0ab75d2481ea7a39cbe29d2b0a1e4d59f632970
FI00_START_TREE: 1d20843c07bc407ec0fac757ec49dfb2d11c796c
PRE_FI00_ARCHIVE_REF: archive/frontend-design-pre-fi00-2026-08-21
ORIGIN_MAIN_SHA: 86553349f5c2ebefaa637c30828c560a301f99ba
ORIGIN_MAIN_TREE: db95ebaafb7de421d02b12f0158bc1a93953edde
ROLLBACK_POINT: f0ab75d2481ea7a39cbe29d2b0a1e4d59f632970
STATUS: FI01_SHARED_DESIGN_FOUNDATION_COMPLETE
RUNTIME_PARITY_TO_MAIN: PASS
GOVERNANCE: PASS
HISTORICAL_ARTIFACTS: CONTAINED_AND_PRESERVED
FRONTEND_IMPLEMENTATION: FI01_SHARED_FOUNDATION_ACCEPTED_ON_WORK_BRANCH;D02=PASS;D04=PASS;D08=OPEN_FOR_FI02
DEPLOY: NOT_AUTHORIZED
NEXT_EXACT_ACTION: FI-02_PUBLIC_LANDING_AND_PORTAL_SHELL

## Delivered

- `.codex/specs/active/frontend-integration-fi00-branch-reconciliation.md` — the
  durable accepted FI-00 authority.
- `archive/frontend-design-pre-fi00-2026-08-21` — immutable preservation of the
  exact pre-FI-00 head, pushed and read back from origin.
- A normal `--no-ff` merge of `origin/main` into the branch, 24 conflicts
  resolved under the main-wins rule.
- Proven runtime parity: zero main-file loss, zero diff across every runtime and
  build scope.
- Governance convergence: `check:agents` from 9 policy-marker errors to PASS.
- Artifact containment: 1,078 files and 136,496,010 bytes removed from the active
  tree, every one proven recoverable from the archive tag first.
- Two byte-exact relocations that a naive removal would have lost:
  `docs/design/DESIGN_AUTHORITY.md` and
  `docs/design/design-reference/v5-theme-final.css`.
- `docs/design/FRONTEND_FI00_RECONCILIATION_RECEIPT.md` and the updated packet.
- The clean-lineage promotion rule recorded in the execution plan FI-15.

## Verified facts a future session must not re-derive

```text
runtime parity          0 files present on origin/main and absent here
                        0 diff across src, tests, migrations, build config
migrations              32 files; 0031 blob 39dd85fa, 0032 blob 6f9bdf0c
src/v5/integration      7 files, byte-identical to main
tests                   146 unit / 2 integration / 25 e2e / 2 cloudflare / 3 staging
package version         0.8.3
active tree             979 files, 25,699,386 bytes
                        origin/main is 851 files, 22,939,630 bytes
                        surplus is 128 files, 2,759,756 bytes of design packet
governance root cause   the branch carried a superseded
                        scripts/check-agent-instructions.mjs (0ce245f5) and two
                        stale .codex/agents/*.toml; AGENTS.md and PROJECT_POLICY.md
                        were already byte-identical to main
design verifiers        build-make-theme --check, verify-make-theme,
                        verify-make-landing-theme, theme-source --check all pass
                        build-make-routes --check is unavailable, undeclared esbuild
```

## Do not repeat

- Do not re-derive the runtime parity proof while `origin/main` is unchanged.
- Do not re-audit Figma or re-capture Figma Make.
- Do not re-derive the route inventory, capability list, operation map, or status
  transition tables; the contract matrix now describes this branch exactly.
- Do not re-run the historical v5 browser matrix.
- Do not attempt to fix `check:agents` by editing policy text; it passes.
- Do not restore removed historical artifacts into the active tree; read them
  from `archive/frontend-design-pre-fi00-2026-08-21` when a named slice needs one.
- Do not merge, rebase, tag, deploy, migrate, or touch a provider without the
  exact accepted authority for that action.
