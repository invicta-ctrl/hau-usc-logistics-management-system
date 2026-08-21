# Codex Frontend Integration Handoff

The exact resume packet. Read `FRONTEND_INTEGRATION_START_HERE.md` first, then
this.

```text
PREPARATION_STATUS:        COMPLETE
PREPARED_BY:               Claude Opus 5 (Claude Code)
PREPARATION_DATE:          2026-08-21 (Asia/Manila)
PREPARATION_BRANCH:        frontend-design-integration
PREPARATION_WORKTREE:      D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
PREPARATION_START_SHA:     c4356570bd0442304303989e0e7cc97e31d481f7
PREPARATION_START_TREE:    cf0f28dc794afc32492057ab14d80aa086431cc6
PREPARATION_END_SHA:       bb086f4e5882bfb88646d9d76a904b228dd2c10f
PREPARATION_TREE:          5fa82f2f71bee08e0c40eb854cb7687e65558896
UPSTREAM_PARITY:           origin/frontend-design-integration@bb086f4e5882bfb88646d9d76a904b228dd2c10f;VERIFIED_0_AHEAD_0_BEHIND

FROZEN_MAIN_SHA:           86553349f5c2ebefaa637c30828c560a301f99ba
FROZEN_MAIN_TREE:          db95ebaafb7de421d02b12f0158bc1a93953edde
FROZEN_PRODUCT_RELEASE:    v0.8.3 -> 07aa2d2dfcee12fb1ec26fc5a3658ca9ca9be34e
                           tag tree 317fd3e30aea0d2b5d871784bb1edf57bd14155c
FROZEN_PRODUCTION_CANDIDATE: f8e63372bc8afcb6d092970b7f9fc9ee72fd3580
                           tree 5788251d483f23ec5e19048e1a946b3a00450436
                           verified ancestor of origin/main
PRODUCTION_SCHEMA:         schema32
PRODUCTION_MIGRATIONS:     0031_canonical_identity_foundation.sql
                           0032_staff_account_activity_history.sql
                           32 migration files total

FIGMA_DESIGN_BASELINE:     DESIGN_BASELINE_2026-08-20-F - file hXJElH4p72KfgAaoUyfNOC
FIGMA_MAKE_VERSION:        rP9W9MQlZkyQrUx38TVsFS - Version 39 - pending edits NONE
FIGMA_SOURCE_STATUS:       RECOVERABLE_FROM_GIT
                           theme.css sha256 249857a93f0f90425504da286aab4a296445b4f74546e4fbff72dcf30663140d
                           matches the v39 identity recorded in the baseline register
FIGMA_SOURCE_REGISTER:     docs/design/FIGMA_MAKE_SOURCE_REGISTER.md

FUNCTIONAL_AUTHORITY:      frozen v0.8.3 main; backend/API/auth/data contracts win
VISUAL_AUTHORITY:          DESIGN_BASELINE_2026-08-20-F + Figma Make v39
CONTRACT_MATRIX:           docs/design/FRONTEND_BACKEND_CONTRACT_MATRIX.md
SOURCE_DISPOSITION:        docs/design/FRONTEND_SOURCE_DISPOSITION.md
EXECUTION_PLAN:            docs/design/FRONTEND_INTEGRATION_EXECUTION_PLAN.md
ACCEPTANCE_MATRIX:         docs/design/FRONTEND_INTEGRATION_ACCEPTANCE_MATRIX.md
START_HERE:                docs/design/FRONTEND_INTEGRATION_START_HERE.md

FRONTEND_RUNTIME_CHANGES:  FI-01 shared CSS foundation: tokens.css active token/theme and local fonts; base.css font roles; V3/V4/V5 primitive consumers; canonical build outputs regenerated
BACKEND_CHANGES:           0
MIGRATIONS:                0
PROVIDER_WRITES:           0
FIGMA_WRITES:              0
PLAYGROUND_WRITES:         0
PRODUCTION_WRITES:         0

FIRST_CODEX_SLICE:         Historical FI-00 reconciliation (complete 2026-08-21)
CURRENT_SLICE_STATUS:      FI-01 PASS; D-04 PASS; D-02 PASS; D-08 OPEN_FOR_FI02
RUNTIME_TOKEN_AUTHORITY:   src/v5/styles/tokens.css
NEXT_SLICE:                FI-02 Public Landing & Portal Shell
ACTIVE_WRITER:             NONE
WRITER_LOCK:               RELEASED
HANDOFF_STATUS:            READY_FOR_CODEX_FRONTEND_INTEGRATION
```

## FI-LIVE-PREVIEW-01 handoff template — FI-01 through FI-12

The accepted local-preview amendment is
`.codex/specs/active/frontend-integration-live-local-preview-amendment.md`.
Only an accepted active FI slice with the sole writer lock may start or reuse the
preview. It uses the existing guarded command with an approved private manifest;
never put that path, any resource identifier, or credential in this packet.

