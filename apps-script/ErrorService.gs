function logError_(operation, command, error, correlationId) {
  var user; try { user = resolveCurrentUser_(); } catch (identityError) { user = {}; }
  return withScriptLock_(function() {
    return appendObject_(HAU_SHEETS.ERRORS, {
      Error_ID: allocateId_('ERR'), Created_At: nowIso_(), Severity: error.code ? 'WARNING' : 'ERROR',
      Operation: operation, User_ID: user.User_ID || '', User_Email: user.Email || '',
      Entity_Type: command && command.entityType || '', Entity_ID: command && command.entityId || '',
      Correlation_ID: correlationId, Client_Request_ID: command && (command.clientRequestId || command.idempotencyKey) || '',
      Message: String(error.message || error), Stack_Trace: String(error.stack || '').slice(0, 5000),
      Resolved: false, Resolution_Notes: ''
    });
  });
}
