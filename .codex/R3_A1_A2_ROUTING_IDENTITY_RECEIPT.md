# R3-A1-A2 receipt — owner routing model, identity flows, provider synchronization

AMENDMENT: `.codex/specs/accepted/2026-08-23-r3-a1-a2-owner-routing-identity-three-context.md`
BRANCH: `frontend-design-integration`
EXECUTOR: Claude Code
DATE: 2026-08-23
PARENT RECEIPT: `.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md` (preserved, annotated)

---

## 1. What this pass corrected

The owner corrected the product policy: the logistics Request Center is not
public. R3 repaired routing faithfully against the then-current authority —
`DESIGN.md` D06, production `public-requester-portal.js` at `0.8.2 / c316e047`,
and the accepted `/api/public/request` contract — and that authority was wrong
about the product. R3-A1 then synchronized both design providers to it.

This is an owner correction to product architecture, not a regression, and not a
reversal of R3's or R3-A1's engineering.

`DESIGN.md` **D24.0 — OWNER-LOCKED no-login Public Lending — is untouched** and
remains current.

---

## 2. Backend contract inspection — performed before any claim

R3-A1-A2 §20 forbids claiming the External Request Center is protected without a
real server-derived boundary, and forbids inventing one. Measured against the
branch's own Worker source, not against memory.

### `BACKEND_CONTRACT_GAP_EXTERNAL_REQUEST_AUTH` — **CLOSED**

An authenticated requester contract already exists and this branch binds to it.

| Evidence | Location |
|---|---|
| `GET`/`POST /api/portal/request`, `POST /api/portal/request/cancel` | `src/worker/index.js:989-1013` |
| Authorized on `CAPABILITIES.REQUEST_CREATE`, CSRF on mutation | `src/worker/index.js:990,996,1006` |
| Reads and writes scoped to `requester_account_id` / `requester_department_id` from the session account | `src/server/d1/operational-service.js:3784-4130` |
| `request.create` held by `REQUESTER`, `DOL_STAFF`, `COMMITTEE_HEAD`, `DIRECTOR`, `ADMINISTRATOR`; `view.internal` held by all but `REQUESTER` | `src/domain/permissions.js:71-190` |

The frontend therefore did **not** need to invent a boundary: it binds to the one
that exists. `REQ-06` asserts the browser supplies no requester identity at all.

### `BACKEND_CONTRACT_GAP_DOL_REQUESTER_MODE` — **OPEN**

`assertRequesterPortalAccount` (`src/server/d1/operational-service.js:712-724`)
requires `authorization.roleId === 'REQUESTER'` **in addition to** the
`request.create` capability. A DOL account holds `request.create` but has
`roleId` `DOL_STAFF`, so `/api/portal/request` answers
`403 REQUESTER_PORTAL_REQUIRED`.

Effect: amendment §8 and §34 DOL requester mode is **not supported server-side**.
The frontend routes DOL staff there correctly and preserves their entry intent,
and the surface reports the gap truthfully with `Open Logistics Hub` as the
recovery path. It does not fabricate a portal.

### `BACKEND_CONTRACT_GAP_SELF_SERVICE_IDENTITY` — **OPEN**

`src/auth/http-contract.js:1-7` declares only `session`, `login`, `activate`,
`logout`, `reset/complete`. There is no `activate/start`, `activate/verify`,
`reset/start` or `reset/verify`, and `completePasswordReset`
(`src/server/auth/service.js:441`) consumes an **admin-issued** `resetToken`
produced by `/api/admin/access/reset-password`. The only 8-digit email flow in the
product belongs to `account-applications`, which is the separate
"apply for staff access" operation.

Effect: amendment §17 activation-by-email-code and §18 forgot-password are **not
implemented server-side**. The frontend implements the required contract and calls
it for real; the Worker answers 404 and `AccountRecoveryPanel` states plainly that
the service is not available yet and to contact the Department of Logistics.
**No simulated success.**

The exact contract the next backend amendment must implement is specified in
`docs/frontend/ROUTING.md` §5.

> **This task does not claim end-to-end security completion.** Two contract gaps
> are open. No Production, Playground, D1 or R2 mutation was performed.

---

## 3. Traceability matrix

