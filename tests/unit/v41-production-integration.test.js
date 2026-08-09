import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { createSanitizedPreviewClient } from '../../src/visual/sanitized-preview-client.js';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFile(resolve(root, path), 'utf8');

describe('V4.1 production front-end integration', () => {
  it('keeps the real public routes and presents the approved landing hierarchy', async () => {
    const source = await read('src/visual/portal-navigation.js');

    expect(source).toContain("export const STAFF_SIGN_IN_URL = 'https://logistics.hausc.org/login'");
    expect(source).toContain("document.body?.dataset.runtimeMode === 'mock'");
    expect(source).toContain('Request. Prepare. Release.');
    expect(source).toContain('href="/request"');
    expect(source).toContain('href="/lending"');
    expect(source).toContain('href="/request#request-tracking"');
    expect(source).toContain('href="/lending#lending-tracking"');
    expect(source).not.toMatch(/demo|preview-only|fake metric/iu);
  });

  it('loads the V4.1 cascade after the protected production styles', async () => {
    const index = await read('src/index.html');
    const responsive = index.indexOf('/styles/visual/responsive.css');
    const integration = index.indexOf('/styles/visual/v4-1-integration.css');

    expect(responsive).toBeGreaterThan(-1);
    expect(integration).toBeGreaterThan(responsive);
  });

  it('provides persistent accessible theme, menu, back, and reduced-motion controls', async () => {
    const controls = await read('src/visual/signature-controls.js');
    const styles = await read('src/styles/visual/v4-1-integration.css');

    expect(controls).toContain("'hau-usc-logistics-theme'");
    expect(controls).toContain('Switch to light mode');
    expect(controls).toContain('Switch to dark mode');
    expect(controls).toContain('aria-controls="primaryNav"');
    expect(controls).toContain("event.key !== 'Escape'");
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).not.toContain('transition: all');
    expect(styles).not.toMatch(/cubic-bezier\([^)]*1\.5/);
  });

  it('keeps the landing map progressive, finite, and dependency-free', async () => {
    const network = await read('src/visual/landing-network.js');
    const styles = await read('src/styles/visual/v4-1-integration.css');

    expect(network).toContain('data-motion="static"');
    expect(network).toContain('prefers-reduced-motion: reduce');
    expect(network).toContain('navigator.connection?.saveData');
    expect(network).toContain('IntersectionObserver');
    expect(network).toContain('visibilitychange');
    expect(styles).toContain('Purpose-built, dependency-free CSS isometric logistics map.');
    expect(styles).not.toMatch(/animation:[^;]*infinite/);
    expect(network).not.toMatch(/from ['"]three|WebGLRenderer|<canvas/iu);
  });

  it('uses sanitized in-memory public interactions without a network client', async () => {
    const client = createSanitizedPreviewClient();

    await expect(client.request('/api/public/request/options')).resolves.toMatchObject({
      requesterTypes: expect.any(Array),
      events: expect.any(Array),
    });
    await expect(client.request('/api/public/lending/catalog')).resolves.toMatchObject({
      items: expect.any(Array),
    });
    await expect(client.request('/api/public/request', { body: {} })).resolves.toEqual({
      requestId: 'REQ-SAMPLE-2026',
      trackingCode: 'SAMPLE-REQUEST-CODE',
    });
    await expect(client.request('/api/protected-operation')).rejects.toThrow(
      'does not perform that protected operation',
    );
  });
});
