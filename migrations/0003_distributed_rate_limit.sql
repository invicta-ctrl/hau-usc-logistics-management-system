CREATE TABLE auth_rate_limit_events (
  id TEXT PRIMARY KEY,
  limiter_key TEXT NOT NULL,
  attempted_at INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_auth_rate_limit_events_key_time
ON auth_rate_limit_events(limiter_key, attempted_at);

UPDATE app_metadata
SET value = '3', updated_at = '2026-07-22T00:00:00.000Z'
WHERE key = 'operational_schema_version';
