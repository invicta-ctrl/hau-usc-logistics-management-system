# FVR-02 - Full Frontend Recovery: FI-00 -> FI-03 Re-Audit + Media Population + Hero Motion + Preview Module Index

STATUS: ACCEPTED
OWNER: Earl
DATE: 2026-08-22
ACTIVE_WRITER: DEEPSEEK_V4_PRO:/root/ds1_fvr02_writer_v2
WRITER_LOCK: ACQUIRED
TOP_LEVEL_ORCHESTRATOR: GPT-5.6 Sol Max
TOP_LEVEL_FINAL_REVIEWER: GPT-5.6 Sol Max
CANONICAL_FRONTEND_WRITER: DeepSeek V4 Pro #1
SUCCESSOR: FI-04 (blocked until every mandatory FVR-02 gate passes)

## Intent

FRONTEND_RECOVERY_AND_ACCEPTANCE_REPAIR. FVR-001 removed V5 and established the Figma-native frontend, but the owner-visible preview is not accepted. FVR-02 is a repair and re-acceptance program, not a polish pass. It re-audits FI-00 -> FI-03 against current live Figma, resolves the hero media/motion authority gap, populates safe preview media only when a missing Playground baseline is the proven cause, and builds a secure preview-only Module Index. Production deployment, Production data/provider write, and Figma write are forbidden.

## Authority order

1. Earl's current instruction
2. current live Figma Make
3. current live Figma Design documentation/annotations
4. accepted backend/API/auth/data contracts
5. current Figma-native source
6. current tests
7. repository-preserved Figma mirrors only as identity-verified cache/evidence
8. historical V5 material only for old Index/security behavior archaeology

Figma Make `rP9W9MQlZkyQrUx38TVsFS` is implementation/composition/motion/source authority. Figma Design `hXJElH4p72KfgAaoUyfNOC` is documentation, annotations, variables, rationale, and asset/reference authority. The live repository and accepted backend/API/auth/data contracts remain functional truth for routes, contracts, security, privacy, and accessibility. Figma is read-only; never write to Figma.

## Reclassification at FVR-02 start

FI-00: REVALIDATE
FI-01: REVALIDATE
FI-02 FUNCTIONAL: PRESERVE_IF_VERIFIED
FI-02 VISUAL/MEDIA/MOTION: REOPENED
FI-03 FUNCTIONAL: PRESERVE_IF_VERIFIED
FI-03 VISUAL: REVALIDATE
PREVIEW MODULE INDEX: NOT_IMPLEMENTED
FI-04: BLOCKED

A previous PASS is not preserved merely because an earlier receipt said PASS. Owner visual rejection reopens the affected acceptance gate.

## Scope and exclusions

IN SCOPE: FI-00 -> FI-03 re-audit and bounded repair; hero media/motion authority resolution; safe preview media population when authorized and proven; secure preview-only Module Index, Surface Preview, and Test Real Login Flow; responsive/accessibility/motion confirmation; focused and broad verification; Git delivery and durable receipt.

OUT OF SCOPE: FI-04 implementation and any later slice; backend/API/auth/data/schema/migration/provider semantic change; Figma write; Production deployment; Production data write; history rewrite, force-push, reset, or clean; mutation of unknown or unrelated work; AGENTS.md and project-policy edits.

## Continuous execution authorization

Continuous execution is authorized ONLY across the named FVR-02 phases below, in order, through final verification, commit/push/readback, and handoff. It is never authorized to begin FI-04.

Phases:

1. Reverify FVR-001 closure, branch/worktree state, and writer lock.
2. Confirm the branch-local AGENTS appendix (already applied at a7da2e4).
3. Accept this specification and acquire the canonical writer lock.
4. Dispatch bounded first-wave read-only audit lanes (DeepSeek/Ox).
5. Audit current live Figma source/docs/assets/motion.
6. Audit the hero video source and the current videoSrc gap.
7. Audit the real Playground advertisement/media chain.
8. Sol Max triages all findings.
9. DeepSeek #1 repairs FI-00 -> FI-03 in one coherent bounded batch.
10. Perform the authorized safe Playground-only media baseline repair only if proven and within the existing runbook.
11. Run focused tests and visual recheck.
12. Build the secure Preview Module Index / Surface Preview / Test Real Login Flow.
13. Run positive Playground and negative Production Index tests.
14. Run responsive/a11y/motion confirmation.
15. Sol Max performs the final complete diff/evidence review.
16. DeepSeek #1 repairs only accepted remaining findings.
17. Re-run only invalidated gates.
18. Commit/push/readback FVR-02.
19. Release the writer lock and update the durable handoff.
20. If and only if every mandatory gate passes, output FI-04 READY TO START. Stop; do not begin FI-04 automatically.

## Hero-video authority gate (no fabrication)

