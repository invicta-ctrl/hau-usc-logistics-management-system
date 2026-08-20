# V83 Staff/Account Activity History Plan

INTENT: feature / architecture

OBJECTIVE: Define the later provider-free canonical staff/account history slice
so an event is attributed only from immutable event-time truth. It must never
join an old or delayed audit to a current person, link, name, email, or inferred
capability.

TARGET: release/v0.8.3-identity-foundation after this governance commit. Later
implementation starts only from that clean SHA in an isolated worktree and only
after a second independent plan audit accepts this packet.

AUTHORITATIVE SOURCES: .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md
sections 1-6; .codex/specs/v0.7.2-production-access-operations.md sections 4,
7, and 13; .codex/releases/v0.8.3/V0_8_3_SCOPE_COMPLETENESS_MATRIX.md; the
provider-free gap review at 77232d4ad2cb1a79469d61b5fdb1772dcb81d0af; and the
first Luna rejection addressed by this revision.

IN SCOPE: a later additive D1 migration 0032; immutable activity and
audit-context tables; trigger-enforced append semantics; a read-only canonical
projection route/service; bounded client/V5 wiring; regression-first tests; and
durable evidence. The route is POST /api/admin/staff-activity-history,
authorized by effective ACCESS_ADMIN with mutation: false.

OUT OF SCOPE: provider/private-source access; roster or crypto access;
protected-envelope/fingerprint/provenance selection or decryption; fabricated or
historical backfill; destructive rewrite; release migration execution; candidate
freeze; Playground; Production; deployment; recovery rotation; and v0.8.4 work.

DELIVERABLES: additive DDL, bounded canonical DTO, read route, V5 rendering,
focused tests, and migration/evidence records. This plan does not authorize
creating/applying the migration or changing product code.

VERIFICATION: regression-first migration/repository/service/Worker/V5 tests with
portable Node 22.23.2; syntax; scoped ESLint/Prettier; privacy scans; fresh
migration constraint proof; complete diff review; normal commit/push; and
local/upstream/live parity.

STOP CONDITIONS: inferred event-time attribution; protected-data exposure;
audience broadening; producer unable to atomically carry event context;
provider/private-source need; schema beyond this packet; unavailable recovery
authority; failing privacy/authorization/migration checks; or external action.

## Gap and fail-closed decision

The existing /api/admin/access/history path is account-management history, not
canonical staff/account history. Its audit_log row has entity type/entity ID,
action, and correlation ID, but no event-time person/link identity. Looking up a
current account_staff_links row after an audit is committed is prohibited.

Ordinary audit_log rows are therefore not projected. entity_id = AUTHENTICATION,
unknown/non-account entity IDs, missing account context, ambiguous/revoked/
quarantined link, and delayed/replayed audits are skipped without error and
without affecting existing audit logging. They are not person-history evidence
and can never cause an FK failure in authentication logging.

Only a dedicated event-time context, prepared by the same account command and
committed in its same D1 transaction as a new audit row, is eligible. Link and
assignment lifecycle events are projected from their own committed source
mutations, capturing OLD/NEW truth. No generic audit trigger queries a current
link.

## Additive schema and hard constraints

Later implementation adds migrations/0032_staff_account_activity_history.sql.
It starts with PRAGMA foreign_keys = ON, uses STRICT tables if the migration
test proves D1 compatibility, and updates app_metadata operational_schema_version
from 31 to 32 only after DDL/indexes/triggers all succeed.

    staff_account_activity_audit_context
      audit_id TEXT PRIMARY KEY
      person_id TEXT NOT NULL
      account_id TEXT NOT NULL
      account_staff_link_id TEXT NOT NULL
      link_state TEXT NOT NULL CHECK (link_state = 'ACTIVE')
      account_access_id_snapshot TEXT NOT NULL
      action_code TEXT NOT NULL
      correlation_id TEXT NOT NULL
      prepared_at TEXT NOT NULL

    staff_account_activity_history
      operation_id TEXT PRIMARY KEY
      occurred_at TEXT NOT NULL
      event_type TEXT NOT NULL
      action_code TEXT NOT NULL
      person_id TEXT NOT NULL
      account_id TEXT
      account_staff_link_id TEXT
      staff_assignment_id TEXT
      link_state TEXT
      previous_link_state TEXT
      assignment_state TEXT
      previous_assignment_state TEXT
      account_access_id_snapshot TEXT
      correlation_id TEXT
      source_kind TEXT NOT NULL
      source_id TEXT NOT NULL
      source_transition_id TEXT
      payload_version INTEGER NOT NULL DEFAULT 1

audit_context.audit_id is a DEFERRABLE INITIALLY DEFERRED FK to audit_log(id) ON
DELETE RESTRICT. It also has ON DELETE RESTRICT FKs to canonical_people,
accounts, and account_staff_links. Each non-null history identity FK is ON
DELETE RESTRICT. Retention is intentional: sources cannot be deleted to erase
or orphan canonical history.

Concrete checks required in migration 0032:

- every ID/operation ID is trimmed, non-empty TEXT; operation_id is <=160 and
  starts HIS:, source/transition IDs are <=128;
- every timestamp is canonical 24-character UTC
  YYYY-MM-DDTHH:MM:SS.mmmZ text, with checked separators;
- payload_version = 1 and there is no JSON/payload/note/profile/email/
  fingerprint/envelope/provenance/credential/capability/provider column;
- optional access-ID snapshot is trimmed 1-120 characters; optional correlation
  ID is trimmed 1-128 characters;
- event_type is ACCOUNT_AUDIT, STAFF_LINK, or STAFF_ASSIGNMENT; source_kind is
  respectively AUDIT_LOG, ACCOUNT_STAFF_LINK, or STAFF_ASSIGNMENT; action_code
  is exactly one of ACCOUNT_APPLICATION_ACTIVATED, ACCOUNT_STATUS_CHANGED,
  ACCOUNT_ACCESS_ID_CHANGED, LINK_CREATED, LINK_STATE_CHANGED,
  ASSIGNMENT_CREATED, ASSIGNMENT_STATE_CHANGED, or
  ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED;
- ACCOUNT_AUDIT requires person/account/link, link state ACTIVE, access-ID
  snapshot, audit source, no assignment, and null transition; STAFF_LINK
  requires person/account/link and link-state data, no assignment, and link
  source; STAFF_ASSIGNMENT requires person/assignment and assignment-state data,
  null account/link/access snapshot, and assignment source;
- source_transition_id is null only for audit/create events and required for
  semantic transitions. Enforce unique source identity with partial indexes:
  audit/create source identity and source-transition identity are each unique.

Indexes are person_id/occurred_at DESC/operation_id DESC,
account_id/occurred_at DESC/operation_id DESC, and the source identity indexes.
Ordering never uses insertion sequence or timestamp as a dedupe key. BEFORE
UPDATE/DELETE abort for both new tables. Add BEFORE UPDATE OF id, account_id,
person_id abort triggers to account_staff_links and BEFORE UPDATE OF id,
person_id abort triggers to staff_assignments. Thus source identity cannot
mutate after activation; no existing row is rewritten/backfilled.

## Exact append, identity, and conflict semantics

### Eligible account audit

The dedicated account command performs one D1 transaction/batch in this order:

1. insert audit_context with a pre-generated audit ID, its direct active
   person/account/link/access-ID snapshot, allowed action, and correlation ID;
2. insert audit_log with that same audit ID, entity_type ACCOUNT, matching
   entity_id account ID, and matching correlation ID; and
3. commit both or neither.

The only account projector is AFTER INSERT ON audit_log. It creates history only
when a matching pre-existing context has exact audit/person/account/link/action/
correlation values. Its stable identity is HIS:AUDIT_LOG:<audit-id>, with source
kind AUDIT_LOG and source ID audit-id. It copies context fields, not a current
link query. Because the projector fires only when audit_log is inserted, adding
context after a previously committed audit cannot backfill it. Delayed/replayed
audits without in-transaction context skip. Same audit ID with identical
immutable source/context is idempotent; a different context/action conflicts by
PK/unique/check failure, never a second event.

AUTHENTICATION, non-account, nonexistent-account, missing-context, or invalid
context audit rows are not selected by the projector and continue logging
normally. This excludes rather than guesses their person attribution.

### Link and assignment lifecycle

AFTER INSERT account_staff_links creates LINK_CREATED with stable operation
identity HIS:ACCOUNT_STAFF_LINK:<link-id>:CREATE; AFTER INSERT staff_assignments
creates ASSIGNMENT_CREATED similarly. Both copy only explicit NEW IDs/state/time,
not protected provenance.

Migration 0032 adds nullable activity_transition_id TEXT to both source tables;
existing rows stay null. Every later semantic update must supply a fresh opaque
transition ID: link state, assignment state, or assignment effective-window
change. BEFORE UPDATE rejects a semantic change unless the ID is non-empty,
valid, differs from OLD, and has no existing history operation for its source
row. AFTER UPDATE copies OLD/NEW state/window truth and writes:
HIS:ACCOUNT_STAFF_LINK:<link-id>:<transition-id> or
HIS:STAFF_ASSIGNMENT:<assignment-id>:<transition-id>. Link state uses
LINK_STATE_CHANGED; assignment state uses ASSIGNMENT_STATE_CHANGED; window-only
change uses ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED.

An exact retry with source fields already equal creates no event. Reusing a
transition ID with different OLD/NEW truth aborts. This is operation identity,
not timestamp dedupe. INSERT ON CONFLICT DO NOTHING is allowed only for the
same immutable operation identity; a payload conflict fails. Quarantined/revoked
events retain only non-privileging state and grant no access. Only the audit
projector and source triggers can insert history; history is append-only.

## Read model, authorization, and exact query contract

