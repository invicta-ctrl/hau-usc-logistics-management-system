<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 -->

# Spline design DNA

## Study record

- Sources: [Spline](https://spline.design/), [self-hosted export documentation](https://docs.spline.design/exporting-your-scene/web/exporting-as-self-hosted-project), and [scene optimization guidance](https://docs.spline.design/exporting-your-scene/how-to-optimize-your-scene).
- Observed: 2026-08-10 at a fixed 1280 × 720 viewport.
- Interaction tested: the hero scene was dragged to orbit. The scene responded spatially, but its new camera position partially occluded/clipped critical hero copy.
- Mode: public-reference study; no Spline scene, runtime, asset, or code imported.

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

Spline sells direct manipulation of a living spatial scene. The public hero makes that claim tangible: dark full-bleed space, bright rounded forms, centered white language, a blue action, and explicit orbit interaction. The product's character is playful, tactile, and demonstrative.

The same interaction also exposed the central operational risk. When a user can freely reposition the camera, decorative objects can compete with or obscure essential text. In logistics software, spatial freedom must never outrank legibility, action, or state truth.

## Structure and hierarchy

1. Full-bleed interactive hero as product proof.
2. Centered proposition and primary action above/in the scene.
3. Feature explanations about states, events, timeline, physics, particles, and variables.
4. Product examples and creation paths.

Spline's hierarchy is appropriate because its product is the 3D tool. HAU-USC's product is governed logistics work, so a spatial layer can only support—not become—the interface.

## Rhythm, type, color, and surfaces

- Rhythm: cinematic first fold, then feature explanation.
- Type: large white sans over a dynamic dark canvas.
- Color: black/charcoal ground with luminous blues and saturated object colors.
- Surfaces: the 3D canvas is the primary surface; conventional UI floats above it.
- Shape: generous rounded geometry and soft spatial lighting.

## Component archetypes

- Interactive scene canvas.
- Orbit/direct-manipulation hint.
- Floating primary action.
- State/event demonstration.
- Timeline and variable-driven behavior.
- Static or image fallback requirement for non-WebGL contexts.

## Interaction and motion

Direct manipulation is immediate and compelling. For USC, the appropriate translation is bounded and data-driven: select a committee, event, request cluster, or inventory zone and allow the visualization to reframe itself. Free camera orbit is optional exploration, never required navigation.

The scene should stop when offscreen, respect reduced motion, and keep every operational action in ordinary DOM.

## 3D and spatial treatment

Potential USC uses:

- A playground-only proof of an operational topology on an overview surface.
- Inventory zones or event logistics represented as selectable spatial nodes.
- A static two-dimensional summary that upgrades to 3D only after critical content is ready.

Forbidden uses:

- Forms, tables, approval actions, counts, or audit evidence inside the canvas.
- Free-orbit hero behavior that can cover text.
- A 3D runtime on every route.
- Texture-heavy or high-polygon institutional decoration.

Spline's own optimization documentation exposes export size, loading score, object/clone/boolean/polygon/material/light/effect/texture counts and supports lazy loading and compression. Any experiment must capture those metrics before acceptance. Self-hosted export bundles the runtime and assets; that is a material dependency and licensing/plan decision, not a visual shortcut.

## Accessibility, responsiveness, and performance

- The same information and actions must exist in semantic DOM outside the scene.
- Drag cannot be the sole interaction; keyboard and simple control alternatives are required.
- Reduced motion uses a static composition or 2D diagram.
- WebGL failure, low memory, save-data, and narrow viewports fall back without losing content.
- Critical application content renders before the scene; lazy load only after an idle/visibility gate.
- A future proof must set explicit transferred-byte, polygon, texture, memory, and frame-time budgets before choosing a runtime.

## Hallmark diagnosis

| Field           | Diagnosis                                                                     |
| --------------- | ----------------------------------------------------------------------------- |
| Character       | Tactile real-time spatial demonstration                                       |
| Macrostructure  | Interactive proof first, explanatory product story second                     |
| Hierarchy       | Scene as product; conventional UI as control overlay                          |
| Distinctiveness | Immediate direct manipulation and depth                                       |
| Risk            | Occlusion, runtime cost, input exclusion, and spectacle displacing task truth |

## KEEP / MODIFY / REJECT

**KEEP**

- Spatial state driven by real variables.
- Direct but bounded selection and focus.
- Performance instrumentation and lazy loading.
- Static/2D fallback as a first-class state.

**MODIFY**

- Make 3D optional, overview-only, and subordinate to DOM content.
- Use selection controls and auto-framing instead of required free orbit.
- Express USC's inventory/event topology rather than decorative abstract shapes.

**REJECT**

- Critical text or controls inside/behind the scene.
- High-poly decoration, continuous camera motion, particles, or physics without task meaning.
- WebGL as a route prerequisite.
- Shipping a Spline runtime before dependency, license, privacy, and bundle review.

## USC transfer

Spline should contribute one tightly governed optional proof: a lazy, replaceable spatial overview that makes relationships easier to understand. It should have no role in queues, forms, release confirmation, inventory ledger history, or administration.
