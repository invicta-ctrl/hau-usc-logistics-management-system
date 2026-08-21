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
