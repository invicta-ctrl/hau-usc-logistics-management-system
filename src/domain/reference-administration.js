import { AppError, assertDomain } from '../app/errors.js';

export const REFERENCE_ADMIN_DOMAINS = Object.freeze({
  ORGANIZATION: Object.freeze({ fields: ['displayName', 'aliases', 'description', 'effectiveFrom', 'effectiveTo'], review: false }),
  PEOPLE_MEMBERSHIPS: Object.freeze({ fields: [], review: false, rosterOwned: true }),
  COMMITTEES: Object.freeze({ fields: ['displayName', 'aliases', 'description', 'effectiveFrom', 'effectiveTo'], review: false }),
  VENUES: Object.freeze({ fields: ['displayName', 'aliases', 'category', 'location', 'unit', 'requestability', 'contactRole', 'routeId', 'effectiveFrom', 'effectiveTo', 'notes'], review: false }),
  EQUIPMENT: Object.freeze({ fields: ['displayName', 'aliases', 'category', 'location', 'unit', 'requestability', 'contactRole', 'routeId', 'returnRequired', 'effectiveFrom', 'effectiveTo', 'notes'], review: false }),
  ROUTING: Object.freeze({ fields: ['matchKind', 'referenceId', 'referenceType', 'category', 'ownerCommitteeId', 'ownerUserId', 'responsibleOfficeId', 'approvingAuthorityId', 'leadTimeBusinessDays', 'instructions', 'effectiveFrom', 'effectiveTo', 'notes'], review: true }),
  LIFECYCLE: Object.freeze({ fields: ['displayName', 'description', 'effectiveFrom', 'effectiveTo'], review: false }),
  PERMISSIONS: Object.freeze({ fields: ['roleId', 'committeeIds', 'active', 'emergencyRevocation', 'reason'], review: true }),
  SYNC_HEALTH: Object.freeze({ fields: [], review: false, readOnly: true }),
});

export const REFERENCE_ADMIN_ACTIONS = Object.freeze(['ADD', 'UPDATE', 'ARCHIVE', 'RESTORE']);
export const REFERENCE_ADMIN_STATUSES = Object.freeze(['ACTIVE', 'ARCHIVED']);

const text = (value, field, { required = false, max = 500 } = {}) => {
  const normalized = String(value ?? '').normalize('NFKC').trim().replace(/\s+/g, ' ');
  assertDomain(!required || normalized, 'REFERENCE_ADMIN_VALIDATION_ERROR', `${field} is required.`, { details: { field } });
  assertDomain(normalized.length <= max, 'REFERENCE_ADMIN_VALIDATION_ERROR', `${field} is too long.`, { details: { field, max } });
  return normalized;
};

const isoDate = (value, field) => {
  const normalized = text(value, field, { max: 10 });
  assertDomain(!normalized || (/^\d{4}-\d{2}-\d{2}$/.test(normalized) && !Number.isNaN(Date.parse(`${normalized}T00:00:00Z`))), 'REFERENCE_ADMIN_VALIDATION_ERROR', `${field} must be an ISO date.`, { details: { field } });
  return normalized;
};

const normalizeAliases = (value) => {
  const raw = Array.isArray(value) ? value : String(value ?? '').split(/[|,]/);
  return [...new Set(raw.map((entry) => text(entry, 'aliases', { max: 120 })).filter(Boolean))].slice(0, 20);
};

function normalizedDomain(value) {
  const domain = text(value, 'domain', { required: true, max: 40 }).toUpperCase();
  assertDomain(REFERENCE_ADMIN_DOMAINS[domain], 'REFERENCE_ADMIN_DOMAIN_UNSUPPORTED', 'The administrative domain is not supported.', { details: { domain } });
  return domain;
}

function normalizedAction(value) {
  const action = text(value, 'action', { required: true, max: 20 }).toUpperCase();
  assertDomain(REFERENCE_ADMIN_ACTIONS.includes(action), 'REFERENCE_ADMIN_ACTION_UNSUPPORTED', 'The administrative action is not supported.', { details: { action } });
  return action;
}

