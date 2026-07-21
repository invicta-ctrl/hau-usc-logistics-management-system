function scanLegacyInventoryRows_(values) {
  var blocks = [{ start: 0, label: 'A-C' }, { start: 4, label: 'E-G' }, { start: 8, label: 'I-K' }], rows = [];
  blocks.forEach(function(block) {
    for (var index = 2; index < values.length; index += 1) {
      var name = values[index] && values[index][block.start], quantity = values[index] && values[index][block.start + 1], unit = values[index] && values[index][block.start + 2];
      if (name !== '' && name != null && typeof quantity === 'number') rows.push({ legacySheet: 'MAIN INVENTORY', legacyRow: index + 1, legacyBlock: block.label, legacyItemName: String(name), legacyQty: quantity, legacyUnit: String(unit || '').trim(), verificationStatus: quantity > 40000 && quantity < 60000 ? 'VERIFY' : 'PENDING' });
    }
  });
  return rows;
}

function legacyNameKey_(value) { return String(value || '').trim().toLowerCase().replace(/\s+/g, ' '); }
function scanReferenceNames_(sheetName) {
  var values = sheet_(sheetName).getDataRange().getDisplayValues(), rows = [];
  values.forEach(function(row, rowIndex) {
    row.forEach(function(value, columnIndex) {
      var text = String(value || '').trim();
      if (!text || /^(item|items|qty|quantity|unit|price|total|remarks?|status|date|name)$/i.test(text)) return;
      if (/^[\d.,₱%\-\/]+$/.test(text)) return;
      rows.push({ legacySheet: sheetName, legacyRow: rowIndex + 1, legacyColumn: columnIndex + 1, legacyItemName: text });
    });
  });
  return rows;
}

function migrationDryRun_() {
  var legacy = sheet_('MAIN INVENTORY').getDataRange().getValues(), discovered = scanLegacyInventoryRows_(legacy), master = readObjects_(HAU_SHEETS.ITEMS), mapped = {}, names = {}, unitsByName = {};
  master.forEach(function(item) {
    mapped[[item.Legacy_Source_Sheet, item.Legacy_Source_Row, item.Legacy_Source_Block].join('|')] = item;
    var key = legacyNameKey_(item.Item_Name); (names[key] = names[key] || []).push(item.Item_ID);
    (unitsByName[key] = unitsByName[key] || {})[String(item.Unit || '').toLowerCase()] = true;
  });
  var missing = discovered.filter(function(row) { return !mapped[[row.legacySheet, row.legacyRow, row.legacyBlock].join('|')]; });
  var verify = master.filter(function(item) { return String(item.Status) === 'VERIFY'; });
  var zero = master.filter(function(item) { return Number(item.Opening_Qty) === 0; });
  var duplicateGroups = Object.keys(names).filter(function(key) { return names[key].length > 1; }).map(function(key) { return { name: key, itemIds: names[key] }; });
  var referenceRows = ['FAST MOVING ITEMS', 'FOR SALE ITEMS', 'TO BUY'].reduce(function(all, sheetName) { return all.concat(scanReferenceNames_(sheetName)); }, []);
  var unmappedReferences = referenceRows.filter(function(row) { return !names[legacyNameKey_(row.legacyItemName)]; });
  var conflictingUnits = Object.keys(unitsByName).filter(function(key) { return Object.keys(unitsByName[key]).filter(Boolean).length > 1; }).map(function(key) { return { name: key, units: Object.keys(unitsByName[key]).filter(Boolean), itemIds: names[key] }; });
  return {
    mode: 'DRY_RUN', legacyDiscovered: discovered.length, itemMasterRecords: master.length,
    missingLegacyMappings: missing, verifyItems: verify.map(function(item) { return { itemId: item.Item_ID, name: item.Item_Name, quantity: item.Opening_Qty, note: item.Verification_Note }; }),
    zeroStockCount: zero.length, exactDuplicateGroups: duplicateGroups, conflictingUnits: conflictingUnits,
    referenceRowsScanned: referenceRows.length, unmappedReferenceEntries: unmappedReferences.slice(0, 500),
    countsByCategory: master.reduce(function(counts, item) { var key = String(item.Category || 'UNCLASSIFIED'); counts[key] = (counts[key] || 0) + 1; return counts; }, {}),
    countsByStockArea: master.reduce(function(counts, item) { var key = String(item.Stock_Area || 'UNCLASSIFIED'); counts[key] = (counts[key] || 0) + 1; return counts; }, {}),
    destructiveChanges: 0
  };
}

