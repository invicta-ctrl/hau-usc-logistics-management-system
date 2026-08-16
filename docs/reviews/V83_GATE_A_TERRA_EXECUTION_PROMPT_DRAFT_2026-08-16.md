# V83 Gate A — Terra MAX Execution Prompt (DRAFT)

Status: DRAFT for independent GPT-5.6 Sol Web review
Prepared: 2026-08-16 (Asia/Manila)
Target execution window: Thursday (after Terra revalidates live repository state)

## Role and writer lock

You are the single canonical `TERRA_INTEGRATION_WRITER` for this task. Before any
edit, verify live state and **require writer-lock ownership**: confirm
`ACTIVE_WRITER` names you and `WRITER_LOCK: HELD`, or obtain a recorded reviewed
transfer from the current holder. If the lock cannot be established, stop and report;
do not edit.

Revalidation handshake (exact):

```text
git fetch --prune origin
git rev-parse origin/release/v0.8.3-identity-foundation   # expect 8e58f5376c6942994248b2988742e5dcd076eb90
git rev-parse origin/main                                  # re-read current value
git status --short --branch                                # clean worktree
```

Re-read `AGENTS.md`, `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`,
`.codex/CURRENT_HANDOFF.md`, `.codex/PHASE_AND_CONTEXT_POLICY.md`, and
`.codex/specs/active/v0.8.3-identity-intake-a5-accepted.md`. If the remote V83 branch
advanced beyond `8e58f53`, stop and report the delta; do not silently rebase this plan.

## Objective and scope

Implement **only Gate A — the provider-free local migration fixture for migration 0031
and the canonical identity foundation** — as one test-only slice.

IN SCOPE:

- One new unit test file `tests/unit/identity-foundation-gate-a-fixture.test.js`.
- Inline test helpers reusing the existing `node:sqlite` migration-replay pattern from
  `tests/unit/identity-foundation-migration.test.js` and, where S17 needs it, the
  `batch` adapter variant from
  `tests/unit/account-application-migration-integration.test.js`.
- Scenarios S00-S17 as specified in
  `docs/reviews/V83_IDC_GATE_A_AUDIT_PREP_2026-08-16.md` section 7.

OUT OF SCOPE (prohibited):

- Product source, worker routes, adapters, and generated artifacts.
- Any migration change; do not create 0032 and do not modify 0031.
- Any `.codex` file change as part of the Gate A implementation diff (post-verification
  continuity handling is defined under "Commit and stop").
- A production ID-D apply service or route.
- Assignment (staff_assignments) writes or semantics.
- Gate B, provider reads, Google/Sheets/Drive, D1/R2, Figma, Playground, Production,
  recovery pointers, secrets, or deployments.

## Authorized writes

AUTHORIZED IMPLEMENTATION WRITE:

```text
tests/unit/identity-foundation-gate-a-fixture.test.js
```

No product/runtime/migration write is authorized. All other paths are read-only
dependencies. Use obviously synthetic identities (`example.invalid` domains,
`SYNTHETIC` markers) and the fixture-only crypto constant
`SYNTHETIC-GATE-A-SECRET-2026-08-16-NOT-PRODUCTION`. Never read or write real data.

## Required proofs

1. **0031 local apply**: replay `migrations/*.sql` sorted into `:memory:`; assert
   `PRAGMA integrity_check` ok, `PRAGMA foreign_key_check` empty, `app_metadata`
   `operational_schema_version = '31'`, four canonical tables exist and are empty,
   and a malformed `person_id` insert throws.
2. **First synthetic canonical-row orchestration**: for S01/S03 (and the combined
   S04) perform the fixture-only synthetic write-harness pass and assert the exact
   expected canonical-person, email, and link counts.
3. **Repeated orchestration (fixture repeatability)**: rerun the same pass; assert
   zero new rows and `canonicalPersonCreateCount: 0`,
   `explicitAccountLinkCandidateCount: 0`; assert the roster re-apply path returns
   `replayed` without new entries (S17). This proves fixture repeatability only — it
   does NOT prove Production ID-D idempotency.
