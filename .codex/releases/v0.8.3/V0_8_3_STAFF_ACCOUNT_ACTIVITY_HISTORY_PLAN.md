# V83 Staff/Account Activity History Plan

INTENT: architecture / feature plan

OBJECTIVE: Specify one provider-free, additive canonical staff/account activity
history slice. Every canonical event is attributable solely from immutable
event-time truth. It never joins a delayed audit to the current person, link,
name, email, or capability.

TARGET: release/v0.8.3-identity-foundation at the documentation commit produced
from e0f302c86db42f446f06fc5f60d9a86ba1ce647e. Implementation starts only in
an isolated worktree after a fourth independent plan audit accepts this packet.

AUTHORITATIVE SOURCES: .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md
sections 1-6; .codex/specs/v0.7.2-production-access-operations.md sections 4,
7, and 13; .codex/releases/v0.8.3/V0_8_3_SCOPE_COMPLETENESS_MATRIX.md; the
provider-free gap review at 77232d4ad2cb1a79469d61b5fdb1772dcb81d0af; and the
three Luna rejections repaired by this single authoritative revision.

IN SCOPE: a later additive D1 migration 0032; immutable activity/context tables;
trigger-enforced append semantics; an effective-ACCESS_ADMIN read-only route;
bounded V5 rendering; regression-first tests; and durable evidence. The route
is POST /api/admin/staff-activity-history with mutation: false.

OUT OF SCOPE: provider/private-source access; roster or crypto access; protected
envelope, fingerprint, provenance, email, profile, credential, or capability
selection/decryption; fabricated/historical backfill; destructive rewrite;
migration execution; candidate freeze; Playground; Production; deployment;
recovery rotation; and v0.8.4 work.

DELIVERABLES: migration 0032, bounded DTO/read route/V5 view, focused tests, and
evidence. This plan authorizes none of those product changes yet.

VERIFICATION: regression-first migration/repository/service/Worker/V5 tests on
portable Node 22.23.2; D1/Miniflare and migration-harness compatibility; syntax;
scoped ESLint/Prettier; privacy scans; fresh-migration constraint proof; complete
diff review; normal commit/push; and local/upstream/live parity.

STOP CONDITIONS: inferred attribution; protected-data exposure; audience
broadening; producer unable to atomically carry event context; D1 incompatibility;
provider/private-source need; schema beyond this plan; failing authorization,
privacy, migration, or recovery checks; or an external action.

## 1. Canonical source taxonomy and ownership

The following table is the entire account-audit taxonomy for 0032. Existing
legacy audit actions are preserved; an omitted action is not renamed, retyped,
or projected.

| Source action/entity                                                 | Current producer and later owned paths                                                                | Canonical action and eligibility                                                                                              |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| ACCESS_ID_CHANGED / ACCOUNT                                          | src/server/access/service.js and src/server/d1/access-management-repository.js                        | ACCESS_ID_CHANGED. Same command creates a guarded account-audit context before its existing ACCOUNT audit.                    |
| STARTER_ACCOUNT_CREATED / ACCOUNT, access-management flow            | src/server/d1/access-management-repository.js, with request context from src/server/access/service.js | STARTER_ACCOUNT_CREATED. This is a distinct account-creation command/audit source.                                            |
| STARTER_ACCOUNT_CREATED / ACCOUNT, account-application approval flow | src/server/account-application/service.js and src/server/d1/account-application-repository.js         | STARTER_ACCOUNT_CREATED. This is a distinct approval-created account command/audit source.                                    |
| ACCOUNT_STATUS_CHANGED / ACCOUNT                                     | src/server/access/service.js and src/server/d1/access-management-repository.js                        | ACCOUNT_STATUS_CHANGED. Its existing producer retains its legacy semantics and receives guarded event-time context.           |
| ACCOUNT_APPLICATION_ACTIVATED / ACCOUNT_APPLICATION                  | src/server/account-application/service.js and src/server/d1/account-application-repository.js         | Preserved application history only; never implicitly projected or retyped as account history.                                 |
| ACCOUNT_APPLICATION_ACTIVATED / new conditional ACCOUNT audit        | same account-application service/repository transition batch                                          | ACCOUNT_APPLICATION_ACTIVATED only when that activation proves exactly one explicit ACTIVE account/person link at event time. |

