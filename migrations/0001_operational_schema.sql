PRAGMA foreign_keys = ON;

CREATE TABLE app_metadata (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE roles (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  scope_mode TEXT NOT NULL CHECK (scope_mode IN ('SELF', 'COMMITTEE', 'ALL', 'DENY'))
) STRICT;

CREATE TABLE capabilities (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE role_capabilities (
  role_id TEXT NOT NULL REFERENCES roles(id),
  capability_id TEXT NOT NULL REFERENCES capabilities(id),
  PRIMARY KEY (role_id, capability_id)
) STRICT;

CREATE TABLE committees (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1))
) STRICT;

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  access_id_normalized TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL CHECK (status IN ('STARTER', 'ACTIVE', 'DISABLED', 'REVOKED')),
  role_id TEXT NOT NULL REFERENCES roles(id),
  default_committee_id TEXT REFERENCES committees(id),
  profile_full_name TEXT,
  profile_mobile_number TEXT,
  profile_email TEXT,
  password_credential_json TEXT,
  temporary_credential_json TEXT,
  credential_version INTEGER NOT NULL DEFAULT 1 CHECK (credential_version >= 1),
  onboarding_completed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE account_committees (
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  committee_id TEXT NOT NULL REFERENCES committees(id),
  membership_type TEXT NOT NULL DEFAULT 'ASSIGNED',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  starts_at TEXT,
  ends_at TEXT,
  source TEXT NOT NULL DEFAULT 'SERVER',
  source_revision TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (account_id, committee_id)
) STRICT;

CREATE TABLE sessions (
  token_digest TEXT PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  kind TEXT NOT NULL CHECK (kind IN ('ACTIVATION', 'AUTHENTICATED')),
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  csrf_digest TEXT NOT NULL,
  credential_version INTEGER NOT NULL,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
) STRICT;

CREATE TABLE password_reset_tokens (
  token_digest TEXT PRIMARY KEY,
  id TEXT NOT NULL UNIQUE,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  issued_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  issued_by TEXT NOT NULL REFERENCES accounts(id)
) STRICT;

CREATE TABLE auth_rate_limits (
  limiter_key TEXT NOT NULL,
  attempted_at INTEGER NOT NULL,
  PRIMARY KEY (limiter_key, attempted_at)
) STRICT;

CREATE TABLE event_series (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE events (
  id TEXT PRIMARY KEY,
  event_series_id TEXT REFERENCES event_series(id),
  name TEXT NOT NULL,
  starts_at TEXT,
  ends_at TEXT,
  venue TEXT NOT NULL DEFAULT '',
  owner_committee_id TEXT REFERENCES committees(id),
  department TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  external_reference TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE requests (
  id TEXT PRIMARY KEY,
  request_type TEXT NOT NULL,
  request_stage TEXT NOT NULL DEFAULT 'REVIEW',
  parent_request_id TEXT REFERENCES requests(id),
  additional_sequence INTEGER NOT NULL DEFAULT 0 CHECK (additional_sequence >= 0),
  event_series_id TEXT REFERENCES event_series(id),
  event_id TEXT REFERENCES events(id),
  catalog_type TEXT NOT NULL DEFAULT '',
  requester_account_id TEXT REFERENCES accounts(id),
  requester_name TEXT NOT NULL DEFAULT '',
  requester_email TEXT NOT NULL DEFAULT '',
  department TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'NORMAL',
  purpose TEXT NOT NULL,
  status TEXT NOT NULL,
  client_request_id TEXT NOT NULL,
  archived_at TEXT,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES accounts(id),
  UNIQUE (created_by, client_request_id)
) STRICT;

CREATE TABLE inventory_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT '',
  stock_area TEXT NOT NULL DEFAULT '',
  handling TEXT NOT NULL DEFAULT 'NON_CIRCULATING',
  unit TEXT NOT NULL,
  opening_quantity REAL NOT NULL DEFAULT 0 CHECK (opening_quantity >= 0),
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  catalog_type TEXT NOT NULL DEFAULT '',
  storage_location TEXT NOT NULL DEFAULT '',
  reorder_threshold REAL NOT NULL DEFAULT 0 CHECK (reorder_threshold >= 0),
  lending_audience TEXT NOT NULL DEFAULT 'NOT_AVAILABLE_FOR_LENDING',
  default_loan_days INTEGER,
  maximum_loan_quantity REAL,
  approval_required INTEGER NOT NULL DEFAULT 1 CHECK (approval_required IN (0, 1)),
  legacy_source_sheet TEXT NOT NULL DEFAULT '',
  legacy_source_row INTEGER,
  verification_note TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE item_aliases (
  item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  normalized_alias TEXT NOT NULL,
  display_alias TEXT NOT NULL,
  PRIMARY KEY (item_id, normalized_alias)
) STRICT;

CREATE TABLE request_lines (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id) ON DELETE CASCADE,
  event_id TEXT REFERENCES events(id),
  item_id TEXT REFERENCES inventory_items(id),
  event_item_id TEXT,
  description TEXT NOT NULL,
  specification TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT '',
  requested_quantity REAL NOT NULL CHECK (requested_quantity > 0),
  unit TEXT NOT NULL,
  fulfillment_source TEXT NOT NULL,
  split_group_id TEXT,
  needed_at TEXT,
  return_due_at TEXT,
  released_quantity REAL NOT NULL DEFAULT 0 CHECK (released_quantity >= 0),
  received_quantity REAL NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  status TEXT NOT NULL,
  client_line_id TEXT NOT NULL,
  workflow_revision INTEGER NOT NULL DEFAULT 1 CHECK (workflow_revision >= 1),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES accounts(id),
  UNIQUE (request_id, client_line_id)
) STRICT;

CREATE TABLE reservations (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES inventory_items(id),
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  request_line_id TEXT REFERENCES request_lines(id),
  lending_ticket_id TEXT,
  status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'CLEARED', 'RELEASED', 'CANCELLED')),
  idempotency_key TEXT NOT NULL,
  cleared_at TEXT,
  clear_reason TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES accounts(id),
  UNIQUE (created_by, idempotency_key)
) STRICT;

