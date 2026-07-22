import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..', '..');
const read = (file) => readFile(resolve(root, file), 'utf8');

describe('staging runtime mode boundary', () => {
  it('selects REST/D1 for Cloudflare builds and refuses a mock override', async () => {
    const config = await read('src/app/config.js');
    expect(config).toContain("const isCloudflareBuild = buildMode === 'staging' || buildMode === 'production'");
    expect(config).toContain("requestedBackendMode ?? (isCloudflareBuild ? 'rest' : 'mock')");
    expect(config).toContain("isCloudflareBuild && configuredBackendMode === 'mock' ? 'unconfigured'");
  });

  it('keeps preview controls and placeholder marks out of the deployed shell', async () => {
    const shell = await read('src/visual/shell-before.html');
    expect(shell).not.toContain('Front-end preview');
    expect(shell).not.toContain('Preview mode');
    expect(shell).not.toContain('Reset Demo Data');
    expect(shell).not.toContain('logo placeholder');
    expect(shell).toContain('data-runtime-label');
  });

  it('hides the workspace until authentication and routes a session to its server-assigned workspace', async () => {
    const gateway = await read('src/visual/auth-gateway.js');
    expect(gateway).not.toContain('class="auth-brand"');
    expect(gateway).toContain("administrator: '/app/admin'");
    expect(gateway).toContain("'inventory-pantry': '/app/inventory'");
    expect(gateway).toContain('routeAuthorizedWorkspace(result.user);');
    expect(gateway).toContain("backendMode === 'unconfigured'");
    expect(gateway).toContain('No local or preview data has been loaded.');
    const roleRuntime = await read('src/visual/runtime-extensions.js');
    const roleStyles = await read('src/styles/visual/runtime-extensions.css');
    expect(roleRuntime).toContain('administrator: {');
    expect(roleStyles).toContain("body[data-runtime-mode='rest']:not(.request-mode) .hero { display: none; }");
  });
});
