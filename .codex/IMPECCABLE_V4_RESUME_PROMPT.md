# Claude resume prompt — HAU-USC Logistics v4.1 preview

Resume in:
`D:\Documents\Codex\HAU-USC Logistics\worktrees\design-impeccable-whole-site-preview`

V4.1 is a closed, front-end-only design checkpoint. Implementation commit:
`a413824af98624c089560135f6168672aa86b656`. The documentation closure is the
commit containing this file. Do not trust these values without a fresh Git
handshake.

## Required cold start

1. Read root `AGENTS.md`, `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`,
   `.codex/IMPECCABLE_V4_CURRENT.md`, and
   `.codex/IMPECCABLE_V4_HANDOFF.md`.
2. Read the accepted
   `docs/design/IMPECCABLE_V4_1_FEEDBACK_AMENDMENT.md`, the studied DNA at
   `docs/design/IMPECCABLE_V3_EXTERNAL_DESIGN_DNA.md`, and the final review at
   `output/design/IMPECCABLE_REDESIGN_V4_1_REVIEW.md`.
3. Confirm branch `design/impeccable-whole-site-preview`, exact HEAD, upstream,
   divergence, and `git status --short`. Fetch when permitted. Preserve
   `.impeccable/hook.cache.json` and unknown/historical evidence directories;
   never clean, reset, or overwrite them.
4. Treat `prototypes/impeccable-whole-site-redesign-v4/` as authoritative and
   the v4 HTML as generated. Never hand-edit the export.
5. Confirm registry parity remains 33 routes / 53 variants. Icon-only drift is
   allowed; route IDs, labels, order, states, and workflows are not.

## Closed evidence

- Substantial redesign and logo/label-discounted two-second delta: PASS.
- Hallmark study/audit/redesign: 58/58.
- Theme: 13/13; motion: 13/13.
- Responsive/a11y: zero findings, errors, and external requests at 320, 375,
  414, 768, 1024, and 1440; contrast zero.
- Curated captures: 21/21.
- Exact before/after comparisons: 8/8.
- Finish review: `disposition: ship`; no material fix.
- Shareable artifact:
  `output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4.html`.

The Impeccable detector ran exactly once across source and export. Its output
was truncated; the only visible primary side-tab warning was repaired and
visible radius/font-size/color items were advisory. It was not rerun. Do not
rerun it merely to manufacture a clean total or claim one.

## If a new owner amendment arrives

Record the amendment before changing source. Then regenerate the export and
rerun registry, syntax, theme, motion, six-width verify, contrast, curated
screenshots, and comparison evidence in proportion to the change. Refresh
`DESIGN.md`, `.impeccable/design.json`, the review record, and continuity docs.
Keep work front-end preview only unless the new authority explicitly changes
that boundary.

Do not open a PR, merge, deploy, release, change application runtime/backend,
touch Worker/D1/R2/migrations/providers/authentication, or mutate production
under this handoff.
