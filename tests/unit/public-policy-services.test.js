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

function rateLimitDb() {
  let count = 0;
  return {
    prepare(sql) {
      const statement = {
        sql: String(sql),
        bind() {
          return statement;
        },
        async first() {
          return statement.sql.includes('COUNT(*)') ? { count } : null;
        },
      };
      return statement;
    },
    async batch(statements) {
      if (statements.some((statement) => statement.sql.includes('rate_limit_events'))) count += 1;
      return [];
    },
  };
}

const secret = 'synthetic-policy-tracking-secret-0000000000000000';

describe('public policy acknowledgment enforcement', () => {
  it.each([
    ['dataUseAcknowledged', {}],
    ['acceptableUseAcknowledged', { dataUseAcknowledged: true }],
    ['evidenceConsentAcknowledged', { dataUseAcknowledged: true, acceptableUseAcknowledged: true }],
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
    ['borrowerResponsibilityAcknowledged', { dataUseAcknowledged: true, acceptableUseAcknowledged: true }],
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

  it.each([
    ['request', createPublicRequestService],
    ['lending', createPublicLendingService],
  ])('bounds a non-abusive %s submission burst before payload processing', async (_name, createService) => {
    const service = createService({ db: rateLimitDb(), trackingSecret: secret });
    for (let index = 0; index < 10; index += 1) {
      await expect(
        service.submit({
          command: { clientRequestId: `bounded-invalid-${index}` },
          networkKey: 'synthetic-bounded-network',
        }),
      ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    }
    await expect(
      service.submit({
        command: { clientRequestId: 'bounded-invalid-throttled' },
        networkKey: 'synthetic-bounded-network',
      }),
    ).rejects.toMatchObject({ code: 'PUBLIC_RATE_LIMITED', status: 429 });
  });
});
