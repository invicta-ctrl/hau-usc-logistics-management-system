# Current Work Pointer — frontend-design-integration

PROGRAM: HAU-USC Logistics
MILESTONE: R3_A1_A2_OWNER_ROUTING_IDENTITY_CORRECTION
STATUS: R3_A1_A2_FRONTEND_DESIGN_MAKE_SYNC_COMPLETE__BACKEND_AUTH_AMENDMENT_READY
PHASE: R3A1A2_THREE_CONTEXT_CORRECTION
BRANCH: frontend-design-integration
HEAD: GIT_HEAD
UPSTREAM: origin/frontend-design-integration
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
WORKTREE_STATE: GIT_STATUS
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
HANDOFF_STATUS: READY_FOR_HANDOFF
REQUIRED_MODEL: ANY_ACCEPTED_WRITER
NEXT_EXECUTOR: Owner decision on the proposed backend amendment, then FI-04
CURRENT_TASK: .codex/CURRENT_TASK.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-23-r3-a1-a2-owner-routing-identity-three-context.md
ACCEPTED_AMENDMENTS: .codex/specs/accepted/2026-08-23-r3-a1-a2-owner-routing-identity-three-context.md
R3A1A2_RECEIPT: .codex/R3_A1_A2_ROUTING_IDENTITY_RECEIPT.md
R3A1A2_MAKE_CHANGESET: .codex/R3_A1_A2_MAKE_CHANGESET.md
R3A1_RECEIPT: .codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md (SUPERSEDED, annotated)
R3_RECEIPT: .codex/R3_PUBLIC_STAFF_BOUNDARY_RECEIPT.md (SUPERSEDED, annotated)
WORKFLOW_ARCHITECTURE: docs/frontend/WORKFLOW_ARCHITECTURE.md
ROUTING: docs/frontend/ROUTING.md

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

## R3-A1-A2 state — COMPLETE

OWNER CORRECTION: the logistics Request Center is **not public**. R3 and R3-A1
were faithful to the authority they held; that authority was wrong about the
product. `DESIGN.md` D24.0 — OWNER-LOCKED no-login public **Lending** — is
untouched and remains current.

FRONTEND_IMPLEMENTATION: **COMPLETE.** Three-context model in `src/frontend/`.
Entry intent is first-class (`app/entryIntent.ts`); the External Request Center
(`app/request/ExternalRequestCenter.tsx`) binds to the real authenticated
`/api/portal/request` contract; `PublicFlows` owns public lending only; Home
preserves the session everywhere; activation and password reset are separate
operations from applying for access, with an 8-digit verification field.
FE-R3-012 and FE-R3-006 CLOSED.

TESTS: `npm test` 1126/1126 across 148 files. Frontend Playwright 190/190 at
320/390/768/1024/1440, of which 70 are the R3-A1-A2 acceptance matrix, plus 12
unit tests asserting every row of the routing matrix. Build, verify:dist and both
governance checks pass.

DOCUMENTATION: `docs/frontend/ROUTING.md` is NEW and is the canonical control
contract. `WORKFLOW_ARCHITECTURE.md` and `DESIGN.md` reconciled. Superseded
statements are marked, never deleted.

FIGMA_DESIGN: **RECONCILED AND READ BACK.** Authority board carries R3-A1-A2
block `753:2`; the R3-A1 block `733:2` is renamed and bannered with its original
text preserved verbatim. Page `755:2` "10.1 — CURRENT · Frontend Architecture &
Routing" mirrors the documentation inside the file with commit and per-file
sha256, re-synced to the final state. Node `35:145` untouched, with pointer
`763:2` above it. Zero current-lane nodes assert a public Request Center.

FIGMA_MAKE: **COMPLETE — Version 44, zero pending edits.** Saved across v41
(PublicFlows), v42 (Checkpoint A) and v44 (Checkpoint B). All 16 changed files
verified byte-identical between the provider export and the repository source.
The repository mirror was found to contain 47 truncated files and was rebuilt
from the provider export — 212 files, 0 markers. FE-R3-015 CLOSED.

QUALITY: Impeccable sidecar refreshed; Hallmark 0 critical / 0 major / 2 minor;
Impeccable clean with no rule suppressed; Taste pass; Vercel Web Interface
Guidelines 5 findings, all fixed. Recorded in
`docs/design/HALLMARK_IMPECCABLE_CLOSURE.md`.

BACKEND_CONTRACT_STATUS:
- `BACKEND_CONTRACT_GAP_EXTERNAL_REQUEST_AUTH` **CLOSED** — `/api/portal/request`
  already exists, authorized on `CAPABILITIES.REQUEST_CREATE` and scoped to the
  session account. The frontend binds to it; the browser sends no requester
  identity.
- `BACKEND_CONTRACT_GAP_DOL_REQUESTER_MODE` **OPEN** — `assertRequesterPortalAccount`
  requires `roleId === 'REQUESTER'`.
- `BACKEND_CONTRACT_GAP_SELF_SERVICE_IDENTITY` **OPEN** — no self-service
  activation or password-reset route exists.

Both open gaps are specified in
`.codex/specs/proposed/2026-08-24-r3-a1-a2-b1-authenticated-identity-and-dol-requester-backend.md`
— **PROPOSED, NOT ACCEPTED, NOT EXECUTED**.

NOT_CLAIMED: end-to-end security completion, while either gap is open.

OPEN_FINDINGS: FE-R3-013 (account-panel pair still light-mode only — convert the
pair, not one of them), FE-R3-011 (no type ramp), plus pre-existing
FE-R3-003/004/005/007/008/009.

FI04: **NOT STARTED**, and must not start until the owner accepts the next phase.

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

BLOCKER: NONE for the R3-A1 provider synchronization — it completed and was verified. The first save attempt stalled on a Figma reconnect failure; Figma reconnected and the save landed as Version 40, confirmed after a full reload. Outstanding non-blocking work: FE-R3-012 (the "Staff Request Center" label in frontend source), FE-R3-011 (7 radius advisories and the missing type ramp), and the optional visual workflow diagram. All are product-source or design-build work rather than design-authority work. FVR-02 media blockers unchanged and untouched; FI-04 not started.

NEXT_EXACT_ACTION: Codex adopts the R3-A1 synchronized design into src/frontend/ and the local frontend preview and verifies it against the updated Figma Design and Figma Make v40 references; Playground, Production and main remain untouched.
