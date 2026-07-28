INSERT OR IGNORE INTO capabilities (id, description)
VALUES ('brand.manage', 'Upload, publish, replace, and roll back governed brand assets');

INSERT OR IGNORE INTO role_capabilities (role_id, capability_id)
SELECT id, 'brand.manage'
FROM roles
WHERE id = 'SYSTEM_OWNER';

CREATE TABLE brand_asset_slots (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  public_path TEXT NOT NULL UNIQUE,
  published_version_id TEXT,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT REFERENCES accounts(id)
) STRICT;

CREATE TABLE brand_asset_versions (
  id TEXT PRIMARY KEY,
  slot_id TEXT NOT NULL REFERENCES brand_asset_slots(id),
  version_number INTEGER NOT NULL CHECK (version_number >= 1),
  object_key TEXT NOT NULL UNIQUE,
  content_type TEXT NOT NULL CHECK (content_type IN ('image/jpeg', 'image/png', 'image/webp', 'image/svg+xml')),
  byte_size INTEGER NOT NULL CHECK (byte_size >= 32),
  width INTEGER NOT NULL CHECK (width >= 1),
  height INTEGER NOT NULL CHECK (height >= 1),
  content_sha256 TEXT NOT NULL CHECK (length(content_sha256) = 64),
  alt_text TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'PUBLISHED', 'RETIRED')),
  uploaded_by TEXT NOT NULL REFERENCES accounts(id),
  uploaded_at TEXT NOT NULL,
  published_by TEXT REFERENCES accounts(id),
  published_at TEXT,
  UNIQUE (slot_id, version_number),
  UNIQUE (slot_id, content_sha256)
) STRICT;

CREATE UNIQUE INDEX idx_brand_asset_one_published_version
  ON brand_asset_versions(slot_id)
  WHERE status = 'PUBLISHED';

CREATE INDEX idx_brand_asset_versions_slot
  ON brand_asset_versions(slot_id, version_number DESC);

CREATE TABLE brand_asset_history (
  id TEXT PRIMARY KEY,
  slot_id TEXT NOT NULL REFERENCES brand_asset_slots(id),
  version_id TEXT REFERENCES brand_asset_versions(id),
  action TEXT NOT NULL CHECK (action IN ('UPLOADED', 'PUBLISHED', 'REPLACED', 'ROLLED_BACK')),
  before_json TEXT CHECK (before_json IS NULL OR json_valid(before_json)),
  after_json TEXT NOT NULL CHECK (json_valid(after_json)),
  reason TEXT NOT NULL,
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  occurred_at TEXT NOT NULL,
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  UNIQUE (actor_account_id, action, idempotency_key)
) STRICT;

CREATE INDEX idx_brand_asset_history_slot
  ON brand_asset_history(slot_id, occurred_at DESC);

CREATE TRIGGER brand_asset_history_no_update
BEFORE UPDATE ON brand_asset_history
BEGIN
  SELECT RAISE(ABORT, 'brand asset history is append-only');
END;

CREATE TRIGGER brand_asset_history_no_delete
BEFORE DELETE ON brand_asset_history
BEGIN
  SELECT RAISE(ABORT, 'brand asset history is append-only');
END;

CREATE TABLE brand_asset_mutation_results (
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL CHECK (length(request_hash) = 64),
  result_json TEXT NOT NULL CHECK (json_valid(result_json)),
  created_at TEXT NOT NULL,
  PRIMARY KEY (actor_account_id, operation, idempotency_key)
) STRICT;

INSERT INTO brand_asset_slots (id, label, public_path, created_at, updated_at) VALUES
  ('usc-logo', 'USC logo', '/brand/usc-logo', '2026-07-28T00:00:00.000Z', '2026-07-28T00:00:00.000Z'),
  ('dol-logo', 'DOL logo', '/brand/dol-logo', '2026-07-28T00:00:00.000Z', '2026-07-28T00:00:00.000Z'),
  ('combined-lockup', 'Combined lockup', '/brand/combined-lockup', '2026-07-28T00:00:00.000Z', '2026-07-28T00:00:00.000Z'),
  ('favicon', 'Favicon', '/brand/favicon', '2026-07-28T00:00:00.000Z', '2026-07-28T00:00:00.000Z'),
  ('login-background', 'Login background', '/brand/login-background', '2026-07-28T00:00:00.000Z', '2026-07-28T00:00:00.000Z'),
  ('default-item-image', 'Default item image', '/brand/default-item-image', '2026-07-28T00:00:00.000Z', '2026-07-28T00:00:00.000Z');

UPDATE app_metadata
SET value = '28', updated_at = '2026-07-28T00:00:00.000Z'
WHERE key = 'operational_schema_version';
