import { describe, expect, it } from 'vitest';
import { createPublicLendingService } from '../../src/server/public-lending-service.js';
import { createPublicRequestService } from '../../src/server/public-request-service.js';

function preValidationDb() {
  return {
    prepare(sql) {
      const statement = {
        bind() {
          return statement;
        },
        async first() {
          return String(sql).includes('COUNT(*)') ? { count: 0 } : null;
        },
      };
      return statement;
    },
    async batch() {
      return [];
    },
  };
}

const secret = 'synthetic-policy-tracking-secret-0000000000000000';

describe('public policy acknowledgment enforcement', () => {
  it.each([
    ['dataUseAcknowledged', {}],
    ['acceptableUseAcknowledged', { dataUseAcknowledged: true }],
    [
      'evidenceConsentAcknowledged',
      { dataUseAcknowledged: true, acceptableUseAcknowledged: true },
    ],
  ])('rejects public logistics requests missing %s', async (field, acknowledgments) => {
    const service = createPublicRequestService({ db: preValidationDb(), trackingSecret: secret });
    await expect(
      service.submit({
        command: { clientRequestId: `policy-request-${field}`, ...acknowledgments },
        networkKey: 'synthetic-network',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', details: { field } });
  });

  it.each([
    ['dataUseAcknowledged', {}],
    ['acceptableUseAcknowledged', { dataUseAcknowledged: true }],
    [
      'borrowerResponsibilityAcknowledged',
      { dataUseAcknowledged: true, acceptableUseAcknowledged: true },
    ],
    [
      'evidenceConsentAcknowledged',
      {
        dataUseAcknowledged: true,
        acceptableUseAcknowledged: true,
        borrowerResponsibilityAcknowledged: true,
      },
    ],
  ])('rejects public lending submissions missing %s', async (field, acknowledgments) => {
    const service = createPublicLendingService({ db: preValidationDb(), trackingSecret: secret });
    await expect(
      service.submit({
        command: { clientRequestId: `policy-lending-${field}`, ...acknowledgments },
        networkKey: 'synthetic-network',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', details: { field } });
  });
});
