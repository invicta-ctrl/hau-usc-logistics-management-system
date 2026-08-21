# Frontend / Backend Contract Matrix — frozen v0.8.3

The complete inventory of what the visual layer must preserve. Every value here
was read from frozen main, not inferred from design material or from earlier
documentation.

```text
FUNCTIONAL_AUTHORITY  origin/main 86553349f5c2ebefaa637c30828c560a301f99ba
                      tree        db95ebaafb7de421d02b12f0158bc1a93953edde
PRODUCTION_IDENTITY   f8e63372bc8afcb6d092970b7f9fc9ee72fd3580 (ancestor of main)
DERIVED_FROM          src/worker/index.js, src/server/**, src/services/**,
                      src/v5/integration/**, src/v5/src/registry.js,
                      src/domain/permissions.js, src/domain/constants.js,
                      src/auth/http-contract.js, wrangler.jsonc
METHOD                Deterministic extraction. Counts below were computed, not recalled.
```

> **FI-00 note, 2026-08-21.** This matrix was extracted from
> `origin/main@86553349`. After FI-00, `frontend-design-integration` is
> byte-identical to that main across every runtime scope
> (`src/**`, `tests/**`, `migrations/**`, `package.json`, `wrangler.jsonc`,
> `vite.config.js`, and the rest of section 5A of the FI-00 specification), so
> every value below now describes this branch as well as main. The verified
> counts held after reconciliation: 33 surfaces, 34 route classifications, 40
> capabilities, 40 operations, 29 adapter methods, 7 bootstrap modules, 32
> migrations, and 146 / 2 / 25 / 2 / 3 test files.

**Rule of the matrix.** The design may restyle any cell in the _presentation_
columns. It may not change a route, method, field, capability, status, or data
class. A design that omits a listed capability does not delete it; a design that
implies an unlisted capability does not create it.

---

## 1. Verified route inventory — revalidated, not assumed

Earlier documentation referred to "33 surfaces". That number is still correct
for product surfaces, and it was re-derived rather than carried forward:

```text
src/v5/src/registry.js
  SURFACES entries                     33   product surfaces
  V5_ROUTE_CLASSIFICATIONS entries     34   33 surfaces + the `index` playground route

classification tally
  V5_NATIVE_FUNCTIONAL_PARITY_ADDITION 22
  BACKEND_READ_ONLY                     6
  FULLY_BACKEND_WIRED                   4
  PLAYGROUND_ONLY                       1   `index`
  PROTOTYPE_ONLY_UNSUPPORTED            1   `public.register`
```

Routing is **hash based**: `#/<routeId>`, resolved in `src/v5/src/app.js` and
bound in `src/v5/integration/runtime.js`. Cloudflare serves the SPA with
`not_found_handling: "single-page-application"` and `run_worker_first` on
`/api/*`, `/brand/*`, `/media/*` (`wrangler.jsonc`).

`src/visual/workspace-routes.js` additionally declares path-style workspace
routes (`/admin`, `/director`, `/food`, `/inventory`, `/materials`, plus legacy
`/app/<slug>`). These belong to the legacy visual runtime that still ships on
main. Do not delete them as part of a visual slice; treat any change to them as
a routing contract change requiring an owner amendment.

---

## 2. Public surfaces

No session. Purpose-limited data only. Mutations are guarded by
`assertPublicMutationOrigin` (`src/worker/index.js`): same-origin required,
`sec-fetch-site: cross-site` rejected with `PUBLIC_ORIGIN_REJECTED` 403, and
`content-type: application/json` required or `INVALID_CONTENT_TYPE` 415. No CSRF
token, because there is no session to protect.

