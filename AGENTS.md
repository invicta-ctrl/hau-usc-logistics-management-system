# Coding Agent Instructions

These instructions apply to ChatGPT web, Codex local tasks, Codex worktrees, and human maintainers. The GitHub repository is the shared source of truth; chat history and local folders are supporting context only.

**Universal instruction:** before any project work, consult the connected `gpt-context-vault` entrypoint for routing, then read this repository's `AGENTS.md`, governing rules, and accepted active specification. Do not implement from chat history alone.

Before editing, read `README.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, `docs/AI_COLLABORATION.md`, `docs/SPEC_DRIVEN_DEVELOPMENT.md`, `docs/ARCHITECTURE.md`, `docs/DOMAIN_RULES.md`, `docs/SECURITY_AND_ACCESS.md`, and `docs/LAUNCH_RUNBOOK.md`. For implementation work, also read the accepted specification under `specs/`.

## Spec-driven development gate

1. Every non-trivial feature, behavior change, defect repair, schema/API/security change, deployment change, or governance change must have one bounded specification at `specs/<id>-<slug>/SPEC.md`.
2. Create specifications from `specs/_templates/SPEC_TEMPLATE.md`. The specification must define scope, non-goals, requirement IDs, acceptance-criteria IDs, risks, verification, and rollback or recovery expectations.
3. Implementation may start only when the specification status is `ACCEPTED`. Earl's explicit approval or an explicitly delegated manager approval is required.
4. Implement only the accepted specification. Any material scope change, new requirement, removed acceptance criterion, or changed external-write permission requires a recorded amendment and renewed approval before implementation continues.
5. Tests, documentation, and handoff evidence must map back to the specification's requirement and acceptance-criteria IDs. A change is not complete until the specification is marked `VERIFIED` with evidence.
6. Tiny typo/format-only edits and deterministic regeneration from already accepted source changes may use an inline specification in the issue or pull request. Emergency security repairs may proceed only when delay would increase risk, and must add a retrospective specification in the same pull request.

## Required start-of-task handshake

1. Report the repository root, current branch, current `HEAD`, upstream branch, and `git status --short`.
2. Run `git fetch origin --prune` when network access is available.
3. Compare local and upstream with `git rev-list --left-right --count HEAD...@{upstream}`.
4. If the working tree is clean and only behind, use `git pull --ff-only`. If it is dirty, divergent, or on the wrong branch, stop and report the condition; never reset or discard work automatically. A fresh task branch may lack an upstream only when the manager task names the exact branch and starting commit and explicitly says the missing upstream is intentional; verify that base and proceed locally until the first authorized push establishes the upstream.
5. Confirm the expected starting commit from the manager task or `docs/WORK_CONTINUATION.md` before changing files.
6. Confirm the accepted specification path, status, requirement IDs, acceptance-criteria IDs, and allowed external writes.
7. For read-only review or planning tasks, do not create commits or mutate external systems.

## Manager and implementer roles

- ChatGPT web is the default manager/reviewer: verify the remote branch, PR, commits, and CI; define or review one bounded specification; approve only a spec-compliant milestone; review pushed evidence before approving the next milestone.
- Codex is the default implementer: verify the local checkout, implement the accepted specification, run checks, update specification evidence and continuation records, commit, and push the feature branch.
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
- Drive folder configuration must fail closed. Never fall back to the script owner's My Drive root.
- UI hiding is not authorization. Keep request-only bootstrap sanitized.
- Do not commit `.clasp.json`, secrets, institutional credentials, personal student records, private contacts, supplier TINs, or evidence files.
- Run `npm run check`; run Playwright where Chromium is installed. Run `clasp status` only after configuring a staging script. Clasp 3.3 has no supported `push --dry-run`; before any authorized push, use the separate remote-snapshot, status, manifest-preservation, and post-push parity safeguard in `docs/LAUNCH_RUNBOOK.md`.
- Update the active specification, `PROJECT_STATUS.md`, `CHANGELOG.md`, and `docs/WORK_CONTINUATION.md` before handoff. State unrun checks and unresolved values honestly.
- Commit in a small logical unit, push the feature branch when authorized, and report the exact commit SHA and PR/CI state. Never claim a push, test, deployment, or external write without verification.
