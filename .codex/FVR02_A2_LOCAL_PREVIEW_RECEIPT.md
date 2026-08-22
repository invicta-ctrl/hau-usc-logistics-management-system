# FVR-02-A2 Local Preview Resilience Receipt

STATUS: IMPLEMENTED_AND_UNIT_VERIFIED
OWNER: Earl
DATE: 2026-08-22
CANONICAL_WRITER: DEEPSEEK_V4_PRO:/root/ds1_fvr02_writer_v2
SPEC: .codex/specs/accepted/2026-08-22-fvr02-a2-local-preview-resilience.md
PLAN: .plans/fvr02-a2-local-preview-resilience.todo.md

## Implemented result

- `scripts/frontend-preview-supervisor.mjs` adds a `PreviewSupervisor` that owns exactly one Vite child, verifies the guarded Playground origin before every initial start/restart, and auto-restarts owned unexpected exits with bounded backoff 1/2/4/8/15s and a restart-loop stop.
- `scripts/start-frontend-playground-preview.mjs` is now a thin CLI with `dev` (preserved foreground), `start` (detached persistent supervisor), `status`, `restart`, and `stop` modes.
- Loopback-only control endpoint (`127.0.0.1`, ephemeral port) requires a random owner token stored only in ignored `.codex/runtime/local-preview/state.json`; the token is never logged and never stored in Git.
- Only the canonical private manifest path and a SHA-256 content fingerprint are persisted; no manifest content or credentials are written to state or logs.
- Start/status/restart/stop prove token plus live supervisor identity before acting; unknown-listener and stale-state cases refuse rather than kill.
- `package.json` adds `preview:frontend:start`, `preview:frontend:status`, `preview:frontend:restart`, `preview:frontend:stop`, and keeps `dev:frontend:playground` (now explicit `dev` mode).

## Verification performed (this slice)

- `git diff --check`: PASS.
- `node scripts/check-agent-instructions.mjs`: PASS (12 project files).
- Focused unit: `npx vitest run tests/unit/frontend-preview-supervisor.test.js tests/unit/frontend-playground-guard.test.js`: PASS (2 files, 13 tests).
- Focused eslint on the three changed JS files: PASS (no findings).
- `node --check` on both changed scripts: PASS.

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
