function setupUser_() {
  var email = normalizeEmail_(Session.getActiveUser().getEmail());
  if (!email) throw appError_('SETUP_IDENTITY_REQUIRED', 'Run setup from an institutional Google account.', false);
  var usersSheet = getDatabase_().getSheetByName(HAU_SHEETS.USERS);
  if (!usersSheet || usersSheet.getLastRow() < 2) {
    return { User_ID: 'SETUP_OWNER', Email: email, Role: 'ADMIN', Can_Admin: true, Display_Name: 'Setup owner' };
  }
  var users = readObjects_(HAU_SHEETS.USERS);
  if (!users.length) return { User_ID: 'SETUP_OWNER', Email: email, Role: 'ADMIN', Can_Admin: true, Display_Name: 'Setup owner' };
  return requirePermission_('Can_Admin');
}

function setConfigValue_(key, value, environment, description, status, user) {
  var row = findOne_(HAU_SHEETS.CONFIG, 'Key', key);
  var patch = {
    Key: key,
    Value: value,
    Environment: environment || 'ALL',
    Description: description || '',
    Secret: false,
    Updated_At: nowIso_(),
    Updated_By: user && user.User_ID || 'SYSTEM',
    Validation_Status: status || 'VALID'
  };
  if (row) updateObject_(HAU_SHEETS.CONFIG, row._row, patch);
  else appendObject_(HAU_SHEETS.CONFIG, patch);
  return patch;
}

function validateDatabaseSchema_() {
  var runtime = resolveRuntimeConfig_();
  var db = getDatabase_();
  var available = db.getSheets().map(function(sheet) { return sheet.getName(); });
  var required = Object.keys(HAU_HEADERS);
  var reports = required.map(function(name) {
    return available.indexOf(name) < 0
      ? { sheet: name, ok: false, missingSheet: true, missing: HAU_HEADERS[name] }
      : assertHeaders_(name);
  });
  return {
    environment: runtime.environment,
    spreadsheetId: db.getId(),
    title: db.getName(),
    timeZone: db.getSpreadsheetTimeZone(),
    schemaVersion: HAU_CONFIG.SCHEMA_VERSION,
    legacySheets: HAU_CONFIG.LEGACY_SHEETS.map(function(name) { return { name: name, present: available.indexOf(name) >= 0 }; }),
    sheets: reports,
    ok: reports.every(function(report) { return report.ok; }) && HAU_CONFIG.LEGACY_SHEETS.every(function(name) { return available.indexOf(name) >= 0; })
  };
}

function validateDatabaseSchema() {
  return guardApi_('validateDatabaseSchema', {}, function() {
    setupUser_();
    return validateDatabaseSchema_();
  });
}

function setupDatabase() {
  return guardApi_('setupDatabase', {}, function(correlationId) {
    return withScriptLock_(function() {
      var runtime = resolveRuntimeConfig_();
      var user = setupUser_();
      var db = getDatabase_();
      var created = [];
      var headersAdded = [];
      var defaultsUpdated = [];
      Object.keys(HAU_HEADERS).forEach(function(name) {
        var sheet = db.getSheetByName(name);
        if (!sheet) {
          sheet = db.insertSheet(name);
          created.push(name);
        }
        var actual = headers_(name);
        var missing = HAU_HEADERS[name].filter(function(header) { return actual.indexOf(header) < 0; });
        if (sheet.getLastRow() === 0 || actual.every(function(value) { return !value; })) {
          sheet.getRange(1, 1, 1, HAU_HEADERS[name].length).setValues([HAU_HEADERS[name]]);
          headersAdded.push({ sheet: name, headers: HAU_HEADERS[name] });
        } else if (
          missing.length &&
          [HAU_SHEETS.ITEMS, HAU_SHEETS.USERS, HAU_SHEETS.REQUEST_LINES].indexOf(name) >= 0
        ) {
          sheet.getRange(1, sheet.getLastColumn() + 1, 1, missing.length).setValues([missing]);
          headersAdded.push({ sheet: name, headers: missing });
        }
        sheet.setFrozenRows(1);
        formatBackendSheet_(sheet);
      });
      HAU_CONFIG.DRIVE_KEYS.forEach(function(key) {
        if (!findOne_(HAU_SHEETS.CONFIG, 'Key', key)) {
          setConfigValue_(key, 'TO_BE_ASSIGNED', runtime.environment, 'Managed Google Drive folder ID', 'PENDING', user);
        }
      });
      readObjects_(HAU_SHEETS.ITEMS).forEach(function(item) {
        var defaults = catalogItemDefaults_(item, user);
        var patch = {};
        Object.keys(defaults).forEach(function(field) {
          if ((item[field] === '' || item[field] == null) && defaults[field] !== '') patch[field] = defaults[field];
        });
        if (Object.keys(patch).length) {
          updateObject_(HAU_SHEETS.ITEMS, item._row, patch);
          defaultsUpdated.push(item.Item_ID);
        }
      });
      ensureDataRevisionConfig_(user);
      setConfigValue_('SCHEMA_VERSION', HAU_CONFIG.SCHEMA_VERSION, runtime.environment, 'Backend schema version', 'VALID', user);
      var dataRevision = touchDataRevision_(user);
      audit_('SETUP_DATABASE', 'DATABASE', runtime.spreadsheetId, user, correlationId, {
        after: { environment: runtime.environment, created: created, headersAdded: headersAdded, defaultsUpdated: defaultsUpdated, dataRevision: dataRevision.revision }
      });
      return {
        environment: runtime.environment,
        spreadsheetId: runtime.spreadsheetId,
        createdSheets: created,
        headersAdded: headersAdded,
        defaultsUpdated: defaultsUpdated,
        dataRevision: dataRevision,
        validation: validateDatabaseSchema_()
      };
    });
  });
}

