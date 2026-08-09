# Current Bounded Task

> **BRANCH-LOCAL RECORD.** This file describes
> `frontend-design-integration`. `.codex/CURRENT.md` remains the project-wide
> pointer owned by `main` and is intentionally unchanged.

INTENT: SOFTWARE_FEATURE
MODE: EXECUTE - owner-directed v5 architecture transfer into the real frontend
OBJECTIVE: Transfer exact production functionality into the modular v5 frontend architecture without changing backend behavior or contracts.
TARGET: frontend-design-integration
BRANCH_SPEC: .codex/specs/active/v0.7.3-frontend-design-integration.md
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.7.3-frontend-design-integration.md
AUTHORITY: Earl's V4.2/v5 correction -> accepted frontend specification amendment -> AGENTS.md -> branch-local task/handoff -> verified Git state
REQUIRED_MODEL: Requested routing is platform-accepted; exact runtime identity is not agent-attestable
RISK: HIGH - whole-frontend presentation architecture transfer with strict functional parity; no backend or production authority
SCOPE: Accepted-spec amendment; required route transfer map; real frontend source; frontend tests; generated frontend artifacts through repository scripts; v5 functional/visual parity evidence; candidate branch commit/push
OUT_OF_SCOPE: Changes to the preserved modular v5 reference unless required by a confirmed reference defect; backend; service contracts; auth model; migrations; provider/D1/R2/Google writes; staging/production/GPT Sites deploy; merge; tag; DNS; protected data
VERIFICATION: Transfer-map coverage; unit/lint/build/dist parity; focused and broad Playwright; production journeys; v5 visual comparison; accessibility; responsive; reduced motion; 200 percent zoom; governance; complete diff review
STOP_CONDITIONS: Backend/contract/auth change required; feature loss; parity cannot be proven; production/staging/GPT Sites/merge/tag/provider write required; unknown route or invariant conflict; unclassifiable work
ACTIVE_WRITER: CODEX
WRITER_LOCK: CLAIMED - 2026-08-09 for the owner-approved v5 transfer slice
GIT_UPSTREAM: origin/frontend-design-integration
ORIGINAL_BASE_SHA: 7245c717f2b8bff3f327b47ff844281d94eaa1db
CODEX_STARTING_SHA: d57b1c5931c82886b98c88dc468adfefd3d62bdf
PRODUCTION_RELEASE_AT_START: v0.7.2 @ 84eacfcdb47a3985fed48e3ba14bb413946d4410
ROLLBACK_POINT: d57b1c5931c82886b98c88dc468adfefd3d62bdf
STATUS: IN PROGRESS - V5 FOUNDATION AND PRODUCTION SHELL TRANSFER
NEXT_EXACT_ACTION: Replace the real application shell and public landing/module-index/profile presentation with v5-native structure while preserving existing routes, controllers, services, and permission gates.

SKILLS: lean-ctx; Hallmark; Impeccable; Browser control
VISUAL_FRONTEND_AUTHORITY: prototypes/impeccable-whole-site-redesign-v5/
FUNCTIONAL_AUTHORITY: exact deployed production v0.7.2 at 84eacfcdb47a3985fed48e3ba14bb413946d4410 and matching repository source
INTEGRATION_DIRECTION: production functionality -> v5 frontend architecture

## Recovery

CLAUDE_STOP_STATE: Committed and pushed checkpoint
`85f064a0f809654d584853204e9a33eb1fc52d32`; no tracked or staged changes;
two untracked Claude files were preserved.

CODEX_RECOVERY_CLASSIFICATION: **B. PARTIAL COMMITTED CHECKPOINT.**

CLAUDE_WORK_PRESERVED: Yes. No reset, clean, checkout, restore, stash, rebase,
force-push, or overwrite was performed.

PRESERVED_UNTRACKED_FILES:

- `.impeccable/hook.cache.json` - local tool cache; do not commit.
- `output/design/HAU_USC_Logistics_FrontEnd_Design_v0.7.2_r1_Integrated.html`
  - Claude's preview artifact, retained unchanged and not used as the final
    production candidate.

The owner instruction to continue the existing slice resolved the branch-local
milestone conflict in favor of completing this already-accepted late v0.7.3
front-end work. Runtime version remains 0.7.2. This grants no deployment,
merge, release, migration, backend, provider, or protected-data authority.

