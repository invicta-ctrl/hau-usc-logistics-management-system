import { describe, expect, it } from 'vitest';
import { createLendingUsageService } from '../../src/server/lending-usage-service.js';

function account(roleId, committeeIds = []) {
  return { id: `ACC-${roleId}`, roleId, committeeIds, status: 'ACTIVE' };
}

function database() {
  const calls = [];
  const rowsFor = (sql) => {
    if (sql.includes('GROUP BY ticket.borrower_name')) {
      return [
        {
          staff_name: 'Officer, Synthetic',
          department: 'Department of Logistics',
          request_count: 3,
          consumable_requests: 1,
          consumable_quantity: 4,
          reusable_borrowed: 2,
          reusable_outstanding: 1,
          reusable_overdue: 1,
          first_request_at: '2026-07-01T08:00:00.000Z',
          latest_request_at: '2026-07-24T08:00:00.000Z',
        },
      ];
    }
    if (sql.includes('GROUP BY ticket.item_id')) {
      return [
        {
          item_id: 'ITM-SYNTHETIC',
          item_name: 'Synthetic Projector',
          item_type: 'REUSABLE',
          request_count: 2,
          quantity: 2,
        },
      ];
    }
    if (sql.includes('AS value') && sql.includes('department_organization')) {
      return [{ value: 'Department of Logistics' }];
    }
    if (sql.includes('ticket.borrower_name AS value')) return [{ value: 'Officer, Synthetic' }];
    if (sql.includes('ticket.item_id AS id')) {
      return [{ id: 'ITM-SYNTHETIC', name: 'Synthetic Projector' }];
    }
    return [];
  };
  return {
    calls,
    prepare(sql) {
      const call = { sql, bindings: [] };
      calls.push(call);
      return {
        bind(...bindings) {
          call.bindings = bindings;
          return this;
        },
        async all() {
          return { results: rowsFor(sql) };
        },
      };
    },
  };
}

describe('Lending Usage service', () => {
  it('permits only Director, Administrator, or Inventory-scoped staff', async () => {
    for (const allowed of [
      account('ADMINISTRATOR'),
      account('DIRECTOR'),
      account('DOL_STAFF', ['COM_INVENTORY_PANTRY']),
    ]) {
      await expect(createLendingUsageService({ db: database() }).report({ account: allowed })).resolves.toMatchObject({
        ok: true,
      });
    }
    await expect(
      createLendingUsageService({ db: database() }).report({
        account: account('DOL_STAFF', ['COM_FOOD']),
      }),
    ).rejects.toMatchObject({ code: 'AUTHORIZATION_DENIED', status: 403 });
  });

  it('keeps consumable, reusable, outstanding, and overdue metrics separate with bounded filters', async () => {
    const db = database();
    const result = await createLendingUsageService({ db }).report({
      account: account('ADMINISTRATOR'),
      command: {
        from: '2026-07-01',
        to: '2026-07-31',
        department: 'Department of Logistics',
        staff: 'Synthetic',
        itemId: 'ITM-SYNTHETIC',
      },
      correlationId: 'REQ-USAGE-TEST',
    });
    expect(result).toMatchObject({
      correlationId: 'REQ-USAGE-TEST',
      filters: {
        from: '2026-07-01',
        to: '2026-07-31',
        department: 'Department of Logistics',
        staff: 'Synthetic',
        itemId: 'ITM-SYNTHETIC',
      },
      activity: [
        {
          request_count: 3,
          consumable_requests: 1,
          consumable_quantity: 4,
          reusable_borrowed: 2,
          reusable_outstanding: 1,
          reusable_overdue: 1,
        },
      ],
      frequentItems: [expect.objectContaining({ item_id: 'ITM-SYNTHETIC', item_type: 'REUSABLE' })],
      options: {
        departments: ['Department of Logistics'],
        staff: ['Officer, Synthetic'],
        items: [{ id: 'ITM-SYNTHETIC', name: 'Synthetic Projector' }],
      },
    });
    expect(db.calls[0].bindings).toEqual([
      '2026-07-01',
      '2026-07-31',
      'Department of Logistics',
      'Synthetic',
      'ITM-SYNTHETIC',
    ]);
    await expect(
      createLendingUsageService({ db: database() }).report({
        account: account('DIRECTOR'),
        command: { from: '07/01/2026' },
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED', status: 422 });
  });

  it('exports the separated activity metrics as safe CSV', async () => {
    const csv = await createLendingUsageService({ db: database() }).csv({
      account: account('DIRECTOR'),
    });
    expect(csv).toContain('Consumable requests,Consumable quantity,Reusable borrowed');
    expect(csv).toContain('Reusable outstanding,Reusable overdue');
    expect(csv).toContain('"Officer, Synthetic",Department of Logistics,3,1,4,2,1,1');
  });
});
