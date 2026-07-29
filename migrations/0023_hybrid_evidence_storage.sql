ALTER TABLE evidence_metadata
ADD COLUMN primary_storage_status TEXT NOT NULL DEFAULT 'VERIFIED'
CHECK (primary_storage_status IN ('VERIFIED', 'RESTORE_REQUIRED', 'ARCHIVED'));

ALTER TABLE evidence_metadata
ADD COLUMN primary_etag TEXT NOT NULL DEFAULT '';

ALTER TABLE evidence_metadata
ADD COLUMN primary_version TEXT NOT NULL DEFAULT '';

ALTER TABLE evidence_metadata
ADD COLUMN retention_class TEXT NOT NULL DEFAULT 'HAU_USC_OPERATIONAL_EVIDENCE';

ALTER TABLE evidence_metadata
ADD COLUMN retention_until TEXT NOT NULL DEFAULT '';

ALTER TABLE evidence_metadata
ADD COLUMN archived_at TEXT NOT NULL DEFAULT '';

CREATE TABLE evidence_backup_jobs (
  id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL UNIQUE REFERENCES evidence_metadata(id),
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN (
      'PENDING',
      'IN_PROGRESS',
      'SYNCED',
      'RETRYING',
      'FAILED',
      'RESTORE_REQUIRED',
      'ARCHIVED'
    )),
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  max_attempts INTEGER NOT NULL DEFAULT 8 CHECK (max_attempts BETWEEN 1 AND 20),
  next_attempt_at TEXT NOT NULL,
  locked_at TEXT NOT NULL DEFAULT '',
  drive_file_id TEXT NOT NULL DEFAULT '',
  verified_size_bytes INTEGER,
  provider_checksum TEXT NOT NULL DEFAULT '',
  provider_checksum_type TEXT NOT NULL DEFAULT '',
  verified_at TEXT NOT NULL DEFAULT '',
  last_error_code TEXT NOT NULL DEFAULT '',
  last_reconciled_at TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX idx_evidence_backup_jobs_due
ON evidence_backup_jobs(status, next_attempt_at, updated_at);

CREATE INDEX idx_evidence_backup_jobs_reconcile
ON evidence_backup_jobs(last_reconciled_at);

CREATE TABLE evidence_restore_history (
  id TEXT PRIMARY KEY,
  evidence_id TEXT NOT NULL REFERENCES evidence_metadata(id),
  source_drive_file_id TEXT NOT NULL,
  prior_r2_object_key TEXT NOT NULL,
  restored_r2_object_key TEXT NOT NULL,
  sha256 TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes > 0),
  restored_by TEXT NOT NULL REFERENCES accounts(id),
  restored_at TEXT NOT NULL,
  reason TEXT NOT NULL CHECK (trim(reason) <> ''),
  correlation_id TEXT NOT NULL
) STRICT;

CREATE INDEX idx_evidence_restore_history_evidence
ON evidence_restore_history(evidence_id, restored_at);

CREATE TRIGGER evidence_restore_history_no_update
BEFORE UPDATE ON evidence_restore_history
BEGIN
  SELECT RAISE(ABORT, 'evidence restore history is append-only');
END;

CREATE TRIGGER evidence_restore_history_no_delete
BEFORE DELETE ON evidence_restore_history
BEGIN
  SELECT RAISE(ABORT, 'evidence restore history is append-only');
END;

UPDATE app_metadata
SET value = '23', updated_at = '2026-07-26T20:00:00.000Z'
WHERE key = 'operational_schema_version';
