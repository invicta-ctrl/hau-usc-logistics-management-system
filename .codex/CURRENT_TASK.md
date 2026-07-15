# Current Task

- **Task ID:** PHASE-2-CAVEMAN-EFFICIENCY
- **Original instruction:** `I accept`
- **Intent and mode:** `REPOSITORY_MAINTENANCE`; execute
- **Secondary intents:** `TESTING`, `DOCUMENT_OR_ARTIFACT`
- **Matched skills:** `openai-docs` for current Codex configuration schema
- **Objective:** Install and verify the accepted project-scoped Caveman Light,
  intent/skill routing, bounded-output, continuation, and read-only agent layer.
- **Verified starting state:** `D:\Documents\DOL Website GitHub` on
  `feat/live-sync-lending-search-catalog-controls` at
  `c96bdc32e6777d948c6520bd94200f5dc537374d`, upstream synchronized `0 0`, clean.
- **Authoritative specification:** accepted master goal prompt, Phase 2; root
  `AGENTS.md`; current official Codex configuration manual.
- **Dependencies:** accepted Slice 6 remote/CI checkpoint; owner-confirmed
  archived `.codex` configuration candidates.
- **In scope:** concise repository instructions; `.codex` workflow, routing,
  usage, current-task, history, project config, read-only agents; deterministic
  governance/continuation checks; capped-output and compact-summary helpers;
  focused tests; required status records.
- **Out of scope:** Slice 7 product behavior; generated application artifacts;
  Apps Script, Sheets, Drive, staging, production, migration, Cloudflare, or
  database changes; repository consolidation/deletion.
- **Allowed files:** `AGENTS.md`, `.gitignore`, `package.json`,
  `eslint.config.js`, `.codex/**`, `tools/codex/**`, `scripts/check-*.mjs`,
  focused tests, and required checkpoint documentation.
- **Off-limits files:** generated HTML and application/backend source unrelated
  to governance.
- **Assumptions:** the accepted master prompt is the Phase 2 specification;
  `gpt-5.6-terra`, project custom agents, and the selected config fields are
  current documented Codex capabilities.
- **Domain/security constraints:** preserve all repository domain invariants;
  no credentials, private identifiers, external configuration, or operational
  evidence in Git or logs.
- **External-system boundary:** GitHub push/CI only after local acceptance;
  no other external mutation.
- **Risks:** unsupported config, stale checkpoint fields, excessive output,
  accidental parallel writers, or governance rules that conflict with root
  instructions.
- **Rollback:** focused revert of the Phase 2 commit; archived source configs
  remain preserved outside the repository.
- **Focused tests:** agent/config validator, continuation validator, capped
  runner tests, config strict parsing where locally supported.
- **Final verification:** `npm run check:governance`, focused Vitest, full
  `npm run check`, `git diff --check`, independent read-only review, push parity,
  and PR CI.
- **Acceptance criteria:** all Phase 2 files are present and internally
  consistent; routing/config smoke tests pass; output caps and true exit codes
  are tested; required status records reconcile; worktree ends clean.
- **Evidence required:** exact commands, counts, commit SHA, PR head/checks,
  unrun checks and reasons, and confirmation of no external operational action.
- **Safe-to-continue result:** yes; clean synchronized checkpoint and explicit
  manager acceptance were verified.
- **Verified results:** governance checks passed 8 project files / 14 resume
  fields; focused Vitest passed 13 tests; capped `npm run check` passed 25 files /
  216 tests, a 28-module build, 29 Apps Script sources / 47 required functions,
  generated parity, and standalone verification. Lint, formatting, and diff
  checks pass.
- **Unrun checks:** strict Codex config parsing is not claimed because the local
  `codex.exe` launcher returned access denied. Local Playwright was not repeated
  because Phase 2 changes no application/generated source; accepted Slice 6
  browser evidence remains applicable and PR CI will rerun browser smoke.
- **Current stage:** implementation verified and independent review PASS;
  checkpoint commit pending.
