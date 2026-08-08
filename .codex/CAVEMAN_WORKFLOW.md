# Caveman Light Workflow

The owner may use short instructions. Codex expands them into a safe bounded
unit without asking the owner to restate repository details already recorded in
the authoritative checkpoint.

## Command routing

| Owner instruction                  | Required behavior                                                                                                                  |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `Continue`                         | Read the compact checkpoint, verify Git and authority, and resume the exact next accepted action without repeating completed work. |
| `Continue the next accepted Slice` | Confirm the previous checkpoint is accepted, clean, pushed, and CI-green; then scope-lock only the next Slice.                     |
| `Fix the current blocker`          | Preserve evidence, reproduce when practical, repair the confirmed cause, add focused regression coverage, and re-verify.           |
| `Clean the repository safely`      | Inventory first, classify every candidate, preserve unique or unknown work, and perform only accepted cleanup.                     |
| `Prepare the staging acceptance`   | Verify the exact target, reviewed artifact, backups, rollback, authority, and acceptance matrix before any external write.         |
| `Prepare the Cloudflare spike`     | Isolate the proof from V1, threat-model the API boundary, produce an ADR, and avoid production migration.                          |
| `Give me the decision`             | Return the smallest missing owner decision, recommended default, consequences, and exact work that will resume.                    |

## Execution loop

1. Preserve the owner's exact instruction.
2. Route it through `.codex/TASK_ROUTING.md` and scan matching skills.
3. Read `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`,
   `.codex/CURRENT_HANDOFF.md`, and the accepted specification for the active
   unit. Read `.plans/current-slice.md` or the continuation block only when the
   active task points to them.
4. Complete the Git and external-state preconditions proportionate to risk.
5. Proceed automatically only when scope, authority, writer ownership, and
   rollback are clear.
6. Complete one bounded unit; test, review, checkpoint, commit, push, and verify
   only as authorized.
7. Stop for a genuine owner decision, unsafe state, missing specification or
   access, failed mandatory gate, or two failed targeted repair rounds.

Short input changes the interaction cost, not the engineering standard.
