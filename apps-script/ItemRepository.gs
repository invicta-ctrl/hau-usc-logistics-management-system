var HAU_HANDLING_VALUES_ = Object.freeze(['CONSUMABLE','LOANABLE','REUSABLE_ASSET','NON_CIRCULATING']);
var HAU_LENDING_AUDIENCES_ = Object.freeze(['NOT_AVAILABLE_FOR_LENDING','USC_STAFF_ONLY','STUDENTS_AND_STAFF','DOL_INTERNAL_ONLY']);

function normalizeHandling_(value) {
  var token = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  var aliases = { REUSABLE: 'REUSABLE_ASSET', REUSABLEASSET: 'REUSABLE_ASSET', NONCIRCULATING: 'NON_CIRCULATING' };
  token = aliases[token] || token;
  if (HAU_HANDLING_VALUES_.indexOf(token) < 0) throw appError_('INVALID_HANDLING', 'Handling must be CONSUMABLE, LOANABLE, REUSABLE_ASSET, or NON_CIRCULATING.', false, { handling: value });
  return token;
}

function normalizeLendingAudience_(value) {
  var token = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  var aliases = {
    STAFF_ONLY: 'USC_STAFF_ONLY', USC_OFFICERS_AND_STAFF_ONLY: 'USC_STAFF_ONLY',
    STUDENTS_AND_USC_STAFF: 'STUDENTS_AND_STAFF', NOT_AVAILABLE: 'NOT_AVAILABLE_FOR_LENDING'
  };
  token = aliases[token] || token;
  if (HAU_LENDING_AUDIENCES_.indexOf(token) < 0) throw appError_('INVALID_LENDING_AUDIENCE', 'Choose a supported lending audience.', false, { lendingAudience: value });
  return token;
}

function normalizeBorrowerType_(value) {
  var token = String(value || 'ANGELITE').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (['USC_STAFF','USC_OFFICER','STAFF'].indexOf(token) >= 0) return 'USC_STAFF';
  if (['ANGELITE','STUDENT','HAU_STUDENT'].indexOf(token) >= 0) return 'ANGELITE';
  return token;
}

function handlingIsReturnable_(handling) {
  var canonical = normalizeHandling_(handling);
  return canonical === 'LOANABLE' || canonical === 'REUSABLE_ASSET';
}

function defaultLendingAudienceForItem_(item) {
  var status = String(item.Status || 'ACTIVE').toUpperCase();
  var handling;
  try { handling = normalizeHandling_(item.Handling); } catch (error) { return 'NOT_AVAILABLE_FOR_LENDING'; }
  if (status !== 'ACTIVE' || handling === 'NON_CIRCULATING') return 'NOT_AVAILABLE_FOR_LENDING';
  return 'USC_STAFF_ONLY';
}

function effectiveLendingAudience_(item) {
  var value = String(item.Lending_Audience || '').trim();
  return value ? normalizeLendingAudience_(value) : defaultLendingAudienceForItem_(item);
}