The two STARTER_ACCOUNT_CREATED rows are separate truthful events because they
have different source commands and immutable ACCOUNT audit IDs. The history
identity is the source audit ID, not account/action/timestamp, so it does not
merge two independent commands. A command retry can create no second source
audit only when its existing source-operation idempotency returns the original
operation; otherwise a source conflict fails before a new canonical event is
created. No timestamp or cross-producer deduplication is permitted.

ACCOUNT_ARCHIVED, AUTHENTICATION, unknown/non-account audit entities, the
auth-service starter actions outside these two D1 account producers, and every
other legacy action remain preserved in their existing audit systems but are
unprojected. They cannot infer a canonical person or fail existing audit logging.

## 2. Authoritative 0032 logical DDL contract

Migration 0032 is additive, begins with PRAGMA foreign_keys = ON, uses STRICT
tables only after the migration tests prove D1 support, creates required indexes
and triggers, then changes app_metadata.operational_schema_version from 31 to 32. It never backfills.

### 2.1 ID and source-operation constraints

Every canonical event ID is exactly HIS- followed by a lowercase UUIDv4:
length 40; prefix HIS-; UUID hyphens at positions 13, 18, 23, and 28; version
character 4 at position 19; variant 8, 9, a, or b at position 24; and remaining
characters lowercase hexadecimal. A D1/SQLite trigger generates it with this
expression, which requires no provider or custom SQL function:

    'HIS-' || lower(hex(randomblob(4))) || '-' ||
    lower(hex(randomblob(2))) || '-4' ||
    substr(lower(hex(randomblob(2))), 2, 3) || '-' ||
    substr('89ab', (abs(random()) % 4) + 1, 1) ||
    substr(lower(hex(randomblob(2))), 2, 3) || '-' ||
    lower(hex(randomblob(6)))

The history table has these source fields and constraints:

    source_kind TEXT NOT NULL CHECK (
      source_kind IN ('ACCOUNT_AUDIT', 'ACCOUNT_STAFF_LINK', 'STAFF_ASSIGNMENT')
    )
    source_id TEXT NOT NULL CHECK (
      length(trim(source_id)) BETWEEN 1 AND 128
    )
    source_event_id TEXT NOT NULL CHECK (
      length(trim(source_event_id)) BETWEEN 1 AND 128
    )
    UNIQUE(source_kind, source_id, source_event_id)

For ACCOUNT_AUDIT, source_id and source_event_id are both the immutable
audit_log.id. For a source-row insert, source_event_id is literal CREATE. For
an accepted mutable link or assignment transition, source_event_id is a
lowercase UUIDv4 transition ID with the ordinary 36-character UUID shape.
ACCOUNT_AUDIT forbids a transition ID; link/assignment CREATE forbids one;
mutable link/assignment rows require one. Context and source tables enforce the
same shape/bounds before binding.

The history row has payload_version INTEGER NOT NULL DEFAULT 1 CHECK
(payload_version = 1); no JSON, free-form payload, note, email, name, profile,
fingerprint, envelope, provenance, credential, capability, or provider column.
All IDs are trimmed/non-empty and no longer than 128. occurred_at is canonical
24-character UTC text with checked YYYY-MM-DDTHH:MM:SS.mmmZ separators.
account_access_id_snapshot is NULL or trimmed 1-120; correlation_id is NULL or
trimmed 1-128.

### 2.2 Tables, FKs, immutability, and retention

staff_account_activity_audit_context is STRICT and contains audit_id, person_id,
account_id, account_staff_link_id, link_state, account_access_id_snapshot,
action_code, correlation_id, and prepared_at. audit_id is its primary key and a
DEFERRABLE INITIALLY DEFERRED FK to audit_log(id) ON DELETE RESTRICT. Its person,
account, and link fields are ON DELETE RESTRICT FKs to canonical_people,
accounts, and account_staff_links. link_state must be ACTIVE; IDs, action,
correlation, timestamp, and snapshot use the bounds above.

