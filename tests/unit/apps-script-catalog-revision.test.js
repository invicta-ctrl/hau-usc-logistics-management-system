import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

function gasContext(files) {
  const context = vm.createContext({
    console, Object, JSON, Date, Math, isFinite, isNaN, Error,
    Utilities: { formatDate: () => '2026-07-13T12:00:00+08:00', getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
  });
  for (const file of files) vm.runInContext(readFileSync(resolve(import.meta.dirname, '../../apps-script', file), 'utf8'), context, { filename:file });
  return context;
}

describe('catalog schema and permission migration', () => {
  const ctx = gasContext(['Config.gs', 'Validation.gs', 'Auth.gs', 'ItemRepository.gs']);

  it('appends catalog fields without moving legacy item or user fields', () => {
    expect(Array.from(ctx.HAU_HEADERS['01_ITEM_MASTER']).slice(0, 20)).toEqual([
      'Item_ID','Item_Name','Aliases','Category','Stock_Area','Handling','Unit','Opening_Qty','Reserved_Qty','Available_To_Promise','Status','Legacy_Source_Sheet','Legacy_Source_Row','Legacy_Source_Block','Verification_Note','_Helper_Name','_Helper_Qty','_Helper_Unit','_Helper_Row','_Helper_Block',
    ]);
    expect(Array.from(ctx.HAU_HEADERS['01_ITEM_MASTER']).slice(20)).toEqual([
      'Catalog_Type','Storage_Location','Reorder_Threshold','Lending_Audience','Default_Loan_Days','Maximum_Loan_Qty','Approval_Required','Updated_At','Updated_By','Notes',
    ]);
    expect(Array.from(ctx.HAU_HEADERS['14_USERS_ACCESS']).at(-1)).toBe('Can_Manage_Catalog');
    expect(ctx.HAU_CONFIG.SCHEMA_VERSION).toBe('1.2.0');
  });

  it('uses least-privilege catalog permission fallback', () => {
    expect(ctx.canPermission_({ Role:'ADMIN', Active:true }, 'Can_Manage_Catalog')).toBe(true);
    expect(ctx.canPermission_({ Role:'DOL_DIRECTOR', Active:true }, 'Can_Manage_Catalog')).toBe(true);
    expect(ctx.canPermission_({ Role:'DOL_STAFF', Active:true }, 'Can_Manage_Catalog')).toBe(false);
    expect(ctx.canPermission_({ Role:'DOL_STAFF', Active:true, Can_Manage_Catalog:true }, 'Can_Manage_Catalog')).toBe(true);
  });

  it('derives conservative blank-field migration defaults', () => {
    ctx.nowIso_ = () => '2026-07-13T12:00:00+08:00';
    expect(ctx.catalogItemDefaults_({ Status:'ACTIVE', Handling:'Loanable', Stock_Area:'Inventory' }, { User_ID:'USR-1' })).toMatchObject({
      Lending_Audience:'USC_STAFF_ONLY', Default_Loan_Days:3, Maximum_Loan_Qty:1, Approval_Required:true,
    });
    expect(ctx.catalogItemDefaults_({ Status:'VERIFY', Handling:'Consumable', Stock_Area:'Pantry' }, { User_ID:'USR-1' })).toMatchObject({
      Catalog_Type:'PANTRY', Lending_Audience:'NOT_AVAILABLE_FOR_LENDING',
    });
  });
});

describe('data revision mutation guard', () => {
  it('touches once for nested idempotency records and never for reads or replays', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'DataRevisionService.gs', 'AuditService.gs']);
    let touches = 0;
    ctx.correlationId_ = () => 'COR-1';
    ctx.clientSafeValue_ = (value) => value;
    ctx.audit_ = () => ({});
    ctx.touchDataRevision_ = () => ({ revision:++touches, updatedAt:'now', environment:'STAGING' });
    ctx.withScriptLock_ = (fn) => fn();
    const result = ctx.guardMutationApi_('compound', {}, () => {
      ctx.recordIdempotency_('nested', { nested:true }, { User_ID:'USR-1' }, 'COR-1');
      return ctx.recordIdempotency_('outer', { complete:true }, { User_ID:'USR-1' }, 'COR-1');
    });
    expect(result.ok).toBe(true);
    expect(result.dataRevision).toBe(1);
    expect(touches).toBe(1);
    ctx.guardMutationApi_('replay', {}, () => ({ idempotentReplay:true }));
    expect(touches).toBe(1);
    ctx.getDataRevision_ = () => ({ revision:1, updatedAt:'now', environment:'STAGING' });
    expect(ctx.api_getDataRevision().revision).toBe(1);
    expect(touches).toBe(1);
  });
});

