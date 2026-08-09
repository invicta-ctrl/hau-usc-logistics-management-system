# V5 to Production Frontend Transfer Map

Status: **ACCEPTED IMPLEMENTATION MAP**  
Owner direction: 2026-08-09  
Starting SHA: `d57b1c5931c82886b98c88dc468adfefd3d62bdf`  
Visual/frontend authority: `prototypes/impeccable-whole-site-redesign-v5/`  
Functional authority: deployed `v0.7.2` at
`84eacfcdb47a3985fed48e3ba14bb413946d4410` and matching repository source  
Integration direction: **production functionality -> v5 frontend architecture**

This map is the pre-implementation gate required by
`.codex/specs/active/v0.7.3-frontend-design-integration.md`. It maps every real
production surface to the v5 shell or component pattern that will own it. The
v5 mock registry is not a functional contract. Existing production routes,
controllers, services, validation, permissions, statuses, and error behavior
remain unchanged.

## Gate rules

- Preserve `prototypes/impeccable-whole-site-redesign-v5/` as the modular
  reference. Do not create a v6 or another copy.
- The integrated presentation belongs in real application source under `src/`.
- A v5 index entry is navigation, never authorization. Protected destinations
  continue through the existing session and capability gates.
- Retire an old presentation only after its replacement passes the fields,
  actions, validation, authorization, service, status, error, mobile, and
  keyboard checks in `V5_PRODUCTION_FUNCTIONAL_PARITY.md`.
- `reports` remains absent because production has no bootstrap module or view.
- Generated HTML is rebuilt through repository scripts and never hand-edited.

## Public and pre-authentication transfer

