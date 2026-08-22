import { describe, expect, it, vi } from 'vitest';
import {
  PREVIEW_HOST,
  PREVIEW_PORT,
  PreviewSupervisor,
  backoffDelay,
  computeFingerprint,
  generateOwnerToken,
  safeTokenEqual,
} from '../../scripts/frontend-preview-supervisor.mjs';

function fakeChild() {
  const handlers = {};
  return {
    pid: 1000 + Math.floor(Math.random() * 1000),
    exitCode: null,
    killed: false,
    kill: vi.fn(),
    stdout: null,
    stderr: null,
    on: vi.fn((event, handler) => {
      handlers[event] = handler;
    }),
    handlers,
  };
}

function buildSupervisor(overrides = {}) {
  const child = fakeChild();
  const spawn = overrides.spawn ?? vi.fn(() => child);
  const fetchImpl =
    overrides.fetchImpl ??
    vi.fn(async () => new Response('<html></html>', { status: 200, headers: { 'content-type': 'text/html' } }));
  const sleep = overrides.sleep ?? vi.fn(async () => {});
  const supervisor = new PreviewSupervisor({
    spawn,
    fetch: fetchImpl,
    sleep,
    now: overrides.now ?? (() => Date.now()),
    logger: overrides.logger ?? { write: vi.fn() },
    runtimeRoot: overrides.runtimeRoot ?? 'does-not-exist',
    viteArguments: overrides.viteArguments ?? [],
  });
  supervisor.writeState = overrides.writeState ?? vi.fn(async () => {});
  supervisor.reverifyOrigin = overrides.reverifyOrigin ?? vi.fn(async () => {});
  supervisor.ownerToken = 'test-token';
  supervisor.manifestPath = '/private/manifest.json';
  supervisor.manifestFingerprint = 'fingerprint';
  supervisor.targetOrigin = 'https://frontend-staging.example.test';
  return { supervisor, child, spawn, fetchImpl, sleep };
}

describe('frontend preview supervisor primitives', () => {
  it('bounds restart backoff to 1/2/4/8/15 seconds', () => {
    expect([1, 2, 3, 4, 5, 6].map(backoffDelay)).toEqual([1000, 2000, 4000, 8000, 15000, 15000]);
  });

  it('generates a 64-hex owner token and compares tokens in constant time', () => {
    const token = generateOwnerToken();
    expect(token).toMatch(/^[0-9a-f]{64}$/);
    expect(safeTokenEqual(token, token)).toBe(true);
    expect(safeTokenEqual(token, 'short')).toBe(false);
    expect(safeTokenEqual(token, '0'.repeat(64))).toBe(false);
  });

  it('computes a stable sha256 fingerprint of manifest bytes', () => {
    expect(computeFingerprint(Buffer.from('manifest-content'))).toBe(
      computeFingerprint(Buffer.from('manifest-content')),
    );
    expect(computeFingerprint(Buffer.from('manifest-content'))).not.toBe(
      computeFingerprint(Buffer.from('different')),
    );
  });
});

describe('frontend preview supervisor lifecycle', () => {
  it('launches exactly one vite child with loopback host, strict port, and guarded env', async () => {
    const { supervisor, spawn } = buildSupervisor();
    await supervisor.launchChild();
    expect(spawn).toHaveBeenCalledTimes(1);
    const [exec, args, options] = spawn.mock.calls[0];
    expect(exec).toBe(process.execPath);
    expect(args).toContain('--host');
    expect(args).toContain(PREVIEW_HOST);
    expect(args).toContain('--port');
    expect(args).toContain(String(PREVIEW_PORT));
    expect(args).toContain('--strictPort');
    expect(options.env.HAU_PLAYGROUND_PROXY_ORIGIN).toBe(supervisor.targetOrigin);
  });

  it('does not spawn a second child while one is already alive', async () => {
    const { supervisor, spawn } = buildSupervisor();
    await supervisor.launchChild();
    await supervisor.launchChild();
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it('restarts an owned child after an unexpected exit with bounded delay', async () => {
    const { supervisor, child, spawn, sleep } = buildSupervisor();
    await supervisor.launchChild();
    expect(spawn).toHaveBeenCalledTimes(1);
    supervisor.restartRequested = false;
    supervisor.shutdownRequested = false;
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
    await Promise.resolve();
    expect(spawn).toHaveBeenCalledTimes(1);
  });

  it('marks a restart request and replaces only the owned child', async () => {
    const { supervisor, child } = buildSupervisor();
    await supervisor.launchChild();
    supervisor.requestRestart();
    expect(supervisor.restartRequested).toBe(true);
    expect(child.kill).toHaveBeenCalled();
  });

  it('rejects a control request without the matching owner token', () => {
    const { supervisor } = buildSupervisor();
    const res = { writeHead: vi.fn(), end: vi.fn() };
    supervisor.handleControl({ headers: { 'x-owner-token': 'wrong-token' }, url: '/__status' }, res);
    expect(res.writeHead).toHaveBeenCalledWith(401, expect.objectContaining({ 'content-type': 'application/json' }));
    expect(res.end).toHaveBeenCalledWith(expect.stringContaining('ownership-unknown'));
  });

  it('accepts a control status request with the matching owner token', () => {
    const { supervisor } = buildSupervisor();
    supervisor.child = fakeChild();
    supervisor.state = 'RUNNING';
    const res = { writeHead: vi.fn(), end: vi.fn() };
    supervisor.handleControl({ headers: { 'x-owner-token': supervisor.ownerToken }, url: '/__status' }, res);
    expect(res.writeHead).toHaveBeenCalledWith(200, expect.objectContaining({ 'content-type': 'application/json' }));
  });

  it('transitions to RUNNING and healthy once the preview responds 2xx', async () => {
    const { supervisor } = buildSupervisor();
    supervisor.child = fakeChild();
    supervisor.state = 'STARTING';
    const ready = await supervisor.waitReady(1000);
    expect(ready).toBe(true);
    expect(supervisor.state).toBe('RUNNING');
    expect(supervisor.healthy).toBe(true);
  });
});