| Route id                    | Worker route(s)                                            | Method    | Adapter entry                                                              | Capability | CSRF                | Data class          |
| --------------------------- | ---------------------------------------------------------- | --------- | -------------------------------------------------------------------------- | ---------- | ------------------- | ------------------- |
| `public.landing`            | `/api/public/advertisements`                               | GET       | `backend.publicAdvertisements`                                             | none       | n/a                 | PUBLIC              |
| `public.signin`             | `/api/auth/login`, `/api/auth/session`                     | POST, GET | `backend.login`, `backend.session`                                         | none       | issued on success   | PUBLIC -> SESSION   |
| `public.register`           | none                                                       | n/a       | none                                                                       | n/a        | n/a                 | UNSUPPORTED         |
| `public.verify`             | `/api/account-applications/email/start`, `/email/confirm`  | POST      | `auth.startAccountApplicationEmail`, `auth.confirmAccountApplicationEmail` | none       | n/a                 | PUBLIC              |
| `public.application`        | `/api/account-applications`                                | POST      | `auth.submitAccountApplication`                                            | none       | bearer status token | PUBLIC -> APPLICANT |
| `public.application-status` | `/api/account-applications/status`, `/withdraw`            | GET, POST | `auth.getAccountApplicationStatus`, `auth.withdrawAccountApplication`      | none       | bearer status token | APPLICANT           |
| `public.request-intake`     | `/api/public/request/options`, `/api/public/request`       | GET, POST | `backend.publicRequestOptions`, `backend.submitPublicRequest`              | none       | n/a                 | PUBLIC              |
| `public.request-tracking`   | `/api/public/request/track`, `/api/public/request/related` | POST      | `backend.trackPublicRequest`, `backend.relatedPublicRequest`               | none       | n/a                 | PRIVATE-BY-TOKEN    |
| `public.lending-intake`     | `/api/public/lending/catalog`, `/api/public/lending`       | GET, POST | `backend.publicLendingCatalog`, `backend.submitPublicLending`              | none       | n/a                 | PUBLIC              |
| `public.lending-tracking`   | `/api/public/lending/track`                                | POST      | `backend.trackPublicLending`                                               | none       | n/a                 | PRIVATE-BY-TOKEN    |
| `public.policy`             | none                                                       | n/a       | static content                                                             | none       | n/a                 | PUBLIC              |
| `index`                     | none                                                       | n/a       | playground surface index                                                   | n/a        | n/a                 | PLAYGROUND_ONLY     |

### `public.register` is a design-only surface

`V5_ROUTE_CLASSIFICATIONS['public.register'] = 'PROTOTYPE_ONLY_UNSUPPORTED'`.
There is no registration endpoint on frozen main. Account creation runs through
the application flow (`public.verify` -> `public.application` ->
`public.application-status`) and through administrator-created accounts
(`/api/admin/access/create-account`). **Do not build a self-service registration
backend from the design.** If the design shows one, that is an
`OWNER_AMENDMENT_REQUIRED` item.

### Public state vocabulary — declared, verified

```text
public.signin          populated - loading - error - unavailable
public.request-intake  populated - error
public.request-tracking empty - populated - success        (registry states)
public.lending-tracking empty - populated                  (registry states)
```

`src/v5/integration/runtime.js` `ROUTE_STATES` is the authority for the routes
it lists; `src/v5/src/registry.js` `SURFACES` declares the demonstrable state set
for the rest. A visual port must render every declared state for its slice.

### Public data minimization — non-negotiable

- The public lending catalog is sanitized by `src/server/public-lending-service.js`.
  Do not surface stock truth, internal notes, roster identity, or evidence.
- Public tracking is token-scoped. Never widen a tracking response, never list
  other people's records, never enumerate.
- Public request options come from the server. Do not hardcode a category,
  venue, or committee list into the visual layer.

---

## 3. Authentication, session, profile

`src/auth/http-contract.js` is the single route contract. `AUTH_STATE` is
`SIGNED_OUT | ACTIVATION_REQUIRED | AUTHENTICATED`.

| Worker route                          | Method       | Client                               | CSRF       | Notes                                       |
| ------------------------------------- | ------------ | ------------------------------------ | ---------- | ------------------------------------------- |
| `/api/auth/session`                   | GET          | `AuthApiClient.getSession`           | no         | `/api/session` is an internal alias to this |
| `/api/auth/login`                     | POST         | `AuthApiClient.login`                | no         | returns `csrfToken` + `user`                |
| `/api/auth/activate`                  | POST         | `AuthApiClient.activate`             | yes        | STARTER -> ACTIVE activation                |
| `/api/auth/logout`                    | POST         | `AuthApiClient.logout`               | yes        |                                             |
| `/api/auth/reset/complete`            | POST         | admin-parity reset flow              | yes        |                                             |
| `/api/me/profile`                     | GET, PATCH   | `getProfile`, `updateProfileContact` | PATCH: yes |                                             |
| `/api/me/username/change`             | POST         | `changeProfileUsername`              | yes        |                                             |
| `/api/me/password/change`             | POST         | `changeProfilePassword`              | yes        |                                             |
| `/api/me/identity-correction-request` | POST         | `requestProfileIdentityCorrection`   | yes        |                                             |
| `/api/me/avatar`                      | POST, DELETE | direct                               | yes        |                                             |
| `/api/identity-roster/self`           | POST         | roster self-read                     | yes        |                                             |
| `/api/version`                        | GET          | `getReleaseIdentity`                 | no         | release identity banner                     |

