# V5 reference defect corrections

Authority: `.codex/specs/active/v0.7.3-frontend-design-integration.md` §0 —
"The modular v5 directory remains an unchanged design reference unless a
confirmed reference defect requires a separately documented correction."

This is that separate document. It records five confirmed defects found in
`prototypes/impeccable-whole-site-redesign-v5/`, the correction applied to each,
and the evidence that the correction holds. Owner authorised D1–D4 on
2026-08-09 after review of the findings, and D5 in the same session after a
second pass widened the audit to every surface.

Scope of this record:

- No v6, v5 copy, or other preview lineage was created.
- No application source, Worker, D1, R2, migration, provider, authentication,
  staging, deployment, or release artefact was touched.
- No `output/design/` export was regenerated. The existing exports still
  represent the pre-correction reference and must be regenerated from the
  modular directory before they are used for visual acceptance again.
- Findings outside the four below were left in place. They are listed under
  *Reported, not corrected*.

All five defects predate v5: `prototypes/impeccable-whole-site-redesign-v4/`
carries byte-identical `styles/components.css`, `styles/v4.css`, and the same
`setTheme` body. V4 is historical and was not modified.

## Discovery

Found during an Impeccable `polish` pass on the Request review queue
(`#/request.queue`), 2026-08-09. Evidence is DOM and computed-style measurement
at 320, 375, 1024, and 1440 CSS px in both themes across all five registered
state variants, plus a Playwright run over the modular source served on
`127.0.0.1`. No screenshots were captured; the review browser stopped
compositing partway through and every claim below is a measurement.

## D1 — The routing decision is unreachable below 1180px

**Severity:** blocks the surface's primary task.

`styles/responsive.css:12` hides `.split__detail` at and below 1180px and hands
off to the drawer in `src/app.js`. The drawer carried a summary sentence — "Six
lines need one routing decision each. Two are still pending a decision, so this
request cannot be accepted yet." — and then offered **Accept and reserve**, the
action that sentence declares unavailable.

Measured at 1024×768 before the correction: `selects in drawer: 0`,
`lines table present: false`. The surface's stated rule is "Every line needs one
explicit routing decision. Nothing is routed by default." On tablet and phone
there was no control with which to make one.

**Correction.** `requestDetailParts(state, titleAction)` in
`src/surfaces/operations.js` now builds the detail head, body, and foot once;
`requestDetailPanel` composes them into the desktop `<aside>` and
`src/app.js` composes the same three into the drawer. The drawer receives the
close control as `titleAction`, so it keeps its dismiss affordance.

**Evidence after.** At 1024 the drawer reports 6 routing selects, the Lines
table, the Evidence section, a scrolling `.detail__body`
(`scrollHeight 989 / clientHeight 476`, `overflow-y: auto`), `role="dialog"`,
`aria-modal="true"`, and focus trapped inside. At 375 the drawer is full width
with the same 6 selects and its footer inside the viewport (`bottom 811` of
`812`).

## D2 — `overflow: clip` cut off table content with no way to scroll

**Severity:** blocks the surface's primary task at desktop widths.

`styles/components.css:346` gives `.table-wrap` `overflow-x: auto`.
`styles/v4.css:1024` later declared `overflow: clip`, which overrides both axes
and removes scrolling entirely rather than only masking the block axis.

Measured at 1440×900 before the correction, in the request detail pane:
`.table-wrap` `clientWidth 295` against `scrollWidth 447`. Each of the six
"Routing decision" selects is 158px wide and **22px was visible**. Setting
`scrollLeft = 200` returned `0` — `clip` leaves nothing to scroll.

The same rule clipped the main queue at 320: `clientWidth 262` against
`scrollWidth 303`, cutting the tail off "Ready to Release" and the longer status
labels. There was no page-level overflow, so nothing signalled the loss.

**Correction.** `styles/v4.css` now sets `overflow-x: auto; overflow-y: clip;`
on `.table-wrap`, keeping the block-axis mask the rule was reaching for and
restoring the inline-axis scroll the component was built with.

**Evidence after.** Detail pane at 1440: `overflow-x: auto`, maximum
`scrollLeft 152`, and the routing select measures 158 of 158px visible when
scrolled. Main queue at 320: maximum `scrollLeft 41` and all eight status chips
fully reachable. Page overflow remains 0 at every width tested.

The detail pane is still narrow enough that the Lines table needs that scroll at
1440. Widening the pane is a layout decision, not a defect correction, and was
deliberately left alone.

## D3 — `aria-disabled` announced a block that was never enforced

**Severity:** misleading state.

In the `stale` variant, `Accept and reserve` carried `aria-disabled="true"`
while `disabled` was `false` and `pointer-events` was `auto`. Clicking it opened
the confirm overlay. The control announced "disabled" to assistive technology
and stayed fully operable for everyone, including keyboard users — against
PRODUCT.md's "controls must not imply capability the actor lacks."