```text
LOCAL_PREVIEW:
LOCAL_PREVIEW_COMMAND: npm run dev:v5:playground -- <ABS_PRIVATE_PLAYGROUND_MANIFEST>
LOCAL_PREVIEW_HOST: 127.0.0.1
LOCAL_PREVIEW_PORT: 4173
LOCAL_PREVIEW_WORKTREE:
PLAYGROUND_PROXY_VERIFIED:
PREVIEW_PRODUCTION_CROSSOVER:
PREVIEW_BACKEND_WRITES:
PREVIEW_REUSED_OR_RESTARTED:
VISUAL_CHECKPOINTS_PERFORMED:
PREVIEW_STOPPED_AT_HANDOFF:
```

Start once or reuse only the matching worktree/configuration; HMR carries normal
iteration. Browser inspection is checkpoint-only, not a continuous AI watching
loop. On lock release, branch/worktree change, session close, or staleness,
terminate the preview cleanly and record the listener check.

## What Codex starts from

```text
CODEX DOES NOT START BY AUDITING FIGMA AGAIN.
CODEX DOES NOT START BY READING THE WHOLE HISTORICAL BRANCH.
CODEX DOES NOT START BY REDISCOVERING THE BACKEND.

CODEX STARTS FROM
  1. frozen v0.8.3 main functional and backend authority
  2. this preparation commit on frontend-design-integration
  3. the verified Figma Design / Figma Make baseline and source register
  4. the frontend-backend contract matrix
  5. the source-disposition map
  6. the FI-00 to FI-16 execution plan
  7. the Playground and Production acceptance matrix
  8. the exact first accepted integration slice
```

## FIRST_CODEX_SLICE — FI-00

```text
OBJECTIVE   Make frontend-design-integration a safe base for v0.8.3 frontend work
            and obtain the two owner decisions that block FI-01.

OWNED PATHS .codex/CURRENT.md
            .codex/CURRENT_TASK.md
            .codex/CURRENT_HANDOFF.md
            .codex/specs/active/<new frontend-integration spec>
            the merge commit reconciling origin/main into the branch

EXCLUDED    every src/ file, every migration, every generated artifact,
            every backend path
```

### FIRST_CODEX_REQUIRED_READS

```text
AGENTS.md
.agents/PROJECT_POLICY.md
.agents/WORKTREE_POLICY_APPENDIX.md            when present
.codex/CURRENT.md
.codex/CURRENT_TASK.md
.codex/CURRENT_HANDOFF.md
docs/design/FRONTEND_INTEGRATION_START_HERE.md
docs/design/FRONTEND_INTEGRATION_EXECUTION_PLAN.md   FI-00 section only
docs/design/FRONTEND_SOURCE_DISPOSITION.md           the DO_NOT_MIGRATE list
git diff --name-status origin/main frontend-design-integration
```

That is the whole read set for FI-00. Nothing else.

### FIRST_CODEX_DO_NOT_REPEAT

```text
Do not re-audit the Figma Design file. The audit exists at
  docs/design/FIGMA_DESIGN_MAKE_AUDIT.md with its defect register.
Do not re-capture Figma Make. v39 is in Git; see the source register.
Do not re-derive the route inventory. 33 surfaces / 34 route classifications,
  counted from src/v5/src/registry.js on frozen main.
Do not re-derive the Worker API surface, the capability list, the
  operation-to-capability map, or the status transition tables. All are in the
  contract matrix, extracted deterministically.
Do not re-classify the design artifacts. The disposition map is complete.
Do not rerun the historical v5 browser matrix. It proves the historical
  candidate, not a v0.8.3 candidate.
Do not use v0.7.2 functionality, routes, or field lists as current authority.
Do not hand-edit any generated artifact.
```

## KNOWN_BLOCKERS

### B1 — the branch would delete 135 files that frozen main has · RESOLVED by FI-00

```text
frontend-design-integration vs origin/main   93 ahead - 191 behind
merge base                                   88bfdf026e716ffdc779cb2ce7534978f36df0f3
deletions if merged as-is                    135 files, including
  migrations/0031_canonical_identity_foundation.sql
  migrations/0032_staff_account_activity_history.sql
  src/v5/integration/*  (the entire adapter layer, 8 files)
  27 tests/unit/*  8 src/server/*  14 .codex/specs/*  16 .codex/releases/*
  15 scripts/playground/*  10 src/v5/*  13 docs/design/*
```

**Resolved.** FI-00 merged `origin/main@86553349` normally into the branch on
2026-08-21, resolving every behavior path in main's favour. Files present on
origin/main and absent here: **0**. Runtime-scope diff vs origin/main: **0**.
Migrations 0031 and 0032 are byte-identical; `src/v5/integration/*` is
byte-identical. See
[FRONTEND_FI00_RECONCILIATION_RECEIPT.md](FRONTEND_FI00_RECONCILIATION_RECEIPT.md).

