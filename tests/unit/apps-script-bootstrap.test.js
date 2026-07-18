import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const appScriptRoot = resolve(import.meta.dirname, '../../apps-script');

function sheet(name, headers, rows = []) {
  const valuesFor = (row, width) => headers.slice(0, width).map((header) => row[header] ?? '');
  let dataRangeReads = 0;
  return {
    getName: () => name,
    get dataRangeReads() { return dataRangeReads; },
    getLastColumn: () => headers.length,
    getLastRow: () => rows.length + 1,
    getDataRange() {
      dataRangeReads += 1;
      const values = [headers, ...rows.map((item) => valuesFor(item, headers.length))];
      return { getValues: () => values };
    },
    getRange(row, _column, rowCount, columnCount) {
      const values = row === 1
        ? [headers.slice(0, columnCount)]
        : rows.slice(row - 2, row - 2 + rowCount).map((item) => valuesFor(item, columnCount));
      return {
        getDisplayValues: () => values.map((line) => line.map((value) => String(value))),
        getValues: () => values,
      };
    },
  };
}

function gasContext() {
  const sharedCache = new Map();
  const properties = new Map([
    ['HAU_ENVIRONMENT', 'STAGING'],
    ['HAU_SPREADSHEET_ID', 'SYNTHETIC-SPREADSHEET-ID-0001'],
    ['HAU_BACKUP_SPREADSHEET_ID', 'SYNTHETIC-BACKUP-ID-0001'],
  ]);
  const database = new Map([
    ['14_USERS_ACCESS', sheet('14_USERS_ACCESS', ['User_ID', 'Email', 'Display_Name', 'Role', 'Committee', 'Active', 'Can_Review', 'Can_Release', 'Can_Receive', 'Can_Admin', 'Can_Manage_Catalog'], [{
      User_ID: 'SYNTHETIC-USER-001', Email: 'synthetic.operator@example.invalid', Display_Name: 'Synthetic Operator', Role: 'ADMIN', Committee: '', Active: true,
    }])],
    ['17_CONFIG', sheet('17_CONFIG', ['Key', 'Value'], [{ Key: 'DATA_REVISION', Value: 7 }, { Key: 'DATA_REVISION_UPDATED_AT', Value: '2026-07-14T08:00:00Z' }])],
    ['13_EVENTS', sheet('13_EVENTS', ['Event_ID', 'Event_Series_ID', 'Series_Code', 'Event_Series_Name', 'Event_Name', 'Start_At', 'End_At', 'Venue', 'Owner_Committee', 'Department', 'Status'], [{
      Event_ID: 'SYNTHETIC-EVENT-001', Event_Series_ID: 'SYNTHETIC-SERIES-001', Series_Code: 'SYN-001', Event_Series_Name: 'Synthetic Series', Event_Name: 'Synthetic Event', Start_At: '2026-07-20T08:00:00Z', End_At: '2026-07-20T09:00:00Z', Venue: 'Synthetic Venue', Owner_Committee: 'Synthetic Committee', Status: 'ACTIVE',
    }, {
      Event_ID: 'SYNTHETIC-EVENT-002', Event_Series_ID: 'SYNTHETIC-SERIES-002', Series_Code: 'SYN-002', Event_Series_Name: 'Other Series', Event_Name: 'Other Event', Start_At: '2026-07-21T08:00:00Z', End_At: '2026-07-21T09:00:00Z', Venue: 'Other Venue', Owner_Committee: 'Other Committee', Status: 'ACTIVE',
    }])],
    ['01_ITEM_MASTER', sheet('01_ITEM_MASTER', ['Item_ID', 'Item_Name', 'Aliases', 'Category', 'Stock_Area', 'Handling', 'Unit', 'Status'], [{
      Item_ID: 'SYNTHETIC-ITEM-001', Item_Name: 'Synthetic Item', Aliases: 'synthetic', Category: 'Office Supplies', Stock_Area: 'Inventory', Handling: 'Consumable', Unit: 'piece', Status: 'ACTIVE',
    }])],
    ['EMPTY', sheet('EMPTY', ['Synthetic_Key'])],
  ]);
  const context = vm.createContext({
    console,
    Object,
    JSON,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Error,
    isFinite,
    Utilities: {
      formatDate: () => '2026-07-14T08:00:00Z',
      getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (key) => properties.get(key) ?? null,
      setProperty: (key, value) => properties.set(key, String(value)),
    }) },
    CacheService: { getScriptCache: () => ({
      get: (key) => sharedCache.get(key) ?? null,
      put: (key, value) => sharedCache.set(key, String(value)),
    }) },
    Session: { getActiveUser: () => ({ getEmail: () => 'synthetic.operator@example.invalid' }) },
  });
  for (const file of ['Config.gs', 'Validation.gs', 'Auth.gs', 'SheetRepository.gs', 'DataRevisionService.gs', 'ItemRepository.gs', 'InventoryService.gs', 'BootstrapService.gs']) {
    vm.runInContext(readFileSync(resolve(appScriptRoot, file), 'utf8'), context, { filename: file });
  }
  context.getDatabase_ = () => ({ getSheetByName: (name) => database.get(name) ?? null });
  return context;
}

