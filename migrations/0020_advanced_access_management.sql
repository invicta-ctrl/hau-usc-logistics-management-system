PRAGMA foreign_keys = ON;

CREATE TABLE account_access_profiles (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id),
  preset_id TEXT NOT NULL DEFAULT 'CUSTOM',
  workspace_ids_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(workspace_ids_json)),
  default_workspace_id TEXT NOT NULL DEFAULT '',
  location_scope_ids_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(location_scope_ids_json)),
  event_series_scope_ids_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(event_series_scope_ids_json)),
  event_scope_ids_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(event_scope_ids_json)),
  capability_grants_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(capability_grants_json)),
  capability_denies_json TEXT NOT NULL DEFAULT '[]' CHECK (json_valid(capability_denies_json)),
  updated_at TEXT NOT NULL,
  updated_by_account_id TEXT NOT NULL REFERENCES accounts(id)
) STRICT;

CREATE TABLE access_policy_changes (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  idempotency_key TEXT NOT NULL UNIQUE,
  before_json TEXT NOT NULL CHECK (json_valid(before_json)),
  after_json TEXT NOT NULL CHECK (json_valid(after_json)),
  changed_at TEXT NOT NULL,
  reason TEXT NOT NULL,
  correlation_id TEXT NOT NULL
) STRICT;

CREATE INDEX idx_access_policy_changes_account_time
  ON access_policy_changes(account_id, changed_at DESC);

CREATE TRIGGER access_policy_changes_no_update
BEFORE UPDATE ON access_policy_changes
BEGIN
  SELECT RAISE(ABORT, 'access policy history is append-only');
END;

CREATE TRIGGER access_policy_changes_no_delete
BEFORE DELETE ON access_policy_changes
BEGIN
  SELECT RAISE(ABORT, 'access policy history is append-only');
END;

UPDATE app_metadata
SET value = '20', updated_at = '2026-07-26T08:35:00.000Z'
WHERE key = 'operational_schema_version';
