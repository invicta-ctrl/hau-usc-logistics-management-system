import { describe, expect, it } from 'vitest';
import {
  createStateFromEssentialBootstrap,
  mergeBootstrapModule,
  validateBootstrapModule,
  validateEssentialBootstrap,
} from '../../src/app/bootstrap-contract.js';
import {
  createBootstrapModuleFixture,
  createEssentialBootstrapFixture,
} from '../fixtures/essential-bootstrap-fixtures.js';

describe('essential bootstrap contract', () => {
  it('accepts the allowlisted essential DTO and creates an empty lazy state', () => {
    const fixture = createEssentialBootstrapFixture({ backendMode: 'mock', requestOnly: true });
    expect(validateEssentialBootstrap(fixture, { backendMode: 'mock' })).toBe(fixture);
    const state = createStateFromEssentialBootstrap(fixture, { requestOnly: true });

    expect(state.requestOnly).toBeUndefined();
    expect(state.inventoryItems).toEqual([]);
    expect(state.ledgerTransactions).toEqual([]);
    expect(state.currentUser.id).toBe('PUBLIC');
    expect(JSON.stringify(state)).not.toContain('SYNTHETIC_PRIVATE_CANARY');
  });

  it('requires canonical authorization metadata in the v2 essential response', () => {
    const fixture = createEssentialBootstrapFixture();
    delete fixture.currentUser.authorization;
    expect(() => validateEssentialBootstrap(fixture, { backendMode: 'mock' })).toThrowError(
      expect.objectContaining({ code: 'BOOTSTRAP_CONTRACT_INVALID' }),
    );
  });

  it('accepts the explicit System Owner authorization projection', () => {
    const fixture = createEssentialBootstrapFixture();
    fixture.currentUser.role = 'SYSTEM_OWNER';
    fixture.currentUser.authorization.roleId = 'SYSTEM_OWNER';
    fixture.currentUser.authorization.roleLabel = 'System Owner';
    expect(validateEssentialBootstrap(fixture, { backendMode: 'mock' })).toBe(fixture);
  });

  it('accepts only a bounded operational context whose selected option is available', () => {
    const fixture = createEssentialBootstrapFixture();
    fixture.operationalContext = {
      selected: {
        value: 'COMMITTEE:COM_FOOD',
        kind: 'COMMITTEE',
        id: 'COM_FOOD',
        label: 'Food Committee',
      },
      options: [
        {
          value: 'COMMITTEE:COM_FOOD',
          kind: 'COMMITTEE',
          id: 'COM_FOOD',
          label: 'Food Committee',
          purpose: 'Committee-owned operations',
          available: true,
        },
      ],
    };
    expect(createStateFromEssentialBootstrap(fixture).operationalContext).toEqual(
      fixture.operationalContext,
    );
    fixture.operationalContext.selected.value = 'COMMITTEE:COM_MATERIALS';
    expect(() => validateEssentialBootstrap(fixture, { backendMode: 'mock' })).toThrowError(
      expect.objectContaining({ code: 'BOOTSTRAP_CONTRACT_INVALID' }),
    );
  });

  it.each([
    ['unknown top-level field', (value) => { value.privateStudentRecords = []; }],
    ['missing schema version', (value) => { delete value.schemaVersion; }],
    ['unsupported schema version', (value) => { value.schemaVersion = 'SYNTHETIC-UNSUPPORTED'; }],
    ['Date value', (value) => { value.metrics = { readCount: new Date() }; }],
    ['undefined value', (value) => { value.metrics = { readCount: undefined }; }],
    ['circular value', (value) => { value.metrics.circular = value; }],
  ])('rejects %s before state creation', (_label, mutate) => {
    const fixture = createEssentialBootstrapFixture();
    mutate(fixture);
    expect(() => validateEssentialBootstrap(fixture, { backendMode: 'mock' })).toThrowError(
      expect.objectContaining({ code: 'BOOTSTRAP_CONTRACT_INVALID' }),
    );
  });

  it.each(['studentIdNumber', 'requester_email', 'borrowerName', 'evidenceId'])('rejects sensitive module field %s and unsupported module data keys', (field) => {
    const sensitive = createBootstrapModuleFixture({ requestOnly: true });
    sensitive.data.inventoryItems[0][field] = 'SYNTHETIC-PRIVATE-CANARY';
    expect(() => validateBootstrapModule(sensitive, { backendMode: 'mock', module: 'request' })).toThrowError(
      expect.objectContaining({ code: 'BOOTSTRAP_CONTRACT_INVALID' }),
    );

    const unsupported = createBootstrapModuleFixture({ requestOnly: true });
    unsupported.data.ledgerTransactions = [];
    expect(() => validateBootstrapModule(unsupported, { backendMode: 'mock', module: 'request' })).toThrowError(
      expect.objectContaining({ code: 'BOOTSTRAP_CONTRACT_INVALID' }),
    );
  });

  it('requires request-only modules to omit scoped revision metadata', () => {
    const requestOnly = createBootstrapModuleFixture({ requestOnly: true });
    expect(validateBootstrapModule(requestOnly, { backendMode: 'mock', module: 'request' }).scopeRevision).toBeNull();
    requestOnly.scopeRevision = { scope: 'request', token: 1, updatedAt: '2026-07-16T12:00:00+08:00' };
    expect(() => validateBootstrapModule(requestOnly, { backendMode: 'mock', module: 'request' })).toThrowError(
      expect.objectContaining({ code: 'BOOTSTRAP_CONTRACT_INVALID' }),
    );
  });

  it('allows authorized internal modules to carry operational borrower fields without treating them as public cache data', () => {
    const internal = createBootstrapModuleFixture({ module: 'lending', cacheSafe: false });
    internal.data.lendingTickets = [{
      id: 'SYNTHETIC-TICKET-001', studentIdNumber: 'SYNTHETIC-STUDENT-001', borrowerName: 'Synthetic Borrower',
      contact: 'synthetic-contact', itemId: 'SYNTHETIC-ITEM-001', quantity: 1, status: 'FOR_REVIEW',
    }];
    expect(validateBootstrapModule(internal, { backendMode: 'mock', module: 'lending' })).toBe(internal);
  });

  it('accepts the bounded Inventory stock, ledger, asset, condition, and movement projection', () => {
    const inventory = createBootstrapModuleFixture({ module: 'inventory', cacheSafe: false });
    inventory.data.inventoryItems[0] = {
      ...inventory.data.inventoryItems[0],
      onHand: 12,
      reserved: 3,
      availableToPromise: 9,
    };
    inventory.data.ledgerTransactions = [
      { id: 'SYNTHETIC-TXN-001', itemId: 'SYNTHETIC-ITEM-001', direction: 'IN', quantity: 12 },
    ];
    inventory.data.inventoryAssets = [
      { id: 'SYNTHETIC-ASSET-001', item_id: 'SYNTHETIC-ITEM-001', lifecycle_status: 'AVAILABLE' },
    ];
    inventory.data.assetMaintenanceHistory = [];
    inventory.data.assetMovementHistory = [];

    expect(validateBootstrapModule(inventory, { backendMode: 'mock', module: 'inventory' })).toBe(
      inventory,
    );
    const merged = mergeBootstrapModule(createStateFromEssentialBootstrap(createEssentialBootstrapFixture()), inventory, {
      backendMode: 'mock',
    });
    expect(merged.inventoryAssets).toHaveLength(1);
    expect(merged.ledgerTransactions).toHaveLength(1);
  });

  it.each(['1.3.0', '1.6.0'])('accepts additive schema %s and the overview dashboard projections', (schemaVersion) => {
    const overview = createBootstrapModuleFixture({ module: 'overview', cacheSafe: false });
    overview.schemaVersion = schemaVersion;
    overview.data.dashboardMeta = [{ scopeMode: 'ALL', activeCommitteeId: '', allowedCommitteeIds: [], stale: false }];
    overview.data.dashboardQueues = [{ id: 'requests-review', count: 0, recordIds: [], truncated: false }];
    overview.data.dashboardStaffWorkload = [];
    overview.data.dashboardActivity = [];
    overview.data.dashboardLinks = [{ id: 'overview', label: 'Main Hub', view: 'overview' }];

    expect(validateBootstrapModule(overview, { backendMode: 'mock', module: 'overview' })).toBe(overview);
  });

  it('rejects false envelopes and cache policies that could retain session data', () => {
    const essential = createEssentialBootstrapFixture();
    essential.ok = false;
    expect(() => validateEssentialBootstrap(essential, { backendMode: 'mock' })).toThrowError(
      expect.objectContaining({ code: 'BOOTSTRAP_CONTRACT_INVALID' }),
    );

    const module = createBootstrapModuleFixture({ cacheSafe: false });
    module.cache.ttlMs = 300_000;
    expect(() => validateBootstrapModule(module, { backendMode: 'mock', module: 'request' })).toThrowError(
      expect.objectContaining({ code: 'BOOTSTRAP_CONTRACT_INVALID' }),
    );
  });

  it('merges only the selected module into the legacy-compatible state shape', () => {
    const essential = createEssentialBootstrapFixture();
    const state = createStateFromEssentialBootstrap(essential);
    const module = createBootstrapModuleFixture({ module: 'request' });
    const merged = mergeBootstrapModule(state, module, { backendMode: 'mock' });

    expect(merged.inventoryItems).toHaveLength(2);
    expect(merged.events).toHaveLength(2);
    expect(merged.lendingTickets).toEqual([]);
    expect(merged.ledgerTransactions).toEqual([]);
  });
});