### B2 — promoting the branch adds design evidence to main · RESOLVED by FI-00 containment

```text
Frozen main has NO prototypes/, NO output/design/, NO scripts/design/.
The branch carries
  output/design/    948 files   134,737,146 bytes   904 PNG screenshots
  prototypes/       155 files     2,373,865 bytes
  docs/design/       49 files     1,547,716 bytes   main has only 5 research docs
  scripts/design/    18 files       156,701 bytes
                  1,170 files   138,815,428 bytes
```

**Resolved.** FI-00 applied the recommended disposition: `docs/design/**` and
`scripts/design/**` retained, `prototypes/public-portals-r3` and
`prototypes/shared` retained, `output/design/**` reduced to the Make source and
rollback baseline, and everything else preserved by the immutable archive tag
`archive/frontend-design-pre-fi00-2026-08-21`.

```text
pre-FI-00 branch tree   1,894 files   167,117,742 bytes
FI-00 reconciled          979 files    25,699,386 bytes
surplus over main         128 files     2,759,756 bytes
```

Promotion to main is **clean-lineage only** — squash merge through the protected
PR path, or a fresh promotion branch cut from accepted main. A normal
historical-branch merge is forbidden.

### B3 — FI-01 design defects resolved; D-08 remains open for FI-02

| Id     | Severity | Blocks | Decision needed                                                                                                                                                                                     |
| ------ | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `D-08` | HIGH     | FI-02  | 17 landing-hero text nodes fail WCAG 2.2 AA at 1.01:1 to 1.84:1. The cards may encode an intentional active/inactive distinction, so this is a state-semantics decision, not a mechanical recolour. |
| `D-04` | —        | —      | **PASS in FI-01.** Local Bricolage/Plex/Newsreader roles are the active runtime typography authority.                                                                                               |
| `D-02` | —        | —      | **PASS in FI-01.** `tokens.css` supplies the sole active D41 G1–G4 glass/blur ladder and fallback recipe.                                                                                           |

## UNVERIFIED_ITEMS

```text
Live Figma Design page count
  A read-only get_metadata probe on 2026-08-21 returned only page 0:1
  "00 — Capture Index"; the durable audit records 28 pages. Consistent with the
  desktop bridge exposing one loaded page. NOT evidence of change.
  Resolution: open the file and re-list pages, or accept DESIGN_BASELINE_2026-08-20-F.

Live Figma Make version
  No MCP tool reads a /make/ URL. v39 is asserted from the saved-document hash
  recorded 2026-08-20 and reproduced in Git.
  Resolution: reload Make and re-hash src/styles/theme.css against 249857a9….

54 inferred colours on Figma page 15
  Restored by inference after the 2026-08-19 sweep incident. Plausible and
  legible but not proven identical to the original.
  Resolution: compare against Figma version history if exactness matters.

RequestCenterRoute.tsx original authorship
  UNKNOWN. Byte-exact rollback baseline preserved at
  output/design/make-preservation/RequestCenterRoute.unsaved.tsx (4087473c…).

Field-level literals per surface
  Deliberately not copied into the matrix. Resolved per slice from the named
  source symbol; see contract matrix section 13.
```

## OWNER_DECISIONS_REQUIRED

```text
1. Confirm the branch strategy that supersedes the Phase 9 "fresh branch off
   main" recommendation.                                                    (B1)
2. Design-evidence promotion disposition, per group.                        (B2)
3. Landing hero ink and active/inactive state semantics.                    (D-08)
4. Whether scripts/design/** becomes part of the work branch toolchain, since
   the design audit and cascade verifiers depend on it.
5. Any dependency, generated-artifact, browser-verification, or visual
   acceptance expansion beyond an accepted slice.
6. Separate Playground deploy authority, then separate Production GO.
```

## Boundary attestation

```text
No frontend source, dependency, build, or generated artifact changed.
No backend, service-contract, auth, capability, data, or route behavior changed.
No migration was added, run, rerun, or rewritten. 0031 and 0032 untouched.
No Figma read mutated anything; get_metadata and whoami are read-only.
No provider, D1, R2, Google, email, Playground, or Production write occurred.
No merge to main. No rebase. No force-push. No history rewrite.
No recovery pointer moved. No worktree deleted. No branch deleted or renamed.
No secret, credential, roster value, or private provider identifier is recorded
  in this packet.
```

## STALE_IF

```text
origin/main moves beyond 86553349f5c2ebefaa637c30828c560a301f99ba
origin/frontend-design-integration moves beyond the recorded PREPARATION_END_SHA
docs/design/FIGMA_BASELINE_REGISTER.md gains a baseline after 2026-08-20-F
output/design/make-adoption/theme.css sha256 != 249857a9…
any STALE_IF listed in the contract matrix, source disposition, or Make register
```
