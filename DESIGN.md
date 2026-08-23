---
schema_version: 1
status: active
scope: hau-usc-logistics-frontend
authority: canonical
branch: frontend-design-integration
visual_authority: live-figma-make-rP9W9MQlZkyQrUx38TVsFS
design_documentation_authority: live-figma-design-hXJElH4p72KfgAaoUyfNOC-current-lane
functional_authority: repository-server-worker-auth-contracts
accepted_amendment: .codex/specs/accepted/2026-08-23-r3-a1-figma-make-design-sync-codex-preview-handoff.md
last_reviewed: 2026-08-23
# Machine-readable palette. Generated from scripts/design/theme-source.mjs, the
# canonical token source, and emitted into src/frontend/styles/theme.css. This
# block exists so tooling can tell a real design-system addition from drift; it
# does not replace the variables, which remain the implementation contract.
colors:
  oxblood-deep: "#40070a"
  oxblood-mid: "#78141a"
  oxblood-light: "#8d1f28"
  oxblood-dark-ground: "#4a1015"
  gold-canonical: "#d4af37"
  gold-vivid: "#e8b93c"
  gold-mid: "#f2d15c"
  gold-pale: "#f6e29a"
  gold-cream: "#faeecb"
  gold-dark-mode: "#e1c671"
  accent-text: "#7d5518"
  accent-text-dark: "#c9a45f"
  paper-warm: "#fffdf8"
  paper-mid: "#fcf2cf"
  paper-light: "#f7f0e2"
  paper-bg: "#f2eae5"
  ink-deep: "#241416"
  ink-mid: "#6f5a60"
  border-warm: "#d1b478"
  border-paper: "#e6dcc9"
  on-oxblood: "#ffffff"
  scrim: "rgba(0,0,0,0.5)"
  hairline-gold: "rgba(242,209,92,0.16)"
  hairline-gold-strong: "rgba(242,209,92,0.28)"
typography:
  display:
    fontFamily: "'Bricolage Grotesque', system-ui, sans-serif"
    fontWeight: 700
  editorial:
    fontFamily: "'Newsreader', Georgia, serif"
    fontWeight: 700
  body:
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif"
    fontWeight: 600
  mono:
    fontFamily: "'IBM Plex Mono', ui-monospace, monospace"
    letterSpacing: "0.1em"
# Deliberately no fontSize steps: the shipped system declares font families and
# weights but has never defined a type ramp. theme.css carries only
# `--font-size: 16px` as a base. Recorded as real tokenization debt in
# docs/frontend/WORKFLOW_ARCHITECTURE.md rather than papered over by declaring
# the ad-hoc literals in use (9, 10, 11, 12, 13, 14, 15, 16, 18, 19px) as a ramp.
# Radius scale is real, and is the computed output of theme.css:
#   --radius: 0.625rem -> sm 6px, md 8px, lg 10px, xl 14px.
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  pill: "999px"
---

# HAU-USC Logistics frontend design authority

## Authority hierarchy

1. Earl's current explicit instruction, then the accepted specification and its
   approved amendments. The current amendment is **R3-A1**.
2. **Repository backend, API, auth, data, security and provider contracts** are
   the sole *functional* authority: authorization, capabilities, request
   semantics, state transitions, inventory truth, privacy, and data ownership.
3. **Live Figma Make `rP9W9MQlZkyQrUx38TVsFS`** is the *interactive frontend
   prototype* authority — composition, route/flow, motion and responsive
   behaviour — wherever it does not contradict a functional contract.
4. **The current-authority lane of live Figma Design `hXJElH4p72KfgAaoUyfNOC`**
   is the *design documentation and visual reference* authority: workflow
   references, component and state references, responsive, accessibility and
   motion documentation, and traceability.
5. Repository design mirrors, registers and audits under `docs/design/` are
   derived evidence.
6. Historical lanes are provenance only and never authority.

R3-A1 changes item 4. Before R3-A1 this file said flatly that "the Figma Design
file is documentation and historical reference". That is now too blunt: the
file's **historical pages remain historical**, but its **current-authority lane
is synchronized by R3-A1 and is a current visual and documentation reference**.
Pages 00–03 are capture baselines and HISTORICAL. Pages 11–13 are the design
system. Pages 15–90 are modules. Pages 91–99 are annotation matrices. Frame and
page names carry the binding status vocabulary — CURRENT, HISTORICAL,
SUPERSEDED, PROTOTYPE, CONTRACT-GATED — and those words are authoritative.

