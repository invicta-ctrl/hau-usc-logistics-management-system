import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Script } from 'node:vm';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const canonicalRoot = path.join(repoRoot, 'dist');
const canonicalPath = path.join(canonicalRoot, 'index.html');
const shareablePath = path.join(repoRoot, 'HAU-USC_Logistics-Prototype-Shareable.html');

async function artifactFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      const nested = await artifactFiles(path.join(directory, entry.name));
      files.push(...nested.map((name) => path.join(entry.name, name)));
    } else if (entry.isFile()) files.push(entry.name);
  }
  return files.map((name) => name.replaceAll('\\', '/')).sort();
}

function verifySingleFile(html, label) {
  const required = [
    '<div id="app"></div>',
    'HAU-USC Logistics · Whole-site redesign preview v4.1',
    '__HAU_V5_INTEGRATION__',
    'public.request-intake',
    'public.lending-intake',
    'request.queue',
    'inventory.catalog',
  ];
  const missing = required.filter((marker) => !html.includes(marker));
  if (missing.length) throw new Error(`${label} is missing ${missing.length} required V5 marker(s).`);
  if (/<script[^>]+\bsrc=|<link[^>]+\brel=["']stylesheet/iu.test(html)) {
    throw new Error(`${label} contains an external runtime asset dependency.`);
  }
  if (/<script[^>]+\btype=["']module["']/iu.test(html)) {
    throw new Error(`${label} still uses a module script and is not a single-file artifact.`);
  }
  const inlineScripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/giu)];
  if (!inlineScripts.length) throw new Error(`${label} contains no inline application script.`);
  for (const [index, match] of inlineScripts.entries()) {
    try {
      new Script(match[1], { filename: `${label}:inline-script-${index + 1}` });
    } catch (error) {
      throw new Error(`${label} is not valid classic-script JavaScript.`, { cause: error });
    }
  }
}

const canonical = await readFile(canonicalPath, 'utf8');
verifySingleFile(canonical, 'dist/index.html');
const shareable = await readFile(shareablePath, 'utf8');
verifySingleFile(shareable, 'the V5 shareable');
if (shareable !== canonical) throw new Error('The V5 shareable differs from dist/index.html.');

const privateRoot = await mkdtemp(path.join(tmpdir(), 'hau-usc-v5-dist-'));
try {
  const freshRoot = path.join(privateRoot, 'dist');
  const vite = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  execFileSync(process.execPath, [vite, 'build', '--mode', 'preview', '--outDir', freshRoot], {
    cwd: repoRoot,
    stdio: 'pipe',
    windowsHide: true,
  });
  const [canonicalFiles, freshFiles] = await Promise.all([
    artifactFiles(canonicalRoot),
    artifactFiles(freshRoot),
  ]);
  if (JSON.stringify(canonicalFiles) !== JSON.stringify(freshFiles)) {
    throw new Error('The canonical and fresh V5 artifact file sets differ.');
  }
  for (const relative of canonicalFiles) {
    const [expected, actual] = await Promise.all([
      readFile(path.join(canonicalRoot, relative)),
      readFile(path.join(freshRoot, relative)),
    ]);
    if (!expected.equals(actual)) throw new Error(`dist/${relative} differs from a fresh V5 build.`);
  }
  verifySingleFile(await readFile(path.join(freshRoot, 'index.html'), 'utf8'), 'fresh V5 build');
} finally {
  await rm(privateRoot, { recursive: true, force: true });
}

const digest = createHash('sha256').update(canonical).digest('hex');
console.log(
  `Verified deterministic V5 single-file preview (${Buffer.byteLength(canonical).toLocaleString()} bytes, sha256 ${digest.slice(0, 16)}...).`,
);
