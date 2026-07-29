CREATE TABLE lending_ticket_assets_next (
  lending_ticket_id TEXT NOT NULL REFERENCES lending_tickets(id) ON DELETE CASCADE,
  asset_id TEXT NOT NULL REFERENCES inventory_asset_instances(id),
  assigned_at TEXT NOT NULL,
  released_at TEXT,
  returned_at TEXT,
  handoff_condition TEXT NOT NULL DEFAULT '',
  return_condition TEXT NOT NULL DEFAULT '',
  assigned_by TEXT NOT NULL REFERENCES accounts(id),
  PRIMARY KEY (lending_ticket_id, asset_id)
) STRICT;

INSERT INTO lending_ticket_assets_next (
  lending_ticket_id, asset_id, assigned_at, released_at, returned_at,
  handoff_condition, return_condition, assigned_by
)
SELECT
  lending_ticket_id, asset_id, assigned_at, released_at, returned_at,
  handoff_condition, return_condition, assigned_by
FROM lending_ticket_assets;

DROP TABLE lending_ticket_assets;
ALTER TABLE lending_ticket_assets_next RENAME TO lending_ticket_assets;

CREATE INDEX idx_lending_ticket_assets_ticket
  ON lending_ticket_assets(lending_ticket_id, assigned_at);

CREATE UNIQUE INDEX idx_lending_ticket_assets_active_asset
  ON lending_ticket_assets(asset_id)
  WHERE returned_at IS NULL;

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

UPDATE app_metadata
SET value = '29', updated_at = '2026-07-29T00:00:00.000Z'
WHERE key = 'operational_schema_version';