Neither the design authorities nor the functional contracts may be inferred from
one another.

## R3 public / staff workflow architecture

This is the model every layer must agree with. It is the reason R3-A1 exists.

```text
Start a logistics request
        |
        v
PUBLIC REQUEST CENTER            Staff Sign In
NO STAFF LOGIN REQUIRED                |
        |                              v
        |                    AUTHENTICATED STAFF ENTRY
        |                              |
        |                              v
        |                    CAPABILITY-GATED INTERNAL WORKSPACES
        |                              |
        v                              v
   canonical request  --------->  INTERNAL REQUEST HUB
   + request lines                     |
        |                              +--> Inventory / reservation path
        |                              +--> Procurement / receiving path
        |                              +--> Release path
        v
   requester-safe tracking projection
```

One canonical request and its request lines sit underneath both surfaces. There
is no second request system.

### Public Request Center

PUBLIC. No normal staff login. Offers **New Request** and **Track Existing
Request**. It must never expose internal staff operations.

The precise authority for the no-login model is:

- `D06 — Product / Route Inventory` records `/request` as *Public request
  intake* and `/request#request-tracking` as *Public request tracking*.
- Production `public-requester-portal.js` at `0.8.2 / c316e047` contains **no
  session check, no sign-in gate and no authorization branch**; the contrary
  design state is logged as `ACCESS_MODEL_DRIFT` / `PL-01` in
  `docs/design/PRODUCTION_PORTAL_PARITY_AUDIT.md`.
- The accepted public request Worker contract exposes `/api/public/request`.

**Correction of record.** `.codex/R3_PUBLIC_STAFF_BOUNDARY_RECEIPT.md` cites
`DESIGN.md` D24.0 as the OWNER-LOCKED authority for the *public Request Center*.
D24.0 is the OWNER-LOCKED no-login model for the **Public Lending Center**. It is
the correct analogous precedent but it is not the Request citation. Use the three
sources above for Request. The historical receipt is preserved as written; this
paragraph supersedes its citation.

### Internal Request Hub

INTERNAL. Staff session required and capability-gated. It is a distinct surface
from the Public Request Center, over the same canonical request. `D23.0` records
it as a submission form with the review queue appended, gated on the
`request.review` capability, with a per-line route decision and no pre-selected
default (RV-01.6).

A generic **Staff Sign In** authenticates a session; it must not pre-commit to
one capability-gated destination. Pre-committing denies otherwise-valid staff
accounts that simply lack that one capability.

### Lending boundary

Borrower verification and staff authentication are different concepts. The
Public Lending Center requires no login (`D24.0`, OWNER-LOCKED) and serves USC
Staff/Officers and Angelite students as equal borrower classes. The internal
Office Lending Hub (`D24.1`) is authenticated and capability-gated.

### Module and action ownership

One authoritative business action has exactly one owning module. Other modules
deep-link to it or display its result; they do not re-implement it.

## Current implemented scope

FI-00 through FI-03 are implemented in `src/frontend/`:

- institutional design foundation and public landing;
- Make hero poster, scrims, entrance motion, and reduced-motion behavior;
- public navigation, Request, Lending, receipt, and tracking presentation;
- sign-in, session/bootstrap, logout, starter activation, email verification,
  account application, private status-token lookup, and withdrawal;
- responsive layouts at 320, 390, 768, 1024, and 1440 CSS pixels, plus 200%
  effective reflow;
- light/dark presentation, keyboard focus, semantic states, and no horizontal
  overflow.

R3 additionally repaired the public request entry: the hero, footer, mobile
drawer and Logistics-hub tile now route to the public `request` route, the hero
accessible name states the public no-sign-in model, and `PublicFlows` navigates
to `staff-signin` directly. Repository baseline commit: `e30fbff`.

**Authenticated operational workspaces begin in FI-04 and are not exposed.**
`AuthenticatedShell` is not mounted and the staff route components are orphaned.
Design material for pages 20–80 is therefore **DESIGN AUTHORITY / READY FOR
FI-04 IMPLEMENTATION** — it is *not* implementation-verified. No design artifact
may fabricate authorization, identifiers, status, inventory, approval, or
provider state.

## Visual system

- Oxblood provides institutional structure; warm gold marks focus and primary
  action. Canonical primary gold is `#D4AF37`, OWNER-LOCKED.
- Warm paper and restrained, contextual Institutional Glass carry public and
  authentication surfaces. Glass is localised to layers that earn it, never a
  wash over the whole application.
