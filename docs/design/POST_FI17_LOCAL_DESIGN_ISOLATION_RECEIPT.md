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
