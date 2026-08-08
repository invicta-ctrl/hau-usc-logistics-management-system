# HAU-USC Logistics - whole-site redesign preview v4

V4 is an isolated, non-production design preview for the HAU-USC Logistics
Management System. Its direction is **Operational Choreography / Route
Console**: a modern-minimal map of public entry points and authenticated
handoffs. It keeps the accepted v3 product vocabulary, route/state registry,
privacy boundary, and operational meaning while changing only the visual and
interaction treatment in this prototype. Its reproducible surface seed is
`surface / operate / 00000004`, assigned candidate 5 in degraded mode with no
catalog challengers.

This directory is authoritative for the modular v4 preview. The generated HTML
is a derived, shareable artifact. The preview uses fictional `*-DEMO-*`
identifiers, invented events, a 2032 illustrative cycle, and visible
no-live-record labeling. It performs no network requests and has no authentication, Worker, D1,
R2, Apps Script, provider, deployment, or production behavior.

## Open the preview

The easiest route is the generated offline export. Double-click:

```text
output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html
```

It needs no server and no credentials. To work from the modular source, serve
this directory over HTTP because browsers do not load ES modules from
`file://`:

```bash
npx --yes http-server prototypes/impeccable-whole-site-redesign-v4 -p 4173 -c-1
```

Then open `http://127.0.0.1:4173/`.

## Preview controls

The top preview bar is test chrome, not product chrome.

| Control | Purpose |
| --- | --- |
| Surface picker | Open any of the 33 registered routes. |
| State picker | Show the route's illustrative loading, empty, error, denied, stale, partial, success, or populated variant. |
| Desktop / tablet / mobile | Change the preview viewport and exercise the same responsive layout. |
| Light / dark | Switch authored light and dark themes; the stored preference is local-only. |
| Index | Return to the route map. |

On authenticated routes, `Ctrl`/`Cmd`+`K` or `/` opens the command pill;
`Escape` closes overlays and drawers. The rail footer cycles the illustrative
workspace and operational scope. The account menu cycles role views. Dialogs
and drawers move focus in, trap it, and restore focus to their trigger.

## Architecture and registry

V4 is a small vanilla ES-module preview. `styles/v3.css` remains the accepted
v3 baseline and `styles/v4.css` is the additive Route Console direction layer.
The source registry is kept in parity with v3 at **33 routes and 53 state
variants**; v4's registry-parity tool checks the complete shape rather than
only the route count.

```text
index.html                 module entry point
assets/fonts/              bundled Bricolage, IBM Plex Sans, Newsreader files
styles/
  tokens.css               shared identity, type, spacing, status, motion tokens
  base.css                 element defaults and utilities
  shell.css                preview chrome and shell primitives
  components.css           queues, forms, states, overlays, tables
  surfaces.css             public shell and surface-index primitives
  motion.css               inherited finite motion and reduced-motion rules
  responsive.css           shared responsive layers
  v3.css                   accepted v3 baseline
  v4.css                   Route Console geometry and choreography
src/
  app.js                   local routing, state changes, overlays, focus, theme
  registry.js              route/state/navigation registry
  components.js            reusable semantic render primitives
  icons.js                  bundled monoline sprite
  data/                    sanitized vocabulary and illustrative records
  surfaces/public.js       public and pre-auth routes
  surfaces/operations.js   role overviews and operational routes
  surfaces/admin.js        administration and owner-health routes
tools/
  export.mjs               inline the module graph into the offline HTML
  registry-parity.mjs      compare v4's route/state/nav shape with v3
  verify.mjs               six-width responsive, keyboard, request, and zoom audit
  contrast.mjs             light/dark text contrast sweep
  theme-test.mjs           theme state, persistence, system default, reduced motion
  motion-test.mjs          finite choreography, focus, fallback, and history checks
  shot.mjs                 deterministic screenshot capture
  review-shots.mjs         curated 12-capture finish-review set
```

