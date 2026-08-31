import { readFileSync } from 'node:fs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FrontendBackend } from '../../src/frontend/integration/backend.ts';

const supplyRoutesSource = readFileSync(
  new URL('../../src/frontend/app/SupplyRoutes.tsx', import.meta.url),
  'utf8',
);
const eventReadinessSource = readFileSync(
  new URL('../../src/frontend/app/events/EventReadinessRoute.tsx', import.meta.url),
  'utf8',
);
const appRouteRendererSource = readFileSync(
  new URL('../../src/frontend/app/AppRouteRenderer.tsx', import.meta.url),
  'utf8',
);

afterEach(() => vi.unstubAllGlobals());

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const sessionPayload = {
  ok: true,
  state: 'AUTHENTICATED',
  csrfToken: 'csrf-fi11',
  user: {
    accountId: 'CURRENT-ACCOUNT-DO-NOT-RENDER',
    displayName: 'Authorized operator',
    authorization: {
      active: true,
      mappingStatus: 'MAPPED',
      roleId: 'SYSTEM_OWNER',
      capabilities: ['reference.manage', 'brand.manage', 'event.manage', 'system.admin'],
    },
  },
};

describe('FI-11 governed frontend projections', () => {
  it('keeps Events capability-gated with terminal denial, unavailable, abort, and retry states', () => {
    expect(appRouteRendererSource).toContain(
      "eventAllowed={session.serverCapabilities.includes('event.manage')}",
    );
    expect(supplyRoutesSource).toContain('<EventReadinessRoute');
    expect(eventReadinessSource).toContain('if (!eventAllowed)');
    expect(eventReadinessSource).toContain('const abort = new AbortController()');
    expect(eventReadinessSource).toContain("? 'denied'");
    expect(eventReadinessSource).toContain('onClick={() => setReloadKey((value) => value + 1)}');
    expect(eventReadinessSource).toContain('Retry read-only load');
    expect(eventReadinessSource).toContain('inspection ? previewEventManagement : null');
  });

  it('projects only approved reference, brand, event, and system fields', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(sessionPayload))
      .mockResolvedValueOnce(
        response({
          ok: true,
          items: [
            {
              id: 'REF-LINK-INTERNAL-DO-NOT-RENDER',
              label: 'Student council handbook',
              url: 'https://hau.example.test/handbook?private=DO-NOT-RENDER#anchor',
              linkType: 'POLICY',
              audience: 'COUNCIL',
              status: 'PUBLISHED',
              syncState: 'CURRENT',
              updatedAt: '2026-08-26T10:00:00.000Z',
              archivedAt: '',
              revision: 'REF-REVISION-DO-NOT-RENDER',
              correlationId: 'REF-CORRELATION-DO-NOT-RENDER',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        response({
          ok: true,
          slots: [
            {
              id: 'R2-BRAND-SLOT-DO-NOT-RENDER',
              label: 'Primary lockup',
              public_path: '/media/brand/primary-lockup.svg',
              published_version_id: 'BRAND-VERSION-DO-NOT-RENDER',
              published_at: '2026-08-26T11:00:00.000Z',
              content_hash: 'BRAND-HASH-DO-NOT-RENDER',
              actor_account_id: 'BRAND-ACTOR-DO-NOT-RENDER',
              correlation_id: 'BRAND-CORRELATION-DO-NOT-RENDER',
            },
          ],
          versions: [{ id: 'VERSION-DO-NOT-RENDER' }],
          history: [{ id: 'HISTORY-DO-NOT-RENDER' }],
        }),
      )
      .mockResolvedValueOnce(
        response({
          ok: true,
          correlationId: 'EVENT-CORRELATION-DO-NOT-RENDER',
          eventSeries: [
            {
              id: 'SERIES-DO-NOT-RENDER',
              name: 'Council assembly',
              code: 'ASSEMBLY-2026',
              status: 'ACTIVE',
              sourceId: 'SOURCE-DO-NOT-RENDER',
            },
          ],
          eventDays: [
            {
              id: 'DAY-DO-NOT-RENDER',
              seriesId: 'SERIES-DO-NOT-RENDER',
              name: 'Opening day',
              date: '2026-09-01',
              status: 'SCHEDULED',
              supersedesId: 'SUPERSEDES-DO-NOT-RENDER',
            },
          ],
          activities: [
            {
              id: 'ACTIVITY-DO-NOT-RENDER',
              eventDayId: 'DAY-DO-NOT-RENDER',
              name: 'Opening session',
              activityType: 'PLENARY',
              timeStatus: 'ON_TIME',
              status: 'SCHEDULED',
              actorAccountId: 'EVENT-ACTOR-DO-NOT-RENDER',
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        response({
          ok: true,
          correlationId: 'HEALTH-CORRELATION-DO-NOT-RENDER',
          release: 'PRIVATE-RELEASE-DO-NOT-RENDER',
          database: { connected: true, schemaVersion: 'PRIVATE-SCHEMA-DO-NOT-RENDER' },
          dependencies: { r2: 'PRIVATE-DEPENDENCY-DO-NOT-RENDER' },
        }),
      )
      .mockResolvedValueOnce(
        response({
          playground: true,
          actor: { accountId: 'PLAYGROUND-ACTOR-DO-NOT-RENDER' },
          resetCenter: {
            baselineId: 'PLAYGROUND-CLEAN-V2',
            baselineVersion: '2',
            generation: 6,
            workingState: 'CLEAN',
            activeTestSession: false,
            resetAvailable: true,
            confirmationPhrase: 'RESET PLAYGROUND',
            pendingOperation: null,
            lastReset: {
              status: 'PASS',
              generation: 6,
              completedAt: '2026-08-28T06:00:00.000Z',
              oldSessionsInvalidated: 1,
              consequences: ['Previous Playground sessions were invalidated.'],
              operationReference: 'PLAYGROUND-OPERATION-DO-NOT-RENDER',
            },
          },
          candidate: { commit: 'CANDIDATE-DO-NOT-RENDER' },
          correlationId: 'PLAYGROUND-CORRELATION-DO-NOT-RENDER',
        }),
      )
      .mockResolvedValueOnce(
        response({
          ok: true,
          ready: true,
          correlationId: 'READINESS-CORRELATION-DO-NOT-RENDER',
          checks: [{ dependency: 'PRIVATE-CHECK-DO-NOT-RENDER' }],
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const backend = new FrontendBackend();
    await backend.session();
    const links = await backend.referenceLinks();
    const brandSlots = await backend.brandAssetSlots();
    const events = await backend.eventManagement();
    const system = await backend.systemStatus();

    expect(links).toEqual([
      {
        label: 'Student council handbook',
        destination: 'https://hau.example.test/handbook',
        linkType: 'POLICY',
        audience: 'COUNCIL',
        status: 'PUBLISHED',
        syncState: 'CURRENT',
        updatedAt: '2026-08-26T10:00:00.000Z',
        archivedAt: '',
      },
    ]);
    expect(brandSlots).toEqual([
      {
        label: 'Primary lockup',
        publicPath: '/media/brand/primary-lockup.svg',
        publicationState: 'PUBLISHED',
        publishedAt: '2026-08-26T11:00:00.000Z',
      },
    ]);
    expect(events).toEqual({
      series: [{ name: 'Council assembly', code: 'ASSEMBLY-2026', status: 'ACTIVE' }],
      days: [
        { seriesName: 'Council assembly', name: 'Opening day', date: '2026-09-01', status: 'SCHEDULED' },
      ],
      activities: [
        {
          name: 'Opening session',
          seriesName: 'Council assembly',
          date: '2026-09-01',
          activityType: 'PLENARY',
          status: 'SCHEDULED',
          timeStatus: 'ON_TIME',
        },
      ],
    });
    expect(system).toEqual({
      technicalResponse: 'RESPONSE_RECEIVED',
      readiness: 'REPORTED_READY',
      playground: {
        baselineId: 'PLAYGROUND-CLEAN-V2',
        baselineVersion: '2',
        generation: 6,
        workingState: 'CLEAN',
        activeTestSession: false,
        resetAvailable: true,
        confirmationPhrase: 'RESET PLAYGROUND',
        pendingOperation: null,
        lastReset: {
          status: 'PASS',
          generation: 6,
          completedAt: '2026-08-28T06:00:00.000Z',
          oldSessionsInvalidated: 1,
          consequences: ['Previous Playground sessions were invalidated.'],
        },
      },
    });

    const rendered = JSON.stringify({ links, brandSlots, events, system });
    for (const forbidden of [
      'DO-NOT-RENDER',
      'private=DO-NOT-RENDER',
      'R2-BRAND-SLOT',
      'BRAND-HASH',
      'EVENT-CORRELATION',
      'PRIVATE-RELEASE',
      'PRIVATE-SCHEMA',
      'PRIVATE-DEPENDENCY',
      'PRIVATE-CHECK',
      'PLAYGROUND-ACTOR',
      'PLAYGROUND-OPERATION',
      'PLAYGROUND-CORRELATION',
      'CANDIDATE-DO-NOT-RENDER',
    ]) {
      expect(rendered).not.toContain(forbidden);
    }
    expect(fetchMock.mock.calls.map(([path]) => path)).toEqual([
      '/api/auth/session',
      '/api/admin/reference-links/list',
      '/api/owner/brand-assets/list',
      '/api/getEventManagement',
      '/api/health',
      '/api/playground/status',
      '/api/readiness',
    ]);
    for (const call of fetchMock.mock.calls.slice(1, 4)) {
      expect(call[1]).toEqual(
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({ 'x-csrf-token': 'csrf-fi11' }),
        }),
      );
    }
    for (const call of fetchMock.mock.calls.slice(4)) {
      expect(call[1]).toEqual(expect.objectContaining({ method: 'GET', credentials: 'include' }));
    }
  });

  it('does not overstate readiness when the technical readiness endpoint reports 503', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response({ ok: true, correlationId: 'HEALTH-CORRELATION-DO-NOT-RENDER' }))
      .mockResolvedValueOnce(response({ error: { code: 'PLAYGROUND_ENVIRONMENT_REFUSED' } }, 404))
      .mockResolvedValueOnce(response({ ok: false, ready: false }, 503));
    vi.stubGlobal('fetch', fetchMock);

    await expect(new FrontendBackend().systemStatus()).resolves.toEqual({
      technicalResponse: 'RESPONSE_RECEIVED',
      readiness: 'NOT_REPORTED_READY',
      playground: null,
    });
  });

  it('submits only the exact reset command with the authenticated CSRF token', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(sessionPayload))
      .mockResolvedValueOnce(
        response({
          accepted: true,
          state: 'RESETTING',
          operationReference: 'PLAYGROUND-OPERATION-DO-NOT-RENDER',
          correlationId: 'PLAYGROUND-CORRELATION-DO-NOT-RENDER',
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const backend = new FrontendBackend();
    await backend.session();
    await expect(backend.requestPlaygroundReset('RESET PLAYGROUND')).resolves.toEqual({
      accepted: true,
      state: 'RESETTING',
    });
    expect(fetchMock.mock.calls[1]).toEqual([
      '/api/playground/operation',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({
          'content-type': 'application/json',
          'x-csrf-token': 'csrf-fi11',
        }),
        body: JSON.stringify({ kind: 'RESET', confirmation: 'RESET PLAYGROUND' }),
      }),
    ]);
  });
});
