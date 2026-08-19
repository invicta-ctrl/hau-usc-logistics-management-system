# Production → Figma portal parity audit

```text
AUDIT DATE:        2026-08-19 (Asia/Manila)
PRODUCTION:        https://logistics.hausc.org
                   appVersion 0.8.2 · releaseVersion 0.8.2
                   candidateSha c316e047c845fa182e82156c95945c4a5e5de2ff
                   schema 30 · migration 0030_production_access_and_operations.sql
SOURCE OF TRUTH:   git show c316e047:src/visual/*.js  (the exact production commit,
                   verified as an ancestor of release/v0.8.3-identity-foundation)
FIGMA:             hXJElH4p72KfgAaoUyfNOC
PRODUCT WORKTREE:  read-only. Not modified.
```

Every contract statement below was read from the source **at the deployed
production commit**, not from branch HEAD and not from documentation. Live
production was probed read-only for version, health and host routing only; no
form was submitted and no credential was entered.

## 1. Verdict

| Surface | Access model | Figma status | Priority |
|---|---|---|---|
| Public Lending Center | **No login** | **Contradiction neutralised; portal now built** | **HIGH — addressed** |
| Public Request Center | **No login** | Partially represented | MEDIUM |
| Authenticated requester portal | Session required | **Not represented** — contract now recorded, section 12 | MEDIUM |
| Internal Staff Request Center | Session + capability | Queue represented; form absent, routes wrong — 8 drift entries, 3 HIGH | **HIGH** |

The headline finding is that Figma carried four **CURRENT-lane** frames stating
the opposite of production's access model for Public Lending, and carried **no
design at all** for the actual public borrowing portal.

The second finding, added in the section 10–12 pass, is that the Staff Request
Center was assessed as "represented" on the strength of a queue design. It is
not: production's Request Center is a **submission form** with a review queue
appended, and Figma has only the queue. Its priority is raised from LOW to
HIGH accordingly.

## 2. Host routing (verified)

From `src/worker/host-routing.js` at `c316e047`:

```text
logistics.hausc.org -> null      (no forced entry path)
request.hausc.org   -> /request  (307 from /)
lending.hausc.org   -> /lending  (307 from /)
unknown host        -> 404 "This host is not available."
```

Live probe: `lending.hausc.org` → 200, `request.hausc.org` → 200.

Portal navigation (`portal-navigation.js`) is exactly four destinations:
Request Center `/request`, Lending Center `/lending`, Staff sign in
`https://logistics.hausc.org/login`, and Back to portal selection `/portals`.

## 3. Public Lending Center — production contract

Source: `src/visual/public-lending-portal.js` (392 lines) at `c316e047`.

**Access.** `mountPublicLendingPortal({ root, client })` fetches
`/api/public/lending/catalog` and `/api/public/advertisements` on mount and
posts to `/api/public/lending`. **There is no session check, no sign-in gate,
and no authorization branch anywhere in the module.**

**Catalog-before-form is production behaviour, not an aspiration.** The page
copy is literally: *"Browse the borrower-safe catalog before providing personal
information. Every request starts For Review."*

| Element | Contract |
|---|---|
| Catalog filters | Search (with an `aria-autocomplete` listbox of up to 8 suggestions, min 2 chars), Category, Availability, Item type (`REUSABLE` / `CONSUMABLE`) |
| Requestable availability | `AVAILABLE`, `LIMITED`, `ELIGIBILITY_REQUIRED`. Others render disabled |
| Catalog card | image, availability status pill, Product ID, name, category · type, description, unit, maximum request, normal loan days, eligibility, restrictions, handling notes |
| Borrower type | `USC_STAFF` "USC Staff/Officer" · `ANGELITE` "Angelite Student". Required radio; details stay hidden until chosen |
| Always required | `borrowerName`, `studentId` (`[0-9]{1,8}`), `contactNumber`, `email`, `pickupDate` (min today), `purpose` (max 500) |
| USC_STAFF only | `uscDepartment` (**required**, options from `catalog.uscDepartments`), `positionRole` |
| ANGELITE only | `courseYear`, `academicDepartment` (**both required**) |
| `dueDate` | Conditionally required — only when a selected item has `dueDateRequired` |
| `responsibilityAcknowledged` | Conditionally required — only when a selected item has `acknowledgmentRequired` |
| Always-required acknowledgments | `dataUseAcknowledged`, `acceptableUseAcknowledged`, `borrowerResponsibilityAcknowledged`, `evidenceConsentAcknowledged` |
| Line items | per-item quantity, min 1, max `maximumQuantity`, whole numbers only, removable |
| Submit guard | at least one selected item, else message + scroll to catalog |
| Receipt | Submission ID + private tracking code shown **once**; form fully disabled after success |
| Initial status | **For Review**, stated explicitly on the receipt |
| Non-guarantee copy | *"Submission does not guarantee approval or allocation."* |
| Degraded path | If `trackingCode` is absent: *"Private tracking is temporarily unavailable. Do not resubmit."* |
| Tracking | `/api/public/lending/track` with Submission ID + tracking code (`type="password"`); *"does not display borrower identity or contact details"*; code field cleared after every attempt |
| Error state | Catalog failure renders *"Catalog service unavailable… This is a service error, not an empty catalog"* with retry |
| Empty state | Distinguishes "no approved lending items are published" from "no items match filters" |

