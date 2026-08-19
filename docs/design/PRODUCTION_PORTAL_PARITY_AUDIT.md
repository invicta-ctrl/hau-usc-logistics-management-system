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

## 19. Token system — D-02 closed, coverage measured and raised

### 19.1 D-02 — the blur ladder had two disagreeing sources

Measured, not assumed:

| Step | `material/blur/*` variable | Material effect style | Bound? |
|---|---|---|---|
| G1 | 12 | 16 | no |
| G2 | 18 | 22 | no |
| G3 | 24 | 30 | no |
| G4 | 28 | 36 | no |

Two numbers per step, neither referencing the other. **The effect styles won**,
because they are what a viewer actually sees and what `glass.css` already
mirrors. The variables were corrected up to 16/22/30/36 in both modes, and each
Material style's `BACKGROUND_BLUR` radius is now **bound** to its variable.

There is now one number per step. Changing `material/blur/g2` changes what
renders; previously it changed nothing at all, which is the worst state for a
token to be in — present, authoritative-looking, and inert.

`glass.css` was updated to match, replacing the note that recorded the
divergence.

### 19.2 Variable coverage was far worse than recorded

The Public Lending dark pass found "only 2 unbound fills" and that was read as
evidence the file is token-driven. It was evidence about **one cloned portal**.
Across every CURRENT lane in the document:

```text
solid paints (fills + strokes):  45,137
unbound before:                  14,583   (32.3% unbound)
```

A third of the file was painted, not tokenised. Any dark-mode or palette change
would have missed all of it.

### 19.3 The binding pass, and what it deliberately did not do

A hex-to-token map was built from the **Light** mode of Semantic Color,
Primitives and Glass Material. Two exclusions were built in:

- **Ambiguous hexes are dropped, not guessed.** Five colours resolve to more
  than one token; binding those would repeat the inference that produced the 54
  unproven colours at §3.1.
- **Baseline capture pages 00–03 are excluded entirely.** They document what
  production and playground actually render, in Segoe UI, Georgia and raw hex.
  Tokenising them would falsify the baseline.

Superseded and historical lanes were excluded throughout.

```text
bound this pass:   7,210 paints across 24 pages
unbound after:     7,373
coverage:          67.7%  ->  83.7%
```

Light-mode appearance is unchanged by construction: every binding preserves the
exact colour it replaced. The gain is that these surfaces now follow a mode
switch and a palette edit instead of ignoring both.

The two unbound status dots at `300:585` and `300:609`, recorded at §13.5, were
swept up by this pass and are now bound.

### 19.4 What remains unbound, and why it is not simply "more of the same"

The largest remaining pockets are `#000000` (1,401), `#f2d15c` (804) and
`#2e2423` (622). Black is not a token and should not become one by default —
most instances are icon or divider work that needs a role decision first.
`#f2d15c` is a gold that exists in no collection, which means either a token is
missing or the value is wrong; that is a design decision, not a mechanical bind.

FD-TOKENS therefore stays `IN_PROGRESS`. The remaining 7,373 need role
judgement, and mechanically binding them would trade one silent problem for
another.

### 19.5 A sweep that was wrong, and was reverted

Following §17.4, a document-wide sweep looked for text nodes overflowing their
parent horizontally and pinned them. It flagged 20 nodes and squeezed 19 to
their parent's width. That was **wrong**.

Sixteen of them were the "Department of Logistics" wordmark inside a 208px
container that sits in a 620px masthead. The parent is narrow because a sibling
sized it, not because the text was misbehaving; the lockup rendered on one line
and looked correct. The sweep wrapped it to two lines on pages 15 and 90.

All 19 were reverted to `WIDTH_AND_HEIGHT` and re-verified by render. Only one
genuine paragraph wrap was kept.

**The rule that replaces the bad heuristic:** a text node wider than its parent
is not evidence of a defect. It is evidence only when the parent's width is
*independently* fixed — an explicit width or a FILL inside a sized column — not
when the parent hugs its content. Overflow is a symptom with two causes and the
sweep only handled one of them.

## 20. Authenticated requester portal — built

`624:2` on page 40, `CURRENT · portal.request — authenticated requester portal ·
1440 · light`. This closes the last "represented nowhere" surface in the
programme.

It is deliberately **not** a skin of the public Request Center. Four differences
carry the whole point, and each is drawn rather than described:

