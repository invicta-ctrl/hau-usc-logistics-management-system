# Impeccable Surface Matrix

Derived from repository source on branch `design/impeccable-whole-site-preview`
at `a18e8fc`. Routes are **not** invented — every canonical path below traces to
a source constant. Where the repository has no route for a family the prompt
lists, that is stated rather than fabricated.

> **Drift note (checked 2026-08-08).** While this preview was being built, a
> separate Codex process advanced `release/v0.7.2-production-access-operations`
> by 19 commits, from `a18e8fc` to `1f216a1`. `a18e8fc` remains an ancestor, so
> nothing here diverged. Of every file this matrix cites, only
> `src/domain/permissions.js` changed: `CAPABILITIES.REQUEST_REVIEW` was granted
> to `ADMINISTRATOR` so the shipped reviewer surface is visible to them. No
> route, workspace, module, status, ledger type, or label changed. That grant
> reinforces the Request Center preview rather than contradicting it. Re-derive
> this matrix against the then-current head before any production integration.

## A. Authoritative route facts

**Workspace roots** — `src/visual/workspace-routes.js:1-7`

| Workspace id | Slug | Path |
|---|---|---|
| `administrator` | `admin` | `/admin` |
| `director` | `director` | `/director` |
| `food` | `food` | `/food` |
| `inventory-pantry` | `inventory` | `/inventory` |
| `materials` | `materials` | `/materials` |

Canonical form is `/{slug}/{module}`; `/app/{slug}/{module}` is accepted as
legacy (`workspaceRouteFromPath`, `src/visual/workspace-routes.js:13-22`).

**Modules** — `BOOTSTRAP_MODULES`, `src/app/bootstrap-contract.js:17-25`:
`overview`, `request`, `lending`, `release`, `restocking`, `procurement`,
`inventory`.

**Rendered module views** — `src/visual/views/`: `overview.html`, `request.html`,
`lending.html`, `inventory.html`, `release.html`, `restocking.html`,
`procurement.html`, `reference-admin.html`.

**Server route groups** — `GROUP_CAPABILITY`, `src/worker/index.js:121-131`:
`requests`, `lending`, `releases`, `inventory`, `restocking`, `procurement`,
`receiving`, `reference`, `admin`.

**Roles** — `ROLES`, `src/domain/constants.js:25-33`: `SYSTEM_OWNER`,
`REQUESTER`, `DOL_STAFF`, `COMMITTEE_HEAD`, `DIRECTOR`, `ADMINISTRATOR`,
`READ_ONLY_AUDITOR`.

**Committees** — `COMMITTEES`, `src/domain/permissions.js:45-49`: `COM_FOOD`,
`COM_INVENTORY_PANTRY`, `COM_MATERIALS`.

**Statuses** — `STATUS`, `src/domain/constants.js:1-23` (21 values).
**Ledger types** — `LEDGER_TYPES`, `src/domain/constants.js:58-69` (10 values).
**User-facing labels** — `src/domain/presentation-labels.js`. The preview uses
this vocabulary; no raw enum appears in the interface.

## B. Fidelity tiers

- **Deep** — full visual fidelity plus the full state set (loading, empty,
  populated, validation error, service unavailable, access denied, stale
  revision, success, partial completion, mobile narrow).
- **Solid** — full visual fidelity, populated plus one or two salient states.

## C. Matrix

### Public and pre-authentication

| # | Family | Repository anchor | Preview surface id | Tier |
|---|---|---|---|---|
| 1 | Public portal landing / selector | `src/visual/portal-navigation.js` | `public.landing` | Solid |
| 2 | Staff Sign In | `src/visual/auth-gateway.js` | `public.signin` | **Deep** |
| 3 | Create Staff Account | `src/visual/auth-gateway.js` | `public.register` | Solid |
| 4 | Email verification | `src/visual/auth-gateway.js` | `public.verify` | Solid |
| 5 | Account application | `src/visual/public-account-application.js`; `src/server/account-application/` | `public.application` | Solid |
| 6 | Application status / tracking | `src/server/account-application/` | `public.application-status` | Solid |
| 7 | Public Request Center intake | `src/visual/public-requester-portal.js` | `public.request-intake` | **Deep** |
| 8 | Public Request tracking + receipt | `src/visual/public-requester-portal.js` | `public.request-tracking` | **Deep** |
| 9 | Public Lending Center intake | `src/visual/public-lending-portal.js` | `public.lending-intake` | Solid |
| 10 | Public Lending tracking + receipt | `src/visual/borrower-lending-portal.js` | `public.lending-tracking` | Solid |
| 11 | Privacy / acceptable-use acknowledgement | `src/visual/public-policy.js` | `public.policy` | Solid |

### Authenticated shared shell

