var HAU_ROSTER_SOURCE_HEADERS_ = Object.freeze([
  'Institutional_Email', 'Display_Name', 'Active', 'Role_ID', 'Committee_IDs'
]);
var HAU_ROSTER_ACCESS_SOURCE_ = 'PRIVATE_ROSTER';
var HAU_ROSTER_DEFAULT_FRESHNESS_MINUTES_ = 1440;

function rosterProperty_(key) {
  return String(PropertiesService.getScriptProperties().getProperty(key) || '').trim();
}

function rosterBooleanProperty_(key) {
  return rosterProperty_(key).toUpperCase() === 'TRUE';
}

function rosterSourceConfigured_() {
  var value = rosterProperty_(HAU_RUNTIME_PROPERTIES.PRIVATE_ROSTER_SOURCE_ID);
  return Boolean(value && !isPlaceholderRuntimeValue_(value));
}

function rosterSourceIdValid_() {
  var value = rosterProperty_(HAU_RUNTIME_PROPERTIES.PRIVATE_ROSTER_SOURCE_ID);
  return Boolean(value && !isPlaceholderRuntimeValue_(value) && /^[A-Za-z0-9_-]{20,}$/.test(value));
}

function rosterFreshnessMinutes_() {
  var raw = rosterProperty_(HAU_RUNTIME_PROPERTIES.ROSTER_FRESHNESS_MINUTES);
  if (!raw) return HAU_ROSTER_DEFAULT_FRESHNESS_MINUTES_;
  var minutes = Number(raw);
  if (!isFinite(minutes) || minutes < 1 || minutes > 43200 || Math.floor(minutes) !== minutes) {
    throw appError_('ROSTER_CONFIGURATION_INVALID', 'Roster freshness configuration is invalid.', false, { key: HAU_RUNTIME_PROPERTIES.ROSTER_FRESHNESS_MINUTES });
  }
  return minutes;
}

function rosterNowIso_() {
  return typeof nowIso_ === 'function' ? nowIso_() : new Date().toISOString();
}

function rosterUnique_(values) {
  var seen = {}, output = [];
  (values || []).forEach(function(value) {
    var key = String(value || '');
    if (key && !seen[key]) { seen[key] = true; output.push(key); }
  });
  return output;
}

function rosterDigest_(value) {
  var text = JSON.stringify(value == null ? null : value), digest = '';
  try {
    if (typeof Utilities !== 'undefined' && Utilities.computeDigest && Utilities.DigestAlgorithm && Utilities.base64Encode) {
      digest = Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, text)).replace(/[^A-Za-z0-9]/g, '').slice(0, 24);
    }
  } catch (ignored) {}
  if (!digest) {
    var hash = 2166136261;
    for (var index = 0; index < text.length; index += 1) hash = Math.imul(hash ^ text.charCodeAt(index), 16777619);
    digest = (hash >>> 0).toString(16).padStart(8, '0');
  }
  return 'REV-' + digest;
}

function rosterSourceFailureCode_(error) {
  if (error && error.details && error.details.failureCode) return String(error.details.failureCode);
  var code = String(error && error.code || '').toUpperCase();
  if (code.indexOf('TIMEOUT') >= 0) return 'SOURCE_TIMEOUT';
  if (code.indexOf('PARTIAL') >= 0) return 'SOURCE_PARTIAL_READ';
  if (code.indexOf('EMPTY') >= 0) return 'SOURCE_EMPTY';
  if (code.indexOf('SCHEMA') >= 0 || code.indexOf('HEADER') >= 0) return 'SOURCE_SCHEMA_INVALID';
  if (code.indexOf('CONFIG') >= 0 || code.indexOf('SETUP') >= 0) return 'SOURCE_NOT_CONFIGURED';
  return 'SOURCE_UNAVAILABLE';
}

