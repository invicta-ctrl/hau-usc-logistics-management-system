import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../..');
const read = (path) => readFile(resolve(root, path), 'utf8');
const compact = (value) => value.replace(/\s+/g, ' ').trim();
const withoutGeneratedNotice = (value) =>
  value.replace(
    '<!-- Generated from legacy/HAU-USC_Logistics-Prototype.original.html. Do not hand-edit. -->\n',
    '',
  );

const viewIds = [
  'overview',
  'request',
  'lending',
  'release',
  'restocking',
  'procurement',
  'inventory',
];
const cssModules = [
  'tokens-base',
  'shell',
  'components',
  'overview',
  'forms',
  'tables',
  'overlays',
  'responsive',
];

describe('authoritative visual extraction', () => {
  it('preserves the original body markup across shell and view modules', async () => {
    const source = await read('legacy/HAU-USC_Logistics-Prototype.original.html');
    const originalBody = source.match(/<body>([\s\S]*?)<\/body>/i)[1];
    const originalMarkup = originalBody.replace(/\s*<script>[\s\S]*?<\/script>\s*$/i, '');
    const fragments = await Promise.all([
      read('src/visual/shell-before.html'),
      ...viewIds.map((id) => read(`src/visual/views/${id}.html`)),
      read('src/visual/shell-after.html'),
    ]);
    expect(compact(fragments.map(withoutGeneratedNotice).join(''))).toBe(compact(originalMarkup));
  });

  it('preserves the original CSS cascade across ordered modules', async () => {
    const source = await read('legacy/HAU-USC_Logistics-Prototype.original.html');
    const originalCss = source.match(/<style>([\s\S]*?)<\/style>/i)[1];
    const modules = await Promise.all(
      cssModules.map((name) => read(`src/styles/visual/${name}.css`)),
    );
    expect(compact(modules.join(''))).toBe(compact(originalCss));
  });

  it('keeps the original runtime and interaction hooks attached', async () => {
    const source = await read('legacy/HAU-USC_Logistics-Prototype.original.html');
    const originalRuntime = source.match(/<script>([\s\S]*?)<\/script>\s*<\/body>/i)[1];
    const runtime = await read('src/visual/runtime.js');
    expect(runtime.trim()).toBe(originalRuntime.trim());
    for (const hook of [
      'bindGlobalEvents()',
      'bindRequestEvents()',
      'bindLendingEvents()',
      'bindReleaseEvents()',
      'bindRestockEvents()',
      'bindProcurementEvents()',
      'bindInventoryEvents()',
    ]) {
      expect(runtime).toContain(hook);
    }
  });
});
