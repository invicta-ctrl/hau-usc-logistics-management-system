import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listPreviewRoutes } from '../../src/frontend/preview/index/registry';

const root = resolve(import.meta.dirname, '../..');
const readSource = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');

describe('FI-08 Release Desk frontend integration', () => {
  it('uses the authenticated Worker/D1 route in normal runtime and keeps the Make-v44 fixture out of it', () => {
    const renderer = readSource('src/frontend/app/AppRouteRenderer.tsx');

    expect(renderer).not.toContain("import ReleaseDeskRoute from './ReleaseDeskRoute';");
    expect(renderer).toContain('<OperationalModuleRoute module="release" />');
  });

  it('makes the exact local A4 inspection path render the deterministic real module without a backend call', () => {
    const inspection = readSource('src/frontend/preview/index/PreviewInspectionRoute.tsx');
    const releaseDesk = readSource('src/frontend/app/ReleaseDeskRoute.tsx');

    expect(inspection).toContain("import ReleaseDeskRoute from '../../app/ReleaseDeskRoute';");
    expect(inspection).toMatch(
      /authRoute === 'release' \? \([\s\S]*<ReleaseDeskRoute dark=\{dark\} navigate=\{onOpenRoute\} \/>/,
    );
    expect(inspection).not.toContain('/api/');
    expect(inspection).not.toMatch(/\bfetch\s*\(/);
    expect(releaseDesk).toContain('Synthetic prototype · no backend');
    expect(releaseDesk).toContain('Synthetic confirmation only · no service or ledger write');
    expect(releaseDesk).toContain('data-release-trigger');
    expect(releaseDesk).toContain('state === "Focused task"');
    expect(releaseDesk).toContain('keepFocusInDialog');
    expect(releaseDesk).toContain('e.key === "Escape"');
  });

  it('records real-module delivery accurately without claiming a backend binding', () => {
    expect(listPreviewRoutes().find((entry) => entry.route === 'release')).toEqual({
      id: 'release',
      route: 'release',
      label: 'Release Desk',
      group: 'STAFF',
      description:
        'Capability-gated Release Desk visual module. Local inspection uses deterministic synthetic states and action simulation with no protected request or mutation.',
      implementationStatus: 'ACCEPTED',
      backendStatus: 'VISUAL_ONLY',
      access: 'AUTHENTICATED',
      previewMode: 'REAL_MODULE',
    });
  });
});
