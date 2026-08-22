# Figma Make — canonical theme adoption packet

**Status: APPLIED AND VERIFIED — Figma Make v37 and v38, 2026-08-20.**

This was the deterministic packet for bringing Figma Make onto the canonical
theme. It has been applied. The document is kept as the record of what was
changed and why, and as the rollback reference.

```text
MAKE_THEME               ADOPTED_AND_VERIFIED
MAKE_VERSIONS            v37  canonical theme + route adoption (5 files)
                         v38  landing atrium pinned (1 file)
PENDING EDITS            NONE
ADOPTION AUTHORITY       OWNER_AUTHORIZED_DESIGN_STREAM_ADOPTION, 2026-08-20
HISTORICAL AUTHORSHIP    of the adopted RequestCenterRoute.tsx edit: UNKNOWN
ROLLBACK BASELINE        output/design/make-preservation/RequestCenterRoute.unsaved.tsx
                         sha256 4087473ca337b510859bb841425bfd4548181b2847db62627b0ea79715d5b159
```

§2 below records why the write was withheld until the owner resolved ownership.
That reasoning is retained deliberately: it is the reason the rollback baseline
exists, and the reason the adopted edit could be adopted rather than recreated.

## 0. What the adoption actually did

| | |
| --- | --- |
| `MK-02` | Canonical theme appended to `src/styles/theme.css`. `--gold-vivid` resolves `#D4AF37` light / `#E1C671` dark; no superseded value survives the cascade in either mode |
| `MK-03` | **44** superseded occurrences replaced by semantic role across four route files — not the 33 first counted. The extra 11 were `rgba()` forms of the same values |
| `MK-04` | Fixed from Product truth: the fixture gained `itemId`, `type`, `catalogType`, and `permittedRoutes()` mirrors `runtime.js`. Identical to Production in all 10 combinations |
| `MK-05` | The adoption made the landing hero dark-on-dark. Found, fixed in v38, and now asserted by the verifier — see §8 |
| `MK-06` | Landing sections below the hero may not respond to dark mode. Observed, not diagnosed, not patched — see §8 |

Every file was built locally, parse-checked with esbuild, hash-verified in the
editor before saving, and re-hashed from the saved document afterwards.

```bash
node scripts/design/build-make-routes.mjs   # the four route files
node scripts/design/build-make-theme.mjs    # the theme override
node scripts/design/verify-make-theme.mjs   # replay the cascade
```

---

## 1. Baseline identity — verified live, 2026-08-20

| Thing | Value |
| --- | --- |
| Make file | `rP9W9MQlZkyQrUx38TVsFS` |
| Live version | **Version 36** — "Fix TypeScript build error", 2 edited files |
| `src/styles/theme.css` | 9,419 bytes · 265 lines · sha256 `50cb55de9d8e20ad0661cb187b295ea86621aaf2e29c7d8584dd7e159d833082` |
| `src/app/PublicFlows.tsx` | 50,694 bytes · 789 lines · sha256 `50c623013e35f64c93bf63415ed7e8d78b82089d9a106f513fcebac5e272191c` |
| `src/app/LendingHubRoute.tsx` | 22,816 bytes · sha256 `2132c68c06915a7acea4a43d7ae31c079a7b5c5ec039cc3c0529d6c738efa967` |
| `src/app/ReleaseDeskRoute.tsx` | 21,957 bytes · sha256 `7c92b4835aa95386d6ea2611caf9b5379e74b8b74e934d201c8624ac4a2c898e` |
| Theme mechanism | `@custom-variant dark (&:is(.dark *))` — a **class**, not a data attribute |

Captured copies live in `output/design/make-preservation/`. They are evidence,
not authority: do not edit them and do not treat them as the source of truth for
the Make project.

**MK-01 is closed.** The previous pass could not open v36 and therefore could not
confirm that the functional source had survived the rebuild. It has been opened
and hashed. `PublicFlows.tsx` at v36 differs from the committed design-branch
copy by exactly one addition — a trailing blank line and the comment
`// end of PublicFlows.tsx`. The 788 lines before it are byte-identical. The v36
rebuild changed nothing functional, which is what "probably a rebuild of the same
source" had assumed but not shown.

