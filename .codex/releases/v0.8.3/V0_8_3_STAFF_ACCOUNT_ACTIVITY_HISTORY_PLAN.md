# V83 Staff/Account Activity History Plan

INTENT: architecture / feature plan

OBJECTIVE: Define the later provider-free, additive canonical staff/account
activity-history slice. Canonical events use only immutable event-time truth;
they never join a delayed audit or source row to the current person, link, name,
email, or effective capability.

TARGET: release/v0.8.3-identity-foundation at the documentation commit produced
from 39ffe79babf92026fbb34b5f2c28c2e4bcd60472. Implementation starts only in an
isolated worktree after a fifth independent plan audit accepts this packet.

AUTHORITATIVE SOURCES: .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md
sections 1-6; .codex/specs/v0.7.2-production-access-operations.md sections 4,
7, and 13; .codex/releases/v0.8.3/V0_8_3_SCOPE_COMPLETENESS_MATRIX.md; the
provider-free gap review at 77232d4ad2cb1a79469d61b5fdb1772dcb81d0af; and the
four Luna rejections repaired by this one authoritative revision.

IN SCOPE: a later additive D1 migration 0032; strict immutable activity and
operation-context tables; trigger-enforced append semantics; an effective
ACCESS_ADMIN read-only route; bounded V5 rendering; regression-first tests; and
durable evidence. The route is POST /api/admin/staff-activity-history with
mutation: false.

OUT OF SCOPE: provider/private-source access; roster or crypto access; protected
envelope, fingerprint, provenance, email, profile, credential, or capability
selection/decryption; fabricated/history backfill; destructive rewrite;
migration execution; candidate freeze; Playground; Production; deployment;
recovery rotation; and v0.8.4 work.

DELIVERABLES: migration 0032, safe read DTO/route/V5 view, focused tests, and
evidence. This plan authorizes none of those product changes yet.

VERIFICATION: regression-first migration/repository/service/Worker/V5 tests on
portable Node 22.23.2; D1/Miniflare and migration-harness compatibility; syntax;
scoped ESLint/Prettier; privacy scans; fresh-migration constraint proof; complete
diff review; normal commit/push; and local/upstream/live parity.

STOP CONDITIONS: inferred attribution; protected-data exposure; audience
broadening; any producer unable to atomically carry required context; D1
incompatibility; provider/private-source need; schema beyond this plan; failing
authorization/privacy/migration/recovery checks; or any external action.

## 1. Exact preserved account taxonomy

This is the whole 0032 account-audit taxonomy. Omitted legacy actions stay
unchanged and are not projected.

| Existing action/entity                                               | Current producer and later owned paths                                                     | Canonical treatment                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| ACCESS_ID_CHANGED / ACCOUNT                                          | src/server/access/service.js; src/server/d1/access-management-repository.js                | Project only from guarded same-batch audit context plus the existing ACCOUNT audit. |
| STARTER_ACCOUNT_CREATED / ACCOUNT, access-management flow            | src/server/access/service.js; src/server/d1/access-management-repository.js                | A distinct truthful source command/audit.                                           |
| STARTER_ACCOUNT_CREATED / ACCOUNT, account-application approval flow | src/server/account-application/service.js; src/server/d1/account-application-repository.js | A distinct truthful source command/audit.                                           |
| ACCOUNT_STATUS_CHANGED / ACCOUNT                                     | src/server/access/service.js; src/server/d1/access-management-repository.js                | Preserve semantics; project only from guarded same-batch context.                   |
| ACCOUNT_APPLICATION_ACTIVATED / ACCOUNT_APPLICATION                  | src/server/account-application/service.js; src/server/d1/account-application-repository.js | Preserve application history; never retype it.                                      |
| ACCOUNT_APPLICATION_ACTIVATED / conditional new ACCOUNT audit        | same account-application transition batch                                                  | Project only with exactly one explicit ACTIVE link at that event.                   |

The two STARTER_ACCOUNT_CREATED events have distinct commands and immutable
ACCOUNT audit IDs. They are not semantic duplicates and are never deduplicated
by account, action, or timestamp. An existing source-command retry creates no
second audit only when that source's idempotency returns its original operation;
otherwise the source fails before a second canonical event. ACCOUNT_ARCHIVED,
AUTHENTICATION, unknown/non-account audits, auth-service starter actions outside
these two D1 account producers, and all other legacy actions are unprojected and
continue their legacy logging without person inference.

## 2. Authoritative literal migration contract

