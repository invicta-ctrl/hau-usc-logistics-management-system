ALTER TABLE release_confirmations
ADD COLUMN release_group_id TEXT NOT NULL DEFAULT '';

UPDATE release_confirmations
SET release_group_id = id
WHERE trim(release_group_id) = '';

CREATE INDEX idx_release_confirmations_group
ON release_confirmations(release_group_id, released_at);

CREATE TABLE release_corrections (
  id TEXT PRIMARY KEY,
  release_group_id TEXT NOT NULL,
  release_confirmation_id TEXT NOT NULL REFERENCES release_confirmations(id),
  quantity REAL NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL CHECK (trim(reason) <> ''),
  evidence_id TEXT,
  ledger_transaction_id TEXT NOT NULL UNIQUE REFERENCES inventory_ledger(id),
  corrected_by TEXT NOT NULL REFERENCES accounts(id),
  corrected_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'POSTED' CHECK (status = 'POSTED'),
  UNIQUE (corrected_by, idempotency_key)
) STRICT;

CREATE INDEX idx_release_corrections_confirmation
ON release_corrections(release_confirmation_id, corrected_at);

CREATE INDEX idx_release_corrections_group
ON release_corrections(release_group_id, corrected_at);

CREATE TRIGGER release_correction_state_guard
BEFORE INSERT ON inventory_ledger
WHEN NEW.transaction_type = 'RELEASE_CORRECTION'
  AND (
    NEW.quantity > COALESCE((
      SELECT confirmation.quantity - COALESCE((
        SELECT SUM(correction.quantity)
        FROM release_corrections correction
        WHERE correction.release_confirmation_id = confirmation.id
      ), 0)
      FROM release_confirmations confirmation
      JOIN inventory_ledger original
        ON original.idempotency_key = confirmation.idempotency_key
      WHERE original.id = NEW.reversal_of
    ), 0)
    OR NEW.quantity > COALESCE((
      SELECT line.released_quantity
      FROM release_confirmations confirmation
      JOIN request_lines line ON line.id = confirmation.request_line_id
      JOIN inventory_ledger original
        ON original.idempotency_key = confirmation.idempotency_key
      WHERE original.id = NEW.reversal_of
    ), 0)
  )
BEGIN
  SELECT RAISE(ABORT, 'release correction state conflict');
END;

CREATE TRIGGER release_corrections_no_update
BEFORE UPDATE ON release_corrections
BEGIN
  SELECT RAISE(ABORT, 'release corrections are append-only');
END;

CREATE TRIGGER release_corrections_no_delete
BEFORE DELETE ON release_corrections
BEGIN
  SELECT RAISE(ABORT, 'release corrections are append-only');
END;

CREATE TRIGGER evidence_metadata_duplicate_guard
BEFORE INSERT ON evidence_metadata
WHEN UPPER(NEW.upload_status) IN ('STORED', 'VERIFIED')
  AND EXISTS (
    SELECT 1
    FROM evidence_metadata evidence
    WHERE evidence.sha256 = NEW.sha256
      AND evidence.related_entity_type = NEW.related_entity_type
      AND evidence.related_entity_id = NEW.related_entity_id
      AND UPPER(evidence.upload_status) IN ('STORED', 'VERIFIED')
  )
BEGIN
  SELECT RAISE(ABORT, 'evidence duplicate conflict');
END;

UPDATE app_metadata
SET value = '22', updated_at = '2026-07-26T18:15:00.000Z'
WHERE key = 'operational_schema_version';
