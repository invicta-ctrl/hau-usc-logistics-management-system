var EVIDENCE_CODES_ = Object.freeze({
  RESTOCK_RECEIPT: 'RST-RCPT', RESTOCK_INVOICE: 'RST-INV', CANVASS_QUOTE: 'CAN-QUOTE',
  CANVASS_PHOTO: 'CAN-PHOTO', DELIVERABLE_RECEIPT: 'DEL-RCPT',
  DELIVERABLE_DELIVERY_PROOF: 'DEL-PROOF', RELEASE_CONFIRMATION_PHOTO: 'REL-PHOTO',
  LENDING_HANDOFF_PHOTO: 'LND-OUT', LENDING_RETURN_PHOTO: 'LND-RETURN',
  OTHER_SUPPORTING_DOCUMENT: 'OTHER'
});

var EVIDENCE_LABELS_ = Object.freeze({
  RESTOCK_RECEIPT: 'Restock Receipt', RESTOCK_INVOICE: 'Restock Invoice',
  CANVASS_QUOTE: 'Canvass Quote', CANVASS_PHOTO: 'Canvass Photo',
  DELIVERABLE_RECEIPT: 'Deliverable Receipt', DELIVERABLE_DELIVERY_PROOF: 'Deliverable Delivery Proof',
  RELEASE_CONFIRMATION_PHOTO: 'Release Confirmation', LENDING_HANDOFF_PHOTO: 'Lending Handoff',
  LENDING_RETURN_PHOTO: 'Lending Return', OTHER_SUPPORTING_DOCUMENT: 'Supporting Document'
});

function evidencePermissionForType_(type) {
  if (['RESTOCK_RECEIPT','RESTOCK_INVOICE','CANVASS_QUOTE','CANVASS_PHOTO','DELIVERABLE_RECEIPT','DELIVERABLE_DELIVERY_PROOF'].indexOf(type) >= 0) return 'Can_Receive';
  if (['RELEASE_CONFIRMATION_PHOTO','LENDING_HANDOFF_PHOTO','LENDING_RETURN_PHOTO'].indexOf(type) >= 0) return 'Can_Release';
  return 'Can_Admin';
}

function authorizeEvidenceUpload_(type) {
  var normalized = String(type || '').trim().toUpperCase();
  if (!EVIDENCE_CODES_[normalized]) throw appError_('UNSUPPORTED_EVIDENCE_TYPE', 'Unsupported evidence type.', false, { evidenceType: normalized });
  return requirePermission_(evidencePermissionForType_(normalized));
}

function evidenceFilenameToken_(value, fallback) {
  return sanitizeSystemToken_(value || fallback || 'NA').slice(0, 32);
}

function normalizedEvidenceFilename_(payload, evidenceId, timestamp) {
  var type = requireText_(payload.evidenceType, 'evidenceType');
  var code = EVIDENCE_CODES_[type];
  if (!code) throw appError_('UNSUPPORTED_EVIDENCE_TYPE', 'Unsupported evidence type.', false);
  var extension = extensionForMime_(payload.mimeType);
  var stamp = Utilities.formatDate(timestamp || new Date(), HAU_CONFIG.TIMEZONE, 'yyyyMMdd-HHmmss');
  var related = evidenceFilenameToken_(payload.relatedEntityId);
  var secondary = evidenceFilenameToken_(payload.secondaryId || payload.itemId || payload.eventItemId || payload.requestLineId);

  // Preserve the established helper contract for older callers. Actual uploads always carry relatedEntityType.
  if (!payload.relatedEntityType) {
    return [code, related, secondary, stamp, sanitizeSystemToken_(evidenceId)].join('_').slice(0, 180) + '.' + extension;
  }

  var eventOrOffice = evidenceFilenameToken_(payload.eventId || payload.officeToken || payload.officeCode, 'GENERAL');
  var requestOrTicket = evidenceFilenameToken_(payload.requestId || payload.lendingTicketId || payload.relatedEntityId);
  var categoryOrSupplier = evidenceFilenameToken_(payload.supplierId || payload.itemId || payload.requestLineId || type);
  var shortEvidenceId = sanitizeSystemToken_(evidenceId).slice(-24);
  return [code, eventOrOffice, requestOrTicket, categoryOrSupplier, stamp, shortEvidenceId].join('_').slice(0, 190) + '.' + extension;
}

