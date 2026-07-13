var EVIDENCE_FOLDER_KEYS_ = Object.freeze({
  RESTOCK_RECEIPT: 'DRIVE_RECEIPTS_INVOICES_FOLDER_ID',
  RESTOCK_INVOICE: 'DRIVE_RECEIPTS_INVOICES_FOLDER_ID',
  CANVASS_QUOTE: 'DRIVE_CANVASSING_FOLDER_ID',
  CANVASS_PHOTO: 'DRIVE_CANVASSING_FOLDER_ID',
  DELIVERABLE_RECEIPT: 'DRIVE_PROCUREMENT_FOLDER_ID',
  DELIVERABLE_DELIVERY_PROOF: 'DRIVE_PROCUREMENT_FOLDER_ID',
  RELEASE_CONFIRMATION_PHOTO: 'DRIVE_RELEASES_RETURNS_FOLDER_ID',
  LENDING_HANDOFF_PHOTO: 'DRIVE_LENDING_FOLDER_ID',
  LENDING_RETURN_PHOTO: 'DRIVE_RELEASES_RETURNS_FOLDER_ID',
  OTHER_SUPPORTING_DOCUMENT: 'DRIVE_REQUESTS_FOLDER_ID'
});

function canonicalFolderDefinition_(key) {
  var canonicalKey = HAU_DRIVE_LEGACY_ALIASES_[key] || key;
  return HAU_DRIVE_CANONICAL_FOLDERS_.filter(function(definition) {
    return definition.key === canonicalKey;
  })[0] || null;
}

function legacyAliasesForCanonicalKey_(canonicalKey) {
  return Object.keys(HAU_DRIVE_LEGACY_ALIASES_).filter(function(alias) {
    return HAU_DRIVE_LEGACY_ALIASES_[alias] === canonicalKey;
  });
}

function usableConfiguredFolderId_(value) {
  var normalized = String(value || '').trim();
  return normalized && normalized !== 'TO_BE_ASSIGNED' ? normalized : '';
}

function configuredFolderId_(canonicalKey, config) {
  var direct = usableConfiguredFolderId_(config[canonicalKey]);
  var legacy = legacyAliasesForCanonicalKey_(canonicalKey).map(function(alias) {
    return usableConfiguredFolderId_(config[alias]);
  }).filter(Boolean);
  var distinct = legacy.filter(function(value, index) { return legacy.indexOf(value) === index; });
  if (direct && distinct.some(function(value) { return value !== direct; })) {
    throw appError_('DRIVE_FOLDER_ALIAS_MISMATCH', 'A legacy Drive folder alias conflicts with its canonical folder.', false, { key: canonicalKey });
  }
  if (direct) return direct;
  if (distinct.length > 1) {
    throw appError_('DRIVE_FOLDER_ALIAS_MISMATCH', 'Legacy Drive folder aliases do not resolve to one canonical folder.', false, { key: canonicalKey });
  }
  if (distinct.length === 1) return distinct[0];
  throw appError_('SETUP_REQUIRED', 'Required configuration is missing: ' + canonicalKey, false, { key: canonicalKey });
}

function assertDistinctCanonicalFolderIds_(config) {
  var owners = {};
  HAU_DRIVE_CANONICAL_FOLDERS_.forEach(function(definition) {
    var id = configuredFolderId_(definition.key, config);
    if (owners[id]) {
      throw appError_('DRIVE_FOLDER_MAPPING_DUPLICATE', 'Canonical Drive folder mappings must be distinct.', false, {
        keys: [owners[id], definition.key]
      });
    }
    owners[id] = definition.key;
  });
  return true;
}

function driveFolderById_(id, key) {
  try { return DriveApp.getFolderById(id); }
  catch (error) {
    throw appError_('DRIVE_FOLDER_INVALID', 'A configured Drive folder cannot be accessed.', false, { key: key });
  }
}

