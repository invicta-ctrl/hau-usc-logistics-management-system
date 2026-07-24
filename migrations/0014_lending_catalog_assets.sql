ALTER TABLE inventory_items ADD COLUMN is_lendable INTEGER NOT NULL DEFAULT 0
  CHECK (is_lendable IN (0, 1));
ALTER TABLE inventory_items ADD COLUMN lending_kind TEXT NOT NULL DEFAULT 'CONSUMABLE'
  CHECK (lending_kind IN ('REUSABLE', 'CONSUMABLE'));
ALTER TABLE inventory_items ADD COLUMN lending_status TEXT NOT NULL DEFAULT 'NOT_LENDABLE'
  CHECK (lending_status IN ('ACTIVE', 'PAUSED', 'MAINTENANCE', 'NOT_LENDABLE'));
ALTER TABLE inventory_items ADD COLUMN lending_unit TEXT NOT NULL DEFAULT '';
ALTER TABLE inventory_items ADD COLUMN due_date_required INTEGER NOT NULL DEFAULT 0
  CHECK (due_date_required IN (0, 1));
ALTER TABLE inventory_items ADD COLUMN acknowledgment_required INTEGER NOT NULL DEFAULT 1
  CHECK (acknowledgment_required IN (0, 1));
ALTER TABLE inventory_items ADD COLUMN eligibility_rule TEXT NOT NULL DEFAULT '';
ALTER TABLE inventory_items ADD COLUMN lending_handling_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE inventory_items ADD COLUMN borrower_safe_description TEXT NOT NULL DEFAULT '';
ALTER TABLE inventory_items ADD COLUMN borrower_safe_restrictions TEXT NOT NULL DEFAULT '';
ALTER TABLE inventory_items ADD COLUMN image_asset_key TEXT NOT NULL DEFAULT '';
ALTER TABLE inventory_items ADD COLUMN condition_tracking INTEGER NOT NULL DEFAULT 0
  CHECK (condition_tracking IN (0, 1));

ALTER TABLE lending_tickets ADD COLUMN requested_start_at TEXT;
ALTER TABLE lending_tickets ADD COLUMN requested_end_at TEXT;

ALTER TABLE reservations ADD COLUMN reserved_from TEXT;
ALTER TABLE reservations ADD COLUMN reserved_until TEXT;

UPDATE inventory_items
SET
  is_lendable = CASE
    WHEN lending_audience IN ('STUDENTS_AND_STAFF', 'USC_STAFF_ONLY') THEN 1
    ELSE 0
  END,
  lending_kind = CASE
    WHEN handling LIKE '%LOAN%' OR handling LIKE '%REUSABLE%' THEN 'REUSABLE'
    ELSE 'CONSUMABLE'
  END,
  lending_status = CASE
    WHEN status = 'ACTIVE'
      AND lending_audience IN ('STUDENTS_AND_STAFF', 'USC_STAFF_ONLY') THEN 'ACTIVE'
    ELSE 'NOT_LENDABLE'
  END,
  lending_unit = unit,
  due_date_required = CASE
    WHEN handling LIKE '%LOAN%' OR handling LIKE '%REUSABLE%' THEN 1
    ELSE 0
  END,
  eligibility_rule = CASE lending_audience
    WHEN 'STUDENTS_AND_STAFF' THEN 'HAU students and authorized USC staff'
    WHEN 'USC_STAFF_ONLY' THEN 'Authorized USC staff only'
    ELSE ''
  END,
  condition_tracking = CASE
    WHEN handling LIKE '%LOAN%' OR handling LIKE '%REUSABLE%' THEN 1
    ELSE 0
  END;

UPDATE lending_tickets
SET requested_end_at = due_at
WHERE requested_end_at IS NULL AND due_at IS NOT NULL;