CREATE TABLE inventory_ledger (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  transaction_type TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('IN', 'OUT', 'ADJUSTMENT', 'REVERSAL')),
  item_id TEXT NOT NULL REFERENCES inventory_items(id),
  event_item_id TEXT,
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  signed_quantity REAL NOT NULL CHECK (signed_quantity <> 0),
  related_entity_type TEXT NOT NULL,
  related_entity_id TEXT NOT NULL,
  request_id TEXT REFERENCES requests(id),
  event_id TEXT REFERENCES events(id),
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  idempotency_key TEXT NOT NULL,
  reversal_of TEXT REFERENCES inventory_ledger(id),
  status TEXT NOT NULL DEFAULT 'POSTED' CHECK (status IN ('POSTED', 'REVERSED')),
  notes TEXT NOT NULL DEFAULT '',
  UNIQUE (actor_account_id, idempotency_key),
  CHECK ((direction = 'IN' AND signed_quantity > 0) OR (direction = 'OUT' AND signed_quantity < 0) OR direction IN ('ADJUSTMENT', 'REVERSAL'))
) STRICT;

CREATE TABLE restock_requests (
  id TEXT PRIMARY KEY,
  source_request_id TEXT REFERENCES requests(id),
  source_request_line_id TEXT REFERENCES request_lines(id),
  item_id TEXT REFERENCES inventory_items(id),
  requested_quantity REAL NOT NULL CHECK (requested_quantity > 0),
  received_quantity REAL NOT NULL DEFAULT 0 CHECK (received_quantity >= 0),
  unit TEXT NOT NULL,
  supplier_id TEXT,
  supplier_name TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT REFERENCES accounts(id)
) STRICT;