| PRODUCTION ROUTE | PRODUCTION PURPOSE | REAL FIELDS / ACTIONS | V5 SURFACE / COMPONENT | V5 LAYOUT PATTERN | DATA/SERVICE CONNECTION | AUTH / PERMISSION RULE | COPY SIMPLIFICATION | MISSING V5 COMPONENT | INTEGRATION ACTION |
|---|---|---|---|---|---|---|---|---|---|
| `/` | Session-aware entry | Resume authorized workspace or expose public entry | `public.landing` plus existing session router | Image-led gateway; floating identity bar | `auth-gateway.js`; `getSession`; workspace router | Existing session decides destination; no client-side bypass | Product entrance, no engineering label | Session-aware v5 entry switch | Keep current routing decision; render public state in v5 landing shell |
| `/portals` | Public logistics entrance | Request, Lending, Staff, tracking, module index | `public.landing` | Full-bleed campus gateway and v5 public action field | Published brand media and Link Registry where available | Anyone; protected index entries still authenticate on selection | Short real CTAs; remove preview/version copy | Production module-index entry; conditional published social link | Replace current portal directory with v5 landing and real URLs |
| `/portals#module-index` and internal module-index control | Fast module discovery | Search/browse valid destinations; follow real route | v5 `indexPage` / `.index-wrap`, `.index-list`, `.index-item` | Grouped route console, adapted without preview controls | Bootstrap navigation, workspace routes, capability set, public route registry | Visibility is informational; route selection still passes existing auth and server authorization | Plain module name and one-line purpose; remove tier/state counts | Access-aware route adapter and protected-route affordance | Make v5 index a first-class production component backed by real routes |
| `/login` | Staff authentication | Username, password, submit, safe failure, unavailable/loading | `public.signin` | v5 split authentication shell | `client.getSession`, `client.login`, release identity | Unauthenticated only; errors reveal no account existence | “Sign in”, “Try again”, “Temporarily unavailable” | Production busy/error states in v5 auth card | Preserve auth client and mount it in v5 markup |
| `/register` | Start staff account/application flow | Verified email start, confirmation, account/application fields, submit, withdraw where supported | `public.register`, `public.verify`, `public.application` | v5 auth shell plus v5 form sections | `startAccountApplicationEmail`, `confirmAccountApplicationEmail`, `submitAccountApplication`, `withdrawAccountApplication` | Fail closed; no account activation until governed review | “Create staff account”, “Apply for access”, direct errors | Full production application fields and state transitions | Replace v5 mock forms with production application controller and fields |
| `/application-status` | Track account application | Application reference/status lookup, withdraw where allowed | `public.application-status` | v5 timeline and notice panel | `getAccountApplicationStatus`, `withdrawAccountApplication` | Reference-bound public result; no reviewer-private data | “Check application status”; plain next step | Real empty/error/withdraw states | Wire production application-status controller into v5 timeline |
| `/request` | Submit a public logistics request | Purpose; requester identity/type/organization/contact/email; event/sub-event or stock area; needed dates/location/purpose; item lines; acknowledgements; review; submit | `public.request-intake` | v5 Request Center tabs, staged form, item composer, review panel | Existing public Request source/options and submission service | Public-safe source data only; submission does not reserve/deduct stock | “New Request”, “Track Request”, “Submit for review” | Full five-step production form; related-request verification; integer quantity validation | Keep production form/controller and rebuild its markup as native v5 sections |
| `/request#request-tracking` | Private Request tracking | Request ID and private tracking code; status/line results | `public.request-tracking` | v5 private lookup card and status timeline | `/api/public/request/track` through existing client | Lookup by ID plus private code; never by name; no protected stock/comments | “Check status”; safe invalid-code guidance | Production line statuses and one-time receipt state | Render existing tracking response in v5 timeline/result components |
| `/lending` | Browse and submit public borrowing request | Catalog search/category/availability; item selection; borrower identity/contact/organization/purpose/dates; evidence requirement; acknowledgements; submit | `public.lending-intake` | v5 catalog plus v5 form/review composition | Existing borrower-safe catalog and public lending submission service | Public catalog is sanitized; identity evidence and review rules preserved | “Lending Center”, “Submit for review” | Full production catalog/filter/selection and evidence states | Keep production controller; replace v5 illustrative form with real fields/actions |
| `/lending#lending-tracking` | Private Lending tracking | Submission ID and private code; loan-line status | `public.lending-tracking` | v5 timeline and private lookup panel | `/api/public/lending/track` through existing client | Private reference/code required; borrower identity never published | “Check borrowing status” | Real empty/error/result states and one-time receipt | Render production result through v5 timeline/status components |
| Embedded Privacy and Acceptable Use dialogs | Required policy acknowledgement | Open/close dialogs; explicit required acknowledgements | `public.policy` | v5 dialog treatment | `public-policy.js`; existing recorded form fields | Public; acknowledgements remain required where production requires them | “Privacy Notice”, “Acceptable Use” | Focus restoration and production policy content | Restyle existing semantic dialogs in v5; keep fields and event wiring |
| Public brand and announcements | Published institutional media | View published asset/announcement/link only | v5 landing media, public bar, notice/carousel pattern | Image-led v5 field with restrained notice surfaces | `brand-assets.js`, `public-advertisement-carousel.js`, published Link Registry | Published versions only; no draft/admin data | Real title/action only; no fake status or metric | Native v5 advertisement/announcement slot | Preserve publication filters; adapt rendered assets to v5 composition |

## Authenticated shell and workspace routing

