-- Migration 0025 introduced classification defaults after legacy lending data already existed.
-- Repair every unclassified row, including archived historical fixtures, without deleting history.
UPDATE inventory_items
SET
  is_lendable = 0,
  lending_audience = 'NOT_AVAILABLE_FOR_LENDING',
  lending_status = 'NOT_LENDABLE',
  condition_tracking = 0
WHERE classification_status <> 'CLASSIFIED'
   OR inventory_kind = 'UNVERIFIED';

UPDATE app_metadata
SET value = '26', updated_at = '2026-07-28T00:00:00.000Z'
WHERE key = 'operational_schema_version';
