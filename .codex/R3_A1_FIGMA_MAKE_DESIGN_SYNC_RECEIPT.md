# R3-A1 receipt — Figma / Figma Make design-authority synchronization

DATE: 2026-08-23
EXECUTOR: Claude Code (Opus 5)
AUTHORITY: Earl's R3-A1 owner instruction (2026-08-23) + accepted amendment
`.codex/specs/accepted/2026-08-23-r3-a1-figma-make-design-sync-codex-preview-handoff.md`
STATUS: **IN PROGRESS — MAKE SAVE BLOCKED ON PROVIDER CONNECTIVITY**

This receipt is written mid-pass deliberately, because the Figma Make edits
below exist only as unsaved client-side pending edits at the time of writing.
Recording them here makes them reproducible if that browser state is lost.

## Identity

BASELINE_HEAD: 8ad6333571d25b14ee3c4f4b581358fb39f2ea2f
FRONTEND_BRANCH: frontend-design-integration
FRONTEND_WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
UPSTREAM: origin/frontend-design-integration (0 ahead / 0 behind at baseline)
ACTIVE_WRITER_AT_ENTRY: NONE (WRITER_LOCK RELEASED)
WORKTREE_STATE_AT_ENTRY: clean except preserved untracked `.ai-bridge/`
PLAYGROUND_TOUCHED: NO
PRODUCTION_TOUCHED: NO
MAIN_TOUCHED: NO
BACKEND_TOUCHED: NO
DEPLOYMENT: NONE

## Provider identity resolved live

FIGMA_DESIGN_FILE: `hXJElH4p72KfgAaoUyfNOC`
FIGMA_DESIGN_REACHABLE: YES, by node id.
FIGMA_DESIGN_PAGE_LIST_TRUNCATION: reproduced. A top-level `get_metadata` call
with no `nodeId` returns only `0:1 — 00 — Capture Index`. This is the connector
exposing only the loaded page; it is **not** evidence the file was emptied.
Direct node reads succeed: `568:2` (`AUTHORITY + DESIGN HANDOFF · CURRENT`)
returned its full 14-block subtree, including `691:2` (repository-derived
tracker), `680:11` (module index) and `680:14` naming Make `rP9W9MQlZkyQrUx38TVsFS`.
This confirms the recorded 28-page file is intact.

FIGMA_MAKE_FILE: `rP9W9MQlZkyQrUx38TVsFS`
FIGMA_MAKE_VERSION_AT_ENTRY: **39** (matches the recorded pre-R3-A1 baseline)
FIGMA_MAKE_PENDING_EDITS_AT_ENTRY: **NONE** (no unknown third-party edit existed;
nothing was swept into R3-A1)
FIGMA_MAKE_AUTHENTICATED_AS: Invicta-ctrl / adrianoearl04@gmail.com (pro seat)

## Tooling constraint discovered

`mcp__figma__use_figma` **cannot write Figma Make files**. The tool rejects the
Make file key with: `This tool is not supported for Make files. Supported file
types: Design, Figjam, Slides.` There is therefore no MCP write path to Make.

`mcp__figma__get_design_context` on the Make file *can* read source (205 files
returned as resource links), correcting an earlier assumption that the Figma MCP
cannot read Make source at all.

Make writes were therefore performed through the Make editor's **code view** in
an authenticated browser session. Figma Make **AI credits are exhausted**
("You're out of AI credits… Credits reset Sep 12"), so the AI-prompt path was
unavailable; all edits were made as direct, deterministic code edits, which is
preferable anyway — no AI regeneration of a 205-file project was involved.

## R3 defect reproduced live in Make v39

Before any edit, live Make `src/app/landing/HeroSection.tsx` contained exactly
the FE-R3-001 defect:

```tsx
aria-label="Start a logistics request in the Staff Request Center"
onClick={() => onRequireAuth("request-center")}
```

confirming the R3 receipt's note that "the corrected public CTA destinations
still need reconciling into the live Make source when write authority is
explicit". R3-A1 is that authority.

## Figma Make edits applied (pending save)

Direction of travel per the owner's R3-A1 clarification: the repository
frontend implementation is the verified baseline, and it is synchronized **into**
the design authorities. Each edit below reproduces the corresponding hunk of
repository commit `e30fbff1982beabc98e0b93fdfa6be5250bb919e`.

