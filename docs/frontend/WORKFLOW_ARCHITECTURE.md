# HAU-USC Logistics — frontend workflow architecture

Status: current authority
Scope: `src/frontend/` on `frontend-design-integration`
Authority: `DESIGN.md` (design) → repository server/Worker/auth contracts (functional) → this document (frontend workflow ownership)
Accepted amendment: `.codex/specs/accepted/2026-08-23-r3-a1-a2-owner-routing-identity-three-context.md` (R3-A1-A2)
Companion: `docs/frontend/ROUTING.md` — what each individual control does
Last reviewed: 2026-08-23 (R3-A1-A2 three-context reconciliation)

This document records **who each frontend surface is for and what it is allowed
to do**. It does not define product policy; where it describes access rules it is
restating accepted authority.

---

## 0. What changed, and why this is not a regression

Until 2026-08-23 this document described **two** contexts and stated that the
public Request Center required *"Authentication: none, ever"*. That was faithful
to the then-current authority: `DESIGN.md` D06 Route Inventory, production
`public-requester-portal.js` at `0.8.2 / c316e047` containing no session check,
and the accepted `/api/public/request` contract.

The owner has since corrected the **product policy**: the logistics Request
Center is not public. R3's engineering was right about the authority it had; the
authority was wrong about the product. That reading is now historical.

> **SUPERSEDED BY OWNER R3-A1-A2 — 2026-08-23**
> "Public Request Center · Authentication: none, ever" is no longer current.
> The External Request Center requires an authenticated, eligible USC requester.

`DESIGN.md` **D24.0 — OWNER-LOCKED no-login Public Lending Center — is not
superseded.** It remains current and is the authority for `PublicFlows.tsx`.
The R3-A1 correction of record (D24.0 had been mis-cited as the *Request*
authority) stands, and is now moot for Request, which is no longer public at all.

---

## 1. Contexts

The frontend has **three** contexts. They are different products sharing one
canonical record set.

| | A. Public service | B. Authenticated requester | C. DOL operations |
|---|---|---|---|
| Surface | Public Lending Hub | External Request Center | Main Logistics Hub |
| Audience | Angelite students, USC staff/officers, DOL staff | verified USC staff and officers | authorized DOL/internal staff |
| Entry | `landing` → `borrow` | `staff-signin` with external intent | `staff-signin` with internal capability |
| Authentication | **none, ever** | **required** | **required** |
| Authorization | none | server-derived `request.create` | server-derived per-route capability |
| Module | `PublicFlows.tsx` | `request/ExternalRequestCenter.tsx` | FI-04, not yet exposed |

**These must not be collapsed.** In particular, B is not "A behind a login
screen": it is served by a different backend contract with a different identity
model (§4).

A staff sign-in *link* is not a staff sign-in *requirement*. Context A must never
place authentication, activation, or approval in front of browsing, borrowing, or
tracking.

---

## 2. Personas and what each may do

| Persona | Public Lending | External Request Center | Main Logistics Hub |
|---|---|---|---|
| Angelite student | ✅ browse, borrow, track | ❌ not on enrolment alone | ❌ |
| USC staff / officer | ✅ | ✅ authenticated, `request.create` | ❌ unless also internal |
| DOL / internal staff | ✅ | ✅ **requester mode**, keeps operational identity | ✅ capability-gated |
| Applicant with no identity | ✅ | ❌ until an identity exists and is activated | ❌ |

A person who is both a student and verified USC staff may reach context B
**through their staff identity**. Authorization is never derived from enrolment.

---

## 3. Canonical records

One canonical record per business object, with role-appropriate projections.
Never separate external and internal record types.

```
PUBLIC LENDING HUB          ->  CANONICAL LENDING RECORD  ->  INTERNAL LENDING HUB
student / staff borrower                                      DOL review, approval,
                                                              custody, return

EXTERNAL REQUEST CENTER     ->  CANONICAL REQUEST         ->  INTERNAL REQUEST HUB
authenticated USC requester                                   DOL operational processing
```

The public borrower never receives DOL operational controls. The external
requester never sees internal notes, supplier quotes, reservation or procurement
internals, or another requester's records.

### DOL staff acting as requesters

DOL staff may request for themselves, through either the External Request Center
or an internal self-service entry. Both must produce the **same** canonical
record type:

```
REQUESTED_BY   = their account
REQUEST_SOURCE = INTERNAL_SELF_SERVICE      (when created internally)
APPROVED_BY    = their account              (when policy permits self-approval)
```

Audit history must show both facts. Self-approval is never hidden, and
self-service is never converted into an administrator-only synthetic
transaction. Higher-risk or restricted categories must keep room for a future
second-approver rule rather than hard-coding unrestricted global self-approval.

**Not yet runnable.** Internal self-service is design and contract only: FI-04 is
not implemented, and the requester portal currently rejects DOL accounts
(§4, `BACKEND_CONTRACT_GAP_DOL_REQUESTER_MODE`). This section is a specification,
not a verified behaviour.

