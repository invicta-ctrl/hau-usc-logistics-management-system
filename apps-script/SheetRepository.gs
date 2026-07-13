function sheet_(name) {
  var sheet = getDatabase_().getSheetByName(name);
  if (!sheet) throw appError_('SCHEMA_MISSING', 'Required sheet is missing: ' + name, false);
  return sheet;
}

function headers_(name) {
  var sheet = sheet_(name);
  var width = Math.max(1, sheet.getLastColumn());
  return sheet.getRange(1, 1, 1, width).getDisplayValues()[0].map(function(value) {
    return String(value).trim();
  });
}

function schemaHeaderReport_(name, actualHeaders) {
  var expected = HAU_HEADERS[name] || [];
  var actual = (actualHeaders || []).map(function(value) { return String(value || '').trim(); });
  var positions = {};
  var normalizedExpected = {};
  var blankColumns = [];
  expected.forEach(function(header) { normalizedExpected[String(header).toLowerCase()] = header; });
  actual.forEach(function(header, index) {
    if (!header) {
      blankColumns.push(index + 1);
      return;
    }
    (positions[header] = positions[header] || []).push(index + 1);
  });
  var duplicate = Object.keys(positions).filter(function(header) {
    return positions[header].length > 1;
  }).map(function(header) {
    return { header: header, columns: positions[header].slice() };
  });
  var unexpected = [];
  var incompatible = [];
  actual.forEach(function(header, index) {
    if (!header || expected.indexOf(header) >= 0) return;
    unexpected.push({ header: header, column: index + 1 });
    var canonical = normalizedExpected[header.toLowerCase()];
    if (canonical) incompatible.push({ header: header, expected: canonical, column: index + 1 });
  });
  var missing = expected.filter(function(header) { return actual.indexOf(header) < 0; });
  return {
    sheet: name,
    ok: missing.length === 0 && duplicate.length === 0 && unexpected.length === 0 && blankColumns.length === 0,
    compatible: duplicate.length === 0 && incompatible.length === 0 && blankColumns.length === 0,
    missing: missing,
    duplicate: duplicate,
    unexpected: unexpected,
    incompatible: incompatible,
    blankColumns: blankColumns,
    actual: actual
  };
}

function assertSafeHeaders_(name, actualHeaders) {
  var report = schemaHeaderReport_(name, actualHeaders);
  if (!report.compatible) {
    throw appError_('SCHEMA_HEADERS_INCOMPATIBLE', 'Sheet headers are duplicated, blank, or incompatible: ' + name, false, {
      sheet: name,
      duplicate: report.duplicate,
      incompatible: report.incompatible,
      blankColumns: report.blankColumns
    });
  }
  return report;
}

function assertWritableHeaders_(name, actualHeaders) {
  var report = assertSafeHeaders_(name, actualHeaders);
  if (report.missing.length) {
    throw appError_('SCHEMA_HEADERS_INCOMPLETE', 'Sheet setup must add all required headers before records can be written: ' + name, false, {
      sheet: name,
      missing: report.missing
    });
  }
  return report;
}

function readObjects_(name) {
  var sheet = sheet_(name);
  var lastRow = sheet.getLastRow();
  var header = headers_(name);
  assertSafeHeaders_(name, header);
  if (lastRow < 2) return [];
  return sheet.getRange(2, 1, lastRow - 1, header.length).getValues().map(function(values, index) {
    var object = { _row: index + 2 };
    header.forEach(function(key, column) { if (key) object[key] = values[column]; });
    return object;
  }).filter(function(object) {
    return header.some(function(key) { return key && object[key] !== '' && object[key] != null; });
  });
}

function findOne_(name, field, value) {
  return readObjects_(name).find(function(row) { return String(row[field]) === String(value); }) || null;
}

function findAll_(name, predicate) { return readObjects_(name).filter(predicate); }

function neutralizeFormulaLeadingText_(value) {
  if (typeof value !== 'string' || value.charAt(0) === "'") return value;
  return /^[\u0000-\u0020]*[=+\-@]/.test(value) ? "'" + value : value;
}

function neutralizeSheetRows_(rows) {
  return rows.map(function(row) { return row.map(neutralizeFormulaLeadingText_); });
}

function setValuesSafely_(range, rows) { return range.setValues(neutralizeSheetRows_(rows)); }

function objectValues_(name, object) {
  var header = headers_(name);
  assertWritableHeaders_(name, header);
  return header.map(function(key) { return object[key] == null ? '' : object[key]; });
}

function assertLedgerRowsTransactable_(name, objects) {
  if (name !== HAU_SHEETS.LEDGER) return;
  (objects || []).forEach(function(object) {
    if (!object || !object.Item_ID) return;
    var item = findOne_(HAU_SHEETS.ITEMS, 'Item_ID', object.Item_ID);
    if (item && String(item.Status || '').toUpperCase() === 'VERIFY') {
      throw appError_('ITEM_REQUIRES_VERIFICATION', 'This legacy item must be reconciled before it can be transacted.', false, {
        itemId: item.Item_ID
      });
    }
  });
}

function assertGenericUpdateAllowed_(name) {
  if ([HAU_SHEETS.LEDGER, HAU_SHEETS.HISTORY, HAU_SHEETS.AUDIT].indexOf(name) >= 0) {
    throw appError_('APPEND_ONLY_TABLE', 'Posted ledger, audit, and status-history records cannot be edited.', false, { sheet: name });
  }
}

function appendObject_(name, object) {
  assertLedgerRowsTransactable_(name, [object]);
  var sheet = sheet_(name);
  var values = objectValues_(name, object);
  setValuesSafely_(sheet.getRange(sheet.getLastRow() + 1, 1, 1, values.length), [values]);
  return object;
}

function appendObjects_(name, objects) {
  if (!objects.length) return;
  assertLedgerRowsTransactable_(name, objects);
  var sheet = sheet_(name);
  var rows = objects.map(function(object) { return objectValues_(name, object); });
  setValuesSafely_(sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length), rows);
}

function updateObject_(name, rowNumber, patch) {
  assertGenericUpdateAllowed_(name);
  var sheet = sheet_(name);
  var header = headers_(name);
  assertWritableHeaders_(name, header);
  var range = sheet.getRange(rowNumber, 1, 1, header.length);
  var values = range.getValues()[0];
  header.forEach(function(key, index) {
    if (Object.prototype.hasOwnProperty.call(patch, key)) values[index] = patch[key];
  });
  setValuesSafely_(range, [values]);
  return patch;
}

function assertHeaders_(name) { return schemaHeaderReport_(name, headers_(name)); }
