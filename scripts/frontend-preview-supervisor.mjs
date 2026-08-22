import { spawn } from 'node:child_process';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { appendFileSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { mkdir, open, readFile, rm } from 'node:fs/promises';
import { createServer } from 'node:http';
import { connect } from 'node:net';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePlaygroundOrigin, verifyPlaygroundOrigin } from './playground-proxy-guard.mjs';
import { resolvePrivatePath } from './private-path.mjs';

export const PREVIEW_HOST = '127.0.0.1';
export const PREVIEW_PORT = 4173;
export const PREVIEW_URL = `http://${PREVIEW_HOST}:${PREVIEW_PORT}/`;
export const APP_HTML_MARKER = '<div id="app">';

export const BACKOFF_MS = [1000, 2000, 4000, 8000, 15000];
export const HEALTH_INTERVAL_MS = 5000;
export const HEALTH_FAILURE_THRESHOLD = 3;
export const SUSTAINED_HEALTHY_MS = 30000;
export const READY_TIMEOUT_MS = 30000;
export const CONTROL_TIMEOUT_MS = 3000;
export const OWNERSHIP_UNKNOWN = 'STOP_PORT_4173_OWNERSHIP_UNKNOWN';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

export function runtimeDirPath(root = repoRoot) {
  return path.join(root, '.codex', 'runtime', 'local-preview');
}

export function stateFilePath(root = repoRoot) {
  return path.join(runtimeDirPath(root), 'state.json');
}

export function logFilePath(root = repoRoot) {
  return path.join(runtimeDirPath(root), 'supervisor.log');
}

export function backoffDelay(restartCount) {
  const index = Math.max(0, Math.min(restartCount - 1, BACKOFF_MS.length - 1));
  return BACKOFF_MS[index];
}

export function generateOwnerToken(random = randomBytes) {
  return random(32).toString('hex');
}

export function generateInstanceId(random = randomBytes) {
  return random(16).toString('hex');
}

export function computeFingerprint(content) {
  return createHash('sha256').update(content).digest('hex');
}