function normalizeCatalogType_(value, stockArea) {
  var token = String(value || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
  if (!token) token = String(stockArea || '').toUpperCase() === 'PANTRY' ? 'PANTRY' : 'OFFICE_INVENTORY';
  if (['OFFICE_INVENTORY','PANTRY','EVENT_SPECIFIC'].indexOf(token) < 0) throw appError_('INVALID_CATALOG_TYPE', 'Choose OFFICE_INVENTORY, PANTRY, or EVENT_SPECIFIC.', false);
  return token;
}

function booleanValue_(value, defaultValue) {
  if (value === '' || value == null) return Boolean(defaultValue);
  if (value === true || String(value).toUpperCase() === 'TRUE' || String(value) === '1') return true;
  if (value === false || String(value).toUpperCase() === 'FALSE' || String(value) === '0') return false;
  throw appError_('VALIDATION_ERROR', 'Boolean value is invalid.', false);
}

function optionalPositiveNumber_(value, field) {
  if (value === '' || value == null) return '';
  return positiveNumber_(value, field);
}

function aliasesValue_(value) {
  var values = Array.isArray(value) ? value : String(value || '').split(/[|,]/);
  return values.map(function(alias) { return String(alias).trim(); }).filter(Boolean).filter(function(alias, index, all) { return all.indexOf(alias) === index; }).join('|');
}

function catalogItemDefaults_(item, user) {
  var handling;
  try { handling = normalizeHandling_(item.Handling); } catch (error) { handling = 'NON_CIRCULATING'; }
  var returnable = handling === 'LOANABLE' || handling === 'REUSABLE_ASSET';
  return {
    Catalog_Type: normalizeCatalogType_(item.Catalog_Type, item.Stock_Area),
    Storage_Location: String(item.Storage_Location || '').trim() || 'TO_BE_ASSIGNED',
    Reorder_Threshold: item.Reorder_Threshold === '' || item.Reorder_Threshold == null ? 0 : nonNegativeNumber_(item.Reorder_Threshold, 'Reorder_Threshold'),
    Lending_Audience: String(item.Lending_Audience || '').trim() ? normalizeLendingAudience_(item.Lending_Audience) : defaultLendingAudienceForItem_(item),
    Default_Loan_Days: item.Default_Loan_Days === '' || item.Default_Loan_Days == null ? (returnable ? 3 : '') : positiveNumber_(item.Default_Loan_Days, 'Default_Loan_Days'),
    Maximum_Loan_Qty: item.Maximum_Loan_Qty === '' || item.Maximum_Loan_Qty == null ? (handling === 'NON_CIRCULATING' ? '' : 1) : positiveNumber_(item.Maximum_Loan_Qty, 'Maximum_Loan_Qty'),
    Approval_Required: item.Approval_Required === '' || item.Approval_Required == null ? true : booleanValue_(item.Approval_Required, true),
    Updated_At: item.Updated_At || nowIso_(),
    Updated_By: item.Updated_By || user && user.User_ID || 'SYSTEM',
    Notes: item.Notes || ''
  };
}

function getItemById_(itemId) { return itemById_(itemId); }
function listTransactableItems_() { return readObjects_(HAU_SHEETS.ITEMS).filter(function(item) { return String(item.Status) === 'ACTIVE'; }); }
function listVerificationItems_() { return readObjects_(HAU_SHEETS.ITEMS).filter(function(item) { return String(item.Status) === 'VERIFY'; }); }

function getInventoryItem_(command) {
  var user = resolveCurrentUser_();
  if (!canPermission_(user, 'Can_Review') && !canPermission_(user, 'Can_Manage_Catalog')) throw appError_('FORBIDDEN', 'You do not have permission to view internal inventory details.', false);
  var item = itemById_(requireText_(command.itemId, 'itemId'));
  return { item: itemDto_(item) };
}

function catalogStatus_(value, allowArchived) {
  var status = String(value || 'ACTIVE').trim().toUpperCase();
  var allowed = allowArchived ? ['ACTIVE','VERIFY','INACTIVE','ARCHIVED'] : ['ACTIVE','VERIFY','INACTIVE'];
  if (allowed.indexOf(status) < 0) throw appError_('INVALID_ITEM_STATUS', 'Choose ACTIVE, VERIFY, or INACTIVE. Use the archive action for ARCHIVED.', false);
  return status;
}

function permittedInitialCatalogQuantity_(command, user, item) {
  var requested = nonNegativeNumber_(command.initialQuantity == null ? command.quantity : command.initialQuantity, 'initialQuantity');
  if (!requested) return 0;
  if (!canPermission_(user, 'Can_Receive') && !canPermission_(user, 'Can_Admin')) {
    throw appError_('FORBIDDEN', 'Receiving or administrator permission is required to post initial stock. Create the item with zero quantity, then use the approved receiving workflow.', false);
  }
  assertTransactableItem_(item);
  return requested;
}

function createInventoryItem_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requireCatalogPermission_(), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var handling = normalizeHandling_(command.handling || 'NON_CIRCULATING');
    var status = catalogStatus_(command.status || 'ACTIVE', false);
    var audience = command.lendingAudience ? normalizeLendingAudience_(command.lendingAudience) : (status === 'ACTIVE' && handling !== 'NON_CIRCULATING' ? 'USC_STAFF_ONLY' : 'NOT_AVAILABLE_FOR_LENDING');
    if (status !== 'ACTIVE' || handling === 'NON_CIRCULATING') audience = 'NOT_AVAILABLE_FOR_LENDING';
    var itemId = allocateId_('ITM');
    var timestamp = nowIso_();
    var row = {
      Item_ID: itemId, Item_Name: requireText_(command.name || command.itemName, 'itemName'), Aliases: aliasesValue_(command.aliases),
      Category: requireText_(command.category, 'category'), Stock_Area: requireText_(command.stockArea, 'stockArea'),
      Handling: handling, Unit: requireText_(command.unit, 'unit'), Opening_Qty: 0, Reserved_Qty: '', Available_To_Promise: '', Status: status,
      Legacy_Source_Sheet: '', Legacy_Source_Row: '', Legacy_Source_Block: '', Verification_Note: command.verificationNote || '',
      Catalog_Type: normalizeCatalogType_(command.catalogType, command.stockArea), Storage_Location: command.storageLocation || 'TO_BE_ASSIGNED',
      Reorder_Threshold: nonNegativeNumber_(command.reorderThreshold, 'reorderThreshold'), Lending_Audience: audience,
      Default_Loan_Days: handlingIsReturnable_(handling) ? optionalPositiveNumber_(command.defaultLoanDays == null ? 3 : command.defaultLoanDays, 'defaultLoanDays') : '',
      Maximum_Loan_Qty: handling === 'NON_CIRCULATING' ? '' : optionalPositiveNumber_(command.maximumLoanQuantity == null ? 1 : command.maximumLoanQuantity, 'maximumLoanQuantity'),
      Approval_Required: booleanValue_(command.approvalRequired, true), Updated_At: timestamp, Updated_By: user.User_ID, Notes: command.notes || ''
    };
    var requestedInitialQuantity = nonNegativeNumber_(command.initialQuantity == null ? command.quantity : command.initialQuantity, 'initialQuantity');
    var initialQuantity = permittedInitialCatalogQuantity_(command, user, row);
    appendObject_(HAU_SHEETS.ITEMS, row);
    var transaction = initialQuantity > 0 ? appendLedger_({ type:'OPENING_BALANCE', direction:'IN', itemId:itemId, quantity:initialQuantity, unit:row.Unit, relatedEntityType:'INVENTORY_ITEM', relatedEntityId:itemId, idempotencyKey:key + ':opening', notes:command.reason || command.notes || 'Catalog item creation' }, user) : null;
    history_('INVENTORY_ITEM', itemId, '', status, user, 'Catalog item created', { idempotencyKey:key });
    audit_('CREATE_INVENTORY_ITEM', 'INVENTORY_ITEM', itemId, user, correlationId, { after:row, notes:command.reason || '' });
    return recordIdempotency_(key, { itemId:itemId, status:status, transactionId:transaction && transaction.Transaction_ID, initialQuantityPosted:initialQuantity, initialQuantityIgnored:requestedInitialQuantity > initialQuantity ? requestedInitialQuantity - initialQuantity : 0 }, user, correlationId);
  });
}

