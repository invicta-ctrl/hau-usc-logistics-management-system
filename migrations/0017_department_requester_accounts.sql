CREATE TABLE requester_departments (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL UNIQUE,
  recommended_access_id TEXT NOT NULL UNIQUE,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

INSERT INTO requester_departments (
  id, code, display_name, recommended_access_id, active, created_at, updated_at
) VALUES
  ('USC-DEPT-DOL', 'DOL', 'Department of Logistics', 'DOL_2026', 1, '2026-07-24T06:00:00.000Z', '2026-07-24T06:00:00.000Z'),
  ('USC-DEPT-DOF', 'DOF', 'Department of Finance', 'DOF_2026', 1, '2026-07-24T06:00:00.000Z', '2026-07-24T06:00:00.000Z'),
  ('USC-DEPT-DPC', 'DPC', 'Department of Public Communications', 'DPC_2026', 1, '2026-07-24T06:00:00.000Z', '2026-07-24T06:00:00.000Z'),
  ('USC-DEPT-DEM', 'DEM', 'Department of Events Management', 'DEM_2026', 1, '2026-07-24T06:00:00.000Z', '2026-07-24T06:00:00.000Z'),
  ('USC-DEPT-DBR', 'DBR', 'Department of Business Relations', 'DBR_2026', 1, '2026-07-24T06:00:00.000Z', '2026-07-24T06:00:00.000Z'),
  ('USC-DEPT-OP', 'OP', 'Office of the President', 'OP_2026', 1, '2026-07-24T06:00:00.000Z', '2026-07-24T06:00:00.000Z'),
  ('USC-DEPT-OVP', 'OVP', 'Office of the Vice President', 'OVP_2026', 1, '2026-07-24T06:00:00.000Z', '2026-07-24T06:00:00.000Z'),
  ('USC-DEPT-OSG', 'OSG', 'Office of the Secretary General', 'OSG_2026', 1, '2026-07-24T06:00:00.000Z', '2026-07-24T06:00:00.000Z'),
  ('USC-DEPT-DHR', 'DHR', 'Department of Human Resources', 'DHR_2026', 1, '2026-07-24T06:00:00.000Z', '2026-07-24T06:00:00.000Z'),
  ('USC-DEPT-DCES', 'DCES', 'Department of Community Extensions Services', 'DCES_2026', 1, '2026-07-24T06:00:00.000Z', '2026-07-24T06:00:00.000Z');

ALTER TABLE accounts ADD COLUMN department_id TEXT REFERENCES requester_departments(id);
ALTER TABLE accounts ADD COLUMN password_changed_at TEXT;
ALTER TABLE accounts ADD COLUMN last_password_reset_at TEXT;

CREATE UNIQUE INDEX uq_accounts_requester_department
ON accounts(department_id)
WHERE department_id IS NOT NULL;

CREATE INDEX idx_accounts_requester_department_status
ON accounts(department_id, status, updated_at);

UPDATE app_metadata
SET value = '17', updated_at = '2026-07-24T06:00:00.000Z'
WHERE key = 'operational_schema_version';
