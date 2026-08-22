import { spawn } from 'node:child_process';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { appendFileSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePlaygroundOrigin, verifyPlaygroundOrigin } from './playground-proxy-guard.mjs';
import { resolvePrivatePath } from './private-path.mjs';

export const PREVIEW_HOST = '127.0.0.1';
export const PREVIEW_PORT = 4173;
export const PREVIEW_URL = `http://${PREVIEW_HOST}:${PREVIEW_PORT}/`;

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

const BACKOFF_MS = [1000, 2000, 4000, 8000, 15000];

export function backoffDelay(restartCount) {
  const index = Math.max(0, Math.min(restartCount - 1, BACKOFF_MS.length - 1));
  return BACKOFF_MS[index];
}

export function generateOwnerToken(random = randomBytes) {
  return random(32).toString('hex');
}

export function computeFingerprint(content) {
  return createHash('sha256').update(content).digest('hex');
}

export function safeTokenEqual(left, right) {
  const a = Buffer.from(String(left ?? ''));
  const b = Buffer.from(String(right ?? ''));
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function readState(root = repoRoot) {
  try {
    return JSON.parse(await readFile(stateFilePath(root), 'utf8'));
  } catch {
    return null;
  }
}

export async function writeStateAtomic(root, state) {
  await mkdir(runtimeDirPath(root), { recursive: true });
  const target = stateFilePath(root);
  const temporary = `${target}.tmp-${process.pid}-${Date.now()}`;
  await writeFile(temporary, JSON.stringify(state, null, 2), 'utf8');
  await rename(temporary, target);
}

export async function clearState(root = repoRoot) {
  try {
    await rm(stateFilePath(root), { force: true });
  } catch {
    // best effort; the state file may already be gone
  }
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

    this.child = null;
    this.controlServer = null;
    this.controlPort = null;
    this.ownerToken = null;
    this.manifestPath = null;
    this.manifestFingerprint = null;
    this.targetOrigin = null;
    this.restartCount = 0;
    this.restartTimestamps = [];
    this.healthFailures = 0;
    this.lastHealthyAt = null;
    this.state = 'STARTING';
    this.healthy = false;
    this.shutdownRequested = false;
    this.restartRequested = false;
    this.healthTimer = null;
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

  async reverifyOrigin() {
    const raw = await readFile(this.manifestPath);
    const manifest = JSON.parse(raw.toString('utf8'));
    const configured = String(manifest.playgroundHostname ?? '').trim();
    const target = parsePlaygroundOrigin(configured, { allowBareHostname: true });
    await verifyPlaygroundOrigin(target, this.fetchImpl);
    this.targetOrigin = target.origin;
    this.manifestFingerprint = computeFingerprint(raw);
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
      supervisorPid: process.pid,
      vitePid: this.child?.pid ?? null,
      state: this.state,
      healthy: this.healthy,
      restartCount: this.restartCount,
      lastHealthyAt: this.lastHealthyAt,
      manifestFingerprint: this.manifestFingerprint,
    };
  }

  handleControl(req, res) {
    const token = req.headers['x-owner-token'] ?? '';
    if (!safeTokenEqual(token, this.ownerToken)) {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: false, reason: 'ownership-unknown' }));
      return;
    }
    const pathname = new URL(req.url, `http://${PREVIEW_HOST}`).pathname;
    if (pathname === '/__status') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify(this.statusPayload()));
      return;
    }
    if (pathname === '/__stop') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      this.requestStop();
      return;
    }
    if (pathname === '/__restart') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
      this.requestRestart();
      return;
    }
    res.writeHead(404, { 'content-type': 'application/json' });
    res.end(JSON.stringify({ ok: false, reason: 'not-found' }));
  }

  async writeState() {
    await writeStateAtomic(this.runtimeRoot, {
      version: 1,
      supervisorPid: process.pid,
      vitePid: this.child?.pid ?? null,
      controlPort: this.controlPort,
      ownerToken: this.ownerToken,
      manifestPath: this.manifestPath,
      manifestFingerprint: this.manifestFingerprint,
      state: this.state,
      healthy: this.healthy,
      restartCount: this.restartCount,
      lastHealthyAt: this.lastHealthyAt,
    });
  }

  async launchChild() {
    if (this.child && this.child.exitCode === null && !this.child.killed) return;
    await this.reverifyOrigin();
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
    child.on('exit', (code, signal) => this.onChildExit(code, signal));
    await this.writeState();
  }

  async waitReady(timeoutMs = 30000) {
    const deadline = this.now() + timeoutMs;
    let lastError = null;
    while (this.now() < deadline) {
      if (this.shutdownRequested) return false;
      try {
        const response = await this.fetchImpl(PREVIEW_URL, { signal: AbortSignal.timeout(2000) });
        if (response.ok) {
          this.healthy = true;
          this.state = 'RUNNING';
          this.lastHealthyAt = new Date(this.now()).toISOString();
          this.restartCount = 0;
          this.restartTimestamps = [];
          this.healthFailures = 0;
          await this.writeState();
          this.log('info', 'preview healthy');
          return true;
        }
      } catch (error) {
        lastError = error;
      }
      await this.sleep(500);
    }
    this.log('warn', `preview not healthy within ${timeoutMs}ms: ${lastError?.message ?? 'timeout'}`);
    return false;
  }

  isRestartLoop() {
    const now = this.now();
    const cutoff = now - 60000;
    this.restartTimestamps = this.restartTimestamps.filter((stamp) => stamp > cutoff);
    this.restartTimestamps.push(now);
    return this.restartTimestamps.length > 5;
  }

  onChildExit(code, signal) {
    if (this.child) this.child.exitCode = code ?? (signal ? -1 : 1);
    this.log('info', `vite child exited code=${code ?? 'null'} signal=${signal ?? 'null'}`);
    if (this.shutdownRequested) {
      return this.finalize('STOPPED', 0);
    }
    if (this.restartRequested) {
      this.restartRequested = false;
      return this.restartChild();
    }
    this.restartCount += 1;
    if (this.isRestartLoop()) {
      this.log('error', 'PREVIEW_RESTART_LOOP_DETECTED');
      return this.finalize('STOPPED', 1);
    }
    return this.restartChild();
  }

  async restartChild() {
    const delay = backoffDelay(this.restartCount);
    this.log('info', `scheduling vite restart in ${delay}ms (attempt ${this.restartCount})`);
    await this.writeState();
    await this.sleep(delay);
    try {
      await this.launchChild();
      await this.waitReady();
    } catch (error) {
      this.log('error', `restart failed, stopping: ${error?.message ?? 'unknown'}`);
      await this.finalize('STOPPED', 1);
    }
  }

  startHealthLoop() {
    this.healthTimer = setInterval(async () => {
      if (this.shutdownRequested) return;
      try {
        const response = await this.fetchImpl(PREVIEW_URL, { signal: AbortSignal.timeout(2000) });
        if (response.ok) {
          if (!this.healthy) {
            this.healthy = true;
            this.state = 'RUNNING';
            this.lastHealthyAt = new Date(this.now()).toISOString();
            this.restartCount = 0;
            this.restartTimestamps = [];
            await this.writeState();
          }
          this.healthFailures = 0;
        } else {
          this.healthFailures += 1;
        }
      } catch {
        this.healthFailures += 1;
      }
      if (this.healthFailures >= 3 && this.child && this.child.exitCode === null) {
        this.log('warn', 'consecutive health failures; restarting owned child');
        this.restartCount += 1;
        if (this.isRestartLoop()) {
          await this.finalize('STOPPED', 1);
          return;
        }
        this.killChild();
        await this.restartChild();
      }
    }, 5000);
    this.healthTimer.unref?.();
  }

  installSignalHandlers() {
    for (const signal of ['SIGINT', 'SIGTERM']) {
      process.on(signal, () => {
        this.shutdownRequested = true;
        if (this.child && this.child.exitCode === null) this.killChild();
        else this.finalize('STOPPED', 0);
      });
    }
  }

  killChild() {
    const child = this.child;
    if (child && child.exitCode === null && !child.killed) child.kill('SIGTERM');
  }

  requestStop() {
    this.shutdownRequested = true;
    this.log('info', 'stop requested');
    this.killChild();
  }

  requestRestart() {
    this.restartRequested = true;
    this.log('info', 'restart requested');
    this.killChild();
  }

  async closeControl() {
    if (!this.controlServer) return;
    await new Promise((resolve) => this.controlServer.close(() => resolve()));
    this.controlServer = null;
  }

  async finalize(state = 'STOPPED', exitCode = 0) {
    this.state = state;
    await this.writeState();
    await this.closeControl();
    if (this.healthTimer) clearInterval(this.healthTimer);
    this.healthTimer = null;
    await this.sleep(50);
    await clearState(this.runtimeRoot);
    this.log('info', `supervisor exiting state=${state}`);
    process.exitCode = exitCode;
  }

  async run(manifestPathArg) {
    await this.resolveManifest(manifestPathArg);
    this.ownerToken = generateOwnerToken();
    await this.startControlServer();
    this.log('info', `supervisor started pid=${process.pid} token-present`);
    await this.launchChild();
    await this.waitReady();
    this.startHealthLoop();
    this.installSignalHandlers();
  }
}

export function parseSupervisorArgs(argv) {
  const args = { manifest: null, viteArguments: [] };
  const values = argv.slice(2);
  for (let index = 0; index < values.length; index += 1) {
    const token = values[index];
    if (token === '--manifest') {
      args.manifest = values[index + 1];
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
  const supervisor = new PreviewSupervisor();
  supervisor
    .run(args.manifest)
    .catch((error) => {
      supervisor.log('error', `fatal: ${error?.message ?? 'unknown'}`);
      process.exitCode = 1;
    });
}
