# FVR-02-A2 Local Preview Resilience Receipt

STATUS: ACCEPTED_LIVE_RUNTIME_VERIFIED
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
- FOURTH_PASS_COMMIT: b718ba19811946297d715dd7c304809ac7653e0e
- FOURTH_PASS_REVIEW: FAILED static concurrency review (stop racing async pre-spawn verification and the RESTARTING state write; stop-during-backoff test bypassed the real stop path).
- FIFTH_PASS_COMMIT: ee412d4e41df487d96571f51a99d430e52f38041
- FIFTH_PASS_REVIEW: FAILED static concurrency review (readiness promotion and both health-loop writes still used direct raceable state writes; stop-won cleanup did not set in-memory STOPPED/terminationReason; restart-loop selection did not prefer expected stop).
- SIXTH_PASS_COMMIT: 9ad2d35a179e8bfce3f6a3381c6887db2d8f69d9
- SIXTH_PASS_REVIEW: FAILED static concurrency review (readiness verified only before its awaited fetch, so a stale probe for a replaced child could promote RUNNING; independent atomic renames were unordered so a delayed stale RUNNING write could win after RESTARTING).
- SEVENTH_PASS_COMMIT: adf52f8f8b7f65ad7b253da6eb17953b4603078a
- SEVENTH_PASS_REVIEW: runtime-discovered production-binding defect (the first authorized positional-manifest start failed safely before state/listener with `The "path" argument must be of type string. Received an instance of Object`; `claimState`, `clearClaim`, and `safeClearStateIfDead` were assigned directly as defaults but invoked with a mismatched arity, so the state object reached `path.join`). Parent verified state absent and listener count 0.
- FINAL_CORRECTION: implemented in the final corrective commit `4cbb921`. Live runtime acceptance was subsequently performed and PASSED; this receipt records that evidence. No runtime PASS was claimed before the parent executed it.

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
- A shared stop-wins reconciliation re-checks shutdown after every awaited pre-spawn verification boundary (manifest resolution, port preflight, immediately before spawn) and after every awaited lifecycle state write (post-spawn STARTING and RESTARTING writes). Stop that appears during those windows terminates the owned child, closes the control server, clears state, and aborts the transition, so no untracked child or recreated state survives.
- `performRestart()` guards against shutdown before any restart mutation/write; a stop that lands mid-restart write is reconciled so the expected-stop terminal cleanup wins.
- Every externally raceable lifecycle write now routes through the shared stop-wins reconciliation, including readiness promotion (RUNNING) and both health-loop writes (unhealthy→healthy and sustained-health counter reset). The only remaining direct `writeState()` is the initial startup publication inside `run()`, which is non-raceable because signal handlers are installed only after it and no authenticated stop can exist before the owner token/control port is first published.
- Stop-won cleanup now idempotently establishes in-memory STOPPED + terminationReason `stopped` and clears the health timer, so callers classify it as EXPECTED STOP rather than fatal/start_failed/restart_failed, and the health timer is never started after shutdown wins.
- Restart-loop selection now prefers expected stop: if shutdown appears before terminal loop preservation, the supervisor finalizes `stopped` instead of retaining a `loop` terminal record.
- Readiness is bound to the exact child generation/reference: `verifyReady` and `waitReady` capture the expected child and revalidate same object + live exitCode + child generation after the awaited fetch and body read and before/after committing healthy state; a stale probe for a replaced child cannot promote RUNNING.
- Lifecycle persistence is ordered through a single in-process write/clear queue plus a monotonic generation guard: `writeState` snapshots the generation at invocation and skips if a newer generation has superseded it, while RESTARTING/STOPPED/terminal writes and final clears bump generation so an older RUNNING write cannot overwrite later truth. Atomic file replacement is retained.
- `createCli` now binds every module-level runtime-state default to the correct runtime root and call shape (`readState`, `claimState`, `clearState`, `clearClaim`, and `safeClearStateIfDead`), using an injectable `runtimeRoot` plus correctly wrapped defaults so temp-root integration tests exercise the real functions without touching repo runtime. The three previously misbound arities (`claimState` one-arg, `clearClaim` one-arg, `safeClearStateIfDead` one-arg) are corrected while dependency injection is preserved.
- `scripts/start-frontend-playground-preview.mjs` is a thin CLI with `dev` (preserved foreground), `start`, `status`, `restart`, and `stop` modes; persistent `start` preserves `-- <vite args>` and restart reuses the canonical path with re-resolution.
- `package.json` adds `preview:frontend:start`, `preview:frontend:status`, `preview:frontend:restart`, `preview:frontend:stop`, and keeps `dev:frontend:playground` (now explicit `dev` mode).

## Verification performed (this slice)

- `git diff --check`: PASS.
- `node scripts/check-agent-instructions.mjs`: PASS (12 project files).
- Focused unit: `npx vitest run tests/unit/frontend-preview-supervisor.test.js tests/unit/frontend-playground-guard.test.js`: PASS (2 files, 55 tests).
- Focused eslint on the three changed JS files: PASS (no findings).
- `node --check` on both changed scripts: PASS.

Windows file-permission note: the state file is created with `0o600` intent; on Windows the inherited user ACL is preserved because deterministic ACL tightening would require risky shell behavior. This is not overclaimed as a cross-platform 0600 guarantee.

