---
spec_id: "0001"
title: "Adopt Spec-Driven Development"
status: ACCEPTED
owner: "Earl Adriano"
created: 2026-07-13
last_updated: 2026-07-13
accepted_by: "Earl Adriano"
accepted_at: 2026-07-13
supersedes: null
superseded_by: null
---

# 0001 — Adopt Spec-Driven Development

## 1. Authority and source references

- Current instruction: implement Spec-Driven Development for this project and future projects, referencing the Context Vault, project repository, `AGENTS.md`, and the existing ruleset.
- Project authority: `AGENTS.md`, `docs/AI_COLLABORATION.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, architecture, domain, security, and launch documentation.
- Account-wide routing authority: `invicta-ctrl/gpt-context-vault`, beginning with `START_HERE.md` and `CONTEXT_INDEX.md`.
- Starting repository state: draft PR #3 branch `feat/v1-one-shot-demo-and-deployment` at `c1ec84a95008cf512b7475233547e25e7b25374f`.

## 2. Problem statement

The project already uses several SDD-compatible practices: bounded vertical slices, manager task packets, explicit requirements, non-goals, acceptance criteria, tests, one-writer coordination, and detailed handoffs. However, those decisions are not yet required to live in a durable, versioned specification with a formal acceptance gate and requirement-to-evidence traceability.

Without a formal specification layer, future work can still drift from chat instructions, silently expand scope, weaken acceptance criteria, or become difficult to reconstruct across ChatGPT, Codex, worktrees, and future maintainers.

## 3. Intended outcome

The project will require an accepted repository specification before non-trivial implementation. ChatGPT, Codex, and maintainers will use the Context Vault for routing, the project repository for authority, `AGENTS.md` for operating rules, and the accepted spec for the bounded change. Completion will require evidence mapped to numbered acceptance criteria.

## 4. Scope

- Add a formal SDD lifecycle and rules document.
- Add a `specs/` registry and reusable project spec template.
- Update `AGENTS.md` to enforce the SDD gate.
- Update AI collaboration instructions so task and handoff packets identify the active spec and traceability IDs.
- Preserve all runtime behavior, generated artifacts, live Google resources, deployments, and protected pull requests.

## 5. Non-goals

- No frontend, Apps Script, Sheet schema, Drive, API, workflow, or test behavior changes.
- No live Google Workspace action.
- No deployment, migration, merge, tag, release, or protected PR #2 modification.
- No replacement of the existing one-writer protocol, task handshake, security rules, or domain invariants.
- No adoption of a heavy external SDD framework or vendor-specific tooling.

## 6. Assumptions and constraints

- The current explicit instruction is sufficient approval for this governance-only bootstrap specification.
- The SDD process must remain lightweight enough for a small student-led project while still being auditable.
- The project repository remains authoritative for project facts; the Context Vault remains a routing and account-wide preference layer.
- This work must remain isolated from the active V1 deployment-readiness branch through a separate documentation branch and draft pull request.

## 7. Requirements

### REQ-001 — Durable specification layer

The repository must contain a documented SDD lifecycle, specification registry, and reusable template for non-trivial changes.

### REQ-002 — Mandatory acceptance gate

`AGENTS.md` must prohibit non-trivial implementation before the active specification is accepted by Earl or an explicitly delegated manager.

### REQ-003 — Context and authority routing

The instructions must require assistants to consult the Context Vault entrypoint for routing, then follow the project repository, `AGENTS.md`, governing rules, and accepted active spec rather than relying on chat history alone.

### REQ-004 — Traceability

Requirements and acceptance criteria must use stable IDs, and implementation handoffs must map evidence to those IDs.

### REQ-005 — Amendment control

Material scope, security, external-write, requirement, or acceptance-criterion changes must stop implementation and return the specification to review before work continues.

### REQ-006 — Preserve project behavior and safety boundaries

The adoption must change documentation and governance only, with no runtime or live-system mutation.

## 8. Acceptance criteria

### AC-001

The branch contains `docs/SPEC_DRIVEN_DEVELOPMENT.md`, `specs/README.md`, and `specs/_templates/SPEC_TEMPLATE.md`, and together they define the lifecycle, required fields, status transitions, amendment rule, verification, and definition of done.

### AC-002

`AGENTS.md` explicitly requires the Context Vault routing step, repository rules, an accepted spec before non-trivial implementation, and evidence before verification.

### AC-003

`docs/AI_COLLABORATION.md` requires manager task packets and implementer handoffs to include the active spec path/status plus requirement and acceptance-criteria traceability.

### AC-004

The changed-file set contains documentation/specification files only and performs no runtime, generated-artifact, deployment, Sheet, Drive, or Apps Script mutation.

### AC-005

A future contributor can copy the template, assign requirement and acceptance IDs, record acceptance, implement a bounded change, and record completion evidence without needing chat history.

## 9. External-write permissions

- Repository documentation branch and draft pull request: allowed.
- Context Vault documentation branch and draft pull request: allowed under the user's current explicit request.
- Google Workspace writes: prohibited.
- Deployment, migration, merge, tag, release, or destructive actions: prohibited.
- Protected PR #2 modification: prohibited.

## 10. Security, privacy, and data considerations

- No secrets, credentials, personal student records, private contacts, supplier TINs, evidence files, live resource identifiers, or raw chat dumps may be added.
- The spec reinforces existing authorization, privacy, append-only, audit, and fail-closed rules rather than changing them.
- The Context Vault remains a minimum-retrieval routing layer and must not cause unrelated personal context to be loaded.

## 11. Implementation plan

1. Add the SDD lifecycle document, registry, and template.
2. Update `AGENTS.md` with the universal instruction and mandatory spec gate.
3. Update AI collaboration packets with spec and traceability fields.
4. Verify the diff is documentation-only and open a draft pull request without merging.
5. Add the reusable account-wide SDD protocol and instruction block to the Context Vault in a separate branch/PR.

## 12. Task checklist

- [x] Add project SDD lifecycle documentation.
- [x] Add specification registry conventions.
- [x] Add reusable project specification template.
- [x] Update `AGENTS.md` with the SDD gate and authority routing.
- [ ] Update `docs/AI_COLLABORATION.md` with spec-aware task and handoff packets.
- [ ] Verify the final changed-file set and draft pull request.
- [ ] Record completion evidence and update status to `VERIFIED` after review.

## 13. Verification plan

| Acceptance criterion | Verification method | Required result |
|---|---|---|
| `AC-001` | Inspect committed files | Required lifecycle, registry, and template content exists |
| `AC-002` | Inspect `AGENTS.md` | Acceptance gate and authority routing are explicit |
| `AC-003` | Inspect collaboration packet templates | Spec path/status and traceability IDs are required |
| `AC-004` | Inspect PR changed files | Documentation/specification files only; no external action |
| `AC-005` | Template walkthrough | Template supports end-to-end bounded SDD without chat history |

Repository code checks are not required for a documentation-only branch unless CI or governance validation reports a relevant failure. Markdown/link/governance checks should run automatically in the pull request where configured.

## 14. Rollback, recovery, and reversibility

The work is isolated on a separate branch. Closing the draft pull request or reverting its documentation commits fully removes the proposed governance change. No data or external system requires rollback.

## 15. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Process becomes too heavy | Contributors bypass it | Use one concise spec file per bounded slice and allow narrow inline specs for trivial changes |
| Spec becomes stale | Implementation drifts | Require amendments, status updates, and acceptance-evidence mapping |
| Context Vault is mistaken for project authority | Conflicting facts | State that the vault routes; the project repo remains authoritative |
| SDD conflicts with urgent security work | Delayed repair | Allow a narrow emergency exception with a retrospective spec in the same PR |

## 16. Stop conditions

Stop and report if:

- the branch no longer starts from the verified PR #3 head;
- the work would modify runtime code, generated artifacts, live resources, or protected PR #2;
- the instruction hierarchy conflicts materially with current project rules;
- a secret, private identifier, or unsupported factual claim would be committed;
- merge, deployment, or other external actions become necessary without explicit approval.

## 17. Open questions

None blocking this governance-only bootstrap.

## 18. Decision and amendment log

| ID | Date | Type | Decision/change | Approved by | Affected IDs |
|---|---|---|---|---|---|
| `DEC-001` | 2026-07-13 | Decision | Use a lightweight repository-native SDD process with one `SPEC.md` per bounded change | Earl Adriano | All |
| `DEC-002` | 2026-07-13 | Decision | Keep the Context Vault as routing/account-wide guidance and the project repo as project authority | Earl Adriano | `REQ-003` |
| `DEC-003` | 2026-07-13 | Decision | Isolate adoption in separate documentation branches and draft PRs; do not merge automatically | Earl Adriano | `REQ-006` |

## 19. Completion evidence

| Acceptance criterion | Evidence | Result |
|---|---|---|
| `AC-001` | Pending final branch inspection | Pending |
| `AC-002` | Pending final branch inspection | Pending |
| `AC-003` | Pending collaboration-doc update | Pending |
| `AC-004` | Pending PR changed-file inspection | Pending |
| `AC-005` | Pending template walkthrough | Pending |

## 20. Handoff

Complete after the draft pull request is opened and inspected.
