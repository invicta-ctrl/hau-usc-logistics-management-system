import { ROLES } from '../../domain/constants.js';
import {
  canonicalCommitteeId,
  canonicalRoleId,
  COMMITTEE_REGISTRY,
  COMMITTEES,
} from '../../domain/permissions.js';
import { accountAccessPolicy, effectiveCapabilities } from '../access/policy.js';

export const ACCOUNT_STATUS = Object.freeze({
  STARTER: 'STARTER',
  ACTIVE: 'ACTIVE',
  DISABLED: 'DISABLED',
  REVOKED: 'REVOKED',
});

export const SESSION_KIND = Object.freeze({
  ACTIVATION: 'ACTIVATION',
  AUTHENTICATED: 'AUTHENTICATED',
});

export const EXPERIENCE = Object.freeze({
  ADMINISTRATOR: 'administrator',
  DIRECTOR: 'director',
  FOOD: 'food',
  INVENTORY_PANTRY: 'inventory-pantry',
  MATERIALS: 'materials',
});

const ROLE_LABELS = Object.freeze({
  [ROLES.SYSTEM_OWNER]: 'System Owner',
  [ROLES.ADMINISTRATOR]: 'Administrator',
  [ROLES.DIRECTOR]: 'Director',
  [ROLES.DOL_STAFF]: 'DOL Staff',
  [ROLES.COMMITTEE_HEAD]: 'Committee Head',
  [ROLES.REQUESTER]: 'Requester',
  [ROLES.READ_ONLY_AUDITOR]: 'Read-only Auditor',
});

const COMMITTEE_EXPERIENCES = Object.freeze({
  [COMMITTEES.FOOD]: EXPERIENCE.FOOD,
  [COMMITTEES.INVENTORY_PANTRY]: EXPERIENCE.INVENTORY_PANTRY,
  [COMMITTEES.MATERIALS]: EXPERIENCE.MATERIALS,
});

export function normalizeAccessId(value) {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();
  return /^[A-Z0-9][A-Z0-9._-]{3,63}$/u.test(normalized) ? normalized : '';
}

