import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { request } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePlaygroundOrigin, verifyPlaygroundOrigin } from './playground-proxy-guard.mjs';
import { resolvePrivatePath } from './private-path.mjs';
import {
  OWNERSHIP_UNKNOWN,
  PREVIEW_HOST,
  PREVIEW_PORT,
  allPidsDead,
  assertSafeViteArguments,
  claimState,
  clearClaim,
  clearState,
  computeFingerprint,
  generateInstanceId,
  isPidAlive,
  probePort,
  readState,
} from './frontend-preview-supervisor.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const supervisorScript = path.join(repoRoot, 'scripts', 'frontend-preview-supervisor.mjs');
const MAX_CONTROL_BODY = 64 * 1024;

export async function resolveManifest(rawManifestPath) {
  if (!rawManifestPath || !path.isAbsolute(rawManifestPath)) {
    throw new Error('The private playground manifest must be an absolute path.');
  }
  const manifestPath = await resolvePrivatePath(rawManifestPath, {
    repoRoot,
    label: 'Private playground manifest',
    kind: 'file',
  });
  const raw = await readFile(manifestPath);
  const manifest = JSON.parse(raw.toString('utf8'));
  const configured = String(manifest.playgroundHostname ?? '').trim();
  const target = parsePlaygroundOrigin(configured, { allowBareHostname: true });
  await verifyPlaygroundOrigin(target);
  return { manifestPath, target, fingerprint: computeFingerprint(raw) };
}

export function makeControlRequest(port, options, httpRequest = request) {
  const {
    token,
    instanceId,
    supervisorPid,
    requestPath,
    method = 'GET',
    timeoutMs = 3000,
    maxBody = MAX_CONTROL_BODY,
  } = options;
  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };
    let req;
    try {
      req = httpRequest(
        {
          host: PREVIEW_HOST,
          port,
          path: requestPath,
          method,
          headers: {
            'x-owner-token': token,
            'x-instance-id': instanceId,
            'x-supervisor-pid': String(supervisorPid),
          },
        },
        (res) => {
          const chunks = [];
          let size = 0;
          let overflow = false;
          res.on('data', (chunk) => {
            size += chunk.length;
            if (size > maxBody) {
              overflow = true;
              res.destroy();
              return;
            }
            chunks.push(chunk);
          });
          res.on('end', () => {
            if (overflow) {
              finish({ status: res.statusCode, body: null, error: 'control response too large' });
              return;
            }
            const raw = Buffer.concat(chunks).toString('utf8');
            let body = null;
            let parseError = false;
            try {
              body = raw ? JSON.parse(raw) : {};
            } catch {
              parseError = true;
            }
            finish({ status: res.statusCode, body, parseError });
          });
        },
      );
    } catch (error) {
      finish({ status: null, body: null, error: error?.message ?? 'request failed' });
      return;
    }
    req.on('error', (error) => finish({ status: null, body: null, error: error?.message ?? 'request failed' }));
    req.setTimeout(timeoutMs, () => req.destroy(new Error('control request timed out')));
    req.end();
  });
}

export function matchesIdentity(state, body) {
  if (!body || !body.ok) return false;
  return (
    body.instanceId === state.instanceId &&
    String(body.supervisorPid) === String(state.supervisorPid) &&
    body.controlPort === state.controlPort
  );
}

export async function controlStatus(state, deps) {
  const result = await deps.makeControlRequest(
    state.controlPort,
    {
      token: state.ownerToken,
      instanceId: state.instanceId,
      supervisorPid: state.supervisorPid,
      requestPath: '/__status',
      method: 'GET',
      timeoutMs: deps.controlTimeoutMs,
    },
    deps.httpRequest,
  );
  return { authenticated: matchesIdentity(state, result.body), body: result.body ?? null, result };
}

export async function controlAction(state, action, deps) {
  const result = await deps.makeControlRequest(
    state.controlPort,
    {
      token: state.ownerToken,
      instanceId: state.instanceId,
      supervisorPid: state.supervisorPid,
      requestPath: action === 'stop' ? '/__stop' : '/__restart',
      method: 'POST',
      timeoutMs: deps.controlTimeoutMs,
    },
    deps.httpRequest,
  );
  return { authenticated: matchesIdentity(state, result.body) && result.body?.action === action, result };
}

function recordedPids(state) {
  const pids = [];
  for (const key of ['launcherPid', 'supervisorPid', 'vitePid']) {
    const value = state?.[key];
    if (Number.isInteger(value) && value > 0) pids.push(value);
  }
  return pids;
}

export async function safeClearStateIfDead(deps, state) {
  const port = await deps.probePort(PREVIEW_HOST, PREVIEW_PORT);
  if (port !== 'closed') return false;
  const pids = recordedPids(state);
  if (pids.length === 0) {
    await deps.clearState();
    return true;
  }
  if (pids.every((pid) => !deps.isPidAlive(pid))) {
    await deps.clearState();
    return true;
  }
  return false;
}