The desktop pane also enabled Accept in the `populated` variant even though two
of the six lines carry `PENDING_DECISION`, contradicting the drawer's own copy
on the same surface.

**Correction.** `acceptBlockedReason()` in `src/surfaces/operations.js` derives
the block from the line data rather than from prose: the stale variant returns a
reload instruction, and any line still on `PENDING_DECISION` returns
"N of M lines still need a routing decision." When a reason exists, the button
gets `aria-disabled="true"` and `data-blocked-reason`. The `confirm-accept`
handler in `src/app.js` reads that attribute, refuses to open the overlay, and
raises the reason as an `role="alert"` toast so the control does not read as
dead.

**Evidence after.** Populated at 1440: `aria-disabled="true"`, reason
"2 of 6 lines still need a routing decision.", click produces no overlay and an
alert toast carrying that text. Stale: reason "Reload this request before
deciding. Another reviewer changed it while you were reading.", same refusal.
The drawer shows the same two behaviours at 1024.

## D4 — Dark → light theme switching did nothing

**Severity:** the control reported a state it had not reached.

`render()` writes `data-theme` to both `documentElement` and `body`
(`src/app.js:663-664`), but `setTheme()` wrote only `body`. The token layer is
authored as `[data-theme="dark"]` (`styles/tokens.css:163`, `styles/v3.css:112`,
`styles/v4.css:110`, `styles/v5.css:59`) and **no `[data-theme="light"]` block
exists anywhere** — light is only the `:root` default on the root element. A
body-level attribute therefore could not restore it.

Measured before the correction, from a rendered dark state: clicking Light gave
`html=dark`, `body=light`, root background unchanged at
`oklch(0.125 0.012 22)`, detail pane unchanged, `color-scheme` still `dark`, and
`aria-pressed="true"` on the Light control. A route change repaired it, because
`render()` rewrites the root attribute. Light → dark happened to survive because
the dark block also matches `body`.

`tools/theme-test.mjs` asserted `document.body.dataset.theme` in every check —
the one attribute `setTheme` did update — which is why 13/13 passed over a theme
switch that did not switch.

**Correction.** `setTheme()` now writes `document.documentElement.dataset.theme`
alongside the body attribute. `tools/theme-test.mjs` reads the root attribute
instead of the body flag in the toggle probe, the mid-transition wait, the
reload check, the first-run checks, and the stored-preference check, and gains
two assertions: `rootAndBodyAgree` and `groundRepaintsOnSwitch`.

**Evidence after.** Independent Playwright run over the modular source served on
`127.0.0.1:4173`, light → dark → light on `#/request.queue`: root and body agree
at every step, the root background moves `oklch(0.94 0.012 70)` ↔
`oklch(0.125 0.012 22)` and returns, `color-scheme` follows, `aria-pressed` is
truthful, and no console errors. 6/6 checks pass.

`tools/theme-test.mjs` itself was **not** executed, and its change is **not
committed**. It resolves its argument through `pathToFileURL`, so it only runs
against a generated single-file export, and regenerating that export would
overwrite the preserved v4 artifact — outside this correction's scope. The edit
therefore stays in the working tree as unverified work: run it against a freshly
generated export, confirm it passes, and commit it separately.

Until that happens the shipped suite still asserts `document.body.dataset.theme`
and remains blind to the defect D4 corrects. The `setTheme` fix is committed and
independently verified; only its regression test is outstanding.

**Not present in production.** `src/visual/signature-controls.js:20-21` already
sets `documentElement.dataset.theme` and `style.colorScheme`. This defect is
confined to the preview reference.

## D5 — `--anchor` used as a foreground colour failed contrast in dark theme

**Severity:** fails an accessibility floor PRODUCT.md records as required, not
aspirational.

Found by a second `polish` pass that widened the audit from `request.queue` to
every surface. In dark theme `--anchor` resolves to `oklch(44% 0.115 22)`
(`--ox-600`, via `styles/v3.css:136`) and measures **2.46:1** against the page
ground where 4.5:1 is required. It was used as a text colour in **36 distinct
instances** across the preview.

The worst was a real link, not decoration: `.public__foot-meta a` — "Privacy
Notice and Acceptable Use", 12px — present in 51 audited renders across the
landing, sign-in, register, verify, application, and tracking surfaces.
`styles/base.css:58-61` already documents the correct treatment — "Oxblood on a
near-black ground measures ~2.7:1. Links re-tone to gold." — and sets
`[data-theme="dark"] a { color: var(--gold-300) }`. `styles/v4.css:1439` then
declared `.public__foot-meta a { color: var(--anchor) }` at equal specificity in
a later layer, silently undoing it.

Three further sites carried the same token as a foreground:

- `.topbar__route span` (`styles/v4.css:533`) — the visible route code, 2.34:1,
  on every internal surface.
- `.route-progress > .route-progress__code` (`styles/v4.css:613`) — its
  `aria-hidden` twin, 2.33:1.
- `.profile-photo__preview` (`styles/v4.css:2234`) — the 112px monogram on
  `account.profile`, 2.11:1 against 3:1 for 28px display text, because
  `--anchor-soft` is only 8% anchor over paper and sits close to the dark ground.

**Correction.** Four dark-theme overrides, each next to the rule it corrects, all
using tokens the system already defines. No new tokens, no light-theme change —
`--anchor` is `--ox-800` in light and passes there.

| Site | Dark foreground | Ratio on page ground |
| --- | --- | --- |
| `.public__foot-meta a` | `--gold-300`, as base.css already documents | 14.57:1 |
| `.topbar__route span` | `--muted`, the shell's secondary-text token | 7.56:1 |
| `.route-progress__code` | `--muted` | 7.56:1 |
| `.profile-photo__preview` | `--ink`, primary identity content | 17.44:1 |

**Evidence after.** Full re-sweep — 33 surfaces, every state, 320/375/1440,
light and dark: **contrast failures 36 → 0**. No page errors, no console errors,
no page overflow. The D4 theme cycle still passes 6/6.

## Verification performed

- Playwright over the modular source served on `127.0.0.1:4173`: all 33 routes
  at 1440×900 and 375×812 — 66 route renders, 62 state renders — **zero page
  errors, zero console errors, no empty surfaces**. Re-run after the final edit.
- Theme cycle assertions on `#/request.queue`: 6/6 pass, listed under D4.
- Direct measurement of D1, D2, and D3 at 320, 375, 1024, and 1440, before and
  after, quoted in each section above.
- Whole-preview sweep for D5: 33 surfaces × every registered state × 320, 375,
  and 1440 × light and dark. Contrast **36 kinds → 0**, page overflow 0, page and
  console errors 0. `aria-disabled` controls: one, the guarded `confirm-accept`.
  Sub-44px targets: `.celestial` only, plus a `visually-hidden` file input that
  is a false positive. Nine "clipped content" hits are all `text-overflow:
  ellipsis` on nav labels or 1px `.visually-hidden` boxes — intentional.

Not run, and not claimed: `export.mjs`, `registry-parity.mjs`,
`theme-test.mjs`, `motion-test.mjs`, `verify.mjs`, `contrast.mjs`,
`review-shots.mjs`, `visual-delta.mjs`. Each needs a regenerated export, which
this correction deliberately did not produce.

## Reported, not corrected

Found during these passes, outside the five authorised corrections:

1. **Mobile column priority is inverted.** At 375 and 320 the queue drops
   **Needed** and **Routed** and keeps `REQ-DEMO-431 · Illustrative Executive
   Council`. `styles/responsive.css:7-9` states the opposite rule: operational
   columns survive, reference ids go first.
2. **Celestial toggle target.** `.celestial` measures 78×38 at every width and
   in all 216 audited renders, below the 44px minimum DESIGN.md sets for the
   shell's controls. It is the only sub-44px target in the shell.
3. **"Lines routed: 0 of 6" contradicts the Lines table**, which shows four of
   six lines already carrying a route. The queue row for REQ-DEMO-431 reports
   `0 / 6` as well.
4. **Focus is not restored to the trigger.** Closing the request drawer returns
   focus to `#surface-main` rather than the row link that opened it;
   `closeOverlay`'s `lastFocusedSelector` does not resolve for queue rows. The
   v5 README claims drawers "restore it to the trigger".
5. **Detector drift.** The design hook reports dozens of pre-existing findings in
   `styles/v4.css` and one in `src/app.js` (a literal `6px` radius at the
   notifications overlay, where `--r-xs` is the documented token). DESIGN.md's
   `systemDrift` note states these are true positives left deliberately visible.
   None were suppressed.
6. **Documentation drift.** The v5 README and the `<title>` in `index.html` are
   still v4.1 documents — the README says "v4.1" throughout, references
   `prototypes/impeccable-whole-site-redesign-v4` in every command, and does not
   mention v5. `.codex` holds V2, V3, and V4 record sets but no V5 equivalent.

## Files changed

Committed:

```text
prototypes/impeccable-whole-site-redesign-v5/src/app.js
prototypes/impeccable-whole-site-redesign-v5/src/surfaces/operations.js
prototypes/impeccable-whole-site-redesign-v5/styles/v4.css
docs/design/V5_REFERENCE_DEFECT_CORRECTIONS.md   (this record)
```

Changed but deliberately left uncommitted, per the reasoning under D4:

```text
prototypes/impeccable-whole-site-redesign-v5/tools/theme-test.mjs
```
