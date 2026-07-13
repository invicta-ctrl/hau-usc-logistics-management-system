# HAU-USC Codex routing

This directory contains the project-specific adapter for the account-wide
instruction-refinement and model-routing standard in the Context Vault.

## Authority and retrieval

The current user instruction is highest authority. The HAU-USC repository is
authoritative for technical facts. Read `AGENTS.md`, `PROJECT_STATUS.md`,
`docs/WORK_CONTINUATION.md`, and task-relevant architecture, domain, security,
and testing documents before refining or routing. The Context Vault provides
reusable governance only.

## Workflow

1. `scripts/codex-route.ps1` preserves the raw instruction in the local
   gitignored runtime directory.
2. Rough and partial inputs are refined by a read-only `codex exec` call with
   the task-refinement JSON schema.
3. Complete prompts and precise commands are wrapped without unnecessary
   rewriting.
4. `scripts/codex-routing.mjs` validates the refinement and deterministically
   selects a verified route.
5. Assessment mode stops after displaying the route. Execution requires
   `-Execute` and starts the worker with the refined brief only.
6. The launcher runs an allowlisted verification profile and then a separate
   read-only review unless `-SkipReview` is explicitly supplied.

## Runtime files

Transient files are written only to `.codex/runtime/` and are ignored by Git:

- `original-instruction.txt`
- `current-task-brief.md`
- `current-task-refinement.json`
- `current-route.json`
- `worker-output.md`
- `review-output.md`

Never commit these files, raw prompts, model output, secrets, local paths, or
live execution logs.

## Capability compatibility

The local Codex catalog verified account-specific aliases `gpt-5.6-terra`,
`gpt-5.6-luna`, and `gpt-5.6-sol`. The launcher uses `codex exec`, explicit
`--sandbox`, `--output-schema`, and `-o` flags documented for current Codex
releases. If the installed client rejects a flag or alias, the launcher stops
and reports the limitation; it does not substitute an unknown model.

Project-local hooks and custom agents require trust review in Codex. Hooks add
context and block supported edit paths, but they are not the only enforcement
boundary because some shell mechanisms are not intercepted by hooks.