CREATE TABLE restock_receipts (
  id TEXT PRIMARY KEY,
  restock_request_id TEXT NOT NULL REFERENCES restock_requests(id),
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  invoice_status TEXT NOT NULL DEFAULT '',
  invoice_number TEXT NOT NULL DEFAULT '',
  evidence_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  received_at TEXT NOT NULL,
  received_by TEXT NOT NULL REFERENCES accounts(id),
  notes TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE lending_tickets (
  id TEXT PRIMARY KEY,
  borrower_reference TEXT NOT NULL,
  borrower_name TEXT NOT NULL DEFAULT '',
  borrower_type TEXT NOT NULL,
  department_organization TEXT NOT NULL DEFAULT '',
  contact TEXT NOT NULL DEFAULT '',
  item_id TEXT NOT NULL REFERENCES inventory_items(id),
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  purpose TEXT NOT NULL,
  due_at TEXT,
  ticket_type TEXT NOT NULL,
  status TEXT NOT NULL,
  approved_by TEXT REFERENCES accounts(id),
  approved_at TEXT,
  created_by TEXT NOT NULL REFERENCES accounts(id),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE lending_handoffs (
  id TEXT PRIMARY KEY,
  lending_ticket_id TEXT NOT NULL UNIQUE REFERENCES lending_tickets(id),
  released_by TEXT NOT NULL REFERENCES accounts(id),
  released_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  notes TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE lending_returns (
  id TEXT PRIMARY KEY,
  lending_ticket_id TEXT NOT NULL UNIQUE REFERENCES lending_tickets(id),
  returned_by TEXT NOT NULL REFERENCES accounts(id),
  returned_at TEXT NOT NULL,
  condition_label TEXT NOT NULL DEFAULT '',
  evidence_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  notes TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE release_confirmations (
  id TEXT PRIMARY KEY,
  request_id TEXT REFERENCES requests(id),
  request_line_id TEXT REFERENCES request_lines(id),
  event_id TEXT REFERENCES events(id),
  lending_ticket_id TEXT REFERENCES lending_tickets(id),
  recipient_name TEXT NOT NULL,
  recipient_role TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT '',
  item_id TEXT NOT NULL REFERENCES inventory_items(id),
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  released_by TEXT NOT NULL REFERENCES accounts(id),
  released_at TEXT NOT NULL,
  confirmation_label TEXT NOT NULL,
  evidence_id TEXT,
  idempotency_key TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'CONFIRMED',
  notes TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE deliverables (
  id TEXT PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES requests(id),
  request_line_id TEXT NOT NULL REFERENCES request_lines(id),
  event_series_id TEXT REFERENCES event_series(id),
  event_id TEXT REFERENCES events(id),
  inventory_match_id TEXT REFERENCES inventory_items(id),
  item_spec TEXT NOT NULL,
  quantity_requested REAL NOT NULL CHECK (quantity_requested > 0),
  quantity_received REAL NOT NULL DEFAULT 0 CHECK (quantity_received >= 0),
  quantity_released REAL NOT NULL DEFAULT 0 CHECK (quantity_released >= 0),
  unit TEXT NOT NULL,
  fulfillment_source TEXT NOT NULL,
  assigned_committee_id TEXT REFERENCES committees(id),
  assigned_account_id TEXT REFERENCES accounts(id),
  preferred_canvass_id TEXT,
  budget_status TEXT NOT NULL DEFAULT '',
  procurement_status TEXT NOT NULL DEFAULT '',
  receipt_status TEXT NOT NULL DEFAULT '',
  evidence_id TEXT,
  needed_at TEXT,
  status TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT REFERENCES accounts(id)
) STRICT;

CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  location TEXT NOT NULL DEFAULT '',
  receipt_capability TEXT NOT NULL DEFAULT '',
  reliability TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE canvass_references (
  id TEXT PRIMARY KEY,
  linked_request_line_id TEXT REFERENCES request_lines(id),
  linked_deliverable_id TEXT REFERENCES deliverables(id),
  linked_restock_id TEXT REFERENCES restock_requests(id),
  supplier_id TEXT REFERENCES suppliers(id),
  supplier_name TEXT NOT NULL DEFAULT '',
  item_spec TEXT NOT NULL,
  price REAL CHECK (price IS NULL OR price >= 0),
  unit TEXT NOT NULL,
  receipt_status TEXT NOT NULL DEFAULT '',
  reliability TEXT NOT NULL DEFAULT '',
  checked_at TEXT,
  source_url TEXT NOT NULL DEFAULT '',
  evidence_id TEXT,
  preferred INTEGER NOT NULL DEFAULT 0 CHECK (preferred IN (0, 1)),
  status TEXT NOT NULL,
  price_history_json TEXT NOT NULL DEFAULT '[]',
  idempotency_key TEXT NOT NULL UNIQUE,
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT REFERENCES accounts(id)
) STRICT;

CREATE TABLE supplier_quotes (
  id TEXT PRIMARY KEY,
  canvass_reference_id TEXT NOT NULL REFERENCES canvass_references(id),
  supplier_id TEXT REFERENCES suppliers(id),
  amount REAL NOT NULL CHECK (amount >= 0),
  unit TEXT NOT NULL,
  quoted_at TEXT,
  source_fingerprint TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE receiving_records (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('DELIVERABLE', 'RESTOCK')),
  entity_id TEXT NOT NULL,
  item_id TEXT REFERENCES inventory_items(id),
  quantity REAL NOT NULL CHECK (quantity > 0),
  unit TEXT NOT NULL,
  evidence_id TEXT,
  received_by TEXT NOT NULL REFERENCES accounts(id),
  received_at TEXT NOT NULL,
  idempotency_key TEXT NOT NULL UNIQUE,
  notes TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE evidence_metadata (
  id TEXT PRIMARY KEY,
  evidence_type TEXT NOT NULL,
  evidence_label TEXT NOT NULL,
  normalized_file_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL CHECK (size_bytes >= 0),
  sha256 TEXT NOT NULL,
  private_storage_reference TEXT NOT NULL,
  related_entity_type TEXT NOT NULL,
  related_entity_id TEXT NOT NULL,
  uploaded_by TEXT REFERENCES accounts(id),
  upload_status TEXT NOT NULL,
  duplicate_of TEXT REFERENCES evidence_metadata(id),
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
) STRICT;

CREATE TABLE status_history (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  previous_status TEXT NOT NULL DEFAULT '',
  new_status TEXT NOT NULL,
  changed_at TEXT NOT NULL,
  changed_by TEXT NOT NULL,
  reason TEXT NOT NULL DEFAULT '',
  request_id TEXT REFERENCES requests(id),
  event_id TEXT REFERENCES events(id),
  idempotency_key TEXT NOT NULL,
  metadata_json TEXT NOT NULL DEFAULT '{}',
  UNIQUE (entity_type, entity_id, idempotency_key)
) STRICT;

CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  created_at TEXT NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  actor_account_id TEXT,
  request_id TEXT REFERENCES requests(id),
  event_id TEXT REFERENCES events(id),
  before_json TEXT NOT NULL DEFAULT '{}',
  after_json TEXT NOT NULL DEFAULT '{}',
  correlation_id TEXT NOT NULL,
  notes TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE idempotency_keys (
  scope TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  actor_account_id TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  result_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (scope, idempotency_key)
) STRICT;

CREATE TABLE import_batches (
  id TEXT PRIMARY KEY,
  source_snapshot_hash TEXT NOT NULL UNIQUE,
  source_workbook_label TEXT NOT NULL,
  source_snapshot_at TEXT NOT NULL,
  export_schema_version INTEGER NOT NULL,
  exporter_version TEXT NOT NULL,
  candidate_sha TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('PREPARED', 'APPLIED', 'RECONCILED', 'FAILED')),
  source_row_count INTEGER NOT NULL CHECK (source_row_count >= 0),
  imported_row_count INTEGER NOT NULL DEFAULT 0 CHECK (imported_row_count >= 0),
  rejected_row_count INTEGER NOT NULL DEFAULT 0 CHECK (rejected_row_count >= 0),
  created_at TEXT NOT NULL,
  applied_at TEXT,
  reconciled_at TEXT
) STRICT;

CREATE TABLE imported_source_rows (
  import_batch_id TEXT NOT NULL REFERENCES import_batches(id),
  source_tab TEXT NOT NULL,
  source_row_number INTEGER NOT NULL CHECK (source_row_number >= 2),
  source_record_id TEXT NOT NULL,
  source_fingerprint TEXT NOT NULL,
  target_table TEXT NOT NULL,
  target_id TEXT NOT NULL,
  import_status TEXT NOT NULL CHECK (import_status IN ('IMPORTED', 'REJECTED', 'QUARANTINED', 'UNCHANGED')),
  reason_code TEXT NOT NULL DEFAULT '',
  imported_at TEXT NOT NULL,
  PRIMARY KEY (import_batch_id, source_tab, source_row_number),
  UNIQUE (source_tab, source_fingerprint)
) STRICT;

CREATE TABLE reporting_outbox (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  delivery_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (delivery_status IN ('PENDING', 'DELIVERED', 'FAILED')),
  delivered_at TEXT,
  attempts INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0)
) STRICT;

CREATE TABLE reference_records (
  id TEXT PRIMARY KEY,
  domain TEXT NOT NULL,
  stable_id TEXT NOT NULL,
  revision INTEGER NOT NULL CHECK (revision >= 1),
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  effective_from TEXT,
  effective_to TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT '',
  archived_at TEXT,
  UNIQUE (domain, stable_id, revision)
) STRICT;

CREATE TABLE source_access_users (
  source_user_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  role_id TEXT NOT NULL,
  committee_ids_json TEXT NOT NULL DEFAULT '[]',
  active INTEGER NOT NULL CHECK (active IN (0, 1)),
  authorization_status TEXT NOT NULL DEFAULT 'NEEDS_REVIEW',
  source_revision TEXT NOT NULL DEFAULT '',
  imported_at TEXT NOT NULL
) STRICT;

CREATE INDEX idx_accounts_status_role ON accounts(status, role_id);
CREATE INDEX idx_sessions_account_expires ON sessions(account_id, expires_at);
CREATE INDEX idx_auth_rate_limits_key_time ON auth_rate_limits(limiter_key, attempted_at);
CREATE INDEX idx_events_series_status ON events(event_series_id, status);
CREATE INDEX idx_requests_event_status ON requests(event_id, status, updated_at);
CREATE INDEX idx_requests_requester_status ON requests(requester_account_id, status, updated_at);
CREATE INDEX idx_request_lines_request_status ON request_lines(request_id, status);
CREATE INDEX idx_request_lines_item_status ON request_lines(item_id, status);
CREATE INDEX idx_alias_lookup ON item_aliases(normalized_alias);
CREATE INDEX idx_reservations_item_status ON reservations(item_id, status);
CREATE INDEX idx_ledger_item_created ON inventory_ledger(item_id, created_at);
CREATE INDEX idx_ledger_related ON inventory_ledger(related_entity_type, related_entity_id);
CREATE INDEX idx_lending_item_status ON lending_tickets(item_id, status, updated_at);
CREATE INDEX idx_restock_item_status ON restock_requests(item_id, status, updated_at);
CREATE INDEX idx_deliverables_request_status ON deliverables(request_id, status, updated_at);
CREATE INDEX idx_canvass_request_line ON canvass_references(linked_request_line_id, status);
CREATE INDEX idx_receiving_entity ON receiving_records(entity_type, entity_id, received_at);
CREATE INDEX idx_status_entity ON status_history(entity_type, entity_id, changed_at);
CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id, created_at);
CREATE INDEX idx_import_rows_batch_tab ON imported_source_rows(import_batch_id, source_tab, import_status);
CREATE INDEX idx_outbox_status_time ON reporting_outbox(delivery_status, occurred_at);

CREATE VIEW inventory_balances AS
SELECT
  item.id AS item_id,
  item.opening_quantity + COALESCE((
    SELECT SUM(ledger.signed_quantity)
    FROM inventory_ledger ledger
    WHERE ledger.item_id = item.id AND ledger.status = 'POSTED'
  ), 0) AS on_hand,
  COALESCE((
    SELECT SUM(reservation.quantity)
    FROM reservations reservation
    WHERE reservation.item_id = item.id AND reservation.status = 'ACTIVE'
  ), 0) AS reserved,
  item.opening_quantity + COALESCE((
    SELECT SUM(ledger.signed_quantity)
    FROM inventory_ledger ledger
    WHERE ledger.item_id = item.id AND ledger.status = 'POSTED'
  ), 0) - COALESCE((
    SELECT SUM(reservation.quantity)
    FROM reservations reservation
    WHERE reservation.item_id = item.id AND reservation.status = 'ACTIVE'
  ), 0) AS available_to_promise
FROM inventory_items item;

CREATE TRIGGER inventory_ledger_no_update
BEFORE UPDATE ON inventory_ledger
BEGIN
  SELECT RAISE(ABORT, 'posted inventory ledger rows are append-only');
END;

CREATE TRIGGER inventory_ledger_no_delete
BEFORE DELETE ON inventory_ledger
BEGIN
  SELECT RAISE(ABORT, 'posted inventory ledger rows are append-only');
END;

CREATE TRIGGER status_history_no_update
BEFORE UPDATE ON status_history
BEGIN
  SELECT RAISE(ABORT, 'status history is append-only');
END;

CREATE TRIGGER status_history_no_delete
BEFORE DELETE ON status_history
BEGIN
  SELECT RAISE(ABORT, 'status history is append-only');
END;

CREATE TRIGGER audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit log is append-only');
END;

CREATE TRIGGER audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN
  SELECT RAISE(ABORT, 'audit log is append-only');
END;

INSERT INTO app_metadata (key, value, updated_at)
VALUES ('operational_schema_version', '1', '2026-07-22T00:00:00.000Z');