Current source condition: HeroSection renders `<HeroMotion />`; HeroMotion only attaches `<video>` when videoSrc is supplied. When videoSrc is undefined, no video element exists and playback is impossible. FVR-02 must resolve the intended hero media/motion from current live Figma, not from the historical capture.

Resolution hierarchy:

- If current live Figma supplies an exact video asset/source: use it exactly through the Figma-native frontend.
- If Figma references a governed media asset on the accepted backend/media path: use that exact governed path.
- If Figma documents intent/identity but the local mirror omitted the binary: retrieve/export the exact authorized asset through the accepted Figma/media route.
- If current live Figma contains no actual video asset/source anywhere and remains poster-only: record FVR02_VIDEO_AUTHORITY_CONFLICT. Do not fabricate a substitute video. Stop only the hero-video acceptance lane and report exact Figma evidence, the missing asset/source, and the smallest owner decision needed. FVR-02 cannot close and FI-04 cannot be declared ready while this conflict remains.

When a source exists, required motion behavior includes poster-first fallback, prefers-reduced-motion -> no video, below-768 -> no video if Make defines that gate, saveData -> no video, 2g -> no video, idle/deferred attachment, error -> remove video src and preserve poster, playing -> cross-fade into ready state, and no infinite loop unless current owner-approved Figma explicitly requires it.

## Media-chain audit and bounded Playground-only repair

The Figma-native CurrentSection obtains media from GET /api/public/advertisements and currently treats only items with a usable imageUrl as populated. FVR-02 audits the full chain and classifies the root cause as: A frontend projection/filter defect; B URL/proxy/media-serving defect; C Playground baseline has no published advertisements; D Playground public media objects missing; E backend response defect; F privacy/policy prevented expected media population.

Repair policy: A/B repair frontend/proxy within scope. C/D authorize a bounded Playground-only public-media population repair ONLY when an existing accepted baseline/seed/refresh runbook supports it, media is public/non-private, source provenance is verified, Production is read-only, no Production mutable binding is used, a recovery point is recorded, and no schema migration is required. E, if it requires backend semantic change beyond existing contract projection, stops that lane and creates a bounded backend amendment. Never hand-insert invented records; never copy private borrower/staff/evidence media.

## Preview Module Index, Surface Preview, and real-login separation

Implement a Figma-native preview-only Module Index (preferred stable route `#/__preview/index`) driven by one canonical module registry (route, label, group, description, implementation status, backend status, access requirement, preview mode). This is development chrome outside Figma parity and must not alter the module design.

Surface Preview is for unfinished FI-04+ modules only when safe: validated local/Playground, read-only, sanitized fixtures/view-models, no D1/R2 mutation, no auth/session mutation, no capability grant, clearly labeled, and not counted as functional acceptance. Test Real Login Flow is separate and uses real login/session/capabilities/authorization against the Playground backend; no preview shortcut may bypass auth.

## Production isolation (production-negative controls)

Index activation requires a server-validated Playground identity/environment signal: VALIDATED_PLAYGROUND AND INDEX_ALLOWED -> Index active. In Production: INDEX_VISIBLE=FALSE, INDEX_ROUTE_ACTIVE=FALSE, SURFACE_PREVIEW_ACTIVE=FALSE, PERSONA_SHORTCUT_ACTIVE=FALSE. Browser spoofing must fail. If no safe existing signal exists and a backend semantic change would be required, stop the Index lane.

## Model routing and one-writer lock

GPT-5.6 Sol Max is the sole top-level orchestrator and final reviewer. Sol writes are forbidden. Only Sol spawns subagents (depth one; no recursive delegation). DeepSeek V4 Pro #1 is the single canonical integration writer and the only agent allowed to write the canonical worktree at a time. DeepSeek #2-#16 are read-only by default. Ox Alpha #1-#16 are read-only visual/Figma/motion/responsive/a11y adversarial reviewers. Terra is not a default frontend writer; Terra fallback requires explicit Sol Max escalation for one bounded accepted task when DeepSeek cannot safely complete it. No silent model substitution. Subagent evidence is never final acceptance.

Preferred first wave: 8 DeepSeek + 8 Ox Alpha total, including the canonical writer; reserve agents only when evidence warrants.

Delegation ledger row:

- AGENT: DeepSeek V4 Pro #1 (/root/ds1_fvr02_writer_v2); MODEL: DeepSeek V4 Pro; ROLE: canonical frontend writer; MODE: WRITE; SCOPE: FVR-02 acceptance activation and subsequent accepted FVR-02 repairs; OWNED_PATHS: canonical frontend source, directly coupled tests, preview tooling, directly coupled current-chain records, and the FVR-02 spec; EXCLUDED: AGENTS.md, PROJECT_POLICY, product/plan/source outside accepted scope, commits/pushes unless authorized, and Figma/provider/Playground/Production writes; STATUS: ACTIVE_FVR02.

