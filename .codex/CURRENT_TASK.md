# Current Bounded Task — Codex R3-A1 preview adoption

INTENT: FRONTEND_IMPLEMENTATION
MODE: EXECUTE
OBJECTIVE: Apply the R3-A1 synchronized Figma Design and Figma Make workflow and visual changes to the `frontend-design-integration` implementation, run the local frontend preview, and verify the result against the updated design references. Separately, retry the Figma Make provider save that R3-A1 could not complete and record its real version.
TARGET: `src/frontend/` and frontend-owned implementation surfaces on the `frontend-design-integration` worktree only; `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md` and `docs/design/FIGMA_BASELINE_REGISTER.md` when the Make save lands.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-23-r3-a1-figma-make-design-sync-codex-preview-handoff.md
AUTHORITY: Earl current instruction -> accepted R3-A1 amendment -> accepted backend/API/auth/data/security contracts -> live Figma Make (interactive prototype) -> live Figma Design current-authority lane (design documentation and visual reference) -> repository mirrors and registers.
REQUIRED_MODEL: ANY_ACCEPTED_WRITER
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED
RISK: MEDIUM
SCOPE: Implement the R3-A1 traceability items in priority order against `src/frontend/`; run the plain local Vite preview; perform local browser acceptance at 320/390/768/1024/1440; compare against the Figma Design current-authority references named in the handoff; keep the public Request Center reachable with no staff login and Staff Sign In separate; the repository Make mirror at `output/design/figma-make-source/` is already refreshed to v40 with hashes recorded, so no mirror work is required unless a byte-for-byte re-read of the four reconstructed files is wanted.
OUT_OF_SCOPE: Playground, Production, `main`, deployment, merges, backend/API/auth semantics, schema, migrations, D1/R2 writes, provider writes other than the two canonical design files named by R3-A1, FI-04 staff workspace implementation, `.ai-bridge/`, and any history rewrite, reset, clean or force-push.
VERIFICATION: `npm run check:agents`; `npm run check:continuation`; `npm run handoff:verify`; `npm run build`; `npm run verify:dist`; `npm test`; frontend Playwright across five widths; `git diff --check`; local preview reachable and the public request path exercised in a browser; full diff review; remote readback of the pushed HEAD at 0 ahead / 0 behind.
STOP_CONDITIONS: another writer appears; unknown dirty work at risk; missing or contradictory authority; the change would invent backend or product policy; FI-04 staff workspaces would have to be exposed; a required change crosses into Playground, Production or `main`; the live Make version is not 40 or its pending-edit count is not 0; verification failure that cannot be explained safely.
STATUS: READY_FOR_CODEX
NEXT_EXACT_ACTION: Codex adopts the R3-A1 synchronized design into src/frontend/ and the local frontend preview and verifies it against the updated Figma Design and Figma Make v40 references; Playground, Production and main remain untouched.
