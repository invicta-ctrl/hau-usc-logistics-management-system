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
| Authenticated requester portal | Session required | Not represented | MEDIUM |
| Internal Staff Request Center | Session + capability | Represented | LOW |

The headline finding is that Figma carried four **CURRENT-lane** frames stating
the opposite of production's access model for Public Lending, and carried **no
design at all** for the actual public borrowing portal.

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

None found. Every behaviour inspected was internally consistent and matched the
accepted contracts. No `PRODUCTION_DEFECT_CANDIDATE` is raised by this audit.

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
4. Staff Request Center lifecycle check against the internal contracts.
5. Re-run Hallmark and Impeccable **after** parity is restored, never before.
