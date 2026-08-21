# Usage and Context Policy

Use the lowest-cost capable workflow that preserves correctness.

## Context loading

Read applicable instructions, the canonical current/task/handoff chain, the
accepted specification, and directly relevant source/tests. Read planning or
status records only when the current task points to them.
Prefer `git diff --stat`, `git diff --name-only`, and targeted `rg` searches.
Do not dump generated HTML, lockfiles, large JSON, raw operational exports, full
traces, or broad multi-file diffs into the main context.

## Command output

For potentially large output, use:

```powershell
node tools/codex/run-capped.mjs --label <label> -- <command> <args...>
```

On Windows, use the explicit `.cmd` launcher for command shims such as
`npm.cmd`; ordinary executables continue to run without a shell. The wrapper
rejects quotes and shell metacharacters in `.cmd`/`.bat` tokens; invoke a real
executable instead when an argument needs those characters.

The wrapper stores the complete log under ignored `.codex/runtime/logs/`,
preserves the true exit code, and displays at most 4 KiB on success or 12 KiB
on failure. Never pass secrets or private operational values as command-line
arguments.

## Verification reuse

Record the commit SHA, relevant artifact hash, exact command, environment,
result/counts, and timestamp. Reuse successful expensive gates when the SHA and
relevant files are unchanged. Run focused tests during implementation and the
required complete suite once at the final gate of a bounded unit.

## Orchestration and delegation

TOKEN-OPT-001 is the sole account-wide efficiency authority. The byte-identical
repository-root `AGENTS.md` supplies universal governance and
`.agents/PROJECT_POLICY.md` supplies HAU-specific role, writer-lock, release, and
data-safety constraints. On `main`, legacy `REQUIRED_MODEL: CODEX` metadata in
current records is explicitly superseded and non-authoritative for model routing;
a separately accepted task is required to normalize those records.

Use deterministic tools and the parent first. Defaults are zero children, at most
one active child, delegation depth one, ordinary reasoning High or lower, no routine
independent review, and no routine full suite after each small module. Only Sol may
create a child. Sol children remain forbidden. Do not substitute another model class
when a required HAU route is unavailable; stop and report the routing blocker.

When accepted write scope requires a child writer, name one Terra Integration Writer
as the sole canonical branch/worktree writer. A Luna child is read-only and conditional
on material risk, uncertainty, a focused failure, or Earl's explicit request; it never
mutates repository or provider state. Writer and reviewer children do not run
concurrently by default. An exact accepted high-risk operation may require a more
specific route, but stale generic pool language is not such authority.

Each task-local ledger
row states agent ID, model, role, mode, scope, worktree or patch, owned and
excluded paths, dependencies, status, and output evidence. Do not delegate
status updates, known pushes, small files, deterministic work, owner decisions,
production approval, destructive cleanup, or work already verified at the same
SHA. Stop when the accepted DONE condition and proportionate deterministic evidence
are green.