---

## 4. Business-action ownership

One canonical entity, one owning module per mutating action.

| Business action | Entity | Owning module | Backend operation | Allowed entry points |
|---|---|---|---|---|
| Submit borrowing request | lending submission | `PublicFlows` (Lending Center) | `POST /api/public/lending` | Lending Center form only |
| Track own record | request / loan | `PublicFlows` (Track lending) | `POST /api/public/{request,lending}/track` | Track view only |
| Submit logistics request | request | `ExternalRequestCenter` | `POST /api/portal/request` | External Request Center compose form only |
| Cancel own request | request | `ExternalRequestCenter` | `POST /api/portal/request/cancel` | own request detail only |
| Authenticate | session | `StaffSignInPage` | `POST /api/auth/login` | sign-in form only |
| Activate starter account | account | `StaffSignInPage` | `POST /api/auth/activate` | activation form only |
| Activate existing identity | account | `AccountRecoveryPanel` | `/api/auth/activate/*` — **gap, §5** | activation panel only |
| Reset own password | account | `AccountRecoveryPanel` | `/api/auth/reset/*` — **gap, §5** | reset panel only |
| Apply / check status / withdraw | account application | `AccountAccessPanel` | `/api/account-applications/*` | sign-in page panels only |
| Sign out | session | `useAppController.handleSignOut` | `POST /api/auth/logout` | authenticated surfaces only |

Duplicate frontend action owners: **0**. Ambiguous frontend state owners: **0**.

Staff-side ownership (reserve, canvass, release, handoff, custody, return) is not
yet implemented and must be assigned when FI-04 through FI-09 land. No frontend
module may introduce a second release or handoff mutation path.

Both public lending and authenticated request submissions send a client-generated
`clientRequestId` (`frontend-<uuid>`) and disable their submit control while in
flight, so a double submit cannot create two records.

### Why context B is not the public wizard behind a login

The old public request wizard collected requester name, type, organization,
contact number and email as free text and posted them to `/api/public/request`,
which accepts anonymous submissions. Putting a login screen in front of that form
would have produced a **frontend-only** security boundary while the endpoint
behind it stayed open.

`/api/portal/request` instead derives the requester from the session
(`requester_account_id`, `requester_department_id`) and scopes every read and
write to it. The browser supplies no identity at all. That is what makes the
boundary real, and it is asserted by `REQ-06`.

---

## 5. Access boundary rules

1. Context A never requires or probes a session — no `GET /api/auth/session` on
   any public path (`LEND-01`).
2. Every "Start a logistics request" control carries
   `ENTRY_INTENT = EXTERNAL_REQUEST_CENTER` and routes through the identity
   gateway. The access rule is stated **on the control**, before the user commits.
3. `Staff sign in` carries `GENERIC_STAFF_SIGN_IN` and **no** destination. A
   generic sign-in must not pre-commit to a capability-gated route: binding it to
   `request-center` denied otherwise-valid accounts that merely lacked
   `view.request`.
4. Explicit valid entry intent is preserved through authentication. Capability
   -based default routing applies **only** when no destination was asked for.
5. A DOL account in requester mode keeps its operational identity and is offered
   `Open Logistics Hub`, which resolves a capability-appropriate home rather than
   assuming Overview.
6. Denial is truthful, recoverable, and non-enumerating: it states the access
   state, offers Home and Public Lending, and never reveals whether an account
   exists or what another account could do.
7. **Home is Home, not logout.** Every Home affordance lands, scrolls to top,
   closes transient chrome, drops transient intent, and **preserves the session**.
8. Public surfaces render no internal notes, supplier quotes, evidence,
   reservation or procurement internals, or other requesters' records. Private
   tracking codes and status tokens are shown once, never placed in URLs, and
   never persisted to browser storage.

Regression coverage for rules 1–7 lives in `tests/e2e/r3-a1-a2-routing.spec.js`
across all five widths, and the rule 3–5 decision logic is asserted directly in
`tests/unit/frontend-entry-intent.test.js`.

### Backend contract status

`BACKEND_CONTRACT_GAP_EXTERNAL_REQUEST_AUTH` — **CLOSED.** The authenticated
requester contract exists and this branch binds to it.

Two gaps remain open and are specified in full in `ROUTING.md` §5:

- `BACKEND_CONTRACT_GAP_DOL_REQUESTER_MODE` — the requester portal requires
  `roleId === 'REQUESTER'`, so DOL requester mode is not supported server-side.
- `BACKEND_CONTRACT_GAP_SELF_SERVICE_IDENTITY` — no self-service
  activation-by-email-code or forgot-password route exists.

This branch does not claim end-to-end security completion while either is open.

---

## 6. Known open findings