function formatBackendSheet_(sheet) {
  var columns = Math.max(1, sheet.getLastColumn());
  sheet.getRange(1, 1, 1, columns).setBackground('#3A0608').setFontColor('#FFF7E6').setFontWeight('bold').setWrap(true);
  if (!sheet.getFilter()) sheet.getRange(1, 1, Math.max(1, sheet.getLastRow()), columns).createFilter();
  sheet.autoResizeColumns(1, Math.min(columns, 26));
}

function validateDriveConfiguration_() {
  var config = configMap_();
  var results = HAU_CONFIG.DRIVE_KEYS.map(function(key) {
    var value = config[key];
    var status = 'VALID';
    var message = 'Configured';
    if (!value || value === 'TO_BE_ASSIGNED') {
      status = 'MISSING';
      message = 'Folder ID is not assigned.';
    } else {
      try { DriveApp.getFolderById(value).getName(); }
      catch (error) { status = 'INACCESSIBLE'; message = 'Folder cannot be accessed.'; }
    }
    return { key: key, status: status, message: message };
  });
  return { ok: results.every(function(result) { return result.status === 'VALID'; }), folders: results };
}

function validateDriveConfiguration() {
  return guardApi_('validateDriveConfiguration', {}, function() {
    setupUser_();
    return validateDriveConfiguration_();
  });
}

function setupDriveFolders() {
  return guardApi_('setupDriveFolders', {}, function(correlationId) {
    return withScriptLock_(function() {
      var runtime = resolveRuntimeConfig_();
      var user = setupUser_();
      var rootId = getConfigValue_('DRIVE_ROOT_FOLDER_ID', true);
      var root;
      try { root = DriveApp.getFolderById(rootId); }
      catch (error) { throw appError_('DRIVE_FOLDER_INVALID', 'DRIVE_ROOT_FOLDER_ID cannot be accessed.', false); }
      var definitions = {
        DRIVE_RECEIPTS_FOLDER_ID: 'Receipts and Invoices',
        DRIVE_CANVASS_FOLDER_ID: 'Canvass Evidence',
        DRIVE_RELEASE_FOLDER_ID: 'Release Confirmations',
        DRIVE_DELIVERABLE_FOLDER_ID: 'Deliverable Evidence',
        DRIVE_LENDING_FOLDER_ID: 'Lending Evidence',
        DRIVE_ARCHIVE_FOLDER_ID: 'Archive and Recovery'
      };
      var created = [];
      Object.keys(definitions).forEach(function(key) {
        var current = configMap_()[key];
        if (current && current !== 'TO_BE_ASSIGNED') return;
        var folder = root.createFolder(definitions[key]);
        setConfigValue_(key, folder.getId(), runtime.environment, definitions[key], 'VALID', user);
        created.push({ key: key, id: folder.getId(), name: definitions[key] });
      });
      audit_('SETUP_DRIVE_FOLDERS', 'CONFIG', 'DRIVE', user, correlationId, {
        after: { environment: runtime.environment, created: created }
      });
      return { environment: runtime.environment, created: created, validation: validateDriveConfiguration_() };
    });
  });
}

function setupTimeTriggers() {
  return guardApi_('setupTimeTriggers', {}, function() {
    var user = setupUser_();
    var wanted = { updateOverdueLending: { hour: 2 }, scheduledBackup: { hour: 3 } };
    var existing = ScriptApp.getProjectTriggers();
    var created = [];
    Object.keys(wanted).forEach(function(handler) {
      if (existing.some(function(trigger) { return trigger.getHandlerFunction() === handler; })) return;
      ScriptApp.newTrigger(handler).timeBased().everyDays(1).atHour(wanted[handler].hour).create();
      created.push(handler);
    });
    return { created: created, existing: ScriptApp.getProjectTriggers().map(function(trigger) { return trigger.getHandlerFunction(); }), actor: user.User_ID };
  });
}

