import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';
import { normalizeReturnPayload } from '../../src/services/legacy-runtime-adapter.js';

const root = resolve(import.meta.dirname, '../..');
const source = (path) => readFileSync(resolve(root, path), 'utf8');

function gasContext(files) {
  const context = vm.createContext({
    console,
    Date,
    JSON,
    Math,
    Object,
    Error,
    RegExp,
    isFinite,
    isNaN,
  });
  for (const file of files) {
    vm.runInContext(source(`apps-script/${file}`), context, { filename: file });
  }
  return context;
}

describe('request-only identity boundary', () => {
  it('downgrades an unregistered institutional account instead of loading internal data', () => {
    const ctx = gasContext(['Config.gs', 'Validation.gs', 'InventoryService.gs']);
    let privilegedResolutionCalls = 0;
    let inventoryIndexCalls = 0;
    ctx.resolveCurrentUser_ = () => {
      privilegedResolutionCalls += 1;
      throw new Error('must not require an internal user for bootstrap');
    };
    ctx.resolveRequesterUser_ = () => ({
      User_ID: 'PUBLIC',
      Email: 'requester@example.invalid',
      Display_Name: 'Institutional requester',
      Role: 'REQUESTER',
      Active: true,
    });
    ctx.isInternalBootstrapUser_ = (user) => Boolean(user && user.User_ID !== 'PUBLIC');
    ctx.userPermissionsDto_ = () => ({ review: false, release: false, receive: false, admin: false, manageCatalog: false });
    ctx.resolveRuntimeConfig_ = () => ({ environment: 'test' });
    ctx.inventoryIndexes_ = () => {
      inventoryIndexCalls += 1;
      throw new Error('request-only bootstrap must not index ledger or reservations');
    };
    ctx.readObjects_ = (sheet) => {
      if (sheet === ctx.HAU_SHEETS.ITEMS) {
        return [{ Item_ID: 'ITM-1', Item_Name: 'Demo item', Status: 'ACTIVE', Category: 'Demo', Unit: 'piece' }];
      }
      return [];
    };
    ctx.getPublishedContent_ = () => ({ content: [] });
    ctx.getBrandingState_ = () => ({ branding: [], fallbackRequired: true });
    ctx.getDataRevision_ = () => {
      throw new Error('request-only bootstrap must not read the internal revision');
    };

    const result = ctx.getBootstrapData_({ portalMode: 'internal' });

    expect(privilegedResolutionCalls).toBe(0);
    expect(inventoryIndexCalls).toBe(0);
    expect(result).toMatchObject({
      portalMode: 'request',
      catalogAvailabilityProtected: true,
      currentUser: { id: 'PUBLIC', role: 'REQUESTER' },
      requests: [],
      lendingTickets: [],
      auditLog: [],
    });
    expect(result.inventoryItems[0]).not.toHaveProperty('onHand');
  });
});

describe('return evidence and service gateway contract', () => {
  it('keeps the full exceptional-return payload when the ticket id is supplied separately', () => {
    const adapter = source('src/services/legacy-runtime-adapter.js');
    const browser = source('src/visual/runtime-extensions.js');

    expect(adapter).toContain('export function normalizeReturnPayload');
    expect(browser).toContain('name="returnEvidence" type="file"');
    expect(browser).toContain('services.confirmReturn({ ticketId: ticket.id, ...payload })');
    expect(normalizeReturnPayload('LND-DEMO-1', {
      returnedQuantity: 2,
      damagedBeyondUseQuantity: 1,
      lostQuantity: 1,
      damageNotes: 'Demo exceptional return',
      file: { name: 'demo-return.png' },
    })).toEqual({
      ticketId: 'LND-DEMO-1',
      returnedQuantity: 2,
      damagedBeyondUseQuantity: 1,
      lostQuantity: 1,
      damageNotes: 'Demo exceptional return',
      file: { name: 'demo-return.png' },
    });
  });

  it('keeps google.script.run behind the single adapter gateway', () => {
    const directGatewayFiles = ['src/services/apps-script-adapter.js'];
    const candidates = [
      'src/services/apps-script-adapter.js',
      'src/services/apps-script-service.js',
      'src/services/legacy-runtime-adapter.js',
      'src/visual/runtime.js',
      'src/visual/runtime-extensions.js',
    ];
    const matches = candidates.filter((path) => /google\?*\.script\?*\.run|google\.script\.run/.test(source(path)));
    expect(matches).toEqual(directGatewayFiles);
  });
});
