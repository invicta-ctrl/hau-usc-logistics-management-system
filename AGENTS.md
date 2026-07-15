# Coding Agent Instructions

These instructions apply to ChatGPT web, Codex local tasks, Codex worktrees, and human maintainers. The GitHub repository is the shared source of truth; chat history and local folders are supporting context only.

Before editing, read `README.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, `docs/AI_COLLABORATION.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_RULES.md`, `docs/SECURITY_AND_ACCESS.md`, and `docs/LAUNCH_RUNBOOK.md`.

## Intent, skills, and Caveman Light

- Scan the available skill registry before choosing a workflow. Use the smallest matching skill set and record it in `.codex/CURRENT_TASK.md`; do not invent or silently install unavailable skills.
- Before broad retrieval or execution, route the request by intent, mode, target, authority, risk, deliverable, verification, and stop conditions. Follow `.codex/TASK_ROUTING.md`.
- Short owner instructions such as `Continue`, `Fix the current blocker`, or `Give me the decision` use `.codex/CAVEMAN_WORKFLOW.md`. Simpler input never bypasses specifications, security, domain invariants, tests, review, backup, rollback, or truthful evidence.
- Non-trivial features, behavior changes, migrations, deployments, architecture decisions, and destructive maintenance require an accepted specification or amendment before implementation.
- Keep `.codex/CURRENT_TASK.md` concise and current. Use `.plans/current-slice.md` for the active product Slice and `.plans/AUTONOMOUS_PROGRAM_STATUS.md` for the program; do not create competing roadmaps.

## Context and usage discipline

- Prefer deterministic scripts, diff-first inspection, targeted reads, and SHA-based verification reuse. Follow `.codex/USAGE_POLICY.md` and use `tools/codex/run-capped.mjs` for potentially large command output.
- The parent agent is the only writer by default. Use at most two concurrent read-only subagents with one delegation level, only for bounded large-input mapping, log triage, independent review, or genuinely independent read-only investigations requested by the task or an applicable skill.
- Do not repeat expensive tests, reviews, builds, migrations, or deployments when the commit and relevant artifacts are unchanged and the prior evidence is recorded.

## Required start-of-task handshake

1. Report the repository root, current branch, current `HEAD`, upstream branch, and `git status --short`.
2. Run `git fetch origin --prune` when network access is available.
3. Compare local and upstream with `git rev-list --left-right --count HEAD...@{upstream}`.
4. If the working tree is clean and only behind, use `git pull --ff-only`. If it is dirty, divergent, on the wrong branch, or lacks an upstream, stop and report the condition; never reset or discard work automatically.
5. Confirm the expected starting commit from the manager task or `docs/WORK_CONTINUATION.md` before changing files.
6. For read-only review or planning tasks, do not create commits or mutate external systems.

## Manager and implementer roles

- ChatGPT web is the default manager/reviewer: verify the remote branch, PR, commits, and CI; define one bounded milestone; review pushed evidence before approving the next milestone.
- Codex is the default implementer: verify the local checkout, implement the accepted milestone, run checks, update continuation records, commit, and push the feature branch.
- Only one agent may write at a time. ChatGPT web must not change the branch while Codex is implementing; Codex must not begin a new milestone until the manager has reviewed the pushed commit.
- Agents share context through committed repository files and GitHub, not assumed cross-chat memory. Follow `docs/AI_COLLABORATION.md`.

- Work one issue or vertical slice at a time after this launch-readiness refactor.
- Preserve `legacy/HAU-USC_Logistics-Prototype.original.html` as the approved visual baseline. Regenerate visual modules with `npm run extract:visual`; do not casually redesign them.
- Do not hand-edit `dist/index.html`, `HAU-USC_Logistics-Prototype-Shareable.html`, or `apps-script/Index.html`.
- Browser code calls a service adapter. Only `src/services/apps-script-adapter.js` may use `google.script.run`.
- Apps Script writes require authorization, an idempotency key, a lock where state may race, server-side IDs, status history, and audit logging.
- Never edit or delete posted ledger entries. Use a documented reversal or adjustment.
- Never transact `VERIFY` items. Preserve legacy source sheet, row, block, exact name, quantity, and unit.
- Never write to the pre-rework backup spreadsheet.
- Drive folder configuration must fail closed. Never fall back to the script owner’s My Drive root.
- UI hiding is not authorization. Keep request-only bootstrap sanitized.
- Do not commit `.clasp.json`, secrets, institutional credentials, personal student records, private contacts, supplier TINs, or evidence files.
- Run `npm run check`; run Playwright where Chromium is installed. Run `clasp status` and `clasp push --dry-run` only after configuring a staging script.
- Update `PROJECT_STATUS.md`, `CHANGELOG.md`, and `docs/WORK_CONTINUATION.md` before handoff. State unrun checks and unresolved values honestly.
- Commit in a small logical unit, push the feature branch when authorized, and report the exact commit SHA and PR/CI state. Never claim a push, test, deployment, or external write without verification.
