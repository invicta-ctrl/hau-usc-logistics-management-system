import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');

describe('canonical identity reconciliation Worker route contract', () => {
  it('exposes an owner-only read-only preview route without an apply route', async () => {
    const source = await readFile(resolve(root, 'src/worker/index.js'), 'utf8');

    expect(source).toContain('/api/owner/identity-foundation/reconciliation-preview');
    expect(source).toContain('identityFoundationReconciliation.preview');
    expect(source).toContain('CAPABILITIES.SYSTEM_ADMIN, { mutation: false }');
    expect(source).not.toContain('/api/owner/identity-foundation/reconciliation-apply');
  });

  it('registers the blocked source-projection probe as a System Admin read-only route with no apply surface', async () => {
    const source = await readFile(resolve(root, 'src/worker/index.js'), 'utf8');
    const routeStart = source.indexOf(
      "url.pathname === '/api/owner/identity-foundation/source-projection-probe'",
    );
    const route = source.slice(routeStart, routeStart + 600);

    expect(routeStart).toBeGreaterThanOrEqual(0);
    expect(route).toContain("request.method === 'POST'");
    expect(route).toContain('CAPABILITIES.SYSTEM_ADMIN, { mutation: false }');
    expect(route).toContain('sourceProjectionProbe.probe({ actor })');
    expect(route).not.toContain('body(request)');
    expect(source).toContain('createD1IdentitySourceProjectionRepository');
    expect(source).toContain('createIdentitySourceProjectionProbeService');
    expect(source).toContain('executionAuthorized: false');
    expect(source).not.toContain('/api/owner/identity-foundation/source-projection-probe-apply');
    expect(source).not.toContain('sourceProjectionProbe.apply');
  });
});
