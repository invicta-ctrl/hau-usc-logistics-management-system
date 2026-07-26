PRAGMA foreign_keys = ON;

CREATE TABLE identity_roster_sync_runs (
  id TEXT PRIMARY KEY,
  source_fingerprint TEXT NOT NULL,
  source_row_count INTEGER NOT NULL CHECK (source_row_count >= 0),
  accepted_count INTEGER NOT NULL CHECK (accepted_count >= 0),
  rejection_count INTEGER NOT NULL CHECK (rejection_count >= 0),
  add_count INTEGER NOT NULL CHECK (add_count >= 0),
  change_count INTEGER NOT NULL CHECK (change_count >= 0),
  removal_count INTEGER NOT NULL CHECK (removal_count >= 0),
  unchanged_count INTEGER NOT NULL CHECK (unchanged_count >= 0),
  validation_status TEXT NOT NULL CHECK (validation_status IN ('VALID', 'REJECTED')),
  apply_status TEXT NOT NULL CHECK (apply_status IN ('PREVIEWED', 'APPLIED', 'ROLLED_BACK')),
  protected_source_envelope TEXT NOT NULL,
  protected_rejections_envelope TEXT NOT NULL,
  created_by_account_id TEXT NOT NULL REFERENCES accounts(id),
  created_at TEXT NOT NULL,
  applied_at TEXT,
  rolled_back_at TEXT,
  rollback_of_run_id TEXT REFERENCES identity_roster_sync_runs(id),
  correlation_id TEXT NOT NULL
) STRICT;

CREATE INDEX idx_identity_roster_sync_runs_created
  ON identity_roster_sync_runs(created_at DESC);

CREATE TABLE identity_roster_entries (
  identity_key TEXT PRIMARY KEY,
  protected_profile_envelope TEXT NOT NULL,
  active INTEGER NOT NULL CHECK (active IN (0, 1)),
  source_fingerprint TEXT NOT NULL,
  source_run_id TEXT NOT NULL REFERENCES identity_roster_sync_runs(id),
  updated_at TEXT NOT NULL
) STRICT;

CREATE INDEX idx_identity_roster_entries_active
  ON identity_roster_entries(active, updated_at DESC);

CREATE TABLE identity_roster_rollback_snapshots (
  run_id TEXT PRIMARY KEY REFERENCES identity_roster_sync_runs(id),
  protected_snapshot_envelope TEXT NOT NULL,
  entry_count INTEGER NOT NULL CHECK (entry_count >= 0),
  created_at TEXT NOT NULL,
  created_by_account_id TEXT NOT NULL REFERENCES accounts(id)
) STRICT;

CREATE TRIGGER identity_roster_snapshots_no_update
BEFORE UPDATE ON identity_roster_rollback_snapshots
BEGIN
  SELECT RAISE(ABORT, 'identity roster rollback snapshots are append-only');
END;

CREATE TRIGGER identity_roster_snapshots_no_delete
BEFORE DELETE ON identity_roster_rollback_snapshots
BEGIN
  SELECT RAISE(ABORT, 'identity roster rollback snapshots are append-only');
END;

UPDATE app_metadata
SET value = '21', updated_at = '2026-07-26T09:30:00.000Z'
WHERE key = 'operational_schema_version';
