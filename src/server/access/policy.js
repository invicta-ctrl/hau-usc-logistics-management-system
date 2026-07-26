import { CAPABILITIES, capabilitiesFor, canonicalCommitteeId, canonicalRoleId } from '../../domain/permissions.js';
import { ROLES } from '../../domain/constants.js';

export const ACCESS_WORKSPACES = Object.freeze([
  Object.freeze({ id: 'administrator', label: 'Admin' }),
  Object.freeze({ id: 'director', label: 'Director' }),
  Object.freeze({ id: 'food', label: 'Food' }),
  Object.freeze({ id: 'inventory-pantry', label: 'Inventory & Pantry' }),
  Object.freeze({ id: 'materials', label: 'Materials' }),
]);

const WORKSPACE_IDS = new Set(ACCESS_WORKSPACES.map((entry) => entry.id));
const CAPABILITY_IDS = new Set(Object.values(CAPABILITIES));
const SENSITIVE_CAPABILITIES = new Set([
  CAPABILITIES.ACCESS_ADMIN,
  CAPABILITIES.SYSTEM_ADMIN,
  CAPABILITIES.SYSTEM_DIAGNOSTICS,
  CAPABILITIES.REFERENCE_MANAGE,
  CAPABILITIES.REFERENCE_CATALOG_MANAGE,
  CAPABILITIES.ADVERTISEMENT_MANAGE,
  CAPABILITIES.INVENTORY_ADJUST,
]);

export const ACCESS_PRESETS = Object.freeze([
  Object.freeze({ id: 'ADMINISTRATOR', label: 'Administrator', roleId: ROLES.ADMINISTRATOR, workspaceIds: ACCESS_WORKSPACES.map((entry) => entry.id) }),
  Object.freeze({ id: 'DIRECTOR', label: 'Director', roleId: ROLES.DIRECTOR, workspaceIds: ['director'] }),
  Object.freeze({ id: 'FOOD_OPERATOR', label: 'Food Operator', roleId: ROLES.DOL_STAFF, workspaceIds: ['food'], committeeIds: ['COM_FOOD'] }),
  Object.freeze({ id: 'INVENTORY_OPERATOR', label: 'Inventory & Pantry Operator', roleId: ROLES.DOL_STAFF, workspaceIds: ['inventory-pantry'], committeeIds: ['COM_INVENTORY_PANTRY'] }),
  Object.freeze({ id: 'MATERIALS_OPERATOR', label: 'Materials Operator', roleId: ROLES.DOL_STAFF, workspaceIds: ['materials'], committeeIds: ['COM_MATERIALS'] }),
  Object.freeze({ id: 'REQUEST_REVIEWER', label: 'Request Reviewer', roleId: ROLES.COMMITTEE_HEAD, workspaceIds: [] }),
  Object.freeze({ id: 'LENDING_STAFF', label: 'Lending Staff', roleId: ROLES.DOL_STAFF, workspaceIds: ['inventory-pantry'], committeeIds: ['COM_INVENTORY_PANTRY'] }),
  Object.freeze({ id: 'REQUESTER_ONLY', label: 'Requester Only', roleId: ROLES.REQUESTER, workspaceIds: [] }),
  Object.freeze({ id: 'CUSTOM', label: 'Custom', roleId: '', workspaceIds: [] }),
]);

const PRESETS = new Map(ACCESS_PRESETS.map((entry) => [entry.id, entry]));

function uniqueStrings(values, { limit = 100 } = {}) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => String(value ?? '').trim()).filter(Boolean))].slice(0, limit);
}

export function roleWorkspaceIds(roleId, committeeIds = []) {
  const role = canonicalRoleId(roleId);
  if (role === ROLES.SYSTEM_OWNER) return ACCESS_WORKSPACES.map((entry) => entry.id);
  if (role === ROLES.ADMINISTRATOR) return ACCESS_WORKSPACES.map((entry) => entry.id);
  if (role === ROLES.DIRECTOR) return ['director'];
  if (![ROLES.DOL_STAFF, ROLES.COMMITTEE_HEAD].includes(role)) return [];
  const committees = new Set(committeeIds.map(canonicalCommitteeId).filter(Boolean));
  return [
    ...(committees.has('COM_FOOD') ? ['food'] : []),
    ...(committees.has('COM_INVENTORY_PANTRY') ? ['inventory-pantry'] : []),
    ...(committees.has('COM_MATERIALS') ? ['materials'] : []),
  ];
}

