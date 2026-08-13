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
});
