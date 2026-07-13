import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const gasRoot = resolve(import.meta.dirname, '../../apps-script');

class FakeIterator {
  constructor(values) { this.values = [...values]; this.index = 0; }
  hasNext() { return this.index < this.values.length; }
  next() { return this.values[this.index++]; }
}

class FakeFile {
  constructor(id, blob, parent, sharing = 'PRIVATE') {
    this.id = id;
    this.bytes = [...(blob?.bytes ?? [])];
    this.mime = blob?.mime ?? 'application/octet-stream';
    this.name = blob?.name ?? 'file.bin';
    this.parents = parent ? [parent] : [];
    this.sharing = sharing;
    this.description = '';
  }
  getId() { return this.id; }
  getName() { return this.name; }
  setName(value) { this.name = value; return this; }
  setDescription(value) { this.description = value; return this; }
  getParents() { return new FakeIterator(this.parents); }
  getSharingAccess() { return this.sharing; }
  getSharingPermission() { return 'EDIT'; }
  getSize() { return this.bytes.length; }
  getMimeType() { return this.mime; }
  getBlob() { return { getBytes: () => [...this.bytes] }; }
  getUrl() { return `https://drive.invalid/${this.id}`; }
  moveTo(folder) { this.parents = [folder]; folder.files.push(this); return this; }
}

class FakeFolder {
  constructor(id, name, parent = null, sharing = 'PRIVATE') {
    this.id = id;
    this.name = name;
    this.parents = parent ? [parent] : [];
    this.children = [];
    this.files = [];
    this.sharing = sharing;
    this.sequence = 0;
    if (parent) parent.children.push(this);
  }
  getId() { return this.id; }
  getName() { return this.name; }
  getParents() { return new FakeIterator(this.parents); }
  getSharingAccess() { return this.sharing; }
  getSharingPermission() { return 'EDIT'; }
  getFoldersByName(name) { return new FakeIterator(this.children.filter((child) => child.name === name)); }
  createFolder(name) { this.sequence += 1; return new FakeFolder(`created-folder-${String(this.sequence).padStart(10, '0')}`, name, this); }
  createFile(blob) {
    this.sequence += 1;
    const file = new FakeFile(`created-file-${String(this.sequence).padStart(12, '0')}`, blob, this);
    this.files.push(file);
    return file;
  }
}

function signedDigest(bytes) {
  return [...createHash('sha256').update(Buffer.from(bytes)).digest()].map((value) => (value > 127 ? value - 256 : value));
}

function gasContext(files, globals = {}) {
  const context = vm.createContext({
    console,
    Object,
    JSON,
    Date,
    Math,
    String,
    Number,
    Boolean,
    Array,
    RegExp,
    Error,
    isFinite,
    Utilities: {
      DigestAlgorithm: { SHA_256: 'SHA_256' },
      base64Decode: (value) => [...Buffer.from(value, 'base64')].map((byte) => (byte > 127 ? byte - 256 : byte)),
      computeDigest: (_algorithm, value) => signedDigest(typeof value === 'string' ? Buffer.from(value) : value.map((byte) => (byte < 0 ? byte + 256 : byte))),
      formatDate: (_date, _timezone, pattern) => (pattern === 'yyyyMMdd-HHmmss' ? '20260713-141516' : '2026-07-13 14:15'),
      getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      newBlob: (bytes, mime, name) => ({ bytes: bytes.map((byte) => (byte < 0 ? byte + 256 : byte)), mime, name }),
    },
    ...globals,
  });
  files.forEach((file) => vm.runInContext(readFileSync(resolve(gasRoot, file), 'utf8'), context, { filename: file }));
  return context;
}

function pngBytes(width = 2, height = 3) {
  const bytes = [0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,13,0x49,0x48,0x44,0x52];
  [width, height].forEach((value) => bytes.push((value >>> 24) & 255, (value >>> 16) & 255, (value >>> 8) & 255, value & 255));
  return bytes;
}

