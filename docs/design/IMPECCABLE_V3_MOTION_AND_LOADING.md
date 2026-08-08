# Impeccable v3 motion and loading

## Motion position

Motion explains a change; it does not decorate idle work. Durations stay within
120–440 ms for interface transitions, using a non-bouncy ease. Layout-changing
properties are not animated.

## Route arrival

A two-pixel oxblood-to-gold rule resolves once when an authenticated surface is
rendered. It gives route change a clear direction without delaying content.

## Menu and theme

- Menu lines rotate and collapse into the close state.
- The theme thumb translates between ends of its track while sun and moon
  crossfade and rotate.
- Hover movement is limited to a single small translation on selected controls.

## Custom loading state

The previous generic row shimmer is framed as “Preparing this workspace.” A
three-bar logistics mark and a directional progress rule communicate activity;
quiet row placeholders preserve table geometry below. No circular spinner is
used.

## Reduced motion

Under `prefers-reduced-motion: reduce`:

- route and loading animations stop;
- the progress rule resolves to a static position;
- inherited global motion rules reduce all remaining transitions to effectively
  instantaneous state changes;
- loading meaning remains available through text and `aria-busy`.

## Loading semantics

The container exposes `aria-busy="true"` and an `aria-live="polite"` status.
Visible explanatory text is paired with a visually hidden “Loading records”
message, so the animation is never the only carrier of meaning.
