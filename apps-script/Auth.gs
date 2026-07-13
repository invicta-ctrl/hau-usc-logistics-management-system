var ROLE_PERMISSIONS_ = Object.freeze({
  REQUESTER: [], DOL_STAFF: ['Can_Review','Can_Release','Can_Receive'], COMMITTEE_HEAD: ['Can_Review','Can_Receive'],
  DOL_DIRECTOR: ['Can_Review','Can_Release','Can_Receive','Can_Admin','Can_Manage_Catalog'], ADMIN: ['Can_Review','Can_Release','Can_Receive','Can_Admin','Can_Manage_Catalog'], READ_ONLY_AUDITOR: []
});
function resolveCurrentUser_() {
  var email = normalizeEmail_(Session.getActiveUser().getEmail());
  if (!email) return { User_ID: 'PUBLIC', Email: '', Display_Name: 'Public requester', Role: 'REQUESTER', Active: true };
  var user = readObjects_(HAU_SHEETS.USERS).find(function(row) { return normalizeEmail_(row.Email) === email && String(row.Active).toUpperCase() !== 'FALSE'; });
  if (!user) throw appError_('UNAUTHORIZED', 'Your institutional account is not authorized for this action.', false);
  return user;
}
function resolveRequesterUser_() {
  var email = normalizeEmail_(Session.getActiveUser().getEmail());
  if (!email) return { User_ID: 'PUBLIC', Email: '', Display_Name: 'Public requester', Role: 'REQUESTER', Active: true };
  var user = readObjects_(HAU_SHEETS.USERS).find(function(row) { return normalizeEmail_(row.Email) === email && String(row.Active).toUpperCase() !== 'FALSE'; });
  return user || { User_ID: 'PUBLIC', Email: email, Display_Name: 'Institutional requester', Role: 'REQUESTER', Active: true };
}
function isInternalBootstrapUser_(user) { return Boolean(user && user.User_ID && String(user.User_ID) !== 'PUBLIC' && String(user.Role || 'REQUESTER') !== 'REQUESTER' && String(user.Active).toUpperCase() !== 'FALSE'); }
function canPermission_(user, flag) { if (!user || String(user.Active).toUpperCase() === 'FALSE') return false; if (String(user.Role) === 'ADMIN') return true; return String(user[flag]).toUpperCase() === 'TRUE' || user[flag] === true || (ROLE_PERMISSIONS_[String(user.Role)] || []).indexOf(flag) >= 0; }
function requirePermission_(flag) { var user = resolveCurrentUser_(); if (!canPermission_(user, flag)) throw appError_('FORBIDDEN', 'You do not have permission to perform this action.', false); return user; }
function requireCatalogPermission_() { var user = resolveCurrentUser_(); if (!canPermission_(user, 'Can_Manage_Catalog')) throw appError_('CATALOG_PERMISSION_REQUIRED', 'Catalog management permission is required for this action.', false); return user; }
function userPermissionsDto_(user) { return { review:canPermission_(user,'Can_Review'), release:canPermission_(user,'Can_Release'), receive:canPermission_(user,'Can_Receive'), admin:canPermission_(user,'Can_Admin'), manageCatalog:canPermission_(user,'Can_Manage_Catalog') }; }
function api_getCurrentUser() { return guardApi_('getCurrentUser', {}, function() { var u = resolveCurrentUser_(); return { user: { id:u.User_ID, email:u.Email, displayName:u.Display_Name, role:u.Role, committee:u.Committee || '', permissions:userPermissionsDto_(u) } }; }); }