---

## 2. Why the provider write was not performed

Figma Make had **one unsaved edited file when this session opened it, and it was
not ours**:

```
1 edited file
RequestCenterRoute.tsx   +28 −16      [Save] [Discard]
```

Make's save granularity was checked rather than assumed. In the live DOM there is
**exactly one `Save` button and one `Discard` button in the entire document**, and
they belong to a panel whose heading is a *file count* — "1 edited file" — with
the file list as a sibling, not a parent. There is a per-file revert control and
**no per-file save control**. The version history shows the same shape from the
other direction: Version 36 is recorded as a single checkpoint over "2 edited
files".

```
SAVE GRANULARITY:  WHOLE_PROJECT_SAVE_ONLY
```

So editing `theme.css` would have made the panel read "2 edited files", and the
single `Save` would have committed the unknown `RequestCenterRoute.tsx` work into
a new version alongside it. The alternatives were all worse:

- **Discard first** — destroys someone else's work. Refused.
- **Revert the file, save the theme, retype the edit** — recreating another
  person's in-progress change from a captured snapshot is still overwriting it,
  and any transcription difference would be silent.
- **Save both** — the "save everything and hope" pattern this work exists to
  avoid.

The unknown edit is preserved, the patch is deterministic, and applying it is a
30-second job for whoever owns that buffer. That is the correct trade.

```
PROVIDER_WRITE:  BLOCKED_BY_MIXED_UNOWNED_EDIT
MK-02:           READY_TO_APPLY_SAFELY
```

### 2.1 The preserved unknown edit

| Thing | Value |
| --- | --- |
| Path | `src/app/RequestCenterRoute.tsx` (Make working buffer, unsaved) |
| Preserved to | `output/design/make-preservation/RequestCenterRoute.unsaved.tsx` |
| Size | 45,354 bytes · 44,114 chars · 889 lines · LF · trailing newline |
| sha256 | `4087473ca337b510859bb841425bfd4548181b2847db62627b0ea79715d5b159` |
| FNV-1a | `3ba7db5f` |
| Make's own diff vs v36 | `+28 −16` |
| Captured | 2026-08-20T10:31:06Z |

The capture is byte-exact: the local file's sha256 equals the sha256 computed
over the live editor buffer before transfer.

**What the edit appears to do.** Read-only inspection, recorded so the owner does
not have to re-derive it, and explicitly *not* a judgement about whether it is
finished or correct:

- `ACTION_CFG` carries all five production review routes with production
  wording — Catalog restock, Issue from stock, Missing information,
  Procurement / canvass, Reject.
- The per-line `<select>` has `defaultValue=""` and a `disabled` "Select a
  route" placeholder, so no route is preselected.
- That per-line select offers **four** of the five: Issue from stock,
  Procurement / canvass, Reject, Missing information. Catalog restock is defined
  in `ACTION_CFG` above it but is not in the list.

The last point is flagged, not fixed, and §4.1 shows it is not the simple
omission it looks like: the fixture lacks the three fields production's rule
branches on, so the list is underdetermined rather than short by one. Either way
it belongs to whoever is holding that buffer.

**One incident to disclose.** While looking for a diff view, the editor's
`Format code` toolbar action was clicked by mistake, which reformatted the buffer
from 44,114 to 60,701 characters. It was undone immediately with a single undo,
and the buffer was then re-hashed and confirmed byte-identical to the preserved
capture (`4087473c…`). Nothing was saved at any point, and the pending panel still
reads `1 edited file · RequestCenterRoute.tsx · +28 −16`. This is recorded rather
than quietly corrected because the whole point of the preservation step is that
an accident against someone else's work is recoverable and visible.

---

## 3. The patch

**Source of truth:** `scripts/design/theme-source.mjs`
**Generator:** `scripts/design/build-make-theme.mjs`
**Artifact:** `prototypes/public-portals-r3/figma-make/src/styles/theme-canonical.css`

