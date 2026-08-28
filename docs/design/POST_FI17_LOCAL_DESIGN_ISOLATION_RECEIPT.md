# POST-FI17 local design isolation receipt

```text
PROGRAM: POST-FI17-DESIGN-ISOLATION-01
STATUS:  COMPLETE — owner review pending
DATE:    2026-08-28 (Asia/Manila)
MODE:    EXECUTE — isolated local design lane
```

## Execution environment — read this before reading the isolation claims

This pass did **not** run on the workstation that hosts the FI/FM lane. It ran
in a Claude Code remote session: an ephemeral cloud container holding a fresh
clone of `invicta-ctrl/hau-usc-logistics-management-system`.

That changes the *nature* of the isolation evidence, so it is stated plainly
rather than dressed up as a worktree-level proof:

- The FI/FM worktree recorded in `.codex/CURRENT.md` is
  `D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration`
  — a Windows path on Earl's machine. **It does not exist in this container.**
- The FI/FM branch `frontend-design-integration` **is not present in this
  container.** The only refs here are
  `release/v0.8.3-frontend-design-integration` and its `origin` remote.
- No Node, Vite, or Wrangler process was running at session start, and nothing
  was listening on any port.

So FM writes were not merely avoided, they were **structurally impossible**:
there is no FM branch, worktree, process, artifact, or pointer in this
container to write to. Every FM protection below is satisfied by absence, and
that is a stronger guarantee than restraint — but it is a *different* guarantee
than the prompt assumed, and it is recorded as such.

### Lane naming

The directive says FM-13 → FM-17. The repository's own records say **FI-13 →
FI-17**, and `.codex/CURRENT.md` shows `R1_FI14_ISOLATED_PLAYGROUND_DEPLOYMENT_ACCEPTANCE`
/ `FI14_RUNNER_RECOVERY__ACTIVE` as the live slice. They are read as the same
protected program throughout this receipt.

## Source snapshot

```text
SOURCE_BRANCH: release/v0.8.3-frontend-design-integration
SOURCE_SHA:    06836f3ec6e1ab9c6990c517fb870ef0a582b2dc
               ("fix(ci): derive playground schema acceptance")
SOURCE_TREE:   efef653906fe0ff0df28726eaa1b5885b9443b46
```

**The checkpoint named in the directive was not reachable.** `3da03dcc78caafe144afbe02fc09197979bce0a3`
and tree `4d9c6f40625fd738530e22347597ead1ce787017` are not objects in this
clone (`git cat-file -t` → `could not get object info`). Per the directive's own
"Reverify … use the latest clean, accepted post-FI17 owner-review-ready
checkpoint", the branch HEAD present in this container was used instead. Its
identity is recorded above so the substitution is auditable rather than silent.

## Design lane

```text
DESIGN_BRANCH:   local/post-fi17-design-pass-20260828
DESIGN_WORKTREE: /home/user/worktrees/post-fi17-local-design-pass
DESIGN_START_SHA: 06836f3ec6e1ab9c6990c517fb870ef0a582b2dc
DESIGN_END_SHA:   3bf734ada501c8c2ea7b12a9eafc707af67d61b1
DESIGN_END_TREE:  45d14252477ec4bedcb756473edd2e80db0b9d9a
```

`DESIGN_END_SHA` is the last code/artifact commit; the commit adding this
receipt follows it. Six commits in total:

```text
b6c6bb7  design(foundation): declare the type ramp the system never had
00677a1  design(landing): stop saying nothing twice, and ship the canonical gold
9583850  design(operations): mount the overview that was never wired, and make state legible
3fa2bd7  design(responsive): give inventory and lending back the space they need
3bf734a  chore(design): regenerate the tracked frontend artifacts
(+ this receipt)
```

Created with `git worktree add -b`, so the lane has its own working tree,
its own `node_modules` (`npm ci` run only inside it), its own `dist`, and its
own preview process. Nothing is shared with the primary checkout except the
object database, which is append-only.

## Protection set

