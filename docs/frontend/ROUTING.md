# HAU-USC Logistics — frontend routing and control contract

Status: current authority
Scope: `src/frontend/` on `frontend-design-integration`
Accepted amendment: `.codex/specs/accepted/2026-08-23-r3-a1-a2-owner-routing-identity-three-context.md` (R3-A1-A2)
Authority: Earl instruction → accepted R3-A1-A2 amendment → accepted backend/API/auth contracts (functional truth) → this document (frontend control ownership)
Last reviewed: 2026-08-23

`WORKFLOW_ARCHITECTURE.md` explains the business flow. **This document explains
exactly what each control does**, so the branch can be read and implemented
without guessing.

---

## 1. The three contexts

| | A. Public | B. Authenticated requester | C. Authenticated DOL |
|---|---|---|---|
| Surface | Public Lending Hub | External Request Center | Main Logistics Hub |
| Audience | students, USC staff/officers, DOL staff | verified USC staff/officers | authorized DOL/internal staff |
| Session | never required | required | required |
| Server gate | none | `request.create` | route-specific capability |
| Module | `PublicFlows.tsx` | `request/ExternalRequestCenter.tsx` | FI-04, not yet implemented |
| Route | `borrow`, `tracking` | `external-request` | the ten `AuthRoute`s |

These must not be collapsed. The identity gateway (`staff-signin`) belongs to no
context: it is the door between A and B/C.

**Eligibility is server-derived**, never re-derived in the browser.
`integration/routeAccess.ts` reads the same capability strings the Worker
authorizes against:

```
isEligibleRequester(user)  →  capabilities includes "request.create"
isInternalOperator(user)   →  capabilities includes "view.internal"
```

`src/domain/permissions.js` gives `ROLES.REQUESTER` exactly
`[view.request, request.create, lending.create]` and **no** `view.internal`,
while `DOL_STAFF`, `COMMITTEE_HEAD`, `DIRECTOR` and `ADMINISTRATOR` all carry
`view.internal`. That is the product's own non-DOL/DOL line; the frontend reuses
it rather than inventing a parallel one.

---

## 2. Entry-intent model

```
AUTHENTICATION = who is this user?
AUTHORIZATION  = what may this account access?
ENTRY INTENT   = what did the user explicitly try to open?
```

Priority, implemented in `app/entryIntent.ts`:

1. Preserve explicit valid entry intent.
2. Check server-derived authorization.
3. Use capability-based default routing **only** when there was no explicit
   destination.

Intent is a first-class value, never inferred from a capability string:

```ts
type EntryIntent =
  | "GENERIC_STAFF_SIGN_IN"
  | "EXTERNAL_REQUEST_CENTER"
  | "INTERNAL_REQUEST_HUB"
  | "OTHER_INTERNAL_DESTINATION";
```

### Entry-intent routing matrix

| Entry point | Intent | Account | Destination | Requester mode |
|---|---|---|---|---|
| Start a logistics request | `EXTERNAL_REQUEST_CENTER` | non-DOL eligible requester | `external-request` | yes |
| Start a logistics request | `EXTERNAL_REQUEST_CENTER` | DOL staff | `external-request` + **Open Logistics Hub** | yes |
| Start a logistics request | `EXTERNAL_REQUEST_CENTER` | ineligible | denied `NOT_ELIGIBLE_REQUESTER` | — |
| Staff Sign In (navbar) | `GENERIC_STAFF_SIGN_IN` | DOL/internal | `resolveStaffHome(session)` | no |
| Staff Sign In (navbar) | `GENERIC_STAFF_SIGN_IN` | non-DOL eligible requester | `external-request` | yes |
| Staff Sign In (navbar) | `GENERIC_STAFF_SIGN_IN` | no access at all | denied `NO_ACCESS_AT_ALL` | — |
| Internal Request Hub | `INTERNAL_REQUEST_HUB` | DOL with Request capability | `request-center` | no |
| Internal Request Hub | `INTERNAL_REQUEST_HUB` | lacks capability | denied `NO_INTERNAL_CAPABILITY` | — |
| Any other internal route | `OTHER_INTERNAL_DESTINATION` | holds that capability | that route | no |
| Public Lending Hub | — | anyone | `borrow`, no auth gate | — |

`resolveStaffHome` walks `STAFF_HOME_ORDER` and returns the first route the
account actually holds. It is **not** "always Overview": an account may own
Release without owning the Overview summary, and hard-coding Overview would
deny it its own home.

Executable form: `tests/unit/frontend-entry-intent.test.js` — one test per row.

### Denial

