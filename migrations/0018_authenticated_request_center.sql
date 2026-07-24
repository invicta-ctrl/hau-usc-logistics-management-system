ALTER TABLE requests ADD COLUMN requester_department_id TEXT REFERENCES requester_departments(id);

CREATE INDEX idx_requests_department_event_status
ON requests(requester_department_id, event_series_id, event_id, status, updated_at);

UPDATE requests
SET requester_department_id = (
  SELECT account.department_id
  FROM accounts account
  WHERE account.id = requests.requester_account_id
)
WHERE requester_account_id IS NOT NULL
  AND requester_department_id IS NULL;

UPDATE app_metadata
SET value = '18', updated_at = '2026-07-24T06:30:00.000Z'
WHERE key = 'operational_schema_version';
