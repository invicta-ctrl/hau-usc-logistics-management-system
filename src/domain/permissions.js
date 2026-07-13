import { ROLES } from './constants.js';

export const CAPABILITIES = Object.freeze({
  VIEW_REQUEST: 'view.request',
  VIEW_INTERNAL: 'view.internal',
  VIEW_COMMITTEE_SUMMARY: 'view.committee.summary',
  VIEW_ALL_SUMMARY: 'view.all.summary',
  VIEW_AUDIT: 'view.audit',
  VIEW_INVENTORY: 'view.inventory',
  REQUEST_CREATE: 'request.create',
  REQUEST_REVIEW: 'request.review',
  REQUEST_MISSING_INFORMATION: 'request.missing_information',
  REQUEST_REJECT: 'request.reject',
  REQUEST_REOPEN: 'request.reopen',
  ASSIGN_COMMITTEE: 'workflow.assign_committee',
  ASSIGN_STAFF: 'workflow.assign_staff',
  ESCALATE: 'workflow.escalate',
  FULFILL_CANVASS: 'fulfillment.canvass',
  FULFILL_PROCURE: 'fulfillment.procure',
  FULFILL_RESERVE: 'fulfillment.reserve',
  FULFILL_RECEIVE: 'fulfillment.receive',
  FULFILL_RELEASE: 'fulfillment.release',
  LENDING_CREATE: 'lending.create',
  LENDING_APPROVE: 'lending.approve',
  LENDING_HANDOFF: 'lending.handoff',
  LENDING_RETURN: 'lending.return',
  INVENTORY_MERGE: 'inventory.merge_event_item',
  INVENTORY_ADJUST: 'inventory.adjust',
  REFERENCE_CATALOG_MANAGE: 'reference.catalog.manage',
  REFERENCE_MANAGE: 'reference.manage',
  ACCESS_ADMIN: 'access.admin',
  SYSTEM_ADMIN: 'system.admin',
  SYSTEM_DIAGNOSTICS: 'system.diagnostics',
  EVIDENCE_UPLOAD: 'evidence.upload',
});

export const COMMITTEES = Object.freeze({
  FOOD: 'COM_FOOD',
  INVENTORY_PANTRY: 'COM_INVENTORY_PANTRY',
  MATERIALS: 'COM_MATERIALS',
});

export const COMMITTEE_REGISTRY = Object.freeze([
  Object.freeze({ id: COMMITTEES.FOOD, name: 'Food Committee', aliases: ['FOOD', 'FOOD COMMITTEE'] }),
  Object.freeze({ id: COMMITTEES.INVENTORY_PANTRY, name: 'Inventory and Pantry Committee', aliases: ['INVENTORY', 'INVENTORY COMMITTEE', 'INVENTORY AND PANTRY COMMITTEE', 'INVENTORY & PANTRY COMMITTEE', 'PANTRY COMMITTEE'] }),
  Object.freeze({ id: COMMITTEES.MATERIALS, name: 'Materials Committee', aliases: ['MATERIALS', 'MATERIALS COMMITTEE'] }),
]);

