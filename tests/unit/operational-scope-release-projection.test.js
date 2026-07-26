import { describe, expect, it } from 'vitest';
import { filterOperationalData } from '../../src/server/d1/operational-service.js';

describe('operational release projection', () => {
  it('recomputes grouped totals and corrections after location scope removes hidden lines', () => {
    const projected = filterOperationalData(
      {
        inventoryItems: [{ id: 'ITM-VISIBLE', storageLocation: 'LOC-VISIBLE' }],
        releaseConfirmations: [
          {
            id: 'REL-GROUP',
            releasedAt: '2026-07-26T08:00:00.000Z',
            correctedQuantity: 3,
            correctableQuantity: 4,
            status: 'PARTIAL',
            lineReleases: [
              {
                confirmationId: 'REL-VISIBLE',
                itemId: 'ITM-VISIBLE',
                correctedQuantity: 1,
                correctableQuantity: 2,
                status: 'COMPLETED',
              },
              {
                confirmationId: 'REL-HIDDEN',
                itemId: 'ITM-HIDDEN',
                correctedQuantity: 2,
                correctableQuantity: 2,
                status: 'PARTIAL',
              },
            ],
            corrections: [
              {
                id: 'COR-VISIBLE',
                releaseConfirmationId: 'REL-VISIBLE',
                correctedAt: '2026-07-26T09:00:00.000Z',
              },
              {
                id: 'COR-HIDDEN',
                releaseConfirmationId: 'REL-HIDDEN',
                correctedAt: '2026-07-26T10:00:00.000Z',
              },
            ],
          },
        ],
        releaseCorrections: [
          { id: 'COR-VISIBLE', releaseConfirmationId: 'REL-VISIBLE' },
          { id: 'COR-HIDDEN', releaseConfirmationId: 'REL-HIDDEN' },
        ],
      },
      { kind: 'LOCATION', id: 'LOC-VISIBLE' },
    );

    expect(projected.releaseConfirmations).toEqual([
      expect.objectContaining({
        id: 'REL-GROUP',
        correctedQuantity: 1,
        correctableQuantity: 2,
        status: 'COMPLETED',
        updatedAt: '2026-07-26T09:00:00.000Z',
        lineReleases: [expect.objectContaining({ confirmationId: 'REL-VISIBLE' })],
        corrections: [expect.objectContaining({ id: 'COR-VISIBLE' })],
      }),
    ]);
    expect(projected.releaseCorrections).toEqual([
      expect.objectContaining({ id: 'COR-VISIBLE' }),
    ]);
  });
});
