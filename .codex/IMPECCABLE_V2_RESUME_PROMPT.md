# Codex Resume Prompt — Impeccable v2 Redesign

Paste everything in the fenced block below into a fresh Codex task, from the
repository root. It is self-contained: do **not** reconstruct state from chat.

---

```text
INTENT
DOCUMENT_OR_ARTIFACT with secondary WRITING, ARCHITECTURE, and isolated
SOFTWARE_FEATURE. Design preview only — not production integration.

MODE
Continue the isolated Impeccable whole-site redesign preview v2
("Kinetic Institutional Operations") on the existing design worktree.

REQUIRED ENTRY SEQUENCE
Read, in this order, and nothing else by default:
1. AGENTS.md
2. .codex/CURRENT.md                      (project-wide pointer; v0.7.2 program)
3. .codex/PHASE_AND_CONTEXT_POLICY.md
4. .codex/IMPECCABLE_V2_CURRENT.md        (this design program's pointer)
5. .codex/IMPECCABLE_V2_HANDOFF.md        (durable technical record)
6. Only the v2 preview source needed for the current slice:
   prototypes/impeccable-whole-site-redesign-v2/

Do not broad-scan the repository. Do not re-read the reference HTML in full —
docs/design/IMPECCABLE_REFERENCE_ANALYSIS.md already records it.

BRANCH AND WORKTREE
Design branch : design/impeccable-whole-site-preview
Worktree      : ../worktrees/design-impeccable-whole-site-preview
The authoritative checkout stays on release/v0.7.2-production-access-operations
and must never be written by this program. Do not switch it. Do not rebase the
design branch onto the moving release branch. Treat release movement as
external drift: record the new SHA, do not merge it.

REQUIRED HANDSHAKE BEFORE WRITING
1. Report design worktree root, branch, HEAD, and `git status --short`.
2. Report the release checkout's branch and SHA read-only; confirm it is clean.
3. `git fetch origin --prune` when network is available.
4. Confirm no unknown work exists in the design worktree.
5. Verify docs/design/references/HAU_USC_Logistics_v0.7.2_UI_Repair_Unified_Icons_Reference.html
   is SHA-256 44d2800695d0f9546911522eba1b240ff405b4dbbfc85493ac27ea90f7e0972c
6. Verify output/design/backups/…_v1_Baseline_Backup.html is SHA-256
   bbefd9972a6d825db71b648e6470383514bc5fec1f2bf0a6b9299f2e8b420f5a
   and still equals output/design/…Preview.html
7. Verify prototypes/impeccable-whole-site-redesign/ (v1) is unmodified.
Stop rather than overwrite unknown work. Never reset, clean, discard, force
checkout, or force-push.

OBJECTIVE
v1 is structurally strong but visually too bland (~4/10 energy). Produce v2 at
~7.5/10: bolder, more modern, more beautiful, more animated, more expressive,
more premium — while remaining appropriate for a university logistics
operations system, efficient for daily use, accessible, and information-dense
where operations require it. Still clearly HAU-USC, never generic SaaS.

Do NOT drift into gaming UI, nightclub aesthetics, startup landing pages, neon
cyberpunk, glassmorphism overload, clutter, or gimmicks.

OWNER AMENDMENTS
1. Visual energy ~4/10 -> ~7.5/10.
2. Theme toggle is a real visual feature: sun icon in light, moon icon in dark,
   animated transform (rotate/scale/crossfade) of 180-260 ms rather than an
   instant swap. Surfaces transition without flashing. Preference persists
   locally; system preference is only the first-run default. Accessible name
   describes the action; accessible state stays truthful; respects
   prefers-reduced-motion. No heavy animation dependency.
3. Purposeful animation required. Motion must communicate hierarchy, state
   change, navigation, context, completion, progressive disclosure, or live
   operational attention. If the only justification is "it looks cool", remove
   it. At most one continuous animation per visible viewport, preferably zero.

MOTION TOKENS
instant feedback 100-140ms; small component 160-220ms; surface transition
220-320ms; drawer/modal 240-360ms; large staged reveal 280-480ms.
Easing cubic-bezier(0.22, 1, 0.36, 1). No bounce. No endless decorative loops.

WORK BOUNDARY
All edits happen in prototypes/impeccable-whole-site-redesign-v2/.
Never modify: prototypes/impeccable-whole-site-redesign/ (v1 source),
output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview.html,
output/design/IMPECCABLE_REDESIGN_REVIEW.md,
output/design/impeccable-redesign-screens/,
output/design/backups/, or docs/design/references/.

DELIVERABLES
prototypes/impeccable-whole-site-redesign-v2/
output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v2.html
output/design/impeccable-redesign-v2-screens/
docs/design/IMPECCABLE_V2_BOLDNESS_CRITIQUE.md
docs/design/IMPECCABLE_V2_DESIGN_DIRECTION.md
docs/design/IMPECCABLE_V2_MOTION_SYSTEM.md
docs/design/IMPECCABLE_V2_SURFACE_MATRIX.md
docs/design/IMPECCABLE_V2_DECISIONS.md
output/design/IMPECCABLE_REDESIGN_V2_REVIEW.md   (must compare v1 vs v2)
Update DESIGN.md only for durable new rules; mark superseded v1 rules
explicitly rather than deleting valid ones.

SURFACE COVERAGE
Preserve v1 coverage: 32 surfaces across Public, shared authenticated shell,
role workspaces (Administrator, Director, Food, Inventory, Materials, System
Owner), Operations, and Administration. Do NOT invent a Reports surface — the
repository has src/features/reports/ with no bootstrap module and no view
template. Keep the required states: loading, empty, populated, success,
validation error, permission denied, provider unavailable, stale/revision
conflict, partial completion, long text, large quantity, mobile narrow.

VERIFICATION (run, do not assume)
node prototypes/impeccable-whole-site-redesign-v2/tools/export.mjs
node <impeccable-skill>/scripts/detect.mjs prototypes/impeccable-whole-site-redesign-v2/
PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs node \
  prototypes/impeccable-whole-site-redesign-v2/tools/verify.mjs \
  output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v2.html \
  output/design/impeccable-redesign-v2-screens
PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs node \
  prototypes/impeccable-whole-site-redesign-v2/tools/contrast.mjs \
  output/design/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v2.html
git diff --check

The design worktree has no node_modules; PLAYWRIGHT_PATH must point at an
existing install. Required results: detector 0; 0 accessibility/responsive
findings at 320/375/414/768/1024/1440; 0 contrast failures in both themes;
0 overflow at 200% zoom; reduced motion honoured; focus restored to trigger;
0 non-file: network requests. Also verify theme persistence and the animated
sun->moon->sun transition.

GIT AUTHORIZATION (owner-granted, this design branch only)
Authorized: local commits on design/impeccable-whole-site-preview; creating and
pushing that branch to origin; fast-forward pushes to it.
NOT authorized: pull request, merge, main, release-branch write, production,
staging deployment, Cloudflare, D1, R2, Google Sheets/Drive, migrations,
DNS/domain, secrets, destructive cleanup.
Do not commit .impeccable/hook.cache.json (tooling cache).

CHECKPOINTS
Commit and push small durable checkpoints; do not hold hours of work
uncommitted. On usage limits: stop adding scope, make the code coherent, update
.codex/IMPECCABLE_V2_CURRENT.md and .codex/IMPECCABLE_V2_HANDOFF.md, run the
smallest relevant verification, commit, push, and print the resume instruction.

START HERE
Read .codex/IMPECCABLE_V2_CURRENT.md -> NEXT ACTION and execute exactly that
bounded slice. Update CURRENT and HANDOFF before finishing.
```
