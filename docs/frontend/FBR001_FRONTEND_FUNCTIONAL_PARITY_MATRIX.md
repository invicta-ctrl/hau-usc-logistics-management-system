# FBR-001 Frontend Functional Parity Matrix

STATUS: Phase F1 public/request/overview visual-parity checkpoint complete; Phase F2 internal operations remains pending parent direction
FUNCTIONAL AUTHORITY: `Playground@7f483d2d713c406a465d218055696b31cd0dc9bd`, current Worker/API and server capability projection.
VISUAL AUTHORITY: immutable Claude archive and handoff named by FBR-001.
STATUS SEMANTICS: `PRESENT` means Claude already has the comparable composition; `PARTIAL` means it lacks an accepted current contract, state, route, tab, or real-data behavior; `MISSING` means no comparable Claude surface. These are baseline gaps, not implementation acceptance.

## Cross-cutting state and responsive contract

Every row requires loading, empty, safe error, denied, and stale/conflict states where its service can emit them; mutation controls are capability-gated presentation only and reconcile authoritative server responses. Tables become usable stacked mobile cards, tabs scroll rather than wrap, sheets use constrained layouts, and the page must not overflow horizontally at 320, 375, 390, 414, 768, 1024, 1440, or 1920 CSS px. Claude preview localStorage, role picker, seed arrays, and diagnostics are never runtime authority.

| Canonical route/surface | Auth/capability, reads and mutations | Current service/state authority | Claude equivalent | Status and adoption action |
|---|---|---|---|---|
| `landing` public gateway | Public reads; no protected mutation | `/api/public/advertisements`; brand routes; loading/empty/media-error | Public landing, editorial hero and navigation | PRESENT — F1 preserves live announcements and governed landing navigation in a ruled editorial sheet; no synthetic event or metric state. |
| `staff-signin`, activation and recovery | Session/auth only; server decides identity and capability | `/api/auth/session`, login, activate, logout, activate/reset recovery; auth-required/activation/denied/service-error | Staff and USC role-pickers; preview `signIn()`/localStorage | PRESENT — F1 presents the existing canonical gateway/session states in the editorial access sheet; no preview role picker or local authority. |
| `external-request` requester center | `request.create`, server-derived requester eligibility; read/create/cancel | `/api/portal/request`; CSRF mutation; draft/submitted/tracked/cancelled/denied/conflict | Three-step request wizard and line tracking | PRESENT — F1 keeps the real wizard, receipt/history, server-reconciled cancellation, and conflict/denial branches in the entry-flow vocabulary. |
| Public request intake/tracking | Public reads and submission/tracking | `/api/public/request/options`, submit, track; validation/error/replayed receipt | Public request concept and `#/track`; no proven binding | PARTIAL — add current public request contract; never invent status. |
| `borrow`, `tracking` public lending | Public catalogue, submit, track | `/api/public/lending/catalog`, submit, track; receipt, line history, empty/error | Lending catalogue, borrow form, Track a record | PRESENT — F1 retains real catalogue/receipt/private tracking states and provides tokenized scrolling tabs, sheet boundaries, and focus treatment. |
| `overview` | Authenticated internal capability; read-only operational summaries | Session projection and current overview read model; personalized/denied/loading | Command panel, Needs you, timeline and diagnostics | PRESENT — F1 retains server-derived personalized signals, denied/error/stale states, and authorized queues in the Workbench sheet/attention order. |
| `inventory` and catalogue | Authorized inventory/read/classification; audited changes only | Inventory bootstrap; ledger contract; availability/on-hand, empty/error/stale | Inventory stock/restock/catalogue tabs, edit/add controls | PARTIAL — map current routes/tabs and response models; no local balance edits. |
| `restocking`/receiving | `fulfillment.receive`; evidence where granted | `/api/bootstrap/restocking`, `/api/receiveRestock`, evidence upload; cumulative/idempotent/conflict | Receiving is visually inside Claude Inventory | MISSING — add dedicated canonical deep link in Claude inventory vocabulary. |
| `request-center` Internal Request Hub | `request.review` and line-level route capabilities | Internal request bootstrap, `/api/reviewRequest`; per-line routing, correction/reject reasons, split/stale/denied | Request Hub queue, drawer, per-line decisions | PARTIAL — retain line-decision DNA and separate Release Desk. |
| `release` Release Desk | `fulfillment.release`, evidence upload | `/api/bootstrap/release`, `/api/confirmRelease`, `/api/uploadEvidence`; ready-to-claim/custody/history | Claude puts release inside request/loan records | MISSING — preserve dedicated route/deep link in Claude sheet/timeline language. |
| `lending` Internal Lending Hub | Lending approval/handoff/return/evidence capability projection | Current lending bootstrap and approve/handoff/return/evidence commands; custody, due/overdue, duplicate/conflict | Lending Hub and record sheet | PARTIAL — bind real lifecycle/evidence; no preview mutations. |
| `procurement` | Current procurement/canvass capabilities | `/api/bootstrap/procurement`; current command set; quote/award/error/denied | Procurement requisitions, canvassing and suppliers | PARTIAL — retain tabs and add server-backed state/actions. |
| `events` | `event.manage` where granted | Current events bootstrap/event management; loading/error/denied | Events cards, readiness context and optional event themes | PARTIAL — use real events/readiness; live themes only from accepted data. |

