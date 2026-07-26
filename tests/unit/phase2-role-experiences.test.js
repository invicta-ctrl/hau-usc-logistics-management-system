import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..', '..');
const read = (path) => readFile(resolve(root, path), 'utf8');

describe('Phase 2 role experiences', () => {
  it('keeps the Director source decisions durable and renders them inside the shared shell', async () => {
    const [digest, runtime, css] = await Promise.all([
      read('.codex/DESIGN_REFERENCE_DIGEST.md'),
      read('src/visual/runtime-extensions.js'),
      read('src/styles/visual/runtime-extensions.css'),
    ]);

    expect(digest).toContain('e2bb882de9bd53598b8a4b5d3886183a37e5731175b4615e8772521a8990b072');
    expect(digest).toContain('decision-first leadership overview');
    expect(runtime).toContain('director: {');
    expect(runtime).toContain("heading: 'Executive Overview'");
    expect(runtime).toContain("['overview', 'Decision Queue'");
    expect(runtime).toContain('renderRoleExperience();');
    expect(css).toContain("body[data-experience='administrator']");
    expect(css).toContain("body[data-experience='inventory-pantry']");
  });

  it('keeps the Food source decisions and capability boundary in the shared experience layer', async () => {
    const [digest, runtime, css] = await Promise.all([
      read('.codex/DESIGN_REFERENCE_DIGEST.md'),
      read('src/visual/runtime-extensions.js'),
      read('src/styles/visual/runtime-extensions.css'),
    ]);

    expect(digest).toContain('0f15dd3c493b471572d3ad417edca6356b691c6d8247e624314871ffbc6f2390');
    expect(digest).toContain('deadline-first Food workspace');
    expect(runtime).toContain("heading: 'Food Overview'");
    expect(runtime).toContain("'Food Work Queue'");
    expect(runtime).toContain('Food capability boundary');
    expect(runtime).toContain('foodMetrics');
    expect(css).toContain("body[data-experience='food']");
  });

  it('keeps Inventory stock semantics and ledger boundary in the shared experience layer', async () => {
    const [digest, runtime, css] = await Promise.all([
      read('.codex/DESIGN_REFERENCE_DIGEST.md'),
      read('src/visual/runtime-extensions.js'),
      read('src/styles/visual/runtime-extensions.css'),
    ]);

    expect(digest).toContain('107f447e9aef8d3b9a377b5d059a745807e744833272e02d55150c5ed30fbf19');
    expect(digest).toContain('exception-first stock workspace');
    expect(runtime).toContain("heading: 'Inventory Overview'");
    expect(runtime).toContain('Inventory authority boundary');
    expect(runtime).toContain('inventoryMetrics');
    expect(css).toContain("body[data-experience='inventory-pantry']");
  });

  it('keeps Materials fulfillment traceability and authority boundaries in the shared experience layer', async () => {
    const [digest, runtime, css] = await Promise.all([
      read('.codex/DESIGN_REFERENCE_DIGEST.md'),
      read('src/visual/runtime-extensions.js'),
      read('src/styles/visual/runtime-extensions.css'),
    ]);

    expect(digest).toContain('0c7b82d130470772c1045dc53a3c1810155b15274cf173c3453fbbb6d1bd09e5');
    expect(digest).toContain('process-oriented fulfillment workspace');
    expect(runtime).toContain("heading: 'Materials Overview'");
    expect(runtime).toContain("'materials-queue'");
    expect(runtime).toContain("'materials-price-history'");
    expect(runtime).toContain('Materials capability boundary');
    expect(runtime).toContain('materialsMetrics');
    expect(css).toContain("body[data-experience='materials']");
  });
});
