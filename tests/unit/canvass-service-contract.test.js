import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it, vi } from 'vitest';
import { AppsScriptAdapter } from '../../src/services/apps-script-adapter.js';
import { createLegacyRuntimeAdapter } from '../../src/services/legacy-runtime-adapter.js';
import { LAUNCH_SERVICE_METHODS } from '../../src/services/launch-service-contract.js';
import { MockAdapter } from '../../src/services/mock-adapter.js';
import { RestService } from '../../src/services/rest-service.js';

describe('Slice 6 Canvass service contract', () => {
  it('exposes update and archive consistently across launch adapters', () => {
    expect(LAUNCH_SERVICE_METHODS).toEqual(
      expect.arrayContaining(['updateCanvassReference', 'archiveCanvassReference']),
    );
    for (const prototype of [AppsScriptAdapter.prototype, RestService.prototype, MockAdapter.prototype]) {
      expect(typeof prototype.updateCanvassReference).toBe('function');
      expect(typeof prototype.archiveCanvassReference).toBe('function');
    }
  });

  it('routes, authorizes, and revision-tracks both governed Apps Script mutations', () => {
    const appScriptRoot = resolve(import.meta.dirname, '../../apps-script');
    const router = readFileSync(resolve(appScriptRoot, 'Router.gs'), 'utf8');
    const authorization = readFileSync(resolve(appScriptRoot, 'Authorization.gs'), 'utf8');
    const revisions = readFileSync(resolve(appScriptRoot, 'DataRevisionService.gs'), 'utf8');
    for (const method of ['updateCanvassReference', 'archiveCanvassReference']) {
      expect(router).toContain(`guardMutationApi_('${method}'`);
      expect(authorization).toContain(`${method}: HAU_CAPABILITIES_.FULFILL_CANVASS`);
      expect(revisions).toContain(`'${method}'`);
    }
  });

  it('tracks legacy update and archive mutations through their explicit remote methods', async () => {
    const remote = {
      updateCanvassReference: vi.fn(async (command) => ({
        ok: true,
        canvassId: command.canvassId,
        correlationId: 'COR-UPDATE',
      })),
      archiveCanvassReference: vi.fn(async (command) => ({
        ok: true,
        canvassId: command.canvassId,
        correlationId: 'COR-ARCHIVE',
      })),
    };
    const services = createLegacyRuntimeAdapter({}, { mode: 'apps-script', remote });

    await expect(
      services.updateCanvassReference({ canvassId: 'CAN-2026-0001', supplierName: 'Synthetic Supplier' }),
    ).resolves.toMatchObject({ id: 'CAN-2026-0001', correlationId: 'COR-UPDATE' });
    await expect(
      services.archiveCanvassReference({ canvassId: 'CAN-2026-0001', reason: 'Superseded quote' }),
    ).resolves.toMatchObject({ canvassId: 'CAN-2026-0001', correlationId: 'COR-ARCHIVE' });

    expect(remote.updateCanvassReference).toHaveBeenCalledWith(
      expect.objectContaining({ canvassId: 'CAN-2026-0001', clientRequestId: expect.any(String) }),
    );
    expect(remote.archiveCanvassReference).toHaveBeenCalledWith(
      expect.objectContaining({ canvassId: 'CAN-2026-0001', clientRequestId: expect.any(String) }),
    );
  });
});
