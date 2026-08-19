# Design documentation index

Thirty-eight files live here, spanning five design generations. This index says
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
| Overall design authority — tokens, components, module rules, D-sections | `../../DESIGN.md` |
| **Progress and completion** | [DESIGN_EXECUTION_TRACKER.md](DESIGN_EXECUTION_TRACKER.md) — the only file permitted to state a percentage, and it is derived, never typed |
| Production contracts for all five request/lending surfaces, and every drift entry | [PRODUCTION_PORTAL_PARITY_AUDIT.md](PRODUCTION_PORTAL_PARITY_AUDIT.md) |
| Figma file and Make file state, defects D-01…D-08, incident record | [FIGMA_DESIGN_MAKE_AUDIT.md](FIGMA_DESIGN_MAKE_AUDIT.md) |
| Named Figma baselines and token register | [FIGMA_BASELINE_REGISTER.md](FIGMA_BASELINE_REGISTER.md) |
| **WCAG 2.2 AA acceptance for the public portals** | [ACCESSIBILITY_ACCEPTANCE.md](ACCESSIBILITY_ACCEPTANCE.md) — contrast is measured by `scripts/design/contrast-audit.mjs`, not asserted |
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
