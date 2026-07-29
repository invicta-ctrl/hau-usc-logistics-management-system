import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..', '..');
const read = (path) => readFile(resolve(root, path), 'utf8');

describe('Phase 2 shared shell', () => {
  it('keeps the S0003 decisions durable and implements a role-safe mobile shell', async () => {
    const [digest, css, runtime] = await Promise.all([
      read('.codex/DESIGN_REFERENCE_DIGEST.md'),
      read('src/styles/visual/runtime-extensions.css'),
      read('src/visual/runtime-extensions.js'),
    ]);

    expect(digest).toContain('89d7741b25146806c2ffed8c0bcf85dd58cdba1d84144c6dd65c54ada0318429');
    expect(digest).toContain('No five separate applications');
    expect(css).toContain("body[data-experience='food']");
    expect(css).toContain("body[data-experience='inventory']");
    expect(css).toContain("body[data-experience='materials']");
    expect(css).toContain('@media (max-width: 820px)');
    expect(runtime).toContain('data-shared-mobile-nav');
    expect(runtime).toContain('installSharedMobileNav();');
    expect(runtime).toContain('syncSharedMobileNav();');
  });
});