Denial is truthful and recoverable, and never enumerates. `DENIAL_COPY` states
the access state, offers **Home** and **Public Lending**, and never reveals
whether an account exists, what role it holds, or whether some other account
would have been allowed.

---

## 3. Home semantics — one behaviour, every surface

`NAV_HOME`, `LENDING_HOME`, `AUTH_BACK_HOME` and `EXTERNAL_REQUEST_HOME` all
call the same `goHome`:

```
→ landing
→ scroll to top
→ close transient drawer/modal
→ drop transient navigation intent
→ PRESERVE the authenticated session
```

**Home is not logout.** `handleSignOut` is the only normal action that destroys
a session. Before R3-A1-A2 `goHome` reset `authState` and `intendedRoute`, which
made Home behave as a partial sign-out; `HOME-03` / `AUTH-06` guard against a
regression by asserting that no `/api/auth/logout` call is made and that the
session survives.

`"Public front door"` is not current product copy. Current labels are `Home`,
`← Home`, `Back to Home`, `Return Home`. Decorative arrows live in
`aria-hidden` markup, never in CSS pseudo-content, so a control announces as
its label.

---

## 4. Control contract

Field key: **CONTROL_ID** · **LABEL** · **SURFACE** · **PERSONA** ·
**ENTRY_INTENT** · **AUTH** · **CAPABILITY** · **DESTINATION** ·
**BACKEND_OPERATION** · **MUTATES** · **IDEMPOTENCY** · **DENIED** ·
**ERROR** · **PRESERVES_SESSION** · **PRESERVES_FORM_STATE** · **TEST**

### 4.1 Global navigation

| CONTROL_ID | LABEL | SURFACE | PERSONA | ENTRY_INTENT | AUTH | CAPABILITY | DESTINATION | BACKEND | MUTATES | TEST |
|---|---|---|---|---|---|---|---|---|---|---|
| `NAV_HOME` | HAU-USC home | `PublicNavbar` | any | — | no | — | `landing`, session preserved | none | no | HOME-01/02/03 |
| `NAV_PUBLIC_SERVICES` | Logistics hub | `PublicNavbar` → `publicNavConfig` | any | — | no | — | in-page anchor `#logistics` | none | no | — |
| `NAV_THEME` | Theme toggle | `PublicNavbar`, `StaffSignInPage`, `ExternalRequestCenter` | any | — | no | — | none (local preference) | none | no | FVR-001 theme |
| `NAV_STAFF_SIGNIN` | Staff sign in | `PublicNavbar`, drawer, footer, lending nav | any | `GENERIC_STAFF_SIGN_IN` | no (it *is* the gate) | — | `staff-signin` | none | no | AUTH-01/02 |

`NAV_STAFF_SIGNIN` must **never** pre-commit to a capability-gated destination.
Binding it to `request-center` denied otherwise-valid accounts that merely lacked
`view.request` — the R3 FE-R3-002 defect. It carries `GENERIC_STAFF_SIGN_IN` and
nothing else.

### 4.2 Landing

| CONTROL_ID | LABEL | SURFACE | PERSONA | ENTRY_INTENT | AUTH | CAPABILITY | DESTINATION | BACKEND | MUTATES | DENIED | TEST |
|---|---|---|---|---|---|---|---|---|---|---|---|
| `HOME_REQUEST_LOGISTICS` | Start a logistics request<br><small>USC staff sign-in required</small> | `HeroSection`, `LogisticsHubSection`, `Footer`, drawer | USC staff/officer, DOL | `EXTERNAL_REQUEST_CENTER` | **yes** | `request.create` | `external-request` | `GET /api/auth/session` then portal | no | truthful denial + Home / Public Lending | REQ-01..05, CTX-02 |
| `HOME_BROWSE_LENDING` | Browse public lending<br><small>No sign-in needed</small> | `HeroSection`, `LogisticsHubSection` | anyone | — | no | — | `borrow` | none at click | no | — | LEND-01 |
| `HOME_TRACK` | Track lending | `HeroSection`, `LogisticsHubSection` | anyone | — | no | — | `tracking` | none at click | no | — | FVR-001 tracking |

The access rule is stated **on the control**, so nobody discovers the staff gate
only after committing to the flow. That is why `HOME_REQUEST_LOGISTICS` carries
a visible note rather than a bare label.

### 4.3 Public Lending Hub — context A

Tab set: **Home · Lending Center · Track lending · Lending policy · Staff sign in.**
`Request Center` is **absent by design** (LEND-02).

