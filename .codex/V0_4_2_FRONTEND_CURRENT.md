# v0.4.2 Front-End Design Pointer — Glossy Command Center

Design-branch-specific record. Does **not** replace `.codex/CURRENT.md`, which
governs the v0.7.x production program.

```text
PROGRAM
  HAU-USC Logistics — Glossy Command Center front-end preview (owner-named
  design checkpoint v0.4.2, continuing Codex's v0.4.1). Front-end only.

STATUS
  PARTIAL — CHECKPOINT SAVED.
  Signature controls delivered and verified. The WebGL globe, broad glass
  application, and the extreme-motion system are NOT built yet.

DESIGN BRANCH / WORKTREE
  design/impeccable-whole-site-preview
  ../worktrees/design-impeccable-whole-site-preview
  The authoritative checkout stays on release/v0.7.2-production-access-operations
  and was never written by this program.

STARTING SHA   2aa7ba1de840cbfd855ad3d88c8e5666f1e15001  (Codex, "close v4.1 preview handoff")

V0.4.1 BASELINE (protected, do not modify)
  source : prototypes/impeccable-whole-site-redesign-v4/
  export : output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html
  backup : output/design/backups/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4_1_Baseline_Backup.html
  sha256 : 99a74cc1d6daeecfe3a14b267b19f71d4491fd135a10a8a904b0c94f18b27072  (export == backup, verified)

V0.4.2 CANDIDATE
  source : prototypes/impeccable-whole-site-redesign-v5/
  export : output/design/HAU_USC_Logistics_Glossy_Command_Center_v0.4.2_Preview.html
  new layer: styles/v5.css (loads after v4.css; overrides only what changed)

REFERENCE AUTHORITY (committed)
  docs/design/references/HAU_USC_Logistics_v0.4.1_Glossy_Command_Center_Reference_Pack.pdf
    sha256 ddbe9413191751c79b6609f13973ba84b4a87f26e882f23c37be36e24a0f14db
  docs/design/references/v0.4.1-control-references/
    daynight-toggle-TARGET.png   <- the moon/toggle visual authority
    menu-ANTI-REFERENCE.png      <- rejected plain three-line menu
    back-ANTI-REFERENCE.png      <- rejected large thin outlined circle

COMPLETED THIS SESSION
  - Read-only recovery handshake. Codex's v3/v4/v4.1 work was already committed
    and pushed; nothing was uncommitted, nothing was at risk, nothing discarded.
  - v0.4.1 export backed up byte-identically; v4 source duplicated to v5.
  - Reference PDF text extracted and the three control images recovered from the
    PDF (they are Flate-compressed, so naive carving fails — PyMuPDF was used).
  - Celestial day/night toggle rebuilt to the reference: FILLED crescent moon
    and filled sun with separated rays, drawn as dedicated inline SVG rather
    than through the monoline sprite. The v4.1 control routed both glyphs
    through the sprite, which forces fill="none" stroke="currentColor" — so the
    moon rendered as an OUTLINE crescent, exactly what the owner rejected.
  - Glossy capsule: travelling plate, press compression, sheen sweep, ray
    contraction, glyph inversion under the plate.
  - Kinetic menu morph and compact glossy back control.
  - Glass + glow token system defined in v5.css with backdrop-filter feature
    detection and solid fallbacks.

NOT DONE — next slices, in priority order
  1. WebGL routing globe (the brief's "required signature feature") + 2D
     fallback, reduced-motion behaviour, DPR cap, visibility pause, disposal.
     Three.js is NOT vendored yet. npm and pypi were both reachable from this
     machine, so `npm i three` into the isolated preview is viable.
  2. Apply the glass system broadly (command bar, telemetry panels, drawers,
     filters, quick actions) — currently the tokens exist and only the
     signature controls consume them.
  3. Dark ground re-tone: v4.1's dark mode is predominantly maroon. The brief
     asks for deep charcoal / warm near-black with an oxblood TINT.
  4. Extreme-but-purposeful motion: command-center entrance sequence, glass
     pointer tilt, telemetry reveal, route-tracer loading language.
  5. Before/after visual delta matrix (11 named views) and the delta gate.

VERIFICATION AT THIS CHECKPOINT (all run, not assumed)
  contrast          0 failures, both themes
  a11y/responsive   0 findings at 320/375/414/768/1024/1440
  console errors    0
  runtime network   0 non-file: requests
  keyboard          0 suppressed focus rings; dialog traps and restores focus
  reduced motion    honoured
  200% zoom         0 overflow
  celestial toggle  13/13 acceptance checks pass (tools/theme-test.mjs)
  Impeccable detector 71 findings vs 58 on the v4.1 baseline — the 13 added are
    design-system DOCUMENTATION drift from the new glass/glow literals
    (radius/font-size/colour outside the DESIGN.md sidecar scale), not visual
    anti-patterns. Recording the glass tokens in the DESIGN.md frontmatter
    would clear them.

RELEASE-BRANCH DRIFT
  release/v0.7.2-production-access-operations moved independently during this
  program: a18e8fc -> 1f216a1 -> 5ef9421 -> 4ed88ae. Read-only observation.
  Never merged, never rebased onto, never written.

NEXT ACTION
  Slice 1 above (WebGL globe). See .codex/V0_4_2_FRONTEND_RESUME_PROMPT.md.
```