export async function decideStart(deps) {
  const probe = deps.probePort;
  const initial = await probe(PREVIEW_HOST, PREVIEW_PORT);
  if (initial === 'open') {
    const existing = await deps.readState();
    if (existing?.controlPort && existing?.ownerToken && existing?.instanceId) {
      const status = await deps.controlStatus(existing);
      if (status.authenticated && status.body?.healthy === true && status.body?.vitePid) {
        return { decision: 'already-running', state: existing };
      }
      if (status.authenticated) {
        return { decision: 'in-flight', instanceId: existing.instanceId };
      }
    }
    return { decision: 'ownership-unknown', error: OWNERSHIP_UNKNOWN };
  }
  if (initial !== 'closed') {
    return { decision: 'ownership-unknown', error: OWNERSHIP_UNKNOWN };
  }

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const claimed = await deps.claimState({
      version: 1,
      instanceId: deps.instanceId,
      pending: true,
      claimedAt: Date.now(),
      launcherPid: process.pid,
      manifestPath: deps.manifestPath,
      manifestFingerprint: deps.manifestFingerprint,
      state: 'STARTING',
      healthy: false,
      supervisorPid: null,
      controlPort: null,
      ownerToken: null,
      vitePid: null,
    });
    if (claimed) return { decision: 'claimed', instanceId: deps.instanceId };

    const existing = await deps.readState();
    if (!existing) continue;
    if (existing.pending) {
      const port = await probe(PREVIEW_HOST, PREVIEW_PORT);
      if (port !== 'closed') return { decision: 'in-flight', instanceId: existing.instanceId };
      if (allPidsDead(existing, deps.isPidAlive)) {
        await deps.clearState();
        continue;
      }
      return { decision: 'in-flight', instanceId: existing.instanceId };
    }

    if (existing.controlPort && existing.ownerToken && existing.instanceId) {
      const status = await deps.controlStatus(existing);
      if (status.authenticated) {
        if (status.body?.healthy === true && status.body?.vitePid) {
          return { decision: 'already-running', state: existing };
        }
        return { decision: 'in-flight', instanceId: existing.instanceId };
      }
      const port = await probe(PREVIEW_HOST, PREVIEW_PORT);
      if (port === 'closed' && allPidsDead(existing, deps.isPidAlive)) {
        await deps.clearState();
        continue;
      }
      return { decision: 'ownership-unknown', error: OWNERSHIP_UNKNOWN };
    }

    const port = await probe(PREVIEW_HOST, PREVIEW_PORT);
    if (port === 'closed' && allPidsDead(existing, deps.isPidAlive)) {
      await deps.clearState();
      continue;
    }
    return { decision: 'ownership-unknown', error: OWNERSHIP_UNKNOWN };
  }
  return { decision: 'ownership-unknown', error: OWNERSHIP_UNKNOWN };
}

export function spawnDetachedSupervisor(manifestPath, instanceId, viteArguments, deps) {
  const child = deps.spawn(
    process.execPath,
    [supervisorScript, '--manifest', manifestPath, '--instance-id', instanceId, '--', ...viteArguments],
    { cwd: repoRoot, detached: true, stdio: 'ignore', windowsHide: true },
  );
  child.unref();
  return child.pid;
}

async function waitForHealthy(instanceId, deps, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let healthyCount = 0;
  while (Date.now() < deadline) {
    const state = await deps.readState();
    if (state && state.instanceId === instanceId && !state.pending && state.controlPort && state.ownerToken) {
      const status = await deps.controlStatus(state);
      if (status.authenticated && status.body?.healthy === true && status.body?.vitePid) {
        healthyCount += 1;
        if (healthyCount >= 2) return state;
        await deps.sleep(400);
        continue;
      }
    }
    healthyCount = 0;
    await deps.sleep(250);
  }
  return null;
}

async function waitForNewPidHealthy(instanceId, oldVitePid, deps, timeoutMs = 30000) {
  const deadline = Date.now() + timeoutMs;
  let healthyCount = 0;
  while (Date.now() < deadline) {
    const state = await deps.readState();
    if (state && state.instanceId === instanceId && state.controlPort && state.ownerToken) {
      const status = await deps.controlStatus(state);
      if (
        status.authenticated &&
        status.body?.healthy === true &&
        status.body?.vitePid &&
        status.body.vitePid !== oldVitePid
      ) {
        healthyCount += 1;
        if (healthyCount >= 2) return state;
        await deps.sleep(400);
        continue;
      }
    }
    healthyCount = 0;
    await deps.sleep(250);
  }
  return null;
}