| CHANGE_ID | Owner decision | Workflow section | Routing control | Repository file | Backend operation / gap | Test | Status |
|---|---|---|---|---|---|---|---|
| `R3A1A2-REQUEST-AUTH-GATE` | External Request Center requires an eligible USC requester | WA §1, §5.2 | `HOME_REQUEST_LOGISTICS`, `EXTERNAL_REQUEST_*` | `app/request/ExternalRequestCenter.tsx`, `app/useAppController.ts`, `integration/backend.ts` | `GET/POST /api/portal/request` — real | REQ-01/02/03/06 | DONE |
| `R3A1A2-LENDING-REQUEST-SEPARATION` | Public Lending Hub drops the Request Center tab | WA §1, ROUTING §4.3 | `LENDING_*` | `app/PublicFlows.tsx` | `/api/public/lending*` unchanged | LEND-01/02/03, CTX-02 | DONE |
| `R3A1A2-HOME-ROUTING` | One semantic Home; Home is not logout | WA §5.7, ROUTING §3 | `NAV_HOME`, `LENDING_HOME`, `AUTH_BACK_HOME`, `EXTERNAL_REQUEST_HOME` | `app/useAppController.ts`, `public/PublicNavbar.tsx`, `public/Footer.tsx`, `public/PublicMobileDrawer.tsx`, `app/PublicFlows.tsx` | none | HOME-01/02/03, AUTH-06 | DONE |
| `R3A1A2-PUBLIC-FRONT-DOOR-RENAME` | "Public front door" is not current copy | ROUTING §3 | `LENDING_HOME`, `AUTH_BACK_HOME` | `app/PublicFlows.tsx`, `auth/StaffSignInPage.tsx` | none | LEND-03 | DONE — 0 occurrences in `src/frontend/` |
| `R3A1A2-GENERIC-STAFF-SIGNIN` | Generic sign-in uses capabilities to choose a default home | WA §5.3, ROUTING §2 | `NAV_STAFF_SIGNIN`, `AUTH_SUBMIT` | `app/entryIntent.ts`, `app/useAppController.ts` | `POST /api/auth/login` | AUTH-01/02, unit matrix | DONE |
| `R3A1A2-ACCOUNT-ACTIVATION` | Activate an existing identity ≠ apply for access | ROUTING §4.5 | `AUTH_ACTIVATE` | `auth/AccountRecoveryPanel.tsx`, `auth/StaffSignInPage.tsx` | **GAP** `SELF_SERVICE_IDENTITY` | AUTH-03 | UI DONE · BACKEND GAP |
| `R3A1A2-PASSWORD-RESET` | Secure 8-digit email verification flow | ROUTING §4.5 | `AUTH_FORGOT_PASSWORD`, `AUTH_SET_PASSWORD` | `auth/AccountRecoveryPanel.tsx` | **GAP** `SELF_SERVICE_IDENTITY` | AUTH-04 | UI DONE · BACKEND GAP |
| `R3A1A2-OTP-8-DIGIT` | 8-digit, one-time, expiring, rate- and attempt-limited, non-enumerating | ROUTING §4.5 | `AUTH_VERIFY_OTP`, `AUTH_RESEND_OTP` | `auth/VerificationCodeField.tsx` | **GAP** `SELF_SERVICE_IDENTITY` | AUTH-05 | UI DONE · BACKEND GAP |
| `R3A1A2-DOL-REQUESTER-MODE` | DOL staff may act as requesters without losing operational identity | WA §3, ROUTING §2 | `EXTERNAL_REQUEST_OPEN_LOGISTICS_HUB` | `app/entryIntent.ts`, `app/request/ExternalRequestCenter.tsx` | **GAP** `DOL_REQUESTER_MODE` | REQ-04, unit matrix | FRONTEND DONE · BACKEND GAP |
| `R3A1A2-INTERNAL-SELF-SERVICE` | Internal self-service creates the canonical record with full audit | WA §3 | `STAFF_REQUEST_HUB` | — | **GAP** `DOL_REQUESTER_MODE` + FI-04 | — | DESIGNED ONLY — not runnable, not claimed |
| `R3A1A2-FIGMA-DOC-MIRROR` | Documentation must live inside the Figma Design file | §6 below | — | — | — | provider readback | see §6 |

Additional, discovered during this pass:

| ID | Finding | Resolution |
|---|---|---|
| FE-R3-012 | `appRoutes.ts` labelled the internal route "Staff Request Center", colliding with the public Request Center | CLOSED — renamed to Internal Request Hub in `appRoutes.ts` and `preview/index/registry.ts` |
| FE-R3-006 | `AppRouteRenderer`'s `session && isAuthRoute(route)` branch was unreachable | CLOSED — `resolvePostAuthDestination` now routes an authorized internal session to its resolved route |
| FE-R3-013 | `--destructive` (`#d4183d`) is the shipped error colour but is undeclared in `DESIGN.md` frontmatter, so the detector reads it as drift; six existing surfaces use it as a literal | OPEN — new code uses `var(--destructive)`; the literals and the declaration gap remain |
| FE-R3-014 | `nav .leave::after{content:" →"}` leaked a decorative arrow into the accessible name; selects nested in their `<label>` pulled every `<option>` into the computed label | FIXED AT SOURCE for the affected controls — arrows moved to `aria-hidden` markup, External Request Center controls use explicit `htmlFor`/`id`. The nested-label pattern still exists elsewhere in `PublicFlows.tsx` |

---

## 4. Verification performed

| Gate | Result |
|---|---|
| `npm run check:agents` | PASS — 12 project files |
| `npm run check:continuation` | PASS — 14 required fields |
| `npm run build` | PASS |
| `npm run verify:dist` | PASS — deterministic artifact |
| `npm test` | PASS — **1126/1126** across 148 files |
| Frontend Playwright, 5 widths (320/390/768/1024/1440) | PASS — **190/190** |
| — of which R3-A1-A2 acceptance | **70/70** (14 tests × 5 widths) |
| `git diff --check` | clean |
| Playground / Production / `main` touched | **NO** |
| Deployment | **NONE** |

`npm run lint` is not in the branch's accepted gate and still fails at baseline
(FE-R3-009, pre-existing, unrelated to this pass).

### Acceptance mapping

| ID | Assertion | File |
|---|---|---|
| HOME-01/02 | Public Lending → Home returns to landing, from both Home affordances | `tests/e2e/r3-a1-a2-routing.spec.js` |
| HOME-03, AUTH-06 | Home preserves the session; no `/api/auth/logout` call | same |
| LEND-01 | Browsing public lending requires no sign-in and probes no session | same |
| LEND-02 | Public Lending exposes no Request Center tab | same |
| LEND-03 | No `PUBLIC REQUEST` or `public front door` copy survives | same |
| REQ-01 | Start logistics request while signed out → Staff Sign In | same |
| REQ-02 | External intent survives authentication | same |
| REQ-03 | Eligible non-DOL → External Request Center | same |
| REQ-04 | DOL via external intent → requester mode + Open Logistics Hub | same |
| REQ-05 | Ineligible identity denied, non-enumerating, with recovery | same |
| REQ-06 | Submission targets `/api/portal/request` and carries no browser-supplied identity | same |
| AUTH-01 | Generic DOL login → capability-appropriate Main Logistics Hub home | same |
| AUTH-02 | Generic eligible non-DOL login → External Request Center | same |
| AUTH-03/04 | Activation and reset paths reachable; distinct from Apply | same |
| AUTH-05 | 8-digit enforced; leading zero preserved; failure in words; focus returns | same |
| CTX-01 | Non-DOL External Request Center renders no DOL operational controls | REQ-03 assertions |
| CTX-02 | Public surfaces state the staff gate before the user commits | same |
| DOL-SELF-01 | Internal self-service — **designed only, not runnable, not claimed** | — |
| Routing matrix | Every row of the owner-approved table asserted directly | `tests/unit/frontend-entry-intent.test.js` (12 tests) |

---

## 5. Repository documentation reconciled

| File | State |
|---|---|
| `DESIGN.md` | Current authority rewritten to the three-context model; superseded statements marked, D24.0 preserved |
| `docs/frontend/WORKFLOW_ARCHITECTURE.md` | Reconciled; §0 records what changed and why it is not a regression |
| `docs/frontend/ROUTING.md` | **NEW** — canonical control contract, entry-intent matrix, backend contract status |
| `.codex/specs/accepted/2026-08-23-r3-a1-a2-...md` | **NEW** — accepted amendment |
| `.codex/CURRENT.md`, `CURRENT_TASK.md`, `CURRENT_HANDOFF.md` | Repointed to R3-A1-A2 |
| `.codex/R3_PUBLIC_STAFF_BOUNDARY_RECEIPT.md`, `.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md` | Annotated `SUPERSEDED BY R3-A1-A2`, **not rewritten** |

---