function unitDependencySummary_(itemId) {
  var requestLines = findAll_(HAU_SHEETS.REQUEST_LINES, function(row) { return String(row.Item_ID) === String(itemId); });
  var lineIds = requestLines.map(function(row) { return String(row.Request_Line_ID); });
  var releases = findAll_(HAU_SHEETS.RELEASES, function(row) {
    try { return JSON.parse(row.Request_Line_IDs_JSON || '[]').some(function(id) { return lineIds.indexOf(String(id)) >= 0; }); }
    catch (error) { return false; }
  });
  return {
    ledger: ledgerForItem_(itemId).length,
    reservations: findAll_(HAU_SHEETS.RESERVATIONS, function(row) { return String(row.Item_ID) === String(itemId); }).length,
    lendingTickets: findAll_(HAU_SHEETS.LENDING, function(row) { return String(row.Item_ID) === String(itemId); }).length,
    requestLines: requestLines.length,
    restockRecords: findAll_(HAU_SHEETS.RESTOCK, function(row) { return String(row.Item_ID) === String(itemId); }).length,
    releaseRecords: releases.length
  };
}

function assertUnitChangeAllowed_(item, nextUnit) {
  if (String(item.Unit) === String(nextUnit)) return;
  var dependencies = unitDependencySummary_(item.Item_ID);
  var blocked = Object.keys(dependencies).some(function(key) { return dependencies[key] > 0; });
  if (blocked) throw appError_('UNIT_CHANGE_BLOCKED', 'The unit cannot be changed because historical or active records depend on it. Use an explicit administrative correction workflow.', false, dependencies);
}

