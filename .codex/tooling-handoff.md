# Codex workflow tooling handoff

This isolated tooling slice adds developer workflow integrations only. It does
not change product behavior, UI, domain rules, authorization, migrations,
staging, production, or the active Phase 15 worktree.

## Installed local tools

- Serena Agent `1.6.1`, installed with `uv tool install -p 3.13 serena-agent`.
  Its project cache is outside Git at
  `C:/Users/adria/AppData/Local/Serena/projects/`.
- Context7 CLI `0.5.6` and MCP package `@upstash/context7-mcp 3.2.5`,
  installed globally under the user npm prefix.
- Headroom `0.32.1`, installed with `uv tool install "headroom-ai[all]"`.
- Renovate CLI `37.440.7` is installed globally. The repository configuration
  is `renovate.json`; activation still depends on enabling Renovate for the
  GitHub repository or organization.
- CodeQL is activated through `.github/workflows/codeql.yml` using
  `github/codeql-action` major `v4`.

## Codex MCP configuration

New Codex sessions read the user-level MCP entries for `serena`, `context7`,
and `headroom` from `C:/Users/adria/.codex/config.toml`. Existing `codegraph`
and `lean-ctx` entries are preserved. No API key is stored in the config.

Serena memories are disabled/ignored globally and its runtime project data is
kept outside the repository. The project index was created for the isolated
tooling worktree so symbol navigation is available to new sessions.

Headroom is registered as an MCP server. Proxy routing is intentionally not
applied to the active session. For a separate new session, use the official
Headroom wrapper or start `headroom proxy` and route that session explicitly;
do not combine it with the active Phase 15–28 worker without a fresh approval
and a rollback plan.

## Reuse-first implementation rule

Before adding a new helper, abstraction, dependency, workflow, or project
instruction:

1. Search the repository, existing Codex MCP tools, Serena symbols, and
   Context7 documentation for an existing capability.
2. Reuse the smallest existing capability that satisfies the requirement.
3. Add new code only when reuse is unavailable or would violate a documented
   invariant, security boundary, or acceptance criterion.
4. Record the reason for any new dependency or abstraction in the review/PR.

The uninstalled Caveman and Ponytail tools are intentionally not part of this
slice. Do not add them as duplicate memory or orchestration authorities.

## Verification and rollback

- Validate JSON/YAML and run the repository-required checks before merging.
- Run `renovate-config-validator renovate.json` when Renovate configuration
  changes.
- Start or route Headroom only in a separate test/new session when proxy health
  evidence is required.
- The pre-edit Codex configuration backup is at
  `C:/Users/adria/.codex/backups/workflow-tooling-20260726-163959`.
- To remove only the new Codex MCP entries, restore the backed-up
  `C:/Users/adria/.codex/config.toml` after confirming no newer user changes;
  do not blindly overwrite future configuration changes.