| CONTROL_ID | LABEL | PERSONA | AUTH | DESTINATION | BACKEND | MUTATES | IDEMPOTENCY | PRESERVES_FORM_STATE | TEST |
|---|---|---|---|---|---|---|---|---|---|
| `LENDING_HOME` | Home / ← Home | anyone | no | `landing`, session preserved | none | no | — | discards draft | HOME-01/02 |
| `LENDING_BROWSE` | Lending Center | anyone | no | Lending Center view | `GET /api/public/lending/catalog` | no | — | keeps filters | LEND-01 |
| `LENDING_ITEM_DETAIL` | item card | anyone | no | selection toggle | none | no | — | keeps selection | — |
| `LENDING_REQUEST_ITEM` | Submit borrowing request | anyone | no | receipt panel | `POST /api/public/lending` | **yes** | `clientRequestId` `frontend-<uuid>` | clears on receipt | FVR-001 lending |
| `LENDING_TRACK` | Track lending | anyone | no | Track view | `POST /api/public/{request,lending}/track` | no | — | — | FVR-001 tracking |
| `LENDING_POLICY` | Lending policy | anyone | no | Policy view | none | no | — | — | — |
| `LENDING_STAFF_SIGNIN` | Staff sign in | anyone | no | `staff-signin` | none | no | — | — | AUTH-01/02 |

Borrower type (`ANGELITE`, `USC_STAFF`) is **requester classification, not
authentication**. It never produces a session, role, or capability.

### 4.4 External Request Center — context B

| CONTROL_ID | LABEL | PERSONA | AUTH | CAPABILITY | DESTINATION | BACKEND | MUTATES | IDEMPOTENCY | TEST |
|---|---|---|---|---|---|---|---|---|---|
| `EXTERNAL_REQUEST_HOME` | Home | eligible requester | yes | `request.create` | `landing`, **session preserved** | none | no | — | HOME-03 |
| `EXTERNAL_REQUEST_LIST` | Your requests | eligible requester | yes | `request.create` | in-page list | `GET /api/portal/request` | no | — | REQ-03 |
| `EXTERNAL_REQUEST_NEW` | New request | eligible requester | yes | `request.create` | compose form | none at click | no | — | REQ-06 |
| `EXTERNAL_REQUEST_SUBMIT` | Submit request | eligible requester | yes | `request.create` | receipt | `POST /api/portal/request` | **yes** | `clientRequestId` `frontend-<uuid>` | REQ-06 |
| `EXTERNAL_REQUEST_DETAIL` | request row | eligible requester | yes | `request.create` | in-page detail | scoped to own account server-side | no | — | REQ-03 |
| `EXTERNAL_REQUEST_OPEN_LOGISTICS_HUB` | Open Logistics Hub | **DOL only, requester mode** | yes | `view.internal` + a home route | `resolveStaffHome(session)` | none | no | — | REQ-04 |
| `EXTERNAL_REQUEST_SIGNOUT` | Sign out | eligible requester | yes | — | `landing`, session destroyed | `POST /api/auth/logout` | yes | — | FVR-001 |

**The boundary is real, not cosmetic.** `/api/portal/request` is authorized with
`authorize(request, auth, CAPABILITIES.REQUEST_CREATE)` and scoped to
`requester_account_id = <session account>`. Requester identity comes from the
session server-side; the browser sends **none** of it. REQ-06 asserts the
submitted command contains no `requesterName`, `requesterType`, `organization`,
`contactNumber` or `email`, and that `/api/public/request` is never called.

`EXTERNAL_REQUEST_OPEN_LOGISTICS_HUB` renders only when the session is an
internal operator **and** requester mode is active, so an ordinary USC requester
never sees a DOL control (CTX-01).

### 4.5 Identity gateway