| PRODUCTION ROUTE | PRODUCTION PURPOSE | REAL FIELDS / ACTIONS | V5 SURFACE / COMPONENT | V5 LAYOUT PATTERN | DATA/SERVICE CONNECTION | AUTH / PERMISSION RULE | COPY SIMPLIFICATION | MISSING V5 COMPONENT | INTEGRATION ACTION |
|---|---|---|---|---|---|---|---|---|---|
| `/{admin|director|food|inventory|materials}` | Authorized role landing | Resolve default module/workspace; preserve legacy redirect | Role-specific v5 overview | Persistent rail, command topbar, working canvas | `workspace-routes.js`, essential bootstrap | Server authorization supplies allowed workspaces/default | Workspace name plus direct purpose | Production route-to-v5 surface adapter | Preserve canonical and `/app/{slug}` legacy semantics; render v5 shell |
| `/{ws}/{module}` and `/app/{ws}/{module}` | Canonical/legacy module route | Route sync, deep link, browser back/forward, dirty-form protection | v5 rail/topbar/mobile tab shell | Desktop rail; tablet drawer; mobile bottom navigation | `runtime.js`, `bootstrap-controller.js`, `form-dirty-state.js` | Bootstrap navigation and server capability set; UI hiding is not authorization | Plain module names and state copy | Route-aware v5 shell controller | Keep current router/controller; replace shell DOM and presentation with v5 architecture |
| Authenticated account controls | Profile, Account Requests, session actions | Open profile/review; sign out; session invalidation | v5 identity control, profile surface, account-review drawer/dialog | v5 command topbar and accessible overlays | `authenticated-account-controls.js`; auth client | Session and capability-gated controls | “My profile”, “Account Requests”, “Sign out” | Unified v5 identity menu | Preserve control creation and handlers; mount in v5 topbar |
| Shell loading/error/denied/stale | Truthful application states | Retry, re-authenticate, preserve draft, report unavailable | v5 skeleton, notice, denied, empty components | Same v5 layout held during loading; atomic reveal | Bootstrap UI/controller and safe errors | No protected fallback data; fail closed | “Loading your workspace…”, “Try again”, “Temporarily unavailable” | v5 shell-level contract error view | Reuse current state machine; swap only render structure/classes |

## Operational route transfer

`{ws}` is any authorized workspace slug. Disabled module destinations are not
rendered in the rail/index for that session; direct navigation still passes
the existing server checks.

| PRODUCTION ROUTE | PRODUCTION PURPOSE | REAL FIELDS / ACTIONS | V5 SURFACE / COMPONENT | V5 LAYOUT PATTERN | DATA/SERVICE CONNECTION | AUTH / PERMISSION RULE | COPY SIMPLIFICATION | MISSING V5 COMPONENT | INTEGRATION ACTION |
|---|---|---|---|---|---|---|---|---|---|
| `/{ws}/overview` | Role-scoped operational landing | Refresh; attention queues; authorized counts; quick links; workload/activity where allowed | Role `*.overview` | v5 asymmetric decision brief, queue field, activity rail | Overview bootstrap data: dashboard meta/queues/staff/activity/links | Scope and values come from server bootstrap only | “Needs review”, “Getting things ready…” | Production projection adapter; no illustrative counts | Keep overview controller; rebuild output in v5 brief/workbench |
| `/{ws}/request` | Review and route requests | Filters; queue/detail; per-line committee/source decision; assign; accept/reject/more-info/reopen; stale compare-and-swap | `request.queue` | v5 queue + docked split detail; drawer/full-screen below threshold | Request module bootstrap and existing review services | `request.review` and related capabilities; scope enforced server-side | “Needs review”, “Request details”, direct decision verbs | Full production line-routing/editor and all error states | Transplant existing handlers/forms into v5 queue/detail components |
| `/{ws}/lending` | Govern lending lifecycle | Queue/tabs; review/approve/reject; ready-to-claim; handoff; on-loan; overdue; extension where supported; inspect/confirm return; history/detail | `lending.queue`, `lending.detail` | v5 queue/detail, timeline, return dialog | Lending module bootstrap and existing lending services | Lending capabilities and committee scope unchanged | Keep real lifecycle terms; “Confirm return” | Complete production return inspection and all lifecycle actions | Keep controller/service calls; render v5 queue, timeline, and native dialog |
| `/{ws}/release` | Record physical handoff | Search/filter; event/lending tickets; exact quantities; recipient name/role/department; notes; evidence; partial release; history; owner correction | `release.desk` | v5 queue + release work panel + history drawer | Release module and `confirmRelease`, `confirmLoanHandoff`, `correctRelease` | Release capability; correction remains System Owner only | “Record release”, “Attach evidence”, “Correct release” | Production multi-line release editor and append-only correction UI | Build native v5 work panel around existing release functions |
| `/{ws}/restocking` | Review replenishment and record receipt | Filters; request detail; product/line; supplier; quantity/unit/price; storage; invoice/evidence; partial receipt; timeline | `restocking.queue` | v5 queue/detail and receiving panel | Restocking module; `receiveRestock`; existing upload path | Receive capability and authorized scope | “Receiving”, “Record receipt”, “Partially received” | Full production receiving form and partial-history detail | Preserve receipt service; adapt form/table/detail to v5 |
| `/{ws}/procurement` | Canvassing, procurement, deliverables | Deliverables; supplier quotes; preferred quote; canvass add/edit/archive/history; evidence; filters/comparison | `procurement.board` | v5 board/table + docked detail + governed dialogs | Procurement module; existing canvass/deliverable services | Canvass/procure capabilities; supplier data stays private | “Canvassing”, “Preferred quote”, “View history” | Quote comparison, exclusive selection, edit/archive dialogs | Render all current tools as native v5 board/table/dialog patterns |
| `/{ws}/inventory` | Catalog and stock truth | Search/filter/page; item detail; on hand/reserved/available; classification; allowed adjustment/reversal; asset maintenance/movement history | `inventory.catalog`, `inventory.item` | v5 ledger table, item split detail, movement history | Inventory module bootstrap and existing inventory services | `view.inventory`; mutation capabilities separately enforced | “Needs classification”, “Movement history” | Production filters, classification, asset and governed adjustment UI | Keep ledger/controller logic; replace table/detail presentation with v5 |
| Events/sub-events within authorized workspace | Manage event hierarchy | Series/sub-event view; create/update where authorized; linked requests/readiness/deliverables | `events.series` | v5 hierarchy table/detail | Existing event collections and `event.manage` actions | `event.manage`; scope filters unchanged | “Events”, “Sub-events”, truthful “Not recorded” | Production event editor and detail hierarchy | Add native v5 hierarchy/detail around existing event actions |
| Activity/history within authorized workspace | Inspect immutable user-visible history | Filter/open referenced record where supported | `audit.activity` | v5 activity list and detail drawer | Existing status/audit history projections | `view.audit`; never broaden access | “Activity”, “View history” | Production filters and reference navigation | Render only authorized audit projection in v5 list/drawer |