async function waitForStopped(deps, timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await deps.readState();
    const port = await deps.probePort(PREVIEW_HOST, PREVIEW_PORT);
    if (!state && port === 'closed') return true;
    await deps.sleep(250);
  }
  return false;
}

export function createCli(deps = {}) {
  const makeControlRequestBound = deps.makeControlRequest ?? makeControlRequest;
  const httpRequestImpl = deps.httpRequest ?? request;
  const controlTimeoutMs = deps.controlTimeoutMs ?? 3000;
  const bound = {
    ...deps,
    makeControlRequest: makeControlRequestBound,
    httpRequest: httpRequestImpl,
    controlTimeoutMs,
    spawn: deps.spawn ?? spawn,
    readState: deps.readState ?? readState,
    probePort: deps.probePort ?? probePort,
    isPidAlive: deps.isPidAlive ?? isPidAlive,
    claimState: deps.claimState ?? claimState,
    clearState: deps.clearState ?? clearState,
    clearClaim: deps.clearClaim ?? clearClaim,
    safeClearStateIfDead: deps.safeClearStateIfDead ?? safeClearStateIfDead,
    sleep: deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms))),
  };

  const controlStatusBound = deps.controlStatus ?? ((state) => controlStatus(state, bound));
  const controlActionBound = deps.controlAction ?? ((state, action) => controlAction(state, action, bound));

  async function doStart(rawManifestPath, viteArguments = []) {
    assertSafeViteArguments(viteArguments);
    const { manifestPath, fingerprint } = await resolveManifest(rawManifestPath);
    const instanceId = generateInstanceId();
    const decision = await decideStart({
      instanceId,
      manifestPath,
      manifestFingerprint: fingerprint,
      ...bound,
      controlStatus: controlStatusBound,
    });
    if (decision.decision === 'already-running') {
      process.stdout.write(
        `Already running: supervisor ${decision.state.supervisorPid}, vite ${decision.state.vitePid}, healthy=true\n`,
      );
      return 0;
    }
    if (decision.decision === 'ownership-unknown') {
      process.stderr.write(`${OWNERSHIP_UNKNOWN}\n`);
      return 1;
    }
    if (decision.decision === 'in-flight') {
      const ready = await waitForHealthy(decision.instanceId, { ...bound, controlStatus: controlStatusBound });
      if (ready) {
        process.stdout.write(`Already running: supervisor ${ready.supervisorPid}, vite ${ready.vitePid}, healthy=true\n`);
        return 0;
      }
      process.stderr.write('A start was already in flight but did not become healthy in time.\n');
      return 1;
    }
    let supervisorPid;
    try {
      supervisorPid = spawnDetachedSupervisor(manifestPath, instanceId, viteArguments, bound);
    } catch (error) {
      await bound.clearClaim(instanceId);
      process.stderr.write(`Failed to launch supervisor: ${error?.message ?? 'unknown'}\n`);
      return 1;
    }
    const ready = await waitForHealthy(instanceId, { ...bound, controlStatus: controlStatusBound });
    if (!ready) {
      await bound.clearClaim(instanceId);
      process.stderr.write('The preview did not become RUNNING and healthy within the readiness window.\n');
      return 1;
    }
    process.stdout.write(
      `Started persistent preview: supervisor ${ready.supervisorPid ?? supervisorPid}, vite ${ready.vitePid}, healthy=true\n`,
    );
    return 0;
  }

  async function doStatus() {
    const state = await bound.readState();
    if (!state) {
      process.stdout.write('Status: STOPPED\n');
      return 1;
    }
    if (!state.controlPort || !state.ownerToken) {
      if (allPidsDead(state, bound.isPidAlive) && (await bound.probePort(PREVIEW_HOST, PREVIEW_PORT)) === 'closed') {
        process.stdout.write(`Status: ${state.state ?? 'STOPPED'} terminationReason=${state.terminationReason ?? 'unknown'}\n`);
        return 1;
      }
      process.stdout.write(`${OWNERSHIP_UNKNOWN}\n`);
      return 1;
    }
    const status = await controlStatusBound(state);
    if (!status.authenticated) {
      process.stdout.write(`${OWNERSHIP_UNKNOWN}\n`);
      return 1;
    }
    process.stdout.write(`Status: ${status.body.state} healthy=${status.body.healthy}\n`);
    for (const key of ['instanceId', 'supervisorPid', 'vitePid', 'controlPort', 'restartCount', 'lastHealthyAt', 'terminationReason']) {
      if (status.body[key] !== undefined) process.stdout.write(`  ${key}: ${status.body[key]}\n`);
    }
    return status.body.healthy ? 0 : 1;
  }

  async function doStop() {
    const state = await bound.readState();
    if (!state) {
      process.stdout.write('No preview state; nothing to stop.\n');
      return 0;
    }
    if (!state.controlPort || !state.ownerToken) {
      const cleared = await bound.safeClearStateIfDead(state);
      if (cleared) {
        process.stdout.write('Stale preview state cleared (all recorded processes dead, port closed).\n');
        return 0;
      }
      process.stdout.write(`${OWNERSHIP_UNKNOWN}\n`);
      return 1;
    }
    const status = await controlStatusBound(state);
    if (!status.authenticated) {
      const cleared = await bound.safeClearStateIfDead(state);
      if (cleared) {
        process.stdout.write('Stale preview state cleared (all recorded processes dead, port closed).\n');
        return 0;
      }
      process.stdout.write(`${OWNERSHIP_UNKNOWN}\n`);
      return 1;
    }
    const ack = await controlActionBound(state, 'stop');
    if (!ack.authenticated) {
      process.stderr.write('Stop was not acknowledged by the authenticated supervisor.\n');
      return 1;
    }
    const stopped = await waitForStopped(bound);
    if (!stopped) {
      process.stderr.write('The supervisor did not release its state and close port 4173 in time.\n');
      return 1;
    }
    process.stdout.write('Stop complete.\n');
    return 0;
  }

  async function doRestart(rawManifestPath) {
    const state = await bound.readState();
    if (!state || !state.controlPort || !state.ownerToken) {
      if (rawManifestPath) return doStart(rawManifestPath);
      process.stderr.write('No preview state and no manifest supplied to start.\n');
      return 1;
    }
    const status = await controlStatusBound(state);
    if (!status.authenticated) {
      process.stderr.write(`${OWNERSHIP_UNKNOWN}\n`);
      return 1;
    }
    if (rawManifestPath) {
      const resolved = await resolveManifest(rawManifestPath);
      if (state.manifestFingerprint && state.manifestFingerprint !== resolved.fingerprint) {
        process.stderr.write('Refusing restart: manifest content differs from the running instance.\n');
        return 1;
      }
    } else if (state.manifestPath) {
      await resolveManifest(state.manifestPath);
    }
    const oldVitePid = state.vitePid;
    const ack = await controlActionBound(state, 'restart');
    if (!ack.authenticated) {
      process.stderr.write('Restart was not acknowledged by the authenticated supervisor.\n');
      return 1;
    }
    const ready = await waitForNewPidHealthy(state.instanceId, oldVitePid, { ...bound, controlStatus: controlStatusBound });
    if (!ready) {
      process.stderr.write('The preview did not restart to a new healthy vite child in time.\n');
      return 1;
    }
    process.stdout.write(`Restarted: vite ${ready.vitePid}, healthy=true\n`);
    return 0;
  }

  async function doForeground(rawManifestPath, viteArguments) {
    assertSafeViteArguments(viteArguments);
    const { target } = await resolveManifest(rawManifestPath);
    const vite = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
    process.stdout.write('Starting the Figma-native loopback preview with a verified isolated-playground proxy.\n');
    const child = bound.spawn(
      process.execPath,
      [vite, '--host', PREVIEW_HOST, '--port', String(PREVIEW_PORT), '--strictPort', ...viteArguments],
      {
        cwd: repoRoot,
        env: { ...process.env, HAU_PLAYGROUND_PROXY_ORIGIN: target.origin },
        stdio: 'inherit',
        windowsHide: true,
      },
    );
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.on(signal, () => {
        if (!child.killed) child.kill(signal);
      });
    }
    return new Promise((resolve) => {
      child.on('exit', (code, signal) => resolve(signal ? 0 : code ?? 1));
    });
  }

  return { doStart, doStatus, doStop, doRestart, doForeground };
}

export async function runCli(argv = process.argv.slice(2), deps = {}) {
  const cli = createCli(deps);
  const [mode, ...rest] = argv;
  if (mode === 'dev') {
    return cli.doForeground(rest[0], rest.slice(1));
  }
  const manifestIndex = rest.indexOf('--manifest');
  const rawManifestPath = manifestIndex >= 0 ? rest[manifestIndex + 1] : null;
  const viteArguments = rest.includes('--') ? rest.slice(rest.indexOf('--') + 1) : [];
  switch (mode) {
    case 'start':
      return cli.doStart(rawManifestPath, viteArguments);
    case 'status':
      return cli.doStatus();
    case 'restart':
      return cli.doRestart(rawManifestPath);
    case 'stop':
      return cli.doStop();
    default:
      process.stderr.write(
        'Usage: node scripts/start-frontend-playground-preview.mjs <start|status|restart|stop|dev> [--manifest <path>] [-- <vite args>]\n',
      );
      return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(`${error?.message ?? 'Unknown error'}\n`);
      process.exitCode = 1;
    });
}
