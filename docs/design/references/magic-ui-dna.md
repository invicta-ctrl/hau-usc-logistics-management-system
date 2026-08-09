<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 -->

# Magic UI design DNA

## Study record

- Sources: [Magic UI](https://magicui.design/) and the official [Magic UI GitHub repository](https://github.com/magicuidesign/magicui).
- Observed: 2026-08-10 at a fixed 1280 × 720 viewport.
- Interaction tested: the header search opened a grouped command palette with a search field, keyboard selection, navigable destinations, theme options, and a clear modal scrim.
- License boundary: the official repository is MIT, but it targets React/TypeScript/Tailwind/Motion/shadcn. No component or dependency is imported by this research task.

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

Magic UI is a polished component showcase that makes animation feel approachable. The homepage is mostly restrained—white field, large black proposition, compact navigation, one dark CTA—then uses a subtle colored glow as a controlled demonstration of its specialty.

The command palette is more relevant to USC than the decorative effect catalog. It combines speed, grouping, keyboard support, and explicit theme navigation in a small surface.

## Structure and hierarchy

1. Documentation navigation and announcement.
2. Large centered proposition and primary action.
3. Component/effect demonstrations organized by category.
4. Search/command overlay for direct navigation.
5. Documentation and implementation detail.

The product separates ordinary documentation chrome from effect showcases. USC should similarly separate the calm operational base from any optional expressive moment.

## Rhythm, type, color, and surfaces

- Rhythm: spacious arrival, compact docs navigation, then focused demonstrations.
- Type: contemporary sans with strong headline weight and compact technical labels.
- Color: predominantly neutral; color is concentrated into the featured effect.
- Surfaces: documentation panels and preview frames rather than decorative cards everywhere.
- Effects: rainbow glow, animated border, particles, number animation, and other patterns are opt-in examples.

## Component archetypes

- Grouped command palette.
- Keyboard shortcut cue.
- Theme switcher.
- Preview frame.
- Animated number/ticker.
- Bounded visual effect wrapper.
- Copyable documentation pattern.

## Interaction and motion

The command palette uses motion to establish an overlay and selection, not to entertain. That is directly useful. Number animation may be appropriate only when a factual metric changes and the final value is immediately available to assistive technology.

Decorative effects must be exceptional. Oxblood/gold already carry institutional meaning; animated gradients, shimmer, meteors, confetti, or border beams would compete with status and focus.

## 3D and spatial treatment

Magic UI's depth is largely two-dimensional: glows, masks, transforms, and layered overlays. This offers a lower-cost alternative to WebGL for creating one memorable overview moment.

## Accessibility, responsiveness, and performance

- The command palette needs a dialog name, focus trap, Escape, focus return, and complete route browse fallback.
- Motion must respect `prefers-reduced-motion` and never gate content.
- Animated numbers expose stable text and do not repeatedly replay.
- Effect components require individual bundle, paint, contrast, and seizure-risk review.
- Framework-specific source cannot be dropped into the current vanilla architecture without a separately approved dependency decision.

## Hallmark diagnosis

| Field           | Diagnosis                                                                             |
| --------------- | ------------------------------------------------------------------------------------- |
| Character       | Restrained documentation shell around optional expressive effects                     |
| Macrostructure  | Discover → preview → documentation → code/provenance                                  |
| Hierarchy       | Navigation and component behavior before decorative effect                            |
| Distinctiveness | Compact, polished microinteractions and command access                                |
| Risk            | Effect abundance can become generic AI-SaaS decoration and undermine status semantics |

## KEEP / MODIFY / REJECT

**KEEP**

- Grouped command palette with keyboard and focus discipline.
- Small, bounded transitions.
- Stable text behind animated metrics.
- Neutral base with one concentrated expressive accent.

**MODIFY**

- Implement patterns in the current vanilla V5 architecture.
- Map command groups to permitted routes, records, and safe actions.
- Use oxblood/gold and status tokens instead of rainbow effect defaults.

**REJECT**

- Animated borders, meteors, confetti, shimmer, or glow as routine operational chrome.
- React/shadcn/Tailwind adoption solely to obtain components.
- Replaying number animations on every render.
- Motion that suggests success before the backend confirms it.

## USC transfer

Magic UI should influence the command palette and a few high-quality microinteractions. Its effect catalog is a rejection filter: the redesign must remain institutional, not become a collection of fashionable animated snippets.