| CONTROL_ID | LABEL | PERSONA | AUTH | DESTINATION | BACKEND | MUTATES | ERROR | TEST |
|---|---|---|---|---|---|---|---|---|
| `AUTH_SUBMIT` | Sign in | any | — | per §2 matrix | `POST /api/auth/login` | yes (session) | truthful state; no enumeration | AUTH-01/02, REQ-02..05 |
| `AUTH_ACTIVATE` | No password yet? Activate account | staff with an existing identity | — | activation panel | see §5 | yes | service-gap state, never fake success | AUTH-03 |
| `AUTH_FORGOT_PASSWORD` | Forgot password? | staff with an existing identity | — | reset panel | see §5 | yes | service-gap state | AUTH-04 |
| `AUTH_VERIFY_OTP` | Verify code | either flow | — | set-password step | `POST /api/auth/{activate,reset}/verify` | yes (consumes code) | invalid / expired / too many attempts, in words | AUTH-05 |
| `AUTH_RESEND_OTP` | Send a new code | either flow | — | stays on code step | `POST /api/auth/{activate,reset}/start` | yes | cooldown stated, control disabled | AUTH-05 |
| `AUTH_SET_PASSWORD` | Activate account / Update password | either flow | — | done → sign in | `POST /api/auth/{activate/complete,reset/complete}` | yes | mismatch and policy errors inline | AUTH-03/04 |
| `AUTH_APPLY` | Apply for staff access | applicant with **no** identity | — | `AccountAccessPanel` | `/api/account-applications/*` | yes | — | FVR-001 application |
| `AUTH_APPLICATION_STATUS` | Check application status | applicant | — | `AccountAccessPanel` | `/api/account-applications/status` | no | — | FVR-001 application |
| `AUTH_BACK_HOME` | Home | any | — | `landing`, **session preserved** | none | no | — | HOME-03 |
| `AUTH_SIGNOUT` | Sign out | authenticated | — | `landing`, session destroyed | `POST /api/auth/logout` | yes | — | FVR-001 |

**`AUTH_ACTIVATE` and `AUTH_APPLY` are different operations and stay separate.**
Activation establishes credentials for an identity that **already exists** and
never grants capability — the server decides both. Application asks for an
identity that does not exist yet and is reviewed. Collapsing the first into the
second would create open staff registration, which R3-A1-A2 §31 forbids.

### 4.6 Main Logistics Hub — context C

All ten `AuthRoute`s (`overview`, `inventory`, `request-center`, `lending`,
`release`, `restocking`, `procurement`, `events`, `administration`, `profile`)
are declared in `app/appRoutes.ts` and capability-mapped in
`integration/routeAccess.ts`.

**None renders an operational workspace in this release.** `AuthenticatedShell`
is not mounted and the staff route components are orphaned. A resolved internal
destination reaches `StaffSignInPage`, which states plainly that *that named
workspace* is not yet available. Design material for these surfaces is
`DESIGN AUTHORITY` / `READY FOR FI-04 IMPLEMENTATION` — never
"functionally verified".

Vocabulary, fixed by R3-A1-A2: the public-facing name **Request Center** belongs
to context B. The internal DOL surface is the **Request Hub**. `STAFF_LENDING` is
the **Internal Lending Hub**.

| CONTROL_ID | LABEL | CAPABILITY | STATUS |
|---|---|---|---|
| `STAFF_OVERVIEW` | Operations overview | `view.internal` | FI-04 |
| `STAFF_REQUEST_HUB` | Internal Request Hub | `view.request` | FI-04 |
| `STAFF_INVENTORY` | Inventory | `view.inventory` | FI-04 |
| `STAFF_LENDING` | Internal Lending Hub | `view.internal` | FI-04 |
| `STAFF_RELEASE` | Release Desk | `fulfillment.release` | FI-04 |
| `STAFF_RESTOCKING` | Restocking | `view.inventory` | FI-04 |
| `STAFF_PROCUREMENT` | Procurement | `view.internal` | FI-04 |
| `STAFF_EVENTS` | Events | `event.manage` | FI-04 |
| `STAFF_ADMIN` | Administration | `access.admin` | FI-04 |
| `STAFF_PROFILE` | Account profile | — (session only) | FI-04 |

---

## 5. Backend contract status

R3-A1-A2 §20 forbids claiming the External Request Center is protected without a
real server-derived boundary, and forbids inventing one. Measured against the
branch's own Worker source:

### Satisfied — no gap

**`BACKEND_CONTRACT_GAP_EXTERNAL_REQUEST_AUTH` is CLOSED**, not merely deferred.
`src/worker/index.js` routes `GET`/`POST /api/portal/request` and
`POST /api/portal/request/cancel` through
`authorize(request, auth, CAPABILITIES.REQUEST_CREATE, { mutation })`, with CSRF
on mutation. `src/server/d1/operational-service.js` scopes every read and write
to `requester_account_id` / `requester_department_id` from the session account.
The External Request Center binds to it directly.

### Open gaps — recorded, not papered over