function configuredRootFolder_(config) {
  var id = usableConfiguredFolderId_(config.DRIVE_ROOT_FOLDER_ID);
  if (!id) throw appError_('SETUP_REQUIRED', 'Required configuration is missing: DRIVE_ROOT_FOLDER_ID', false, { key: 'DRIVE_ROOT_FOLDER_ID' });
  return driveFolderById_(id, 'DRIVE_ROOT_FOLDER_ID');
}

function iteratorToArray_(iterator) {
  var values = [];
  if (!iterator || typeof iterator.hasNext !== 'function' || typeof iterator.next !== 'function') return values;
  while (iterator.hasNext()) values.push(iterator.next());
  return values;
}

function directChildFoldersNamed_(root, name) {
  if (!root || typeof root.getFoldersByName !== 'function') {
    throw appError_('DRIVE_FOLDER_INVALID', 'The configured Drive root cannot enumerate direct children.', false, { key: 'DRIVE_ROOT_FOLDER_ID' });
  }
  return iteratorToArray_(root.getFoldersByName(name));
}

function folderParentIds_(folder) {
  if (!folder || typeof folder.getParents !== 'function') return [];
  return iteratorToArray_(folder.getParents()).map(function(parent) { return String(parent.getId()); });
}

function assertDirectChildFolder_(folder, root, definition) {
  var actualName;
  try { actualName = String(folder.getName()); }
  catch (error) { throw appError_('DRIVE_FOLDER_INVALID', 'A configured Drive folder cannot be inspected.', false, { key: definition.key }); }
  if (actualName !== definition.name) {
    throw appError_('DRIVE_FOLDER_NAME_MISMATCH', 'A configured Drive folder does not have its exact expected name.', false, {
      key: definition.key,
      expectedName: definition.name
    });
  }
  var parents = folderParentIds_(folder);
  var rootId = String(root.getId());
  if (parents.length !== 1 || parents[0] !== rootId) {
    throw appError_('DRIVE_FOLDER_PARENT_MISMATCH', 'A configured Drive folder is not a direct child of the configured root.', false, { key: definition.key });
  }
  return folder;
}

function driveSharingDiagnostic_(resource) {
  var access;
  var permission;
  try {
    access = String(resource.getSharingAccess()).toUpperCase();
    permission = String(resource.getSharingPermission()).toUpperCase();
  } catch (error) {
    return { status: 'UNVERIFIED', access: 'UNKNOWN', permission: 'UNKNOWN', safe: false, message: 'Sharing could not be verified.' };
  }
  if (access.indexOf('ANYONE') >= 0 || access.indexOf('WITH_LINK') >= 0) {
    return { status: 'UNSAFE', access: access, permission: permission, safe: false, message: 'Broad or link sharing is not allowed.' };
  }
  if (access.indexOf('DOMAIN') >= 0) {
    return { status: 'WARNING', access: access, permission: permission, safe: false, message: 'Domain-wide sharing requires a privacy review.' };
  }
  if (access.indexOf('PRIVATE') < 0) {
    return { status: 'UNVERIFIED', access: access || 'UNKNOWN', permission: permission || 'UNKNOWN', safe: false, message: 'Sharing is not proven private.' };
  }
  return { status: 'PRIVATE', access: access, permission: permission, safe: true, message: 'No broad link or domain sharing detected.' };
}

function requireSafeDriveSharing_(resource, key) {
  var diagnostic = driveSharingDiagnostic_(resource);
  if (!diagnostic.safe) {
    throw appError_('DRIVE_SHARING_UNSAFE', 'Configured Drive storage is not proven private.', false, {
      key: key,
      sharingStatus: diagnostic.status
    });
  }
  return diagnostic;
}