function readRosterSource_() {
  if (typeof HAU_ROSTER_SOURCE_READER_ === 'function') {
    try { return HAU_ROSTER_SOURCE_READER_(); }
    catch (error) { throw appError_('ROSTER_SOURCE_UNAVAILABLE', 'The private roster source could not be read.', true, { failureCode: rosterSourceFailureCode_(error) }); }
  }
  var sourceId = rosterProperty_(HAU_RUNTIME_PROPERTIES.PRIVATE_ROSTER_SOURCE_ID);
  if (!sourceId || isPlaceholderRuntimeValue_(sourceId)) throw appError_('ROSTER_SOURCE_NOT_CONFIGURED', 'The private roster source is not configured.', false, { failureCode: 'SOURCE_NOT_CONFIGURED' });
  if (!rosterSourceIdValid_()) throw appError_('ROSTER_SOURCE_CONFIGURATION_INVALID', 'The private roster source configuration is invalid.', false, { failureCode: 'SOURCE_NOT_CONFIGURED' });
  if (sourceId === rosterProperty_(HAU_RUNTIME_PROPERTIES.SPREADSHEET_ID) || sourceId === rosterProperty_(HAU_RUNTIME_PROPERTIES.BACKUP_SPREADSHEET_ID)) throw appError_('ROSTER_SOURCE_CONFIGURATION_INVALID', 'The private roster source must be separate from operational and backup spreadsheets.', false, { failureCode: 'SOURCE_NOT_CONFIGURED' });
  var source;
  try { source = SpreadsheetApp.openById(sourceId); }
  catch (error) { throw appError_('ROSTER_SOURCE_UNAVAILABLE', 'The private roster source could not be accessed.', true, { failureCode: 'SOURCE_UNAVAILABLE' }); }
  var sheets;
  try { sheets = source.getSheets(); }
  catch (error) { throw appError_('ROSTER_SOURCE_UNAVAILABLE', 'The private roster source could not be inspected.', true, { failureCode: 'SOURCE_PARTIAL_READ' }); }
  if (!sheets || !sheets.length) throw appError_('ROSTER_SOURCE_EMPTY', 'The private roster source is empty.', false, { failureCode: 'SOURCE_EMPTY' });
  var sheet = sheets[0], lastRow, lastColumn;
  try {
    lastRow = sheet.getLastRow();
    lastColumn = sheet.getLastColumn();
    if (lastRow < 1 || lastColumn < 1) throw appError_('ROSTER_SOURCE_EMPTY', 'The private roster source is empty.', false, { failureCode: 'SOURCE_EMPTY' });
    var headers = sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0];
    var rows = lastRow >= 2 ? sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues() : [];
    return { headers: headers, rows: rows };
  } catch (error) {
    if (error && error.code === 'ROSTER_SOURCE_EMPTY') throw error;
    throw appError_('ROSTER_SOURCE_UNAVAILABLE', 'The private roster source could not be read completely.', true, { failureCode: rosterSourceFailureCode_(error) });
  }
}

function rosterRowEmpty_(row) {
  return !row || !row.some(function(value) { return value !== '' && value != null; });
}

function rosterActiveValue_(value) {
  if (value === true || value === false) return { valid: true, active: value };
  if (typeof value === 'string') {
    var token = value.trim().toUpperCase();
    if (token === 'TRUE' || token === 'FALSE') return { valid: true, active: token === 'TRUE' };
  }
  return { valid: false, active: false };
}

function rosterCommitteeValues_(value) {
  if (Array.isArray(value)) return value.slice();
  if (typeof value !== 'string') return null;
  var text = value.trim();
  if (!text) return [];
  try {
    var parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch (ignored) { return null; }
}

function rosterRoleId_(value) {
  return typeof canonicalRoleId_ === 'function' ? canonicalRoleId_(value) : String(value || '').trim().toUpperCase();
}

function rosterCommitteeId_(value) {
  return typeof canonicalCommitteeId_ === 'function' ? canonicalCommitteeId_(value) : String(value || '').trim().toUpperCase();
}

function rosterRoleRequiresScope_(roleId) {
  var role = typeof canonicalRole_ === 'function' ? canonicalRole_(roleId) : null;
  return Boolean(role && role.scopeMode === 'COMMITTEE');
}

function rosterSourceSchemaValid_(headers) {
  if (!Array.isArray(headers) || headers.length !== HAU_ROSTER_SOURCE_HEADERS_.length) return false;
  return HAU_ROSTER_SOURCE_HEADERS_.every(function(header, index) { return String(headers[index] || '').trim() === header; });
}

function validateRosterRows_(source) {
  var headers = source && source.headers || [], rows = source && source.rows || [];
  var report = {
    valid: true,
    sourceRevision: '',
    sourceRowCount: 0,
    activeRowCount: 0,
    inactiveRowCount: 0,
    duplicateIdentityCount: 0,
    unknownRoleCount: 0,
    unknownCommitteeCount: 0,
    invalidTypeCount: 0,
    missingScopeCount: 0,
    conflictCount: 0,
    issues: [],
    rows: []
  };
  if (!rosterSourceSchemaValid_(headers)) {
    report.valid = false;
    report.issues.push('SOURCE_SCHEMA_INVALID');
    return report;
  }
  var nonEmptyRows = rows.filter(function(row) { return !rosterRowEmpty_(row); });
  if (!nonEmptyRows.length) {
    report.valid = false;
    report.issues.push('SOURCE_EMPTY');
    return report;
  }
  var seenEmails = {};
  nonEmptyRows.forEach(function(row) {
    report.sourceRowCount += 1;
    var emailRaw = row && row[0], displayRaw = row && row[1], activeRaw = row && row[2], roleRaw = row && row[3], committeeRaw = row && row[4];
    var email = typeof emailRaw === 'string' ? normalizeEmail_(emailRaw) : '';
    var displayName = typeof displayRaw === 'string' ? displayRaw.trim() : '';
    var active = rosterActiveValue_(activeRaw);
    var roleId = typeof roleRaw === 'string' ? rosterRoleId_(roleRaw) : '';
    var committeeValues = rosterCommitteeValues_(committeeRaw), committeeIds = [];
    var invalid = false;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !displayName || typeof displayRaw !== 'string') invalid = true;
    if (!active.valid || typeof roleRaw !== 'string' || !roleId) invalid = true;
    if (committeeValues === null) invalid = true;
    if (invalid) report.invalidTypeCount += 1;
    if (roleRaw !== '' && typeof roleRaw === 'string' && !roleId) report.unknownRoleCount += 1;
    if (committeeValues !== null && committeeValues !== undefined) {
      committeeValues.forEach(function(value) {
        var committeeId = typeof value === 'string' ? rosterCommitteeId_(value) : '';
        if (!committeeId) report.unknownCommitteeCount += 1;
        else committeeIds.push(committeeId);
      });
    }
    committeeIds = rosterUnique_(committeeIds);
    if (roleId && rosterRoleRequiresScope_(roleId) && !committeeIds.length) report.missingScopeCount += 1;
    if (email && seenEmails[email]) report.duplicateIdentityCount += 1;
    if (email) seenEmails[email] = true;
    if (active.valid && active.active) report.activeRowCount += 1;
    if (active.valid && !active.active) report.inactiveRowCount += 1;
    if (!invalid && roleId && report.unknownRoleCount === 0) {
      report.rows.push({ email: email, displayName: displayName, active: active.active, roleId: roleId, committeeIds: committeeIds });
    }
  });
  if (report.invalidTypeCount) report.issues.push('INVALID_ROW_TYPES');
  if (report.duplicateIdentityCount) report.issues.push('DUPLICATE_IDENTITY');
  if (report.unknownRoleCount) report.issues.push('UNKNOWN_ROLE');
  if (report.unknownCommitteeCount) report.issues.push('UNKNOWN_COMMITTEE');
  if (report.missingScopeCount) report.issues.push('MISSING_COMMITTEE_SCOPE');
  if (report.invalidTypeCount || report.duplicateIdentityCount || report.unknownRoleCount || report.unknownCommitteeCount || report.missingScopeCount || report.rows.length !== report.sourceRowCount) report.valid = false;
  if (report.valid) report.sourceRevision = rosterDigest_(report.rows);
  return report;
}

