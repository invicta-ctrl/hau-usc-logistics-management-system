import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const sourcePath = path.join(repoRoot, 'dist', 'index.html');
const outputPath = path.join(repoRoot, 'HAU-USC_Logistics-Prototype-Shareable.html');
const html = await readFile(sourcePath, 'utf8');
if (!html.includes('__HAU_V5_INTEGRATION__') || !html.includes('<div id="app"></div>')) {
  throw new Error('Refusing to create a shareable from a non-V5 artifact.');
}
await writeFile(outputPath, html);
console.log('Deterministic V5 single-file shareable created from dist/index.html.');