function normalizePatch(domain, patch = {}) {
  assertDomain(patch && typeof patch === 'object' && !Array.isArray(patch), 'REFERENCE_ADMIN_VALIDATION_ERROR', 'A controlled change is required.', { details: { field: 'patch' } });
  const definition = REFERENCE_ADMIN_DOMAINS[domain];
  const unknown = Object.keys(patch).filter((field) => !definition.fields.includes(field));
  assertDomain(!unknown.length, 'REFERENCE_ADMIN_FIELD_NOT_EDITABLE', 'One or more fields are not editable in this domain.', { details: { fields: unknown } });
  const result = {};
  for (const field of definition.fields) {
    if (!Object.prototype.hasOwnProperty.call(patch, field)) continue;
    if (field === 'aliases') result[field] = normalizeAliases(patch[field]);
    else if (field === 'committeeIds') result[field] = [...new Set((Array.isArray(patch[field]) ? patch[field] : []).map((entry) => text(entry, field, { max: 80 })).filter(Boolean))].slice(0, 3);
    else if (['active', 'emergencyRevocation', 'returnRequired'].includes(field)) result[field] = patch[field] === true;
    else if (field === 'leadTimeBusinessDays') {
      const number = Number(patch[field]);
      assertDomain(Number.isInteger(number) && number >= 1 && number <= 90, 'REFERENCE_ADMIN_VALIDATION_ERROR', 'leadTimeBusinessDays must be an integer from 1 to 90.', { details: { field } });
      result[field] = number;
    } else if (field === 'effectiveFrom' || field === 'effectiveTo') result[field] = isoDate(patch[field], field);
    else result[field] = text(patch[field], field, { max: field === 'instructions' || field === 'notes' || field === 'description' || field === 'reason' ? 500 : 160 });
  }
  if (result.effectiveFrom && result.effectiveTo)
    assertDomain(result.effectiveFrom <= result.effectiveTo, 'REFERENCE_ADMIN_EFFECTIVE_RANGE_INVALID', 'effectiveTo cannot precede effectiveFrom.');
  if (domain === 'PERMISSIONS') {
    if (result.roleId)
      assertDomain(['REQUESTER', 'DOL_STAFF', 'COMMITTEE_HEAD', 'DIRECTOR', 'ADMINISTRATOR', 'READ_ONLY_AUDITOR'].includes(result.roleId.toUpperCase()), 'REFERENCE_ADMIN_VALIDATION_ERROR', 'roleId is not approved.');
    if (result.committeeIds)
      assertDomain(result.committeeIds.every((id) => ['COM_FOOD', 'COM_INVENTORY_PANTRY', 'COM_MATERIALS'].includes(id)), 'REFERENCE_ADMIN_VALIDATION_ERROR', 'committeeIds contain an unapproved committee.');
    assertDomain(Boolean(result.reason), 'REFERENCE_ADMIN_VALIDATION_ERROR', 'Permission changes require a reason.', { details: { field: 'reason' } });
    if (result.emergencyRevocation)
      assertDomain(result.active === false, 'REFERENCE_ADMIN_VALIDATION_ERROR', 'Emergency access action is revocation-only.', { details: { field: 'emergencyRevocation' } });
    if (result.emergencyRevocation)
      assertDomain(!result.roleId && !result.committeeIds, 'REFERENCE_ADMIN_VALIDATION_ERROR', 'Emergency revocation cannot carry role or committee grants.', { details: { field: 'emergencyRevocation' } });
  }
  if (domain === 'ROUTING' && result.ownerCommitteeId)
    assertDomain(['COM_FOOD', 'COM_INVENTORY_PANTRY', 'COM_MATERIALS'].includes(result.ownerCommitteeId), 'REFERENCE_ADMIN_VALIDATION_ERROR', 'Routing must target an existing approved committee.');
  return result;
}

export function sanitizeReferenceAdminRecord(record) {
  const domain = normalizedDomain(record.domain);
  const definition = REFERENCE_ADMIN_DOMAINS[domain];
  const payload = Object.fromEntries(definition.fields.filter((field) => Object.prototype.hasOwnProperty.call(record.payload ?? {}, field)).map((field) => [field, record.payload[field]]));
  return {
    id: text(record.id, 'id', { required: true, max: 100 }),
    domain,
    revision: Number(record.revision || 1),
    status: REFERENCE_ADMIN_STATUSES.includes(String(record.status).toUpperCase()) ? String(record.status).toUpperCase() : 'ACTIVE',
    payload,
    effectiveFrom: String(record.effectiveFrom ?? payload.effectiveFrom ?? ''),
    effectiveTo: String(record.effectiveTo ?? payload.effectiveTo ?? ''),
    updatedAt: String(record.updatedAt ?? ''),
  };
}

