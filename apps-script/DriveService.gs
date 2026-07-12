var EVIDENCE_FOLDER_KEYS_ = Object.freeze({
  RESTOCK_RECEIPT:'DRIVE_RECEIPTS_FOLDER_ID', RESTOCK_INVOICE:'DRIVE_RECEIPTS_FOLDER_ID',
  CANVASS_QUOTE:'DRIVE_CANVASS_FOLDER_ID', CANVASS_PHOTO:'DRIVE_CANVASS_FOLDER_ID',
  DELIVERABLE_RECEIPT:'DRIVE_DELIVERABLE_FOLDER_ID', DELIVERABLE_DELIVERY_PROOF:'DRIVE_DELIVERABLE_FOLDER_ID',
  RELEASE_CONFIRMATION_PHOTO:'DRIVE_RELEASE_FOLDER_ID', LENDING_HANDOFF_PHOTO:'DRIVE_LENDING_FOLDER_ID',
  LENDING_RETURN_PHOTO:'DRIVE_LENDING_FOLDER_ID', OTHER_SUPPORTING_DOCUMENT:'DRIVE_ROOT_FOLDER_ID'
});
function folderForEvidence_(evidenceType) { var key=EVIDENCE_FOLDER_KEYS_[evidenceType];if(!key)throw appError_('UNSUPPORTED_EVIDENCE_TYPE','Unsupported evidence type.',false,{evidenceType:evidenceType});var id=getConfigValue_(key,true);try{return DriveApp.getFolderById(id);}catch(e){throw appError_('DRIVE_FOLDER_INVALID','Configured evidence folder cannot be accessed.',false,{key:key});} }
function archiveFolder_(){var id=getConfigValue_('DRIVE_ARCHIVE_FOLDER_ID',true);try{return DriveApp.getFolderById(id);}catch(e){throw appError_('DRIVE_FOLDER_INVALID','Configured archive folder cannot be accessed.',false,{key:'DRIVE_ARCHIVE_FOLDER_ID'});} }
function extensionForMime_(mime){return{'image/jpeg':'jpg','image/png':'png','image/webp':'webp','application/pdf':'pdf'}[mime]||'';}
function decodeEvidenceBytes_(payload){var base64=String(payload.base64||payload.data||'').replace(/^data:[^;]+;base64,/,'');if(!base64)throw appError_('EMPTY_FILE','The uploaded file is empty.',false);try{return Utilities.base64Decode(base64);}catch(e){throw appError_('INVALID_FILE_DATA','The uploaded file data is invalid.',false);} }
function sha256Hex_(bytes){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,bytes).map(function(b){return('0'+((b+256)%256).toString(16)).slice(-2);}).join('');}
function moveToRecovery_(file){var archive=archiveFolder_();file.moveTo(archive);file.setDescription('HAU-USC recovery quarantine: metadata write failed at '+nowIso_());}

