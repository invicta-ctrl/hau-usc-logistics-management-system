import { describe, expect, it } from 'vitest';
import { inspectBrandAssetBytes } from '../../src/server/brand-asset-service.js';

const text = (value) => new TextEncoder().encode(value);

describe('brand asset byte validation', () => {
  it('derives PNG type and dimensions from bytes instead of client metadata', () => {
    const bytes = new Uint8Array(40);
    bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    bytes.set(text('IHDR'), 12);
    bytes.set([0, 0, 1, 0, 0, 0, 0, 128], 16);

    expect(inspectBrandAssetBytes(bytes)).toMatchObject({
      contentType: 'image/png',
      width: 256,
      height: 128,
    });
  });

  it('accepts self-contained SVG dimensions and rejects active or external content', () => {
    const safe = inspectBrandAssetBytes(
      text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 180"><path d="M0 0h20v20H0z"/></svg>'),
    );
    expect(safe).toMatchObject({ contentType: 'image/svg+xml', width: 320, height: 180 });

    expect(() =>
      inspectBrandAssetBytes(
        text(
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><script>alert(1)</script></svg>',
        ),
      ),
    ).toThrow(/sanitized SVG/u);
    expect(() =>
      inspectBrandAssetBytes(
        text(
          '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><image href="https://example.test/a.png"/></svg>',
        ),
      ),
    ).toThrow(/sanitized SVG/u);
  });
});