function requireCanonicalFolder_(key, options) {
  var definition = canonicalFolderDefinition_(key);
  if (!definition) throw appError_('DRIVE_FOLDER_KEY_INVALID', 'Unsupported Drive folder mapping.', false, { key: key });
  var config = configMap_();
  var root = configuredRootFolder_(config);
  if (!options || options.requirePrivate !== false) requireSafeDriveSharing_(root, 'DRIVE_ROOT_FOLDER_ID');
  assertDistinctCanonicalFolderIds_(config);
  var folder = driveFolderById_(configuredFolderId_(definition.key, config), definition.key);
  assertDirectChildFolder_(folder, root, definition);
  var exactMatches = directChildFoldersNamed_(root, definition.name);
  if (exactMatches.length !== 1) {
    throw appError_('DRIVE_FOLDER_DUPLICATE_NAME', 'The configured Drive root must contain exactly one direct child with the canonical name.', false, {
      key: definition.key,
      expectedName: definition.name,
      count: exactMatches.length
    });
  }
  if (String(exactMatches[0].getId()) !== String(folder.getId())) {
    throw appError_('DRIVE_FOLDER_MAPPING_MISMATCH', 'The configured Drive folder does not match the canonical exact-name direct child.', false, { key: definition.key });
  }
  if (!options || options.requirePrivate !== false) requireSafeDriveSharing_(folder, definition.key);
  return folder;
}

function evidenceFolderKey_(evidenceType, payload) {
  if (evidenceType === 'OTHER_SUPPORTING_DOCUMENT') {
    var entityType = String(payload && payload.relatedEntityType || '').toUpperCase();
    if (entityType === 'ITEM' || entityType === 'INVENTORY') return 'DRIVE_INVENTORY_EVIDENCE_FOLDER_ID';
  }
  var key = EVIDENCE_FOLDER_KEYS_[evidenceType];
  if (!key) throw appError_('UNSUPPORTED_EVIDENCE_TYPE', 'Unsupported evidence type.', false, { evidenceType: evidenceType });
  return key;
}

function folderForEvidence_(evidenceType, payload) {
  return requireCanonicalFolder_(evidenceFolderKey_(evidenceType, payload));
}

function archiveFolder_() { return requireCanonicalFolder_('DRIVE_BACKUPS_FOLDER_ID'); }
function backupFolder_() { return archiveFolder_(); }
function quarantineFolder_() { return requireCanonicalFolder_('DRIVE_QUARANTINE_FOLDER_ID'); }
function brandingFolder_() { return requireCanonicalFolder_('DRIVE_BRANDING_FOLDER_ID'); }

function extensionForMime_(mime) {
  return { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'application/pdf': 'pdf' }[String(mime || '').toLowerCase()] || '';
}

function normalizedUploadExtension_(filename) {
  var name = String(filename || '').trim().toLowerCase();
  var dot = name.lastIndexOf('.');
  var extension = dot >= 0 ? name.slice(dot + 1) : '';
  return extension === 'jpeg' ? 'jpg' : extension;
}

function encodedUploadData_(payload) {
  var raw = String(payload && (payload.base64 || payload.data || payload.fileData || payload.dataUrl) || '');
  if (!raw) throw appError_('EMPTY_FILE', 'The uploaded file is empty.', false);
  var maximumEncoded = Math.ceil(HAU_CONFIG.MAX_UPLOAD_BYTES / 3) * 4;
  if (raw.length > maximumEncoded + 256) {
    throw appError_('ENCODED_FILE_TOO_LARGE', 'The encoded upload exceeds the maximum allowed size.', false, { maxBytes: HAU_CONFIG.MAX_UPLOAD_BYTES });
  }
  var match = raw.match(/^data:([^;,]+);base64,([A-Za-z0-9+/=\r\n\t ]+)$/i);
  var encoded = match ? match[2] : raw;
  if (match && String(match[1]).toLowerCase() !== String(payload.mimeType || '').toLowerCase()) {
    throw appError_('DATA_URL_MIME_MISMATCH', 'The encoded file MIME type does not match the declared MIME type.', false);
  }
  encoded = encoded.replace(/\s/g, '');
  if (!encoded || encoded.length > maximumEncoded || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw appError_(encoded.length > maximumEncoded ? 'ENCODED_FILE_TOO_LARGE' : 'INVALID_FILE_DATA', encoded.length > maximumEncoded ? 'The encoded upload exceeds the maximum allowed size.' : 'The uploaded file data is invalid.', false, { maxBytes: HAU_CONFIG.MAX_UPLOAD_BYTES });
  }
  var padding = encoded.slice(-2) === '==' ? 2 : encoded.slice(-1) === '=' ? 1 : 0;
  var estimatedSize = encoded.length / 4 * 3 - padding;
  if (estimatedSize > HAU_CONFIG.MAX_UPLOAD_BYTES) {
    throw appError_('ENCODED_FILE_TOO_LARGE', 'The encoded upload exceeds the maximum allowed size.', false, { maxBytes: HAU_CONFIG.MAX_UPLOAD_BYTES });
  }
  return encoded;
}