**Contracts a visual change must not weaken.**

- Session cookie is server-set. `authorize()` and `authorizeSession()` in
  `src/worker/index.js` read the session cookie and the `x-csrf-token` header,
  and pass `mutation: true` for non-GET.
- CSRF token lives in `src/auth/session-state.js` and is attached by
  `src/v5/integration/backend.js`. A surface must never read, cache, log, or
  render it.
- Credential-version / revocation / expiry / rate-limit / generic-error behavior
  belongs to `src/server/auth/service.js`. Failure messages are deliberately
  generic. **Do not make a login error more specific in the name of better UX** —
  that reintroduces account enumeration.
- The account-application email step uses a secure eight-digit verification code
  with resend invalidation (`src/server/account-application/service.js`). Code
  length, lifetime, resend semantics, and masking are security behavior, not
  styling.
- Application status and withdraw are authenticated by a **bearer status token**,
  not by session. Do not merge those flows into the session-based client.

`ACCOUNT_STATUS` = `STARTER | ACTIVE | DISABLED | REVOKED`.
`EXPERIENCE` = `administrator | director | food | inventory-pantry | materials`.
`ROLES` = `SYSTEM_OWNER | ADMINISTRATOR | DIRECTOR | DOL_STAFF | COMMITTEE_HEAD | REQUESTER | READ_ONLY_AUDITOR`.

---

## 4. Authenticated surfaces — route, capability, module, state

Client-side gate: `isV5RouteAuthorized()` in `src/v5/integration/runtime.js`.
Server-side gate: `authorize(request, auth, capability, { mutation })` in
`src/worker/index.js`. **The client gate is presentation. The server gate is
authorization.** Hiding a control is never a permission.

| Route id             | Required capability                             | Bootstrap module | Declared states                                | Adoption                        |
| -------------------- | ----------------------------------------------- | ---------------- | ---------------------------------------------- | ------------------------------- |
| `admin.overview`     | `view.internal` + workspace `administrator`     | `overview`       | populated, loading, empty, unavailable, denied | RECONCILE                       |
| `director.overview`  | `view.all.summary` + workspace `director`       | `overview`       | populated, denied                              | RECONCILE                       |
| `food.overview`      | `view.internal` + workspace `food`              | `overview`       | populated, denied                              | RECONCILE                       |
| `inventory.overview` | `view.inventory` + workspace `inventory-pantry` | `overview`       | populated, denied                              | RECONCILE                       |
| `materials.overview` | `view.internal` + workspace `materials`         | `overview`       | populated, denied                              | RECONCILE                       |
| `request.queue`      | `view.request`                                  | `request`        | populated, loading, empty, stale, denied       | RECONCILE                       |
| `lending.queue`      | `view.internal`                                 | `lending`        | populated, empty                               | RECONCILE                       |
| `lending.detail`     | `view.internal`                                 | `lending`        | populated                                      | RECONCILE                       |
| `release.desk`       | `fulfillment.release`                           | `release`        | populated, success, unavailable                | RECONCILE                       |
| `inventory.catalog`  | `view.inventory`                                | `inventory`      | populated, loading                             | RECONCILE                       |
| `inventory.item`     | `view.inventory`                                | `inventory`      | populated                                      | RECONCILE                       |
| `restocking.queue`   | `view.inventory`                                | `restocking`     | populated, partial                             | RECONCILE                       |
| `procurement.board`  | `view.internal`                                 | `procurement`    | populated                                      | RECONCILE                       |
| `events.series`      | `event.manage`                                  | n/a (special)    | populated                                      | RECONCILE                       |
| `audit.activity`     | `view.audit`                                    | `overview`       | populated                                      | RECONCILE                       |
| `admin.access`       | `access.admin`                                  | n/a (special)    | populated, denied                              | RECONCILE                       |
| `admin.directory`    | `access.admin`                                  | n/a (special)    | populated, empty, denied                       | RECONCILE                       |
| `admin.reference`    | `reference.manage`                              | n/a (special)    | populated                                      | RECONCILE                       |
| `admin.links`        | `reference.manage`                              | n/a (special)    | populated                                      | RECONCILE                       |
| `admin.brand`        | `brand.manage`                                  | n/a (special)    | populated                                      | RECONCILE                       |
| `account.profile`    | always permitted (session required)             | n/a (special)    | populated                                      | PORT_WITH_CONTRACT_PRESERVATION |
| `owner.health`       | `system.diagnostics`                            | n/a (special)    | populated, denied                              | RECONCILE                       |