export function accountAccessPolicy(account = {}) {
  const stored = account.accessProfile ?? {};
  const committeeIds = uniqueStrings(account.committeeIds).map(canonicalCommitteeId).filter(Boolean);
  const workspaceIds = uniqueStrings(stored.workspaceIds).filter((id) => WORKSPACE_IDS.has(id));
  const resolvedWorkspaces = workspaceIds.length ? workspaceIds : roleWorkspaceIds(account.roleId, committeeIds);
  const defaultWorkspaceId = resolvedWorkspaces.includes(stored.defaultWorkspaceId)
    ? stored.defaultWorkspaceId
    : resolvedWorkspaces[0] ?? '';
  return Object.freeze({
    presetId: PRESETS.has(stored.presetId) ? stored.presetId : 'CUSTOM',
    workspaceIds: resolvedWorkspaces,
    defaultWorkspaceId,
    locationScopeIds: uniqueStrings(stored.locationScopeIds, { limit: 50 }),
    eventSeriesScopeIds: uniqueStrings(stored.eventSeriesScopeIds, { limit: 50 }),
    eventScopeIds: uniqueStrings(stored.eventScopeIds, { limit: 100 }),
    capabilityGrants: uniqueStrings(stored.capabilityGrants).filter((id) => CAPABILITY_IDS.has(id)),
    capabilityDenies: uniqueStrings(stored.capabilityDenies).filter((id) => CAPABILITY_IDS.has(id)),
  });
}

export function effectiveCapabilities(account = {}) {
  const policy = accountAccessPolicy(account);
  const capabilities = new Set(capabilitiesFor(account.roleId));
  policy.capabilityGrants.forEach((capability) => capabilities.add(capability));
  policy.capabilityDenies.forEach((capability) => capabilities.delete(capability));
  return [...capabilities].sort();
}