| ID | What is missing | Effect today |
|---|---|---|
| `BACKEND_CONTRACT_GAP_DOL_REQUESTER_MODE` | `assertRequesterPortalAccount` (`operational-service.js:712`) requires `authorization.roleId === 'REQUESTER'` on top of the `request.create` capability. A DOL account holds `request.create` but has `roleId` `DOL_STAFF`, so the portal answers `403 REQUESTER_PORTAL_REQUIRED`. | R3-A1-A2 §8 / §34 DOL requester mode is **not supported server-side**. The frontend routes DOL staff there correctly, and the surface reports the gap truthfully with `Open Logistics Hub` as the recovery. It does not fake a portal. |
| `BACKEND_CONTRACT_GAP_SELF_SERVICE_IDENTITY` | `src/auth/http-contract.js` declares only `session`, `login`, `activate`, `logout`, `reset/complete`. There is **no** `activate/start`, `activate/verify`, `reset/start` or `reset/verify`, and `completePasswordReset` consumes an **admin-issued** `resetToken` — there is no self-service, email-code path. The only 8-digit email flow in the product belongs to `account-applications`, which is a different operation. | §17 activation-by-email-code and §18 forgot-password are **not implemented server-side**. The frontend implements the required contract and calls it for real; the Worker answers 404 and the panel states plainly that the service is not available yet and to contact the Department of Logistics. No simulated success. |

**Required next backend contract**, for a separate accepted backend amendment:

```
POST /api/auth/{activate,reset}/start
  body    { identifier }
  answer  { ok, accepted: true, resendAvailableInSeconds }
  rules   identical answer whether or not the account exists;
          rate limited per identifier and per client;
          8-digit code, short expiry, one-time use, delivered to the
          registered email only.

POST /api/auth/{activate,reset}/verify
  body    { identifier, code }
  answer  { ok, token, expiresAt }
  errors  VERIFICATION_INVALID | VERIFICATION_EXPIRED | VERIFICATION_ATTEMPTS_EXCEEDED
  rules   attempt-limited; a resend invalidates the previous code;
          the returned token is short-lived and single-use.

POST /api/auth/activate/complete
  body    { activationToken, password, confirmPassword }
  rules   activates an EXISTING eligible identity; never creates one;
          never grants capability.

POST /api/auth/reset/complete            (exists; accept a verify-issued token too)
  body    { resetToken, password, confirmPassword }

DOL requester mode
  relax assertRequesterPortalAccount to authorize on CAPABILITIES.REQUEST_CREATE
  plus a resolvable requester department, rather than on roleId === 'REQUESTER',
  and record REQUEST_SOURCE = INTERNAL_SELF_SERVICE with REQUESTED_BY = the
  acting account. Preserve room for a second-approver rule on restricted
  categories rather than hard-coding unrestricted self-approval.
```

**This branch must not claim end-to-end security completion while either gap is
open.** No Production, Playground, D1 or R2 mutation was performed.

---

## 6. Known limitations

| ID | Sev | Summary |
|---|---|---|
| FE-R3-005 | P2 | No URL routing. Routing is in-memory React state in `useAppController.ts`; routes are not addressable and refresh, deep link, Back and Forward do not restore route state. Recorded, not accidental — introducing a router needs accepted authority. |
| FE-R3-003 | P2 | Public sub-routes stack the site `PublicNavbar` and the `PublicFlows` masthead, presenting two Home affordances on one page. R3-A1-A2 made them behave identically, which removes the correctness problem but not the duplication. |
| FE-R3-004 | P2 | `PublicMobileDrawer` sets `role="dialog" aria-modal="true"` and handles Escape and scroll lock, but performs no focus management: focus is not moved in, not trapped, and not restored on close. |
| FE-R3-011 | P3 | 7 advisory radius findings in `PublicFlows.tsx`, and the shipped system still declares no type ramp — `theme.css` carries only `--font-size: 16px` while components use ten ad-hoc literal steps. |
| FE-R3-013 | P2 | **New.** Literal colours that `theme.css` ships but `DESIGN.md` frontmatter does not declare, so the Impeccable detector reads them as drift. Two families: `--destructive` (`#d4183d`) across six surfaces, and the account-panel treatments `#fff7e6` / `#f7f0e2` shared by `AccountAccessPanel` and `AccountRecoveryPanel`. The account panels are also light-mode only. New code uses tokens where one exists (`var(--destructive)`, `var(--green-open)`); the shared literals are deliberately left matched between the two sibling panels rather than diverging one of them, and should be fixed for both together. |

---

## 7. Relationship to the design providers

Live Figma Make `rP9W9MQlZkyQrUx38TVsFS` is the interactive prototype authority.
The current-authority lane of live Figma Design `hXJElH4p72KfgAaoUyfNOC` is the
design documentation and visual-reference authority, and carries a mirror of this
document. Repository contracts remain the sole functional authority.

Traceability for every R3-A1-A2 change: `.codex/R3_A1_A2_ROUTING_IDENTITY_RECEIPT.md`.