`account.profile` is deliberately exempt from the capability gate
(`isV5RouteAuthorized` returns `true` early). Preserve that: an authenticated
user with no module capability must still reach their own profile.

Default workspace routing is `DEFAULT_ROUTE_BY_WORKSPACE` ->
`selectDefaultWorkspaceRoute()`, falling back to `account.profile`, then to the
first authorized route, then to `public.signin`. Preserve that ladder.

---

## 5. Read path — bootstrap and module data

| Worker route                                                                | Method   | Capability                          | Purpose                                                                |
| --------------------------------------------------------------------------- | -------- | ----------------------------------- | ---------------------------------------------------------------------- |
| `/api/bootstrap`, `/api/getEssentialBootstrapData`, `/api/getBootstrapData` | GET/POST | `view.request` unless `requestOnly` | Essential bootstrap; `getBootstrapData` also returns the active module |
| `/api/getBootstrapModule`, `/api/bootstrap/<module>`                        | GET/POST | `view.request` unless `requestOnly` | One module payload                                                     |
| `/api/<group>` where group in `GROUP_MODULE`                                | GET      | per `GROUP_CAPABILITY`              | Module read by URL group                                               |
| `/api/getDataRevision`                                                      | POST     | `view.request`                      | Global revision token                                                  |
| `/api/getScopedRevision`                                                    | POST     | `view.request`                      | Scoped revision, near-live refresh                                     |
| `/api/admin/migrations`                                                     | GET      | `system.diagnostics`                | Migration status                                                       |
| `/api/health`, `/api/readiness`, `/api/version`                             | GET      | none                                | Health and identity                                                    |

```text
BOOTSTRAP_MODULES (src/app/bootstrap-contract.js)
  overview - request - lending - release - restocking - procurement - inventory

GROUP_MODULE / GROUP_CAPABILITY (src/worker/index.js)
  requests    -> request     view.request
  lending     -> lending     view.internal
  releases    -> release     fulfillment.release
  inventory   -> inventory   view.inventory
  restocking  -> restocking  view.inventory
  procurement -> procurement view.internal
  receiving   -> procurement fulfillment.receive
  reference   -> overview    reference.manage
  admin       -> overview    system.admin

PAGINATION BOUNDS (src/app/bootstrap-contract.js)
  standard module rows   100
  inventory module rows  500
  child collection rows  500   (requestLines)
```

Pagination is a **server** bound. A visual table may not raise it, and may not
render a total it did not receive. `/api/getScopedRevision` drives near-live
refresh; if the poller is disabled, an open workspace stops noticing public
submissions. Preserve `revision-sync` wiring when reworking the shell.

---

## 6. Write path — operations, capabilities, idempotency

Dispatch chain:

```text
surface action
  -> src/v5/integration/operations-parity.js | admin-parity.js
  -> backend.commands  (src/services/legacy-runtime-adapter.js, mode "rest")
  -> src/services/http-api-adapter.js
  -> POST /api/<method>            with x-csrf-token
  -> src/worker/index.js           capabilityForMethod(method) -> authorize(mutation: true)
  -> src/server/d1/operational-service.js
```

`METHOD_CAPABILITIES` (`src/server/d1/operational-service.js`) — 40 operations.
This is the authoritative operation-to-capability map.

