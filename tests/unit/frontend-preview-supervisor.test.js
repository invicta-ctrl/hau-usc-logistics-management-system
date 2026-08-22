import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  APP_HTML_MARKER,
  OWNERSHIP_UNKNOWN,
  PREVIEW_HOST,
  PREVIEW_PORT,
  PreviewSupervisor,
  backoffDelay,
  buildWindowsTreeForceKillArgs,
  buildWindowsTreeKillArgs,
  claimState,
  computeFingerprint,
  generateInstanceId,
  generateOwnerToken,
  safeTokenEqual,
} from '../../scripts/frontend-preview-supervisor.mjs';
import {
  controlStatus,
  decideStart,
  makeControlRequest,
} from '../../scripts/start-frontend-playground-preview.mjs';

function fakeChild(pid = 1000 + Math.floor(Math.random() * 1000)) {
  const handlers = {};
  const child = {
    pid,
    exitCode: null,
    killed: false,
    stdout: { on: vi.fn() },
    stderr: { on: vi.fn() },
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    handlers,
  };
  child.kill = vi.fn(() => {
    if (child.exitCode === null) {
      child.exitCode = 1;
      child.killed = true;
      queueMicrotask(() => handlers.exit?.(1, 'SIGTERM'));
    }
  });
  return child;
}