## Security and privacy

Never expose credentials, API keys, production dumps, raw private D1/R2 data, private staff/person records, borrower evidence, or tokens/session material to DeepSeek or Ox. Use source, sanitized fixtures, sanitized logs, public/sanitized screenshots, and safe endpoint metadata only. UI hiding is never authorization.

## Prohibitions

Do not restore V5; use old Production/Playground visuals as Figma authority; invent a hero video, advertisement records, or media URLs; copy private Production media; change Production or deploy Production; mutate Figma; change auth semantics; change D1 schema; change provider semantics; claim FI-02 PASS while owner-visible media/motion is broken; claim FVR-02 PASS while hero video authority is unresolved; or claim FI-04 ready while any mandatory gate is open. No backend semantic change, schema change, migration, Figma write, or Production write.

## Required final gates

AGENTS FVR02 ROUTING, SOL MAX ORCHESTRATION, DEEPSEEK CANONICAL WRITER, OX READ_ONLY REVIEW; FI00, FI01, FI02 FUNCTIONAL, FI02 VISUAL, FI02 MEDIA, FI02 HERO MOTION, FI03 FUNCTIONAL, FI03 VISUAL; PUBLIC MEDIA API, MEDIA URL RESOLUTION, CURRENT SECTION MEDIA; HERO VIDEO/MOTION AUTHORITY=RESOLVED, HERO EXPECTED MEDIA, HERO NORMAL-MOTION PLAYBACK, POSTER FALLBACK, REDUCED MOTION; PREVIEW MODULE INDEX, INDEX SEARCH/FILTER, SURFACE PREVIEW, TEST REAL LOGIN FLOW, PRODUCTION INDEX NEGATIVE; responsive 320/390/768/1024/1440; 200% ZOOM, KEYBOARD/FOCUS, NO HORIZONTAL OVERFLOW; BUILD, DIST VERIFY, FOCUSED UNIT, FRONTEND E2E, CLOUDFLARE DRY RUN (where required), GUARDED PLAYGROUND PREVIEW; OPEN P0=0, OPEN P1=0, OPEN UNWAIVED P2=0; PRODUCTION DEPLOYMENT=0, PRODUCTION DATA WRITE=0, FIGMA WRITE=0, BACKEND SEMANTIC CHANGE=0 (unless separately amended), MIGRATION=0.

## Git delivery

Commit A (branch-local governance) is already present as a7da2e4 and stays branch-local; it must be excluded/reverted before any future promotion to main/v0.8.4 unless Earl separately authorizes it. Commit B (FVR-02 product/preview repairs) may propagate under later accepted release authority. No Production deployment.

## FVR-02 receipt (required)

The durable receipt records: FVR02_STATUS, START_HEAD/END_HEAD/END_TREE, AGENTS_GOVERNANCE_COMMIT, PRODUCT_REPAIR_COMMIT, SOL_MODEL, CANONICAL_WRITER, DEEPSEEK_SCOUTS_USED, OX_ALPHA_REVIEWERS_USED, FIGMA_MAKE_RESOURCES_READ, FIGMA_DESIGN_DOCS_READ, HERO_MOTION_SOURCE, HERO_VIDEO_ASSET_SOURCE, HERO_VIDEO_FORMAT, HERO_MOTION_RESULT, ADVERTISEMENT_ENDPOINT/ITEM_COUNT/WITH_MEDIA_COUNT/MEDIA_URL_RESULT, PLAYGROUND_MEDIA_MUTATION, PLAYGROUND_RECOVERY_POINT, PRODUCTION_FINGERPRINT_UNCHANGED, FI00/FI01/FI02_FUNCTIONAL/FI02_VISUAL/FI02_MEDIA/FI02_MOTION/FI03_FUNCTIONAL/FI03_VISUAL, INDEX/SURFACE_PREVIEW/REAL_LOGIN_FLOW/PRODUCTION_INDEX_NEGATIVE, TESTS/BUILD/DIST_VERIFY/E2E/RESPONSIVE/ACCESSIBILITY, P0/P1/P2, PRODUCTION_DEPLOYMENT=0, PRODUCTION_WRITE=0, FIGMA_WRITE=0, ACTIVE_WRITER=NONE, WRITER_LOCK=RELEASED.

## Stop conditions

Stop on: conflicting active writer; unknown dirty work; missing or contradictory authority; native Figma source unreadable; hero-video authority unresolved (FVR-02 cannot close); required backend/auth/data/migration/provider semantic change; privacy/security ambiguity; mandatory verification failure; Production crossover; inability to demonstrate rollback/recovery; required Ox Alpha/model route unavailable; no safe existing server-validated Index signal (stop Index lane; FVR-02 cannot close while mandatory gate remains open); or the accepted work unit is complete.
