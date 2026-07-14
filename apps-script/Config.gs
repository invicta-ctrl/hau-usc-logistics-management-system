var HAU_RUNTIME_PROPERTIES = Object.freeze({
  ENVIRONMENT: 'HAU_ENVIRONMENT',
  SPREADSHEET_ID: 'HAU_SPREADSHEET_ID',
  BACKUP_SPREADSHEET_ID: 'HAU_BACKUP_SPREADSHEET_ID',
  BOOTSTRAP_CONTRACT_VERSION: 'HAU_BOOTSTRAP_CONTRACT_VERSION',
  AUTHORIZATION_CONTRACT_VERSION: 'HAU_AUTHORIZATION_CONTRACT_VERSION',
  PRIVATE_ROSTER_SOURCE_ID: 'HAU_PRIVATE_ROSTER_SOURCE_ID',
  ROSTER_FRESHNESS_MINUTES: 'HAU_ROSTER_FRESHNESS_MINUTES',
  ROSTER_SYNC_DISABLED: 'HAU_ROSTER_SYNC_DISABLED',
  ROSTER_SYNC_APPROVED: 'HAU_ROSTER_SYNC_APPROVED',
  ROSTER_EMERGENCY_DENY: 'HAU_ROSTER_EMERGENCY_DENY'
});

var HAU_ALLOWED_ENVIRONMENTS = Object.freeze(['STAGING', 'PRODUCTION']);

var HAU_CONFIG = Object.freeze({
  APP_VERSION: '0.5.0',
  SCHEMA_VERSION: '1.3.0',
  TIMEZONE: 'Asia/Manila',
  LOCK_TIMEOUT_MS: 25000,
  MAX_UPLOAD_BYTES: 10 * 1024 * 1024,
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  LEGACY_SHEETS: ['MAIN INVENTORY', 'FAST MOVING ITEMS', 'FOR SALE ITEMS', 'TO BUY'],
  DRIVE_KEYS: [
    'DRIVE_ROOT_FOLDER_ID',
    'DRIVE_RECEIPTS_FOLDER_ID',
    'DRIVE_CANVASS_FOLDER_ID',
    'DRIVE_RELEASE_FOLDER_ID',
    'DRIVE_DELIVERABLE_FOLDER_ID',
    'DRIVE_LENDING_FOLDER_ID',
    'DRIVE_ARCHIVE_FOLDER_ID'
  ]
});

function isPlaceholderRuntimeValue_(value) {
  return /^(TO_BE_ASSIGNED|REPLACE_WITH.*|YOUR_.*|CHANGE_?ME|<.*>)$/i.test(String(value || '').trim());
}

function requireRuntimeProperty_(properties, key) {
  var value = String(properties.getProperty(key) || '').trim();
  if (!value || isPlaceholderRuntimeValue_(value)) {
    throw appError_('SETUP_REQUIRED', 'Required Apps Script property is missing or unresolved: ' + key, false, { key: key });
  }
  return value;
}

function requireGoogleResourceId_(properties, key) {
  var value = requireRuntimeProperty_(properties, key);
  if (!/^[A-Za-z0-9_-]{20,}$/.test(value)) {
    throw appError_('CONFIGURATION_INVALID', 'Apps Script property must contain a Google resource ID: ' + key, false, { key: key });
  }
  return value;
}

function resolveBootstrapContractVersion_(properties) {
  var raw = String(properties.getProperty(HAU_RUNTIME_PROPERTIES.BOOTSTRAP_CONTRACT_VERSION) || '1').trim();
  var version = raw === '' ? 1 : Number(raw);
  if (![1, 2].includes(version) || Math.floor(version) !== version) {
    throw appError_('CONFIGURATION_INVALID', 'HAU_BOOTSTRAP_CONTRACT_VERSION must be 1 or 2.', false, {
      key: HAU_RUNTIME_PROPERTIES.BOOTSTRAP_CONTRACT_VERSION,
      allowed: [1, 2]
    });
  }
  return version;
}

function resolveAuthorizationContractVersion_(properties) {
  var raw = String(properties.getProperty(HAU_RUNTIME_PROPERTIES.AUTHORIZATION_CONTRACT_VERSION) || '1').trim();
  var version = raw === '' ? 1 : Number(raw);
  if (![1, 2].includes(version) || Math.floor(version) !== version) {
    throw appError_('CONFIGURATION_INVALID', 'HAU_AUTHORIZATION_CONTRACT_VERSION must be 1 or 2.', false, {
      key: HAU_RUNTIME_PROPERTIES.AUTHORIZATION_CONTRACT_VERSION,
      allowed: [1, 2]
    });
  }
  return version;
}