The conditional logic also **disables** the hidden branch's controls and clears
their values on switch, so the inactive branch cannot submit stale data.

## 4. Public Lending — Figma drift

### PL-01 · ACCESS_MODEL_DRIFT · HIGH · NEUTRALISED

Four frames sat in the CURRENT lane asserting the opposite of production:

| Node | Name at audit |
|---|---|
| `424:264` | PROTOTYPE R2 · auth.lending · 1440 · light |
| `424:620` | PROTOTYPE R2 · auth.lending · 1440 · dark |
| `426:93` | PROTOTYPE R2 · auth.lending · 390 · light |
| `426:218` | PROTOTYPE R2 · auth.lending · 390 · dark |

Their copy: *"Public lending information"*, *"Anyone may review currently
published lending information. **Borrowing and custody actions require
authorized staff sign-in.**"*, *"PUBLIC INFORMATION ONLY · PROTECTED ACTIONS
GATED"*, and a primary button reading **"Sign in to borrow"**.

That is false. Production requires no login to borrow.

**Action taken.** All four renamed with a `SUPERSEDED ·` prefix and the reason
inline, so no future session can mistake them for current authority. They are
preserved, not deleted, per the historical-evidence rule.

### PL-02 · MISSING_PRODUCTION_BEHAVIOR · HIGH · BUILT

At audit there was **no public lending portal design anywhere in the file**. Page 50
"Lending Hub" contains only the internal staff surface — `lending.queue`
(populated / newloan / loading) and `lending.detail`, all rendered inside the
authenticated staff rail (Overview, Request Center, Office Lending Hub, Release
Desk, …).

Absent from Figma entirely: the borrower-safe catalog grid, the four catalog
filters and the suggestion listbox, borrower-type selection, both conditional
field groups, the selected-items list with quantity control, the five
acknowledgments, the submission receipt with one-time tracking code, and the
private tracking lookup.

### PL-03 · AUDIENCE_DRIFT · HIGH · FIXED

The **Angelite Student** borrower class did not appear anywhere in the Figma
file. Production gives it equal standing with USC Staff/Officer and requires
`courseYear` and `academicDepartment` for it. The wider Angelite student body is
half the audience of this portal and is currently invisible in the design.

### PL-04 · NAVIGATION_DRIFT · MEDIUM · OPEN

The superseded frames show a masthead of *Front door · Services · Governance ·
Logistics hub · Staff sign in*. Production's portal navigation is *Request
Center · Lending Center · Staff sign in · Back to portal selection*.

## 5. Public Request Center — production contract

Source: `src/visual/public-requester-portal.js` (613 lines) at `c316e047`.
Endpoints, all public: `/api/public/request`, `/api/public/request/options`,
`/api/public/request/related`, `/api/public/request/track`.

**Two purposes**, exactly as owner-described:

- `EVENT_ACTIVITY_SUPPORT` — "Event or activity support · For an approved event series and sub-event." (default)
- `OFFICE_INVENTORY_PANTRY` — "Office inventory or pantry · For approved office inventory or pantry needs."

| Group | Fields |
|---|---|
| Requester | `requesterName`, `requesterType`, `organization`, `contactNumber`, `email` |
| Event branch | `eventSeriesId`, `eventId`, `eventPurpose`, `location`, `startDate`, `endDate` |
| Inventory branch | `stockArea`, `neededDate`, `restockPurpose` |
| Relation | `originalRequestId`, `relatedRequestId`, `relatedLookupCode`, `relatedLookupId`, `referenceId` |
| Lines | `lineCategory`, `itemId`, `lineQuantity`, `lineUnit`, `lineDescription`, `lineSpecification` |
| Acknowledgments | `reviewAcknowledged`, `dataUseAcknowledged`, `acceptableUseAcknowledged`, `evidenceConsentAcknowledged` |
| Tracking | `requestId` + `trackingCode` |

The flow is **stepped with an explicit review stage** — the module renders a
summary with per-section `data-edit-step` "Edit" affordances before submit.

### PR-01 · STATE_DRIFT · MEDIUM · OPEN

Figma page 40 represents the request surfaces but has not been diffed
field-by-field against the contract above. The stepped review stage and the
`related request` lookup in particular need checking.

## 6. The three request contexts are genuinely distinct

Confirmed at source — do not collapse these in Figma:

| # | Surface | Auth | Endpoints |
|---|---|---|---|
| A | Public Request Center | **none** | `/api/public/request*` |
| A2 | Public Lending Center | **none** | `/api/public/lending*` |
| B | Authenticated requester portal (`requester-portal.js`) | session | `/api/portal/request`, `/api/portal/request/cancel` |
| C | Internal Staff Request Center | session + capability | workspace modules |

B exists and is real — an authenticated requester view of one's own requests
including a cancel action. It is **not represented in Figma at all**.

## 7. Production defect candidates

None were found in the public portals. One was found later, in the internal
Lending Hub, and is recorded at section 16 as **PDC-01**. It is not fixed —
production source is outside this stream's authority.

## 8. What was changed in this pass

