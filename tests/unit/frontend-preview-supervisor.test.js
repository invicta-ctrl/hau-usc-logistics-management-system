import { mkdtemp, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  APP_HTML_MARKER,
  PreviewSupervisor,
  allPidsDead,
  anyPidAlive,
  assertSafeViteArguments,
  backoffDelay,
  buildWindowsTreeForceKillArgs,
  buildWindowsTreeKillArgs,
  claimState,
  computeFingerprint,
  createTreeTerminator,
  generateInstanceId,
  generateOwnerToken,
  safeTokenEqual,
} from '../../scripts/frontend-preview-supervisor.mjs';
import {
  controlAction,
  controlStatus,
  createCli,
  decideStart,
  makeControlRequest,
  matchesIdentity,
  parseCliArgs,
  safeClearStateIfDead,
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
    createTreeTerminator: overrides.createTreeTerminator,
    terminateTree: overrides.terminateTree === undefined ? null : overrides.terminateTree,
    terminateTreeForce: overrides.terminateTreeForce === undefined ? null : overrides.terminateTreeForce,
  });
  supervisor.writeState = overrides.writeState ?? vi.fn(async () => {});
  supervisor.resolveManifest = overrides.resolveManifest ?? vi.fn(async () => {
    supervisor.manifestPath = '/private/manifest.json';
    supervisor.targetOrigin = 'https://frontend-staging.example.test';
    supervisor.manifestFingerprint = 'fingerprint';
  });
  supervisor.preflightPort = overrides.preflightPort ?? vi.fn(async () => {});
  supervisor.clearClaim = overrides.clearClaim ?? vi.fn(async () => {});
  supervisor.ownerToken = 'test-token';
  supervisor.instanceId = 'test-instance';
  supervisor.manifestPath = '/private/manifest.json';
  supervisor.manifestFingerprint = 'fingerprint';
  supervisor.targetOrigin = 'https://frontend-staging.example.test';
  return { supervisor, child, spawn, fetchImpl, sleep };
}