function updateInventoryItem_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requireCatalogPermission_(), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay:true }, replay);
    var item = itemById_(requireText_(command.itemId, 'itemId'));
    if (String(item.Status) === 'ARCHIVED') throw appError_('ITEM_ARCHIVED', 'Restore this item before editing it.', false);
    var patch = {}, has = function(name) { return Object.prototype.hasOwnProperty.call(command, name); };
    if (String(item.Status) === 'VERIFY' && ((has('status') && String(command.status || '').toUpperCase() !== 'VERIFY') || (has('verificationNote') && String(command.verificationNote || '') !== String(item.Verification_Note || '')))) {
      throw appError_('VERIFY_RESOLUTION_REQUIRED', 'Use the administrator verification-resolution workflow to change a VERIFY item status or verification note.', false, { itemId:item.Item_ID });
    }
    if (has('itemName') || has('name')) patch.Item_Name = requireText_(command.itemName || command.name, 'itemName');
    if (has('aliases')) patch.Aliases = aliasesValue_(command.aliases);
    if (has('category')) patch.Category = requireText_(command.category, 'category');
    if (has('catalogType')) patch.Catalog_Type = normalizeCatalogType_(command.catalogType, command.stockArea || item.Stock_Area);
    if (has('stockArea')) patch.Stock_Area = requireText_(command.stockArea, 'stockArea');
    if (has('storageLocation')) patch.Storage_Location = requireText_(command.storageLocation, 'storageLocation');
    if (has('handling')) patch.Handling = normalizeHandling_(command.handling);
    if (has('unit')) { assertUnitChangeAllowed_(item, requireText_(command.unit, 'unit')); patch.Unit = command.unit; }
    if (has('reorderThreshold')) patch.Reorder_Threshold = nonNegativeNumber_(command.reorderThreshold, 'reorderThreshold');
    if (has('lendingAudience')) patch.Lending_Audience = normalizeLendingAudience_(command.lendingAudience);
    if (has('defaultLoanDays')) patch.Default_Loan_Days = optionalPositiveNumber_(command.defaultLoanDays, 'defaultLoanDays');
    if (has('maximumLoanQuantity')) patch.Maximum_Loan_Qty = optionalPositiveNumber_(command.maximumLoanQuantity, 'maximumLoanQuantity');
    if (has('approvalRequired')) patch.Approval_Required = booleanValue_(command.approvalRequired, true);
    if (has('status')) patch.Status = catalogStatus_(command.status, false);
    if (has('verificationNote')) patch.Verification_Note = String(command.verificationNote || '');
    if (has('notes')) patch.Notes = String(command.notes || '');
    var effectiveStatus = patch.Status || String(item.Status);
    var effectiveHandling = patch.Handling || normalizeHandling_(item.Handling);
    if (effectiveStatus !== 'ACTIVE' || effectiveHandling === 'NON_CIRCULATING') patch.Lending_Audience = 'NOT_AVAILABLE_FOR_LENDING';
    if (!handlingIsReturnable_(effectiveHandling)) patch.Default_Loan_Days = '';
    patch.Updated_At = nowIso_(); patch.Updated_By = user.User_ID;
    updateObject_(HAU_SHEETS.ITEMS, item._row, patch);
    var after = Object.assign({}, item, patch); delete after._row;
    if (patch.Status && patch.Status !== item.Status) history_('INVENTORY_ITEM', item.Item_ID, item.Status, patch.Status, user, command.reason || 'Catalog status updated', { idempotencyKey:key });
    audit_('UPDATE_INVENTORY_ITEM', 'INVENTORY_ITEM', item.Item_ID, user, correlationId, { before:item, after:after, notes:command.reason || '' });
    return recordIdempotency_(key, { itemId:item.Item_ID, status:after.Status }, user, correlationId);
  });
}