| Change | Scope |
|---|---|
| Renamed 4 `auth.lending` frames to `SUPERSEDED ·` with the contradiction stated inline | Figma page 15 |
| Built the Public Lending portal, USC Staff branch — `581:15` | Figma page 90 |
| Built the Angelite Student conditional branch — `587:15` | Figma page 90 |
| Built the submission receipt + degraded variant — `588:15` | Figma page 90 |
| Built the 1440 dark portal via explicit Dark variable modes — `589:15` | Figma page 90 |
| Built the four declared catalog states — `591:15` | Figma page 90 |
| Built the 390 mobile portal — `592:15` | Figma page 90 |
| Created `color/text/on-accent`, dark ink in both modes | Semantic Color |

### What the built frames cover

Against section 3: public masthead carrying production's four portal
destinations; catalog-first ordering with the production intro copy verbatim;
all four filters plus the open suggestion listbox; three catalog cards
exercising `AVAILABLE`, `LIMITED` and `ELIGIBILITY_REQUIRED`, each with Product
ID, unit, maximum request, normal loan days and — where the item has them —
eligibility, restrictions and handling notes; selected-items list with quantity
control and Remove; borrower-type selection as two equal-weight cards; both
conditional field groups, badged so the branch rule is legible; all five
acknowledgments with the two conditional ones marked `Conditional`; submit with
the non-reservation disclaimer; borrowing process; private tracking lookup with
a masked code field; announcements slot.

The receipt frame carries the Submission ID and one-time tracking code, the
copy-now warning, the **For Review** initial status, the non-guarantee
disclaimer, and the degraded "tracking code not issued — do not resubmit"
variant.

A **no-login assurance band** sits above the catalog. It is not decoration — it
is the direct countermeasure to PL-01, stating in the design itself that no
account, sign-in, activation or approval is required, and naming both
audiences.

All new work is bound to the design system: semantic colour variables and the
Bricolage Grotesque / IBM Plex text styles. It therefore does **not** inherit
the D-04 Inter drift affecting the older hand-built frames.

### Dark mode proved the token binding

The dark frame was produced by setting the explicit **Dark** mode on every
multi-mode collection rather than by recolouring anything. A full audit of the
clone found only **2 unbound SOLID fills** in the entire portal, both stray
whites on suggestion-list options, now cleared. The design is therefore
genuinely token-driven, not hand-painted.

Setting the mode on *Semantic Color alone was not enough* — several semantic
tokens alias the **Primitives** collection, so text flipped while surfaces did
not. All three multi-mode collections (Semantic Color, Primitives, Glass
Material) must be switched together. That is now recorded so the next session
does not rediscover it.

### A token gap the dark pass exposed

`color/action/primary` resolves to a **light gold in both modes**, so any label
bound to `color/text/primary` inverts to light ink in dark mode and the button
becomes unreadable. There was no token for text sitting on the accent surface.

Added `color/text/on-accent` — deliberately dark ink in **both** modes.
Measured 9.12:1 on light-mode gold `#e8b93c` and 11.2:1 on dark-mode gold
`#eed08a`. All twelve primary button labels are rebound to it.

This is the second instance of the same class of gap found in this programme,
after `color/accent/text`. Both were "which ink goes on this branded surface"
questions the palette never answered.

### Mobile is a transformation, not a stack

At 390 the layout changes model rather than shrinking:

- the four filter selects collapse into a horizontal **filter chip row**;
- catalog cards become horizontal — thumbnail beside identity — instead of
  vertical cards in a grid;
- the form goes single-column;
- a **sticky selection bar** carries the running selection count, the
  "nothing is reserved yet" reassurance, and the primary action within thumb
  reach, with targets at or above 44px.

### Not yet built

390 dark; the Angelite branch at 390; and the state frames in dark. Page 50's
internal Office Lending Hub was not touched.

## 9. Next actions, in order

1. ~~Build the Public Lending portal in Figma~~ — **done**, see section 8. Remaining: 390 mobile, dark mode, and the catalog
   layout, four filters + suggestion listbox, borrower-type selection, both
   conditional field groups, selected-items list with quantity, five
   acknowledgments with the two conditional ones marked, receipt with one-time
   tracking code, private tracking lookup, and the error/empty/loading/success
   states the module actually declares. Desktop + 390 mobile, light + dark.
2. Field-by-field diff of Public Request (page 40) against section 5.
3. Add the authenticated requester portal (context B) — currently absent.
   Contract is now recorded in full at section 12, so this is buildable.
4. ~~Staff Request Center lifecycle check against the internal contracts~~ —
   **done**, sections 10 and 11. Remaining work is the correction, in order:
   SR-02 route vocabulary (a copy fix, cheapest and highest value), SR-03
   per-line decision, SR-04 queue status filter, SR-01 the missing submission
   form, then SR-05/07/08.
5. Re-run Hallmark and Impeccable **after** parity is restored, never before.

## 10. Internal Staff Request Center (context C) — production contract

Read at `c316e047` from `src/visual/views/request.html`, plus
`renderRequestReviewQueue`, `openRequestReviewModal`, `permittedRoutes` and
`canReviewRequests` in `src/visual/runtime.js`.

**The Request Center is one view, not two.** It is a submission form with a
review queue appended *below it*, and the queue only exists for a session that
holds the `request.review` capability. There is no separate reviewer screen.