```text
PROTECTED_FM_BRANCHES:     frontend-design-integration          NOT PRESENT IN CONTAINER
PROTECTED_FM_WORKTREES:    D:/Documents/Codex/.../frontend-design-integration
                                                                NOT PRESENT IN CONTAINER
PROTECTED_FM_PORTS:        4173                                 NOT BOUND BY THIS TASK
PROTECTED_FM_PROCESSES:    NOT_DIRECTLY_OBSERVABLE (different machine)
PROTECTED_FM_ARTIFACT_PATHS: dist/, .wrangler/, playground-report/, test-results/
                                                                FM copies NOT PRESENT
PROTECTED_FM_POINTER_FILES: .codex/CURRENT.md, .codex/CURRENT_TASK.md,
                            .codex/CURRENT_HANDOFF.md           READ ONLY, NOT WRITTEN
PROTECTED_SHARED_RESOURCES: origin remote                        ONLY THE NEW DESIGN
                                                                BRANCH PUSHED (see below)
```

### Verification

```text
FM_HEAD_BEFORE:  NOT_DIRECTLY_OBSERVABLE (FM HEAD lives on Earl's workstation)
FM_HEAD_AFTER:   NOT_DIRECTLY_OBSERVABLE

SOURCE_LANE_HEAD_BEFORE: 06836f3ec6e1ab9c6990c517fb870ef0a582b2dc
SOURCE_LANE_HEAD_AFTER:  06836f3ec6e1ab9c6990c517fb870ef0a582b2dc   (unmoved)
SOURCE_LANE_STATUS_BEFORE: clean
SOURCE_LANE_STATUS_AFTER:  clean                                   (git status --porcelain empty)

FM_PROTECTED_PORT: 4173 — never bound. Corroborated independently: during the
  full test run the repository's OWN preview supervisor reported
  `STOP_PORT_4173_OWNERSHIP_UNKNOWN` and refused to claim the port, which is
  direct evidence that this task holds no ownership of it.

FM_PROCESS_INTERRUPTION_COUNT:        0   (no process was stopped, killed or restarted)
FM_FILES_WRITTEN_BY_THIS_TASK:        0
FM_COMMITS_CREATED_BY_THIS_TASK:      0
FM_BRANCH_POINTER_MOVES_BY_THIS_TASK: 0
FM_CONTINUITY_WRITES_BY_THIS_TASK:    0
FM_ARTIFACTS_REPLACED_BY_THIS_TASK:   0
FM_PROVIDER_WRITES_BY_THIS_TASK:      0
```

## Runtimes

```text
PROTECTED_EXISTING_PREVIEW: 127.0.0.1:4173 — not present in this container,
                            not bound, not probed for takeover
DESIGN_PREVIEW:             http://127.0.0.1:4174/
DESIGN_PREVIEW_PORT:        4174 (vite --strictPort, so a collision would have
                            failed loudly rather than silently relocating)
```

4174 is not an arbitrary choice: `playwright.frontend.config.js` already treats
4174 as the local frontend port and 4173 as the supervisor-owned one, so the
directive's port split matches the repository's existing convention.

## Design authority consulted

```text
Earl's directive (this prompt)          READ
AGENTS.md                               READ
.agents/PROJECT_POLICY.md               READ
.codex/CURRENT.md                       READ ONLY — proved lane separation
DESIGN.md                               READ + AMENDED (type ramp, see below)
Frontend source and tests               READ + AMENDED
```

```text
FIGMA_MAKE_READ:   NOT PERFORMED — see below
FIGMA_DESIGN_READ: NOT PERFORMED — see below
FIGMA_WRITES:      ZERO
```

**Figma was not read, and the design decisions below were not calibrated
against it.** The directive asked for inspection through the authenticated
browser route and the Figma MCP tools. This session has no authenticated Figma
browser session, and reaching the two files would require credentials this lane
was not granted. Rather than claim a calibration that did not happen, the pass
was driven from the authorities that *are* in the repository: `DESIGN.md`, the
canonical token source in `theme.css` (including its explicit record of which
gold values are superseded), and the shipped frontend itself.

Consequence for review: every decision below is defensible against the
repository's own design system, but **none of it has been checked against the
current Figma Make or Figma Design lanes.** A Figma calibration pass remains
outstanding and is listed under residuals.

## What was found

The pass began with a route-by-route inspection at 1440 and 390. Four findings
were structural rather than cosmetic:

