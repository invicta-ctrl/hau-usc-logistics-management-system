ALTER TABLE requests ADD COLUMN owner_committee_id TEXT REFERENCES committees(id);
ALTER TABLE lending_tickets ADD COLUMN owner_committee_id TEXT REFERENCES committees(id);
ALTER TABLE restock_requests ADD COLUMN assigned_committee_id TEXT REFERENCES committees(id);

UPDATE requests
SET owner_committee_id = COALESCE(
  (SELECT owner_committee_id FROM events WHERE events.id = requests.event_id),
  (SELECT default_committee_id FROM accounts WHERE accounts.id = requests.requester_account_id)
)
WHERE owner_committee_id IS NULL;

UPDATE lending_tickets
SET owner_committee_id = (
  SELECT default_committee_id FROM accounts WHERE accounts.id = lending_tickets.created_by
)
WHERE owner_committee_id IS NULL;

UPDATE restock_requests
SET assigned_committee_id = (
  SELECT owner_committee_id FROM requests WHERE requests.id = restock_requests.source_request_id
)
WHERE assigned_committee_id IS NULL;

CREATE INDEX idx_requests_committee_status
  ON requests(owner_committee_id, status, updated_at);
CREATE INDEX idx_lending_committee_status
  ON lending_tickets(owner_committee_id, status, updated_at);
CREATE INDEX idx_restock_committee_status
  ON restock_requests(assigned_committee_id, status, updated_at);

UPDATE app_metadata
SET value = '7', updated_at = '2026-07-22T00:00:00.000Z'
WHERE key = 'operational_schema_version';