### 10.1 Submission form — `#requestForm`

| Block | Fields |
|---|---|
| Request type | `requestType` radio — `EVENT_LOGISTICS` (default) / `CATALOG_RESTOCK` |
| 01 · Requester | `requesterName`*, `requesterEmail`*, `department`*, `priority` (`ROUTINE` / `TIME_SENSITIVE` / `URGENT`) |
| 02 · Event context | `eventSeriesId`, `eventId`, `requestStage` (`INITIAL` / `ADDITIONAL`), `parentRequestId` (shown only when stage is ADDITIONAL), `eventName`, `startDate`–`endDate` range group, `eventTime`, `participants`, `venue` |
| 02 · Catalog context | `catalogType` (`OFFICE_INVENTORY` / `PANTRY`), `catalogNeededAt` |
| 03 · Purpose | `purpose` textarea, required |
| 04 · Line composer | item combobox with autocomplete panel, `requestQty`, `requestUnit`, `requestFulfillment` (**disabled**, reads "System decides from inventory"), `requestNeededAt`, `requestReturnDue` (conditional), `requestLeadTime`, `requestSupplier`, `newItemCategory` (conditional), `newItemSpec` (conditional) |
| Decision strip | `#requestDecision`, `aria-live="polite"` — explains what can be issued from stock and what still needs procurement |
| Draft list | `#requestLines`, empty state "No requested items yet." |
| Review aside | sticky, `draftLineCount` pill, summary, consent checkbox, **Submit for DOL Review**, hint: submission creates a FOR REVIEW record and moves no stock |

The two `02 ·` blocks are mutually exclusive and swap on request type.
Fulfillment is deliberately not the requester's choice — the control exists so
the requester can see that the system decides, and it is disabled.

### 10.2 Composite request panel — feature-flagged

`#compositeRequestPanel` carries `data-composite-feature` and is `hidden` until
`applyCompositeRequestFeatureState()` enables it. It exposes **FOOD**,
**MATERIALS** and **VENUE_EQUIPMENT** together; each selected non-empty section
becomes one independently trackable child of a single parent request, and an
untouched section creates no child.

### 10.3 Review queue

Gate: `canReviewRequests()` — capability `request.review`. Rows come from
`reviewQueueRows()`, which admits **only** `FOR_REVIEW` and
`NEEDS_INFORMATION`, newest first.

Columns: **Request** (ID + purpose) · **Requester** (name + department) ·
**Lines** (count awaiting decision) · **Status** · **Review lines** action,
disabled when the request has no reviewable line.

A desktop table and a `.mobile-cards` variant are both authored. Pagination is
server-clamped and read from `ui.requestPagination`, never from the visible
rows — the source comment is explicit that otherwise review work past page one
is silently unreachable. Empty: "No requests are awaiting review in your scope."

### 10.4 Review modal — the decision contract

One `select` **per line**, each required, each starting on a disabled
placeholder. Route options come from `permittedRoutes(request, line)`:

| Route | Label | Offered when |
|---|---|---|
| `ISSUE_FROM_STOCK` | Issue from stock | the line has an `itemId` |
| `PROCUREMENT` | Procurement / canvass | request type is **not** `CATALOG_RESTOCK` |
| `RESTOCK` | Catalog restock | line has an `itemId` **and** type is `CATALOG_RESTOCK` or catalogType is `OFFICE_INVENTORY` / `PANTRY` |
| `REJECT` | Reject | always |
| `MISSING_INFORMATION` | Missing information | always |

Plus an optional `reviewNote` (max 500). Submission is blocked client-side if
any line is undecided — **RV-01.6 deliberately removed the implicit default**
so one click cannot route every line. The server revalidates; the client filter
is presentational only. Failures surface the message and correlation ID and
never claim a decision was recorded.

## 11. Staff Request Center — Figma drift

Figma page 40 (`55:9`) CURRENT lane is `300:2`, "V3 USC-wide follow-up —
Request Center, queue-first workbench with record-bound actions", containing
`request.queue` at 1440 (populated / loading / stale / empty / denied), 390
mobile, and `public.request-intake` (+ error) and `public.request-tracking`.

The frame is self-labelled **"PROPOSED DESIGN — NOT IMPLEMENTED"**, which is
honest. The entries below are recorded so the gap is explicit, not to imply the
design claimed parity.

