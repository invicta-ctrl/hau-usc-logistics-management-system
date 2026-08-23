# R3-A1 receipt — Figma / Figma Make design-authority synchronization

DATE: 2026-08-23
EXECUTOR: Claude Code (Opus 5)
AUTHORITY: Earl's R3-A1 owner instruction (2026-08-23) + accepted amendment
`.codex/specs/accepted/2026-08-23-r3-a1-figma-make-design-sync-codex-preview-handoff.md`
STATUS: **PROVIDER SYNCHRONIZATION COMPLETE AND VERIFIED — repository mirror refresh outstanding**

## Identity

BASELINE_HEAD: 8ad6333571d25b14ee3c4f4b581358fb39f2ea2f
FRONTEND_BRANCH: frontend-design-integration
FRONTEND_WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
UPSTREAM: origin/frontend-design-integration (0 ahead / 0 behind at baseline)
ACTIVE_WRITER_AT_ENTRY: NONE (WRITER_LOCK RELEASED)
WORKTREE_STATE_AT_ENTRY: clean except preserved untracked `.ai-bridge/`
REPOSITORY_IMPLEMENTATION_BASELINE: `e30fbff` (R3 public-entry repair)
PLAYGROUND_TOUCHED: NO
PRODUCTION_TOUCHED: NO
MAIN_TOUCHED: NO
BACKEND_TOUCHED: NO
DEPLOYMENT: NONE

## Direction of synchronization

Per Earl's R3-A1 clarification, the repository frontend implementation at
`e30fbff` is the verified baseline. R3-A1 synchronizes that truth **into** the
design authorities — it does not re-litigate the R3 repair.

## Figma Design — `hXJElH4p72KfgAaoUyfNOC`

FIGMA_DESIGN_WRITE: **AUTHORIZED AND PERFORMED**
FIGMA_DESIGN_PAGES: 28, re-verified live.

### Connector truncation, resolved (do not reopen)

`get_metadata` with no `nodeId` returns only `0:1 — 00 — Capture Index`. That is
the connector exposing a single loaded page; it is **not** evidence the file was
emptied. `use_figma` enumerates all 28 pages and direct node reads resolve
normally.

### Nodes updated

| Node | Change |
|---|---|
| `733:2` (`733:3` heading, `733:4` body) | **New** R3-A1 public/staff workflow authority block, inserted at index 2 of board `568:2` on page `55:3`. Cloned from an existing block so it inherits the board's variable-bound fills, strokes and type ramp. |
| `568:4` | Board freshness line reconciled to R3-A1 / 2026-08-23. |
| `680:13` | Module index: `Public Request` → **Public Request Center**, PUBLIC, NO STAFF LOGIN REQUIRED. `Staff Request Center` → **Internal Request Hub**, INTERNAL, STAFF SESSION REQUIRED, capability-gated, DESIGN AUTHORITY / READY FOR FI-04, not implementation-verified. |
| `680:16` | Two dangling repository pointers repaired — `docs/design/CODEX_FRONTEND_DESIGN_HANDOFF.md` and `prototypes/impeccable-whole-site-redesign-v5/` do not exist on this branch. Repointed to `.codex/CURRENT_HANDOFF.md` and this receipt. |
| `300:2` | Page 40 internal workbench renamed to the internal Request Hub with INTERNAL / STAFF SESSION REQUIRED / READY FOR FI-04 labelling. |
| `568:2` | Board height grown to fit the new block. |

FIGMA_DESIGN_READBACK: **PASS.** A full text scan of board `568:2` returns
**zero** remaining `Staff Request Center` strings. Blocks `733:2` were
screenshotted after creation and after correction.

### Left untouched, deliberately

Page 40's CURRENT frames were already correct (`626:2` `public.request`, `624:2`
`portal.request`). CURRENT landing frames `411:2` and `411:2571` already show
"Start a logistics request", "Track a request" and a separate "Staff sign in";
no copy change was needed. The 200 landing matches for "Staff sign in" are in
`HISTORICAL` frames `275:*` / `277:*` and were **not** rewritten.

## Authority correction of record

`.codex/R3_PUBLIC_STAFF_BOUNDARY_RECEIPT.md` cites `DESIGN.md` **D24.0** as the
OWNER-LOCKED authority for the public **Request** Center. That is a
misattribution. Recovered from history, D24.0 is
*"Public Lending Center access model — OWNER-LOCKED, BINDING"*; D23.0 covers the
internal Request Center, gated on `request.review`.

