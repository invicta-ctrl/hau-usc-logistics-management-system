var ROLE_PERMISSIONS_ = Object.freeze({
  REQUESTER: [], DOL_STAFF: ['Can_Review','Can_Release','Can_Receive'], COMMITTEE_HEAD: ['Can_Review','Can_Receive'],
  DOL_DIRECTOR: ['Can_Review','Can_Release','Can_Receive','Can_Admin','Can_Manage_Catalog'], DIRECTOR: ['Can_Review','Can_Release','Can_Receive'],
  ADMINISTRATOR: ['Can_Admin','Can_Manage_Catalog'], ADMIN: ['Can_Review','Can_Release','Can_Receive','Can_Admin','Can_Manage_Catalog'], READ_ONLY_AUDITOR: []
});

function resolveCurrentUser_() {
  var email = normalizeEmail_(Session.getActiveUser().getEmail());
  if (!email) return { User_ID: 'PUBLIC', Email: '', Display_Name: 'Public requester', Role: 'REQUESTER', Active: true };
  var matches = readObjects_(HAU_SHEETS.USERS).filter(function(row) { return normalizeEmail_(row.Email) === email && accessRowEligible_(row); });
  if (matches.length > 1) throw appError_('AMBIGUOUS_IDENTITY', 'Your institutional account has multiple active access mappings.', false, { reason: 'AMBIGUOUS_IDENTITY' });
  if (!matches.length) throw appError_('UNAUTHORIZED', 'Your institutional account is not authorized for this action.', false);
  return matches[0];
}

function resolveRequesterUser_() {
  var email = normalizeEmail_(Session.getActiveUser().getEmail());
  if (!email) return { User_ID: 'PUBLIC', Email: '', Display_Name: 'Public requester', Role: 'REQUESTER', Active: true };
  var matches = readObjects_(HAU_SHEETS.USERS).filter(function(row) { return normalizeEmail_(row.Email) === email && accessRowEligible_(row); });
  if (matches.length > 1) throw appError_('AMBIGUOUS_IDENTITY', 'Your institutional account has multiple active access mappings.', false, { reason: 'AMBIGUOUS_IDENTITY' });
  return matches[0] || { User_ID: 'PUBLIC', Email: email, Display_Name: 'Institutional requester', Role: 'REQUESTER', Active: true };
}

function isInternalBootstrapUser_(user) {
  if (!user || !user.User_ID || String(user.User_ID) === 'PUBLIC' || !accessRowEligible_(user)) return false;
  var roleId = typeof canonicalRoleId_ === 'function' ? canonicalRoleId_(user.Role_ID || user.Role) : String(user.Role || 'REQUESTER');
  return Boolean(roleId && roleId !== 'REQUESTER');
}

function legacyCanPermission_(user, flag) {
  if (!user || !accessRowActive_(user)) return false;
  if (String(user.Role) === 'ADMIN') return true;
  return String(user[flag]).toUpperCase() === 'TRUE' || user[flag] === true || (ROLE_PERMISSIONS_[String(user.Role)] || []).indexOf(flag) >= 0;
}

function canPermission_(user, flag, resource) {
  if (typeof authorizationContractVersion_ !== 'function' || typeof authorizationCan_ !== 'function' || typeof HAU_FLAG_CAPABILITY_MAP_ === 'undefined' || authorizationContractVersion_() < 2) return legacyCanPermission_(user, flag);
  var capability = HAU_FLAG_CAPABILITY_MAP_[flag];
  return Boolean(capability && authorizationCan_(user, capability, resource, { allowUnresolvedScope: true }));
}

function requirePermission_(flag, resource) {
  var user = resolveCurrentUser_();
  if (typeof authorizationContractVersion_ !== 'function' || typeof authorizationRequire_ !== 'function' || typeof HAU_FLAG_CAPABILITY_MAP_ === 'undefined' || authorizationContractVersion_() < 2) {
    if (!legacyCanPermission_(user, flag)) throw appError_('FORBIDDEN', 'You do not have permission to perform this action.', false);
    return user;
  }
  return authorizationRequire_(user, HAU_FLAG_CAPABILITY_MAP_[flag], resource, { allowUnresolvedScope: true });
}

function requireCapability_(capability, resource, options) {
  if (typeof authorizationRequire_ !== 'function') throw appError_('FORBIDDEN', 'Canonical authorization is not available.', false);
  return authorizationRequire_(resolveCurrentUser_(), capability, resource, options || { allowUnresolvedScope: false });
}

function requireCatalogPermission_() {
  var user = resolveCurrentUser_();
  if (!canPermission_(user, 'Can_Manage_Catalog')) throw appError_('CATALOG_PERMISSION_REQUIRED', 'Catalog management permission is required for this action.', false, { reason: 'CAPABILITY_NOT_GRANTED' });
  return user;
}

function accessRowActive_(row) {
  var value = row && row.Active;
  return value === true || String(value == null ? '' : value).trim().toUpperCase() === 'TRUE';
}

function accessRowEligible_(row) {
  if (!accessRowActive_(row)) return false;
  if (typeof rosterAccessDenied_ === 'function' && typeof rosterManagedRow_ === 'function' && rosterManagedRow_(row)) return !rosterAccessDenied_(row);
  return true;
}

function userPermissionsDto_(user) {
  return {
    review: canPermission_(user, 'Can_Review'),
    release: canPermission_(user, 'Can_Release'),
    receive: canPermission_(user, 'Can_Receive'),
    admin: canPermission_(user, 'Can_Admin'),
    manageCatalog: canPermission_(user, 'Can_Manage_Catalog')
  };
}

function api_getCurrentUser() {
  return guardApi_('getCurrentUser', {}, function() {
    var user = resolveCurrentUser_();
    var role = typeof canonicalRoleId_ === 'function' ? canonicalRoleId_(user.Role_ID || user.Role) || user.Role : user.Role;
    var authorization = typeof authorizationDto_ === 'function' ? authorizationDto_(user) : null;
    var dto = { id: user.User_ID, email: user.Email, displayName: user.Display_Name, role: role, committee: authorization && authorization.committees[0] ? authorization.committees[0].name : user.Committee || '', permissions: userPermissionsDto_(user) };
    if (authorization) dto.authorization = authorization;
    return { user: dto };
  });
}
