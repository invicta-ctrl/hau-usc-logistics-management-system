ALTER TABLE lending_tickets ADD COLUMN requested_item_id TEXT REFERENCES inventory_items(id);
ALTER TABLE lending_tickets ADD COLUMN requested_quantity REAL CHECK (requested_quantity IS NULL OR requested_quantity > 0);
ALTER TABLE lending_tickets ADD COLUMN review_decision TEXT NOT NULL DEFAULT '';
ALTER TABLE lending_tickets ADD COLUMN review_notes TEXT NOT NULL DEFAULT '';
ALTER TABLE lending_tickets ADD COLUMN rejection_reason TEXT NOT NULL DEFAULT '';
ALTER TABLE lending_tickets ADD COLUMN substitution_note TEXT NOT NULL DEFAULT '';
ALTER TABLE lending_tickets ADD COLUMN eligibility_source TEXT NOT NULL DEFAULT '';
ALTER TABLE lending_tickets ADD COLUMN eligibility_reviewed_by TEXT REFERENCES accounts(id);
ALTER TABLE lending_tickets ADD COLUMN eligibility_reviewed_at TEXT;

UPDATE lending_tickets
SET requested_item_id = item_id,
    requested_quantity = quantity
WHERE requested_item_id IS NULL OR requested_quantity IS NULL;

UPDATE lending_tickets
SET review_decision = CASE
  WHEN status = 'REJECTED' THEN 'REJECT'
  WHEN status IN ('READY_TO_CLAIM', 'ON_LOAN', 'RETURNED', 'COMPLETED') THEN 'APPROVE'
  ELSE review_decision
END;

CREATE INDEX idx_lending_tickets_review_queue
ON lending_tickets(owner_committee_id, status, updated_at);

UPDATE app_metadata
SET value = '15', updated_at = '2026-07-24T04:20:00.000Z'
WHERE key = 'operational_schema_version';
