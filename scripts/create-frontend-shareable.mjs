import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = resolve('dist/index.html');
const destination = resolve('HAU-USC_Logistics-Frontend-Shareable.html');
const html = await readFile(source, 'utf8');
if (!html.includes('<div id="app"></div>') || !html.includes('HAU-USC Logistics')) {
  throw new Error('Refusing to create a shareable from a non-frontend artifact.');
}
await writeFile(destination, html);
console.log('Deterministic Figma frontend single-file shareable created from dist/index.html.');