## Completed

- Owner correction accepted in the active specification and repository governance: v5 is the visual/frontend authority, production is the functional authority, and the transfer direction is production functionality into v5.
- `docs/design/V5_TO_PRODUCTION_FRONTEND_TRANSFER_MAP.md` maps every production route/surface, field/action class, service connection, permission gate, copy change, missing v5 component, and integration action before broad source work.
- Claude's design foundation, privacy repair, docked detail, copy foundation,
  and generated artifact work were preserved.
- V4.1 presentation cascade added after the protected production cascade.
- Production landing rebuilt around real Request, Lending, Staff, and tracking
  routes with no preview chrome, demo label, fake metric, or invented feature.
- Dependency-free isometric logistics map added with static, mobile,
  reduced-motion, save-data, off-screen, and hidden-tab behavior.
- Persisted celestial theme control, kinetic menu/drawer, and compact back
  control integrated into the real shell.
- Visible environment copy reduced to `Online` / `Test site`; exact release
  identity remains available to verification and assistive technology.
- Return action wording simplified without changing the underlying return call
  or ledger semantics.
- Mock-only sanitized Request/Lending interactions added for a safe public
  preview. Production REST paths and absolute Staff Sign In routing remain.
- Four required section 9 documents completed.
- Generated standalone, guided demo, seven module shareables, and Apps Script
  bundle rebuilt through repository scripts.

## Verification

- `npm run build` - pass; 61 modules; `dist/index.html` 903,621 bytes,
  gzip 230,860 bytes.
- `node scripts/create-shareable.mjs` - pass after build.
- `npm run verify:dist` - pass for fresh preview parity, standalone, guided
  demo, and seven module shareables.
- `npm run test` - 122 files, 842 tests passed.
- `npm run lint` - 0 errors; one pre-existing unused-variable warning.
- `npm run test:e2e` - 146 passed, 400 intentional project skips, 0 failed.
- Focused final route repair - 21 unit assertions and 16 browser tests passed.
- Hallmark - 58/58 manual gates pass.
- Impeccable detector - run once after UI completion; all three findings fixed.
- Required widths, light/dark, reduced motion, keyboard/focus, static fallback,
  and 200% zoom have visual/browser evidence.
- Candidate source committed at `0ccc0dee60a5eef79e57ef896bea25b4ea0284b1`
  and pushed to `origin/frontend-design-integration` before publication.
- GPT Sites version 1 published the exact candidate SHA with public access.
- A fresh cookie-free Chromium context opened `/portals` at HTTP 200 without
  an account wall; all six required widths, theme persistence, 3D/mobile and
  reduced-motion fallbacks, Request submission, menu controls, and Lending
  return passed with zero `/api/` requests or browser errors.

## Boundaries

FRONT_END_ONLY: YES
BACKEND_CHANGES: NONE
SERVICE_CONTRACT_CHANGES: NONE
MIGRATIONS: NONE
PROVIDER_OR_PRIVATE_DATA_WRITES: GPT Sites publication only; no direct Cloudflare, D1, R2, Google, protected API, or private-data write
STAGING_OR_PRODUCTION_DEPLOYMENT: NONE
LIVE_PRODUCTION_CHANGED: NO

## Superseded candidate

- Public preview: https://hau-usc-logistics-v41.adrianoearl04.chatgpt.site/portals
- Public without login: PASS
- Frontend candidate SHA: `0ccc0dee60a5eef79e57ef896bea25b4ea0284b1`
- Writer lock: released
- The owner corrected the integration direction after this candidate. Its code,
  tests, evidence, and public preview remain historical checkpoint evidence,
  not the final v5-based candidate.

## Do not repeat

- Do not create a v6 or another v5 copy.
- Do not use the old production presentation as the visual baseline.
- Do not rerun the Impeccable detector until the v5 application-source transfer
  is complete; then run it once on the final changed targets.
- Do not hand-edit generated HTML.
- Do not remove the two preserved Claude untracked files.
- Do not point production Request/Lending hosts at a relative Staff login.
- Do not merge, tag, deploy GPT Sites/staging/production, or modify any protected system.
