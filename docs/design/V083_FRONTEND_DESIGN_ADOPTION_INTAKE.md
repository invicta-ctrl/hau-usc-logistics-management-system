# v0.8.3 Frontend Design Adoption Intake

```text
DOCUMENT_STATUS: COMPLETE
OWNER_SCOPE:      2026-08-21 v0.8.3 fast-close Phase 9
DESIGN_BRANCH:    frontend-design-integration
DESIGN_BASE_SHA:  19232a20d7a5d2c1e4aed6494b17fba4612f6720
DESIGN_EVIDENCE:  5677bbf3d279ae6eb8b963ff42fb39a4a46e3fa1
FINAL_MAIN:       86553349f5c2ebefaa637c30828c560a301f99ba
FROZEN_PRODUCT:   f8e63372bc8afcb6d092970b7f9fc9ee72fd3580
FUNCTIONAL_BASELINE: FINAL_V083_MAIN
VISUAL_BASELINE:   DESIGN_BASELINE_2026-08-20-F + Figma Make v39 + retained branch evidence
FRONTEND_IMPLEMENTATION: NOT_STARTED
DEPLOY:            NOT_AUTHORIZED
```

## Authority and direction

Final v0.8.3 main and the reconciled Production contract are authoritative for
behavior, routes, APIs, authorization, authentication, data, privacy,
migrations, recovery, and release state. The frozen candidate remains the
application-identity reference. The Figma Design baseline, Figma Make v39, and
the retained frontend branch are visual/reference authority only.

If a visual reference conflicts with final v0.8.3 behavior, the final product
contract wins. Future work adapts the visual treatment; it does not remove,
weaken, invent, or infer functionality.

The v39 atrium change is not Figma-only: the branch contains its deterministic
generator and canonical override, plus a saved-source hash receipt, cascade
verification record, and rollback evidence. No Figma read, write, redesign, or
new capture was needed for this intake.

## Durable evidence reconciled

| Evidence                                                                                                         | Verified role                                                                      | Intake disposition                                     |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------ |
| `docs/design/FIGMA_BASELINE_REGISTER.md`                                                                         | Frozen `DESIGN_BASELINE_2026-08-20-F`, historical completion and decision register | Design reference; preserve unchanged                   |
| `docs/design/FIGMA_DESIGN_MAKE_AUDIT.md`                                                                         | Figma Make v39 saved-source receipt, MK-06 closure, and cascade result             | Design reference; no provider action                   |
| `scripts/design/theme-source.mjs` + `prototypes/shared/hau-theme.css`                                            | Canonical theme source and generated CSS evidence                                  | Candidate token source; port only under a future spec  |
| `scripts/design/build-make-theme.mjs` + `prototypes/public-portals-r3/figma-make/src/styles/theme-canonical.css` | Reconstructable v39 scoped-atrium representation                                   | Reference and controlled port source, not runtime code |
| `prototypes/impeccable-whole-site-redesign-v5/`                                                                  | Modular visual language, shell, controls, motion, and responsive reference         | Visual reference only                                  |
| `docs/design/V5_TO_PRODUCTION_FRONTEND_TRANSFER_MAP.md` and parity reports                                       | Historical route/field/action mapping and visual acceptance                        | Reconcile against final v0.8.3 before reuse            |
| `output/design/v5-production-acceptance/` and preserved Make artifacts                                           | Screenshot and rollback evidence                                                   | Evidence only; never ship or hand-edit                 |
| `docs/design/IMPECCABLE_*`, `DESIGN.md`, tracker, and adoption packet                                            | Decisions, known limits, and historical verification                               | Decision/reference record only                         |

The design tracker’s historical percentage is not a v0.8.3 product acceptance
claim. Its screenshot and test records remain useful evidence, but a future
implementation must run its own focused acceptance against the final product.

## Adoption classification

