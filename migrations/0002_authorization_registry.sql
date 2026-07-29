INSERT INTO roles (id, label, scope_mode) VALUES
  ('REQUESTER', 'Requester', 'SELF'),
  ('DOL_STAFF', 'DOL Staff', 'COMMITTEE'),
  ('COMMITTEE_HEAD', 'Committee Head', 'COMMITTEE'),
  ('DIRECTOR', 'Director', 'ALL'),
  ('ADMINISTRATOR', 'Administrator', 'ALL'),
  ('READ_ONLY_AUDITOR', 'Read-only Auditor', 'ALL');

INSERT INTO committees (id, name) VALUES
  ('COM_FOOD', 'Food Committee'),
  ('COM_INVENTORY_PANTRY', 'Inventory and Pantry Committee'),
  ('COM_MATERIALS', 'Materials Committee');

INSERT INTO capabilities (id, description) VALUES
  ('view.request', 'View request portal records'),
  ('view.internal', 'View internal operations'),
  ('view.committee.summary', 'View committee summary'),
  ('view.all.summary', 'View organization summary'),
  ('view.audit', 'View audit records'),
  ('view.inventory', 'View inventory'),
  ('request.create', 'Create requests'),
  ('request.review', 'Review requests'),
  ('request.missing_information', 'Request missing information'),
  ('request.reject', 'Reject requests'),
  ('request.reopen', 'Reopen requests'),
  ('workflow.assign_committee', 'Assign committee'),
  ('workflow.assign_staff', 'Assign staff'),
  ('workflow.escalate', 'Escalate workflow'),
  ('fulfillment.canvass', 'Canvass suppliers'),
  ('fulfillment.procure', 'Procure items'),
  ('fulfillment.reserve', 'Reserve stock'),
  ('fulfillment.receive', 'Receive goods'),
  ('fulfillment.release', 'Release stock'),
  ('lending.create', 'Create lending ticket'),
  ('lending.approve', 'Approve lending ticket'),
  ('lending.handoff', 'Confirm lending handoff'),
  ('lending.return', 'Confirm lending return'),
  ('inventory.merge_event_item', 'Merge event item'),
  ('inventory.adjust', 'Post inventory adjustment'),
  ('reference.catalog.manage', 'Manage catalog'),
  ('reference.manage', 'Manage reference data'),
  ('access.admin', 'Administer access'),
  ('system.admin', 'Administer system'),
  ('system.diagnostics', 'View system diagnostics'),
  ('evidence.upload', 'Upload evidence');

INSERT INTO role_capabilities (role_id, capability_id)
SELECT 'REQUESTER', id FROM capabilities WHERE id IN ('view.request', 'request.create', 'lending.create');

INSERT INTO role_capabilities (role_id, capability_id)
SELECT 'DOL_STAFF', id FROM capabilities WHERE id IN (
  'view.request', 'view.internal', 'view.committee.summary', 'view.inventory', 'request.create',
  'lending.create', 'request.review', 'request.missing_information', 'request.reject',
  'fulfillment.canvass', 'fulfillment.procure', 'fulfillment.reserve', 'fulfillment.receive',
  'fulfillment.release', 'lending.approve', 'lending.handoff', 'lending.return', 'evidence.upload'
);

INSERT INTO role_capabilities (role_id, capability_id)
SELECT 'COMMITTEE_HEAD', id FROM capabilities WHERE id IN (
  'view.request', 'view.internal', 'view.committee.summary', 'view.inventory', 'request.create',
  'lending.create', 'request.review', 'request.missing_information', 'request.reject', 'request.reopen',
  'workflow.assign_staff', 'workflow.escalate', 'fulfillment.canvass', 'fulfillment.procure',
  'fulfillment.reserve', 'fulfillment.receive', 'lending.approve', 'inventory.merge_event_item',
  'evidence.upload'
);

INSERT INTO role_capabilities (role_id, capability_id)
SELECT 'DIRECTOR', id FROM capabilities WHERE id NOT IN (
  'reference.catalog.manage', 'reference.manage', 'access.admin', 'system.admin', 'system.diagnostics'
);

INSERT INTO role_capabilities (role_id, capability_id)
SELECT 'ADMINISTRATOR', id FROM capabilities WHERE id IN (
  'view.request', 'view.internal', 'view.all.summary', 'view.audit', 'view.inventory', 'request.create',
  'lending.create', 'reference.catalog.manage', 'reference.manage', 'access.admin', 'system.admin',
  'system.diagnostics', 'evidence.upload'
);

INSERT INTO role_capabilities (role_id, capability_id)
VALUES ('READ_ONLY_AUDITOR', 'view.audit');

UPDATE app_metadata
SET value = '2', updated_at = '2026-07-22T00:00:00.000Z'
WHERE key = 'operational_schema_version';
