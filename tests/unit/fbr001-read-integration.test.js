import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));

async function source(relativePath) {
  return readFile(resolve(root, relativePath), 'utf8');
}

describe('FBR-001 Phase D read integration', () => {
  it('keeps each supported public and authenticated read family on the canonical frontend adapter', async () => {
    const sources = await Promise.all([
      source('src/frontend/app/landing/CurrentSection.tsx'),
      source('src/frontend/app/PublicFlows.tsx'),
      source('src/frontend/app/request/ExternalRequestCenter.tsx'),
      source('src/frontend/app/overview/OverviewRoute.tsx'),
      source('src/frontend/app/inventory/InventoryRoute.tsx'),
      source('src/frontend/app/request/InternalRequestHub.tsx'),
      source('src/frontend/app/lending/InternalLendingHub.tsx'),
      source('src/frontend/app/operations/OperationalModuleRoute.tsx'),
      source('src/frontend/app/events/EventReadinessRoute.tsx'),
      source('src/frontend/app/AdministrationRoute.tsx'),
      source('src/frontend/app/profile/ProfileRoute.tsx'),
    ]);

    for (const value of sources) expect(value).toContain('frontendBackend');
    expect(sources[0]).toContain('publicAdvertisements');
    expect(sources[1]).toContain('publicLendingCatalog');
    expect(sources[1]).toContain('trackPublicRequest');
    expect(sources[1]).toContain('trackPublicLending');
    expect(sources[3]).toContain("operationalModuleBootstrap('overview'");
    expect(sources[4]).toContain('inventoryBootstrap');
    expect(sources[5]).toContain('requestBootstrap');
    expect(sources[6]).toContain('lendingBootstrap');
    expect(sources[7]).toContain('operationalModuleBootstrap(module');
    expect(sources[8]).toContain('eventManagement');
    expect(sources[10]).toContain('frontendBackend.profile()');
  });

  it('keeps any seed read data isolated behind explicit inspection mode', async () => {
    const [inventory, requests, lending, events] = await Promise.all([
      source('src/frontend/app/inventory/InventoryRoute.tsx'),
      source('src/frontend/app/request/InternalRequestHub.tsx'),
      source('src/frontend/app/lending/InternalLendingHub.tsx'),
      source('src/frontend/app/events/EventReadinessRoute.tsx'),
    ]);

    expect(inventory).toContain('inspection ? INV_FIXTURE : []');
    expect(requests).toContain('inspection ? PREVIEW_QUEUE : EMPTY_QUEUE');
    expect(lending).toContain('inspection ? PREVIEW_QUEUE : EMPTY_QUEUE');
    expect(events).toContain('inspection ? previewEventManagement : null');
  });
});