CREATE TABLE inventory_asset_instances (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
  asset_tag TEXT NOT NULL UNIQUE,
  serial_number TEXT NOT NULL DEFAULT '',
  condition_label TEXT NOT NULL DEFAULT 'GOOD'
    CHECK (condition_label IN ('NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED')),
  lifecycle_status TEXT NOT NULL DEFAULT 'AVAILABLE'
    CHECK (lifecycle_status IN ('AVAILABLE', 'RESERVED', 'ON_LOAN', 'MAINTENANCE', 'QUARANTINE', 'LOST', 'DAMAGED', 'ARCHIVED')),
  current_lending_ticket_id TEXT REFERENCES lending_tickets(id),
  expected_return_at TEXT,
  handoff_condition TEXT NOT NULL DEFAULT '',
  return_condition TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT REFERENCES accounts(id),
  updated_by TEXT REFERENCES accounts(id)
) STRICT;

CREATE TABLE lending_ticket_assets (
  lending_ticket_id TEXT NOT NULL REFERENCES lending_tickets(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL UNIQUE REFERENCES inventory_asset_instances(id),
  assigned_at TEXT NOT NULL,
  released_at TEXT,
  returned_at TEXT,
  handoff_condition TEXT NOT NULL DEFAULT '',
  return_condition TEXT NOT NULL DEFAULT '',
  assigned_by TEXT NOT NULL REFERENCES accounts(id),
  PRIMARY KEY (lending_ticket_id, asset_id)
) STRICT;

CREATE TABLE inventory_asset_photos (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES inventory_asset_instances(id) ON DELETE CASCADE,
  asset_key TEXT NOT NULL,
  photo_type TEXT NOT NULL
    CHECK (photo_type IN ('CATALOG', 'HANDOFF', 'RETURN', 'CONDITION', 'MAINTENANCE')),
  captured_at TEXT NOT NULL,
  recorded_by TEXT REFERENCES accounts(id),
  notes TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE inventory_asset_maintenance (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES inventory_asset_instances(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK (event_type IN ('OPENED', 'INSPECTED', 'REPAIRED', 'COMPLETED', 'DECLARED_DAMAGED')),
  condition_label TEXT NOT NULL DEFAULT '',
  evidence_asset_key TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,
  recorded_by TEXT REFERENCES accounts(id),
  notes TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE TABLE inventory_asset_movements (
  id TEXT PRIMARY KEY,
  asset_id TEXT NOT NULL REFERENCES inventory_asset_instances(id) ON DELETE CASCADE,
  movement_type TEXT NOT NULL
    CHECK (movement_type IN ('REGISTERED', 'RESERVED', 'HANDOFF', 'RETURN', 'MAINTENANCE', 'QUARANTINE', 'RESTORED', 'LOST', 'ARCHIVED')),
  previous_status TEXT NOT NULL DEFAULT '',
  new_status TEXT NOT NULL,
  lending_ticket_id TEXT REFERENCES lending_tickets(id),
  condition_label TEXT NOT NULL DEFAULT '',
  evidence_asset_key TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,
  recorded_by TEXT REFERENCES accounts(id),
  notes TEXT NOT NULL DEFAULT ''
) STRICT;

CREATE INDEX idx_asset_instances_item_status
  ON inventory_asset_instances(item_id, lifecycle_status, expected_return_at);
CREATE INDEX idx_lending_ticket_assets_ticket
  ON lending_ticket_assets(lending_ticket_id, assigned_at);
CREATE INDEX idx_asset_maintenance_asset_time
  ON inventory_asset_maintenance(asset_id, occurred_at);
CREATE INDEX idx_asset_movements_asset_time
  ON inventory_asset_movements(asset_id, occurred_at);
CREATE INDEX idx_lending_requested_window
  ON lending_tickets(item_id, requested_start_at, requested_end_at, status);
CREATE INDEX idx_reservation_window
  ON reservations(item_id, reserved_from, reserved_until, status);

CREATE TRIGGER inventory_asset_maintenance_no_update
BEFORE UPDATE ON inventory_asset_maintenance
BEGIN
  SELECT RAISE(ABORT, 'asset maintenance history is append-only');
END;

CREATE TRIGGER lending_ticket_asset_assignment_guard
BEFORE INSERT ON lending_ticket_assets
WHEN NOT EXISTS (
  SELECT 1
  FROM inventory_asset_instances asset
  JOIN lending_tickets ticket ON ticket.id = NEW.lending_ticket_id
  WHERE asset.id = NEW.asset_id
    AND asset.item_id = ticket.item_id
    AND asset.lifecycle_status = 'AVAILABLE'
    AND asset.current_lending_ticket_id IS NULL
)
BEGIN
  SELECT RAISE(ABORT, 'asset is not available for this lending ticket');
END;

CREATE TRIGGER inventory_asset_maintenance_no_delete
BEFORE DELETE ON inventory_asset_maintenance
BEGIN
  SELECT RAISE(ABORT, 'asset maintenance history is append-only');
END;

CREATE TRIGGER inventory_asset_movements_no_update
BEFORE UPDATE ON inventory_asset_movements
BEGIN
  SELECT RAISE(ABORT, 'asset movement history is append-only');
END;

CREATE TRIGGER inventory_asset_movements_no_delete
BEFORE DELETE ON inventory_asset_movements
BEGIN
  SELECT RAISE(ABORT, 'asset movement history is append-only');
END;

CREATE VIEW lending_catalog_availability AS
SELECT
  item.id AS item_id,
  balance.on_hand,
  balance.reserved,
  balance.available_to_promise,
  COALESCE((
    SELECT SUM(ticket.quantity)
    FROM lending_tickets ticket
    WHERE ticket.item_id = item.id AND ticket.status = 'READY_TO_CLAIM'
  ), 0) AS ready_to_claim,
  COALESCE((
    SELECT SUM(ticket.quantity)
    FROM lending_tickets ticket
    WHERE ticket.item_id = item.id AND ticket.status = 'ON_LOAN'
  ), 0) AS on_loan,
  COALESCE((
    SELECT SUM(ticket.quantity)
    FROM lending_tickets ticket
    WHERE ticket.item_id = item.id AND ticket.status = 'ON_LOAN'
      AND ticket.due_at IS NOT NULL AND ticket.due_at < strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
  ), 0) AS overdue,
  (
    SELECT MIN(ticket.due_at)
    FROM lending_tickets ticket
    WHERE ticket.item_id = item.id AND ticket.status = 'ON_LOAN' AND ticket.due_at IS NOT NULL
  ) AS expected_return_at,
  COALESCE((
    SELECT COUNT(*) FROM inventory_asset_instances asset
    WHERE asset.item_id = item.id AND asset.lifecycle_status <> 'ARCHIVED'
  ), 0) AS traceable_assets,
  COALESCE((
    SELECT COUNT(*) FROM inventory_asset_instances asset
    WHERE asset.item_id = item.id AND asset.lifecycle_status = 'AVAILABLE'
  ), 0) AS available_assets,
  COALESCE((
    SELECT COUNT(*) FROM inventory_asset_instances asset
    WHERE asset.item_id = item.id AND asset.lifecycle_status = 'DAMAGED'
  ), 0) AS damaged_assets,
  COALESCE((
    SELECT COUNT(*) FROM inventory_asset_instances asset
    WHERE asset.item_id = item.id AND asset.lifecycle_status IN ('MAINTENANCE', 'QUARANTINE')
  ), 0) AS maintenance_assets,
  CASE
    WHEN item.status <> 'ACTIVE' OR item.is_lendable = 0 OR item.lending_status = 'NOT_LENDABLE' THEN 0
    WHEN item.lending_status IN ('PAUSED', 'MAINTENANCE') THEN 0
    WHEN EXISTS (
      SELECT 1 FROM inventory_asset_instances asset
      WHERE asset.item_id = item.id AND asset.lifecycle_status <> 'ARCHIVED'
    ) THEN COALESCE((
      SELECT COUNT(*) FROM inventory_asset_instances asset
      WHERE asset.item_id = item.id AND asset.lifecycle_status = 'AVAILABLE'
    ), 0)
    ELSE MAX(balance.available_to_promise, 0)
  END AS lendable_available
FROM inventory_items item
JOIN inventory_balances balance ON balance.item_id = item.id;

UPDATE app_metadata
SET value = '14', updated_at = '2026-07-24T05:00:00.000Z'
WHERE key = 'operational_schema_version';
