PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO roles (id, label, scope_mode)
VALUES ('SYSTEM_OWNER', 'System Owner', 'ALL');

INSERT OR IGNORE INTO capabilities (id, description) VALUES
  ('lending.usage.view', 'View governed lending usage'),
  ('advertisement.manage', 'Manage governed advertisements');

INSERT OR IGNORE INTO role_capabilities (role_id, capability_id)
SELECT 'SYSTEM_OWNER', id FROM capabilities;

UPDATE app_metadata
SET value = '19', updated_at = '2026-07-26T05:30:00.000Z'
WHERE key = 'operational_schema_version';
