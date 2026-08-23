# R3 receipt — frontend public/staff boundary audit and public-access repair

DATE: 2026-08-23
EXECUTOR: Claude Code (Opus 5)
AUTHORITY: Earl's R3 owner-directed frontend-only instruction (2026-08-23)
SCOPE CLASSIFICATION: FRONTEND-ONLY

## Identity

BASELINE_HEAD: 9fdbe2e87badb9c4227f02035faa206a2bc2794e
FRONTEND_BRANCH: frontend-design-integration
FRONTEND_WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
UPSTREAM: origin/frontend-design-integration (0 ahead / 0 behind at baseline)
ACTIVE_WRITER_AT_ENTRY: NONE (WRITER_LOCK RELEASED)
WORKTREE_STATE_AT_ENTRY: clean except preserved untracked `.ai-bridge/`
PLAYGROUND_TOUCHED: NO
PRODUCTION_TOUCHED: NO
MAIN_TOUCHED: NO
FIGMA_WRITE: NONE
BACKEND_WRITE: NONE

The active checkout at `active/hau-usc-logistics-management-system` is on `main`
and was read only, never mutated.

## Findings

FINDINGS_OPENED: 10 (FE-R3-001 … FE-R3-010, recorded in `docs/frontend/WORKFLOW_ARCHITECTURE.md` §6)
FINDINGS_FIXED: 2 (FE-R3-001 P0, FE-R3-002 P1)
FINDINGS_DEFERRED: 8, each with a recorded owning FI slice

### FE-R3-001 — P0 — public request intake was unreachable

PERSONA: public requester (Angelite student, USC officer)
JOURNEY: J01
ROUTE/MODULE: `landing` → `HeroSection`, `Footer`, `PublicMobileDrawer`, `LogisticsHubSection`
EXPECTED: a public "Start a logistics request" control opens the public Request
Center (`request`), which `DESIGN.md` D24.0 records as OWNER-LOCKED no-login.
ACTUAL: all four called `requireAuth("request-center")` — an FI-04 authenticated,
capability-gated route that renders no workspace — landing the user on the staff
sign-in wall. `grep` confirmed **zero** `onNavigate("request")` call sites in the
entire frontend: the accepted public intake surface had no entry point anywhere
on the public site. The hero's accessible name stated the defect out loud:
"Start a logistics request in the Staff Request Center".
WHY IT MATTERS: the primary public journey could not be started at all.
AUTHORITY: R3 §9/§21; `DESIGN.md` D24.0 OWNER-LOCKED; `docs/design/DESIGN_EXECUTION_TRACKER.md` `PL-ACCESS`.
ROOT CAUSE: public presentation components were each handed `requireAuth` and
used it as though the Request Center were a staff destination.
REPAIR: route all four CTAs to the public `request` route; correct the hero
accessible name and the two misleading hub tile subtitles; remove the now-dead
`onRequireAuth` wiring from `HeroSection`, `Footer`, `PublicMobileDrawer` and
`PublicNavbar` so the misuse cannot recur there.
VERIFICATION: reproduced live in-browser before the fix (landing CTA → "Staff
sign in" page) and after (landing CTA → "PUBLIC REQUEST · NO SIGN-IN" Request
Center). Three new Playwright regression tests across five widths.
STATUS: FIXED

### FE-R3-002 — P1 — generic staff sign-in pre-committed to a gated destination

PERSONA: authenticated staff without `view.request`
ROUTE/MODULE: `PublicFlows` nav; `useAppController.handleSignIn` / `handleActivate`
EXPECTED: a generic "Staff sign in" authenticates; it does not demand one
specific capability.
ACTUAL: `PublicFlows` called `requireAuth("request-center")`, and both sign-in
handlers defaulted a null intended route to `overview`. A valid staff account
holding only, say, `fulfillment.release` signed in successfully and was shown
"Access denied — Your account is not authorized to open Staff Request Center".
REPAIR: `PublicFlows` navigates to `staff-signin` directly; a null intended route
is now treated as "no specific destination" and authorized on the session alone.
Server-derived capabilities are unchanged — this only selects which truthful
message is shown, and no route renders a workspace in this release.
VERIFICATION: new Playwright test signs in a release-only account and asserts
"Access authorized" with no "Access denied".
STATUS: FIXED

