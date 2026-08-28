import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('frontend font policy', () => {
  it('does not request fonts that the deployed same-origin CSP blocks', () => {
    const source = readFileSync(new URL('../../src/frontend/styles/fonts.css', import.meta.url), 'utf8');

    expect(source).not.toMatch(/@import\s+url\(['"]https?:\/\//u);
    expect(source).not.toContain('fonts.googleapis.com');
    expect(source).not.toContain('fonts.gstatic.com');
  });
});