function driveWorld() {
  const root = new FakeFolder('root-folder-123456789012345', 'HAU USC Controlled');
  const folders = new Map([[root.id, root]]);
  const files = new Map();
  const config = { DRIVE_ROOT_FOLDER_ID: root.id };
  const drive = {
    rootFallbackCalls: 0,
    getFolderById(id) {
      const folder = folders.get(String(id));
      if (!folder) throw new Error('not found');
      return folder;
    },
    getFileById(id) {
      const file = files.get(String(id));
      if (!file) throw new Error('not found');
      return file;
    },
    getRootFolder() { this.rootFallbackCalls += 1; throw new Error('must not be called'); },
  };
  return {
    root,
    folders,
    files,
    config,
    drive,
    registerFolder(folder) { folders.set(folder.id, folder); return folder; },
    registerFile(file) { files.set(file.id, file); return file; },
  };
}

function addCanonicalFolders(ctx, world) {
  for (const definition of ctx.HAU_DRIVE_CANONICAL_FOLDERS_) {
    const folder = world.registerFolder(new FakeFolder(`${definition.key.toLowerCase()}-1234567890`, definition.name, world.root));
    world.config[definition.key] = folder.id;
  }
  for (const [alias, canonical] of Object.entries(ctx.HAU_DRIVE_LEGACY_ALIASES_)) world.config[alias] = world.config[canonical];
}

function setupDriveContext(world) {
  const ctx = gasContext(['Config.gs', 'Validation.gs', 'DriveService.gs', 'Setup.gs'], { DriveApp: world.drive });
  ctx.configMap_ = () => world.config;
  ctx.resolveRuntimeConfig_ = () => ({ environment: 'STAGING' });
  ctx.setupUser_ = () => ({ User_ID: 'USR-ADMIN' });
  ctx.withScriptLock_ = (operation) => operation();
  ctx.setConfigValue_ = (key, value) => { world.config[key] = value; return { Key: key, Value: value }; };
  ctx.audit_ = () => {};
  ctx.logError_ = () => {};
  const originalCreateFolder = world.root.createFolder.bind(world.root);
  world.root.createFolder = (name) => world.registerFolder(originalCreateFolder(name));
  return ctx;
}