| # | Family | Repository anchor | Preview surface id | Tier |
|---|---|---|---|---|
| 12 | Main Hub shell | `src/components/app-shell.js`; `src/visual/runtime.js` | `shell` (wraps all internal surfaces) | **Deep** |
| 13 | Global search / command | reference topbar `#search-field` (⌘K) | `shell.command` | **Deep** |
| 14 | Notifications | reference `.notification-button` | `shell.notifications` | Solid |
| 15 | Account / profile menu | `src/visual/authenticated-account-controls.js` | `shell.account` | Solid |
| 16 | Workspace + operational-scope selector | `workspace-routes.js`; `COMMITTEES` | `shell.scope` | **Deep** |
| 17 | Light and dark themes | reference `body[data-theme]` | global toggle | **Deep** |
| 18 | Desktop collapsed navigation | reference `[data-sidebar-state="collapsed"]` | global toggle | **Deep** |
| 19 | Tablet layout | reference 768–1024 band | viewport mode | **Deep** |
| 20 | Mobile drawer / bottom navigation | `src/components/mobile-navigation.js` | viewport mode | **Deep** |

### Operations overview and role workspaces

| # | Family | Repository anchor | Preview surface id | Tier |
|---|---|---|---|---|
| 21 | Administrator overview | `/admin/overview` | `admin.overview` | **Deep** |
| 22 | Director overview | `/director/overview` | `director.overview` | Solid |
| 23 | Food committee workspace | `/food/overview` | `food.overview` | Solid |
| 24 | Inventory committee workspace | `/inventory/overview` | `inventory.overview` | Solid |
| 25 | Materials committee workspace | `/materials/overview` | `materials.overview` | Solid |
| 26 | System Owner control / health | `CAPABILITIES.SYSTEM_DIAGNOSTICS`, `src/worker/index.js:1118` | `owner.health` | Solid |

### Core operational modules

| # | Family | Repository anchor | Preview surface id | Tier |
|---|---|---|---|---|
| 27 | Internal Request review queue + detail | `/{ws}/request`; `src/features/requests/` | `request.queue`, `request.detail` | **Deep** |
| 28 | Office Lending Hub queue + loan detail | `/{ws}/lending`; `src/features/lending/` | `lending.queue`, `lending.detail` | **Deep** |
| 29 | Release Desk | `/{ws}/release`; `src/features/release/` | `release.desk` | **Deep** |
| 30 | Restocking and receiving | `/{ws}/restocking`; `src/features/restocking/` | `restocking.queue` | Solid |
| 31 | Procurement, canvassing, deliverables | `/{ws}/procurement`; `src/features/procurement/`, `src/features/canvass/` | `procurement.board` | Solid |
| 32 | Inventory Management | `/{ws}/inventory`; `src/features/inventory/` | `inventory.catalog` | **Deep** |
| 33 | Item detail + movement history | `LEDGER_TYPES`; `src/domain/inventory.js` | `inventory.item` | **Deep** |
| 34 | Event series and sub-event context | `CAPABILITIES.EVENT_MANAGE`; `src/domain/venue-equipment-workflow.js` | `events.series` | Solid |
| 35 | Recent activity / audit history | `CAPABILITIES.VIEW_AUDIT` | `audit.activity` | Solid |

### Administration and supporting modules

| # | Family | Repository anchor | Preview surface id | Tier |
|---|---|---|---|---|
| 36 | Accounts and Access | `CAPABILITIES.ACCESS_ADMIN`; `src/server/access/` | `admin.access` | Solid |
| 37 | Staff Directory | `src/server/identity-roster/` | `admin.directory` | Solid |
| 38 | Reference Administration | `src/visual/views/reference-admin.html`; `src/domain/reference-administration.js` | `admin.reference` | Solid |
| 39 | Link Registry | `src/domain/reference-administration.js` | `admin.links` | Solid |
| 40 | Announcements / Brand and Media | `src/visual/brand-assets.js`; `CAPABILITIES.BRAND_MANAGE` | `admin.brand` | Solid |
| 41 | My Profile and password/security | `src/server/profile/` | `account.profile` | Solid |
| 42 | System status / health / environment | `CAPABILITIES.SYSTEM_DIAGNOSTICS` | `owner.health` (shared with #26) | Solid |

## D. State coverage

Applied in full to every **Deep** surface; sampled on Solid surfaces.

| State | Where it is proven in the preview |
|---|---|
| Loading | `request.queue`, `admin.overview`, `inventory.catalog` |
| Empty | `request.queue`, `lending.queue`, `public.request-tracking` |
| Populated | every surface |
| Validation error | `public.request-intake`, `public.signin` |
| Service unavailable | `admin.overview` (health strip), `release.desk` |
| Access denied | `owner.health` viewed as Administrator; `admin.access` as DOL Staff |
| Stale / revision conflict | `request.detail`, `release.desk` |
| Success | `public.request-tracking` receipt, `release.desk` |
| Partial completion | `release.desk` (partial + cumulative release), `restocking.queue` |
| Mobile narrow | every surface via the viewport switcher |

## E. Deliberate divergences from the prompt's list

- Families **#26 and #42** are one surface in source: System Owner health is the
  `SYSTEM_DIAGNOSTICS`-gated operational health view. Splitting them would
  invent a route.
- **#39 Link Registry** lives inside Reference Administration in source rather
  than as a separate top-level module; it is previewed as its own surface but
  labelled as a section of Reference Administration.
- The legacy `src/app/router.js:1-10` `VIEWS` array (`overview, requests,
  release, inventory, lending, restocking, procurement, reports`) is the older
  hash router. `reports` has a feature directory but no module in
  `BOOTSTRAP_MODULES` and no view template; it is **not** given a preview
  surface, and that omission is deliberate rather than an oversight.