Migration 0032 is additive. It enables foreign keys, creates all strict tables,
indexes, and triggers, then changes app_metadata.operational_schema_version from
31 to 32 in the same successful migration. It never backfills. The following
DDL is authoritative; prose only explains it.

    CREATE TABLE staff_account_activity_history (
      event_id TEXT PRIMARY KEY
        CHECK (
          length(event_id) = 36 AND substr(event_id, 1, 4) = 'HIS-'
          AND substr(event_id, 5) NOT GLOB '*[^0-9a-f]*'
        ),
      occurred_at TEXT NOT NULL CHECK (
        occurred_at = trim(occurred_at) AND length(occurred_at) = 24
        AND substr(occurred_at, 5, 1) = '-' AND substr(occurred_at, 8, 1) = '-'
        AND substr(occurred_at, 11, 1) = 'T' AND substr(occurred_at, 14, 1) = ':'
        AND substr(occurred_at, 17, 1) = ':' AND substr(occurred_at, 20, 1) = '.'
        AND substr(occurred_at, 24, 1) = 'Z'
      ),
      event_type TEXT NOT NULL CHECK (
        event_type IN ('ACCOUNT_AUDIT', 'ACCOUNT_STAFF_LINK', 'STAFF_ASSIGNMENT')
      ),
      action_code TEXT NOT NULL CHECK (
        action_code IN (
          'ACCESS_ID_CHANGED', 'STARTER_ACCOUNT_CREATED',
          'ACCOUNT_STATUS_CHANGED', 'ACCOUNT_APPLICATION_ACTIVATED',
          'LINK_CREATED', 'LINK_STATE_CHANGED', 'ASSIGNMENT_CREATED',
          'ASSIGNMENT_STATE_CHANGED', 'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED'
        ) AND action_code = trim(action_code) AND length(action_code) <= 64
      ),
      person_id TEXT NOT NULL CHECK (
        person_id = trim(person_id) AND length(person_id) BETWEEN 1 AND 128
      ),
      account_id TEXT CHECK (
        account_id IS NULL OR (account_id = trim(account_id)
          AND length(account_id) BETWEEN 1 AND 128)
      ),
      account_staff_link_id TEXT CHECK (
        account_staff_link_id IS NULL OR (account_staff_link_id = trim(account_staff_link_id)
          AND length(account_staff_link_id) BETWEEN 1 AND 128)
      ),
      staff_assignment_id TEXT CHECK (
        staff_assignment_id IS NULL OR (staff_assignment_id = trim(staff_assignment_id)
          AND length(staff_assignment_id) BETWEEN 1 AND 128)
      ),
      link_state TEXT,
      previous_link_state TEXT,
      assignment_state TEXT,
      previous_assignment_state TEXT,
      old_effective_from TEXT,
      old_effective_to TEXT,
      new_effective_from TEXT,
      new_effective_to TEXT,
      account_access_id_snapshot TEXT CHECK (
        account_access_id_snapshot IS NULL OR (
          account_access_id_snapshot = trim(account_access_id_snapshot)
          AND length(account_access_id_snapshot) BETWEEN 1 AND 120
        )
      ),
      correlation_id TEXT CHECK (
        correlation_id IS NULL OR (
          correlation_id = trim(correlation_id)
          AND length(correlation_id) BETWEEN 1 AND 128
        )
      ),
      source_kind TEXT NOT NULL CHECK (
        source_kind IN ('ACCOUNT_AUDIT', 'ACCOUNT_STAFF_LINK', 'STAFF_ASSIGNMENT')
      ),
      source_id TEXT NOT NULL CHECK (
        source_id = trim(source_id) AND length(source_id) BETWEEN 1 AND 128
      ),
      source_event_id TEXT NOT NULL,
      payload_version INTEGER NOT NULL DEFAULT 1 CHECK (payload_version = 1),
      CHECK (
        source_event_id = trim(source_event_id) AND (
          (source_kind = 'ACCOUNT_AUDIT'
            AND length(source_event_id) BETWEEN 1 AND 128
            AND source_event_id = source_id)
          OR
          (source_kind IN ('ACCOUNT_STAFF_LINK', 'STAFF_ASSIGNMENT')
            AND length(source_event_id) = 36
            AND substr(source_event_id, 1, 4) = 'TRN-'
            AND substr(source_event_id, 5) NOT GLOB '*[^0-9a-f]*')
        )
      ),
      CHECK (
        (source_kind = 'ACCOUNT_AUDIT' AND event_type = 'ACCOUNT_AUDIT'
          AND action_code IN ('ACCESS_ID_CHANGED', 'STARTER_ACCOUNT_CREATED',
            'ACCOUNT_STATUS_CHANGED', 'ACCOUNT_APPLICATION_ACTIVATED')
          AND account_id IS NOT NULL AND account_staff_link_id IS NOT NULL
          AND link_state = 'ACTIVE' AND account_access_id_snapshot IS NOT NULL
          AND staff_assignment_id IS NULL AND assignment_state IS NULL
          AND previous_assignment_state IS NULL
          AND old_effective_from IS NULL AND old_effective_to IS NULL
          AND new_effective_from IS NULL AND new_effective_to IS NULL)
        OR
        (source_kind = 'ACCOUNT_STAFF_LINK' AND event_type = 'ACCOUNT_STAFF_LINK'
          AND action_code IN ('LINK_CREATED', 'LINK_STATE_CHANGED')
          AND account_id IS NOT NULL AND account_staff_link_id = source_id
          AND link_state IS NOT NULL AND staff_assignment_id IS NULL
          AND assignment_state IS NULL AND previous_assignment_state IS NULL
          AND account_access_id_snapshot IS NULL
          AND old_effective_from IS NULL AND old_effective_to IS NULL
          AND new_effective_from IS NULL AND new_effective_to IS NULL
          AND ((action_code = 'LINK_CREATED' AND previous_link_state IS NULL)
            OR (action_code = 'LINK_STATE_CHANGED'
              AND previous_link_state IS NOT NULL)))
        OR
        (source_kind = 'STAFF_ASSIGNMENT' AND event_type = 'STAFF_ASSIGNMENT'
          AND action_code IN ('ASSIGNMENT_CREATED', 'ASSIGNMENT_STATE_CHANGED',
            'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED')
          AND staff_assignment_id = source_id AND assignment_state IS NOT NULL
          AND account_id IS NULL AND account_staff_link_id IS NULL
          AND link_state IS NULL AND previous_link_state IS NULL
          AND account_access_id_snapshot IS NULL
          AND ((action_code = 'ASSIGNMENT_CREATED'
              AND previous_assignment_state IS NULL
              AND old_effective_from IS NULL AND old_effective_to IS NULL)
            OR (action_code = 'ASSIGNMENT_STATE_CHANGED'
              AND previous_assignment_state IS NOT NULL)
            OR (action_code = 'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED'
              AND previous_assignment_state IS NOT NULL
              AND (old_effective_from IS NOT new_effective_from
                OR old_effective_to IS NOT new_effective_to))))
      ),
      CHECK (
        (old_effective_from IS NULL OR (
          old_effective_from = trim(old_effective_from)
          AND length(old_effective_from) = 24))
        AND (old_effective_to IS NULL OR (
          old_effective_to = trim(old_effective_to)
          AND length(old_effective_to) = 24))
        AND (new_effective_from IS NULL OR (
          new_effective_from = trim(new_effective_from)
          AND length(new_effective_from) = 24))
        AND (new_effective_to IS NULL OR (
          new_effective_to = trim(new_effective_to)
          AND length(new_effective_to) = 24))
      ),
      UNIQUE (source_kind, source_id, source_event_id)
    ) STRICT;