staff_account_activity_history is STRICT and contains event_id, occurred_at,
event_type, action_code, person_id, account_id, account_staff_link_id,
staff_assignment_id, link_state, previous_link_state, assignment_state,
previous_assignment_state, old_effective_from, old_effective_to,
new_effective_from, new_effective_to, account_access_id_snapshot,
correlation_id, source_kind, source_id, source_event_id, and payload_version.
Every non-null identity FK is ON DELETE RESTRICT. Its lookup indexes are
(person_id, occurred_at DESC, event_id DESC), (account_id, occurred_at DESC,
event_id DESC), and the unique source-operation key.

BEFORE UPDATE OR DELETE triggers abort on either new table. Identity source
columns are immutable: canonical_people.person_id; account_staff_links.id,
account_id, and person_id; and staff_assignments.id, person_id, and
assignment_fingerprint. Migration 0032 adds a BEFORE UPDATE OF
assignment_fingerprint abort trigger as well as equivalent identity-column
guards. A changed fingerprint is a separately authorized new assignment row,
not a mutation. Retention is intentional: no source/context/history delete can
erase or orphan canonical history.

### 2.3 Enforceable action matrix and assignment-window truth

The DDL CHECK matrix, not application prose, enforces all of the following.

| source_kind        | action_code                                                                                       | Required fields                                                              | Required null fields                                           |
| ------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------- |
| ACCOUNT_AUDIT      | ACCESS_ID_CHANGED, STARTER_ACCOUNT_CREATED, ACCOUNT_STATUS_CHANGED, ACCOUNT_APPLICATION_ACTIVATED | person/account/link, ACTIVE link state, access-ID snapshot, audit source IDs | assignment identity/state and all four effective-window fields |
| ACCOUNT_STAFF_LINK | LINK_CREATED, LINK_STATE_CHANGED                                                                  | person/account/link and explicit link state; previous link state for change  | assignment identity/state, access snapshot, all window fields  |
| STAFF_ASSIGNMENT   | ASSIGNMENT_CREATED, ASSIGNMENT_STATE_CHANGED, ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED                 | person/assignment and explicit assignment state                              | account/link/access snapshot                                   |

All four assignment fields are in the authoritative table and safe DTO:
old_effective_from, old_effective_to, new_effective_from, new_effective_to.
Each is NULL or canonical UTC text with the same 24-character format check.
They are NULL for every ACCOUNT_AUDIT and ACCOUNT_STAFF_LINK row.

For ASSIGNMENT_CREATED, both old fields must be NULL and each new field is the
explicit NEW source value (including explicit NULL). For
ASSIGNMENT_STATE_CHANGED, old and new pairs are each copied from OLD and NEW
source values. For ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED, all four are copied and
at least one OLD/NEW pair differs under NULL-safe comparison. The DTO labels
these fields as event-time explicit state; NULL means that source field was
explicitly unset, not unknown. If OLD/NEW truth cannot be obtained, the trigger
does not project a row; it never serializes UNPROVEN.

The source-kind/action CHECK rejects every other combination. It also enforces
the required/non-null relationships above, including a non-null previous state
only for state-change actions. Trigger WHERE predicates independently repeat
eligibility so malformed source/context produces no projection rather than a
constraint abort of the legacy audit.

## 3. Event-time context, producer ordering, and exact-once behavior

A producer pre-validates all bounded fields then uses INSERT ... SELECT with
WHERE eligibility; it never direct-inserts potentially malformed context.
Sentinel, missing, oversized, malformed, ambiguous, revoked, quarantined, or
non-account truth selects zero rows. The existing legacy audit statement remains
a separate statement and commits. The account-audit trigger has no RAISE branch:
it only INSERT ... SELECTs when entity_type is ACCOUNT, entity_id matches the
context account, action/correlation match, the context is valid, and the action
is allowed.

ACCESS_ID_CHANGED, both STARTER_ACCOUNT_CREATED producers, and
ACCOUNT_STATUS_CHANGED prepare context immediately before their existing
ACCOUNT audit INSERT in the same D1 batch. The guarded SELECT joins the exact
account and requires exactly one account_staff_links row with state ACTIVE,
matching account/person/link IDs and snapshot. It writes the generated audit ID,
the source action, correlation, and direct access-ID snapshot. If eligibility is
not exactly one, context writes zero rows but the existing audit writes normally.

