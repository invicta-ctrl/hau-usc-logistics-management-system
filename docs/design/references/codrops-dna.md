<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 -->

# Codrops design DNA

## Study record

- Sources: [Codrops](https://tympanus.net/codrops/), the observed [infinite GSAP gallery tutorial](https://tympanus.net/codrops/2026/07/30/building-an-infinite-gsap-scroll-gallery-with-parallax-and-flip-transitions/), and [Codrops licensing](https://tympanus.net/codrops/licensing/).
- Observed: 2026-08-10 at a fixed 1280 × 720 viewport.
- Mode: public-reference study; no demo, asset, markup, article text, or code copied.
- License boundary: Codrops states downloadable demos use MIT unless a demo says otherwise; article and asset terms are separate. This task reuses only design principles.

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

Codrops is an editorial laboratory. Its homepage pairs an irregular, magazine-like information rhythm with strong categorical clarity. Its tutorials then reveal the mechanics behind effects. That combination—expressive composition plus implementation literacy—is more valuable than any single animation.

The observed gallery tutorial was candid about its mechanism: GSAP Observer, Flip, SplitText, infinite wheel/touch traversal, per-item parallax, reveal, and a morph into detail. It also disabled native overflow and touch behavior. That makes it an excellent source for both adoption and rejection criteria.

## Structure and hierarchy

1. Editorial masthead and category navigation.
2. Varied feature modules with different spans and media emphasis.
3. Article detail with narrative, live result, implementation explanation, and code.
4. Related explorations and source attribution.

Codrops avoids a page of identical cards. Hierarchy is expressed through span, media, typography, and editorial grouping. USC can use that principle for overviews, where exceptions and active work deserve unequal emphasis.

## Rhythm, type, color, and surfaces

- Rhythm: intentionally uneven but legible editorial blocks.
- Type: stark, high-contrast display and utility labels.
- Color: mostly black/white around colorful project media.
- Surfaces: articles and demonstrations are the units; card chrome is minimal.
- Density: variable. Large features are followed by compact supporting entries.

## Component archetypes

- Editorial lead feature.
- Unequal-span content grid.
- Technical breakdown.
- Live demonstration.
- Shared-element gallery-to-detail transition.
- Categorized related content.

## Interaction and motion

The most transferable technique is a shared-element transition that preserves the identity of the selected record while a drawer or detail view opens. Transforms and opacity can establish continuity without changing information order.

The least transferable technique is full input capture. Disabling native scroll, overscroll, or touch makes an operations application fragile and inaccessible. Infinite traversal also erases a stable sense of position.

## 3D and spatial treatment

Codrops explores WebGL and 3D as experiments. The useful lesson is progressive enhancement and technical transparency, not adopting the experiment. Any USC spatial proof must include a conventional fallback and a clear explanation of cost.

## Accessibility, responsiveness, and performance

- Preserve native scrolling, browser history, and touch behavior.
- Every transition must resolve instantly under reduced motion.
- Avoid splitting text into inaccessible or copy-hostile fragments.
- Shared-element motion must not delay focus placement in the destination.
- Tutorials can tolerate experimental boundaries; production logistics cannot.
- Exact demo licenses and third-party dependencies must be reviewed per artifact before any later reuse.

## Hallmark diagnosis

| Field           | Diagnosis                                                                        |
| --------------- | -------------------------------------------------------------------------------- |
| Character       | Editorial experimentation backed by implementation explanation                   |
| Macrostructure  | Magazine index → experiment/article → mechanics and source                       |
| Hierarchy       | Unequal editorial emphasis instead of a uniform card field                       |
| Distinctiveness | Reveals how memorable motion is constructed                                      |
| Risk            | Experimental input capture and animation dependencies can violate core usability |

## KEEP / MODIFY / REJECT

**KEEP**

- Unequal, editorial overview composition.
- Implementation transparency and isolated experiments.
- Transform/opacity continuity between list item and detail.
- One clear motion idea per interaction.

**MODIFY**

- Use shared-element motion for a bounded record drawer, never a full-site transition system.
- Translate magazine hierarchy into risk/urgency hierarchy.
- Treat experiments as playground proofs with explicit fallbacks.

**REJECT**

- `overflow: hidden`, disabled native touch, infinite scroll loops, or scroll-jacking.
- Split-text spectacle on operational content.
- Continuous parallax and pointer-following in task flows.
- Copying an article's exact effect or creative signature.

## USC transfer

Codrops should influence the overview's unequal composition and the mechanics of a restrained record-to-detail transition. It also defines a hard boundary: experimentation never removes native navigation or input behavior.
