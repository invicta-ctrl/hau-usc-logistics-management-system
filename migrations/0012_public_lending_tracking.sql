UPDATE accounts
SET default_committee_id = 'COM_INVENTORY_PANTRY', updated_at = '2026-07-22T16:00:00.000Z'
WHERE id = 'SYSTEM-PUBLIC-REQUEST';

INSERT OR IGNORE INTO account_committees (
  account_id, committee_id, membership_type, active, source, source_revision
) VALUES (
  'SYSTEM-PUBLIC-REQUEST', 'COM_INVENTORY_PANTRY', 'SERVICE_ROUTE', 1,
  'MIGRATION', '0012_public_lending_tracking.sql'
);

CREATE TABLE public_lending_requests (
  id TEXT PRIMARY KEY,
  tracking_digest TEXT NOT NULL UNIQUE,
  borrower_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  course_year TEXT NOT NULL,
  department TEXT NOT NULL CHECK (department IN ('SEA', 'SBA', 'CCJEF', 'SAS', 'SED', 'SOC', 'SNAMS')),
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  requested_pickup_date TEXT NOT NULL,
  requested_due_date TEXT NOT NULL,
  responsibility_acknowledged_at TEXT NOT NULL,
  client_request_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES accounts(id)
) STRICT;

CREATE TABLE public_lending_request_tickets (
  public_lending_request_id TEXT NOT NULL REFERENCES public_lending_requests(id) ON DELETE CASCADE,
  lending_ticket_id TEXT NOT NULL UNIQUE REFERENCES lending_tickets(id) ON DELETE CASCADE,
  PRIMARY KEY (public_lending_request_id, lending_ticket_id)
) STRICT;

CREATE TABLE public_lending_rate_limit_events (
  id TEXT PRIMARY KEY,
  limiter_key TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('SUBMIT', 'TRACK')),
  attempted_at INTEGER NOT NULL
) STRICT;

CREATE INDEX idx_public_lending_rate_limit_key_time
ON public_lending_rate_limit_events(limiter_key, attempted_at);

UPDATE app_metadata
SET value = '12', updated_at = '2026-07-22T16:00:00.000Z'
WHERE key = 'operational_schema_version';
