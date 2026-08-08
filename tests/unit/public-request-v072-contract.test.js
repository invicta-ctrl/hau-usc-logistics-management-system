import { describe, expect, it } from 'vitest';
import { createPublicRequestService } from '../../src/server/public-request-service.js';
import { REQUEST_PURPOSES } from '../../src/domain/request-purpose.js';

const trackingSecret = 'synthetic-public-request-contract-secret-000000000000';

function createDb() {
  const state = {
    batches: [],
    requestId: null,
    requestType: null,
    clientRequestId: null,
    idempotency: new Map(),
  };

  const db = {
    prepare(sql) {
      const statement = {
        sql: String(sql),
        values: [],
        bind(...values) {
          statement.values = values;
          return statement;
        },
        async first() {
          if (statement.sql.includes('COUNT(*)')) return { count: 0 };
          if (statement.sql.includes('FROM idempotency_keys')) {
            return state.idempotency.get(`${statement.values[0]}:${statement.values[1]}`) ?? null;
          }
          if (statement.sql.includes('WHERE created_by = ?1')) {
            return state.clientRequestId && statement.values[1] === state.clientRequestId
              ? { id: state.requestId, status: 'FOR_REVIEW', request_type: state.requestType }
              : null;
          }
          if (statement.sql.includes('FROM events')) return { id: 'EVT-SYNTHETIC' };
          if (statement.sql.includes('FROM inventory_items') && statement.sql.includes('stock_area = ?1')) {
            return { stock_area: 'PANTRY' };
          }
          if (statement.sql.includes('FROM public_request_access')) {
            return {
              id: state.requestId,
              request_type: state.requestType,
              status: 'FOR_REVIEW',
              created_at: '2026-08-03T00:00:00.000Z',
              updated_at: '2026-08-03T00:00:00.000Z',
            };
          }
          if (statement.sql.includes('FROM requests WHERE id = ?1')) {
            return {
              id: state.requestId,
              request_type: state.requestType,
              event_series_id: state.requestType === 'EVENT_LOGISTICS' ? 'SER-SYNTHETIC' : null,
              event_id: state.requestType === 'EVENT_LOGISTICS' ? 'EVT-SYNTHETIC' : null,
              catalog_type: state.requestType === 'CATALOG_RESTOCK' ? 'PANTRY' : null,
              status: 'FOR_REVIEW',
            };
          }
          return null;
        },
        async all() {
          if (statement.sql.includes('FROM request_lines')) {
            return {
              results: [
                {
                  description: 'Synthetic line',
                  category: 'Other',
                  requested_quantity: 1,
                  unit: 'kilogram',
                  status: 'FOR_REVIEW',
                },
              ],
            };
          }
          if (statement.sql.includes('FROM status_history')) {
            return { results: [{ new_status: 'FOR_REVIEW', changed_at: '2026-08-03T00:00:00.000Z' }] };
          }
          return { results: [] };
        },
      };
      return statement;
    },
    async batch(statements) {
      state.batches.push(statements);
      const requestInsert = statements.find((statement) => statement.sql.includes('INSERT INTO requests'));
      if (requestInsert) {
        state.requestId = requestInsert.values[0];
        state.requestType = requestInsert.values[1];
        state.clientRequestId = requestInsert.values[12];
      }
      const idempotencyInsert = statements.find((statement) =>
        statement.sql.includes('INSERT INTO idempotency_keys'),
      );
      if (idempotencyInsert) {
        state.idempotency.set(`${idempotencyInsert.values[0]}:${idempotencyInsert.values[1]}`, {
          actor_account_id: idempotencyInsert.values[2],
          request_fingerprint: idempotencyInsert.values[3],
          result_json: idempotencyInsert.values[4],
        });
      }
      return [];
    },
  };

  return { db, state };
}