function resolveRuntimeConfig_() {
  var properties = PropertiesService.getScriptProperties();
  var environment = requireRuntimeProperty_(properties, HAU_RUNTIME_PROPERTIES.ENVIRONMENT).toUpperCase();
  if (HAU_ALLOWED_ENVIRONMENTS.indexOf(environment) < 0) {
    throw appError_('CONFIGURATION_INVALID', 'HAU_ENVIRONMENT must be STAGING or PRODUCTION.', false, {
      key: HAU_RUNTIME_PROPERTIES.ENVIRONMENT,
      allowed: HAU_ALLOWED_ENVIRONMENTS.slice()
    });
  }
  var spreadsheetId = requireGoogleResourceId_(properties, HAU_RUNTIME_PROPERTIES.SPREADSHEET_ID);
  var backupSpreadsheetId = requireGoogleResourceId_(properties, HAU_RUNTIME_PROPERTIES.BACKUP_SPREADSHEET_ID);
  if (spreadsheetId === backupSpreadsheetId) {
    throw appError_('CONFIGURATION_INVALID', 'Operational and backup spreadsheet IDs must be different.', false, {
      keys: [HAU_RUNTIME_PROPERTIES.SPREADSHEET_ID, HAU_RUNTIME_PROPERTIES.BACKUP_SPREADSHEET_ID]
    });
  }
  return {
    environment: environment,
    spreadsheetId: spreadsheetId,
    backupSpreadsheetId: backupSpreadsheetId,
    bootstrapContractVersion: resolveBootstrapContractVersion_(properties),
    authorizationContractVersion: resolveAuthorizationContractVersion_(properties)
  };
}

var HAU_SHEETS = Object.freeze({
  README: '00_README', ITEMS: '01_ITEM_MASTER', LEDGER: '02_LEDGER', REQUESTS: '03_REQUESTS',
  REQUEST_LINES: '04_REQUEST_LINES', RESERVATIONS: '05_RESERVATIONS', LENDING: '06_LENDING',
  RELEASES: '07_RELEASES', RESTOCK: '08_RESTOCK', DELIVERABLES: '09_DELIVERABLES',
  CANVASS: '10_CANVASS', SUPPLIERS: '11_SUPPLIERS', EVIDENCE: '12_EVIDENCE', EVENTS: '13_EVENTS',
  USERS: '14_USERS_ACCESS', HISTORY: '15_STATUS_HISTORY', AUDIT: '16_AUDIT_LOG', CONFIG: '17_CONFIG',
  ERRORS: '18_ERROR_LOG', MIGRATION: '19_MIGRATION_MAP', USER_COMMITTEE_SCOPE: '20_USER_COMMITTEE_SCOPE',
  ACCESS_SYNC_RUNS: '21_ACCESS_SYNC_RUNS', ACCESS_SYNC_SNAPSHOT: '22_ACCESS_SYNC_SNAPSHOT', MEMBERSHIP_SYNC_SNAPSHOT: '23_ACCESS_SYNC_MEMBERSHIP_SNAPSHOT'
});

