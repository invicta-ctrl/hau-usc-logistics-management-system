import { describe, expect, it, vi } from 'vitest';
import {
  StaffAccountActivityHistoryError,
  createStaffAccountActivityHistoryService,
} from '../../src/server/identity-foundation/staff-account-activity-history-service.js';

const personId = 'PER-123E4567-E89B-42D3-A456-426614174000';

function repositoryResult(overrides = {}) {
  return {
    historyStartsAt: '2026-08-20T00:00:00.000Z',
    total: 1,
    items: [
      {
        event_id: 'HIS-0123456789abcdef0123456789abcdef',
        occurred_at: '2026-08-20T00:01:00.000Z',
        event_type: 'ACCOUNT_AUDIT',
        action_code: 'ACCESS_ID_CHANGED',
        account_id: 'ACCOUNT-SYNTHETIC-0001',
        account_access_id_snapshot: 'SYNTHETIC.0001',
        correlation_id: 'ACCESS-SYNTHETIC-0001',
        link_state: 'ACTIVE',
        previous_link_state: null,
        assignment_state: null,
        previous_assignment_state: null,
        old_effective_from: null,
        old_effective_to: null,
        new_effective_from: null,
        new_effective_to: null,
        protected_email_envelope: 'must-not-leak',
        source_id: 'must-not-leak',
      },
    ],
    ...overrides,
  };
}

describe('staff account activity history service', () => {
  it('normalizes the exact read command and returns only the safe DTO allowlist', async () => {
    const repository = {
      listStaffAccountActivityHistory: vi.fn().mockResolvedValue(repositoryResult()),
    };
    const service = createStaffAccountActivityHistoryService({ repository });

    await expect(
      service.list({
        personId: ` ${personId} `,
        query: ' SYNTHETIC.0001 ',
        eventType: 'ACCOUNT_AUDIT',
        actionCode: 'ACCESS_ID_CHANGED',
        page: 2,
        pageSize: 99,
      }),
    ).resolves.toEqual({
      personId,
      historyStartsAt: '2026-08-20T00:00:00.000Z',
      page: 2,
      pageSize: 50,
      total: 1,
      totalPages: 1,
      items: [
        {
          id: 'HIS-0123456789abcdef0123456789abcdef',
          occurredAt: '2026-08-20T00:01:00.000Z',
          eventType: 'ACCOUNT_AUDIT',
          actionCode: 'ACCESS_ID_CHANGED',
          accountId: 'ACCOUNT-SYNTHETIC-0001',
          accountAccessIdSnapshot: 'SYNTHETIC.0001',
          correlationId: 'ACCESS-SYNTHETIC-0001',
          linkState: 'ACTIVE',
          previousLinkState: null,
          assignmentState: null,
          previousAssignmentState: null,
          oldEffectiveFrom: null,
          oldEffectiveTo: null,
          newEffectiveFrom: null,
          newEffectiveTo: null,
        },
      ],
    });
    expect(repository.listStaffAccountActivityHistory).toHaveBeenCalledWith({
      personId,
      query: 'SYNTHETIC.0001',
      eventType: 'ACCOUNT_AUDIT',
      actionCode: 'ACCESS_ID_CHANGED',
      page: 2,
      pageSize: 50,
    });
  });

  it('uses the required defaults and keeps totalPages at zero for an empty retained history', async () => {
    const repository = {
      listStaffAccountActivityHistory: vi.fn().mockResolvedValue(repositoryResult({ total: 0, items: [] })),
    };
    const service = createStaffAccountActivityHistoryService({ repository });

    await expect(service.list({ personId, pageSize: 'not-an-integer' })).resolves.toMatchObject({
      personId,
      page: 1,
      pageSize: 25,
      total: 0,
      totalPages: 0,
      items: [],
    });
  });

  it.each([
    [{}, 'STAFF_ACCOUNT_ACTIVITY_HISTORY_PERSON_ID_INVALID'],
    [{ personId: '' }, 'STAFF_ACCOUNT_ACTIVITY_HISTORY_PERSON_ID_INVALID'],
    [{ personId: 'x'.repeat(129) }, 'STAFF_ACCOUNT_ACTIVITY_HISTORY_PERSON_ID_INVALID'],
    [{ personId, query: '' }, 'STAFF_ACCOUNT_ACTIVITY_HISTORY_QUERY_INVALID'],
    [{ personId, query: 'x'.repeat(121) }, 'STAFF_ACCOUNT_ACTIVITY_HISTORY_QUERY_INVALID'],
    [{ personId, eventType: 'ACCOUNT' }, 'STAFF_ACCOUNT_ACTIVITY_HISTORY_EVENT_TYPE_INVALID'],
    [{ personId, actionCode: 'NOT_A_HISTORY_ACTION' }, 'STAFF_ACCOUNT_ACTIVITY_HISTORY_ACTION_CODE_INVALID'],
    [{ personId, page: 0 }, 'STAFF_ACCOUNT_ACTIVITY_HISTORY_PAGE_INVALID'],
    [{ personId, page: 1.5 }, 'STAFF_ACCOUNT_ACTIVITY_HISTORY_PAGE_INVALID'],
  ])('rejects malformed read input with HTTP 400 semantics', async (command, code) => {
    const repository = { listStaffAccountActivityHistory: vi.fn() };
    const service = createStaffAccountActivityHistoryService({ repository });

    await expect(service.list(command)).rejects.toMatchObject({
      name: StaffAccountActivityHistoryError.name,
      code,
      status: 400,
    });
    expect(repository.listStaffAccountActivityHistory).not.toHaveBeenCalled();
  });
});