function updateInventoryStorageContext_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requireCatalogPermission_(), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay:true }, replay);
    var item = itemById_(requireText_(command.itemId, 'itemId'));
    if (String(item.Status) === 'ARCHIVED') throw appError_('ITEM_ARCHIVED', 'Restore this item before changing its storage context.', false);
    var patch = { Stock_Area:requireText_(command.stockArea, 'stockArea'), Storage_Location:requireText_(command.storageLocation, 'storageLocation'), Updated_At:nowIso_(), Updated_By:user.User_ID };
    updateObject_(HAU_SHEETS.ITEMS, item._row, patch);
    audit_('UPDATE_INVENTORY_STORAGE', 'INVENTORY_ITEM', item.Item_ID, user, correlationId, { before:{ Stock_Area:item.Stock_Area, Storage_Location:item.Storage_Location }, after:patch, notes:command.note || command.reason || '' });
    return recordIdempotency_(key, { itemId:item.Item_ID, stockArea:patch.Stock_Area, storageLocation:patch.Storage_Location }, user, correlationId);
  });
}

function archiveDependencySummary_(itemId) {
  var terminal = ['RETURNED','COMPLETED','REJECTED','CANCELLED'];
  return {
    onHand: onHand_(itemId),
    activeReservations: reservedQuantity_(itemId),
    openLendingTickets: findAll_(HAU_SHEETS.LENDING, function(row) { return String(row.Item_ID) === String(itemId) && terminal.indexOf(String(row.Status)) < 0; }).length,
    activeRequestLines: findAll_(HAU_SHEETS.REQUEST_LINES, function(row) { return String(row.Item_ID) === String(itemId) && ['COMPLETED','REJECTED','CANCELLED'].indexOf(String(row.Status)) < 0; }).length
  };
}

function archiveInventoryItem_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requireCatalogPermission_(), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay:true }, replay);
    var item = itemById_(requireText_(command.itemId, 'itemId'));
    if (String(item.Status) === 'ARCHIVED') throw appError_('INVALID_TRANSITION', 'This item is already archived.', false);
    var dependencies = archiveDependencySummary_(item.Item_ID);
    if (dependencies.onHand !== 0 || dependencies.activeReservations !== 0 || dependencies.openLendingTickets || dependencies.activeRequestLines) {
      throw appError_('ARCHIVE_NOT_ALLOWED', 'Archive is allowed only for zero-balance items with no active reservations, lending tickets, or request/release dependencies.', false, dependencies);
    }
    var patch = { Status:'ARCHIVED', Lending_Audience:'NOT_AVAILABLE_FOR_LENDING', Updated_At:nowIso_(), Updated_By:user.User_ID };
    updateObject_(HAU_SHEETS.ITEMS, item._row, patch);
    history_('INVENTORY_ITEM', item.Item_ID, item.Status, 'ARCHIVED', user, command.reason || 'Item archived', { idempotencyKey:key });
    audit_('ARCHIVE_INVENTORY_ITEM', 'INVENTORY_ITEM', item.Item_ID, user, correlationId, { before:item, after:patch, notes:command.reason || '' });
    return recordIdempotency_(key, { itemId:item.Item_ID, status:'ARCHIVED' }, user, correlationId);
  });
}