## Live acceptance evidence (parent-executed, 2026-08-22)

No machine PIDs, control port, owner token, instance ID, private manifest path/hostname, or manifest contents are recorded here; only identity-safe outcomes are listed.

- INITIAL_LIVE_ATTEMPT: first authorized positional-manifest start at `adf52f8` failed safely before any state/listener with the production default-binding TypeError (`The "path" argument must be of type string. Received an instance of Object`); parent confirmed state absent and listener count 0. Corrected by `4cbb921`.
- SECOND_START: persistent start succeeded and reached RUNNING healthy.
- HTTP_ROOT: 200, HTML with the application marker: PASS.
- HASH_HERO_ROUTE: `/#hero` browser route: PASS.
- HMR: `/@vite/client` 200 and live browser WebSocket/HMR: PASS.
- NO_DUPLICATE: a second start reused the identical supervisor/Vite pair and created no duplicate: PASS.
- OWNED_CHILD_FORCED_EXIT: exact WMI identity proof (Node executable, repository `vite.js` command, loopback `127.0.0.1:4173` with strictPort, parent supervisor relationship) preceded force-exit of only the owned Vite child; the supervisor remained alive and a new child recovered to healthy/root: PASS.
- AUTHENTICATED_RESTART: explicit restart produced a new healthy child under the same supervisor: PASS.
- AUTHENTICATED_STOP: stop removed state, listener, and owned processes and the preview remained stopped beyond the backoff window: PASS.
- UNKNOWN_LISTENER: a controlled owned dummy listener on 4173 produced the exact `STOP_PORT_4173_OWNERSHIP_UNKNOWN` failure, remained alive and unchanged, and created no preview state; the dummy was terminated only via its owning exec session: PASS.
- FINAL_PERSISTENT_START: final persistent start succeeded; final status RUNNING healthy; browser `/#hero` and HMR WebSocket reverified; preview left running: PASS.
- PLAYGROUND_PROXY_GUARD: PASS.
- PRODUCTION_CROSSOVER: 0.

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

## FVR-02 final batch closeout (2026-08-22)

- IMPLEMENTATION_COMMITS_AFTER_PREVIEW_ACCEPTANCE: ae64a519beabd23647dc92b6d9d855044ef53cc8, b826ceb05e15b5e98e91e4230beeb918c91e467c, da5d517deda0b72848198a79b3c66b082d51522d, 8794140d96c22f05478f32d58f4f82a96f33cbad, 06b646b3a76db0475f9c1bfdd67c8abeedaf9737, afe71859f9f9d06a7358e434db0386179602a0c7, a8cc23bf0d8ade1458eda74b55b195129a14bffb, d5d85d6a9f43dfdbdb6feb790d042b4fd6e17487.
- UNIT_INTEGRATION: `npm test` = 147 files / 1,114 tests passed, 136.90s.
- PLAYWRIGHT_AFTER_FINAL_UI: full two-spec frontend suite 120 passed across widths 320/390/768/1024/1440; targeted skip-link 5 passed.
- BUILD_AND_DIST: `npm run build` passed; `npm run verify:dist` passed (deterministic artifact sha256 c84c8b398b9d67ab...).
- LIVE_PARENT_ACCEPTANCE: persistent `http://127.0.0.1:4173` root 200; `/api/version` playground true; exact hash/launcher/direct Index works; 15 entries/3 groups; widths no overflow; controls >=44px; Surface Preview read-only/no forms; focus return works; auth Open performs real unauthenticated session check and shows Sign in (expected 401 console-only signal); hero poster=1/video=0/`atrium-enter`; no mutating API requests; page errors 0.
- PREVIEW_RESILIENCE: prior A2 acceptance at 15d7deb; persistent preview remains root 200 and `/api/version` playground true after full tests; leave running.
- GOVERNANCE: `npm run check:agents` pass (12 project files); `npm run check:continuation` pass (14 required fields).
- LINT_BASELINE: repository-wide `npm run lint` remains non-green solely due 26 no-undef browser-global errors in unchanged `prototypes/public-portals-r3/app.js` plus one unrelated warning in unchanged `src/server/public-request-service.js`; FVR-02 changed JS/test eslint has 0 errors and TS/JSX is ignored by the current ESLint config; recorded as unrun/non-gating baseline debt.
- IMPECCABLE: detector ran exactly once after UI changes; its two new PreviewIndex findings were fixed at a8cc23b and it was not rerun by requirement; the seven literal-color advisories are exact live Figma `theme.css` source fidelity and intentionally unchanged.
- MAKE_CSS: exact live Make v39 CSS sourced via authenticated Figma with only `./tailwind.css` -> `tailwindcss` adaptation; no Figma writes.
- PRODUCTION_NEGATIVE: proxy/Production guard PASS; crossover 0; no provider/data/deploy mutations.
- FINAL_STATUS: BLOCKED/PARTIAL; FI-04 not ready/not advanced.
- BLOCKERS: FVR02_VIDEO_AUTHORITY_CONFLICT (live Make v39 exposes no hero video source; poster-only intentional); FVR02_PUBLIC_MEDIA_BLOCKED (seed advertisement expired 2026-08-01, referenced R2 object missing, no accepted seed/upload runbook, no media mutation authorized).