- Newsreader is the editorial hero face; Bricolage Grotesque is the display
  face; IBM Plex Sans and Mono carry operational copy and labels.
- Lines are semantic; decorative rules are rejected. Purposeful asymmetry and
  operational hierarchy are preserved — this is not a generic SaaS dashboard.
- Official USC and Department of Logistics identity follows the live Make
  ordering and compact mobile reduction.
- The public landing preserves the exact Make hierarchy, poster crop,
  two-gradient readability model, and staggered entrance.

## Responsive, motion and accessibility

- Required widths: 320, 375, 390, 414, 768, 1024, 1440, 1920.
- Motion is purposeful and honours `prefers-reduced-motion`.
- WCAG 2.2 AA is the contrast floor; 66 of 66 measured token pairs pass in both
  themes. Keyboard focus and semantic states are required, not optional.
- Annotation matrices live on pages 91–94 of the design file.

## Provider and mirror identity

| Authority | Identity |
|---|---|
| Figma Design | `hXJElH4p72KfgAaoUyfNOC` — 28 pages. Current-authority board: page `55:3`, board `568:2`, R3-A1 block `733:2` |
| Figma Make | `rP9W9MQlZkyQrUx38TVsFS` — **Version 40** (R3-A1; previous 39) |
| Repository Make mirror | `output/design/make-adoption/`, `output/design/make-preservation/`, `output/design/figma-make-source/`, `prototypes/public-portals-r3/figma-make/` |
| Registers | `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md`, `docs/design/FIGMA_BASELINE_REGISTER.md` |

**Figma Make is synchronized and verified.** R3-A1 applied the public request
reconciliation to eight Make source files and saved them: **Version 39 → Version
40**, zero pending edits after a full reload, provider version-history entry
"8 edited files — Version 40". Exercised live: "Start a logistics request"
reaches "PUBLIC REQUEST · NO SIGN-IN — Request Center", and "Staff sign in"
reaches a separate staff sign-in page. The exact changeset is tabulated in
`.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md`.

**The repository Make mirror is refreshed to v40.** `output/design/figma-make-source/`
now matches the live saved source, satisfying R3-A1 §12. Per-file bytes and sha256
are recorded in `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md`, together with an
explicit statement of how far each file is verified — one byte-verified, three
structure-verified against full provider reads, four reconstructed and
grep-verified.

## Codex adoption workflow

1. Read `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`.
2. Read this file, `docs/frontend/WORKFLOW_ARCHITECTURE.md`, and
   `.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md`.
3. Implement only inside `src/frontend/` and frontend-owned surfaces.
4. Run the **local** frontend preview and compare against the Figma Design
   current-authority references named above.
5. Do not treat any FI-04 staff workspace as verified.

## Implementation boundaries

- Frontend transport is same-origin and cookie-based.
- CSRF remains in memory and is sent only where the server contract requires it.
- Private verification receipts and status tokens remain caller-scoped and are
  never placed in URLs or persistent browser storage.
- Receipts and tracking views are constructed by the frontend from
  server-confirmed values; the client never invents record identifiers, tracking
  codes, status, or lifecycle history.
- Production deployment, backend changes, provider changes other than the two
  design files named by R3-A1, and schema or migration changes require separate
  accepted authority.
- Playground, Production and `main` are out of scope for this phase.

## Known residuals

- Four of the eight mirrored Make files are reconstructed rather than byte-re-read; see the source register if byte-level proof is wanted.
- `.impeccable/design.json` is stale from the pre-cutover v4.1 design; see
  FE-R3-010 / FE-R3-011 in `docs/frontend/WORKFLOW_ARCHITECTURE.md`.
- 54 colours on design page 15 were restored by inference in the 2026-08-19
  sweep incident and cannot be identified; a non-blocking evidence gap.
- FVR-02 remains BLOCKED_PARTIAL on its recorded media blockers.

## Stale if

This file is stale if R3-A1 is superseded; if the live Make version is not 40 and
that is not recorded here; if `docs/frontend/WORKFLOW_ARCHITECTURE.md` or the
Figma Design current lane stops agreeing with the workflow model above; or if
FI-04 workspaces become runnable and are still described here as unexposed.

Recovery and source-delivery evidence lives under `docs/frontend/`. Historical
design research under `docs/design/` is reference-only and cannot override this
file, live Make, the Figma Design current-authority lane, an accepted
specification, or repository functional contracts.
