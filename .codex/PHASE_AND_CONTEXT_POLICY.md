# Codex Phase Boundary and Context-Efficiency Policy

This policy applies to every v0.6 Codex task, regardless of account, machine, chat, or model.

## 1. Minimal context rule

Do not repeatedly reread the repository.

### Cold start for a new Codex task
Read only:

1. `AGENTS.md`
2. `.codex/CURRENT.md`
3. this policy
4. the active specification referenced by `.codex/CURRENT.md`

Then perform the required Git handshake.

Read additional files only when the active milestone actually requires them.

### Targeted retrieval after cold start
- Do not broad-scan the repository.
- Do not reread a file in the same task when it has not changed and the needed content is already in context.
- Prefer narrow reads of specific sections/line ranges instead of reopening an entire long document.
- Prefer `git status`, `git diff --stat`, `git diff --name-only`, targeted `git diff -- <path>`, and commit/CI metadata before opening many source files.
- Read only directly affected source files and their directly relevant tests.
- Do not read generated artifacts when source/generator files and deterministic verification are authoritative, unless investigating an artifact-specific failure.
- Do not reread historical continuation sections unless the current pointer identifies a historical fact that must be reconciled.
- Reuse valid verification evidence only when the relevant SHA, artifacts, configuration, and external state are unchanged; state explicitly when evidence is reused.
- Do not rerun expensive full suites after documentation-only changes or unchanged code merely for ceremony.

If the current task needs context that is missing from durable repository records, stop and record the missing context rather than compensating with a whole-repository scan.

## 2. One bounded milestone at a time

`.codex/CURRENT.md` defines the current bounded milestone.

Do not begin a different milestone until the current milestone has:

- required verification;
- complete logical diff review;
- continuation/status updates;
- a verified commit/push when authorized;
- an updated `.codex/CURRENT.md`.

## 3. Mandatory manual model-switch boundary

Codex cannot automatically route this program to another model.

Completing a phase does **not** authorize beginning the next phase in the same task.

When every acceptance criterion for the active phase is complete:

1. Finish the current phase verification.
2. Review the complete phase diff.
3. Update:
   - `.codex/CURRENT.md`
   - `PROJECT_STATUS.md`
   - `CHANGELOG.md`
   - `docs/WORK_CONTINUATION.md`
4. Commit and push the verified phase handoff when authorized.
5. Advance `.codex/CURRENT.md` to the next phase and required model.
6. Set the pointer status to `READY FOR MANUAL MODEL SWITCH`.
7. Record the exact ending SHA, verification evidence, rollback point, next model, next specification, and first next-phase action.
8. Print the required phase-boundary message below.
9. **STOP THE CURRENT CODEX TASK.**

Do not:

- implement any next-phase code;
- open a new next-phase work slice;
- perform exploratory implementation for the next phase;
- continue because context, time, or credits remain;
- substitute the current model for the next required model.

### Required Phase 1 completion message

```text
PHASE 1 COMPLETE — STOPPING FOR MANUAL MODEL SWITCH.
NEXT MODEL: GPT-5.6 Terra
NEXT PHASE: Phase 2
NEXT SPEC: .codex/specs/v0.6-phase-2-terra.md
START A NEW CODEX TASK. DO NOT CONTINUE THIS TASK.
```

### Required Phase 2 completion message

```text
PHASE 2 COMPLETE — STOPPING FOR MANUAL MODEL SWITCH.
NEXT MODEL: GPT-5.6 Sol — High
NEXT PHASE: Phase 3
NEXT SPEC: .codex/specs/v0.6-phase-3-sol-high.md
START A NEW CODEX TASK. DO NOT CONTINUE THIS TASK.
```

### Required Phase 3 completion message

```text
PHASE 3 COMPLETE — V0.6 REPOSITORY-SIDE PROGRAM COMPLETE.
PRODUCTION PROMOTION REMAINS SEPARATELY GATED.
STOPPING CURRENT CODEX TASK.
```

Phase 3 must stop before production promotion or irreversible institutional-data actions unless Earl separately and explicitly authorizes that exact action.

## 4. Terra escalation boundary

During Phase 2, Terra must stop the affected slice and request Sol High when the work would materially change:

- authentication/session architecture;
- authorization/capability semantics;
- ledger or transactional invariants;
- atomic/idempotent guarantees;
- database/migration architecture;
- unresolved security boundaries.

When this occurs, do not silently continue with Terra.

Update `.codex/CURRENT.md` with status `SOL ESCALATION REQUIRED`, record the exact unresolved decision and affected files, then print:

```text
TERRA ESCALATION REQUIRED — STOPPING FOR MANUAL MODEL SWITCH.
NEXT MODEL: GPT-5.6 Sol — High
PHASE REMAINS: Phase 2
DO NOT CONTINUE THIS TASK.
```

After Sol resolves the bounded escalation and records the accepted decision, the pointer may return to Terra for the remaining Phase 2 work.

## 5. Phase transition state values

Use these exact pointer states when applicable:

- `ACTIVE`
- `READ / VERIFY / RECONCILE`
- `SOL ESCALATION REQUIRED`
- `READY FOR MANUAL MODEL SWITCH`
- `PROGRAM COMPLETE — PRODUCTION STILL GATED`

The phase/model transition is controlled by repository state, not by chat continuity.