| Operation                 | Capability            | Operation                       | Capability                   |
| ------------------------- | --------------------- | ------------------------------- | ---------------------------- |
| `submitRequest`           | `request.create`      | `uploadEvidence`                | `evidence.upload`            |
| `reviewRequest`           | `request.review`      | `confirmRelease`                | `fulfillment.release`        |
| `reserveStock`            | `fulfillment.reserve` | `correctRelease`                | `fulfillment.release`        |
| `saveCanvassReference`    | `fulfillment.canvass` | `transferEventItemToInventory`  | `inventory.merge_event_item` |
| `updateCanvassReference`  | `fulfillment.canvass` | `transferEventItem`             | `inventory.merge_event_item` |
| `archiveCanvassReference` | `fulfillment.procure` | `postCycleCountAdjustment`      | `inventory.adjust`           |
| `getMaterialsWorkQueue`   | `view.internal`       | `listInventoryClassifications`  | `inventory.classify`         |
| `selectPreferredCanvass`  | `fulfillment.procure` | `classifyInventoryItem`         | `inventory.classify`         |
| `transitionDeliverable`   | `fulfillment.procure` | `bulkClassifyInventoryItems`    | `inventory.classify`         |
| `getRestockDetail`        | `view.inventory`      | `createInventoryItem`           | `reference.catalog.manage`   |
| `transitionRestock`       | `fulfillment.procure` | `updateInventoryItem`           | `reference.catalog.manage`   |
| `createLendingTicket`     | `lending.create`      | `updateInventoryStorageContext` | `reference.catalog.manage`   |
| `registerInventoryAsset`  | `lending.approve`     | `archiveInventoryItem`          | `reference.catalog.manage`   |
| `recordAssetMaintenance`  | `lending.return`      | `restoreInventoryItem`          | `reference.catalog.manage`   |
| `approveLendingTicket`    | `lending.approve`     | `getEventManagement`            | `event.manage`               |
| `confirmLendingHandoff`   | `lending.handoff`     | `saveEventSeries`               | `event.manage`               |
| `confirmReturn`           | `lending.return`      | `saveEventDay`                  | `event.manage`               |
| `receiveRestock`          | `fulfillment.receive` | `saveEventActivity`             | `event.manage`               |
| `receiveDeliverable`      | `fulfillment.receive` | `linkEventOperationalRecord`    | `event.manage`               |
|                           |                       | `getMigrationStatus`            | `system.diagnostics`         |

An unknown method returns `OPERATION_NOT_FOUND` 404; a known method with no D1
handler returns `OPERATION_NOT_IMPLEMENTED` 501. Both are real states a surface
must be able to display.

Naming note, verified so nobody re-investigates it: the UI action id is
`confirmLoanHandoff`, aliased in `src/services/legacy-runtime-adapter.js:430` to
the server operation `confirmLendingHandoff`. Not a defect.

`src/services/service-contract.js` `SERVICE_METHODS` (29 entries) is the adapter
completeness contract — `assertServiceContract` throws if an adapter is missing
one. If a slice introduces a new adapter, it must satisfy this list.

Evidence upload uses a larger body bound: `uploadEvidence` allows 14,100,000
bytes; every other command allows 1,100,000. Client-side file limits must match,
not exceed.

Idempotency and replay live in `src/services/idempotency-service.js` and the
`replay(...)` path in `operational-service.js`. A retry button must reuse the
idempotency key, not generate a new one.

---

## 7. Cross-cutting UI contracts

### States every ported surface must render

```text
loading      conflict / stale revision
empty        denied (server 403 / capability failure)
populated    unavailable (service down, readiness failure)
error        validation error (field-scoped)
success      partial (restocking; partial release)
```

Never substitute a fixture, a placeholder count, or a demo actor for any of
these. `clearBackendViewModels()` runs before the V5 module renders precisely so
that no connected surface silently falls back to illustrative rows
(`src/v5/integration/entry.js`). Preserve that call.

### Error envelope

`ApiError(code, message, { status, details })` and `AppError` in
`src/app/errors.js`. Responses carry `x-correlation-id`. Field errors arrive as
`fieldErrors` (or `details.fieldErrors`); retry hints as `retryAfterMs`. A visual
error state must surface the message and correlation id and must not invent a
cause.

### Environment isolation

`ENVIRONMENT` is a Worker var. Bindings for D1, R2, and secrets are selected
server-side (`wrangler.jsonc`: DEVELOPMENT / STAGING / PRODUCTION, distinct D1
databases and R2 buckets per environment). Browser state **cannot** retarget the
environment, and no slice may add a client-side environment switch. The comment
in `src/v5/integration/entry.js` states this contract; keep it true.

`/api/playground/*` exists only when `isPlaygroundRuntime(env)`; a POST to
`/api/playground/session` outside a Playground runtime is refused. Playground
mutations mark the Playground as modified. Do not surface Playground controls in
a Production build.

### Assets

