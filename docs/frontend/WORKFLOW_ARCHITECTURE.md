# HAU-USC Logistics — frontend workflow architecture

Status: active
Scope: `src/frontend/` on `frontend-design-integration`
Authority: `DESIGN.md` (design) → repository server/Worker/auth contracts (functional) → this document (frontend route and workflow ownership)
Accepted amendment: `.codex/specs/accepted/2026-08-23-r3-a1-figma-make-design-sync-codex-preview-handoff.md` (R3-A1)
Last reviewed: 2026-08-23 (R3 public/staff boundary audit; citation corrected by R3-A1)

This document records who each frontend surface is for, what it is allowed to do,
and which module owns each mutating business action. It does not define product
policy. Where it describes access rules it is restating accepted authority.

For the **public Request Center** the authority is `DESIGN.md` D06 Product /
Route Inventory (`/request` = *Public request intake*), production
`public-requester-portal.js` at `0.8.2 / c316e047` containing no session check,
no sign-in gate and no authorization branch (`ACCESS_MODEL_DRIFT` / `PL-01` in
the parity audit), and the accepted `/api/public/request` Worker contract.

`DESIGN.md` D24.0 is the OWNER-LOCKED no-login model for the **Public Lending
Center**. It is the correct analogous precedent, but it is not the Request
citation; earlier revisions of this document and `.codex/R3_PUBLIC_STAFF_BOUNDARY_RECEIPT.md`
quoted it as one. See the correction of record in `DESIGN.md`.

---

## 1. Contexts

The frontend has two contexts. They are different products sharing one record.

| | Public service | Staff operations |
|---|---|---|
| Audience | Angelite students, USC staff and officers acting as requesters | authenticated council staff |
| Entry | public front door (`landing`) | `staff-signin` |
| Authentication | **none, ever** | required |
| Authorization | none | server-derived capabilities |
| Shell | `PublicNavbar` + `LandingPage` / `PublicFlows` | FI-04, not yet exposed |

**A staff sign-in link is not a staff sign-in requirement.** The public service
must never place authentication, activation, or approval in front of intake,
browsing, or tracking. This is the rule that the R3 audit found violated; see §5.

---

## 2. Route map

Routing is in-memory React state in `src/frontend/app/useAppController.ts`. There
is no URL router: routes are not addressable, and refresh, deep link, Back and
Forward do not restore route state. This is a known and recorded limitation, not
an accident — see §6 FE-R3-005.

### Public routes

| Route | Surface | Auth | Primary job | Backend operation |
|---|---|---|---|---|
| `landing` | `landing/LandingPage.tsx` | none | orient; choose a service | `GET /api/public/advertisements` |
| `request` | `PublicFlows.tsx` (Request Center) | none | submit a logistics request; receive a private tracking code | `GET /api/public/request/options`, `POST /api/public/request` |
| `borrow` | `PublicFlows.tsx` (Lending Center) | none | browse the catalog; submit a borrowing request | `GET /api/public/lending/catalog`, `POST /api/public/lending` |
| `tracking` | `PublicFlows.tsx` (Track a record) | none | look up own request or loan by reference + private code | `POST /api/public/request/track`, `POST /api/public/lending/track` |
| `staff-signin` | `auth/StaffSignInPage.tsx` | none (it *is* the gate) | authenticate; apply for staff access; check application status | `POST /api/auth/login`, `/api/auth/activate`, `/api/account-applications/*` |

### Staff routes

All ten (`overview`, `inventory`, `request-center`, `lending`, `release`,
`restocking`, `procurement`, `events`, `administration`, `profile`) are declared
in `app/appRoutes.ts` and capability-mapped in `integration/routeAccess.ts`, but
**none renders an operational workspace in this release**. `requireAuth` routes
every one of them to `StaffSignInPage`, which states plainly that the workspace is
not yet available. `DESIGN.md` records this as intentional: authenticated
workspaces begin at FI-04.

Consequence for this audit: a public control that points at a staff route is not
merely mislabelled, it is a guaranteed dead end.

---

## 3. Personas and entry points

| Persona | Enters at | Sees | May create | May mutate |
|---|---|---|---|---|
| Public requester (Angelite student, USC officer) | `landing` | landing, Request Center, Lending Center, tracking | request, borrowing request | nothing server-side beyond own submission |
| Applicant for staff access | `staff-signin` → Apply | application form, own status by private token | account application | withdraw own application |
| Authenticated staff | `staff-signin` | sign-in result only, in this release | — | — (FI-04) |

