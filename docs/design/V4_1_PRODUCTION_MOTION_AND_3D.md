# V4.1 Production Motion and 3D

## Implementation

The public landing uses a dependency-free CSS isometric campus-logistics map
implemented by `src/visual/landing-network.js` and
`src/styles/visual/v4-1-integration.css`. It depicts the real operational
sequence Request -> Prepare -> Release -> Complete. It does not depict freight,
shipping, or an invented logistics capability.

The visual is progressive enhancement:

- semantic figure and ordered-list fallback render first;
- the enhanced scene starts only after intersection and an idle callback;
- animation runs once and settles;
- an off-screen figure and a hidden browser tab pause motion;
- save-data, mobile, and reduced-motion users keep the static treatment;
- no CTA, route, form, or tracking action depends on the visual;
- no canvas, WebGL, model asset, or third-party 3D dependency is used.

## Signature controls

`src/visual/signature-controls.js` provides:

- a persisted light/dark celestial toggle with filled sun and moon icons, a
  travelling active plate, an action-oriented accessible name, and immediate
  reduced-motion behavior;
- a compact three-line menu that resolves to a recognizable close state, opens
  the real navigation drawer, traps focus where needed, closes on Escape, and
  restores continuity;
- a compact directional back control with a short arrow travel and no oversized
  circular-arrow treatment.

All added motion uses transform and opacity, uses the V4.1 easing tokens, avoids
bounce/elastic motion, and comes to rest. Focus rings do not animate.

## Fallback matrix

| Condition | Result |
|---|---|
| JavaScript unavailable | Ordered Request/Prepare/Release/Complete fallback remains |
| Width below 640 px | Static compact process list; no isometric scene |
| `prefers-reduced-motion: reduce` | Static map and near-zero control transitions |
| Save Data enabled | Static map |
| Figure outside viewport | Motion paused |
| Tab hidden | Motion paused |

## Performance measurement

Measured from the final repository build against Claude's recovered checkpoint
`85f064a0f809654d584853204e9a33eb1fc52d32`:

| Artifact | Recovered checkpoint | Candidate | Delta |
|---|---:|---:|---:|
| `dist/index.html` | 846,054 bytes | 903,621 bytes | +57,567 bytes |
| gzip | 217,275 bytes | 230,860 bytes | +13,585 bytes |

The delta includes the visual cascade, landing, signature controls, sanitized
preview adapter, and all generated inline source. Added dependency count: zero.
Added model/image asset count: zero. The build reports 61 transformed modules.

## Verification

- Focused V4.1 Playwright: 8 passed, 40 intentional project skips.
- Full Playwright matrix: 146 passed, 400 intentional project skips.
- Visual evidence includes light/dark, all required widths, reduced motion, and
  200% zoom.
- Light focus contrast was measured at 3.21:1 against the recessed paper
  surface after the final token adjustment; text pairs are 7.85:1 or higher in
  the measured landing palette.
