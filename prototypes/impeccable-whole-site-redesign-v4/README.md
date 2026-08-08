# HAU-USC Logistics whole-site redesign preview v4.1

V4.1 is an isolated, non-production front-end preview for the HAU-USC
Logistics Management System. It is a substantial redesign, not a token reskin:
an image-led Holy Angel University Student Council gateway replaces the public
tutorial, an asymmetric decision brief replaces the overview metric wall, and
the Request Center follows the current production frontend’s authenticated
department flow.

The preview keeps all 33 routes, 53 state variants, navigation destinations,
content vocabulary, and representative workflows. It adds no backend,
authentication, provider, migration, deployment, release, or production
behavior. Every record is fictional and visibly illustrative. Local actions
do not persist or transmit data.

## Open the shareable preview

Open this generated single-file artifact directly:

```text
output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html
```

It contains the module graph, local fonts, icons, and campus background. It
needs no server, account, or network request. To work from modular source,
serve this directory because browsers generally block ES modules under
`file://`:

```powershell
npx --yes http-server prototypes/impeccable-whole-site-redesign-v4 -p 4173 -c-1
```

## What changed in v4.1

- Cinematic USC landing built around the locally embedded production campus
  background, stable official HAU/USC facts, direct governed portal actions,
  and the official USC Facebook link. The step tutorial is removed.
- Production-grounded Request Center with authenticated illustrative
  department identity, Create/Track, New/Additional, event/sub-event, item
  composer, and explicit For Review language.
- Authenticated overview recomposed as an editorial decision brief and
  workbench. Loading keeps the composition while suppressing every stale count
  until an atomic reveal.
- Premium celestial theme control with both endpoints visible, a travelling
  active plate, persisted truthful state, and reduced-motion substitute.
- Kinetic three-line menu, compact glass back control, dedicated lending icon,
  six-result command search, labelled role picker, and removal of the redundant
  committee scope control.
- Local-only profile image preview for JPEG/PNG/WebP files up to 2MB. Nothing is
  uploaded or retained.
- Mobile off-canvas navigation, five-destination bottom bar, safe-area and
  bottom-scroll clearance, and a compact truthful preview harness.
- Decorative corner, rail, and page-heading lines removed. Remaining rules
  communicate route, selection, table, priority, or loading state.

## Preview controls

The topmost bar is test chrome, not product chrome.

| Control | Purpose |
| --- | --- |
| Surface | Open any of the 33 registered routes. |
| State | Render that route’s accepted illustrative variant. |
| Desktop / Tablet / Mobile | Set the preview container and capture label. |
| Light / Dark | Select and persist a theme. |
| Index | Return to the route map. |

On authenticated routes, `Ctrl`/`Cmd`+`K` or `/` opens command search. Arrow
keys move through the six visible matches; Enter follows; Escape closes.
Dialogs and drawers move focus inside, trap it, and restore it to the trigger.

## Source map

```text
index.html                    module entry and v4.1 direction contract
assets/fonts/                 local Bricolage, IBM Plex Sans, Newsreader
assets/images/                optimized production campus background
src/app.js                    routing, theme, overlays, focus, local preview state
src/components.js             theme, back, loading, form and queue primitives
src/icons.js                  bundled monoline icons, including lending
src/registry.js               33-route / 53-variant registry
src/data/                     fictional preview fixtures
src/surfaces/public.js        landing, sign-in, Request Center, tracking
src/surfaces/operations.js    overview, queues, release, inventory, events
src/surfaces/admin.js         access, directory, brand, profile, health
styles/*.css                  tokens, shell, components, motion, responsive layers
styles/v3.css                 preserved v3 baseline layer
styles/v4.css                 v4.1 studied-DNA composition and choreography
tools/export.mjs              generate the offline shareable artifact
tools/registry-parity.mjs     compare route/state/nav shape with v3
tools/theme-test.mjs          13-check celestial theme acceptance
tools/motion-test.mjs         13 local interaction and persistence scenarios
tools/verify.mjs              six-width accessibility/responsive audit
tools/contrast.mjs            light/dark contrast sweep
tools/review-shots.mjs        21-case curated finish set
tools/visual-delta.mjs        exact eight-pair v3/v4.1 comparison set
```

The production campus image is embedded by `export.mjs`; never hand-edit the
generated HTML. V4 permits icon-only registry drift while preserving route,
label, order, and state shape.

## Verification

Run from the repository root with the existing Playwright installation:

```powershell
node prototypes\impeccable-whole-site-redesign-v4\tools\export.mjs
node prototypes\impeccable-whole-site-redesign-v4\tools\registry-parity.mjs

node prototypes\impeccable-whole-site-redesign-v4\tools\theme-test.mjs `
  output\design\HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html

node prototypes\impeccable-whole-site-redesign-v4\tools\motion-test.mjs `
  output\design\HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html `
  output\design\impeccable-redesign-v4-motion-v4-1-final.json

node prototypes\impeccable-whole-site-redesign-v4\tools\verify.mjs `
  output\design\HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html `
  output\design\impeccable-redesign-v4-v4-1-verify-final

node prototypes\impeccable-whole-site-redesign-v4\tools\contrast.mjs `
  output\design\HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html

node prototypes\impeccable-whole-site-redesign-v4\tools\review-shots.mjs `
  output\design\HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html `
  output\design\impeccable-redesign-v4-v4-1-review-final

node prototypes\impeccable-whole-site-redesign-v4\tools\visual-delta.mjs `
  output\design\HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v3.html `
  output\design\HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html `
  output\design\impeccable-redesign-v4-visual-delta-v4-1-final
```

Recorded v4.1 results:

- registry parity: 33 routes / 53 state variants, pass;
- theme: all 13 checks pass, including real mid-travel and reduced motion;
- motion: 13/13 scenarios;
- verify: zero findings, console errors, or external requests at 320, 375,
  414, 768, 1024, and 1440; keyboard/focus and 200% zoom pass;
- contrast: zero failures;
- curated evidence: 21/21 captures, including mobile queue bottom clearance;
- visual delta: 8/8 exact v3/v4.1 pairs with zero capture failures;
- Hallmark: study/audit/redesign equivalents complete, 58/58 gates pass.

The Impeccable detector ran exactly once across modular source and export. Its
large advisory JSON was truncated by the tool boundary; the visible primary
side-tab warning was repaired mechanically and the detector was not rerun.
The independent v4.1 review record is authoritative for the final disposition.

## Front-end-only boundary

Do not use this preview authorization to change application runtime source,
Worker logic, D1, R2, migrations, Google/provider configuration,
authentication, staging, deployment, release branches, or production. Do not
open a PR, merge, or deploy from this artifact task. Preserve v3 and historical
v4 sources/evidence. Regenerate the export only from this modular directory.

## Records

- `docs/design/IMPECCABLE_V4_1_FEEDBACK_AMENDMENT.md`
- `docs/design/IMPECCABLE_V3_EXTERNAL_DESIGN_DNA.md`
- `docs/design/IMPECCABLE_V4_REFERENCE_RESEARCH.md`
- `docs/design/IMPECCABLE_V4_DIRECTION.md`
- `docs/design/IMPECCABLE_V4_VISUAL_SYSTEM.md`
- `docs/design/IMPECCABLE_V4_MOTION_AND_LOADING.md`
- `docs/design/IMPECCABLE_V4_DECISIONS.md`
- `DESIGN.md` and `.impeccable/design.json`
- `.codex/IMPECCABLE_V4_CURRENT.md`
- `.codex/IMPECCABLE_V4_HANDOFF.md`
- `.codex/IMPECCABLE_V4_RESUME_PROMPT.md`
