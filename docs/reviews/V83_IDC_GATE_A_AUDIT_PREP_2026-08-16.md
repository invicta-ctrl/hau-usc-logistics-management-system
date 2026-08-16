# V83 Gate A Audit Preparation — Master Evidence Document

Prepared: 2026-08-16 (Asia/Manila)
Preparer: DeepSeek V4 Pro, HIGH reasoning, documentation/evidence only
Task: Read-only preparation of the V83 Gate A provider-free local migration fixture

## 1. Executive verdict

The reviewed V83 ID-C reconciliation preview remains the current branch tip and was
re-verified this turn. The preparation verdict is unchanged:

- ID-C verdict: `PASS_WITH_NONBLOCKING_FINDINGS`
- Next gate: `A — PROVIDER-FREE LOCAL MIGRATION FIXTURE`
- Gate A is implementable as a **test-only** slice: one new unit test file with inline
  helpers reusing the repository's existing `node:sqlite` migration-replay pattern.
- No product source change, no new migration, no modification of migration `0031`,
  no provider access, and no production action are required or proposed for Gate A.
- The production ID-D apply service (turning preview counts into transactional
  canonical writes) is **NOT_YET_AUTHORIZED** and is explicitly excluded from Gate A.

## 2. Exact reviewed baseline

```text
REMOTE BRANCH:  origin/release/v0.8.3-identity-foundation
REMOTE HEAD:    8e58f5376c6942994248b2988742e5dcd076eb90
                ("feat: add canonical identity reconciliation preview")
TREE:           9737ad3c6e8f1a6f0d41dda9efec31040d1c6a7e
origin/main:    7d826f2683fbca8058ff08e8ae40acc1e095c076 ("docs: close v0.8.2 release")
MERGE BASE:     7d826f2683fbca8058ff08e8ae40acc1e095c076 (V83 branches directly off current main)
COMMITS AFTER REVIEW HEAD: 0 (baseline still current as of 2026-08-16)
ACCEPTED SPEC:  .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md
                (Earl V1R7-A6 Final Autonomous Completion Amendment, 2026-08-14)
CURRENT SLICE:  V83 S07 — ID-C read-only canonical identity reconciliation preview
LATEST MIGRATION (branch): 0031_canonical_identity_foundation.sql (additive-empty)
PRODUCTION:     v0.8.2 @ c316e047c845fa182e82156c95945c4a5e5de2ff; schema 30; migration 0030
ACTIVE WRITER:  TERRA_MAX:/root/v081_s09_blocker_closeout
WRITER LOCK:    HELD (heartbeat 2026-08-14T02:03:11+08:00; not re-verified live this turn)
```

S07 delta (`git diff 8e58f53^ 8e58f53`): 17 files, 633 insertions, 23 deletions.
Changed product files: `src/server/identity-foundation/reconciliation.js` (new),
`src/server/d1/identity-foundation-repository.js`, `src/worker/index.js`,
`src/services/http-api-adapter.js`, `src/services/launch-service-contract.js`,
`src/services/legacy-runtime-adapter.js`, `src/services/rest-service.js`.
Changed tests: `tests/unit/identity-foundation-reconciliation.test.js` (new),
`tests/unit/identity-foundation-worker-route-contract.test.js` (new),
`tests/unit/identity-foundation-migration.test.js`, `tests/unit/http-api-adapter.test.js`,
`tests/unit/legacy-runtime-adapter.test.js`. The two generated HTML artifacts and the
three `.codex` current records were also updated by S07.

## 3. Authority

Read in order and relied upon for this preparation:

1. `AGENTS.md` — canonical continuity chain, Sol/Terra/Luna model policy, singular
   writer lock, no production promotion without Earl GO, no model substitution.
2. `.codex/CURRENT.md` / `.codex/CURRENT_TASK.md` / `.codex/CURRENT_HANDOFF.md`
   (V83 branch) — V83 S07 state and `NEXT_EXACT_ACTION` naming the bounded review
   and the provider-free fixture / read-only probe gates.
3. `.codex/PHASE_AND_CONTEXT_POLICY.md` — bounded work, writer lock transfer,
   risk-based routing, stop conditions.
