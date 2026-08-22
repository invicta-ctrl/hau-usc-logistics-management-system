# Production Front-End Parity Baseline

Captured **before** any front-end source edit, from repository source at the
integration base — not from the design preview's mock surface registry.

- Integration base: `origin/main` @ `7245c717f2b8bff3f327b47ff844281d94eaa1db`
- Production release: `v0.7.2` @ `84eacfcdb47a3985fed48e3ba14bb413946d4410`
- Captured: 2026-08-09

This document is the **must-not-regress** contract for
`.codex/specs/active/v0.7.3-frontend-design-integration.md`.

---

## A. Authoritative route facts

**Workspace roots** — `src/visual/workspace-routes.js`

| Workspace id | Slug | Path |
|---|---|---|
| `administrator` | `admin` | `/admin` |
| `director` | `director` | `/director` |
| `food` | `food` | `/food` |
| `inventory-pantry` | `inventory` | `/inventory` |
| `materials` | `materials` | `/materials` |

Canonical form `/{slug}/{module}`; `/app/{slug}/{module}` accepted as legacy.
**Routing semantics must not change.**

**Modules** — `src/app/bootstrap-contract.js`: `overview`, `request`, `lending`,
`release`, `restocking`, `procurement`, `inventory`.

**Roles** — `src/domain/constants.js`: `SYSTEM_OWNER`, `REQUESTER`, `DOL_STAFF`,
`COMMITTEE_HEAD`, `DIRECTOR`, `ADMINISTRATOR`, `READ_ONLY_AUDITOR`.

**Committees** — `src/domain/permissions.js`: `COM_FOOD`,
`COM_INVENTORY_PANTRY`, `COM_MATERIALS`.

**Statuses** — 21 canonical values in `src/domain/constants.js`.
**Ledger types** — 10 values, same file.
**User-facing labels** — `src/domain/presentation-labels.js`. Every enum passes
through this layer. No raw enum may reach the interface.

**`reports`** — `src/features/reports/` exists with **no bootstrap module and no
view template**. It has no production surface and must not be given one.

---

## B. Surface inventory

Legend for `MUST NOT REGRESS`: the specific behaviour that a presentation
change could plausibly break.

### Public / pre-authentication

| Route / surface | Source | Audience | Primary purpose | Must not regress |
|---|---|---|---|---|
| Portal entry | `visual/portal-navigation.js` | Anyone | Choose the right portal | Every real destination stays reachable |
| Staff Sign In | `visual/auth-gateway.js` | Staff | Authenticate | Session boundary; failure copy reveals nothing about account existence |
| Create Staff Account | `visual/auth-gateway.js` | Staff | Register | Account stays inactive until reviewed |
| Account application | `visual/public-account-application.js`, `server/account-application/` | Applicants | Apply for access | Fail-closed on unmatched identity; no auto-approval |
| Application status | `server/account-application/` | Applicants | Track application | No private reviewer detail exposed |
| Public Request Center | `visual/public-requester-portal.js` | USC / Angelite | Submit a request | **Submission does not reserve or deduct stock**; no live stock counts shown publicly |
| Request tracking | `visual/public-requester-portal.js` | Requesters | Track by reference | Lookup by reference only, never by name |
| Public Lending Center | `visual/public-lending-portal.js` | Borrowers | Request a loan | Identity-evidence requirement preserved |
| Lending tracking | `visual/borrower-lending-portal.js` | Borrowers | Track a loan | Borrower identity never published |
| Privacy / acceptable use | `visual/public-policy.js` | Anyone | Acknowledge terms | Explicit acknowledgement still required and recorded |
| Brand / advertisement | `visual/brand-assets.js`, `visual/public-advertisement-carousel.js` | Anyone | Published media | Only published versions render |

### Authenticated shell

| Surface | Source | Must not regress |
|---|---|---|
| Shell runtime | `visual/runtime.js`, `visual/runtime-extensions.js` | Route synchronisation; module chrome follows route |
| Bootstrap | `visual/bootstrap-controller.js`, `visual/bootstrap-ui.js`, `app/bootstrap-contract.js` | Contract validation and bounded page sizes |
| Account controls | `visual/authenticated-account-controls.js` | Session actions; truthful account state |
| Workspace / scope context | `visual/workspace-routes.js`, `domain/permissions.js` | Scope filtering is server-bound, not UI-only |
| Dirty-form safety | `visual/form-dirty-state.js` | Unsaved-change protection on navigation and modals |

### Operational modules

| Module | Route | Must not regress |
|---|---|---|
| Overview | `/{ws}/overview` | Attention counts reflect authorized scope only |
| Request Center | `/{ws}/request` | **One explicit routing decision per line**; nothing routed by default; compare-and-swap review |
| Office Lending Hub | `/{ws}/lending` | Review → ready-to-claim → handoff → on-loan → overdue → return remain distinct |
| Release Desk | `/{ws}/release` | **Partial and cumulative release**; recipient-confirmed handoff; evidence linkage |
| Restocking / Receiving | `/{ws}/restocking` | Partial receipt; stock only moves on recorded receipt |
| Procurement / Canvassing | `/{ws}/procurement` | Exclusive preferred-quote decision; supplier records stay private |
| Inventory | `/{ws}/inventory` | Balances derived from append-only ledger; **no direct balance editing affordance**; unclassified items stay non-lendable |
| Inventory item / history | via Inventory | Append-only movement history; corrections are reversals |
| Events / sub-events | `EVENT_MANAGE` | Series → sub-event hierarchy; truthful unknowns, never fabricated zeros |
| Activity / history | `VIEW_AUDIT` | Immutable audit references |

### Administration

| Surface | Source | Must not regress |
|---|---|---|
| Accounts & Access | `ACCESS_ADMIN`, `server/access/` | Effective access preview; archive-without-delete; audited lifecycle |
| Staff Directory | `server/identity-roster/` | Read-only projection of the protected roster |
| Reference Administration | `visual/views/reference-admin.html`, `domain/reference-administration.js` | Governed catalog mutation with audit |
| Link Registry | `domain/reference-administration.js` | Publication state; external sync reported separately |
| Announcements / Brand & Media | `visual/brand-assets.js`, `BRAND_MANAGE` | Owner-only mutation; retained version history |
| My Profile | `server/profile/` | Self-service boundary; cannot self-elevate role or scope |
| System status | `SYSTEM_DIAGNOSTICS` | Owner-gated; unavailable services reported as unavailable, never as zero |

---

## C. States every surface must still express

Loading · empty · populated · validation error · access denied · temporarily
unavailable · stale / revision conflict · success · partial completion · long
text · large quantities.

No debug wording, raw exceptions, stack traces, or provider names in any of
them.

---

## D. Verification method for parity

Each journey in `V4_1_PRODUCTION_FUNCTIONAL_PARITY_REPORT.md` records before and
after with browser evidence, and asserts: fields preserved, actions preserved,
service contract unchanged, authorization unchanged, status semantics unchanged,
mobile verified.

Parity is not claimed from source reading alone.

---

## E. Known drift to re-verify at implementation start

`origin/main` moved from `6a30ab4` to `7245c71` during this capture (PR #18
merged the v0.7.2.1 closeout). The route, module, role, committee, status, and
ledger facts above were confirmed at `7245c71` and are unchanged from the
`v0.7.2` production runtime. Re-confirm the base SHA before the first edit.
