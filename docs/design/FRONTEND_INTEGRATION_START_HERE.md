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

PREPARATION_BASELINE (this packet)
  branch                 frontend-design-integration
  exact start/end SHAs   see .codex/CURRENT_HANDOFF.md
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

| Document                                                                               | Answers                                                                                             |
| -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| [FRONTEND_BACKEND_CONTRACT_MATRIX.md](FRONTEND_BACKEND_CONTRACT_MATRIX.md)             | Every frontend-consumed route, surface, operation, capability, state, and data class on frozen main |
| [FRONTEND_SOURCE_DISPOSITION.md](FRONTEND_SOURCE_DISPOSITION.md)                       | What to adopt, port, reconcile, archive, and never migrate                                          |
| [FIGMA_MAKE_SOURCE_REGISTER.md](FIGMA_MAKE_SOURCE_REGISTER.md)                         | Where the v39 Make source lives in Git, with hashes, so no Figma call is needed                     |
| [FRONTEND_INTEGRATION_EXECUTION_PLAN.md](FRONTEND_INTEGRATION_EXECUTION_PLAN.md)       | FI-00 to FI-16 slice order, owned paths, invalidators, stop conditions                              |
| [FRONTEND_INTEGRATION_ACCEPTANCE_MATRIX.md](FRONTEND_INTEGRATION_ACCEPTANCE_MATRIX.md) | The reusable Playground and Production verification matrix                                          |
| [CODEX_FRONTEND_INTEGRATION_HANDOFF.md](CODEX_FRONTEND_INTEGRATION_HANDOFF.md)         | The exact resume packet and first action                                                            |

The Phase 9 intake records remain valid as classification and guardrail
evidence: [V083_FRONTEND_DESIGN_ADOPTION_INTAKE.md](V083_FRONTEND_DESIGN_ADOPTION_INTAKE.md)
and [V083_TO_FRONTEND_INTEGRATION_MAP.md](V083_TO_FRONTEND_INTEGRATION_MAP.md).
Both carry the branch-decision note described in section 7.

## 4. Read these for the first slice, and little else

FI-00 is a branch-reconciliation slice, so its required read set is small:

```text
1. .codex/CURRENT.md, .codex/CURRENT_TASK.md, .codex/CURRENT_HANDOFF.md
2. docs/design/FRONTEND_INTEGRATION_START_HERE.md            this file
3. docs/design/FRONTEND_INTEGRATION_EXECUTION_PLAN.md        FI-00 section
4. docs/design/FRONTEND_SOURCE_DISPOSITION.md                the DO_NOT_MIGRATE list
5. git diff --name-status origin/main frontend-design-integration
```

For FI-01, the design-token slice, add:

```text
6. src/index.html and src/v5/styles/tokens.css                        current token entry
7. scripts/design/theme-source.mjs, prototypes/shared/hau-theme.css   canonical token source
8. output/design/make-adoption/theme.css                              Figma Make v39 theme
9. docs/design/FRONTEND_BACKEND_CONTRACT_MATRIX.md section 7          cross-cutting UI contracts
```

## 5. Do not read by default

Large, historical, or superseded. Open one only when a named slice requires it,
and record why.

```text
prototypes/impeccable-whole-site-redesign/            20 files   v1
prototypes/impeccable-whole-site-redesign-v2/         23 files
prototypes/impeccable-whole-site-redesign-v3/         24 files
prototypes/impeccable-whole-site-redesign-v4/         36 files
docs/design/IMPECCABLE_V2_*  IMPECCABLE_V3_*  IMPECCABLE_V4_*
docs/design/V4_1_*
.codex/IMPECCABLE_V2_*  IMPECCABLE_V3_*  IMPECCABLE_V4_*  V0_4_2_FRONTEND_*
output/design/impeccable-redesign-*  and output/design/theme-refine-*
                                                      part of 948 files / 134.7 MB
dist/  playwright-report/  test-results/
HAU-USC_Logistics-Prototype-Shareable.html
hau-usc-logistics-guided-demo.html
shareable-html-modules/  sites-preview/  legacy/  apps-script/
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

## 7. Branch decision — this supersedes the Phase 9 recommendation

Phase 9 (`V083_FRONTEND_DESIGN_ADOPTION_INTAKE.md`, "Future starting boundary")
recommended starting implementation on a fresh branch cut from final main and
never merging this branch. **Earl's 2026-08-21 directive replaces that**:
`frontend-design-integration` becomes the temporary frontend-integration work
branch and is later promoted through the protected `main` lineage.

That is the owner's decision and it is respected here. It carries two verified
consequences, which are exactly what FI-00 exists to resolve.

### 7.1 The branch is 191 commits behind main and would delete frozen work

```text
frontend-design-integration vs origin/main   95 ahead - 191 behind
merge base                                   88bfdf026e716ffdc779cb2ce7534978f36df0f3
diff                                         1480 files - +149519 / -47737
files present on main and ABSENT on branch   135
  migrations/0031_canonical_identity_foundation.sql
  migrations/0032_staff_account_activity_history.sql
  the entire src/v5/integration/* adapter layer (8 files)
  27 tests/unit/*  -  8 src/server/*  -  14 .codex/specs/*  -  16 .codex/releases/*
  15 scripts/playground/*  -  10 src/v5/*  -  13 docs/design/*
```

Merging this branch into `main` **before** reconciliation would delete frozen
v0.8.3 work, including both identity migrations. FI-00 is therefore mandatory
and blocking: merge `origin/main` into `frontend-design-integration`, prove the
result equals main's tree apart from the intended design-evidence additions, and
only then begin FI-01. This preparation task was explicitly forbidden from
performing that merge.

### 7.2 The branch would add 138.8 MB of design evidence to main — owner decision

Frozen main has **no** `prototypes/`, **no** `output/design/`, and **no**
`scripts/design/`. All of it lives only on this branch:

```text
output/design/    948 files   134,737,146 bytes   (904 PNG screenshots)
prototypes/       155 files     2,373,865 bytes
docs/design/       49 files     1,547,716 bytes   (main has only 5 research docs)
scripts/design/    18 files       156,701 bytes
                 -----------------------------
                 1,170 files   138,815,428 bytes
```

Promoting the branch to `main` as-is puts all of that into the production
repository's protected lineage. That is an owner call, not an implementation
detail. FI-00 must obtain Earl's decision on which of four dispositions applies
to each group: promote to main, retain on the branch only, preserve by immutable
archive tag, or move outside Git. Recommended default is to promote
`docs/design/**` and `scripts/design/**`, keep `prototypes/public-portals-r3`
and `prototypes/shared`, and preserve `output/design/**` by archive tag rather
than merging 134.7 MB of PNGs into main.

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
FI-00  Integration baseline + branch reconciliation to final main   BLOCKING
FI-01  Shared design tokens / primitives / theme / typography
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

## 11. First Codex action

```text
1. Verify this packet against current HEAD using the STALE_IF block in each document.
2. Accept or amend FI-00 as the integration baseline.
3. Execute FI-00: obtain the section 7.2 owner decision, reconcile the branch to
   final main, and prove tree parity.
4. Stop. Do not start FI-01 until FI-00 is accepted.
```

Codex does **not** start by auditing Figma again, does **not** start by reading
the whole historical branch, and does **not** start by rediscovering the backend.
