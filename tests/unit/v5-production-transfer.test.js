import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFile(resolve(root, path), 'utf8');

describe('v5 production front-end transfer', () => {
  it('loads the exact modular v5 cascade before the production adapter', async () => {
    const index = await read('src/index.html');
    const entry = await read('src/styles/visual/v5-baseline-entry.css');
    const baseline = index.indexOf('/styles/visual/v5-baseline-entry.css');
    const adapter = index.indexOf('/styles/visual/v5-production.css');

    expect(baseline).toBeGreaterThan(-1);
    expect(adapter).toBeGreaterThan(baseline);
    expect(entry.match(/^@import/gmu)).toHaveLength(10);
    expect(entry).toContain('/styles/v5.css');
    expect(index).not.toContain('impeccable-whole-site-redesign-v6');
  });

  it('keeps the v5 landing and module index on real production routes', async () => {
    const landing = await read('src/visual/portal-navigation.js');
    const index = await read('src/visual/module-index.js');

    for (const route of [
      '/request',
      '/request#request-tracking',
      '/lending',
      '/lending#lending-tracking',
      '/register',
      '/application-status',
      '/portals#module-index',
    ]) {
      expect(`${landing}\n${index}`).toContain(route);
    }
    expect(index).toContain("document.querySelectorAll('#primaryNav button')");
    expect(index).toContain('!button.disabled');
    expect(index).toContain('target?.click()');
    expect(index).not.toContain("reports: 'reports'");
    expect(`${landing}\n${index}`).not.toMatch(/>\s*(?:preview|demo|prototype|v5|v4\.2)\s*</iu);
    expect(`${landing}\n${index}`).not.toMatch(/â|Ã|Â/u);
  });

  it('adapts the production shell without replacing controllers or services', async () => {
    const runtime = await read('src/visual/runtime.js');
    const adapter = await read('src/visual/v5-production-adapter.js');

    expect(runtime).toContain("import { installV5ProductionFrontend } from './v5-production-adapter.js'");
    expect(runtime).toContain("import { installModuleIndex } from './module-index.js'");
    expect(adapter).toContain("addClasses(shell, 'shell')");
    expect(adapter).toContain("addClasses(rail, 'rail')");
    expect(adapter).toContain("addClasses(workspace, 'workspace', 'production-workspace')");
    expect(adapter).not.toMatch(/fetch\(|\/api\//u);
  });

  it('moves every supported profile action into the v5 profile surface', async () => {
    const profile = await read('src/visual/authenticated-account-controls.js');

    expect(profile).toContain("dialog.className = 'account-control-dialog dialog'");
    expect(profile).toContain('class="profile-grid account-profile-overview"');
    expect(profile).toContain('.getProfile()');
    expect(profile).toContain('client.updateProfileContact');
    expect(profile).toContain('client.changeProfileUsername');
    expect(profile).toContain('client.changeProfilePassword');
    expect(profile).toContain('client.requestProfileIdentityCorrection');
    expect(profile).not.toContain('type="file"');
  });

  it('uses the v5 controls with persistent accessible theme behavior', async () => {
    const controls = await read('src/visual/signature-controls.js');
    const styles = await read('src/styles/visual/v5-production.css');

    expect(controls).toContain('celestial__plate celestial-control__plate');
    expect(controls).toContain('class="menu-control"');
    expect(controls).toContain('signature-back back-control');
    expect(controls).toContain('aria-controls="primaryNav"');
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)');
    expect(styles).not.toContain('transition: all');
  });
});
