# Coding Agent Instructions

These instructions apply to ChatGPT web, Codex local tasks, Codex worktrees, different Codex/ChatGPT accounts, and human maintainers.

The GitHub repository is the durable shared source of truth. Chat history, account memory, local summaries, and local folders are supporting context only and must never be required to reconstruct the active project state.

## Required entry sequence

Before editing, use the smallest authoritative read set:

1. Read this `AGENTS.md`.
2. Read `.codex/CURRENT.md`.
3. Read `.codex/PHASE_AND_CONTEXT_POLICY.md`.
4. Read only the active accepted specification referenced by `.codex/CURRENT.md`.
5. Perform the required Git handshake.
6. Read additional status, continuation, architecture, domain, security, source, or test files only when the current pointer/milestone requires them.

Do **not** automatically reread `README.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, `docs/AI_COLLABORATION.md`, or the whole documentation tree on every task. Open only the sections/files needed to resolve the current milestone or a verified conflict.

Do not broad-scan the repository by default.

Do not reread unchanged files in the same task when their needed content is already in context. Prefer targeted sections, diffs, status, commit metadata, and directly relevant source/tests.

All context-efficiency, phase-boundary, manual model-switch, and Terra escalation rules in `.codex/PHASE_AND_CONTEXT_POLICY.md` are mandatory.

If repository/GitHub state contradicts stale status text, preserve both facts, trust verified current Git state for branch/commit/PR/CI facts, and update the stale record in the next authorized documentation checkpoint.

## Authority order

1. Earl's current explicit instruction.
2. Accepted project specification and approved amendments.
3. This repository and applicable `AGENTS.md` instructions.
4. `.codex/CURRENT.md` as the pointer to the active accepted step; it does not override the accepted specification.
5. Verified project status/continuation records.
6. Relevant source, tests, and generated evidence.
7. Chat history or local summaries only as non-authoritative supporting context.

## Required start-of-task handshake

1. Report repository root, current branch, current `HEAD`, upstream branch, and `git status --short`.
2. Run `git fetch origin --prune` when network access is available.
3. Compare local and upstream with `git rev-list --left-right --count HEAD...@{upstream}`.
4. If the working tree is clean and only behind, use `git pull --ff-only`.
5. If it is dirty, divergent, on the wrong branch, lacks an upstream, or contains unknown work, stop and report the condition; never reset, clean, discard, overwrite, or force-push automatically.
6. Confirm the expected starting checkpoint from `.codex/CURRENT.md` and the active task packet before changing files.
7. For read-only review or planning tasks, do not create commits or mutate external systems.

Do not assume `main` is the newest implementation branch. Verify the active pointer and Git graph before selecting a baseline.

## Account-portable continuity

A fresh Codex/ChatGPT account or new machine must be able to resume from:

`Git state -> AGENTS.md -> .codex/CURRENT.md -> .codex/PHASE_AND_CONTEXT_POLICY.md -> active spec -> targeted context`

- Never depend on a previous agent's private chat history to know what to do next.
- When an important decision, checkpoint, blocker, or next action exists only in chat, record it in the appropriate repository continuation document before handoff.
- A new Codex task must reread `AGENTS.md`, `.codex/CURRENT.md`, the phase/context policy, and the active spec; it must **not** reread the whole project by default.
- After instruction or phase-pointer changes, restart an already-running Codex task so the new instruction chain is loaded.
- Update `.codex/CURRENT.md` at every verified milestone/phase transition with the active branch, phase/spec, bounded milestone, evidence summary, next action, blocker state, and required model.

## v0.6 model routing and hard phase stops

The accepted v0.6 execution specifications live under `.codex/specs/`:

1. `v0.6-phase-1-sol-high.md` — repository/baseline reconciliation, architecture, authentication, security contracts.
2. `v0.6-phase-2-terra.md` — broad UI/UX and ordinary feature implementation.
3. `v0.6-phase-3-sol-high.md` — integration, Cloudflare/D1 migration, hardening, final acceptance.

Do not skip a phase merely because a new account or chat is being used.

**The current Codex task must stop at every completed phase boundary. It must never begin the next phase in the same task.** Follow `.codex/PHASE_AND_CONTEXT_POLICY.md` exactly, update `.codex/CURRENT.md` to `READY FOR MANUAL MODEL SWITCH`, print the required phase-completion message, and stop so Earl can manually choose the required next model.

During Terra work, if an escalation trigger in the phase/context policy occurs, set `.codex/CURRENT.md` to `SOL ESCALATION REQUIRED`, record the unresolved decision, print the required escalation message, and stop. Do not silently use Terra for Sol-class architecture/security decisions.

## Manager and implementer roles

- ChatGPT web is the default manager/reviewer: verify remote GitHub state, define one bounded milestone, review pushed evidence, and keep repository guidance coherent.
- Codex is the default implementer: verify the local checkout, implement only the accepted milestone, run checks, update continuation records, commit, and push the intended feature branch when authorized.
- Only one agent may write to the same branch at a time.
- Agents share durable context through committed repository files and GitHub, not assumed cross-chat memory. Follow `docs/AI_COLLABORATION.md` only when collaboration mechanics need review or conflict resolution.

## One-slice execution and token discipline

- Work one issue or vertical slice at a time.
- Do not regenerate the entire application for a small change.
- Do not begin a different milestone until the current pointer and continuation records are updated.
- Preserve unknown work.
- Review the complete logical diff before handoff.
- Prefer `git diff --stat`, `git diff --name-only`, targeted `git diff -- <path>`, and narrow reads before opening many files.
- Read only directly affected source files and directly relevant tests.
- Do not read generated artifacts unless investigating an artifact-specific failure; rely on source/generator files plus deterministic verification when authoritative.
- Reuse valid expensive verification only when the relevant SHA, artifacts, configuration, and external state are unchanged; record reused evidence explicitly.
- Do not rerun expensive full suites after documentation-only or unchanged-code work merely for ceremony.

## Product and data invariants

- Preserve `legacy/HAU-USC_Logistics-Prototype.original.html` as the approved historical visual baseline. For v0.6, also follow the active accepted source-grounded visual specification; do not casually redesign unrelated areas.
- Do not hand-edit `dist/index.html`, `HAU-USC_Logistics-Prototype-Shareable.html`, or generated Apps Script HTML. Edit source/generator files and rebuild.
- Browser code calls a service adapter. Only `src/services/apps-script-adapter.js` may use `google.script.run` while the Apps Script adapter remains active.
- Apps Script writes require authorization, an idempotency key, a lock where state may race, server-side IDs, status history, and audit logging.
- Never edit or delete posted ledger entries. Use a documented reversal or adjustment.
- Never transact `VERIFY` items. Preserve legacy source sheet, row, block, exact name, quantity, and unit.
- Never write to the pre-rework backup spreadsheet.
- Drive folder configuration must fail closed. Never fall back to the script owner's My Drive root.
- UI hiding is not authorization. Keep request-only/server-bound permission contracts sanitized.

## Security and external-system boundary

- Do not commit `.clasp.json`, secrets, institutional credentials, personal student records, private contacts, supplier TINs, private Script/Drive/Sheet identifiers contrary to policy, or evidence files.
- Repository work does not authorize production promotion, migration application, access seeding, real Drive uploads/folder changes, operational Sheet writes, trigger changes, or destructive maintenance unless Earl explicitly authorizes that exact external action.
- Staging/production actions must follow `docs/LAUNCH_RUNBOOK.md` and preserve rollback/reconciliation evidence.

## Verification and handoff

- Run relevant focused tests for every code change.
- Before a code milestone handoff, run `npm run check`; run Playwright where Chromium is installed and relevant.
- Run `clasp status` and staging push/deployment commands only when the active task explicitly authorizes them and required private staging configuration exists.
- For documentation-only checkpoints that do not change code/generated artifacts, do not rerun expensive suites merely for ceremony; cite the last valid unchanged-code evidence and state that no new runtime verification was run.
- Update `PROJECT_STATUS.md`, `CHANGELOG.md`, `docs/WORK_CONTINUATION.md`, and `.codex/CURRENT.md` with verified facts before handoff.
- Commit in a small logical unit and report the exact commit SHA and remote/CI state.
- Never claim a push, test, deployment, migration, or external write without verification.