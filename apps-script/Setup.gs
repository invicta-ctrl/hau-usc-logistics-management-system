var HAU_DATA_VALIDATION_LISTS_ = Object.freeze({
  '01_ITEM_MASTER': {
    Handling: ['CONSUMABLE','LOANABLE','REUSABLE_ASSET','NON_CIRCULATING'],
    Status: ['ACTIVE','VERIFY','INACTIVE','ARCHIVED'],
    Catalog_Type: ['OFFICE_INVENTORY','PANTRY','EVENT_SPECIFIC'],
    Lending_Audience: ['NOT_AVAILABLE_FOR_LENDING','USC_STAFF_ONLY','STUDENTS_AND_STAFF','DOL_INTERNAL_ONLY'],
    Approval_Required: ['TRUE','FALSE']
  },
  '02_LEDGER': { Direction: ['IN','OUT'], Status: ['POSTED'] },
  '03_REQUESTS': { Status: ['FOR_REVIEW','ACCEPTED','REJECTED','CANCELLED','PARTIALLY_FULFILLED','COMPLETED'] },
  '05_RESERVATIONS': { Status: ['ACTIVE','CLEARED','CANCELLED'] },
  '06_LENDING': { Borrower_Type: ['ANGELITE','USC_STAFF'], Status: ['FOR_REVIEW','READY_TO_CLAIM','ON_LOAN','OVERDUE','RETURNED','COMPLETED','REJECTED','CANCELLED'] },
  '14_USERS_ACCESS': {
    Role: ['REQUESTER','DOL_STAFF','COMMITTEE_HEAD','DOL_DIRECTOR','ADMIN','READ_ONLY_AUDITOR'],
    Active: ['TRUE','FALSE'], Can_Review: ['TRUE','FALSE'], Can_Release: ['TRUE','FALSE'],
    Can_Receive: ['TRUE','FALSE'], Can_Admin: ['TRUE','FALSE'], Can_Manage_Catalog: ['TRUE','FALSE']
  },
  '20_CONTENT': { Status: ['DRAFT','PUBLISHED','SUPERSEDED','ARCHIVED'] },
  '21_BRANDING': { Status: ['DRAFT','ACTIVE','SUPERSEDED','ARCHIVED'], Active: ['TRUE','FALSE'] },
  '22_COMMAND_JOURNAL': { Status: ['STARTED','COMPLETED','FAILED'], Recovery_Status: ['NOT_REQUIRED','PENDING','RECOVERED','MANUAL_REVIEW'] }
});

function sheetHeaderValues_(sheet) {
  var width = Math.max(1, sheet.getLastColumn());
  return sheet.getRange(1, 1, 1, width).getDisplayValues()[0].map(function(value) { return String(value || '').trim(); });
}

function sheetHasSchemaContent_(sheet, actual) {
  if (sheet.getLastRow() < 1) return false;
  if (sheet.getLastRow() > 1) return true;
  return actual.some(function(value) { return Boolean(value); });
}

function repairKnownSheetSchemas_(db) {
  var names = Object.keys(HAU_HEADERS);
  var unsafe = [];
  names.forEach(function(name) {
    var sheet = db.getSheetByName(name);
    if (!sheet) return;
    var actual = sheetHeaderValues_(sheet);
    if (!sheetHasSchemaContent_(sheet, actual)) return;
    var report = schemaHeaderReport_(name, actual);
    if (!report.compatible) {
      unsafe.push({ sheet: name, duplicate: report.duplicate, incompatible: report.incompatible, blankColumns: report.blankColumns });
    }
  });
  if (unsafe.length) {
    throw appError_('SCHEMA_HEADERS_INCOMPATIBLE', 'Setup stopped because one or more known sheets have duplicated, blank, or incompatible headers.', false, {
      sheets: unsafe
    });
  }

  var created = [];
  var headersAdded = [];
  names.forEach(function(name) {
    var sheet = db.getSheetByName(name);
    if (!sheet) {
      sheet = db.insertSheet(name);
      created.push(name);
    }
    var actual = sheetHeaderValues_(sheet);
    if (!sheetHasSchemaContent_(sheet, actual)) {
      setValuesSafely_(sheet.getRange(1, 1, 1, HAU_HEADERS[name].length), [HAU_HEADERS[name]]);
      headersAdded.push({ sheet: name, headers: HAU_HEADERS[name].slice() });
      return;
    }
    var report = schemaHeaderReport_(name, actual);
    if (!report.missing.length) return;
    setValuesSafely_(sheet.getRange(1, sheet.getLastColumn() + 1, 1, report.missing.length), [report.missing]);
    headersAdded.push({ sheet: name, headers: report.missing.slice() });
  });
  return { created: created, headersAdded: headersAdded };
}

function systemManagedHeader_(sheetName, header) {
  if ([HAU_SHEETS.LEDGER, HAU_SHEETS.HISTORY, HAU_SHEETS.AUDIT, HAU_SHEETS.COMMAND_JOURNAL].indexOf(sheetName) >= 0) return true;
  if (/(_ID|_At|_By)$/.test(header)) return true;
  return [
    'Opening_Qty','Reserved_Qty','Available_To_Promise','_Helper_Name','_Helper_Qty','_Helper_Unit','_Helper_Row','_Helper_Block',
    'Signed_Qty','SHA256','Payload_SHA256','Revision_Number','Version_Number','Result_JSON','Error_Code','Error_Message'
  ].indexOf(header) >= 0;
}