`/brand/catalog/<key>` and `/media/advertisements/<id>` are Worker-served R2
objects with strict key validation and GET/HEAD only. Do not inline, proxy, or
re-host them from the visual layer.

---

## 8. Data invariants the frontend must not break

From `.agents/PROJECT_POLICY.md` and confirmed in `src/server/d1/operational-service.js`:

- D1 is authoritative for structured operational data; R2 for governed files,
  photos, receipts, evidence, exports, backups.
- Inventory quantity derives from an append-only ledger.
- Reservations affect availability, **not** physical on-hand quantity.
- Request submission does **not** deduct physical stock.
- Receiving, release, handoff, return, transfer, reversal, and adjustment are
  explicit authorized movements.
- Posted ledger, audit, custody, identity, approval, status, migration, and
  evidence history is append-only and never silently overwritten.
- Activity History (`/api/admin/staff-account-activity-history`, migration 0032)
  is append-only and role-scoped.
- Canonical identity and explicit account-to-person linkage (migration 0031) are
  never inferred from a name, email, role, or display string.
- Unknown records stay unresolved or quarantined. Never fabricate a balance,
  identity, date, role, provenance, or provider state.

Verified status vocabularies that a visual timeline must mirror exactly:

```text
RESERVABLE_PARENT_STATUSES   ACCEPTED - PARTIALLY_RELEASED

DELIVERABLE_TRANSITIONS
  FOR_CANVASSING      -> WAITING_FOR_BUDGET | CANCELLED
  WAITING_FOR_BUDGET  -> TO_BE_PROCURED | CANCELLED
  TO_BE_PROCURED      -> PROCURED | CANCELLED
  PROCURED            -> PARTIALLY_RECEIVED | READY_TO_RELEASE | CANCELLED
  PARTIALLY_RECEIVED  -> READY_TO_RELEASE | CANCELLED
  READY_TO_RELEASE    -> PARTIALLY_RELEASED | COMPLETED
  PARTIALLY_RELEASED  -> COMPLETED

RESTOCK_TRANSITIONS
  SEND_TO_BUDGET_REVIEW   FOR_CANVASSING -> WAITING_FOR_BUDGET   requiresPreferred
  AUTHORIZE_PROCUREMENT   WAITING_FOR_BUDGET -> TO_BE_PROCURED   requiresPreferred
  REJECT                  FOR_CANVASSING | WAITING_FOR_BUDGET -> REJECTED
  CANCEL                  FOR_REVIEW | FOR_CANVASSING | WAITING_FOR_BUDGET
                          | TO_BE_PROCURED | PARTIALLY_RECEIVED -> CANCELLED
```

Note the comment preserved in `operational-service.js`: `src/domain/` carries a
wider status vocabulary (`PARTIALLY_FULFILLED`, `IN_PROGRESS`,
`READY_FOR_HANDOFF`) that the D1 layer has **never written**. A visual timeline
built from the domain vocabulary will render states that never occur. Build
timelines from the D1 list above.

---

## 9. Administration and owner surfaces

| Worker route family                                                     | Method    | Capability                                                                | Surface                             |
| ----------------------------------------------------------------------- | --------- | ------------------------------------------------------------------------- | ----------------------------------- |
| `/api/admin/access/*` (14 actions)                                      | POST      | `access.admin`                                                            | `admin.access`                      |
| `/api/admin/staff-directory`                                            | POST      | `access.admin`                                                            | `admin.directory`                   |
| `/api/admin/staff-account-activity-history`                             | POST      | `access.admin`                                                            | `audit.activity`, `admin.directory` |
| `/api/admin/reference-links/*` (6 actions)                              | POST      | `reference.manage`                                                        | `admin.links`                       |
| `/api/admin/advertisements/*` (9 actions)                               | POST      | `advertisement.manage`                                                    | `admin.brand`                       |
| `/api/owner/brand-assets/*` (4 actions)                                 | POST      | `brand.manage`                                                            | `admin.brand`                       |
| `/api/owner/identity-roster/*` (5 actions)                              | POST      | owner-gated                                                               | owner surfaces                      |
| `/api/owner/identity-foundation/*` (2 actions)                          | POST      | owner-gated                                                               | owner surfaces                      |
| `/api/owner/evidence/*` (4 actions)                                     | POST      | owner-gated                                                               | `owner.health`                      |
| `/api/admin/account-applications`, `/api/director/account-applications` | GET, POST | `account_application.admin_review`, `account_application.director_decide` | account request review              |
| `/api/owner/account-applications/<id>/override`                         | POST      | `account_application.owner_override`                                      | owner override                      |
| `/api/lending/usage`, `/api/lending/usage.csv`                          | POST, GET | `lending.usage.view`                                                      | lending reporting/export            |

