# Impeccable v3 dynamic controls

## Menu control

The generic menu icon is replaced by an oxblood labelled control on wide
screens and an icon-only square at narrow widths. Its three custom CSS lines
transform into a close mark when the drawer is open.

Contract:

- `aria-expanded` reflects drawer state;
- `aria-controls="primary-navigation"` points to the rail;
- the accessible label changes between “Open navigation” and “Close navigation”;
- reduced-motion mode removes transitional travel without hiding state.

## Return control

Public flows use a dedicated return treatment: a gold circular arrow followed
by a two-line “Return to / Portals” label. On the narrowest view the arrow is
kept and the redundant words are removed. It is an ordinary anchor, so browser
and keyboard behavior remain predictable.

## Theme control

The theme switch is a compact track with a translating thumb. Sun and moon
glyphs both remain in the DOM and crossfade/rotate, preserving the established
truthful state model:

- `aria-pressed=false`: light is active; action is “Switch to dark mode”;
- `aria-pressed=true`: dark is active; action is “Switch to light mode.”

The theme persists under the v3-specific local key `hau-usc-v3-theme`. Storage
access remains guarded for `file://` use, and system preference remains the
first-run fallback.

## Interaction-state floor

Controls retain default, hover, focus-visible, active, disabled, loading, and
reduced-motion behaviors from the shared v2 primitives plus v3 overrides.
Focus does not depend on colour alone and does not animate into visibility.
