# V83 Staff/Account Activity History: Authoritative Implementation Contract

STATUS: PLAN_REPAIRED_AFTER_SEVENTH_LUNA_AUDIT_REJECTION; PLAN_ONLY;
IMPLEMENTATION_NOT_AUTHORIZED

INTENT: architecture / feature plan

OBJECTIVE: Define the one later, provider-free, additive canonical
staff/account activity-history contract. It records only immutable event-time
truth, never derives a person, link, name, email, capability, or effective date
from a later state.

TARGET: release/v0.8.3-identity-foundation after
82a7d66ac0d8c5921af037629c78af373d27c912. This document is the sole
authoritative activity-history contract; no earlier draft, amendment, or
superseded section has independent force.

AUTHORITATIVE SOURCES: .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md
sections 1–6; .codex/specs/v0.7.2-production-access-operations.md sections 4,
7, and 13; .codex/releases/v0.8.3/V0_8_3_SCOPE_COMPLETENESS_MATRIX.md; the
provider-free gap review at 77232d4ad2cb1a79469d61b5fdb1772dcb81d0af; and the
seventh Luna audit findings repaired by this revision.

IN SCOPE: a later additive D1 migration 0032; strict immutable history and
operation-context tables; trigger-enforced source projection and retention;
effective ACCESS_ADMIN read-only access; bounded V5 rendering; focused
regression evidence; and a durable plan-only commit.

OUT OF SCOPE: this turn creates or applies no migration and changes no product
source, tests, configuration, package, workflow, generated artifact, provider,
private source, roster, crypto, canonical data, candidate, Playground,
Production, deployment, recovery pointer, or v0.8.4 state.

DELIVERABLES: this exact plan only. It authorizes no implementation, schema
application, backfill, import, provider access, candidate freeze, or deploy.

## 1. Non-negotiable invariants

- IDs are opaque, never derived from people or business values:
  `'HIS-' || lower(hex(randomblob(16)))` and
  `'TRN-' || lower(hex(randomblob(16)))`. Both are 36 characters: their
  prefix plus exactly 32 lowercase hexadecimal characters.
- Every non-null identifier is trimmed and length 1–128 unless the literal DDL
  sets a narrower bound. Every canonical timestamp is trimmed, exactly 24
  characters, and has the exact UTC lexical form
  `YYYY-MM-DDTHH:MM:SS.mmmZ`.
- The UTC predicate is literal in every history, audit-context, and
  transition-context timestamp CHECK. It checks all digit positions and all
  separators; it is not a prose-only convention. Producers must also validate
  real calendar semantics before binding a value.
- History rows are append-only. A context is short-lived transaction
  coordination, not recovery evidence: source triggers consume it only after
  successfully inserting its one matching history row. Context rows reject
  UPDATE, but they deliberately permit the consuming trigger's DELETE.
- The existing `audit_log_no_update` and `audit_log_no_delete` triggers remain
  the retention guard for ACCOUNT_AUDIT sources. This migration adds the
  corresponding retained-source DELETE guards for link and assignment sources;
  it does not weaken or duplicate the existing audit-log append-only contract.
- An account-to-person link remains identity only. It grants no authorization.
  The route uses the existing effective capability projection; no role-only,
  person-link, client-side, name, email, or department inference is allowed.
- The migration is additive, enables foreign keys, starts from schema 31,
  changes it to 32 only on successful migration completion, and never
  backfills or fabricates activity before activation.

The following is the canonical SQLite/D1 UTC predicate. The DDL below expands it
literally rather than relying on this mnemonic:

```sql
value = trim(value)
AND length(value) = 24
AND substr(value, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
AND substr(value, 5, 1) = '-'
AND substr(value, 6, 2) GLOB '[0-9][0-9]'
AND substr(value, 8, 1) = '-'
AND substr(value, 9, 2) GLOB '[0-9][0-9]'
AND substr(value, 11, 1) = 'T'
AND substr(value, 12, 2) GLOB '[0-9][0-9]'
AND substr(value, 14, 1) = ':'
AND substr(value, 15, 2) GLOB '[0-9][0-9]'
AND substr(value, 17, 1) = ':'
AND substr(value, 18, 2) GLOB '[0-9][0-9]'
AND substr(value, 20, 1) = '.'
AND substr(value, 21, 3) GLOB '[0-9][0-9][0-9]'
AND substr(value, 24, 1) = 'Z'
```

## 2. Exact proposed migration 0032 SQL

The SQL below is the executable proposed migration contract. It has no
ellipsis, pseudo-trigger, or prose-only action/null rule.

