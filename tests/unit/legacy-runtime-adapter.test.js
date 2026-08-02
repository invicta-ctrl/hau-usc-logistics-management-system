import { describe, expect, it, vi } from 'vitest';
import { AppError } from '../../src/app/errors.js';
import { createLegacyRuntimeAdapter } from '../../src/services/legacy-runtime-adapter.js';
import { PROTECTED_RUNTIME_SERVICE_METHODS } from '../../src/services/launch-service-contract.js';

const EXPECTED_PROTECTED_METHODS = [
  'getAccessPolicyOptions',
  'previewAccessPolicy',
  'updateAccessPolicy',
  'getIdentityRosterStatus',
  'listIdentityRoster',
  'previewIdentityRosterSync',
  'applyIdentityRosterSync',
  'rollbackIdentityRosterSync',
  'getIdentityRosterSelfProfile',
];

const createRemote = () =>
  Object.fromEntries(
    PROTECTED_RUNTIME_SERVICE_METHODS.map((method) => [
      method,
      vi.fn().mockResolvedValue({ ok: true, method }),
    ]),
  );

describe('legacy production runtime service contract', () => {
  it('exposes every protected production method and forwards read-only commands', async () => {
    expect(PROTECTED_RUNTIME_SERVICE_METHODS).toEqual(EXPECTED_PROTECTED_METHODS);
    const remote = createRemote();
    const adapter = createLegacyRuntimeAdapter({}, { mode: 'rest', remote });

    expect(PROTECTED_RUNTIME_SERVICE_METHODS.every((method) => typeof adapter[method] === 'function')).toBe(
      true,
    );

    await expect(adapter.getAccessPolicyOptions({ accountId: 'ACC-SYNTHETIC' })).resolves.toMatchObject({
      ok: true,
      method: 'getAccessPolicyOptions',
    });
    expect(remote.getAccessPolicyOptions).toHaveBeenCalledWith({ accountId: 'ACC-SYNTHETIC' });

    await adapter.getIdentityRosterStatus({ page: 1 });
    await adapter.listIdentityRoster({ query: 'synthetic' });
    await adapter.previewIdentityRosterSync({});
    await adapter.getIdentityRosterSelfProfile({});

    expect(remote.getIdentityRosterStatus).toHaveBeenCalledWith({ page: 1 });
    expect(remote.listIdentityRoster).toHaveBeenCalledWith({ query: 'synthetic' });
    expect(remote.previewIdentityRosterSync).toHaveBeenCalledWith({});
    expect(remote.getIdentityRosterSelfProfile).toHaveBeenCalledWith({});
  });

  it.each([
    ['updateAccessPolicy', 'access-policy-update'],
    ['applyIdentityRosterSync', 'identity-roster-apply'],
    ['rollbackIdentityRosterSync', 'identity-roster-rollback'],
  ])('reuses the %s mutation id after a retryable failure', async (method) => {
    const remote = createRemote();
    remote[method]
      .mockRejectedValueOnce(new AppError('TEMPORARY_FAILURE', 'Retry safely.', { retryable: true }))
      .mockResolvedValueOnce({ ok: true });
    const adapter = createLegacyRuntimeAdapter({}, { mode: 'rest', remote });
    const command = { targetId: 'SYNTHETIC-TARGET' };

    await expect(adapter[method](command)).rejects.toMatchObject({ retryable: true });
    await expect(adapter[method](command)).resolves.toEqual({ ok: true });

    const [first, second] = remote[method].mock.calls.map(([payload]) => payload.clientRequestId);
    expect(first).toBeTruthy();
    expect(second).toBe(first);
  });

  it('keeps mock preview services isolated from the production assertion', () => {
    const mockServices = { previewOnly: vi.fn() };
    expect(createLegacyRuntimeAdapter(mockServices, { mode: 'mock' })).toBe(mockServices);
  });
});
