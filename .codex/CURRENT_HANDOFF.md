# Current Environment Handoff — R3-A1 design synchronization to Codex preview adoption

FROM: Claude Code (Opus 5), R3-A1 design-authority synchronization
TO: Codex — frontend implementation and local preview adoption
BRANCH: frontend-design-integration
HEAD: GIT_HEAD
UPSTREAM: origin/frontend-design-integration
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
WORKTREE_STATE: GIT_STATUS
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
HANDOFF_STATUS: READY_FOR_HANDOFF
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_TASK: .codex/CURRENT_TASK.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-23-r3-a1-figma-make-design-sync-codex-preview-handoff.md

COMPLETED: Adopted the R3-A1 bounded design-provider write authority as an accepted amendment and reconciled the `.codex` records that previously said `FIGMA_WRITE: FORBIDDEN`. Resolved both provider identities live. Reconciled the live Figma Design current-authority lane: added R3-A1 block `733:2` to authority board `568:2` on page `55:3`, corrected the board freshness line `568:4`, rewrote module-index `680:13` so the public Request Center and internal Request Hub are distinct, repaired dangling pointers in `680:16`, and renamed page-40 frame `300:2` to the internal Request Hub. Applied the public-request reconciliation to eight live Figma Make source files and saved them: Version 39 -> Version 40. Rewrote `DESIGN.md` to the post-R3-A1 authority model. Corrected the D24.0 citation in `docs/frontend/WORKFLOW_ARCHITECTURE.md`.

VALIDATION: Figma Design writes were read back — a full-board text scan returns zero remaining "Staff Request Center" strings on the authority board, and blocks `733:2` were screenshotted after each edit. `npm run check:agents`, `npm run check:continuation` and `npm run handoff:verify` passed before the governance commit. `git diff --check` clean. Remote readback confirmed 0 ahead / 0 behind at the governance checkpoint. The Figma Make changeset IS validated: after a full reload the provider reports Version 40, zero pending edits, and a version-history entry "8 edited files - Version 40". Behaviourally exercised in the live prototype: "Start a logistics request" reaches "PUBLIC REQUEST - NO SIGN-IN / Request Center" carrying "You do not need a HAU-USC Logistics account, staff sign-in, activation, or approval to submit", and "Staff sign in" reaches a separate staff sign-in page. HeroSection.tsx was re-read from the provider and is byte-identical to the repository file except Make's omitted terminal newline.

EXTERNAL_ACTIONS: Live Figma Design writes to `hXJElH4p72KfgAaoUyfNOC` (authorized by R3-A1). Live Figma Make edits to `rP9W9MQlZkyQrUx38TVsFS`, saved as Version 40. Git commit and push to `origin/frontend-design-integration`. No Playground, Production, `main`, backend, schema, migration, D1/R2, deployment, or other provider action.

BLOCKER: NONE for the provider synchronization. The first Make save attempt stalled on a Figma reconnect failure; Figma reconnected and the save landed as Version 40, verified after reload. OUTSTANDING, non-blocking: the repository Make mirror at `output/design/figma-make-source/` is still at v39 and must be refreshed to the saved v40 source with recorded bytes and sha256 per file; `.impeccable/design.json` is still the stale pre-cutover v4.1 sidecar; the post-sync Impeccable and Hallmark audits and the documentation reconciliation manifest are not done.

## Provider identity

| Field | Value |
|---|---|
| FIGMA_DESIGN_FILE | `hXJElH4p72KfgAaoUyfNOC` (28 pages) |
| FIGMA_DESIGN_CURRENT_AUTHORITY | page `55:3` → board `568:2` → R3-A1 block `733:2` |
| FIGMA_DESIGN_MODULE_INDEX | `680:13` |
| FIGMA_MAKE_FILE | `rP9W9MQlZkyQrUx38TVsFS` |
| FIGMA_MAKE_PREVIOUS_VERSION | 39 |
| FIGMA_MAKE_CURRENT_VERSION | **40** — saved and verified |
| MAKE_PENDING_EDITS | 0 after reload |
| REPOSITORY_BASELINE_COMMIT | `e30fbff` (R3 public-entry repair) |

## Design-to-code traceability

Implement by this map rather than visually guessing. Every row is already true in
`src/frontend/` as of `e30fbff`; Codex's job is to confirm it end-to-end in the
running preview and against the updated design references.

| CHANGE_ID | Product reason | Figma Design | Figma Make | Frontend file(s) | Test | Visual acceptance |
|---|---|---|---|---|---|---|
| `R3A1-REQUEST-PUBLIC-ENTRY` | Public requesters could not start a request at all | board `733:2`; module index `680:13`; page 40 `626:2` | `landing/HeroSection.tsx`, `public/Footer.tsx`, `public/PublicMobileDrawer.tsx`, `landing/LogisticsHubSection.tsx` | same four files under `src/frontend/app/` | `tests/e2e/frontend-cutover.spec.js` R3 cases | landing CTA reaches "PUBLIC REQUEST · NO SIGN-IN", never the sign-in wall |
| `R3A1-STAFF-SIGNIN-SEPARATION` | Generic sign-in denied valid staff lacking one capability | board `733:2` | `PublicFlows.tsx`, `AppRouteRenderer.tsx` | `src/frontend/app/PublicFlows.tsx`, `app/useAppController.ts` | R3 release-only sign-in case | "Access authorized", no "Access denied" |
| `R3A1-REQUEST-HUB-INTERNAL-CONTEXT` | Internal hub was labelled "Staff Request Center", colliding with the public centre | page 40 frame `300:2`; `680:13` | n/a (FI-04 not exposed) | none yet — FI-04 | n/a | internal hub reads INTERNAL / STAFF SESSION REQUIRED, marked READY FOR FI-04, never implementation-verified |
| `R3A1-PUBLIC-TRACKING-PROJECTION` | Public tracking must stay requester-safe | `680:13`; page 40 tracking frames | `PublicFlows.tsx` tracking view | `src/frontend/app/PublicFlows.tsx` | existing tracking cases | no internal operational detail exposed publicly |
| `R3A1-NAV-PUBLIC-STAFF-BOUNDARY` | Public components must not hold `requireAuth` | board `733:2` | `PublicNavbar.tsx`, `LandingPage.tsx` | `src/frontend/app/public/PublicNavbar.tsx`, `app/landing/LandingPage.tsx` | five-width nav cases | Staff Sign In remains a separate, visibly distinct entry |