function rosterSafeReport_(report) {
  return {
    sourceRevision: report.sourceRevision || '',
    sourceRowCount: Number(report.sourceRowCount || 0),
    activeRowCount: Number(report.activeRowCount || 0),
    inactiveRowCount: Number(report.inactiveRowCount || 0),
    duplicateIdentityCount: Number(report.duplicateIdentityCount || 0),
    unknownRoleCount: Number(report.unknownRoleCount || 0),
    unknownCommitteeCount: Number(report.unknownCommitteeCount || 0),
    invalidTypeCount: Number(report.invalidTypeCount || 0),
    missingScopeCount: Number(report.missingScopeCount || 0),
    conflictCount: Number(report.conflictCount || 0),
    issues: rosterUnique_(report.issues || []),
    validationStatus: report.valid ? 'VALID' : 'INVALID'
  };
}

function rosterRunId_() {
  if (typeof allocateId_ === 'function') return allocateId_('RSY', { year: false });
  return 'RSY-' + String(typeof Utilities !== 'undefined' && Utilities.getUuid ? Utilities.getUuid() : new Date().getTime()).replace(/[^A-Za-z0-9-]/g, '').slice(0, 24);
}

function rosterAccessValue_(row, key) {
  return row && Object.prototype.hasOwnProperty.call(row, key) ? row[key] : '';
}

function rosterManagedRow_(row) {
  if (!row) return false;
  return String(row.Access_Source || '').trim().toUpperCase() === HAU_ROSTER_ACCESS_SOURCE_ || row.Roster_Managed === true || String(row.Roster_Managed || '').trim().toUpperCase() === 'TRUE';
}

function rosterFlagForRole_(roleId, flag) {
  var capability = typeof HAU_FLAG_CAPABILITY_MAP_ !== 'undefined' ? HAU_FLAG_CAPABILITY_MAP_[flag] : '';
  var role = typeof HAU_ROLE_REGISTRY_ !== 'undefined' ? HAU_ROLE_REGISTRY_[roleId] : null;
  if (role && capability) return role.capabilities.indexOf(capability) >= 0;
  var legacyRole = roleId === 'DIRECTOR' ? 'DOL_DIRECTOR' : roleId;
  return typeof ROLE_PERMISSIONS_ !== 'undefined' && (ROLE_PERMISSIONS_[legacyRole] || []).indexOf(flag) >= 0;
}

function rosterCommitteeLabel_(ids) {
  return (ids || []).map(function(id) {
    var committee = typeof canonicalCommittee_ === 'function' ? canonicalCommittee_(id) : null;
    return committee ? committee.name : id;
  }).join(', ');
}

function rosterAccessPatch_(entry, runId, sourceRevision, timestamp) {
  return {
    Display_Name: entry.displayName,
    Role: entry.roleId,
    Committee: rosterCommitteeLabel_(entry.committeeIds),
    Active: entry.active,
    Can_Review: rosterFlagForRole_(entry.roleId, 'Can_Review'),
    Can_Release: rosterFlagForRole_(entry.roleId, 'Can_Release'),
    Can_Receive: rosterFlagForRole_(entry.roleId, 'Can_Receive'),
    Can_Admin: rosterFlagForRole_(entry.roleId, 'Can_Admin'),
    Can_Manage_Catalog: rosterFlagForRole_(entry.roleId, 'Can_Manage_Catalog'),
    Role_ID: entry.roleId,
    Committee_IDs_JSON: JSON.stringify(entry.committeeIds),
    Authorization_Status: entry.active ? 'MAPPED' : 'INACTIVE',
    Authorization_Revision: 'ROSTER-' + sourceRevision,
    Access_Source: HAU_ROSTER_ACCESS_SOURCE_,
    Access_Source_Revision: sourceRevision,
    Access_Sync_Run_ID: runId,
    Access_Last_Seen_At: timestamp,
    Roster_Managed: true,
    Updated_At: timestamp
  };
}

