<!-- Hallmark · pre-emit critique: P5 H5 E4 S5 R5 V5 -->

# SaaSFrame design DNA

## Study record

- Source: [SaaSFrame](https://www.saasframe.io/)
- Observed: 2026-08-10 in the public desktop experience at a fixed 1280 × 720 viewport.
- Interaction tested: the central search was focused and queried with `dashboard`; a progressive result menu exposed a precise category match alongside broader screenshot-text matches.
- Mode: public-reference study; no assets, markup, or code copied.
- Responsive limitation: desktop/mobile pairs were visible in the product model, but browser viewport emulation was unavailable.

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

SaaSFrame is a dense but controlled SaaS-pattern index. It puts discovery infrastructure—search, categories, themes, and device comparison—above personality. The product feels more like a visual research console than a gallery.

Its best lesson is query interpretation. A term can match a named pattern, a category, or content inside a captured screen. The system distinguishes these match types instead of flattening them into a single undifferentiated list.

## Structure and hierarchy

1. Persistent top navigation with an immediately available search and keyboard cue.
2. Centered introductory proposition with supporting app tiles.
3. A “Discover” region segmented into trends, websites, and products.
4. Category and theme filters.
5. Reference cards that compare desktop and mobile states.

For HAU-USC this maps to global command search, module families, task/status filters, and intentional desktop/mobile transformation evidence.

## Rhythm, type, color, and surfaces

- Rhythm: compact navigation; open hero; then a repeatable, denser discovery cadence.
- Type: neutral product sans with clear weight shifts rather than decorative pairings.
- Color: mostly black, white, and soft gray so diverse source imagery remains legible.
- Surfaces: card grids are justified because every item is the same kind of reference evidence.
- Density: high after the hero, but filters and tabs constrain the visible set.

That equal-card strategy is useful for a reference library, not for every logistics module. USC surfaces have unequal priorities, risk, and action density.

## Component archetypes

- Command search with keyboard trigger.
- Typed result groups.
- Segmented discovery tabs.
- Category/theme chips.
- Desktop/mobile paired preview.
- Flow collection and save/compare controls.

## Interaction and motion

The search interaction is the signature: quick focus, immediate categorized feedback, and no route change until selection. Motion is functional and local. Filtering should retain context and announce result counts.

## 3D and spatial treatment

No 3D is needed. Spatial hierarchy comes from a sticky navigation layer, a receding background of app tiles, and a foreground results system. USC can use the same foreground/background logic without visual collage.

## Accessibility, responsiveness, and performance

- Command search needs a visible label, shortcut discoverability, focus restoration, and a complete non-command navigation path.
- Filter chips must be real toggles with programmatic selected state.
- Paired desktop/mobile evidence is a useful acceptance pattern, but no responsive implementation was reproduced here.
- Search should debounce local projection only; server queries must remain bounded, authorized, and cancellable.
- Screenshot-heavy libraries tolerate lazy media; USC critical data cannot depend on lazy image completion.

## Hallmark diagnosis

| Field           | Diagnosis                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------- |
| Character       | Dense visual research console                                                               |
| Macrostructure  | Search and filters above a classified evidence grid                                         |
| Hierarchy       | Search result type and category before individual card                                      |
| Distinctiveness | Desktop/mobile comparison and query interpretation                                          |
| Risk            | Importing the library's equal-card density would turn operational priorities into wallpaper |

## KEEP / MODIFY / REJECT

**KEEP**

- Global command search with grouped result types.
- Clear categories and selected filter state.
- Desktop/mobile acceptance pairs.
- Flow grouping rather than unrelated screen cards.

**MODIFY**

- Results become routes, records, people, and allowed actions.
- Filters become server-valid role/status/date/module filters.
- Device pairs become design and regression evidence, not production UI chrome.

**REJECT**

- An endless equal-card wall.
- Decorative app-tile backgrounds behind critical text.
- Search results built from unauthorized or private fields.
- Trend ranking as a proxy for operational priority.

## USC transfer

SaaSFrame should influence the searchable Index and command palette, the way results are grouped, and the responsive evidence plan. It should not determine the page composition of request, inventory, lending, or release work.
