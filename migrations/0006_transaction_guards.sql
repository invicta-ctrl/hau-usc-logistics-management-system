CREATE TABLE reservation_consumptions (
  id TEXT PRIMARY KEY,
  reservation_id TEXT NOT NULL REFERENCES reservations(id),
  related_entity_type TEXT NOT NULL,
  related_entity_id TEXT NOT NULL,
  quantity REAL NOT NULL CHECK (quantity > 0),
  idempotency_key TEXT NOT NULL,
  consumed_at TEXT NOT NULL,
  consumed_by TEXT NOT NULL REFERENCES accounts(id),
  UNIQUE (reservation_id, idempotency_key)
) STRICT;

CREATE INDEX idx_reservation_consumptions_reservation
ON reservation_consumptions(reservation_id, consumed_at);

CREATE TRIGGER reservation_capacity_guard
BEFORE INSERT ON reservations
WHEN NEW.status = 'ACTIVE' AND (
  SELECT available_to_promise FROM inventory_balances WHERE item_id = NEW.item_id
) < NEW.quantity
BEGIN
  SELECT RAISE(ABORT, 'insufficient available-to-promise for reservation');
END;

CREATE TRIGGER reservation_consumption_guard
BEFORE INSERT ON reservation_consumptions
WHEN (
  SELECT quantity - COALESCE((
    SELECT SUM(quantity)
    FROM reservation_consumptions
    WHERE reservation_id = NEW.reservation_id
  ), 0)
  FROM reservations
  WHERE id = NEW.reservation_id AND status = 'ACTIVE'
) < NEW.quantity
BEGIN
  SELECT RAISE(ABORT, 'reservation coverage is insufficient');
END;

CREATE TRIGGER reservation_consumption_no_update
BEFORE UPDATE ON reservation_consumptions
BEGIN
  SELECT RAISE(ABORT, 'reservation consumption is append-only');
END;

CREATE TRIGGER reservation_consumption_no_delete
BEFORE DELETE ON reservation_consumptions
BEGIN
  SELECT RAISE(ABORT, 'reservation consumption is append-only');
END;

CREATE TRIGGER inventory_nonnegative_guard
BEFORE INSERT ON inventory_ledger
WHEN NEW.status = 'POSTED' AND (
  SELECT on_hand FROM inventory_balances WHERE item_id = NEW.item_id
) + NEW.signed_quantity < 0
BEGIN
  SELECT RAISE(ABORT, 'inventory ledger movement would make on-hand negative');
END;

CREATE TRIGGER deliverable_receiving_guard
BEFORE INSERT ON receiving_records
WHEN NEW.entity_type = 'DELIVERABLE' AND (
  COALESCE((SELECT SUM(quantity) FROM receiving_records WHERE entity_type = 'DELIVERABLE' AND entity_id = NEW.entity_id), 0)
  + NEW.quantity
) > (SELECT quantity_requested FROM deliverables WHERE id = NEW.entity_id)
BEGIN
  SELECT RAISE(ABORT, 'deliverable receipt exceeds approved quantity');
END;

CREATE TRIGGER restock_receiving_guard
BEFORE INSERT ON receiving_records
WHEN NEW.entity_type = 'RESTOCK' AND (
  COALESCE((SELECT SUM(quantity) FROM receiving_records WHERE entity_type = 'RESTOCK' AND entity_id = NEW.entity_id), 0)
  + NEW.quantity
) > (SELECT requested_quantity FROM restock_requests WHERE id = NEW.entity_id)
BEGIN
  SELECT RAISE(ABORT, 'restock receipt exceeds approved quantity');
END;

DROP VIEW inventory_balances;

CREATE VIEW inventory_balances AS
SELECT
  item.id AS item_id,
  item.opening_quantity + COALESCE((
    SELECT SUM(ledger.signed_quantity)
    FROM inventory_ledger ledger
    WHERE ledger.item_id = item.id AND ledger.status = 'POSTED'
  ), 0) AS on_hand,
  COALESCE((
    SELECT SUM(MAX(reservation.quantity - COALESCE((
      SELECT SUM(consumption.quantity)
      FROM reservation_consumptions consumption
      WHERE consumption.reservation_id = reservation.id
    ), 0), 0))
    FROM reservations reservation
    WHERE reservation.item_id = item.id AND reservation.status = 'ACTIVE'
  ), 0) AS reserved,
  item.opening_quantity + COALESCE((
    SELECT SUM(ledger.signed_quantity)
    FROM inventory_ledger ledger
    WHERE ledger.item_id = item.id AND ledger.status = 'POSTED'
  ), 0) - COALESCE((
    SELECT SUM(MAX(reservation.quantity - COALESCE((
      SELECT SUM(consumption.quantity)
      FROM reservation_consumptions consumption
      WHERE consumption.reservation_id = reservation.id
    ), 0), 0))
    FROM reservations reservation
    WHERE reservation.item_id = item.id AND reservation.status = 'ACTIVE'
  ), 0) AS available_to_promise
FROM inventory_items item;

UPDATE app_metadata
SET value = '6', updated_at = '2026-07-22T00:00:00.000Z'
WHERE key = 'operational_schema_version';
