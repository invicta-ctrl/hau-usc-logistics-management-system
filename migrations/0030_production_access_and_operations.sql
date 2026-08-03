PRAGMA foreign_keys = ON;

ALTER TABLE accounts ADD COLUMN username_normalized TEXT;
ALTER TABLE accounts ADD COLUMN verified_email_fingerprint TEXT;
ALTER TABLE accounts ADD COLUMN profile_course_id TEXT;
ALTER TABLE accounts ADD COLUMN profile_year_level INTEGER CHECK (
  profile_year_level IS NULL OR (profile_year_level >= 1 AND profile_year_level <= 20)
);
ALTER TABLE accounts ADD COLUMN avatar_asset_key TEXT;
ALTER TABLE accounts ADD COLUMN avatar_updated_at TEXT;

CREATE UNIQUE INDEX uq_accounts_username_normalized
  ON accounts(username_normalized)
  WHERE username_normalized IS NOT NULL AND trim(username_normalized) <> '';

CREATE UNIQUE INDEX uq_accounts_active_verified_email_fingerprint
  ON accounts(verified_email_fingerprint)
  WHERE verified_email_fingerprint IS NOT NULL
    AND trim(verified_email_fingerprint) <> ''
    AND profile_email_verified_at IS NOT NULL
    AND status IN ('STARTER', 'ACTIVE');

CREATE TABLE email_verification_challenges (
  id TEXT PRIMARY KEY,
  email_fingerprint TEXT NOT NULL,
  protected_email_envelope TEXT NOT NULL,
  identity_class_id TEXT NOT NULL,
  secret_digest TEXT NOT NULL UNIQUE,
  verification_receipt_digest TEXT UNIQUE,
  purpose TEXT NOT NULL CHECK (purpose = 'STAFF_ACCOUNT_APPLICATION'),
  status TEXT NOT NULL CHECK (
    status IN ('PENDING', 'VERIFIED', 'CONSUMED', 'EXPIRED', 'REVOKED')
  ),
  expires_at TEXT NOT NULL,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count >= 0),
  resend_count INTEGER NOT NULL DEFAULT 0 CHECK (resend_count >= 0),
  created_at TEXT NOT NULL,
  last_sent_at TEXT NOT NULL,
  verified_at TEXT,
  consumed_at TEXT
) STRICT;

CREATE INDEX idx_email_verification_challenges_fingerprint_status
  ON email_verification_challenges(email_fingerprint, status, expires_at DESC);

CREATE INDEX idx_email_verification_challenges_expiry
  ON email_verification_challenges(status, expires_at);

CREATE TABLE account_applications (
  id TEXT PRIMARY KEY,
  application_code TEXT NOT NULL UNIQUE,
  email_fingerprint TEXT NOT NULL,
  protected_email_envelope TEXT NOT NULL,
  protected_profile_envelope TEXT NOT NULL,
  department_id TEXT NOT NULL,
  course_id TEXT NOT NULL DEFAULT '',
  year_level INTEGER CHECK (year_level IS NULL OR (year_level >= 1 AND year_level <= 20)),
  requested_username_normalized TEXT NOT NULL,
  pending_password_credential_json TEXT CHECK (
    pending_password_credential_json IS NULL OR json_valid(pending_password_credential_json)
  ),
  requested_access_json TEXT NOT NULL CHECK (json_valid(requested_access_json)),
  state TEXT NOT NULL CHECK (
    state IN (
      'EMAIL_UNVERIFIED',
      'DRAFT',
      'PENDING_ADMIN_REVIEW',
      'CHANGES_REQUESTED',
      'PENDING_DIRECTOR_APPROVAL',
      'APPROVED_ACTIVATION_REQUIRED',
      'ACTIVE',
      'REJECTED',
      'WITHDRAWN',
      'EXPIRED',
      'ARCHIVED'
    )
  ),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  status_token_digest TEXT NOT NULL UNIQUE,
  status_token_expires_at TEXT NOT NULL,
  client_request_id TEXT NOT NULL UNIQUE,
  administrator_reviewer_id TEXT REFERENCES accounts(id),
  administrator_reviewed_at TEXT,
  director_reviewer_id TEXT REFERENCES accounts(id),
  director_reviewed_at TEXT,
  approved_account_id TEXT UNIQUE REFERENCES accounts(id),
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT
) STRICT;

