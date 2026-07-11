import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const html = await readFile(resolve('dist/index.html'), 'utf8');
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

console.log(`Verified standalone dist/index.html (${html.length.toLocaleString()} bytes).`);
