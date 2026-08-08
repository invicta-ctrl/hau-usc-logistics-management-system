import { execFileSync } from 'node:child_process';
import { readFile, readdir, rm, mkdtemp } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { tmpdir } from 'node:os';
import path, { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertGuidedDemoShareable } from './guided-demo.mjs';
import { shareableModules } from './shareable-module-registry.mjs';

const html = await readFile(resolve('dist/index.html'), 'utf8');
const shareable = await readFile(resolve('HAU-USC_Logistics-Prototype-Shareable.html'), 'utf8');
const guidedDemo = await readFile(resolve('hau-usc-logistics-guided-demo.html'), 'utf8');
const moduleDirectory = resolve('shareable-html-modules');
const repoRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const requiredMarkers = [
  'id="primaryNav"',
  'id="requestForm"',
  'id="lendingForm"',
  'id="releaseTickets"',
  'id="restockReceiveForm"',
  'id="deliverableReceiveForm"',
  'id="inventoryTable"',
  'document.addEventListener("DOMContentLoaded"',
];

const missing = requiredMarkers.filter((marker) => !html.includes(marker));
if (missing.length) throw new Error(`dist/index.html is missing: ${missing.join(', ')}`);
function verifyStandalone(content, label) {
  const missingMarkers = requiredMarkers.filter((marker) => !content.includes(marker));
  if (missingMarkers.length) throw new Error(`${label} is missing: ${missingMarkers.join(', ')}`);
  if (/<script[^>]+src=|<link[^>]+rel=["']stylesheet/i.test(content)) {
    throw new Error(`${label} still contains an external script or stylesheet dependency.`);
  }
  if (/<script[^>]+type=["']module["']/i.test(content)) {
    throw new Error(`${label} still uses a module script and may fail when opened from file://.`);
  }
  if (/[ \t]+$/m.test(content)) {
    throw new Error(`${label} contains trailing whitespace.`);
  }
}

verifyStandalone(html, 'dist/index.html');
verifyStandalone(shareable, 'the all-in-one shareable');
verifyStandalone(guidedDemo, 'the guided demo shareable');
assertGuidedDemoShareable(html, guidedDemo);
if (
  createHash('sha256').update(html).digest('hex') !== createHash('sha256').update(shareable).digest('hex')
) {
  throw new Error('The root shareable HTML file does not match dist/index.html.');
}

const guidedDemoMarkers = [
  'data-guided-demo="true"',
  '<title>HAU-USC Logistics - Guided Demo</title>',
  'id="demoGuideLauncher"',
  'id="demoGuide"',
  'id="guidedDemoScript"',
  'Step ',
];
const missingGuidedDemoMarkers = guidedDemoMarkers.filter((marker) => !guidedDemo.includes(marker));
if (missingGuidedDemoMarkers.length) {
  throw new Error(`The guided demo is missing: ${missingGuidedDemoMarkers.join(', ')}`);
}

const expectedFiles = shareableModules.map(({ filename }) => filename).sort();
const actualFiles = (await readdir(moduleDirectory)).filter((name) => name.endsWith('.html')).sort();
if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) {
  throw new Error(
    `Shareable module file set differs. Expected ${expectedFiles.join(', ')}; received ${actualFiles.join(', ')}.`,
  );
}

for (const module of shareableModules) {
  const moduleHtml = await readFile(resolve(moduleDirectory, module.filename), 'utf8');
  verifyStandalone(moduleHtml, module.filename);
  const expectedMarkers = [
    `data-shareable-module="${module.id}"`,
    `data-default-view="${module.id}"`,
    `<title>HAU-USC Logistics - ${module.title}</title>`,
    `<button class="active" data-view="${module.id}">`,
    `<section id="${module.id}" class="view active">`,
    `<h1 id="pageTitle">${module.title}</h1>`,
  ];
  const missingModuleMarkers = expectedMarkers.filter((marker) => !moduleHtml.includes(marker));
  if (missingModuleMarkers.length) {
    throw new Error(`${module.filename} is missing module markers: ${missingModuleMarkers.join(', ')}`);
  }
  if ((moduleHtml.match(/<button class="active" data-view=/g) || []).length !== 1) {
    throw new Error(`${module.filename} must have exactly one active primary navigation button.`);
  }
  if ((moduleHtml.match(/<section id="[^"]+" class="view active">/g) || []).length !== 1) {
    throw new Error(`${module.filename} must have exactly one active primary module view.`);
  }
}

async function artifactFiles(directory, relative = '') {
  const entries = await readdir(path.join(directory, relative), { withFileTypes: true });
  const found = [];
  for (const entry of entries) {
    const child = path.join(relative, entry.name);
    if (entry.isDirectory()) found.push(...(await artifactFiles(directory, child)));
    else if (entry.isFile()) found.push(child.replaceAll('\\', '/'));
  }
  return found.sort();
}

const privateRoot = await mkdtemp(path.join(tmpdir(), 'hau-usc-preview-parity-'));
const freshDist = path.join(privateRoot, 'dist');
try {
  const vite = path.join(repoRoot, 'node_modules', 'vite', 'bin', 'vite.js');
  execFileSync(process.execPath, [vite, 'build', '--mode', 'preview', '--outDir', freshDist], {
    cwd: repoRoot,
    stdio: 'pipe',
    windowsHide: true,
  });
  const [canonicalFiles, freshFiles] = await Promise.all([
    artifactFiles(resolve('dist')),
    artifactFiles(freshDist),
  ]);
  if (JSON.stringify(canonicalFiles) !== JSON.stringify(freshFiles)) {
    throw new Error('Tracked dist file set differs from a fresh isolated preview build.');
  }
  for (const relative of canonicalFiles) {
    const [canonical, fresh] = await Promise.all([
      readFile(path.join(resolve('dist'), relative)),
      readFile(path.join(freshDist, relative)),
    ]);
    if (!canonical.equals(fresh)) {
      throw new Error(`Tracked dist/${relative} differs from a fresh isolated preview build.`);
    }
  }
  const freshHtml = await readFile(path.join(freshDist, 'index.html'), 'utf8');
  if (!/["']preview["']\s*\)?\s*\.trim\(\)\s*\.toLowerCase\(\)/u.test(freshHtml)) {
    throw new Error('Fresh canonical preview artifact does not declare preview build mode.');
  }
  if (/["'](?:staging|production)["']\s*\)?\s*\.trim\(\)\s*\.toLowerCase\(\)/u.test(freshHtml)) {
    throw new Error('Fresh canonical preview artifact contains a deployable build mode.');
  }
} finally {
  await rm(privateRoot, { recursive: true, force: true });
}

console.log(
  `Verified fresh preview parity, the all-in-one standalone (${Buffer.byteLength(html).toLocaleString()} bytes), guided demo, and ${shareableModules.length} module shareables.`,
);
