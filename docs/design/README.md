# Design documentation index

Forty files live here, spanning five design generations. This index says
which one owns each question **now**, so nobody has to guess whether
`IMPECCABLE_V3_VISUAL_SYSTEM.md` or `V5_PRODUCTION_VISUAL_ACCEPTANCE.md` is the
live answer.

## Nothing was deleted or moved, deliberately

The obvious consolidation is to archive the superseded generations. It was not
done, and the reason matters: `.codex/specs/active/v0.7.3-frontend-design-integration.md`
is an **accepted specification** that references these paths, as do five
prototype READMEs and three `.codex` handoff records. Moving files would break
authority links to keep a directory tidy. Status is declared here instead.

## Current authority

| Question | Owner |
|---|---|
| **Handoff to the next agent** | [CODEX_FRONTEND_DESIGN_HANDOFF.md](CODEX_FRONTEND_DESIGN_HANDOFF.md) — the single implementation/adoption handoff. Read it before anything else in this directory |
| **Reproducing the Make landing in the product** | [CODEX_LANDING_REPRODUCTION_HANDOFF.md](CODEX_LANDING_REPRODUCTION_HANDOFF.md) — hero environment, the scrim contrast model, atrium pinning and page structure. Source is committed under `output/design/make-landing/`; no external asset is needed. Paired executable prompt: [CODEX_LANDING_REPRODUCTION_PROMPT.md](CODEX_LANDING_REPRODUCTION_PROMPT.md) |
| Overall design authority — tokens, components, module rules, D-sections | `../../DESIGN.md` |
| **Progress and completion** | [DESIGN_EXECUTION_TRACKER.md](DESIGN_EXECUTION_TRACKER.md) — the only file permitted to state a percentage, and it is derived, never typed |
| Production contracts for all five request/lending surfaces, and every drift entry | [PRODUCTION_PORTAL_PARITY_AUDIT.md](PRODUCTION_PORTAL_PARITY_AUDIT.md) |
| Figma file and Make file state, defects D-01…D-08, incident record | [FIGMA_DESIGN_MAKE_AUDIT.md](FIGMA_DESIGN_MAKE_AUDIT.md) |
| **Figma Make theme adoption — the patch, the v36 hashes, why it is not applied** | [FIGMA_MAKE_ADOPTION_PACKET.md](FIGMA_MAKE_ADOPTION_PACKET.md) — deterministic. Read it before touching the Make file, because it also records an unsaved third-party edit that a whole-project save would sweep in |
| Named Figma baselines and token register | [FIGMA_BASELINE_REGISTER.md](FIGMA_BASELINE_REGISTER.md) |
| **Theme, surface ladders, background environment and Institutional Glass** | `../../DESIGN.md` **D41** — BINDING. Generated from `scripts/design/theme-source.mjs`; do not edit the emitted CSS |
| Visual comfort, and text over imagery | `npm run design:comfort` and `npm run design:overlay`. Comfort is this project's own bar, not WCAG, and it exists because an interface can pass every contrast pair and still be unpleasant to sit in front of |
| Responsive matrix and paint cost | `npm run design:responsive` — 8 widths, overflow, glass clipping and blur budget in one pass |
| **WCAG 2.2 AA acceptance for the public portals** | [ACCESSIBILITY_ACCEPTANCE.md](ACCESSIBILITY_ACCEPTANCE.md) — contrast is measured by `scripts/design/contrast-audit.mjs`, not asserted |
| Hallmark and Impeccable closure passes | [HALLMARK_IMPECCABLE_CLOSURE.md](HALLMARK_IMPECCABLE_CLOSURE.md) |
| Production front-end parity baseline | [PRODUCTION_FRONTEND_PARITY_BASELINE.md](PRODUCTION_FRONTEND_PARITY_BASELINE.md) |
| V5 functional parity, visual acceptance, transfer map, defect corrections | the four `V5_*.md` files |
| Implemented visual world | `prototypes/impeccable-whole-site-redesign-v5/` |
| Implemented public portals + Institutional Glass ladder | `prototypes/public-portals-r3/` |

Where an older file disagrees with one of the above, **the above wins**.

## Superseded generations — reference only

Kept as evidence of how the direction arrived where it did. Do not treat any of
these as current, and do not extend them.

| Generation | Files | Superseded by |
|---|---|---|
| v1 — original Impeccable pass | `IMPECCABLE_WHOLE_SITE_REDESIGN_BRIEF.md`, `IMPECCABLE_REDESIGN_DECISIONS.md`, `IMPECCABLE_REFERENCE_ANALYSIS.md`, `IMPECCABLE_SURFACE_MATRIX.md` | v2 |
| v2 | five `IMPECCABLE_V2_*.md` | v3 |
| v3 | six `IMPECCABLE_V3_*.md` | v4 |
| v4 and v4.1 | five `IMPECCABLE_V4_*.md`, `IMPECCABLE_V4_1_FEEDBACK_AMENDMENT.md`, six `V4_1_*.md` | V5 |

Two of these still carry material the current generation has not restated, and
they are worth reading before redoing that work: `IMPECCABLE_V3_EXTERNAL_DESIGN_DNA.md`
holds the external reference research, and `V4_1_VS_PRODUCTION_COMPARISON.md`
records which production behaviours were judged better than the redesign and
kept.

## The rule that keeps this index honest

A new design document is only worth creating when no file above owns the
question. Otherwise update the owner. Five generations of parallel documents is
how the file count reached thirty-eight, and it is why a reader could not tell
which visual system was live without opening nine files.