| Contract fact | How the frame states it |
|---|---|
| Identity is derived, not entered | Department field on the inset surface, badged **Derived from session** |
| Tracking needs no code | The track panel says search is restricted to the requester's own department and no private tracking code is required |
| Cancel exists, conditionally | Offered on the For Review ticket, absent on the Completed one, with the rule written beneath it |
| The receipt is generated locally | "The PDF is generated in the browser. No document is fetched from a server, so the receipt exists even if the session ends." |

Two production behaviours that a static frame would normally lose are badged
instead of hidden: the parent-request selector is marked *Shown only for
Additional*, and the Sub-event select is drawn disabled and marked *Disabled
until Event chosen*. Production hides the first and disables the second; the
design shows both rules at once.

The frame footer records the gate and the endpoints, so the next reader does not
have to re-derive them: `roleId REQUESTER` with a `requesterDepartment`,
`GET /api/portal/request`, `POST /api/portal/request/cancel`, and the single
refusal card for anything else.

Every fill and stroke is variable-bound. One construction defect was caught on
first render — a frame left at `createFrame`'s 100px default width let the
requester name run under the Sign out button — and fixed by hugging it.

## 21. Public Request Center — field-by-field diff, PR-01 closed

Diffed `src/visual/public-requester-portal.js` at `c316e047` against Figma page
40's `public.request-intake` frames.

### 21.1 Production is a five-step flow

```text
1  Request Purpose      2  Requester      3  Event & Schedule
4  Requirements         5  Review & Submit
```

The Figma frame was **one page**. Everything below was absent from it.

| Contract element | In Figma before |
|---|---|
| Step 1 purpose choice — `EVENT_ACTIVITY_SUPPORT` (default) / `OFFICE_INVENTORY_PANTRY` | absent |
| `requesterName` (120, required) | absent |
| `requesterType` (select, required) | absent |
| `organization` (120, required) | present as "Requesting department" |
| `contactNumber` (24, required) | absent |
| `email` (254, required) | present |
| Private related-request lookup — `relatedLookupId` (80) + `relatedLookupCode` (masked, 128) + Verify + polite live region | absent |
| `eventSeriesId` required, `eventId` required and **disabled until a series is chosen** | collapsed into one "Event or sub-event" field |
| `originalRequestId`, `location` (160), `startDate`, `endDate`, `eventPurpose` (500, required) | only two dates |
| Whole restock branch — `stockArea`, `neededDate`, `relatedRequestId`, `restockPurpose`, all required and disabled while inactive | absent |
| Both source-empty notes | absent |
| Category composer with three distinct field sets | flat Item / Quantity / Note |
| "Submission does not reserve or reduce physical stock" | present, worded differently |
| Step 5 review with per-section `data-edit-step` Edit | absent |
| Evidence note | absent |
| Lead-time warning at ≤ 3 days | absent |
| Four required acknowledgments — review, privacy, acceptable use, evidence consent | **all four absent** |
| Receipt: Request ID + private tracking code, shown once, unrecoverable | absent |
| Track form: `requestId` + masked `trackingCode` | result state only, no lookup form |

### 21.2 Two entries are contradictions, not omissions

**PR-02 · CONTRACT_CONTRADICTION · HIGH.** The intake frame labelled the email
field *"Used only to send your tracking reference."* Production does the
opposite: it renders the code **once on screen** with *"This code is shown once.
Store it securely; it cannot be recovered from this browser."* Nothing is
emailed. A requester who believed that copy would close the tab expecting an
email and lose access to their own request permanently.

**PR-03 · INVENTED_AFFORDANCE · MEDIUM.** The frame offered **"Save and review
later"**. There is no draft persistence in the module — no storage, no resume
path. The button promised a capability that does not exist.

Both are the same class as PL-01: not a missing field, but design copy asserting
behaviour the product does not have.

### 21.3 What was built

`626:2` — `CURRENT · public.request — five-step intake, reconciled to
production · 1440 · light`. All five steps, the related-request lookup with its
masked code and live region, both branches with the inactive one shown as
disabled rather than merely hidden, the composer with its three field sets
described, the review stage with per-section Edit, the lead-time warning, all
four acknowledgments badged Required, the once-only receipt, and the tracking
lookup with its privacy statement.

Step 2 carries the correction to PR-02 directly: *"The tracking code is shown
once on screen after submission. It is not emailed and cannot be recovered from
this browser."*