The correct authority for public Request being no-login is:

- `D06 — Product / Route Inventory`: `/request` = *Public request intake*;
- production `public-requester-portal.js` at `0.8.2 / c316e047` containing **no
  session check, no sign-in gate and no authorization branch**
  (`ACCESS_MODEL_DRIFT` / `PL-01` in the parity audit);
- the accepted `/api/public/request` Worker contract.

D24.0 remains the correct **analogous precedent** for Lending. The historical
receipt is preserved unedited; `DESIGN.md`, `docs/frontend/WORKFLOW_ARCHITECTURE.md`
and the Figma authority block carry the correction.

## Figma Make — `rP9W9MQlZkyQrUx38TVsFS`

FIGMA_MAKE_PREVIOUS_VERSION: **39**
FIGMA_MAKE_CURRENT_VERSION: **40**
MAKE_PENDING_EDITS_BEFORE: **NONE** — verified on open, so no unknown third-party
edit existed and nothing was swept into R3-A1.
MAKE_PENDING_EDITS_AFTER: **0** — verified after a full page reload.
MAKE_FILES_CHANGED: **8**
MAKE_VERSION_LABEL: the provider labelled the save "8 edited files — Version 40".

### Tooling constraints discovered

`mcp__figma__use_figma` **cannot write Figma Make files** — it rejects the Make
key with "This tool is not supported for Make files. Supported file types:
Design, Figjam, Slides." There is no MCP write path.

`mcp__figma__get_design_context` with `nodeId "0:1"` **can read** Make source
(205 files as resource links). An earlier repository note claiming no MCP tool
reads a `/make/` URL was wrong and is corrected in the source register.

Figma Make **AI credits are exhausted** ("Credits reset Sep 12"), so the
AI-prompt path was unavailable. All edits were therefore made as direct,
deterministic code edits in the Make editor's code view — preferable regardless,
since no AI regeneration of a 205-file project was involved.

### The changeset

Each edit reproduces the corresponding hunk of repository commit `e30fbff`.

| Make file (`src/app/`) | Change | Delta |
|---|---|---|
| `landing/HeroSection.tsx` | drop `AuthRoute` import; drop `onRequireAuth` prop + type; aria-label → "Start a logistics request in the public Request Center. No sign-in needed."; `onRequireAuth("request-center")` → `onNavigate("request")` | +3 −5 |
| `landing/LandingPage.tsx` | stop passing `onRequireAuth` to `HeroSection` (retained for `LogisticsHubSection`) | −1 |
| `landing/LogisticsHubSection.tsx` | tile 1 → `route: "request"`, `protected: true` removed, sub → "Say what an activity, office or committee needs. No account needed."; tile 2 sub → "See reusable items and ask to borrow. No account needed." | +2 −2 |
| `public/Footer.tsx` | drop `AuthRoute` import; drop `onRequireAuth` prop + type; `onRequireAuth("request-center")` → `onNavigate("request")` | +2 −4 |
| `public/PublicMobileDrawer.tsx` | drop `AuthRoute` import; drop `onRequireAuth` prop + type; `onClose(); onRequireAuth("request-center")` → `onClose(); onNavigate("request")` | +2 −4 |
| `public/PublicNavbar.tsx` | drop `AuthRoute` import; drop `onRequireAuth` prop + type; stop passing it to `PublicMobileDrawer` | +1 −4 |
| `AppRouteRenderer.tsx` | `PublicNavbar` and `Footer` no longer receive `onRequireAuth`; `PublicFlows` now receives `onNavigate={navigate}` | +3 −3 |
| `PublicFlows.tsx` | stale header paragraph replaced with the accurate generic-sign-in rationale; props `onRequireAuth` → `onNavigate`; type → `(route: "staff-signin") => void`; nav control → `onNavigate("staff-signin")` | +6 −6 |

### Deliberate non-change — `src/app/useAppController.ts`

The repository half of FE-R3-002 changes `intendedRoute ?? "overview"` to
`intendedRoute` and gates on `!target || capabilities.includes(target)`.

The live Make prototype has **no counterpart to reconcile**: its `handleSignIn`
takes a simulated `outcome: AuthPreviewOutcome`, grants
`capabilities: [...AUTH_ROUTES]` — every capability — and contains **no**
`capabilities.includes(target)` check at all. Only one `?? "overview"` exists
(the repository has two) and it feeds `moveTo(target)` directly, so removing the
fallback would pass `null` into `moveTo()`.