function rosterSnapshotRow_(runId, row) {
  var fields = ['User_ID','Email','Display_Name','Role','Committee','Active','Can_Review','Can_Release','Can_Receive','Can_Admin','Created_At','Updated_At','Last_Login_At','Notes','Can_Manage_Catalog','Role_ID','Committee_IDs_JSON','Authorization_Overrides_JSON','Authorization_Status','Authorization_Revision','Access_Source','Access_Source_Revision','Access_Sync_Run_ID','Access_Last_Seen_At','Roster_Managed'];
  var snapshot = { Snapshot_Run_ID: runId };
  fields.forEach(function(field) { snapshot[field] = rosterAccessValue_(row, field); });
  return snapshot;
}

function rosterMembershipSnapshotRow_(runId, row) {
  var fields = ['Membership_ID','User_ID','Committee_ID','Membership_Type','Active','Starts_At','Ends_At','Source','Source_Revision','Created_At','Updated_At','Notes'];
  var snapshot = { Snapshot_Run_ID: runId };
  fields.forEach(function(field) { snapshot[field] = rosterAccessValue_(row, field); });
  return snapshot;
}

function rosterRows_() {
  try { return typeof readObjects_ === 'function' ? readObjects_(HAU_SHEETS.ACCESS_SYNC_RUNS) : []; }
  catch (ignored) { return []; }
}

function rosterLatestGoodRun_() {
  var rows = rosterRows_();
  for (var index = rows.length - 1; index >= 0; index -= 1) if (String(rows[index].Activation_Status) === 'ACTIVATED') return rows[index];
  return null;
}

function rosterRunSummary_(row) {
  if (!row) return null;
  return {
    runId: String(row.Sync_Run_ID || ''),
    sourceRevision: String(row.Source_Revision || ''),
    completedAt: String(row.Completed_At || ''),
    freshnessExpiresAt: String(row.Freshness_Expires_At || ''),
    sourceRowCount: Number(row.Source_Row_Count || 0),
    activeRowCount: Number(row.Active_Row_Count || 0),
    inactiveRowCount: Number(row.Inactive_Row_Count || 0),
    revocationCount: Number(row.Revocation_Count || 0)
  };
}

function rosterHealth_() {
  var lastGood = rosterLatestGoodRun_(), rows = rosterRows_(), latest = rows.length ? rows[rows.length - 1] : null;
  var freshnessMinutes = null, freshnessConfigurationValid = true;
  try { freshnessMinutes = rosterFreshnessMinutes_(); } catch (error) { freshnessConfigurationValid = false; }
  var expiresAt = lastGood && lastGood.Freshness_Expires_At ? new Date(String(lastGood.Freshness_Expires_At)).getTime() : NaN;
  var expired = !lastGood || !lastGood.Freshness_Expires_At || !isFinite(expiresAt) || expiresAt <= new Date().getTime();
  var status = 'FRESH';
  if (!rosterSourceConfigured_()) status = 'NOT_CONFIGURED';
  else if (!rosterSourceIdValid_()) status = 'CONFIGURATION_INVALID';
  else if (!freshnessConfigurationValid) status = 'CONFIGURATION_INVALID';
  else if (rosterBooleanProperty_(HAU_RUNTIME_PROPERTIES.ROSTER_SYNC_DISABLED)) status = 'DISABLED';
  else if (rosterBooleanProperty_(HAU_RUNTIME_PROPERTIES.ROSTER_EMERGENCY_DENY)) status = 'EMERGENCY_DENY';
  else if (!lastGood) status = 'NO_LAST_KNOWN_GOOD';
  else if (expired) status = 'STALE';
  else if (latest && String(latest.Validation_Status) === 'FAILED') status = 'LAST_GOOD_ACTIVE';
  return {
    configured: rosterSourceConfigured_(),
    approved: rosterBooleanProperty_(HAU_RUNTIME_PROPERTIES.ROSTER_SYNC_APPROVED),
    disabled: rosterBooleanProperty_(HAU_RUNTIME_PROPERTIES.ROSTER_SYNC_DISABLED),
    emergencyDeny: rosterBooleanProperty_(HAU_RUNTIME_PROPERTIES.ROSTER_EMERGENCY_DENY),
    freshnessMinutes: freshnessMinutes,
    freshnessConfigurationValid: freshnessConfigurationValid,
    freshnessExpired: expired,
    status: status,
    lastGoodRun: rosterRunSummary_(lastGood),
    lastAttempt: rosterRunSummary_(latest),
    failureCode: latest ? String(latest.Failure_Code || '') : ''
  };
}

