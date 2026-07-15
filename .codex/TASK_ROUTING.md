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