CREATE INDEX idx_account_applications_state_updated
  ON account_applications(state, updated_at DESC, id);

CREATE INDEX idx_account_applications_email_state
  ON account_applications(email_fingerprint, state, updated_at DESC);

CREATE INDEX idx_account_applications_username_state
  ON account_applications(requested_username_normalized, state, updated_at DESC);

CREATE TABLE account_application_history (
  id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES account_applications(id),
  from_state TEXT NOT NULL,
  to_state TEXT NOT NULL,
  actor_account_id TEXT REFERENCES accounts(id),
  applicant_authority_fingerprint TEXT NOT NULL DEFAULT '',
  reason TEXT NOT NULL DEFAULT '',
  before_json TEXT NOT NULL CHECK (json_valid(before_json)),
  after_json TEXT NOT NULL CHECK (json_valid(after_json)),
  expected_revision INTEGER NOT NULL CHECK (expected_revision >= 0),
  resulting_revision INTEGER NOT NULL CHECK (resulting_revision >= 1),
  idempotency_key TEXT NOT NULL UNIQUE,
  correlation_id TEXT NOT NULL,
  created_at TEXT NOT NULL
) STRICT;

CREATE INDEX idx_account_application_history_application_time
  ON account_application_history(application_id, created_at DESC, id);

CREATE TRIGGER account_application_history_no_update
BEFORE UPDATE ON account_application_history
BEGIN
  SELECT RAISE(ABORT, 'account application history is append-only');
END;

CREATE TRIGGER account_application_history_no_delete
BEFORE DELETE ON account_application_history
BEGIN
  SELECT RAISE(ABORT, 'account application history is append-only');
END;

CREATE TABLE username_history (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  old_username_normalized TEXT NOT NULL DEFAULT '',
  new_username_normalized TEXT NOT NULL,
  changed_by_account_id TEXT NOT NULL REFERENCES accounts(id),
  reason TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  correlation_id TEXT NOT NULL,
  changed_at TEXT NOT NULL
) STRICT;

CREATE INDEX idx_username_history_account_time
  ON username_history(account_id, changed_at DESC, id);

CREATE TRIGGER username_history_no_update
BEFORE UPDATE ON username_history
BEGIN
  SELECT RAISE(ABORT, 'username history is append-only');
END;

CREATE TRIGGER username_history_no_delete
BEFORE DELETE ON username_history
BEGIN
  SELECT RAISE(ABORT, 'username history is append-only');
END;

CREATE TABLE identity_correction_requests (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id),
  protected_request_envelope TEXT NOT NULL,
  state TEXT NOT NULL CHECK (
    state IN ('PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'ARCHIVED')
  ),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  client_request_id TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  resolved_at TEXT,
  resolved_by_account_id TEXT REFERENCES accounts(id),
  correlation_id TEXT NOT NULL
) STRICT;

CREATE INDEX idx_identity_correction_requests_state_time
  ON identity_correction_requests(state, updated_at DESC, id);

CREATE TABLE reference_links (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  route_id TEXT NOT NULL DEFAULT '',
  link_type TEXT NOT NULL CHECK (
    link_type IN ('RESOURCE', 'FORM', 'POLICY', 'SUPPORT', 'WORKFLOW', 'OTHER')
  ),
  audience TEXT NOT NULL CHECK (
    audience IN ('PUBLIC', 'STAFF', 'ADMINISTRATOR', 'DIRECTOR')
  ),
  status TEXT NOT NULL CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ARCHIVED')),
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  sync_state TEXT NOT NULL DEFAULT 'NOT_CONFIGURED' CHECK (
    sync_state IN ('SYNCED', 'SYNC_PENDING', 'SYNC_FAILED', 'NOT_CONFIGURED')
  ),
  created_by_account_id TEXT NOT NULL REFERENCES accounts(id),
  updated_by_account_id TEXT NOT NULL REFERENCES accounts(id),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  archived_at TEXT,
  CHECK (
    (url <> '' AND route_id = '') OR
    (url = '' AND route_id <> '')
  )
) STRICT;

