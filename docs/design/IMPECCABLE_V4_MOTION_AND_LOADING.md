# Impeccable v4 motion and loading

V4 treats motion as **finite operational choreography**: every movement points
to a route, relationship, state change, hierarchy, disclosure, or completion and
then stops. There is no perpetual decorative motion, shimmer sweep, bounce, or
ambient animation loop.

## Authoritative motion and accessibility references

The built rules are informed by the following authoritative references:

- [IBM Carbon Motion - Overview](https://carbondesignsystem.com/elements/motion/overview/)
  and [Choreography](https://carbondesignsystem.com/elements/motion/choreography/)
  for purposeful, coordinated transitions.
- [Fluent 2 Motion](https://fluent2.microsoft.design/motion) for functional,
  natural, consistent motion and a no-motion setting.
- [Atlassian Motion](https://atlassian.design/foundations/motion) and
  [Atlassian Applying motion](https://atlassian.design/foundations/motion/applying-motion)
  for choosing duration, easing, and properties that keep interactions clear.
- [Apple HIG Motion](https://developer.apple.com/design/human-interface-guidelines/motion/)
  for reducing peripheral distraction and supplementing visual feedback.
- [W3C Animation from Interactions](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)
  and [technique C39](https://www.w3.org/WAI/WCAG21/Techniques/css/C39) for
  allowing non-essential interaction animation to be removed.
- [MDN prefers-reduced-motion](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/%40media/prefers-reduced-motion)
  and [MDN View Transition API](https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API)
  for the browser preference and progressive enhancement model.

These sources are guidance, not a replacement for `PRODUCT.md`, `DESIGN.md`,
the accepted v3 motion contract, or the v4 source.

## Timing and easing tokens

`styles/v4.css` defines:

| Token | Value | Use |
| --- | --- | --- |
| `--m-instant` | 110ms | press, focus, and small feedback |
| `--m-small` | 150ms | component and active-indicator movement |
| `--m-surface` | 240ms | route/state surface transition |
| `--m-overlay` | 300ms | drawer, dialog, menu, and overlay entry |
| `--m-reveal` | 420ms | staged arrival and route resolution |

The default ease is an ease-out (`cubic-bezier(0.16, 1, 0.3, 1)`); route exit
uses a short ease-in. Layout-changing dimensions are not animated.

## Choreography map

- **Boot:** the first five stage/public/index children arrive once over 420ms,
  offset by 50ms. This establishes reading order, then the app settles.
- **Route arrival:** the progress rule draws once over `--m-reveal`; three
  nodes arrive over 260ms with 45ms and 90ms offsets. The active rail segment
  and page-head corner remain static landmarks.
- **State change:** route/state transitions use the stage view-transition name
  when supported. Old stage content exits by 4px; new content enters by 7px.
  Unsupported browsers use the finite `v4-fallback-arrive` class with a capped
  stagger and deterministic cleanup.
- **Theme:** the root fades out/in over the surface duration while colour-only
  token transitions keep layout still. Theme icon glyphs crossfade/rotate in
  normal motion.
- **Overlays:** command/menu/dialog/drawer entry is a bounded opacity and small
  translation/scale change; exit is shorter. Focus moves into the overlay and
  returns to the trigger on close.
- **Loading:** the custom “Preparing this workspace” mark resolves three bars
  at 0/70/140ms; the directional progress rule resolves once over 700ms; rows
  arrive once over 300ms with a capped 35ms stagger. Skeletons and live dots do
  not loop in v4.
- **Selection and controls:** active route indicators scale rather than resize;
  hover/press transforms are limited to a 1-2px nudge on pointer-capable input.
  Success is communicated by text/toast and state, not by an endless effect.

## Reduced-motion path

When `(prefers-reduced-motion: reduce)` matches:

- animation and transition durations become 1ms and iteration count is one;
- boot, route, loading, and view-transition transforms resolve to final
  opacity/position immediately;
- the live-dot pulse is hidden and no continuous animation remains;
- theme icon rotation is removed while the sun/moon state still swaps and
  `aria-pressed`/labels remain truthful;
- focus, status text, `aria-live`, and loading meaning remain available.

The same-document View Transition API is optional. If it is unavailable,
`app.js` uses the finite CSS route/state fallback; when the user requests
reduced motion, it commits synchronously and deletes the transition marker.
Both unsupported-API animation and reduced-motion final state are covered by
the motion test.

## Verification recorded for this checkpoint

- `verify.mjs`: zero findings, console errors, and external requests at 320,
  375, 414, 768, 1024, and 1440px; keyboard focus moved in/trapped/restored;
  no 200% overflow.
- `contrast.mjs`: zero failures in both themes.
- `theme-test.mjs`: green cycle, persistence, system-default, stored-preference,
  and reduced-motion evidence.
- `motion-test.mjs`: 10/10 scenarios, including finite-animation and fallback
  assertions.
- Curated review set: 12/12 captures with zero browser errors or external
  requests.

The Impeccable detector was run exactly once; it returned three warnings, all
were repaired, and it was not rerun. This record therefore does not claim a
second detector verdict.
