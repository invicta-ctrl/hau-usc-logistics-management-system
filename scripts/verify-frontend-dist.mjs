import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const canonical = await readFile(resolve('dist/index.html'), 'utf8');
const shareable = await readFile(resolve('HAU-USC_Logistics-Frontend-Shareable.html'), 'utf8');
for (const [label, html] of [['dist/index.html', canonical], ['frontend shareable', shareable]]) {
  if (!html.includes('<div id="app"></div>') || !html.includes('HAU-USC Logistics')) throw new Error(`${label} is not the Figma frontend artifact.`);
  if (/<script[^>]+\bsrc=|<link[^>]+\brel=["']stylesheet/iu.test(html)) throw new Error(`${label} has an external runtime asset dependency.`);
}
if (canonical !== shareable) throw new Error('The frontend shareable differs from dist/index.html.');
console.log(`Verified deterministic Figma frontend artifact (sha256 ${createHash('sha256').update(canonical).digest('hex').slice(0, 16)}...).`);
