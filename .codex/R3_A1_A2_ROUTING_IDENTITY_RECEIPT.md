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
