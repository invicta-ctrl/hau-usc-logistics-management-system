# Impeccable v4 visual system

V4 is a modern-minimal **Map / Diagram** expression of the accepted v3 visual
system. The tokens below describe the built prototype, not a production runtime
replacement.

## Identity and surface ladder

Oxblood is the structural anchor: rail, route marks, active navigation, and
primary actions. Gold is a restrained signal: focus, route progress, active
segments, nodes, status emphasis, and small institutional marks. Gold is not a
large decorative field.

Light mode steps through warm-neutral canvas, near-white working paper, inset
paper for controls/table heads, and white overlays. Dark mode is authored
separately as near-black warm charcoal, charcoal paper, raised brown-charcoal,
and oxblood anchors; it is not a simple colour inversion.

The v4 tokens are authored in `styles/v4.css` with an OKLCH oxblood/gold ramp,
`color-mix()` washes, and a shared focus ring. The inherited status tones and
labels remain the semantic source of meaning; colour reinforces but never
replaces text.

## Type and iconography

- **Display:** bundled Bricolage Grotesque Local, weight 700, for page titles
  and operational numerals.
- **Body:** bundled IBM Plex Sans Local, weight 400-700, for labels, tables,
  controls, and explanatory copy.
- **Wordmark:** bundled Newsreader Local, weight 600, for the institutional
  name only.
- **Icons:** the inherited 24x24 monoline sprite, one current-colour brand ink;
  no emoji or second icon library.
- **Numbers:** tabular figures and explicit units; no raw status enum is shown
  without its vocabulary label.

The export embeds the local WOFF2 fonts as data URLs. It does not request a
remote font or image.

## Route geometry

The shell's geometry is a visual explanation of custody and handoff:

- a 292px expanded rail collapses to 84px and is a drawer below the desktop
  container threshold;
- a 10px rail segment and 12px node establish the route scale (7px/6px on
  small screens);
- the N13 topbar pairs route code/name with the command search pill;
- the route-progress rule and three nodes resolve once on route arrival;
- the main canvas uses one vertical and one horizontal rule as a diagram grid;
- page heads terminate in a gold right-angle, not a generic underline;
- attention measures sit on a connected rule with a lead exception and quieter
  supporting counts;
- tables are semantic queues; detail stays beside the queue on wide screens and
  becomes a drawer/full-screen push as space decreases;
- N5 public pages use a floating pill bar, a three-step portal route, and a
  single primary path; Ft5 ends with the custody statement and quiet links.

## Density and composition

The first viewport should answer: where am I, what is urgent, and what is the
next safe action? One work surface dominates. Heterogeneous summaries may use
panels; homogeneous records remain rows. Public pages carry less information
and larger type than internal queues. Decorative repetition, card walls,
gradient text, fake metrics, and unlabelled status colour are out of bounds.

Controls use a 46px base height in the v4 token set (never below the product's
44px floor). Radii are deliberately small and asymmetric in the built v4
direction (`5px 16-22px` corners for route-aware controls and surfaces), while
chips remain pill-shaped. Shadows are reserved for the rail, topbar, and truly
floating layers.

## Accessibility and responsive invariants

The preview keeps semantic landmarks, visible focus, keyboard routing, focus
restoration, labelled dialogs/drawers, non-colour status, and polite state copy.
The six evidence widths are 320, 375, 414, 768, 1024, and 1440 CSS pixels;
200% zoom and reduced motion are explicit checks. Mobile hides secondary chrome
before it hides operational content, so quantity, status, and the primary
action remain visible.

## Preservation boundary

V4 may change visual tokens, geometry, and finite interaction choreography in
the prototype. It may not change production source, generated runtime output,
backend/provider configuration, migration or ledger behavior, authentication,
deployment/release state, or the preserved v3 sources and artifacts.

## V4.1 material and component extension

V4.1 introduces embedded campus photography as the public institutional
ground. An oxblood image veil protects contrast while the warm paper canvas
and floating public identity bar preserve a premium, bright light theme.
Dark mode uses near-black charcoal, deep oxblood surfaces, off-white type, and
muted gold edges rather than inverting the light palette.

Glass is localized to genuinely floating controls: public identity bar,
celestial capsule, compact back control, dialogs, and mobile tabbar. Work
surfaces remain paper or charcoal fields. The new lending glyph is a dedicated
library/equipment mark rather than a recycled repeat arrow.

The theme control is a 76px capsule with both celestial endpoints visible and
a 32px active plate. The menu keeps three readable lines while changing
geometry for drawer state. The back control combines a small gold glyph plate
with an asymmetric glass label. Profile image selection is a local preview,
and the role selector is a labelled dialog; neither implies authority or
persistence.

The public landing, Request Center, and operational brief establish three
distinct composition families. Forms, queues, lifecycle tables, and details
continue using semantic HTML and the shared typography/status vocabulary. The
offline export embeds the three local fonts and the campus image.
