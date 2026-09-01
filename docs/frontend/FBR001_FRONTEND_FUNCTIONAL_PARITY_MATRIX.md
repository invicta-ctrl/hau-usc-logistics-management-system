# FBR-001 Frontend Functional Parity Matrix

STATUS: Phase A baseline inventory
FUNCTIONAL AUTHORITY: `Playground@7f483d2d713c406a465d218055696b31cd0dc9bd`, current Worker/API and server capability projection.
VISUAL AUTHORITY: immutable Claude archive and handoff named by FBR-001.
STATUS SEMANTICS: `PRESENT` means Claude already has the comparable composition; `PARTIAL` means it lacks an accepted current contract, state, route, tab, or real-data behavior; `MISSING` means no comparable Claude surface. These are baseline gaps, not implementation acceptance.

## Cross-cutting state and responsive contract

Every row requires loading, empty, safe error, denied, and stale/conflict states where its service can emit them; mutation controls are capability-gated presentation only and reconcile authoritative server responses. Tables become usable stacked mobile cards, tabs scroll rather than wrap, sheets use constrained layouts, and the page must not overflow horizontally at 320, 375, 390, 414, 768, 1024, 1440, or 1920 CSS px. Claude preview localStorage, role picker, seed arrays, and diagnostics are never runtime authority.

| Canonical route/surface | Auth/capability, reads and mutations | Current service/state authority | Claude equivalent | Status and adoption action |
|---|---|---|---|---|
| `landing` public gateway | Public reads; no protected mutation | `/api/public/advertisements`; brand routes; loading/empty/media-error | Public landing, editorial hero and navigation | PARTIAL — retain composition; bind governed assets and live advertisements without fake event state. |
| `staff-signin`, activation and recovery | Session/auth only; server decides identity and capability | `/api/auth/session`, login, activate, logout, activate/reset recovery; auth-required/activation/denied/service-error | Staff and USC role-pickers; preview `signIn()`/localStorage | PARTIAL — replace picker with canonical gateway/session flow; preserve truthful unavailable recovery responses. |
| `external-request` requester center | `request.create`, server-derived requester eligibility; read/create/cancel | `/api/portal/request`; CSRF mutation; draft/submitted/tracked/cancelled/denied/conflict | Three-step request wizard and line tracking | PARTIAL — map to server portal, choices, receipts and history. |
| Public request intake/tracking | Public reads and submission/tracking | `/api/public/request/options`, submit, track; validation/error/replayed receipt | Public request concept and `#/track`; no proven binding | PARTIAL — add current public request contract; never invent status. |
| `borrow`, `tracking` public lending | Public catalogue, submit, track | `/api/public/lending/catalog`, submit, track; receipt, line history, empty/error | Lending catalogue, borrow form, Track a record | PARTIAL — bind canonical responses and tracking states. |
| `overview` | Authenticated internal capability; read-only operational summaries | Session projection and current overview read model; personalized/denied/loading | Command panel, Needs you, timeline and diagnostics | PARTIAL — feed server-derived counts/queues; no seed diagnostics/activity. |
| `inventory` and catalogue | Authorized inventory/read/classification; audited changes only | Inventory bootstrap; ledger contract; availability/on-hand, empty/error/stale | Inventory stock/restock/catalogue tabs, edit/add controls | PARTIAL — map current routes/tabs and response models; no local balance edits. |
| `restocking`/receiving | `fulfillment.receive`; evidence where granted | `/api/bootstrap/restocking`, `/api/receiveRestock`, evidence upload; cumulative/idempotent/conflict | Receiving is visually inside Claude Inventory | MISSING — add dedicated canonical deep link in Claude inventory vocabulary. |
| `request-center` Internal Request Hub | `request.review` and line-level route capabilities | Internal request bootstrap, `/api/reviewRequest`; per-line routing, correction/reject reasons, split/stale/denied | Request Hub queue, drawer, per-line decisions | PARTIAL — retain line-decision DNA and separate Release Desk. |
| `release` Release Desk | `fulfillment.release`, evidence upload | `/api/bootstrap/release`, `/api/confirmRelease`, `/api/uploadEvidence`; ready-to-claim/custody/history | Claude puts release inside request/loan records | MISSING — preserve dedicated route/deep link in Claude sheet/timeline language. |
| `lending` Internal Lending Hub | Lending approval/handoff/return/evidence capability projection | Current lending bootstrap and approve/handoff/return/evidence commands; custody, due/overdue, duplicate/conflict | Lending Hub and record sheet | PARTIAL — bind real lifecycle/evidence; no preview mutations. |
| `procurement` | Current procurement/canvass capabilities | `/api/bootstrap/procurement`; current command set; quote/award/error/denied | Procurement requisitions, canvassing and suppliers | PARTIAL — retain tabs and add server-backed state/actions. |
| `events` | `event.manage` where granted | Current events bootstrap/event management; loading/error/denied | Events cards, readiness context and optional event themes | PARTIAL — use real events/readiness; live themes only from accepted data. |
| `administration` | `access.admin` plus granular permissions | Admin directory, staff history, reference links, brand assets, health/readiness; audited mutations | Eight-tab Administration | PARTIAL — reconcile actual tab/capability set and protected-data boundaries. |
| `profile` | Authenticated account controls; server session revocation | `/api/me/profile`, appearance, avatar, username/password/correction endpoints | Profile and display-family swatches | PARTIAL — retain preferences only through accepted server/local contract; clear on sign-out. |
| Playground Index, inspection and tester utilities | Playground-only authorization; no Production exposure | `/api/version`, `/api/playground/status`, authorized Playground operation | Diagnostics panel only | MISSING — preserve required tester routes/chrome; deny/omit in Production mode. |

## Integration target and evidence

Retain `src/frontend/app/*` for route composition and extend `src/frontend/integration/backend.ts`, which owns same-origin credentials, in-memory CSRF, response projection, and safe API errors. Do not add the archive's proposed competing transport. Deterministic sources: `appRoutes.ts`, `appTypes.ts`, `useAppController.ts`, `AppRouteRenderer.tsx`, `backend.ts`, and scratch `site/{index.html,core.js,app.js,hub.js,styles.css}` plus its assets/fonts/audit scripts.
