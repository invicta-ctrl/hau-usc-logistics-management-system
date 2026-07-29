function createLaunchBackup_(user, correlationId, label) {
  var runtime = resolveRuntimeConfig_();
  var folder = archiveFolder_();
  var source = DriveApp.getFileById(runtime.spreadsheetId);
  var name = 'HAU-USC Logistics ' + (label || 'Launch') + ' Backup ' + Utilities.formatDate(new Date(), HAU_CONFIG.TIMEZONE, 'yyyy-MM-dd HHmmss');
  var copy = source.makeCopy(name, folder);
  audit_('CREATE_LAUNCH_BACKUP', 'SPREADSHEET', copy.getId(), user, correlationId, {
    notes: name,
    after: { environment: runtime.environment, sourceSpreadsheetId: runtime.spreadsheetId }
  });
  return { environment: runtime.environment, sourceSpreadsheetId: runtime.spreadsheetId, backupFileId: copy.getId(), backupUrl: copy.getUrl(), name: name };
}

function createLaunchBackup() {
  return guardApi_('createLaunchBackup', {}, function(correlationId) {
    return withScriptLock_(function() { return createLaunchBackup_(requirePermission_('Can_Admin'), correlationId, 'Launch'); });
  });
}

function scheduledBackup() {
  return withScriptLock_(function() {
    return createLaunchBackup_({ User_ID: 'SYSTEM', Email: '', Role: 'SYSTEM' }, correlationId_(), 'Scheduled');
  });
}