Borrower eligibility (`ANGELITE`, `USC_STAFF` in the lending form) is **requester
classification, not authentication**. It never produces a session, a role, or a
capability. Verified in `PublicFlows.tsx`: the borrower type only shapes which
fields are required.

---

## 4. Business-action ownership

One canonical entity, one owning module per mutating action.

| Business action | Entity | Owning module | Backend operation | Allowed entry points |
|---|---|---|---|---|
| Submit logistics request | request | `PublicFlows` (Request Center) | `POST /api/public/request` | Request Center step 5 only |
| Submit borrowing request | lending submission | `PublicFlows` (Lending Center) | `POST /api/public/lending` | Lending Center form only |
| Track own record | request / loan | `PublicFlows` (Track a record) | `POST /api/public/{request,lending}/track` | Track view only |
| Authenticate | session | `StaffSignInPage` | `POST /api/auth/login` | sign-in form only |
| Activate starter account | account | `StaffSignInPage` | `POST /api/auth/activate` | activation form only |
| Apply / check status / withdraw | account application | `AccountAccessPanel` | `/api/account-applications/*` | sign-in page panels only |
| Sign out | session | `useAppController.handleSignOut` | `POST /api/auth/logout` | authorized state only |

Duplicate frontend action owners: **0**. Ambiguous frontend state owners: **0**.
Staff-side ownership (reserve, canvass, release, handoff, custody, return) is not
yet implemented and must be assigned when FI-04 through FI-09 land — no frontend
module may introduce a second release or handoff mutation path.

Both public submissions send a client-generated `clientRequestId`
(`frontend-<uuid>`) and disable their submit control while in flight, so a double
submit cannot create two records.

---

## 5. Public/staff boundary rules

1. Public intake, browsing, and tracking never require or probe a session.
2. Every public "Start a logistics request" control navigates to `request`.
   It must not call `requireAuth`.
3. "Staff sign in" navigates to `staff-signin` with **no intended route**.
   A generic sign-in must not pre-commit to a capability-gated destination:
   binding it to `request-center` denied otherwise-valid staff accounts that
   merely lacked `view.request`.
4. `requireAuth(target)` is only for the case where the user asked for a
   *specific* protected destination. No public control does this today; the
   mechanism remains for FI-04 and is exercised through the gated preview index.
5. A successful sign-in with no requested destination is authorized on the
   strength of the session. Denial is reserved for a specific route the account
   genuinely lacks capability for.
6. Public surfaces render no internal notes, supplier quotes, evidence,
   reservation or procurement internals, or other requesters' records. Private
   tracking codes and status tokens are shown once, never placed in URLs, and
   never persisted to browser storage.

Regression coverage for rules 1–3 and 5 lives in `tests/e2e/frontend-cutover.spec.js`
(`R3 …` tests, all five widths). Rule 4's session contract is covered by
`tests/e2e/preview-index.spec.js`.

---

## 6. Known open findings

