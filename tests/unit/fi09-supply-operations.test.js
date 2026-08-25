import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listPreviewRoutes } from '../../src/frontend/preview/index/registry';

const root = resolve(import.meta.dirname, '../..');
const readSource = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');
const cssFrom = (source) => source.match(/const css = `([\s\S]*)`;;\s*$/)?.[1];

describe('FI-09 Supply operations frontend integration', () => {
  it('uses the existing SupplyRoutes module only after the normal authenticated route gate', () => {
    const renderer = readSource('src/frontend/app/AppRouteRenderer.tsx');

    expect(renderer).toContain("import SupplyRoutes from './SupplyRoutes';");
    expect(renderer).toMatch(
      /session && isAuthRoute\(route\)[\s\S]*route === 'restocking' \? \([\s\S]*<SupplyRoutes dark=\{dark\} mode="restocking" navigate=\{navigate\} \/>[\s\S]*route === 'procurement' \? \([\s\S]*<SupplyRoutes dark=\{dark\} mode="procurement" navigate=\{navigate\} \/>/,
    );
  });

  it('uses the same no-fetch real module in the trusted A4 inspection modes', () => {
    const inspection = readSource('src/frontend/preview/index/PreviewInspectionRoute.tsx');

    expect(inspection).toContain("import SupplyRoutes from '../../app/SupplyRoutes';");
    expect(inspection).toMatch(
      /authRoute === 'restocking' \? \([\s\S]*<SupplyRoutes dark=\{dark\} mode="restocking" navigate=\{onOpenRoute\} \/>[\s\S]*authRoute === 'procurement' \? \([\s\S]*<SupplyRoutes dark=\{dark\} mode="procurement" navigate=\{onOpenRoute\} \/>/,
    );
    expect(inspection).not.toContain('/api/');
    expect(inspection).not.toMatch(/\bfetch\s*\(/);
  });

  it('preserves the Make-v44 visual composition and responsive CSS while bounding the accessibility delta', () => {
    const runtime = readSource('src/frontend/app/SupplyRoutes.tsx');
    const makeV44 = readSource('output/design/make-provider-export-v44/src/app/SupplyRoutes.tsx');

    expect(cssFrom(runtime)).toBe(cssFrom(makeV44));
    expect(runtime).toContain('Restocking and receiving');
    expect(runtime).toContain('REQUEST');
    expect(runtime).toContain('CANVASS');
    expect(runtime).toContain('DELIVERABLE');
    expect(runtime).toContain('RECEIVE');
    expect(runtime).toContain('LEDGER');
    expect(runtime).toContain('Restocking queue');
    expect(runtime).toContain('PRC-2026-0044');
    expect(runtime).toContain('Revision 5');
    expect(runtime).toContain('Contracts · unavailable');
    expect(runtime).toContain('Named supplier summaries');
    expect(runtime).toContain('Delivery relationships');
    expect(runtime).toContain('setSelected("RST-2026-0044")');
    expect(runtime).toContain('keepFocusInDialog');
    expect(runtime).toContain('event.key === "Escape"');
    expect(runtime).toContain('aria-labelledby="supply-task-title"');
    expect(runtime).toMatch(/confirm=\{\(\) => \{\s*closeTask\(\);/u);
    expect(runtime).toContain('Receiving values are cumulative and prior');
  });

  it('retains synthetic, cumulative, and no-write supply truth', () => {
    const supplyRoutes = readSource('src/frontend/app/SupplyRoutes.tsx');

    expect(supplyRoutes).toContain('Synthetic prototype · no backend');
    expect(supplyRoutes).toContain('PO-2026-0031');
    expect(supplyRoutes).toContain('<dt>Ordered</dt>');
    expect(supplyRoutes).toContain('<dd>12</dd>');
    expect(supplyRoutes).toContain('<dt>Received</dt>');
    expect(supplyRoutes).toContain('<dd>6</dd>');
    expect(supplyRoutes).toContain('<dt>Outstanding</dt>');
    expect(supplyRoutes).toContain('No inventory, procurement, receiving,');
    expect(supplyRoutes).toContain('event, or ledger write.');
  });

  it('records accepted real-module delivery without claiming a backend binding', () => {
    expect(listPreviewRoutes().find((entry) => entry.route === 'restocking')).toEqual({
      id: 'restocking',
      route: 'restocking',
      label: 'Restocking',
      group: 'STAFF',
      description:
        'Authenticated Restocking and receiving real module. Local inspection is deterministic synthetic presentation with no protected request or mutation.',
      implementationStatus: 'ACCEPTED',
      backendStatus: 'VISUAL_ONLY',
      access: 'AUTHENTICATED',
      previewMode: 'REAL_MODULE',
    });
    expect(listPreviewRoutes().find((entry) => entry.route === 'procurement')).toEqual({
      id: 'procurement',
      route: 'procurement',
      label: 'Procurement',
      group: 'STAFF',
      description:
        'Authenticated Procurement lifecycle real module. Local inspection is deterministic synthetic presentation with no protected request or mutation.',
      implementationStatus: 'ACCEPTED',
      backendStatus: 'VISUAL_ONLY',
      access: 'AUTHENTICATED',
      previewMode: 'REAL_MODULE',
    });
  });
});
