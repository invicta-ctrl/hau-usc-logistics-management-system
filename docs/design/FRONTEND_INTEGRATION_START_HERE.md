# Frontend Integration — START HERE

This is the first file a fresh Codex session reads after the governance chain
(`AGENTS.md` -> `.agents/PROJECT_POLICY.md` -> `.codex/CURRENT.md` ->
`.codex/CURRENT_TASK.md` -> `.codex/CURRENT_HANDOFF.md`).

It exists so that no future session repeats the design audit, the route
archaeology, the backend-contract discovery, the source classification, or the
migration planning. Those are done, and are recorded in the six companion
documents named below.

```text
PURPOSE            Adopt the accepted Figma / Figma Make visual design into the
                   frozen v0.8.3 frontend WITHOUT changing backend, API, auth,
                   authorization, data, or release contracts.
PREPARED_BY        Claude Opus 5 (Claude Code), 2026-08-21 Asia/Manila
PREPARATION_KIND   Documentation and reference evidence only. Zero runtime change.
```

## 1. Exact baselines

```text
FUNCTIONAL_BASELINE (authoritative for behavior)
  origin/main            86553349f5c2ebefaa637c30828c560a301f99ba
  tree                   db95ebaafb7de421d02b12f0158bc1a93953edde
  release tag            v0.8.3 -> commit 07aa2d2dfcee12fb1ec26fc5a3658ca9ca9be34e
                                  tree   317fd3e30aea0d2b5d871784bb1edf57bd14155c
  frozen Production      f8e63372bc8afcb6d092970b7f9fc9ee72fd3580
                         tree   5788251d483f23ec5e19048e1a946b3a00450436
                         verified ancestor of origin/main
  package version        0.8.3
  Production schema      schema32; migrations 0031 + 0032 applied
  latest migration file  migrations/0032_staff_account_activity_history.sql (32 files)

VISUAL_BASELINE (authoritative for appearance only)
  DESIGN_BASELINE_2026-08-20-F
  Figma Design           hXJElH4p72KfgAaoUyfNOC
  Figma Make             rP9W9MQlZkyQrUx38TVsFS - Version 39 - pending edits NONE
  Make theme.css sha256  249857a93f0f90425504da286aab4a296445b4f74546e4fbff72dcf30663140d
  design evidence SHA    5677bbf3d279ae6eb8b963ff42fb39a4a46e3fa1

FI-00 RECONCILED BASELINE
  branch                 frontend-design-integration
  functional baseline    equals origin/main for every runtime and build path
  pre-FI-00 archive      archive/frontend-design-pre-fi00-2026-08-21 -> f0ab75d
  exact SHAs             see .codex/CURRENT_HANDOFF.md and the FI-00 receipt
```

When appearance and behavior disagree, **behavior wins**. Adapt the design.
Never remove a working feature, and never fabricate an unsupported one.

## 2. Authority order

1. Earl's current explicit instruction.
2. Root `AGENTS.md`.
3. `.agents/PROJECT_POLICY.md`, then `.agents/WORKTREE_POLICY_APPENDIX.md` when present.
4. Branch-local `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`.
5. `.codex/PHASE_AND_CONTEXT_POLICY.md`.
6. The accepted frontend-integration specification named by the pointer.
7. This packet.
8. Frozen-main source, tests, and migrations — the functional truth.
9. Figma Design and Figma Make — visual and interaction intent only.

## 3. The packet

| Document                                                                                                       | Answers                                                                                             |
| -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [FRONTEND_BACKEND_CONTRACT_MATRIX.md](FRONTEND_BACKEND_CONTRACT_MATRIX.md)                                     | Every frontend-consumed route, surface, operation, capability, state, and data class on frozen main |
| [FRONTEND_SOURCE_DISPOSITION.md](FRONTEND_SOURCE_DISPOSITION.md)                                               | What to adopt, port, reconcile, archive, and never migrate                                          |
| [FIGMA_MAKE_SOURCE_REGISTER.md](FIGMA_MAKE_SOURCE_REGISTER.md)                                                 | Where the v39 Make source lives in Git, with hashes, so no Figma call is needed                     |
| [FRONTEND_INTEGRATION_EXECUTION_PLAN.md](FRONTEND_INTEGRATION_EXECUTION_PLAN.md)                               | FI-00 to FI-16 slice order, owned paths, invalidators, stop conditions                              |
| [FRONTEND_INTEGRATION_ACCEPTANCE_MATRIX.md](FRONTEND_INTEGRATION_ACCEPTANCE_MATRIX.md)                         | The reusable Playground and Production verification matrix                                          |
| [CODEX_FRONTEND_INTEGRATION_HANDOFF.md](CODEX_FRONTEND_INTEGRATION_HANDOFF.md)                                 | The exact resume packet and first action                                                            |
| [FI-LIVE-PREVIEW-01 amendment](../../.codex/specs/active/frontend-integration-live-local-preview-amendment.md) | Guarded local loopback preview workflow for accepted FI-01 through FI-12 slices                     |

