import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const appScriptRoot = resolve(import.meta.dirname, '../../apps-script');

function isoFromNow(offsetMs) {
  return new Date(Date.now() + offsetMs).toISOString();
}

function baseRows() {
  const now = isoFromNow(0);
  return {
    '13_EVENTS': [
      { Event_ID: 'SYN-EVENT-FOOD', Owner_Committee: 'COM_FOOD', Start_At: isoFromNow(2 * 86400000), Status: 'ACTIVE', Updated_At: now },
      { Event_ID: 'SYN-EVENT-MATERIALS', Owner_Committee: 'COM_MATERIALS', Start_At: isoFromNow(3 * 86400000), Status: 'ACTIVE', Updated_At: now },
    ],
    '03_REQUESTS': [
      { Request_ID: 'SYN-REQUEST-FOOD', Event_ID: 'SYN-EVENT-FOOD', Assigned_Committee: 'COM_FOOD', Priority: 'NORMAL', Status: 'FOR_REVIEW', Updated_At: now },
      { Request_ID: 'SYN-REQUEST-MATERIALS', Event_ID: 'SYN-EVENT-MATERIALS', Assigned_Committee: 'COM_MATERIALS', Priority: 'NORMAL', Status: 'FOR_REVIEW', Updated_At: now },
    ],
    '04_REQUEST_LINES': [
      { Request_Line_ID: 'SYN-LINE-FOOD', Request_ID: 'SYN-REQUEST-FOOD', Event_ID: 'SYN-EVENT-FOOD', Needed_At: isoFromNow(-86400000), Status: 'BLOCKED' },
      { Request_Line_ID: 'SYN-LINE-MATERIALS', Request_ID: 'SYN-REQUEST-MATERIALS', Event_ID: 'SYN-EVENT-MATERIALS', Needed_At: isoFromNow(86400000), Status: 'OPEN' },
    ],
    '09_DELIVERABLES': [
      { Deliverable_ID: 'SYN-DELIVERABLE-FOOD', Request_ID: 'SYN-REQUEST-FOOD', Request_Line_ID: 'SYN-LINE-FOOD', Event_ID: 'SYN-EVENT-FOOD', Assigned_Committee: 'COM_FOOD', Assigned_Staff: 'SYN-STAFF', Needed_At: isoFromNow(-86400000), Status: 'OPEN', Evidence_ID: '' },
      { Deliverable_ID: 'SYN-DELIVERABLE-MATERIALS', Request_ID: 'SYN-REQUEST-MATERIALS', Request_Line_ID: 'SYN-LINE-MATERIALS', Event_ID: 'SYN-EVENT-MATERIALS', Assigned_Committee: 'COM_MATERIALS', Assigned_Staff: 'SYN-STAFF', Needed_At: isoFromNow(86400000), Status: 'OPEN', Evidence_ID: '' },
    ],
    '06_LENDING': [
      { Lending_Ticket_ID: 'SYN-LENDING-FOOD', Item_ID: 'SYN-ITEM-001', Due_At: isoFromNow(-86400000), Status: 'ACTIVE', Updated_At: now },
    ],
    '01_ITEM_MASTER': [
      { Item_ID: 'SYN-ITEM-001', Opening_Qty: 2, Reorder_Threshold: 5, Status: 'ACTIVE', Updated_At: now },
    ],
    '08_RESTOCK': [
      { Restock_ID: 'SYN-RESTOCK-001', Item_ID: 'SYN-ITEM-001', Status: 'OPEN', Evidence_ID: '', Updated_At: now },
    ],
    '15_STATUS_HISTORY': [
      { History_ID: 'SYN-HISTORY-001', Entity_Type: 'REQUEST', Entity_ID: 'SYN-REQUEST-FOOD', New_Status: 'FOR_REVIEW', Changed_At: now, Changed_By: 'SYN-ACTOR', Reason: 'Synthetic reason' },
    ],
    '16_AUDIT_LOG': [
      { Audit_ID: 'SYN-AUDIT-001', Entity_Type: 'REQUEST', Entity_ID: 'SYN-REQUEST-FOOD', Action: 'REQUEST_REVIEWED', Created_At: now, Actor_User_ID: 'SYN-ACTOR', Before_JSON: '{"private":"value"}' },
    ],
    '14_USERS_ACCESS': [
      { User_ID: 'SYN-STAFF', Display_Name: 'Synthetic Staff', Active: true, Role_ID: 'DOL_STAFF' },
    ],
    '20_USER_COMMITTEE_SCOPE': [],
    '02_LEDGER': [],
    '05_RESERVATIONS': [],
  };
}

function gasContext({ user, memberships = [], rows = baseRows() } = {}) {
  const properties = new Map([['HAU_AUTHORIZATION_CONTRACT_VERSION', '2']]);
  const database = { ...rows, '20_USER_COMMITTEE_SCOPE': memberships };
  const readCounts = new Map();
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
    isNaN,
    Utilities: { getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties.get(key) ?? null }) },
  });

  for (const file of ['Config.gs', 'Validation.gs', 'Authorization.gs', 'InventoryService.gs', 'CommitteeDashboardService.gs', 'BootstrapService.gs']) {
    vm.runInContext(readFileSync(resolve(appScriptRoot, file), 'utf8'), context, { filename: file });
  }
  context.readObjects_ = (sheetName) => {
    readCounts.set(sheetName, (readCounts.get(sheetName) || 0) + 1);
    return database[sheetName] || [];
  };
  context.resolveRequesterUser_ = () => user;
  context.__readCounts = readCounts;
  return context;
}