## Administration and account transfer

These surfaces remain capability-gated within authorized workspaces. They are
listed in the v5 module index only when the current production navigation or
capability contract permits them.

| PRODUCTION ROUTE | PRODUCTION PURPOSE | REAL FIELDS / ACTIONS | V5 SURFACE / COMPONENT | V5 LAYOUT PATTERN | DATA/SERVICE CONNECTION | AUTH / PERMISSION RULE | COPY SIMPLIFICATION | MISSING V5 COMPONENT | INTEGRATION ACTION |
|---|---|---|---|---|---|---|---|---|---|
| Accounts & Access surface | Govern account lifecycle and effective access | List/detail; role/scope/capability preview; activate/deactivate/archive without delete; revision-safe changes; audit | `admin.access` | v5 table + docked detail + decision dialog | Access administration services and canonical authorization projection | `access.admin`; no self-elevation | “Access”, “Permissions”, “Account status” | Full effective-access editor, archive lifecycle, revision conflicts | Transplant current access controller into v5 table/detail/dialog |
| Account Requests surface | Two-stage application review | Queue; detail; identity evidence; administrator review; director decision; owner override; one-time activation handoff | v5 `admin.access` extension | v5 queue/detail and protected decision dialog | `list/get/decide/overrideAccountApplication` | Separate admin/director capabilities; owner override remains break-glass | “Needs review”, “Record decision” | Review evidence, two queues, activation handoff | Adapt existing account-review controller into native v5 components |
| Staff Directory surface | Read protected roster projection | List/search/status; correction occurs at governed source; authorized sync controls where present | `admin.directory` | v5 directory table and owner-only sync drawer | Identity roster projection/services | Read-only for normal admins; sync actions owner/capability gated | “Directory”, “Account status”, “Last updated” | Real rows, quarantine/run history, preview/apply/rollback controls | Replace illustrative totals with existing directory controller in v5 |
| Reference Administration surface | Govern shared catalogs | Domain selection; add/edit/archive/restore; before/after preview; independent approval where required; pending changes | `admin.reference` | v5 catalog table + comparison drawer/dialog | Reference administration domain/services | `reference.catalog.manage` / `reference.manage`; review separation kept | “Reference lists”, “Review change”, “View history” | Risk/review comparison and pending-change components | Preserve domain/controller; author missing v5 governed-change patterns |
| Link Registry surface | Govern named destinations | Add/edit; activate/deactivate/archive; history; publication/sync state | `admin.links` | v5 table + detail/history drawer | Existing Link Registry service/domain | Reference-manage capability; external sync remains separate | “Links”, “Published”, “Not published” | Real lifecycle actions/history | Connect existing registry controller to v5 table/dialog components |
| Announcements / Brand and Media surface | Govern published content and assets | Advertisement list/state; brand draft upload; validate; publish; rollback; version history; alt text/reason | `admin.brand` plus v5 announcement component | v5 asset grid, version drawer, upload/publish dialogs | Brand/advertisement services and published asset routes | `advertisement.manage` / `brand.manage`; owner rules unchanged | “Announcements”, “Brand and Media”, direct publish verbs | Advertisement management and complete brand version workflow | Build native v5 asset/announcement surfaces around existing services |
| My Profile surface | Self-service profile/security | Display/legal name; username; verified email; contact; role/scope/access summary; account state; update contact; change username/password; correction request; session-revocation outcome | `account.profile` | v5 profile grid, identity summary, security sections, inline status | `getProfile`, `updateProfileContact`, `changeProfileUsername`, `changeProfilePassword`, `requestProfileIdentityCorrection` | Authenticated self only; cannot change own role/scope | “My profile”, “Your access”, “Account status”, “Change password” | Real identity/contact/username/correction/session UI; remove local-only image action | Keep production profile controller; rebuild complete UX in v5; initials/avatar only without upload contract |
| System status / owner controls | Safe operational diagnostics | Refresh; availability/backup/recovery/schema/directory aggregates and authorized owner actions already present | `owner.health` | v5 status rows, notices, owner-only panels | Existing system diagnostics and owner control services | `system.diagnostics` / `system.admin`; denied state preserved | “System status”, “Available”, “Attention”, “Not recorded” | Full real status groups and authorized action panels | Replace v5 illustrative health rows with current diagnostics renderer |