4. `.codex/specs/active/v0.8.3-identity-intake-a5-accepted.md` — Earl V1R7-A6
   identity decision table (the six rules in section "A6 owner-accepted identity
   decision table") and the accepted ID-B..ID-H envelope.
5. `.codex/releases/v0.8.3/V0_8_3_EXECUTION_PACKET.md` — A6 operational rules and
   "no fabricated external/business truth" boundary.
6. `migrations/0031_canonical_identity_foundation.sql` and the directly coupled
   identity source/tests listed in section 4 and section 5.

The controlling amendment (Earl V1R7-A6, 2026-08-14) is incorporated in the accepted
specification file; no separate A6 text file exists inside Git.

## 4. S07 implementation map

Entry point: `POST /api/owner/identity-foundation/reconciliation-preview`
(`src/worker/index.js`). Authorization is double-gated: route requires
`CAPABILITIES.SYSTEM_ADMIN` with `{ mutation: false }`, then the service re-asserts
`actor.roleId === ROLES.SYSTEM_OWNER`. There is deliberately **no apply route**.

| FILE                                             | SYMBOL                                                    | INPUT                                | OUTPUT                                                  | INVARIANT                                                | FAILURE BEHAVIOR                                                        | TEST COVERAGE                                |
| ------------------------------------------------ | --------------------------------------------------------- | ------------------------------------ | ------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------- | -------------------------------------------- |
| src/server/identity-foundation/reconciliation.js | `createIdentityFoundationReconciliationService().preview` | owner actor; D1 repos; roster crypto | `{status, source, candidates, safety, planFingerprint}` | read-only; fail-closed; redacted counts only             | 403 non-owner; `BLOCKED_*` statuses; no throws on bad rows (quarantine) | `identity-foundation-reconciliation.test.js` |
| same                                             | `safeSource`                                              | applied run + entry counts           | counts + `projectionDiscrepancy`                        | discrepancy must be 0 to proceed                         | `BLOCKED_SOURCE_PROJECTION_MISMATCH` before any decrypt                 | same                                         |
| same                                             | `activeVerifiedCanonicalMatches`                          | canonical email rows                 | ACTIVE+VERIFIED subset                                  | at most one active-verified row per fingerprint (schema) | ambiguous/non-active matches quarantine                                 | same                                         |
| same                                             | `eligibleAccountCandidates`                               | account rows                         | ACTIVE/STARTER + verified-at subset                     | verified email required                                  | candidate excluded (no false link)                                      | same (partial)                               |
| src/server/d1/identity-foundation-repository.js  | `listCanonicalEmailMatches`                               | fingerprint                          | id/personId/state/verificationState                     | no PII beyond opaque fields                              | -                                                                       | migration test                               |
| same                                             | `listAccountsByVerifiedEmailFingerprint`                  | fingerprint                          | id/status/profileEmailVerifiedAt                        | opaque fields only                                       | -                                                                       | migration test                               |
| same                                             | `getActiveAccountStaffLink`                               | accountId                            | ACTIVE link row                                         | one ACTIVE link per account (schema)                     | -                                                                       | migration test                               |
| src/server/identity-foundation/contracts.js      | `normalizeEmailForMatching`                               | email                                | trim + lowercase                                        | matches crypto identityKey normalization                 | -                                                                       | contracts test                               |
| same                                             | `createCanonicalPersonId`                                 | uuid                                 | `PER-<UUID>`                                            | opaque, immutable, format-checked                        | throws on non-UUID                                                      | contracts test                               |
| src/server/identity-roster/crypto.js             | `identityKey`                                             | normalized email                     | `IDN-<HMAC-SHA256>`                                     | stable given the same secret                             | throws if secret < 32 chars                                             | roster tests + reconciliation tests          |

ID-C invariant walkthrough (from `reconciliation.js`):

- Only the latest `APPLIED` roster run is considered; no applied run means
  `BLOCKED_NO_APPLIED_PROJECTION`.
- `source.projectionDiscrepancy = max(|accepted - entries|, |accepted - matching|, |entries - matching|)`.
  Any non-zero value blocks **before** profile decryption.
- Each matching entry is decrypted; a decrypt failure, empty email, or a recomputed
  `identityKey` that differs from the stored key increments `quarantineCount`.
- Inactive or non-`VERIFIED` profiles increment `preservedInactiveOrUnverifiedCount`
  and are never candidates.
- Canonical matching uses only the normalized-email fingerprint; a single
  ACTIVE+VERIFIED canonical row selects its person, otherwise the row quarantines.
- Account matching uses only `verified_email_fingerprint` equality; more than one
  eligible account quarantines; an existing ACTIVE link to a different person
  quarantines; no link yields `explicitAccountLinkCandidateCount`.
- Output contains only counts, booleans, and a `SHA256` plan fingerprint. No email,
  identity key, name, or decrypted value is returned.
- `safety` is always `{dataMutation:false, providerRead:false, privilegeMutation:false,
assignmentMutation:false, effectiveDatesInvented:false}`. The service performs no
  INSERT/UPDATE/DELETE.

## 5. Migration 0031 schema map

`migrations/0031_canonical_identity_foundation.sql` is additive-empty: it creates four
STRICT tables, indexes, one immutability trigger, and advances `app_metadata`
`operational_schema_version` to `31`. It contains no `DROP`/`DELETE` and no seed rows.
Production remains schema 30 / migration 0030 until a separately authorized migration.

| TABLE               | PURPOSE                                | PRIMARY KEY | FOREIGN KEYS                                          | UNIQUE CONSTRAINTS                                                                   | NULLABILITY                                                    | INDEXES     | IMMUTABILITY                      | ID-D EXPECTED USE                |
| ------------------- | -------------------------------------- | ----------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ | -------------------------------------------------------------- | ----------- | --------------------------------- | -------------------------------- |
| canonical_people    | opaque canonical person identity       | person_id   | -                                                     | person_id CHECK format                                                               | provenance nullable; created_at NOT NULL                       | -           | BEFORE UPDATE OF person_id aborts | create once per canonical person |
| person_emails       | email history + fingerprint per person | id          | person_id -> canonical_people                         | verified-active fingerprint partial unique; active primary per person partial unique | provenance nullable; envelopes/fingerprint/timestamps NOT NULL | person+time | -                                 | ID-D email creation/verification |
| account_staff_links | explicit account-person binding        | id          | account_id -> accounts; person_id -> canonical_people | active link per account partial unique                                               | provenance nullable                                            | person+time | -                                 | ID-D explicit linking            |
| staff_assignments   | organizational assignment facts        | id          | person_id -> canonical_people                         | UNIQUE(person_id, assignment_fingerprint)                                            | effective_from/to nullable                                     | person+time | -                                 | later slice only; not Gate A     |

Invariants encoded in 0031:

- person_id format: `PER-` + UUID v1-v8 variant 8/9/A/B, enforced by CHECK.
- A primary email must be ACTIVE+VERIFIED (CHECK on `person_emails`).
- At most one ACTIVE+VERIFIED row per normalized-email fingerprint (partial unique index).
- At most one ACTIVE account-staff link per account (partial unique index).
- `effective_from <= effective_to` when both present (CHECK on `staff_assignments`).
- The canonical-person identifier is immutable at the database layer.

Gate A needs: applying existing `0031` only, fixture inserts only, and test helpers.
**No new schema work and no migration 0032.** Existing `0031` is sufficient.

## 6. ID-D intended write semantics

Reconstructed from the A6 decision table, existing contracts, and existing repository
methods. Gate A proves these at fixture level only.

AUTHORIZED / PROVEN:

- One immutable opaque `person_id` per canonical person; never derived from email,
  name, student number, phone, department, or role (`createCanonicalPersonId`).
- Zero-or-more emails per person, at most one ACTIVE primary; display form preserved,
  normalize lowercase+trim only for matching (`normalizeEmailForMatching`).
- One verified active normalized email belongs to at most one canonical person;
  collisions are quarantined, never auto-merged (0031 unique index + preview quarantine).
- An account links to zero-or-one canonical person; a person may have multiple accounts;
  linking is explicit (`account_staff_links`) and never by name similarity.
- No privilege is inferred from a link; the link row carries no role/capability.
- Effective dates are NULL when unproven; no dates are invented.
- Duplicate inserts are rejected by primary keys and partial unique indexes.

UNVERIFIED:

- The persisted applied roster projection still matches the live private source
  (Gate B is required before any canonical mutation from live data).
- The identity-key secret has never rotated since account onboarding (see finding 4
  of the prior review; Gate B must include a drift check).

NOT YET AUTHORIZED:

- A production ID-D "apply" service/route that consumes the preview and performs
  transactional canonical writes. Today only the read-only preview exists; the worker
  route contract test asserts no apply route. Gate A must not create one.
- Assignment (staff_assignments) creation semantics. The ID-C preview plans zero
  assignments (`assignmentCreateCount: 0`); Gate A must not invent assignment writes.
- Any role/capability derivation from organizational position.

## 7. Synthetic fixture design

Provider-free harness (inline in the new test file, matching the existing
`identity-foundation-migration.test.js` pattern):

- `node:sqlite` `DatabaseSync(':memory:')`; replay `migrations/*.sql` sorted.
- Reuse the existing `d1Adapter` wrapper (add the `batch` variant already used by
  `account-application-migration-integration.test.js` when the roster apply path is
  exercised in S17).
- Deterministic crypto: `createIdentityRosterCrypto({ secret: 'SYNTHETIC-GATE-A-SECRET-2026-08-16-NOT-PRODUCTION' })`.
  This is a fixture-only constant, not a production secret.
- Deterministic owner actor: `{ id: 'ACTOR-SYNTHETIC-OWNER', roleId: 'SYSTEM_OWNER' }`.
- All names/emails use `example.invalid` (reserved) and `SYNTHETIC`/`TEST` markers.
- Fingerprints are computed at runtime (`F1 = crypto.identityKey('alpha.one@example.invalid')`)
  rather than hardcoded, so the document does not fabricate opaque values.
- Reset: close the in-memory database; a fresh fixture is a fresh schema-31 empty state.

Scenario set (fresh fixture per scenario unless noted):

| SCENARIO ID | PURPOSE                 | SYNTHETIC INPUT                                              | PRECONDITIONS                        | EXPECTED PEOPLE | EXPECTED EMAILS | EXPECTED LINKS | EXPECTED QUARANTINE/UNRESOLVED | MUTATIONS                    | NO-OPS                                          | FAIL-CLOSED RESULT                               | IDEMPOTENT RERUN                        | RESET    |
| ----------- | ----------------------- | ------------------------------------------------------------ | ------------------------------------ | --------------- | --------------- | -------------- | ------------------------------ | ---------------------------- | ----------------------------------------------- | ------------------------------------------------ | --------------------------------------- | -------- |
| S00         | migration proof         | -                                                            | fresh DB                             | 0               | 0               | 0              | 0                              | schema version 31            | -                                               | bad person_id INSERT throws                      | re-replay starts empty                  | close DB |
| S01         | clean new person        | entry P1 (F1, active, VERIFIED)                              | applied run accepted=1               | 0->1            | 0->1            | 0              | 0                              | create person + email row    | -                                               | -                                                | 2nd pass: create=0, zero rows added     | close DB |
| S02         | clean email             | entry P1 (F1)                                                | person PER-E with F1 ACTIVE/VERIFIED | 1               | 1               | 0              | 0                              | none                         | duplicate email insert rejected by unique index | duplicate active-verified fingerprint throws     | emails stays 1                          | close DB |
| S03         | deterministic link      | entry P1 (F1); account A1 ACTIVE+verified F1                 | PER-E with F1                        | 1               | 1               | 0->1           | 0                              | create ACTIVE link A1->PER-E | -                                               | -                                                | 2nd pass: existingLink=1, links stays 1 | close DB |
| S04         | idempotent rerun        | S01+S03 dataset                                              | after first apply                    | 2               | 2               | 1              | 0                              | none                         | preview create=0, linkCand=0                    | -                                                | zero new rows on 2nd pass               | close DB |
| S05         | duplicate prevention    | duplicate ACTIVE/VERIFIED fingerprint; duplicate ACTIVE link | PER-E with F1                        | 1               | 1               | 1              | 0                              | none                         | both duplicate inserts rejected                 | second insert throws                             | counts unchanged                        | close DB |
| S06         | ambiguous candidate     | A1 ACTIVE + A3 STARTER, both verified F1                     | PER-E with F1                        | 1               | 1               | 0              | 1                              | none                         | no link written                                 | accountCandidates>1 quarantines                  | unchanged                               | close DB |
| S07         | empty email             | entry identityKey F0=identityKey(''), profile email ''       | applied run                          | 0               | 0               | 0              | 1                              | none                         | no candidate                                    | quarantine (no email)                            | unchanged                               | close DB |
| S08         | identity-key mismatch   | stored key F9 != recomputed F1                               | applied run                          | 0               | 0               | 0              | 1                              | none                         | no candidate                                    | quarantine                                       | unchanged                               | close DB |
| S09         | decrypt failure         | malformed envelope                                           | applied run                          | 0               | 0               | 0              | 1                              | none                         | no candidate                                    | quarantine                                       | unchanged                               | close DB |
| S10         | inactive account        | A1 DISABLED or verified-at NULL                              | PER-E with F1                        | 1               | 1               | 0              | 0                              | none                         | no link candidate                               | account excluded                                 | unchanged                               | close DB |
| S11         | unverified row          | entry profile VERIFICATION_RESULT UNVERIFIED                 | applied run                          | 0               | 0               | 0              | 0                              | none                         | preservedInactiveOrUnverified=1                 | not a candidate                                  | unchanged                               | close DB |
| S12         | existing correct link   | A1 ACTIVE + ACTIVE link A1->PER-E                            | PER-E with F1                        | 1               | 1               | 1              | 0                              | none                         | existingLink=1, no new link                     | -                                                | unchanged                               | close DB |
| S13         | conflicting link        | A1 ACTIVE + ACTIVE link A1->PER-OTHER                        | PER-E with F1                        | 2               | 2               | 1              | 1                              | none                         | quarantine; link untouched                      | link person mismatch quarantines                 | unchanged                               | close DB |
| S14         | similar names, no match | entries P1 F1 + P5 F5, no canonical rows                     | applied run accepted=2               | 0->2            | 0->2            | 0              | 0                              | two distinct persons         | no name comparison exists                       | -                                                | create=0 on 2nd pass                    | close DB |
| S15         | no auto-merge           | PER-E F1 seeded; entries P1 F1 + P5 F5                       | applied run                          | 1->2            | 1->2            | 0              | 0                              | create only F5's person      | F1 resolves to existing PER-E                   | -                                                | total people 2                          | close DB |
| S16         | isolated failure        | entry1 corrupt + entry2 clean F2                             | applied run accepted=2               | 0->1            | 0->1            | 0              | 1                              | create only clean person     | corrupt entry untouched                         | READY_WITH_QUARANTINE                            | unchanged                               | close DB |
| S17         | synthetic pipeline      | in-memory source 6 rows (2 duplicate-rejected, 4 accepted)   | fresh roster tables                  | 0               | 0               | 0              | 0                              | preview->apply: entries=4    | re-apply runId returns replayed                 | source validator rejects duplicate email/student | reconcile 4/4                           | close DB |

The critical proofs are S01/S03/S04 (first apply = expected effects, second apply =
zero additional effects), S16 (one failure cannot corrupt unrelated candidates), and
S17 (the real roster pipeline runs provider-free and its re-apply is replayed).

## 8. Expected database reconciliation

Derived from the final scenario design above (per-scenario fresh state):

```text
BEFORE MIGRATION:          no canonical tables
AFTER 0031:                schema 31; canonical_people=0, person_emails=0,
                           account_staff_links=0, staff_assignments=0; integrity ok; FK 0
AFTER FIXTURE SEED:        S01/S04/S14/S15/S16 add only the rows their table lists
AFTER ID-D LOCAL APPLY:    first pass writes exactly the rows listed in MUTATIONS
AFTER SECOND IDENTICAL APPLY: zero new canonical_people / person_emails /
                           account_staff_links rows; preview createCount=0
AFTER RESET:               fresh migrated DB; schema 31; all four canonical tables empty
```

Load-bearing assertions Terra must add:

1. `canonical_people` count equals expected after each scenario.
2. `person_emails` unique active-verified fingerprints == rows with that state.
3. `account_staff_links` active-link-per-account uniqueness holds.
4. `staff_assignments` stays empty across every Gate A scenario (no assignment writes).
5. Second identical pass produces zero net inserts.
6. Reset produces the empty schema-31 state.

## 9. Current test results

Reproduced this turn in the isolated research worktree at `8e58f53`:

```text
COMMAND:
npm.cmd run test -- tests/unit/account-application-migration-integration.test.js
  tests/unit/identity-foundation-contracts.test.js
  tests/unit/identity-foundation-migration.test.js
  tests/unit/v072-migration-contract.test.js
  tests/unit/identity-foundation-reconciliation.test.js
  tests/unit/identity-foundation-worker-route-contract.test.js
  tests/unit/http-api-adapter.test.js
  tests/unit/legacy-runtime-adapter.test.js

RESULT: Test Files 8 passed (8); Tests 31 passed (31)
RUNTIME: Node v26.3.0, npm 11.16.0, Vitest v4.1.10 (resolved from ^4.0.15)
DURATION: 5.31s
```

This exactly reproduces the branch continuity record
`V83_S07_VALIDATION: FOCUSED_VITEST=PASS_8_FILES_31_TESTS`. The chain records cite
Node 22.23.2 for earlier runs; both Node lines pass for this focused set (22 cited,
26 re-verified locally). `npm ci` installed 169 packages cleanly (12s).

## 10. Coverage-gap matrix

| INVARIANT                        | EXISTING TEST                                              | COVERAGE          | GATE A TEST REQUIRED | REASON                                                                               |
| -------------------------------- | ---------------------------------------------------------- | ----------------- | -------------------- | ------------------------------------------------------------------------------------ |
| canonical person reconciliation  | reconciliation.test.js                                     | PARTIALLY_COVERED | YES                  | create/existing covered; superseded/empty-canonical transitions not directly covered |
| duplicate detection              | migration test                                             | COVERED           | YES                  | add explicit duplicate-insert rejection proof (S05)                                  |
| ambiguity                        | reconciliation.test.js                                     | COVERED           | YES                  | account-conflict and link-conflict paths (S06, S13)                                  |
| email reconciliation             | reconciliation.test.js                                     | PARTIALLY_COVERED | YES                  | empty email and identityKey mismatch branches untested (S07, S08)                    |
| account linking                  | reconciliation.test.js                                     | PARTIALLY_COVERED | YES                  | existing-link match/conflict untested (S12, S13)                                     |
| fingerprint/decrypt failure      | reconciliation.test.js                                     | NOT_COVERED       | YES                  | S09                                                                                  |
| empty email                      | none                                                       | NOT_COVERED       | YES                  | S07                                                                                  |
| identity-key mismatch            | none                                                       | NOT_COVERED       | YES                  | S08                                                                                  |
| inactive/unverified preservation | none                                                       | NOT_COVERED       | YES                  | S10, S11                                                                             |
| existing-link mismatch           | none                                                       | NOT_COVERED       | YES                  | S13                                                                                  |
| no name-based linking            | none                                                       | NOT_COVERED       | YES                  | S14 proves no name comparison                                                        |
| mutation prevention              | worker-route-contract.test.js                              | COVERED           | NO                   | already asserts no apply route                                                       |
| idempotency                      | roster apply replayed (not directly tested in the 8 files) | PARTIALLY_COVERED | YES                  | S04 second-pass + S17 replayed                                                       |
| rollback/reset                   | none                                                       | NOT_COVERED       | YES                  | in-memory close/recreate proof                                                       |
| assignment handling              | migration test (schema only)                               | PARTIALLY_COVERED | NO                   | assignments stay empty by design in Gate A                                           |

## 11. Gate A required tests

New file `tests/unit/identity-foundation-gate-a-fixture.test.js` implementing S00-S17
with inline helpers only. No existing test file changes. Required coverage:

- S00: schema 31 applied once, integrity ok, FK 0, four tables empty, malformed
  `person_id` rejected.
- S01-S04: first-apply effects and second-apply zero effects for person, email, link.
- S05: duplicate fingerprint/link inserts rejected; counts unchanged.
- S06: two eligible accounts quarantine; no link.
- S07/S08/S09: empty email, identityKey mismatch, decrypt failure quarantine; no writes.
- S10/S11: inactive account and unverified roster row produce no candidates.
- S12/S13: existing correct link counted; conflicting link quarantined without change.
- S14/S15: name similarity never merges; distinct identities stay distinct.
- S16: one corrupt entry does not block a clean sibling; READY_WITH_QUARANTINE.
- S17: synthetic source -> roster preview -> apply -> reconcile 4/4; re-apply replayed.

Every test must assert the `safety` flags stay false and that `staff_assignments`
remains empty.

## 12. Expected file-touch map

| FILE                                                                 | CLASS                | WHY                                     | BEHAVIOR ADDED     | MUST NOT CHANGE  | VERIFICATION                     |
| -------------------------------------------------------------------- | -------------------- | --------------------------------------- | ------------------ | ---------------- | -------------------------------- |
| tests/unit/identity-foundation-gate-a-fixture.test.js                | EXPECTED_WRITE (new) | Gate A fixture + scenario proofs        | S00-S17 assertions | nothing existing | focused vitest; eslint; prettier |
| src/server/identity-foundation/contracts.js                          | READ_ONLY_DEPENDENCY | fixture imports validators/id generator | -                  | -                | existing contracts tests         |
| src/server/identity-foundation/reconciliation.js                     | READ_ONLY_DEPENDENCY | fixture runs the preview                | -                  | -                | existing reconciliation tests    |
| src/server/d1/identity-foundation-repository.js                      | READ_ONLY_DEPENDENCY | fixture writes/reads canonical rows     | -                  | -                | existing migration test          |
| src/server/d1/identity-roster-repository.js                          | READ_ONLY_DEPENDENCY | S17 apply/reconcile path                | -                  | -                | existing roster coverage         |
| src/server/identity-roster/service.js + crypto.js                    | READ_ONLY_DEPENDENCY | S17 synthetic pipeline                  | -                  | -                | S17 assertions                   |
| migrations/0031_canonical_identity_foundation.sql                    | DO_NOT_TOUCH         | schema authority                        | -                  | -                | byte-identical; no diff          |
| src/worker, src/services, .codex, dist, generated HTML, package.json | DO_NOT_TOUCH         | out of Gate A scope                     | -                  | -                | zero diff outside new test file  |

Prefer inline helpers (the established `identity-foundation-migration.test.js`
pattern) over a new shared helper to keep the diff minimal. If the audit prefers a
shared helper, extract only the existing `d1Adapter`/migrate helpers into
`tests/fixtures/` as a separate reviewed change — do not do so silently.

## 13. Deterministic execution sequence

Order Terra should later follow (after fresh-state revalidation):

1. `git fetch --prune origin` and re-verify branch/HEAD/tree/spec/writer-lock parity (EXISTING).
2. Replay migrations in-memory; assert S00 (EXISTING pattern).
3. Initialize fixture scenarios S01-S17 (PROPOSED: new test file).
4. First local apply assertions (PROPOSED).
5. Database reconciliation assertions after first apply (PROPOSED).
6. Second identical apply + idempotency assertions (PROPOSED).
7. Negative/fail-closed cases S05-S16 (PROPOSED).
8. Reset + post-reset reconciliation (PROPOSED).
9. `npm.cmd run test -- tests/unit/identity-foundation-gate-a-fixture.test.js` (PROPOSED once file exists).
10. Re-run the 8-file focused set from section 9 (EXISTING; 31/31 expected).
11. `npx eslint tests/unit/identity-foundation-gate-a-fixture.test.js` (EXISTING tool).
12. `npx prettier --check tests/unit/identity-foundation-gate-a-fixture.test.js` (EXISTING tool).
13. `git diff --check` (EXISTING).
14. Complete logical diff review by Sol before commit (EXISTING workflow).

Build, Cloudflare, e2e, migration, deploy, provider, and recovery commands are NOT
required for a test-only fixture and must not be run by Terra for Gate A.

## 14. Reset / rollback

- Starting state: fresh in-memory schema-31 database.
- Migration state: all of 0001..0031 applied once.
- Fixture state: synthetic rows created only inside the in-memory database.
- Reset mechanism: close the `DatabaseSync` handle; recreate the fixture for the next
  scenario. Nothing persists to disk, D1, or a provider.
- Verification after reset: integrity ok, FK 0, schema version 31, four canonical
  tables empty, roster tables empty (unless S17 re-seeds).
- Gate A must never require a Production rollback, recovery-pointer rotation, or any
  external rollback. If a future file-backed fixture is ever desired, it must use a
  git-ignored temp path and be deleted on reset.

## 15. Privacy/security constraints

- Only `example.invalid` addresses and `SYNTHETIC`-marked identifiers/names.
- The fixture secret is a clearly marked constant, never a real `PASSWORD_PEPPER`,
  roster key, or any of the 14 required production secret names.
- No Google/Sheets/Drive read, no provider call, no email send, no D1/R2 access.
- No decrypted real profile ever enters Git or logs; scenario outputs assert counts
  and redaction (extend the existing redaction assertion pattern).
- The preview output shape (counts only) remains the only thing asserted against.

## 16. Risks

| RISK                                                  | SEVERITY | MITIGATION                                                       |
| ----------------------------------------------------- | -------- | ---------------------------------------------------------------- |
| Fixture secretly assumes production ID-D apply exists | HIGH     | Explicit NOT_YET_AUTHORIZED marker; test-side orchestration only |
| Silent name-based inference                           | HIGH     | S14 proves the code path has no name comparison                  |
| Silent account-link assumption                        | HIGH     | S06/S12/S13 prove ambiguity and conflict quarantine              |
| Email normalization assumption drift                  | MEDIUM   | contracts + crypto normalization asserted together               |
| Secret rotation masking candidates                    | MEDIUM   | recorded as finding; Gate B drift check required                 |
| Accidental assignment creation                        | HIGH     | assignmentCreateCount stays 0; staff_assignments asserted empty  |
| Migration irreversibility                             | MEDIUM   | 0031 is additive-empty; fixture is in-memory                     |
| False expected counts                                 | MEDIUM   | counts derived from scenario table; second-pass zero-delta proof |
| Tests reproduce implementation, not invariants        | MEDIUM   | every scenario asserts DB state, not just preview numbers        |
| Private data leakage                                  | HIGH     | synthetic-only data; no real values                              |
| Local-only audit dependency                           | HIGH     | all facts are in pushed repo files (these three documents)       |

## 17. UNVERIFIED items

- Live private source (Google roster) state: intentionally unobserved; Gate B.
- Live Production/Playground runtime identity: chain records only (v0.8.2
  `c316e047...`); not re-verified against Cloudflare this turn.
- Writer heartbeat: chain records 2026-08-14T02:03:11+08:00; no live writer
  confirmed as of 2026-08-16. Any Thursday write requires a fresh transfer/release.
- CI runner Node version for the future Gate A run (22 cited, 26 verified locally).
- Whether the audit requires an Opus 5 pass before Terra execution (Sol decision).

## 18. Gate B prerequisites

Gate B is NOT performed here. Required later shape:

- Why: ID-C reconciles the persisted projection against itself; the live source is
  unobserved, so projection freshness is unproven before canonical mutation.
- What to verify: read the approved roster source via the existing
  `createGoogleSheetsRosterSource` (spreadsheet id + range + service account), compute
  `crypto.fingerprint(fingerprintSource)` and row counts, and compare with the latest
  APPLIED run's `source_fingerprint`, `source_row_count`, `accepted_count`,
  `rejection_count`.
- Minimum permissions: the existing service-account `spreadsheets.readonly` scope;
  no new scope; read-only.
- Must not retrieve/emit: names, student IDs, review notes, or any row values.
  Compute counts and fingerprint in memory and emit only those plus status.
- Redaction: counts + `SHA256` fingerprint only; no values in logs or Git.
- Comparison rule: equal fingerprint AND equal counts => fresh; any difference => BLOCK.
- Secret-drift detection: after the probe, re-run ID-C. If the source fingerprint
  matches but every verified-active entry quarantines on `identityKey` mismatch, treat
  it as a secret-drift signal and BLOCK.
- Continuation result: fingerprint/counts equal and ID-C returns READY or
  READY_WITH_QUARANTINE with zero BLOCKED statuses.
- Blocking result: any count/fingerprint mismatch, BLOCKED status, provider error, or
  drift signal.

## 19. GPT-5.6 Sol audit questions

1. Is the Gate A fixture actually authorized by A6?
2. Does the design accidentally invent identity semantics?
3. Are canonical-person/email/account-link expectations consistent with migration 0031?
4. Is any name-based or unsupported inference present?
5. Are ambiguous identities guaranteed to fail closed?
6. Is the fixture genuinely provider-free?
7. Are the proposed tests sufficient?
8. Does the idempotency proof actually prove duplicate prevention?
9. Is reset/rollback adequate?
10. Does any proposed step cross into Gate B?
11. Are any assignments or permissions being fabricated?
12. Is there any reason Opus 5 is needed before Terra execution?
13. Is the Terra prompt safe and sufficiently bounded?
14. What, if anything, must be corrected before Thursday?

## 20. Final Gate A readiness verdict

`READY_FOR_GPT56_AUDIT`. Gate A is correctly scoped as a provider-free, test-only
migration fixture, the synthetic scenario set covers the identity invariants the A6
specification names, the current focused suite reproduces 31/31, and no product,
migration, `.codex`, provider, or production mutation is required by this preparation
or by the drafted Terra prompt.
