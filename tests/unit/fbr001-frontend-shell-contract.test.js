import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { APP_ROUTES, AUTH_ROUTES } from '../../src/frontend/app/appRoutes.ts';
import { projectSession } from '../../src/frontend/app/useAppController.ts';
import { FOUNDATION_TOKENS, STRUCTURAL_WIDTHS } from '../../scripts/design/foundation-source.mjs';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));

async function source(relativePath) {
  return readFile(resolve(root, relativePath), 'utf8');
}

describe('FBR-001 frontend shell contract', () => {
  it('keeps the complete current Playground route registry while distinguishing public and authenticated surfaces', () => {
    expect(APP_ROUTES).toEqual([
      'landing', 'tracking', 'borrow', 'staff-signin', 'external-request',
      'overview', 'inventory', 'request-center', 'lending', 'release',
      'restocking', 'procurement', 'events', 'administration', 'profile',
    ]);
    expect(AUTH_ROUTES).toEqual([
      'overview', 'inventory', 'request-center', 'lending', 'release',
      'restocking', 'procurement', 'events', 'administration', 'profile',
    ]);
  });

  it('continues to derive shell visibility from the server capability projection', () => {
    const session = projectSession({
      accountId: 'FBR-OWNER',
      displayName: 'FBR Owner',
      roleId: 'SYSTEM_OWNER',
      capabilities: ['view.internal', 'view.inventory', 'event.manage', 'access.admin'],
    });

    expect(session.capabilities).toEqual(expect.arrayContaining(['overview', 'inventory', 'events', 'administration']));
    expect(session.serverCapabilities).toEqual(['view.internal', 'view.inventory', 'event.manage', 'access.admin']);
  });

  it('keeps the external request center and Workbench shell session-gated by the existing renderer', async () => {
    const renderer = await source('src/frontend/app/AppRouteRenderer.tsx');

    expect(renderer).toContain("route === 'external-request' && session");
    expect(renderer).toContain('AuthenticatedShell');
    expect(renderer).toContain('serverCapabilities.includes');
    expect(renderer).not.toContain('localStorage');
  });

  it('uses the canonical generated foundation at every required responsive inspection width', async () => {
    expect(STRUCTURAL_WIDTHS).toEqual([320, 375, 390, 414, 768, 1024, 1440, 1920]);
    expect(FOUNDATION_TOKENS['control-hit-area-min']).toBe('2.75rem');
    const foundation = await source('src/frontend/styles/foundation.css');
    expect(foundation).toContain('Accepted structural widths: 320 / 375 / 390 / 414 / 768 / 1024 / 1440 / 1920 CSS px');
    expect(foundation).toContain('.workbench-command');
    expect(foundation).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('self-hosts only the four Claude Latin font roles and presents a truthful command panel', async () => {
    const [fonts, topbar] = await Promise.all([
      source('src/frontend/styles/fonts.css'),
      source('src/frontend/app/shell/AuthShellTopbar.tsx'),
    ]);

    for (const asset of [
      'bricolage-grotesque-latin.woff2',
      'ibm-plex-sans-latin.woff2',
      'ibm-plex-mono-latin-500.woff2',
      'newsreader-latin.woff2',
    ]) {
      expect(fonts).toContain(asset);
    }
    expect(fonts).not.toMatch(/https?:\/\//u);
    expect(topbar).toContain('data-command-panel');
    expect(topbar).toContain('{routeLabel}');
    expect(topbar).not.toContain('data-command-search');
  });
});
