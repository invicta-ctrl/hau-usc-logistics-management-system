# Usage and Context Policy

Use the lowest-cost capable workflow that preserves correctness.

## Context loading

Read applicable instructions, `.codex/CURRENT_TASK.md`, the current Slice and
program status, the accepted specification, and directly relevant source/tests.
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

## Delegation

Use deterministic scripts and targeted inspection first. The parent remains the
only writer. At most two concurrent read-only subagents and one delegation
level may be used when a source exceeds roughly 500 lines or 32 KiB, a large log
would pollute context, independent directories can be mapped safely, or an
independent review is required. Every delegation states intent, target,
read-only authority, scope, output limit, verification, and stop conditions.

Do not delegate status updates, known pushes, small files, deterministic work,
owner decisions, production approval, destructive cleanup, or work already
verified at the same SHA.