function runMigrationDryRun() { return guardApi_('runMigrationDryRun', {}, function() { requirePermission_('Can_Admin'); return migrationDryRun_(); }); }

function applyApprovedMigration() {
  return guardApi_('applyApprovedMigration', {}, function(correlationId) {
    return withScriptLock_(function() {
      var user = requirePermission_('Can_Admin'), version = getConfigValue_('MIGRATION_VERSION', false);
      if (version) throw appError_('MIGRATION_ALREADY_FROZEN', 'An applied migration version already exists.', false, { version: version });
      var approved = readObjects_(HAU_SHEETS.MIGRATION).filter(function(row) { return String(row.Migration_Status) === 'APPROVED'; });
      var work = approved.map(function(mapping) { return { mapping:mapping, item:findOne_(HAU_SHEETS.ITEMS, 'Item_ID', mapping.New_Item_ID) }; }).filter(function(entry) { return Boolean(entry.item); });
      if (!work.length) return { migrationVersion:'', appliedCount:0, itemIds:[], reconciliation:migrationDryRun_(), noChanges:true };
      var applied = [];
      work.forEach(function(entry) {
        var mapping = entry.mapping, item = entry.item;
        var patch = { Aliases: mapping.Normalized_Name && mapping.Normalized_Name !== item.Item_Name ? mapping.Normalized_Name : item.Aliases, Status: String(mapping.Verification_Status) === 'VERIFIED' ? 'ACTIVE' : item.Status, Verification_Note: [item.Verification_Note, mapping.Notes].filter(Boolean).join(' | ') };
        updateObject_(HAU_SHEETS.ITEMS, item._row, patch);
        updateObject_(HAU_SHEETS.MIGRATION, mapping._row, { Migration_Status: 'APPLIED', Imported_At: nowIso_(), Imported_By: user.User_ID, Reconciled_At: nowIso_() });
        audit_('APPLY_MIGRATION_MAPPING', 'INVENTORY_ITEM', item.Item_ID, user, correlationId, { before: item, after: patch, notes: 'Non-destructive approved mapping' });
        applied.push(item.Item_ID);
      });
      var dryRun = migrationDryRun_(), migrationVersion = 'MIG-' + Utilities.formatDate(new Date(), HAU_CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss');
      setConfigValue_('MIGRATION_VERSION', migrationVersion, 'ALL', 'Frozen launch migration version', 'VALID', user);
      setConfigValue_('MIGRATION_ITEM_COUNT', String(dryRun.itemMasterRecords), 'ALL', 'Launch item-master count', 'VALID', user);
      setConfigValue_('MIGRATION_VERIFY_COUNT', String(dryRun.verifyItems.length), 'ALL', 'Launch VERIFY count', 'VALID', user);
      audit_('FREEZE_MIGRATION_BASELINE', 'MIGRATION', migrationVersion, user, correlationId, { after: { itemMasterRecords: dryRun.itemMasterRecords, verifyCount: dryRun.verifyItems.length, appliedCount: applied.length } });
      var dataRevision = touchDataRevision_(user);
      return { migrationVersion: migrationVersion, appliedCount: applied.length, itemIds: applied, reconciliation: dryRun, dataRevision:dataRevision };
    });
  });
}

function runReconciliation() { return guardApi_('runReconciliation', {}, function() { requirePermission_('Can_Admin'); return migrationDryRun_(); }); }