1. **`overview` was dead.** `OverviewRoute.tsx` (185 lines) and roughly 470
   lines of `.command-*` CSS were fully built and referenced by **nothing** —
   `grep` for `OverviewRoute` outside its own file returned zero hits. The
   route therefore fell through to `AuthPlaceholderRoute`, so the **first item
   in the authenticated sidebar and the default landing surface of the entire
   hub** told every operator "This workspace route is reserved and has not yet
   been built", under a lowercase `overview` heading (the route key itself,
   because `AUTH_PLACEHOLDER_LABELS` has no `overview` entry).

2. **The landing's most common state printed itself twice.** `CurrentSection`
   rendered the identical `statusCopy[state]` sentence in both the figure and
   the article whenever there was no announcement — two equal-weight cards, one
   a 220px oxblood slab, both saying "There are no published announcements
   right now."

3. **The public landing shipped the superseded gold.** `LogisticsHubSection`
   carried its entire palette as inline literals including `#e8b93c` and
   `rgba(242,209,92,…)` — precisely the two values `theme.css` names as the
   pre-canonical Make palette that the owner-locked `#d4af37` replaced. The
   canonical override could not reach it because the section never consumed a
   variable.

4. **The type ramp debt was larger than recorded.** `DESIGN.md` said the system
   had no fontSize steps and listed ten ad-hoc literals. The actual count is
   **262 inline `fontSize` literals across seventeen distinct values**
   (7,8,9,10,11,12,13,14,15,16,17,18,20,22,24,26,28px) plus twelve more in CSS,
   including an 8.8px landing path marker.

## Design decisions

| # | Surface | Decision | Disposition |
|---|---|---|---|
| D1 | Design system | Nine-step role-named type ramp (`--type-record-xs` … `--type-title-lg`) plus two fluid display steps and four line-height companions, declared in `theme.css` and in `DESIGN.md`'s machine-readable block. Namespaced `--type-*` so it cannot collide with Tailwind's `--text-*`, which `@layer base` still resolves `h1`–`h4`/`label`/`button`/`input` through. Floor of 0.625rem/10px with nothing below it. | EVOLVE |
| D2 | Design system | `styles/index.css` converted wholesale: 37 declarations, zero numeric `font-size` literals remaining. The 8.8px path marker became 10px and its carrier circle grew 1.35rem → 1.5rem. | REFINE |
| D3 | Landing · Current | Empty/error state collapsed from two duplicate cards to one panel held to 58rem, carrying a semantic left rule. The three unpopulated states keep distinct wording, and the two non-error states say plainly that logistics services are unaffected. Split layout retained only for the populated state. | EVOLVE |
| D4 | Landing · Hero | `.atrium__secondary-paths` was `repeat(3, minmax(0,auto))` for two children, parking a phantom column between "Track lending" and "Staff sign in". Now a wrapping flex row. | MATCH |
| D5 | Landing · Logistics hub | Retokenized onto the canonical palette; gold is now `#d4af37`. Four equal-weight tiles became one dominant primary plus a three-up secondary row, because starting a request is why the surface exists. Standing line moved beneath the heading it qualifies instead of being pinned to the far right. | EVOLVE |
| D6 | Overview | Mounted into the **local inspection lane only**. See the note below. | EVOLVE |
| D7 | Overview | Flat mono run ("14 open requests · 9 loans out · 6 awaiting release · 2 below threshold" — four unrelated numbers at identical weight) replaced by a three-figure standing band weighted by how much each should interrupt you: blocked / ready / in flight. Answers "what is blocked" and "what is ready" at a glance. | EVOLVE |
| D8 | Overview | Title changed from "Glass operations command table" — a design-system name — to "What needs attention today". "Operational pulse" → "What changed". "Ledger topology" → "Where the ledger stands". | REJECT_REFERENCE_DETAIL |
| D9 | Overview | Ledger topology redrawn from a 3-column grid of six equal boxes into a single spine with stage markers, so the sequence is depicted rather than left for the reader to infer. Selecting a path step still lights the stage it acts on. | EVOLVE |
| D10 | Overview | Reconciliation collapsed from three padded rows each ending in an identical "Reconciled" pill into one verdict line plus a figures row, with a `data-state="discrepancy"` branch so a mismatch would break out rather than hide in a third pill. Removes a fake-dashboard block. | EVOLVE |
| D11 | Release | Status pills were uniform neutral chrome, making "Ready to release", "Partially released" and "Released" visually interchangeable — on the one surface whose job is to make the next safe action obvious. Now semantically coloured via `data-state`: gold = act, neutral = in progress, green = done. | EVOLVE |
| D12 | Release | 9px seven-step procedure rail raised to 10px and de-boxed to hairline rules. | REFINE |
| D13 | Administration | Seven sections in a `repeat(3,1fr)` grid of filled boxes — an equal-weight card wall that stranded "System status" alone on a third row and made the active section a solid oxblood slab — replaced by a single wrapping tab rail with a gold underline indicator. Privileged sections now read calm and deliberate rather than shouted. | EVOLVE |
| D14 | Administration | Route-local palette (`#fffdf8`, `#fff`, `#f7f0e2`, `#241416`, `#6f5a60`, `#e6dcc9`, `#6f1624`, `#a77417` and a parallel dark set) retokenized onto the canonical variables — the same class of drift `DESIGN.md` records against `RequestCenterRoute`. | REFINE |
| D15 | Inventory | The seven-column table switched in at `< 768` — exactly the width where it stops fitting (738px inside a 702px scroller), and the 36px that overflowed were the LENDING status column. Switch moved to `< 1024`, where the table measures 882px inside 882px; below that the card layout, built for this case, states every field explicitly. | REFINE |
| D16 | Lending | The route carried **no page gutter at all**: all four children of `<main>` ran flush from the sidebar edge to the window edge, which is why the fixture card read as escaping the layout and why the `h1` sat outdented from its own panels. Its `overflow-x-hidden` meant this never surfaced as a document overflow — it was clipped silently. Matched to the gutter the other operational routes use. Also fixed: heading column had no `min-w-0` against a `min-w-64` aside, so the header row overflowed and the fixture card landed on the `h1`; and the lifecycle column was too narrow for its own longest option, rendering "All loaded stat". | REFINE |

