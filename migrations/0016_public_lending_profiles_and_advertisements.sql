CREATE TABLE public_lending_submissions (
  id TEXT PRIMARY KEY,
  borrower_type TEXT NOT NULL CHECK (borrower_type IN ('USC_STAFF', 'ANGELITE')),
  borrower_name TEXT NOT NULL,
  student_id TEXT NOT NULL,
  course_year TEXT NOT NULL DEFAULT '',
  academic_department TEXT NOT NULL DEFAULT '',
  usc_department TEXT NOT NULL DEFAULT '',
  position_role TEXT NOT NULL DEFAULT '',
  contact_number TEXT NOT NULL,
  email TEXT NOT NULL,
  purpose TEXT NOT NULL,
  requested_pickup_date TEXT NOT NULL,
  requested_due_date TEXT NOT NULL DEFAULT '',
  responsibility_acknowledged_at TEXT NOT NULL,
  receipt_digest TEXT NOT NULL UNIQUE,
  client_request_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES accounts(id)
) STRICT;

CREATE TABLE public_lending_submission_tickets (
  public_lending_submission_id TEXT NOT NULL REFERENCES public_lending_submissions(id) ON DELETE CASCADE,
  lending_ticket_id TEXT NOT NULL UNIQUE REFERENCES lending_tickets(id) ON DELETE CASCADE,
  PRIMARY KEY (public_lending_submission_id, lending_ticket_id)
) STRICT;

CREATE TABLE public_advertisements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  alt_text TEXT NOT NULL,
  call_to_action TEXT NOT NULL DEFAULT '',
  image_asset_key TEXT NOT NULL,
  destination_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
  display_order INTEGER NOT NULL DEFAULT 0,
  publish_at TEXT,
  expire_at TEXT,
  created_by TEXT NOT NULL REFERENCES accounts(id),
  updated_by TEXT NOT NULL REFERENCES accounts(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
) STRICT;

CREATE TABLE advertisement_mutation_results (
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_hash TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (actor_account_id, operation, idempotency_key)
) STRICT;

CREATE INDEX idx_public_lending_submission_created
ON public_lending_submissions(created_at, id);

CREATE INDEX idx_public_advertisements_rotation
ON public_advertisements(status, display_order, publish_at, expire_at);

INSERT INTO public_advertisements (
  id, title, description, alt_text, call_to_action, image_asset_key,
  destination_url, status, display_order, publish_at, expire_at,
  created_by, updated_by, created_at, updated_at
) VALUES (
  'ADV-EXECUTIVE-STAFF-APPLICATIONS-2026',
  'Executive Staff Applications',
  'Applications remain open until July 31, 2026.',
  'HAU-USC Executive Staff Applications are still open until July 31, 2026.',
  'View announcement',
  'advertisements/executive-staff-applications.jpg',
  'https://www.facebook.com/share/p/18d7LBePeP/',
  'ACTIVE',
  10,
  '2026-07-24T00:00:00.000Z',
  '2026-08-01T00:00:00.000Z',
  'SYSTEM-PUBLIC-REQUEST',
  'SYSTEM-PUBLIC-REQUEST',
  '2026-07-24T04:30:00.000Z',
  '2026-07-24T04:30:00.000Z'
);

INSERT INTO audit_log (
  id, created_at, action, entity_type, entity_id, actor_account_id,
  after_json, correlation_id, notes
) VALUES (
  'AUD-ADVERTISEMENT-SEED-2026',
  '2026-07-24T04:30:00.000Z',
  'ADVERTISEMENT_CREATED',
  'ADVERTISEMENT',
  'ADV-EXECUTIVE-STAFF-APPLICATIONS-2026',
  'SYSTEM-PUBLIC-REQUEST',
  '{"status":"ACTIVE","source":"OWNER_APPROVED_AMENDMENT"}',
  'MIGRATION-0016',
  'Owner-approved Executive Staff application advertisement seed.'
);

UPDATE app_metadata
SET value = '16', updated_at = '2026-07-24T04:30:00.000Z'
WHERE key = 'operational_schema_version';