describe('canonical Drive folder resolution', () => {
  it('resolves existing exact children first, creates only missing children, and repeats idempotently', () => {
    const world = driveWorld();
    const ctx = setupDriveContext(world);
    const requests = world.registerFolder(new FakeFolder('requests-existing-1234567890', 'Requests', world.root));
    const branding = world.registerFolder(new FakeFolder('branding-existing-1234567890', 'Branding', world.root));

    const first = ctx.setupDriveFolders();
    expect(first.ok).toBe(true);
    expect(first.created).toHaveLength(9);
    expect(first.existing).toHaveLength(2);
    expect(world.config.DRIVE_REQUESTS_FOLDER_ID).toBe(requests.id);
    expect(world.config.DRIVE_BRANDING_FOLDER_ID).toBe(branding.id);
    expect(world.config.DRIVE_RECEIPTS_FOLDER_ID).toBe(world.config.DRIVE_RECEIPTS_INVOICES_FOLDER_ID);
    expect(first.validation.ok).toBe(true);
    expect(JSON.stringify(first)).not.toMatch(/https?:\/\/|requests-existing|branding-existing|created-folder/i);

    const childCount = world.root.children.length;
    const second = ctx.setupDriveFolders();
    expect(second.created).toEqual([]);
    expect(second.existing).toHaveLength(11);
    expect(world.root.children).toHaveLength(childCount);
  });

  it('rejects duplicate exact names before creating any folder', () => {
    const world = driveWorld();
    const ctx = setupDriveContext(world);
    world.registerFolder(new FakeFolder('requests-one-123456789012', 'Requests', world.root));
    world.registerFolder(new FakeFolder('requests-two-123456789012', 'Requests', world.root));
    const before = world.root.children.length;
    const result = ctx.setupDriveFolders();
    expect(result).toMatchObject({ ok: false, code: 'DRIVE_FOLDER_DUPLICATE_NAME' });
    expect(world.root.children).toHaveLength(before);
  });

  it('fails closed for alias conflicts, cross-key duplicates, unsafe sharing, wrong names, and wrong parents', () => {
    const world = driveWorld();
    const ctx = setupDriveContext(world);
    addCanonicalFolders(ctx, world);
    world.config.DRIVE_RECEIPTS_FOLDER_ID = world.config.DRIVE_REQUESTS_FOLDER_ID;
    expect(() => ctx.requireCanonicalFolder_('DRIVE_RECEIPTS_INVOICES_FOLDER_ID')).toThrow(expect.objectContaining({ code: 'DRIVE_FOLDER_ALIAS_MISMATCH' }));

    world.config.DRIVE_RECEIPTS_FOLDER_ID = world.config.DRIVE_RECEIPTS_INVOICES_FOLDER_ID;
    world.config.DRIVE_EXPORTS_FOLDER_ID = world.config.DRIVE_REQUESTS_FOLDER_ID;
    expect(() => ctx.requireCanonicalFolder_('DRIVE_REQUESTS_FOLDER_ID')).toThrow(expect.objectContaining({ code: 'DRIVE_FOLDER_MAPPING_DUPLICATE' }));
    expect(ctx.validateDriveConfiguration_().folders.filter((entry) => entry.status === 'MAPPING_DUPLICATE').map((entry) => entry.key).sort()).toEqual([
      'DRIVE_EXPORTS_FOLDER_ID', 'DRIVE_REQUESTS_FOLDER_ID',
    ]);

    const exportsFolder = world.registerFolder(new FakeFolder('exports-replacement-123456789', 'Exports', world.root));
    world.config.DRIVE_EXPORTS_FOLDER_ID = exportsFolder.id;
    const requests = world.folders.get(world.config.DRIVE_REQUESTS_FOLDER_ID);
    requests.sharing = 'ANYONE_WITH_LINK';
    expect(() => ctx.requireCanonicalFolder_('DRIVE_REQUESTS_FOLDER_ID')).toThrow(expect.objectContaining({ code: 'DRIVE_SHARING_UNSAFE' }));
    requests.sharing = 'PRIVATE';

    requests.name = 'Requests Wrong';
    expect(() => ctx.requireCanonicalFolder_('DRIVE_REQUESTS_FOLDER_ID')).toThrow(expect.objectContaining({ code: 'DRIVE_FOLDER_NAME_MISMATCH' }));
    requests.name = 'Requests';
    requests.parents = [new FakeFolder('wrong-parent-1234567890123', 'Wrong')];
    expect(() => ctx.requireCanonicalFolder_('DRIVE_REQUESTS_FOLDER_ID')).toThrow(expect.objectContaining({ code: 'DRIVE_FOLDER_PARENT_MISMATCH' }));
  });

  it('never falls back to the script owner root and returns redacted validation diagnostics', () => {
    const world = driveWorld();
    const ctx = setupDriveContext(world);
    delete world.config.DRIVE_ROOT_FOLDER_ID;
    expect(() => ctx.requireCanonicalFolder_('DRIVE_REQUESTS_FOLDER_ID')).toThrow(expect.objectContaining({ code: 'SETUP_REQUIRED' }));
    expect(world.drive.rootFallbackCalls).toBe(0);

    world.config.DRIVE_ROOT_FOLDER_ID = world.root.id;
    addCanonicalFolders(ctx, world);
    const result = ctx.validateDriveConfiguration_();
    expect(result.ok).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/root-folder-123|drive_requests_folder_id-123|https?:\/\//i);
  });

  it('routes backups and quarantine to distinct canonical children', () => {
    const world = driveWorld();
    const ctx = setupDriveContext(world);
    addCanonicalFolders(ctx, world);
    expect(ctx.backupFolder_().getName()).toBe('Backups');
    expect(ctx.quarantineFolder_().getName()).toBe('Quarantine');
    expect(ctx.backupFolder_().getId()).not.toBe(ctx.quarantineFolder_().getId());
    expect(ctx.archiveFolder_().getId()).toBe(ctx.backupFolder_().getId());
  });
});