function rosterAccessDenied_(row) {
  if (!rosterManagedRow_(row)) return false;
  var health = rosterHealth_();
  return !health.lastGoodRun || health.status === 'NOT_CONFIGURED' || health.status === 'CONFIGURATION_INVALID' || health.status === 'DISABLED' || health.status === 'EMERGENCY_DENY' || health.status === 'STALE' || health.freshnessExpired;
}

function rosterLocalPlan_(sourceRows) {
  var users = typeof readObjects_ === 'function' ? readObjects_(HAU_SHEETS.USERS) : [], memberships = typeof readObjects_ === 'function' ? readObjects_(HAU_SHEETS.USER_COMMITTEE_SCOPE) : [], byEmail = {}, byUserId = {}, duplicateCount = 0, manualConflictCount = 0, manualMembershipConflictCount = 0;
  users.forEach(function(row) {
    var email = normalizeEmail_(row.Email);
    if (!email) return;
    if (!byEmail[email]) byEmail[email] = [];
    byEmail[email].push(row);
    if (row.User_ID) byUserId[String(row.User_ID)] = row;
  });
  Object.keys(byEmail).forEach(function(email) { if (byEmail[email].length > 1) duplicateCount += 1; });
  var sourceByEmail = {}, changedGrantCount = 0, revocationCount = 0, sourceRowsByEmail = {};
  sourceRows.forEach(function(entry) { sourceByEmail[entry.email] = entry; sourceRowsByEmail[entry.email] = true; });
  sourceRows.forEach(function(entry) {
    var matches = byEmail[entry.email] || [];
    if (matches.length === 1) {
      var row = matches[0];
      if (!rosterManagedRow_(row)) manualConflictCount += 1;
      var desired = rosterAccessPatch_(entry, 'PREVIEW', 'PREVIEW', 'PREVIEW');
      if (String(row.Role_ID || row.Role) !== String(desired.Role_ID) || String(row.Committee_IDs_JSON || '') !== String(desired.Committee_IDs_JSON || '') || accessRowActive_(row) !== Boolean(entry.active)) changedGrantCount += 1;
    } else if (!matches.length) changedGrantCount += 1;
  });
  users.forEach(function(row) {
    if (!rosterManagedRow_(row) || !accessRowActive_(row)) return;
    var email = normalizeEmail_(row.Email), entry = sourceByEmail[email];
    if (!entry || !entry.active) revocationCount += 1;
  });
  memberships.forEach(function(row) {
    var owner = byUserId[String(row.User_ID || '')];
    if (!owner || !rosterManagedRow_(owner)) return;
    var source = String(row.Source || '').trim().toUpperCase(), revision = String(row.Source_Revision || '').trim().toUpperCase();
    if (source !== HAU_ROSTER_ACCESS_SOURCE_ && revision.indexOf('ROSTER-') !== 0) manualMembershipConflictCount += 1;
  });
  return { users: users, memberships: memberships, byEmail: byEmail, byUserId: byUserId, duplicateCount: duplicateCount, manualConflictCount: manualConflictCount, manualMembershipConflictCount: manualMembershipConflictCount, changedGrantCount: changedGrantCount, revocationCount: revocationCount };
}

function rosterRecordRun_(runId, startedAt, report, activationStatus, failureCode, actor, previousRunId, freshnessExpiresAt) {
  var completedAt = rosterNowIso_(), row = {
    Sync_Run_ID: runId,
    Started_At: startedAt,
    Completed_At: completedAt,
    Source_Revision: report.sourceRevision || '',
    Source_Row_Count: report.sourceRowCount || 0,
    Active_Row_Count: report.activeRowCount || 0,
    Inactive_Row_Count: report.inactiveRowCount || 0,
    Conflict_Count: report.conflictCount || 0,
    Unknown_Role_Count: report.unknownRoleCount || 0,
    Unknown_Committee_Count: report.unknownCommitteeCount || 0,
    Invalid_Type_Count: report.invalidTypeCount || 0,
    Changed_Grant_Count: report.changedGrantCount || 0,
    Revocation_Count: report.revocationCount || 0,
    Validation_Status: report.validationStatus || (report.valid ? 'VALID' : 'FAILED'),
    Activation_Status: activationStatus || 'NOT_ACTIVATED',
    Freshness_Expires_At: freshnessExpiresAt || '',
    Emergency_Deny_Active: rosterBooleanProperty_(HAU_RUNTIME_PROPERTIES.ROSTER_EMERGENCY_DENY),
    Failure_Code: failureCode || '',
    Activated_At: activationStatus === 'ACTIVATED' ? completedAt : '',
    Activated_By: activationStatus === 'ACTIVATED' && actor ? actor.User_ID || 'SYSTEM' : '',
    Previous_Run_ID: previousRunId || '',
    Notes: ''
  };
  if (typeof appendObject_ === 'function') appendObject_(HAU_SHEETS.ACCESS_SYNC_RUNS, row);
  return row;
}

function rosterFailureReport_(error) {
  return {
    valid: false,
    validationStatus: 'FAILED',
    sourceRevision: '',
    sourceRowCount: 0,
    activeRowCount: 0,
    inactiveRowCount: 0,
    duplicateIdentityCount: 0,
    unknownRoleCount: 0,
    unknownCommitteeCount: 0,
    invalidTypeCount: 0,
    missingScopeCount: 0,
    conflictCount: 0,
    issues: [rosterSourceFailureCode_(error)],
    failureCode: rosterSourceFailureCode_(error),
    rows: []
  };
}

