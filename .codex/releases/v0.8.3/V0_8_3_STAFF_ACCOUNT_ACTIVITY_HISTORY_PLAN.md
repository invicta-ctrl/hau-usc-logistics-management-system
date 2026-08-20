# V83 Staff/Account Activity History Plan

INTENT: feature / architecture

OBJECTIVE: Add one provider-free, canonical staff/account activity-history
projection that preserves event-time truth. It must never attach an account
event to a person from a later, name-based, email-based, or otherwise inferred
link.

TARGET: `release/v0.8.3-identity-foundation` after this plan's governance
commit. Later implementation begins only from that clean SHA in an isolated
worktree and only after an independent plan audit accepts this packet.

AUTHORITATIVE SOURCES: `.codex/specs/active/v0.8.3-identity-intake-a5-accepted.md`
sections 1-6 and its accepted implementation envelope; `.codex/specs/v0.7.2-production-access-operations.md`
sections 4, 7, and 13; `.codex/releases/v0.8.3/V0_8_3_SCOPE_COMPLETENESS_MATRIX.md`;
and the provider-free review at `77232d4ad2cb1a79469d61b5fdb1772dcb81d0af`.

IN SCOPE: one additive immutable D1 activity table and triggers; one read-only
canonical projection route/service; bounded client/V5 wiring; focused
regression-first tests; and durable evidence. The route is
`POST /api/admin/staff-activity-history` and calls Worker `authorize` with
`CAPABILITIES.ACCESS_ADMIN` and `mutation: false`.

OUT OF SCOPE: provider/private-source access; identity-roster or crypto access;
protected-envelope/fingerprint/provenance selection or decryption; account,
link, assignment, capability, or access-policy mutation; backfill; destructive
history rewrite; release migration execution; candidate freeze; Playground;
Production; deployment; recovery rotation; and v0.8.4 work.

DELIVERABLES: additive DDL, a safe canonical activity DTO, server-authoritative
read route, V5 rendering, focused tests, and exact migration/evidence records.
No provider or canonical business data is fabricated or changed outside a later
separately authorized migration/application run.

VERIFICATION: regression-first focused migration/repository/service/Worker/V5
tests; portable Node 22.23.2; Node syntax; scoped ESLint/Prettier; privacy and
forbidden-field static scans; migration fresh-apply/constraint proof; complete
logical-diff review; normal commit/push; and local/upstream/live parity.

STOP CONDITIONS: any inferred event-time attribution; protected-data exposure;
audience broadening; provider/private-source need; schema change beyond this
packet; unavailable migration/recovery authority; unknown dirty work; failing
privacy/authorization/migration checks; or any external action outside TARGET.

## Gap and design decision

The existing `/api/admin/access/history` path is an account-management history,
not the required canonical staff/account history. It queries `access_id_history`
and `audit_log` by account ID, while the v0.8.3 canonical tables have no
event-time bridge from an account audit event to `person_id` or an explicit link
record. Attaching a past account event to a person's current link would violate
the no-inference rule.

The smallest safe design is one additive `staff_account_activity_history`
table. It reuses an existing `audit_log` row only when the row was inserted in
the same D1 transaction and the account has exactly one explicit `ACTIVE`
`account_staff_links` row at that instant. It records canonical link and
assignment lifecycle events from their own rows. It neither copies nor decrypts
protected email, assignment, or provenance values.

## Additive schema and event-time contract

Create `migrations/0032_staff_account_activity_history.sql` with the following
logical table and indexes:

```text
staff_account_activity_history
  id TEXT PRIMARY KEY                         # opaque generated event ID
  occurred_at TEXT NOT NULL
  event_type TEXT NOT NULL                    # ACCOUNT_AUDIT | STAFF_LINK | STAFF_ASSIGNMENT
  action TEXT NOT NULL                         # source action, bounded at serialization
  person_id TEXT NULL REFERENCES canonical_people(person_id)
  account_id TEXT NULL REFERENCES accounts(id)
  account_staff_link_id TEXT NULL REFERENCES account_staff_links(id)
  staff_assignment_id TEXT NULL REFERENCES staff_assignments(id)
  link_state TEXT NULL                         # ACTIVE | REVOKED | QUARANTINED
  assignment_state TEXT NULL                   # ACTIVE | HISTORICAL | QUARANTINED
  account_access_id_snapshot TEXT NULL         # access ID only, never a profile/envelope
  correlation_id TEXT NULL
  source_kind TEXT NOT NULL                    # AUDIT_LOG | ACCOUNT_STAFF_LINK | STAFF_ASSIGNMENT
  source_id TEXT NOT NULL
```

The migration adds deterministic indexes on `(person_id, occurred_at DESC, id
DESC)`, `(account_id, occurred_at DESC, id DESC)`, and a uniqueness guard for
the source identity: `UNIQUE(source_kind, source_id, action, occurred_at)`.
It adds `BEFORE UPDATE` and `BEFORE DELETE` abort triggers on the new table.
No existing table, row, or history record is updated, deleted, or backfilled.

Append points are bounded and atomic:

1. `AFTER INSERT` of `audit_log` where `entity_type = 'ACCOUNT'`: append an
   `ACCOUNT_AUDIT` event keyed by the audit row ID. The trigger finds only a
   single explicit `ACTIVE` account-staff link for the audited account. If one
   exists, it snapshots that exact `person_id`, link ID/state, account ID, and
   current access ID in the same transaction. If none exists, it records an
   unattributed account event with `person_id` and link ID `NULL`; it is never
   returned as a person's event.
2. `AFTER INSERT` and semantic `AFTER UPDATE` of `account_staff_links`: append
   `STAFF_LINK` events carrying the row's explicit person/account/link IDs and
   state. A semantic update means a changed state or changed timestamp, not a
   no-op retry. Event IDs are generated in the trigger; source uniqueness and
   application idempotency prevent duplicate visible events.
3. `AFTER INSERT` and semantic `AFTER UPDATE` of `staff_assignments`: append
   `STAFF_ASSIGNMENT` events carrying the explicit person and assignment IDs
   plus assignment state. The event has no account ID unless an explicit link
   row caused a distinct `STAFF_LINK` event.

`ACCOUNT_AUDIT.action` is the existing audit action text, not a new
authorization input. `STAFF_LINK.action` is one of `RECORDED` or
`STATE_CHANGED`; `STAFF_ASSIGNMENT.action` is one of `RECORDED` or
`STATE_CHANGED`. The activity table stores no audit `before_json`, `after_json`,
notes, protected envelope, fingerprint, source provenance, profile name, email,
credential, capability, or provider value. The old account-history endpoint
continues to own account-only detail, including access-ID rename detail.

An account audit entry therefore has event-time attribution only when the
explicit active link existed at that transaction point. Revoked, quarantined,
missing, or ambiguous linkage is recorded only as a safe non-person state and
never grants access or makes a retroactive person-history claim.

## Read model, authorization, and DTO

The later service accepts only the canonical activity repository, validates a
required opaque `personId`, optional `eventType` and `action` filters from fixed
allowlists, `page >= 1`, `pageSize` clamped to 5-50, and a maximum 120-character
query only when it is an opaque person or account identifier. There is no
name/email/profile search and no global history enumeration.

The Worker is the authority boundary. It must authorize effective
`ACCESS_ADMIN` with `mutation: false`; a System Owner is admitted only through
the existing effective capability projection, never by role-only bypass. A
denied caller performs no repository read. The legacy `/api/admin/access/history`
route remains separate and is not weakened or repurposed.

The response is exactly:

```text
{
  personId,
  items: [{
    id, occurredAt, eventType, action, linkState, assignmentState,
    accountId, accountAccessIdSnapshot, correlationId
  }],
  pagination: { page, pageSize, total, totalPages }
}
```