### Note on D6 — mounting Overview

`OverviewRoute` was mounted in `PreviewInspectionRoute` (the local inspection
lane) and **deliberately not** in `AppRouteRenderer` (the production-bound
path). The preview registry already classifies `overview` as
`SURFACE_PREVIEW` / `VISUAL_ONLY`, and the surface labels its own fixtures
("design fixtures, not production records"), so this stays inside what the
registry already declares. Mounting it in the live app would have started
showing fixture data on an authenticated production route as a side effect of a
design pass, which is not a design decision to make unilaterally.

It also now takes a presentational `operator: string` rather than a `Session`.
The preview lane is emphatic that it creates no authenticated session, and this
surface needs a name to print, not an authority object.

**This is the decision most worth Earl's attention**, because it is the one that
changes what a route renders.

## Figma deviations

```text
FIGMA_DEVIATIONS: NOT ASSESSED — Figma was not read this pass (see above).
```

Every decision above is a deviation from *something* only in the sense that it
departs from the shipped snapshot; whether any of it departs from the current
Figma lanes is unknown and must be settled by a later calibration pass.

## Verification

```text
TESTS:        npm test — 156 files, 1164 passed, 1 skipped, 0 failed
LINT:         npm run lint:release-candidate — 0 errors, 2 warnings
              (both pre-existing, in files this pass did not touch)
BUILD:        npm run build — 1675 modules, dist/index.html 797.52 kB
DIST_VERIFY:  npm run verify:dist — deterministic artifact verified
DESIGN_TRACKER: npm run design:tracker:check — derived block current
BROWSER:      15 routes × {320, 390, 768, 1024, 1440} = 75 captures, plus
              dark and reduced-motion passes over the six changed routes.
              Automated per capture: document horizontal overflow, console
              errors, page errors. Result: 0 findings on every pass.
CONTRAST:     npm run design:contrast — 66/66 pass, 0 failures
              plus a targeted audit of the 11 colour pairs this pass
              introduced (the fixed audit does not cover them):
              0 failures in light and dark
ACCESSIBILITY: type floor raised to 10px system-wide; existing focus-visible,
              reduced-motion, reduced-transparency and backdrop-filter
              fallbacks preserved and re-verified
```

### Note on the contrast measurement