<!-- BEGIN V83_ACTIVITY_HISTORY_SQL -->

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE staff_account_activity_history (
  event_id TEXT PRIMARY KEY NOT NULL CHECK (
    event_id = trim(event_id)
    AND length(event_id) = 36
    AND substr(event_id, 1, 4) = 'HIS-'
    AND substr(event_id, 5) NOT GLOB '*[^0-9a-f]*'
  ),
  occurred_at TEXT NOT NULL CHECK (
    occurred_at = trim(occurred_at)
    AND length(occurred_at) = 24
    AND substr(occurred_at, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
    AND substr(occurred_at, 5, 1) = '-'
    AND substr(occurred_at, 6, 2) GLOB '[0-9][0-9]'
    AND substr(occurred_at, 8, 1) = '-'
    AND substr(occurred_at, 9, 2) GLOB '[0-9][0-9]'
    AND substr(occurred_at, 11, 1) = 'T'
    AND substr(occurred_at, 12, 2) GLOB '[0-9][0-9]'
    AND substr(occurred_at, 14, 1) = ':'
    AND substr(occurred_at, 15, 2) GLOB '[0-9][0-9]'
    AND substr(occurred_at, 17, 1) = ':'
    AND substr(occurred_at, 18, 2) GLOB '[0-9][0-9]'
    AND substr(occurred_at, 20, 1) = '.'
    AND substr(occurred_at, 21, 3) GLOB '[0-9][0-9][0-9]'
    AND substr(occurred_at, 24, 1) = 'Z'
  ),
  event_type TEXT NOT NULL CHECK (
    event_type IN ('ACCOUNT_AUDIT', 'ACCOUNT_STAFF_LINK', 'STAFF_ASSIGNMENT')
  ),
  action_code TEXT NOT NULL CHECK (
    action_code = trim(action_code)
    AND length(action_code) BETWEEN 1 AND 64
    AND action_code IN (
      'ACCESS_ID_CHANGED',
      'STARTER_ACCOUNT_CREATED',
      'ACCOUNT_STATUS_CHANGED',
      'ACCOUNT_APPLICATION_ACTIVATED',
      'LINK_CREATED',
      'LINK_STATE_CHANGED',
      'ASSIGNMENT_CREATED',
      'ASSIGNMENT_STATE_CHANGED',
      'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED'
    )
  ),
  person_id TEXT NOT NULL CHECK (
    person_id = trim(person_id) AND length(person_id) BETWEEN 1 AND 128
  ) REFERENCES canonical_people(person_id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  account_id TEXT CHECK (
    account_id IS NULL OR (account_id = trim(account_id) AND length(account_id) BETWEEN 1 AND 128)
  ) REFERENCES accounts(id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  account_staff_link_id TEXT CHECK (
    account_staff_link_id IS NULL
    OR (account_staff_link_id = trim(account_staff_link_id)
      AND length(account_staff_link_id) BETWEEN 1 AND 128)
  ) REFERENCES account_staff_links(id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  staff_assignment_id TEXT CHECK (
    staff_assignment_id IS NULL
    OR (staff_assignment_id = trim(staff_assignment_id)
      AND length(staff_assignment_id) BETWEEN 1 AND 128)
  ) REFERENCES staff_assignments(id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  link_state TEXT CHECK (
    link_state IS NULL OR link_state IN ('ACTIVE', 'REVOKED', 'QUARANTINED')
  ),
  previous_link_state TEXT CHECK (
    previous_link_state IS NULL
    OR previous_link_state IN ('ACTIVE', 'REVOKED', 'QUARANTINED')
  ),
  assignment_state TEXT CHECK (
    assignment_state IS NULL OR assignment_state IN ('ACTIVE', 'HISTORICAL', 'QUARANTINED')
  ),
  previous_assignment_state TEXT CHECK (
    previous_assignment_state IS NULL
    OR previous_assignment_state IN ('ACTIVE', 'HISTORICAL', 'QUARANTINED')
  ),
  old_effective_from TEXT CHECK (
    old_effective_from IS NULL OR (
      old_effective_from = trim(old_effective_from)
      AND length(old_effective_from) = 24
      AND substr(old_effective_from, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
      AND substr(old_effective_from, 5, 1) = '-'
      AND substr(old_effective_from, 6, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_from, 8, 1) = '-'
      AND substr(old_effective_from, 9, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_from, 11, 1) = 'T'
      AND substr(old_effective_from, 12, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_from, 14, 1) = ':'
      AND substr(old_effective_from, 15, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_from, 17, 1) = ':'
      AND substr(old_effective_from, 18, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_from, 20, 1) = '.'
      AND substr(old_effective_from, 21, 3) GLOB '[0-9][0-9][0-9]'
      AND substr(old_effective_from, 24, 1) = 'Z'
    )
  ),
  old_effective_to TEXT CHECK (
    old_effective_to IS NULL OR (
      old_effective_to = trim(old_effective_to)
      AND length(old_effective_to) = 24
      AND substr(old_effective_to, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
      AND substr(old_effective_to, 5, 1) = '-'
      AND substr(old_effective_to, 6, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_to, 8, 1) = '-'
      AND substr(old_effective_to, 9, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_to, 11, 1) = 'T'
      AND substr(old_effective_to, 12, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_to, 14, 1) = ':'
      AND substr(old_effective_to, 15, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_to, 17, 1) = ':'
      AND substr(old_effective_to, 18, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_to, 20, 1) = '.'
      AND substr(old_effective_to, 21, 3) GLOB '[0-9][0-9][0-9]'
      AND substr(old_effective_to, 24, 1) = 'Z'
    )
  ),
  new_effective_from TEXT CHECK (
    new_effective_from IS NULL OR (
      new_effective_from = trim(new_effective_from)
      AND length(new_effective_from) = 24
      AND substr(new_effective_from, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
      AND substr(new_effective_from, 5, 1) = '-'
      AND substr(new_effective_from, 6, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_from, 8, 1) = '-'
      AND substr(new_effective_from, 9, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_from, 11, 1) = 'T'
      AND substr(new_effective_from, 12, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_from, 14, 1) = ':'
      AND substr(new_effective_from, 15, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_from, 17, 1) = ':'
      AND substr(new_effective_from, 18, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_from, 20, 1) = '.'
      AND substr(new_effective_from, 21, 3) GLOB '[0-9][0-9][0-9]'
      AND substr(new_effective_from, 24, 1) = 'Z'
    )
  ),
  new_effective_to TEXT CHECK (
    new_effective_to IS NULL OR (
      new_effective_to = trim(new_effective_to)
      AND length(new_effective_to) = 24
      AND substr(new_effective_to, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
      AND substr(new_effective_to, 5, 1) = '-'
      AND substr(new_effective_to, 6, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_to, 8, 1) = '-'
      AND substr(new_effective_to, 9, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_to, 11, 1) = 'T'
      AND substr(new_effective_to, 12, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_to, 14, 1) = ':'
      AND substr(new_effective_to, 15, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_to, 17, 1) = ':'
      AND substr(new_effective_to, 18, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_to, 20, 1) = '.'
      AND substr(new_effective_to, 21, 3) GLOB '[0-9][0-9][0-9]'
      AND substr(new_effective_to, 24, 1) = 'Z'
    )
  ),
  account_access_id_snapshot TEXT CHECK (
    account_access_id_snapshot IS NULL
    OR (account_access_id_snapshot = trim(account_access_id_snapshot)
      AND length(account_access_id_snapshot) BETWEEN 1 AND 120)
  ),
  correlation_id TEXT NOT NULL CHECK (
    correlation_id = trim(correlation_id) AND length(correlation_id) BETWEEN 1 AND 128
  ),
  source_kind TEXT NOT NULL CHECK (
    source_kind IN ('ACCOUNT_AUDIT', 'ACCOUNT_STAFF_LINK', 'STAFF_ASSIGNMENT')
  ),
  source_id TEXT NOT NULL CHECK (
    source_id = trim(source_id) AND length(source_id) BETWEEN 1 AND 128
  ),
  source_event_id TEXT NOT NULL CHECK (
    source_event_id = trim(source_event_id) AND length(source_event_id) BETWEEN 1 AND 128
  ),
  transition_id TEXT UNIQUE CHECK (
    transition_id IS NULL OR (
      transition_id = trim(transition_id)
      AND length(transition_id) = 36
      AND substr(transition_id, 1, 4) = 'TRN-'
      AND substr(transition_id, 5) NOT GLOB '*[^0-9a-f]*'
    )
  ),
  payload_version INTEGER NOT NULL DEFAULT 1 CHECK (payload_version = 1),
  UNIQUE (source_kind, source_id, source_event_id),
  CHECK (
    (
      source_kind = 'ACCOUNT_AUDIT'
      AND event_type = 'ACCOUNT_AUDIT'
      AND action_code IN (
        'ACCESS_ID_CHANGED',
        'STARTER_ACCOUNT_CREATED',
        'ACCOUNT_STATUS_CHANGED',
        'ACCOUNT_APPLICATION_ACTIVATED'
      )
      AND source_event_id = source_id
      AND transition_id IS NULL
      AND account_id IS NOT NULL
      AND account_staff_link_id IS NOT NULL
      AND staff_assignment_id IS NULL
      AND link_state = 'ACTIVE'
      AND previous_link_state IS NULL
      AND assignment_state IS NULL
      AND previous_assignment_state IS NULL
      AND old_effective_from IS NULL
      AND old_effective_to IS NULL
      AND new_effective_from IS NULL
      AND new_effective_to IS NULL
      AND account_access_id_snapshot IS NOT NULL
    )
    OR (
      source_kind = 'ACCOUNT_STAFF_LINK'
      AND event_type = 'ACCOUNT_STAFF_LINK'
      AND action_code IN ('LINK_CREATED', 'LINK_STATE_CHANGED')
      AND source_id = account_staff_link_id
      AND source_event_id = transition_id
      AND transition_id IS NOT NULL
      AND account_id IS NOT NULL
      AND account_staff_link_id IS NOT NULL
      AND staff_assignment_id IS NULL
      AND link_state IS NOT NULL
      AND assignment_state IS NULL
      AND previous_assignment_state IS NULL
      AND old_effective_from IS NULL
      AND old_effective_to IS NULL
      AND new_effective_from IS NULL
      AND new_effective_to IS NULL
      AND account_access_id_snapshot IS NULL
      AND (
        (action_code = 'LINK_CREATED' AND previous_link_state IS NULL)
        OR (
          action_code = 'LINK_STATE_CHANGED'
          AND previous_link_state IS NOT NULL
          AND previous_link_state IS NOT link_state
        )
      )
    )
    OR (
      source_kind = 'STAFF_ASSIGNMENT'
      AND event_type = 'STAFF_ASSIGNMENT'
      AND action_code IN (
        'ASSIGNMENT_CREATED',
        'ASSIGNMENT_STATE_CHANGED',
        'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED'
      )
      AND source_id = staff_assignment_id
      AND source_event_id = transition_id
      AND transition_id IS NOT NULL
      AND account_id IS NULL
      AND account_staff_link_id IS NULL
      AND staff_assignment_id IS NOT NULL
      AND link_state IS NULL
      AND previous_link_state IS NULL
      AND account_access_id_snapshot IS NULL
      AND assignment_state IS NOT NULL
      AND (
        (
          action_code = 'ASSIGNMENT_CREATED'
          AND previous_assignment_state IS NULL
          AND old_effective_from IS NULL
          AND old_effective_to IS NULL
        )
        OR (
          action_code = 'ASSIGNMENT_STATE_CHANGED'
          AND previous_assignment_state IS NOT NULL
          AND previous_assignment_state IS NOT assignment_state
          AND old_effective_from IS new_effective_from
          AND old_effective_to IS new_effective_to
        )
        OR (
          action_code = 'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED'
          AND previous_assignment_state = assignment_state
          AND (
            old_effective_from IS NOT new_effective_from
            OR old_effective_to IS NOT new_effective_to
          )
        )
      )
    )
  )
) STRICT;

CREATE UNIQUE INDEX staff_account_activity_history_person_order
  ON staff_account_activity_history (person_id, occurred_at DESC, event_id DESC);
CREATE UNIQUE INDEX staff_account_activity_history_account_order
  ON staff_account_activity_history (account_id, occurred_at DESC, event_id DESC);

CREATE TABLE staff_account_activity_audit_context (
  audit_id TEXT PRIMARY KEY NOT NULL CHECK (
    audit_id = trim(audit_id) AND length(audit_id) BETWEEN 1 AND 128
  ) REFERENCES audit_log(id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  person_id TEXT NOT NULL CHECK (
    person_id = trim(person_id) AND length(person_id) BETWEEN 1 AND 128
  ) REFERENCES canonical_people(person_id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  account_id TEXT NOT NULL CHECK (
    account_id = trim(account_id) AND length(account_id) BETWEEN 1 AND 128
  ) REFERENCES accounts(id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  account_staff_link_id TEXT NOT NULL CHECK (
    account_staff_link_id = trim(account_staff_link_id)
    AND length(account_staff_link_id) BETWEEN 1 AND 128
  ) REFERENCES account_staff_links(id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  link_state TEXT NOT NULL CHECK (link_state = 'ACTIVE'),
  account_access_id_snapshot TEXT NOT NULL CHECK (
    account_access_id_snapshot = trim(account_access_id_snapshot)
    AND length(account_access_id_snapshot) BETWEEN 1 AND 120
  ),
  action_code TEXT NOT NULL CHECK (
    action_code IN (
      'ACCESS_ID_CHANGED',
      'STARTER_ACCOUNT_CREATED',
      'ACCOUNT_STATUS_CHANGED',
      'ACCOUNT_APPLICATION_ACTIVATED'
    )
  ),
  correlation_id TEXT NOT NULL CHECK (
    correlation_id = trim(correlation_id) AND length(correlation_id) BETWEEN 1 AND 128
  ),
  prepared_at TEXT NOT NULL CHECK (
    prepared_at = trim(prepared_at)
    AND length(prepared_at) = 24
    AND substr(prepared_at, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
    AND substr(prepared_at, 5, 1) = '-'
    AND substr(prepared_at, 6, 2) GLOB '[0-9][0-9]'
    AND substr(prepared_at, 8, 1) = '-'
    AND substr(prepared_at, 9, 2) GLOB '[0-9][0-9]'
    AND substr(prepared_at, 11, 1) = 'T'
    AND substr(prepared_at, 12, 2) GLOB '[0-9][0-9]'
    AND substr(prepared_at, 14, 1) = ':'
    AND substr(prepared_at, 15, 2) GLOB '[0-9][0-9]'
    AND substr(prepared_at, 17, 1) = ':'
    AND substr(prepared_at, 18, 2) GLOB '[0-9][0-9]'
    AND substr(prepared_at, 20, 1) = '.'
    AND substr(prepared_at, 21, 3) GLOB '[0-9][0-9][0-9]'
    AND substr(prepared_at, 24, 1) = 'Z'
  )
) STRICT;

CREATE TABLE staff_account_activity_transition_context (
  transition_id TEXT PRIMARY KEY NOT NULL CHECK (
    transition_id = trim(transition_id)
    AND length(transition_id) = 36
    AND substr(transition_id, 1, 4) = 'TRN-'
    AND substr(transition_id, 5) NOT GLOB '*[^0-9a-f]*'
  ),
  source_kind TEXT NOT NULL CHECK (
    source_kind IN ('ACCOUNT_STAFF_LINK', 'STAFF_ASSIGNMENT')
  ),
  source_id TEXT NOT NULL CHECK (
    source_id = trim(source_id) AND length(source_id) BETWEEN 1 AND 128
  ),
  account_staff_link_id TEXT CHECK (
    account_staff_link_id IS NULL
    OR (account_staff_link_id = trim(account_staff_link_id)
      AND length(account_staff_link_id) BETWEEN 1 AND 128)
  ) REFERENCES account_staff_links(id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  staff_assignment_id TEXT CHECK (
    staff_assignment_id IS NULL
    OR (staff_assignment_id = trim(staff_assignment_id)
      AND length(staff_assignment_id) BETWEEN 1 AND 128)
  ) REFERENCES staff_assignments(id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  action_code TEXT NOT NULL CHECK (
    action_code IN (
      'LINK_CREATED',
      'LINK_STATE_CHANGED',
      'ASSIGNMENT_CREATED',
      'ASSIGNMENT_STATE_CHANGED',
      'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED'
    )
  ),
  person_id TEXT NOT NULL CHECK (
    person_id = trim(person_id) AND length(person_id) BETWEEN 1 AND 128
  ) REFERENCES canonical_people(person_id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  account_id TEXT CHECK (
    account_id IS NULL OR (account_id = trim(account_id) AND length(account_id) BETWEEN 1 AND 128)
  ) REFERENCES accounts(id)
    ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
  old_link_state TEXT CHECK (
    old_link_state IS NULL OR old_link_state IN ('ACTIVE', 'REVOKED', 'QUARANTINED')
  ),
  new_link_state TEXT CHECK (
    new_link_state IS NULL OR new_link_state IN ('ACTIVE', 'REVOKED', 'QUARANTINED')
  ),
  old_assignment_state TEXT CHECK (
    old_assignment_state IS NULL OR old_assignment_state IN ('ACTIVE', 'HISTORICAL', 'QUARANTINED')
  ),
  new_assignment_state TEXT CHECK (
    new_assignment_state IS NULL OR new_assignment_state IN ('ACTIVE', 'HISTORICAL', 'QUARANTINED')
  ),
  old_effective_from TEXT CHECK (
    old_effective_from IS NULL OR (
      old_effective_from = trim(old_effective_from)
      AND length(old_effective_from) = 24
      AND substr(old_effective_from, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
      AND substr(old_effective_from, 5, 1) = '-'
      AND substr(old_effective_from, 6, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_from, 8, 1) = '-'
      AND substr(old_effective_from, 9, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_from, 11, 1) = 'T'
      AND substr(old_effective_from, 12, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_from, 14, 1) = ':'
      AND substr(old_effective_from, 15, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_from, 17, 1) = ':'
      AND substr(old_effective_from, 18, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_from, 20, 1) = '.'
      AND substr(old_effective_from, 21, 3) GLOB '[0-9][0-9][0-9]'
      AND substr(old_effective_from, 24, 1) = 'Z'
    )
  ),
  old_effective_to TEXT CHECK (
    old_effective_to IS NULL OR (
      old_effective_to = trim(old_effective_to)
      AND length(old_effective_to) = 24
      AND substr(old_effective_to, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
      AND substr(old_effective_to, 5, 1) = '-'
      AND substr(old_effective_to, 6, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_to, 8, 1) = '-'
      AND substr(old_effective_to, 9, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_to, 11, 1) = 'T'
      AND substr(old_effective_to, 12, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_to, 14, 1) = ':'
      AND substr(old_effective_to, 15, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_to, 17, 1) = ':'
      AND substr(old_effective_to, 18, 2) GLOB '[0-9][0-9]'
      AND substr(old_effective_to, 20, 1) = '.'
      AND substr(old_effective_to, 21, 3) GLOB '[0-9][0-9][0-9]'
      AND substr(old_effective_to, 24, 1) = 'Z'
    )
  ),
  new_effective_from TEXT CHECK (
    new_effective_from IS NULL OR (
      new_effective_from = trim(new_effective_from)
      AND length(new_effective_from) = 24
      AND substr(new_effective_from, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
      AND substr(new_effective_from, 5, 1) = '-'
      AND substr(new_effective_from, 6, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_from, 8, 1) = '-'
      AND substr(new_effective_from, 9, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_from, 11, 1) = 'T'
      AND substr(new_effective_from, 12, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_from, 14, 1) = ':'
      AND substr(new_effective_from, 15, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_from, 17, 1) = ':'
      AND substr(new_effective_from, 18, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_from, 20, 1) = '.'
      AND substr(new_effective_from, 21, 3) GLOB '[0-9][0-9][0-9]'
      AND substr(new_effective_from, 24, 1) = 'Z'
    )
  ),
  new_effective_to TEXT CHECK (
    new_effective_to IS NULL OR (
      new_effective_to = trim(new_effective_to)
      AND length(new_effective_to) = 24
      AND substr(new_effective_to, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
      AND substr(new_effective_to, 5, 1) = '-'
      AND substr(new_effective_to, 6, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_to, 8, 1) = '-'
      AND substr(new_effective_to, 9, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_to, 11, 1) = 'T'
      AND substr(new_effective_to, 12, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_to, 14, 1) = ':'
      AND substr(new_effective_to, 15, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_to, 17, 1) = ':'
      AND substr(new_effective_to, 18, 2) GLOB '[0-9][0-9]'
      AND substr(new_effective_to, 20, 1) = '.'
      AND substr(new_effective_to, 21, 3) GLOB '[0-9][0-9][0-9]'
      AND substr(new_effective_to, 24, 1) = 'Z'
    )
  ),
  correlation_id TEXT NOT NULL CHECK (
    correlation_id = trim(correlation_id) AND length(correlation_id) BETWEEN 1 AND 128
  ),
  created_at TEXT NOT NULL CHECK (
    created_at = trim(created_at)
    AND length(created_at) = 24
    AND substr(created_at, 1, 4) GLOB '[0-9][0-9][0-9][0-9]'
    AND substr(created_at, 5, 1) = '-'
    AND substr(created_at, 6, 2) GLOB '[0-9][0-9]'
    AND substr(created_at, 8, 1) = '-'
    AND substr(created_at, 9, 2) GLOB '[0-9][0-9]'
    AND substr(created_at, 11, 1) = 'T'
    AND substr(created_at, 12, 2) GLOB '[0-9][0-9]'
    AND substr(created_at, 14, 1) = ':'
    AND substr(created_at, 15, 2) GLOB '[0-9][0-9]'
    AND substr(created_at, 17, 1) = ':'
    AND substr(created_at, 18, 2) GLOB '[0-9][0-9]'
    AND substr(created_at, 20, 1) = '.'
    AND substr(created_at, 21, 3) GLOB '[0-9][0-9][0-9]'
    AND substr(created_at, 24, 1) = 'Z'
  ),
  UNIQUE (source_kind, source_id),
  CHECK (
    (
      source_kind = 'ACCOUNT_STAFF_LINK'
      AND action_code IN ('LINK_CREATED', 'LINK_STATE_CHANGED')
      AND source_id = account_staff_link_id
      AND account_staff_link_id IS NOT NULL
      AND staff_assignment_id IS NULL
      AND account_id IS NOT NULL
      AND new_link_state IS NOT NULL
      AND old_assignment_state IS NULL
      AND new_assignment_state IS NULL
      AND old_effective_from IS NULL
      AND old_effective_to IS NULL
      AND new_effective_from IS NULL
      AND new_effective_to IS NULL
      AND (
        (action_code = 'LINK_CREATED' AND old_link_state IS NULL)
        OR (
          action_code = 'LINK_STATE_CHANGED'
          AND old_link_state IS NOT NULL
          AND old_link_state IS NOT new_link_state
        )
      )
    )
    OR (
      source_kind = 'STAFF_ASSIGNMENT'
      AND action_code IN (
        'ASSIGNMENT_CREATED',
        'ASSIGNMENT_STATE_CHANGED',
        'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED'
      )
      AND source_id = staff_assignment_id
      AND account_staff_link_id IS NULL
      AND staff_assignment_id IS NOT NULL
      AND account_id IS NULL
      AND old_link_state IS NULL
      AND new_link_state IS NULL
      AND new_assignment_state IS NOT NULL
      AND (
        (
          action_code = 'ASSIGNMENT_CREATED'
          AND old_assignment_state IS NULL
          AND old_effective_from IS NULL
          AND old_effective_to IS NULL
        )
        OR (
          action_code = 'ASSIGNMENT_STATE_CHANGED'
          AND old_assignment_state IS NOT NULL
          AND old_assignment_state IS NOT new_assignment_state
          AND old_effective_from IS new_effective_from
          AND old_effective_to IS new_effective_to
        )
        OR (
          action_code = 'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED'
          AND old_assignment_state = new_assignment_state
          AND (
            old_effective_from IS NOT new_effective_from
            OR old_effective_to IS NOT new_effective_to
          )
        )
      )
    )
  )
) STRICT;

INSERT INTO app_metadata (key, value, updated_at)
VALUES (
  'staff_account_activity_history_starts_at',
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now'),
  strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
)
ON CONFLICT(key) DO NOTHING;

UPDATE app_metadata
SET value = '32',
    updated_at = (
      SELECT value
      FROM app_metadata
      WHERE key = 'staff_account_activity_history_starts_at'
    )
WHERE key = 'operational_schema_version' AND value = '31';

CREATE TRIGGER staff_account_activity_history_no_update
BEFORE UPDATE ON staff_account_activity_history
BEGIN
  SELECT RAISE(ABORT, 'staff account activity history is append-only');
END;

CREATE TRIGGER staff_account_activity_history_no_delete
BEFORE DELETE ON staff_account_activity_history
BEGIN
  SELECT RAISE(ABORT, 'staff account activity history is append-only');
END;

CREATE TRIGGER staff_account_activity_audit_context_no_update
BEFORE UPDATE ON staff_account_activity_audit_context
BEGIN
  SELECT RAISE(ABORT, 'staff account activity audit context is immutable');
END;

CREATE TRIGGER staff_account_activity_transition_context_no_update
BEFORE UPDATE ON staff_account_activity_transition_context
BEGIN
  SELECT RAISE(ABORT, 'staff account activity transition context is immutable');
END;

CREATE TRIGGER account_staff_links_identity_immutable
BEFORE UPDATE ON account_staff_links
WHEN NEW.id IS NOT OLD.id
  OR NEW.account_id IS NOT OLD.account_id
  OR NEW.person_id IS NOT OLD.person_id
BEGIN
  SELECT RAISE(ABORT, 'account staff link identity is immutable');
END;

CREATE TRIGGER staff_assignments_identity_immutable
BEFORE UPDATE ON staff_assignments
WHEN NEW.id IS NOT OLD.id
  OR NEW.person_id IS NOT OLD.person_id
  OR NEW.assignment_fingerprint IS NOT OLD.assignment_fingerprint
BEGIN
  SELECT RAISE(ABORT, 'staff assignment identity is immutable');
END;

CREATE TRIGGER account_staff_links_retained_history_no_delete
BEFORE DELETE ON account_staff_links
WHEN EXISTS (
  SELECT 1
  FROM staff_account_activity_history
  WHERE account_staff_link_id = OLD.id
)
BEGIN
  SELECT RAISE(ABORT, 'retained staff activity requires account staff link');
END;

CREATE TRIGGER staff_assignments_retained_history_no_delete
BEFORE DELETE ON staff_assignments
WHEN EXISTS (
  SELECT 1
  FROM staff_account_activity_history
  WHERE staff_assignment_id = OLD.id
)
BEGIN
  SELECT RAISE(ABORT, 'retained staff activity requires staff assignment');
END;

CREATE TRIGGER staff_account_activity_audit_context_exact_match
BEFORE INSERT ON audit_log
WHEN EXISTS (
  SELECT 1
  FROM staff_account_activity_audit_context AS c
  WHERE c.audit_id = NEW.id
)
BEGIN
  SELECT CASE
    WHEN NEW.entity_type <> 'ACCOUNT'
      OR NEW.action NOT IN (
        'ACCESS_ID_CHANGED',
        'STARTER_ACCOUNT_CREATED',
        'ACCOUNT_STATUS_CHANGED',
        'ACCOUNT_APPLICATION_ACTIVATED'
      )
      OR (
        SELECT COUNT(*)
        FROM staff_account_activity_audit_context AS c
        WHERE c.audit_id = NEW.id
          AND c.action_code = NEW.action
          AND c.account_id = NEW.entity_id
          AND c.correlation_id = NEW.correlation_id
          AND c.prepared_at <= NEW.created_at
      ) <> 1
    THEN RAISE(ABORT, 'staff activity audit context mismatch')
  END;
END;

CREATE TRIGGER staff_account_activity_audit_context_project_consume
AFTER INSERT ON audit_log
WHEN NEW.entity_type = 'ACCOUNT'
  AND NEW.action IN (
    'ACCESS_ID_CHANGED',
    'STARTER_ACCOUNT_CREATED',
    'ACCOUNT_STATUS_CHANGED',
    'ACCOUNT_APPLICATION_ACTIVATED'
  )
  AND EXISTS (
    SELECT 1
    FROM staff_account_activity_audit_context AS c
    WHERE c.audit_id = NEW.id
      AND c.action_code = NEW.action
      AND c.account_id = NEW.entity_id
      AND c.correlation_id = NEW.correlation_id
      AND c.prepared_at <= NEW.created_at
  )
BEGIN
  INSERT INTO staff_account_activity_history (
    event_id,
    occurred_at,
    event_type,
    action_code,
    person_id,
    account_id,
    account_staff_link_id,
    staff_assignment_id,
    link_state,
    previous_link_state,
    assignment_state,
    previous_assignment_state,
    old_effective_from,
    old_effective_to,
    new_effective_from,
    new_effective_to,
    account_access_id_snapshot,
    correlation_id,
    source_kind,
    source_id,
    source_event_id,
    transition_id
  )
  SELECT
    'HIS-' || lower(hex(randomblob(16))),
    NEW.created_at,
    'ACCOUNT_AUDIT',
    NEW.action,
    c.person_id,
    c.account_id,
    c.account_staff_link_id,
    NULL,
    'ACTIVE',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    c.account_access_id_snapshot,
    c.correlation_id,
    'ACCOUNT_AUDIT',
    NEW.id,
    NEW.id,
    NULL
  FROM staff_account_activity_audit_context AS c
  WHERE c.audit_id = NEW.id
    AND c.action_code = NEW.action
    AND c.account_id = NEW.entity_id
    AND c.correlation_id = NEW.correlation_id
    AND c.prepared_at <= NEW.created_at;

  DELETE FROM staff_account_activity_audit_context
  WHERE audit_id = NEW.id;
END;

CREATE TRIGGER account_staff_links_create_context_required
BEFORE INSERT ON account_staff_links
BEGIN
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM staff_account_activity_transition_context AS c
      WHERE c.source_kind = 'ACCOUNT_STAFF_LINK'
        AND c.action_code = 'LINK_CREATED'
        AND c.source_id = NEW.id
        AND c.account_staff_link_id = NEW.id
        AND c.staff_assignment_id IS NULL
        AND c.person_id = NEW.person_id
        AND c.account_id = NEW.account_id
        AND c.old_link_state IS NULL
        AND c.new_link_state = NEW.state
        AND c.old_assignment_state IS NULL
        AND c.new_assignment_state IS NULL
        AND c.old_effective_from IS NULL
        AND c.old_effective_to IS NULL
        AND c.new_effective_from IS NULL
        AND c.new_effective_to IS NULL
        AND c.created_at <= NEW.created_at
    ) <> 1
    THEN RAISE(ABORT, 'account staff link create requires exact activity context')
  END;
END;

CREATE TRIGGER account_staff_links_create_project_consume
AFTER INSERT ON account_staff_links
BEGIN
  INSERT INTO staff_account_activity_history (
    event_id,
    occurred_at,
    event_type,
    action_code,
    person_id,
    account_id,
    account_staff_link_id,
    staff_assignment_id,
    link_state,
    previous_link_state,
    assignment_state,
    previous_assignment_state,
    old_effective_from,
    old_effective_to,
    new_effective_from,
    new_effective_to,
    account_access_id_snapshot,
    correlation_id,
    source_kind,
    source_id,
    source_event_id,
    transition_id
  )
  SELECT
    'HIS-' || lower(hex(randomblob(16))),
    NEW.created_at,
    'ACCOUNT_STAFF_LINK',
    'LINK_CREATED',
    NEW.person_id,
    NEW.account_id,
    NEW.id,
    NULL,
    NEW.state,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    c.correlation_id,
    'ACCOUNT_STAFF_LINK',
    NEW.id,
    c.transition_id,
    c.transition_id
  FROM staff_account_activity_transition_context AS c
  WHERE c.source_kind = 'ACCOUNT_STAFF_LINK'
    AND c.action_code = 'LINK_CREATED'
    AND c.source_id = NEW.id
    AND c.account_staff_link_id = NEW.id
    AND c.staff_assignment_id IS NULL
    AND c.person_id = NEW.person_id
    AND c.account_id = NEW.account_id
    AND c.old_link_state IS NULL
    AND c.new_link_state = NEW.state
    AND c.old_assignment_state IS NULL
    AND c.new_assignment_state IS NULL
    AND c.old_effective_from IS NULL
    AND c.old_effective_to IS NULL
    AND c.new_effective_from IS NULL
    AND c.new_effective_to IS NULL
    AND c.created_at <= NEW.created_at;

  DELETE FROM staff_account_activity_transition_context
  WHERE transition_id = (
    SELECT c.transition_id
    FROM staff_account_activity_transition_context AS c
    WHERE c.source_kind = 'ACCOUNT_STAFF_LINK'
      AND c.action_code = 'LINK_CREATED'
      AND c.source_id = NEW.id
      AND c.account_staff_link_id = NEW.id
      AND c.staff_assignment_id IS NULL
      AND c.person_id = NEW.person_id
      AND c.account_id = NEW.account_id
      AND c.old_link_state IS NULL
      AND c.new_link_state = NEW.state
      AND c.created_at <= NEW.created_at
  );
END;

CREATE TRIGGER account_staff_links_state_context_required
BEFORE UPDATE OF state ON account_staff_links
WHEN NEW.state IS NOT OLD.state
BEGIN
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM staff_account_activity_transition_context AS c
      WHERE c.source_kind = 'ACCOUNT_STAFF_LINK'
        AND c.action_code = 'LINK_STATE_CHANGED'
        AND c.source_id = NEW.id
        AND c.account_staff_link_id = NEW.id
        AND c.staff_assignment_id IS NULL
        AND c.person_id = NEW.person_id
        AND c.account_id = NEW.account_id
        AND c.old_link_state = OLD.state
        AND c.new_link_state = NEW.state
        AND c.old_assignment_state IS NULL
        AND c.new_assignment_state IS NULL
        AND c.old_effective_from IS NULL
        AND c.old_effective_to IS NULL
        AND c.new_effective_from IS NULL
        AND c.new_effective_to IS NULL
        AND c.created_at <= NEW.updated_at
    ) <> 1
    THEN RAISE(ABORT, 'account staff link state update requires exact activity context')
  END;
END;

CREATE TRIGGER account_staff_links_state_project_consume
AFTER UPDATE OF state ON account_staff_links
WHEN NEW.state IS NOT OLD.state
BEGIN
  INSERT INTO staff_account_activity_history (
    event_id,
    occurred_at,
    event_type,
    action_code,
    person_id,
    account_id,
    account_staff_link_id,
    staff_assignment_id,
    link_state,
    previous_link_state,
    assignment_state,
    previous_assignment_state,
    old_effective_from,
    old_effective_to,
    new_effective_from,
    new_effective_to,
    account_access_id_snapshot,
    correlation_id,
    source_kind,
    source_id,
    source_event_id,
    transition_id
  )
  SELECT
    'HIS-' || lower(hex(randomblob(16))),
    NEW.updated_at,
    'ACCOUNT_STAFF_LINK',
    'LINK_STATE_CHANGED',
    NEW.person_id,
    NEW.account_id,
    NEW.id,
    NULL,
    NEW.state,
    OLD.state,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    c.correlation_id,
    'ACCOUNT_STAFF_LINK',
    NEW.id,
    c.transition_id,
    c.transition_id
  FROM staff_account_activity_transition_context AS c
  WHERE c.source_kind = 'ACCOUNT_STAFF_LINK'
    AND c.action_code = 'LINK_STATE_CHANGED'
    AND c.source_id = NEW.id
    AND c.account_staff_link_id = NEW.id
    AND c.staff_assignment_id IS NULL
    AND c.person_id = NEW.person_id
    AND c.account_id = NEW.account_id
    AND c.old_link_state = OLD.state
    AND c.new_link_state = NEW.state
    AND c.old_assignment_state IS NULL
    AND c.new_assignment_state IS NULL
    AND c.old_effective_from IS NULL
    AND c.old_effective_to IS NULL
    AND c.new_effective_from IS NULL
    AND c.new_effective_to IS NULL
    AND c.created_at <= NEW.updated_at;

  DELETE FROM staff_account_activity_transition_context
  WHERE transition_id = (
    SELECT c.transition_id
    FROM staff_account_activity_transition_context AS c
    WHERE c.source_kind = 'ACCOUNT_STAFF_LINK'
      AND c.action_code = 'LINK_STATE_CHANGED'
      AND c.source_id = NEW.id
      AND c.account_staff_link_id = NEW.id
      AND c.staff_assignment_id IS NULL
      AND c.person_id = NEW.person_id
      AND c.account_id = NEW.account_id
      AND c.old_link_state = OLD.state
      AND c.new_link_state = NEW.state
      AND c.created_at <= NEW.updated_at
  );
END;

CREATE TRIGGER staff_assignments_reject_mixed_state_window_update
BEFORE UPDATE OF state, effective_from, effective_to ON staff_assignments
WHEN NEW.state IS NOT OLD.state
  AND (
    NEW.effective_from IS NOT OLD.effective_from
    OR NEW.effective_to IS NOT OLD.effective_to
  )
BEGIN
  SELECT RAISE(ABORT, 'staff assignment state and effective window require separate transitions');
END;

CREATE TRIGGER staff_assignments_create_context_required
BEFORE INSERT ON staff_assignments
BEGIN
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM staff_account_activity_transition_context AS c
      WHERE c.source_kind = 'STAFF_ASSIGNMENT'
        AND c.action_code = 'ASSIGNMENT_CREATED'
        AND c.source_id = NEW.id
        AND c.account_staff_link_id IS NULL
        AND c.staff_assignment_id = NEW.id
        AND c.person_id = NEW.person_id
        AND c.account_id IS NULL
        AND c.old_link_state IS NULL
        AND c.new_link_state IS NULL
        AND c.old_assignment_state IS NULL
        AND c.new_assignment_state = NEW.state
        AND c.old_effective_from IS NULL
        AND c.old_effective_to IS NULL
        AND c.new_effective_from IS NEW.effective_from
        AND c.new_effective_to IS NEW.effective_to
        AND c.created_at <= NEW.created_at
    ) <> 1
    THEN RAISE(ABORT, 'staff assignment create requires exact activity context')
  END;
END;

CREATE TRIGGER staff_assignments_create_project_consume
AFTER INSERT ON staff_assignments
BEGIN
  INSERT INTO staff_account_activity_history (
    event_id,
    occurred_at,
    event_type,
    action_code,
    person_id,
    account_id,
    account_staff_link_id,
    staff_assignment_id,
    link_state,
    previous_link_state,
    assignment_state,
    previous_assignment_state,
    old_effective_from,
    old_effective_to,
    new_effective_from,
    new_effective_to,
    account_access_id_snapshot,
    correlation_id,
    source_kind,
    source_id,
    source_event_id,
    transition_id
  )
  SELECT
    'HIS-' || lower(hex(randomblob(16))),
    NEW.created_at,
    'STAFF_ASSIGNMENT',
    'ASSIGNMENT_CREATED',
    NEW.person_id,
    NULL,
    NULL,
    NEW.id,
    NULL,
    NULL,
    NEW.state,
    NULL,
    NULL,
    NULL,
    NEW.effective_from,
    NEW.effective_to,
    NULL,
    c.correlation_id,
    'STAFF_ASSIGNMENT',
    NEW.id,
    c.transition_id,
    c.transition_id
  FROM staff_account_activity_transition_context AS c
  WHERE c.source_kind = 'STAFF_ASSIGNMENT'
    AND c.action_code = 'ASSIGNMENT_CREATED'
    AND c.source_id = NEW.id
    AND c.account_staff_link_id IS NULL
    AND c.staff_assignment_id = NEW.id
    AND c.person_id = NEW.person_id
    AND c.account_id IS NULL
    AND c.old_link_state IS NULL
    AND c.new_link_state IS NULL
    AND c.old_assignment_state IS NULL
    AND c.new_assignment_state = NEW.state
    AND c.old_effective_from IS NULL
    AND c.old_effective_to IS NULL
    AND c.new_effective_from IS NEW.effective_from
    AND c.new_effective_to IS NEW.effective_to
    AND c.created_at <= NEW.created_at;

  DELETE FROM staff_account_activity_transition_context
  WHERE transition_id = (
    SELECT c.transition_id
    FROM staff_account_activity_transition_context AS c
    WHERE c.source_kind = 'STAFF_ASSIGNMENT'
      AND c.action_code = 'ASSIGNMENT_CREATED'
      AND c.source_id = NEW.id
      AND c.staff_assignment_id = NEW.id
      AND c.person_id = NEW.person_id
      AND c.new_assignment_state = NEW.state
      AND c.created_at <= NEW.created_at
  );
END;

CREATE TRIGGER staff_assignments_state_context_required
BEFORE UPDATE OF state ON staff_assignments
WHEN NEW.state IS NOT OLD.state
BEGIN
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM staff_account_activity_transition_context AS c
      WHERE c.source_kind = 'STAFF_ASSIGNMENT'
        AND c.action_code = 'ASSIGNMENT_STATE_CHANGED'
        AND c.source_id = NEW.id
        AND c.account_staff_link_id IS NULL
        AND c.staff_assignment_id = NEW.id
        AND c.person_id = NEW.person_id
        AND c.account_id IS NULL
        AND c.old_link_state IS NULL
        AND c.new_link_state IS NULL
        AND c.old_assignment_state = OLD.state
        AND c.new_assignment_state = NEW.state
        AND c.old_effective_from IS OLD.effective_from
        AND c.old_effective_to IS OLD.effective_to
        AND c.new_effective_from IS NEW.effective_from
        AND c.new_effective_to IS NEW.effective_to
        AND c.created_at <= NEW.updated_at
    ) <> 1
    THEN RAISE(ABORT, 'staff assignment state update requires exact activity context')
  END;
END;

CREATE TRIGGER staff_assignments_state_project_consume
AFTER UPDATE OF state ON staff_assignments
WHEN NEW.state IS NOT OLD.state
BEGIN
  INSERT INTO staff_account_activity_history (
    event_id,
    occurred_at,
    event_type,
    action_code,
    person_id,
    account_id,
    account_staff_link_id,
    staff_assignment_id,
    link_state,
    previous_link_state,
    assignment_state,
    previous_assignment_state,
    old_effective_from,
    old_effective_to,
    new_effective_from,
    new_effective_to,
    account_access_id_snapshot,
    correlation_id,
    source_kind,
    source_id,
    source_event_id,
    transition_id
  )
  SELECT
    'HIS-' || lower(hex(randomblob(16))),
    NEW.updated_at,
    'STAFF_ASSIGNMENT',
    'ASSIGNMENT_STATE_CHANGED',
    NEW.person_id,
    NULL,
    NULL,
    NEW.id,
    NULL,
    NULL,
    NEW.state,
    OLD.state,
    OLD.effective_from,
    OLD.effective_to,
    NEW.effective_from,
    NEW.effective_to,
    NULL,
    c.correlation_id,
    'STAFF_ASSIGNMENT',
    NEW.id,
    c.transition_id,
    c.transition_id
  FROM staff_account_activity_transition_context AS c
  WHERE c.source_kind = 'STAFF_ASSIGNMENT'
    AND c.action_code = 'ASSIGNMENT_STATE_CHANGED'
    AND c.source_id = NEW.id
    AND c.account_staff_link_id IS NULL
    AND c.staff_assignment_id = NEW.id
    AND c.person_id = NEW.person_id
    AND c.account_id IS NULL
    AND c.old_link_state IS NULL
    AND c.new_link_state IS NULL
    AND c.old_assignment_state = OLD.state
    AND c.new_assignment_state = NEW.state
    AND c.old_effective_from IS OLD.effective_from
    AND c.old_effective_to IS OLD.effective_to
    AND c.new_effective_from IS NEW.effective_from
    AND c.new_effective_to IS NEW.effective_to
    AND c.created_at <= NEW.updated_at;

  DELETE FROM staff_account_activity_transition_context
  WHERE transition_id = (
    SELECT c.transition_id
    FROM staff_account_activity_transition_context AS c
    WHERE c.source_kind = 'STAFF_ASSIGNMENT'
      AND c.action_code = 'ASSIGNMENT_STATE_CHANGED'
      AND c.source_id = NEW.id
      AND c.staff_assignment_id = NEW.id
      AND c.person_id = NEW.person_id
      AND c.old_assignment_state = OLD.state
      AND c.new_assignment_state = NEW.state
      AND c.created_at <= NEW.updated_at
  );
END;

CREATE TRIGGER staff_assignments_window_context_required
BEFORE UPDATE OF effective_from, effective_to ON staff_assignments
WHEN (
  NEW.effective_from IS NOT OLD.effective_from
  OR NEW.effective_to IS NOT OLD.effective_to
)
BEGIN
  SELECT CASE
    WHEN NEW.state IS NOT OLD.state
    THEN RAISE(ABORT, 'staff assignment state and effective window require separate transitions')
  END;
  SELECT CASE
    WHEN (
      SELECT COUNT(*)
      FROM staff_account_activity_transition_context AS c
      WHERE c.source_kind = 'STAFF_ASSIGNMENT'
        AND c.action_code = 'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED'
        AND c.source_id = NEW.id
        AND c.account_staff_link_id IS NULL
        AND c.staff_assignment_id = NEW.id
        AND c.person_id = NEW.person_id
        AND c.account_id IS NULL
        AND c.old_link_state IS NULL
        AND c.new_link_state IS NULL
        AND c.old_assignment_state IS OLD.state
        AND c.new_assignment_state IS NEW.state
        AND c.old_effective_from IS OLD.effective_from
        AND c.old_effective_to IS OLD.effective_to
        AND c.new_effective_from IS NEW.effective_from
        AND c.new_effective_to IS NEW.effective_to
        AND c.created_at <= NEW.updated_at
    ) <> 1
    THEN RAISE(ABORT, 'staff assignment effective window requires exact activity context')
  END;
END;

CREATE TRIGGER staff_assignments_window_project_consume
AFTER UPDATE OF effective_from, effective_to ON staff_assignments
WHEN (
  NEW.effective_from IS NOT OLD.effective_from
  OR NEW.effective_to IS NOT OLD.effective_to
)
  AND NEW.state IS OLD.state
BEGIN
  INSERT INTO staff_account_activity_history (
    event_id,
    occurred_at,
    event_type,
    action_code,
    person_id,
    account_id,
    account_staff_link_id,
    staff_assignment_id,
    link_state,
    previous_link_state,
    assignment_state,
    previous_assignment_state,
    old_effective_from,
    old_effective_to,
    new_effective_from,
    new_effective_to,
    account_access_id_snapshot,
    correlation_id,
    source_kind,
    source_id,
    source_event_id,
    transition_id
  )
  SELECT
    'HIS-' || lower(hex(randomblob(16))),
    NEW.updated_at,
    'STAFF_ASSIGNMENT',
    'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED',
    NEW.person_id,
    NULL,
    NULL,
    NEW.id,
    NULL,
    NULL,
    NEW.state,
    OLD.state,
    OLD.effective_from,
    OLD.effective_to,
    NEW.effective_from,
    NEW.effective_to,
    NULL,
    c.correlation_id,
    'STAFF_ASSIGNMENT',
    NEW.id,
    c.transition_id,
    c.transition_id
  FROM staff_account_activity_transition_context AS c
  WHERE c.source_kind = 'STAFF_ASSIGNMENT'
    AND c.action_code = 'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED'
    AND c.source_id = NEW.id
    AND c.account_staff_link_id IS NULL
    AND c.staff_assignment_id = NEW.id
    AND c.person_id = NEW.person_id
    AND c.account_id IS NULL
    AND c.old_link_state IS NULL
    AND c.new_link_state IS NULL
    AND c.old_assignment_state IS OLD.state
    AND c.new_assignment_state IS NEW.state
    AND c.old_effective_from IS OLD.effective_from
    AND c.old_effective_to IS OLD.effective_to
    AND c.new_effective_from IS NEW.effective_from
    AND c.new_effective_to IS NEW.effective_to
    AND c.created_at <= NEW.updated_at;

  DELETE FROM staff_account_activity_transition_context
  WHERE transition_id = (
    SELECT c.transition_id
    FROM staff_account_activity_transition_context AS c
    WHERE c.source_kind = 'STAFF_ASSIGNMENT'
      AND c.action_code = 'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED'
      AND c.source_id = NEW.id
      AND c.staff_assignment_id = NEW.id
      AND c.person_id = NEW.person_id
      AND c.old_effective_from IS OLD.effective_from
      AND c.old_effective_to IS OLD.effective_to
      AND c.new_effective_from IS NEW.effective_from
      AND c.new_effective_to IS NEW.effective_to
      AND c.created_at <= NEW.updated_at
  );
END;
```

<!-- END V83_ACTIVITY_HISTORY_SQL -->

The typed transition-context foreign keys are deferred intentionally. A CREATE
may insert a context for a preallocated link or assignment ID before the source
row exists; the same D1 batch must create the source row before COMMIT. The
typed FKs, source/context CHECK matrix, and context-consuming trigger together
prevent a polymorphic or unretained source identity. The migration harness must
assert that the schema-version UPDATE affects exactly one row.

## 3. Exact producer, assertion, and cleanup ordering

All activity statements run in one D1 batch/transaction. No statement between a
guarded source mutation and its changes() assertion is allowed. Source triggers
project and consume context during the guarded source statement; if the
subsequent assertion fails, the transaction rolls back the source, projection,
and cleanup together.

### Account-audit producers

The whole preserved account taxonomy is:

| Existing action/entity                                    | Current producer family                         | Canonical treatment                                                      |
| --------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------ |
| ACCESS_ID_CHANGED / ACCOUNT                               | access service and access-management repository | Project only from a same-batch exact audit context.                      |
| STARTER_ACCOUNT_CREATED / ACCOUNT                         | access-management flow                          | Distinct immutable audit/source operation.                               |
| STARTER_ACCOUNT_CREATED / ACCOUNT                         | account-application approval flow               | Distinct immutable audit/source operation.                               |
| ACCOUNT_STATUS_CHANGED / ACCOUNT                          | access service and access-management repository | Project only from a same-batch exact audit context.                      |
| ACCOUNT_APPLICATION_ACTIVATED / ACCOUNT_APPLICATION       | account-application service/repository          | Existing application audit remains unchanged and is not retyped.         |
| ACCOUNT_APPLICATION_ACTIVATED / conditional ACCOUNT audit | account-application activation batch            | Project only when exactly one explicit ACTIVE link exists at event time. |

For ACCESS_ID_CHANGED, both independent STARTER_ACCOUNT_CREATED producers, and
ACCOUNT_STATUS_CHANGED, the batch order is exactly:

1. Validate action, account ID, canonical UTC event time, bounded correlation,
   and direct account access-ID snapshot.
2. Insert staff_account_activity_audit_context by INSERT ... SELECT only when
   exactly one account_staff_links row is ACTIVE for that account. It copies the
   event-time person ID, link ID, account ID, ACTIVE link state, access-ID
   snapshot, action, correlation, and prepared_at.
3. Insert the existing ACCOUNT audit with the same audit ID, action, account
   entity ID, correlation, and event time.
4. The audit trigger verifies the literal context predicates, inserts exactly
   one ACCOUNT_AUDIT history row, and deletes only that audit context.

Missing, ambiguous, revoked, quarantined, sentinel, malformed, or oversized
truth produces zero context rows and does not add a canonical event. The
existing legacy audit still commits. AUTHENTICATION, non-ACCOUNT, unknown,
nonexistent-account, delayed, and replayed legacy audits have no matching
context and remain loggable but unprojected.

For account-application activation, preserve the guarded application transition
and existing ACCOUNT_APPLICATION audit. After the guarded transition and only
when exactly one ACTIVE explicit link exists, insert the audit context and then
the conditional ACCOUNT audit. If the context SELECT returns zero rows, both
new ACCOUNT rows are zero-row operations; activation and the original
application audit still commit. No producer may infer a link, person, or
authorization to make that conditional audit appear.

### Link and assignment transitions

For every semantic link CREATE, link state UPDATE, assignment CREATE,
assignment state UPDATE, or assignment effective-window UPDATE:

1. Normalize and validate direct command input. A no-op returns before a TRN
   exists or context is inserted.
2. Generate one TRN ID in D1 using the literal expression in section 1 and
   insert the matching transition context. The context contains the complete
   action, typed source ID, person/account identity, correlation, created_at,
   and OLD/NEW state/window values that the source trigger will compare.
3. Perform exactly one guarded source INSERT or UPDATE. Updates bind all
   expected OLD fields in their WHERE clause using NULL-safe IS comparisons;
   assignment state and window changes are separate operations.
4. Immediately run:

   ```sql
   UPDATE data_revisions
   SET updated_at = CASE WHEN changes() = 1 THEN updated_at ELSE NULL END
   WHERE scope = 'global';
   ```

   data_revisions.updated_at is NOT NULL. A zero- or multi-row guarded mutation
   therefore aborts the transaction and rolls back any source, history, and
   context effect.

5. The relevant AFTER trigger has already inserted one exact history row and
   deleted only its matching context. No service performs a separate cleanup.

Missing, stale, malformed, replayed, or mismatched context; an identity or
fingerprint mutation; a mixed assignment state/window update; a reused TRN; a
zero/multi-row source mutation; or a history/source identity conflict aborts.
A completed retry is a no-op. History transition_id remains globally unique
after context cleanup, while the pending transition primary key and
UNIQUE(source_kind, source_id) prevent concurrent duplicate contexts.

## 4. Exact read route, query, pagination, and DTO

The only later endpoint is POST
/api/admin/staff-account-activity-history. The Worker calls authorize with
CAPABILITIES.ACCESS_ADMIN and mutation: false before parsing the request body,
constructing the service, or performing any repository read. A denial causes
zero body reads and zero activity-history reads. A System Owner succeeds only
through the existing effective capability projection; a person, account link,
or client claim grants nothing.

The JSON body is limited to:

```text
{
  personId: required opaque canonical ID,
  query?: exact accountId or exact accountAccessIdSnapshot,
  eventType?: ACCOUNT_AUDIT | ACCOUNT_STAFF_LINK | STAFF_ASSIGNMENT,
  actionCode?: one of the nine history action codes,
  page?: positive integer,
  pageSize?: integer
}
```

- personId is required, trimmed, and length 1–128. Missing, empty, non-string,
  or oversize personId is HTTP 400.
- query is absent or a trimmed string length 1–120. When present it exact-matches
  only history.account_id or history.account_access_id_snapshot for the required
  person; it is never a partial search and never matches names, profiles,
  emails, assignments, roster data, source rows, or protected values. Empty,
  non-string, or oversize query is HTTP 400.
- eventType and actionCode are absent or their literal allowlist members;
  anything else is HTTP 400. A valid but incompatible pair returns an empty
  result rather than widening the filter.
- page is absent => 1; otherwise it must be an integer >= 1 or HTTP 400.
  pageSize is absent or non-integer => 25; an integer is clamped to 5–50.
- One mechanically shared WHERE fragment is bound into both COUNT(*) and the
  page SELECT: person_id equality; optional exact query disjunction; optional
  event_type equality; optional action_code equality. The page query orders
  occurred_at DESC, event_id DESC, with LIMIT/OFFSET derived only from the
  normalized page/pageSize. totalPages is 0 when total is 0; otherwise it is
  CEIL(total / pageSize). The count and page filters must never diverge.

The response DTO is exactly:

```text
{
  personId,
  historyStartsAt,
  page,
  pageSize,
  total,
  totalPages,
  items: [{
    id,
    occurredAt,
    eventType,
    actionCode,
    accountId,
    accountAccessIdSnapshot,
    correlationId,
    linkState,
    previousLinkState,
    assignmentState,
    previousAssignmentState,
    oldEffectiveFrom,
    oldEffectiveTo,
    newEffectiveFrom,
    newEffectiveTo
  }]
}
```

historyStartsAt is the canonical UTC value stored under the
staff_account_activity_history_starts_at app_metadata key by migration 0032.
It is returned even when items is empty and means retained history begins at
migration activation; it does not imply that no pre-activation activity existed.

The repository selects only the DTO columns plus the count and the one metadata
value. It explicitly excludes protected_email_envelope,
protected_assignment_envelope, source_provenance_envelope, every email or
assignment fingerprint, profile_email, profile_full_name, mobile number,
credentials, sessions, roles, capabilities, before_json, after_json, notes,
actor account ID, source_id, source_event_id, transition_id, raw audit payload,
provider data, roster data, and free-form reason text. No response exposes a
mutation token, authorization fact, or raw protected field.

## 5. Exact V5 behavior

The V5 activity-history view is a distinct admin surface. It loads this endpoint
only for a client state already admitted to the existing ACCESS_ADMIN view, but
the Worker remains authoritative. A denied client makes no
/api/admin/staff-account-activity-history request and shows the normal denied
surface; it never falls back to /api/admin/access/directory,
/api/owner/identity-roster/*, or another account/roster endpoint.

Every dynamic DTO field is rendered through textContent or the existing escaped
renderer. No item field, query value, error detail, or server text is inserted
through unescaped innerHTML. An empty result shows the safe retained-history
empty state together with historyStartsAt. A failed authorized load shows the
generic safe error state without a raw exception, source detail, roster value,
or stale prior item. The view has no roster-management control, no link/assignment
mutation, no name/email search, and no access-directory fallback.

## 6. Later implementation ownership

| Responsibility                                               | Exact owned path                                                                                                                                                                                                        |
| ------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DDL/version 32/constraints/contexts/triggers/indexes         | migrations/0032_staff_account_activity_history.sql                                                                                                                                                                      |
| Canonical read query and link/assignment mutation primitives | src/server/d1/identity-foundation-repository.js                                                                                                                                                                         |
| Access-ID, starter-account, and status audit contexts        | src/server/access/service.js; src/server/d1/access-management-repository.js                                                                                                                                             |
| Account-application conditional account audit/context        | src/server/account-application/service.js; src/server/d1/account-application-repository.js                                                                                                                              |
| Input normalization and safe DTO                             | new src/server/identity-foundation/staff-account-activity-history-service.js                                                                                                                                            |
| Worker/HTTP/V5 route                                         | src/worker/index.js; src/services/http-api-adapter.js; src/services/rest-service.js; src/v5/integration/runtime.js; src/v5/integration/view-models.js; src/v5/src/surfaces/admin.js; src/v5/integration/admin-parity.js |
| Service test                                                 | new tests/unit/staff-account-activity-history-service.test.js                                                                                                                                                           |
| Migration/version/order test                                 | tests/unit/identity-foundation-migration.test.js; tests/unit/account-application-migration-integration.test.js; tests/unit/identity-foundation-gate-a-fixture.test.js; tests/unit/v072-migration-contract.test.js       |
| Direct producer and Miniflare D1 test                        | tests/unit/access-management-repository.test.js; tests/unit/account-application-service.test.js; tests/unit/account-application-repository.test.js                                                                      |
| Worker denial and V5/browser test                            | tests/unit/identity-foundation-worker-route-contract.test.js; tests/e2e/v5-current-application-fixtures.js; tests/e2e/v5-current-application.spec.js; tests/cloudflare-e2e/local-worker.spec.js                         |

No path in this table is authorized in the present plan-only slice.

## 7. Regression and acceptance matrix

Before implementation, add focused failing tests. The resulting implementation
must prove all of the following:

1. Apply 0031 then 0032 to a fresh synthetic SQLite/D1/Miniflare fixture; prove
   schema version 32, one migration start timestamp, STRICT tables, all indexes,
   deferred typed FKs, literal digit/separator timestamp checks, complete
   action/null matrices, append guards, identity/fingerprint guards, retention
   guards, and no backfill.
2. Run malformed timestamp negatives for occurred_at, prepared_at, created_at,
   and each OLD/NEW window; a bad digit, bad separator, whitespace, or wrong
   length must fail. Run action/null negatives for every incompatible
   source_kind/event_type/action combination, missing required link/assignment
   field, forbidden non-null field, unchanged state transition, and unchanged
   effective-window transition.
3. Execute every real trigger in Miniflare/D1: audit context match/consume;
   link create/state context match/consume; assignment create/state/window
   context match/consume; immutable history rejection; source identity and
   assignment_fingerprint rejection; existing audit-log plus new retained-source
   delete rejection; stale or missing context rollback; no-op/retry/conflicting-
   TRN behavior; and exact OLD/NEW state/window recording.
4. Cover ACCESS_ID_CHANGED, both independent STARTER_ACCOUNT_CREATED producers,
   ACCOUNT_STATUS_CHANGED, ACCOUNT_APPLICATION_ACTIVATED's existing application
   audit, and its conditional ACCOUNT audit. Prove exactly-one ACTIVE link
   projection; no-link, ambiguous, revoked, quarantined, sentinel, malformed,
   nonexistent, delayed, replayed, and AUTHENTICATION/non-account safety
   branches leave legacy logging truthful while adding no canonical projection.
5. Prove route authorization is effective ACCESS_ADMIN with mutation:false
   before body/repository read; no capability and System Owner without the
   effective capability are denied with no request/read. Prove the exact
   request validation, shared count/page predicate, pagination defaults/clamps,
   deterministic tiebreaker, totalPages=0, safe DTO allowlist, and every
   protected-field exclusion.
6. Prove V5 authorized rendering, textContent/escaping, retained-history empty
   state, generic error state, and denied no-request behavior. Prove there is
   no roster or access-directory fallback. The accepted P3 residual is no live
   Worker 403 execution; static Worker authorization and browser
   denied/no-request evidence are the accepted substitute.

tests/unit/access-management-repository.test.js is the real Miniflare D1 seam:
its reduced fixture applies 0031/0032 and runs actual guarded source and audit
SQL, not a synthetic ordering-only probe. An account-application unit test may
retain a synthetic statement-order probe, but it is not trigger evidence.
tests/cloudflare-e2e/local-worker.spec.js is a Worker HTTP/authorization harness
and does not claim migration or trigger control.

Focused implementation verification is portable Node 22.23.2 unit/repository/
Worker/V5 coverage, scoped ESLint and Prettier, Node syntax, privacy/static
scans, fresh-schema DDL/trigger evidence, git diff --check, full logical-diff
review, normal commit/push, and local/upstream/live parity. It excludes build,
provider access, live probe, candidate freeze, Playground, Production,
deployment, and migration application unless separately authorized.

## 8. Recovery and stop conditions

Before migration application, require separately authorized schema-31 proof,
backup/recovery evidence, and exact candidate authorization. After application,
rollback is forward-only: disable or revert the route while retaining source,
context, and immutable history. Reconstruction uses retained immutable history,
retained source/audit rows, typed source identities, transition IDs, and the
authorized migration backup; a conflict is a reconciliation failure, never a
silent rewrite.

STOP CONDITIONS: any need to infer attribution or privilege; disclose a
protected envelope, fingerprint, provenance, source row, credential, secret,
or provider/private value; broaden the audience; alter the schema outside this
plan; bypass an exact context predicate; rely on a non-synthetic fixture; fail
a required negative/trigger/privacy/authorization check; freeze a candidate;
or take Playground, Production, deployment, migration-application, recovery,
or v0.8.4 action.