## Files Codex MUST read first

- `AGENTS.md`
- `DESIGN.md`
- `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, this file
- `docs/frontend/WORKFLOW_ARCHITECTURE.md`
- `.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md`
- `.codex/R3_PUBLIC_STAFF_BOUNDARY_RECEIPT.md`
- `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md`, `docs/design/FIGMA_BASELINE_REGISTER.md`

## Files Codex MUST NOT treat as current authority

- `.impeccable/design.json` — stale from the pre-cutover v4.1 design; it misreports
  the current oxblood/gold system as drift. Do not tune the design to satisfy it.
- Any design frame or page named `HISTORICAL`, `SUPERSEDED`, or `PROTOTYPE`.
- The `SUPERSEDED_MODEL_CONTRACT` writer/orchestrator records in `.codex` history.
- `docs/design/CODEX_LANDING_REPRODUCTION_*.md` and other pre-R3 handoffs.
- Any claim that a guarded preview is running on 4173 — verified false.
- `DESIGN.md` D24.0 as the *Request* citation — it is the *Lending* precedent.

## Preview

LOCAL_PREVIEW_COMMAND: `npm run dev -- --host 127.0.0.1 --port 5199` with `HAU_PLAYGROUND_PROXY_ORIGIN` unset
LOCAL_PREVIEW_URL: http://127.0.0.1:5199
PREVIEW_GUARD: `vite.config.js` installs the Playground proxy only when `HAU_PLAYGROUND_PROXY_ORIGIN` is set. Leave it unset. LOCAL PREVIEW ONLY — no Playground proxy, no Production.

RESUME_COMMANDS: `git status --short`; `git rev-parse HEAD`; `git rev-list --left-right --count HEAD...@{u}`; `npm run check:agents`; `npm run check:continuation`; `npm run handoff:verify`.

PROHIBITED_ACTIONS: Playground, Production or `main` writes, merges, promotion or deployment; backend/API/auth semantic change; schema or migration; D1/R2 writes; provider writes other than the two canonical design files named by R3-A1; exposing FI-04 staff workspaces; marking any FI-04 surface implementation-verified; touching `.ai-bridge/`; history rewrite, reset, clean or force-push.

NEXT_EXACT_ACTION: Codex adopts the R3-A1 synchronized design into src/frontend/ and the local frontend preview, verifies against the updated Figma Design and Figma Make v40 references, and refreshes the repository Make source mirror to the saved v40 source with recorded hashes; Playground, Production and main remain untouched.

---

## Codex resume block

```text
NEXT_EXECUTOR:
Codex

NEXT_INTENT:
FRONTEND_IMPLEMENTATION

NEXT_OBJECTIVE:
Apply the R3-A1 synchronized Figma Design and Figma Make changes to the
frontend-design-integration implementation and local preview.

READ_FIRST:
AGENTS.md
DESIGN.md
.codex/CURRENT.md
.codex/CURRENT_TASK.md
.codex/CURRENT_HANDOFF.md
docs/frontend/WORKFLOW_ARCHITECTURE.md
.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md
docs/design/FIGMA_MAKE_SOURCE_REGISTER.md
docs/design/FIGMA_BASELINE_REGISTER.md

IMPLEMENTATION_TARGET:
src/frontend/ and the current frontend-owned implementation surfaces only

VISUAL_AUTHORITY:
Figma Design hXJElH4p72KfgAaoUyfNOC current-authority lane
  page 55:3 -> board 568:2 -> R3-A1 block 733:2
  module index 680:13
  page 40 public.request 626:2 / internal Request Hub 300:2
Figma Make rP9W9MQlZkyQrUx38TVsFS at Version 40 (previous 39)
  Saved and verified: 8 files changed, 0 pending edits after reload.
  Public "Start a logistics request" reaches the public Request Center;
  "Staff sign in" reaches a separate staff sign-in page.
  NOTE: the repository mirror output/design/figma-make-source/ is still
  at v39 and must be refreshed to the saved v40 source.

PREVIEW:
local frontend preview only
npm run dev -- --host 127.0.0.1 --port 5199
HAU_PLAYGROUND_PROXY_ORIGIN unset

FORBIDDEN:
Playground
Production
Main
deployment
backend semantic changes
schema/migration
D1/R2 mutation
exposing FI-04 staff workspaces

FIRST_ACTION:
Resolve live HEAD and confirm 0 ahead / 0 behind. Start the local preview.
Implement and confirm the R3-A1 traceability items in priority order,
starting with R3A1-REQUEST-PUBLIC-ENTRY, comparing each against the updated
Figma references. Then refresh output/design/figma-make-source/ from the
saved Figma Make v40 source - read each of the eight changed files verbatim
from the provider rather than assuming the repository src/frontend/ copy is
identical - and record bytes and sha256 per file in
docs/design/FIGMA_MAKE_SOURCE_REGISTER.md.
```