function seedRolesAndPermissions(users) {
  return guardApi_('seedRolesAndPermissions', { count: (users || []).length }, function(correlationId) {
    return withScriptLock_(function() {
      var actor = setupUser_();
      if (!Array.isArray(users) || !users.length) throw appError_('VALIDATION_ERROR', 'Provide at least one explicit user record.', false);
      var added = [];
      users.forEach(function(input) {
        var email = normalizeEmail_(requireText_(input.email, 'email'));
        if (findAll_(HAU_SHEETS.USERS, function(user) { return normalizeEmail_(user.Email) === email; }).length) return;
        var role = requireText_(input.role, 'role').toUpperCase();
        if (!ROLE_PERMISSIONS_[role]) throw appError_('VALIDATION_ERROR', 'Unknown role: ' + role, false);
        var permissions = ROLE_PERMISSIONS_[role];
        var authorization = typeof authorizationContext_ === 'function' ? authorizationContext_({ Role: role, Committee: input.committee || '' }, { membershipRows: [] }) : null;
        if (authorization && authorizationContractVersion_() >= 2 && authorization.mappingStatus !== 'MAPPED' && authorization.roleId !== 'REQUESTER') throw appError_('AUTHORIZATION_MAPPING_INCOMPLETE', 'The user requires an explicit canonical role and committee mapping.', false, { reason: 'RECONCILIATION_REQUIRED' });
        var row = {
          User_ID: allocateId_('USR', { year: false }), Email: email, Display_Name: input.displayName || email,
          Role: role, Committee: input.committee || '', Active: true,
          Can_Review: permissions.indexOf('Can_Review') >= 0, Can_Release: permissions.indexOf('Can_Release') >= 0,
          Can_Receive: permissions.indexOf('Can_Receive') >= 0, Can_Admin: permissions.indexOf('Can_Admin') >= 0,
          Can_Manage_Catalog: permissions.indexOf('Can_Manage_Catalog') >= 0,
          Role_ID: authorization && authorization.roleId || '',
          Committee_IDs_JSON: authorization ? JSON.stringify(authorization.committeeIds) : '',
          Authorization_Overrides_JSON: '',
          Authorization_Status: authorization && authorization.mappingStatus || '',
          Authorization_Revision: authorization ? 'AUTH-2' : '',
          Created_At: nowIso_(), Updated_At: nowIso_(), Last_Login_At: '', Notes: input.notes || ''
        };
        appendObject_(HAU_SHEETS.USERS, row);
        added.push(row.User_ID);
      });
      if (added.length) audit_('SEED_USERS_ACCESS', 'USERS_ACCESS', 'BATCH', actor, correlationId, { after: { added: added } });
      var dataRevision = added.length ? touchDataRevision_(actor) : null;
      return { added: added, dataRevision:dataRevision };
    });
  });
}

function legacySnapshot_(spreadsheetId) {
  var db = SpreadsheetApp.openById(spreadsheetId);
  var out = {};
  HAU_CONFIG.LEGACY_SHEETS.forEach(function(name) {
    var sheet = db.getSheetByName(name);
    var values = sheet ? sheet.getDataRange().getValues() : [];
    out[name] = {
      rows: values.length,
      nonEmpty: values.reduce(function(count, row) { return count + row.filter(function(value) { return value !== '' && value != null; }).length; }, 0),
      digest: Utilities.base64Encode(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, JSON.stringify(values))).slice(0, 24)
    };
  });
  return out;
}

function healthCheck_(correlationId) {
  var runtime = resolveRuntimeConfig_();
  var schema = validateDatabaseSchema_();
  var drive = validateDriveConfiguration_();
  var operationalLegacy = legacySnapshot_(runtime.spreadsheetId);
  var backupLegacy = legacySnapshot_(runtime.backupSpreadsheetId);
  var legacyMatches = {};
  HAU_CONFIG.LEGACY_SHEETS.forEach(function(name) { legacyMatches[name] = operationalLegacy[name].digest === backupLegacy[name].digest; });
  var items = readObjects_(HAU_SHEETS.ITEMS);
  return {
    appVersion: HAU_CONFIG.APP_VERSION,
    environment: runtime.environment,
    spreadsheetId: runtime.spreadsheetId,
    backupSpreadsheetId: runtime.backupSpreadsheetId,
    schema: schema,
    drive: drive,
    itemMaster: {
      records: items.length,
      verify: items.filter(function(item) { return String(item.Status) === 'VERIFY'; }).length,
      zero: items.filter(function(item) { return Number(item.Opening_Qty) === 0; }).length
    },
    roster: typeof rosterHealth_ === 'function' ? rosterHealth_() : { status: 'UNAVAILABLE' },
    legacyMatchesBackup: legacyMatches,
    correlationId: correlationId
  };
}

function healthCheck() { return api_healthCheck(); }
