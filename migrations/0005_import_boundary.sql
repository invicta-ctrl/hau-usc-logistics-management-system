INSERT INTO accounts (
  id, access_id_normalized, status, role_id, profile_full_name,
  credential_version, created_at, updated_at
) VALUES (
  'SYSTEM-IMPORT', 'SYSTEM.IMPORT', 'DISABLED', 'ADMINISTRATOR', 'Migration Import Service',
  1, '2026-07-22T00:00:00.000Z', '2026-07-22T00:00:00.000Z'
);

INSERT INTO app_metadata (key, value, updated_at)
VALUES ('google_sheet_cutover_state', 'PRE_CUTOVER', '2026-07-22T00:00:00.000Z');

CREATE TRIGGER import_batch_cutover_guard
BEFORE INSERT ON import_batches
WHEN (SELECT value FROM app_metadata WHERE key = 'google_sheet_cutover_state') <> 'PRE_CUTOVER'
BEGIN
  SELECT RAISE(ABORT, 'Google Sheet imports are blocked after D1 cutover');
END;

UPDATE app_metadata
SET value = '5', updated_at = '2026-07-22T00:00:00.000Z'
WHERE key = 'operational_schema_version';
