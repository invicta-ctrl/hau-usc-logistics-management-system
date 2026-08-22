import { afterEach, describe, expect, it, vi } from 'vitest';
import { AUTH_ROUTES } from '../../src/frontend/app/appRoutes';
import { FrontendApiError, FrontendBackend } from '../../src/frontend/integration/backend.ts';
import { isRouteAuthorized } from '../../src/frontend/integration/routeAccess.ts';

afterEach(() => vi.unstubAllGlobals());

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('Figma frontend backend adapter', () => {
  it('projects signed-out bootstrap and the public advertisement collection from same-origin responses', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }, 401))
      .mockResolvedValueOnce(response({ ok: true, items: [{ id: 'ADV-1', title: 'Published update', imageUrl: '/media/advertisements/ADV-1' }] }));
    vi.stubGlobal('fetch', fetchMock);
    const backend = new FrontendBackend();

    await expect(backend.session()).resolves.toBeNull();
    await expect(backend.publicAdvertisements()).resolves.toMatchObject({
      items: [{ id: 'ADV-1', title: 'Published update', imageUrl: '/media/advertisements/ADV-1' }],
    });
    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual(['/api/auth/session', '/api/public/advertisements']);
  });

  it('uses same-origin session cookies and retains the refreshed CSRF token only in memory', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({
        state: 'AUTHENTICATED',
        csrfToken: 'csrf-session-token',
        user: {
          accountId: 'ACC-1',
          displayName: 'Authorized Staff',
          authorization: {
            active: true,
            mappingStatus: 'MAPPED',
            roleId: 'DOL_STAFF',
            capabilities: ['view.internal', 'view.request'],
          },
        },
      }))
      .mockResolvedValueOnce(response({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);
    const backend = new FrontendBackend();

    await expect(backend.session()).resolves.toMatchObject({
      csrfToken: 'csrf-session-token',
      user: { accountId: 'ACC-1', capabilities: ['view.internal', 'view.request'] },
    });
    await backend.logout();

    expect(fetchMock.mock.calls[0]).toEqual(['/api/auth/session', expect.objectContaining({ method: 'GET', credentials: 'include' })]);
    expect(fetchMock.mock.calls[1]).toEqual(['/api/auth/logout', expect.objectContaining({
      method: 'POST',
      credentials: 'include',
      headers: expect.objectContaining({ 'x-csrf-token': 'csrf-session-token' }),
    })]);
  });

  it('projects login success and starter activation while preserving activation CSRF', async () => {
    const authenticatedUser = {
      accountId: 'ACC-LOGIN',
      displayName: 'Authorized Staff',
      authorization: {
        active: true,
        mappingStatus: 'MAPPED',
        roleId: 'DOL_STAFF',
        capabilities: ['view.internal'],
      },
    };
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ state: 'ACTIVATION_REQUIRED', csrfToken: 'activation-csrf', expiresAt: '2026-08-22T01:00:00.000Z' }))
      .mockResolvedValueOnce(response({ state: 'AUTHENTICATED', csrfToken: 'authenticated-csrf', user: authenticatedUser }))
      .mockResolvedValueOnce(response({ state: 'AUTHENTICATED', csrfToken: 'login-csrf', user: authenticatedUser }));
    vi.stubGlobal('fetch', fetchMock);
    const backend = new FrontendBackend();

    await expect(backend.login('STARTER-1', 'temporary-password')).resolves.toMatchObject({
      activationRequired: true,
      activationExpiresAt: '2026-08-22T01:00:00.000Z',
      session: null,
    });
    await expect(backend.activateStarter({ fullName: 'Authorized Staff', mobileNumber: '+63 917 000 0000', email: 'staff@example.edu.ph' }, 'NewPassword1!', 'NewPassword1!')).resolves.toMatchObject({
      csrfToken: 'authenticated-csrf',
      user: { accountId: 'ACC-LOGIN', capabilities: ['view.internal'] },
    });
    await expect(backend.login('ACTIVE-1', 'active-password')).resolves.toMatchObject({
      activationRequired: false,
      session: { csrfToken: 'login-csrf', user: { accountId: 'ACC-LOGIN' } },
    });
    expect(fetchMock.mock.calls[1][1].headers['x-csrf-token']).toBe('activation-csrf');
    expect(fetchMock.mock.calls[1][1].body).toContain('"profile"');
  });

  it('surfaces generic server login failure without projecting an identity', async () => {
    const fetchMock = vi.fn().mockResolvedValue(response({ code: 'AUTHENTICATION_FAILED', message: 'The credentials could not be verified.' }, 401));
    vi.stubGlobal('fetch', fetchMock);
    const backend = new FrontendBackend();

    await expect(backend.login('UNKNOWN', 'incorrect')).rejects.toMatchObject({
      code: 'AUTHENTICATION_FAILED',
      status: 401,
      message: 'The credentials could not be verified.',
    });
  });

  it('does not authorize Figma routes that the server capability contract withholds', () => {
    const user = { accountId: 'ACC-2', displayName: 'Requester', roleId: 'REQUESTER', capabilities: ['view.request'] };
    expect(isRouteAuthorized(user, 'request-center')).toBe(true);
    expect(isRouteAuthorized(user, 'inventory')).toBe(false);
    expect(isRouteAuthorized(user, 'profile')).toBe(true);
  });

  it('table-drives the full auth-route inventory against its capability contract', () => {
    const expectedCapability = {
      overview: 'view.internal',
      inventory: 'view.inventory',
      'request-center': 'view.request',
      lending: 'view.internal',
      release: 'fulfillment.release',
      restocking: 'view.inventory',
      procurement: 'view.internal',
      events: 'event.manage',
      administration: 'access.admin',
      profile: null,
    };
    expect(Object.keys(expectedCapability).sort()).toEqual([...AUTH_ROUTES].sort());

    const holder = (capability) => ({
      accountId: 'ACC-ROUTE',
      displayName: 'Route Tester',
      roleId: 'STAFF',
      capabilities: capability ? [capability] : [],
    });

    for (const [route, required] of Object.entries(expectedCapability)) {
      if (required) {
        expect(isRouteAuthorized(holder(required), route), `${route} grants its capability`).toBe(true);
        expect(isRouteAuthorized(holder(), route), `${route} withholds without its capability`).toBe(false);
      } else {
        expect(isRouteAuthorized(holder(), route), `${route} needs no extra capability`).toBe(true);
      }
    }
  });

  it('projects public catalog, submission, and tracking responses without inventing receipt state', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({
        ok: true,
        uscDepartments: ['Department of Logistics'],
        items: [{
          id: 'ITM-1', productId: 'ITM-1', name: 'Folding chair', aliases: ['chair'],
          category: 'Furniture', type: 'REUSABLE', availability: 'AVAILABLE', unit: 'piece',
          maximumQuantity: 4, defaultLoanDays: 7, dueDateRequired: true,
          acknowledgmentRequired: false, eligibility: '', handlingNotes: '', description: 'Chair',
          restrictions: '', imageUrl: '', conditionTracked: true,
        }],
      }))
      .mockResolvedValueOnce(response({
        ok: true, submissionId: 'LBR-1', status: 'FOR_REVIEW', trackingCode: 'private-code', submittedAt: '2026-08-22T00:00:00.000Z',
      }))
      .mockResolvedValueOnce(response({
        ok: true,
        request: {
          id: 'REQ-1', requestPurpose: 'EVENT_ACTIVITY_SUPPORT', status: 'FOR_REVIEW',
          createdAt: '2026-08-22T00:00:00.000Z', updatedAt: '2026-08-22T00:00:00.000Z',
          lines: [{ description: 'Wireless microphone', category: 'Logistics / Equipment', quantity: 2, unit: 'set', status: 'FOR_REVIEW' }],
          history: [{ status: 'FOR_REVIEW', at: '2026-08-22T00:00:00.000Z' }],
        },
      }));
    vi.stubGlobal('fetch', fetchMock);
    const backend = new FrontendBackend();

    await expect(backend.publicLendingCatalog()).resolves.toMatchObject({
      items: [{ id: 'ITM-1', name: 'Folding chair', maximumQuantity: 4 }],
      uscDepartments: ['Department of Logistics'],
    });
    await expect(backend.submitPublicLending({ clientRequestId: 'client-1' })).resolves.toEqual({
      id: 'LBR-1', trackingCode: 'private-code', status: 'FOR_REVIEW', submittedAt: '2026-08-22T00:00:00.000Z', replayed: false,
    });
    await expect(backend.trackPublicRequest({ requestId: 'REQ-1', trackingCode: 'private-code' })).resolves.toMatchObject({
      kind: 'request', id: 'REQ-1', status: 'FOR_REVIEW', lines: [{ label: 'Wireless microphone', quantity: 2 }],
    });
    expect(fetchMock.mock.calls.every(([, init]) => init.credentials === 'include')).toBe(true);
  });

  it('keeps verification receipts and application status tokens caller-scoped', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(response({ ok: true, accepted: true, nextAttemptAt: '2026-08-22T00:01:00.000Z' }))
      .mockResolvedValueOnce(response({ ok: true, verificationReceipt: 'verification-receipt', expiresAt: '2026-08-22T00:10:00.000Z' }))
      .mockResolvedValueOnce(response({ ok: true, applicationCode: 'APP-1', state: 'PENDING_ADMIN_REVIEW', revision: 2, statusToken: 'status-token' }))
      .mockResolvedValueOnce(response({ ok: true, applicationCode: 'APP-1', state: 'PENDING_ADMIN_REVIEW', revision: 2, nextStep: 'Wait for review.' }))
      .mockResolvedValueOnce(response({ ok: true, applicationCode: 'APP-1', state: 'WITHDRAWN', revision: 3, nextStep: 'No further action.' }));
    vi.stubGlobal('fetch', fetchMock);
    const backend = new FrontendBackend();

    await expect(backend.startAccountApplicationEmail('person@example.edu.ph')).resolves.toMatchObject({ accepted: true });
    await expect(backend.confirmAccountApplicationEmail('person@example.edu.ph', '00123456')).resolves.toMatchObject({ verificationReceipt: 'verification-receipt' });
    await expect(backend.submitAccountApplication({ verificationReceipt: 'verification-receipt' })).resolves.toMatchObject({ statusToken: 'status-token' });
    await backend.accountApplicationStatus('status-token');
    await backend.withdrawAccountApplication('status-token', { expectedRevision: 2, reason: 'No longer needed', clientRequestId: 'withdraw-1' });

    expect(fetchMock.mock.calls[3][1].headers.authorization).toBe('Bearer status-token');
    expect(fetchMock.mock.calls[4][1].headers.authorization).toBe('Bearer status-token');
    expect(JSON.stringify(backend)).not.toContain('status-token');
  });

  it('surfaces network and server validation failures instead of resolving a fake success', async () => {
    const fetchMock = vi.fn()
      .mockRejectedValueOnce(new TypeError('network down'))
      .mockResolvedValueOnce(response({ code: 'VALIDATION_FAILED', message: 'Choose an approved item.' }, 422));
    vi.stubGlobal('fetch', fetchMock);
    const backend = new FrontendBackend();

    await expect(backend.submitPublicRequest({})).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' });
    const validationFailure = await backend.submitPublicLending({}).catch((error) => error);
    expect(validationFailure).toEqual(expect.objectContaining({
      name: 'FrontendApiError', code: 'VALIDATION_FAILED', status: 422,
    }));
    expect(validationFailure).toBeInstanceOf(FrontendApiError);
  });
});
