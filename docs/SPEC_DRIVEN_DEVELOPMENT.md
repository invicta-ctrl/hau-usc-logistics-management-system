# Spec-Driven Development

## Purpose

This project uses Spec-Driven Development (SDD): decisions are written and accepted before implementation, implementation is bounded by the accepted specification, and completion is proven against explicit acceptance criteria.

The repository already used many SDD practices through manager task packets, vertical slices, acceptance criteria, tests, and handoff records. This document formalizes the missing durable specification layer and traceability gate.

## Authority order

When instructions conflict, use this order:

1. Earl's current explicit instruction.
2. `AGENTS.md` and the repository's active governing rules and frozen contracts.
3. The accepted active specification under `specs/`.
4. Architecture, domain, security, launch, and operational documentation.
5. Issues, pull-request descriptions, chat history, and local notes.

The connected `gpt-context-vault` routes assistants to the correct project and preserves account-wide preferences. This repository remains authoritative for this project's requirements, code, decisions, status, and tests.

## Changes that require a specification

Create a specification before work begins for any non-trivial:

- feature or user-visible behavior change;
- defect repair that changes behavior or invariants;
- data model, Sheet schema, API, adapter, or integration change;
- authentication, authorization, privacy, evidence, or security change;
- deployment, migration, backup, recovery, or external-write change;
- architecture, build, test, or governance change;
- removal or replacement of existing behavior.

A typo, formatting-only correction, or deterministic regeneration from already accepted source changes may use an inline spec in the issue or pull request. Emergency security work may begin before acceptance only when delay would increase risk; the same pull request must add a retrospective specification and evidence.

## Specification lifecycle

Use these statuses:

- `DRAFT` — being written; implementation is prohibited.
- `IN_REVIEW` — complete enough for review; implementation is prohibited.
- `ACCEPTED` — approved by Earl or an explicitly delegated manager; implementation may begin.
- `IMPLEMENTING` — accepted work is in progress.
- `VERIFYING` — implementation is complete and evidence is being checked.
- `VERIFIED` — every acceptance criterion has verified evidence and the handoff is complete.
- `CANCELLED` — intentionally stopped; record why.
- `SUPERSEDED` — replaced by another identified specification.

Only `ACCEPTED` and `IMPLEMENTING` specifications authorize implementation. A spec cannot be marked `VERIFIED` while any acceptance criterion lacks evidence or any required check is unrun without an explicitly accepted exception.

## Required specification content

Each spec must include:

- stable spec ID, title, status, owner, created date, and last-updated date;
- authority and source references;
- problem statement and intended outcome;
- scope and non-goals;
- assumptions and constraints;
- numbered requirements such as `REQ-001`;
- numbered acceptance criteria such as `AC-001`;
- implementation plan and bounded task list;
- file and system boundaries;
- external-write permissions;
- security, privacy, and data considerations;
- tests and verification commands;
- rollback, recovery, or reversibility expectations;
- risks, unresolved questions, and stop conditions;
- amendment and decision log;
- completion evidence mapped to the acceptance criteria.

Use `specs/_templates/SPEC_TEMPLATE.md`.

## Workflow

### 1. Discover and ground

Read the Context Vault entrypoint only as needed for routing, then read the repository sources required by `AGENTS.md`. Verify the current branch, commit, pull request, status, and active constraints.

### 2. Specify

Create one bounded spec for one issue or vertical slice. Requirements describe what must be true; acceptance criteria describe observable proof. Non-goals prevent accidental expansion.

### 3. Review and accept

Review the spec before code changes. Resolve ambiguity, security boundaries, external-write permissions, tests, and stop conditions. Record who accepted it and when.

### 4. Plan and task

Break the accepted requirements into small tasks. Identify likely files, ownership, dependencies, and verification. The task list may become more detailed without changing scope; material scope changes require an amendment.

### 5. Implement

Implement only the accepted requirements. Preserve repository invariants and do not silently add adjacent improvements. Keep the spec status and task checklist current.

### 6. Verify

Map each acceptance criterion to concrete evidence: test output, inspected behavior, documentation, CI, or an explicitly recorded manual check. Record unrun checks honestly.

### 7. Close and hand off

Mark the spec `VERIFIED` only when acceptance evidence is complete. Update the changelog, project status, continuation record, and pull-request handoff as required by `AGENTS.md`.

## Amendment rule

A material change includes any new requirement, removed requirement, weakened acceptance criterion, expanded file/system boundary, changed security behavior, changed external-write permission, or changed deployment/data effect.

When one occurs:

1. stop implementation;
2. add an amendment to the spec decision log;
3. update affected requirements, acceptance criteria, risks, and tests;
4. return the spec to `IN_REVIEW`;
5. obtain renewed approval before continuing.

Do not disguise a scope change as a task-list edit.

## Traceability

Every implementation pull request must identify:

- the spec path and status;
- requirements implemented;
- acceptance criteria proven;
- tests and evidence;
- deviations or amendments;
- external actions performed and not performed.

Commit messages and issue titles do not need every ID, but the pull request and handoff must provide enough mapping for a reviewer to determine why each changed file exists.

## Definition of done

A spec-driven change is done only when:

- the accepted requirements are implemented and no non-goal was added;
- every acceptance criterion has evidence;
- required automated and manual checks are recorded;
- security, privacy, data, and external-write boundaries were preserved;
- documentation and continuation records are current;
- the spec is `VERIFIED`, or the remaining blocker is explicitly documented and the spec remains open.
