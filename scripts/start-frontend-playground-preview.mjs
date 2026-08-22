import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { request } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePlaygroundOrigin, verifyPlaygroundOrigin } from './playground-proxy-guard.mjs';
import { resolvePrivatePath } from './private-path.mjs';
import {
  PREVIEW_HOST,
  computeFingerprint,
  readState,
  stateFilePath,
  writeStateAtomic,
} from './frontend-preview-supervisor.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const supervisorScript = path.join(repoRoot, 'scripts', 'frontend-preview-supervisor.mjs');

function usageError() {
  throw new Error(
    'Usage: node scripts/start-frontend-playground-preview.mjs <start|status|restart|stop> [--manifest <absolute-private-playground-manifest>] [-- <vite args>]',
  );
}

async function resolveManifest(rawManifestPath) {
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

function requestJson(port, token, requestPath, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = request(
      {
        host: PREVIEW_HOST,
        port,
        path: requestPath,
        method,
        headers: { 'x-owner-token': token },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const body = Buffer.concat(chunks).toString('utf8');
          resolve({ status: res.statusCode, body: body ? JSON.parse(body) : {} });
        });
      },
    );
    req.on('error', reject);
    req.end();
  });
}

async function readLiveState() {
  const state = await readState(repoRoot);
  if (!state || !state.controlPort || !state.ownerToken) return null;
  try {
    const result = await requestJson(state.controlPort, state.ownerToken, '/__status');
    if (result.status !== 200) return null;
    return result.body;
  } catch {
    return null;
  }
}

function reportTokenRedacted(state) {
  return {
    state: state.state,
    healthy: state.healthy,
    supervisorPid: state.supervisorPid,
    vitePid: state.vitePid,
    controlPort: state.controlPort,
    restartCount: state.restartCount,
    lastHealthyAt: state.lastHealthyAt,
    manifestFingerprint: state.manifestFingerprint,
  };
}

async function spawnDetachedSupervisor(manifestPath) {
  const child = spawn(
    process.execPath,
    [supervisorScript, '--manifest', manifestPath],
    {
      cwd: repoRoot,
      detached: true,
      stdio: 'ignore',
      windowsHide: true,
    },
  );
  child.unref();
  return child.pid;
}

async function awaitPublishedState(timeoutMs = 15000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await readState(repoRoot);
    if (state && !state.pending && state.controlPort && state.ownerToken) {
      return state;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error('The persistent supervisor did not publish a live control state in time.');
}

async function doStart(rawManifestPath) {
  const { manifestPath, fingerprint } = await resolveManifest(rawManifestPath);
  const existing = await readLiveState();
  if (existing) {
    process.stdout.write(
      `Already running: supervisor ${existing.supervisorPid}, vite ${existing.vitePid}, ` +
        `healthy=${existing.healthy} state=${existing.state}\n`,
    );
    return 0;
  }
  const staleState = await readState(repoRoot);
  if (staleState?.controlPort) {
    process.stderr.write(
      `Refusing to start: a stale preview state exists (supervisor pid ${staleState.supervisorPid}) ` +
        `but its control endpoint is not responding. Run "npm run preview:frontend:stop" to clear it first.\n`,
    );
    return 1;
  }
  if (!staleState) {
    await writeStateAtomic(repoRoot, {
      version: 1,
      pending: true,
      manifestPath,
      manifestFingerprint: fingerprint,
      state: 'STARTING',
      healthy: false,
    });
  }
  const supervisorPid = spawnDetachedSupervisor(manifestPath);
  const state = await awaitPublishedState();
  process.stdout.write(
    `Started persistent preview: supervisor ${state.supervisorPid || supervisorPid}, ` +
      `controlPort ${state.controlPort}, vite ${state.vitePid ?? 'starting'}\n`,
  );
  return 0;
}

async function doStatus() {
  const live = await readLiveState();
  if (!live) {
    process.stdout.write('Status: STOPPED\n');
    return 1;
  }
  process.stdout.write(`Status: ${live.state} healthy=${live.healthy}\n`);
  for (const [key, value] of Object.entries(reportTokenRedacted(live))) {
    process.stdout.write(`  ${key}: ${value}\n`);
  }
  return live.healthy ? 0 : 1;
}

async function doStop() {
  const state = await readState(repoRoot);
  if (!state?.controlPort || !state?.ownerToken) {
    process.stdout.write('No preview state; nothing to stop.\n');
    return 0;
  }
  let result;
  try {
    result = await requestJson(state.controlPort, state.ownerToken, '/__stop', 'POST');
  } catch {
    process.stderr.write(
      `The recorded supervisor (pid ${state.supervisorPid}) did not respond on its control port; ` +
        `refusing to take external action. The stale state was preserved in ${stateFilePath(repoRoot)}.\n`,
    );
    return 1;
  }
  process.stdout.write(result?.body?.ok ? 'Stop requested.\n' : 'Stop not acknowledged.\n');
  return 0;
}

async function doRestart(rawManifestPath) {
  const state = await readState(repoRoot);
  if (!state?.controlPort || !state?.ownerToken) {
    process.stdout.write('No preview state; starting fresh instead of restarting.\n');
    return doStart(rawManifestPath);
  }
  const { fingerprint } = await resolveManifest(rawManifestPath);
  if (state.manifestFingerprint && state.manifestFingerprint !== fingerprint) {
    process.stderr.write(
      'Refusing restart: the manifest path resolves to a different content fingerprint than the running instance.\n',
    );
    return 1;
  }
  let result;
  try {
    result = await requestJson(state.controlPort, state.ownerToken, '/__restart', 'POST');
  } catch {
    process.stderr.write('The running supervisor did not respond; refusing to take external action.\n');
    return 1;
  }
  process.stdout.write(result?.body?.ok ? 'Restart requested.\n' : 'Restart not acknowledged.\n');
  return 0;
}

async function doForeground(rawManifestPath, viteArguments) {
  const { target } = await resolveManifest(rawManifestPath);
  const vite = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  process.stdout.write('Starting the Figma-native loopback preview with a verified isolated-playground proxy.\n');
  const child = spawn(
    process.execPath,
    [vite, '--host', PREVIEW_HOST, '--port', '4173', '--strictPort', ...viteArguments],
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
    child.on('exit', (code, signal) => {
      if (signal) resolve(0);
      else resolve(code ?? 1);
    });
  });
}

async function run() {
  const [mode, ...rest] = process.argv.slice(2);
  if (!mode) usageError();
  if (mode === 'dev') {
    const rawManifestPath = rest[0];
    const viteArguments = rest.slice(1);
    return doForeground(rawManifestPath, viteArguments);
  }
  const manifestIndex = rest.indexOf('--manifest');
  const rawManifestPath = manifestIndex >= 0 ? rest[manifestIndex + 1] : null;
  switch (mode) {
    case 'start':
      return doStart(rawManifestPath);
    case 'status':
      return doStatus();
    case 'restart':
      return doRestart(rawManifestPath);
    case 'stop':
      return doStop();
    default:
      usageError();
      return 1;
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run()
    .then((code) => {
      process.exitCode = code;
    })
    .catch((error) => {
      process.stderr.write(`${error?.message ?? 'Unknown error'}\n`);
      process.exitCode = 1;
    });
}
