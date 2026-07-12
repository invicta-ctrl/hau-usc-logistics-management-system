var HAU_CONFIG = Object.freeze({
  APP_VERSION: '0.4.0',
  SCHEMA_VERSION: '1.0.0',
  SPREADSHEET_ID: '1D28OX2dTx0rfus4hDd9VcyDZtxo26CFLGFk22URFAjw',
  BACKUP_SPREADSHEET_ID: '17nyUqDACyc4ZpWL_mZ1S-QAmIGECKtbXFci9rWtqTBg',
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

var HAU_SHEETS = Object.freeze({
  README: '00_README', ITEMS: '01_ITEM_MASTER', LEDGER: '02_LEDGER', REQUESTS: '03_REQUESTS',
  REQUEST_LINES: '04_REQUEST_LINES', RESERVATIONS: '05_RESERVATIONS', LENDING: '06_LENDING',
  RELEASES: '07_RELEASES', RESTOCK: '08_RESTOCK', DELIVERABLES: '09_DELIVERABLES',
  CANVASS: '10_CANVASS', SUPPLIERS: '11_SUPPLIERS', EVIDENCE: '12_EVIDENCE', EVENTS: '13_EVENTS',
  USERS: '14_USERS_ACCESS', HISTORY: '15_STATUS_HISTORY', AUDIT: '16_AUDIT_LOG', CONFIG: '17_CONFIG',
  ERRORS: '18_ERROR_LOG', MIGRATION: '19_MIGRATION_MAP'
});

var HAU_HEADERS = Object.freeze({
  '01_ITEM_MASTER': ['Item_ID','Item_Name','Aliases','Category','Stock_Area','Handling','Unit','Opening_Qty','Reserved_Qty','Available_To_Promise','Status','Legacy_Source_Sheet','Legacy_Source_Row','Legacy_Source_Block','Verification_Note','_Helper_Name','_Helper_Qty','_Helper_Unit','_Helper_Row','_Helper_Block'],
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
  '14_USERS_ACCESS': ['User_ID','Email','Display_Name','Role','Committee','Active','Can_Review','Can_Release','Can_Receive','Can_Admin','Created_At','Updated_At','Last_Login_At','Notes'],
  '15_STATUS_HISTORY': ['History_ID','Entity_Type','Entity_ID','Previous_Status','New_Status','Changed_At','Changed_By','Reason','Request_ID','Event_ID','Idempotency_Key','Metadata_JSON'],
  '16_AUDIT_LOG': ['Audit_ID','Created_At','Action','Entity_Type','Entity_ID','Actor_User_ID','Actor_Email','Request_ID','Event_ID','Before_JSON','After_JSON','IP_or_Client','Correlation_ID','Notes'],
  '17_CONFIG': ['Key','Value','Environment','Description','Secret','Updated_At','Updated_By','Validation_Status'],
  '18_ERROR_LOG': ['Error_ID','Created_At','Severity','Operation','User_ID','User_Email','Entity_Type','Entity_ID','Correlation_ID','Client_Request_ID','Message','Stack_Trace','Resolved','Resolution_Notes'],
  '19_MIGRATION_MAP': ['Migration_ID','Legacy_Sheet','Legacy_Row','Legacy_Block','Legacy_Item_Name','Legacy_Qty','Legacy_Unit','New_Item_ID','Normalized_Name','Migration_Status','Verification_Status','Duplicate_Group','Imported_At','Imported_By','Reconciled_At','Notes']
});

function getDatabase_() { return SpreadsheetApp.openById(HAU_CONFIG.SPREADSHEET_ID); }
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