For account-application activation, the repository receives no new command
input. The existing activation transaction first performs its guarded transition
and application-history writes. It then allocates one shared audit ID in the
existing service/repository command context and executes, in order:

1. INSERT INTO staff_account_activity_audit_context (...) SELECT shared values
   from accounts and account_staff_links WHERE account_id = activated account ID
   AND link_state = ACTIVE AND exactly one such link exists, with all bounds and
   action ACCOUNT_APPLICATION_ACTIVATED checked.
2. INSERT INTO audit_log (id, entity_type, entity_id, action, correlation_id,
   ...) SELECT that same shared audit ID and ACCOUNT values only WHERE the
   just-inserted matching context exists.
3. Execute the existing ACCOUNT_APPLICATION audit INSERT unchanged.

Thus missing or ambiguous ACTIVE-link proof makes both new ACCOUNT context and
ACCOUNT audit zero-row; the activation and original APPLICATION audit still
commit. The new ACCOUNT audit trigger uses the same audit ID as source identity.
The application audit is never retyped.

Each AFTER INSERT audit trigger invocation creates exactly one history row for
one immutable audit ID. Link and assignment INSERT/UPDATE triggers create one
row for the CREATE identity or accepted UUID transition identity. A repeat is a
no-op only when the underlying source operation itself is idempotent and no new
source row/audit is committed. If a composite source identity is reused with any
different allowed identity, action, state/window, snapshot, correlation, or
payload version, the source transition aborts before it can corrupt the prior
history. INSERT OR IGNORE is never used to hide a conflict. Timestamp is
ordering-only and never an idempotency key.

No generic projector queries a current link. A delayed/replayed audit lacking
its original context cannot become canonical history. AUTHENTICATION,
nonexistent-account, and malformed audit rows remain valid legacy audit rows and
produce no canonical event, so their FKs cannot abort authentication logging.

## 4. Read contract, authorization, and safe DTO

POST /api/admin/staff-activity-history authorizes effective ACCESS_ADMIN with
mutation: false before any repository read. System Owner reaches it only through
existing effective capability mapping; account/link presence never grants
privilege. Denial causes no read. The legacy access-history route remains
separate, with no fallback.

personId is required opaque canonical ID. query is optional only with personId
and is case-sensitive exact account_id or account_access_id_snapshot; it never
searches name, email, profile, roster data, or partial text. Empty, invalid, or
over-120 query returns 400. eventType/actionCode are fixed allowlists. page is
absent=1 or integer >=1; invalid is 400. pageSize absent/non-integer=25 and
integer values clamp 5-50. Count and page queries use identical predicates.
Order is occurred_at DESC, event_id DESC. totalPages is zero for zero total;
valid out-of-range pages return empty items with truthful totals.

The DTO exposes only:

    {
      personId, historyStartsAt,
      items: [{
        id, occurredAt, eventType, actionCode, accountId,
        accountAccessIdSnapshot, correlationId, linkState, previousLinkState,
        assignmentState, previousAssignmentState, oldEffectiveFrom,
        oldEffectiveTo, newEffectiveFrom, newEffectiveTo
      }],
      pagination: { page, pageSize, total, totalPages }
    }

historyStartsAt and the V5 UI state retained canonical history begins at
migration activation and does not imply pre-activation absence. The UI escapes
values, renders a safe empty state, and never falls back to roster or legacy
account directory. Staff Directory P3 remains unchanged: no live Worker 403;
static ACCESS_ADMIN/mutation:false plus browser denial/no-request is accepted.

## 5. Later implementation and test ownership

