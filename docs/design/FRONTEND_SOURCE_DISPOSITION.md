# Frontend Source Disposition

Every design and frontend artifact a future session may encounter, with exactly
one classification. Anything not listed here is unclassified and must be
classified before it is used.

```text
FUNCTIONAL_TARGET   origin/main 86553349f5c2ebefaa637c30828c560a301f99ba
SOURCE_SURVEYED     frontend-design-integration (post-Phase-9 tip) and origin/main
DERIVED_FROM        git ls-tree / git diff against both refs, 2026-08-21
```

## Classification vocabulary

```text
ADOPT_AS_IS                     Keep exactly as it is. No port required.
PORT_WITH_CONTRACT_PRESERVATION Reimplement into final-main modules; behavior unchanged.
RECONCILE_BEFORE_PORT           Map final-main fields/actions/states first, then port.
DESIGN_REFERENCE_ONLY           Guides appearance and acceptance. Never runtime input.
GENERATED_EVIDENCE_ONLY         Reproducible output. Never hand-edited, never source.
ARCHIVE_HISTORICAL              Keep for history. Not current authority.
OBSOLETE_FOR_FROZEN_V083        Superseded by v0.8.3. Do not use as authority.
DO_NOT_MIGRATE                  Never copy into product source. Reason stated.
OWNER_AMENDMENT_REQUIRED        Stop; requires a new accepted specification.
UNVERIFIED                      Could not be established from durable evidence.
```

## 1. Figma and Figma Make

| Artifact                                        | Identity                                                                                            | Classification                    | Destination / rule                                                                                                                             |
| ----------------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Figma Design file                               | `hXJElH4p72KfgAaoUyfNOC`, `DESIGN_BASELINE_2026-08-20-F`                                            | `DESIGN_REFERENCE_ONLY`           | Visual and interaction intent. Read-only. No mutation is authorized.                                                                           |
| Figma Make file                                 | `rP9W9MQlZkyQrUx38TVsFS`, Version 39, pending edits NONE                                            | `DESIGN_REFERENCE_ONLY`           | Same. Not readable by any MCP tool; use the Git register instead.                                                                              |
| Make v39 `theme.css`                            | `output/design/make-adoption/theme.css`, sha256 `249857a9…`                                         | `PORT_WITH_CONTRACT_PRESERVATION` | Token values port into `src/v5/styles/tokens.css` under FI-01. The file itself stays evidence.                                                 |
| Make v39 route files                            | `output/design/make-adoption/{PublicFlows,LendingHubRoute,ReleaseDeskRoute,RequestCenterRoute}.tsx` | `DESIGN_REFERENCE_ONLY`           | React/TSX. The product is not React. Read for layout, hierarchy, state vocabulary, and copy. Never compile or import.                          |
| Make v36 captures                               | `output/design/make-preservation/*`                                                                 | `ARCHIVE_HISTORICAL`              | Rollback baseline and provenance. Includes the third-party unsaved edit.                                                                       |
| Committed Make subset                           | `prototypes/public-portals-r3/figma-make/**` (3 files)                                              | `DESIGN_REFERENCE_ONLY`           | Working copy of `PublicFlows.tsx`, `StaffAccess.tsx`, `theme-canonical.css`.                                                                   |
| Figma page 15 inferred colours                  | 54 nodes, section 3.1 of the audit                                                                  | `UNVERIFIED`                      | Plausible and legible but not proven original. Figma version history holds the pre-session state. Do not treat as exact.                       |
| Open Figma defects D-02, D-04, D-05, D-07, D-08 | `docs/design/FIGMA_DESIGN_MAKE_AUDIT.md`                                                            | `OWNER_AMENDMENT_REQUIRED`        | D-08 is a HIGH accessibility failure in the design. Resolve before porting the affected surfaces; do not carry the defect into product source. |

Full detail in [FIGMA_MAKE_SOURCE_REGISTER.md](FIGMA_MAKE_SOURCE_REGISTER.md).

## 2. Theme and token generation