| ID | Sev | Summary | Owner |
|---|---|---|---|
| FE-R3-001 | P0 | *Historical.* Every public "Start a logistics request" CTA called `requireAuth("request-center")`, sending public requesters to the staff sign-in wall. Fixed by R3 under the then-current public-request authority; **re-scoped by R3-A1-A2**, under which routing to sign-in is now correct — but with `EXTERNAL_REQUEST_CENTER` intent and a stated access rule, not a capability-gated internal target. | CLOSED |
| FE-R3-002 | P1 | *Fixed.* Generic "Staff sign in" pre-committed to `request-center`, so a valid staff account lacking `view.request` was told "Access denied". Preserved as rule 3 above and asserted by AUTH-01/02. | CLOSED |
| FE-R3-003 | P2 | Public sub-routes stack the site `PublicNavbar` and the `PublicFlows` masthead, presenting two Home affordances on one page. R3-A1-A2 made both behave identically, removing the correctness problem but not the duplication. | FI-04 shell |
| FE-R3-004 | P2 | `PublicMobileDrawer` sets `role="dialog" aria-modal="true"`, handles Escape and locks body scroll, but performs no focus management: focus is never moved in, there is no trap, and it is not restored on close. | FI-04 shell |
| FE-R3-005 | P2 | No URL routing: no deep links, no Back/Forward, no refresh restore. Introducing a router is out of scope without accepted authority. | FI-04 |
| FE-R3-006 | P2 | *Closed by R3-A1-A2.* The `session && isAuthRoute(route)` branch in `AppRouteRenderer` is now reachable: `resolvePostAuthDestination` routes an authorized internal session to its resolved route. | CLOSED |
| FE-R3-007 | P2 | The preview registry labels ten staff routes `SURFACE_PREVIEW`, but `AuthenticatedShell` and all staff route components are orphaned — nothing imports them, so the surfaces do not render. Registry status overstates reality. | FI-04 |
| FE-R3-008 | P3 | `CurrentSection` prints the same status sentence twice (figure placeholder and article body) in loading, empty, and error states. | FI-12 |
| FE-R3-009 | P3 | `npm run lint` fails at branch baseline: 26 `no-undef` errors in `prototypes/public-portals-r3/app.js` plus one unused-var warning in `src/server/public-request-service.js`. Pre-existing; lint is not in the branch's accepted gate. | FI-12 |
| FE-R3-010 | P2 | *Closed by R3-A1.* Stale Impeccable sidecar flagged the real institutional palette as drift. Rebuilt at schemaVersion 2; `design-system-color` findings 27 → 0. | CLOSED |
| FE-R3-011 | P3 | 7 advisory `design-system-radius` findings in `PublicFlows.tsx`, and the shipped system has never defined a type ramp: `theme.css` carries only `--font-size: 16px` while public components use ten ad-hoc literal steps. | FI-12 / FI-13 |
| FE-R3-012 | P2 | *Closed by R3-A1-A2.* `appRoutes.ts` labelled the internal route "Staff Request Center", colliding with the public Request Center. Renamed to Internal Request Hub in `appRoutes.ts` and the preview registry. | CLOSED |
| FE-R3-013 | P2 | **New.** `--destructive` (`#d4183d`) is the shipped error colour in `theme.css` and appears as a literal across six frontend surfaces, but `DESIGN.md` frontmatter does not declare it, so the detector reads it as drift. New code uses `var(--destructive)`; the six existing literals and the missing declaration remain. | FI-12 |
| FE-R3-014 | P2 | **New, fixed at source.** `nav .leave::after{content:" →"}` in `PublicFlows.tsx` put a decorative arrow into the computed accessible name, and selects nested in their `<label>` pulled every `<option>` into the label. Arrows moved to `aria-hidden` markup; External Request Center controls use explicit `htmlFor`/`id`. The same nested-label pattern still exists elsewhere in `PublicFlows.tsx` and should be swept. | FI-12 |

---

## 7. Relationship to Figma

`DESIGN.md` names live Figma Make (`rP9W9MQlZkyQrUx38TVsFS`) as the interactive
frontend prototype authority. Since R3-A1 the **current-authority lane** of the
Figma Design file (`hXJElH4p72KfgAaoUyfNOC`) is the design documentation and
visual-reference authority; historical lanes remain historical. Repository
contracts remain the sole functional authority.

**Historical, R3:** no Figma or Figma Make write was performed. `.codex/CURRENT.md`
then recorded `FIGMA_WRITE: FORBIDDEN`.

**R3-A1:** bounded write authority was granted for those two files and used. The
Figma Design current-authority lane was reconciled and the Make changeset was
saved as **Version 40**.

> **SUPERSEDED BY R3-A1-A2 — 2026-08-23**
> R3-A1 verified in the live prototype that "Start a logistics request" reaches
> a *public* "PUBLIC REQUEST · NO SIGN-IN / Request Center". That behaviour was
> correct for R3-A1 and is now wrong. R3-A1-A2 re-synchronizes both providers to
> the three-context model and mirrors the current documentation into the Figma
> Design file itself.

Provider state, traceability, and readback evidence for R3-A1-A2:
`.codex/R3_A1_A2_ROUTING_IDENTITY_RECEIPT.md`.
