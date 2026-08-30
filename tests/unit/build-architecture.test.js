import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { validateNormalApplicationArtifact } from '../../scripts/build-artifact-lib.mjs';

const root = resolve(import.meta.dirname, '../..');
const read = (file) => readFile(resolve(root, file), 'utf8');

describe('MFR-002 canonical build architecture', () => {
  it('uses one normal application build and no active shareable/demo scripts', async () => {
    const [packageJson, viteConfig, gitignore] = await Promise.all([
      read('package.json').then(JSON.parse),
      read('vite.config.js'),
      read('.gitignore'),
    ]);

    expect(packageJson.scripts.build).toBe(
      'npm run verify:frontend:fixture-boundary && npm run design:foundation:check && vite build --mode application',
    );
    expect(Object.keys(packageJson.scripts)).not.toContain('build:share');
    expect(Object.keys(packageJson.scripts)).not.toContain('build:legacy-artifacts');
    expect(packageJson.devDependencies).not.toHaveProperty('vite-plugin-singlefile');
    expect(Object.keys(packageJson.dependencies).sort()).toEqual(['lucide-react', 'react', 'react-dom']);
    expect(viteConfig).not.toMatch(/viteSingleFile|inlineDynamicImports|singleFileBuild/u);
    expect(viteConfig).toContain("base: '/'");
    expect(viteConfig).toContain('assetsInlineLimit: 4096');
    expect(viteConfig).toContain('largeHeroMediaChunks()');
    expect(gitignore).toMatch(/^\/dist\/$/mu);
  });

  it('removes the retired generator, outputs, tests, and operator docs as one unit', async () => {
    const retiredPaths = [
      'HAU-USC_Logistics-Frontend-Shareable.html',
      'hau-usc-logistics-guided-demo.html',
      'scripts/create-frontend-shareable.mjs',
      'scripts/create-shareable.mjs',
      'scripts/guided-demo.mjs',
      'scripts/shareable-module-registry.mjs',
      'tests/e2e/shareable-modules.spec.js',
      'tests/unit/guided-demo.test.js',
      'tests/unit/shareable-modules.test.js',
      'docs/DEMO_RUNBOOK.md',
      'docs/FINAL_DEMO_BASELINE.md',
      'docs/SHAREABLE_HTML_MODULES.md',
    ];

    for (const retiredPath of retiredPaths) {
      await expect(access(resolve(root, retiredPath))).rejects.toThrow();
    }
  });

  it('emits a cacheable deep-link-safe artifact within the deployment asset budget', async () => {
    const report = await validateNormalApplicationArtifact(resolve(root, 'dist'));

    expect(report.entryHtmlBytes).toBeLessThan(100_000);
    expect(report.entryHtmlSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(report.manifestSha256).toMatch(/^[0-9a-f]{64}$/u);
    expect(report.directAssetRequests).toBeGreaterThanOrEqual(2);
    expect(report.emittedJavaScriptFiles).toBeGreaterThanOrEqual(1);
    expect(report.emittedCssFiles).toBeGreaterThanOrEqual(1);
    expect(report.files.every((entry) => entry.bytes <= 20_000_000)).toBe(true);
  });

  it('keeps all static and isolated Worker configurations on SPA fallback', async () => {
    const [previewConfig, privateConfig, privatePlayground] = await Promise.all([
      read('cloudflare/wrangler.preview.jsonc').then(JSON.parse),
      read('scripts/create-private-cloudflare-configs.mjs'),
      read('scripts/playground/create-private-config.mjs'),
    ]);

    expect(previewConfig.assets.not_found_handling).toBe('single-page-application');
    expect(privateConfig).toContain("not_found_handling: 'single-page-application'");
    expect(privatePlayground).toContain("not_found_handling: 'single-page-application'");
  });
});