| Artifact                                                                                                                  | Classification                    | Destination / rule                                                                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/design/theme-source.mjs` (15,220 B)                                                                              | `PORT_WITH_CONTRACT_PRESERVATION` | Canonical token source. FI-01 decides: adopt the generator into the main toolchain, adapt it, or consult it and hand-author `tokens.css`. Record the decision. |
| `prototypes/shared/hau-theme.css` (7,816 B)                                                                               | `GENERATED_EVIDENCE_ONLY`         | Generated from `theme-source.mjs`. Never hand-edit.                                                                                                            |
| `scripts/design/build-make-theme.mjs` (14,105 B)                                                                          | `DESIGN_REFERENCE_ONLY`           | Generates the Make override. Make-specific; not product tooling.                                                                                               |
| `scripts/design/build-make-routes.mjs` (16,327 B)                                                                         | `DESIGN_REFERENCE_ONLY`           | Same.                                                                                                                                                          |
| `prototypes/public-portals-r3/figma-make/src/styles/theme-canonical.css`                                                  | `GENERATED_EVIDENCE_ONLY`         | Generated override. Reconstructs the v39 delta without Figma.                                                                                                  |
| `scripts/design/verify-make-theme.mjs`, `verify-make-landing-theme.mjs`                                                   | `ADOPT_AS_IS`                     | Cascade verifiers. Keep runnable; they are the proof that v39 is reconstructable.                                                                              |
| `scripts/design/{contrast,overlay-contrast,comfort,keyboard,responsive,semantics}-audit.mjs`                              | `ADOPT_AS_IS`                     | Reusable audit tooling for FI-01 to FI-12 acceptance.                                                                                                          |
| `scripts/design/{build-theme,capture-endpoint,design-tracker,figma-theme-payload,figma-tracker-payload,ladder,serve}.mjs` | `ARCHIVE_HISTORICAL`              | Design-stream tooling. Not needed by integration slices.                                                                                                       |
| `src/v5/styles/*` on **main**                                                                                             | `PORT_WITH_CONTRACT_PRESERVATION` | This is the live token/style layer. FI-01 edits here.                                                                                                          |
| `output/design/figma-theme-payload.json`                                                                                  | `GENERATED_EVIDENCE_ONLY`         |                                                                                                                                                                |

## 3. Prototypes

| Artifact                                                                  | Files | Classification             | Reason                                                                                                                            |
| ------------------------------------------------------------------------- | ----- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `prototypes/impeccable-whole-site-redesign-v5/`                           | 34    | `DESIGN_REFERENCE_ONLY`    | The v5 visual language. **Superseded as source**: main already promoted v5 to `src/v5/`. Consult for intent only; edit `src/v5/`. |
| `prototypes/public-portals-r3/`                                           | 10    | `DESIGN_REFERENCE_ONLY`    | Public portal R3 direction plus the committed Make subset.                                                                        |
| `prototypes/shared/`                                                      | 8     | `DESIGN_REFERENCE_ONLY`    | Shared theme evidence.                                                                                                            |
| `prototypes/impeccable-whole-site-redesign-v4/`                           | 36    | `OBSOLETE_FOR_FROZEN_V083` | v4 / v4.1 / v4.2 direction, superseded by v5.                                                                                     |
| `prototypes/impeccable-whole-site-redesign-v3/`                           | 24    | `OBSOLETE_FOR_FROZEN_V083` |                                                                                                                                   |
| `prototypes/impeccable-whole-site-redesign-v2/`                           | 23    | `OBSOLETE_FOR_FROZEN_V083` |                                                                                                                                   |
| `prototypes/impeccable-whole-site-redesign/`                              | 20    | `OBSOLETE_FOR_FROZEN_V083` | v1.                                                                                                                               |
| `prototypes/**/data.js`, registry fixtures, state/role/viewport selectors | —     | `DO_NOT_MIGRATE`           | Fixture actors, counts, statuses, and preview chrome must never reach a user-facing surface.                                      |

## 4. Application source

| Path                                                                                                                   | On main?                            | Classification                    | Destination / rule                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------- | --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/v5/src/**`                                                                                                        | yes                                 | `PORT_WITH_CONTRACT_PRESERVATION` | Surfaces, components, shell, registry. Visual work lands here.                                                                                                                                                          |
| `src/v5/styles/**`                                                                                                     | yes                                 | `PORT_WITH_CONTRACT_PRESERVATION` | Tokens, base, shell, components, surfaces, motion, responsive, v3/v4/v5 layers.                                                                                                                                         |
| `src/v5/integration/**`                                                                                                | yes, **absent on branch**           | `ADOPT_AS_IS`                     | The adapter boundary. Do not restructure during a visual slice. Restoring these 8 files is part of FI-00.                                                                                                               |
| `src/v5/src/data/mock.js`                                                                                              | yes                                 | `DO_NOT_MIGRATE` as runtime data  | Illustrative rows only. `clearBackendViewModels()` exists to keep them out of connected surfaces. Keep that call.                                                                                                       |
| `src/visual/**` on **main** (32 files)                                                                                 | yes                                 | `ADOPT_AS_IS`                     | Legacy visual runtime that still ships. Not a visual-slice target. Changing it is a routing/behavior change.                                                                                                            |
| `src/visual/**` deltas on **this branch**                                                                              | branch-only                         | `DO_NOT_MIGRATE`                  | Pre-v0.8.3 integration source. Main's version is authoritative.                                                                                                                                                         |
| `src/styles/**` deltas on **this branch**                                                                              | branch-only                         | `RECONCILE_BEFORE_PORT`           | Includes `v0-7-2-r2.css`-era work. Extract a rule only through an explicit FI slice.                                                                                                                                    |
| `src/app/**`, `src/auth/**`, `src/components/**`, `src/domain/**`, `src/services/**`, `src/server/**`, `src/worker/**` | yes                                 | `ADOPT_AS_IS`                     | Behavior. Out of scope for every visual slice.                                                                                                                                                                          |
| `src/index.html`                                                                                                       | yes                                 | `PORT_WITH_CONTRACT_PRESERVATION` | Stylesheet order and the direction-contract comment. FI-01 touches it.                                                                                                                                                  |
| `migrations/**`                                                                                                        | yes, 0031+0032 **absent on branch** | `ADOPT_AS_IS`                     | Never rerun, never rewrite, never author a new one in a frontend slice. Restoring 0031/0032 is part of FI-00.                                                                                                           |
| `src/components/**` shared primitives                                                                                  | yes                                 | `PORT_WITH_CONTRACT_PRESERVATION` | `data-table`, `drawer`, `modal`, `pagination`, `status-chip`, `uploader`, `mobile-navigation`, `autocomplete`, `overflow-menu`, `inline-error`, `mobile-card-list`, `app-shell`. **Reuse these; do not recreate them.** |