export function previewReferenceAdminChange(command, context = {}) {
  const domain = normalizedDomain(command.domain);
  const action = normalizedAction(command.action);
  const definition = REFERENCE_ADMIN_DOMAINS[domain];
  assertDomain(!definition.readOnly, 'REFERENCE_ADMIN_DOMAIN_READ_ONLY', 'This administrative domain is read-only.');
  assertDomain(!definition.rosterOwned, 'REFERENCE_ADMIN_ROSTER_OWNED', 'Roster-owned identity and membership fields must be changed in the authoritative roster.');
  const current = context.current ? sanitizeReferenceAdminRecord(context.current) : null;
  const targetId = text(command.targetId, 'targetId', { required: true, max: 100 });
  if (action === 'ADD') assertDomain(!current, 'REFERENCE_ADMIN_ALREADY_EXISTS', 'The reference already exists.');
  else assertDomain(current, 'REFERENCE_ADMIN_NOT_FOUND', 'The reference was not found.');
  if (current) {
    const expectedRevision = Number(command.expectedRevision);
    assertDomain(Number.isInteger(expectedRevision) && expectedRevision === current.revision, 'REFERENCE_ADMIN_REVISION_CONFLICT', 'The record changed. Refresh and compare before retrying.', { retryable: true, details: { expectedRevision, currentRevision: current.revision, current } });
  }
  if (action === 'ARCHIVE') {
    const dependencies = Array.isArray(context.dependencies) ? context.dependencies.filter(Boolean) : [];
    assertDomain(!dependencies.length, 'REFERENCE_ADMIN_DEPENDENCY_CONFLICT', 'This record cannot be archived while active dependencies exist.', { details: { dependencies: dependencies.slice(0, 20) } });
  }
  const patch = action === 'ARCHIVE' || action === 'RESTORE' ? {} : normalizePatch(domain, command.patch);
  const before = current;
  const after = {
    id: targetId,
    domain,
    revision: (current?.revision ?? 0) + 1,
    status: action === 'ARCHIVE' ? 'ARCHIVED' : 'ACTIVE',
    payload: { ...(current?.payload ?? {}), ...patch },
    effectiveFrom: patch.effectiveFrom ?? current?.effectiveFrom ?? '',
    effectiveTo: patch.effectiveTo ?? current?.effectiveTo ?? '',
  };
  if (action === 'ADD') {
    const identity = after.payload.displayName ?? after.payload.roleId ?? after.payload.instructions;
    text(identity, 'displayName', { required: true, max: 500 });
  }
  const actorId = text(context.actorId, 'actorId', { required: true, max: 100 });
  const targetUserId = domain === 'PERMISSIONS' ? targetId : '';
  const escalation = domain === 'PERMISSIONS' && (patch.active === true || Boolean(patch.roleId) || (patch.committeeIds?.length ?? 0) > 0);
  assertDomain(!(escalation && actorId === targetUserId), 'REFERENCE_ADMIN_SELF_ESCALATION_DENIED', 'Administrators cannot grant or expand their own access.');
  const crossOfficeRoute = domain === 'ROUTING' && Boolean(patch.responsibleOfficeId || patch.approvingAuthorityId || patch.ownerCommitteeId);
  const requiresReview = Boolean(definition.review && (domain !== 'PERMISSIONS' || !patch.emergencyRevocation));
  return {
    contractVersion: 1,
    domain,
    action,
    targetId,
    expectedRevision: current?.revision ?? 0,
    before,
    after,
    changedFields: Object.keys(patch),
    requiresReview: requiresReview || crossOfficeRoute,
    risk: escalation ? 'PERMISSION_ESCALATION' : crossOfficeRoute ? 'CROSS_OFFICE_ROUTING' : action === 'ARCHIVE' ? 'DEPENDENCY_SENSITIVE' : 'STANDARD',
    destructive: false,
    permanentDelete: false,
  };
}

export function approveReferenceAdminChange(preview, { requesterId, reviewerId } = {}) {
  assertDomain(preview?.requiresReview, 'REFERENCE_ADMIN_REVIEW_NOT_REQUIRED', 'This change does not require a second reviewer.');
  const requester = text(requesterId, 'requesterId', { required: true, max: 100 });
  const reviewer = text(reviewerId, 'reviewerId', { required: true, max: 100 });
  assertDomain(requester !== reviewer, 'REFERENCE_ADMIN_SEPARATION_OF_DUTIES', 'The requester cannot approve the same change.');
  assertDomain(!(preview.domain === 'PERMISSIONS' && preview.risk === 'PERMISSION_ESCALATION' && reviewer === preview.targetId), 'REFERENCE_ADMIN_SELF_ESCALATION_DENIED', 'Reviewers cannot approve a permission grant targeting themselves.');
  return { ...preview, reviewStatus: 'APPROVED', reviewerId: reviewer };
}

export function filterReferenceAdminRecords(records, { domain, query = '', status = 'ALL', limit = 50 } = {}) {
  const selectedDomain = domain ? normalizedDomain(domain) : '';
  const token = text(query, 'query', { max: 120 }).toLowerCase();
  const max = Math.min(Math.max(Number(limit) || 50, 1), 100);
  return records
    .map(sanitizeReferenceAdminRecord)
    .filter((record) => !selectedDomain || record.domain === selectedDomain)
    .filter((record) => status === 'ALL' || record.status === String(status).toUpperCase())
    .filter((record) => !token || JSON.stringify([record.id, record.payload.displayName, record.payload.aliases]).toLowerCase().includes(token))
    .slice(0, max);
}

export function assertReferenceAdminDtoPrivacy(dto) {
  const serialized = JSON.stringify(dto);
  for (const forbidden of ['Email', 'Contact_Number', 'Supplier_TIN', 'Drive_URL', 'Authorization_Overrides_JSON', 'Notes']) {
    if (serialized.includes(`"${forbidden}"`)) throw new AppError('REFERENCE_ADMIN_DTO_PRIVACY_VIOLATION', 'The administrative projection contains a restricted field.', { details: { field: forbidden } });
  }
  return true;
}
