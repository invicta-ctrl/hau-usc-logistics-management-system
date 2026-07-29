var HAU_D1_EXPORT_SCHEMA_VERSION_ = 1;
var HAU_D1_EXPORTER_VERSION_ = 'hau-google-d1-export-v1';
var HAU_D1_RESTRICTED_COLUMNS_ = Object.freeze([
  'Requester_Email',
  'Student_ID_Number',
  'Contact',
  'Contact_Name',
  'Contact_Number',
  'Email',
  'Supplier_TIN',
  'Drive_File_ID',
  'Drive_Folder_ID',
  'Drive_URL',
  'Original_File_Name',
  'IP_or_Client',
  'Stack_Trace'
]);
var HAU_D1_MAPPED_TABS_ = Object.freeze([
  HAU_SHEETS.ITEMS,
  HAU_SHEETS.LEDGER,
  HAU_SHEETS.REQUESTS,
  HAU_SHEETS.REQUEST_LINES,
  HAU_SHEETS.RESERVATIONS,
  HAU_SHEETS.LENDING,
  HAU_SHEETS.RELEASES,
  HAU_SHEETS.RESTOCK,
  HAU_SHEETS.DELIVERABLES,
  HAU_SHEETS.CANVASS,
  HAU_SHEETS.SUPPLIERS,
  HAU_SHEETS.EVIDENCE,
  HAU_SHEETS.EVENTS,
  HAU_SHEETS.USERS,
  HAU_SHEETS.HISTORY,
  HAU_SHEETS.AUDIT
]);

function d1SafeLabel_(value, field) {
  var text = String(value || '').trim();
  if (!text || text.length > 120 || /^[A-Za-z0-9_-]{20,}$/.test(text)) {
    throw appError_('D1_EXPORT_INVALID', field + ' must be a safe label, not a private resource ID.', false, { field: field });
  }
  return text;
}

function d1Sha256_(text) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(text), Utilities.Charset.UTF_8)
    .map(function(byte) { return ('0' + ((byte < 0 ? byte + 256 : byte).toString(16))).slice(-2); })
    .join('');
}

function d1CanonicalRows_(rows) {
  return JSON.stringify(rows.map(function(row) {
    return Object.keys(row).sort().map(function(key) { return [key, row[key] == null ? null : row[key]]; });
  }));
}

function d1RedactedRows_(tab) {
  return readObjects_(tab).map(function(source) {
    var row = {};
    Object.keys(source).forEach(function(key) {
      if (key !== '_row' && HAU_D1_RESTRICTED_COLUMNS_.indexOf(key) < 0) row[key] = source[key];
    });
    return row;
  });
}

/**
 * Builds, but does not persist or transmit, a redacted Google Sheets-to-D1 export.
 * The caller must keep the returned JSON outside Git and approved public evidence.
 */
function buildD1MigrationExport_(options) {
  var input = options || {};
  var classification = String(input.dataClassification || '').trim().toUpperCase();
  if (['SYNTHETIC', 'APPROVED_REDACTED'].indexOf(classification) < 0) {
    throw appError_('D1_EXPORT_INVALID', 'The export classification must be SYNTHETIC or APPROVED_REDACTED.', false);
  }
  var selectedTabs = Array.isArray(input.tabs) ? input.tabs.map(String) : [];
  if (!selectedTabs.length || selectedTabs.some(function(tab) { return HAU_D1_MAPPED_TABS_.indexOf(tab) < 0; })) {
    throw appError_('D1_EXPORT_INVALID', 'Every selected tab must have an accepted D1 mapping.', false);
  }
  var tabs = {}, manifest = [];
  selectedTabs.forEach(function(tab) {
    var rows = d1RedactedRows_(tab);
    var hash = d1Sha256_(d1CanonicalRows_(rows));
    tabs[tab] = rows;
    manifest.push({ label: tab, rowCount: rows.length, sha256: hash });
  });
  manifest.sort(function(left, right) { return left.label.localeCompare(right.label); });
  var snapshotHash = d1Sha256_(manifest.map(function(entry) {
    return entry.label + ':' + entry.sha256 + ':' + entry.rowCount;
  }).join('\n'));
  return {
    schemaVersion: HAU_D1_EXPORT_SCHEMA_VERSION_,
    metadata: {
      exporterVersion: HAU_D1_EXPORTER_VERSION_,
      snapshotAt: nowIso_(),
      snapshotHash: snapshotHash,
      sourceWorkbookLabel: d1SafeLabel_(input.sourceWorkbookLabel, 'sourceWorkbookLabel'),
      sourceOwnerLabel: d1SafeLabel_(input.sourceOwnerLabel, 'sourceOwnerLabel'),
      permittedRowsLabel: d1SafeLabel_(input.permittedRowsLabel, 'permittedRowsLabel'),
      candidateSha: String(input.candidateSha || '').trim(),
      dataClassification: classification,
      requiredTabs: selectedTabs.slice(),
      excludedColumns: HAU_D1_RESTRICTED_COLUMNS_.slice(),
      tabs: manifest
    },
    tabs: tabs
  };
}