| ID | Severity | Drift |
|---|---|---|
| SR-01 | HIGH | **Structural inversion.** Figma makes the queue the whole Request Center. Production's Request Center is submission-form-first, with the queue appended below and only for `request.review` holders. The submission form — all four numbered blocks and the line composer — appears nowhere on page 40. |
| SR-02 | HIGH | **Route vocabulary does not match.** Figma offers Accept and reserve · Fulfil from stock · Ask for information · Route to canvassing · Reject, then "Send to Release Desk" after reservation. Production's five routes are `ISSUE_FROM_STOCK` · `PROCUREMENT` · `RESTOCK` · `REJECT` · `MISSING_INFORMATION`. "Accept and reserve" and "Send to Release Desk" have no route counterpart, and **Catalog restock is missing entirely**. |
| SR-03 | HIGH | **Per-line decision not represented.** Figma shows one set of request-level action buttons in the inspector. Production requires an explicit route for *every* reviewable line and blocks submit otherwise. A request-level button is precisely the one-click-routes-everything affordance RV-01.6 removed. |
| SR-04 | MEDIUM | **Queue admits statuses production never puts there.** Figma rows include Approved and Closed. `reviewQueueRows()` filters to `FOR_REVIEW` and `NEEDS_INFORMATION` only. |
| SR-05 | MEDIUM | **Column set differs.** Figma: Request · Committee · Needed by · State · Urgency. Production: Request · Requester · Lines · Status · Actions. Requester identity and the awaiting-decision line count are dropped; "Needed by" is a per-line date in production, not a request attribute. |
| SR-06 | LOW | **Export** and **Review next** have no production counterpart. |
| SR-07 | MEDIUM | **Composite requests absent.** The FOOD / MATERIALS / VENUE_EQUIPMENT panel and its one-parent-many-children model are represented nowhere in Figma. |
| SR-08 | MEDIUM | **No pager.** Figma states "14 of 63 requests" with no pagination control. Production's queue is server-clamped and the source comment says review work past page one is otherwise unreachable. |

### Where Figma is ahead of production

`request.queue · denied` is a designed refusal state. Production has none — it
simply removes the queue host from the DOM when the session lacks
`request.review`, so a staff member who expected review access sees nothing and
no explanation. **This is a design improvement to carry forward, not drift to
correct in Figma.** It is not raised as a production defect: silently hiding an
unauthorized surface is a defensible choice, not a fault.

## 12. Authenticated requester portal (context B) — production contract

Read at `c316e047` from `src/visual/requester-portal.js`. Still represented
**nowhere** in either Figma file.

Gate: `session.user.authorization.roleId === 'REQUESTER'` **and** a
`requesterDepartment.id`. Anything else renders a single refusal card,
"Department requester access is required", with only a Sign out action.

Loads `GET /api/portal/request`, returning `profile`, `requests`, `eventSeries`,
`choices` and `units`.

Two tabs: **Create Request** and **Track Existing Request**.

Create is a four-step form. Step 1 identity — department is derived from the
session and rendered `readonly`. Step 2 New vs Additional, with a parent
selector shown only for Additional and offering only the requester's own
non-cancelled, non-rejected NEW requests. Step 3 Event then Sub-event, the
Sub-event select disabled until an Event is chosen, each with an optional
autocomplete input backed by a datalist. Step 4 purpose (max 500) plus a line
composer — category, approved item, custom name when "Other", quantity 1 to
100000, unit, specification (max 1000). A privacy and acceptable-use
acknowledgment is required, and submit is disabled until at least one line
exists.

Track is scoped to the requester's own department and **needs no tracking
code** — the contrast with the public center is stated in the copy itself.

Each request card shows status chip, ID, Event / Sub-event, request type,
parent ID when present, line count and last update; expanded it adds purpose,
per-line status and a **Visible history** list. Two actions: "Add to this
request", and **Cancel request** — offered only for `FOR_REVIEW` and
`ACCEPTED`, posting to `/api/portal/request/cancel` with a CSRF token and a
`clientRequestId`.

On success a receipt panel carries Request ID, type, Event, Sub-event,
department, submitted timestamp, status **For Review**, the "submission only,
not approval or reservation" disclaimer, and three actions including **Save PDF
Receipt** — the PDF is generated client-side by `buildReceiptPdf`.

### Design consequence

Context B is not a variant of the public Request Center. Identity is derived
rather than entered, tracking needs no code, cancel exists, and a PDF receipt is
produced locally. Designing it as a skin of context A would be wrong on all four
counts.

## 13. Staff Request Center — what was corrected in Figma

All work is on page 40 (`55:9`). The `SUPERSEDED ·` section (`45:7`) was not
touched; one text node inside it (`89:475`) was edited by a careless find-all
and has been restored to its original characters.

### 13.1 SR-09 — a clipping defect found while making the fix visible

`300:502`, the record inspector, is a **fixed 380 × 380 frame with
`clipsContent: true` and `overflowDirection: NONE`**. Its content measures
2,086px. It is not a scroll region — it is a hard clip, so roughly 1,700px of
authored design never renders: the requested-lines table, the "one line cannot
be fully reserved" risk note, the entire decision panel and the ledger footer.
The frame reads as "queue dominance" partly because the record inspector is
effectively invisible.

Releasing the height cascades: the page body `300:11` is itself a fixed 1,408px
clipping container, and forcing `300:67` to hug collapsed the queue container
`300:280` from 731px to 1px. **That was reverted.** The artboard now stands at
exactly its authored geometry — `300:502` 380 × 380, `300:11` 1,408, `300:3`
1,467 — and the clip is recorded here rather than papered over.

To make the corrected panel reviewable, `603:137` was added to the page canvas
at x 11600: a titled frame holding `603:2`, a clone of the inspector released
from the fixed height, with a caption stating why it exists.

**SR-09 is design-side, not a production defect.** Nothing in the running
product clips here; this is a Figma frame constructed with a fixed height its
content outgrew.

### 13.2 SR-02 and SR-03 — the decision panel now follows the contract

`300:624` was rebuilt. Removed: `300:628` (the five request-level buttons),
`300:644` and `300:647` (the "After reservation → Send to Release Desk" group).
Added `601:2` line decisions, `601:34` review note, `601:39` actions.