describe('primitives', () => {
  it('bounds restart backoff and builds Windows tree-kill arg arrays', () => {
    expect([1, 2, 3, 4, 5, 6].map(backoffDelay)).toEqual([1000, 2000, 4000, 8000, 15000, 15000]);
    expect(buildWindowsTreeKillArgs(4173)).toEqual(['/PID', '4173', '/T']);
    expect(buildWindowsTreeForceKillArgs(4173)).toEqual(['/PID', '4173', '/T', '/F']);
  });

  it('generates tokens/ids and computes fingerprints', () => {
    expect(generateOwnerToken()).toMatch(/^[0-9a-f]{64}$/);
    expect(generateInstanceId()).toMatch(/^[0-9a-f]{32}$/);
    expect(safeTokenEqual('abc', 'abc')).toBe(true);
    expect(safeTokenEqual('abc', 'abd')).toBe(false);
    expect(computeFingerprint(Buffer.from('x'))).toBe(computeFingerprint(Buffer.from('x')));
  });

  it('rejects unsafe Vite args in exact and =value forms, preserves benign args', () => {
    for (const bad of ['--host', '--port', '--strictPort', '--config', '-c', '--mode', '-m', '--base']) {
      expect(() => assertSafeViteArguments([bad])).toThrow();
      expect(() => assertSafeViteArguments([`${bad}=value`])).toThrow();
    }
    expect(() => assertSafeViteArguments(['--open', 'false'])).not.toThrow();
  });

  it('default tree terminator invokes taskkill.exe with arg arrays and windowsHide', async () => {
    const spawnFn = vi.fn(() => {
      const child = { once: vi.fn(), on: vi.fn() };
      child.once.mockImplementation((event, cb) => {
        if (event === 'exit') queueMicrotask(() => cb(0));
      });
      return child;
    });
    const terminator = createTreeTerminator(spawnFn);
    await terminator.terminateTree(4173);
    expect(spawnFn).toHaveBeenCalledWith('taskkill.exe', ['/PID', '4173', '/T'], { windowsHide: true, stdio: 'ignore' });
    await terminator.terminateTreeForce(4173);
    expect(spawnFn).toHaveBeenLastCalledWith('taskkill.exe', ['/PID', '4173', '/T', '/F'], {
      windowsHide: true,
      stdio: 'ignore',
    });
  });

  it('classifies recorded pids alive/dead across launcher, supervisor, and vite', () => {
    const state = { launcherPid: 1, supervisorPid: 2, vitePid: 3 };
    expect(anyPidAlive(state, (pid) => pid === 2)).toBe(true);
    expect(allPidsDead(state, () => false)).toBe(true);
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

  it('claims atomically and writes restrictive mode on POSIX', async () => {
    const results = await Promise.all([
      claimState(dir, { instanceId: 'a', pending: true }),
      claimState(dir, { instanceId: 'b', pending: true }),
    ]);
    expect(results.filter(Boolean)).toHaveLength(1);
    const raw = await readFile(path.join(dir, '.codex', 'runtime', 'local-preview', 'state.json'), 'utf8');
    expect(raw).toContain('"pending": true');
    if (process.platform !== 'win32') {
      const { stat } = await import('node:fs/promises');
      const s = await stat(path.join(dir, '.codex', 'runtime', 'local-preview', 'state.json'));
      expect(s.mode & 0o777).toBe(0o600);
    }
  });
});

describe('supervisor lifecycle', () => {
  it('launches with guarded args and resets lifecycle truth before replacement', async () => {
    const { supervisor, spawn } = buildSupervisor({ viteArguments: ['--open', 'false'] });
    await supervisor.launchChild();
    supervisor.healthy = true;
    supervisor.healthySince = 123;
    supervisor.child.exitCode = 1;
    await supervisor.launchChild();
    expect(supervisor.healthy).toBe(false);
    expect(supervisor.healthySince).toBeNull();
    expect(supervisor.state).toBe('STARTING');
    const args = spawn.mock.calls[1][1];
    expect(args.slice(-2)).toEqual(['--open', 'false']);
  });

  it('rejects unsafe vite args at launch time', async () => {
    const { supervisor } = buildSupervisor({ viteArguments: ['--port=9999'] });
    await expect(supervisor.launchChild()).rejects.toThrow('Unsafe Vite argument');
  });

  it('restarts once after unexpected exit', async () => {
    const { supervisor, child, spawn, sleep } = buildSupervisor();
    await supervisor.launchChild();
    child.exitCode = 1;
    child.handlers.exit(1, null);
    await vi.waitFor(() => expect(sleep).toHaveBeenCalled());
    await vi.waitFor(() => expect(spawn).toHaveBeenCalledTimes(2));
  });

  it('does not restart after expected stop', async () => {
    const { supervisor, child, spawn } = buildSupervisor();
    await supervisor.launchChild();
    supervisor.shutdownRequested = true;
    child.exitCode = 0;
    child.handlers.exit(0, null);
    await vi.waitFor(() => expect(supervisor.state).toBe('STOPPED'));
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it('explicit restart yields a new pid and reaches healthy', async () => {
    const { supervisor, child } = buildSupervisor();
    await supervisor.launchChild();
    const oldPid = child.pid;
    const newChild = fakeChild(7777);
    supervisor.spawn = vi.fn(() => newChild);
    supervisor.requestRestart();
    await vi.waitFor(() => expect(supervisor.healthy).toBe(true));
    expect(supervisor.child.pid).not.toBe(oldPid);
  });

  it('rejects control requests on token/instance/supervisor mismatch and requires POST', () => {
    const { supervisor } = buildSupervisor();
    const res = { writeHead: vi.fn(), end: vi.fn() };
    const headers = (over = {}) => ({
      'x-owner-token': 'test-token',
      'x-instance-id': 'test-instance',
      'x-supervisor-pid': String(process.pid),
      ...over,
    });
    supervisor.handleControl({ headers: headers({ 'x-owner-token': 'wrong' }), url: '/__status', method: 'GET' }, res);
    expect(res.writeHead).toHaveBeenLastCalledWith(401, expect.anything());
    supervisor.handleControl({ headers: headers(), url: '/__stop', method: 'GET' }, res);
    expect(res.writeHead).toHaveBeenLastCalledWith(405, expect.anything());
  });

  it('ack bodies carry identity; stop/restart only after authenticated POST', () => {
    const { supervisor } = buildSupervisor();
    supervisor.controlPort = 45678;
    const res = { writeHead: vi.fn(), end: vi.fn() };
    const headers = {
      'x-owner-token': 'test-token',
      'x-instance-id': 'test-instance',
      'x-supervisor-pid': String(process.pid),
    };
    supervisor.handleControl({ headers, url: '/__stop', method: 'POST' }, res);
    const body = JSON.parse(res.end.mock.calls.at(-1)[0]);
    expect(body).toMatchObject({ ok: true, instanceId: 'test-instance', action: 'stop' });
    expect(body.supervisorPid).toBe(process.pid);
    expect(body.controlPort).toBeTypeOf('number');
  });

  it('rejects non-HTML readiness', async () => {
    const { supervisor } = buildSupervisor({
      fetchImpl: vi.fn(async () => new Response('{}', { status: 200, headers: { 'content-type': 'application/json' } })),
    });
    supervisor.child = fakeChild();
    expect(await supervisor.verifyReady()).toBe(false);
  });

  it('accepts readiness only with HTML marker', async () => {
    const { supervisor } = buildSupervisor();
    supervisor.child = fakeChild();
    expect(await supervisor.verifyReady()).toBe(true);
  });

  it('health failure triggers exactly one restart via child-exit path', async () => {
    const { supervisor, spawn } = buildSupervisor();
    await supervisor.launchChild();
    supervisor.fetchImpl = vi.fn(async () => {
      throw new Error('refused');
    });
    for (let i = 0; i < 3; i += 1) await supervisor.healthTick();
    await vi.waitFor(() => expect(spawn).toHaveBeenCalledTimes(2));
    supervisor.restarting = true;
    await supervisor.healthTick();
    expect(spawn).toHaveBeenCalledTimes(2);
  });

  it('stops at restart threshold and keeps terminal state inspectable', async () => {
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

  it('resets storm history only after sustained healthy interval', async () => {
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

  it('never emits the owner token in payload or logs', async () => {
    const { supervisor } = buildSupervisor();
    await supervisor.launchChild();
    expect(supervisor.statusPayload()).not.toHaveProperty('ownerToken');
    expect(JSON.stringify(supervisor.logLines)).not.toContain(supervisor.ownerToken);
  });

  it('finalizes even when the exit event never arrives', async () => {
    const { supervisor, child } = buildSupervisor();
    supervisor.clearState = vi.fn(async () => {});
    supervisor.closeControl = vi.fn(async () => {});
    await supervisor.launchChild();
    child.exitCode = null;
    child.kill = vi.fn(() => {
      child.exitCode = 1; // exit event never fires
    });
    await supervisor.finalize('stopped', 0);
    expect(supervisor.state).toBe('STOPPED');
    expect(supervisor.controlServer).toBeNull();
  });

  it('clears its own pending claim when resolve/adopt/control startup fails', async () => {
    const { supervisor } = buildSupervisor();
    supervisor.resolveManifest = vi.fn(async () => {
      throw new Error('bad manifest');
    });
    const instanceId = 'inst-cleanup';
    await supervisor.run('/private/manifest.json', instanceId);
    expect(supervisor.clearClaim).toHaveBeenCalledWith(supervisor.runtimeRoot, instanceId);
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

  it('claims when free and no state', async () => {
    const deps = baseDeps();
    expect((await decideStart(deps)).decision).toBe('claimed');
  });

  it('already-running only when authenticated healthy with live vitePid', async () => {
    const state = { instanceId: 'inst-1', supervisorPid: 123, controlPort: 45678, ownerToken: 'tok', vitePid: 555 };
    const deps = baseDeps({
      probePort: vi.fn(async () => 'open'),
      readState: vi.fn(async () => state),
      controlStatus: vi.fn(async () => ({ authenticated: true, body: { ok: true, ...state, healthy: true } })),
    });
    expect((await decideStart(deps)).decision).toBe('already-running');
  });

  it('unhealthy authenticated start becomes in-flight', async () => {
    const state = { instanceId: 'inst-1', supervisorPid: 123, controlPort: 45678, ownerToken: 'tok', vitePid: null };
    const deps = baseDeps({
      probePort: vi.fn(async () => 'open'),
      readState: vi.fn(async () => state),
      controlStatus: vi.fn(async () => ({ authenticated: true, body: { ok: true, ...state, healthy: false } })),
    });
    expect((await decideStart(deps)).decision).toBe('in-flight');
  });

  it('refuses ownership-unknown when port open but unauthenticated', async () => {
    const deps = baseDeps({ probePort: vi.fn(async () => 'open'), readState: vi.fn(async () => null) });
    expect((await decideStart(deps)).decision).toBe('ownership-unknown');
  });

  it('clears stale dead state only when all recorded pids are dead and port is exactly closed', async () => {
    const stale = { instanceId: 'dead', launcherPid: 1, supervisorPid: 2, vitePid: 3, controlPort: 45678, ownerToken: 'tok' };
    const deps = baseDeps({
      claimState: vi.fn(async () => false).mockResolvedValueOnce(false).mockResolvedValueOnce(true),
      readState: vi.fn(async () => stale),
      isPidAlive: vi.fn(() => false),
      probePort: vi.fn(async () => 'closed'),
      controlStatus: vi.fn(async () => ({ authenticated: false })),
    });
    expect((await decideStart(deps)).decision).toBe('claimed');
    expect(deps.clearState).toHaveBeenCalled();
  });

  it('does not clear stale state when any recorded pid is alive', async () => {
    const stale = { instanceId: 'live', launcherPid: 1, supervisorPid: 2, vitePid: 3, controlPort: 45678, ownerToken: 'tok' };
    const deps = baseDeps({
      claimState: vi.fn(async () => false),
      readState: vi.fn(async () => stale),
      isPidAlive: vi.fn((pid) => pid === 2),
      probePort: vi.fn(async () => 'closed'),
      controlStatus: vi.fn(async () => ({ authenticated: false })),
    });
    expect((await decideStart(deps)).decision).toBe('ownership-unknown');
    expect(deps.clearState).not.toHaveBeenCalled();
  });

  it('treats port probe timeout as ownership-unknown, not clearable', async () => {
    const stale = { instanceId: 'x', launcherPid: 1, supervisorPid: 2, vitePid: 3, controlPort: 45678, ownerToken: 'tok' };
    const deps = baseDeps({
      claimState: vi.fn(async () => false),
      readState: vi.fn(async () => stale),
      isPidAlive: vi.fn(() => false),
      probePort: vi.fn(async () => 'timeout'),
      controlStatus: vi.fn(async () => ({ authenticated: false })),
    });
    const cleared = await safeClearStateIfDead(deps, stale);
    expect(cleared).toBe(false);
  });

  it('caps control response body and fails closed on overflow', async () => {
    const result = await makeControlRequest(
      45678,
      { token: 'tok', instanceId: 'inst', supervisorPid: 123, requestPath: '/__status' },
      (_opts, handler) => {
        const req = { on: vi.fn(), setTimeout: vi.fn(), end: vi.fn(), destroy: vi.fn() };
        const res = {
          statusCode: 200,
          on: vi.fn((event, cb) => {
            if (event === 'data') cb(Buffer.alloc(70 * 1024, 0x41));
            if (event === 'end') cb();
          }),
          destroy: vi.fn(),
        };
        queueMicrotask(() => handler(res));
        return req;
      },
    );
    expect(result.error).toBe('control response too large');
  });

  it('rejects identity-mismatched control status and action acks', async () => {
    const state = { instanceId: 'inst', supervisorPid: 123, controlPort: 45678, ownerToken: 'tok' };
    const mismatch = async () => ({
      status: 200,
      body: { ok: true, instanceId: 'other', supervisorPid: 123, controlPort: 45678 },
    });
    expect((await controlStatus(state, { makeControlRequest: mismatch, controlTimeoutMs: 3000 })).authenticated).toBe(false);
    expect(
      (await controlAction(state, 'stop', { makeControlRequest: mismatch, controlTimeoutMs: 3000 })).authenticated,
    ).toBe(false);
  });

  it('matches identity when instance, supervisor pid, and control port align', () => {
    const state = { instanceId: 'inst', supervisorPid: 123, controlPort: 45678 };
    expect(matchesIdentity(state, { ok: true, instanceId: 'inst', supervisorPid: 123, controlPort: 45678 })).toBe(true);
    expect(matchesIdentity(state, { ok: true, instanceId: 'inst', supervisorPid: 999, controlPort: 45678 })).toBe(false);
  });

  it('stop clears provably-dead stale state and refuses otherwise', async () => {
    const cli = createCli({
      readState: vi.fn(async () => ({ instanceId: 'x', supervisorPid: 1, vitePid: 2, controlPort: 45678, ownerToken: 'tok' })),
      isPidAlive: vi.fn(() => false),
      probePort: vi.fn(async () => 'closed'),
      safeClearStateIfDead: vi.fn(async () => true),
      controlStatus: vi.fn(async () => ({ authenticated: false })),
      makeControlRequest: vi.fn(async () => ({ status: 200, body: { ok: true } })),
    });
    expect(await cli.doStop()).toBe(0);
  });
});

describe('final P1 truth regressions', () => {
  it('transitions to truthful RESTARTING state with no dead pid before backoff', async () => {
    const { supervisor, child } = buildSupervisor();
    let resolveSleep;
    const sleep = vi.fn(async () => {
      await new Promise((resolve) => {
        resolveSleep = resolve;
      });
    });
    supervisor.sleep = sleep;
    await supervisor.launchChild();
    child.exitCode = 1;
    child.handlers.exit(1, null);
    await vi.waitFor(() => expect(sleep).toHaveBeenCalled());
    expect(supervisor.state).toBe('RESTARTING');
    expect(supervisor.healthy).toBe(false);
    expect(supervisor.child).toBeNull();
    resolveSleep();
  });

  it('expected stop during restart backoff never spawns a second child', async () => {
    const { supervisor, child, spawn } = buildSupervisor();
    let resolveSleep;
    const sleep = vi.fn(async () => {
      await new Promise((resolve) => {
        resolveSleep = resolve;
      });
    });
    supervisor.sleep = sleep;
    supervisor.clearState = vi.fn(async () => {});
    supervisor.closeControl = vi.fn(async () => {});
    await supervisor.launchChild();
    child.exitCode = 1;
    child.handlers.exit(1, null);
    await vi.waitFor(() => expect(sleep).toHaveBeenCalled());
    // Stop while performRestart is blocked in backoff, via the real path.
    supervisor.requestStop();
    resolveSleep();
    await vi.waitFor(() => expect(supervisor.restarting).toBe(false));
    expect(supervisor.state).toBe('STOPPED');
    expect(supervisor.terminationReason).toBe('stopped');
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(supervisor.child).toBeNull();
  });

  it('stop during pre-spawn manifest verification prevents any child spawn', async () => {
    const { supervisor, spawn } = buildSupervisor();
    let resolveManifest;
    supervisor.resolveManifest = vi.fn(async () => {
      await new Promise((resolve) => {
        resolveManifest = resolve;
      });
    });
    supervisor.clearState = vi.fn(async () => {});
    supervisor.closeControl = vi.fn(async () => {});
    const launch = supervisor.launchChild();
    // Stop while resolveManifest is deferred.
    supervisor.shutdownRequested = true;
    resolveManifest();
    await expect(launch).rejects.toThrow('Stop requested');
    expect(spawn).not.toHaveBeenCalled();
    expect(supervisor.child).toBeNull();
  });

  it('stop racing the RESTARTING state write keeps state cleared and spawns nothing', async () => {
    const { supervisor, child, spawn } = buildSupervisor();
    await supervisor.launchChild();
    let resolveWrite;
    supervisor.writeState = vi.fn(async () => {
      await new Promise((resolve) => {
        resolveWrite = resolve;
      });
    });
    supervisor.clearState = vi.fn(async () => {});
    supervisor.closeControl = vi.fn(async () => {});
    child.exitCode = 1;
    child.handlers.exit(1, null);
    await vi.waitFor(() => expect(supervisor.writeState).toHaveBeenCalled());
    // Stop while the RESTARTING state write is in flight.
    supervisor.requestStop();
    resolveWrite();
    await vi.waitFor(() => expect(supervisor.restarting).toBe(false));
    expect(supervisor.state).toBe('STOPPED');
    expect(spawn).toHaveBeenCalledTimes(1);
    expect(supervisor.child).toBeNull();
  });

  it('stop racing the post-spawn launch write clears state and kills the replacement child', async () => {
    const { supervisor } = buildSupervisor();
    const spawned = fakeChild(9001);
    let resolveWrite;
    supervisor.spawn = vi.fn(() => spawned);
    supervisor.writeState = vi.fn(async () => {
      await new Promise((resolve) => {
        resolveWrite = resolve;
      });
    });
    supervisor.clearState = vi.fn(async () => {});
    supervisor.closeControl = vi.fn(async () => {});
    const launch = supervisor.launchChild();
    await vi.waitFor(() => expect(supervisor.spawn).toHaveBeenCalled());
    supervisor.shutdownRequested = true;
    spawned.exitCode = 1;
    resolveWrite();
    await expect(launch).rejects.toThrow('Stop requested during lifecycle state write');
    expect(supervisor.clearState).toHaveBeenCalled();
    expect(supervisor.child.exitCode).not.toBeNull();
  });

  it('finalize loop persists sanitized terminal state without token/control/dead pid', async () => {
    const { supervisor } = buildSupervisor();
    supervisor.clearState = vi.fn(async () => {});
    supervisor.writeTerminalState = vi.fn(async () => {});
    await supervisor.finalize('loop', 1);
    expect(supervisor.writeTerminalState).toHaveBeenCalledWith('loop');
  });

  it('doStatus reports STOPPED + reason for a dead terminal loop snapshot', async () => {
    const terminal = {
      instanceId: 'inst',
      supervisorPid: 999,
      controlPort: null,
      ownerToken: null,
      vitePid: null,
      state: 'STOPPED',
      terminationReason: 'loop',
    };
    const cli = createCli({
      readState: vi.fn(async () => terminal),
      isPidAlive: vi.fn(() => false),
      probePort: vi.fn(async () => 'closed'),
    });
    const out = [];
    const origStdout = process.stdout.write;
    process.stdout.write = (s) => {
      out.push(String(s));
      return true;
    };
    try {
      expect(await cli.doStatus()).toBe(1);
    } finally {
      process.stdout.write = origStdout;
    }
    expect(out.join('')).toContain('STOPPED');
    expect(out.join('')).toContain('loop');
    expect(out.join('')).not.toContain('OWNERSHIP_UNKNOWN');
  });

  it('doStart readiness timeout stops a live adopted supervisor and clears its own pending claim', async () => {
    const readState = vi.fn(async () => null);
    const controlStatus = vi.fn(async () => ({
      authenticated: true,
      body: { ok: true, instanceId: 'inst-1', supervisorPid: 123, controlPort: 45678, healthy: false, vitePid: null },
    }));
    const controlAction = vi.fn(async () => ({ authenticated: true }));
    const clearClaim = vi.fn(async () => {});
    const clearState = vi.fn(async () => {});
    // After waitForHealthy gives up (no healthy state observed), cleanupFailedStart
    // re-reads a live adopted supervisor and must identity-verify + stop it.
    readState.mockResolvedValue({
      instanceId: 'inst-1',
      supervisorPid: 123,
      controlPort: 45678,
      ownerToken: 'tok',
      vitePid: 555,
      pending: false,
      healthy: true,
    });
    const deps = {
      readState,
      isPidAlive: vi.fn(() => true),
      probePort: vi.fn(async () => 'closed'),
      claimState: vi.fn(async () => true),
      clearState,
      clearClaim,
      spawn: vi.fn(() => ({ unref: vi.fn(), pid: 900 })),
      sleep: vi.fn(async () => {}),
      controlStatus,
      controlAction,
      makeControlRequest: vi.fn(async () => ({ status: 200, body: { ok: true } })),
      resolveManifest: vi.fn(async () => ({ manifestPath: '/m.json', fingerprint: 'fp' })),
      generateInstanceId: vi.fn(() => 'inst-1'),
      healthyTimeoutMs: 1,
      stopTimeoutMs: 1,
    };
    const cli = createCli(deps);
    // After the stop ack, waitForStopped must observe no state so cleanup returns success quickly.
    let stopPhase = false;
    readState.mockImplementation(async () => (stopPhase ? null : {
      instanceId: 'inst-1',
      supervisorPid: 123,
      controlPort: 45678,
      ownerToken: 'tok',
      vitePid: 555,
      pending: false,
      healthy: true,
    }));
    controlAction.mockImplementation(async () => {
      stopPhase = true;
      return { authenticated: true };
    });
    expect(await cli.doStart('/m.json')).toBe(1);
    expect(controlAction).toHaveBeenCalled();
    expect(controlAction.mock.calls[0][1]).toBe('stop');
  });

  it('doStart identity mismatch on readiness timeout fails closed without killing', async () => {
    const readState = vi.fn(async () => ({
      instanceId: 'other',
      supervisorPid: 456,
      controlPort: 40000,
      ownerToken: 'tok',
      vitePid: 555,
      pending: false,
    }));
    const clearClaim = vi.fn(async () => {});
    const controlAction = vi.fn(async () => ({ authenticated: false }));
    const deps = {
      readState,
      isPidAlive: vi.fn(() => true),
      probePort: vi.fn(async () => 'closed'),
      claimState: vi.fn(async () => true),
      clearState: vi.fn(async () => {}),
      clearClaim,
      spawn: vi.fn(() => ({ unref: vi.fn(), pid: 900 })),
      sleep: vi.fn(async () => {}),
      controlStatus: vi.fn(async () => ({ authenticated: false })),
      controlAction,
      makeControlRequest: vi.fn(async () => ({ status: 200, body: { ok: true } })),
      resolveManifest: vi.fn(async () => ({ manifestPath: '/m.json', fingerprint: 'fp' })),
      generateInstanceId: vi.fn(() => 'inst-1'),
      healthyTimeoutMs: 1,
      stopTimeoutMs: 1,
    };
    const cli = createCli(deps);
    expect(await cli.doStart('/m.json')).toBe(1);
    expect(controlAction).not.toHaveBeenCalled();
  });

  it('parses positional manifest and --manifest forms with -- separated vite args', () => {
    expect(parseCliArgs(['start', '/abs/manifest.json'])).toEqual({
      mode: 'start',
      rawManifestPath: '/abs/manifest.json',
      viteArguments: [],
    });
    expect(parseCliArgs(['start', '--manifest', '/abs/m.json', '--', '--open', 'false'])).toEqual({
      mode: 'start',
      rawManifestPath: '/abs/m.json',
      viteArguments: ['--open', 'false'],
    });
    expect(parseCliArgs(['restart', '/abs/m.json'])).toEqual({
      mode: 'restart',
      rawManifestPath: '/abs/m.json',
      viteArguments: [],
    });
  });
});
