# HAU-USC Logistics Management System

HAU-USC Logistics is an operational logistics application with a protected production release at v0.7.2. The current repository task is the final v0.8.0 Inventory Truth and Ledger Lock candidate; production must remain unchanged until Earl authorizes the exact candidate SHA.

## Start here

Use the durable continuity chain, in order:

1. AGENTS.md
2. .codex/CURRENT.md
3. .codex/CURRENT_TASK.md
4. .codex/CURRENT_HANDOFF.md
5. .codex/PHASE_AND_CONTEXT_POLICY.md
6. The accepted specification named by the current pointer

Then perform the task's Git handshake. Do not treat this README, old task records, chat, or local memory as an authority override.

## Current state

- Canonical released application: v0.7.2, release SHA 84eacfcdb47a3985fed48e3ba14bb413946d4410.
- Active repository branch: `release/v0.8.0-inventory-truth-ledger-lock`.
- Active accepted scope: final reconciliation, Inventory server/domain contract freeze,
  recovery proof, exact-candidate verification, isolated-staging acceptance, and a draft
  protected PR; see `.codex/CURRENT.md` for the exact remaining action.
- Production runtime, data, bindings, routes, and the immutable v0.7.2 tag/release remain
  outside this candidate implementation scope.

## Local commands

npm run handoff:verify
npm run check:governance
npm run test -- tests/unit/codex-governance.test.js tests/unit/handoff-verify.test.js
npm run build
npm run verify:dist

Use only the commands authorized by the active task. Staging and production commands require their private configuration and separate gates; never place those values in the repository.

## Repository map

- .codex/ — active pointer, task, handoff, policies, accepted specifications, and historical records.
- .plans/ — compact active slice and program planning.
- docs/ — operator guidance, continuity, launch/recovery references, and historical material.
- src/, worker/, apps-script/ — application and integration source.
- scripts/, tools/, tests/ — deterministic checks and validation.

## Safety boundaries

The application preserves append-only ledgers, audit/history/evidence records, migrations, backups, recovery proof, protected identities, and the legacy visual baseline. Generated artifacts are produced through their documented pipelines; do not hand-edit them. UI hiding is never authorization, and a staging environment must never inherit production-writable bindings or recipients.
