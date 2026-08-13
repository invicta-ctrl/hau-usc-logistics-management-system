PRAGMA foreign_keys = ON;

CREATE TABLE canonical_people (
  person_id TEXT PRIMARY KEY CHECK (
    length(person_id) = 40
    AND substr(person_id, 1, 4) = 'PER-'
    AND substr(person_id, 13, 1) = '-'
    AND substr(person_id, 18, 1) = '-'
    AND substr(person_id, 23, 1) = '-'
    AND substr(person_id, 28, 1) = '-'
    AND substr(person_id, 19, 1) IN ('1', '2', '3', '4', '5', '6', '7', '8')
    AND substr(person_id, 24, 1) IN ('8', '9', 'A', 'B')
    AND substr(person_id, 5) NOT GLOB '*[^0-9A-F-]*'
    AND length(replace(substr(person_id, 5), '-', '')) = 32
  ),
  source_provenance_envelope TEXT,
  created_at TEXT NOT NULL
) STRICT;

CREATE TRIGGER canonical_people_person_id_immutable
BEFORE UPDATE OF person_id ON canonical_people
BEGIN
  SELECT RAISE(ABORT, 'canonical person identifier is immutable');
END;

CREATE TABLE person_emails (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES canonical_people(person_id),
  protected_email_envelope TEXT NOT NULL,
  normalized_email_fingerprint TEXT NOT NULL CHECK (
    length(trim(normalized_email_fingerprint)) BETWEEN 16 AND 256
  ),
  state TEXT NOT NULL CHECK (state IN ('ACTIVE', 'SUPERSEDED', 'QUARANTINED')),
  verification_state TEXT NOT NULL CHECK (
    verification_state IN ('UNVERIFIED', 'VERIFIED', 'AMBIGUOUS')
  ),
  is_primary INTEGER NOT NULL DEFAULT 0 CHECK (is_primary IN (0, 1)),
  source_provenance_envelope TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (is_primary = 0 OR (state = 'ACTIVE' AND verification_state = 'VERIFIED'))
) STRICT;

CREATE UNIQUE INDEX uq_person_emails_active_primary
  ON person_emails(person_id)
  WHERE is_primary = 1 AND state = 'ACTIVE';

CREATE UNIQUE INDEX uq_person_emails_verified_active_fingerprint
  ON person_emails(normalized_email_fingerprint)
  WHERE state = 'ACTIVE' AND verification_state = 'VERIFIED';

CREATE INDEX idx_person_emails_person_time
  ON person_emails(person_id, created_at DESC, id);

CREATE TABLE account_staff_links (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  person_id TEXT NOT NULL REFERENCES canonical_people(person_id),
  state TEXT NOT NULL CHECK (state IN ('ACTIVE', 'REVOKED', 'QUARANTINED')),
  source_provenance_envelope TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE UNIQUE INDEX uq_account_staff_links_active_account
  ON account_staff_links(account_id)
  WHERE state = 'ACTIVE';

CREATE INDEX idx_account_staff_links_person_time
  ON account_staff_links(person_id, created_at DESC, id);

CREATE TABLE staff_assignments (
  id TEXT PRIMARY KEY,
  person_id TEXT NOT NULL REFERENCES canonical_people(person_id),
  assignment_fingerprint TEXT NOT NULL CHECK (length(trim(assignment_fingerprint)) BETWEEN 16 AND 256),
  protected_assignment_envelope TEXT NOT NULL,
  state TEXT NOT NULL CHECK (state IN ('ACTIVE', 'HISTORICAL', 'QUARANTINED')),
  effective_from TEXT,
  effective_to TEXT,
  source_provenance_envelope TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  CHECK (effective_from IS NULL OR effective_to IS NULL OR effective_from <= effective_to),
  UNIQUE (person_id, assignment_fingerprint)
) STRICT;

CREATE INDEX idx_staff_assignments_person_time
  ON staff_assignments(person_id, created_at DESC, id);

UPDATE app_metadata
SET value = '31', updated_at = '2026-08-14T00:00:00.000Z'
WHERE key = 'operational_schema_version';