## V5 reference components to transplant

| V5 source | Production destination | Rule |
|---|---|---|
| `styles/tokens.css`, `base.css`, `shell.css`, `components.css`, `surfaces.css`, `motion.css`, `responsive.css`, `v3.css`, `v4.css`, `v5.css` | Real production visual layers under `src/styles/visual/` | Consolidate into source-owned v5 layers/tokens; do not retain the old cascade as visual authority |
| `src/app.js` shell/index/overlay/focus/theme patterns | Production shell/router components | Reuse structure and interaction patterns, not mock state, role simulator, viewport selector, or hash registry |
| `src/components.js` | Production component markup/helpers | Preserve v5 component appearance and semantics; connect real data and handlers |
| `src/registry.js` | Real module-index registry | Replace preview IDs, tiers, and state counts with real paths, purposes, and access metadata |
| `src/surfaces/*.js` | Production view templates/renderers | Use as layout/component authority; replace fixtures and local actions with production state and controllers |
| `src/data/mock.js`, preview state in `app.js` | Nowhere | Do not ship; production bootstrap/service data is authoritative |

## Audit result

- Production surface inventory mapped: **complete**.
- V5 registry coverage reviewed: **33 surfaces / 53 illustrative variants**.
- Production-only capabilities absent or incomplete in v5: identified above;
  none are authorized for removal.
- New preview lineage required: **no**.
- Backend/service/auth/migration change required: **no**.
- Broad application-source transfer may begin after this map is committed and
  the branch task points to the v5 foundation/shell step.