## 5. Documentation

| Artifact                                                                                                                                             | Classification                                                                         | Rule                                                                                                       |
| ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `docs/design/FIGMA_BASELINE_REGISTER.md`                                                                                                             | `ADOPT_AS_IS`                                                                          | Append-only baseline register. Add a row per verified baseline.                                            |
| `docs/design/FIGMA_DESIGN_MAKE_AUDIT.md`                                                                                                             | `ADOPT_AS_IS`                                                                          | Audit of record, including the open defects and the two incidents.                                         |
| `docs/design/FIGMA_MAKE_ADOPTION_PACKET.md`                                                                                                          | `ARCHIVE_HISTORICAL`                                                                   | Applied. Kept as the rollback reference.                                                                   |
| `docs/design/V083_FRONTEND_DESIGN_ADOPTION_INTAKE.md`                                                                                                | `ADOPT_AS_IS`                                                                          | Phase 9 classification. Its "future starting boundary" is superseded by Earl's 2026-08-21 branch decision. |
| `docs/design/V083_TO_FRONTEND_INTEGRATION_MAP.md`                                                                                                    | `ADOPT_AS_IS`                                                                          | Phase 9 guardrails. Still correct.                                                                         |
| `docs/design/V5_TO_PRODUCTION_FRONTEND_TRANSFER_MAP.md`                                                                                              | `RECONCILE_BEFORE_PORT`                                                                | Written against v0.7.2. Route and field lists must be revalidated against v0.8.3 before reuse.             |
| `docs/design/V5_PRODUCTION_FUNCTIONAL_PARITY.md`, `V5_PRODUCTION_VISUAL_ACCEPTANCE.md`                                                               | `ARCHIVE_HISTORICAL`                                                                   | Historical candidate acceptance. Not v0.8.3 acceptance.                                                    |
| `docs/design/V5_REFERENCE_DEFECT_CORRECTIONS.md`                                                                                                     | `DESIGN_REFERENCE_ONLY`                                                                |                                                                                                            |
| `docs/design/DESIGN_EXECUTION_TRACKER.md`                                                                                                            | `ARCHIVE_HISTORICAL`                                                                   | The 97% figure is a design-stream number, not a v0.8.3 product acceptance claim.                           |
| `docs/design/IMPECCABLE_SURFACE_MATRIX.md`, `IMPECCABLE_REDESIGN_DECISIONS.md`, `IMPECCABLE_REFERENCE_ANALYSIS.md`, `HALLMARK_IMPECCABLE_CLOSURE.md` | `DESIGN_REFERENCE_ONLY`                                                                | Decision records.                                                                                          |
| `docs/design/IMPECCABLE_V2_*`, `IMPECCABLE_V3_*`, `IMPECCABLE_V4_*`, `V4_1_*`                                                                        | `OBSOLETE_FOR_FROZEN_V083`                                                             | Superseded direction. History only.                                                                        |
| `docs/design/ACCESSIBILITY_ACCEPTANCE.md`                                                                                                            | `ADOPT_AS_IS`                                                                          | Reusable accessibility criteria.                                                                           |
| `docs/design/PRODUCTION_FRONTEND_PARITY_BASELINE.md`, `PRODUCTION_PORTAL_PARITY_AUDIT.md`                                                            | `OBSOLETE_FOR_FROZEN_V083`                                                             | Written against an older production baseline.                                                              |
| `DESIGN.md` (1,555 lines)                                                                                                                            | `ADOPT_AS_IS`                                                                          | Design authority (D-numbered decisions). D09 typography and D12 theme rules bind FI-01.                    |
| `docs/design/CODEX_FRONTEND_DESIGN_HANDOFF.md`                                                                                                       | `ARCHIVE_HISTORICAL` below the "Historical 2026-08-20" heading; `ADOPT_AS_IS` above it | The v0.7.2 functional baseline in the historical body is not current authority.                            |
| `docs/design/references/`                                                                                                                            | `DESIGN_REFERENCE_ONLY`                                                                |                                                                                                            |
| Main-only `docs/design/{USC_DESIGN_DNA,PROPOSED_DESIGN_SYSTEM,MODULE_REDESIGN_PLAN,REFERENCE_MATRIX,DESIGN_RESEARCH_HANDOFF}.md`                     | `DESIGN_REFERENCE_ONLY`                                                                | v0.8.1 design-gate research. Reconcile against the v5/Make direction before citing.                        |