describe('Apps Script essential bootstrap recovery contract', () => {
  it('deduplicates repeated sheet reads, including empty sheets, within one request', () => {
    const context = gasContext();
    let observed;
    context.withRequestReadCache_((stats) => {
      context.readObjects_('EMPTY');
      context.readObjects_('EMPTY');
      observed = { ...stats };
    });

    expect(observed).toEqual({ readCount: 1, cacheHits: 1 });
  });

  it('reads a complete sheet through one values service call', () => {
    const context = gasContext();
    const target = context.getDatabase_().getSheetByName('01_ITEM_MASTER');

    expect(context.readObjects_('01_ITEM_MASTER')).toHaveLength(1);
    expect(target.dataRangeReads).toBe(1);
  });

  it('reuses revision-keyed sheet rows across bootstrap requests', () => {
    const context = gasContext();
    const target = context.getDatabase_().getSheetByName('01_ITEM_MASTER');
    const stats = [];
    for (let request = 0; request < 2; request += 1) {
      context.withRequestReadCache_((current) => {
        context.setSharedReadCacheRevision_(7);
        expect(context.readObjects_('01_ITEM_MASTER')).toHaveLength(1);
        stats.push({ ...current });
      });
    }

    expect(target.dataRangeReads).toBe(1);
    expect(stats).toEqual([{ readCount: 1, cacheHits: 0 }, { readCount: 0, cacheHits: 1 }]);
  });

  it('returns a sanitized essential DTO with bounded read metrics', () => {
    const context = gasContext();
    const response = context.apiEssentialBootstrapData_({ requestOnly: false });

    expect(response.contract).toBe('essential-bootstrap');
    expect(response.requestOnly).toBe(false);
    expect(response.currentUser).toEqual(expect.objectContaining({ id: 'SYNTHETIC-USER-001', role: 'ADMIN' }));
    expect(response.metrics).toEqual(expect.objectContaining({ readCount: 2, cacheHits: 1 }));
    expect(response.metrics.payloadBytes).toBeGreaterThan(0);
    expect(response.metrics.payloadBytes).toBeLessThanOrEqual(100 * 1024);
    expect(response.metrics.payloadBytes).toBe(Buffer.byteLength(JSON.stringify(response), 'utf8'));
    expect(Object.keys(response)).not.toContain('email');
    expect(JSON.stringify(response)).not.toMatch(/spreadsheet|operator@example|private|ledger|audit|roster/i);
  });

  it('mirrors the revision privately so later essential reads avoid the config sheet', () => {
    const context = gasContext();
    const configSheet = context.getDatabase_().getSheetByName('17_CONFIG');

    expect(context.apiEssentialBootstrapData_({ requestOnly: false }).revision.revision).toBe(7);
    expect(context.apiEssentialBootstrapData_({ requestOnly: false }).revision.revision).toBe(7);
    expect(configSheet.dataRangeReads).toBe(1);
  });

  it('serves the request module with safe public rows and rejects protected modules for request-only sessions', () => {
    const context = gasContext();
    const internalResponse = context.apiGetBootstrapModule_({ requestOnly: false, module: 'request', page: 1, pageSize: 1 });
    expect(internalResponse.cache).toEqual({ safe: false, scope: 'SESSION_OPERATIONAL', ttlMs: 0 });
    const response = context.apiGetBootstrapModule_({ requestOnly: true, module: 'request', page: 1, pageSize: 1 });

    expect(response.module).toBe('request');
    expect(response.requestOnly).toBe(true);
    expect(response.scopeRevision).toBeNull();
    expect(response.data.inventoryItems).toHaveLength(1);
    expect(response.data.inventoryItems[0]).toEqual(expect.objectContaining({ availabilityProtected: true }));
    const filteredResponse = context.apiGetBootstrapModule_({ requestOnly: true, module: 'request', filter: 'ACTIVE', page: 1, pageSize: 1 });
    expect(filteredResponse.data.inventoryItems).toHaveLength(1);
    expect(JSON.stringify(response)).not.toMatch(/email|student|contact|tin|drive|ledger|audit|roster/i);
    expect(() => context.apiGetBootstrapModule_({ requestOnly: true, module: 'inventory' })).toThrow(/not available/i);
    expect(() => context.apiGetBootstrapModule_({ requestOnly: true, module: 'request', page: 0 })).toThrow(/page/i);
    expect(() => context.apiGetBootstrapModule_({ requestOnly: true, module: 'request', pageSize: 51 })).toThrow(/page size/i);
  });

  it('reuses a revision-and-authorization-keyed module response', () => {
    const context = gasContext();
    const command = { requestOnly: false, module: 'request', page: 1, pageSize: 1 };
    const first = context.apiGetBootstrapModule_(command);
    const second = context.apiGetBootstrapModule_(command);

    expect(first.data).toEqual(second.data);
    expect(second.metrics.cacheHits).toBeGreaterThanOrEqual(first.metrics.cacheHits);
    expect(second.metrics.readCount).toBeLessThan(first.metrics.readCount);
  });

  it('applies server-side entity scope before pagination and query results', () => {
    const context = gasContext();
    context.resolveRequesterUser_ = () => ({
      User_ID: 'SYNTHETIC-COMMITTEE-USER',
      Display_Name: 'Synthetic Committee User',
      Role: 'COMMITTEE_HEAD',
      Committee: 'Synthetic Committee',
      Active: true,
      Can_Review: true,
    });

    const response = context.apiGetBootstrapModule_({ requestOnly: false, module: 'request', query: 'ACTIVE', page: 1, pageSize: 1 });

    expect(response.pagination).toEqual(expect.objectContaining({ page: 1, pageSize: 1 }));
    expect(response.data.events).toHaveLength(1);
    expect(response.data.events[0].name).toBe('Synthetic Event');
    expect(response.metrics.payloadBytes).toBeLessThanOrEqual(100 * 1024);
  });
});