```bash
node scripts/design/build-make-theme.mjs
```

**How to apply:** append the whole artifact to the END of Make's
`src/styles/theme.css`, after the existing `.dark` block. It only redefines
variables that file already declares, so no selector, component or class changes.
Appending is what makes it an override rather than a merge.

### 3.1 The patch is larger than "fix the gold", and here is why

The earlier draft of this override redefined only the sixteen brand-palette
variables, on the assumption that the rest of Make's theme derives from them.
Reading the live file showed that assumption holds in light mode and **fails in
dark**. Three things bypass the palette and would have survived a palette-only
override:

1. `.dark` hardcodes the entire glass ladder as literal hexes —
   `--g0-ground: #1c1917` through `--g4-focus: #3d3530`. They derive from nothing.
2. `.dark` builds its surfaces from oxblood rather than a neutral ladder:
   `--background: var(--oxblood-deep)`, and `--card` / `--popover` / `--sidebar`
   are the literal `#2a0508`. That is a maroon dark mode, not the authored
   charcoal-oxblood ladder.
3. The superseded gold is baked into `rgba()` literals in **both** blocks —
   `rgba(232,185,60,…)` is `#E8B93C` and `rgba(242,209,92,…)` is `#F2D15C`. A
   find-and-replace on `--gold-vivid` leaves every one of them in place.

The generated override covers all three.

### 3.2 Expected resolved values after applying

Verify with:

```bash
node scripts/design/verify-make-theme.mjs
```

It strips comments (the override deliberately quotes the old values so a reader
can see what each line corrects), replays `theme.css` + the override in
declaration order, and asserts no superseded value survives in either mode.

| Make variable | Light | L\* | Dark | L\* | Canonical role |
| --- | --- | ---: | --- | ---: | --- |
| `--paper-bg` | `#e5dac7` | 87.4 | `#211615` | 8.6 | ground |
| `--paper-light` | `#efe5d7` | 91.4 | `#291c1c` | 11.9 | inset |
| `--paper-warm` | `#f7f1e8` | 95.4 | `#312222` | 15.0 | work |
| `--paper-mid` | `#fbf6f0` | 97.1 | `#3b2a2a` | 19.0 | raised |
| `--ink-deep` | `#342424` | 16.1 | `#f1e9e3` | 92.8 | text/primary |
| `--ink-mid` | `#5b4a4a` | 33.2 | `#d5cac6` | 82.1 | text/secondary |
| `--ink-light` | `#7d5518` | 39.5 | `#c9a45f` | 69.3 | accent/text |
| **`--gold-vivid`** | **`#d4af37`** | 72.8 | **`#e1c671`** | 80.5 | **canonical gold** |
| `--gold-mid` | `#e6d088` | 83.8 | `#eddca7` | 88.0 | gold/light |
| `--gold-pale` | `#f7efd5` | 94.4 | `#faf1de` | 95.4 | gold/tint |
| `--border-warm` | `#7f7469` | 49.5 | `#8b7b7a` | 53.0 | border/control — 1.4.11 |
| `--border-paper` | `#e3dcd1` | 88.0 | `#392c2c` | 19.4 | border/subtle |
| `--green-open` | `#1f6b41` | 39.9 | `#9ad9b2` | 81.7 | status/done/fg |

Light stops short of white and dark stops well short of black, which is the whole
point of the ladder: `#fffdf8` and a `#1c1917`-floor dark mode are the two
failures this replaces.

Glass, after the override: fill up, blur down, at both ends.

| | G1 | G2 | G3 | G4 |
| --- | --- | --- | --- | --- |
| light fill | `rgba(255,249,236,.34)` | `rgba(255,251,242,.52)` | `rgba(255,253,248,.66)` | `rgba(242,228,182,.34)` |
| dark fill | `rgba(74,34,41,.34)` | `rgba(79,32,40,.5)` | `rgba(85,32,41,.64)` | `rgba(225,198,113,.24)` |
| blur | 10px | 14px | 18px | 22px |