function decodeEvidenceBytes_(payload) {
  var encoded = encodedUploadData_(payload);
  var bytes;
  try { bytes = Utilities.base64Decode(encoded); }
  catch (error) { throw appError_('INVALID_FILE_DATA', 'The uploaded file data is invalid.', false); }
  if (!bytes.length) throw appError_('EMPTY_FILE', 'The uploaded file is empty.', false);
  if (bytes.length > HAU_CONFIG.MAX_UPLOAD_BYTES) {
    throw appError_('FILE_TOO_LARGE', 'The decoded upload exceeds the maximum allowed size.', false, { maxBytes: HAU_CONFIG.MAX_UPLOAD_BYTES });
  }
  return bytes;
}

function unsignedByte_(value) { return value < 0 ? value + 256 : value; }
function byteAt_(bytes, index) { return unsignedByte_(Number(bytes[index] || 0)); }
function asciiAt_(bytes, start, length) {
  var text = '';
  for (var index = start; index < start + length; index += 1) text += String.fromCharCode(byteAt_(bytes, index));
  return text;
}

function fileMagicMatches_(bytes, mime) {
  if (mime === 'image/jpeg') return bytes.length >= 4 && byteAt_(bytes, 0) === 0xff && byteAt_(bytes, 1) === 0xd8 && byteAt_(bytes, 2) === 0xff;
  if (mime === 'image/png') return bytes.length >= 24 && [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a].every(function(value, index) { return byteAt_(bytes, index) === value; });
  if (mime === 'image/webp') return bytes.length >= 30 && asciiAt_(bytes, 0, 4) === 'RIFF' && asciiAt_(bytes, 8, 4) === 'WEBP';
  if (mime === 'application/pdf') return bytes.length >= 8 && asciiAt_(bytes, 0, 5) === '%PDF-';
  return false;
}

function uint32BigEndian_(bytes, start) {
  return byteAt_(bytes, start) * 16777216 + byteAt_(bytes, start + 1) * 65536 + byteAt_(bytes, start + 2) * 256 + byteAt_(bytes, start + 3);
}

function jpegDimensions_(bytes) {
  var offset = 2;
  while (offset + 8 < bytes.length) {
    if (byteAt_(bytes, offset) !== 0xff) { offset += 1; continue; }
    var marker = byteAt_(bytes, offset + 1);
    offset += 2;
    if (marker === 0xd8 || marker === 0xd9) continue;
    if (offset + 2 > bytes.length) break;
    var length = byteAt_(bytes, offset) * 256 + byteAt_(bytes, offset + 1);
    if (length < 2 || offset + length > bytes.length) break;
    if ([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].indexOf(marker) >= 0) {
      return { width: byteAt_(bytes, offset + 5) * 256 + byteAt_(bytes, offset + 6), height: byteAt_(bytes, offset + 3) * 256 + byteAt_(bytes, offset + 4) };
    }
    offset += length;
  }
  return null;
}