| Classification                    | Assets or surfaces                                                                                                                                       | Rule                                                                                      |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `ADOPT_AS_IS`                     | Intake, mapping, decision, baseline, audit, screenshot, and rollback documents                                                                           | Retain as documentation/evidence; do not recast them as runtime proof                     |
| `PORT_WITH_CONTRACT_PRESERVATION` | Canonical tokens, typography, surface hierarchy, responsive patterns, keyboard/focus patterns, shell composition, visual loading/error/denied treatments | Reimplement only in final-main frontend modules while preserving contract behavior        |
| `RECONCILE`                       | Public portals, authenticated shell, workspace navigation, Request/Lending/Release/Inventory workflows, Account/Directory/Activity History surfaces      | Map final v0.8.3 fields, actions, capabilities, states, and errors before any visual port |
| `DESIGN_REFERENCE_ONLY`           | Figma Design, Figma Make v39, prototypes, preview fixtures, screenshots, Make preservation copies, historic visual metrics                               | Use to guide appearance and acceptance; never as live behavior or source-of-truth data    |
| `OBSOLETE_FOR_CURRENT_V083`       | v0.7.2 production baseline statements, v4/v4.1/v4.2 task pointers, historical preview routing assumptions                                                | Preserve as history only; do not use as implementation authority                          |
| `DO_NOT_MIGRATE`                  | Old branch `src/visual` integration source, generated `dist`/shareable artifacts, preview/demo chrome, fixture data, historical package/tooling changes  | Do not merge, copy wholesale, or hand-edit into final main                                |
| `OWNER_AMENDMENT_REQUIRED`        | Any backend/API/auth/data/route semantic change, provider or Figma write, unknown visual source, dependency addition, deployment, or Production change   | Stop and obtain a new explicit accepted specification/amendment                           |

## Future starting boundary

Start a future implementation in a new isolated worktree from final
`origin/main@86553349f5c2ebefaa637c30828c560a301f99ba` (or its verified
successor with frozen-product parity preserved). Do not use this historical
frontend branch as an implementation base, and do not merge or rebase it into
main.

The future task must declare an explicit branch, worktree, contract-slice
scope, visual slice, rollback commit, targeted acceptance, and owner-approved
deployment boundary. Suggested scope is one contract-complete surface at a
time, rather than a wholesale visual transfer.

## Owner decisions required before implementation

1. Select the first final-v0.8.3 route/surface slice and its visual target.
2. Confirm whether any historical design proposal would alter an existing
   route, field, workflow, status, authorization, or public/private boundary.
3. Decide whether a new Figma read is required only if the future task needs
   evidence absent from the durable v39 receipt or identifies a post-v39 delta.
4. Approve any dependency, generated-artifact, browser-verification, or visual
   acceptance expansion beyond the future accepted slice.
5. Give a separate deployment authority only after an implementation candidate
   has passed its exact contract and visual acceptance.

## Readiness criteria for a future adoption specification

- Final-main route, service, authorization, data, and error contracts are
  mapped for the chosen slice.
- The selected visual evidence is classified above and has no unclassified
  Figma-only source dependency.
- The implementation starts from final main, not from an old product or
  preview branch.
- Generated output is reproducible from accepted source; no generated asset is
  hand-edited or copied as implementation.
- The proposal preserves CSRF/session/authentication boundaries, capability
  enforcement, public-data minimization, identity and Activity History
  invariants, and schema/recovery state.
- Rollback is a normal Git revert/branch action; Production, provider, and
  Figma mutations remain separately gated.

## Current stop boundary

This intake is documentation-only. It does not authorize frontend code,
generated artifacts, tests, Figma changes, provider access, deployment, or
Production mutation.

```text
FRONTEND_DESIGN_ADOPTION_INTAKE: COMPLETE
FUNCTIONAL_BASELINE: FINAL_V083_MAIN
FRONTEND_IMPLEMENTATION: NOT_STARTED
DEPLOY: NOT_AUTHORIZED
READY_FOR_FRONTEND_ADOPTION_SPEC_REVIEW: TRUE
```
