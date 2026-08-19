# Public Portals R3 — coded counterpart

Two things live here. They exist because the design work has to be *visible and
runnable*, not only drawn.

```text
figma-make/src/app/PublicFlows.tsx   ← the deliverable for Figma Make
index.html + *.css + *.js            ← a standalone vanilla prototype
```

## 1. The Figma Make deliverable

**Target:** Figma Make file `rP9W9MQlZkyQrUx38TVsFS`
(*HAU-USC Logistics — Prototyping*) → `src/app/PublicFlows.tsx`.
Replace the whole file. The props and default export are unchanged, so
`App.tsx` and `AppRouteRenderer.tsx` need no edit.

**Why it must be replaced.** The file currently in Make gates both public
portals behind staff sign-in. Verbatim from it:

- Request intake — *"Sign in before entering activity, item, quantity, or timing details"*, `Public data entry — Disabled`, button **"Sign in to start request"**
- Lending discovery — *"Sign in to choose quantity, dates, and take a protected lending action"*, button **"Sign in to request equipment"**

That contradicts production. At `0.8.2 / c316e047`,
`public-lending-portal.js` and `public-requester-portal.js` contain **no session
check, no sign-in gate and no authorization branch**. `DESIGN.md` D24.0 records
the no-login model as OWNER-LOCKED. It is the same `ACCESS_MODEL_DRIFT` logged
as PL-01 in the parity audit, present in Make as well as in the design file.

**What the replacement contains**

| Surface | Coverage |
|---|---|
| Lending Center | Catalog-first; four filters; six items exercising `AVAILABLE` / `LIMITED` / `ELIGIBILITY_REQUIRED` / `UNAVAILABLE`; selection with per-item quantity capped at `maximumQuantity`; both borrower branches; conditional due date and conditional responsibility acknowledgment driven by the selected item's rules; all five acknowledgments; receipt with one-time code |
| Request Center | Five-step flow; both purposes with their distinct step-3 branches; request lines; review stage with per-step Edit; all four acknowledgments |
| Tracking | Identifier + masked code, with the privacy boundary stated |
| Staff sign in | A hand-off, not a view. `onRequireAuth` fires and the portal is left behind. The application form itself lives in `figma-make/src/app/StaffAccess.tsx`, rendered by the sign-in surface — production keeps it as an `auth-card`, not a public portal tab |
| Catalog states | Populated, loading, service error, and *nothing published*, kept distinct from *filtered empty* |

`onRequireAuth` is retained in the props type for compatibility but is no longer
used to gate public intake.

**Applying it.** The Figma MCP toolchain can *read* Make files
(`get_design_context`) but cannot write to them — `use_figma` and `get_metadata`
both reject Make files outright. So this file has to be pasted in through the
Make editor. It is plain React + TypeScript with an inline `<style>` block,
matching the conventions of the file it replaces, and imports only from
`../../ProductionAssets`, which already exists in that project.

## 2. The standalone prototype

Vanilla ES modules, no build step. Because it uses ES modules it needs a server,
not `file://`:

```bash
python3 -m http.server 8791 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8791/index.html`. Query parameters:
`?route=lending|request&theme=light|dark`. The bar at the top switches route,
theme, and catalog state.

Verified in-browser: zero console errors; selecting the wireless microphone
flips both the due-date and responsibility-acknowledgment requirements on;
switching borrower type disables *and clears* the inactive branch so it cannot
submit stale data; unavailable items are non-selectable.

## The glass system

`glass.css` ports the G0–G4 ladder from Figma page 11 / page 20 to every module.
The rule it holds to, and the reason it is written the way it is: **glass is for
containers.** Body text, inputs and tables sit on a near-opaque layer inside the
pane, so contrast never depends on what drifts behind.

The G0 ground is built from large, slow radial fields because a Gaussian blur
destroys detail below roughly 2·sigma — at the G2 sigma of 22px only features
larger than about 132px survive as structure. Paper tooth, gold hairlines and the
ledger rules are therefore painted *on* the pane as borders and a noise overlay,
never expected to transmit through it.

`prefers-reduced-transparency` and `prefers-reduced-motion` both fall back to
opaque surfaces. Below 768px the backdrop drops to two fields and the noise
overlay is removed, because a full-viewport `backdrop-filter` is the single most
expensive thing on a phone.

## Honesty

No file here talks to a backend. Every simulated outcome is labelled in the UI.
Identifiers and tracking codes are visibly fixtures (`PROTOTYPE-CODE-NOT-REAL`).
No success is presented as though a service confirmed it.

Fonts are loaded from Google in `index.html` **only** because that file is opened
directly for review. `DESIGN.md` D09 forbids a remote font dependency in the
product without an accepted performance and privacy decision, and D30 registers
bundled `.woff2` files for all three families.