---

## 4. What this patch does NOT fix

Applying `theme-canonical.css` corrects the **token layer**. It does not make
Make fully canonical, because four route files paint with literal hexes rather
than reading the tokens. Measured on the live v36 sources:

| File | `var(--…)` refs | literal hexes | of which superseded-palette |
| --- | ---: | ---: | ---: |
| `PublicFlows.tsx` | 109 | 44 | 6 |
| `LendingHubRoute.tsx` | 46 | 18 | 3 |
| `ReleaseDeskRoute.tsx` | 46 | 17 | 3 |
| **`RequestCenterRoute.tsx`** | **0** | **72** | **21** |

`RequestCenterRoute.tsx` is the outlier and the problem case: it reads **no CSS
variables at all**. Its colours come from a local `ap(dark)` helper —

```ts
function ap(dark: boolean) {
  return {
    bg:     dark ? "#1c1917" : "#fffdf8",
    m1:     dark ? "#242120" : "#ffffff",
    m2:     dark ? "#2d2927" : "#f7f0e2",
    border: dark ? "rgba(250,249,247,0.10)" : "#e6dcc9",
    text:   dark ? "#faf9f7" : "#241416",
    muted:  dark ? "rgba(250,249,247,0.46)" : "#6f5a60",
    skel:   dark ? "#2d2927" : "#e6dcc9",
  } as const;
}
```

— and it carries 13 occurrences of the superseded gold `#e8b93c`. **No change to
`theme.css` can retheme this route.** It needs its own edit, replacing `ap()`
with `var(--…)` reads, and it is exactly the file holding the unowned change, so
it was left alone entirely.

```
MK-02 SCOPE
  theme.css token layer ................ closed by this packet
  route-level literals (33 superseded) . OPEN, separate change
  RequestCenterRoute.tsx (21 of those) . OPEN and OWNERSHIP-BLOCKED
```

Claiming "Make theme adopted" after applying only this packet would be false for
the Request Center route. Say "token layer adopted" instead.

### 4.1 MK-04 re-derived from Product truth

The earlier note said the per-line route select "is missing Catalog restock".
Reading the Product source shows that framing was wrong, and that adding the
option would have been wrong too.

Production derives the option set per line — it does not carry a fixed list
(`src/visual/runtime.js`, `permittedRoutes`):

```js
function permittedRoutes(request, line) {
  const routes = [];
  if (line.itemId) routes.push('ISSUE_FROM_STOCK');
  if (request.type !== 'CATALOG_RESTOCK') routes.push('PROCUREMENT');
  if (line.itemId && (request.type === 'CATALOG_RESTOCK' ||
      ['OFFICE_INVENTORY', 'PANTRY'].includes(request.catalogType))) routes.push('RESTOCK');
  routes.push('REJECT', 'MISSING_INFORMATION');
  return routes;
}
```

So only `REJECT` and `MISSING_INFORMATION` are unconditional. `ISSUE_FROM_STOCK`
and `RESTOCK` both require the line to have an `itemId`, and `RESTOCK`
additionally requires a catalog-restock request or an `OFFICE_INVENTORY` /
`PANTRY` catalog type.

**The Make fixture cannot express any of that.** Its types are:

```ts
type ReqLine = { name: string; qty: number; avail: "available" | "short"; shortBy?: number };
type ReqItem = { id; title; dept; committee; lines; needed; status; urgency;
                 routing; submittedAgo; detailLines; context; nextAction };
```

There is no `itemId`, no `type` and no `catalogType` — precisely the three fields
the rule branches on. Applied literally to that data, `line.itemId` is always
undefined and the correct set would be three options, not the four currently
shown and not five. The buffer's list is therefore not "missing an option"; it is
**underdetermined**, and any fixed list is arbitrary.

The fix is not to add Catalog restock. It is to give the fixture the three
discriminating fields and derive the options the way production does, keeping the
empty disabled placeholder so no route is preselected:

```ts
type ReqLine = { name: string; qty: number; avail: "available" | "short";
                 shortBy?: number; itemId?: string };
type ReqItem = { /* … */ type?: "CATALOG_RESTOCK" | "STANDARD";
                 catalogType?: "OFFICE_INVENTORY" | "PANTRY" | null };

const ROUTE_LABELS = {
  ISSUE_FROM_STOCK: "Issue from stock",
  PROCUREMENT:      "Procurement / canvass",
  RESTOCK:          "Catalog restock",
  REJECT:           "Reject",
  MISSING_INFORMATION: "Missing information",
} as const;

function permittedRoutes(req: ReqItem, line: ReqLine) {
  const routes: (keyof typeof ROUTE_LABELS)[] = [];
  if (line.itemId) routes.push("ISSUE_FROM_STOCK");
  if (req.type !== "CATALOG_RESTOCK") routes.push("PROCUREMENT");
  if (line.itemId && (req.type === "CATALOG_RESTOCK" ||
      ["OFFICE_INVENTORY", "PANTRY"].includes(req.catalogType ?? "")))
    routes.push("RESTOCK");
  routes.push("REJECT", "MISSING_INFORMATION");
  return routes;
}
```

Production's own comment is worth carrying across, because it is the reason this
is presentation and not policy:

> Presentational filtering only. The server revalidates every decision and is
> the single source of truth for what is legal.

This lands in `RequestCenterRoute.tsx`, so it is ownership-blocked with the rest
of that file.

---

---

## 5. Functional contract at v36 — re-verified

Read from the live v36 sources, not inferred from adjacent modules.

