# Codex Resume Prompt - Front-End Design Integration

Paste the fenced block into a fresh Codex task from the repository root.
Self-contained: do not reconstruct state from chat.

---

```text
INTENT
SOFTWARE_FEATURE, with DOCUMENT_OR_ARTIFACT, WRITING, TESTING, REVIEW.
Front-end only. Not a full-stack task.

MODE
Resume the paused front-end design integration on branch
frontend-design-integration.

READ FIRST - and nothing else by default
1. AGENTS.md
2. .codex/CURRENT.md                  (project pointer, owned by main)
3. .codex/PHASE_AND_CONTEXT_POLICY.md
4. .codex/CURRENT_TASK.md             (branch-local record - START HERE)
5. .codex/specs/active/v0.7.3-frontend-design-integration.md
6. docs/design/PRODUCTION_FRONTEND_PARITY_BASELINE.md
7. Only the src/ files needed for the current slice
Do not broad-scan. Do not read the prototypes/ trees unless porting a control.

STOP BEFORE IMPLEMENTING - MILESTONE CONFLICT
This branch holds an owner-accepted v0.7.3 front-end specification. main has
since closed v0.7.3 ("V0.7.3 CLOSED WITH NO RUNTIME PATCH REQUIRED") and moved
to a V0.8.0 Inventory Truth and Ledger Lock decision with WRITER_LOCK RELEASED.

No code conflicts - main changed no src/ file since this branch's base. The
conflict is governance only.

Ask Earl to choose: re-scope this work under v0.8.0, reopen v0.7.3 for this
scope, or park the branch. Do not resume implementation until he answers, and
never overwrite .codex/CURRENT.md - main owns it.

HANDSHAKE
Report worktree root, branch, HEAD, upstream, git status --short. Confirm the
release checkout is untouched. Never reset, clean, discard, force-checkout, or
force-push.

SCOPE
Allowed: src/ front-end source, front-end artifacts regenerated through
repository build scripts, user-facing copy, front-end animation, a
progressive-enhancement 3D landing hero, and front-end/browser/accessibility
tests.
Forbidden: back-end rules, D1, R2, migrations, Worker service contracts,
Google Sheets/Drive, providers, the auth model, deployment, staging,
production, DNS, release tags, and merge to main.

NEXT SLICE - 17.3 shell and signature controls
Port from the proven preview implementations rather than rebuilding:
  prototypes/impeccable-whole-site-redesign-v5/styles/v5.css
  prototypes/impeccable-whole-site-redesign-v5/src/components.js  (celestialToggle)
Visual authority: docs/design/references/v0.4.1-control-references/
  daynight-toggle-TARGET.png   filled crescent moon in a glossy travelling plate
  menu-ANTI-REFERENCE.png      the plain three-line menu to replace
  back-ANTI-REFERENCE.png      the large thin outlined circle to replace
The moon must be a FILLED silhouette. Never route celestial glyphs through the
monoline sprite - it forces fill=none stroke=currentColor and produces the
outline moon the owner rejected.

THEN
17.4 landing page and 3D hero with static fallback; 17.5 and 17.6 operational
and administration composition; 17.9 the functional parity gate, which has NOT
been run and which the specification requires before acceptance. Also produce
the four missing section 9 deliverables: V4_1_PRODUCTION_COPY_GUIDE.md,
V4_1_PRODUCTION_MOTION_AND_3D.md, V4_1_PRODUCTION_FUNCTIONAL_PARITY_REPORT.md,
V4_1_PRODUCTION_VISUAL_ACCEPTANCE.md.

TRAPS - these already cost time
- tests/unit/visual-baseline.test.js pins src/styles/visual/*.css byte-for-byte
  to legacy/HAU-USC_Logistics-Prototype.original.html, which AGENTS.md
  preserves. APPEND after the preserved cascade. Never rewrite it, never insert
  mid-file. The sanctioned pattern is proven on tokens-base.css and
  overlays.css.
- The same test pins the exact string "Reset Demo Data is available only in
  local preview mode." Rewording it breaks a deliberate invariant.
- npm run build leaves the guided demo out of step with dist/index.html and
  verify:dist fails. Run scripts/create-shareable.mjs a SECOND time after the
  vite build.
- Detector findings inside the preserved cascade are true positives that cannot
  be fixed until that guard is addressed per module. No ignore is applied. Do
  not add one. See systemDrift in DESIGN.md.
- Do not hand-edit dist/index.html, the shareables, or the guided demo.
  Regenerate through repository scripts.

VERIFY - run, do not assume
npm run build && node scripts/create-shareable.mjs && npm run verify:dist \
  && npm run test && npm run lint
Required: 837 tests passing, 0 lint errors, verify:dist clean. Add browser
evidence per journey for 17.9, plus responsive 320/375/414/768/1024/1440,
contrast, keyboard, focus restoration, 200% zoom, and reduced motion.

GIT
Commit and push on frontend-design-integration only. No PR, no merge, no main,
no release branch, no tags, no deployment. Do not commit
.impeccable/hook.cache.json.

START
Read .codex/CURRENT_TASK.md, resolve the milestone conflict with Earl, then
execute the next slice.
```
