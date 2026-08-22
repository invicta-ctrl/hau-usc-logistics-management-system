# FVR-02-A2 Local Preview Resilience Receipt

STATUS: IMPLEMENTED_UNIT_VERIFIED_PENDING_RUNTIME_ACCEPTANCE
OWNER: Earl
DATE: 2026-08-22
CANONICAL_WRITER: DEEPSEEK_V4_PRO:/root/ds1_fvr02_writer_v2
SPEC: .codex/specs/accepted/2026-08-22-fvr02-a2-local-preview-resilience.md
PLAN: .plans/fvr02-a2-local-preview-resilience.todo.md

## Review history

- FIRST_PASS_COMMIT: 346f4bf0b5e6a78308305393d72385d44f3d98ee
- FIRST_PASS_REVIEW: FAILED parent + Ox runtime-promotion review (atomic duplicate-start claim, safe stale recovery, authenticated identity, readiness marker, restart concurrency, storm reset, stop/ownership, request bounding, state/token redaction, and Windows tree-kill gaps).
- SECOND_PASS_COMMIT: ac2d7227314acb923a55657f4e7fb09870f8d9b2
- SECOND_PASS_REVIEW: FAILED parent + Ox runtime-promotion review (Windows tree termination not wired into the standalone supervisor; unsafe Vite arg forwarding; stale lifecycle truth inherited across replacement launches; unhealthy authenticated start treated as already-running; startup failure did not clear its own claim; control acks lacked identity; pending-claim PID/port recovery; response-body overflow; and 0600/atomic-update truth).
- THIRD_PASS_COMMIT: 2d66d9d35b09aa401436b41283f8fd4853e03b95
- THIRD_PASS_REVIEW: FAILED static acceptance (truthful restart transition before backoff and dead-pid advertisement; readiness-timeout live adopted supervisor cleanup; plus stop-during-backoff race, terminal-loop inspectability, identity-safe bounded logs, and positional manifest CLI form).
- FINAL_CORRECTION: implemented in the final corrective commit. Live runtime acceptance is NOT claimed.

## Implemented result

- `scripts/frontend-preview-supervisor.mjs` adds a `PreviewSupervisor` that owns exactly one Vite child, re-runs `resolvePrivatePath` plus `parsePlaygroundOrigin` plus `verifyPlaygroundOrigin` before every initial/restart launch, preflights port 4173, and auto-restarts owned unexpected exits with bounded backoff 1/2/4/8/15s and a restart-loop stop.
- Start ownership uses an exclusive `wx` claim bound to a random `instanceId` plus `claimedAt` and `launcherPid`; exactly one supervisor wins, and a caller clears only its own failed pending claim.
- Loopback-only control endpoint requires a random owner token plus matching `instanceId`, `supervisorPid`, and `controlPort`; status/restart/stop acks are identity-bearing and validated. The token is stored only in the ignored restrictive-mode state file and never appears in argv/log/stdout.
- Windows tree termination is wired into the standalone supervisor through a default `taskkill.exe` factory using argument arrays, `windowsHide: true`, no shell, graceful `/T` then `/T /F` only after bounded grace, against the proved in-memory child PID. POSIX uses direct owned-child termination.
- Forwarded Vite args are validated so host/port/strictPort/config/mode/base (and short aliases) cannot override isolation; the guard applies to both persistent and foreground paths.
- Lifecycle truth is reset before every replacement launch (`healthy=false`, `healthySince=null`, state STARTING, health failures reset, new pid persisted). `waitForNewPidHealthy` requires repeated authenticated healthy observations.
- `already-running` is success only for authenticated healthy=true with a live vitePid; authenticated STARTING/unhealthy becomes in-flight and waits for repeated health.
- Initial startup failure clears only its own pending claim; the supervisor `run` pre-control phase and CLI spawn exceptions both clean up.
- Pending claims record `claimedAt` + `launcherPid`; in-flight waits run only while a recorded PID is alive; a pending claim clears only when all recorded PIDs are provably dead AND the port probe is definitively `closed`. `timeout` is fail-closed and never clear-on-age.
- Stale/terminal status truthfully reports authenticated STARTING and keeps a dead terminal loop record readable as STOPPED+reason; stop clears only provably-dead/no-listener stale or terminal state, otherwise ownership-unknown.
- Stale recovery checks launcherPid, supervisorPid, and vitePid; never clears while any recorded process is live. Port probe is safe only on exact `closed`; `timeout`/other is ownership-unknown across start, stale clearing, preflight, and waitForStopped.
- Control response bodies are capped (64 KiB) and fail closed on overflow. State replacement uses atomic temporary-file plus rename with bounded retry so status cannot observe transient invalid JSON as STOPPED.
- On failed CLI readiness, an authenticated live supervisor is identity-verified and stopped with bounded cleanup; otherwise the claim is preserved and the CLI fails closed. Stop finalizes even if the exit event never arrives and never leaves a live control server/state behind.
- After any child exit, the supervisor transitions immediately and atomically to a truthful restart/start state before persisting/backoff so no status window advertises RUNNING/healthy=true/old lastHealthyAt/dead vitePid. Stop requested during restart backoff cancels the restart and never spawns a second child.
- A retained restart-loop terminal snapshot is sanitized (no owner token, no control endpoint, no dead child pid) so status can truthfully report STOPPED + terminationReason; it is removed/cleared only through the normal authenticated/dead-safe paths.
- Bounded logs include identity-safe Playground verification, Vite child spawn PID, readiness PID, and restart success messages (never hostname, manifest contents, or token).
- `preview:frontend:start`/`restart` accept the owner-facing positional manifest form (`npm run ... -- <absolute-manifest>`) as well as `--manifest`, with Vite args still separated after `--`.
- `scripts/start-frontend-playground-preview.mjs` is a thin CLI with `dev` (preserved foreground), `start`, `status`, `restart`, and `stop` modes; persistent `start` preserves `-- <vite args>` and restart reuses the canonical path with re-resolution.
- `package.json` adds `preview:frontend:start`, `preview:frontend:status`, `preview:frontend:restart`, `preview:frontend:stop`, and keeps `dev:frontend:playground` (now explicit `dev` mode).

## Verification performed (this slice)

- `git diff --check`: PASS.
- `node scripts/check-agent-instructions.mjs`: PASS (12 project files).
- Focused unit: `npx vitest run tests/unit/frontend-preview-supervisor.test.js tests/unit/frontend-playground-guard.test.js`: PASS (2 files, 41 tests).
- Focused eslint on the three changed JS files: PASS (no findings).
- `node --check` on both changed scripts: PASS.

Windows file-permission note: the state file is created with `0o600` intent; on Windows the inherited user ACL is preserved because deterministic ACL tightening would require risky shell behavior. This is not overclaimed as a cross-platform 0600 guarantee.

## Not performed (pending parent runtime acceptance)

- Live runtime acceptance against the real private manifest (start/status/restart/stop and owned-child forced-exit) was intentionally NOT run in this slice; the parent will perform that after review. No real preview was started or stopped, and no private manifest was read here beyond guarded resolution design.

## Forbidden-action counters

- Production deployment: 0
- Production data write: 0
- Playground data write: 0
- Figma write: 0
- Provider write: 0
- Backend/auth/data/schema/migration change: 0
- History rewrite/reset/clean/force-push: 0

## Known limitations

- A concurrent duplicate `start` racing a fresh start is guarded by the exclusive `wx` claim and Vite `--strictPort`; the CLI never force-kills an unknown listener.
- Windows detached-process semantics use `detached: true`, `stdio: 'ignore'`, and `child.unref()`.
