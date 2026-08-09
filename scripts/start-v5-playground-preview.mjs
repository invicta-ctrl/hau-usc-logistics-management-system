import { spawn } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parsePlaygroundOrigin, verifyPlaygroundOrigin } from './playground-proxy-guard.mjs';
import { resolvePrivatePath } from './private-path.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const vite = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
const [rawManifestPath, ...viteArguments] = process.argv.slice(2);

if (!rawManifestPath || !path.isAbsolute(rawManifestPath)) {
  throw new Error(
    'Usage: npm run dev:v5:playground -- <absolute-private-playground-manifest> [vite arguments]',
  );
}

const manifestPath = await resolvePrivatePath(rawManifestPath, {
  repoRoot,
  label: 'Private playground manifest',
  kind: 'file',
});
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const configured = String(manifest.playgroundHostname ?? '').trim();
const target = parsePlaygroundOrigin(configured, { allowBareHostname: true });
await verifyPlaygroundOrigin(target);

process.stdout.write('Starting the V5 loopback preview with a verified isolated-playground proxy.\n');
const child = spawn(
  process.execPath,
  [vite, '--host', '127.0.0.1', '--port', '4173', '--strictPort', ...viteArguments],
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
child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  else process.exit(code ?? 1);
});
