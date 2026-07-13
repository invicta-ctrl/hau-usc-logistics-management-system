# Project routing policy

## Verified route catalog

| Logical tier | Verified model | Reasoning | Typical work |
|---|---|---:|---|
| `fast` | `gpt-5.6-terra` | `low` | Precise documentation or one-file reversible change |
| `implementation` | `gpt-5.6-luna` | `medium` | Known architecture, bounded multi-file change, focused tests |
| `exploration` | `gpt-5.6-terra` | `medium` | Unfamiliar modules, tracing, bounded debugging |
| `judgment` | `gpt-5.6-sol` | `high` | Architecture, permissions, schemas, ledger/data-integrity decisions |
| `deep_review` | `gpt-5.6-sol` | `xhigh` | Security-sensitive, irreversible, or release-blocking review |

These aliases were observed in the local Codex model catalog on 2026-07-13.
The launcher rejects unknown models and reasoning values. The account-specific
`luna`, `terra`, and `sol` aliases are not interchangeable with public model
names unless the installed catalog verifies both.

## Selection rules

- Use the least expensive reliable route.
- Use `fast` for precise, reversible work with direct verification.
- Use `implementation` when the architecture is known and the task is
  sequential and objectively testable.
- Use `exploration` when repository tracing is the main difficulty.
- Use `judgment` when the difficult part is an architecture, schema,
  authorization, security, inventory, ledger, migration, or data-integrity
  decision.
- Use `deep_review` only for high-risk work or evidence-based escalation.

Every decision records why a cheaper route is insufficient and why a more
expensive route is unnecessary.

## Safety rules

- Only a valid refinement with `safe_to_route = true` reaches routing.
- A route with unresolved questions, approval requirements, or a conflict is
  not executable without an explicit approval path.
- The launcher never executes arbitrary commands emitted by a model.
- Verification profiles are fixed in `verification-profiles.json` and mapped to
  hard-coded launcher commands.
- Subagents are off by default. Use them only for three or more independent
  workstreams with isolated ownership and an integration step.
- Parallel write work requires isolated worktrees. Overlapping edits stay
  sequential.
- Escalation is one level at a time and must cite evidence.

