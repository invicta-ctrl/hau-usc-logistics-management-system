ALTER TABLE accounts ADD COLUMN locked_at TEXT;
ALTER TABLE accounts ADD COLUMN last_access_id_changed_at TEXT;

CREATE UNIQUE INDEX uq_accounts_access_id_collision
ON accounts (
  UPPER(REPLACE(REPLACE(REPLACE(access_id_normalized, '.', ''), '-', ''), '_', ''))
);

CREATE TABLE access_id_reservations (
  collision_key TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  access_id_snapshot TEXT NOT NULL,
  reserved_at TEXT NOT NULL,
  reservation_reason TEXT NOT NULL
) STRICT;

INSERT INTO access_id_reservations (
  collision_key,
  account_id,
  access_id_snapshot,
  reserved_at,
  reservation_reason
)
SELECT
  UPPER(REPLACE(REPLACE(REPLACE(access_id_normalized, '.', ''), '-', ''), '_', '')),
  id,
  access_id_normalized,
  created_at,
  'ACCOUNT_BASELINE'
FROM accounts;

CREATE TABLE access_id_history (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  old_access_id_normalized TEXT NOT NULL,
  new_access_id_normalized TEXT NOT NULL,
  changed_by_account_id TEXT NOT NULL REFERENCES accounts(id),
  actor_access_id_snapshot TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  environment TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE
) STRICT;

CREATE INDEX idx_access_id_history_account_time
ON access_id_history(account_id, changed_at DESC);

CREATE TRIGGER access_id_history_no_update
BEFORE UPDATE ON access_id_history
BEGIN
  SELECT RAISE(ABORT, 'access ID history is append-only');
END;

CREATE TRIGGER access_id_history_no_delete
BEFORE DELETE ON access_id_history
BEGIN
  SELECT RAISE(ABORT, 'access ID history is append-only');
END;

CREATE TRIGGER access_id_reservations_no_update
BEFORE UPDATE ON access_id_reservations
BEGIN
  SELECT RAISE(ABORT, 'access ID reservations are append-only');
END;

CREATE TRIGGER access_id_reservations_no_delete
BEFORE DELETE ON access_id_reservations
BEGIN
  SELECT RAISE(ABORT, 'access ID reservations are append-only');
END;

UPDATE app_metadata
SET value = '8', updated_at = '2026-07-22T00:00:00.000Z'
WHERE key = 'operational_schema_version';