## 6. Provider synchronization

See §7 and §8 below for the Figma Design and Figma Make readback evidence.

---

## 7. Figma Design — writes performed and read back

FILE: `hXJElH4p72KfgAaoUyfNOC` — HAU-USC Logistics · Frontend Design Lab
AUTH: `mcp__figma__whoami` → Invicta-ctrl / adrianoearl04@gmail.com, Full seat
WRITE AUTHORITY: R3-A1-A2, bounded to this file and the Make file only

### 7.1 Current-authority lane, page `55:3` → board `568:2`

| Node | Action |
|---|---|
| `753:2` / `753:3` / `753:4` | **CREATED.** Block "R3-A1-A2 three-context workflow authority — CURRENT", inserted at board index 2, above the R3-A1 block. Body 6,612 characters: three contexts, canonical records, entry-intent priority and the full routing matrix, DOL requester mode, public lending tab set, Home semantics, identity flows, the measured backend truth including both open gaps, the FI-04 warning, and the fixed vocabulary. |
| `733:2` | **RENAMED** to "Block · SUPERSEDED BY R3-A1-A2 · R3-A1 public/staff workflow authority — HISTORICAL, retained as evidence". |
| `733:3` / `733:4` | **BANNERED, NOT REWRITTEN.** A `SUPERSEDED BY R3-A1-A2` header and a "HISTORICAL RECORD, R3-A1, PRESERVED VERBATIM" separator were prepended. Every original character is intact beneath. |
| `568:4` | **UPDATED.** Board freshness now reads R3-A1-A2 and points at the in-file documentation page. |
| `680:13` | **REWRITTEN.** Module index restructured into contexts A / B / C. Explicitly marks the page-40 public five-step intake frames as HISTORICAL evidence and warns "Do not implement from them". |
| `680:16` | **UPDATED.** Interactive-counterpart block records the R3-A1-A2 Make reconciliation, carries a `SUPERSEDED BY R3-A1-A2` note over the R3-A1 public-request claim, points at `ROUTING.md`, and names both open backend gaps. |

### 7.2 Documentation mirror — the owner's mandatory requirement

**CREATED: page `755:2` — "10.1 — CURRENT · Frontend Architecture & Routing".**
Document page count 28 → **29**. Board `755:3`, 1400 px wide, 8 cards, 10,669 px tall.

| Card | Content |
|---|---|
| `755:4` | Masthead + precedence statement |
| `755:7` | **Mirror manifest** — repository, commit, per-file sha256, byte counts, per-document fidelity declaration, stale-if conditions |
| `756:2` | ROUTING.md §1 contexts · §2 entry intent + full matrix · §3 Home semantics |
| `759:2` | ROUTING.md §4.1–§4.6 — the complete control contract |
| `760:2` | ROUTING.md §5 backend contract status incl. both open gaps and the verbatim required next contract · §6 limitations · §7 providers |
| `761:2` | WORKFLOW_ARCHITECTURE.md §0–§5 |
| `762:2` | DESIGN.md current-authority normative sections |
| `762:6` | R3-A1-A2 amendment, full traceability matrix, verification results, Codex next actions |

**Fidelity is declared honestly.** An initial draft of the manifest claimed
"FULL MIRROR" for ROUTING.md and WORKFLOW_ARCHITECTURE.md. That was corrected
before completion: **no mirror on the page is byte-identical** — markdown tables
are reformatted for monospace rendering and markdown syntax is dropped. The
manifest now declares:

- `NORMATIVE MIRROR — COMPLETE SECTION COVERAGE` for `ROUTING.md` and
  `WORKFLOW_ARCHITECTURE.md`, listing every section reproduced.
- `NORMATIVE MIRROR — CORE SECTIONS + HASHED SOURCE POINTER` for `DESIGN.md`,
  the accepted amendment, and this receipt.

with the stated rule: *"A one-line link is not a mirror and is never counted as
one. To verify any document exactly, read it at the commit and sha256 below."*

### 7.3 Node `35:145` — the owner's linked legacy placeholder

**PRESERVED.** The section is untouched: same id, name, position, size and single
child. Its evidence role is intact.

**CREATED: `763:2`** — a 2000 × 578 px `CURRENT AUTHORITY POINTER` frame on page
`00 — Capture Index`, placed 80 px directly above the section, gold-bordered, with
a `SUPERSEDED HISTORICAL PLACEHOLDER` badge. It names the in-file documentation
page, the authority board block, the four repository documents, the amendment and
commit `aa6d2a7`, and closes with the one-line rule. Verified non-overlapping:
gap 80 px, `overlaps: false`.