## Verification

FOCUSED_TESTS: `npx playwright test --config playwright.frontend.config.js --grep "R3 "` → 17 passed, 3 skipped (drawer test is mobile-only by design)
BROADER_FRONTEND_TESTS: full frontend Playwright → **132 passed / 3 skipped** across 320, 390, 768, 1024, 1440
UNIT: `npm test` → **147 files / 1,114 tests passed** (140.87s)
BUILD: `npm run build` passed
ARTIFACT: `npm run verify:dist` passed, sha256 `33c31a29d09d4e1f…`
GOVERNANCE: `npm run check:agents` (12 files), `npm run check:continuation` (14 fields), `npm run handoff:verify` all passed
WHITESPACE: `git diff --check` clean
LINT: `npm run lint` fails at branch **baseline** (26 `no-undef` in `prototypes/public-portals-r3/app.js`, 1 unused-var warning in `src/server/public-request-service.js`). None of the changed files appear. Recorded as FE-R3-009; lint is not in this branch's accepted gate.

LOCAL_PREVIEW: plain `vite` dev on `127.0.0.1:5199`, no `HAU_PLAYGROUND_PROXY_ORIGIN`
set, therefore no playground proxy. The supervised `preview:frontend:*` scripts
were deliberately **not** used: they resolve and verify a private playground
origin, which is out of R3 scope. `.codex/CURRENT.md` claimed a guarded preview
was RUNNING at 4173; that claim was stale — port 4173 had no listener and no
owning process. Nothing was stopped or restarted.

EXTERNAL_ACTION: installed the project's pinned Playwright Chromium headless
shell (113.6 MiB, official Playwright CDN) into the user-level browser cache. No
browser binary was present, so the repo's own frontend gate could not otherwise
run. No other download, provider call, or outward-facing action.

## Authority conflicts recorded, not resolved unilaterally

1. `.codex/CURRENT.md` names DeepSeek V4 Pro as canonical writer and GPT-5.6 Sol
   Max as read-only orchestrator. Earl's R3 (authority rank 1) names Claude Code
   as writer and confirms no writer is active; `ACTIVE_WRITER` was `NONE` and the
   lock `RELEASED`, so there was no collision.
2. `.codex/CURRENT.md` records `FIGMA_WRITE: FORBIDDEN`; R3 §4 authorizes bounded
   Figma/Make writes. No Figma write was attempted. The corrected public CTA
   destinations still need reconciling into the live Make source when write
   authority is explicit.
3. `.codex/CURRENT.md` records `FI04_STATUS: BLOCKED` and "do not start FI-04",
   while R3 targets shell/navigation/public-vs-staff boundaries (FI-04's domain).
   This pass stayed inside already-accepted FI-00…FI-03 public surfaces and did
   not open FI-04: no staff workspace was implemented or exposed.

## Not covered by this pass

R3 sections that depend on running staff surfaces could not be executed, because
no staff workspace renders in this release (FI-04 unexposed, confirmed: nothing
imports `AuthenticatedShell`; all ten staff route components are orphaned):
internal Request Hub (§10), Lending staff flow (§12), Inventory (§13),
Restocking/Procurement/Receiving (§14), Release Desk (§15), staff shell IA (§16),
and journeys J02, J04, J05. Also not performed: Figma/Make reconciliation (§24),
and the Hallmark / Impeccable / Taste / Vercel formal audit passes (§6, §13, §35)
beyond the Impeccable pre-commit hook output, which surfaced FE-R3-010.

## Completion state

FVR-02 remains BLOCKED_PARTIAL on its recorded media blockers, untouched.
FI-04 remains not started.
This pass is **not** FRONTEND-INTEGRATION READY as R3 §43 defines it. It closes
the P0/P1 public/staff access defects and records the remaining findings.

COMMIT: e30fbff1982beabc98e0b93fdfa6be5250bb919e
PUSH: withheld pending owner confirmation
