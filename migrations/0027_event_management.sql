INSERT OR IGNORE INTO capabilities (id, description)
VALUES ('event.manage', 'Create and maintain governed event hierarchies');

INSERT OR IGNORE INTO role_capabilities (role_id, capability_id)
SELECT id, 'event.manage'
FROM roles
WHERE id IN ('SYSTEM_OWNER', 'ADMINISTRATOR', 'DIRECTOR');

ALTER TABLE event_series ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1);
ALTER TABLE event_series ADD COLUMN owner_review_status TEXT NOT NULL DEFAULT 'OWNER_REVIEW_REQUIRED'
  CHECK (owner_review_status IN ('OWNER_REVIEW_REQUIRED', 'REVIEW_COMPLETE'));
ALTER TABLE event_series ADD COLUMN source_reference TEXT NOT NULL DEFAULT '';
ALTER TABLE event_series ADD COLUMN supersedes_reference TEXT NOT NULL DEFAULT '';
ALTER TABLE event_series ADD COLUMN notes TEXT NOT NULL DEFAULT '';
ALTER TABLE event_series ADD COLUMN archived_at TEXT;
ALTER TABLE event_series ADD COLUMN created_by TEXT REFERENCES accounts(id);
ALTER TABLE event_series ADD COLUMN updated_by TEXT REFERENCES accounts(id);

CREATE UNIQUE INDEX idx_event_series_code_unique
  ON event_series(code)
  WHERE trim(code) <> '';

CREATE TABLE event_days (
  id TEXT PRIMARY KEY,
  event_series_id TEXT NOT NULL REFERENCES event_series(id),
  name TEXT NOT NULL,
  event_date TEXT NOT NULL,
  status TEXT NOT NULL,
  revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1),
  owner_review_status TEXT NOT NULL DEFAULT 'OWNER_REVIEW_REQUIRED'
    CHECK (owner_review_status IN ('OWNER_REVIEW_REQUIRED', 'REVIEW_COMPLETE')),
  notes TEXT NOT NULL DEFAULT '',
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  created_by TEXT NOT NULL REFERENCES accounts(id),
  updated_by TEXT NOT NULL REFERENCES accounts(id),
  archived_at TEXT,
  UNIQUE (event_series_id, event_date)
) STRICT;

ALTER TABLE events ADD COLUMN event_day_id TEXT REFERENCES event_days(id);
ALTER TABLE events ADD COLUMN code TEXT NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN activity_type TEXT NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN included_items_json TEXT NOT NULL DEFAULT '[]'
  CHECK (json_valid(included_items_json));
ALTER TABLE events ADD COLUMN time_status TEXT NOT NULL DEFAULT 'SCHEDULED'
  CHECK (time_status IN ('SCHEDULED', 'TBA'));
ALTER TABLE events ADD COLUMN supporting_committees_json TEXT NOT NULL DEFAULT '[]'
  CHECK (json_valid(supporting_committees_json));
ALTER TABLE events ADD COLUMN preparation_deadline TEXT;
ALTER TABLE events ADD COLUMN request_window_opens_at TEXT;
ALTER TABLE events ADD COLUMN request_window_closes_at TEXT;
ALTER TABLE events ADD COLUMN release_deadline TEXT;
ALTER TABLE events ADD COLUMN readiness_percentage REAL
  CHECK (readiness_percentage IS NULL OR (readiness_percentage >= 0 AND readiness_percentage <= 100));
ALTER TABLE events ADD COLUMN preparation_progress REAL
  CHECK (preparation_progress IS NULL OR (preparation_progress >= 0 AND preparation_progress <= 100));
ALTER TABLE events ADD COLUMN owner_review_status TEXT NOT NULL DEFAULT 'OWNER_REVIEW_REQUIRED'
  CHECK (owner_review_status IN ('OWNER_REVIEW_REQUIRED', 'REVIEW_COMPLETE'));
ALTER TABLE events ADD COLUMN revision INTEGER NOT NULL DEFAULT 1 CHECK (revision >= 1);
ALTER TABLE events ADD COLUMN notes TEXT NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN source_reference TEXT NOT NULL DEFAULT '';
ALTER TABLE events ADD COLUMN created_by TEXT REFERENCES accounts(id);
ALTER TABLE events ADD COLUMN updated_by TEXT REFERENCES accounts(id);
ALTER TABLE events ADD COLUMN archived_at TEXT;

CREATE UNIQUE INDEX idx_events_series_code_unique
  ON events(event_series_id, code)
  WHERE trim(code) <> '';
CREATE INDEX idx_events_day_time ON events(event_day_id, starts_at, name);
CREATE INDEX idx_event_days_series_date ON event_days(event_series_id, event_date, active);

ALTER TABLE requests ADD COLUMN event_day_id TEXT REFERENCES event_days(id);
CREATE INDEX idx_requests_event_hierarchy
  ON requests(event_series_id, event_day_id, event_id, status, updated_at);