function evidenceLabel_(payload, timestamp) {
  var label = EVIDENCE_LABELS_[payload.evidenceType] || 'Evidence';
  var date = Utilities.formatDate(timestamp || new Date(), HAU_CONFIG.TIMEZONE, 'yyyy-MM-dd HH:mm') + ' PHT';
  var parts = [label, sanitizeSystemToken_(payload.relatedEntityId)];
  if (payload.secondaryId || payload.itemId || payload.eventItemId || payload.requestLineId) {
    parts.push(sanitizeSystemToken_(payload.secondaryId || payload.itemId || payload.eventItemId || payload.requestLineId));
  }
  parts.push(date);
  return parts.join(' | ');
}

function validateEvidencePayload_(payload) {
  requireObject_(payload, 'Evidence');
  var type = requireText_(payload.evidenceType, 'evidenceType').toUpperCase();
  var mime = requireText_(payload.mimeType, 'mimeType').toLowerCase();
  if (!EVIDENCE_CODES_[type]) throw appError_('UNSUPPORTED_EVIDENCE_TYPE', 'Unsupported evidence type.', false);
  if (HAU_CONFIG.ALLOWED_MIME_TYPES.indexOf(mime) < 0) throw appError_('UNSUPPORTED_FILE_TYPE', 'Allowed files are JPG, PNG, WEBP, and PDF.', false);
  var extension = normalizedUploadExtension_(payload.originalFileName);
  var expected = extensionForMime_(mime);
  if (!extension || extension !== expected) throw appError_('MIME_EXTENSION_MISMATCH', 'File extension does not match its MIME type.', false);
  var relatedEntityId = requireText_(payload.relatedEntityId, 'relatedEntityId');
  var relatedEntityType = requireText_(payload.relatedEntityType, 'relatedEntityType').toUpperCase();
  if (!/^[A-Z][A-Z0-9_]{1,39}$/.test(relatedEntityType)) throw appError_('INVALID_EVIDENCE_CATEGORY', 'Evidence related entity type is invalid.', false, { field: 'relatedEntityType' });
  return { type: type, mime: mime, extension: extension, relatedEntityId: relatedEntityId, relatedEntityType: relatedEntityType };
}

function evidenceDuplicate_(digest, command) {
  return readObjects_(HAU_SHEETS.EVIDENCE).find(function(row) {
    return String(row.SHA256) === digest &&
      String(row.Evidence_Type) === String(command.evidenceType) &&
      String(row.Related_Entity_Type) === String(command.relatedEntityType) &&
      String(row.Related_Entity_ID) === String(command.relatedEntityId) &&
      String(row.Upload_Status) === 'UPLOADED';
  }) || null;
}

function verifyDuplicateEvidenceStorage_(duplicate, command) {
  var folder = folderForEvidence_(command.evidenceType, command);
  var file;
  try { file = DriveApp.getFileById(String(duplicate.Drive_File_ID || '')); }
  catch (error) { throw appError_('EVIDENCE_DUPLICATE_STORAGE_INVALID', 'Existing duplicate evidence storage could not be verified.', false); }
  if (String(duplicate.Drive_Folder_ID || '') !== String(folder.getId()) || !fileHasOnlyParent_(file, folder)) {
    throw appError_('EVIDENCE_DUPLICATE_STORAGE_INVALID', 'Existing duplicate evidence is not in the expected controlled folder.', false);
  }
  requireSafeDriveSharing_(file, 'EVIDENCE_FILE');
  return true;
}

function evidenceRecoveryRow_(row, recovery) {
  return Object.assign({}, row, {
    Drive_Folder_ID: recovery.folderId || row.Drive_Folder_ID,
    Drive_URL: '',
    Upload_Status: 'QUARANTINED',
    Notes: ['Metadata write failed.', 'Recovery=' + recovery.status, String(row.Notes || '')].filter(Boolean).join(' ').slice(0, 1000)
  });
}

function recordEvidenceRecovery_(row, recovery, user, correlationId) {
  var recorded = false;
  try {
    var existing = findOne_(HAU_SHEETS.EVIDENCE, 'Evidence_ID', row.Evidence_ID);
    if (existing) updateObject_(HAU_SHEETS.EVIDENCE, existing._row, evidenceRecoveryRow_(row, recovery));
    else appendObject_(HAU_SHEETS.EVIDENCE, evidenceRecoveryRow_(row, recovery));
    recorded = true;
  } catch (ignored) {}
  try {
    audit_('QUARANTINE_EVIDENCE', 'EVIDENCE', row.Evidence_ID, user, correlationId, {
      after: { recoveryStatus: recovery.status, recoveryRecorded: recorded, evidenceType: row.Evidence_Type }
    });
  } catch (ignored) {}
  return recorded;
}