The Phase 9 intake records remain valid as classification and guardrail
evidence: [V083_FRONTEND_DESIGN_ADOPTION_INTAKE.md](V083_FRONTEND_DESIGN_ADOPTION_INTAKE.md)
and [V083_TO_FRONTEND_INTEGRATION_MAP.md](V083_TO_FRONTEND_INTEGRATION_MAP.md).
Both carry the branch-decision note described in section 7.

## 4. Read these for the first slice, and little else

FI-00 and FI-01 are complete. `src/v5/styles/tokens.css` is the sole active
runtime token/theme authority; D-04 typography and D-02 glass/blur both PASS.
FI-02 (Public Landing & Portal Shell) is next, with D-08 explicitly
`OPEN_FOR_FI02`.

```text
1. .codex/CURRENT.md, .codex/CURRENT_TASK.md, .codex/CURRENT_HANDOFF.md
2. docs/design/FRONTEND_INTEGRATION_START_HERE.md                     this file
3. docs/design/FRONTEND_FI01_DESIGN_FOUNDATION_RECEIPT.md             FI-01 evidence
4. .codex/specs/active/frontend-integration-live-local-preview-amendment.md local preview workflow
5. docs/design/FRONTEND_INTEGRATION_EXECUTION_PLAN.md                 FI-02 section
6. src/index.html and src/v5/styles/tokens.css                        active shared authority
7. docs/design/DESIGN_AUTHORITY.md                                    D08 only for FI-02
8. docs/design/FRONTEND_BACKEND_CONTRACT_MATRIX.md section 7          cross-cutting UI contracts
```

Do not reopen FI-01's resolved D-04/D-02 decisions. D-08 remains the only
named design decision that gates FI-02's landing-hero work.

For every later accepted FI-01 through FI-12 implementation slice, first apply
FI-LIVE-PREVIEW-01: verify authority/lock/no-Production-crossover, then start
or reuse the single loopback preview and let HMR support Earl's observation.
It does not authorize FI-02, a browser launch, or a preview while no FI slice
is active.

## 5. Do not read by default

FI-00 removed the bulky historical families from the **active tree**. They are
not gone: every one is preserved in the immutable archive tag
`archive/frontend-design-pre-fi00-2026-08-21` (commit `f0ab75d`). Recover a path
with `git show archive/frontend-design-pre-fi00-2026-08-21:<path>`.

Archived out of the active tree by FI-00 — 1,078 files, 136,496,010 bytes:

```text
prototypes/impeccable-whole-site-redesign/            v1
prototypes/impeccable-whole-site-redesign-v2/
prototypes/impeccable-whole-site-redesign-v3/
prototypes/impeccable-whole-site-redesign-v4/
prototypes/impeccable-whole-site-redesign-v5/   superseded by src/v5/ on main; its
                                                one unique file is retained at
                                                docs/design/design-reference/v5-theme-final.css
output/design/**  except make-adoption/ and make-preservation/
                                                904 PNGs and historical previews
sites-preview/                                  GPT Sites publication harness
```

Still present, but do not read by default:

```text
docs/design/IMPECCABLE_V2_*  IMPECCABLE_V3_*  IMPECCABLE_V4_*
docs/design/V4_1_*
.codex/IMPECCABLE_V2_*  IMPECCABLE_V3_*  IMPECCABLE_V4_*  V0_4_2_FRONTEND_*
dist/  playwright-report/  test-results/
HAU-USC_Logistics-Prototype-Shareable.html
hau-usc-logistics-guided-demo.html
shareable-html-modules/  legacy/  apps-script/
docs/design/DESIGN_AUTHORITY.md below its decision index
docs/design/CODEX_FRONTEND_DESIGN_HANDOFF.md below the "Historical 2026-08-20" heading
```

## 6. Do not migrate

Never copy these into product source. Reasoning is in
[FRONTEND_SOURCE_DISPOSITION.md](FRONTEND_SOURCE_DISPOSITION.md).

```text
Generated output           dist/, shareable HTML, guided demo, Apps Script bundle,
                           output/design/** screenshots and previews
Prototype fixtures         prototypes/**/data.js, src/v5/src/data/mock.js as runtime data,
                           preview/state/role/viewport selectors, fake counts and metrics
Historic branch runtime    this branch's pre-v0.8.3 src/visual/* and src/styles/* deltas
Figma-only capability      public.register is PROTOTYPE_ONLY_UNSUPPORTED on frozen main;
                           do not build a self-service registration backend from the design
Any backend behavior       API shapes, capabilities, statuses, migrations, provider calls
```

## 7. Branch decision, and how FI-00 resolved it

Phase 9 recommended starting implementation on a fresh branch cut from final
main and never merging this branch. **Earl's 2026-08-21 directive replaced
that**: `frontend-design-integration` is the temporary frontend-integration work
branch and is promoted through the protected `main` lineage.

FI-00 executed that decision. Both blockers the preparation packet recorded are
now closed.

### 7.1 Branch-behind-main — RESOLVED