| Make file | Change | Panel delta |
|---|---|---|
| `src/app/landing/HeroSection.tsx` | drop `AuthRoute` import; drop `onRequireAuth` prop + type; aria-label → "Start a logistics request in the public Request Center. No sign-in needed."; `onRequireAuth("request-center")` → `onNavigate("request")` | +3 −5 |
| `src/app/landing/LandingPage.tsx` | stop passing `onRequireAuth` to `HeroSection` (retained for `LogisticsHubSection`) | −1 |
| `src/app/landing/LogisticsHubSection.tsx` | tile 1 → `route: "request"`, `protected: true` removed, sub → "Say what an activity, office or committee needs. No account needed."; tile 2 sub → "See reusable items and ask to borrow. No account needed." | +2 −2 |
| `src/app/public/Footer.tsx` | drop `AuthRoute` import; drop `onRequireAuth` prop + type; `onRequireAuth("request-center")` → `onNavigate("request")` | +2 −4 |
| `src/app/public/PublicMobileDrawer.tsx` | drop `AuthRoute` import; drop `onRequireAuth` prop + type; `onClose(); onRequireAuth("request-center")` → `onClose(); onNavigate("request")` | +2 −4 |
| `src/app/public/PublicNavbar.tsx` | drop `AuthRoute` import; drop `onRequireAuth` prop + type; stop passing it to `PublicMobileDrawer` | +1 −4 |
| `src/app/AppRouteRenderer.tsx` | `PublicNavbar` and `Footer` no longer receive `onRequireAuth`; `PublicFlows` now receives `onNavigate={navigate}` | +3 −3 |
| `src/app/PublicFlows.tsx` | header comment corrected (the stale "onRequireAuth is retained… for compatibility" paragraph replaced with the accurate generic-sign-in rationale); props `onRequireAuth` → `onNavigate`; type → `(route: "staff-signin") => void`; nav control `onRequireAuth("request-center")` → `onNavigate("staff-signin")` | +6 −6 |

TOTAL: **8 files edited**.

### Deliberate non-change — `src/app/useAppController.ts`

The repository half of FE-R3-002 changes `intendedRoute ?? "overview"` to
`intendedRoute` and gates on `!target || capabilities.includes(target)`.

The live Make prototype has **no counterpart to reconcile**:

- Its `handleSignIn` takes a simulated `outcome: AuthPreviewOutcome`, not real
  credentials, and grants `capabilities: [...AUTH_ROUTES]` — every capability.
- There is **no** `capabilities.includes(target)` check anywhere in the file, so
  there is no capability gate that could deny a valid staff account.
- Only one `?? "overview"` occurrence exists (the repository has two), and it
  feeds `moveTo(target)` directly. Removing the fallback would pass `null` into
  `moveTo()`.

Changing it would invent prototype navigation semantics that no accepted contract
establishes, which R3-A1 §11 forbids. The public/staff boundary half of
FE-R3-002 **is** synchronized, via the `PublicFlows` nav control now navigating
to `staff-signin` instead of calling `requireAuth("request-center")`.

## BLOCKER — Make save not completed

`MAKE_SAVE_STATE`: **PENDING / NOT SAVED**
`MAKE_CURRENT_VERSION`: still **39** — no new version was minted.

Save was invoked on the 8-file changeset. The Save control entered a spinner and
did not complete after roughly three minutes. The Make editor then displayed:

```text
Some changes won't be synced until Figma is able to reconnect.
```

A crossed-out cloud indicator appeared in the Make toolbar. Console output shows
repeated `Failed to fetch` / `status 0` errors, but only against telemetry
endpoints (`figma.com/api/web_logger/*`, `events.statsigapi.net`); these are
blocked-analytics noise rather than the save API itself. The operative fact is
Figma's own realtime sync reporting itself unable to reconnect.

This is an external provider connectivity failure, not an authority, permission,
or content problem. It matches R3-A1 §37's stop condition for a provider
operation that cannot be safely completed.

### Preservation decision

The 8 files of edits exist **only as client-side pending edits** in the open Make
browser tab. The tab was therefore deliberately left open and untouched:

- The tab was **not** reloaded, navigated away from, or closed.
- **Discard was not clicked.**
- No further Make edits were attempted while sync was down.

Reloading would have destroyed the changeset. The table above exists so the edit
set is reproducible from the repository alone if that browser state is lost.

### Required next action on Make

1. Return to the open Make tab once Figma sync reconnects and confirm the pending
   edits are still listed (8 files, deltas as tabulated).
2. Press Save and wait for a real version bump.
3. Reload the project and verify `PENDING_EDITS = 0` and the new version number.
4. Re-read and re-hash the 8 changed provider files.
5. Exercise the prototype: public "Start a logistics request" must reach the
   public Request Center, and "Staff sign in" must remain a separate staff entry.
6. Record the real new version in
   `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md` (PREVIOUS_VERSION = 39).

If the pending edits were lost, re-apply the table above; it is a complete and
sufficient description of the changeset.

## Not yet performed in this pass

These R3-A1 deliverables remain open and are **not** claimed as done:

- Figma Design current-authority documentation and visual-reference reconciliation
  (§5–§7), and its readback (§29).
- Repository Make source mirror refresh and hash register (§12–§13).
- `DESIGN.md` authority rewrite (§14).
- `.impeccable/design.json` refresh and the post-sync Impeccable/Hallmark
  audits (§15–§16, §32).
- Branch-wide documentation inventory, classification and reconciliation
  (§17–§20, §28) and the reconciliation manifest (§33).
- Design-to-code traceability map (§25).
- Codex adoption handoff and `.codex` CURRENT/TASK/HANDOFF updates (§21–§22, §40).

## Scope fence held

PLAYGROUND_TOUCHED: NO
PRODUCTION_TOUCHED: NO
MAIN_TOUCHED: NO
BACKEND_SEMANTIC_CHANGE: NO
SCHEMA_OR_MIGRATION: NO
D1_OR_R2_WRITE: NO
DEPLOYMENT: NONE
OTHER_PROVIDER_WRITE: NONE
`.ai-bridge/`: preserved untouched
