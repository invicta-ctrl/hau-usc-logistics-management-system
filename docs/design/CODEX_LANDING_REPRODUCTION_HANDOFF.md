# Codex handoff — reproduce the Figma Make landing page

**Scope:** the public landing page — hero environment and its motion, the
readability model that makes the hero legible, the colour rules that govern it,
and the section structure of the page.

**Status of the source:** `RECOVERABLE_FROM_GIT`. Every file needed is committed
under `output/design/make-landing/`. **No external asset is required** — the hero
poster is an inline WebP data URI. You do not need to open Figma, and you cannot:
no MCP tool reads a `/make/` URL.

**This supersedes nothing.** FI-02 delivered the landing shell and passed. This
handoff covers the part FI-02 explicitly did not do: the hero *environment*.
FI-02's own receipt records `MEDIA: PASS; no-media/media-failure hides hero media`
— the shell is real, the atrium is not there yet.

---

## 1. Baseline

```text
FIGMA_MAKE_FILE      rP9W9MQlZkyQrUx38TVsFS
FIGMA_MAKE_VERSION   Version 39 · pending edits NONE
DESIGN_BASELINE      DESIGN_BASELINE_2026-08-20-F
CAPTURED             2026-08-22 from the live v39 document
SOURCE_LOCATION      output/design/make-landing/
EXTERNAL_ASSETS      none
```

| File | Bytes | sha256 (16) | What it is |
| --- | ---: | --- | --- |
| `LandingPage.tsx` | 687 | `e6c211e416715a66` | Page composition — three sections, nothing else |
| `HeroSection.tsx` | 2,262 | `276fb0624141fa7e` | `.digital-atrium` markup and hero copy |
| `HeroMotion.tsx` | 2,804 | `d381a326ea92276a` | Media layer: poster, video, gates |
| `heroPoster.ts` | 31,476 | `7708e9124e7223a3` | Inline WebP data URI, ~23 KB payload |
| `CurrentSection.tsx` | 2,682 | `73c10b44731c2c22` | "What the council is doing now" |
| `LogisticsHubSection.tsx` | 6,240 | `00ed59ae907bd67d` | Hub tiles + the six ledger steps |
| `landingData.ts` | 607 | `749fc12b92097edb` | `LEDGER_STEPS` content |
| `atrium-motion.css` | 5,234 | `f2538cbe43f03ba3` | Hero media, scrim, glass chrome |
| `index.css` | 27,878 | `281a620e29c20a75` | Everything else, incl. the reveal keyframe |

`index.css` is byte-identical across v36→v39; the atrium work touched
`theme.css` only.

---

## 2. Read this before you implement the hero

**The hero is not a video player.** In Make v39 `HeroSection` renders
`<HeroMotion />` with **no `videoSrc` prop**, and there is no video asset in this
repository. The video code path exists and is dormant. What a visitor actually
sees is:

```
poster (inline WebP)  +  two-gradient scrim  +  70 ms staggered entrance
```

Reproducing "the hero animation" faithfully means reproducing **that**. If you
ship an autoplaying video you have not matched Make — you have exceeded it, and
you have taken on a WCAG obligation Make deliberately avoided (§2.3).

### 2.1 Poster-first, and the poster is the LAST frame

From `HeroMotion.tsx`, verbatim intent:

> The poster is the FINAL revealed frame, not the first: the clip opens
> near-black, so a first-frame poster would make the hero render dark and then
> light up, which inverts the whole point.

So the static state is already the finished state. Do not "fix" this by grabbing
frame 0 of anything.

The poster crop is deliberate and recorded in `heroPoster.ts`: zoom 3.0,
posX 0.00, posY 0.60, chosen by scanning 1,188 candidate windows. Honour
`object-position: 62% 50%` on desktop and `58% 42%` below 768.

### 2.2 If you ever wire the video, these four gates are mandatory

`HeroMotion.tsx` skips the video entirely and keeps the poster when **any** of
these is true:

```js
prefers-reduced-motion: reduce
max-width: 767px
navigator.connection.saveData === true
navigator.connection.effectiveType matches /(^|-)2g$/
```

Attachment is deferred to `requestIdleCallback(fn, {timeout: 2500})`, falling
back to `setTimeout(fn, 1200)`. On `error` the `src` attribute is removed so a
missing derivative degrades to the poster rather than a broken box. On `playing`
the element gains `.is-ready`, which cross-fades opacity 0→1 over 1200 ms.

### 2.3 Nothing loops, and that is a compliance decision

`v.loop = false`. The clip plays once and holds its final frame. WCAG 2.2.2
governs auto-starting motion that runs past five seconds — motion that *ends* is
out of scope, which is why the landing carries no pause control and does not need
one. **If you make it loop, you owe a pause control.** Do not make it loop.

---

## 3. Contrast — the scrim is the mechanism, and it is not a dimmer

This is the part most likely to be got wrong, so it is stated plainly.

Cream text sits on a photograph. Legibility comes from a **left-weighted** wash,
not from darkening the picture. `atrium-motion.css` says it directly:

> The goal is "left text readable, right video expressive" — not a page-wide
> dimmer. If the whole hero reads uniformly dark, this is wrong.

Two layers, both required:

```css
/* 1 — horizontal wash, decays to nothing by 68% across */
linear-gradient(90deg,
  rgba(28,4,6,0.90)  0%,
  rgba(28,4,6,0.78) 22%,
  rgba(28,4,6,0.50) 42%,
  rgba(28,4,6,0.18) 56%,
  rgba(28,4,6,0.00) 68%)

/* 2 — light top/bottom vignette that seats the glass bar; middle untouched */
linear-gradient(180deg,
  rgba(24,3,5,0.88)  0%,
  rgba(24,3,5,0.62)  9%,
  rgba(28,4,6,0.16) 22%,
  rgba(28,4,6,0.00) 46%,
  rgba(28,4,6,0.28) 100%)
```

