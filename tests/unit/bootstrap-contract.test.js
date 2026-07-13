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

  it('allows authorized internal modules to carry operational borrower fields without treating them as public cache data', () => {
    const internal = createBootstrapModuleFixture({ module: 'lending', cacheSafe: false });
    internal.data.lendingTickets = [{
      id: 'SYNTHETIC-TICKET-001', studentIdNumber: 'SYNTHETIC-STUDENT-001', borrowerName: 'Synthetic Borrower',
      contact: 'synthetic-contact', itemId: 'SYNTHETIC-ITEM-001', quantity: 1, status: 'FOR_REVIEW',
    }];
    expect(validateBootstrapModule(internal, { backendMode: 'mock', module: 'lending' })).toBe(internal);
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
