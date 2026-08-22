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
- FOLLOWUP_CORRECTION: implemented in a follow-up commit; this receipt is corrected accordingly. Live runtime acceptance is NOT claimed.

## Implemented result

- `scripts/frontend-preview-supervisor.mjs` adds a `PreviewSupervisor` that owns exactly one Vite child, re-runs `resolvePrivatePath` plus `parsePlaygroundOrigin` plus `verifyPlaygroundOrigin` before every initial/restart launch, preflights port 4173, and auto-restarts owned unexpected exits with bounded backoff 1/2/4/8/15s and a restart-loop stop.
- Start ownership uses an exclusive `wx` claim bound to a random `instanceId`; exactly one supervisor wins, and a caller cleans only its own failed claim.
- Loopback-only control endpoint (`127.0.0.1`, ephemeral port) requires a random owner token plus matching `instanceId`, `supervisorPid`, and `controlPort`; the token is stored only in the ignored 0600 `.codex/runtime/local-preview/state.json` and never appears in argv/log/stdout.
- Readiness requires repeated HTTP 2xx with `text/html` content-type and the stable `<div id="app">` marker while the owned child remains alive.
- Restart flows through a single child-exit path with a `restarting` lock; explicit restart replaces one child and waits for a new healthy pid. Restart history resets only after a sustained healthy interval; terminal loop state remains inspectable.
- Stop finalizes even with a dead/absent child and, on Windows, uses argument-array `taskkill` tree-kill (grace first, force only after grace). No PID is ever composed into a shell string.
- Control and health requests are bounded; non-JSON/non-2xx fail closed. Stop/restart return nonzero on non-2xx or `{ok:false}`.
- `scripts/start-frontend-playground-preview.mjs` is a thin CLI with `dev` (preserved foreground), `start`, `status`, `restart`, and `stop` modes; persistent `start` preserves `-- <vite args>` and restart reuses the canonical path with re-resolution.
- `package.json` adds `preview:frontend:start`, `preview:frontend:status`, `preview:frontend:restart`, `preview:frontend:stop`, and keeps `dev:frontend:playground` (now explicit `dev` mode).

## Verification performed (this slice)

- `git diff --check`: PASS.
- `node scripts/check-agent-instructions.mjs`: PASS (12 project files).
- Focused unit: `npx vitest run tests/unit/frontend-preview-supervisor.test.js tests/unit/frontend-playground-guard.test.js`: PASS (2 files, 29 tests).
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

- A concurrent duplicate `start` racing a fresh start is guarded by the stale-state refusal and Vite `--strictPort`; the CLI never force-kills an unknown listener.
- Windows detached-process semantics use `detached: true`, `stdio: 'ignore'`, and `child.unref()`.
