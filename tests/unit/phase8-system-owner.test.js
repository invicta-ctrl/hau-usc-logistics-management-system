import { describe, expect, it } from 'vitest';
import { enrichOperationalAuditAfter } from '../../src/server/d1/operational-service.js';

describe('Phase 8 operational audit context', () => {
  it('preserves the business result and records the actual actor, role, workspace, scope, reason, time, and correlation', () => {
    const after = enrichOperationalAuditAfter(
      { ticketId: 'LND-1', status: 'FOR_REVIEW' },
      {
        actorAccountId: 'ACC-OWNER',
        actorRole: 'SYSTEM_OWNER',
        activeWorkspace: 'inventory',
        committeeScope: 'COM_FOOD',
        locationScope: '',
        eventScope: null,
        selectedScope: 'COMMITTEE:COM_FOOD',
        reason: 'Verified owner action',
      },
      '2026-07-26T05:00:00.000Z',
      'REQ_PHASE8',
    );

    expect(after).toEqual({
      ticketId: 'LND-1',
      status: 'FOR_REVIEW',
      operationalContext: {
        actorAccountId: 'ACC-OWNER',
        actorRole: 'SYSTEM_OWNER',
        activeWorkspace: 'inventory',
        committeeScope: 'COM_FOOD',
        locationScope: '',
        eventScope: null,
        selectedScope: 'COMMITTEE:COM_FOOD',
        reason: 'Verified owner action',
        timestamp: '2026-07-26T05:00:00.000Z',
        correlationId: 'REQ_PHASE8',
      },
    });
  });
});
