import { describe, expect, it } from 'vitest';
import {
  INVENTORY_QR,
  buildInventoryQrPayload,
  parseInventoryQrInput,
  parseInventoryQrPayload,
  validateInventoryItemId,
} from '../../src/domain/qr-inventory.js';

describe('inventory QR payload contract', () => {
  it('generates the accepted privacy-minimal V1 payload', () => {
    expect(buildInventoryQrPayload('ITM-0001')).toBe('HAU-USC|ITEM|ITM-0001|V1');
    expect(INVENTORY_QR).toEqual({
      namespace: 'HAU-USC',
      entityType: 'ITEM',
      version: 'V1',
      separator: '|',
    });
  });

  it('round-trips a valid item ID without adding protected inventory fields', () => {
    const result = parseInventoryQrPayload('HAU-USC|ITEM|INV-2026-00001|V1');
    expect(result).toEqual({
      ok: true,
      source: 'qr',
      itemId: 'INV-2026-00001',
      payload: 'HAU-USC|ITEM|INV-2026-00001|V1',
      version: 'V1',
    });
    expect(Object.keys(result)).not.toEqual(
      expect.arrayContaining([
        'quantity',
        'onHand',
        'availableToPromise',
        'location',
        'reservation',
        'borrower',
        'supplier',
        'evidence',
        'driveId',
        'url',
      ]),
    );
  });

  it.each([
    ['', 'QR_VALUE_REQUIRED'],
    ['HAU-USC|ITEM|ITM-0001', 'QR_FORMAT_INVALID'],
    ['HAU-USC|ITEM|ITM-0001|V1|EXTRA', 'QR_FORMAT_INVALID'],
    ['OTHER|ITEM|ITM-0001|V1', 'QR_NAMESPACE_UNSUPPORTED'],
    ['HAU-USC|ASSET|ITM-0001|V1', 'QR_ENTITY_UNSUPPORTED'],
    ['HAU-USC|ITEM|ITM-0001|V2', 'QR_VERSION_UNSUPPORTED'],
    ['HAU-USC|ITEM||V1', 'QR_ITEM_ID_REQUIRED'],
    ['HAU-USC|ITEM|ITM 0001|V1', 'QR_ITEM_ID_INVALID'],
  ])('rejects unsafe payload %j with %s', (value, code) => {
    expect(parseInventoryQrPayload(value)).toMatchObject({ ok: false, code });
  });

  it('accepts an exact item ID through the manual fallback and normalizes its payload', () => {
    expect(parseInventoryQrInput('  ITM-0001  ')).toEqual({
      ok: true,
      source: 'manual-item-id',
      itemId: 'ITM-0001',
      payload: 'HAU-USC|ITEM|ITM-0001|V1',
      version: 'V1',
    });
  });

  it('uses strict QR parsing whenever a separator is present', () => {
    expect(parseInventoryQrInput('ITM-0001|unexpected')).toMatchObject({
      ok: false,
      code: 'QR_FORMAT_INVALID',
    });
  });

  it('rejects unsupported item IDs before label generation', () => {
    expect(validateInventoryItemId('ITEM/0001')).toMatchObject({
      ok: false,
      code: 'QR_ITEM_ID_INVALID',
    });
    expect(() => buildInventoryQrPayload('ITEM/0001')).toThrowError(
      'The inventory item ID contains unsupported characters.',
    );
  });
});