### 7.4 Readback — performed, not assumed

Re-read after every write. Verified: all six mutated nodes carry their new text;
`753:2` exists at board index 2 with 2 children and 6,612 body characters;
`733:2` retains its 2 children with the banner prepended; page `755:2` exists with
8 cards in order; `763:2` exists with 6 children and does not overlap `35:145`.

A regex sweep of the current-authority lane for "PUBLIC Request Center" and
"No staff sign-in is required" returned **one** match, in `680:16` — inside the
`SUPERSEDED BY R3-A1-A2` note that deliberately quotes the R3-A1 claim in order
to retire it. The historical block `733:2` was excluded from the sweep by design.
No current-lane node asserts a public Request Center.

Screenshots captured to `output/design/r3-a1-a2-readback/`:

| File | Node |
|---|---|
| `figma-35-145-current-authority-pointer.png` | `763:2` |
| `figma-doc-mirror-manifest.png` | `755:7` |
| `figma-r3a1a2-authority-block.png` | `753:2` |

`FIGMA_DOCUMENTATION_MIRRORED` PASS · `FIGMA_NODE_35_145_CURRENT_POINTER` PASS ·
`FIGMA_PROVIDER_READBACK` PASS

---

## 8. Figma Make — partially applied, save in flight

FILE: `rP9W9MQlZkyQrUx38TVsFS` · baseline Version 40
FULL CHANGESET AND METHOD: `.codex/R3_A1_A2_MAKE_CHANGESET.md`

### 8.1 Constraints re-confirmed

- `mcp__figma__use_figma` **cannot write Make files** — no MCP write path exists.
- Figma Make **AI credits are exhausted** ("Credits reset Sep 12"), so the
  AI-prompt path is unavailable.
- The in-app browser is **signed out** of Figma; it renders the Make file as
  "Sign up to use Figma Make" and cannot edit.
- Authenticated **Chrome** is the only write path. The code view is
  **CodeMirror 6**, so edits are dispatched through the editor's own
  `EditorView.dispatch` rather than typed — synthetic typing would be corrupted
  by CM6 auto-closing brackets and quotes.
- Every transformation asserts its anchor before dispatch; a missing anchor
  aborts with the document untouched, so a partial edit cannot occur.

### 8.2 The repository mirror was rejected as a source

47 mirror files contain a literal `…N tokens truncated…` marker, including
`src/app/PublicFlows.tsx`. Recorded as `FE-R3-015` in
`docs/design/FIGMA_MAKE_SOURCE_REGISTER.md`, listed in
`.codex/R3_A1_A2_MAKE_MIRROR_TRUNCATION.txt`. Live source was read from the
editor instead — 790 lines, no marker.

### 8.3 Applied

`src/app/PublicFlows.tsx` — **20 transformations, one atomic dispatch.**
790 → 670 lines. The public Request Center view is deleted (−8,006 characters),
the tab set becomes Home · Lending Center · Track lending · Lending policy ·
Staff sign in, the banner is rescoped to lending, "Public front door" reaches
**0 occurrences**, decorative arrows move out of the accessible name, and the
stale R3 header is replaced with the R3-A1-A2 scope correction. The editor
registered it as `1 edited file · PublicFlows.tsx +53 −173`.

### 8.4 Save — IN FLIGHT, NOT CONFIRMED

Save was clicked and has shown a spinner for over two minutes. The header still
reads **Version 40** and the pending panel still shows the edit.

Console was checked: every error is **telemetry only**
(`api/web_logger/metrics/*`, `events.statsigapi.net`, `Failed to fetch` /
`status 0`). **No save-API error.** This is the same stall R3-A1 recorded, which
resolved on its own once Figma reconnected.

Handling, per that precedent: the tab is left open, not reloaded, not navigated
away from, and **Discard has never been clicked**. The changeset is recorded in
the repository first so it is reproducible from the repository alone.

> **`FIGMA_MAKE_CODE_CURRENT` and `FIGMA_MAKE_PROTOTYPE_CURRENT` are NOT claimed.**
> They require a provider version above 40 with zero pending edits after a full
> reload, plus the journey run. Neither has been observed. The remaining Make
> files listed in the changeset are not yet applied.
