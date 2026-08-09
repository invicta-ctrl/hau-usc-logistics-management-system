# Current Bounded Task

> **BRANCH-LOCAL RECORD.** This file describes
> `frontend-design-integration`. `.codex/CURRENT.md` remains the project-wide
> pointer owned by `main` and is intentionally unchanged.

INTENT: SOFTWARE_FEATURE
MODE: EXECUTE — owner-directed v5 architecture transfer into the real frontend
OBJECTIVE: Transfer exact production functionality into the modular v5 frontend architecture without changing backend behavior or contracts.
TARGET: frontend-design-integration
BRANCH_SPEC: .codex/specs/active/v0.7.3-frontend-design-integration.md
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.7.3-frontend-design-integration.md
AUTHORITY: Earl's V4.2/v5 correction -> accepted frontend specification amendment -> AGENTS.md -> branch-local task/handoff -> verified Git state
REQUIRED_MODEL: Requested routing is platform-accepted; exact runtime identity is not agent-attestable
RISK: HIGH — whole-frontend presentation architecture transfer with strict functional parity; no backend or production authority
SCOPE: Accepted-spec amendment; route transfer/parity maps; real frontend source; frontend tests; generated artifacts through repository scripts; v5 visual evidence; local candidate commit
OUT_OF_SCOPE: Backend; service contracts; auth model; migrations; provider/D1/R2/Google writes; staging/production/GPT Sites deploy; merge; tag; DNS; protected data; v6/duplicate v5 lineage
VERIFICATION: Unit/lint/build/generated parity; complete Playwright matrix; production journeys; v5 visual comparison; accessibility; responsive; reduced motion; 200 percent zoom; governance; complete diff review
STOP_CONDITIONS: Backend/contract/auth change required; feature loss; parity cannot be proven; production/staging/GPT Sites/merge/tag/provider write required; unknown route or invariant conflict; unclassifiable work
ACTIVE_WRITER: CODEX
WRITER_LOCK: RELEASED BY CANDIDATE COMMIT
GIT_UPSTREAM: origin/frontend-design-integration
ORIGINAL_BASE_SHA: 7245c717f2b8bff3f327b47ff844281d94eaa1db
CODEX_STARTING_SHA: d57b1c5931c82886b98c88dc468adfefd3d62bdf
PRODUCTION_RELEASE_AT_START: v0.7.2 @ 84eacfcdb47a3985fed48e3ba14bb413946d4410
ROLLBACK_POINT: c4d98273ef90c47e8e2f46131abe0192ff34a0ec
STATUS: COMPLETE — V5-BASED PRODUCTION FRONTEND CANDIDATE IS GIT_HEAD
NEXT_EXACT_ACTION: Owner review of GIT_HEAD; authorize promotion separately if accepted. Do not merge or deploy from this task.

SKILLS: lean-ctx; Hallmark; Impeccable; Browser control
VISUAL_FRONTEND_AUTHORITY: prototypes/impeccable-whole-site-redesign-v5/
FUNCTIONAL_AUTHORITY: exact deployed production v0.7.2 at 84eacfcdb47a3985fed48e3ba14bb413946d4410 and matching repository source
INTEGRATION_DIRECTION: production functionality -> v5 frontend architecture

## Recovery

CLAUDE_STOP_STATE: Committed checkpoint `85f064a0f809654d584853204e9a33eb1fc52d32`; tracked/staged tree clean; two untracked Claude artifacts preserved.

CODEX_RECOVERY_CLASSIFICATION: **B. PARTIAL COMMITTED CHECKPOINT.**

CLAUDE_WORK_PRESERVED: Yes. No reset, clean, checkout, restore, stash, rebase,
force-push, or overwrite was performed.

PRESERVED_UNTRACKED_FILES:

- `.impeccable/hook.cache.json` — local tool cache; not committed.
- `output/design/HAU_USC_Logistics_FrontEnd_Design_v0.7.2_r1_Integrated.html`
  — Claude preview artifact; retained unchanged and not used as the candidate.
- `tmp/` — local PDF/browser evidence; not committed.

## Completed

- Accepted amendment records v5 as visual/frontend authority, deployed v0.7.2
  as functional authority, and production functionality -> v5 as direction.
- `V5_TO_PRODUCTION_FRONTEND_TRANSFER_MAP.md` covers every real production
  surface before broad application-source work.
- Exact modular v5 stylesheet cascade is consumed directly; no v6 or v5 clone.
- Real landing uses v5 hierarchy with Request, Lending, Staff, tracking, and
  module-index destinations; preview/demo/version/mock language is absent.
- Access-aware v5 module index uses real public and authenticated routes without
  bypassing the existing authorization gate.
- V5 rail/topbar/stage, celestial theme, menu, back, mobile navigation, and
  workspace switcher wrap the existing production router/controllers.
- V5 profile grid carries every supported real profile/security action and no
  unsupported upload or invented account action.
- Operational and administration views use v5 typography, tokens, surfaces,
  tables, forms, dialogs, drawers, loading/error/denied, and responsive patterns.
- Ordinary implementation jargon and demo copy were simplified without
  changing logistics terms, statuses, or domain meaning.
- Dependency-free campus-logistics enhancement keeps static/mobile/reduced-
  motion/save-data/off-screen/hidden-tab fallbacks and no business dependency.
- Functional and visual parity documents are complete.
- Generated standalone, guided demo, seven module shareables, and Apps Script
  bundle were rebuilt through repository scripts.

## Verification

- `npm run build` — pass; 66 modules; `dist/index.html` 1,562,781 bytes,
  gzip 638.50 kB.
- `npm run check:apps-script` — pass; 34 source files, 57 required functions,
  deterministic parser-safe split bundle.
- `npm run verify:dist` — pass; fresh standalone, guided demo, and seven
  module shareables.
- `npm run lint` — pass with zero errors and one pre-existing
  `public-request-service.js` unused-variable warning.
- `npm test -- --maxWorkers=1` — 123 files, 847 tests passed.
- `npx playwright test --workers=4` — 138 passed, 541 intentional project
  skips, 0 failed across 320/375/414/768/1024/1440 projects.
- Final token-only visual/responsive matrix — 35 passed, 84 intentional
  project skips, 0 failed against regenerated artifacts.
- Hallmark pre-emit critique `P5 H5 E5 S5 R5 V5`; 58/58 manual gates pass.
- Impeccable detector — invoked exactly once after UI completion; four advisory
  token mismatches replaced with native v5 typography/radius tokens.
- Required light/dark, reduced motion, keyboard/focus, 3D/static fallback,
  responsive widths, and 200 percent zoom have browser/screenshot evidence.

## Boundaries

FRONT_END_ONLY: YES
BACKEND_CHANGES: NONE
SERVICE_CONTRACT_CHANGES: NONE
AUTH_MODEL_CHANGES: NONE
MIGRATIONS: NONE
EXTERNAL_WRITES: NONE DURING THIS V5 TRANSFER
STAGING_OR_PRODUCTION_DEPLOYMENT: NONE
GPT_SITES_PUBLICATION: NONE DURING THIS V5 TRANSFER
LIVE_PRODUCTION_CHANGED: NO

## Do not repeat

- Do not create a v6 or another v5 copy.
- Do not use the old production presentation as the visual baseline.
- Do not rerun the Impeccable detector for this completed candidate.
- Do not repeat the full browser matrix unless GIT_HEAD or generated artifacts change.
- Do not hand-edit generated HTML.
- Do not remove preserved Claude/local untracked artifacts.
- Do not merge, tag, publish GPT Sites, deploy staging/production, or modify a
  backend/provider/protected system without separate owner authorization.