The event generator is exactly:

    'HIS-' || lower(hex(randomblob(16)))

No abs(random()), timestamp, or external function is used. The window columns
are safe DTO fields oldEffectiveFrom, oldEffectiveTo, newEffectiveFrom, and
newEffectiveTo. They are explicit OLD/NEW source truth: NULL means explicitly
unset, not unknown; unproven source truth produces no event. The 24-character
window checks use the same exact separator predicate as occurred_at above.
Non-null identity FKs are ON DELETE RESTRICT; lookup indexes are person_id plus
occurred_at/event_id, account_id plus occurred_at/event_id, and the unique
source-operation key. BEFORE UPDATE OR DELETE aborts on history.

## 3. Persisted account-audit and transition context

The audit table remains strict:

    CREATE TABLE staff_account_activity_audit_context (
      audit_id TEXT PRIMARY KEY CHECK (
        audit_id = trim(audit_id) AND length(audit_id) BETWEEN 1 AND 128
      ),
      person_id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      account_staff_link_id TEXT NOT NULL,
      link_state TEXT NOT NULL CHECK (link_state = 'ACTIVE'),
      account_access_id_snapshot TEXT NOT NULL,
      action_code TEXT NOT NULL CHECK (
        action_code IN ('ACCESS_ID_CHANGED', 'STARTER_ACCOUNT_CREATED',
          'ACCOUNT_STATUS_CHANGED', 'ACCOUNT_APPLICATION_ACTIVATED')
      ),
      correlation_id TEXT NOT NULL,
      prepared_at TEXT NOT NULL,
      FOREIGN KEY (audit_id) REFERENCES audit_log(id)
        DEFERRABLE INITIALLY DEFERRED ON DELETE RESTRICT,
      FOREIGN KEY (person_id) REFERENCES canonical_people(person_id)
        ON DELETE RESTRICT,
      FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE RESTRICT,
      FOREIGN KEY (account_staff_link_id) REFERENCES account_staff_links(id)
        ON DELETE RESTRICT
    ) STRICT;