Exact action lists:

```text
admin/access        options - directory - history - preview-access-id -
                    change-access-id - preview-policy - update-policy -
                    create-account - seed-departments - reset-password -
                    status - revoke-sessions - unlock
admin/reference-links  list - get - history - create - update - transition
admin/advertisements   list - preview - save - upload - publish - schedule -
                       pause - resume - archive
owner/brand-assets     list - upload - publish - rollback
owner/identity-roster  status - preview - directory - apply - rollback
owner/evidence         status - process - restore - archive
owner/identity-foundation  reconciliation-preview - source-projection-probe
```

Account application review requires `reviewEvidence`; the worker rejects an
empty envelope with `ACCOUNT_APPLICATION_REVIEW_EVIDENCE_REQUIRED` and encrypts
plus fingerprints it (`protectReviewCommand`). A visual review form must keep
that field required and must never render the decrypted envelope.

Roster and identity-foundation surfaces handle **protected personal data**. Do
not add export, copy-all, print, or screenshot affordances to them, and do not
widen a directory response to build a richer card.

---

## 10. Capability reference

`src/domain/permissions.js` — 40 capabilities. The visual layer consumes these
as opaque strings; it never computes them.

```text
view.request  view.internal  view.committee.summary  view.all.summary
view.audit  view.inventory
request.create  request.review  request.missing_information  request.reject
request.reopen
workflow.assign_committee  workflow.assign_staff  workflow.escalate
fulfillment.canvass  fulfillment.procure  fulfillment.reserve
fulfillment.receive  fulfillment.release
lending.create  lending.approve  lending.handoff  lending.return
lending.usage.view
inventory.merge_event_item  inventory.adjust  inventory.classify
event.manage  brand.manage
reference.catalog.manage  reference.manage  advertisement.manage
access.admin
account_application.admin_review  account_application.director_decide
account_application.owner_override
system.admin  system.diagnostics  evidence.upload
```

---

## 11. Existing test evidence a slice may reuse

Reuse these until an invalidator fires. Do not re-derive their coverage.

```text
tests/unit/                     146 files
tests/integration/                2
tests/e2e/                       25
tests/cloudflare-e2e/             2
tests/staging-e2e/                3

directly relevant to this programme
  tests/unit/v5-backend-integration.test.js       adapter and view-model contract
  tests/unit/v5-admin-parity.test.js              administration controller contract
  tests/unit/v5-operations-parity.test.js         operations controller contract
  tests/unit/v5-revision-sync.test.js             near-live refresh
  tests/unit/v5-dist-verifier.test.js             generated artifact parity
  tests/unit/visual-baseline.test.js              visual baseline extraction
  tests/unit/access-policy.test.js                capability resolution
  tests/unit/v072-worker-route-contract.test.js   worker route contract
  tests/unit/identity-foundation-worker-route-contract.test.js
  tests/e2e/v5-current-application.spec.js        current application behavior
  tests/e2e/v5-visual-acceptance.spec.js          visual acceptance
  tests/e2e/navigation-responsive.spec.js         responsive navigation
  tests/e2e/request-accessibility.spec.js         request accessibility
  tests/e2e/v072-account-access.spec.js           account/access journeys

commands
  npm run lint - npm test - npm run build - npm run verify:dist
  npm run check:apps-script - npm run check:governance
  npm run test:e2e - npm run test:e2e:v5 - npm run test:e2e:v5:visual
  npm run check   (the full canonical gate)
```

**Invalidators** — rerun the affected evidence when any of these change:
`src/worker/index.js`, `src/server/**`, `src/services/**`,
`src/v5/integration/**`, `src/app/bootstrap-contract.js`,
`src/domain/permissions.js`, `src/auth/**`, `migrations/**`, `wrangler.jsonc`,
`vite.config.js`, `package.json` dependencies, or any generated artifact.

---

## 12. Known open visual defects carried by the design baseline

From `docs/design/FIGMA_DESIGN_MAKE_AUDIT.md`. These are **design-side** issues.
A port must not carry them into product source.

