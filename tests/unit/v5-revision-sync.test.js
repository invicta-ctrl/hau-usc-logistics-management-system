import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  canCommitV5RevisionRefresh,
  createV5AsyncBoundary,
  createV5RevisionSync,
  createV5ScopedRevisionReader,
  isV5AuthenticationBoundaryCode,
  selectDefaultWorkspaceRoute,
} from '../../src/v5/integration/runtime.js';

const scopedEnvelope = ({ scope = 'request', token = 1, enabled = true } = {}) => ({
  ok: true,
  correlationId: 'v5-revision-test',
  data: {
    contract: 'scoped-revision',
    contractVersion: 1,
    enabled,
    scope,
    token,
    globalRevision: token,
    updatedAt: '2026-08-12T00:00:00.000Z',
    environment: 'STAGING',
    metrics: { revisionReads: 1, moduleReads: 0, requestCount: 1 },
  },
});

function eventTarget(properties = {}) {
  const target = new EventTarget();
  Object.assign(target, properties);
  return target;
}

function scheduledClock() {
  let nextId = 0;
  const pending = new Map();
  return {
    pending,
    schedule: vi.fn((callback, delay) => {
      const id = ++nextId;
      pending.set(id, { callback, delay });
      return id;
    }),
    cancel: vi.fn((id) => pending.delete(id)),
  };
}

async function settle(sync) {
  for (let attempt = 0; attempt < 20 && sync.inFlight; attempt += 1) {
    await Promise.resolve();
  }
}

describe('V5 default workspace routing', () => {
  it.each([
    ['administrator', 'admin.overview'],
    ['director', 'director.overview'],
    ['food', 'food.overview'],
    ['inventory-pantry', 'inventory.overview'],
    ['materials', 'materials.overview'],
  ])('maps %s only when %s is server-authorized', (workspaceId, expectedRoute) => {
    expect(selectDefaultWorkspaceRoute(workspaceId, [expectedRoute, 'account.profile'])).toBe(expectedRoute);
  });

  it('uses an authorized deterministic fallback for unknown or denied mappings', () => {
    const authorizedRoutes = ['admin.overview', 'account.profile'];

    const deniedMapping = selectDefaultWorkspaceRoute('director', authorizedRoutes);
    expect(deniedMapping).toBe('account.profile');
    expect(authorizedRoutes).toContain(deniedMapping);
    expect(deniedMapping).not.toBe('director.overview');

    const unknownMapping = selectDefaultWorkspaceRoute('unknown-workspace', authorizedRoutes);
    expect(unknownMapping).toBe('account.profile');
    expect(authorizedRoutes).toContain(unknownMapping);
  });

  it('never treats an unrecognized route as an authorized fallback', () => {
    expect(selectDefaultWorkspaceRoute('administrator', ['admin.unrecognized'])).toBe('public.signin');
  });
});

describe('V5 asynchronous commit boundaries', () => {
  it('invalidates ordinary loads across auth replacement, rapid navigation, and stop', () => {
    let active = true;
    let authGeneration = 7;
    let currentRoute = 'request.queue';
    const boundary = createV5AsyncBoundary({
      getRoute: () => currentRoute,
      getAuthGeneration: () => authGeneration,
      isActive: () => active,
    });
    const projection = {
      state: 'current-state',
      selection: 'current-selection',
      revision: 7,
      renders: 0,
    };
    const commit = (guard, next) => {
      if (!guard()) return false;
      Object.assign(projection, next);
      projection.renders += 1;
      return true;
    };

    const staleAuthLoad = boundary.beginRoute('request.queue');
    authGeneration = 8;
    boundary.invalidateNavigation();
    expect(
      commit(staleAuthLoad, {
        state: 'stale-auth-state',
        selection: 'stale-auth-selection',
        revision: 8,
      }),
    ).toBe(false);

    authGeneration = 9;
    currentRoute = 'request.queue';
    const staleNavigationLoad = boundary.beginRoute('request.queue');
    currentRoute = 'inventory.catalog';
    const currentNavigationLoad = boundary.beginRoute('inventory.catalog');
    expect(
      commit(staleNavigationLoad, {
        state: 'stale-route-state',
        selection: 'stale-route-selection',
        revision: 9,
      }),
    ).toBe(false);
    expect(
      commit(currentNavigationLoad, {
        state: 'inventory-state',
        selection: 'inventory-selection',
        revision: 10,
      }),
    ).toBe(true);

    currentRoute = 'materials.overview';
    const stoppedLoad = boundary.beginRoute('materials.overview');
    active = false;
    boundary.invalidateRuntime();
    expect(
      commit(stoppedLoad, {
        state: 'stopped-state',
        selection: 'stopped-selection',
        revision: 11,
      }),
    ).toBe(false);
    expect(projection).toEqual({
      state: 'inventory-state',
      selection: 'inventory-selection',
      revision: 10,
      renders: 1,
    });
  });

  it('keeps only the newest sign-in attempt current', () => {
    let active = true;
    let currentRoute = 'public.signin';
    const boundary = createV5AsyncBoundary({
      getRoute: () => currentRoute,
      getAuthGeneration: () => 0,
      isActive: () => active,
    });

    const firstAttempt = boundary.beginSignIn();
    const secondAttempt = boundary.beginSignIn();
    expect(firstAttempt()).toBe(false);
    expect(secondAttempt()).toBe(true);

    currentRoute = 'public.landing';
    boundary.beginRoute('public.landing');
    expect(secondAttempt()).toBe(false);
    currentRoute = 'public.signin';
    boundary.beginRoute('public.signin');
    expect(secondAttempt()).toBe(false);
    active = false;
  });

  it.each(['SESSION_REQUIRED', 'SESSION_INVALID', 'AUTH_SESSION_INVALID'])(
    'treats %s as a fail-closed authentication boundary',
    (code) => {
      expect(isV5AuthenticationBoundaryCode(code)).toBe(true);
    },
  );
});

