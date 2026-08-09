# Task Routing

Before broad retrieval or execution, record this envelope in
`.codex/CURRENT_TASK.md`:

```text
INTENT: <primary intent>
SECONDARY INTENTS: <zero or more>
MODE: <answer | plan | execute | review | monitor>
TARGET: <repository, system, file, artifact, or topic>
SKILLS: <matched skills or none>
AUTHORITY: <governing sources>
RISK: <low | medium | high | critical>
DELIVERABLE: <required completed state>
VERIFICATION: <evidence required>
STOP CONDITIONS: <conditions that block or end work>
```

## Primary intents

Use one governing intent: `QUESTION`, `RESEARCH`, `WRITING`,
`DOCUMENT_OR_ARTIFACT`, `SOFTWARE_FEATURE`, `BUG_FIX`, `REFACTOR`, `TESTING`,
`CODE_REVIEW`, `REPOSITORY_MAINTENANCE`, `DEPLOYMENT`, `MIGRATION`,
`ARCHITECTURE`, `INCIDENT`, `OWNER_DECISION`, `COMMUNICATION`, or
`SCHEDULING_OR_MONITORING`.

Choose the intent governing the highest-risk or final requested action. Skills
refine execution but never override repository authority, accepted
specifications, security, privacy, domain invariants, or owner instructions.

## Orchestration envelope

For every governed task, the task/handoff chain also records these root-policy
fields without changing the product objective:

```text
REQUIRED_MODEL: GPT-5.6 SOL
ORCHESTRATOR_MODEL: GPT-5.6 SOL
ORCHESTRATOR_WRITES: FORBIDDEN
WRITER_MODEL: TERRA MAX
READER_MODEL: LUNA MAX
MAX_SOL_SUBAGENTS: 0
MAX_TERRA_SUBAGENTS: 16
MAX_LUNA_SUBAGENTS: 16
DELEGATION_DEPTH: 1
SUBAGENT_SPAWNER: SOL_ONLY
MODEL_SUBSTITUTION: FORBIDDEN_UNLESS_EARL_EXPLICITLY_AMENDS_TASK
```

Sol is the sole read-only orchestrator and only child-task spawner. A write task
names one `TERRA_INTEGRATION_WRITER` and its singular `ACTIVE_WRITER` lock.
Additional Terra work requires isolated non-overlapping scopes; Luna is
read-only. Record every Terra/Luna child in the task-local delegation ledger;
never record a Sol child.

## Risk routing

- **Low:** answers, small documentation corrections, deterministic formatting.
- **Medium:** bounded repository implementation with reversible local changes.
- **High:** authorization, privacy, concurrency, idempotency, migrations,
  destructive cleanup planning, staging actions, or architecture decisions.
- **Critical:** production promotion, rollback, recovery, or potentially
  irreversible institutional-data changes.

High and critical work requires explicit target, authority, rollback, negative
tests, and direct external evidence. Production and destructive operations
remain owner-gated.