4. **Reset**: close the in-memory database and recreate; assert the clean schema-31
   empty state.
5. **Fail-closed cases**: S05-S16 exactly as designed, asserting both preview counts
   and database state (no writes on quarantine/preserve paths).
6. **Safety flags**: every scenario asserts `safety.dataMutation === false`,
   `providerRead === false`, `privilegeMutation === false`,
   `effectiveDatesInvented === false`, and that `staff_assignments` stays empty.

Proof boundary (record in the test descriptions and handoff):

```text
PROVEN BY GATE A

- migration 0031 can be replayed safely in an in-memory local database;
- schema constraints behave as designed;
- current repository primitives can create synthetic canonical rows;
- ID-C preview behavior can be exercised against deterministic synthetic state;
- ambiguous/error paths fail closed;
- fixture orchestration can itself be made repeatable without duplicate fixture effects;
- reset returns the disposable local environment to a known state.

NOT PROVEN BY GATE A

- Production ID-D transactional apply behavior;
- Production ID-D idempotency;
- concurrency behavior of a future apply service;
- rollback semantics of a future Production apply service;
- provider-backed canonical migration;
- authorization for a Production apply route/service.
```

## Verification (in order)

```text
EXISTING: npm.cmd run test -- tests/unit/identity-foundation-gate-a-fixture.test.js   # after the file exists
EXISTING: npm.cmd run test -- tests/unit/account-application-migration-integration.test.js tests/unit/identity-foundation-contracts.test.js tests/unit/identity-foundation-migration.test.js tests/unit/v072-migration-contract.test.js tests/unit/identity-foundation-reconciliation.test.js tests/unit/identity-foundation-worker-route-contract.test.js tests/unit/http-api-adapter.test.js tests/unit/legacy-runtime-adapter.test.js   # expect 8 files / 31 tests
EXISTING: npx eslint tests/unit/identity-foundation-gate-a-fixture.test.js
EXISTING: npx prettier --check tests/unit/identity-foundation-gate-a-fixture.test.js
EXISTING: git diff --check
```

Do not run build, e2e, Cloudflare, migration-apply, deploy, provider, or recovery
commands. A test-only fixture does not invalidate those gates, and no external state
may be touched.

## Commit and stop

1. Revalidate live repository authority and writer lock.
2. Implement only the Gate A test fixture.
3. Run the required tests and static checks (see Verification).
4. Terra reviews its complete local diff itself; confirm only authorized
   implementation paths changed.
5. Confirm no product/runtime/migration write entered the diff.
6. Commit one coherent Gate A candidate.
7. Push to the temporary task branch authorized by the live repository; report the
   exact pushed SHA.
8. Stop for GPT-5.6 Sol Web audit of that exact pushed SHA.
9. Do not start Gate B.
10. Do not integrate, merge, or promote the Gate A candidate before Sol review.
11. `.codex` continuity records are NOT part of the Gate A implementation diff.
    Terra may update canonical `.codex` continuity records only after Gate A
    verification, and only if Thursday's live repository authority explicitly
    requires that normal handoff recording. Any such continuity update must contain
    no product behavior change, record only verified Gate A facts/results, follow
    the live writer-lock/handoff policy, remain separate in purpose from the test
    implementation, and never be inferred merely from this preparation document. If
    Thursday's live authority does not require a `.codex` update, Terra must not
    create one. Continuity recording never changes the rule that Sol audits an exact
    pushed repository state.
12. Record unrun checks and external-state uncertainty honestly.

## Stop conditions

Stop on: wrong/unverified environment; any provider or production crossover; a dirty
or unknown target; any migration modification; missing reset proof; a failing test
that cannot be explained by the reviewed design; privacy/recipient uncertainty;
exact-SHA drift; or an unresolved P0/P1 finding from Sol review.

Terra reviews the complete local diff before committing. Sol performs the independent
review only after the candidate SHA is pushed and repository-accessible; Sol cannot
inspect an uncommitted worktree, local-only files, or local terminal output.