-- Preserve legacy event/request relationships by assigning every existing
-- event to a migrated day before active projections require the three-level
-- hierarchy. This is historical normalization, not new event planning data.
INSERT OR IGNORE INTO event_days (
  id, event_series_id, name, event_date, status, revision,
  owner_review_status, notes, active, created_at, updated_at, created_by, updated_by
)
SELECT
  'EDY-MIGRATED-' || MIN(event.id),
  event.event_series_id,
  'Migrated event day ' || substr(COALESCE(event.starts_at, event.created_at), 1, 10),
  substr(COALESCE(event.starts_at, event.created_at), 1, 10),
  CASE
    WHEN SUM(CASE WHEN event.status = 'COMPLETED' THEN 0 ELSE 1 END) = 0 THEN 'COMPLETED'
    WHEN SUM(CASE WHEN event.status = 'CANCELLED' THEN 0 ELSE 1 END) = 0 THEN 'CANCELLED'
    ELSE 'UPCOMING'
  END,
  1,
  'OWNER_REVIEW_REQUIRED',
  'Migrated from the accepted legacy two-level event model',
  1,
  MIN(event.created_at),
  MAX(event.updated_at),
  COALESCE(
    MIN(event.created_by),
    (SELECT id FROM accounts WHERE role_id = 'SYSTEM_OWNER' ORDER BY created_at LIMIT 1),
    (SELECT id FROM accounts ORDER BY created_at LIMIT 1)
  ),
  COALESCE(
    MIN(event.updated_by),
    (SELECT id FROM accounts WHERE role_id = 'SYSTEM_OWNER' ORDER BY created_at LIMIT 1),
    (SELECT id FROM accounts ORDER BY created_at LIMIT 1)
  )
FROM events event
WHERE event.event_series_id IS NOT NULL
GROUP BY event.event_series_id, substr(COALESCE(event.starts_at, event.created_at), 1, 10);

UPDATE events
SET event_day_id = (
  SELECT day.id
  FROM event_days day
  WHERE day.event_series_id = events.event_series_id
    AND day.event_date = substr(COALESCE(events.starts_at, events.created_at), 1, 10)
)
WHERE event_day_id IS NULL AND event_series_id IS NOT NULL;

UPDATE requests
SET event_day_id = (SELECT event_day_id FROM events WHERE events.id = requests.event_id)
WHERE event_day_id IS NULL AND event_id IS NOT NULL;

CREATE TABLE event_activity_history (
  id TEXT PRIMARY KEY,
  event_series_id TEXT NOT NULL REFERENCES event_series(id),
  event_day_id TEXT REFERENCES event_days(id),
  event_id TEXT REFERENCES events(id),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('EVENT_SERIES', 'EVENT_DAY', 'EVENT_ACTIVITY', 'EVENT_LINK')),
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('CREATED', 'UPDATED', 'CORRECTED', 'ARCHIVED', 'RESTORED', 'LINKED', 'UNLINKED', 'SEEDED')),
  before_json TEXT CHECK (before_json IS NULL OR json_valid(before_json)),
  after_json TEXT CHECK (after_json IS NULL OR json_valid(after_json)),
  reason TEXT NOT NULL,
  occurred_at TEXT NOT NULL,
  actor_account_id TEXT NOT NULL REFERENCES accounts(id),
  correlation_id TEXT NOT NULL,
  idempotency_key TEXT NOT NULL,
  UNIQUE (entity_type, entity_id, idempotency_key)
) STRICT;

CREATE INDEX idx_event_activity_history_entity
  ON event_activity_history(entity_type, entity_id, occurred_at DESC);

CREATE TRIGGER event_activity_history_no_update
BEFORE UPDATE ON event_activity_history
BEGIN
  SELECT RAISE(ABORT, 'event activity history is append-only');
END;

CREATE TRIGGER event_activity_history_no_delete
BEFORE DELETE ON event_activity_history
BEGIN
  SELECT RAISE(ABORT, 'event activity history is append-only');
END;

CREATE TABLE event_operational_links (
  id TEXT PRIMARY KEY,
  event_series_id TEXT NOT NULL REFERENCES event_series(id),
  event_day_id TEXT NOT NULL REFERENCES event_days(id),
  event_id TEXT NOT NULL REFERENCES events(id),
  link_type TEXT NOT NULL CHECK (link_type IN (
    'REQUEST', 'FOOD_REQUIREMENT', 'MATERIAL', 'PROCUREMENT',
    'INVENTORY_REQUIREMENT', 'RELEASE'
  )),
  linked_entity_type TEXT NOT NULL,
  linked_entity_id TEXT NOT NULL,
  notes TEXT,
  linked_by TEXT NOT NULL REFERENCES accounts(id),
  linked_at TEXT NOT NULL,
  UNIQUE (event_id, link_type, linked_entity_id)
) STRICT;

CREATE INDEX idx_event_operational_links_hierarchy
  ON event_operational_links(event_series_id, event_day_id, event_id, link_type);

UPDATE app_metadata
SET value = '27', updated_at = '2026-07-28T00:00:00.000Z'
WHERE key = 'operational_schema_version';
