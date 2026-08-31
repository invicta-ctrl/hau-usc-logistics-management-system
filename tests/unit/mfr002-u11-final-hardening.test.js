import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const source = (path) => readFile(resolve(root, path), 'utf8');

describe('MFR-002 U11 final visual hardening', () => {
  it('keeps shared loading, public-shell, and footer colors on semantic theme roles', async () => {
    const [app, renderer, footer, shellCss] = await Promise.all([
      source('src/frontend/app/App.tsx'),
      source('src/frontend/app/AppRouteRenderer.tsx'),
      source('src/frontend/app/public/Footer.tsx'),
      source('src/frontend/styles/shell.css'),
    ]);

    expect(app).toContain('route-loading');
    expect(renderer).toContain('public-shell');
    expect(footer).not.toContain('style={{');
    for (const component of [app, renderer, footer]) {
      expect(component).not.toMatch(/#[\da-f]{3,8}/iu);
      expect(component).not.toMatch(/rgba?\(/u);
    }

    for (const contract of [
      '.route-loading {',
      ".route-loading[data-dark='true']",
      '.public-shell {',
      ".public-shell[data-dark='true']",
      '.public-shell__footer {',
      'var(--theme-page',
      'var(--theme-nav',
      'var(--theme-nav-text',
      'var(--theme-accent',
    ]) {
      expect(shellCss, contract).toContain(contract);
    }
  });

  it('declares the governed Worker-backed favicon instead of relying on a browser default', async () => {
    const html = await source('src/index.html');

    expect(html).toContain('<link rel="icon" href="/brand/favicon" />');
    expect(html).not.toContain('href="/favicon.ico"');
  });

  it('keeps the mobile Administration inspector above persistent shell chrome', async () => {
    const css = await source('src/frontend/styles/administration-workspace.css');

    expect(css).toMatch(/\.administration-records-inspector--mobile\s*\{[^}]*z-index:\s*var\(--z-modal\);/su);
  });
});
