import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FrontendBackend } from '../../src/frontend/integration/backend.ts';

const administrationSource = readFileSync(
  new URL('../../src/frontend/app/AdministrationRoute.tsx', import.meta.url),
  'utf8',
);

afterEach(() => vi.unstubAllGlobals());

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('FI-10 administration adapter', () => {
  it('loads Accounts and Staff independently so one failed tab cannot collapse the other', () => {
    expect(administrationSource).toContain('setAccountState');
    expect(administrationSource).toContain('setDirectoryState');
    expect(administrationSource).not.toMatch(
      /Promise\.all\(\[\s*frontendBackend\.adminAccountDirectory[\s\S]*frontendBackend\.staffDirectory/u,
    );
  });

  it('projects only permitted account, directory, and activity display fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          state: 'AUTHENTICATED',
          csrfToken: 'csrf-fi10',
          user: {
            accountId: 'ACC-CURRENT',
            displayName: 'Administrator',
            authorization: {
              active: true,
              mappingStatus: 'MAPPED',
              roleId: 'SYSTEM_ADMIN',
              capabilities: ['access.admin'],
            },
          },
        }),
      )
      .mockResolvedValueOnce(
        response({
          ok: true,
          pagination: { page: 1, pageSize: 25, total: 1, totalPages: 1 },
          items: [
            {
              accountId: 'ACC-DO-NOT-RENDER',
              revision: 'REV-DO-NOT-RENDER',
              accessId: 'ADMIN.RECORD',
              displayName: 'Authorized administrator',
              roleId: 'SYSTEM_ADMIN',
              status: 'ACTIVE',
              firstLoginPending: false,
              locked: false,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        response({
          ok: true,
          page: 1,
          pageSize: 25,
          query: '',
          total: 1,
          items: [
            {
              personId: 'PER-OPAQUE-RUNTIME-ONLY',
              displayName: 'Authorized directory identity',
              accessId: 'ADMIN.RECORD',
              linkState: 'ACTIVE',
              emailState: 'ACTIVE_VERIFIED',
              assignmentSummary: {
                activeCount: 1,
                historicalCount: 2,
                quarantinedCount: 0,
                provenanceState: 'PRESENT',
              },
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        response({
          ok: true,
          personId: 'PER-OPAQUE-RUNTIME-ONLY',
          historyStartsAt: '2026-08-01T00:00:00.000Z',
          page: 1,
          pageSize: 25,
          total: 1,
          totalPages: 1,
          items: [
            {
              id: 'EVT-DO-NOT-RENDER',
              occurredAt: '2026-08-25T09:30:00.000Z',
              eventType: 'ACCOUNT_STAFF_LINK',
              actionCode: 'LINK_CREATED',
              accountId: 'ACC-DO-NOT-RENDER',
              accountAccessIdSnapshot: 'SNAPSHOT-DO-NOT-RENDER',
              correlationId: 'CORRELATION-DO-NOT-RENDER',
              linkState: 'ACTIVE',
              previousLinkState: 'UNLINKED',
              assignmentState: null,
              previousAssignmentState: null,
              oldEffectiveFrom: null,
              oldEffectiveTo: null,
              newEffectiveFrom: '2026-08-25T00:00:00.000Z',
              newEffectiveTo: null,
            },
          ],
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const backend = new FrontendBackend();

    await backend.session();
    const accounts = await backend.adminAccountDirectory();
    const directory = await backend.staffDirectory();
    const activity = await backend.staffAccountActivityHistory(directory.items[0].opaquePersonId);

    expect(accounts).toEqual({
      page: 1,
      pageSize: 25,
      total: 1,
      items: [
        {
          accessId: 'ADMIN.RECORD',
          displayName: 'Authorized administrator',
          roleId: 'SYSTEM_ADMIN',
          status: 'ACTIVE',
          firstLoginPending: false,
          locked: false,
        },
      ],
    });
    expect(directory.items[0]).toMatchObject({
      opaquePersonId: 'PER-OPAQUE-RUNTIME-ONLY',
      displayName: 'Authorized directory identity',
      accessId: 'ADMIN.RECORD',
      linkState: 'ACTIVE',
      emailState: 'ACTIVE_VERIFIED',
    });
    expect(activity.items).toEqual([
      {
        occurredAt: '2026-08-25T09:30:00.000Z',
        eventType: 'ACCOUNT_STAFF_LINK',
        actionCode: 'LINK_CREATED',
        linkState: 'ACTIVE',
        previousLinkState: 'UNLINKED',
        assignmentState: '',
        previousAssignmentState: '',
        oldEffectiveFrom: '',
        oldEffectiveTo: '',
        newEffectiveFrom: '2026-08-25T00:00:00.000Z',
        newEffectiveTo: '',
      },
    ]);
    expect(JSON.stringify(activity)).not.toContain('ACC-DO-NOT-RENDER');
    expect(JSON.stringify(activity)).not.toContain('SNAPSHOT-DO-NOT-RENDER');
    expect(JSON.stringify(activity)).not.toContain('CORRELATION-DO-NOT-RENDER');

    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      '/api/auth/session',
      '/api/admin/access/directory',
      '/api/admin/staff-directory',
      '/api/admin/staff-account-activity-history',
    ]);
    expect(fetchMock.mock.calls[1][1]).toEqual(
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({ 'x-csrf-token': 'csrf-fi10' }),
      }),
    );
  });
});