function rosterRequireAdmin_() {
  if (typeof authorizationContractVersion_ === 'function' && authorizationContractVersion_() >= 2 && typeof requireCapability_ === 'function' && typeof HAU_CAPABILITIES_ !== 'undefined') return requireCapability_(HAU_CAPABILITIES_.ACCESS_ADMIN, null, { allowUnresolvedScope: true });
  if (typeof requirePermission_ === 'function') return requirePermission_('Can_Admin');
  return { User_ID: 'SYSTEM', Email: '' };
}

function rosterApprovalRequired_(command, scheduled) {
  var activate = scheduled || Boolean(command && (command.activate === true || String(command.activate || '').toUpperCase() === 'TRUE'));
  if (!activate) return false;
  if (rosterBooleanProperty_(HAU_RUNTIME_PROPERTIES.ROSTER_SYNC_DISABLED)) throw appError_('ROSTER_SYNC_DISABLED', 'Roster synchronization is disabled.', false, { reason: 'DISABLED' });
  if (!rosterBooleanProperty_(HAU_RUNTIME_PROPERTIES.ROSTER_SYNC_APPROVED)) throw appError_('ROSTER_SYNC_NOT_APPROVED', 'Roster synchronization is not approved for activation.', false, { reason: 'APPROVAL_REQUIRED' });
  return true;
}

function rosterApply_(validation, plan, runId, timestamp) {
  var database = getDatabase_(), usersSheet = database.getSheetByName(HAU_SHEETS.USERS), membershipSheet = database.getSheetByName(HAU_SHEETS.USER_COMMITTEE_SCOPE), existing = plan.users, memberships = plan.memberships || [], snapshots = existing.map(function(row) { return rosterSnapshotRow_(runId, row); }), membershipSnapshots = memberships.map(function(row) { return rosterMembershipSnapshotRow_(runId, row); }), appendedRows = [], appendedMembershipRows = [], targetByEmail = {}, targetByUserId = {}, managedUserIds = {};
  existing.forEach(function(row) { if (rosterManagedRow_(row) && row.User_ID) managedUserIds[String(row.User_ID)] = true; });
  if (typeof appendObjects_ === 'function' && snapshots.length) appendObjects_(HAU_SHEETS.ACCESS_SYNC_SNAPSHOT, snapshots);
  if (typeof appendObjects_ === 'function' && membershipSnapshots.length) appendObjects_(HAU_SHEETS.MEMBERSHIP_SYNC_SNAPSHOT, membershipSnapshots);
  try {
    validation.rows.forEach(function(entry) {
      var matches = plan.byEmail[entry.email] || [], patch = rosterAccessPatch_(entry, runId, validation.sourceRevision, timestamp);
      var userId;
      if (matches.length === 1) { userId = matches[0].User_ID; updateObject_(HAU_SHEETS.USERS, matches[0]._row, patch); }
      else if (!matches.length) {
        var row = Object.assign({ User_ID: allocateId_('USR', { year: false }), Email: entry.email, Created_At: timestamp, Last_Login_At: '', Notes: '' }, patch);
        appendObject_(HAU_SHEETS.USERS, row);
        row._row = usersSheet.getLastRow();
        userId = row.User_ID;
        appendedRows.push(row);
      }
      targetByEmail[entry.email] = { entry: entry, userId: userId };
      targetByUserId[String(userId)] = entry;
    });
    existing.forEach(function(row) {
      if (!rosterManagedRow_(row)) return;
      var email = normalizeEmail_(row.Email), source = validation.rows.filter(function(entry) { return entry.email === email; })[0];
      if (!source) updateObject_(HAU_SHEETS.USERS, row._row, { Active: false, Authorization_Status: 'INACTIVE', Access_Sync_Run_ID: runId, Access_Source_Revision: validation.sourceRevision, Access_Last_Seen_At: timestamp, Updated_At: timestamp });
    });
    memberships.forEach(function(row) {
      var userId = String(row.User_ID || ''), entry = targetByUserId[userId];
      if (!entry && !managedUserIds[userId]) return;
      var source = String(row.Source || '').trim().toUpperCase(), revision = String(row.Source_Revision || '').trim().toUpperCase();
      if (source !== HAU_ROSTER_ACCESS_SOURCE_ && revision.indexOf('ROSTER-') !== 0) throw appError_('MANUAL_MEMBERSHIP_CONFLICT', 'A manual membership conflicts with roster activation.', false, { reason: 'MANUAL_MEMBERSHIP_CONFLICT' });
      updateObject_(HAU_SHEETS.USER_COMMITTEE_SCOPE, row._row, { Active: false, Source: HAU_ROSTER_ACCESS_SOURCE_, Source_Revision: validation.sourceRevision, Updated_At: timestamp, Notes: '' });
    });
    validation.rows.forEach(function(entry) {
      var target = targetByEmail[entry.email];
      if (!target || !entry.active) return;
      entry.committeeIds.forEach(function(committeeId) {
        var membership = { Membership_ID: allocateId_('MBS', { year: false }), User_ID: target.userId, Committee_ID: committeeId, Membership_Type: 'ROSTER', Active: true, Starts_At: timestamp, Ends_At: '', Source: HAU_ROSTER_ACCESS_SOURCE_, Source_Revision: validation.sourceRevision, Created_At: timestamp, Updated_At: timestamp, Notes: '' };
        appendObject_(HAU_SHEETS.USER_COMMITTEE_SCOPE, membership);
        membership._row = membershipSheet.getLastRow();
        appendedMembershipRows.push(membership);
      });
    });
  } catch (error) {
    try {
      existing.forEach(function(row) { updateObject_(HAU_SHEETS.USERS, row._row, rosterSnapshotRow_(runId, row)); });
      memberships.forEach(function(row) { updateObject_(HAU_SHEETS.USER_COMMITTEE_SCOPE, row._row, rosterMembershipSnapshotRow_(runId, row)); });
      if (appendedRows.length && usersSheet && typeof usersSheet.deleteRow === 'function') appendedRows.slice().reverse().forEach(function(row) { if (row._row) usersSheet.deleteRow(row._row); });
      if (appendedMembershipRows.length && membershipSheet && typeof membershipSheet.deleteRow === 'function') appendedMembershipRows.slice().reverse().forEach(function(row) { if (row._row) membershipSheet.deleteRow(row._row); });
    } catch (rollbackError) {}
    throw error;
  }
  return { snapshots: snapshots.length, membershipSnapshots: membershipSnapshots.length, appended: appendedRows.length, membershipAppended: appendedMembershipRows.length };
}

