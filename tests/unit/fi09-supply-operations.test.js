import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { listPreviewRoutes } from '../../src/frontend/preview/index/registry';

const root = resolve(import.meta.dirname, '../..');
const readSource = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');
const cssFrom = (source) => source.match(/const css = `([\s\S]*)`;;\s*$/)?.[1];

/* POST-FI17-DESIGN-RECOVERY-02 accepted delta, recorded the same way the FI-11
 * responsive helpers are below rather than by weakening the parity assertion.
 *
 * Make v44 renders every supply status in one identical pill. Measured, not
 * inferred: 16 pills across restocking, procurement and events resolve to ONE
 * visual signature (background rgb(247,240,226), colour rgb(36,20,22), border
 * rgb(230,220,201), weight 800, 11px), so "Not delivered" and "Received" are
 * indistinguishable on the three surfaces whose job is spotting the
 * outstanding ones. RECOVERY-02 §3.5 preserves a Make pattern "unless
 * Hallmark/Impeccable identify a material usability/accessibility defect";
 * this is that exception.
 *
 * Only the four appended tone rules are stripped. Make's own `em` rule, its
 * tab composition and its palette all remain under byte-exact parity, so any
 * other drift from v44 still fails this test. */
const STATUS_TONE_DELTA = /em\[data-state="(?:done|progress|alert|neutral)"\]\{[^}]*\}/g;
const supplyCssFrom = (source) => {
  const css = cssFrom(source);
  const rootAt = css?.indexOf('.sup{') ?? -1;
  return rootAt >= 0 ? css?.slice(rootAt).replace(STATUS_TONE_DELTA, '').trim() : undefined;
};

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

    // FI-11 adds the Events-only responsive helpers before the FI-09 Make-v44
    // `.sup` payload. Keep that accepted delta explicit without weakening the
    // core Make parity assertion.
    expect(supplyCssFrom(runtime)).toBe(cssFrom(makeV44)?.trim());
    expect(cssFrom(runtime)).toContain('.event-stack{display:grid;gap:16px;margin-top:16px}');
    expect(cssFrom(runtime)).toContain('@media(max-width:768px){.event-cards{display:grid;gap:10px;padding:12px}');
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
