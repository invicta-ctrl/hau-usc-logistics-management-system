ALTER TABLE accounts ADD COLUMN lending_eligible INTEGER NOT NULL DEFAULT 0
  CHECK (lending_eligible IN (0, 1));
ALTER TABLE accounts ADD COLUMN institution_id TEXT NOT NULL DEFAULT '';

CREATE UNIQUE INDEX uq_accounts_institution_id
ON accounts(institution_id)
WHERE institution_id <> '';

UPDATE app_metadata
SET value = '9', updated_at = '2026-07-22T10:00:00.000Z'
WHERE key = 'operational_schema_version';