describe('server lending policy', () => {
  const ctx = gasContext(['Config.gs', 'Validation.gs', 'ItemRepository.gs', 'LendingService.gs']);
  const base = { Item_ID:'ITM-1', Item_Name:'Extension Cord', Status:'ACTIVE', Handling:'LOANABLE', Unit:'piece', Lending_Audience:'USC_STAFF_ONLY', Maximum_Loan_Qty:2 };
  ctx.availableToPromise_ = () => 5;
  ctx.onHand_ = () => 5;

  it('enforces audience, quantity, verification, and due-date rules with stable codes', () => {
    expect(() => ctx.validateLendingPolicy_(base, { borrowerType:'ANGELITE', quantity:1, dueAt:'2099-01-01' }, { Role:'DOL_STAFF' }, 'AVAILABLE_TO_PROMISE')).toThrow(expect.objectContaining({ code:'BORROWER_NOT_ELIGIBLE' }));
    expect(() => ctx.validateLendingPolicy_(base, { borrowerType:'USC_STAFF', quantity:3, dueAt:'2099-01-01' }, { Role:'DOL_STAFF' }, 'AVAILABLE_TO_PROMISE')).toThrow(expect.objectContaining({ code:'MAXIMUM_LENDING_QUANTITY_EXCEEDED' }));
    expect(() => ctx.validateLendingPolicy_(base, { borrowerType:'USC_STAFF', quantity:1 }, { Role:'DOL_STAFF' }, 'AVAILABLE_TO_PROMISE')).toThrow(expect.objectContaining({ code:'DUE_DATE_REQUIRED' }));
    expect(() => ctx.validateLendingPolicy_({ ...base, Status:'VERIFY' }, { borrowerType:'USC_STAFF', quantity:1, dueAt:'2099-01-01' }, { Role:'DOL_STAFF' }, 'AVAILABLE_TO_PROMISE')).toThrow(expect.objectContaining({ code:'ITEM_REQUIRES_VERIFICATION' }));
  });

  it('allows student-and-staff circulation and keeps consumables return-free', () => {
    const policy = ctx.validateLendingPolicy_({ ...base, Handling:'Consumable', Lending_Audience:'STUDENTS_AND_STAFF', Maximum_Loan_Qty:5 }, { borrowerType:'ANGELITE', quantity:1 }, { Role:'REQUESTER' }, 'AVAILABLE_TO_PROMISE');
    expect(policy).toMatchObject({ handling:'CONSUMABLE', returnable:false, borrowerType:'ANGELITE' });
  });
});

describe('catalog dependency protections', () => {
  it('blocks unit rewrites and archive when historical or active records exist', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'ItemRepository.gs']);
    ctx.unitDependencySummary_ = () => ({ ledger:1, reservations:0, lendingTickets:0, requestLines:0, restockRecords:0, releaseRecords:0 });
    expect(() => ctx.assertUnitChangeAllowed_({ Item_ID:'ITM-1', Unit:'piece' }, 'box')).toThrow(expect.objectContaining({ code:'UNIT_CHANGE_BLOCKED' }));
    ctx.onHand_ = () => 1;
    ctx.reservedQuantity_ = () => 0;
    ctx.findAll_ = () => [];
    expect(ctx.archiveDependencySummary_('ITM-1')).toMatchObject({ onHand:1, activeReservations:0 });
  });
});

describe('bootstrap privacy boundary', () => {
  function bootstrapContext(user) {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'Auth.gs', 'ItemRepository.gs', 'InventoryService.gs']);
    ctx.resolveCurrentUser_ = () => user;
    ctx.resolveRuntimeConfig_ = () => ({ environment:'STAGING' });
    ctx.getConfigValue_ = () => 'STAGING';
    ctx.userPermissionsDto_ = () => ({ review:false, release:false, receive:false, admin:false, manageCatalog:false });
    ctx.getDataRevision_ = () => ({ revision:7, updatedAt:'now', environment:'STAGING' });
    ctx.readObjects_ = (sheet) => {
      if (sheet === ctx.HAU_SHEETS.ITEMS) return [{ Item_ID:'ITM-1', Item_Name:'Paper', Aliases:'copy', Category:'Office', Stock_Area:'Inventory', Handling:'Consumable', Unit:'ream', Status:'ACTIVE', Opening_Qty:99, Lending_Audience:'USC_STAFF_ONLY' }];
      return [];
    };
    return ctx;
  }

  it.each([
    { User_ID:'PUBLIC', Role:'REQUESTER', Active:true },
    { User_ID:'USR-REQUESTER', Role:'REQUESTER', Active:true },
  ])('forces sanitized bootstrap when requestOnly=false for $User_ID', (user) => {
    const result = bootstrapContext(user).getBootstrapData_({ requestOnly:false });
    expect(result.catalogAvailabilityProtected).toBe(true);
    expect(result.currentUser.role).toBe('REQUESTER');
    expect(result.inventoryItems[0]).not.toHaveProperty('openingOnHand');
    expect(result).not.toHaveProperty('dataRevision');
    expect(result.auditLog).toEqual([]);
  });

  it('preserves internal bootstrap for an authorized non-requester user', () => {
    const result = bootstrapContext({ User_ID:'USR-DOL', Role:'READ_ONLY_AUDITOR', Active:true }).getBootstrapData_({ requestOnly:false });
    expect(result.catalogAvailabilityProtected).toBe(false);
    expect(result.dataRevision).toBe(7);
    expect(result.currentUser.role).toBe('READ_ONLY_AUDITOR');
    expect(result.inventoryItems[0]).toHaveProperty('openingOnHand', 99);
  });
});

