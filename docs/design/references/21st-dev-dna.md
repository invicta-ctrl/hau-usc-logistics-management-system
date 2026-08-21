<!-- Hallmark · pre-emit critique: P5 H4 E5 S5 R5 V5 -->

# 21st.dev design DNA

## Study record

- Sources: [21st.dev](https://21st.dev/) and the observed [Calendar component page](https://21st.dev/@designali-in/components/calendar).
- Observed: 2026-08-10 in the public experience at a fixed 1280 × 720 viewport.
- Mode: public-reference study; no package, component, asset, markup, or code imported.
- License boundary: no authoritative repository-wide license was confirmed during this study. Treat every component as reference-only until its exact source and license are verified.

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

21st.dev is a component marketplace and inspection workbench. The homepage is atmospheric and promotional: a dark spatial field, a large left-aligned proposition, blue emphasis, category chips, and preview cards. The detail page is much more operationally valuable: it makes one component inspectable through a live preview, theme and viewport controls, source tabs, provenance, and similar components.

The contrast between those two modes is instructive. Discovery can be expressive; inspection must become precise.

## Structure and hierarchy

1. Dark, branded discovery hero with category entry points.
2. Dense component preview catalog.
3. Component detail with author/source identity.
4. Interactive preview and environment controls.
5. Usage and implementation tabs.
6. Related patterns after the inspected component.

For HAU-USC, the transferable model is not a marketplace. It is a governed component/state laboratory for the private playground: one real component, real data states, themes, widths, permissions, and exact acceptance evidence.

## Rhythm, type, color, and surfaces

- Discovery rhythm: large proposition, then dense preview inventory.
- Detail rhythm: narrow utility shell around one dominant interactive preview.
- Color: deep navy/black and electric blue create technical energy.
- Surfaces: framed preview canvases, tabs, compact utilities, and code regions.
- Type: bold contemporary display language in discovery; utilitarian labels in the inspector.

The dark-blue marketplace identity is not transferable to USC. The inspectability is.

## Component archetypes

- Category chip cloud.
- Component preview tile.
- Live preview canvas.
- Theme/viewport/reload toolbar.
- Usage/source tabs.
- Author and source provenance.
- Similar-pattern discovery.

## Interaction and motion

Components are expected to demonstrate their behavior, but the page keeps inspection controls predictable. HAU-USC should expose relevant states—loading, empty, denied, stale, success, error—and motion preferences in its playground rather than encourage uncontrolled animation.

## 3D and spatial treatment

Spatial gradients and preview depth create energy on the homepage, but do not improve the component detail's core task. For USC, any spatial effect belongs to a bounded demonstration or overview visualization, never to every component.

## Accessibility, responsiveness, and performance

- A preview toolbar must label every icon control and maintain keyboard order.
- Theme and viewport controls should change only presentation, never capability or server bindings.
- Component demos need reduced-motion variants and deterministic reset.
- Runtime imports from an unknown component source are unacceptable without source, license, security, bundle, and accessibility review.
- A playground preview should use local project primitives, not an embedded third-party runtime.

## Hallmark diagnosis

| Field           | Diagnosis                                                                                                      |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| Character       | Expressive discovery plus precise component inspection                                                         |
| Macrostructure  | Catalog → component → interactive preview → implementation evidence                                            |
| Hierarchy       | Live behavior and provenance above related recommendations                                                     |
| Distinctiveness | Inspectability of a component across environment controls                                                      |
| Risk            | Marketplace novelty, unverified licenses, and framework-specific imports can fracture the existing application |

## KEEP / MODIFY / REJECT

**KEEP**

- Live state preview in the isolated playground.
- Theme/width/state inspection controls.
- Component provenance and acceptance notes.
- One focused preview before related patterns.

**MODIFY**

- Use the current vanilla HTML/CSS/JS renderer and integration adapters.
- Replace generic code tabs with USC token, state, permission, and acceptance documentation.
- Make environment controls server-safe and presentation-only.

**REJECT**

- Copy/paste component adoption without license and dependency review.
- React/shadcn migration for visual novelty.
- Marketplace-style category overload in the operational application.
- Glow, hover-scale, or animated gradient as default component behavior.

## USC transfer

21st.dev should shape a future playground-only component and state inspector, not the production shell. It reinforces that every redesigned primitive should be observable across variants before it reaches a full module.