The route requires opaque canonical personId. query is optional only with
personId and is a case-sensitive exact match to immutable account_id or
account_access_id_snapshot; it never matches name/email/profile/partial text,
roster data, or all persons. Empty, >120-character, or invalid opaque/access-ID
query returns 400. eventType and actionCode are fixed allowlists.

page absent defaults 1; it must otherwise be integer >=1 or returns 400.
pageSize absent/non-integer defaults 25; integer values clamp 5-50. Count and
page statements must share byte-identical personId/query/eventType/actionCode
predicates. Order is occurred_at DESC, operation_id DESC. totalPages is 0 when
total is 0, otherwise ceil(total/pageSize); valid out-of-range pages return
empty items with truthful total/totalPages.

Worker authorization is effective ACCESS_ADMIN, mutation:false, before any
repository read. System Owner access is only through effective capability
mapping, never role inference. Denial causes no read. Legacy
/api/admin/access/history remains separate and has no fallback role.

DTO has no free-form payload:

    {
      personId,
      historyStartsAt,
      items: [{
        id, occurredAt, eventType, actionCode, linkState, previousLinkState,
        assignmentState, previousAssignmentState, accountId,
        accountAccessIdSnapshot, correlationId
      }],
      pagination: { page, pageSize, total, totalPages }
    }

historyStartsAt and the V5 UI state that retained canonical history begins at
migration activation and does not imply pre-activation absence. UI escapes
values, renders safe empty state, and never falls back to protected roster or
legacy account directory. Staff Directory's accepted P3 residual is unchanged:
no live Worker 403; only static ACCESS_ADMIN/mutation:false and browser
denial/no-request evidence are accepted.

## Retention, forward fix, and reconstruction

No audit_log, access_id_history, link, or assignment history is backfilled.
Earlier history remains only on its existing account route. Before applying
0032, separately authorized recovery evidence and schema-version-31 proof are
required. Fresh application proves version 32, tables/indexes/FKs/integrity,
retention/append guards, exact-once/conflict behavior, delayed-audit exclusion,
AUTHENTICATION/non-account safety, OLD/NEW capture, no protected serialization,
equivalent count/page predicates, and zero backfill.

Post-application rollback is forward-only: separately disable/revert the read
route while retaining source/context/history; never drop/delete records.
Reconstruction uses immutable audit_log, context, source link/assignment rows,
transition IDs, and history operation/source identities. A conflict is a
migration/reconciliation failure, never silently rewritten.

## Exact later implementation map

| Responsibility                                  | Owned path and reason                                                                                                                                                                                             |
| ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DDL/version 32/FKs/constraints/indexes/triggers | migrations/0032_staff_account_activity_history.sql                                                                                                                                                                |
| Canonical query and source mutation primitives  | src/server/d1/identity-foundation-repository.js                                                                                                                                                                   |
| Same-transaction audit-context producer         | src/server/d1/access-management-repository.js; the reviewed account-audit boundary                                                                                                                                |
| Safe input/DTO                                  | New src/server/identity-foundation/staff-account-activity-history-service.js                                                                                                                                      |
| Effective-capability route                      | src/worker/index.js                                                                                                                                                                                               |
| Client transport                                | src/services/http-api-adapter.js; src/services/rest-service.js                                                                                                                                                    |
| V5 history view                                 | src/v5/integration/runtime.js; src/v5/integration/view-models.js; src/v5/src/surfaces/admin.js; src/v5/integration/admin-parity.js                                                                                |
| New service proof                               | New tests/unit/staff-account-activity-history-service.test.js                                                                                                                                                     |
| Schema/version/trigger proof                    | tests/unit/identity-foundation-migration.test.js; tests/unit/account-application-migration-integration.test.js; tests/unit/identity-foundation-gate-a-fixture.test.js; tests/unit/v072-migration-contract.test.js |
| Route authorization/denial proof                | tests/unit/identity-foundation-worker-route-contract.test.js                                                                                                                                                      |
| V5/browser proof                                | tests/e2e/v5-current-application-fixtures.js; tests/e2e/v5-current-application.spec.js                                                                                                                            |

No identity-roster, crypto, provider, configuration, generated output, or
unrelated path is owned. Adding a path requires new bounded authorization.

## Regression-first acceptance

1. Capture red tests for absent schema/route before implementation.
2. Prove ordinary, delayed, replayed, AUTHENTICATION, and nonexistent-account
   audits never abort logging or create person history; only pre-context plus
   same-transaction audit creates one account event.
3. Prove link/assignment creates/transitions preserve OLD/NEW truth, stable
   operation identity, no duplicate retry, identity-mutation denial, and no
   protected payload.
4. Prove migration order/version 32, empty fresh fixtures, account-application
   integration, FK/integrity, retention, append guards, and no backfill in all
   four named migration tests.
5. Prove fixed query/pagination, exact count/page predicates, zero totalPages,
   DTO allowlist, ACCESS_ADMIN/mutation:false denial-before-read, and V5
   authorized/denied rendering.
6. Run checks, review full diff, commit/push normally, prove parity. Do not
   apply 0032, freeze a candidate, or deploy in the implementation slice.
