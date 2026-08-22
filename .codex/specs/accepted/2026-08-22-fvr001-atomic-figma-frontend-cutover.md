# FVR-001 — Atomic Figma-Native Frontend Cutover, V5 Eradication, and Backend Preservation

STATUS: ACCEPTED
OWNER: Earl
DATE: 2026-08-22
IMPLEMENTATION_WRITER: TERRA_INTEGRATION_WRITER

## Objective

Atomically replace the active legacy `src/v5` frontend with a runnable frontend derived from live Figma Design documentation and live Figma Make source, preserving all existing Playground and Production backend contracts. Production deployment is excluded.

## Authority

Live Figma Design `hXJElH4p72KfgAaoUyfNOC` is documentation authority for annotations, variables, component notes, rationale, and supporting visual decisions. Live Figma Make `rP9W9MQlZkyQrUx38TVsFS` is primary visual implementation authority for exact source/resources, runtime/dependencies, component tree, styles, assets, motion, and responsive rules. Repository and accepted backend/API/auth/data contracts remain functional and security authority. The legacy frontend is neither visual nor architectural authority.

## Required execution

Record branch/HEAD/tree/upstream and all three named worktrees. Preserve, without mutation, the owner-classified uncommitted governance work in the separate main worktree. Create and verify immutable pre-cutover tag `archive/v5-final-before-figma-cutover-2026-08-22`; push/read back only when policy authorizes it.

Use native `figma` MCP only—never `@Figma/codex_apps`, ordinary web fetching, or a browser substitute—to retrieve both live Figma sources. If either source cannot be read, stop before deleting V5.

Create final non-V5 paths, preferably `src/frontend/{app,components,routes,styles,assets,integration}`, aligned with live Make. Adopt the actual Make runtime and dependencies. Build a thin adapter preserving server, Worker, services, domain, auth, D1/R2, sessions/cookies, CSRF, authorization/capabilities, audit/ledger, provider, and privacy invariants. Do not fabricate unsupported Figma behavior.

Reproduce FI-00 through FI-03: design system, public landing and motion, public shell/navigation, sign-in, verification, account application, application status, responsive/mobile behavior, light/dark, and accessibility. Cut over index, Vite, package scripts, preview, build, dist verification, tests, CI, and Cloudflare asset build while preserving the guarded Playground backend proxy. New commands may not contain V5 names.

## Destructive gate and removal

Before deletion, prove native Figma access, replacement build and preview, guarded Playground integration, FI-00–FI-03 contracts, visual parity, animation, responsive/accessibility, and rollback tag. Then remove all active V5 implementation, scripts, tests, docs/design references, active V5 specs/plans, configurations, workflows, current records, status/changelog/continuation records, and generated-output references. Do not retain V5 fallback code; Git history and the rollback tag are the fallback.

## Verification and delivery

Regenerate outputs. Run install/lockfile integrity, lint, build, dist verification, unit tests, frontend E2E, Cloudflare dry-run/build, guarded Playground preview, complete diff review, and zero-V5 reference/path greps. There must be no tracked active V5 implementation paths and no active references to `src/v5`, `v5-application`, `dev:v5`, `verify-v5`, or `playwright.v5`.

Make one coherent commit, push/read back if authorized, update the current chain/handoff, and release the writer lock. Promote only via the accepted clean-lineage path after all gates, then update the parked v0.8.4 branch from post-cutover main. Do not independently edit those worktrees and do not deploy Production.

## Stop conditions

Stop and preserve state on a conflicting writer, unknown integration-worktree changes, native Figma source failure, required backend/auth/data/migration/provider change, privacy/secret exposure, mandatory verification failure, Production crossover, or missing clean-lineage authority.