describe('evidence byte, name, duplicate, and quarantine controls', () => {
  function evidenceContext() {
    return gasContext(['Config.gs', 'Validation.gs', 'DriveService.gs', 'EvidenceService.gs']);
  }

  it('builds deterministic privacy-safe names with all operational tokens', () => {
    const ctx = evidenceContext();
    const payload = {
      evidenceType: 'CANVASS_QUOTE', relatedEntityType: 'CANVASS', relatedEntityId: 'CAN-77',
      eventId: 'EVT-9', requestId: 'REQ-4', supplierId: 'SUP-3', mimeType: 'application/pdf',
      borrowerName: 'Private Person', studentIdNumber: '20260001', email: 'private@example.edu',
    };
    const first = ctx.normalizedEvidenceFilename_(payload, 'EVD-2026-0008', new Date('2026-07-13T06:15:16Z'));
    const second = ctx.normalizedEvidenceFilename_(payload, 'EVD-2026-0008', new Date('2026-07-13T06:15:16Z'));
    expect(first).toBe('CAN-QUOTE_EVT-9_REQ-4_SUP-3_20260713-141516_EVD-2026-0008.pdf');
    expect(second).toBe(first);
    expect(first).not.toMatch(/Private|20260001|example/i);
  });

  it('bounds encoded and decoded data and rejects extension or magic mismatches before storage', () => {
    const ctx = evidenceContext();
    ctx.HAU_CONFIG = Object.freeze({ ...ctx.HAU_CONFIG, MAX_UPLOAD_BYTES: 24 });
    const png = pngBytes();
    const base64 = Buffer.from(png).toString('base64');
    expect(ctx.decodeEvidenceBytes_({ base64 })).toHaveLength(24);
    expect(() => ctx.encodedUploadData_({ base64: 'A'.repeat(40) })).toThrow(expect.objectContaining({ code: 'ENCODED_FILE_TOO_LARGE' }));
    expect(() => ctx.validateUploadedBytes_([1,2,3,4,5,6,7,8], 'image/png', false)).toThrow(expect.objectContaining({ code: 'FILE_SIGNATURE_MISMATCH' }));
    expect(() => ctx.validateEvidencePayload_({ evidenceType: 'CANVASS_QUOTE', mimeType: 'image/png', originalFileName: 'quote.pdf', relatedEntityType: 'CANVASS', relatedEntityId: 'CAN-1' })).toThrow(expect.objectContaining({ code: 'MIME_EXTENSION_MISMATCH' }));
    ctx.Utilities.base64Decode = () => Array(25).fill(1);
    expect(() => ctx.decodeEvidenceBytes_({ base64 })).toThrow(expect.objectContaining({ code: 'FILE_TOO_LARGE' }));
  });

  it('recognizes JPEG, PNG, WEBP, and PDF magic and verifies supported image dimensions', () => {
    const ctx = evidenceContext();
    const jpeg = [0xff,0xd8,0xff,0xc0,0,11,8,0,5,0,7,3,1,1,0,2,1,0];
    const webp = Array(30).fill(0);
    [...Buffer.from('RIFF')].forEach((value, index) => { webp[index] = value; });
    [...Buffer.from('WEBP')].forEach((value, index) => { webp[index + 8] = value; });
    [...Buffer.from('VP8X')].forEach((value, index) => { webp[index + 12] = value; });
    webp[24] = 6;
    webp[27] = 4;
    const pdf = [...Buffer.from('%PDF-1.7')];
    expect(ctx.fileMagicMatches_(jpeg, 'image/jpeg')).toBe(true);
    expect(ctx.fileMagicMatches_(pngBytes(7, 5), 'image/png')).toBe(true);
    expect(ctx.fileMagicMatches_(webp, 'image/webp')).toBe(true);
    expect(ctx.fileMagicMatches_(pdf, 'application/pdf')).toBe(true);
    expect(ctx.imageDimensions_(jpeg, 'image/jpeg')).toEqual({ width: 7, height: 5 });
    expect(ctx.imageDimensions_(webp, 'image/webp')).toEqual({ width: 7, height: 5 });
  });

  it('rejects a signature mismatch before resolving or creating a Drive file', () => {
    const ctx = evidenceContext();
    let folderAccess = 0;
    let created = 0;
    ctx.requirePermission_ = () => ({ User_ID: 'USR-1' });
    ctx.idempotencyReplay_ = () => null;
    ctx.folderForEvidence_ = () => {
      folderAccess += 1;
      return { createFile: () => { created += 1; } };
    };
    expect(() => ctx.uploadEvidence_({
      evidenceType: 'CANVASS_PHOTO', mimeType: 'image/png', originalFileName: 'photo.png',
      relatedEntityType: 'CANVASS', relatedEntityId: 'CAN-1',
      base64: Buffer.from('not a png').toString('base64'), clientRequestId: 'client-invalid-magic',
    }, 'COR-1')).toThrow(expect.objectContaining({ code: 'FILE_SIGNATURE_MISMATCH' }));
    expect(folderAccess).toBe(0);
    expect(created).toBe(0);
  });

  it('replays a checksum duplicate only after parent verification and returns no Drive location', () => {
    const ctx = evidenceContext();
    const folder = new FakeFolder('evidence-folder-12345678901', 'Canvassing');
    const bytes = pngBytes();
    const file = new FakeFile('evidence-file-123456789012', { bytes, mime: 'image/png', name: 'safe.png' }, folder);
    const digest = ctx.sha256Hex_(bytes);
    const row = {
      Evidence_ID: 'EVD-1', Evidence_Type: 'CANVASS_PHOTO', SHA256: digest,
      Related_Entity_Type: 'CANVASS', Related_Entity_ID: 'CAN-1', Upload_Status: 'UPLOADED',
      Drive_File_ID: file.id, Drive_Folder_ID: folder.id, Drive_URL: 'https://drive.invalid/private',
      Evidence_Label: 'Canvass Photo', Normalized_File_Name: 'safe.png',
    };
    ctx.requirePermission_ = () => ({ User_ID: 'USR-1' });
    ctx.idempotencyReplay_ = () => null;
    ctx.readObjects_ = () => [row];
    ctx.folderForEvidence_ = () => folder;
    ctx.DriveApp = { getFileById: () => file };
    ctx.audit_ = () => {};
    ctx.recordIdempotency_ = (_key, result) => result;
    const result = ctx.uploadEvidence_({
      evidenceType: 'canvass_photo', mimeType: 'image/png', originalFileName: 'photo.png',
      relatedEntityType: 'CANVASS', relatedEntityId: 'CAN-1', base64: Buffer.from(bytes).toString('base64'), clientRequestId: 'client-1',
    }, 'COR-1');
    expect(result).toMatchObject({ evidenceId: 'EVD-1', duplicate: true });
    expect(JSON.stringify(result)).not.toMatch(/Drive|https?:\/\//i);
  });

  it('moves failed metadata files to the distinct quarantine parent with explicit recovery state', () => {
    const ctx = evidenceContext();
    const source = new FakeFolder('source-folder-1234567890123', 'Canvassing');
    const quarantine = new FakeFolder('quarantine-folder-12345678', 'Quarantine');
    const file = new FakeFile('file-to-quarantine-1234567', { bytes: pngBytes(), mime: 'image/png', name: 'safe.png' }, source);
    ctx.quarantineFolder_ = () => quarantine;
    ctx.nowIso_ = () => '2026-07-13T14:15:16+08:00';
    const recovery = ctx.moveToQuarantine_(file, 'metadata write failed');
    expect(recovery).toMatchObject({ status: 'QUARANTINED', recoverable: true, folderId: quarantine.id });
    expect(file.parents).toEqual([quarantine]);
    expect(file.description).toContain('metadata write failed');
  });
});

describe('protected branding storage', () => {
  function brandingContext() {
    return gasContext(['Config.gs', 'Validation.gs', 'DriveService.gs', 'AdminService.gs']);
  }

  it('authorizes before decoding, verifies dimensions, and keeps the version ID server-owned', () => {
    const ctx = brandingContext();
    const folder = new FakeFolder('branding-folder-12345678901', 'Branding');
    const bytes = pngBytes(7, 5);
    let decodeCalls = 0;
    const decode = ctx.Utilities.base64Decode;
    ctx.Utilities.base64Decode = (value) => { decodeCalls += 1; return decode(value); };
    ctx.withScriptLock_ = (operation) => operation();
    ctx.requirePermission_ = () => { throw ctx.appError_('FORBIDDEN', 'blocked', false); };
    expect(() => ctx.uploadBrandingAsset_({ assetKey: 'WORDMARK', clientRequestId: 'x', base64: 'AAAA' }, 'COR-1')).toThrow(expect.objectContaining({ code: 'FORBIDDEN' }));
    expect(decodeCalls).toBe(0);

    const rows = [];
    ctx.requirePermission_ = () => ({ User_ID: 'USR-ADMIN' });
    ctx.idempotencyReplay_ = () => null;
    ctx.adminRows_ = () => rows;
    ctx.brandingFolder_ = () => folder;
    ctx.allocateId_ = () => 'BRD-SERVER-0001';
    ctx.nowIso_ = () => '2026-07-13T14:15:16+08:00';
    ctx.appendObject_ = (_sheet, row) => { rows.push({ ...row, _row: rows.length + 2 }); };
    ctx.audit_ = () => {};
    ctx.recordIdempotency_ = (_key, result) => result;
    const result = ctx.uploadBrandingAsset_({
      brandingVersionId: 'CLIENT-OWNED-ID', assetKey: 'WORDMARK', displayName: 'Official wordmark',
      altText: 'HAU USC wordmark', mimeType: 'image/png', originalFileName: 'wordmark.png',
      widthPx: 7, heightPx: 5, base64: Buffer.from(bytes).toString('base64'), clientRequestId: 'branding-1',
    }, 'COR-1');
    expect(rows[0]).toMatchObject({ Branding_Version_ID: 'BRD-SERVER-0001', Width_Px: 7, Height_Px: 5, Version_Number: 1 });
    expect(result.brandingVersionId).toBe('BRD-SERVER-0001');
    expect(JSON.stringify(result)).not.toMatch(/Drive_|drive.invalid|CLIENT-OWNED/i);
  });

  it('rejects unverified activation metadata and always retains the built-in fallback DTO', () => {
    const ctx = brandingContext();
    expect(() => ctx.verifyBrandingStoredRow_({ Branding_Version_ID: 'BRD-1', Mime_Type: 'image/png', File_Extension: 'png' })).toThrow(expect.objectContaining({ code: 'BRANDING_STORAGE_REQUIRED' }));
    const publicState = ctx.getBrandingState_();
    expect(publicState).toMatchObject({ fallbackRequired: true });
    expect(publicState.branding[0]).toMatchObject({ useFallback: true, fallbackKey: 'BUILT_IN_WORDMARK' });
    expect(JSON.stringify(publicState)).not.toMatch(/Drive|SHA256|https?:\/\//i);
  });

  it('rejects declared branding dimensions that differ from verified bytes before creating a file', () => {
    const ctx = brandingContext();
    let created = 0;
    const folder = new FakeFolder('branding-folder-12345678901', 'Branding');
    folder.createFile = () => { created += 1; throw new Error('must not create'); };
    ctx.withScriptLock_ = (operation) => operation();
    ctx.requirePermission_ = () => ({ User_ID: 'USR-ADMIN' });
    ctx.idempotencyReplay_ = () => null;
    ctx.adminRows_ = () => [];
    ctx.brandingFolder_ = () => folder;
    expect(() => ctx.uploadBrandingAsset_({
      assetKey: 'WORDMARK', displayName: 'Official wordmark', altText: 'HAU USC wordmark',
      mimeType: 'image/png', originalFileName: 'wordmark.png', widthPx: 99, heightPx: 5,
      base64: Buffer.from(pngBytes(7, 5)).toString('base64'), clientRequestId: 'branding-2',
    }, 'COR-2')).toThrow(expect.objectContaining({ code: 'BRANDING_DIMENSIONS_MISMATCH' }));
    expect(created).toBe(0);
  });
});