`accountId`, `accountAccessIdSnapshot`, and `correlationId` are emitted only
from the immutable event row; all other raw source columns remain unselected.
The projection is deterministic `occurred_at DESC, id DESC`; an empty result is
`items: []` with normal pagination. The V5 view renders escaped text, an explicit
empty state, and non-privileging states; it does not fetch protected roster or
legacy account-directory data as fallback.

## Existing-history, idempotency, and migration treatment

No historical `audit_log`, `access_id_history`, link, or assignment row is
backfilled: prior events lack trustworthy event-time canonical attribution.
Existing account-history remains readable through its existing route and is not
duplicated. New account audit rows use their immutable audit ID as source ID;
new link/assignment events use their source row plus event timestamp/action.
The source uniqueness guard, semantic-update trigger predicates, and existing
write idempotency ensure a replay/no-op cannot create a second visible event.

Migration application is a separate release decision. Before application,
capture the required accepted recovery evidence and prove the schema/version
baseline. Fresh-apply proof must show table/index/trigger existence, FK and
integrity success, append-only update/delete failures, source uniqueness, exact
event-time link attribution, unattributed account-event exclusion from a person
query, no backfill, and no protected-column serialization. Rollback after
application is forward-only: disable/revert the read route if required while
retaining immutable history; do not drop or delete the table. Reconstruction is
from the retained source audit/link/assignment records plus the event table and
its correlation/source IDs.

## Exact later implementation map

| Responsibility                                     | Owned path                                                                                                                                                                          |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Additive table, indexes, append and guard triggers | `migrations/0032_staff_account_activity_history.sql`                                                                                                                                |
| Canonical activity query                           | `src/server/d1/identity-foundation-repository.js`                                                                                                                                   |
| Input validation and safe DTO                      | New `src/server/identity-foundation/staff-account-activity-history-service.js`                                                                                                      |
| Effective-capability read route                    | `src/worker/index.js`                                                                                                                                                               |
| Client transport                                   | `src/services/http-api-adapter.js`; `src/services/rest-service.js`                                                                                                                  |
| V5 staff-history view                              | `src/v5/integration/runtime.js`; `src/v5/integration/view-models.js`; `src/v5/src/surfaces/admin.js`; `src/v5/integration/admin-parity.js`                                          |
| Focused unit/migration/route proof                 | New `tests/unit/staff-account-activity-history-service.test.js`; `tests/unit/identity-foundation-migration.test.js`; `tests/unit/identity-foundation-worker-route-contract.test.js` |
| Focused V5/browser proof                           | `tests/e2e/v5-current-application-fixtures.js`; `tests/e2e/v5-current-application.spec.js`                                                                                          |

No access-management repository/service rewrite is authorized: the D1 trigger
reuses future immutable account audit rows only at their truthful insertion
point. No identity-roster, crypto, provider, configuration, generated output,
or unrelated history path is owned.

## Regression-first acceptance

1. Capture a focused red test before the DDL/service implementation for absent
   canonical activity history; do not weaken existing account-history tests.
2. Prove account audit events attribute only an exactly active explicit link at
   event time; later link creation, revocation, quarantine, or a different
   person never changes the historical event attribution.
3. Prove link and assignment created/state-change events are append-only,
   deterministic, ordered, replay-safe, and contain no protected payload.
4. Prove the Worker is `ACCESS_ADMIN` plus `mutation:false`, a caller without
   effective capability is denied before reads, and no role-only Owner bypass
   exists.
5. Prove fixed filters/pagination, safe empty state, exact DTO allowlist,
   no provider/roster access, and V5 authorized/denied rendering.
6. Run the verification listed above, review the complete logical diff, commit
   and push normally, and prove local/upstream/live parity. Do not apply the
   migration, freeze a candidate, or deploy in that implementation slice.