The panel now carries one **route select per requested line**, each on the
production placeholder "Select a route" with no pre-selected default; an open
listbox on the second line showing the routes `permittedRoutes()` actually
offers here; the optional review note with production's own placeholder,
"Recorded in the request history"; and **Submit review** / Cancel.

Only four routes are offered, and that is deliberate. The fixture is an
`EVENT_LOGISTICS` request whose lines carry catalog items, so
`permittedRoutes()` yields `ISSUE_FROM_STOCK`, `PROCUREMENT`, `REJECT` and
`MISSING_INFORMATION`. **`RESTOCK` is withheld** — it needs the request to be a
Catalog Restock or to carry an `OFFICE_INVENTORY` / `PANTRY` catalog type. A
caption in the frame states this, so the absence reads as a rule rather than an
oversight.

Originals, logged in full before the edit:

| Node | Was | Now |
|---|---|---|
| `300:626` | Permitted now | Decide every line |
| `300:652` | "Accepting reserves stock; it does not release it. The request leaves this queue only when it reaches its ready state and moves to the Release Desk — that step is a visible lifecycle event, not a silent disappearance." | Same text, prefixed with the no-default rule |
| `300:629`–`300:642` | Accept and reserve · Fulfil from stock · Ask for information · Route to canvassing · Reject | removed; replaced by per-line selects |
| `300:648` / `300:649` | Send to Release Desk | removed — not a review route |

### 13.3 The prototype twin

`329:1009` carried the same wrong vocabulary and is the frame a reviewer clicks
through, so it was corrected too. Originals logged:

| Node | Was | Now |
|---|---|---|
| `329:1463` | Permitted now | Permitted routes for these lines |
| `329:1466` | Accept and reserve | Issue from stock |
| `329:1468` | Fulfil from stock | Procurement / canvass |
| `329:1470` | Ask for information | Missing information |
| `329:1472` | Route to canvassing | button `329:1471` removed as surplus |
| `329:1474` | Reject | Reject |
| `329:1476` | After reservation | Not decided here |
| `329:1479` | Send to Release Desk | button `329:1478` removed; replaced by a caption |
| `329:1481` | "Accepting reserves stock; it does not release it. …" | PROTOTYPE NOTE: still request-level buttons, SR-03 open here |

The prototype keeps request-level buttons. Rebuilding its interaction model was
out of scope for this pass, so it says so on the frame rather than implying
parity.

### 13.4 SR-04 — the queue no longer shows statuses it cannot hold

Two rows carried `Approved` and `Closed`. `reviewQueueRows()` admits only
`FOR_REVIEW` and `NEEDS_INFORMATION`, so those rows taught a wrong model.

Chip tone was **copied from an existing legal chip** rather than hand-picked, so
fill, stroke, dot and label all stay variable-bound and no new literal entered
the file. Dot geometry was matched in a follow-up pass after the first render
showed a round dot on a square-dot chip.

| Node | Was | Now |
|---|---|---|
| `300:442` / `300:2313` | Approved | Submitted |
| `300:468` / `300:2357` | Closed | Needs correction |
| `300:445` | → Release Desk | → Missing information |
| `300:320`, `300:1303`, `300:1729` | "Requests in your authorized scope, newest first. Selecting a row opens the request record and its permitted actions." | same, plus: this queue holds only requests awaiting a decision |
| `300:500`, `329:1374` | "Departure to the Release Desk is drawn as a lifecycle step so the record visibly moves on." | same, prefixed with the per-line decision rule |

### 13.5 Still open after this pass

SR-01 (the missing submission form), SR-05 (column set), SR-07 (composite
requests) and SR-08 (no pager) are unchanged — each needs new design, not a
correction. SR-03 is fixed on the CURRENT artboard and in `603:137`, and open on
the prototype. SR-09 is recorded, not fixed.

Two decorative status dots inside the inspector, `300:585` and `300:609`, carry
**unbound** `#1f6b41` fills. Same class as the two stray whites found during the
Public Lending dark pass. Not corrected here; noted so the next
variable-coverage sweep catches them.

## 14. Internal Office Lending Hub (context D) — production contract

Read at `c316e047` from `src/visual/views/lending.html` and `renderLending`,
`loanTabCount`, `lendingFilteredRows`, `renderLendingTickets`, `submitLending`,
`openLendingDetails`, `openReturnModal` in `src/visual/runtime.js`.

Session + capability. This is the operational lifecycle surface, and it is
**not** the Public Lending Center: the public portal collects borrower intent,
this hub governs custody.

### 14.1 New Lending / Consumable Ticket

*"Create a review ticket first. Approval and physical handoff are separate
steps."*

| Field | Contract |
|---|---|
| `studentIdNumber` | required, `[0-9]{1,8}`, digits only, max 8 |
| `borrowerName` | required |
| `borrowerType` | `USC_STAFF` "USC Officer/Staff" · `ANGELITE` "Angelite/Student" |
| `department` | required |
| `contact` | optional, "Optional but recommended" |
| `itemId` | required, from non-archived inventory |
| `quantity` | number, min 1, step 1, default 1, required |
| `dueAt` | `datetime-local`, in a conditional wrapper |
| `purpose` | required textarea |