`origin/main@86553349` was merged normally into this branch. Main won exactly for
every product, runtime, security, data, build, and governance path.

```text
files present on origin/main and absent here     0
runtime-scope diff vs origin/main                0
migrations                                       32 files; 0031 and 0032 byte-identical
src/v5/integration/*                             7 files, byte-identical to main
```

### 7.2 Design-evidence weight — RESOLVED by containment

```text
pre-FI-00 branch tree     1,894 files    167,117,742 bytes
origin/main                 851 files     22,939,630 bytes
FI-00 reconciled            979 files     25,699,386 bytes

active-tree reduction       915 files    141,418,356 bytes
surplus over main           128 files      2,759,756 bytes   the design packet only
```

Everything removed is preserved in `archive/frontend-design-pre-fi00-2026-08-21`.

### 7.3 Promotion is clean-lineage, not a historical merge

This branch's ancestry must never become part of protected `main` history. The
accepted final candidate is promoted by **squash merge** through the protected
PR path, or, if protection cannot squash safely, by a fresh promotion branch cut
from accepted main with the integration delta applied deterministically and tree
plus application-artifact identity proven against the Playground-accepted
candidate. See
[FRONTEND_INTEGRATION_EXECUTION_PLAN.md](FRONTEND_INTEGRATION_EXECUTION_PLAN.md)
FI-15 and
[FRONTEND_FI00_RECONCILIATION_RECEIPT.md](FRONTEND_FI00_RECONCILIATION_RECEIPT.md).

## 8. Integration architecture in one picture

Frozen main already has the adapter boundary this work needs. Reuse it.

```text
src/v5/styles/*          design tokens, typography, shell, components, motion   <- PORT here
src/v5/src/*             surfaces, components, app shell, registry              <- PORT here
        |
src/v5/integration/entry.js          composition root
src/v5/integration/runtime.js        route binding, guards, revision sync
src/v5/integration/view-models.js    server result -> view model
src/v5/integration/backend.js        the ONLY HTTP boundary                     <- DO NOT bypass
        |
src/services/auth-api-client.js - http-api-adapter.js - legacy-runtime-adapter.js
        |
src/worker/index.js                  Cloudflare Worker API                      <- DO NOT change
        |
D1 structured authority   -   R2 object authority
```

No new frontend framework, backend framework, database, API layer, or
Figma-generated standalone runtime. A visual surface must never reach past
`backend.js`, and browser code must never touch D1 or R2 directly.

## 9. Slice order

```text
FI-00  Integration baseline + branch reconciliation to final main   COMPLETE
FI-01  Shared design tokens / primitives / theme / typography          PASS
FI-02  Public landing + portal shell
FI-03  Sign-in + verification + application + application status
FI-04  Authenticated shell + navigation + mobile shell + profile
FI-05  Inventory            FI-06  Request           FI-07  Lending
FI-08  Release              FI-09  Restocking + Procurement + Receiving
FI-10  Accounts + Staff Directory + Activity History
FI-11  References + Links + Announcements/Brand + Events + owner health
FI-12  Cross-surface polish for proven shared defects only
FI-13  Exact candidate freeze
FI-14  Isolated Staging Playground acceptance
FI-15  Protected-main integration + Production preflight
FI-16  Production deployment + smoke + reconciliation + branch closure
```

Every implementation slice is **contract-complete**: a screen ships with its real
backend actions or it does not ship. Never merge a visual state whose required
action is fake, stubbed, or missing.

## 10. Gates

```text
PLAYGROUND GATE
  The exact frozen candidate deploys to the Isolated Staging Playground with its
  own Worker, D1, R2, and secrets. Automated, browser, and Earl manual acceptance
  must pass against the real Playground API. No Production-path mock or preview
  data. See FRONTEND_INTEGRATION_ACCEPTANCE_MATRIX.md.

PRODUCTION GATE
  Earl's explicit GO for the exact tested candidate. Then a protected PR into
  main, then tree and application-artifact identity proof against the accepted
  candidate, then deployment from the protected main lineage only.
  Never deploy Production directly from frontend-design-integration.

BRANCH CLOSEOUT
  After Production smoke, D1/R2/schema/release reconciliation, rollback-readiness
  proof, recovery-pointer rotation where policy requires it, and proof that
  frontend-design-integration holds no unique unmerged work, delete the branch.
```

## 11. First action for the next session

```text
1. Verify this packet against current HEAD using the STALE_IF block in each document.
2. Read docs/design/FRONTEND_FI01_DESIGN_FOUNDATION_RECEIPT.md for the active
   token/theme, D-04, and D-02 authority.
3. Read the FI-02 section of the execution plan and the bounded D-08 authority.
4. Obtain the accepted FI-02 task; keep the landing hero unresolved until its
   D-08 semantics are accepted.
5. Do not reopen or extend FI-01 while beginning FI-02.
```

Codex does **not** start by auditing Figma again, does **not** start by reading
the whole historical branch, and does **not** start by rediscovering the backend.
