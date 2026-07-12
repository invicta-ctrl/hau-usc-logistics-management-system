import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

function gasContext(files) {
  const properties = new Map();
  const context = vm.createContext({
    console,
    Object,
    JSON,
    Date,
    Math,
    isFinite,
    Error,
    Utilities: {
      formatDate: (_date, _timezone, pattern) => (pattern === 'yyyy' ? '2026' : '20260712-143605'),
      getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => properties.get(key) ?? null,
        setProperty: (key, value) => properties.set(key, value),
      }),
    },
  });
  for (const file of files) vm.runInContext(readFileSync(resolve(import.meta.dirname, '../../apps-script', file), 'utf8'), context, { filename: file });
  return context;
}

describe('Apps Script evidence rules', () => {
  const ctx = gasContext(['Config.gs', 'Validation.gs', 'DriveService.gs', 'EvidenceService.gs']);
  it('generates a normalized privacy-safe filename', () => {
    const filename = ctx.normalizedEvidenceFilename_({ evidenceType: 'RESTOCK_RECEIPT', mimeType: 'image/jpeg', relatedEntityId: 'RST-2026-0001', itemId: 'ITM-0064' }, 'EVD-2026-0012', new Date());
    expect(filename).toMatch(/^RST-RCPT_RST-2026-0001_ITM-0064_\d{8}-\d{6}_EVD-2026-0012\.jpg$/);
    expect(filename).not.toMatch(/student|borrower|email/i);
  });
  it('generates a human-readable label without borrower personal data', () => {
    const label = ctx.evidenceLabel_({ evidenceType: 'LENDING_RETURN_PHOTO', relatedEntityId: 'LND-2026-0001', itemId: 'ITM-0003', borrowerName: 'Private Name', studentIdNumber: '20260001' }, new Date());
    expect(label).toContain('Lending Return | LND-2026-0001 | ITM-0003');
    expect(label).not.toContain('Private Name');
    expect(label).not.toContain('20260001');
  });
  it('rejects MIME and extension mismatches', () => expect(() => ctx.validateEvidencePayload_({ evidenceType: 'CANVASS_QUOTE', mimeType: 'application/pdf', originalFileName: 'quote.html', relatedEntityId: 'CAN-1' })).toThrow(/extension/i));
  it('fails safely when a required folder ID is missing', () => { ctx.configMap_ = () => ({ DRIVE_RECEIPTS_FOLDER_ID: 'TO_BE_ASSIGNED' }); expect(() => ctx.folderForEvidence_('RESTOCK_RECEIPT')).toThrow(/configuration is missing/i); });
});

describe('Apps Script authorization and migration discovery', () => {
  const auth = gasContext(['Config.gs', 'Validation.gs', 'Auth.gs']);
  const migration = gasContext(['Config.gs', 'Validation.gs', 'MigrationService.gs']);
  it('enforces server-side permission flags', () => {
    expect(auth.canPermission_({ Role: 'REQUESTER', Active: true }, 'Can_Release')).toBe(false);
    expect(auth.canPermission_({ Role: 'DOL_STAFF', Active: true }, 'Can_Release')).toBe(true);
    expect(auth.canPermission_({ Role: 'ADMIN', Active: true }, 'Can_Admin')).toBe(true);
  });
  it('blocks inactive users even when a permission flag is present', () => {
    expect(auth.canPermission_({ Role: 'DOL_STAFF', Active: false, Can_Release: true }, 'Can_Release')).toBe(false);
  });
  it('preserves source row/block and flags date-serial quantities', () => {
    const values = [['PANTRY'], ['ITEM', 'QTY.', 'UNIT'], ['All Purpose Flour', 46026, 'kilo'], ['Salt', 2, 'kilo']];
    const rows = migration.scanLegacyInventoryRows_(values);
    expect(rows).toEqual([
      expect.objectContaining({ legacyRow: 3, legacyBlock: 'A-C', legacyItemName: 'All Purpose Flour', legacyQty: 46026, verificationStatus: 'VERIFY' }),
      expect.objectContaining({ legacyRow: 4, legacyBlock: 'A-C', legacyItemName: 'Salt', legacyQty: 2, verificationStatus: 'PENDING' }),
    ]);
  });
});

describe('Apps Script production ID allocation', () => {
  const ids = gasContext(['Config.gs', 'IdService.gs']);
  it('allocates different transaction IDs for paired movements', () => {
    const outId = ids.allocateId_('TXN');
    const inId = ids.allocateId_('TXN');
    expect(outId).not.toBe(inId);
    expect(outId).toMatch(/^TXN-2026-0001$/);
    expect(inId).toMatch(/^TXN-2026-0002$/);
  });
});