describe('V5 scoped revision integration', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it.each(['SESSION_REQUIRED', 'SESSION_INVALID'])(
    'ends revision polling on %s without retaining a retry or accepted token',
    async (code) => {
      const documentTarget = eventTarget({ visibilityState: 'visible' });
      const windowTarget = eventTarget();
      const clock = scheduledClock();
      let session = { accountId: 'SYNTHETIC-OWNER' };
      let sync;
      const error = Object.assign(new Error('private revision failure detail'), { code });
      const readRevision = vi.fn().mockRejectedValue(error);
      const onAuthenticationBoundary = vi.fn(() => {
        session = null;
        sync.clear();
      });
      const guardedRead = createV5ScopedRevisionReader({
        readRevision,
        onAuthenticationBoundary,
      });
      sync = createV5RevisionSync({
        readRevision: guardedRead,
        refresh: vi.fn(),
        getScope: () => 'request',
        getSession: () => session,
        documentTarget,
        windowTarget,
        isOnline: () => true,
        schedule: clock.schedule,
        cancel: clock.cancel,
        random: () => 0.5,
      });
      sync.seed('request', { scope: 'request', token: 7 });
      sync.start();

      await expect(sync.check('manual')).resolves.toBe(false);
      expect(readRevision).toHaveBeenCalledTimes(1);
      expect(onAuthenticationBoundary).toHaveBeenCalledTimes(1);
      expect(onAuthenticationBoundary).toHaveBeenCalledWith(error);
      expect(sync.acceptedToken('request')).toBeUndefined();
      expect(sync.failures).toBe(0);
      expect(clock.pending.size).toBe(0);

      sync.stop();
    },
  );

  it('ignores a stale revision auth rejection after same-account reauthentication', async () => {
    const documentTarget = eventTarget({ visibilityState: 'visible' });
    const windowTarget = eventTarget();
    const clock = scheduledClock();
    let session = { accountId: 'SYNTHETIC-OWNER', sessionMarker: 'old' };
    let authGeneration = 7;
    let currentRoute = 'request.queue';
    let privateProjection = { marker: 'old-private-state' };
    let rejectRead;
    let signalReadStarted;
    const readStarted = new Promise((resolve) => {
      signalReadStarted = resolve;
    });
    const deferredRead = new Promise((_resolve, reject) => {
      rejectRead = reject;
    });
    const readRevision = vi.fn(() => {
      signalReadStarted();
      return deferredRead;
    });
    const onAuthenticationBoundary = vi.fn(() => {
      session = null;
      privateProjection = null;
    });
    const guardedRead = createV5ScopedRevisionReader({
      readRevision,
      onAuthenticationBoundary,
      captureContext: (scope, request) => ({
        authGeneration,
        route: currentRoute,
        scope,
        requestId: request?.requestId,
      }),
      isContextCurrent: (context) =>
        context.authGeneration === authGeneration &&
        context.route === currentRoute &&
        context.scope === 'request' &&
        Boolean(session),
    });
    const sync = createV5RevisionSync({
      readRevision: guardedRead,
      refresh: vi.fn(),
      getScope: () => 'request',
      getSession: () => session,
      getGeneration: () => authGeneration,
      getRoute: () => currentRoute,
      documentTarget,
      windowTarget,
      isOnline: () => true,
      schedule: clock.schedule,
      cancel: clock.cancel,
      random: () => 0.5,
    });
    sync.seed('request', { scope: 'request', token: 7 });
    sync.start();

    const staleCheck = sync.check('manual');
    await readStarted;
    session = null;
    authGeneration = 8;
    guardedRead.invalidate();
    sync.clear();
    session = { accountId: 'SYNTHETIC-OWNER', sessionMarker: 'new' };
    privateProjection = { marker: 'new-private-state' };
    sync.seed('request', { scope: 'request', token: 9 });
    rejectRead(Object.assign(new Error('old private session failure'), { code: 'SESSION_INVALID' }));

    await expect(staleCheck).resolves.toBe(false);
    expect(onAuthenticationBoundary).not.toHaveBeenCalled();
    expect(session).toEqual({ accountId: 'SYNTHETIC-OWNER', sessionMarker: 'new' });
    expect(privateProjection).toEqual({ marker: 'new-private-state' });
    expect(sync.acceptedToken('request')).toBe(9);
    expect(clock.pending.size).toBe(0);

    currentRoute = 'public.signin';
    sync.stop();
  });

  it('rejects revision refresh token mismatches before any projection commit', () => {
    const expectedRevision = { scope: 'request', token: 8 };
    const projection = {
      state: 'token-7-state',
      selection: 'token-7-selection',
      revision: 7,
      renders: 0,
    };
    const commit = vi.fn((returnedRevision) => {
      if (
        !canCommitV5RevisionRefresh({
          scope: 'request',
          expectedRevision,
          returnedRevision,
        })
      ) {
        return false;
      }
      Object.assign(projection, {
        state: 'token-8-state',
        selection: 'token-8-selection',
        revision: returnedRevision.token,
      });
      projection.renders += 1;
      return true;
    });

    expect(commit({ scope: 'request', token: 7 })).toBe(false);
    expect(commit({ scope: 'overview', token: 8 })).toBe(false);
    expect(projection).toEqual({
      state: 'token-7-state',
      selection: 'token-7-selection',
      revision: 7,
      renders: 0,
    });

    expect(commit({ scope: 'request', token: 8 })).toBe(true);
    expect(projection).toEqual({
      state: 'token-8-state',
      selection: 'token-8-selection',
      revision: 8,
      renders: 1,
    });
  });

  it('seeds the module token and refetches exactly once only for a newer same-scope envelope', async () => {
    const documentTarget = eventTarget({ visibilityState: 'visible' });
    const windowTarget = eventTarget();
    const clock = scheduledClock();
    const responses = [
      scopedEnvelope({ token: 7 }),
      scopedEnvelope({ token: 8 }),
      scopedEnvelope({ token: 8 }),
      scopedEnvelope({ token: 6 }),
      scopedEnvelope({ scope: 'overview', token: 9 }),
    ];
    const readRevision = vi.fn(async () => responses.shift());
    let sync;
    const refresh = vi.fn(async (scope, revision) => {
      expect(scope).toBe('request');
      sync.seed(scope, { scope, token: revision.token, updatedAt: revision.updatedAt });
      return true;
    });
    sync = createV5RevisionSync({
      readRevision,
      refresh,
      getScope: () => 'request',
      getSession: () => ({ accountId: 'SYNTHETIC-OWNER' }),
      documentTarget,
      windowTarget,
      isOnline: () => true,
      schedule: clock.schedule,
      cancel: clock.cancel,
      random: () => 0.5,
    });

    expect(sync.seed('request', { scope: 'request', token: 7, updatedAt: 'seed' })).toBe(true);
    sync.start();

    await expect(sync.check('manual')).resolves.toBe(true);
    expect(refresh).not.toHaveBeenCalled();

    await expect(sync.check('manual')).resolves.toBe(true);
    expect(refresh).toHaveBeenCalledTimes(1);

    await expect(sync.check('manual')).resolves.toBe(true);
    await expect(sync.check('manual')).resolves.toBe(true);
    await expect(sync.check('manual')).resolves.toBe(false);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(sync.acceptedToken('request')).toBe(8);
    expect(sync.failures).toBe(1);

    sync.stop();
  });

  it('keeps focus and reconnect single-flight, pauses while hidden or offline, and removes listeners on stop', async () => {
    const documentTarget = eventTarget({ visibilityState: 'visible' });
    const windowTarget = eventTarget();
    const clock = scheduledClock();
    let online = true;
    let resolveFirst;
    const readRevision = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
      )
      .mockResolvedValue(scopedEnvelope({ token: 2 }));
    let sync;
    const refresh = vi.fn(async (scope, revision) => {
      sync.seed(scope, revision);
      return true;
    });
    sync = createV5RevisionSync({
      readRevision,
      refresh,
      getScope: () => 'request',
      getSession: () => ({ accountId: 'SYNTHETIC-OWNER' }),
      documentTarget,
      windowTarget,
      isOnline: () => online,
      schedule: clock.schedule,
      cancel: clock.cancel,
      random: () => 0.5,
    });
    sync.seed('request', { scope: 'request', token: 1 });
    sync.start();

    windowTarget.dispatchEvent(new Event('focus'));
    windowTarget.dispatchEvent(new Event('online'));
    expect(readRevision).toHaveBeenCalledTimes(1);
    expect(sync.inFlight).toBe(true);

    resolveFirst(scopedEnvelope({ token: 2 }));
    await settle(sync);
    expect(refresh).toHaveBeenCalledTimes(1);

    documentTarget.visibilityState = 'hidden';
    documentTarget.dispatchEvent(new Event('visibilitychange'));
    windowTarget.dispatchEvent(new Event('focus'));
    expect(readRevision).toHaveBeenCalledTimes(1);

    online = false;
    windowTarget.dispatchEvent(new Event('offline'));
    documentTarget.visibilityState = 'visible';
    documentTarget.dispatchEvent(new Event('visibilitychange'));
    expect(readRevision).toHaveBeenCalledTimes(1);

    online = true;
    windowTarget.dispatchEvent(new Event('online'));
    await settle(sync);
    expect(readRevision).toHaveBeenCalledTimes(2);

    sync.stop();
    windowTarget.dispatchEvent(new Event('focus'));
    windowTarget.dispatchEvent(new Event('online'));
    documentTarget.dispatchEvent(new Event('visibilitychange'));
    expect(readRevision).toHaveBeenCalledTimes(2);
    expect(clock.cancel).toHaveBeenCalled();
  });

  it('retains bounded backoff after safe polling failures', async () => {
    const documentTarget = eventTarget({ visibilityState: 'visible' });
    const windowTarget = eventTarget();
    const clock = scheduledClock();
    const onAuthenticationBoundary = vi.fn();
    const readRevision = vi.fn().mockRejectedValue(new Error('synthetic revision failure'));
    const sync = createV5RevisionSync({
      readRevision: createV5ScopedRevisionReader({
        readRevision,
        onAuthenticationBoundary,
      }),
      refresh: vi.fn(),
      getScope: () => 'request',
      getSession: () => ({ accountId: 'SYNTHETIC-OWNER' }),
      documentTarget,
      windowTarget,
      isOnline: () => true,
      schedule: clock.schedule,
      cancel: clock.cancel,
      random: () => 0.5,
    });
    sync.seed('request', { scope: 'request', token: 1 });
    sync.start();

    await expect(sync.check('manual')).resolves.toBe(false);
    expect(clock.schedule.mock.calls.at(-1)[1]).toBe(15_000);
    await expect(sync.check('manual')).resolves.toBe(false);
    expect(clock.schedule.mock.calls.at(-1)[1]).toBe(30_000);
    expect(readRevision).toHaveBeenCalledTimes(2);
    expect(onAuthenticationBoundary).not.toHaveBeenCalled();

    sync.stop();
  });

  it('keeps a disabled revision contract manual-only until a later manual check reenables it', async () => {
    const documentTarget = eventTarget({ visibilityState: 'visible' });
    const windowTarget = eventTarget();
    const clock = scheduledClock();
    const readRevision = vi
      .fn()
      .mockResolvedValueOnce(scopedEnvelope({ token: 2, enabled: false }))
      .mockResolvedValueOnce(scopedEnvelope({ token: 3, enabled: true }));
    let sync;
    const refresh = vi.fn(async (scope, revision) => {
      sync.seed(scope, revision);
      return true;
    });
    sync = createV5RevisionSync({
      readRevision,
      refresh,
      getScope: () => 'request',
      getSession: () => ({ accountId: 'SYNTHETIC-OWNER' }),
      documentTarget,
      windowTarget,
      isOnline: () => true,
      schedule: clock.schedule,
      cancel: clock.cancel,
      random: () => 0.5,
    });
    sync.seed('request', { scope: 'request', token: 1 });
    sync.start();

    await expect(sync.check('manual')).resolves.toBe(true);
    expect(refresh).not.toHaveBeenCalled();
    windowTarget.dispatchEvent(new Event('focus'));
    windowTarget.dispatchEvent(new Event('online'));
    expect(readRevision).toHaveBeenCalledTimes(1);

    await expect(sync.check('manual')).resolves.toBe(true);
    expect(readRevision).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(sync.acceptedToken('request')).toBe(3);
    expect(clock.pending.size).toBe(1);

    sync.stop();
  });

  it('resets disabled automatic polling across an authentication boundary', async () => {
    const documentTarget = eventTarget({ visibilityState: 'visible' });
    const windowTarget = eventTarget();
    const clock = scheduledClock();
    let session = { accountId: 'SYNTHETIC-OWNER' };
    const readRevision = vi
      .fn()
      .mockResolvedValueOnce(scopedEnvelope({ token: 2, enabled: false }))
      .mockResolvedValueOnce(scopedEnvelope({ token: 3, enabled: true }));
    let sync;
    const refresh = vi.fn(async (scope, revision) => {
      sync.seed(scope, revision);
      return true;
    });
    sync = createV5RevisionSync({
      readRevision,
      refresh,
      getScope: () => 'request',
      getSession: () => session,
      documentTarget,
      windowTarget,
      isOnline: () => true,
      schedule: clock.schedule,
      cancel: clock.cancel,
      random: () => 0.5,
    });
    sync.seed('request', { scope: 'request', token: 1 });
    sync.start();

    await expect(sync.check('manual')).resolves.toBe(true);
    expect(readRevision).toHaveBeenCalledTimes(1);
    expect(refresh).not.toHaveBeenCalled();

    session = null;
    sync.clear();
    session = { accountId: 'SYNTHETIC-OWNER-B' };
    sync.seed('request', { scope: 'request', token: 2 });
    sync.start();

    await expect(sync.resume('scope-change')).resolves.toBe(true);
    expect(readRevision).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(sync.acceptedToken('request')).toBe(3);
    expect(clock.pending.size).toBe(1);

    sync.stop();
  });

  it('discards a deferred refresh from the previous authenticated session', async () => {
    const documentTarget = eventTarget({ visibilityState: 'visible' });
    const windowTarget = eventTarget();
    const clock = scheduledClock();
    let session = { accountId: 'SYNTHETIC-OWNER-A' };
    let authGeneration = 7;
    let releaseRefresh;
    let signalRefreshStarted;
    const refreshStarted = new Promise((resolve) => {
      signalRefreshStarted = resolve;
    });
    const refreshGate = new Promise((resolve) => {
      releaseRefresh = resolve;
    });
    const readRevision = vi
      .fn()
      .mockResolvedValueOnce(scopedEnvelope({ token: 2 }))
      .mockResolvedValueOnce(scopedEnvelope({ token: 3 }));
    const committedGenerations = [];
    let sync;
    const refresh = vi.fn(async (scope, revision, context = {}) => {
      signalRefreshStarted();
      await refreshGate;
      if (context.isCurrent?.() === false) return false;
      committedGenerations.push(context.generation);
      sync.seed(scope, revision, { isCurrent: context.isCurrent });
      return true;
    });
    sync = createV5RevisionSync({
      readRevision,
      refresh,
      getScope: () => 'request',
      getSession: () => session,
      getGeneration: () => authGeneration,
      documentTarget,
      windowTarget,
      isOnline: () => true,
      schedule: clock.schedule,
      cancel: clock.cancel,
      random: () => 0.5,
    });
    sync.seed('request', { scope: 'request', token: 1 });
    sync.start();

    const staleCheck = sync.check('manual');
    await refreshStarted;
    session = null;
    authGeneration = 8;
    sync.clear();
    session = { accountId: 'SYNTHETIC-OWNER' };
    releaseRefresh();

    await expect(staleCheck).resolves.toBe(false);
    expect(committedGenerations).toEqual([]);
    expect(sync.acceptedToken('request')).toBeUndefined();

    sync.seed('request', { scope: 'request', token: 2 });
    await expect(sync.resume('scope-change')).resolves.toBe(true);
    expect(readRevision).toHaveBeenCalledTimes(2);
    expect(refresh).toHaveBeenCalledTimes(2);
    expect(committedGenerations).toEqual([8]);
    expect(sync.acceptedToken('request')).toBe(3);
    expect(clock.pending.size).toBe(1);

    sync.stop();
  });
});