function uploadEvidence_(command, correlationId) {
  command = Object.assign({}, command || {}, { evidenceType: String(command && command.evidenceType || '').trim().toUpperCase() });
  var user = authorizeEvidenceUpload_(command.evidenceType);
  var key = requireIdempotency_(command);
  var replay = idempotencyReplay_(key, user);
  if (replay) return Object.assign({ idempotentReplay: true }, replay);

  var validated = validateEvidencePayload_(command);
  command.evidenceType = validated.type;
  command.mimeType = validated.mime;
  command.relatedEntityType = validated.relatedEntityType;
  var bytes = decodeEvidenceBytes_(command);
  var size = bytes.length;
  validateUploadedBytes_(bytes, validated.mime, false);
  var digest = sha256Hex_(bytes);
  var duplicate = evidenceDuplicate_(digest, command);
  if (duplicate) {
    verifyDuplicateEvidenceStorage_(duplicate, command);
    audit_('DUPLICATE_EVIDENCE_ATTEMPT', 'EVIDENCE', duplicate.Evidence_ID, user, correlationId, { notes: 'Checksum matched existing verified evidence.' });
    return recordIdempotency_(key, {
      evidenceId: duplicate.Evidence_ID,
      evidenceLabel: duplicate.Evidence_Label || '',
      normalizedFileName: duplicate.Normalized_File_Name || '',
      duplicate: true,
      entityType: 'EVIDENCE',
      entityId: duplicate.Evidence_ID
    }, user, correlationId);
  }

  var id = allocateId_('EVD');
  var timestamp = new Date();
  var filename = normalizedEvidenceFilename_(command, id, timestamp);
  var label = evidenceLabel_(command, timestamp);
  var folder = folderForEvidence_(command.evidenceType, command);
  var blob = Utilities.newBlob(bytes, command.mimeType, filename);
  var file;
  try {
    file = folder.createFile(blob);
    file.setName(filename);
    file.setDescription(label);
    verifyCreatedFileParent_(file, folder);
    requireSafeDriveSharing_(file, 'EVIDENCE_FILE');
  } catch (error) {
    var uploadRecovery = file ? moveToQuarantine_(file, 'upload parent or sharing verification failed') : { status: 'NOT_CREATED', recoverable: true };
    throw appError_(error && error.code || 'DRIVE_UPLOAD_FAILED', 'Evidence could not be stored in verified private storage. You may retry safely.', true, { recoveryStatus: uploadRecovery.status });
  }

  var row = {
    Evidence_ID: id, Created_At: nowIso_(), Evidence_Type: command.evidenceType,
    Evidence_Label: label, Original_File_Name: String(command.originalFileName || '').slice(0, 255),
    Normalized_File_Name: filename, Mime_Type: command.mimeType, Size_Bytes: size, SHA256: digest,
    Drive_File_ID: file.getId(), Drive_Folder_ID: folder.getId(), Drive_URL: file.getUrl(),
    Related_Entity_Type: command.relatedEntityType, Related_Entity_ID: command.relatedEntityId,
    Request_ID: command.requestId || '', Request_Line_ID: command.requestLineId || '',
    Event_ID: command.eventId || '', Item_ID: command.itemId || '', Event_Item_ID: command.eventItemId || '',
    Supplier_ID: command.supplierId || '', Uploaded_By: user.User_ID || 'SYSTEM', Upload_Status: 'UPLOADED',
    Duplicate_Of: '', Notes: String(command.notes || '').slice(0, 1000)
  };

  try {
    appendObject_(HAU_SHEETS.EVIDENCE, row);
  } catch (error) {
    var recovery = moveToQuarantine_(file, 'evidence metadata write failed');
    var recoveryRecorded = recordEvidenceRecovery_(row, recovery, user, correlationId);
    throw appError_('EVIDENCE_METADATA_FAILED', 'The file was quarantined because its metadata could not be recorded normally.', true, {
      evidenceId: id,
      recoveryStatus: recovery.status,
      recoveryRecorded: recoveryRecorded
    });
  }

  audit_('UPLOAD_EVIDENCE', 'EVIDENCE', id, user, correlationId, {
    after: { evidenceType: row.Evidence_Type, normalizedFileName: filename, relatedEntityId: row.Related_Entity_ID, storageVerified: true }
  });
  return recordIdempotency_(key, {
    evidenceId: id,
    evidenceLabel: label,
    normalizedFileName: filename,
    duplicate: false,
    entityType: 'EVIDENCE',
    entityId: id
  }, user, correlationId);
}
