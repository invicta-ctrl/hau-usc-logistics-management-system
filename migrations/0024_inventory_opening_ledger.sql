INSERT INTO inventory_ledger (
  id,
  created_at,
  transaction_type,
  direction,
  item_id,
  event_item_id,
  quantity,
  unit,
  signed_quantity,
  related_entity_type,
  related_entity_id,
  request_id,
  event_id,
  actor_account_id,
  idempotency_key,
  reversal_of,
  status,
  notes
)
SELECT
  'MIG-OPEN-' || item.id,
  COALESCE(NULLIF(item.updated_at, ''), '2026-07-28T00:00:00.000Z'),
  'OPENING_BALANCE',
  'IN',
  item.id,
  NULL,
  item.opening_quantity,
  item.unit,
  item.opening_quantity,
  'INVENTORY_ITEM',
  item.id,
  NULL,
  NULL,
  'SYSTEM-IMPORT',
  'MIGRATION:OPENING_BALANCE:' || item.id,
  NULL,
  'POSTED',
  'Migrated catalog opening quantity to the immutable ledger'
FROM inventory_items item
WHERE item.opening_quantity > 0
  AND NOT EXISTS (
    SELECT 1
    FROM inventory_ledger ledger
    WHERE ledger.item_id = item.id
      AND ledger.transaction_type = 'OPENING_BALANCE'
  );

CREATE TABLE phase17_opening_balance_guard (
  mismatch_count INTEGER NOT NULL CHECK (mismatch_count = 0)
);

INSERT INTO phase17_opening_balance_guard (mismatch_count)
SELECT COUNT(*)
FROM inventory_items item
WHERE item.opening_quantity > 0
  AND (
    SELECT COUNT(*)
    FROM inventory_ledger ledger
    WHERE ledger.item_id = item.id
      AND ledger.transaction_type = 'OPENING_BALANCE'
  ) <> 1;

INSERT INTO phase17_opening_balance_guard (mismatch_count)
SELECT COUNT(*)
FROM inventory_items item
WHERE item.opening_quantity > 0
  AND ABS(
    item.opening_quantity - COALESCE((
      SELECT SUM(ledger.signed_quantity)
      FROM inventory_ledger ledger
      WHERE ledger.item_id = item.id
        AND ledger.transaction_type = 'OPENING_BALANCE'
        AND ledger.status = 'POSTED'
    ), 0)
  ) > 0.000001;

DROP TABLE phase17_opening_balance_guard;

UPDATE inventory_items
SET opening_quantity = 0
WHERE opening_quantity <> 0;

DROP VIEW inventory_balances;

CREATE VIEW inventory_balances AS
SELECT
  item.id AS item_id,
  COALESCE((
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
  COALESCE((
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

CREATE TRIGGER inventory_items_opening_quantity_insert_guard
BEFORE INSERT ON inventory_items
WHEN NEW.opening_quantity <> 0
BEGIN
  SELECT RAISE(ABORT, 'opening inventory quantity must be posted through the ledger');
END;

CREATE TRIGGER inventory_items_opening_quantity_update_guard
BEFORE UPDATE OF opening_quantity ON inventory_items
WHEN NEW.opening_quantity <> 0
BEGIN
  SELECT RAISE(ABORT, 'opening inventory quantity must be posted through the ledger');
END;

UPDATE app_metadata
SET value = '24', updated_at = '2026-07-28T00:00:00.000Z'
WHERE key = 'operational_schema_version';