function webpDimensions_(bytes) {
  var chunk = asciiAt_(bytes, 12, 4);
  if (chunk === 'VP8X' && bytes.length >= 30) {
    return {
      width: 1 + byteAt_(bytes, 24) + byteAt_(bytes, 25) * 256 + byteAt_(bytes, 26) * 65536,
      height: 1 + byteAt_(bytes, 27) + byteAt_(bytes, 28) * 256 + byteAt_(bytes, 29) * 65536
    };
  }
  if (chunk === 'VP8L' && bytes.length >= 25 && byteAt_(bytes, 20) === 0x2f) {
    return {
      width: 1 + byteAt_(bytes, 21) + (byteAt_(bytes, 22) & 0x3f) * 256,
      height: 1 + ((byteAt_(bytes, 22) & 0xc0) >> 6) + byteAt_(bytes, 23) * 4 + (byteAt_(bytes, 24) & 0x0f) * 1024
    };
  }
  if (chunk === 'VP8 ' && bytes.length >= 30 && byteAt_(bytes, 23) === 0x9d && byteAt_(bytes, 24) === 0x01 && byteAt_(bytes, 25) === 0x2a) {
    return { width: (byteAt_(bytes, 26) + byteAt_(bytes, 27) * 256) & 0x3fff, height: (byteAt_(bytes, 28) + byteAt_(bytes, 29) * 256) & 0x3fff };
  }
  return null;
}

function imageDimensions_(bytes, mime) {
  var dimensions = null;
  if (mime === 'image/png' && bytes.length >= 24 && asciiAt_(bytes, 12, 4) === 'IHDR') dimensions = { width: uint32BigEndian_(bytes, 16), height: uint32BigEndian_(bytes, 20) };
  else if (mime === 'image/jpeg') dimensions = jpegDimensions_(bytes);
  else if (mime === 'image/webp') dimensions = webpDimensions_(bytes);
  if (!dimensions || !dimensions.width || !dimensions.height || dimensions.width > HAU_CONFIG.MAX_IMAGE_DIMENSION_PX || dimensions.height > HAU_CONFIG.MAX_IMAGE_DIMENSION_PX || dimensions.width * dimensions.height > HAU_CONFIG.MAX_IMAGE_PIXELS) {
    throw appError_('IMAGE_DIMENSIONS_UNVERIFIED', 'Image dimensions could not be safely verified.', false);
  }
  return dimensions;
}

function validateUploadedBytes_(bytes, mime, requireDimensions) {
  var normalizedMime = String(mime || '').toLowerCase();
  if (!fileMagicMatches_(bytes, normalizedMime)) throw appError_('FILE_SIGNATURE_MISMATCH', 'File contents do not match the declared MIME type.', false);
  return requireDimensions ? imageDimensions_(bytes, normalizedMime) : null;
}

function sha256Hex_(bytes) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, bytes).map(function(value) {
    return ('0' + unsignedByte_(value).toString(16)).slice(-2);
  }).join('');
}

function fileHasOnlyParent_(file, folder) {
  if (!file || typeof file.getParents !== 'function') return false;
  var parents = iteratorToArray_(file.getParents()).map(function(parent) { return String(parent.getId()); });
  return parents.length === 1 && parents[0] === String(folder.getId());
}

function verifyCreatedFileParent_(file, folder) {
  if (!fileHasOnlyParent_(file, folder)) throw appError_('DRIVE_FILE_PARENT_MISMATCH', 'The uploaded file was not stored in the expected controlled folder.', false);
  return true;
}

function moveToQuarantine_(file, reason) {
  var quarantine = quarantineFolder_();
  try {
    file.moveTo(quarantine);
    verifyCreatedFileParent_(file, quarantine);
    file.setDescription('HAU-USC recovery quarantine: ' + String(reason || 'metadata failure').slice(0, 120) + ' at ' + nowIso_());
    return { status: 'QUARANTINED', recoverable: true, folderId: quarantine.getId() };
  } catch (error) {
    return { status: 'QUARANTINE_FAILED', recoverable: false };
  }
}

function moveToRecovery_(file) { return moveToQuarantine_(file, 'metadata write failed'); }
