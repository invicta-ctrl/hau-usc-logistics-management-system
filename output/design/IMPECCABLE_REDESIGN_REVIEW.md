# Impeccable Redesign Review

Review and verification record for the whole-site redesign preview.

- **Branch:** `design/impeccable-whole-site-preview` (worktree)
- **Base:** `a18e8fc` on `release/v0.7.2-production-access-operations`
- **Reference SHA-256:** `44d2800695d0f9546911522eba1b240ff405b4dbbfc85493ac27ea90f7e0972c` — verified unchanged
- **Date:** 2026-08-08

---

## 1. Verification results

All figures below are actual tool output, not estimates.

### Impeccable detector

```
node <impeccable>/scripts/detect.mjs prototypes/impeccable-whole-site-redesign/   → exit 0, 0 anti-patterns
node <impeccable>/scripts/detect.mjs output/design/…Preview.html                  → exit 0, 0 anti-patterns
```

One finding was raised and fixed rather than suppressed: `transition: max-width`
on the preview frame (`[layout-transition]`). The transition was removed — a
viewport switch should settle instantly so the layout can be judged.

No detector rule is ignored, and no ignore file was created.

### Accessibility and responsive sweep

Harness: `tools/verify.mjs` (real Chromium via Playwright). 32 surfaces × their
state variants = **53 surface/state combinations**, at each of six widths.

| Width | Findings |
|---|---|
| 320 px | 0 |
| 375 px | 0 |
| 414 px | 0 |
| 768 px | 0 |
| 1024 px | 0 |
| 1440 px | 0 |

Checked per combination: horizontal page overflow, elements exceeding the
frame, visible interactive targets under 24 px, colour-only status, heading
order, duplicate ids, `aria-describedby` targets, table captions, and landmark
presence.

- **Console errors:** 0
- **Network requests to anything other than `file:`:** 0

### Keyboard

- 25-key Tab traversal: every focused element reported `outline-style: solid`.
  **0** elements suppressed the focus ring.
- Confirmation dialog: opens with `aria-modal="true"`, focus moves inside,
  Tab is trapped, `Escape` closes it, and focus is **restored to the trigger**.
- No keyboard trap outside intentional modal traps.

### Zoom and motion

- **200% zoom:** 0 surfaces overflow horizontally.
- **`prefers-reduced-motion: reduce`:** honoured; computed transition duration
  collapses to `1e-05s`.

### Contrast (WCAG 2.1 AA)

Harness: `tools/contrast.mjs`. Every text-bearing element on every surface, in
**both themes**, against its composited background.

**Result: 0 failures.**

Four genuine failures were found and fixed during the pass:

| Issue | Measured | Fix |
|---|---|---|
| `--muted` on paper | 4.47:1 (need 4.5) | darkened `#7c696d` → `#786369` |
| Brand marks in dark mode | 2.17:1 | translucent plaque + gold text |
| Avatars in dark mode | 2.17:1 | translucent plaque + gold text |
| Links in dark mode | 2.67:1 | re-toned oxblood → gold |

Elements over gradient backgrounds (the rail) are excluded from automated
sampling — a single colour cannot represent a gradient — and were checked
visually instead.

### Screenshot evidence

57 PNGs in `output/design/impeccable-redesign-screens/`, covering 18 surface and
state combinations at 320, 768, and 1440 px, plus a dark-theme capture per
width.

### Repository integrity

```
git diff --check                  → exit 0
git diff --name-only              → (none)
git diff --cached --name-only     → (none)
```

No tracked file was modified. Every change is a new, untracked, additive path.

---

## 2. Defects found and fixed during review

These were real, and each was fixed rather than documented away:

1. **Heading order.** 10 surfaces jumped `h1 → h3`. Introduced a `.block-title`
   `<h2>` and corrected `emptyState`, `deniedState`, and the detail panel.
2. **Unstyled form controls.** `.field` listed input types individually, so
   `password`, `search`, and `file` fell through unstyled at 28 px.
3. **File input overflow.** A file input's intrinsic minimum width pushed the
   public lending surface past 320 px.
4. **Checkbox target size.** 13 px → 24 px.
5. **Invisible-but-focusable scrim.** The closed mobile drawer scrim used
   `opacity: 0` alone, leaving it in the tab order and the accessibility tree.
   Now `visibility: hidden`.
6. **Focus not restored.** `render()` replaces `innerHTML`, so the stored
   trigger node was detached by the time an overlay closed. Now stores a
   selector and re-finds the trigger.
7. **Header scrolled out of view.** Focusing the main region on navigation
   scrolled the sticky workspace topbar off screen. Now
   `focus({ preventScroll: true })` plus an explicit scroll reset.
