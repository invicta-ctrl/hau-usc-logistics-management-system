ALTER TABLE inventory_items ADD COLUMN inventory_kind TEXT NOT NULL DEFAULT 'UNVERIFIED'
  CHECK (inventory_kind IN ('UNVERIFIED', 'REUSABLE', 'CONSUMABLE'));
ALTER TABLE inventory_items ADD COLUMN classification_status TEXT NOT NULL DEFAULT 'NEEDS_CLASSIFICATION'
  CHECK (classification_status IN ('NEEDS_CLASSIFICATION', 'CLASSIFIED'));
ALTER TABLE inventory_items ADD COLUMN condition_review_state TEXT NOT NULL DEFAULT 'NOT_ASSESSED'
  CHECK (condition_review_state IN ('NOT_ASSESSED', 'NOT_APPLICABLE', 'NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'));
ALTER TABLE inventory_items ADD COLUMN maintenance_review_state TEXT NOT NULL DEFAULT 'NOT_ASSESSED'
  CHECK (maintenance_review_state IN ('NOT_ASSESSED', 'NOT_APPLICABLE', 'CLEARED', 'MAINTENANCE_REQUIRED'));
ALTER TABLE inventory_items ADD COLUMN classification_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE inventory_items ADD COLUMN classification_evidence_id TEXT NOT NULL DEFAULT '';
ALTER TABLE inventory_items ADD COLUMN classification_revision INTEGER NOT NULL DEFAULT 1
  CHECK (classification_revision >= 1);
ALTER TABLE inventory_items ADD COLUMN classified_at TEXT;
ALTER TABLE inventory_items ADD COLUMN classified_by TEXT REFERENCES accounts(id);

UPDATE inventory_items
SET
  is_lendable = 0,
  lending_audience = 'NOT_AVAILABLE_FOR_LENDING',
  lending_status = 'NOT_LENDABLE',
  condition_tracking = 0,
  inventory_kind = 'UNVERIFIED',
  classification_status = 'NEEDS_CLASSIFICATION',
  condition_review_state = 'NOT_ASSESSED',
  maintenance_review_state = 'NOT_ASSESSED',
  classified_at = NULL,
  classified_by = NULL
WHERE upper(trim(handling)) IN ('', 'TO_CLASSIFY');

CREATE TABLE inventory_classification_history (
  id TEXT PRIMARY KEY,
  item_id TEXT NOT NULL REFERENCES inventory_items(id),
  revision INTEGER NOT NULL CHECK (revision >= 1),
  previous_status TEXT NOT NULL,
  new_status TEXT NOT NULL,
  previous_kind TEXT NOT NULL,
  new_kind TEXT NOT NULL,
  lendable_enabled INTEGER NOT NULL CHECK (lendable_enabled IN (0, 1)),
  lending_audience TEXT NOT NULL,
  condition_review_state TEXT NOT NULL,
  maintenance_review_state TEXT NOT NULL,
  asset_instance_count INTEGER NOT NULL DEFAULT 0 CHECK (asset_instance_count >= 0),
  classification_notes TEXT NOT NULL DEFAULT '',
  evidence_id TEXT NOT NULL DEFAULT '',
  bulk_group_id TEXT NOT NULL DEFAULT '',
  occurred_at TEXT NOT NULL,
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  correlation_id TEXT NOT NULL,
  UNIQUE (item_id, revision)
) STRICT;

CREATE INDEX idx_inventory_classification_queue
  ON inventory_items(classification_status, inventory_kind, name);
CREATE INDEX idx_inventory_classification_history_item
  ON inventory_classification_history(item_id, occurred_at DESC);

CREATE TRIGGER inventory_classification_history_no_update
BEFORE UPDATE ON inventory_classification_history
BEGIN
  SELECT RAISE(ABORT, 'inventory classification history is append-only');
END;

CREATE TRIGGER inventory_classification_history_no_delete
BEFORE DELETE ON inventory_classification_history
BEGIN
  SELECT RAISE(ABORT, 'inventory classification history is append-only');
END;

CREATE TRIGGER inventory_items_unclassified_lending_insert_guard
BEFORE INSERT ON inventory_items
WHEN (
  NEW.classification_status <> 'CLASSIFIED'
  OR NEW.inventory_kind = 'UNVERIFIED'
) AND (
  NEW.is_lendable <> 0
  OR NEW.lending_audience <> 'NOT_AVAILABLE_FOR_LENDING'
  OR NEW.lending_status <> 'NOT_LENDABLE'
)
BEGIN
  SELECT RAISE(ABORT, 'unclassified inventory must remain non-lendable');
END;

CREATE TRIGGER inventory_items_unclassified_lending_update_guard
BEFORE UPDATE ON inventory_items
WHEN (
  NEW.classification_status <> 'CLASSIFIED'
  OR NEW.inventory_kind = 'UNVERIFIED'
) AND (
  NEW.is_lendable <> 0
  OR NEW.lending_audience <> 'NOT_AVAILABLE_FOR_LENDING'
  OR NEW.lending_status <> 'NOT_LENDABLE'
)
BEGIN
  SELECT RAISE(ABORT, 'unclassified inventory must remain non-lendable');
END;

CREATE TRIGGER inventory_items_unsafe_reusable_lending_insert_guard
BEFORE INSERT ON inventory_items
WHEN NEW.is_lendable = 1 AND NEW.inventory_kind = 'REUSABLE' AND (
  NEW.condition_review_state NOT IN ('NEW', 'GOOD', 'FAIR')
  OR NEW.maintenance_review_state <> 'CLEARED'
)
BEGIN
  SELECT RAISE(ABORT, 'unsafe or unreviewed reusable inventory cannot be lendable');
END;

CREATE TRIGGER inventory_items_unsafe_reusable_lending_update_guard
BEFORE UPDATE ON inventory_items
WHEN NEW.is_lendable = 1 AND NEW.inventory_kind = 'REUSABLE' AND (
  NEW.condition_review_state NOT IN ('NEW', 'GOOD', 'FAIR')
  OR NEW.maintenance_review_state <> 'CLEARED'
)
BEGIN
  SELECT RAISE(ABORT, 'unsafe or unreviewed reusable inventory cannot be lendable');
END;

UPDATE app_metadata
SET value = '25', updated_at = '2026-07-28T00:00:00.000Z'
WHERE key = 'operational_schema_version';
