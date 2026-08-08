# Impeccable v2 Design Pointer

Design-branch-specific continuity record. This does **not** replace the
project-wide `.codex/CURRENT.md`, which governs the v0.7.2 production program.

```text
PROGRAM
  HAU-USC Logistics — Impeccable whole-site redesign preview v2
  ("Kinetic Institutional Operations"). Design preview only.
  Not a v0.7.2 amendment; the active spec §3.3 defers the v0.8.0 redesign.

STATUS
  CHECKPOINT_2_COMPLETE — v2 visual system, motion system, and animated theme
  toggle are in place and verified. Surface-level application is next.

DESIGN BRANCH
  design/impeccable-whole-site-preview

WORKTREE
  D:\Documents\Codex\HAU-USC Logistics\worktrees\design-impeccable-whole-site-preview
  (linked worktree; the authoritative checkout stays on
   release/v0.7.2-production-access-operations and is never written by this program)

STARTING SHA
  a18e8fcb2fccf9a0fd0e7bac86fefa2b98480df4

CURRENT SHA
  see `git -C <worktree> rev-parse HEAD` — updated at each checkpoint

BASELINE BACKUP HASH
  bbefd9972a6d825db71b648e6470383514bc5fec1f2bf0a6b9299f2e8b420f5a
  output/design/backups/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v1_Baseline_Backup.html
  == SHA-256 of output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview.html (verified)

V2 SOURCE PATH
  prototypes/impeccable-whole-site-redesign-v2/

V2 OUTPUT PATH
  output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v2.html

CURRENT DESIGN SLICE
  Slice C — apply the v2 system across every surface family: public portals,
  role overviews, operational queues and detail, administration, and mobile.

COMPLETED
  - Phase 0: v1 generated preview backed up byte-identically.
  - Phase 0: modular source duplicated to …-v2 (only tools/export.mjs differs,
    to write the v2 output filename).
  - Phase 0: v1 modular source and v1 generated preview verified unchanged.
  - Phase 1: continuity records written.
  - Slice A: boldness critique recorded at
    docs/design/IMPECCABLE_V2_BOLDNESS_CRITIQUE.md.
  - Slice B: v2 token layer (real surface ladder in both themes, raised type
    scale, radius variety, three-step elevation), motion system
    (styles/motion.css), and the animated sun/moon theme toggle with local
    persistence, first-run system default, truthful aria-pressed, and
    reduced-motion support.

IN PROGRESS
  (nothing — checkpoint boundary)

NEXT ACTION
  Apply v2 composition surface by surface, starting with the public portal
  family and the operational queue/detail pattern. Then write
  IMPECCABLE_V2_DESIGN_DIRECTION.md, IMPECCABLE_V2_MOTION_SYSTEM.md,
  IMPECCABLE_V2_SURFACE_MATRIX.md, IMPECCABLE_V2_DECISIONS.md, and the
  v1-vs-v2 comparison review, then capture v2 screenshots.

OPEN DESIGN FINDINGS
  Owner: v1 is structurally strong but visually too bland (~4/10 energy).
  Target ~7.5/10: bolder, more modern, more animated, more premium, without
  becoming gaming/nightclub/startup-landing/neon/glassmorphism.

VERIFICATION STATE
  v1 (unchanged, still valid): Impeccable detector 0; 53 surface/state combos ×
  6 widths = 0 findings; contrast 0 failures both themes; 200% zoom 0 overflow;
  reduced motion honoured; 0 external requests; focus restored to trigger.
  v2 (at checkpoint 2): Impeccable detector 0 after fixing three real findings
  (a 4px side-stripe AI tell on the attention band, and two layout-thrashing
  transitions on height/width, now transform-driven); 53 surface/state combos ×
  6 widths = 0 findings; contrast 0 failures in both themes; 200% zoom 0
  overflow; reduced motion honoured; focus restored to trigger; 0 non-file:
  network requests; 0 console errors.

  Harness note: both verify.mjs and contrast.mjs now freeze transitions and
  animations before sampling. v2 animates theme changes and surface entry, and
  reading computed geometry or colour mid-animation produced phantom failures
  (interpolated colours reporting fg ~= bg).

RELEASE-BRANCH DRIFT NOTE
  release/v0.7.2-production-access-operations has moved independently during
  this design program: a18e8fc -> 1f216a1 -> 5ef9421 (read-only observation).
  a18e8fc remains an ancestor. Treat as external drift: do not merge release
  work into the redesign, do not modify the release branch, do not rebase.
  Of the files the v1 surface matrix cites, only src/domain/permissions.js had
  changed as of 1f216a1 (REQUEST_REVIEW granted to ADMINISTRATOR), which
  reinforces rather than contradicts the Request Center preview.
```
