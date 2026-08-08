# Current Bounded Task

> **BRANCH-LOCAL RECORD.** This file describes work on
> `frontend-design-integration` only. `.codex/CURRENT.md` is the project-wide
> pointer, owned by `main`; this branch does not fork it.

INTENT: SOFTWARE_FEATURE
MODE: HANDOFF - work paused, branch is a verified increment
OBJECTIVE: Integrate the V4.1 visual language into the authoritative HAU-USC Logistics front end while preserving every production route, workflow, form, action, status, permission boundary, and service contract.
TARGET: frontend-design-integration
BRANCH_SPEC: .codex/specs/active/v0.7.3-frontend-design-integration.md
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED - 2026-08-09, released at handoff. A future writer must re-claim it, and must first reconcile the milestone conflict below.
GIT_UPSTREAM: origin/frontend-design-integration
ORIGINAL_BASE_SHA: 7245c717f2b8bff3f327b47ff844281d94eaa1db
PRODUCTION_RELEASE_AT_START: v0.7.2 @ 84eacfcdb47a3985fed48e3ba14bb413946d4410
ROLLBACK_POINT: f0312b76bd8401e2aa5b9947252642bdb693b19d
STATUS: VERIFIED INCREMENT - NOT AN ACCEPTANCE CANDIDATE

## MILESTONE CONFLICT - read before resuming

This branch was authorized under an owner-accepted specification,
`.codex/specs/active/v0.7.3-frontend-design-integration.md`, on 2026-08-09.

Since then `main` has advanced and now records:

    MILESTONE:     V0.8.0 Inventory Truth and Ledger Lock Owner Decision
    STATUS:        READY - V0.7.3 CLOSED WITH NO RUNTIME PATCH REQUIRED
    ACCEPTED_SPEC: .codex/specs/active/v0.7.3-rollout-stabilization.md
    WRITER_LOCK:   RELEASED

So v0.7.3 is closed on `main` while this branch holds an accepted v0.7.3
front-end specification that was never completed or withdrawn.

Nothing is lost and nothing conflicts in code: `main` changed no file under
`src/` since this branch's base. The conflict is governance only.

The owner must choose one:

1. Re-scope this branch under v0.8.0 - carry the accepted specification
   forward as a v0.8.0 front-end slice and re-accept it.
2. Complete it as a late v0.7.3 item - reopen the milestone for this scope.
3. Park the branch - it is a verified increment and can sit indefinitely; the
   merged design programme is preserved either way.

Do not resume implementation until this is resolved, and do not overwrite
`.codex/CURRENT.md`.

## Done and verified

- Specification gate satisfied: proposed, owner-accepted, lock claimed,
  rollback point recorded before the first source edit.
- Personal data removed from the shipped front end. `src/visual/runtime.js`
  carried ten real person names including the owner's, compiled into the
  deployed v0.7.2 bundle and rendered with no session at all.
- 17.2 design foundation: surface ladder, elevation ramp, motion tokens, type
  scale, compositional anchors, decorative grid neutralised, three
  previously-undefined tokens defined.
- 4.1 docked record detail across all eleven detail surfaces, reusing the
  existing drawer, with aria-modal following the visual state.
- 17.7 copy pass: environment badge, scope control, loading and status copy in
  plain language, no infrastructure names.
- 17.8 preview-chrome sweep: clean.
- Impeccable design programme merged; branch renamed.
- DESIGN.md reconciled to the production token layer, with a systemDrift
  record of the genuine remaining drift.

Verification at handoff: npm run test 121 files / 837 tests passed; npm run
lint 0 errors and 1 pre-existing warning; npm run verify:dist verified fresh
preview parity, the standalone, guided demo, and seven module shareables.

## Remaining

- 17.3 shell and signature controls. Reference implementations already exist
  and are proven against the owner's reference images:
  prototypes/impeccable-whole-site-redesign-v5/styles/v5.css and
  src/components.js celestialToggle, against
  docs/design/references/v0.4.1-control-references/. Cheapest next win.
- 17.4 landing page and progressive-enhancement 3D hero with static fallback.
- 17.5 and 17.6 operational and administration surface composition.
- 17.9 functional parity gate - NOT RUN. The specification requires browser
  evidence per journey. Until that exists this branch is not acceptance-ready.
- Four section 9 deliverables missing: V4_1_PRODUCTION_COPY_GUIDE.md,
  V4_1_PRODUCTION_MOTION_AND_3D.md,
  V4_1_PRODUCTION_FUNCTIONAL_PARITY_REPORT.md,
  V4_1_PRODUCTION_VISUAL_ACCEPTANCE.md.
- Typography, colour and radius consolidation - see systemDrift in DESIGN.md.
- .impeccable/design.json is stale against DESIGN.md.

## Traps that already cost time - do not repeat

- tests/unit/visual-baseline.test.js pins src/styles/visual/*.css
  byte-for-byte to legacy/HAU-USC_Logistics-Prototype.original.html, which
  AGENTS.md preserves. Append AFTER the preserved cascade; never rewrite it and
  never insert mid-file. The sanctioned pattern is proven on tokens-base.css
  and overlays.css.
- The same test pins the exact string "Reset Demo Data is available only in
  local preview mode." as an interaction hook. Rewording it breaks a
  deliberate invariant.
- npm run build leaves the guided demo out of step with dist/index.html and
  verify:dist fails. Run scripts/create-shareable.mjs a second time after the
  vite build. This is the hazard AGENTS.md records.
- Detector findings inside the preserved cascade are true positives that cannot
  be fixed until that guard is addressed per module. No ignore is applied for
  them; do not add one.

## Known-good verification sequence

    npm run build && node scripts/create-shareable.mjs && npm run verify:dist \
      && npm run test && npm run lint

Tooling that needs Playwright takes PLAYWRIGHT_PATH pointing at an existing
install; this worktree may have its own node_modules, the design worktree does
not.

## Boundaries that still hold

Front-end only. No back-end, service contract, migration, provider, D1, R2,
Google, auth-model, deployment, staging, production, DNS, or release-tag change
was made, and none is authorized. Nothing is deployed, merged to main, or
tagged.