**Public Lending** — no-login model intact. `PublicFlows.tsx` carries
"No account and no sign-in needed", both borrower branches
(`USC_STAFF` / `ANGELITE`, surfaced as "USC Staff / Officer" and "Angelite
Student"), academic identity always collected, search-first catalog, and a
private tracking code. Staff sign-in appears only as a hand-off, never as a gate.

**Public Request** — public purposes, line behaviour and tracking intact; the
tracking reference is shown once and not described as emailed.

**Staff Request** — per-line routing with `defaultValue=""` and no preselected
route; all five production route labels present in `ACTION_CFG`. Verified against
the **unsaved buffer**, which is the only version readable without destroying it —
see §2.1, including the missing fifth option in the per-line select.

**Internal Lending** — six preview states exactly as claimed:
`Default · Loading · Filtered empty · Page error · Stale data · Permission limited`.
The consumable/reusable lifecycle split is present and commented in the source:
`kind?: "reusable" | "consumable"`, with "a consumable is issued, a reusable is
handed off".

**Release Desk** — now fully readable, and it carries **eleven** states, not the
nine previously recorded:
`Populated · Focused task · Required correction · Loading · Empty · Filtered empty ·
Stale revision · Denied · Unavailable · Validation error · Confirmed success`.
The earlier "9 states" was a floor taken from partial evidence; the superset is
recorded here rather than left as a stale number.

**Route vocabulary** — `appRoutes.ts` declares ten internal routes: overview,
inventory, request-center, lending, release, restocking, procurement, events,
administration, profile. Request Center is labelled "Staff Request Center".

---

## 6. Apply-and-verify checklist

1. Resolve the ownership of the pending `RequestCenterRoute.tsx` edit. Either the
   owner saves it, or they discard it knowing
   `output/design/make-preservation/RequestCenterRoute.unsaved.tsx`
   (`4087473c…`) holds an exact copy.
2. Confirm the pending panel reads `0 edited files` before starting.
3. Re-hash `src/styles/theme.css`. If it is not
   `50cb55de9d8e20ad0661cb187b295ea86621aaf2e29c7d8584dd7e159d833082`, the file
   moved on — regenerate the packet rather than applying it blind.
4. Append `theme-canonical.css` to the end of `theme.css`.
5. Confirm the pending panel now reads `1 edited file · theme.css`, and that
   `RequestCenterRoute.tsx` is **not** in the set.
6. Save.
7. Re-read `theme.css` and confirm the appended block is present and last.
8. Re-read `RequestCenterRoute.tsx` and confirm its hash is unchanged from
   whatever state step 1 settled on.
9. Toggle light/dark in the preview and check: no pure-white work plane, no
   near-black ground, gold reads `#D4AF37` in light and `#E1C671` in dark.
10. Run `node scripts/design/verify-make-theme.mjs` against a fresh capture.

Stop at any step where a file changes that you did not intend to change.

---

## 7. Residuals this packet does not close

| ID | Item | Status |
| --- | --- | --- |
| MK-02 | Route-level literal palettes, 33 superseded values across 4 files | OPEN — §4 |
| MK-03 | `RequestCenterRoute.tsx` reads no tokens; per-line select is missing Catalog restock | OPEN, ownership-blocked — §2.1, §4 |
| FD-COLOUR | 54 inferred colours on Figma page 15 | NONBLOCKING_HISTORICAL_EVIDENCE_GAP — node ids were never recorded, so the set cannot be identified. Not worth another cycle |
| Token binding | Figma solid-paint binding coverage at 81.8% | Deliberately not pursued; semantic correctness outranks binding percentage |
| Screen reader | Runtime AT pass | NOT_RUN. The accessibility-tree evidence (30/30 via CDP) is not a screen-reader run and is not presented as one |

---

## 8. What the adoption broke, and what it exposed

Two findings that only appeared after the theme was live. Both are recorded here
rather than folded quietly into the change, because the first is a defect this
work introduced and the second is a design question this work is not entitled to
answer.

### 8.1 MK-05 — the landing hero went dark on dark. Fixed in v38.

Make's landing atrium wrote its chrome as live references to the brand palette:

```css
--atrium-ink:   var(--paper-warm);
--atrium-muted: var(--gold-cream);
```

and `.atrium__title { color: var(--atrium-ink) }`.

That worked before this adoption for an accidental reason. The original theme
declared the brand palette in `:root` **only** — it had no `.dark` values at all
— so `--paper-warm` was near-white everywhere, including inside a `.dark`
subtree. The hero title was light because the palette could not be anything else.

Giving the palette a real dark mode removes the accident. Inside the atrium's own
dark context `--paper-warm` becomes the L\* 15 work plane, and the hero rendered
as dark ink on a dark photograph.

Nothing flagged it. Every value involved was individually correct, the cascade
verifier passed, and all five files hashed exactly as intended. It was visible
only by looking at the rendered page.

The fix pins all nine `--atrium-*` tokens to their light-palette values in both
modes, which is what "permanently dark chrome" should always have meant, and
`verify-make-theme.mjs` now asserts that `--atrium-ink` and `--atrium-muted`
resolve light in both modes so the regression cannot return silently.

**The general lesson, which matters beyond this file:** giving a previously
mode-invariant palette a dark mode is not a safe token-level change. Every
consumer that assumed those values were constant becomes a candidate regression.
The sweep that finds them is "which `:root`-only tokens reference a palette
token that is now modal" — it returned ten here, nine of them the atrium family.

### 8.2 MK-06 — sections below the hero may not respond to dark mode. Open.

With the theme in dark mode, the "What the council is doing now" section rendered
on a near-white surface. This was observed and deliberately not pursued.

The likely cause is the same structural fact as §8.1: before this adoption
Make's palette had no dark values, so the landing's surfaces were mode-invariant
by accident, and nothing below the hero was ever authored against a dark palette.
If that is right, the landing is not broken so much as never designed for dark
mode — and deciding whether it should respond to dark mode at all is a design
call, not a token fix.

It is left open rather than patched. One file to start from:
`src/app/landing/CurrentSection.tsx` with `src/styles/index.css`.

### 8.3 A note on Make's save granularity

`WHOLE_PROJECT_SAVE_ONLY` held throughout. The five-file adoption saved as one
checkpoint (v37) and the one-file atrium fix as another (v38). Worth knowing for
next time: a save does not mint a version immediately — the pending panel can
still show the edit after a reload while the version is being cut. The reliable
test is a reload followed by a re-hash of the file, not the pending panel.