The shell uses the N13 authenticated command pill and the N5 public floating
bar. Route lines, nodes, crosshair rules, portal steps, and the Ft5 public
statement close make route ownership visible without adding decorative data.
The identity remains oxblood and gold on warm paper, with a separately authored
charcoal dark theme. Bricolage Grotesque is the local display face, IBM Plex
Sans is the local body face, and Newsreader is reserved for the wordmark.

Motion is event-bound and finite: route arrival, staged boot, loading assembly,
overlay entry, theme change, selection, and completion each have a reason and
end state. There is no perpetual decorative shimmer. `prefers-reduced-motion`
removes travel and resolves state immediately while retaining text, labels, and
focus semantics. View Transition API support is optional; unsupported browsers
use a finite CSS route/state arrival, while reduced motion uses the synchronous
final-state path.

## Export and verification

Run these commands from the repository root. Set `PLAYWRIGHT_PATH` to the
repository's existing Playwright module; the preview does not install or fetch
dependencies.

```bash
node prototypes/impeccable-whole-site-redesign-v4/tools/export.mjs
node prototypes/impeccable-whole-site-redesign-v4/tools/registry-parity.mjs

PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs \
  node prototypes/impeccable-whole-site-redesign-v4/tools/verify.mjs \
  output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html \
  output/design/impeccable-redesign-v4-screens

PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs \
  node prototypes/impeccable-whole-site-redesign-v4/tools/contrast.mjs \
  output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html

PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs \
  node prototypes/impeccable-whole-site-redesign-v4/tools/theme-test.mjs \
  output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html

PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs \
  node prototypes/impeccable-whole-site-redesign-v4/tools/motion-test.mjs \
  output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html \
  output/design/impeccable-redesign-v4-motion-results.json

PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs \
  node prototypes/impeccable-whole-site-redesign-v4/tools/review-shots.mjs \
  output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html \
  output/design/impeccable-redesign-v4-review-shots
```

The recorded v4 evidence is six-width `verify.mjs` coverage at 320, 375, 414,
768, 1024, and 1440 CSS pixels with zero findings, browser errors, and
external requests; a zero-failure contrast sweep; a green theme test; motion
results of 10/10; and 12/12 review captures. The Impeccable detector was run
exactly once, reported three warnings, and each warning was repaired. It was
not rerun, so no later detector verdict is implied. A fresh finish reviewer
scored all five post-detector material findings resolved and gave disposition
**ship**.

## Strict preview-only boundary

- Do not edit application source, generated product artifacts, `PRODUCT.md`,
  v3 sources/exports, or unrelated `.impeccable/` state as part of this preview.
  Refresh `DESIGN.md` and `.impeccable/design.json` only through the Impeccable
  document workflow when the built visual system changes.
- Do not add live records, contacts, private identifiers, credentials, provider
  configuration, network calls, migrations, bindings, authentication, or
  deployment/release changes.
- Do not present illustrative values as operational truth. Public routes remain
  narrower than authenticated routes; protected stock, notes, roster, supplier,
  evidence, and audit internals stay out of public markup.
- Regenerate the export from modular source; never hand-edit the generated HTML.

## Related records

- `docs/design/IMPECCABLE_V4_REFERENCE_RESEARCH.md` - source review and boundaries
- `docs/design/IMPECCABLE_V4_DIRECTION.md` - pinned Route Console direction
- `docs/design/IMPECCABLE_V4_VISUAL_SYSTEM.md` - v4 visual tokens and geometry
- `docs/design/IMPECCABLE_V4_MOTION_AND_LOADING.md` - finite motion model
- `docs/design/IMPECCABLE_V4_DECISIONS.md` - decisions, costs, and open work
- `.codex/IMPECCABLE_V4_CURRENT.md` - exact current checkpoint
- `.codex/IMPECCABLE_V4_HANDOFF.md` - handoff and evidence summary
- `.codex/IMPECCABLE_V4_RESUME_PROMPT.md` - safe continuation instructions