function restoreInventoryItem_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requireCatalogPermission_(), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay:true }, replay);
    var item = itemById_(requireText_(command.itemId, 'itemId'));
    if (String(item.Status) !== 'ARCHIVED') throw appError_('INVALID_TRANSITION', 'Only archived items may be restored.', false);
    var next = item.Verification_Note ? 'VERIFY' : catalogStatus_(command.status || 'ACTIVE', false);
    var audience = next === 'ACTIVE' && normalizeHandling_(item.Handling) !== 'NON_CIRCULATING' ? (command.lendingAudience ? normalizeLendingAudience_(command.lendingAudience) : 'USC_STAFF_ONLY') : 'NOT_AVAILABLE_FOR_LENDING';
    var patch = { Status:next, Lending_Audience:audience, Updated_At:nowIso_(), Updated_By:user.User_ID };
    updateObject_(HAU_SHEETS.ITEMS, item._row, patch);
    history_('INVENTORY_ITEM', item.Item_ID, 'ARCHIVED', next, user, command.reason || 'Item restored', { idempotencyKey:key });
    audit_('RESTORE_INVENTORY_ITEM', 'INVENTORY_ITEM', item.Item_ID, user, correlationId, { before:item, after:patch, notes:command.reason || '' });
    return recordIdempotency_(key, { itemId:item.Item_ID, status:next }, user, correlationId);
  });
}

function resolveInventoryVerification_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Admin'), key = requireIdempotency_(command), replay = idempotencyReplay_(key, user);
    if (replay) return Object.assign({ idempotentReplay:true }, replay);
    var item = itemById_(requireText_(command.itemId, 'itemId'));
    if (String(item.Status) !== 'VERIFY') throw appError_('INVALID_TRANSITION', 'Only VERIFY items may use the verification-resolution workflow.', false);
    var decision = String(command.decision || command.status || '').trim().toUpperCase();
    if (['ACTIVE','INACTIVE'].indexOf(decision) < 0) throw appError_('VALIDATION_ERROR', 'Verification decision must be ACTIVE or INACTIVE.', false, { field:'decision' });
    var reason = requireText_(command.reason, 'reason');
    var patch = {
      Status: decision,
      Lending_Audience: decision === 'ACTIVE' && normalizeHandling_(item.Handling) !== 'NON_CIRCULATING' ? 'USC_STAFF_ONLY' : 'NOT_AVAILABLE_FOR_LENDING',
      Updated_At: nowIso_(),
      Updated_By: user.User_ID
    };
    updateObject_(HAU_SHEETS.ITEMS, item._row, patch);
    history_('INVENTORY_ITEM', item.Item_ID, 'VERIFY', decision, user, reason, { idempotencyKey:key, metadata:{ verificationNotePreserved:true } });
    audit_('RESOLVE_INVENTORY_VERIFICATION', 'INVENTORY_ITEM', item.Item_ID, user, correlationId, { before:{ status:item.Status, verificationNote:item.Verification_Note, legacySourceSheet:item.Legacy_Source_Sheet, legacySourceRow:item.Legacy_Source_Row, legacySourceBlock:item.Legacy_Source_Block }, after:patch, notes:reason });
    return recordIdempotency_(key, { itemId:item.Item_ID, status:decision, entityType:'INVENTORY_ITEM', entityId:item.Item_ID }, user, correlationId);
  });
}
