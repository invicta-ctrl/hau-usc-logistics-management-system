CREATE TABLE data_revisions (
  scope TEXT PRIMARY KEY,
  revision INTEGER NOT NULL DEFAULT 0 CHECK (revision >= 0),
  updated_at TEXT NOT NULL
) STRICT;

INSERT INTO data_revisions (scope, revision, updated_at) VALUES
  ('global', 0, '2026-07-22T00:00:00.000Z'),
  ('overview', 0, '2026-07-22T00:00:00.000Z'),
  ('request', 0, '2026-07-22T00:00:00.000Z'),
  ('lending', 0, '2026-07-22T00:00:00.000Z'),
  ('release', 0, '2026-07-22T00:00:00.000Z'),
  ('restocking', 0, '2026-07-22T00:00:00.000Z'),
  ('procurement', 0, '2026-07-22T00:00:00.000Z'),
  ('inventory', 0, '2026-07-22T00:00:00.000Z');

UPDATE app_metadata
SET value = '4', updated_at = '2026-07-22T00:00:00.000Z'
WHERE key = 'operational_schema_version';