const foodHead = { User_ID: 'SYN-FOOD-HEAD', Display_Name: 'Synthetic Food Head', Role_ID: 'COMMITTEE_HEAD', Active: true };
const director = { User_ID: 'SYN-DIRECTOR', Display_Name: 'Synthetic Director', Role_ID: 'DIRECTOR', Active: true };

describe('Apps Script committee dashboard projection', () => {
  it('enforces active committee scope and reconciles queue IDs with counts', () => {
    const context = gasContext({
      user: foodHead,
      memberships: [{ User_ID: foodHead.User_ID, Committee_ID: 'COM_FOOD', Active: true }],
    });
    const response = context.committeeDashboard_({ committeeId: 'COM_FOOD' }, { user: foodHead, internal: true });
    const review = response.queues.find((queue) => queue.id === 'requests-review');

    expect(response.meta[0]).toEqual(expect.objectContaining({ scopeMode: 'COMMITTEE', activeCommitteeId: 'COM_FOOD' }));
    expect([...context.__readCounts.values()].every((count) => count === 1)).toBe(true);
    expect(context.__readCounts.size).toBeLessThanOrEqual(13);
    expect(review).toEqual(expect.objectContaining({ count: 1, recordIds: ['SYN-REQUEST-FOOD'], truncated: false }));
    expect(JSON.stringify(response)).not.toContain('SYN-REQUEST-MATERIALS');
    expect(response.staff[0]).toEqual({ displayName: 'Synthetic Staff', openCount: 1, overdueCount: 1 });
    expect(response.staff[0]).not.toHaveProperty('userId');
    expect(response.activity[0]).not.toHaveProperty('actor');
    expect(response.activity[0]).not.toHaveProperty('reason');
    expect(response.activity.some((entry) => entry.id === 'SYN-AUDIT-001')).toBe(true);
    expect(JSON.stringify(response)).not.toContain('private');
    expect(() => context.committeeDashboard_({ committeeId: 'COM_MATERIALS' }, { user: foodHead, internal: true })).toThrow(/outside.*scope/i);
  });

  it('gives Director all-committee oversight while preserving an explicit active context', () => {
    const context = gasContext({ user: director });
    const all = context.committeeDashboard_({}, { user: director, internal: true });
    const food = context.committeeDashboard_({ committeeId: 'COM_FOOD' }, { user: director, internal: true });
    const allReview = all.queues.find((queue) => queue.id === 'requests-review');
    const foodReview = food.queues.find((queue) => queue.id === 'requests-review');

    expect(all.meta[0]).toEqual(expect.objectContaining({ scopeMode: 'ALL', activeCommitteeId: '' }));
    expect(allReview.count).toBe(2);
    expect(new Set(allReview.recordIds).size).toBe(allReview.count);
    expect(food.meta[0].activeCommitteeId).toBe('COM_FOOD');
    expect(foodReview).toEqual(expect.objectContaining({ count: 1, recordIds: ['SYN-REQUEST-FOOD'] }));
    expect(food.queues.find((queue) => queue.id === 'inventory-attention').count).toBe(0);
    const inventory = context.committeeDashboard_({ committeeId: 'COM_INVENTORY_PANTRY' }, { user: director, internal: true });
    expect(inventory.queues.find((queue) => queue.id === 'inventory-attention').count).toBe(1);
  });

  it('keeps high-volume queues exact but bounds returned identifiers', () => {
    const rows = baseRows();
    rows['13_EVENTS'] = [];
    rows['03_REQUESTS'] = Array.from({ length: 150 }, (_, index) => ({
      Request_ID: `SYN-BULK-${String(index + 1).padStart(3, '0')}`,
      Assigned_Committee: 'COM_FOOD',
      Status: 'FOR_REVIEW',
    }));
    rows['04_REQUEST_LINES'] = [];
    rows['09_DELIVERABLES'] = [];
    const context = gasContext({ user: director, rows });
    const response = context.committeeDashboard_({}, { user: director, internal: true });
    const review = response.queues.find((queue) => queue.id === 'requests-review');

    expect(review.count).toBe(150);
    expect(review.recordIds).toHaveLength(100);
    expect(review.truncated).toBe(true);
    expect(review.recordIds[0]).toBe('SYN-BULK-001');
    expect(review.recordIds[99]).toBe('SYN-BULK-100');
  });

  it('keeps existing inventory-family modules inside the active canonical committee context', () => {
    const context = gasContext({ user: director });
    const authorization = { scopeMode: 'ALL', committeeIds: [], mappingStatus: 'MAPPED', capabilities: [] };
    const inventorySession = { internal: true, requestOnly: false, user: director, authorization, activeCommitteeId: 'COM_INVENTORY_PANTRY', allowedCommitteeIds: ['COM_FOOD', 'COM_INVENTORY_PANTRY', 'COM_MATERIALS'] };
    const foodSession = { ...inventorySession, activeCommitteeId: 'COM_FOOD' };
    const fields = ['Item_ID', 'Item_Name'];

    expect(context.bootstrapRows_('01_ITEM_MASTER', {}, inventorySession, fields, [], null)).toHaveLength(1);
    expect(context.bootstrapRows_('06_LENDING', {}, inventorySession, ['Lending_Ticket_ID'], [], null)).toHaveLength(1);
    expect(context.bootstrapRows_('01_ITEM_MASTER', {}, foodSession, fields, [], null)).toHaveLength(0);
  });
});
