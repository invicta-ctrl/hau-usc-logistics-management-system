import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const html = await readFile(resolve('dist/index.html'), 'utf8');
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
if (/<script[^>]+src=|<link[^>]+rel=["']stylesheet/i.test(html)) {
  throw new Error('dist/index.html still contains an external script or stylesheet dependency.');
}
if (/<script[^>]+type=["']module["']/i.test(html)) {
  throw new Error('dist/index.html still uses a module script and may fail when opened from file://.');
}
if (createHash('sha256').update(html).digest('hex') !== createHash('sha256').update(shareable).digest('hex')) {
  throw new Error('The root shareable HTML file does not match dist/index.html.');
}

console.log(`Verified both standalone HTML artifacts (${html.length.toLocaleString()} bytes each).`);