Link and assignment triggers cannot receive an out-of-band parameter. The
required persisted operation context is therefore literal state in this table:

    CREATE TABLE staff_account_activity_transition_context (
      transition_id TEXT PRIMARY KEY CHECK (
        length(transition_id) = 36 AND substr(transition_id, 1, 4) = 'TRN-'
        AND substr(transition_id, 5) NOT GLOB '*[^0-9a-f]*'
      ),
      source_kind TEXT NOT NULL CHECK (
        source_kind IN ('ACCOUNT_STAFF_LINK', 'STAFF_ASSIGNMENT')
      ),
      source_id TEXT NOT NULL CHECK (
        source_id = trim(source_id) AND length(source_id) BETWEEN 1 AND 128
      ),
      action_code TEXT NOT NULL CHECK (
        action_code IN ('LINK_CREATED', 'LINK_STATE_CHANGED',
          'ASSIGNMENT_CREATED', 'ASSIGNMENT_STATE_CHANGED',
          'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED')
      ),
      person_id TEXT NOT NULL CHECK (
        person_id = trim(person_id) AND length(person_id) BETWEEN 1 AND 128
      ),
      account_id TEXT,
      old_link_state TEXT,
      new_link_state TEXT,
      old_assignment_state TEXT,
      new_assignment_state TEXT,
      old_effective_from TEXT,
      old_effective_to TEXT,
      new_effective_from TEXT,
      new_effective_to TEXT,
      correlation_id TEXT CHECK (
        correlation_id IS NULL OR (
          correlation_id = trim(correlation_id)
          AND length(correlation_id) BETWEEN 1 AND 128
        )
      ),
      created_at TEXT NOT NULL CHECK (
        created_at = trim(created_at) AND length(created_at) = 24
        AND substr(created_at, 5, 1) = '-' AND substr(created_at, 8, 1) = '-'
        AND substr(created_at, 11, 1) = 'T' AND substr(created_at, 14, 1) = ':'
        AND substr(created_at, 17, 1) = ':' AND substr(created_at, 20, 1) = '.'
        AND substr(created_at, 24, 1) = 'Z'
      ),
      CHECK (
        (source_kind = 'ACCOUNT_STAFF_LINK'
          AND action_code IN ('LINK_CREATED', 'LINK_STATE_CHANGED')
          AND account_id IS NOT NULL AND new_link_state IS NOT NULL
          AND old_assignment_state IS NULL AND new_assignment_state IS NULL
          AND old_effective_from IS NULL AND old_effective_to IS NULL
          AND new_effective_from IS NULL AND new_effective_to IS NULL
          AND ((action_code = 'LINK_CREATED' AND old_link_state IS NULL)
            OR (action_code = 'LINK_STATE_CHANGED'
              AND old_link_state IS NOT NULL)))
        OR
        (source_kind = 'STAFF_ASSIGNMENT'
          AND action_code IN ('ASSIGNMENT_CREATED', 'ASSIGNMENT_STATE_CHANGED',
            'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED')
          AND account_id IS NULL AND new_assignment_state IS NOT NULL
          AND old_link_state IS NULL AND new_link_state IS NULL
          AND ((action_code = 'ASSIGNMENT_CREATED'
              AND old_assignment_state IS NULL
              AND old_effective_from IS NULL AND old_effective_to IS NULL)
            OR (action_code IN ('ASSIGNMENT_STATE_CHANGED',
                'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED')
              AND old_assignment_state IS NOT NULL)))
      ),
      CHECK (
        (old_effective_from IS NULL OR (
          old_effective_from = trim(old_effective_from)
          AND length(old_effective_from) = 24))
        AND (old_effective_to IS NULL OR (
          old_effective_to = trim(old_effective_to)
          AND length(old_effective_to) = 24))
        AND (new_effective_from IS NULL OR (
          new_effective_from = trim(new_effective_from)
          AND length(new_effective_from) = 24))
        AND (new_effective_to IS NULL OR (
          new_effective_to = trim(new_effective_to)
          AND length(new_effective_to) = 24))
      ),
      UNIQUE (source_kind, source_id, transition_id)
    ) STRICT;