## Phase B–C reconciliation evidence

| Shared surface | Phase B–C status | Functional authority retained | Adoption action completed | Phase D residual |
|---|---|---|---|---|
| Canonical foundation | PRESENT | `theme-source.mjs` remains color authority; `foundation-source.mjs` remains non-color authority | Added all eight required inspection widths and generated quiet Workbench primitives: command, box, attention, line decision, tabs. | Apply primitives route-by-route; no competing root token sheet. |
| Typography/assets | PRESENT | Existing CSP and frontend asset pipeline | Self-hosted the four minimal, hash-verified Claude Latin subsets for Bricolage, Newsreader, IBM Plex Sans, and Plex Mono; no CDN. | Audit route usage so no page exceeds three families and mono stays data-only. |
| Public shell | PRESENT | Existing `AppRouteRenderer`, `PublicNavbar`, `PublicFlows`, and backend adapter | Retained public routes/deep links and existing editorial composition; no archive seed, role picker, or localStorage state adopted. | Reconcile landing/borrow/tracking bodies and real loading/empty/error states. |
| Staff sign-in/recovery | PRESENT | Existing same-origin session, CSRF, activation, recovery, and denial contracts | Retained canonical staff gateway and state handling; no preview auth substituted. | Phase D visual/body reconciliation only; keep all recovery/server errors truthful. |
| Authenticated Workbench | PRESENT | `projectSession`, capability projection, `AuthenticatedShell`, and current route registry | Replaced nonfunctional Search/⌘K placeholder with a truthful current-workspace command panel; navigation remains capability-filtered. | Apply the vocabulary to each module body without changing authorization. |
| Every existing route | PRESENT (shell) / PARTIAL (body) | `APP_ROUTES`, `AUTH_ROUTES`, controller and existing backend adapter | All 15 routes retained; external request and internal modules remain session/capability-gated. | Phase D must reconcile each route body against the original table without mock data or a second transport. |
| `administration` | `access.admin` plus granular permissions | Admin directory, staff history, reference links, brand assets, health/readiness; audited mutations | Eight-tab Administration | PARTIAL — reconcile actual tab/capability set and protected-data boundaries. |
| `profile` | Authenticated account controls; server session revocation | `/api/me/profile`, appearance, avatar, username/password/correction endpoints | Profile and display-family swatches | PARTIAL — retain preferences only through accepted server/local contract; clear on sign-out. |
| Playground Index, inspection and tester utilities | Playground-only authorization; no Production exposure | `/api/version`, `/api/playground/status`, authorized Playground operation | Diagnostics panel only | MISSING — preserve required tester routes/chrome; deny/omit in Production mode. |

## Phase D real-read reconciliation evidence

