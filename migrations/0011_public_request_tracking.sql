INSERT OR IGNORE INTO accounts (
  id, access_id_normalized, status, role_id, credential_version,
  created_at, updated_at, lending_eligible, institution_id
) VALUES (
  'SYSTEM-PUBLIC-REQUEST', 'SYSTEM.PUBLIC.REQUEST', 'REVOKED', 'REQUESTER', 1,
  '2026-07-22T15:00:00.000Z', '2026-07-22T15:00:00.000Z', 0, ''
);

CREATE TABLE public_request_access (
  request_id TEXT PRIMARY KEY REFERENCES requests(id) ON DELETE CASCADE,
  tracking_digest TEXT NOT NULL UNIQUE,
  contact_number TEXT NOT NULL,
  requested_start_date TEXT,
  requested_end_date TEXT,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE public_request_rate_limit_events (
  id TEXT PRIMARY KEY,
  limiter_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('SUBMIT', 'TRACK')),
  attempted_at INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_public_request_rate_limit_key_time
ON public_request_rate_limit_events(limiter_key, attempted_at);

UPDATE app_metadata
SET value = '11', updated_at = '2026-07-22T15:00:00.000Z'
WHERE key = 'operational_schema_version';