Changing it would invent prototype navigation semantics that no accepted contract
establishes, which R3-A1 §11 forbids. The public/staff boundary half of
FE-R3-002 **is** synchronized, via `PublicFlows` navigating to `staff-signin`.

### Save incident — recovered

The first save attempt did not complete. Figma showed a disconnected-cloud
indicator and the message *"Some changes won't be synced until Figma is able to
reconnect."* Console output showed `Failed to fetch` / `status 0` errors, but only
against telemetry endpoints (`figma.com/api/web_logger/*`,
`events.statsigapi.net`) — blocked-analytics noise, not the save API.

During that window the changeset existed **only as client-side pending edits**.
The tab was therefore deliberately left open: not reloaded, not navigated away
from, and **Discard was never clicked**. The changeset table above was written to
the repository first, so the work was reproducible even if the browser state were
lost.

Figma subsequently reconnected and the save completed on its own. Verified after
a full reload: Version 40, no pending-edit panel, version history entry
"8 edited files — Version 40".

### Behavioural verification — PASS

Exercised in the live prototype after reload:

- **Public path.** "Start a logistics request" → **"PUBLIC REQUEST · NO SIGN-IN —
  Request Center"**, carrying *"No account and no sign-in needed … You do not need
  a HAU-USC Logistics account, staff sign-in, activation, or approval to submit."*
  It does **not** land on the staff sign-in wall.
- **Staff path.** "Staff sign in →" → a separate **Staff sign in** page,
  *"Access the logistics workspace. The authorized account record determines what
  you can view and do."*

This is the mandatory R3-A1 §10 result:

```text
public visitor -> Start a logistics request -> PUBLIC REQUEST CENTER
Staff Sign In  -> authenticated staff entry (separate)
```

### Source readback

`src/app/landing/HeroSection.tsx` was re-read from the provider after the save
and is byte-identical to the repository file
`src/frontend/app/landing/HeroSection.tsx` except Make's omitted terminal newline
— the same convention `docs/frontend/FIGMA_MCP_TRUNCATION_RECOVERY.md` already
records. Provider sha256 (no terminal newline):
`556327163556ce208a0ffbc66eaa2eba8ac6a15ac31541d32e747cb88f6c153a`.

## Outstanding — repository Make mirror

`output/design/figma-make-source/` still holds the **v39** state; its
`src/app/landing/HeroSection.tsx` still contains
`onClick={() => onRequireAuth("request-center")}`.

R3-A1 §12 requires `LIVE MAKE SAVED SOURCE == REPOSITORY ADOPTED SOURCE
IDENTITY`. That refresh is **not done** and is the next mechanical step:

1. For each of the 8 files above, read
   `file://figma/make/source/rP9W9MQlZkyQrUx38TVsFS/<path>` via
   `get_design_context` + `ReadMcpResourceTool` and write it verbatim into
   `output/design/figma-make-source/<path>`.
2. Do **not** assume the repository `src/frontend/` copy is identical — it is for
   `HeroSection.tsx`, but `LandingPage.tsx`, `LogisticsHubSection.tsx` and
   `PublicFlows.tsx` differ in formatting and in `PublicFlows`'s header comment.
3. Record bytes and sha256 per file in
   `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md` §1 and add a successor baseline to
   `docs/design/FIGMA_BASELINE_REGISTER.md`.

## Also outstanding

- `.impeccable/design.json` refresh and the post-sync Impeccable / Hallmark
  audits (R3-A1 §15, §16, §32) — FE-R3-010 / FE-R3-011.
- `docs/frontend/R3_A1_DOCUMENTATION_RECONCILIATION_MANIFEST.md` (§33).
- A visual workflow diagram for the shared canonical request (§5); the model is
  currently documented in prose in block `733:2` and in `DESIGN.md`.

## Scope fence held

PLAYGROUND_TOUCHED: NO
PRODUCTION_TOUCHED: NO
MAIN_TOUCHED: NO — `main` remains `f7e5bf8`
BACKEND_SEMANTIC_CHANGE: NO
SCHEMA_OR_MIGRATION: NO
D1_OR_R2_WRITE: NO
DEPLOYMENT: NONE
OTHER_PROVIDER_WRITE: NONE
`.ai-bridge/`: preserved untouched