Below 768 the horizontal wash is **replaced** by a vertical-only wash
(0.72 → 0.58 → 0.42 → 0.60), because a narrow frame gives the copy nowhere to sit.

**Acceptance:** measure hero text against the *brightest* region the poster puts
behind it, not against an average. FI-02 already measured the equivalent numbers
for its own shell — light hero 14.75:1, dark hero 12.42:1 — so the bar is set
well above AA and you should expect to clear it comfortably. If you do not, the
fault is the crop or the wash stops, not the ink.

---

## 4. Colour — the atrium is pinned, everything below it themes

This is settled design authority, already verified. Do not re-litigate it and do
not "improve" it.

| Region | Behaviour | Why |
| --- | --- | --- |
| `.digital-atrium` and all `.atrium__*` | **Theme-invariant.** Identical in light and dark. | It is a permanently dark photographic section. DESIGN.md D41; MK-05, MK-06 |
| Everything below the hero | **Themes fully.** Every colour token resolves to a different value in dark. | DESIGN.md D12 — light and dark are equal modes; V-36 forbids mixed-theme frames |

Both halves are enforced mechanically:

```bash
npm run design:make-landing     # 31 tokens: pinned chrome vs reading planes
```

That check is the acceptance gate for this work. It reads the stylesheet, splits
rules into the two groups above, and asserts each group behaves correctly. It
passes today at 31/31 and must still pass when you are done.

Canonical gold is `#D4AF37` (light) / `#E1C671` (dark), owner-locked as
DESIGN.md D08.0. The atrium's own gold does not follow the mode.

**A trap worth naming.** The atrium's tokens were originally live references to
the brand palette (`--atrium-ink: var(--paper-warm)`). That worked only because
the palette had no dark mode. Giving the palette a proper dark mode turned the
hero title into dark ink on a dark photograph — MK-05. The fix was to pin all
nine `--atrium-*` tokens, plus four more that painted straight from the palette
(MK-06). If you re-point any atrium token at a modal token, you reintroduce
exactly that defect.

---

## 5. Structure

```
LandingPage
├── HeroSection            <section id="hero" class="digital-atrium">
│   ├── HeroMotion         .atrium__g0 > .atrium__poster + .atrium__video
│   │                      .atrium__scrim
│   └── .atrium__stage
│       └── .atrium__copy.atrium__reveal   style={{ "--i": 0 }}
│           ├── .atrium__institution   "HAU-USC · Institutional Logistics Ledger"
│           ├── h1.atrium__title       "Every request. Every handoff. On record."
│           ├── .atrium__lede
│           ├── .atrium__actions
│           │   ├── .atrium__primary          → onRequireAuth("request-center")
│           │   └── .atrium__secondary
│           │       .hero-action--glass       → onNavigate("borrow")
│           └── .atrium__secondary-paths
│               ├── .atrium__text-action      → onNavigate("tracking")
│               └── .atrium__text-action      → onNavigate("staff-signin")
├── CurrentSection         "what the council is doing now"
└── LogisticsHubSection    hub tiles + LEDGER_STEPS (01 Request … 06 Ledger)
```

`main#main-content` is the landmark. The hero is labelled by `#hero-heading`.
Everything in `HeroMotion` is `aria-hidden` — remove the whole media layer and
the hero still reads. Keep that property.

### 5.1 Entrance choreography

Defined in `index.css`, not in the motion file:

```css
.atrium__reveal {
  opacity: 0;
  transform: translateY(8px);
  animation: atrium-enter var(--dur-narrative) var(--ease-out) forwards;
  animation-delay: calc(var(--i, 0) * 70ms);
}
@keyframes atrium-enter { to { opacity: 1; transform: none; } }
```

Stagger is driven by an inline `--i` per element. Under
`prefers-reduced-motion: reduce` the rule is cancelled outright
(`animation: none !important; opacity: 1 !important; transform: none !important`)
— the content must be visible, not merely un-animated.

### 5.2 Glass chrome

Frost carries legibility; opacity does not. When the plate underneath gets busy
the fix is **more blur, never more fill**.

| Element | Fill | Backdrop |
| --- | --- | --- |
| `.public-nav--glass` | `rgba(28,4,6,0.30)` | `blur(18px) saturate(135%)` |
| `.nav-glass` | `rgba(255,253,248,0.06)` | `blur(10px) saturate(120%)` |
| `.hero-action--glass` | `rgba(255,253,248,0.08)` | `blur(12px) saturate(125%)` |

The video runs *behind* the top bar — the bar floats, it does not cap the hero.

---

## 6. Acceptance

```bash
npm run design:make-landing     # 31/31 — pinned chrome vs reading planes
npm run design:contrast         # 66/66
npm run design:tracker:check
npm test
```

Plus, specific to this slice:

- Hero renders identically in light and dark; only the sections below it change.
- Hero text measured against the brightest region of the poster behind it.
- `prefers-reduced-motion`: no entrance animation, content fully visible, no video.
- Below 768: poster only, vertical scrim, `58% 42%` crop.
- Responsive matrix 320 / 390 / 768 / 1024 / 1440, zero horizontal overflow.
- The media layer stays `aria-hidden`; removing it leaves a readable hero.

## 7. Do not

- Loop the hero video, or add one where Make has none.
- Replace the two-gradient scrim with a uniform overlay.
- Point any `--atrium-*` token at a mode-following token.
- Introduce a new colour literal — the palette is generated from
  `scripts/design/theme-source.mjs`.
- Take a first-frame poster.
- Change route destinations; `public.register` remains unsupported and absent.