export function normalizeAccessPolicy(command = {}, {
  actorRoleId = '',
  reference = {},
  existingAccount = {},
} = {}) {
  const presetId = String(command.presetId ?? existingAccount.accessProfile?.presetId ?? 'CUSTOM').trim().toUpperCase();
  const preset = PRESETS.get(presetId);
  if (!preset) return { valid: false, code: 'ACCESS_PRESET_INVALID' };
  const roleId = canonicalRoleId(command.roleId ?? preset.roleId ?? existingAccount.roleId);
  if (!roleId || roleId === ROLES.SYSTEM_OWNER) return { valid: false, code: 'ACCESS_ROLE_INVALID' };
  const actorRole = canonicalRoleId(actorRoleId);
  if (roleId === ROLES.ADMINISTRATOR && actorRole !== ROLES.SYSTEM_OWNER) {
    return { valid: false, code: 'OWNER_APPROVAL_REQUIRED' };
  }

  const has = (key) => Object.prototype.hasOwnProperty.call(command, key);
  const requestedCommitteeIds = uniqueStrings(
    has('committeeIds') ? command.committeeIds : preset.committeeIds ?? existingAccount.committeeIds,
    { limit: 3 },
  );
  const committeeIds = requestedCommitteeIds.map(canonicalCommitteeId).filter(Boolean);
  if (committeeIds.length !== requestedCommitteeIds.length) {
    return { valid: false, code: 'GOVERNED_SCOPE_INVALID' };
  }
  if ([ROLES.DOL_STAFF, ROLES.COMMITTEE_HEAD].includes(roleId) && !committeeIds.length) {
    return { valid: false, code: 'COMMITTEE_SCOPE_REQUIRED' };
  }
  const defaultCommitteeId = canonicalCommitteeId(command.defaultCommitteeId ?? committeeIds[0] ?? '');
  if (defaultCommitteeId && !committeeIds.includes(defaultCommitteeId)) {
    return { valid: false, code: 'DEFAULT_COMMITTEE_OUT_OF_SCOPE' };
  }

  const rawWorkspaces = uniqueStrings(
    has('workspaceIds') ? command.workspaceIds : preset.workspaceIds?.length ? preset.workspaceIds : existingAccount.accessProfile?.workspaceIds,
    { limit: ACCESS_WORKSPACES.length },
  );
  const requestedWorkspaces = rawWorkspaces.filter((id) => WORKSPACE_IDS.has(id));
  if (requestedWorkspaces.length !== rawWorkspaces.length) {
    return { valid: false, code: 'WORKSPACE_ASSIGNMENT_INVALID' };
  }
  const workspaceIds = requestedWorkspaces.length ? requestedWorkspaces : roleWorkspaceIds(roleId, committeeIds);
  if (roleId === ROLES.REQUESTER && workspaceIds.length) return { valid: false, code: 'WORKSPACE_ASSIGNMENT_INVALID' };
  const defaultWorkspaceId = String(
    command.defaultWorkspaceId ?? existingAccount.accessProfile?.defaultWorkspaceId ?? workspaceIds[0] ?? '',
  ).trim();
  if (defaultWorkspaceId && !workspaceIds.includes(defaultWorkspaceId)) {
    return { valid: false, code: 'DEFAULT_WORKSPACE_OUT_OF_SCOPE' };
  }

  const referenceSet = (key) => new Set(uniqueStrings(reference[key], { limit: 500 }));
  const normalizeReferences = (key, max) => {
    const values = uniqueStrings(command[key] ?? existingAccount.accessProfile?.[key], { limit: max });
    const allowed = referenceSet(key);
    return values.filter((value) => allowed.has(value));
  };
  const locationScopeIds = normalizeReferences('locationScopeIds', 50);
  const eventSeriesScopeIds = normalizeReferences('eventSeriesScopeIds', 50);
  const eventScopeIds = normalizeReferences('eventScopeIds', 100);
  for (const [key, values] of [
    ['locationScopeIds', locationScopeIds],
    ['eventSeriesScopeIds', eventSeriesScopeIds],
    ['eventScopeIds', eventScopeIds],
  ]) {
    const requested = uniqueStrings(command[key] ?? existingAccount.accessProfile?.[key], { limit: 100 });
    if (requested.length !== values.length) return { valid: false, code: 'GOVERNED_SCOPE_INVALID' };
  }

  const requestedCapabilityGrants = uniqueStrings(
    command.capabilityGrants ?? existingAccount.accessProfile?.capabilityGrants,
  );
  const requestedCapabilityDenies = uniqueStrings(
    command.capabilityDenies ?? existingAccount.accessProfile?.capabilityDenies,
  );
  const capabilityGrants = requestedCapabilityGrants.filter((id) => CAPABILITY_IDS.has(id));
  const capabilityDenies = requestedCapabilityDenies.filter((id) => CAPABILITY_IDS.has(id));
  if (
    capabilityGrants.length !== requestedCapabilityGrants.length ||
    capabilityDenies.length !== requestedCapabilityDenies.length
  ) {
    return { valid: false, code: 'CAPABILITY_OVERRIDE_INVALID' };
  }
  if (new Set([...capabilityGrants, ...capabilityDenies]).size !== capabilityGrants.length + capabilityDenies.length) {
    return { valid: false, code: 'CAPABILITY_OVERRIDE_CONFLICT' };
  }
  if (capabilityGrants.some((id) => SENSITIVE_CAPABILITIES.has(id)) && actorRole !== ROLES.SYSTEM_OWNER) {
    return { valid: false, code: 'OWNER_APPROVAL_REQUIRED' };
  }

  const account = {
    ...existingAccount,
    roleId,
    committeeIds,
    defaultCommitteeId,
    accessProfile: {
      presetId,
      workspaceIds,
      defaultWorkspaceId,
      locationScopeIds,
      eventSeriesScopeIds,
      eventScopeIds,
      capabilityGrants,
      capabilityDenies,
    },
  };
  const capabilities = effectiveCapabilities(account);
  const explicitDenies = capabilityDenies.filter((id) => capabilitiesFor(roleId).includes(id));
  return {
    valid: true,
    account,
    preview: {
      presetId,
      roleId,
      workspaceIds,
      defaultWorkspaceId,
      visibleNavigation: workspaceIds,
      allowedActions: capabilities,
      committeeIds,
      defaultCommitteeId,
      locationScopeIds,
      eventSeriesScopeIds,
      eventScopeIds,
      explicitDenies,
      sensitiveCapabilities: capabilities.filter((id) => SENSITIVE_CAPABILITIES.has(id)),
      conflictWarnings: [],
      sessionImpact: 'ALL_ACTIVE_SESSIONS_REVOKED',
    },
  };
}
