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
    expect(runtime).toContain('Decisions, readiness, and cross-committee blockers');
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
    expect(runtime).toContain('Keep every meal, deadline, and handoff on time');
    expect(runtime).toContain('Food capability boundary');
    expect(runtime).toContain('foodMetrics');
    expect(css).toContain("body[data-experience='food']");
  });
});