Submit reads **Create For Review Ticket**. Identity is not trusted at entry:
*"Borrower identity is checked against the approved source during review."*

### 14.2 Circulation Summary

Four metrics — For Review, Ready to Claim, On Loan, Overdue — plus a total
ticket count. The panel states its own derivation rule: **"Overdue is derived
from the current time on every render."** Overdue is therefore never a stored
status, and a design that draws it as a persisted state is wrong.

### 14.3 Borrowing Tickets

Five tabs, each with a live count:

```text
FOR_REVIEW      For Review
READY_TO_CLAIM  Ready to Claim
ON_LOAN         On Loan
OVERDUE         Overdue
HISTORY         Returned / History   (RETURNED, COMPLETED, REJECTED, CANCELLED)
```

Filters: free-text search across ticket ID, Student ID, borrower name,
department and item name; an item filter; a borrower-type filter; Clear.

Sort is state-dependent and deliberate: on the **Overdue** and **On Loan** tabs
rows sort by `dueAt` ascending — soonest first — and everywhere else by
`updatedAt` descending.

Actions are bound to the **derived** status, not chosen freely:

| Derived status | Actions |
|---|---|
| `FOR_REVIEW` | **Review** (primary) · **Reject** (danger) |
| `READY_TO_CLAIM` | **Confirm Issue** when `ticketType === 'CONSUMABLE'`, otherwise **Confirm Handoff** |
| `ON_LOAN` / `OVERDUE` | **Inspect Return** |
| any | **Details** |

The consumable/reusable split changes the verb, not just the copy: a consumable
is *issued*, a reusable is *handed off* and later returned.

Details opens a drawer with item, quantity, ticket type, status chip, Student
ID, department, contact, purpose and a status timeline. Return opens a modal
with a condition note defaulted to "Returned in good condition", a confirmation
prompt, and posts **`LOAN_RETURN`** to the ledger.

## 15. Release Desk relationship — production contract

Read at `c316e047` from `src/visual/views/release.html` plus `bindReleaseEvents`
and `activeReleaseRequests` / `releaseHistoryRequests` in `runtime.js`.

The Release Desk is *"the controlled physical handoff point for accepted event
requests and approved circulation tickets."* Two facts govern every design that
touches it.

**It is one shared queue.** The view states it: *"The server-authorized
operational scope filters this one shared queue across every workspace route."*
There is not a per-workspace Release Desk; there is one queue, scoped by the
server.

**It has exactly two feeds**, and the source filter names them:

| Source | Feed |
|---|---|
| `EVENT` — "Event requests" | request lines that reached `READY_TO_RELEASE` or `PARTIALLY_RELEASED` |
| `LENDING` — "Approved lending/consumables" | approved circulation tickets |

Release History is separate and permanent: *"Completed tickets leave the active
queue but remain fully traceable."* History rows additionally support a
**release correction** action.

### 15.1 This settles SR-02

Nothing in review sends a request to the Release Desk. A request **arrives**
there when its lines reach a ready state, and a lending ticket arrives when it
is approved. The Figma control reading "Send to Release Desk" in the review
inspector was therefore not merely absent from `permittedRoutes()` — it
inverted the direction of the whole lifecycle. Its removal in section 13 is
confirmed by this contract, not just by the route list.

## 16. Production defect candidates

### PDC-01 · LOW · borrower type is labelled two different ways

`views/lending.html` offers `ANGELITE` as **"Angelite/Student"** in the
borrower-type select. `renderLendingTickets` renders the same value on the
ticket card as **"Angelite/Non-USC"**.

Those are not synonyms. "Angelite/Student" names the HAU student body;
"Angelite/Non-USC" describes anyone outside the Council, which reads as an
exclusion rather than an audience. A staff member creating a ticket and a staff
member reading it see different words for one stored value.

**Not fixed.** This is production source, outside this stream's authority, and
it is recorded here as a candidate only. The design stream standardises on
**"Angelite Student"**, matching the public portal and `DESIGN.md` D24.0, and
records the divergence rather than silently propagating either label.

No other defect candidate was found. Every other behaviour inspected across the
five surfaces was internally consistent.

## 17. Staff Request Center — the submission region, SR-01 / SR-05 / SR-08

### 17.1 SR-01 — the missing half is built

`615:2` was added as the **first** child of the Request Center content column
on the CURRENT artboard, above the review queue, because that is the production
order: one view, submission first, queue appended.

It follows `views/request.html` block for block — request-type choice with
Event Logistics preselected, `01 · Requester`, `02 · Event context`,
`03 · Purpose`, `04 · Add requested items`, the draft list, and the sticky
review aside carrying the consent checkbox, **Submit for DOL Review**, and the
"submission creates a FOR REVIEW record, physical stock is not reduced" hint.

Four decisions in the build are contract-driven rather than aesthetic:

1. **Fulfillment is drawn disabled**, on the inset surface, badged *System
   decides*. Production renders the control and disables it so a requester can
   see that the system decides from inventory. Removing it would have looked
   tidier and taught the wrong thing.
2. **The two `02 ·` blocks are mutually exclusive.** Rather than drawing a
   hidden variant, the Catalog-context block sits on an inset panel that states
   it replaces the Event block on request type. A reviewer sees both without
   believing both render at once.
