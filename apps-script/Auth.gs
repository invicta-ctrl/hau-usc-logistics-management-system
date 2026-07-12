var ROLE_PERMISSIONS_ = Object.freeze({
  REQUESTER: [], DOL_STAFF: ['Can_Review','Can_Release','Can_Receive'], COMMITTEE_HEAD: ['Can_Review','Can_Receive'],
  DOL_DIRECTOR: ['Can_Review','Can_Release','Can_Receive','Can_Admin'], ADMIN: ['Can_Review','Can_Release','Can_Receive','Can_Admin'], READ_ONLY_AUDITOR: []
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
function canPermission_(user, flag) { if (!user || String(user.Active).toUpperCase() === 'FALSE') return false; if (String(user.Role) === 'ADMIN') return true; return String(user[flag]).toUpperCase() === 'TRUE' || user[flag] === true || (ROLE_PERMISSIONS_[String(user.Role)] || []).indexOf(flag) >= 0; }
function requirePermission_(flag) { var user = resolveCurrentUser_(); if (!canPermission_(user, flag)) throw appError_('FORBIDDEN', 'You do not have permission to perform this action.', false); return user; }
function api_getCurrentUser() { return guardApi_('getCurrentUser', {}, function() { var u = resolveCurrentUser_(); return { user: { id:u.User_ID, email:u.Email, displayName:u.Display_Name, role:u.Role, committee:u.Committee || '', permissions:{ review:canPermission_(u,'Can_Review'), release:canPermission_(u,'Can_Release'), receive:canPermission_(u,'Can_Receive'), admin:canPermission_(u,'Can_Admin') } } }; }); }