function htmlResponse() {
  return new Response(`<!doctype html><html><body>${APP_HTML_MARKER}</div></body></html>`, {
    status: 200,
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}

function buildSupervisor(overrides = {}) {
  const child = fakeChild(overrides.childPid);
  const spawn = overrides.spawn ?? vi.fn(() => child);
  const fetchImpl = overrides.fetchImpl ?? vi.fn(async () => htmlResponse());
  const sleep = overrides.sleep ?? vi.fn(async () => {});
  const supervisor = new PreviewSupervisor({
    spawn,
    fetch: fetchImpl,
    sleep,
    now: overrides.now ?? (() => Date.now()),
    logger: overrides.logger ?? { write: vi.fn() },
    runtimeRoot: overrides.runtimeRoot ?? 'does-not-exist',
    viteArguments: overrides.viteArguments ?? [],
    probePort: overrides.probePort ?? vi.fn(async () => 'closed'),
    isPidAlive: overrides.isPidAlive ?? (() => true),
  });
  supervisor.writeState = overrides.writeState ?? vi.fn(async () => {});
  supervisor.resolveManifest = overrides.resolveManifest ?? vi.fn(async () => {
    supervisor.manifestPath = '/private/manifest.json';
    supervisor.targetOrigin = 'https://frontend-staging.example.test';
    supervisor.manifestFingerprint = 'fingerprint';
  });
  supervisor.preflightPort = overrides.preflightPort ?? vi.fn(async () => {});
  supervisor.ownerToken = 'test-token';
  supervisor.instanceId = 'test-instance';
  supervisor.manifestPath = '/private/manifest.json';
  supervisor.manifestFingerprint = 'fingerprint';
  supervisor.targetOrigin = 'https://frontend-staging.example.test';
  return { supervisor, child, spawn, fetchImpl, sleep };
}

describe('frontend preview supervisor primitives', () => {
  it('bounds restart backoff to 1/2/4/8/15 seconds', () => {
    expect([1, 2, 3, 4, 5, 6].map(backoffDelay)).toEqual([1000, 2000, 4000, 8000, 15000, 15000]);
  });

  it('generates random owner tokens and instance ids and compares tokens in constant time', () => {
    expect(generateOwnerToken()).toMatch(/^[0-9a-f]{64}$/);
    expect(generateInstanceId()).toMatch(/^[0-9a-f]{32}$/);
    expect(safeTokenEqual('abc', 'abc')).toBe(true);
    expect(safeTokenEqual('abc', 'abd')).toBe(false);
    expect(safeTokenEqual('abc', 'ab')).toBe(false);
  });

  it('computes a stable sha256 fingerprint', () => {
    expect(computeFingerprint(Buffer.from('x'))).toBe(computeFingerprint(Buffer.from('x')));
    expect(computeFingerprint(Buffer.from('x'))).not.toBe(computeFingerprint(Buffer.from('y')));
  });

  it('builds Windows tree-kill argument arrays without executing them', () => {
    expect(buildWindowsTreeKillArgs(4173)).toEqual(['/PID', '4173', '/T']);
    expect(buildWindowsTreeForceKillArgs(4173)).toEqual(['/PID', '4173', '/T', '/F']);
  });
});

describe('ownership state file', () => {
  let dir;
  beforeEach(async () => {
    dir = await mkdtemp(path.join(os.tmpdir(), 'fvr02-preview-'));
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('claims atomically: exactly one of two concurrent claims wins', async () => {
    const state = { instanceId: 'a' };
    const results = await Promise.all([
      claimState(dir, { ...state, instanceId: 'a' }),
      claimState(dir, { ...state, instanceId: 'b' }),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
  });

  it('writes state without an owner token in the claim surface and with restrictive mode on POSIX', async () => {
    await claimState(dir, { instanceId: 'a', ownerToken: null, pending: true });
    const raw = await readFile(path.join(dir, '.codex', 'runtime', 'local-preview', 'state.json'), 'utf8');
    expect(raw).toContain('"pending": true');
    if (process.platform !== 'win32') {
      const { stat } = await import('node:fs/promises');
      const s = await stat(path.join(dir, '.codex', 'runtime', 'local-preview', 'state.json'));
      expect(s.mode & 0o777).toBe(0o600);
    }
  });
});

describe('frontend preview supervisor lifecycle', () => {
  it('launches exactly one vite child with loopback host, strict port, and guarded env', async () => {
    const { supervisor, spawn } = buildSupervisor({ viteArguments: ['--open', 'false'] });
    await supervisor.launchChild();
    expect(spawn).toHaveBeenCalledTimes(1);
    const [exec, args, options] = spawn.mock.calls[0];
    expect(exec).toBe(process.execPath);
    expect(args).toContain('--host');
    expect(args).toContain(PREVIEW_HOST);
    expect(args).toContain('--port');
    expect(args).toContain(String(PREVIEW_PORT));
    expect(args).toContain('--strictPort');
    expect(args.slice(-2)).toEqual(['--open', 'false']);
    expect(options.env.HAU_PLAYGROUND_PROXY_ORIGIN).toBe(supervisor.targetOrigin);
  });

  it('re-resolves the private path before every launch', async () => {
    const { supervisor, spawn } = buildSupervisor();
    await supervisor.launchChild();
    expect(supervisor.resolveManifest).toHaveBeenCalledTimes(1);
    supervisor.child.exitCode = 1;
    await supervisor.launchChild();
    expect(supervisor.resolveManifest).toHaveBeenCalledTimes(2);
    supervisor.child.exitCode = 1;
    await supervisor.launchChild();
    expect(supervisor.resolveManifest).toHaveBeenCalledTimes(3);
    expect(spawn).toHaveBeenCalledTimes(3);
  });

  it('restarts once after an unexpected child exit', async () => {
    const { supervisor, child, spawn, sleep } = buildSupervisor();
    await supervisor.launchChild();
    expect(spawn).toHaveBeenCalledTimes(1);
    child.exitCode = 1;
    child.handlers.exit(1, null);
    await vi.waitFor(() => expect(sleep).toHaveBeenCalled());
    await vi.waitFor(() => expect(spawn).toHaveBeenCalledTimes(2));
  });

  it('does not restart after an expected stop', async () => {
    const { supervisor, child, spawn } = buildSupervisor();
    await supervisor.launchChild();
    supervisor.shutdownRequested = true;
    child.exitCode = 0;
    child.handlers.exit(0, null);
    await vi.waitFor(() => expect(supervisor.state).toBe('STOPPED'));
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it('explicit restart replaces the child and reaches a new healthy pid', async () => {
    const { supervisor, child } = buildSupervisor();
    await supervisor.launchChild();
    const oldPid = child.pid;
    const newChild = fakeChild(7777);
    supervisor.spawn = vi.fn(() => newChild);
    supervisor.requestRestart();
    await vi.waitFor(() => expect(newChild.on).toHaveBeenCalled());
    expect(newChild.pid).not.toBe(oldPid);
  });

  it('rejects a control request when token, instance, or supervisor pid mismatches', () => {
    const { supervisor } = buildSupervisor();
    const res = { writeHead: vi.fn(), end: vi.fn() };
    const makeReq = (headers) => ({ headers, url: '/__status', method: 'GET' });
    supervisor.handleControl(makeReq({ 'x-owner-token': 'wrong' }), res);
    expect(res.writeHead).toHaveBeenLastCalledWith(401, expect.anything());
    supervisor.handleControl(
      makeReq({ 'x-owner-token': 'test-token', 'x-instance-id': 'wrong', 'x-supervisor-pid': String(process.pid) }),
      res,
    );
    expect(res.writeHead).toHaveBeenLastCalledWith(401, expect.anything());
  });

  it('requires POST for stop and restart', () => {
    const { supervisor } = buildSupervisor();
    const res = { writeHead: vi.fn(), end: vi.fn() };
    const headers = {
      'x-owner-token': 'test-token',
      'x-instance-id': 'test-instance',
      'x-supervisor-pid': String(process.pid),
    };
    supervisor.handleControl({ headers, url: '/__stop', method: 'GET' }, res);
    expect(res.writeHead).toHaveBeenCalledWith(405, expect.anything());
  });

  it('rejects non-HTML readiness even when the response is 2xx', async () => {
    const { supervisor } = buildSupervisor({
      fetchImpl: vi.fn(async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })),
    });
    supervisor.child = fakeChild();
    expect(await supervisor.verifyReady()).toBe(false);
  });

  it('accepts readiness only when content-type is HTML and the app marker is present', async () => {
    const { supervisor } = buildSupervisor();
    supervisor.child = fakeChild();
    expect(await supervisor.verifyReady()).toBe(true);
  });

  it('health failure triggers exactly one restart through the child-exit path', async () => {
    const { supervisor, spawn } = buildSupervisor();
    await supervisor.launchChild();
    supervisor.fetchImpl = vi.fn(async () => {
      throw new Error('refused');
    });
    for (let i = 0; i < 3; i += 1) await supervisor.healthTick();
    await vi.waitFor(() => expect(spawn).toHaveBeenCalledTimes(2));
    // A further health tick while restarting must not spawn a third child.
    supervisor.restarting = true;
    await supervisor.healthTick();
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it('stops the loop at the restart threshold and keeps terminal state inspectable', async () => {
    let now = 1_000_000;
    const { supervisor, child } = buildSupervisor({ now: () => now });
    await supervisor.launchChild();
    supervisor.restartTimestamps = [now - 5, now - 4, now - 3, now - 2, now - 1];
    supervisor.restartCount = 5;
    child.exitCode = 1;
    child.handlers.exit(1, null);
    await vi.waitFor(() => expect(supervisor.state).toBe('STOPPED'));
    expect(supervisor.terminationReason).toBe('loop');
  });

  it('resets restart history only after a sustained healthy interval', async () => {
    let now = 0;
    const { supervisor } = buildSupervisor({ now: () => now });
    await supervisor.launchChild();
    supervisor.restartCount = 3;
    supervisor.healthy = true;
    supervisor.healthySince = 100;
    await supervisor.healthTick();
    expect(supervisor.restartCount).toBe(3);
    now = 31100;
    await supervisor.healthTick();
    expect(supervisor.restartCount).toBe(0);
  });

  it('omits the owner token from the control status payload and log lines', async () => {
    const { supervisor } = buildSupervisor();
    await supervisor.launchChild();
    const payload = supervisor.statusPayload();
    expect(payload).not.toHaveProperty('ownerToken');
    expect(JSON.stringify(supervisor.logLines)).not.toContain(supervisor.ownerToken);
  });

  it('finalizes and clears non-loop state idempotently', async () => {
    const { supervisor } = buildSupervisor();
    supervisor.clearState = vi.fn(async () => {});
    supervisor.closeControl = vi.fn(async () => {});
    await supervisor.finalize('stopped', 0);
    await supervisor.finalize('stopped', 0);
    expect(supervisor.clearState).toHaveBeenCalledTimes(1);
  });
});

describe('CLI ownership decisions and control', () => {
  function baseDeps(overrides = {}) {
    return {
      instanceId: 'inst-1',
      manifestPath: '/private/manifest.json',
      manifestFingerprint: 'fp',
      readState: vi.fn(async () => null),
      probePort: vi.fn(async () => 'closed'),
      isPidAlive: vi.fn(() => false),
      claimState: vi.fn(async () => true),
      clearState: vi.fn(async () => {}),
      controlStatus: vi.fn(async () => ({ authenticated: false })),
      ...overrides,
    };
  }

  it('claims when the port is free and no state exists', async () => {
    const deps = baseDeps();
    const result = await decideStart(deps);
    expect(result.decision).toBe('claimed');
    expect(deps.claimState).toHaveBeenCalledTimes(1);
  });

  it('reports already-running when an authenticated supervisor owns the listener', async () => {
    const state = { instanceId: 'inst-1', supervisorPid: 123, controlPort: 45678, ownerToken: 'tok', vitePid: 555 };
    const deps = baseDeps({
      probePort: vi.fn(async () => 'open'),
      readState: vi.fn(async () => state),
      controlStatus: vi.fn(async () => ({ authenticated: true, body: { ok: true, ...state } })),
    });
    const result = await decideStart(deps);
    expect(result.decision).toBe('already-running');
    expect(deps.claimState).not.toHaveBeenCalled();
  });

  it('refuses ownership-unknown when the port is open but not authenticated', async () => {
    const deps = baseDeps({
      probePort: vi.fn(async () => 'open'),
      readState: vi.fn(async () => null),
    });
    const result = await decideStart(deps);
    expect(result.decision).toBe('ownership-unknown');
    expect(result.error).toBe(OWNERSHIP_UNKNOWN);
    expect(deps.claimState).not.toHaveBeenCalled();
  });

  it('clears stale dead state and retries when the recorded process is dead and 4173 is closed', async () => {
    const stale = { instanceId: 'dead', supervisorPid: 999, controlPort: 45678, ownerToken: 'tok' };
    const deps = baseDeps({
      claimState: vi.fn(async () => false).mockResolvedValueOnce(false).mockResolvedValueOnce(true),
      readState: vi.fn(async () => stale),
      isPidAlive: vi.fn(() => false),
      probePort: vi.fn(async () => 'closed'),
      controlStatus: vi.fn(async () => ({ authenticated: false })),
    });
    const result = await decideStart(deps);
    expect(result.decision).toBe('claimed');
    expect(deps.clearState).toHaveBeenCalled();
  });

  it('refuses when the recorded process is live but unreachable', async () => {
    const stale = { instanceId: 'live', supervisorPid: 999, controlPort: 45678, ownerToken: 'tok' };
    const deps = baseDeps({
      claimState: vi.fn(async () => false),
      readState: vi.fn(async () => stale),
      isPidAlive: vi.fn(() => true),
      probePort: vi.fn(async () => 'closed'),
      controlStatus: vi.fn(async () => ({ authenticated: false })),
    });
    const result = await decideStart(deps);
    expect(result.decision).toBe('ownership-unknown');
  });

  it('fails closed on non-JSON and non-ok control responses', async () => {
    const nonJson = await makeControlRequest(
      45678,
      { token: 'tok', instanceId: 'inst', supervisorPid: 123, requestPath: '/__status' },
      (_opts, handler) => {
        const req = { on: vi.fn(), setTimeout: vi.fn(), end: vi.fn(), destroy: vi.fn() };
        const res = {
          statusCode: 200,
          on: vi.fn((event, cb) => {
            if (event === 'data') cb(Buffer.from('not-json'));
            if (event === 'end') cb();
          }),
        };
        queueMicrotask(() => handler(res));
        return req;
      },
    );
    expect(nonJson.status).toBe(200);
    expect(nonJson.parseError).toBe(true);

    const nonOk = await makeControlRequest(
      45678,
      { token: 'tok', instanceId: 'inst', supervisorPid: 123, requestPath: '/__status' },
      (_opts, handler) => {
        const req = { on: vi.fn(), setTimeout: vi.fn(), end: vi.fn(), destroy: vi.fn() };
        const res = {
          statusCode: 500,
          on: vi.fn((event, cb) => {
            if (event === 'data') cb(Buffer.from('{}'));
            if (event === 'end') cb();
          }),
        };
        queueMicrotask(() => handler(res));
        return req;
      },
    );
    expect(nonOk.status).toBe(500);
  });

  it('rejects a control status whose returned identity mismatches the stored state', async () => {
    const state = { instanceId: 'inst', supervisorPid: 123, controlPort: 45678, ownerToken: 'tok' };
    const makeControlRequestImpl = async () => ({
      status: 200,
      body: { ok: true, instanceId: 'other', supervisorPid: 123, controlPort: 45678 },
    });
    const result = await controlStatus(state, { makeControlRequest: makeControlRequestImpl, controlTimeoutMs: 3000 });
    expect(result.authenticated).toBe(false);
  });
});