| Id                  | Severity | Status                 | Effect on a port                                                                                                                                                                      |
| ------------------- | -------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `D-08`              | HIGH     | OPEN                   | 17 of 59 landing-hero text nodes fail WCAG 2.2 AA; ledger step labels measure 1.01:1 to 1.84:1. Do not port those inks as-is. Needs an owner call on active/inactive state semantics. |
| `D-02`              | MEDIUM   | OPEN                   | Blur ladder defined twice and inconsistently (variables 12/18/24/28 vs effect styles 16/22/30/36). Pick one and record it before porting glass.                                       |
| `D-04`              | MEDIUM   | OPEN                   | Three-way typeface reality: Production Georgia+Aptos, authority Bricolage/Plex/Newsreader, Figma Inter. FI-01 must resolve this explicitly.                                           |
| `D-05`              | MEDIUM   | PARTIAL                | File-wide variable-binding coverage unmeasured outside page 30. Treat unbound colour as suspect.                                                                                      |
| `D-07`              | MEDIUM   | OPEN                   | Overview hierarchy puts provenance above exceptions, contradicting `DESIGN.md` D20.                                                                                                   |
| `D-03`              | MEDIUM   | RESOLVED in baseline A | Authority page was built.                                                                                                                                                             |
| 54 inferred colours | —        | RESIDUAL               | 54 nodes on Figma page 15 carry inferred (not proven original) colour. Figma version history holds the pre-session state.                                                             |

---

## 13. Field-level detail — deliberate pointer, not a copy

Field literals for each surface are **not duplicated into this document**. They
are large, they change with the server, and a stale copy would be worse than no
copy. Each slice resolves its fields from the exact symbol below and records the
resolved list in its own slice record.

| Domain                           | Authoritative field source                                                                                                                    |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Public request                   | `src/server/public-request-service.js`, `src/visual/public-requester-portal.js`                                                               |
| Public lending                   | `src/server/public-lending-service.js`, `src/visual/public-lending-portal.js`                                                                 |
| Account application              | `src/server/account-application/contracts.js`, `adapters.js`, `src/visual/public-account-application.js`                                      |
| Auth and session                 | `src/server/auth/contracts.js`, `src/auth/http-contract.js`                                                                                   |
| Profile                          | `src/server/profile/service.js`                                                                                                               |
| Operations forms and actions     | `src/v5/integration/operations-parity.js` (`field(...)` declarations per action)                                                              |
| Administration forms and actions | `src/v5/integration/admin-parity.js`                                                                                                          |
| Access management                | `src/server/access/service.js`, `src/server/access/policy.js`                                                                                 |
| Bootstrap payload shape          | `src/app/bootstrap-contract.js`                                                                                                               |
| Domain workflows                 | `src/domain/composite-requests.js`, `materials-workflow.js`, `food-workflow.js`, `venue-equipment-workflow.js`, `reference-administration.js` |

`operations-parity.js` and `admin-parity.js` already declare each action's id,
title, required capability, and field list with kind, required flag, and
max length. That is the field contract. Read it there; do not re-derive it.

---

## STALE_IF

Re-verify this matrix if any of the following changed since
`origin/main@86553349f5c2ebefaa637c30828c560a301f99ba`:

```text
src/worker/index.js                  route table, GROUP_MODULE, GROUP_CAPABILITY
src/server/d1/operational-service.js METHOD_CAPABILITIES, transition tables
src/domain/permissions.js            CAPABILITIES
src/domain/constants.js              ROLES
src/auth/http-contract.js            AUTH_API_ROUTES, AUTH_STATE
src/v5/src/registry.js               SURFACES, V5_ROUTE_CLASSIFICATIONS, NAV
src/v5/integration/runtime.js        ROUTE_CAPABILITY, ROUTE_STATES, PUBLIC_ROUTES,
                                     SPECIAL_ROUTES, MODULE_BY_ROUTE
src/app/bootstrap-contract.js        BOOTSTRAP_MODULES, row bounds
src/services/service-contract.js     SERVICE_METHODS
migrations/                          any new migration
wrangler.jsonc                       bindings, assets, run_worker_first
```

Cheap re-verification:

```bash
git diff --stat origin/main src/worker/index.js src/v5/src/registry.js src/v5/integration/runtime.js src/domain/permissions.js src/app/bootstrap-contract.js
```