## 6. Generated output — never source

All `GENERATED_EVIDENCE_ONLY`. Never hand-edit; regenerate from accepted source
with the repository's own scripts.

```text
dist/                                        build output (vite + create-v5-shareable)
output/design/**                             948 files, 134,737,146 bytes, 904 PNGs
  make-adoption/       v39 adopted source        keep: this is the Make recovery path
  make-preservation/   v36 captures + rollback   keep: provenance
  v5-production-acceptance/                      screenshot evidence
  acceptance/                                    width/dark/200% matrix
  impeccable-redesign-*                          historical previews and shots
  theme-refine-*                                 historical theme evidence
  figma-after/, backups/                         historical
HAU-USC_Logistics-Prototype-Shareable.html   generated standalone
hau-usc-logistics-guided-demo.html           generated demo
shareable-html-modules/                      7 generated module shareables
sites-preview/, legacy/                      historical publication artifacts
apps-script/                                 generated Apps Script split bundle
playwright-report/, test-results/            test output
```

Regeneration commands: `npm run build`, `npm run build:legacy-artifacts`,
`npm run verify:dist`, `npm run check:apps-script`.

## 7. DO_NOT_MIGRATE — with reasons

| Item                                                                                                        | Why                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Branch `src/visual/*` and `src/styles/*` deltas                                                             | Predate v0.8.3. Main's versions carry the identity-foundation and access work. Copying them back regresses behavior.                |
| Generated `dist/`, shareable HTML, guided demo, Apps Script bundle                                          | Build output. Copying it into source breaks the source-to-generated pipeline and cannot be reviewed.                                |
| `output/design/**` screenshots and previews                                                                 | Evidence, not code. 134.7 MB. Nothing in it is compilable product source.                                                           |
| Prototype registry fixtures, `mock.js` rows, preview/state/role/viewport selectors, fake counts and metrics | A user-facing surface must render server truth. A fixture that reaches production is a data-integrity incident, not a cosmetic one. |
| Make `.tsx` route files as code                                                                             | The product is vanilla ES modules, not React. Importing them would add a framework and a build path that nothing else uses.         |
| `public.register` as a working feature                                                                      | Classified `PROTOTYPE_ONLY_UNSUPPORTED` on frozen main. No registration endpoint exists. Building one is a backend change.          |
| Any backend, API, auth, capability, status, migration, or provider change implied by a design               | Out of scope by construction. Route to `OWNER_AMENDMENT_REQUIRED`.                                                                  |
| Remote font loading (`fonts.googleapis.com`, prototype defect P-02)                                         | `DESIGN.md` D09 forbids remote fonts without an accepted performance/privacy decision; D30 registers bundled `.woff2`.              |
| Historical branch `package.json` / tooling edits                                                            | Main's toolchain is the frozen one. A dependency change needs its own owner decision and security review.                           |