const ROLE_REGISTRY = Object.freeze({
  [ROLES.REQUESTER]: Object.freeze({ scopeMode: 'SELF', capabilities: [CAPABILITIES.VIEW_REQUEST, CAPABILITIES.REQUEST_CREATE, CAPABILITIES.LENDING_CREATE] }),
  [ROLES.DOL_STAFF]: Object.freeze({ scopeMode: 'COMMITTEE', capabilities: [CAPABILITIES.VIEW_REQUEST, CAPABILITIES.VIEW_INTERNAL, CAPABILITIES.VIEW_COMMITTEE_SUMMARY, CAPABILITIES.VIEW_INVENTORY, CAPABILITIES.REQUEST_CREATE, CAPABILITIES.LENDING_CREATE, CAPABILITIES.REQUEST_REVIEW, CAPABILITIES.REQUEST_MISSING_INFORMATION, CAPABILITIES.REQUEST_REJECT, CAPABILITIES.FULFILL_CANVASS, CAPABILITIES.FULFILL_PROCURE, CAPABILITIES.FULFILL_RESERVE, CAPABILITIES.FULFILL_RECEIVE, CAPABILITIES.FULFILL_RELEASE, CAPABILITIES.LENDING_APPROVE, CAPABILITIES.LENDING_HANDOFF, CAPABILITIES.LENDING_RETURN, CAPABILITIES.EVIDENCE_UPLOAD] }),
  [ROLES.COMMITTEE_HEAD]: Object.freeze({ scopeMode: 'COMMITTEE', capabilities: [CAPABILITIES.VIEW_REQUEST, CAPABILITIES.VIEW_INTERNAL, CAPABILITIES.VIEW_COMMITTEE_SUMMARY, CAPABILITIES.VIEW_INVENTORY, CAPABILITIES.REQUEST_CREATE, CAPABILITIES.LENDING_CREATE, CAPABILITIES.REQUEST_REVIEW, CAPABILITIES.REQUEST_MISSING_INFORMATION, CAPABILITIES.REQUEST_REJECT, CAPABILITIES.REQUEST_REOPEN, CAPABILITIES.ASSIGN_STAFF, CAPABILITIES.ESCALATE, CAPABILITIES.FULFILL_CANVASS, CAPABILITIES.FULFILL_PROCURE, CAPABILITIES.FULFILL_RESERVE, CAPABILITIES.FULFILL_RECEIVE, CAPABILITIES.LENDING_APPROVE, CAPABILITIES.INVENTORY_MERGE, CAPABILITIES.EVIDENCE_UPLOAD] }),
  [ROLES.DIRECTOR]: Object.freeze({ scopeMode: 'ALL', capabilities: [CAPABILITIES.VIEW_REQUEST, CAPABILITIES.VIEW_INTERNAL, CAPABILITIES.VIEW_ALL_SUMMARY, CAPABILITIES.VIEW_AUDIT, CAPABILITIES.VIEW_INVENTORY, CAPABILITIES.REQUEST_CREATE, CAPABILITIES.LENDING_CREATE, CAPABILITIES.REQUEST_REVIEW, CAPABILITIES.REQUEST_MISSING_INFORMATION, CAPABILITIES.REQUEST_REJECT, CAPABILITIES.REQUEST_REOPEN, CAPABILITIES.ASSIGN_COMMITTEE, CAPABILITIES.ASSIGN_STAFF, CAPABILITIES.ESCALATE, CAPABILITIES.FULFILL_CANVASS, CAPABILITIES.FULFILL_PROCURE, CAPABILITIES.FULFILL_RESERVE, CAPABILITIES.FULFILL_RECEIVE, CAPABILITIES.FULFILL_RELEASE, CAPABILITIES.LENDING_APPROVE, CAPABILITIES.LENDING_HANDOFF, CAPABILITIES.LENDING_RETURN, CAPABILITIES.INVENTORY_MERGE, CAPABILITIES.INVENTORY_ADJUST, CAPABILITIES.EVIDENCE_UPLOAD] }),
  [ROLES.ADMINISTRATOR]: Object.freeze({ scopeMode: 'ALL', capabilities: [CAPABILITIES.VIEW_REQUEST, CAPABILITIES.VIEW_INTERNAL, CAPABILITIES.VIEW_ALL_SUMMARY, CAPABILITIES.VIEW_AUDIT, CAPABILITIES.VIEW_INVENTORY, CAPABILITIES.REQUEST_CREATE, CAPABILITIES.LENDING_CREATE, CAPABILITIES.REFERENCE_CATALOG_MANAGE, CAPABILITIES.REFERENCE_MANAGE, CAPABILITIES.ACCESS_ADMIN, CAPABILITIES.SYSTEM_ADMIN, CAPABILITIES.SYSTEM_DIAGNOSTICS, CAPABILITIES.EVIDENCE_UPLOAD] }),
  [ROLES.READ_ONLY_AUDITOR]: Object.freeze({ scopeMode: 'ALL', capabilities: [CAPABILITIES.VIEW_AUDIT] }),
});

export const ROLE_CAPABILITIES = Object.freeze(Object.fromEntries(
  Object.entries(ROLE_REGISTRY).map(([role, definition]) => [role, Object.freeze([...definition.capabilities])]),
));

const ROLE_ALIASES = Object.freeze({
  ADMIN: ROLES.ADMINISTRATOR,
  ADMINISTRATOR: ROLES.ADMINISTRATOR,
  DOL_DIRECTOR: ROLES.DIRECTOR,
  DIRECTOR: ROLES.DIRECTOR,
  DOL_STAFF: ROLES.DOL_STAFF,
  'DOL STAFF': ROLES.DOL_STAFF,
  COMMITTEE_HEAD: ROLES.COMMITTEE_HEAD,
  'COMMITTEE HEAD': ROLES.COMMITTEE_HEAD,
  REQUESTER: ROLES.REQUESTER,
  READ_ONLY_AUDITOR: ROLES.READ_ONLY_AUDITOR,
  'READ ONLY AUDITOR': ROLES.READ_ONLY_AUDITOR,
});

const ACTION_CAPABILITIES = Object.freeze({
  submit_request: CAPABILITIES.REQUEST_CREATE,
  review_request: CAPABILITIES.REQUEST_REVIEW,
  receive: CAPABILITIES.FULFILL_RECEIVE,
  release: CAPABILITIES.FULFILL_RELEASE,
  approve_lending: CAPABILITIES.LENDING_APPROVE,
  merge_event_item: CAPABILITIES.INVENTORY_MERGE,
  diagnostics: CAPABILITIES.SYSTEM_DIAGNOSTICS,
  manage_catalog: CAPABILITIES.REFERENCE_CATALOG_MANAGE,
  manage_reference: CAPABILITIES.REFERENCE_MANAGE,
  admin_access: CAPABILITIES.ACCESS_ADMIN,
  system_admin: CAPABILITIES.SYSTEM_ADMIN,
  reset_demo: null,
});

