import { execFileSync, spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const wrangler = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const privateRoot = await mkdtemp(path.join(tmpdir(), 'hau-usc-local-worker-'));
const state = path.join(privateRoot, 'state');
const seed = path.join(privateRoot, 'seed.sql');
const shared = { cwd: repoRoot, stdio: 'inherit', windowsHide: true };

execFileSync(process.execPath, [path.join(repoRoot, 'scripts', 'd1', 'create-local-seed.mjs'), '--output', seed], shared);
execFileSync(process.execPath, [wrangler, 'd1', 'migrations', 'apply', 'DB', '--local', '--persist-to', state], shared);
execFileSync(process.execPath, [wrangler, 'd1', 'execute', 'DB', '--local', '--persist-to', state, '--file', seed], shared);

const worker = spawn(process.execPath, [wrangler, 'dev', '--local', '--persist-to', state, '--port', '8787'], shared);
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    if (!worker.killed) worker.kill(signal);
  });
}
worker.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
