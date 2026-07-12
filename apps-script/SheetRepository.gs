function sheet_(name) { var s = getDatabase_().getSheetByName(name); if (!s) throw appError_('SCHEMA_MISSING', 'Required sheet is missing: ' + name, false); return s; }
function headers_(name) { var s = sheet_(name), width = Math.max(1, s.getLastColumn()); return s.getRange(1, 1, 1, width).getDisplayValues()[0].map(function(v) { return String(v).trim(); }); }
function readObjects_(name) {
  var s = sheet_(name), lastRow = s.getLastRow(), h = headers_(name); if (lastRow < 2) return [];
  return s.getRange(2, 1, lastRow - 1, h.length).getValues().map(function(values, index) { var o = { _row: index + 2 }; h.forEach(function(key, i) { if (key) o[key] = values[i]; }); return o; }).filter(function(o) { return h.some(function(key) { return key && o[key] !== '' && o[key] != null; }); });
}
function findOne_(name, field, value) { return readObjects_(name).find(function(row) { return String(row[field]) === String(value); }) || null; }
function findAll_(name, predicate) { return readObjects_(name).filter(predicate); }
function objectValues_(name, object) { return headers_(name).map(function(key) { return object[key] == null ? '' : object[key]; }); }
function appendObject_(name, object) { var s = sheet_(name), values = objectValues_(name, object); s.getRange(s.getLastRow() + 1, 1, 1, values.length).setValues([values]); return object; }
function appendObjects_(name, objects) { if (!objects.length) return; var s = sheet_(name), rows = objects.map(function(o) { return objectValues_(name, o); }); s.getRange(s.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows); }
function updateObject_(name, rowNumber, patch) { var s = sheet_(name), h = headers_(name), range = s.getRange(rowNumber, 1, 1, h.length), values = range.getValues()[0]; h.forEach(function(key, i) { if (Object.prototype.hasOwnProperty.call(patch, key)) values[i] = patch[key]; }); range.setValues([values]); return patch; }
function assertHeaders_(name) { var actual = headers_(name), expected = HAU_HEADERS[name] || []; var missing = expected.filter(function(key) { return actual.indexOf(key) < 0; }); return { sheet: name, ok: missing.length === 0, missing: missing, actual: actual }; }