function command(overrides = {}) {
  return {
    clientRequestId: 'public-v072-contract-1',
    dataUseAcknowledged: true,
    acceptableUseAcknowledged: true,
    evidenceConsentAcknowledged: true,
    requesterName: 'Synthetic Requester',
    organization: 'Synthetic Organization',
    requesterType: 'HAU office / department',
    email: 'requester@example.com',
    contactNumber: '0917 000 0000',
    purpose: 'Synthetic public Request contract proof.',
    requestPurpose: REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT,
    requestType: 'EVENT_LOGISTICS',
    eventSeriesId: 'SER-SYNTHETIC',
    eventId: 'EVT-SYNTHETIC',
    startDate: '2026-09-01',
    endDate: '2026-09-02',
    lines: [
      {
        category: 'Other',
        description: 'Synthetic line',
        quantity: 1,
        unit: 'kilogram',
      },
    ],
    ...overrides,
  };
}

function serviceAndState() {
  const { db, state } = createDb();
  return { service: createPublicRequestService({ db, trackingSecret }), state };
}

describe('v0.7.2 public Request contract', () => {
  it('publishes both canonical purposes while retaining internal request types', async () => {
    const { service, state } = serviceAndState();
    const options = await service.options();
    expect(options.requestPurposes).toEqual([
      REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT,
      REQUEST_PURPOSES.OFFICE_INVENTORY_PANTRY,
    ]);

    const result = await service.submit({ command: command(), networkKey: 'contract-network' });
    expect(result).toMatchObject({
      requestPurpose: REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT,
      status: 'FOR_REVIEW',
      replayed: false,
    });
    const requestInsert = state.batches
      .flat()
      .find((statement) => statement.sql.includes('INSERT INTO requests'));
    expect(requestInsert.values[1]).toBe('EVENT_LOGISTICS');
    const submissionBatch = state.batches.find((batch) =>
      batch.some((statement) => statement.sql.includes('INSERT INTO requests')),
    );
    expect(submissionBatch.some((statement) => statement.sql.includes('INSERT INTO idempotency_keys'))).toBe(
      true,
    );
  });

  it('accepts office inventory/pantry and legacy requestType-only submissions', async () => {
    const office = command({
      clientRequestId: 'public-v072-office-1',
      requestPurpose: REQUEST_PURPOSES.OFFICE_INVENTORY_PANTRY,
      requestType: 'CATALOG_RESTOCK',
      stockArea: 'PANTRY',
      neededDate: '2026-09-01',
    });
    delete office.eventSeriesId;
    delete office.eventId;
    delete office.startDate;
    delete office.endDate;
    const { service, state } = serviceAndState();
    const officeResult = await service.submit({ command: office, networkKey: 'contract-office-network' });
    expect(officeResult.requestPurpose).toBe(REQUEST_PURPOSES.OFFICE_INVENTORY_PANTRY);
    expect(state.requestType).toBe('CATALOG_RESTOCK');

    const legacy = command({ clientRequestId: 'public-v072-legacy-1' });
    delete legacy.requestPurpose;
    const legacyResult = await service.submit({ command: legacy, networkKey: 'contract-legacy-network' });
    expect(legacyResult.requestPurpose).toBe(REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT);

    const canonicalPurposeOnly = command({
      clientRequestId: 'public-v072-purpose-only-1',
      purpose: REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT,
    });
    delete canonicalPurposeOnly.requestPurpose;
    delete canonicalPurposeOnly.requestType;
    const purposeOnlyResult = await service.submit({
      command: canonicalPurposeOnly,
      networkKey: 'contract-purpose-only-network',
    });
    expect(purposeOnlyResult.requestPurpose).toBe(REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT);
  });

  it.each(['2.02', '2.03', '0.06', '1e2', ' 1 ', { valueOf: () => 1 }])(
    'rejects non-canonical quantity input %s for every unit class',
    async (quantity) => {
      const { service } = serviceAndState();
      await expect(
        service.submit({
          command: command({
            clientRequestId: `quantity-${typeof quantity === 'string' ? quantity : 'object'}`,
            lines: [{ category: 'Other', description: 'Synthetic line', quantity, unit: 'kilogram' }],
          }),
          networkKey: 'contract-quantity-network',
        }),
      ).rejects.toMatchObject({
        code: 'VALIDATION_FAILED',
        details: { field: 'lines[0].quantity' },
      });
    },
  );

  it('accepts one and never writes a stock movement during submission', async () => {
    const { service, state } = serviceAndState();
    const oneCommand = command({
      lines: [{ category: 'Other', description: 'One', quantity: 1, unit: 'kilogram' }],
    });
    const result = await service.submit({
      command: oneCommand,
      networkKey: 'contract-one-network',
    });
    expect(result.requestPurpose).toBe(REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT);
    const sql = state.batches
      .flat()
      .map((statement) => statement.sql)
      .join('\n');
    expect(sql).not.toMatch(/(?:inventory|reservation|ledger)/iu);

    const replay = await service.submit({
      command: oneCommand,
      networkKey: 'contract-replay-network',
    });
    expect(replay).toMatchObject({ replayed: true, requestPurpose: REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT });
    expect(
      state.batches.flat().filter((statement) => statement.sql.includes('INSERT INTO requests')),
    ).toHaveLength(1);

    await expect(
      service.submit({
        command: command({
          clientRequestId: 'public-v072-contract-1',
          purpose: 'A changed public request payload.',
        }),
        networkKey: 'contract-changed-replay-network',
      }),
    ).rejects.toMatchObject({ code: 'PUBLIC_REQUEST_CONFLICT', status: 409 });
    expect(
      state.batches.flat().filter((statement) => statement.sql.includes('INSERT INTO requests')),
    ).toHaveLength(1);
  });

  it('returns the canonical purpose in private tracking without returning the tracking secret', async () => {
    const { service } = serviceAndState();
    const submitted = await service.submit({
      command: command(),
      networkKey: 'contract-track-submit-network',
    });
    const tracked = await service.track({
      command: { requestId: submitted.requestId, trackingCode: submitted.trackingCode },
      networkKey: 'contract-track-network',
    });
    expect(tracked.request).toMatchObject({ requestPurpose: REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT });
    expect(tracked.request).not.toHaveProperty('trackingCode');
  });

  it('fails closed for a historical retry key without a durable payload fingerprint', async () => {
    const { service, state } = serviceAndState();
    state.requestId = 'REQ-HISTORICAL-PUBLIC';
    state.requestType = 'EVENT_LOGISTICS';
    state.clientRequestId = 'public-v072-historical-1';

    await expect(
      service.submit({
        command: command({ clientRequestId: state.clientRequestId }),
        networkKey: 'contract-historical-network',
      }),
    ).rejects.toMatchObject({ code: 'PUBLIC_REQUEST_CONFLICT', status: 409 });
    expect(
      state.batches.flat().some((statement) => statement.sql.includes('INSERT INTO requests')),
    ).toBe(false);
  });

  it('rejects event requests carrying non-empty office-only fields', async () => {
    const { service } = serviceAndState();
    await expect(
      service.submit({
        command: command({ stockArea: 'PANTRY' }),
        networkKey: 'contract-event-hidden-network',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', details: { field: 'stockArea' } });
  });

  it('rejects office requests carrying non-empty event-only fields', async () => {
    const { service } = serviceAndState();
    await expect(
      service.submit({
        command: command({
          requestPurpose: REQUEST_PURPOSES.OFFICE_INVENTORY_PANTRY,
          requestType: 'CATALOG_RESTOCK',
          eventSeriesId: 'SER-SYNTHETIC',
          eventId: 'EVT-SYNTHETIC',
          stockArea: 'PANTRY',
          neededDate: '2026-09-01',
        }),
        networkKey: 'contract-office-hidden-network',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', details: { field: 'eventSeriesId' } });
  });

  it('rejects contradictory legacy requestType values against requestPurpose', async () => {
    const { service } = serviceAndState();
    await expect(
      service.submit({
        command: command({
          requestPurpose: REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT,
          requestType: 'CATALOG_RESTOCK',
        }),
        networkKey: 'contract-discriminator-network',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', details: { field: 'requestType' } });
  });
});