Its four window fields use the exact 24-character/null predicate from the
history DDL. The source ID intentionally has no FK: CREATE needs its generated
future source ID before that row exists. Every source mutation trigger instead
requires the exact context source_kind/source_id/action, person, account where
applicable, and OLD/NEW state/window snapshot to match the row it receives.

For every link/assignment CREATE or semantic UPDATE, the guarded context INSERT
generates its ID in D1 as TRN- plus lower(hex(randomblob(16))). The exact order
is: validate bounded context and expected OLD/NEW truth; guarded context INSERT;
guarded source INSERT or UPDATE using those same expected values; AFTER trigger
INSERT ... SELECT history only on exact context match; DELETE that consumed
transition context in the same trigger. The final source mutation is atomic with
context/history/cleanup. A source constraint or trigger failure rolls back the
whole batch.

No-op updates return before context insertion. An update with stale OLD values,
missing context, mismatched source ID/action/person/account/window, malformed
context, or a context that cannot exactly match causes the source mutation to
abort; there is no fallback lookup or projection. A retry after a committed
transition sees the requested source state already present and is a no-op with
no new context/history. Reusing a TRN ID for a different operation conflicts on
the history source-operation key and aborts the new source mutation without
touching the prior event. A persisted stale context cannot be committed by the
guarded batch; the only successful path consumes it. Migration starts empty and
does not backfill.

Identity source columns remain immutable: canonical_people.person_id;
account_staff_links.id/account_id/person_id; and
staff_assignments.id/person_id/assignment_fingerprint. BEFORE UPDATE triggers
abort every such mutation, including assignment_fingerprint. A fingerprint
change requires a separately authorized new assignment row.

## 4. Account audit ordering and safe exclusion

For ACCESS_ID_CHANGED, both STARTER_ACCOUNT_CREATED producers, and
ACCOUNT_STATUS_CHANGED, the D1 batch prepares validated audit context immediately
before the existing ACCOUNT audit INSERT. Its INSERT ... SELECT requires exactly
one ACTIVE explicit account_staff_links row and copies direct person/link/access
snapshot, action, and correlation. Invalid, missing, ambiguous, revoked,
quarantined, sentinel, malformed, or oversized truth writes zero context rows;
the existing legacy audit still commits and projects nothing.

The account-application activation batch receives no new command input. After
its guarded transition and application-history writes it runs:

1. guarded INSERT ... SELECT into staff_account_activity_audit_context, selected
   by activated account ID and exactly one ACTIVE explicit link;
2. guarded INSERT INTO audit_log ... SELECT with one shared generated audit ID
   only when that context exists; and
3. the existing ACCOUNT_APPLICATION audit INSERT unchanged.

Absent/ambiguous/sentinel/malformed proof makes both new ACCOUNT rows zero-row;
activation and the existing APPLICATION audit commit. The audit trigger projects
one event only on exact audit/context match, then consumes context. It has no
RAISE path for non-account, AUTHENTICATION, nonexistent-account, delayed, or
replayed audit rows. Those legacy rows remain loggable and unprojected.

## 5. Read route and safe DTO

POST /api/admin/staff-activity-history checks effective ACCESS_ADMIN with
mutation: false before any read. System Owner uses only existing effective
capability mapping; person/link presence grants nothing. Denial causes no read.
The legacy access-history route remains separate.

personId is required. query is optional only with personId and exact-matches
account_id or account_access_id_snapshot, never names/emails/profiles/roster
data/partial text. Invalid/empty/over-120 query returns 400. eventType and
actionCode are fixed allowlists. page defaults 1 or is integer >=1; pageSize
defaults 25 for absent/non-integer and clamps integers 5-50. Count and page have
identical predicates and sort occurred_at DESC, event_id DESC. totalPages is
zero when total is zero.