const LEGACY_PERMISSION_KEYS = Object.freeze({
  review: CAPABILITIES.REQUEST_REVIEW,
  release: CAPABILITIES.FULFILL_RELEASE,
  receive: CAPABILITIES.FULFILL_RECEIVE,
  admin: CAPABILITIES.SYSTEM_ADMIN,
  manageCatalog: CAPABILITIES.REFERENCE_CATALOG_MANAGE,
});

const CANONICAL_CAPABILITIES = new Set(Object.values(CAPABILITIES));

function normalizeRole(value) {
  return String(value ?? '').trim().replace(/[\s-]+/g, '_').toUpperCase();
}

export function canonicalRoleId(value) {
  const raw = String(value ?? '').trim();
  return ROLE_REGISTRY[normalizeRole(raw)] ? normalizeRole(raw) : ROLE_ALIASES[raw] ?? ROLE_ALIASES[normalizeRole(raw)] ?? '';
}

export function canonicalCommitteeId(value) {
  const raw = String(value ?? '').trim();
  const normalized = normalizeRole(raw);
  return COMMITTEE_REGISTRY.find((committee) => (
    raw === committee.id
    || normalized === normalizeRole(committee.id)
    || normalized === normalizeRole(committee.name)
    || committee.aliases.some((alias) => normalized === normalizeRole(alias))
  ))?.id ?? '';
}

export function capabilitiesFor(role) {
  return [...(ROLE_CAPABILITIES[canonicalRoleId(role)] ?? [])];
}

function capabilityForAction(action) {
  if (CANONICAL_CAPABILITIES.has(action)) return action;
  return ACTION_CAPABILITIES[action] ?? undefined;
}

export function can(roleOrUser, action) {
  const capability = capabilityForAction(action);
  if (!capability && action !== 'reset_demo') return false;
  if (typeof roleOrUser === 'object' && roleOrUser !== null) {
    const authorization = roleOrUser.authorization;
    if (authorization?.modelVersion >= 2) {
      if (authorization.active !== true || authorization.mappingStatus !== 'MAPPED') return false;
      if (action === 'reset_demo') return false;
      return Array.isArray(authorization.capabilities) && authorization.capabilities.includes(capability);
    }
    roleOrUser = roleOrUser.role;
  }
  const roleId = canonicalRoleId(roleOrUser);
  if (action === 'reset_demo') return roleId === ROLES.ADMINISTRATOR;
  return Boolean(capability && capabilitiesFor(roleId).includes(capability));
}

export function permissionsFor(role) {
  return Object.fromEntries(Object.keys(ACTION_CAPABILITIES).map((action) => [action, can(role, action)]).filter(([action]) => action !== 'manage_reference' && action !== 'admin_access' && action !== 'system_admin'));
}

export function authorizationDenialMessage(reason) {
  return ({
    INACTIVE_USER: 'Your access is inactive.',
    AMBIGUOUS_IDENTITY: 'Your account has multiple active access mappings and requires administrator review.',
    UNKNOWN_ROLE: 'Your account role is not recognized.',
    CAPABILITY_NOT_GRANTED: 'Your account is not permitted to perform this action.',
    MISSING_COMMITTEE_SCOPE: 'Your account has no active committee scope for this action.',
    ENTITY_SCOPE_REQUIRED: 'The requested record has no verified authorization scope.',
    OUT_OF_SCOPE: 'The requested record is outside your authorized committee scope.',
    SELF_SCOPE_ONLY: 'This action is limited to your own request scope.',
    MAPPING_RECONCILIATION_REQUIRED: 'Your account authorization mapping requires reconciliation before this action is available.',
  })[reason] ?? 'This action is not authorized.';
}

export function projectClientAuthorization(currentUser, { requireCanonical = false } = {}) {
  if (!currentUser) return currentUser;
  const authorization = currentUser.authorization;
  if (requireCanonical && !authorization) {
    return {
      ...currentUser,
      role: 'REQUESTER',
      committee: '',
      permissions: Object.fromEntries(Object.keys(LEGACY_PERMISSION_KEYS).map((key) => [key, false])),
      scopes: { committee: [], organization: [] },
    };
  }
  if (authorization?.modelVersion >= 2) {
    const capabilities = authorization.active === true && authorization.mappingStatus === 'MAPPED' && Array.isArray(authorization.capabilities)
      ? authorization.capabilities.filter((capability) => CANONICAL_CAPABILITIES.has(capability))
      : [];
    const committeeIds = Array.isArray(authorization.committeeIds) ? authorization.committeeIds.filter(Boolean).slice(0, 3) : [];
    const committees = Array.isArray(authorization.committees) ? authorization.committees.filter((committee) => committee && typeof committee === 'object').slice(0, 3) : [];
    const permissions = Object.fromEntries(Object.entries(LEGACY_PERMISSION_KEYS).map(([key, capability]) => [key, capabilities.includes(capability)]));
    return {
      ...currentUser,
      role: authorization.roleId || 'REQUESTER',
      committee: committees[0]?.name || '',
      permissions,
      scopes: { committee: committeeIds, organization: [] },
      authorization: { ...authorization, committeeIds, committees, capabilities },
    };
  }
  return { ...currentUser, role: canonicalRoleId(currentUser.role) || currentUser.role };
}
