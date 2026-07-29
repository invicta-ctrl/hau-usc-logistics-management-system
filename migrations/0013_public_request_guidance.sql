ALTER TABLE public_request_access ADD COLUMN requester_type TEXT NOT NULL DEFAULT '';
ALTER TABLE public_request_access ADD COLUMN location TEXT NOT NULL DEFAULT '';
ALTER TABLE public_request_access ADD COLUMN stock_area TEXT NOT NULL DEFAULT '';
ALTER TABLE public_request_access ADD COLUMN needed_date TEXT;

UPDATE app_metadata
SET value = '13', updated_at = '2026-07-24T04:00:00.000Z'
WHERE key = 'operational_schema_version';
