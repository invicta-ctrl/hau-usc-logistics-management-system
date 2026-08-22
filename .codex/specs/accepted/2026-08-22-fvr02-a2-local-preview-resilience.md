# FVR-02-A2 — Local Preview Resilience / Auto-Recovery

STATUS: ACCEPTED
OWNER: Earl
DATE: 2026-08-22
SLUG: fvr02-a2-local-preview-resilience
PARENT: FVR-02 (2026-08-22-fvr02-full-frontend-recovery-media-motion-index.md)
BRANCH: frontend-design-integration
ORCHESTRATOR: GPT-5.6 Sol Max (read-only)
CANONICAL_WRITER: DeepSeek V4 Pro #1
RISK: LOW-MEDIUM (local development tooling only)
PRODUCTION_DEPLOYMENT: FORBIDDEN
PRODUCTION_DATA_WRITE: FORBIDDEN
PLAYGROUND_DATA_WRITE: FORBIDDEN
FIGMA_WRITE: FORBIDDEN
PROVIDER_WRITE: FORBIDDEN

## Intent

BUG_FIX + PREVIEW_TOOLING. The local preview at http://127.0.0.1:4173 refused connections on 2026-08-22 (observed read-only, no external mutation). The current launcher starts a single Vite child and exits with it, leaving no listener on unexpected child exit. Add a persistent, owned-process preview supervisor that auto-recovers from ordinary local preview process failure while preserving the guarded isolated Playground proxy.

## Authority

Earl's explicit current instruction -> accepted FVR-02 spec -> this amendment -> branch-local AGENTS.md appendix -> `.agents/PROJECT_POLICY.md` -> repository preview launcher/scripts and guarded Playground proxy contract.

## In scope

- Evolve the local preview launcher or add a focused companion supervisor script with persistent start/status/stop/restart commands and bounded backoff.
- Preserve the existing guarded Playground proxy: resolve the private manifest, verify manifest path is approved/private, read `playgroundHostname`, call `verifyPlaygroundOrigin(...)`, set only the verified `HAU_PLAYGROUND_PROXY_ORIGIN`, bind Vite to `127.0.0.1:4173`, preserve `/api`, `/brand`, `/media` proxying, and never fall back to Production.
- Owned-process proof before stop/restart (PID identity, expected executable, repo cwd/command, supervisor-owned child relationship or generated owner token). Never kill an unknown process on 4173.
- HTTP health probe (`GET http://127.0.0.1:4173/` -> 2xx HTML) with several consecutive failures required before restart so HMR/rebuild pauses do not thrash.
- Bounded restart backoff (e.g. 1s, 2s, 4s, 8s, 15s), a restart-loop detection stop, and a healthy-interval reset.
- Runtime-only state (PID, owner token/identity, log path, manifest fingerprint/path reference, start/last-healthy timestamps, restart count) stored untracked and outside tracked product files; `.codex/runtime/local-preview/` only if already ignored/untracked, otherwise OS temp/local-app-data. No secrets, manifest contents, tokens, cookies, or private data in logs or state.
- Bounded local logs with rotation/size bound. Preserve Vite HMR workflow. Leave the preview running only after implementation and verification.

## Out of scope

- No product/FI-00->FI-03 behavior change, no backend/API/auth semantics, no D1/R2, no Playground data, no Production, no Figma, no Cloudflare deployment.
- No change to the guarded Playground proxy contract or `verifyPlaygroundOrigin` guard.
- No Production/Figma/provider write and no schema/migration.
- No new authority for FVR-02 closeout or FI-04; this amendment does not independently close FVR-02.

## Invariants

- Production deployment and Production/Playground data write are forbidden.
- The private Playground manifest and `verifyPlaygroundOrigin` guard are preserved on every start/restart.
- If Playground verification fails, stop restarting and report the real guard failure; never use Production as fallback.
- If port 4173 is owned by an unknown process, `STOP_PORT_4173_OWNERSHIP_UNKNOWN`; do not force-kill.
- Runtime state is untracked and secrets are never stored.
- One canonical writer remains: DeepSeek V4 Pro #1; no second writer.

## Acceptance and verification

Deterministic checks: `LOCAL_PREVIEW_PERSISTENT=PASS`, `LOCAL_PREVIEW_URL=http://127.0.0.1:4173`, `HTTP_ROOT=PASS`, `HASH_HERO_ROUTE=PASS`, `HMR=PASS`, `PLAYGROUND_PROXY_GUARD=PASS`, `AUTO_RESTART_AFTER_OWNED_CHILD_EXIT=PASS`, `NO_DUPLICATE_PROCESS=PASS`, `SAFE_STOP=PASS`, `UNKNOWN_PORT_PROCESS_NOT_KILLED=PASS`, `PRODUCTION_CROSSOVER=0`.

Required deterministic tests (do not kill unrelated user processes): persistent start returns success and becomes healthy; status reports RUNNING + healthy; second start does not create a duplicate preview; terminating only the supervisor-owned Vite child triggers detect/restart/healthy; expected stop shuts down owned supervisor+child without auto-restart; unknown process on 4173 is not killed; invalid/unverified target prevents start/restart; restart safely replaces only the owned preview process.

## Rollback and stop conditions

- Rollback: Git revert the preview supervisor scripts, package commands, directly coupled tests, and continuity records; no Production/Figma rollback because no such writes; Playground repair only via recorded existing runbook recovery.
- Stop: conflicting writer; unknown dirty work; missing/contradictory authority; Playground verification failure (stop restarting and report); port 4173 ownership unknown; security/privacy ambiguity; restart-loop detection without a healthy interval; any Product/backend/Production/Figma/provider crossover; any need to exceed scope.

## Continuity

Record a concise durable receipt (`FVR02_A2_LOCAL_PREVIEW=PASS`, `PREVIEW_MODE=PERSISTENT_SUPERVISED`, `URL`, `PLAYGROUND_GUARD=PASS`, `AUTO_RESTART=PASS`, `HMR=PASS`, `PRODUCTION_CROSSOVER=0`), leave the preview healthy and running, then return to the exact FVR-02 task/checkpoint that was active before this amendment.