| ID | Sev | Summary | Owner |
|---|---|---|---|
| FE-R3-001 | P0 | *Fixed.* Every public "Start a logistics request" CTA called `requireAuth("request-center")`, sending public requesters to the staff sign-in wall; the public Request Center had no entry point anywhere on the public site. | FI-04 / this pass |
| FE-R3-002 | P1 | *Fixed.* Generic "Staff sign in" in `PublicFlows` pre-committed to `request-center`, so a valid staff account lacking `view.request` was told "Access denied". | this pass |
| FE-R3-003 | P2 | Public sub-routes stack two headers — the site `PublicNavbar` and `PublicFlows`' own masthead — and present "Staff sign in" twice on the same page, plus two competing back affordances ("HAU-USC home" and "← Public front door"). Duplicate destinations and duplicated chrome. | FI-04 shell |
| FE-R3-004 | P2 | `PublicMobileDrawer` sets `role="dialog" aria-modal="true"`, handles Escape and locks body scroll, but performs no focus management: focus is never moved into the drawer on open, there is no focus trap so Tab walks out into the page behind it, and focus is not restored to the menu button on close. | FI-04 shell |
| FE-R3-005 | P2 | No URL routing: no deep links, no Back/Forward, no refresh restore. Introducing a router is out of scope without accepted authority. | FI-04 |
| FE-R3-006 | P2 | `AppRouteRenderer`'s `session && isAuthRoute(route)` branch is unreachable — `requireAuth` always routes to `staff-signin`. Dead duplicate presentation path. | FI-04 |
| FE-R3-007 | P2 | The preview registry labels ten staff routes `SURFACE_PREVIEW` with "preserved visual components", but `AuthenticatedShell` and all staff route components are orphaned — nothing imports them, so the surfaces do not render. Registry status overstates reality. | FI-04 |
| FE-R3-008 | P3 | `CurrentSection` prints the same status sentence twice (figure placeholder and article body) in loading, empty, and error states. | FI-12 |
| FE-R3-009 | P3 | `npm run lint` fails at branch baseline: 26 `no-undef` errors in `prototypes/public-portals-r3/app.js` (browser globals unconfigured) plus one unused-var warning in `src/server/public-request-service.js`. Pre-existing; lint is not in the branch's accepted gate. | FI-12 |
| FE-R3-010 | P2 | **RESOLVED by R3-A1 (2026-08-23).** The Impeccable sidecar `.impeccable/design.json` was stale: written 2026-08-08 by the pre-cutover v4.1 redesign, its 15-colour palette contained **none** of the current identity anchors (no `#d4af37`, no `#40070a`, no `#7d5518`), so the `design-system-color` rule flagged the real institutional palette as drift. Rebuilt at schemaVersion 2 from `scripts/design/theme-source.mjs` and the shipped `theme.css`, and a machine-readable `colors` / `typography` / `rounded` block was added to `DESIGN.md` frontmatter, which the detector reads. Measured on the eight public components: `design-system-color` findings **27 -> 0**. | CLOSED |
| FE-R3-011 | P3 | **Re-scoped by R3-A1.** With the false positives gone, the residual is small and specific rather than "literal hex throughout": **7 advisory `design-system-radius` findings**, all in `PublicFlows.tsx` — `12px` x6 (lines 951, 959, 975, 981, 986, 989) and `18px` x1 (line 913) — against the real scale sm 6 / md 8 / lg 10 / xl 14 / pill 999. Separately, the shipped system declares font families and weights but **has never defined a type ramp**: `theme.css` carries only `--font-size: 16px`, while the public components use ten ad-hoc literal steps (9, 10, 11, 12, 13, 14, 15, 16, 18, 19px). `DESIGN.md` deliberately declares no `fontSize` steps rather than blessing those literals as a ramp. Both are product-source edits and therefore Codex/FI work, not design-authority work. | FI-12 / FI-13 |
| FE-R3-012 | P2 | **Opened by R3-A1 (2026-08-23).** The R3-A1 vocabulary agreement — public **Request Center** vs internal **Request Hub** — now holds in `DESIGN.md`, the Figma Design current lane, Figma Make v40, the repository Make mirror and this document. It does **not** yet hold in the frontend implementation: `src/frontend/app/appRoutes.ts:19` still maps `"request-center": "Staff Request Center"`, and that string is user-facing — `auth/StaffSignInPage.tsx:41` renders it as `intendedLabel` when a staff member is sent to sign in for that route. `src/frontend/preview/index/registry.ts:103` carries the same label. The effect is a staff-facing surface named "Staff Request Center", colliding with the public Request Center the R3 repair just made reachable. Rename to "Request Hub" (or "Internal Request Hub") in both files. Product-source edit, therefore Codex/FI work — R3-A1 is design-authority only and deliberately did not touch `src/frontend/`. | Codex preview adoption |

---

## 7. Relationship to Figma

`DESIGN.md` names the authenticated live Figma Make file
(`rP9W9MQlZkyQrUx38TVsFS`) as the interactive frontend prototype authority.
Since R3-A1 the **current-authority lane** of the Figma Design file
(`hXJElH4p72KfgAaoUyfNOC`) is the design documentation and visual reference
authority; its historical lanes remain historical. Repository contracts remain
the sole functional authority.

**Historical, R3:** no Figma or Figma Make write was performed in the R3 pass.
`.codex/CURRENT.md` then recorded `FIGMA_WRITE: FORBIDDEN`, and R3's fixes were
routing and behaviour corrections that did not alter Make's visual composition.
R3 recorded that the Make source should be reconciled to the corrected public CTA
destinations once write authority was granted.

**Superseded by R3-A1.** That authority was granted. R3-A1 authorizes bounded
writes to those two design files and nothing else, and performed them: the Figma
Design current-authority lane is reconciled, and the eight-file Make changeset was
applied and **saved as Version 40** (previous 39), verified after a full reload
with zero pending edits. Exercised live: "Start a logistics request" reaches the
public Request Center, and "Staff sign in" reaches a separate staff sign-in page.
The repository Make mirror at `output/design/figma-make-source/` is refreshed to
v40. See `.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md`.