## 8. OWNER_AMENDMENT_REQUIRED

Stop and obtain an accepted specification or amendment for any of these.

1. Promotion of branch-only design evidence into `main` — see START_HERE §7.2
   (1,170 files, 138.8 MB, of which 134.7 MB is PNG evidence).
2. Figma defect **D-08** (HIGH): 17 landing-hero text nodes fail WCAG 2.2 AA,
   measuring 1.01:1 to 1.84:1. The design may encode an intentional
   active/inactive distinction; the fix is a design decision, not a mechanical
   recolour.
3. Figma defect **D-04**: three conflicting typeface realities — Production
   Georgia + Aptos, `DESIGN.md` D09 Bricolage/Plex/Newsreader, Figma Inter.
   FI-01 cannot proceed without a decision.
4. Figma defect **D-02**: the blur ladder is defined twice with 1.22× to 1.33×
   drift between variables and effect styles.
5. Any design proposal that alters a route, field, workflow, status,
   authorization rule, or public/private data boundary.
6. Any new runtime dependency, including a font, icon set, animation library, or
   framework.
7. A new Figma read, if and only if a slice needs evidence absent from the
   durable v39 receipt or identifies a post-v39 delta.
8. Deployment, provider write, migration, or Production change.

## 9. UNVERIFIED

| Item                                         | Why                                                                                                                                                                                                                                   | How to resolve                                                                                                            |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Live Figma Design page count                 | A read-only `get_metadata` probe on 2026-08-21 returned only page `0:1` "00 — Capture Index", where the durable audit records 28 pages. Consistent with the desktop bridge exposing a single loaded page; **not** evidence of change. | Open the file in Figma and re-list pages, or accept `DESIGN_BASELINE_2026-08-20-F` as the durable baseline.               |
| Live Figma Make version                      | No MCP tool can read a `/make/` URL. v39 is asserted from the saved-document hash recorded on 2026-08-20.                                                                                                                             | The Git register reproduces v39 deterministically; a live re-check needs a browser session.                               |
| 54 inferred colours on Figma page 15         | Restored by inference after the 2026-08-19 sweep incident.                                                                                                                                                                            | Compare against Figma version history if exactness matters.                                                               |
| `RequestCenterRoute.tsx` original authorship | The edit pending when the design stream opened was not ours.                                                                                                                                                                          | Byte-exact rollback baseline preserved at `output/design/make-preservation/RequestCenterRoute.unsaved.tsx` (`4087473c…`). |
| Post-v39 Make drift                          | Not checkable from here.                                                                                                                                                                                                              | Reload the Make file and re-hash `src/styles/theme.css`; if it is not `249857a9…`, the file moved on.                     |

## STALE_IF

Re-run this classification if any of the following changed:

```text
git diff --name-status origin/main frontend-design-integration     (structure)
prototypes/**  output/design/make-*  scripts/design/**             (design sources)
docs/design/FIGMA_BASELINE_REGISTER.md                             (new baseline row)
docs/design/FIGMA_DESIGN_MAKE_AUDIT.md                             (defect status)
DESIGN.md                                                          (D-decisions)
src/v5/**                                                          (port target moved)
```
