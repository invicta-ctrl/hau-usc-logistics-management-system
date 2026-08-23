# Current Work Pointer — frontend-design-integration

PROGRAM: HAU-USC Logistics
MILESTONE: R3_A1_A2_OWNER_ROUTING_IDENTITY_CORRECTION
STATUS: R3A1A2_REPO_AND_FIGMA_DESIGN_COMPLETE__FIGMA_MAKE_PARTIAL_SAVE_IN_FLIGHT
PHASE: R3A1A2_THREE_CONTEXT_CORRECTION
BRANCH: frontend-design-integration
HEAD: GIT_HEAD
UPSTREAM: origin/frontend-design-integration
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration
WORKTREE_STATE: GIT_STATUS
ACTIVE_WRITER: Claude Code
WRITER_LOCK: HELD_FOR_R3A1A2
HANDOFF_STATUS: IN_PROGRESS
REQUIRED_MODEL: ANY_ACCEPTED_WRITER
NEXT_EXECUTOR: Claude Code (finish Figma Make), then Codex
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

## R3-A1-A2 state

OWNER CORRECTION: the logistics Request Center is **not public**. R3 and R3-A1
were faithful to the authority they held; that authority was wrong about the
product. `DESIGN.md` D24.0 — OWNER-LOCKED no-login public **Lending** — is
untouched and remains current.

FRONTEND_IMPLEMENTATION_STATUS: **COMPLETE.** Three-context model implemented in
`src/frontend/`. Entry intent is first-class (`app/entryIntent.ts`); the External
Request Center (`app/request/ExternalRequestCenter.tsx`) binds to the real
authenticated `/api/portal/request` contract; `PublicFlows` owns public lending
only; Home preserves the session everywhere; activation and password reset are
separate operations from applying for access, with an 8-digit verification field.
FE-R3-012 and FE-R3-006 CLOSED.

TESTS_STATUS: `npm test` 1126/1126 across 148 files. Frontend Playwright 190/190
at 320/390/768/1024/1440, of which 70 are the new R3-A1-A2 acceptance matrix
(`tests/e2e/r3-a1-a2-routing.spec.js`) plus 12 unit tests asserting every row of
the routing matrix (`tests/unit/frontend-entry-intent.test.js`). Build, verify:dist,
check:agents and check:continuation all pass.

DOCUMENTATION_STATUS: `docs/frontend/ROUTING.md` is NEW and is the canonical
control contract. `WORKFLOW_ARCHITECTURE.md` and `DESIGN.md` are reconciled to the
three-context model. Superseded statements are marked, never deleted.

FIGMA_DESIGN_STATUS: **RECONCILED AND READ BACK.** Authority board `568:2` gains
the R3-A1-A2 CURRENT block `753:2`; the R3-A1 block `733:2` is renamed and
bannered with its original text preserved verbatim. New page `755:2`
"10.1 — CURRENT · Frontend Architecture & Routing" mirrors the documentation
inside the file with per-file commit and sha256 and an honest per-document
fidelity declaration. Node `35:145` is untouched, with a CURRENT AUTHORITY
pointer `763:2` placed 80px above it. Screenshots in
`output/design/r3-a1-a2-readback/`.

FIGMA_MAKE_STATUS: **PARTIAL — SAVE IN FLIGHT, NOT CONFIRMED.**
`src/app/PublicFlows.tsx` transformed live (790 → 670 lines, public Request
Center view deleted, 20 asserted transformations, one atomic dispatch). Save was
clicked; the spinner has run for minutes and the provider still reads Version 40
with the edit pending. Console shows telemetry-only failures, no save-API error —
the same stall R3-A1 recorded and recovered from. **The Chrome tab is left open;
Discard has NOT been clicked.** The remaining Make files are listed and specified
in `.codex/R3_A1_A2_MAKE_CHANGESET.md`.

BACKEND_CONTRACT_STATUS:
- `BACKEND_CONTRACT_GAP_EXTERNAL_REQUEST_AUTH` **CLOSED** — `/api/portal/request`
  already exists, authorized on `CAPABILITIES.REQUEST_CREATE` and scoped to the
  session account. The frontend binds to it; the browser sends no requester
  identity. No fake boundary was invented.
- `BACKEND_CONTRACT_GAP_DOL_REQUESTER_MODE` **OPEN** — `assertRequesterPortalAccount`
  requires `roleId === 'REQUESTER'`, so DOL requester mode is unsupported server-side.
- `BACKEND_CONTRACT_GAP_SELF_SERVICE_IDENTITY` **OPEN** — no self-service
  activation or password-reset route exists.
Both open gaps need a separate accepted backend amendment. The exact contract is
specified in `docs/frontend/ROUTING.md` §5.

NOT_CLAIMED: `FIGMA_MAKE_CODE_CURRENT`, `FIGMA_MAKE_PROTOTYPE_CURRENT`,
`FIGMA_MAKE_PROVIDER_READBACK`, end-to-end security completion, and the
Hallmark / Impeccable / Taste / Vercel audit pass (§42, not yet run).

OPEN_FINDINGS: FE-R3-013 (`--destructive` undeclared in `DESIGN.md` frontmatter),
FE-R3-014 (remaining nested-label selects in `PublicFlows.tsx`), FE-R3-015
(47 truncated files in the repository Make mirror), plus the pre-existing
FE-R3-003/004/005/007/008/009/011.

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