describe('catalog opening-stock authorization', () => {
  const ctx = gasContext(['Config.gs', 'Validation.gs', 'Auth.gs', 'ItemRepository.gs', 'InventoryService.gs']);
  const active = { Item_ID:'ITM-1', Status:'ACTIVE' };

  it('rejects catalog-only opening stock', () => {
    expect(() => ctx.permittedInitialCatalogQuantity_({ initialQuantity:5 }, { Role:'REQUESTER', Active:true, Can_Manage_Catalog:true }, active)).toThrow(expect.objectContaining({ code:'FORBIDDEN' }));
  });

  it('allows existing receive/admin authorization only for active items', () => {
    expect(ctx.permittedInitialCatalogQuantity_({ initialQuantity:2 }, { Role:'DOL_STAFF', Active:true }, active)).toBe(2);
    expect(() => ctx.permittedInitialCatalogQuantity_({ initialQuantity:2 }, { Role:'ADMIN', Active:true }, { Item_ID:'ITM-2', Status:'VERIFY' })).toThrow(expect.objectContaining({ code:'ITEM_REQUIRES_VERIFICATION' }));
    expect(() => ctx.permittedInitialCatalogQuantity_({ initialQuantity:2 }, { Role:'ADMIN', Active:true }, { Item_ID:'ITM-3', Status:'INACTIVE' })).toThrow(expect.objectContaining({ code:'ITEM_INACTIVE' }));
  });
});

describe('migration and access revision lifecycle', () => {
  it('touches once for an applied migration and never for dry/no-op work', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'MigrationService.gs']);
    let touches = 0;
    ctx.guardApi_ = (_name, _command, fn) => fn('COR-1');
    ctx.withScriptLock_ = (fn) => fn();
    ctx.requirePermission_ = () => ({ User_ID:'USR-ADMIN' });
    ctx.getConfigValue_ = () => '';
    ctx.migrationDryRun_ = () => ({ itemMasterRecords:1, verifyItems:[] });
    ctx.touchDataRevision_ = () => ({ revision:++touches });
    ctx.readObjects_ = () => [];
    expect(ctx.applyApprovedMigration()).toMatchObject({ noChanges:true, appliedCount:0 });
    expect(touches).toBe(0);
    expect(ctx.runMigrationDryRun()).toMatchObject({ itemMasterRecords:1 });
    expect(touches).toBe(0);

    ctx.readObjects_ = (sheet) => sheet === ctx.HAU_SHEETS.MIGRATION ? [{ Migration_Status:'APPROVED', New_Item_ID:'ITM-1', _row:2, Verification_Status:'VERIFIED' }] : [];
    ctx.findOne_ = () => ({ Item_ID:'ITM-1', Item_Name:'Paper', Aliases:'', Status:'VERIFY', Verification_Note:'', _row:2 });
    ctx.updateObject_ = () => ({});
    ctx.setConfigValue_ = () => ({});
    ctx.audit_ = () => ({});
    ctx.nowIso_ = () => 'now';
    expect(ctx.applyApprovedMigration()).toMatchObject({ appliedCount:1, dataRevision:{ revision:1 } });
    expect(touches).toBe(1);
  });

  it('touches access seeding once only when at least one user is added', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'Auth.gs', 'Setup.gs']);
    let touches = 0;
    ctx.guardApi_ = (_name, _command, fn) => fn('COR-1');
    ctx.withScriptLock_ = (fn) => fn();
    ctx.setupUser_ = () => ({ User_ID:'USR-ADMIN' });
    ctx.allocateId_ = () => 'USR-NEW';
    ctx.appendObject_ = () => ({});
    ctx.audit_ = () => ({});
    ctx.nowIso_ = () => 'now';
    ctx.touchDataRevision_ = () => ({ revision:++touches });
    ctx.findAll_ = () => [];
    expect(ctx.seedRolesAndPermissions([{ email:'new@example.com', role:'READ_ONLY_AUDITOR' }])).toMatchObject({ added:['USR-NEW'], dataRevision:{ revision:1 } });
    expect(touches).toBe(1);
    ctx.findAll_ = () => [{ Email:'new@example.com' }];
    expect(ctx.seedRolesAndPermissions([{ email:'new@example.com', role:'READ_ONLY_AUDITOR' }])).toMatchObject({ added:[], dataRevision:null });
    expect(touches).toBe(1);
  });
});
