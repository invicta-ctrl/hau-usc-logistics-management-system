import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { projectPreviewIndexGate } from '../../src/frontend/preview/index/trustedGate.ts';

const root = resolve(import.meta.dirname, '../..');
const source = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');
const retiredNames = ['Lending' + 'HubRoute.tsx', 'RequestCenter' + 'RouteWithStates.tsx', 'RequestCenter' + 'Route.tsx'];

function frontendSource(path) {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const next = resolve(path, entry.name);
    if (entry.isDirectory()) return frontendSource(next);
    return /\.(?:[cm]?[jt]sx?)$/u.test(entry.name) ? [readFileSync(next, 'utf8')] : [];
  });
}

describe('FBR-001 Phase G canonical runtime boundary', () => {
  it('removes only the proven unreachable legacy paths and leaves no executable frontend consumer', () => {
    const frontend = frontendSource(resolve(root, 'src/frontend')).join('\n');

    for (const name of retiredNames) {
      expect(existsSync(resolve(root, 'src/frontend/app', name))).toBe(false);
      expect(frontend).not.toContain(name);
    }
  });

  it('retains canonical internal route composition and backend-backed normal reads', () => {
    const renderer = source('src/frontend/app/AppRouteRenderer.tsx');
    const overview = source('src/frontend/app/overview/OverviewRoute.tsx');
    const inventory = source('src/frontend/app/inventory/InventoryRoute.tsx');

    expect(renderer).toContain("import { InternalRequestHub } from './request/InternalRequestHub'");
    expect(renderer).toContain("import { InternalLendingHub } from './lending/InternalLendingHub'");
    expect(renderer).toContain("import { OperationalModuleRoute } from './operations/OperationalModuleRoute'");
    expect(overview).not.toContain('overviewFixtures');
    expect(overview).toContain(".operationalModuleBootstrap('overview'");
    expect(inventory).toContain('INV_FIXTURE');
    expect(inventory).toContain('inspection');
  });

  it('keeps preview fixtures behind the validated Playground gate, never as failure success', () => {
    const inspection = source('src/frontend/preview/index/PreviewInspectionRoute.tsx');
    const previewData = source('src/frontend/preview/index/previewData.ts');

    expect(projectPreviewIndexGate({ playground: false })).toMatchObject({
      validatedPlayground: false,
      indexAllowed: false,
    });
    expect(inspection).toContain('inspection');
    expect(previewData).toContain('PREVIEW_PRESENTATION_ONLY');
    expect(previewData).toContain('Sample request for interface inspection');
  });
});
