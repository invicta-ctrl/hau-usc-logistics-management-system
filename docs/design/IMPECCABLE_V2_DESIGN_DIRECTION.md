# Impeccable v2 — Design Direction

**Kinetic Institutional Operations**

Status: proposed v0.8.0 visual baseline. Not a v0.7.2 amendment.
Implemented by `prototypes/impeccable-whole-site-redesign-v2/`.
Supersedes the v1 direction (*Institutional Operations Editorial*) where the two
conflict; v1 remains frozen and is preserved for comparison.

---

## Thesis

*Custody is the product; the interface is the ledger's manners — and it now has
a pulse.*

v1 was right about structure and wrong about presence. It fixed the reference's
card-wall by subtracting, and never added anything back to carry hierarchy.
v2 keeps every structural decision and restores the visual authority.

Energy target: **~4/10 → ~7.5/10.** Bolder, more modern, more premium, still a
university logistics operations system.

## What produces the boldness

Boldness here comes from composition, typography, depth, and motion — not from
gradients, glass, glow, or colour noise.

| Device | v1 | v2 |
|---|---|---|
| **Surface ladder** | `--canvas` and `--paper` 1.5% apart in luminance | ground → surface → raised → overlay, a real figure/ground relationship in both themes |
| **Elevation** | two levels; panels flat | three-step ladder; queues and detail panes are working surfaces that sit above the ground |
| **Type** | section heads 17px, metrics 32px | section heads 20px in the display serif, attention values 44px |
| **Brand colour** | rail gradient + primary buttons only | anchor, accent, and rule tokens used *in content*: section rules, detail-head wash, selected-row spine, active tab |
| **Composition** | equal-width grids everywhere | asymmetric overview rails, a full-width lead action on the portal, dominant queue vs subordinate detail |
| **Motion** | none beyond hover colour | a documented system carrying navigation, state, completion, and disclosure |
| **Theme control** | two text buttons in preview chrome | a real product control with an animated sun↔moon transform |

## Light mode

Warm, crisp, energetic. A sunken warm-sand ground (`#e9e0d0`) with white paper
working surfaces, so panels genuinely sit *on* something. Oxblood appears as a
compositional device — a 56px rule under each section heading, a wash behind the
detail header, a spine on the selected row. Gold is a real highlight, not just a
focus artefact.

Explicitly not beige-on-beige: the ground/surface luminance gap is ~20% relative,
against v1's 1.5%.

## Dark mode

Designed, not inverted — and re-ordered. In v1 the rail (`#8e3038 → #6f171d`)
was *lighter* than the content ground, so navigation advanced and content
receded. v2 orders luminance **ground (`#100b0c`) < rail (`#2c1013 → #180a0c`) <
surface (`#1f1719`)**, so content sits above its ground and the rail reads as
structure.

Deep warm foundation, burgundy structural surfaces, warm off-white text, gold
highlights. No pure black, no neon, no red-on-near-black, no blur stacks.

## Typography

Georgia carries more of the hierarchy in v2: page titles, section headings, the
attention numerals, detail titles, and the portal lead action. The humanist
system stack carries everything operational. Weight 900 remains reserved for
numerals.

## Icons

Unchanged and non-negotiable: one family, `24×24`, `stroke-width: 1.8`, round
caps and joins, **one brand ink per theme**. Status meaning stays in labelled
chips.

The sun/moon toggle is the single sanctioned exception — it uses the gold accent
because the glyph *is* the theme state, and it is drawn in the same system.

## What v2 preserves from v1

Every structural and safety property:

- queue + split-pane detail as the default operational shape;
- semantic tables with focusable rows and column priority (status and quantity
  survive every breakpoint);
- five status tones, never twenty-one; colour never travels alone;
- truthful unknowns and illustrative-data labelling;
- public surfaces simpler and narrower than internal ones;
- the full accessibility baseline;
- container-query responsiveness, so the preview's width switcher reflows the
  real layout.

## Anti-slop guard

Not present, and must not appear: purple/blue SaaS gradients, glassmorphism,
neon glow, gradient text, decorative charts, pill spam, oversized radii, hero
sections inside authenticated workspaces, fake AI widgets, emoji icons, mixed
icon colour.

One anti-pattern was introduced during v2 and removed after the detector caught
it: a 4px oxblood stripe down the edge of the attention band — a stock AI-UI
tell. The band now earns its anchor role through elevation, the display-serif
numerals, and the alert-toned urgent cell.