`300:2428` and `300:2677` are renamed `SUPERSEDED ·` with the reason inline.
They are preserved, not deleted — their field-level error treatment ("Three
fields need attention", "Nothing has been submitted and everything you entered
is still here") is good work worth keeping as reference.

`300:2941`, the tracking **result** state, is not superseded. It shows lifecycle
state only and its "Only lifecycle state is shown" note matches the production
privacy boundary. What it lacks is the lookup form that precedes it, now built
in `626:2`.

### 21.4 Still open for this surface

Dark mode, 390 mobile, and the loading, empty, error and service-unavailable
states for the new frame. The error treatment should be ported from the
superseded frames rather than reinvented.

## 22. SR-07 — composite requests, the last Staff Request gap

`628:2` sits between the submission region and the review queue, which is where
production puts it.

Three things it had to get right, because each is a rule rather than a layout:

1. **It is feature-flagged.** The panel carries `data-composite-feature` and is
   `hidden` until `applyCompositeRequestFeatureState()` enables it. The frame
   says so, so nobody draws it as always-present chrome.
2. **All three sections are exposed together** — Food, Materials, Venue &
   Equipment. It is not a picker or a wizard; the requester sees the whole
   surface and fills in what applies.
3. **Selection has a consequence that must be visible.** Each selected
   non-empty section becomes **one independently trackable child** of a single
   parent request; an untouched section creates **no** child. Each section
   header carries that state as a badge — *Selected — becomes one child* against
   *Untouched — creates no child* — so the model is legible before submission
   rather than discovered after it.

The result strip shows the parent and one child with its own ID and its own
`FOR_REVIEW` status, which is the point of the feature.

With this, every SR item raised in section 11 is closed: SR-01 through SR-08
resolved, SR-09 repaired at source rather than cloned.

## 23. Institutional Glass — Figma and code now map one-to-one

The Glass Material collection held seven colour tokens and four blur tokens.
`glass.css` implements twenty-one. The gap was not a naming difference: ten
values existed only in code, so a designer changing the environment in Figma
would have changed nothing, and a developer changing it in code would have
silently diverged from the file.

**The seven existing colour tokens were checked value-by-value against
`glass.css` in both modes. Zero drift.** The ladder itself was correct; only
its coverage was short.

Ten variables created in Glass Material, Light and Dark, each carrying a
description pointing back at `glass.css`:

| Added | Role |
|---|---|
| `material/field/anchor` · `field/decision` · `field/halo` | the three G0 environment fields — the oxblood anchor, the gold decision field and the angel-light halo |
| `material/rule/ink` | the ledger rule grid painted on the ground |
| `material/highlight/inner` | the inner top highlight every pane carries |
| `material/shadow/g1` … `g4` | the elevation ladder matched to the blur ladder |
| `material/shadow/drop` | the generic drop used off the ladder |

`glass.css` now opens with the correspondence table, property by property, and
states the rule plainly: change one, change the other. A divergence here is
exactly the D-02 failure — two sources, one inert.

### Why the G0 fields had to become tokens

The environment is not decoration. A Gaussian blur destroys detail below
roughly 2·sigma and preserves structure only above roughly 6·sigma, so at the
G2 sigma of 22px nothing smaller than about 132px survives. The three fields are
large and slow **because** that is what transmits. Leaving them as hard-coded
gradients meant the one part of the system that has to be tuned against the blur
ladder could not be tuned from the same place as the blur ladder.

## 24. Figma Make — the access application removed, sync blocked upstream

Owner direction: the staff access application belongs on the sign-in page, not
in the public portal tabs. Production agrees — `portal-navigation.js` at
`c316e047` offers exactly four destinations and the application is an
`auth-card`, not a portal view.

### 24.1 What was applied

`PublicFlows.tsx` in `rP9W9MQlZkyQrUx38TVsFS`, four edits, `+14 −23`:

- `"Access application"` removed from the `View` union;
- the tab row reduced to the three real public views, with a **Staff sign in**
  hand-off appended that fires `onRequireAuth`;
- the entire access-application view block deleted;
- CSS for the hand-off so it reads as leaving the portal — pushed right, dashed
  border, trailing arrow — rather than as a sibling tab switching a view.

Verified in the editor: 799 → 790 lines, `Access application` absent, the CSS
template literal still closed, the sacrificial trailing comment intact.

### 24.2 The clipboard route failed, and was replaced

The established procedure — serve the file, select it in a second tab, real
`Ctrl+C`, then `Ctrl+A` + `Ctrl+V` in the editor — **emptied the file**. The
selection was verified at 50,613 characters immediately before the copy, but the
paste inserted nothing, so `Ctrl+A` deleted 799 lines and replaced them with
nothing. A single `Ctrl+Z` restored the file exactly, confirmed by line count and
tail content before anything else was attempted.

The replacement route is deterministic and needs no clipboard: CodeMirror's
`EditorView` is reachable from the DOM at `.cm-content.cmView.view`, so the four
edits are computed **in-page** from the live document text and applied as one
transaction. Anchors were checked for exactly one occurrence each before any
mutation.

This is strictly better than the paste and should be the default from now on. It
cannot half-succeed, it needs no second tab or server, and it never leaves the
document empty between two keystrokes.

### 24.3 Why it is not live yet

Figma reports, in its own words:

```text
Connection issue affecting saving. Click for details.
Some changes won't be synced until Figma is able to reconnect.
```

Save was clicked and the change is staged — the editor holds the corrected 790
lines and **Discard is deliberately not pressed**. It will sync when Figma
reconnects. This is Figma's transport, not access, not credits, and not the
edit: the same session had no trouble reading the file or applying the
transaction.

**Do not re-apply the edit on the next session without checking first.** If the
file already reads 790 lines with no `Access application`, the queued save
landed.

## 25. Public Request — the implementation diffed against the contract

`prototypes/public-portals-r3` against `public-requester-portal.js` at
`c316e047`. The five-step structure, the requester block and all four
acknowledgments already matched. Three things did not, and all three were
behaviours rather than fields.

### 25.1 A related request was linkable by free text

The prototype offered a plain **"Related or original request"** text input.
Production does not: a related request is **someone else's private record**, so
`relatedLookupId` must be verified against a masked `relatedLookupCode` through
`/api/public/request/related` before it can even appear in the filtered
dropdown.

Typing an ID into a text box is not the same act as proving you hold its
tracking code. The prototype now carries the real control — Request ID, masked
code, a **Verify request** button and a polite live region — and refuses to link
when either field is empty.

### 25.2 The lead-time warning was missing

Production computes days-to-date on the review step and warns at **three days or
fewer**: *"Staff review may require an adjusted schedule."* That is the moment
the requester can still change something, so omitting it moves the conversation
to after submission. Added, with the rule stated in the code.

### 25.3 Two smaller contract points

- `eventPurpose` is a **500-character justification** in production; the
  prototype had a single-line input. Now a `maxlength="500"` textarea.
- The **sub-event select is disabled until a series is chosen**. The prototype
  pre-populated it from the first series, which implies a choice the requester
  has not made.

### 25.4 Still open for this surface

The **category composer** — production's `renderFields()` swaps three distinct
field sets on `lineCategory` (approved inventory item; a checkbox list of
approved venue/logistics references; or description + quantity + unit +
specification). The prototype has a flat line list. That is a build, not a
correction, and is recorded rather than half-done.

### 25.5 An anchor that was not unique

Inserting the review-step additions matched `<h3>Required acknowledgments</h3>`,
which exists **twice** — once in the lending portal and once in the request
review. The edit landed in the lending view, where `leadWarning` is not in
scope, which would have thrown on every lending render.

Caught by rendering both routes rather than only the one being changed. The
Figma work has enforced "assert exactly one occurrence before mutating" since
§13; the same discipline was not applied to the prototype edit. It is now:
both routes are rendered and checked after any shared-markup change.

## 26. D-04 closed — the typeface conversion

**Zero off-system font usage across all 23,189 CURRENT-lane text nodes.**

1,380 nodes converted across eight pages, no failures, no manual pinning
required:

| Page | Converted |
|---|---|
| 20 — Overview / Command Center | 755 |
| 15 — HAU USC Landing | 625 |
| 80 — Administration + Governance | 64 |
| 90 — Public + Authentication | 64 |
| 11 — Foundations | 59 |
| 30 — Inventory | 16 (Bahnschrift) |
| 70 — Restocking + Procurement + Events | 16 |
| 10 — Authority + Design Handoff | 14 |

### The mapping rule, stated before the first change

- **Bahnschrift → Bricolage Grotesque.** It is the *fallback* in the display
  stack, so any node carrying it was authored while the real display face was
  unavailable and the substitution was silently accepted. Those 16 nodes on
  Inventory were never a design choice.
- **Inter Bold or SemiBold at ≥18px → Bricolage Grotesque**, matching weight.
  Display sizes belong to the display family.
- **Everything else Inter → IBM Plex Sans**, matching weight.

Both target families carry every weight the mapping needs, checked against
`listAvailableFontsAsync` before starting rather than discovered by failure.

### The width protection that turned out to be unnecessary

Inter and IBM Plex Sans have different metrics, so §18.3 flagged this conversion
as the §17.4 width-growth failure at scale. The guard was built in: record each
node's width, and if it grows **and its parent has an independently determined
width**, pin it back. If the parent hugs, the text is what sized it, so
re-measuring is correct — that is the §19.5 rule, learned from wrapping the
"Department of Logistics" lockup.

**Zero nodes needed pinning.** The guard cost nothing and the fear was
unfounded, but the alternative was finding out by breaking 1,380 layouts.

### The 313 that were never drift

An intermediate census reported 313 remaining off-system nodes. They were
`MIXED` — text nodes carrying more than one font family, which the whole-node
reader cannot resolve, so the census counted them as unknown. Walking every one
range by range found **zero** off-system ranges: they mix IBM Plex Sans with IBM
Plex Mono, both mandated.

A census that cannot read a value should report it as unknown, not as a failure.
This one did the latter, and would have sent the next session hunting 313
defects that do not exist.

### Still correctly excluded

Pages `00`–`03` keep Inter, Segoe UI and Georgia. They are capture pages that
document what production and playground actually render; converting them would
falsify the baseline they exist to hold.

## 27. Token coverage — 67.7% to 89.9%, and what the remainder actually is

| Stage | Coverage |
|---|---|
| Before any binding | 67.7% |
| Exact-match pass (§19.3) | 83.7% |
| Inert-paint removal + role-aware pass | **89.9%** |

### 27.1 The largest "unbound colour" was not a colour

`#000000` appeared **1,401** times and topped every list. Profiled by property
rather than by value, all 1,401 were **opacity 0**, 97% of them strokes, every
one on a `FRAME`. They render nothing. They are Figma's default stroke entry on
a frame nobody gave a stroke to.

A paint that renders nothing cannot carry a semantic role, so tokenising it
would have been theatre. They were **removed**. The coverage number improves
because the denominator got honest, not because anything was painted.

### 27.2 Role-aware binding resolved the hexes §19.3 refused to guess

The exact-match pass deliberately dropped five ambiguous colours. They were not
ambiguous once the *paint context* was read instead of the value:

| Colour | Candidates | Resolution |
|---|---|---|
| `#40070a` | `color/text/on-accent`, `oxblood/900`, `material/scrim` | text fills → on-accent; frame fills → the oxblood ramp |
| `#fffdf8` | `color/overlay`, `color/text/inverse`, `color/action/quiet`, `paper`, `material/g3/raised` | text fills → inverse; frame fills → the surface token |

558 paints bound this way, **zero** left unbound for want of a confident role —
where no role scored, the pass declined rather than picking the first match.

### 27.3 Two mistakes inside this pass, both caught by measurement

**Bound 29 frame fills to a variable that is not that colour.** A loose regex
matched `color/ramp/oxblood/900` when the intended target was `oxblood/900`.

**Then replaced 480 correct bindings while repairing it.** The repair rebound
*every* fill carrying the ramp token, not only the 29 — moving 480 pre-existing,
correct semantic bindings onto a raw primitive. Semantic beats primitive, so
that was a downgrade.

Both were resolved by **resolving the alias chain and measuring both variables
in both modes** rather than reasoning about names: `color/ramp/oxblood/900` and
`oxblood/900` both resolve to `#40070a` light and `#4a1015` dark. **No rendered
colour changed at any point.** All 547 oxblood frame fills now sit on the
semantic ramp, which is where they should have been.

The lesson is the same one §26 recorded from the opposite direction: a name is
not a value. Match on resolved values, and verify a "repair" is narrower than
the thing it repairs.

### 27.4 What the remaining 4,177 are

Concentrated on Landing (1,139) and Overview (945). The recurring literals are
**`#f2d15c` ×802** — a gold that exists in no collection, used mostly as a
translucent stroke across ten different alphas — and a family of one-off inks
and hairlines.

`#f2d15c` is the one that matters, and it is a **palette decision, not a
mechanical bind**: it sits between `gold/400` `#e8b93c` and `gold/200` `#f6e29a`,
so binding it to either changes the rendered colour. Since a bound paint keeps
its own opacity, a single token would serve all ten alphas — but only once
somebody decides whether that gold is correct or was drifted into.

`FD-TOKENS` therefore stays open, with the remainder characterised rather than
merely counted.

### 27.5 Pages excluded from the metric, and why

`00`–`03` are production and playground capture pages. `99` is a research-notes
surface whose 622 unbound inks are prose, not product. Counting either against
design-system coverage measures the wrong thing.

## 28. Canonical gold — owner decision applied

Owner decision, 2026-08-19: **the canonical primary HAU-USC gold is `#D4AF37`.**
This supersedes the unresolved `#f2d15c` question raised at §27.4.

### 28.1 The ramp is derived, not re-picked

Every other gold is a stated fraction of the primary mixed toward paper, so the
ramp cannot drift back into independent guesses:

| Role | Light | Dark |
|---|---|---|
| primary — decisive accent | `#D4AF37` | `#E1C671` (30% toward paper) |
| light — surfaces, highlights | `#E6D088` (42%) | `#EDDCA7` (58%) |
| tint — washes | `#F7EFD5` (82%) | `rgba(212,175,55,.16)` |
| border — decorative boundaries | `rgba(212,175,55,.45)` | `rgba(225,198,113,.45)` |
| glow — halos, veils | `rgba(212,175,55,.14)` | `rgba(225,198,113,.14)` |

Dark mode lifts the primary because `#D4AF37` sits too close to the dark
surfaces to stay decisive. The hue is identical; only the luminance moves.

**`gold/700` and `gold/500` were deliberately left alone.** `gold/700` is
`color/accent/text`, the only gold that passes 4.5:1 as ink on cream at 6.49:1.
Re-deriving it would have traded a brand tidy-up for a contrast failure. That is
the difference between reconciling a palette and flattening one.

### 28.2 Measured before anything changed

| Pair | Result |
|---|---|
| dark ink `#40070a` on primary, light | **7.97:1** |
| dark ink on primary, dark mode | **10.02:1** |
| primary as text on the working surface | 2.07:1 — gold is not body ink, and never was |
| primary as a UI boundary on the ground | 1.61:1 — gold carries **no** 1.4.11 duty |

Gold never satisfied non-text contrast, before or after. `--border-control`,
`--selected-line` and `--focus-ring-contrast` carry that, which is precisely why
they were introduced at §"Accessibility acceptance". The brand layer sits on top
of the accessibility layer rather than pretending to be it.

**Contrast after the swap: 66/66 pass, both themes.**

### 28.3 Reconciled by role, in four passes

The instruction was explicit that this is not a find-and-replace, and the file
proved why — the old gold hid in four different shapes:

| Pass | Found | Mapping |
|---|---|---|
| Variables | 8 tokens | Primitives ramp + accent wash/line + three Glass Material tokens. `color/action/primary`, `color/focus/ring` and the `color/ramp/gold/*` set are **aliases**, so updating the primitives propagated everywhere |
| Solid paints `#f2d15c` | **802** | 64 primary (opaque) · 85 light · 79 tint · 574 glow. Each paint kept its **own opacity**, so the alpha hierarchy the author built survived |
| Gradient stops | **160** | `#f6e29a→#E6D088`, `#e8b93c→#D4AF37`, `#d6a72e→#c8992f`. Each gradient's internal light-to-dark separation preserved |
| One-off literals | **434** across 28 distinct values | classified by hue, saturation, lightness and paint role |

The last pass mattered most: the landing page carried a **second** primary CTA
at `#f3c541` that none of the earlier passes touched, because it was neither the
known literal nor a ramp value. It now renders `#D4AF37`, confirmed by sampling
the rendered pixels rather than trusting the binding.

### 28.4 What was deliberately not treated as gold

`#bb9d8e` ×52 and `#e9a7ad` ×1 look gold-adjacent but measure below 30%
saturation or outside the 33–58° hue band. They are warm greys and a dusty pink.
A colour that merely sits near gold on screen is not gold, and sweeping them in
would have quietly changed two unrelated roles.

### 28.5 Result

```text
superseded gold values remaining anywhere:  0
paint coverage:                             67.7%  ->  93.0%
contrast:                                   66/66 both themes
```

Five canonical role variables now exist in Semantic Color —
`color/gold/primary`, `/light`, `/tint`, `/border`, `/glow` — the first three
**aliased to the ramp** so they can never drift from it. Recorded as binding
authority in `DESIGN.md` **D08.0**.