export function safeTokenEqual(left, right) {
  const a = Buffer.from(String(left ?? ''));
  const b = Buffer.from(String(right ?? ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

export function buildWindowsTreeKillArgs(pid) {
  return ['/PID', String(pid), '/T'];
}

export function buildWindowsTreeForceKillArgs(pid) {
  return ['/PID', String(pid), '/T', '/F'];
}

async function writeStateFile(root, state, flags) {
  await mkdir(runtimeDirPath(root), { recursive: true });
  const target = stateFilePath(root);
  const handle = await open(target, flags, 0o600);
  try {
    await handle.writeFile(JSON.stringify(state, null, 2), 'utf8');
  } finally {
    await handle.close();
  }
}

export async function claimState(root, state) {
  try {
    await writeStateFile(root, state, 'wx');
    return true;
  } catch (error) {
    if (error?.code === 'EEXIST') return false;
    throw error;
  }
}

export async function updateState(root, state) {
  await writeStateFile(root, state, 'w');
}

export async function readState(root = repoRoot) {
  try {
    return JSON.parse(await readFile(stateFilePath(root), 'utf8'));
  } catch {
    return null;
  }
}

export async function clearState(root = repoRoot) {
  try {
    await rm(stateFilePath(root), { force: true });
  } catch {
    // best effort; the state file may already be gone
  }
}

export async function clearClaim(root, instanceId) {
  const state = await readState(root);
  if (state && state.pending === true && state.instanceId === instanceId) {
    await clearState(root);
  }
}

export function isPidAlive(pid) {
  if (!pid || !Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function probePort(host, port, { netConnect = connect, timeoutMs = 750 } = {}) {
  return new Promise((resolve) => {
    let settled = false;
    const socket = netConnect({ host, port });
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve('timeout');
    }, timeoutMs);
    socket.once('connect', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      socket.destroy();
      resolve('open');
    });
    socket.once('error', () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve('closed');
    });
  });
}

function appendBoundedLog(filePath, line, maxBytes = 262144) {
  try {
    appendFileSync(filePath, `${line}\n`, 'utf8');
    if (statSync(filePath).size > maxBytes) {
      const tail = readFileSync(filePath, 'utf8').slice(-Math.floor(maxBytes / 2));
      writeFileSync(filePath, tail, 'utf8');
    }
  } catch {
    // local preview logging is best effort and must never crash the supervisor
  }
}

function makeFileLogger(runtimeRoot) {
  return {
    write(line) {
      appendBoundedLog(logFilePath(runtimeRoot), line);
    },
  };
}

export class PreviewSupervisor {
  constructor(deps = {}) {
    this.spawn = deps.spawn ?? spawn;
    this.fetchImpl = deps.fetch ?? globalThis.fetch;
    this.sleep = deps.sleep ?? ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
    this.now = deps.now ?? (() => Date.now());
    this.repoRoot = deps.repoRoot ?? repoRoot;
    this.runtimeRoot = deps.runtimeRoot ?? this.repoRoot;
    this.logger = deps.logger ?? makeFileLogger(this.runtimeRoot);
    this.viteArguments = deps.viteArguments ?? [];
    this.probePort = deps.probePort ?? probePort;
    this.isPidAlive = deps.isPidAlive ?? isPidAlive;
    this.clearState = deps.clearState ?? clearState;
    this.terminateTree = deps.terminateTree ?? null;
    this.terminateTreeForce = deps.terminateTreeForce ?? null;
    this.ownerToken = null;
    this.instanceId = null;

    this.child = null;
    this.controlServer = null;
    this.controlPort = null;
    this.manifestPath = null;
    this.manifestFingerprint = null;
    this.targetOrigin = null;
    this.restartCount = 0;
    this.restartTimestamps = [];
    this.healthFailures = 0;
    this.lastHealthyAt = null;
    this.healthySince = null;
    this.state = 'STARTING';
    this.healthy = false;
    this.shutdownRequested = false;
    this.restarting = false;
    this.healthTimer = null;
    this.terminationReason = null;
    this.logLines = [];
  }

  log(level, message) {
    const line = `[${new Date(this.now()).toISOString()}] ${level} ${String(message)}`;
    this.logLines.push(line);
    if (this.logLines.length > 500) this.logLines = this.logLines.slice(-500);
    this.logger.write(line);
  }

  async resolveManifest(manifestPathArg) {
    if (!manifestPathArg || !path.isAbsolute(manifestPathArg)) {
      throw new Error('The private playground manifest must be an absolute path.');
    }
    const resolved = await resolvePrivatePath(manifestPathArg, {
      repoRoot: this.repoRoot,
      label: 'Private playground manifest',
      kind: 'file',
    });
    const raw = await readFile(resolved);
    const manifest = JSON.parse(raw.toString('utf8'));
    const configured = String(manifest.playgroundHostname ?? '').trim();
    const target = parsePlaygroundOrigin(configured, { allowBareHostname: true });
    await verifyPlaygroundOrigin(target, this.fetchImpl);
    this.manifestPath = resolved;
    this.targetOrigin = target.origin;
    this.manifestFingerprint = computeFingerprint(raw);
    return target;
  }

  async adoptClaim(instanceId) {
    const claim = await readState(this.runtimeRoot);
    if (!claim || claim.pending !== true || claim.instanceId !== instanceId) {
      throw new Error('The preview ownership claim is missing or does not match this supervisor.');
    }
    this.instanceId = instanceId;
    if (claim.manifestPath && claim.manifestPath !== this.manifestPath) {
      await this.resolveManifest(claim.manifestPath);
    }
  }

  async startControlServer() {
    await new Promise((resolve, reject) => {
      const server = createServer((req, res) => this.handleControl(req, res));
      server.once('error', reject);
      server.listen(0, PREVIEW_HOST, () => {
        this.controlPort = server.address().port;
        this.controlServer = server;
        resolve();
      });
    });
  }

  statusPayload() {
    return {
      ok: true,
      instanceId: this.instanceId,
      supervisorPid: process.pid,
      controlPort: this.controlPort,
      vitePid: this.child?.pid ?? null,
      state: this.state,
      healthy: this.healthy,
      restartCount: this.restartCount,
      lastHealthyAt: this.lastHealthyAt,
      terminationReason: this.terminationReason,
      manifestFingerprint: this.manifestFingerprint,
    };
  }

  writeJson(res, status, body) {
    res.writeHead(status, { 'content-type': 'application/json' });
    res.end(JSON.stringify(body));
  }

  authenticated(req) {
    return (
      safeTokenEqual(req.headers['x-owner-token'], this.ownerToken) &&
      req.headers['x-instance-id'] === this.instanceId &&
      String(req.headers['x-supervisor-pid']) === String(process.pid)
    );
  }

  handleControl(req, res) {
    if (!this.authenticated(req)) {
      this.writeJson(res, 401, { ok: false, reason: 'ownership-unknown' });
      return;
    }
    const pathname = new URL(req.url, `http://${PREVIEW_HOST}`).pathname;
    if (pathname === '/__status') {
      if (req.method !== 'GET') {
        this.writeJson(res, 405, { ok: false, reason: 'method-not-allowed' });
        return;
      }
      this.writeJson(res, 200, this.statusPayload());
      return;
    }
    if (pathname === '/__stop' || pathname === '/__restart') {
      if (req.method !== 'POST') {
        this.writeJson(res, 405, { ok: false, reason: 'method-not-allowed' });
        return;
      }
      this.writeJson(res, 200, { ok: true });
      if (pathname === '/__stop') this.requestStop();
      else this.requestRestart();
      return;
    }
    this.writeJson(res, 404, { ok: false, reason: 'not-found' });
  }

  async writeState() {
    await updateState(this.runtimeRoot, {
      version: 1,
      pending: false,
      instanceId: this.instanceId,
      supervisorPid: process.pid,
      controlPort: this.controlPort,
      ownerToken: this.ownerToken,
      vitePid: this.child?.pid ?? null,
      manifestPath: this.manifestPath,
      manifestFingerprint: this.manifestFingerprint,
      state: this.state,
      healthy: this.healthy,
      restartCount: this.restartCount,
      lastHealthyAt: this.lastHealthyAt,
      terminationReason: this.terminationReason,
    });
  }

  async preflightPort() {
    const result = await this.probePort(PREVIEW_HOST, PREVIEW_PORT);
    if (result === 'open') {
      throw new Error(OWNERSHIP_UNKNOWN);
    }
  }

  async launchChild() {
    if (this.child && this.child.exitCode === null && !this.child.killed) return;
    await this.resolveManifest(this.manifestPath);
    await this.preflightPort();
    this.state = 'STARTING';
    this.log('info', 'launching vite child');
    const vite = path.join(this.repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
    const child = this.spawn(
      process.execPath,
      [vite, '--host', PREVIEW_HOST, '--port', String(PREVIEW_PORT), '--strictPort', ...this.viteArguments],
      {
        cwd: this.repoRoot,
        env: { ...process.env, HAU_PLAYGROUND_PROXY_ORIGIN: this.targetOrigin },
        stdio: ['ignore', 'pipe', 'pipe'],
        windowsHide: true,
      },
    );
    this.child = child;
    child.stdout?.on('data', (chunk) => this.log('vite', String(chunk).trimEnd()));
    child.stderr?.on('data', (chunk) => this.log('vite', String(chunk).trimEnd()));
    child.on('error', (error) => this.log('error', `vite spawn error: ${error?.message ?? 'unknown'}`));
    child.on('exit', (code, signal) => {
      this.handleChildExit(code, signal).catch((error) => {
        this.log('error', `exit handler failed: ${error?.message ?? 'unknown'}`);
      });
    });
    await this.writeState();
  }

  async verifyReady() {
    if (!this.child || this.child.exitCode !== null) return false;
    let response;
    try {
      response = await this.fetchImpl(PREVIEW_URL, { signal: AbortSignal.timeout(2000) });
    } catch {
      return false;
    }
    if (!response.ok) return false;
    const contentType = String(response.headers?.get?.('content-type') ?? '').toLowerCase();
    if (!contentType.includes('text/html')) return false;
    const body = await response.text();
    return body.includes(APP_HTML_MARKER);
  }

  async waitReady(timeoutMs = READY_TIMEOUT_MS) {
    const deadline = this.now() + timeoutMs;
    while (this.now() < deadline) {
      if (this.shutdownRequested) return false;
      if (this.child && this.child.exitCode !== null) return false;
      if (await this.verifyReady()) {
        this.healthy = true;
        this.state = 'RUNNING';
        this.lastHealthyAt = new Date(this.now()).toISOString();
        this.healthySince = this.healthySince ?? this.now();
        await this.writeState();
        this.log('info', 'preview healthy');
        return true;
      }
      await this.sleep(500);
    }
    this.log('warn', `preview not healthy within ${timeoutMs}ms`);
    return false;
  }

  isRestartLoop() {
    const now = this.now();
    const cutoff = now - 60000;
    this.restartTimestamps = this.restartTimestamps.filter((stamp) => stamp > cutoff);
    this.restartTimestamps.push(now);
    return this.restartTimestamps.length > 5;
  }

  async handleChildExit(code, signal) {
    if (this.child) this.child.exitCode = code ?? (signal ? -1 : 1);
    this.log('info', `vite child exited code=${code ?? 'null'} signal=${signal ?? 'null'}`);
    if (this.shutdownRequested) {
      await this.finalize('stopped', 0);
      return;
    }
    await this.performRestart();
  }

  async performRestart() {
    if (this.restarting) return;
    this.restarting = true;
    try {
      this.restartCount += 1;
      if (this.isRestartLoop()) {
        this.log('error', 'PREVIEW_RESTART_LOOP_DETECTED');
        await this.finalize('loop', 1);
        return;
      }
      const delay = backoffDelay(this.restartCount);
      this.log('info', `scheduling vite restart in ${delay}ms (attempt ${this.restartCount})`);
      await this.writeState();
      await this.sleep(delay);
      try {
        await this.launchChild();
        const ready = await this.waitReady();
        if (!ready) {
          await this.finalize('start_failed', 1);
        }
      } catch (error) {
        this.log('error', `restart failed: ${error?.message ?? 'unknown'}`);
        await this.finalize('start_failed', 1);
      }
    } finally {
      this.restarting = false;
    }
  }

  startHealthLoop() {
    if (this.healthTimer) return;
    this.healthTimer = setInterval(() => {
      this.healthTick().catch((error) => this.log('error', `health tick failed: ${error?.message ?? 'unknown'}`));
    }, HEALTH_INTERVAL_MS);
    this.healthTimer.unref?.();
  }

  async healthTick() {
    if (this.shutdownRequested || this.restarting) return;
    const ready = await this.verifyReady();
    if (ready) {
      this.healthFailures = 0;
      if (!this.healthy) {
        this.healthy = true;
        this.state = 'RUNNING';
        this.lastHealthyAt = new Date(this.now()).toISOString();
        this.healthySince = this.healthySince ?? this.now();
        await this.writeState();
      } else if (this.healthySince && this.now() - this.healthySince >= SUSTAINED_HEALTHY_MS) {
        this.restartCount = 0;
        this.restartTimestamps = [];
        await this.writeState();
      }
      return;
    }
    this.healthFailures += 1;
    if (this.healthFailures >= HEALTH_FAILURE_THRESHOLD && this.child && this.child.exitCode === null) {
      this.log('warn', 'consecutive health failures; killing owned child for single restart');
      this.healthFailures = 0;
      await this.killOwnedChild();
    }
  }

  installSignalHandlers() {
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.on(signal, () => {
        this.shutdownRequested = true;
        this.requestStop();
      });
    }
  }

  async killOwnedChild() {
    const child = this.child;
    if (!child || child.exitCode !== null) return;
    const graceMs = 3000;
    try {
      if (typeof child.kill === 'function' && !child.killed) child.kill('SIGTERM');
      const deadline = this.now() + graceMs;
      while (this.now() < deadline && child.exitCode === null) {
        await this.sleep(100);
      }
      if (child.exitCode === null && this.terminateTreeForce) {
        await this.terminateTreeForce(child.pid);
      }
    } catch (error) {
      this.log('error', `owned child termination error: ${error?.message ?? 'unknown'}`);
    }
  }

  requestStop() {
    this.shutdownRequested = true;
    this.log('info', 'stop requested');
    void this.stopOwnedTree();
  }

  requestRestart() {
    this.log('info', 'restart requested');
    void this.killOwnedChild();
  }

  async stopOwnedTree() {
    const child = this.child;
    if (!child || child.exitCode !== null) {
      await this.finalize('stopped', 0);
      return;
    }
    await this.killOwnedChild();
    // The child exit handler calls finalize('stopped') because shutdownRequested is set.
    // Guard in case the exit event never fires (defensive bounded wait).
    const deadline = this.now() + 10000;
    while (this.now() < deadline && this.controlServer) {
      await this.sleep(100);
    }
  }

  async closeControl() {
    if (!this.controlServer) return;
    await new Promise((resolve) => this.controlServer.close(() => resolve()));
    this.controlServer = null;
  }

  async finalize(reason = 'stopped', exitCode = 0) {
    if (this.state === 'STOPPED' && this.terminationReason) return;
    this.shutdownRequested = true;
    this.state = 'STOPPED';
    this.terminationReason = reason;
    this.healthy = false;
    await this.writeState();
    await this.closeControl();
    if (this.healthTimer) clearInterval(this.healthTimer);
    this.healthTimer = null;
    if (this.child && this.child.exitCode === null && !this.child.killed) {
      try {
        this.child.kill('SIGTERM');
      } catch {
        // best effort; the process may already be gone
      }
    }
    if (reason !== 'loop') {
      await this.clearState(this.runtimeRoot);
    }
    this.log('info', `supervisor exiting state=STOPPED reason=${reason}`);
    process.exitCode = exitCode;
  }

  async run(manifestPathArg, instanceId) {
    await this.resolveManifest(manifestPathArg);
    this.ownerToken = generateOwnerToken();
    await this.adoptClaim(instanceId);
    await this.startControlServer();
    await this.writeState();
    this.log('info', `supervisor started pid=${process.pid} instance=${instanceId} token-present`);
    this.installSignalHandlers();
    try {
      await this.launchChild();
      const ready = await this.waitReady();
      if (!ready) {
        await this.finalize('start_failed', 1);
        return;
      }
      this.startHealthLoop();
    } catch (error) {
      this.log('error', `fatal: ${error?.message ?? 'unknown'}`);
      await this.finalize('start_failed', 1);
    }
  }
}

export function parseSupervisorArgs(argv) {
  const args = { manifest: null, instanceId: null, viteArguments: [] };
  const values = argv.slice(2);
  for (let index = 0; index < values.length; index += 1) {
    const token = values[index];
    if (token === '--manifest') {
      args.manifest = values[index + 1];
      index += 1;
    } else if (token === '--instance-id') {
      args.instanceId = values[index + 1];
      index += 1;
    } else if (token === '--') {
      args.viteArguments = values.slice(index + 1);
      break;
    }
  }
  return args;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseSupervisorArgs(process.argv);
  const supervisor = new PreviewSupervisor({ viteArguments: args.viteArguments });
  supervisor.run(args.manifest, args.instanceId).catch((error) => {
    supervisor.log('error', `fatal: ${error?.message ?? 'unknown'}`);
    process.exitCode = 1;
  });
}