function contiguousColumnSpans_(columns) {
  var sorted = columns.slice().sort(function(left, right) { return left - right; });
  var spans = [];
  sorted.forEach(function(column) {
    var current = spans[spans.length - 1];
    if (!current || column > current.end + 1) spans.push({ start: column, end: column });
    else current.end = column;
  });
  return spans;
}

function applyDataValidations_(sheet, name) {
  var definitions = HAU_DATA_VALIDATION_LISTS_[name] || {};
  var headers = sheetHeaderValues_(sheet);
  var rowCount = Math.max(1, sheet.getMaxRows() - 1);
  var applied = [];
  Object.keys(definitions).forEach(function(header) {
    var index = headers.indexOf(header);
    if (index < 0) return;
    var values = definitions[header];
    var rule = SpreadsheetApp.newDataValidation()
      .requireValueInList(values, true)
      .setAllowInvalid(true)
      .setHelpText('Use an approved value. Invalid entries are retained but require review.')
      .build();
    sheet.getRange(2, index + 1, rowCount, 1).setDataValidation(rule);
    applied.push({ header: header, column: index + 1 });
  });
  return applied;
}

function ensureSystemColumnWarnings_(sheet, name) {
  var headers = sheetHeaderValues_(sheet);
  var protectedColumns = [];
  headers.forEach(function(header, index) { if (systemManagedHeader_(name, header)) protectedColumns.push(index + 1); });
  var existing = sheet.getProtections(SpreadsheetApp.ProtectionType.RANGE);
  var rowCount = Math.max(1, sheet.getMaxRows() - 1);
  var added = [];
  contiguousColumnSpans_(protectedColumns).forEach(function(span) {
    var range = sheet.getRange(2, span.start, rowCount, span.end - span.start + 1);
    var notation = range.getA1Notation();
    var description = 'HAU system-managed columns | ' + name + ' | ' + notation;
    var present = existing.some(function(protection) {
      var protectedRange;
      try { protectedRange = protection.getRange(); } catch (error) { protectedRange = null; }
      return protection.getDescription() === description || (protectedRange && protectedRange.getA1Notation() === notation);
    });
    if (present) return;
    var protection = range.protect();
    protection.setDescription(description);
    protection.setWarningOnly(true);
    existing.push(protection);
    added.push({ range: notation, description: description });
  });
  return added;
}

function configureKnownSheet_(sheet, name) {
  return {
    sheet: name,
    validations: applyDataValidations_(sheet, name),
    protectionsAdded: ensureSystemColumnWarnings_(sheet, name)
  };
}

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
      ? {
          sheet: name, ok: false, compatible: false, missingSheet: true, missing: HAU_HEADERS[name].slice(),
          duplicate: [], unexpected: [], incompatible: [], blankColumns: [], actual: []
        }
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
      var defaultsUpdated = [];
      var schemaChanges = repairKnownSheetSchemas_(db);
      var sheetControls = [];
      Object.keys(HAU_HEADERS).forEach(function(name) {
        var sheet = db.getSheetByName(name);
        sheet.setFrozenRows(1);
        formatBackendSheet_(sheet);
        sheetControls.push(configureKnownSheet_(sheet, name));
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
        after: { environment: runtime.environment, created: schemaChanges.created, headersAdded: schemaChanges.headersAdded, defaultsUpdated: defaultsUpdated, dataRevision: dataRevision.revision }
      });
      return {
        environment: runtime.environment,
        spreadsheetId: runtime.spreadsheetId,
        createdSheets: schemaChanges.created,
        headersAdded: schemaChanges.headersAdded,
        defaultsUpdated: defaultsUpdated,
        sheetControls: sheetControls,
        dataRevision: dataRevision,
        validation: validateDatabaseSchema_()
      };
    });
  });
}

function stagingDemoSeedStatus_() {
  var runtime = resolveRuntimeConfig_();
  if (runtime.environment !== 'STAGING') {
    throw appError_('STAGING_ONLY_OPERATION', 'Demo seeding is available only in an explicitly configured STAGING environment.', false, {
      environment: runtime.environment
    });
  }
  return {
    environment: 'STAGING',
    status: 'BLOCKED',
    code: 'DEMO_FIXTURE_NOT_APPROVED',
    message: 'No institutionally approved, non-personal demo fixture is committed. No demo rows were written.'
  };
}

function seedStagingDemoData() {
  return guardApi_('seedStagingDemoData', {}, function() {
    requirePermission_('Can_Admin');
    var status = stagingDemoSeedStatus_();
    throw appError_('DEMO_SEEDING_BLOCKED', status.message, false, {
      environment: status.environment,
      status: status.status,
      reason: status.code
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
        var row = {
          User_ID: allocateId_('USR', { year: false }), Email: email, Display_Name: input.displayName || email,
          Role: role, Committee: input.committee || '', Active: true,
          Can_Review: permissions.indexOf('Can_Review') >= 0, Can_Release: permissions.indexOf('Can_Release') >= 0,
          Can_Receive: permissions.indexOf('Can_Receive') >= 0, Can_Admin: permissions.indexOf('Can_Admin') >= 0,
          Can_Manage_Catalog: permissions.indexOf('Can_Manage_Catalog') >= 0,
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
    legacyMatchesBackup: legacyMatches,
    correlationId: correlationId
  };
}

function healthCheck() { return api_healthCheck(); }
