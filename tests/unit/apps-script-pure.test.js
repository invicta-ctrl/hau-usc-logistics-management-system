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

function setRuntimeProperties(context, values) {
  const properties = context.PropertiesService.getScriptProperties();
  for (const [key, value] of Object.entries(values)) properties.setProperty(key, value);
}

describe('Apps Script runtime configuration isolation', () => {
  it('fails closed when required Script Properties are missing', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs']);
    expect(() => ctx.resolveRuntimeConfig_()).toThrow(/HAU_ENVIRONMENT/);
  });

  it('resolves an explicit staging target', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs']);
    setRuntimeProperties(ctx, {
      HAU_ENVIRONMENT: 'staging',
      HAU_SPREADSHEET_ID: 'staging-sheet-id-1234567890',
      HAU_BACKUP_SPREADSHEET_ID: 'staging-backup-id-1234567890',
    });
    const runtime = ctx.resolveRuntimeConfig_();
    expect(runtime.environment).toBe('STAGING');
    expect(runtime.spreadsheetId).toBe('staging-sheet-id-1234567890');
    expect(runtime.backupSpreadsheetId).toBe('staging-backup-id-1234567890');
  });

  it('resolves an explicit production target', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs']);
    setRuntimeProperties(ctx, {
      HAU_ENVIRONMENT: 'PRODUCTION',
      HAU_SPREADSHEET_ID: 'production-sheet-id-1234567890',
      HAU_BACKUP_SPREADSHEET_ID: 'production-backup-id-1234567890',
    });
    expect(ctx.resolveRuntimeConfig_().environment).toBe('PRODUCTION');
  });

  it('defaults to the legacy bootstrap and accepts an explicit v2 rollout flag', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs']);
    setRuntimeProperties(ctx, {
      HAU_ENVIRONMENT: 'STAGING',
      HAU_SPREADSHEET_ID: 'staging-sheet-id-1234567890',
      HAU_BACKUP_SPREADSHEET_ID: 'staging-backup-id-1234567890',
    });
    expect(ctx.resolveRuntimeConfig_().bootstrapContractVersion).toBe(1);
    setRuntimeProperties(ctx, { HAU_BOOTSTRAP_CONTRACT_VERSION: '2' });
    expect(ctx.resolveRuntimeConfig_().bootstrapContractVersion).toBe(2);
    setRuntimeProperties(ctx, { HAU_BOOTSTRAP_CONTRACT_VERSION: '3' });
    expect(() => ctx.resolveRuntimeConfig_()).toThrow(/1 or 2/);
  });

  it('has no hardcoded spreadsheet fallback and rejects placeholders', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs']);
    expect(ctx.HAU_CONFIG.SPREADSHEET_ID).toBeUndefined();
    expect(ctx.HAU_CONFIG.BACKUP_SPREADSHEET_ID).toBeUndefined();
    setRuntimeProperties(ctx, {
      HAU_ENVIRONMENT: 'STAGING',
      HAU_SPREADSHEET_ID: 'TO_BE_ASSIGNED',
      HAU_BACKUP_SPREADSHEET_ID: 'REPLACE_WITH_BACKUP_SPREADSHEET_ID',
    });
    expect(() => ctx.resolveRuntimeConfig_()).toThrow(/missing or unresolved/i);
  });
});

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
  it('requires receive, release, or admin permission before evidence upload', () => {
    expect(ctx.evidencePermissionForType_('RESTOCK_RECEIPT')).toBe('Can_Receive');
    expect(ctx.evidencePermissionForType_('LENDING_RETURN_PHOTO')).toBe('Can_Release');
    expect(ctx.evidencePermissionForType_('OTHER_SUPPORTING_DOCUMENT')).toBe('Can_Admin');
    ctx.requirePermission_ = (permission) => {
      if (permission !== 'Can_Receive') throw new Error('FORBIDDEN');
      return { User_ID: 'USR-1' };
    };
    expect(ctx.authorizeEvidenceUpload_('RESTOCK_RECEIPT').User_ID).toBe('USR-1');
    expect(() => ctx.authorizeEvidenceUpload_('RELEASE_CONFIRMATION_PHOTO')).toThrow(/FORBIDDEN/);
  });
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
  it('removes quantities, reservations, and legacy trace fields from requester catalog records', () => {
    const inventory = gasContext(['Config.gs', 'Validation.gs', 'InventoryService.gs']);
    const item = inventory.requesterItemDto_({
      Item_ID: 'ITM-0001', Item_Name: 'Paper', Aliases: 'copy|a4', Category: 'OFFICE_SUPPLIES',
      Stock_Area: 'Inventory', Handling: 'Consumable', Unit: 'ream', Status: 'ACTIVE',
      Opening_Qty: 125, Reserved_Qty: 30, Available_To_Promise: 95,
      Legacy_Source_Sheet: 'MAIN INVENTORY', Legacy_Source_Row: 9, Legacy_Source_Block: 'A-C',
    });
    expect(item).toMatchObject({ id: 'ITM-0001', name: 'Paper', unit: 'ream', availabilityProtected: true });
    for (const field of ['openingOnHand', 'onHand', 'reserved', 'availableToPromise', 'legacy', 'verificationNote']) {
      expect(Object.prototype.hasOwnProperty.call(item, field)).toBe(false);
    }
  });
  it('removes internal committee and department data from requester event choices', () => {
    const inventory = gasContext(['Config.gs', 'Validation.gs', 'InventoryService.gs']);
    const event = inventory.requesterEventDto_({ Event_ID: 'EVT-1', Event_Series_ID: 'SER-1', Event_Name: 'Demo', Owner_Committee: 'Internal', Department: 'Private' });
    expect(event.id).toBe('EVT-1');
    expect(Object.prototype.hasOwnProperty.call(event, 'owner')).toBe(false);
    expect(Object.prototype.hasOwnProperty.call(event, 'department')).toBe(false);
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

describe('Apps Script deliverable receiving workflow', () => {
  const procurement = gasContext(['Config.gs', 'Validation.gs', 'ProcurementService.gs']);
  it('receives only after procurement and allows cumulative partial receiving', () => {
    expect(procurement.validateDeliverableReceiptState_('PROCURED')).toBe('PROCURED');
    expect(procurement.validateDeliverableReceiptState_('PARTIALLY_RECEIVED')).toBe('PARTIALLY_RECEIVED');
    expect(() => procurement.validateDeliverableReceiptState_('TO_BE_PROCURED')).toThrowError(
      expect.objectContaining({ code: 'INVALID_TRANSITION' }),
    );
  });
});