function performRosterSync_(command, correlationId, actor, scheduled) {
  var startedAt = rosterNowIso_(), runId = rosterRunId_(), validation, plan, activation = rosterApprovalRequired_(command || {}, scheduled), previous = rosterLatestGoodRun_();
  try {
    validation = validateRosterRows_(readRosterSource_());
  } catch (error) {
    var failure = rosterFailureReport_(error), failedRun = rosterRecordRun_(runId, startedAt, failure, 'FAILED', failure.failureCode, actor, previous && previous.Sync_Run_ID, '');
    return Object.assign({ mode: scheduled ? 'SCHEDULED' : 'EXPLICIT', runId: failedRun.Sync_Run_ID, activationStatus: 'FAILED' }, rosterSafeReport_(failure), { sourceReadStatus: 'FAILED', failureCode: failure.failureCode });
  }
  var safe = rosterSafeReport_(validation);
  if (!validation.valid) {
    var invalidRun = rosterRecordRun_(runId, startedAt, safe, 'FAILED', 'VALIDATION_FAILED', actor, previous && previous.Sync_Run_ID, '');
    return Object.assign({ mode: scheduled ? 'SCHEDULED' : 'EXPLICIT', runId: invalidRun.Sync_Run_ID, activationStatus: 'FAILED' }, safe, { failureCode: 'VALIDATION_FAILED' });
  }
  plan = rosterLocalPlan_(validation.rows);
  validation.conflictCount = plan.duplicateCount + plan.manualConflictCount + plan.manualMembershipConflictCount;
  validation.changedGrantCount = plan.changedGrantCount;
  validation.revocationCount = plan.revocationCount;
  safe = rosterSafeReport_(validation);
  if (plan.duplicateCount || plan.manualConflictCount || plan.manualMembershipConflictCount) {
    safe.issues = rosterUnique_(['LOCAL_ACCESS_CONFLICT']);
    var conflictRun = rosterRecordRun_(runId, startedAt, safe, 'FAILED', 'LOCAL_ACCESS_CONFLICT', actor, previous && previous.Sync_Run_ID, '');
    return Object.assign({ mode: scheduled ? 'SCHEDULED' : 'EXPLICIT', runId: conflictRun.Sync_Run_ID, activationStatus: 'FAILED' }, safe, { failureCode: 'LOCAL_ACCESS_CONFLICT' });
  }
  if (!activation) {
    var previewRun = rosterRecordRun_(runId, startedAt, safe, 'NOT_ACTIVATED', '', actor, previous && previous.Sync_Run_ID, '');
    if (typeof audit_ === 'function') audit_('ROSTER_SYNC_DRY_RUN', 'ACCESS_SYNC', previewRun.Sync_Run_ID, actor || { User_ID: 'SYSTEM' }, correlationId, { after: { sourceRevision: safe.sourceRevision, sourceRowCount: safe.sourceRowCount, conflictCount: safe.conflictCount } });
    return Object.assign({ mode: scheduled ? 'SCHEDULED' : 'EXPLICIT', runId: previewRun.Sync_Run_ID, activationStatus: 'NOT_ACTIVATED' }, safe);
  }
  var timestamp = rosterNowIso_(), freshnessExpiresAt = new Date(new Date(timestamp).getTime() + rosterFreshnessMinutes_() * 60000).toISOString(), applied;
  try {
    applied = rosterApply_(validation, plan, runId, timestamp);
  } catch (error) {
    var activationFailure = rosterFailureReport_(error), failedActivationRun = rosterRecordRun_(runId, startedAt, Object.assign({}, safe, activationFailure, { validationStatus: 'FAILED' }), 'FAILED', 'ACTIVATION_FAILED', actor, previous && previous.Sync_Run_ID, '');
    throw appError_('ROSTER_ACTIVATION_FAILED', 'Roster access activation failed and the prior snapshot was retained where possible.', true, { failureCode: 'ACTIVATION_FAILED', runId: failedActivationRun.Sync_Run_ID });
  }
  var activatedRun = rosterRecordRun_(runId, startedAt, safe, 'ACTIVATED', '', actor, previous && previous.Sync_Run_ID, freshnessExpiresAt);
  if (typeof audit_ === 'function') audit_('ACTIVATE_PRIVATE_ROSTER', 'ACCESS_SYNC', activatedRun.Sync_Run_ID, actor || { User_ID: 'SYSTEM' }, correlationId, { after: { sourceRevision: safe.sourceRevision, sourceRowCount: safe.sourceRowCount, changedGrantCount: safe.changedGrantCount, revocationCount: safe.revocationCount, snapshots: applied.snapshots, appended: applied.appended } });
  return Object.assign({ mode: scheduled ? 'SCHEDULED' : 'EXPLICIT', runId: activatedRun.Sync_Run_ID, activationStatus: 'ACTIVATED', freshnessExpiresAt: freshnessExpiresAt }, safe);
}

