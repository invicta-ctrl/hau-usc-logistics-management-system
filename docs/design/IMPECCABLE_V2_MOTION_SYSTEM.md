# Impeccable v2 — Motion System

Implemented in `prototypes/impeccable-whole-site-redesign-v2/styles/motion.css`.

Every animation must answer one question: **what does it communicate?**
Permitted answers: navigation, state, relationship, hierarchy, completion,
attention, progressive disclosure. "It looks cool" is not one of them.

---

## Tokens

```css
--m-instant: 120ms;  /* feedback */
--m-small:   200ms;  /* component motion */
--m-surface: 280ms;  /* surface transition */
--m-overlay: 320ms;  /* drawer, dialog */
--m-reveal:  400ms;  /* staged reveal */
--ease: cubic-bezier(0.22, 1, 0.36, 1);
```

Ease-out only. **No bounce easing. No endless decorative loops.**

## Budget

At most **one continuous animation per visible viewport**, preferably zero.

The only continuous animation in the system is `.live-dot`, a 2.6s pulse that
reports a genuinely live connection. It is removed under reduced motion. Nothing
else loops, and no counter ever counts.

## Inventory

| Motion | Duration | Communicates |
|---|---|---|
| Theme toggle icon | 200 ms | current theme, and that pressing transforms rather than replaces |
| Theme surface change | 280 ms, colour only | the whole surface changed deliberately, not by a flash |
| Surface entry | 280 ms | navigation — a new surface arrived |
| Staged reveal | 400 ms, 40 ms steps | reading order: title → attention → queue → rails |
| Nav active indicator | 200 ms `scaleY` | which route is active, and that selection moved |
| Row selection | 200 ms | this row owns the detail beside it |
| Progress meter | 400 ms `scaleX` | progress moved from a previous value to a new one |
| Button hover / active | 120 ms | pressability, then acknowledgement |
| Drawer | 320 ms transform + opacity | a layer arrived above the current context |
| Dialog | 320 ms | same, modal |
| Menu | 200 ms | disclosure from its trigger |
| Toast | 320 ms | completion |
| Metric emphasis | 400 ms | this figure just changed (fires on state change only) |
| Live status dot | 2.6 s loop | a live connection |

## Layout is never animated

Two v2 findings from the Impeccable detector were fixed rather than suppressed:

- the nav indicator animated `height` → now `transform: scaleY()`;
- the progress meter animated `width` → now `transform: scaleX()`, with
  `meter()` emitting `transform:scaleX(n)` instead of `width:n%`.

Animating width, height, padding, or margin causes layout thrash. Nothing in v2
does.

## Theme toggle

```text
LIGHT           press            DARK            press           LIGHT
sun visible  ──────────▶  animated transform  ──────────▶  sun visible
                              moon visible
```

- Both glyphs are always in the DOM. CSS rotates and crossfades between them:
  the hidden one sits at `rotate(±90deg) scale(0.4)` with `opacity: 0`.
- Duration 200 ms, inside the required 180–260 ms band.
- Surfaces transition on colour only, so nothing reflows and nothing flashes.
- Preference persists to `localStorage` under `hau-usc-v2-theme`, behind a
  guarded accessor (a `file://` preview can have an opaque origin).
- System preference is consulted **only** when no preference is stored.
- Accessible name states the action — "Switch to dark mode" / "Switch to light
  mode". `aria-pressed` reports whether dark is active, so the announced state
  stays truthful.
- No animation library. CSS and the existing icon sprite only.

**Measured** (`tools/theme-test.mjs`):

| Check | Result |
|---|---|
| Cycle light → dark → light | sun/moon opacity and transform swap correctly at each step |
| Animated, not snapped | mid-transition sample caught the moon at `scale(1.06121)` |
| Transition duration | `0.2s` |
| `aria-pressed` truthful | `false` in light, `true` in dark |
| Accessible name | flips with the state |
| Persists across reload | stored `dark` → reloads `dark` |
| First run, system dark | `dark`, nothing stored |
| First run, system light | `light`, nothing stored |
| Stored beats system | system dark + stored light → `light` |
| Reduced motion | transforms `none`, transition `1e-05s`, icon still swaps, aria still updates |

## Reduced motion

Under `prefers-reduced-motion: reduce`:

- all spatial movement and looping is removed;
- state feedback is kept and becomes near-instant;
- the theme icon still swaps — only the rotation is dropped;
- the live dot's pulse is removed entirely.

The interface becomes less kinetic, never less informative.

## Measurement note

Both `verify.mjs` and `contrast.mjs` freeze transitions and animations before
sampling. Reading computed geometry or colour mid-animation produces phantom
results — during a theme transition, interpolated colours reported foreground
≈ background at 1.01:1 across every dark public surface, which was a measurement
artefact and not a defect. Reduced-motion behaviour is asserted separately, with
motion enabled.