3. **Conditional fields are badged, not hidden** — Original Request ID, Return
   due, New-item category and New-item specification. Production hides them
   until their condition fires; the design shows the rule.
4. **The decision strip is labelled as a live region.** It is
   `aria-live="polite"` in production, so it is drawn as an announced surface,
   not as static helper text.

Every fill and stroke is bound to a semantic variable. No literal colour was
introduced.

### 17.2 SR-05 — requester identity restored

Production's queue carries a **Requester** column with name and department.
The design had department in each row's supporting line but had dropped the
name, so a reviewer could not tell who asked without opening the record.

The column set was not rewritten. Committee, Needed by and Urgency are
legitimate design additions and the supporting line already carried the line
count. The correction was the narrower one: the requester's name is now part of
the supporting line on all five rows.

Production's explicit **Review lines** button is still absent — the design
opens the record by row selection instead. That is a defensible interaction
choice, so it is recorded rather than "corrected". What is **not** optional is
that a request with no reviewable line must not offer a decision affordance;
production disables the button for exactly that case.

### 17.3 SR-08 — the pager

`616:2` adds Page 1 of 7 with Previous disabled and Next live, plus the reason
in the frame itself: the page count comes from the server's pagination, never
from the rows on screen. The production source carries that as a comment
because getting it wrong makes review work past the first page silently
unreachable.

### 17.4 A failure mode worth recording

Retexting a Figma text node whose `textAutoResize` is `WIDTH_AND_HEIGHT` grows
it horizontally, and that growth propagates into every hugging ancestor. The
longer research-band copy written in section 13 silently widened the queue
container from 1118 to 1596 — a layout regression produced by a copy edit.

Two rules follow, now applied:

- **After any retext, pin the width** — switch to `HEIGHT` and resize — unless
  the node is genuinely meant to grow.
- **A document-wide sweep** for text nodes wider than 82% of their artboard
  with `WIDTH_AND_HEIGHT` catches the class. Four more were found on page 15
  and pinned.

This is the same shape of error as the earlier fixed-height clipping: a local
edit with a non-local layout consequence. Both are now checked for rather than
discovered.

## 18. D-04 typeface drift — measured, and narrower than recorded

D-04 was carried as "Figma renders Inter". A document-wide census of every text
node in every **non-superseded** frame shows that claim is wrong as stated.

```text
CURRENT-lane text nodes:   23,825
Off-system families:        2,862   (12.0%)
Pages with any drift:          19 of 28
```

The mandated families are Bricolage Grotesque, IBM Plex Sans, IBM Plex Mono and
Newsreader. Page 40's CURRENT lane, for example, uses **only** those four
across 1,225 nodes — zero Inter.

### 18.1 Three of the four drift sources are not defects

| Page | Off-system | Verdict |
|---|---|---|
| 00 — Capture Index | 123 Inter of 123 | **Not a defect.** Index and annotation page |
| 01 — Production Baseline | 191 Segoe UI, 15 Georgia, 9 Inter | **Not a defect.** It documents what production actually renders; using the design system here would misrepresent the baseline |
| 02 — Playground Baseline | 306 `* Local` variants | **Not a defect.** Locally-installed twins of the mandated families |
| 03 — Production vs Playground | mixture of both baselines | **Not a defect.** Same reason |

Recording those four pages as typeface drift inflated the problem by roughly a
third and pointed remediation at pages that must not be changed.

### 18.2 The real drift, ranked

| Page | Inter nodes | Share of page |
|---|---|---|
| 20 — Overview / Command Center | 755 | 33% |
| 15 — HAU USC Landing | 625 | 18% |
| 80 — Administration + Governance | 64 | 4% |
| 90 — Public + Authentication | 64 | 4% |
| 11 — Foundations | 59 | 18% |
| 70 — Restocking + Procurement + Events | 16 | 2% |
| 10 — Authority + Design Handoff | 14 | 4% |

Plus one family that is not Inter at all: **page 30 Inventory carries 16
Bahnschrift nodes**. Bahnschrift is the *fallback* in the display font stack, so
those nodes were authored while Bricolage Grotesque was unavailable and the
substitution was silently accepted.

`MIXED` counts — 50 on Release Desk, 52 on Public, 36 on Restocking, 20 on
Profile — are nodes with more than one family inside a single text node. Those
need per-range inspection, not a family swap.

### 18.3 Why this is not fixed in this pass

Converting ~1,600 nodes is a bulk mutation, and the two regressions recorded in
this audit — the recolour incident at §3.1 and the width growth at §17.4 — were
both bulk operations whose blast radius exceeded the intent. Inter and IBM Plex
Sans have different metrics, so a family swap resizes every `WIDTH_AND_HEIGHT`
node and propagates into hugging ancestors, which is precisely the §17.4
failure at 1,600× scale.

The conversion is therefore scoped as its own pass, per page, with the mapping
rule stated in advance — display sizes to Bricolage Grotesque, body to IBM Plex
Sans, matched weight — a dry run that reports every node it would touch, width
pinning after each retext, and a render check before moving to the next page.

D-04 stays open, but it is now a measured, ordered list of seven pages plus one
Bahnschrift pocket rather than a file-wide assertion.
