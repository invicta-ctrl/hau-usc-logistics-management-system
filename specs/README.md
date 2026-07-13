# Specifications

This directory contains the durable specifications that authorize non-trivial project changes.

## Structure

```text
specs/
├── README.md
├── _templates/
│   └── SPEC_TEMPLATE.md
└── <four-digit-id>-<short-slug>/
    └── SPEC.md
```

Examples:

- `specs/0001-adopt-spec-driven-development/SPEC.md`
- `specs/0002-request-acceptance-vertical-slice/SPEC.md`

Use one folder for one bounded issue or vertical slice. Do not combine unrelated features, refactors, migrations, or deployment actions in one specification.

## Required workflow

1. Copy `specs/_templates/SPEC_TEMPLATE.md` into a new numbered folder.
2. Complete the context, scope, non-goals, requirements, acceptance criteria, risks, verification, external-write permissions, and stop conditions.
3. Set the status to `IN_REVIEW` when it is ready for approval.
4. Record Earl's approval or explicitly delegated manager approval and set the status to `ACCEPTED`.
5. Implement only the accepted requirements.
6. Record material amendments and obtain renewed approval before continuing.
7. Map verification evidence to every acceptance criterion.
8. Mark the spec `VERIFIED` only after the required evidence and handoff records are complete.

## Statuses

`DRAFT` → `IN_REVIEW` → `ACCEPTED` → `IMPLEMENTING` → `VERIFYING` → `VERIFIED`

Terminal alternatives are `CANCELLED` and `SUPERSEDED`.

## Naming and IDs

- Folder IDs are four digits and never reused.
- Requirement IDs use `REQ-001`, `REQ-002`, and so on within the spec.
- Acceptance criteria use `AC-001`, `AC-002`, and so on within the spec.
- Amendments use `AMD-001`, `AMD-002`, and so on.
- Decisions use `DEC-001`, `DEC-002`, and so on.

## Source-of-truth rules

- `AGENTS.md` and repository rules govern how work is performed.
- The accepted spec governs the bounded change.
- Architecture, domain, security, launch, and operations documents supply constraints.
- Chat history may explain intent but does not replace a committed accepted specification.
- An accepted specification is changed only through a logged amendment.

## Review rule

A pull request that implements a non-trivial change must link its spec and state which requirement and acceptance-criteria IDs it satisfies. Reviewers should reject implementation that has no accepted spec, exceeds scope, weakens acceptance criteria, or lacks evidence.
