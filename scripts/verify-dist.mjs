import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const html = await readFile(resolve('dist/index.html'), 'utf8');
const portalArtifacts = Object.freeze([
  { file: 'HAU-USC_Logistics-Main-Hub-Shareable.html', portalMode: 'internal' },
  { file: 'HAU-USC_Logistics-Request-Center-Shareable.html', portalMode: 'request' },
  { file: 'HAU-USC_Logistics-Lending-Hub-Shareable.html', portalMode: 'lending' },
]);
const shareable = await readFile(resolve('HAU-USC_Logistics-Prototype-Shareable.html'), 'utf8');
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
const verifyStandalone = (contents, file) => {
  const fileMissing = requiredMarkers.filter((marker) => !contents.includes(marker));
  if (fileMissing.length) throw new Error(`${file} is missing: ${fileMissing.join(', ')}`);
  if (/<script[^>]+src=|<link[^>]+rel=["']stylesheet/i.test(contents)) {
    throw new Error(`${file} still contains an external script or stylesheet dependency.`);
  }
  if (/<script[^>]+type=["']module["']/i.test(contents)) {
    throw new Error(`${file} still uses a module script and may fail when opened from file://.`);
  }
};

verifyStandalone(html, 'dist/index.html');
if (createHash('sha256').update(html).digest('hex') !== createHash('sha256').update(shareable).digest('hex')) {
  throw new Error('The root shareable HTML file does not match dist/index.html.');
}

for (const artifact of portalArtifacts) {
  const contents = await readFile(resolve(artifact.file), 'utf8');
  verifyStandalone(contents, artifact.file);
  const body = contents.match(/<body\b[^>]*>/i)?.[0] ?? '';
  const modeMatches = body.match(/\bdata-portal-mode\s*=\s*["']([^"']+)["']/gi) ?? [];
  if (modeMatches.length !== 1 || !new RegExp(`data-portal-mode\\s*=\\s*["']${artifact.portalMode}["']`, 'i').test(body)) {
    throw new Error(`${artifact.file} does not pin portal mode ${artifact.portalMode}.`);
  }
}

console.log(`Verified the canonical standalone build and ${portalArtifacts.length + 1} root shareable artifacts (${Buffer.byteLength(html).toLocaleString()} canonical bytes).`);
