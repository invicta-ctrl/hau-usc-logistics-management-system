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

The repository-root `AGENTS.md` is the canonical model policy. The task records
`REQUIRED_MODEL: GPT-5.6 SOL` because Sol is the sole top-level, read-only
orchestrator; that field never authorizes Sol to write.

Only Sol may create child tasks, with `DELEGATION_DEPTH: 1`. Sol may use up to
16 Terra MAX writer-class children and up to 16 Luna MAX read-only reviewer
children. Sol children are forbidden. Do not substitute another model class when
the required route is unavailable; stop and report the routing blocker.

Each writing task names one `TERRA_INTEGRATION_WRITER` as the sole canonical
branch/worktree writer. Additional Terra work is allowed only in isolated,
non-overlapping worktrees or patch scopes. Luna performs bounded mapping, log
triage, review, or audit only and never mutates repository/provider state.

Use deterministic scripts and targeted inspection first. Each task-local ledger
row states agent ID, model, role, mode, scope, worktree or patch, owned and
excluded paths, dependencies, status, and output evidence. Do not delegate
status updates, known pushes, small files, deterministic work, owner decisions,
production approval, destructive cleanup, or work already verified at the same
SHA.
