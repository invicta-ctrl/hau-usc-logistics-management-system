function spreadsheetInventory_(spreadsheet) {
  var sheets = spreadsheet.getSheets().map(function(sheet) {
    var lastColumn = sheet.getLastColumn();
    var headers = lastColumn > 0 ? sheet.getRange(1, 1, 1, lastColumn).getDisplayValues()[0] : [];
    return {
      sheet: sheet.getName(),
      headerCount: headers.filter(function(header) { return String(header || '').trim() !== ''; }).length,
      rowCount: Math.max(0, sheet.getLastRow() - (headers.length ? 1 : 0))
    };
  }).sort(function(left, right) { return left.sheet < right.sheet ? -1 : left.sheet > right.sheet ? 1 : 0; });
  return { sheetCount: sheets.length, sheets: sheets };
}

function verifyBackupCopy_(sourceSpreadsheet, backupSpreadsheet) {
  if (String(sourceSpreadsheet.getId()) === String(backupSpreadsheet.getId())) {
    throw appError_('BACKUP_NOT_DISTINCT', 'Backup verification failed because the copy is not a distinct spreadsheet.', false);
  }
  var sourceInventory = spreadsheetInventory_(sourceSpreadsheet);
  var backupInventory = spreadsheetInventory_(backupSpreadsheet);
  if (safeJson_(sourceInventory) !== safeJson_(backupInventory)) {
    throw appError_('BACKUP_VERIFICATION_FAILED', 'Backup verification found a sheet, header, or row-count mismatch.', false, {
      sourceSheetCount: sourceInventory.sheetCount,
      backupSheetCount: backupInventory.sheetCount
    });
  }
  return {
    distinctResource: true,
    matchesSourceInventory: true,
    sheetCount: backupInventory.sheetCount,
    sheets: backupInventory.sheets
  };
}

function openBackupCopyForVerification_(backupFile) {
  try { return SpreadsheetApp.openById(backupFile.getId()); }
  catch (error) {
    throw appError_('BACKUP_VERIFICATION_FAILED', 'The backup copy could not be opened for verification.', true);
  }
}

function createLaunchBackup_(user, correlationId, label) {
  var runtime = resolveRuntimeConfig_();
  var folder = typeof backupFolder_ === 'function' ? backupFolder_() : archiveFolder_();
  var sourceSpreadsheet = getDatabase_();
  var sourceFile = DriveApp.getFileById(runtime.spreadsheetId);
  var name = 'HAU-USC Logistics ' + (label || 'Launch') + ' Backup ' + Utilities.formatDate(new Date(), HAU_CONFIG.TIMEZONE, 'yyyy-MM-dd HHmmss');
  var copy = sourceFile.makeCopy(name, folder);
  var backupSpreadsheet = openBackupCopyForVerification_(copy);
  var verification = verifyBackupCopy_(sourceSpreadsheet, backupSpreadsheet);
  audit_('CREATE_LAUNCH_BACKUP', 'SPREADSHEET', copy.getId(), user, correlationId, {
    notes: name,
    after: { environment: runtime.environment, verification: verification }
  });
  return { environment: runtime.environment, name: name, verification: verification };
}

function createLaunchBackup() {
  return guardApi_('createLaunchBackup', {}, function(correlationId) {
    return withScriptLock_(function() { return createLaunchBackup_(requirePermission_('Can_Admin'), correlationId, 'Launch'); });
  });
}

function scheduledBackup_() {
  return withScriptLock_(function() {
    return createLaunchBackup_({ User_ID: 'SYSTEM', Email: '', Role: 'SYSTEM' }, correlationId_(), 'Scheduled');
  });
}