The DTO is exactly personId, historyStartsAt, and items of id, occurredAt,
eventType, actionCode, accountId, accountAccessIdSnapshot, correlationId,
linkState, previousLinkState, assignmentState, previousAssignmentState,
oldEffectiveFrom, oldEffectiveTo, newEffectiveFrom, and newEffectiveTo, plus
pagination page/pageSize/total/totalPages. No protected/free-form field exists.
historyStartsAt and V5 say retained history starts at migration activation and
does not imply pre-activation absence.

## 6. Exact later implementation and evidence ownership

| Responsibility                                                               | Exact owned paths                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DDL/version 32/constraints/contexts/triggers/indexes                         | migrations/0032_staff_account_activity_history.sql                                                                                                                                                                      |
| Canonical read query and link/assignment mutation primitives                 | src/server/d1/identity-foundation-repository.js                                                                                                                                                                         |
| Access ID, access-management starter, status audit context                   | src/server/access/service.js; src/server/d1/access-management-repository.js                                                                                                                                             |
| Account-application starter and conditional activation account audit/context | src/server/account-application/service.js; src/server/d1/account-application-repository.js                                                                                                                              |
| Input/DTO                                                                    | new src/server/identity-foundation/staff-account-activity-history-service.js                                                                                                                                            |
| Route/HTTP/V5                                                                | src/worker/index.js; src/services/http-api-adapter.js; src/services/rest-service.js; src/v5/integration/runtime.js; src/v5/integration/view-models.js; src/v5/src/surfaces/admin.js; src/v5/integration/admin-parity.js |
| Service proof                                                                | new tests/unit/staff-account-activity-history-service.test.js                                                                                                                                                           |
| Version/order/fresh schema proof                                             | tests/unit/identity-foundation-migration.test.js; tests/unit/account-application-migration-integration.test.js; tests/unit/identity-foundation-gate-a-fixture.test.js; tests/unit/v072-migration-contract.test.js       |
| Direct producer and real Miniflare D1 proof                                  | tests/unit/access-management-repository.test.js; tests/unit/account-application-service.test.js; tests/unit/account-application-repository.test.js                                                                      |
| Route denial and browser/V5 proof                                            | tests/unit/identity-foundation-worker-route-contract.test.js; tests/e2e/v5-current-application-fixtures.js; tests/e2e/v5-current-application.spec.js; tests/cloudflare-e2e/local-worker.spec.js                         |

tests/unit/access-management-repository.test.js is the actual Miniflare D1
seam. Its reduced fixture must apply 0031 then 0032 and execute the real
account-application guarded context plus ACCOUNT-audit SQL, not merely a
synthetic ordering probe. It seeds only synthetic safe data and proves the
valid exactly-one-ACTIVE-link projection; absent, ambiguous, sentinel, and
malformed zero-row context/audit behavior; and successful legacy APPLICATION
audit/activation. It also proves STRICT/deferred-FK, trigger ordering, both
STARTER producers, ACCESS_ID_CHANGED, ACCOUNT_STATUS_CHANGED, transition
CREATE/update consume/cleanup, no-op/retry/conflicting-TRN behavior,
OLD/NEW windows, identity guards, and no protected serialization.

The account-application unit tests can retain a synthetic probe solely to verify
service/repository statement ordering. They also prove direct producer taxonomy.
tests/cloudflare-e2e/local-worker.spec.js is only the real Worker HTTP startup
and authorization harness; it does not claim Miniflare migration/trigger control.
No additional fixture/script path is needed.

## 7. Acceptance, recovery, and boundaries

1. Capture red migration/route tests before implementation.
2. Apply 0031 then 0032 in both existing migration and Miniflare fixtures.
   Prove version 32, strict/deferred-FK compatibility, literal checks, indexes,
   exact triggers, append guards, and zero backfill.
3. Execute the real activation guarded SQL in Miniflare for valid and each
   zero-row safety branch while confirming the original application audit still
   succeeds.
4. Prove all named producer mappings, persisted transition-context exact match,
   source mutation rollback, no-op/retry/conflict behavior, identity/fingerprint
   guards, and OLD/NEW window truth.
5. Prove DTO allowlist/query/pagination, authorization denial-before-read, and
   V5 authorized/denied rendering.
6. Run focused checks, full diff review, normal commit/push, and parity. Do not
   apply 0032, freeze a candidate, or deploy in its implementation slice.

Pre-application requires separately authorized recovery evidence and schema-31
proof. Post-application rollback is forward-only: disable/revert the route while
retaining source/context/history. Reconstruction uses immutable audit/context/
source rows, TRN IDs, and source-operation identities. A conflict is a
reconciliation failure, never a silent rewrite.
