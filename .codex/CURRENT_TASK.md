# Current Bounded Task — FI-00 Frontend Branch Reconciliation (complete)

INTENT: BRANCH_RECONCILIATION_AND_FRONTEND_INTEGRATION_BASELINE
MODE: VERIFY_PRESERVE_MERGE_RECONCILE_CONTAIN_HANDOFF
OBJECTIVE: Make `frontend-design-integration` safe to use as the temporary frontend-integration implementation branch by merging current `origin/main` into it losslessly, making current main authoritative for every product, runtime, security, data, build, and governance contract, preserving the approved frontend and Figma evidence, containing obsolete historical artifacts after proving recoverability, and leaving a clean handoff for FI-01 without implementing any frontend.
TARGET: frontend-design-integration reconciled against origin/main 86553349f5c2ebefaa637c30828c560a301f99ba, with the pre-FI-00 head f0ab75d2481ea7a39cbe29d2b0a1e4d59f632970 immutably preserved.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/frontend-integration-fi00-branch-reconciliation.md
AUTHORITY: Earl explicit 2026-08-21 FI-00 instruction -> registered canonical governance -> origin/main current v0.8.3 state -> the Claude preparation packet -> frozen v0.8.3 code, tests, migrations, contracts -> Figma and Figma Make as visual reference only -> historical branch material as preservation evidence only.
REQUIRED_MODEL: Claude Code / Claude Opus 5, High reasoning, as sole branch-local FI-00 writer under Earl explicit 2026-08-21 task-specific override. The override covered FI-00 only and has expired. FI-01 returns to the repository's normal writer routing unless Earl issues a new override.
RISK: HIGH;BRANCH_HISTORY_RECONCILIATION_AND_LOSSLESS_PRESERVATION
SCOPE: Persist the accepted FI-00 specification; take and release the branch-local lock; immutably preserve the pre-FI-00 head; normal non-rebase merge of current origin/main; conflict resolution under the main-wins rule; proof of zero current-main product loss and runtime parity; governance convergence until check:agents passes; classification-driven containment of historical artifacts; the clean-lineage promotion rule; carrying D-08, D-04 and D-02 forward; updating the preparation packet and branch-local continuity; coherent commits and a normal push.
OUT_OF_SCOPE: Implementing FI-01 or any frontend component; altering current main product behavior; adding or rerunning a migration; changing authentication, session, CSRF, or authorization; changing Worker or API contracts; changing D1, R2, Google, or provider resources; deploying Playground or Production; mutating Figma; merging this branch into main; opening the Production PR; rotating recovery refs; deleting the branch or unrelated worktrees; cleaning the orphan spec-v073-frontend-design-integration directory; history rewriting; filtering large objects from history; removing unique design evidence; Hallmark or Impeccable redesign work; fixing D-08, D-04, or D-02.
VERIFICATION: Exact branch, head, tree, and upstream readback; exact origin/main identity; archive tag identity and remote readback; normal merge parentage; zero main-file loss; zero runtime diff across every scope in the specification's section 5A; check:agents, handoff:verify, check:continuation; Prettier formatting on touched documents; git diff --check; intra-document reference checks; source-register path checks; secret and private-data scan; containment recoverability proof; complete logical diff review; push and readback parity.
STOP_CONDITIONS: Current main moves in a way that changes the accepted frozen functional baseline; unknown dirty or unpushed work; a conflicting writer; pre-FI-00 history cannot be preserved; the merge requires force, rebase, or history rewrite; a runtime conflict cannot be resolved by the main-wins rule without losing accepted design evidence; check:agents cannot be made green by convergence; a supposedly historical artifact is the only copy of required Make or design source and cannot be safely preserved; private data or secrets appear in preservation or design evidence; the branch needs a new migration, backend, or API behavior to become reconcilable; Figma, provider, Playground, or Production mutation becomes necessary; any load-bearing item remains UNVERIFIED at closeout.
ACTIVE_WRITER: NONE
TERRA_WRITER: NONE
LOCK_HOLDER: NONE
WRITER_LOCK: RELEASED
LOCK_STATUS: RELEASED
HANDOFF_STATUS: READY_FOR_FI01
GIT_UPSTREAM: origin/frontend-design-integration@GIT_HEAD;PUSH_PARITY_VERIFIED
FI00_START_SHA: f0ab75d2481ea7a39cbe29d2b0a1e4d59f632970
FI00_START_TREE: 1d20843c07bc407ec0fac757ec49dfb2d11c796c
PRE_FI00_ARCHIVE_REF: archive/frontend-design-pre-fi00-2026-08-21
ORIGIN_MAIN_SHA: 86553349f5c2ebefaa637c30828c560a301f99ba
ORIGIN_MAIN_TREE: db95ebaafb7de421d02b12f0158bc1a93953edde
ROLLBACK_POINT: f0ab75d2481ea7a39cbe29d2b0a1e4d59f632970
STATUS: FI00_BRANCH_RECONCILIATION_COMPLETE
RUNTIME_PARITY_TO_MAIN: PASS
GOVERNANCE: PASS
HISTORICAL_ARTIFACTS: CONTAINED_AND_PRESERVED
FRONTEND_IMPLEMENTATION: NOT_STARTED
DEPLOY: NOT_AUTHORIZED
NEXT_EXACT_ACTION: FI-01_SHARED_DESIGN_FOUNDATION

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
active tree             978 files, 25,666,831 bytes
                        origin/main is 851 files, 22,939,630 bytes
                        surplus is 127 files, 2,727,201 bytes of design packet
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
