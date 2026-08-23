# Current Work Pointer — frontend-design-integration

PROGRAM: HAU-USC Logistics
MILESTONE: R3_A1_DESIGN_AUTHORITY_SYNCHRONIZATION
STATUS: R3A1_PROVIDER_SYNC_COMPLETE_MIRROR_REFRESH_OUTSTANDING
PHASE: R3A1_DESIGN_SYNC_THEN_CODEX_PREVIEW_ADOPTION
BRANCH: frontend-design-integration
HEAD: GIT_HEAD
UPSTREAM: origin/frontend-design-integration
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
WORKTREE_STATE: GIT_STATUS
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
HANDOFF_STATUS: READY_FOR_HANDOFF
REQUIRED_MODEL: ANY_ACCEPTED_WRITER
NEXT_EXECUTOR: Codex
CURRENT_TASK: .codex/CURRENT_TASK.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-23-r3-a1-figma-make-design-sync-codex-preview-handoff.md
ACCEPTED_AMENDMENTS: .codex/specs/accepted/2026-08-23-r3-a1-figma-make-design-sync-codex-preview-handoff.md
R3A1_RECEIPT: .codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md
R3_RECEIPT: .codex/R3_PUBLIC_STAFF_BOUNDARY_RECEIPT.md
WORKFLOW_ARCHITECTURE: docs/frontend/WORKFLOW_ARCHITECTURE.md

AUTHORITY: Earl instruction -> accepted R3-A1 amendment -> accepted backend/API/auth/data/security contracts (functional truth) -> live Figma Make rP9W9MQlZkyQrUx38TVsFS (interactive prototype authority) -> live Figma Design hXJElH4p72KfgAaoUyfNOC current-authority lane (design documentation and visual reference) -> repository design mirrors and registers -> historical evidence, never authority.

## Provider write authority after R3-A1

FIGMA_DESIGN_WRITE: AUTHORIZED_AND_PERFORMED_BY_R3_A1
FIGMA_MAKE_WRITE: AUTHORIZED_AND_COMPLETED_BY_R3_A1
OTHER_PROVIDER_WRITE: FORBIDDEN
PLAYGROUND_WRITE: FORBIDDEN
PRODUCTION_WRITE: FORBIDDEN
PRODUCTION_DEPLOYMENT: FORBIDDEN
MAIN_WRITE: FORBIDDEN
BACKEND_SEMANTIC_CHANGE: FORBIDDEN
MIGRATION: FORBIDDEN

R3-A1 supersedes the older `FIGMA_WRITE: FORBIDDEN` and `PROVIDER_WRITE: FORBIDDEN`
records for these two canonical design files only. Historical FVR-02 and FVR-001
receipts that record "no Figma write occurred" remain true of their own tasks and
are not rewritten.

## R3-A1 state

FIGMA_DESIGN_STATUS: RECONCILED. Authority board page 55:3 / board 568:2 now carries R3-A1 block 733:2; module index 680:13 distinguishes the public Request Center from the internal Request Hub; page 40 frame 300:2 renamed to the internal Request Hub; dangling pointers in 680:16 repaired. Read back and screenshotted.
FIGMA_MAKE_STATUS: SAVED_AND_VERIFIED. Version 39 -> **Version 40**, 8 files changed, pending edits 0 after reload. Behaviourally verified in the live prototype: public "Start a logistics request" reaches "PUBLIC REQUEST - NO SIGN-IN / Request Center", and "Staff sign in" reaches a separate staff sign-in page. The repository Make mirror at output/design/figma-make-source/ is still at v39 and must be refreshed.
DESIGN_MD_STATUS: REWRITTEN to the post-R3-A1 authority model.
WORKFLOW_ARCHITECTURE_STATUS: CITATION_CORRECTED and pointed at R3-A1.
IMPECCABLE_SIDECAR_STATUS: STALE — not yet refreshed (FE-R3-010 / FE-R3-011).

## Correction of record

`.codex/R3_PUBLIC_STAFF_BOUNDARY_RECEIPT.md` cites `DESIGN.md` D24.0 as the
OWNER-LOCKED authority for the public Request Center. D24.0 is the OWNER-LOCKED
no-login model for the Public **Lending** Center. The correct Request authority is
D06 Product / Route Inventory, production `public-requester-portal.js` parity, and
the accepted `/api/public/request` contract. The historical receipt is preserved;
`DESIGN.md` carries the correction.

## Historical continuity — preserved, not current

FVR001_CUTOVER_COMMIT: f7e5bf83205dbe58b5fb72126a4456747d92e906
FVR001_STATUS: CLOSED_PUBLISHED
FVR02_STATUS: BLOCKED_PARTIAL — media blockers unchanged and untouched by R3-A1
FVR02_RECEIPTS: .codex/FVR02_RECEIPT.md; .codex/FVR02_A2_LOCAL_PREVIEW_RECEIPT.md
FI04_STATUS: NOT_STARTED. AuthenticatedShell is not mounted; staff route components are orphaned. Design material for pages 20-80 is DESIGN AUTHORITY / READY FOR FI-04 IMPLEMENTATION, never implementation-verified.
SUPERSEDED_MODEL_CONTRACT: the DeepSeek-writer / Sol-orchestrator model contract recorded before R3 is historical. R3 and R3-A1 were executed by Claude Code under Earl's direct instruction with ACTIVE_WRITER NONE at entry.

## Preview

LOCAL_PREVIEW: NOT RUNNING. The earlier `GUARDED_PREVIEW: http://127.0.0.1:4173 RUNNING healthy` claim was verified stale during R3 — port 4173 had no listener and no owning process. Nothing was stopped or restarted.
LOCAL_PREVIEW_COMMAND: `npm run dev -- --host 127.0.0.1 --port 5199` with `HAU_PLAYGROUND_PROXY_ORIGIN` UNSET, so `vite.config.js` installs no Playground proxy. Do NOT use `preview:frontend:*`: those scripts resolve and verify a private Playground origin and are out of R3 scope.
LOCAL_PREVIEW_URL: http://127.0.0.1:5199
LOCAL_PREVIEW_VERIFIED: 2026-08-23 — no listener on 4173 or 5199, confirming the preview is not running.
FRONTEND_E2E_COMMAND: `npx playwright test --config playwright.frontend.config.js` (its own webServer binds 127.0.0.1:4174)

BLOCKER: NONE for the R3-A1 provider synchronization — it completed and was verified. The first save attempt stalled on a Figma reconnect failure; Figma reconnected and the save landed as Version 40, confirmed after a full reload. Outstanding non-blocking work: refresh the repository Make mirror to v40 with hashes, refresh the stale `.impeccable/design.json`, and run the post-sync Impeccable and Hallmark audits. FVR-02 media blockers unchanged and untouched; FI-04 not started.

NEXT_EXACT_ACTION: Codex adopts the R3-A1 synchronized design into src/frontend/ and the local frontend preview, verifies against the updated Figma Design and Figma Make v40 references, and refreshes the repository Make source mirror to the saved v40 source with recorded hashes; Playground, Production and main remain untouched.