| Read family | Route implementation | Existing canonical adapter read | Phase D result |
|---|---|---|---|
| Public announcement/config | `landing/CurrentSection.tsx` | `publicAdvertisements` | PRESENT — loading, empty, request/media error are already real-service states. |
| Public lending/tracking | `PublicFlows.tsx` | `publicLendingCatalog`, `trackPublicRequest`, `trackPublicLending` | PRESENT — catalogue and private tracking results remain backend-derived. |
| External requester | `request/ExternalRequestCenter.tsx` | existing requester portal bootstrap | PRESENT — session-gated requester data remains on the canonical adapter. |
| Overview | `overview/OverviewRoute.tsx` | `operationalModuleBootstrap('overview')` | PRESENT — authorized/stale/denied/error handling retained. |
| Inventory | `inventory/InventoryRoute.tsx` | `inventoryBootstrap` | PRESENT — normal mode starts empty then consumes the bounded server projection; `INV_FIXTURE` is inspection-only. |
| Internal request/lending | `request/InternalRequestHub.tsx`; `lending/InternalLendingHub.tsx` | `requestBootstrap`; `lendingBootstrap` | PRESENT — preview queues are inspection-only; normal queues use real bootstrap data. |
| Release/restocking/procurement | `operations/OperationalModuleRoute.tsx` | `operationalModuleBootstrap(module)` | PRESENT — one canonical read projection serves the preserved routes. |
| Events/administration/profile | `events/EventReadinessRoute.tsx`; `AdministrationRoute.tsx`; `profile/ProfileRoute.tsx` | `eventManagement`; administration reads; `profile` | PRESENT — protected reads stay capability/session-scoped. |

No adapter extension was required. Phase D tests assert these bindings and fixture isolation; Phase E retains all mutation controls and is not started by this checkpoint.

## Phase E real-write reconciliation evidence

| Mutation family | Existing endpoint/adapter and route evidence | Phase E result |
|---|---|---|
| Public lending submit/receipt | `PublicFlows.tsx` → `submitPublicLending` → `POST /api/public/lending` | PRESENT — public receipt is server-returned; no authenticated cancellation contract is exposed on this route. |
| Anonymous public request | `/api/public/request` exists in the preserved Worker, but `PublicFlows.tsx` records its owner-locked supersession by authenticated requester mode | INTENTIONALLY_DEFERRED — do not revive a superseded anonymous workflow. |
| External requester submit/cancel | `ExternalRequestCenter.tsx` → `submitRequesterRequest` / `cancelRequesterRequest` → `POST /api/portal/request` and `/cancel` | PRESENT — cancellation is rendered only for `FOR_REVIEW`/`ACCEPTED`, carries a new client idempotency key, disables while pending, reconciles returned status, and reloads after 403/409. |
| Internal review | `InternalRequestHub.tsx` → `reviewRequest` → `POST /api/reviewRequest` | PRESENT — existing line-route, validation, conflict/denial recovery, and authoritative queue refresh retained. |
| Release/receiving/evidence | `ReleaseStation.tsx`; `ReceivingStation.tsx` → `uploadOperationalEvidence`, `confirmRelease`, `receiveRestock` | PRESENT — existing CSRF, receipt, cumulative/idempotent, conflict, and reload behavior retained. |
| Lending lifecycle/evidence | `InternalLendingHub.tsx` → approve/handoff/return/evidence canonical methods | PRESENT — existing capability, custody, pending, conflict/denial, and refresh behavior retained. |
| Profile/account/session | `ProfileRoute.tsx`, `AccountAccessPanel.tsx`, `AccountRecoveryPanel.tsx`, `useAppController.ts` → current profile/account/auth methods | PRESENT — credential/session revocation remains server returned and controlled. |
| Playground-gated administration reset | `AdministrationRoute.tsx` → `requestPlaygroundReset` | PRESENT — existing Playground-only server gate retained; no reset was requested in this checkpoint. |
| Direct inventory reserve/adjust and restock transition | Server has accepted domain commands, but `backend.ts` and current React routes expose no accepted adapter/route action | INTENTIONALLY_DEFERRED — Phase F visual parity is excluded; no new command or capability is invented. |
| Procurement/events command mutations | Current React routes expose `operationalModuleBootstrap('procurement')` and `eventManagement` reads only | INTENTIONALLY_DEFERRED — no current accepted React mutation command exists. |

## Integration target and evidence

Retain `src/frontend/app/*` for route composition and extend `src/frontend/integration/backend.ts`, which owns same-origin credentials, in-memory CSRF, response projection, and safe API errors. Do not add the archive's proposed competing transport. Deterministic sources: `appRoutes.ts`, `appTypes.ts`, `useAppController.ts`, `AppRouteRenderer.tsx`, `backend.ts`, and scratch `site/{index.html,core.js,app.js,hub.js,styles.css}` plus its assets/fonts/audit scripts.
