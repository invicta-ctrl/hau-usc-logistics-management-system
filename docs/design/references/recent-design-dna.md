<!-- Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V5 -->

# Recent.design design DNA

## Study record

- Source: [Recent.design](https://recent.design/)
- Observed: 2026-08-10 at a fixed 1280 × 720 viewport.
- Interaction tested: the `3D` category was selected; the URL became `?category=3d`, the control exposed `aria-pressed=true`, and the feed retained 20 current results.
- Mode: public-reference study; no assets, media, markup, or code copied.
- Responsive limitation: no viewport emulation was available.

## Required schema coverage

| Prompt axis                                        | Report section                                 |
| -------------------------------------------------- | ---------------------------------------------- |
| A — Product character                              | Product character                              |
| B and H — Macrostructure and information hierarchy | Structure and hierarchy                        |
| C–F — Spacing, typography, color, and surface DNA  | Rhythm, type, color, and surfaces              |
| G — Component archetypes                           | Component archetypes                           |
| I and J — Interaction and motion DNA               | Interaction and motion                         |
| K — 3D/spatial DNA                                 | 3D and spatial treatment                       |
| L–N — Responsive, accessibility, and performance   | Accessibility, responsiveness, and performance |
| O — Transferable principles                        | KEEP / MODIFY / REJECT and USC transfer        |

## Product character

Recent.design is an editorial discovery feed with a persistent taxonomy. Its character comes from constant orientation: a left navigation spine, clear category chips, a recency sort, source attribution, and a dense but visually varied feed. The feed feels alive because the items differ in size and media—not because the shell animates excessively.

## Structure and hierarchy

1. Persistent left navigation and product identity.
2. Main “Design” feed with category controls.
3. Sort and result context.
4. Variable-height/masonry editorial items with source attribution and save controls.
5. Contextual jobs or supporting panels inside the larger feed.

The persistent category spine and URL-backed filter state are transferable. The masonry feed is not appropriate for transactional records because it prevents reliable scanning and row comparison.

## Rhythm, type, color, and surfaces

- Rhythm: dense, irregular editorial sequence balanced by a stable left rail.
- Type: compact utilitarian shell labels around media-forward content.
- Color: neutral shell lets source work provide color.
- Surfaces: source items have minimal chrome and variable aspect ratios.
- Density: high, but category and source labels preserve orientation.

## Component archetypes

- Persistent category navigation.
- URL-backed filter chip.
- Recent/popular sort.
- Masonry editorial tile.
- Source attribution.
- Save/bookmark control.
- Inline contextual panel.

## Interaction and motion

Filtering updated the route and selected state without turning the category into transient browser-only state. That is the most useful behavior. USC filters should similarly survive refresh and be shareable when privacy permits, but server authorization must be reapplied on every load.

## 3D and spatial treatment

3D is a content category, not part of the shell. This separation is useful: spatial material can be discoverable without requiring the entire product to become spatial.

## Accessibility, responsiveness, and performance

- `aria-pressed` on category controls is a strong pattern.
- Filter state should be present in visible text and the route, with a clear all/reset action.
- Masonry reflow can make keyboard/spatial order confusing; USC operational lists should keep DOM and visual order aligned.
- Media-heavy feeds need lazy loading and reserved dimensions; operational content should render without media.
- A left rail must collapse into a labeled drawer or tabs on narrow screens; this was not reproduced in the fixed viewport.

## Hallmark diagnosis

| Field           | Diagnosis                                                          |
| --------------- | ------------------------------------------------------------------ |
| Character       | Fresh editorial feed anchored by persistent taxonomy               |
| Macrostructure  | Navigation spine + filterable mixed-media stream                   |
| Hierarchy       | Category and source context around variable editorial emphasis     |
| Distinctiveness | Stable orientation despite a visually irregular feed               |
| Risk            | Masonry and novelty ranking make operational comparison unreliable |

## KEEP / MODIFY / REJECT

**KEEP**

- Persistent module/category orientation.
- URL-backed, programmatically selected filters.
- Clear source/owner attribution.
- Variable emphasis for overview storytelling.

**MODIFY**

- Use variable composition only in overviews and public editorial announcements.
- Translate source attribution into owner, committee, revision, and evidence provenance.
- Convert the left taxonomy into responsive rail/drawer/tabs using the existing route registry.

**REJECT**

- Masonry for queues, inventory, audit, or ledger history.
- Recency/popularity as the only prioritization rule.
- Infinite inspiration-feed behavior in task modules.
- Media-dependent record identity.

## USC transfer

Recent.design should influence persistent orientation, filter state, and the public announcement/overview rhythm. It should not influence the shape of transactional data lists.
