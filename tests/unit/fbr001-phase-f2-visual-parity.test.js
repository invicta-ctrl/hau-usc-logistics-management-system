import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const source = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');

describe('FBR-001 Phase F2 internal operations visual parity', () => {
  it('marks every internal route body with the shared Claude Workbench boundary', () => {
    expect(source('src/frontend/app/inventory/InventoryRoute.tsx')).toContain('fbr-f2-inventory');
    expect(source('src/frontend/app/request/InternalRequestHub.tsx')).toContain('fbr-f2-request-hub');
    expect(source('src/frontend/app/lending/InternalLendingHub.tsx')).toContain('fbr-f2-lending');
    expect(source('src/frontend/app/operations/OperationalModuleRoute.tsx')).toContain('fbr-f2-operations');
    expect(source('src/frontend/app/events/EventReadinessRoute.tsx')).toContain('fbr-f2-events');
  });

  it('retains the canonical internal adapters and accepted lifecycle stations', () => {
    const inventory = source('src/frontend/app/inventory/InventoryRoute.tsx');
    const request = source('src/frontend/app/request/InternalRequestHub.tsx');
    const lending = source('src/frontend/app/lending/InternalLendingHub.tsx');
    const operations = source('src/frontend/app/operations/OperationalModuleRoute.tsx');
    const events = source('src/frontend/app/events/EventReadinessRoute.tsx');

    expect(inventory).toMatch(/frontendBackend\s*\.inventoryBootstrap/u);
    expect(request).toMatch(/frontendBackend\s*\.requestBootstrap/u);
    expect(request).toMatch(/frontendBackend\s*\.reviewRequest/u);
    expect(lending).toMatch(/frontendBackend\s*\.lendingBootstrap/u);
    expect(operations).toMatch(/frontendBackend\s*\.operationalModuleBootstrap/u);
    expect(operations).toContain('<ReleaseStation');
    expect(operations).toContain('<ReceivingStation');
    expect(operations).toContain('<ProcurementWorkspace');
    expect(events).toMatch(/frontendBackend\s*\.eventManagement/u);
  });

  it('uses top decision rules and deliberate horizontal scroll without adding a second transport', () => {
    const request = source('src/frontend/app/request/InternalRequestHub.tsx');
    const styles = source('src/frontend/styles/fbr-f2-operations.css');

    expect(request).not.toContain("borderLeft: selectedRow ? '3px solid #c8992f'");
    expect(request).toContain("'2px solid var(--theme-accent, var(--gold-canonical))'");
    expect(styles).toContain('overflow-x: auto');
    expect(styles).toContain('prefers-reduced-motion: reduce');
    expect(styles).not.toMatch(/\bfetch\s*\(/u);
  });
});