| Responsibility                                                               | Exact owned path and reason                                                                                                                                                                                       |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DDL, version 32, constraints, indexes, triggers                              | migrations/0032_staff_account_activity_history.sql                                                                                                                                                                |
| Canonical read query and source mutation primitives                          | src/server/d1/identity-foundation-repository.js                                                                                                                                                                   |
| ACCESS_ID_CHANGED, access-management STARTER, ACCOUNT_STATUS context         | src/server/access/service.js; src/server/d1/access-management-repository.js                                                                                                                                       |
| Account-application STARTER and conditional activation ACCOUNT audit/context | src/server/account-application/service.js; src/server/d1/account-application-repository.js                                                                                                                        |
| Input/DTO                                                                    | new src/server/identity-foundation/staff-account-activity-history-service.js                                                                                                                                      |
| Effective-capability route                                                   | src/worker/index.js                                                                                                                                                                                               |
| HTTP client transport                                                        | src/services/http-api-adapter.js; src/services/rest-service.js                                                                                                                                                    |
| V5 view                                                                      | src/v5/integration/runtime.js; src/v5/integration/view-models.js; src/v5/src/surfaces/admin.js; src/v5/integration/admin-parity.js                                                                                |
| New service proof                                                            | new tests/unit/staff-account-activity-history-service.test.js                                                                                                                                                     |
| Version/order/fresh schema proof                                             | tests/unit/identity-foundation-migration.test.js; tests/unit/account-application-migration-integration.test.js; tests/unit/identity-foundation-gate-a-fixture.test.js; tests/unit/v072-migration-contract.test.js |
| Direct producer, D1 trigger, STRICT, deferred-FK proof                       | tests/unit/access-management-repository.test.js; tests/unit/account-application-service.test.js; tests/unit/account-application-repository.test.js                                                                |
| Route denial proof                                                           | tests/unit/identity-foundation-worker-route-contract.test.js                                                                                                                                                      |
| Browser/V5 proof                                                             | tests/e2e/v5-current-application-fixtures.js; tests/e2e/v5-current-application.spec.js                                                                                                                            |
| HTTP startup behavior only                                                   | tests/cloudflare-e2e/local-worker.spec.js                                                                                                                                                                         |

tests/unit/access-management-repository.test.js is the actual existing
Miniflare D1 unit seam. Its later reduced fixture must apply 0031 then 0032,
seed only synthetic accounts/canonical people/links/assignments/audits, and prove
STRICT, deferred FKs, trigger ordering, guarded zero-row context, legacy audit
compatibility, malformed/sentinel/delayed/non-account safety, assignment OLD/NEW
truth, identity guards, and both account-side starter producers. It must not
need a provider.

tests/cloudflare-e2e/local-worker.spec.js is retained only for Worker HTTP
startup/authorization behavior that its workerd harness actually supplies; it
is not claimed to own or directly control Miniflare migration/trigger proof. No
new startup script is required by this plan. The two account-application unit
tests prove the existing approval starter audit and the new conditional
activation batch ordering/zero-row cases. The access-management unit test proves
ACCESS_ID_CHANGED, its starter producer, and ACCOUNT_STATUS_CHANGED context
ordering/taxonomy.

## 6. Regression-first acceptance and migration safety

1. Capture red tests for absent migration/route before implementation.
2. Apply 0031 then 0032 in both the existing migration harness and the
   Miniflare unit fixture. Prove version 32, STRICT/deferred-FK compatibility,
   constraints, indexes, trigger order, append guards, and no backfill.
3. Prove all four account actions map only through their named producers; both
   STARTER sources retain separate immutable source IDs; application activation
   cannot create an ACCOUNT event without exactly one ACTIVE explicit link.
4. Prove malformed/sentinel/oversized context, delayed/replayed audits,
   AUTHENTICATION, and nonexistent accounts do not abort legacy audit logging
   or produce canonical history.
5. Prove CREATE and UUID transition identity, exact-once/no-op retry behavior,
   conflicting identity reuse abort, source identity/fingerprint mutation denial,
   and OLD/NEW assignment-window semantics.
6. Prove DTO allowlist, query/pagination/count equality, totalPages zero,
   ACCESS_ADMIN/mutation:false denial-before-read, and V5 authorized/denied UI.
7. Run focused checks, review full diff, commit/push normally, and prove parity.
   Do not apply 0032, freeze a candidate, or deploy in that implementation task.

Pre-application requires separately authorized recovery evidence and schema-31
proof. Post-application rollback is forward-only: disable/revert the read route
while retaining source/context/history. Reconstruction uses immutable audit,
context, source rows, transition IDs, and composite operation identities. A
conflict is a reconciliation failure, never a silent rewrite.