var HAU_HEADERS = Object.freeze({
  '01_ITEM_MASTER': ['Item_ID','Item_Name','Aliases','Category','Stock_Area','Handling','Unit','Opening_Qty','Reserved_Qty','Available_To_Promise','Status','Legacy_Source_Sheet','Legacy_Source_Row','Legacy_Source_Block','Verification_Note','_Helper_Name','_Helper_Qty','_Helper_Unit','_Helper_Row','_Helper_Block','Catalog_Type','Storage_Location','Reorder_Threshold','Lending_Audience','Default_Loan_Days','Maximum_Loan_Qty','Approval_Required','Updated_At','Updated_By','Notes'],
  '02_LEDGER': ['Transaction_ID','Created_At','Type','Direction','Item_ID','Event_Item_ID','Quantity','Unit','Signed_Qty','Related_Entity_Type','Related_Entity_ID','Request_ID','Event_ID','Actor_User_ID','Idempotency_Key','Notes','Reversal_Of','Status'],
  '03_REQUESTS': ['Request_ID','Created_At','Updated_At','Request_Type','Request_Stage','Parent_Request_ID','Additional_Sequence','Event_Series_ID','Event_ID','Catalog_Type','Requester_Name','Requester_Email','Department','Priority','Purpose','Status','Created_By','Client_Request_ID','Archived_At','Notes'],
  '04_REQUEST_LINES': ['Request_Line_ID','Request_ID','Event_ID','Item_ID','Event_Item_ID','Description','Specification','Category','Requested_Qty','Unit','Fulfillment_Source','Split_Group_ID','Needed_At','Return_Due','Lead_Time_Rule','Suggested_Supplier','Released_Qty','Received_Qty','Status','Created_At','Updated_At','Created_By','Client_Line_ID','Notes'],
  '05_RESERVATIONS': ['Reservation_ID','Created_At','Updated_At','Item_ID','Quantity','Unit','Request_Line_ID','Lending_Ticket_ID','Status','Created_By','Cleared_At','Clear_Reason','Idempotency_Key','Notes'],
  '06_LENDING': ['Lending_Ticket_ID','Created_At','Updated_At','Student_ID_Number','Borrower_Name','Borrower_Type','Department_Organization','Contact','Item_ID','Quantity','Unit','Purpose','Due_At','Ticket_Type','Status','Approved_By','Approved_At','Released_By','Released_At','Returned_At','Created_By','Notes'],
  '07_RELEASES': ['Release_ID','Created_At','Request_ID','Event_ID','Lending_Ticket_ID','Recipient_Name','Recipient_Role','Department','Released_By','Released_At','Status','Evidence_ID','Confirmation_Label','Notes','Client_Request_ID','Request_Line_IDs_JSON','Quantities_JSON','Units_JSON','Idempotency_Key','Reversed_By'],
  '08_RESTOCK': ['Restock_ID','Created_At','Updated_At','Source_Request_ID','Source_Request_Line_ID','Item_ID','Quantity','Unit','Supplier_ID','Supplier_Name','Unit_Price','Total_Amount','Invoice_Status','Invoice_Number','Supplier_TIN','Storage_Area','Storage_Location','Evidence_ID','Requested_At','Received_At','Received_By','Status','Idempotency_Key','Notes'],
  '09_DELIVERABLES': ['Deliverable_ID','Created_At','Updated_At','Request_ID','Request_Line_ID','Event_Series_ID','Event_ID','Inventory_Match_ID','Event_Item_ID','Item_Spec','Quantity_Requested','Quantity_Received','Quantity_Released','Unit','Fulfillment_Source','Assigned_Committee','Assigned_Staff','Preferred_Canvass_ID','Budget_Status','Procurement_Status','Receipt_Status','Evidence_ID','Needed_At','Status','Created_By','Notes'],
  '10_CANVASS': ['Canvass_ID','Created_At','Updated_At','Linked_Request_Line_ID','Linked_Deliverable_ID','Linked_Restock_ID','Supplier_ID','Supplier_Name','Location','Item_Spec','Price','Unit','Receipt_Status','Supplier_TIN','Reliability','Checked_At','Source_URL','Evidence_ID','Preferred','Status','Created_By','Price_History_JSON','Idempotency_Key','Notes'],
  '11_SUPPLIERS': ['Supplier_ID','Created_At','Updated_At','Supplier_Name','Normalized_Name','Location','Contact_Name','Contact_Number','Email','Supplier_TIN','Receipt_Capability','Reliability','Active','Created_By','Last_Canvassed_At','Notes','Archive_Reason','Archived_At'],
  '12_EVIDENCE': ['Evidence_ID','Created_At','Evidence_Type','Evidence_Label','Original_File_Name','Normalized_File_Name','Mime_Type','Size_Bytes','SHA256','Drive_File_ID','Drive_Folder_ID','Drive_URL','Related_Entity_Type','Related_Entity_ID','Request_ID','Request_Line_ID','Event_ID','Item_ID','Event_Item_ID','Supplier_ID','Uploaded_By','Upload_Status','Duplicate_Of','Notes'],
  '13_EVENTS': ['Event_ID','Event_Series_ID','Series_Code','Event_Series_Name','Event_Name','Start_At','End_At','Venue','Owner_Committee','Department','Status','Created_At','Updated_At','Created_By','Archived_At','Notes','External_Reference','Active'],
  '14_USERS_ACCESS': ['User_ID','Email','Display_Name','Role','Committee','Active','Can_Review','Can_Release','Can_Receive','Can_Admin','Created_At','Updated_At','Last_Login_At','Notes','Can_Manage_Catalog','Role_ID','Committee_IDs_JSON','Authorization_Overrides_JSON','Authorization_Status','Authorization_Revision','Access_Source','Access_Source_Revision','Access_Sync_Run_ID','Access_Last_Seen_At','Roster_Managed'],
  '15_STATUS_HISTORY': ['History_ID','Entity_Type','Entity_ID','Previous_Status','New_Status','Changed_At','Changed_By','Reason','Request_ID','Event_ID','Idempotency_Key','Metadata_JSON'],
  '16_AUDIT_LOG': ['Audit_ID','Created_At','Action','Entity_Type','Entity_ID','Actor_User_ID','Actor_Email','Request_ID','Event_ID','Before_JSON','After_JSON','IP_or_Client','Correlation_ID','Notes'],
  '17_CONFIG': ['Key','Value','Environment','Description','Secret','Updated_At','Updated_By','Validation_Status'],
  '18_ERROR_LOG': ['Error_ID','Created_At','Severity','Operation','User_ID','User_Email','Entity_Type','Entity_ID','Correlation_ID','Client_Request_ID','Message','Stack_Trace','Resolved','Resolution_Notes'],
  '19_MIGRATION_MAP': ['Migration_ID','Legacy_Sheet','Legacy_Row','Legacy_Block','Legacy_Item_Name','Legacy_Qty','Legacy_Unit','New_Item_ID','Normalized_Name','Migration_Status','Verification_Status','Duplicate_Group','Imported_At','Imported_By','Reconciled_At','Notes'],
  '20_USER_COMMITTEE_SCOPE': ['Membership_ID','User_ID','Committee_ID','Membership_Type','Active','Starts_At','Ends_At','Source','Source_Revision','Created_At','Updated_At','Notes'],
  '21_ACCESS_SYNC_RUNS': ['Sync_Run_ID','Started_At','Completed_At','Source_Revision','Source_Row_Count','Active_Row_Count','Inactive_Row_Count','Conflict_Count','Unknown_Role_Count','Unknown_Committee_Count','Invalid_Type_Count','Changed_Grant_Count','Revocation_Count','Validation_Status','Activation_Status','Freshness_Expires_At','Emergency_Deny_Active','Failure_Code','Activated_At','Activated_By','Previous_Run_ID','Notes'],
  '22_ACCESS_SYNC_SNAPSHOT': ['Snapshot_Run_ID','User_ID','Email','Display_Name','Role','Committee','Active','Can_Review','Can_Release','Can_Receive','Can_Admin','Created_At','Updated_At','Last_Login_At','Notes','Can_Manage_Catalog','Role_ID','Committee_IDs_JSON','Authorization_Overrides_JSON','Authorization_Status','Authorization_Revision','Access_Source','Access_Source_Revision','Access_Sync_Run_ID','Access_Last_Seen_At','Roster_Managed'],
  '23_ACCESS_SYNC_MEMBERSHIP_SNAPSHOT': ['Snapshot_Run_ID','Membership_ID','User_ID','Committee_ID','Membership_Type','Active','Starts_At','Ends_At','Source','Source_Revision','Created_At','Updated_At','Notes']
});

var HAU_DATABASE_CACHE_ = null;
var HAU_DATABASE_CACHE_ID_ = '';
function getDatabase_() {
  var spreadsheetId = resolveRuntimeConfig_().spreadsheetId;
  if (!HAU_DATABASE_CACHE_ || HAU_DATABASE_CACHE_ID_ !== spreadsheetId) {
    HAU_DATABASE_CACHE_ = SpreadsheetApp.openById(spreadsheetId);
    HAU_DATABASE_CACHE_ID_ = spreadsheetId;
  }
  return HAU_DATABASE_CACHE_;
}
function nowIso_() { return Utilities.formatDate(new Date(), HAU_CONFIG.TIMEZONE, "yyyy-MM-dd'T'HH:mm:ssXXX"); }
function configMap_() {
  var rows = readObjects_(HAU_SHEETS.CONFIG), map = {};
  rows.forEach(function(row) { if (row.Key) map[String(row.Key)] = row.Value; });
  return map;
}
function getConfigValue_(key, required) {
  var value = configMap_()[key];
  if (required && (!value || value === 'TO_BE_ASSIGNED')) throw appError_('SETUP_REQUIRED', 'Required configuration is missing: ' + key, false, { key: key });
  return value;
}