export function normalizeVerifiedEmail(value) {
  const normalized = String(value ?? '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalized) && normalized.length <= 254
    ? normalized
    : '';
}

export function normalizeCommitteeIds(values) {
  return [...new Set((Array.isArray(values) ? values : []).map(canonicalCommitteeId).filter(Boolean))].slice(
    0,
    3,
  );
}

export function resolveExperience(account) {
  const policy = accountAccessPolicy(account);
  if (policy.defaultWorkspaceId) return policy.defaultWorkspaceId;
  const roleId = canonicalRoleId(account?.roleId);
  if ([ROLES.ADMINISTRATOR, ROLES.SYSTEM_OWNER].includes(roleId)) return EXPERIENCE.ADMINISTRATOR;
  if (roleId === ROLES.DIRECTOR) return EXPERIENCE.DIRECTOR;
  const committeeIds = normalizeCommitteeIds(account?.committeeIds);
  const defaultCommitteeId = canonicalCommitteeId(account?.defaultCommitteeId);
  const resolvedCommitteeId = committeeIds.includes(defaultCommitteeId)
    ? defaultCommitteeId
    : committeeIds[0];
  return COMMITTEE_EXPERIENCES[resolvedCommitteeId] ?? '';
}

export function accountAuthorization(account) {
  const roleId = canonicalRoleId(account?.roleId);
  const committeeIds = normalizeCommitteeIds(account?.committeeIds);
  const policy = accountAccessPolicy(account);
  const scopeMode = [ROLES.DOL_STAFF, ROLES.COMMITTEE_HEAD].includes(roleId)
    ? 'COMMITTEE'
    : roleId === ROLES.REQUESTER
      ? 'SELF'
      : 'ALL';
  const committees = committeeIds.map((id) => {
    const committee = COMMITTEE_REGISTRY.find((entry) => entry.id === id);
    return { id, name: committee?.name ?? id };
  });
  return Object.freeze({
    contract: 'canonical-authorization',
    contractVersion: 2,
    modelVersion: 2,
    roleId,
    roleLabel: ROLE_LABELS[roleId] ?? '',
    scopeMode,
    committeeIds,
    committees,
    capabilities: roleId ? effectiveCapabilities(account) : [],
    workspaceIds: policy.workspaceIds,
    defaultWorkspaceId: policy.defaultWorkspaceId,
    locationScopeIds: policy.locationScopeIds,
    eventSeriesScopeIds: policy.eventSeriesScopeIds,
    eventScopeIds: policy.eventScopeIds,
    explicitDenies: policy.capabilityDenies,
    mappingStatus:
      roleId &&
      (scopeMode !== 'COMMITTEE' || committeeIds.length) &&
      (roleId === ROLES.REQUESTER || roleId === ROLES.READ_ONLY_AUDITOR || policy.workspaceIds.length)
        ? 'MAPPED'
        : 'NEEDS_REVIEW',
    active: account?.status === ACCOUNT_STATUS.ACTIVE,
  });
}

export function validateStarterAssignment({ roleId, committeeIds, defaultCommitteeId } = {}) {
  const canonicalRole = canonicalRoleId(roleId);
  const canonicalCommittees = normalizeCommitteeIds(committeeIds);
  if (
    ![ROLES.ADMINISTRATOR, ROLES.DIRECTOR, ROLES.DOL_STAFF, ROLES.COMMITTEE_HEAD, ROLES.REQUESTER].includes(
      canonicalRole,
    )
  ) {
    return { valid: false, code: 'ROLE_ASSIGNMENT_INVALID' };
  }
  if ([ROLES.DOL_STAFF, ROLES.COMMITTEE_HEAD].includes(canonicalRole) && canonicalCommittees.length === 0) {
    return { valid: false, code: 'COMMITTEE_SCOPE_REQUIRED' };
  }
  const defaultCommittee = canonicalCommitteeId(defaultCommitteeId);
  if (defaultCommittee && !canonicalCommittees.includes(defaultCommittee)) {
    return { valid: false, code: 'DEFAULT_COMMITTEE_OUT_OF_SCOPE' };
  }
  return {
    valid: true,
    roleId: canonicalRole,
    committeeIds: canonicalCommittees,
    defaultCommitteeId: defaultCommittee,
  };
}

export function sessionUserDto(account, session) {
  const authorization = accountAuthorization(account);
  const requesterDepartment =
    authorization.roleId === ROLES.REQUESTER && account.departmentId
      ? Object.freeze({
          id: account.departmentId,
          displayName: account.departmentDisplayName ?? '',
        })
      : null;
  return Object.freeze({
    contract: 'hau-authenticated-session',
    contractVersion: 1,
    accountId: account.id,
    displayName: requesterDepartment?.displayName || account.profile?.fullName || '',
    accountStatus: account.status,
    onboardingComplete: Boolean(account.onboardingCompletedAt),
    authorization,
    lendingEligible: account.lendingEligible === true,
    requesterDepartment,
    experienceId: resolveExperience(account),
    sessionExpiresAt: session.expiresAt,
  });
}

export function validateOnboardingProfile(profile) {
  const value = profile ?? {};
  const fullName = String(value.fullName ?? '')
    .trim()
    .replace(/\s+/gu, ' ');
  const mobileNumber = String(value.mobileNumber ?? '').trim();
  const email = String(value.email ?? '')
    .trim()
    .toLowerCase();
  const fieldErrors = {};
  if (fullName.length < 3 || fullName.length > 120) fieldErrors.fullName = 'Enter your complete name.';
  if (!/^\+?[0-9][0-9 ()-]{7,19}$/u.test(mobileNumber))
    fieldErrors.mobileNumber = 'Enter a valid mobile number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(email) || email.length > 254)
    fieldErrors.email = 'Enter a valid email address.';
  return Object.keys(fieldErrors).length
    ? { valid: false, fieldErrors }
    : { valid: true, profile: { fullName, mobileNumber, email } };
}