function runRosterSync_(command, correlationId, options) {
  options = options || {};
  var actor = options.actor || { User_ID: 'SYSTEM', Email: '' }, scheduled = Boolean(options.scheduled);
  return withScriptLock_(function() { return performRosterSync_(command || {}, correlationId || 'ROSTER-SCHEDULED', actor, scheduled); });
}

function api_runRosterSync(command) {
  return guardMutationApi_('runRosterSync', command || {}, function(correlationId) {
    var actor = rosterRequireAdmin_(), key = requireIdempotency_(command || {}), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var result = runRosterSync_(command || {}, correlationId, { actor: actor, scheduled: false });
    return recordIdempotency_(key, result, actor, correlationId);
  });
}

function api_getRosterSyncHealth() {
  return guardApi_('getRosterSyncHealth', {}, function() { rosterRequireAdmin_(); return { roster: rosterHealth_() }; });
}

function api_setRosterEmergencyDeny(command) {
  return guardMutationApi_('setRosterEmergencyDeny', command || {}, function(correlationId) {
    return withScriptLock_(function() {
      var actor = rosterRequireAdmin_(), key = requireIdempotency_(command || {}), replay = idempotencyReplay_(key);
      if (replay) return Object.assign({ idempotentReplay: true }, replay);
      var disabled = command.disabled === true || String(command.disabled || '').toUpperCase() === 'TRUE';
      if (disabled) requireText_(command.reason, 'reason');
      PropertiesService.getScriptProperties().setProperty(HAU_RUNTIME_PROPERTIES.ROSTER_EMERGENCY_DENY, disabled ? 'TRUE' : 'FALSE');
      var result = { disabled: disabled, reasonRecorded: Boolean(disabled), status: disabled ? 'EMERGENCY_DENY' : 'AVAILABLE' };
      if (typeof audit_ === 'function') audit_('SET_ROSTER_EMERGENCY_DENY', 'ACCESS_SYNC', 'GLOBAL', actor, correlationId, { after: { disabled: disabled, reasonRecorded: Boolean(disabled) } });
      return recordIdempotency_(key, result, actor, correlationId);
    });
  });
}

function setupRosterSyncTrigger(command) {
  return guardMutationApi_('setupRosterSyncTrigger', command || {}, function(correlationId) {
    var actor = rosterRequireAdmin_(), key = requireIdempotency_(command || {}), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    return withScriptLock_(function() {
      var existing = ScriptApp.getProjectTriggers().filter(function(trigger) { return trigger.getHandlerFunction() === 'runScheduledRosterSync'; });
      var result;
      if (existing.length) result = { created: false, existing: existing.length, actor: actor.User_ID };
      else { ScriptApp.newTrigger('runScheduledRosterSync').timeBased().everyHours(1).create(); result = { created: true, existing: 0, actor: actor.User_ID }; }
      return recordIdempotency_(key, result, actor, correlationId);
    });
  });
}

function runScheduledRosterSync() {
  if (rosterBooleanProperty_(HAU_RUNTIME_PROPERTIES.ROSTER_SYNC_DISABLED) || !rosterBooleanProperty_(HAU_RUNTIME_PROPERTIES.ROSTER_SYNC_APPROVED)) return { skipped: true, reason: rosterBooleanProperty_(HAU_RUNTIME_PROPERTIES.ROSTER_SYNC_DISABLED) ? 'DISABLED' : 'APPROVAL_REQUIRED' };
  return runRosterSync_({ activate: true, clientRequestId: 'SCHEDULED-' + String(typeof Utilities !== 'undefined' && Utilities.getUuid ? Utilities.getUuid() : new Date().getTime()) }, 'ROSTER-SCHEDULED', { actor: { User_ID: 'SYSTEM', Email: '' }, scheduled: true });
}