8. **Rail overflowed the viewport.** The rail assumed it owned the full height
   and ignored the preview bar. Now driven by a `--preview-bar-h` custom
   property published by a `ResizeObserver`.
9. **Row headers styled as column headers.** `table.q th` applied the uppercase
   micro-label treatment to `<th scope="row">`, rendering item names in caps.
   Scoped to `thead th`.
10. **Detail pane could not shrink.** Missing `min-width: 0` on a grid item made
    its automatic minimum size the detail table's min-content width, pushing the
    pane past the viewport and clipping the routing controls.
11. **Focus ring on the route landing target.** Suppressed on `#surface-main`
    only — a documented, narrow exception; every real control keeps its ring.

---

## 3. Reference traits preserved

- HAU-USC identity ramp — oxblood, burgundy, maroon, crimson, antique/metallic/
  bright/light gold, cream, canvas, paper.
- The unified icon language: `24×24`, `fill="none"`, `stroke-width: 1.8`, round
  caps and joins, **one brand ink**, status meaning carried by labels.
- Dark theme as a genuine re-tokenisation rather than an inversion.
- System-stack body type with a Georgia editorial accent; no webfont dependency.
- Spacing (4 px base), motion (140/240 ms ease-out), and the gold focus ring.
- `prefers-reduced-motion` blanket disable.
- Collapsible desktop rail, mobile drawer with scrim, Escape-to-close, ⌘K search.
- Role, workspace, and operational-scope context in the shell.
- "Governed warmth" — institutional, not cold enterprise software.

## 4. Reference traits changed

- Six equal-weight metric cards → a four-item attention band plus a context line.
- Twelve equal-weight containers → one dominant work surface with quiet rails.
- `div` grids with unreachable rows → semantic tables with focusable rows.
- Card-linking panels → queue plus split-pane detail, drawer, or full-screen push.
- Four tinted "pulse" surfaces → one neutral row treatment with labelled chips.
- CSS `conic-gradient` donut with a hard-coded value → labelled composition bar.
- "Roadmap to v1.0" removed from operational surfaces.
- Three shimmer sweep animations, the inset gold ring, and the stacked radial
  gradients removed.
- `font-weight: 900` reserved for numerals.
- `--radius-lg: 20px` retired; elevation reduced to two levels.
- Narrow layouts now drop reference ids and metadata, never readiness or
  quantity.

## 5. Known limitations

- **Illustrative data.** Every figure is invented and labelled as such on each
  surface. No real record, person, supplier, or identifier appears.
- **Solid-tier surfaces** carry populated plus one or two states, not the full
  ten. Deep-tier surfaces carry the full set. The tiering is recorded per
  surface in the surface matrix and shown on the index.
- **`reports`** has a feature directory but no bootstrap module and no view
  template, so it deliberately has no preview surface.
- **Contrast over gradients** is verified visually, not automatically.
- **Interaction fidelity is illustrative**: filters, sorting, pagination, and
  form submission are not implemented.
- **The preview has no `node_modules`.** `verify.mjs` and `contrast.mjs` need
  `PLAYWRIGHT_PATH` pointed at an existing install.
- **`.impeccable/hook.cache.json`** was created by the Impeccable design hook
  during this session. It is tool cache, not a deliverable.

## 6. Base drift observed

While this preview was being built, a separate Codex process advanced
`release/v0.7.2-production-access-operations` by 19 commits (`a18e8fc` →
`1f216a1`). `a18e8fc` remains an ancestor; nothing diverged, and this preview
never wrote to that branch.

Of every source file cited in the surface matrix, only
`src/domain/permissions.js` changed: `CAPABILITIES.REQUEST_REVIEW` was granted
to `ADMINISTRATOR`. No route, workspace, module, status, ledger type, or label
changed, so the matrix remains accurate — and the grant reinforces the Request
Center preview.

**Re-derive the surface matrix against the then-current head before any
production integration.**

## 7. Production-integration prerequisites

1. An accepted v0.8.0 specification. This preview is **not** a v0.7.2 amendment;
   §3.3 of the active spec explicitly defers the redesign.
2. Token reconciliation with `src/styles/tokens.css` and
   `src/styles/visual/tokens-base.css`.
3. Map preview primitives onto the existing `src/components/` rather than
   replacing them.
4. Validate the five-tone status mapping against all 21 canonical statuses with
   the people who operate them.
5. Re-run the repository's own acceptance widths (390, 820, 1366) and 200% zoom.
6. Decide what happens to `reports`.
