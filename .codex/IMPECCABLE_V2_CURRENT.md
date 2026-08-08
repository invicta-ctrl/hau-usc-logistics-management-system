# Impeccable v2 Design Pointer

Design-branch-specific continuity record. This does **not** replace the
project-wide `.codex/CURRENT.md`, which governs the v0.7.2 production program.

```text
PROGRAM
  HAU-USC Logistics — Impeccable whole-site redesign preview v2
  ("Kinetic Institutional Operations"). Design preview only.
  Not a v0.7.2 amendment; the active spec §3.3 defers the v0.8.0 redesign.

STATUS
  CHECKPOINT_1_COMPLETE — v1 baseline frozen, v2 duplicated, continuity written.

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
  Slice B — v2 design system: bolder light/dark palettes, elevation and type
  scale, motion tokens, animated sun/moon theme toggle.

COMPLETED
  - Phase 0: v1 generated preview backed up byte-identically.
  - Phase 0: modular source duplicated to …-v2 (only tools/export.mjs differs,
    to write the v2 output filename).
  - Phase 0: v1 modular source and v1 generated preview verified unchanged.
  - Phase 1: continuity records written.

IN PROGRESS
  (nothing — checkpoint boundary)

NEXT ACTION
  Run the Impeccable boldness critique against the v1 baseline and record
  docs/design/IMPECCABLE_V2_BOLDNESS_CRITIQUE.md, then build the v2 token,
  motion and theme-toggle foundation in the v2 source.

OPEN DESIGN FINDINGS
  Owner: v1 is structurally strong but visually too bland (~4/10 energy).
  Target ~7.5/10: bolder, more modern, more animated, more premium, without
  becoming gaming/nightclub/startup-landing/neon/glassmorphism.

VERIFICATION STATE
  v1 (unchanged, still valid): Impeccable detector 0; 53 surface/state combos ×
  6 widths = 0 findings; contrast 0 failures both themes; 200% zoom 0 overflow;
  reduced motion honoured; 0 external requests; focus restored to trigger.
  v2: not yet verified — v2 currently equals v1 output plus the export rename.

RELEASE-BRANCH DRIFT NOTE
  release/v0.7.2-production-access-operations has moved independently during
  this design program: a18e8fc -> 1f216a1 -> 5ef9421 (read-only observation).
  a18e8fc remains an ancestor. Treat as external drift: do not merge release
  work into the redesign, do not modify the release branch, do not rebase.
  Of the files the v1 surface matrix cites, only src/domain/permissions.js had
  changed as of 1f216a1 (REQUEST_REVIEW granted to ADMINISTRATOR), which
  reinforces rather than contradicts the Request Center preview.
```
