<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 -->

# Awwwards design DNA

## Study record

- Sources: [Awwwards](https://www.awwwards.com/) and [Sites of the Day](https://www.awwwards.com/websites/sites_of_the_day/).
- Observed: 2026-08-10 at a fixed 1280 × 720 viewport.
- Interaction tested: the Technology filter opened a searchable, scrollable menu spanning implementation categories such as Three.js, GSAP, WebGL, and React.
- Reliability observation: the homepage initially rendered mostly blank after a client-side error and emitted animation/runtime warnings. The directory page remained inspectable.
- Mode: public-reference study; no awarded design, asset, markup, or code copied.

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

Awwwards is a juried showcase. Its visual confidence comes from treating each project as a singular authored composition, then supporting discovery with rigorous metadata. The useful duality is “expressive work, disciplined index.”

HAU-USC should borrow the confidence to make one overview composition memorable, while adopting the directory's taxonomy and refusing the showcase behaviors that undermine task completion.

## Structure and hierarchy

1. Compact global header.
2. Award/category directory entry.
3. Dense filter row across award, category, tag, technology, country, font, and color.
4. Project grid with award badges and concise authorship metadata.
5. Project detail with richer narrative and interaction.

The filters let many different visual works remain comparable. In USC, a similar filter grammar should apply to requests, lending, inventory, events, and audit records—but it must use shared operational concepts, not aesthetic metadata.

## Rhythm, type, color, and surfaces

- Rhythm: firm header and filter rails; generous project media; compact metadata.
- Type: strong neutral sans with labels that remain subordinate to imagery.
- Color: the directory stays neutral because projects provide color.
- Surfaces: large media rectangles; tags and award marks act as metadata, not decoration.
- Composition: projects vary, while the index itself remains systematic.

## Component archetypes

- Multi-dimensional filter rail.
- Searchable long-option menu.
- Award/status badge.
- Large visual feature with concise metadata.
- Curated detail narrative.
- Lazy media grid.

## Interaction and motion

Awwwards' ecosystem celebrates page transitions, scroll effects, and spatial presentation. Selective transitions can establish continuity, but the live homepage failure is a practical warning: a visual experience that depends on a large animation chain can fail before content becomes useful.

USC should use motion only where it preserves place—opening a record, moving between lifecycle stages, or focusing a changed value.

## 3D and spatial treatment

The directory explicitly classifies WebGL/Three.js work, but that is a discovery attribute, not a default interface requirement. A single overview visualization can be evaluated as an authored feature. It must not propagate into task surfaces.

## Accessibility, responsiveness, and performance

- Content and navigation must remain functional if motion code fails.
- Filters require keyboard access, visible selected state, result counts, and a clear reset.
- Image/media lazy loading is acceptable for inspiration grids; operational state should not wait for media.
- No scroll interception, hover-only information, or route-blocking loader.
- The fixed desktop study does not establish Awwwards' mobile behavior.

## Hallmark diagnosis

| Field           | Diagnosis                                                                              |
| --------------- | -------------------------------------------------------------------------------------- |
| Character       | Curated high-expression showcase with disciplined metadata                             |
| Macrostructure  | Taxonomy/filter index → authored project detail                                        |
| Hierarchy       | Project media first; evidence and award metadata second                                |
| Distinctiveness | One composition can have a strong authored point of view                               |
| Risk            | Animation/runtime fragility and spectacle-driven navigation can make a system unusable |

## KEEP / MODIFY / REJECT

**KEEP**

- Confidence to author one signature overview moment.
- Strong, consistent filter taxonomy.
- Concise status/evidence badges.
- Large feature composition where context genuinely benefits.

**MODIFY**

- Replace award metadata with role, state, urgency, event, and ownership.
- Make transitions optional enhancements over an already complete page.
- Keep the signature moment bounded to a non-critical overview region.

**REJECT**

- Scroll hijacking, route loaders, or navigation that depends on animation libraries.
- Copying an awarded site's signature composition.
- Cinematic motion on queues, forms, or confirmation steps.
- Media-first hierarchy for ledger and audit truth.

## USC transfer

Awwwards should influence authorship and visual courage at the overview level, plus the rigor of cross-cutting filters. It should not set the interaction model of the operational workbench.
