# Current Bounded Task

> **BRANCH-LOCAL RECORD.** This file describes
> `frontend-design-integration`. `.codex/CURRENT.md` remains the project-wide
> pointer owned by `main` and is intentionally unchanged.

INTENT: SOFTWARE_FEATURE
MODE: EXECUTE - owner-directed continuation of Claude's late v0.7.3 front-end slice
OBJECTIVE: Integrate V4.1 into the authoritative front end without changing production behavior or contracts.
TARGET: frontend-design-integration
BRANCH_SPEC: .codex/specs/active/v0.7.3-frontend-design-integration.md
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.7.3-frontend-design-integration.md
AUTHORITY: Earl's continuation instruction -> accepted frontend specification -> AGENTS.md -> branch-local task/handoff -> verified Git state
REQUIRED_MODEL: Requested routing is platform-accepted; exact runtime identity is not agent-attestable
RISK: MEDIUM - broad presentation change, no backend or production authority
SCOPE: Frontend source, frontend tests, generated frontend artifacts through repository scripts, design/handoff documentation, candidate branch commit/push, public sanitized GPT Sites preview
OUT_OF_SCOPE: Backend, service contracts, auth model, migrations, provider/D1/R2/Google writes, staging/production deploy, merge, tag, DNS, protected data
VERIFICATION: Unit, lint, build, dist parity, focused and broad Playwright, accessibility, responsive, reduced motion, 200 percent zoom, governance, diff review, logged-out GPT Sites check
STOP_CONDITIONS: Backend or protected write required; production/staging/merge/tag required; anonymous GPT Sites unavailable; route or invariant conflict; unclassifiable work
ACTIVE_WRITER: CODEX
WRITER_LOCK: CLAIMED - 2026-08-09
GIT_UPSTREAM: origin/frontend-design-integration
ORIGINAL_BASE_SHA: 7245c717f2b8bff3f327b47ff844281d94eaa1db
CODEX_STARTING_SHA: 85f064a0f809654d584853204e9a33eb1fc52d32
PRODUCTION_RELEASE_AT_START: v0.7.2 @ 84eacfcdb47a3985fed48e3ba14bb413946d4410
ROLLBACK_POINT: f0312b76bd8401e2aa5b9947252642bdb693b19d
STATUS: VERIFIED FRONT-END CANDIDATE - GPT SITES PUBLICATION AND FINAL COMMIT/PUSH PENDING
NEXT_EXACT_ACTION: Finish final candidate gates, commit and push the candidate branch, then publish and verify the sanitized candidate through anonymous GPT Sites.

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

## Boundaries

FRONT_END_ONLY: YES
BACKEND_CHANGES: NONE
SERVICE_CONTRACT_CHANGES: NONE
MIGRATIONS: NONE
PROVIDER_OR_PRIVATE_DATA_WRITES: NONE
STAGING_OR_PRODUCTION_DEPLOYMENT: NONE
LIVE_PRODUCTION_CHANGED: NO

## Remaining exact actions

1. Rebuild after the final production/mock Staff Sign In routing repair.
2. Run final invalidated unit/lint/browser/governance/diff gates.
3. Commit and push this candidate branch; verify remote SHA.
4. Publish the exact sanitized candidate through GPT Sites only if anonymous
   public access is available; verify it logged out/incognito.
5. Record the URL and final SHA in `.codex/CURRENT_HANDOFF.md` and release the
   branch-local writer lock.

## Do not repeat

- Do not recreate the landing from the preview harness.
- Do not rerun the Impeccable detector; its single final run is complete.
- Do not hand-edit generated HTML.
- Do not remove the two preserved Claude untracked files.
- Do not point production Request/Lending hosts at a relative Staff login.
- Do not merge, tag, stage, deploy production, or modify any protected system.
