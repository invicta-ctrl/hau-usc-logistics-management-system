# Codex prompt — FI-04 Landing atrium reproduction

Paste the block below to Codex. It is written to be executed, not interpreted.

---

```text
HAU-USC Logistics — FI-04
Reproduce the Figma Make landing atrium: hero environment, motion, contrast model,
colour pinning, and page structure.

Owner: Earl
Timezone: Asia/Manila
Stream: frontend-integration
Mode: READ AUTHORITY → SPEC → IMPLEMENT → VERIFY → RECEIPT
Predecessor: FI-02 (PASS) delivered the landing shell. It did not build the hero
environment — its own receipt records "MEDIA: PASS; no-media/media-failure hides
hero media". This slice builds that environment.

0. CONTROLLING DIRECTIVE

Do not reopen the design programme. The visual system is frozen at
DESIGN_BASELINE_2026-08-20-F and Figma Make v39. Your job is reproduction, not
design. Where this prompt and your taste disagree, this prompt wins; where this
prompt and the captured source disagree, the captured source wins.

You cannot open Figma. No MCP tool reads a /make/ URL. You do not need to:
the complete landing source is committed in this repository.

1. REQUIRED READING, IN ORDER

  docs/design/CODEX_LANDING_REPRODUCTION_HANDOFF.md   <- the spec for this slice
  docs/design/FIGMA_MAKE_SOURCE_REGISTER.md
  docs/design/FRONTEND_FI02_PUBLIC_LANDING_PORTAL_SHELL_RECEIPT.md
  DESIGN.md  D08.0 (canonical gold), D12 (light/dark), D41 (ladders, atrium)
  output/design/make-landing/                          <- the source of truth

2. SOURCE OF TRUTH

output/design/make-landing/ holds the Figma Make v39 landing, captured from the
live document on 2026-08-22. Nine files, no external assets — the hero poster is
an inline WebP data URI. Verify the sha256 values in the handoff before you start.
If any hash disagrees, STOP and report; do not proceed on a drifted source.

3. THE FIVE THINGS TO REPRODUCE

3.1 HERO MEDIA LAYER
    Poster-first. The poster is the FINAL revealed frame of the master clip, not
    the first — the clip opens near-black, so a first-frame poster inverts the
    intent. Crop: object-position 62% 50% desktop, 58% 42% below 768.

    In Make v39 HeroSection renders <HeroMotion /> with NO videoSrc, and no video
    asset exists in this repository. The hero is poster + scrim + entrance
    animation. Reproduce THAT. Do not add a video.

    Keep the video code path dormant and intact, including its four skip gates
    (prefers-reduced-motion, max-width 767px, saveData, 2g), the
    requestIdleCallback/2500 deferral, the error->drop-src fallback, and the
    .is-ready 1200ms cross-fade. If a video is ever supplied it must not loop.

3.2 CONTRAST MODEL
    Legibility comes from a LEFT-WEIGHTED wash, not from dimming the photograph.
    Two gradient layers, both required, exact stops in handoff §3.
    Below 768 the horizontal wash is REPLACED by a vertical-only wash.
    "If the whole hero reads uniformly dark, this is wrong."

    Measure hero text against the BRIGHTEST region of the poster behind it, not
    against an average. Record the measured ratios in the receipt.

3.3 COLOUR PINNING
    .digital-atrium and every .atrium__* token are THEME-INVARIANT — identical in
    light and dark. Everything below the hero themes fully.
    Canonical gold #D4AF37 light / #E1C671 dark, owner-locked D08.0.
    Never point an --atrium-* token at a mode-following token: that is defect
    MK-05, dark ink on a dark photograph.

3.4 STRUCTURE
    LandingPage = HeroSection + CurrentSection + LogisticsHubSection.
    Full tree, class names, and the four action destinations are in handoff §5.
    main#main-content is the landmark; the hero is labelled by #hero-heading;
    the entire media layer is aria-hidden and removing it must leave a readable
    hero.

3.5 ENTRANCE + GLASS
    .atrium__reveal: opacity 0, translateY(8px), animation atrium-enter,
    animation-delay calc(var(--i,0) * 70ms). Under prefers-reduced-motion the
    rule is cancelled outright and content is fully visible.
    Glass chrome values in handoff §5.2. More blur, never more fill.

4. BOUNDARY

  No backend, API, auth, data-contract, migration or dependency change.
  No provider write. No Figma write. No Playground or Production write.
  No new colour literal — the palette is generated from
  scripts/design/theme-source.mjs.
  Do not change route destinations. public.register remains unsupported/absent.

5. ACCEPTANCE — all must pass

  npm run design:make-landing     31/31 pinned chrome vs reading planes
  npm run design:contrast         66/66
  npm run design:tracker:check
  npm run build
  npm run verify:dist
  npm test

  Plus, evidenced with screenshots:
  - hero pixel-identical between light and dark; only sections below it change
  - hero text measured against the brightest poster region, ratio recorded
  - prefers-reduced-motion: no entrance animation, content visible, no video
  - below 768: poster only, vertical scrim, 58% 42% crop
  - 320 / 390 / 768 / 1024 / 1440, zero horizontal overflow
  - media layer removed by hand -> hero still reads

6. DO NOT

  Loop the hero video or add one where Make has none.
  Replace the two-gradient scrim with a uniform overlay.
  Use a first-frame poster.
  Re-point any atrium token at a modal token.
  "Improve" the design.

7. DELIVERABLE

  One coherent commit. A receipt at
  docs/design/FRONTEND_FI04_LANDING_ATRIUM_RECEIPT.md following the FI-02 receipt
  shape, including the measured contrast ratios and the design:make-landing
  result. Update the continuation/status authority. Push the working branch and
  verify clean and 0/0.

8. STOP CONDITIONS

  Report instead of guessing if:
  - a captured-source sha256 does not match the handoff
  - design:make-landing fails and the cause is not obviously your change
  - reproducing the scrim would require a new colour literal
  - the hero cannot clear AA against the brightest poster region

FIRST ACTION
Verify the nine sha256 values in handoff §1, then write the FI-04 specification
before touching any source file.
```

---

## Why this prompt is shaped the way it is

Three things in this slice are counter-intuitive enough that an implementer
acting reasonably will get them wrong without being told:

1. **The poster is the last frame.** Every instinct says frame 0. Frame 0 is
   near-black here, and using it makes the hero darken then light up.
2. **The scrim is not a dimmer.** Every instinct says "text on photo → darken the
   photo". The Make design deliberately leaves the right half open and weights
   the wash left.
3. **The hero does not theme.** Every instinct says a dark-mode toggle should
   change the hero. Pinning it is the accepted decision, and un-pinning it
   reproduces a defect that was already found and fixed twice (MK-05, MK-06).

The prompt also states plainly that there is no video, because the code contains
a complete video pipeline and an implementer reading it will otherwise assume one
is missing and go looking for the asset.