Two intermediate measurement attempts reported failures on the new Overview
figures that were **artifacts of the measuring script, not the design**: the
new backgrounds compute to `oklch()`, and both a naive numeric regex and
`canvas.fillStyle` normalisation mis-read them (the regex treated an L of
`0.868` as a red channel; canvas silently declined to parse `oklch` and left
the previous fill). The figures reported here come from a third pass that
implements OKLCH→sRGB properly and composites alpha up the ancestor chain.

The tightest real value is the critical numeral at **3.52:1**. It is 31px
display bold, so 3:1 applies and it passes — but it is the narrowest margin
introduced here and is the first thing to re-check if the ground token moves.

### Automated browser matrix

```text
routes:  landing, borrow, tracking, staff-signin, external-request,
         overview, inventory, request-center, lending, release,
         restocking, procurement, events, administration, profile
widths:  320, 390, 768, 1024, 1440
passes:  light (all 15) · dark (6 changed) · reduced-motion (2)
findings: 0
```

Public routes were driven by clicking, because the app carries no URL router;
authenticated surfaces were rendered through `PreviewInspectionRoute` in a
throwaway local harness (see below).

### Pre-existing condition, not introduced here

`npm run design:theme:check` reports `hau-theme.css is stale`. This was
confirmed to fail **identically on the pristine source snapshot** (checked by
stashing this lane's changes and re-running), so it is inherited from the
checkpoint and was deliberately left alone: regenerating it writes a generated
Figma-Make artifact that the FI/FM lane may be mid-flight on.

## How the authenticated surfaces were inspected, without taking 4173

`localPreviewInspectionAllowed()` gates the in-app Preview Index inspection on
`location.port === '4173'` — which is exactly the port this directive protects.
That gate is a deliberate security boundary and was **not** weakened, and 4173
was **not** bound.

Instead, a throwaway harness (`src/design-harness.html` + `.jsx`) mounted
`PreviewInspectionRoute` directly on 4174 for the duration of the pass. It was
never committed, never referenced by any entry point, and was deleted before
the final build; `git log --all --name-only | grep design-harness` returns
nothing, and the post-deletion rebuild reproduces the identical artifact hash
(`c2b10e1d038475db…`), which confirms it never reached the bundle.

Consequence for review: reaching these surfaces at 4174 requires re-creating
that harness, or running the app on 4173 as the repository intends. The
inspection gate is unchanged.

## External state

```text
PRODUCTION_WRITES: ZERO
PLAYGROUND_WRITES: ZERO
D1_WRITES:         ZERO
R2_WRITES:         ZERO
GOOGLE_WRITES:     ZERO
PROVIDER_WRITES:   ZERO
MIGRATIONS:        ZERO
FM_WRITES:         ZERO
MAIN_WRITES:       ZERO
FIGMA_WRITES:      ZERO
PUSHES:            ONE — `local/post-fi17-design-pass-20260828` only,
                   on Earl's explicit authorization, because the container
                   holding it is ephemeral. It is a new ref: not FM, not main,
                   not `frontend-design-integration`. No existing pointer moved.
```

No provider credential was used, requested, or required. The design preview ran
entirely on local fixtures, with `/api/*` responses stubbed at the browser layer
during inspection exactly as `tests/e2e/preview-index.spec.js` already does.

## Known residuals

1. **Figma calibration outstanding.** The largest gap in this pass. Nothing here
   has been checked against Figma Make `rP9W9MQlZkyQrUx38TVsFS` or Figma Design
   `hXJElH4p72KfgAaoUyfNOC`.
2. **Type ramp adoption is partial by design.** `styles/index.css` is fully
   converted. The 262 inline literals inside route components are not
   mechanically rewritten — that is churn with real regression risk and it would
   enlarge the surface that has to reconcile with FI/FM later. Routes should
   adopt the ramp as they are redesigned.
3. **Dead atrium CSS remains.** `.atrium__identity`, `.atrium__path`,
   `.atrium__service-plane`, `.atrium__council-*`, `.atrium__plane-*` and
   `.atrium__open` (~150 lines) have zero markup referencing them; the hero
   composition they were written for was removed, which is why the hero's right
   half is empty at ≥60rem. Left in place rather than deleted, because deleting
   or restoring it is a composition decision for Earl, not a cleanup.
4. **Inline palettes remain in other routes.** `RequestCenterRoute` (already
   recorded in `DESIGN.md`), `SupplyRoutes`, `InternalLendingHub` and
   `InternalRequestHub` still carry route-local literals.
5. **Redundant fixture notices.** Lending, Release and Administration each show
   two or three separate "this is a fixture / not production data" notices in
   one viewport. The *overlap* on Lending is fixed (D16), but the redundancy is
   not: consolidating them is a content decision across three routes and was
   left alone.
6. **Route headings disagree on face.** Lending sets its `h1` in Newsreader
   (the editorial/wordmark face) while Inventory, Release, Administration and
   the Request Hub use Bricolage (the display face). One of them is wrong.
   Deliberately not changed: `fi12-convergence.spec.js` exists precisely to
   police cross-surface convergence, the FI-07 lending pass may have chosen the
   serif on purpose, and without Figma this pass cannot say which is intended.
7. **`hau-theme.css` stale** — inherited, see above.
8. **Overview is not mounted in the production-bound renderer** — intentional,
   see D6. Wiring it live is an owner decision.
9. **Hero right half is empty at ≥60rem.** Related to residual 3: the stage is a
   12-column grid whose only occupant spans six. It currently reads as a poster
   hero, which is defensible, but it is an accident rather than a decision.

## Next action

```text
1. Earl reviews this lane at http://127.0.0.1:4174/ (re-run `npx vite --port 4174
   --strictPort` inside the design worktree; the container that produced this
   receipt is ephemeral).
2. Decide D6: should `overview` mount in the live authenticated app?
3. Decide residual 3: restore or delete the dead atrium composition.
4. Authorize a Figma calibration pass with browser/MCP access.
5. AFTER FI-17 closes, run a separate owner-authorized reconciliation task.
   This lane must NOT be merged automatically.
```

**This branch was pushed, once, on Earl's explicit authorization during the
session.** The directive's default is not to push; that default was overridden
deliberately because this pass ran in an ephemeral container and the six
commits would otherwise have been destroyed when it was reclaimed.

What was pushed is a **new ref only** — `local/post-fi17-design-pass-20260828`.
No existing branch pointer moved. `frontend-design-integration` was not
written, `release/v0.8.3-frontend-design-integration` was not written, `main`
was not written, and no FM ref exists in this container to write to. Earl also
confirmed during the session that Overview stays mounted in the inspection lane
only (D6).

The branch remains TEMPORARY, LOCAL-DESIGN-ONLY and NOT PRODUCTION-BOUND. It
must not be merged automatically; see the reconciliation note above.

---

# POST-FI17-DESIGN-RECOVERY-02 — ENVIRONMENT GATE HANDOFF

```text
STATUS:  STOPPED AT THE ENVIRONMENT GATE — NOT EXECUTED
DATE:    2026-08-28 (Asia/Manila)
REASON:  Section 0 of the directive requires the user's local machine.
         This session is the same ephemeral cloud container as the
         previous run. The gate fired. No redesign was performed.
```

The directive's own gate:

```text
IF environment is an ephemeral/cloud container:
    STOP. Do not redesign. Do not claim Figma is unavailable.
    Produce a handoff stating that the task must be resumed in LOCAL Claude Code.
```

## Environment proof

```text
hostname:            vm
kernel:              Linux 6.18.44-fc-v22 (x86_64)
D:/Documents/Codex/HAU-USC Logistics/     NOT PRESENT
/mnt/d/...                                NOT PRESENT
/mnt contains:       attach, skills, user-data   (no Windows mount)
```

## Prerequisite audit — 1 of 5 met

Section 0 lists five things this pass requires. They were **tested, not
assumed**:

| # | Prerequisite | Result | Evidence |
|---|---|---|---|
| 1 | User's authenticated browser state | **NO** | All outbound HTTPS blocked by proxy policy; `connect_rejected … gateway answered 403 to CONNECT` |
| 2 | Configured Figma MCP | **YES** | `whoami` → `Invicta-ctrl` / `adrianoearl04@gmail.com`, pro tier. Direct node read of `hXJElH4p72KfgAaoUyfNOC` node `568:2` returned the full CURRENT authority board |
| 3 | Local HAU-USC worktrees | **NO** | No `D:` drive, no `/mnt/d` |
| 4 | Live localhost preview at `127.0.0.1:4174` | **CONTAINER-LOCAL ONLY** | HTTP 200 here, but this is the container's loopback. The directive forbids calling it "the owner's localhost preview", and that instruction is honoured |
| 5 | Comparison against the concurrent FM lane | **NO** | No FM branch, worktree, or process exists in this container |

## Correction to the previous run's Figma claim

The previous receipt recorded `FIGMA_MAKE_READ: NOT PERFORMED` and
`FIGMA_DESIGN_READ: NOT PERFORMED`, attributing both to "no authenticated Figma
access in this session". **That was wrong for Figma Design.** The connector is
authenticated and the Design file reads correctly from this container. The
earlier statement should have been split:

```text
FIGMA DESIGN (MCP):   AVAILABLE — was never actually attempted. Corrected here.
FIGMA MAKE (browser): GENUINELY BLOCKED — needs a signed-in browser session and
                      egress, neither of which exists here.
```

### Figma Design read receipt (this session)

```text
FILE:     hXJElH4p72KfgAaoUyfNOC  (HAU-USC Logistics — Frontend Design Lab)
IDENTITY: Invicta-ctrl · adrianoearl04@gmail.com · team::1658726455813516145
TOOLS:    whoami, get_metadata (no nodeId), get_metadata (nodeId 568:2)
NODES:    568:2 AUTHORITY + DESIGN HANDOFF · CURRENT (full subtree metadata)
```

`get_metadata` with no `nodeId` returned only `0:1 — 00 — Capture Index`. Per
the directive's warning **and** the repository's own recorded resolution in
`docs/design/FIGMA_BASELINE_REGISTER.md` ("Connector truncation, resolved"),
this was **not** treated as an empty file. The direct node read confirms the
file is intact: 28 pages, 136 variables across 8 collections, 102 components,
11 text styles, 9 effect styles.

Authority confirmed live from the board, not from repository prose:

- Canonical gold `#D4AF37` is OWNER-LOCKED (block `680:2`).
- "Gold is scarce and marks active controls, focus and selection — not routine
  labels. Glass is localised to layers that earn it, never a wash over the whole
  application. Lines are semantic; decorative rules are rejected." (`568:13`)
- Module intensity: Overview 5/5 · Public gateway 4/5 · Inventory, Request,
  Lending 3/5 · Release Desk 2/5 · Staff and Administration 1/5. (`568:13`)
- "Figma is the visual workbench, not the authority. A Figma frame is a design
  target, never a runtime contract." (`568:7`)

This is enough to confirm the previous pass did not contradict Figma authority,
but **not** enough to constitute the calibration the directive asks for. Frame
and screenshot reads across pages 11–13 (design system) and 15–90 (modules) are
still outstanding and are cheap to do from here.

## Reference websites — all blocked

Every URL in sections 4, 5 and 6 was attempted. All returned `000`:

```text
logistics.hausc.org · playground.hausc.org · hausc.org · figma.com
linear.app · lawsofux.com · nngroup.com · mobbin.com
```

Cause is the session's egress policy, not the sites. Sections 4, 5 and 6 cannot
be executed here at all.

## Section 8 — the viewport-edge defect DOES NOT REPRODUCE on this branch

This is the most important finding for the owner, so it is stated precisely.

Reproduction attempted at every width the directive names (320, 375, 390, 414,
768) plus 640 (the CSS-pixel equivalent of 200% reflow), on the public landing
and with the Preview Index open, against `local/post-fi17-design-pass-20260828`
served at `127.0.0.1:4174`:

```text
launcher rect at every width:  134 × 44 px, fully inside the viewport
launcher.left < 0:             false at every width
launcher.right > viewportWidth: false at every width
launcher.width < 44:           false  (134 wide, 44 tall — meets the target minimum)
position:                      fixed
inset-inline-end:              16px
z-index:                       100
containing-block hijack:       NONE — no ancestor carries transform, filter,
                               backdrop-filter, perspective, will-change or
                               contain, so `fixed` resolves against the viewport
elementFromPoint(centre):      the launcher itself — nothing overlays it
document horizontal overflow:  0 at every width
full-page clipped-element scan: 0 elements extend past either viewport edge
```

**No sliver, no clipping, no off-canvas control was observed.**

## Section 9 — the Preview Index is PRESENT AND WORKING on this branch

Also does not reproduce as "missing or effectively unusable":

```text
route #/__preview/index at 320, 390, 640, 768:  renders, unclipped
[data-preview-index] visible:                    true
[data-preview-route] count:                      15   (all 15 required routes)
search field present:                            true
filters present:  All · Accepted · In progress · Backend-wired · Preview-only ·
                  Not started · Public · Authenticated
groups present:   PUBLIC · EXTERNAL REQUESTER · STAFF · ADMINISTRATION
heading focused on entry:                        true
```

The launcher and index mount only when `/api/version` returns
`playground: true`; that was stubbed at the browser layer for this check, the
same way `tests/e2e/preview-index.spec.js` already does it.

### What this most likely means

Two owner-reported symptoms do not reproduce against this branch's source.
The likeliest explanations, in order, all concern **what the owner's 4174 is
actually serving**:

1. Local 4174 is serving a different lane or a stale build, not
   `local/post-fi17-design-pass-20260828`.
2. Local 4174 is serving a **production-mode build**. The launcher and index are
   correctly absent there — which would present exactly as "the Preview feature
   is missing". `localPreviewInspectionAllowed()` additionally requires
   `import.meta.env.DEV`, so a built preview also disables route inspection.
3. The local `/api/version` is not returning `playground: true`, so the gate
   fails closed and neither control mounts.

**Decisive local check**, before any redesign work is attempted:

```text
1. In the design worktree:  git rev-parse HEAD   → expect 7693a3c (or later)
2. Run vite in DEV mode on 4174 (not `vite preview`, which builds production).
3. In devtools: fetch('/api/version').then(r=>r.json()).then(console.log)
   → the `playground` field must be exactly boolean true.
4. Then look for [data-preview-index-launcher] bottom-right.
```

If the sliver still appears after that, capture the element's
`getBoundingClientRect()` and the computed `position` / `transform` /
`backdrop-filter` of each ancestor — that is the data this diagnosis would need
and could not obtain remotely.

## One real defect that WAS found

Not the reported clipping, but a genuine conflict the directive's section 9 asks
about ("avoid covering mobile navigation"):

```text
launcher:            position: fixed; inset-block-end: 1rem; z-index: 100
auth shell mobile nav: AuthenticatedShell.tsx:84
                     "lg:hidden fixed bottom-0 left-0 right-0 z-10"
```

Below `lg`, on any authenticated route, the launcher sits 1rem from the bottom
at `z-index: 100` directly over a bottom navigation bar at `z-index: 10`. It
will overlap it. This was not fixed, because the gate stops work here, and it
is left as the first item for the local run.

## What was NOT done

```text
Figma Design frame/screenshot calibration (pages 11-13, 15-90)   NOT DONE
Figma Make inspection                                            NOT DONE — blocked
Owner/institutional reference study (section 4)                  NOT DONE — blocked
Existing design-reference study (section 5)                      NOT DONE — blocked
New product reference study (section 6)                          NOT DONE — blocked
Hallmark full anti-slop audit (section 11)                        NOT DONE
Impeccable pass (section 12)                                      NOT DONE
Route quality redesign (section 13)                               NOT DONE
Edge-bug fix + regression test (section 8)                        NOT DONE — no repro
Launcher / mobile-nav overlap fix                                 NOT DONE
```

No source file was modified by this session. The only change is this receipt
section.

## Resume instructions for LOCAL Claude Code

```text
1. cd "D:/Documents/Codex/HAU-USC Logistics"
2. git fetch origin local/post-fi17-design-pass-20260828
3. git worktree add "worktrees/post-fi17-local-design-pass" \
     local/post-fi17-design-pass-20260828
   (do NOT reuse or re-check-out the FM worktree)
4. cd worktrees/post-fi17-local-design-pass && npm ci
5. Run the DEV server on 4174 with --strictPort. Do not touch 4173.
6. Run the decisive check above before assuming either symptom is real.
7. Then execute POST-FI17-DESIGN-RECOVERY-02 from section 3 onward.
```

Branch state at handoff:

```text
BRANCH: local/post-fi17-design-pass-20260828
HEAD:   7693a3ce76b0de0dfbf9445d162bafc1a18cccfe  (before this receipt section)
REMOTE: pushed to origin — the local run should fetch, not rebuild from scratch
FM:     untouched. No FM ref exists in this container.
```