CREATE INDEX idx_reference_links_status_audience_label
  ON reference_links(status, audience, label, id);

CREATE TABLE reference_link_versions (
  id TEXT PRIMARY KEY,
  link_id TEXT NOT NULL REFERENCES reference_links(id),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  before_json TEXT NOT NULL CHECK (json_valid(before_json)),
  after_json TEXT NOT NULL CHECK (json_valid(after_json)),
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'ARCHIVE', 'RESTORE')),
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  reason TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  correlation_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  UNIQUE (link_id, revision)
) STRICT;

CREATE INDEX idx_reference_link_versions_link_time
  ON reference_link_versions(link_id, created_at DESC, id);

CREATE TRIGGER reference_link_versions_no_update
BEFORE UPDATE ON reference_link_versions
BEGIN
  SELECT RAISE(ABORT, 'reference link versions are append-only');
END;

CREATE TRIGGER reference_link_versions_no_delete
BEFORE DELETE ON reference_link_versions
BEGIN
  SELECT RAISE(ABORT, 'reference link versions are append-only');
END;

CREATE TABLE reference_link_mutation_results (
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  operation TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  result_json TEXT NOT NULL CHECK (json_valid(result_json)),
  created_at TEXT NOT NULL,
  PRIMARY KEY (actor_account_id, operation, idempotency_key)
) STRICT;

ALTER TABLE inventory_items ADD COLUMN low_stock_alert_enabled INTEGER NOT NULL DEFAULT 0 CHECK (
  low_stock_alert_enabled IN (0, 1)
);
ALTER TABLE inventory_items ADD COLUMN low_stock_threshold INTEGER CHECK (
  low_stock_threshold IS NULL OR low_stock_threshold >= 0
);

CREATE TRIGGER inventory_low_stock_insert_guard
BEFORE INSERT ON inventory_items
WHEN NEW.low_stock_alert_enabled = 1 AND NEW.low_stock_threshold IS NULL
BEGIN
  SELECT RAISE(ABORT, 'enabled low-stock alerts require a threshold');
END;

CREATE TRIGGER inventory_low_stock_update_guard
BEFORE UPDATE OF low_stock_alert_enabled, low_stock_threshold ON inventory_items
WHEN NEW.low_stock_alert_enabled = 1 AND NEW.low_stock_threshold IS NULL
BEGIN
  SELECT RAISE(ABORT, 'enabled low-stock alerts require a threshold');
END;

ALTER TABLE public_advertisements ADD COLUMN audience TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (
  audience IN ('PUBLIC', 'STAFF', 'REQUEST', 'LENDING')
);
ALTER TABLE public_advertisements ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1);

INSERT OR IGNORE INTO capabilities (id, description) VALUES
  ('account_application.admin_review', 'Review and forward staff account applications'),
  ('account_application.director_decide', 'Approve or reject forwarded staff account applications'),
  ('account_application.owner_override', 'Perform an audited emergency account-application override');

INSERT OR IGNORE INTO role_capabilities (role_id, capability_id)
VALUES ('ADMINISTRATOR', 'account_application.admin_review');

INSERT OR IGNORE INTO role_capabilities (role_id, capability_id)
VALUES ('DIRECTOR', 'account_application.director_decide');

INSERT OR IGNORE INTO role_capabilities (role_id, capability_id)
SELECT 'SYSTEM_OWNER', id
FROM capabilities
WHERE id IN (
  'account_application.admin_review',
  'account_application.director_decide',
  'account_application.owner_override'
);

UPDATE app_metadata
SET value = '30', updated_at = '2026-08-03T10:36:00.000Z'
WHERE key = 'operational_schema_version';
