# HAU-USC Logistics — whole-site redesign preview

Non-production design prototype for the v3 **Calm Institutional Operations**
direction. It resets the v2 visual language without changing product workflows.

This is a design artifact. It contains no production code, contacts no live
service, and all data in it is sanitized and illustrative.

## Open it

**Easiest — the generated single-file export.** Double-click:

```
output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v3.html
```

It needs no server and no credentials.

**The modular source** (authoritative) uses ES modules, which browsers refuse to
load over `file://`. Serve the directory over HTTP:

```bash
npx --yes http-server prototypes/impeccable-whole-site-redesign-v3 -p 4173 -c-1
```

Then open `http://127.0.0.1:4173/`.

## Using the preview

The bar across the top is preview chrome, not part of the product design.

| Control | What it does |
|---|---|
| Surface picker | Jump to any of the 32 surfaces |
| State picker | Switch between that surface's states (loading, empty, error, denied, stale, partial, success…) |
| Desktop / Tablet / Mobile | Reflows the real layout — the shell uses container queries, so this is not a fake |
| Light / Dark | Both themes are separately designed |
| Index | Return to the surface index |

Inside a workspace: `Ctrl`/`⌘`+`K` or `/` opens search, `Escape` closes any
overlay, and the rail's two footer buttons cycle workspace and operational
scope. The account menu can cycle the role view.

Everything is keyboard reachable. Dialogs and drawers move focus in, trap it,
and restore it to the trigger on close.

## Layout

```
index.html                 entry point
styles/
  tokens.css               identity ramp, status tones, type, space, motion
  base.css                 element defaults and utilities
  shell.css                preview chrome + application shell
  components.css           chips, tables, split pane, drawer, forms, states
  surfaces.css             public portals and the surface index
  responsive.css           inherited container-query layers
  v3.css                   v3 direction, controls, themes, loading, responsive polish
src/
  app.js                   shell, routing, overlays, focus management
  registry.js              surface registry — mirrors the surface matrix
  components.js            reusable primitives
  icons.js                 monoline sprite, one brand ink
  data/vocabulary.js       enum → user-facing label maps
  data/mock.js             sanitized illustrative data
  surfaces/public.js       11 public and pre-auth surfaces
  surfaces/operations.js   overviews and core operational surfaces
  surfaces/admin.js        administration and supporting modules
tools/
  export.mjs               inline modular source into the single-file export
  verify.mjs               accessibility + responsive checks, screenshots
  contrast.mjs             WCAG contrast sweep, both themes
```

## Tooling

```bash
# regenerate the shareable export
node prototypes/impeccable-whole-site-redesign-v3/tools/export.mjs
```

`verify.mjs` and `contrast.mjs` need Playwright. This preview has no
`node_modules`, so point them at an existing install:

```bash
PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs node prototypes/impeccable-whole-site-redesign-v3/tools/verify.mjs <preview.html> <screens-dir>
```

## Boundaries

- No network requests. Verified: 0 non-`file:` requests across all surfaces.
- No `google.script.run`, no D1/R2/Worker access, no authentication bypass.
- No production source, generated artifact, migration, binding, or deployment
  config is touched.
- The reference HTML in `docs/design/references/` is preserved byte-for-byte.

## Related documents

- `DESIGN.md` — the design system
- `PRODUCT.md` — durable product truth
- `docs/design/IMPECCABLE_V3_REFERENCE_RESEARCH.md` — external principle research
- `docs/design/IMPECCABLE_V3_DIRECTION_RESET.md` — the accepted v3 direction
- `docs/design/IMPECCABLE_V3_VISUAL_SYSTEM.md` — tokens and composition rules
- `docs/design/IMPECCABLE_V3_DYNAMIC_CONTROLS.md` — menu, back, and theme controls
- `docs/design/IMPECCABLE_V3_MOTION_AND_LOADING.md` — motion and waiting states
- `docs/design/IMPECCABLE_V3_DECISIONS.md` — decisions and costs
- `output/design/IMPECCABLE_REDESIGN_V3_REVIEW.md` — review and verification results
