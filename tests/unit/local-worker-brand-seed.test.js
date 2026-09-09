import { describe, expect, it } from 'vitest';
import {
  LOCAL_BRAND_ASSET_SOURCES,
  extractDataUriLiteral,
  parseBase64DataUri,
} from '../../scripts/local-worker-brand-seed.mjs';

describe('local Worker brand asset seed', () => {
  it('maps each accepted prototype source to its Worker brand object key', () => {
    expect(LOCAL_BRAND_ASSET_SOURCES).toEqual([
      expect.objectContaining({ key: 'brand/login-background' }),
      expect.objectContaining({ key: 'brand/usc-logo' }),
      expect.objectContaining({ key: 'brand/dol-logo' }),
      expect.objectContaining({ key: 'brand/combined-lockup' }),
      expect.objectContaining({ key: 'brand/favicon' }),
      expect.objectContaining({ key: 'brand/default-item-image' }),
    ]);
    expect(LOCAL_BRAND_ASSET_SOURCES.every(({ source }) => source.endsWith('.ts'))).toBe(true);
  });

  it('extracts and strictly decodes a non-empty base64 data URI', () => {
    const dataUri = extractDataUriLiteral('export const logo = "data:image/png;base64,AA==";');
    const asset = parseBase64DataUri(dataUri);

    expect(asset.contentType).toBe('image/png');
    expect(asset.bytes).toEqual(Buffer.from([0]));
  });

  it.each([
    'data:image/png;base64,',
    'data:image/png,AA==',
    'data:image/png;base64,invalid',
    'not-a-data-uri',
  ])('rejects malformed data URI %j', (value) => {
    expect(() => parseBase64DataUri(value)).toThrow(/data URI/u);
  });
});
