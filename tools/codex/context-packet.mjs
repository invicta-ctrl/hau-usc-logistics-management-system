import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const sources = [
  ['CURRENT TASK', '.codex/CURRENT_TASK.md', 3600],
  ['CURRENT SLICE', '.plans/current-slice.md', 2800],
  ['PROGRAM STATUS', '.plans/AUTONOMOUS_PROGRAM_STATUS.md', 2800],
  ['CONTINUATION', 'docs/WORK_CONTINUATION.md', 2800],
];

export function truncateUtf8(text, maxBytes, marker) {
  const input = String(text);
  if (Buffer.byteLength(input, 'utf8') <= maxBytes) return input;
  const markerText = `\n${marker}\n`;
  const markerBytes = Buffer.byteLength(markerText, 'utf8');
  if (markerBytes >= maxBytes) throw new Error('truncation marker must fit inside the byte limit');

  const contentLimit = maxBytes - markerBytes;
  const prefixLimit = Math.floor(contentLimit * 0.7);
  const suffixLimit = contentLimit - prefixLimit;
  let prefix = '';
  let prefixBytes = 0;
  for (const character of input) {
    const characterBytes = Buffer.byteLength(character, 'utf8');
    if (prefixBytes + characterBytes > prefixLimit) break;
    prefix += character;
    prefixBytes += characterBytes;
  }
  if (!/\s$/u.test(prefix)) prefix = prefix.replace(/\S+$/u, '');

  let suffix = '';
  let suffixBytes = 0;
  for (const character of Array.from(input).reverse()) {
    const characterBytes = Buffer.byteLength(character, 'utf8');
    if (suffixBytes + characterBytes > suffixLimit) break;
    suffix = character + suffix;
    suffixBytes += characterBytes;
  }
  if (!/^\s/u.test(suffix)) suffix = suffix.replace(/^\S+\s*/u, '');
  return `${prefix.trimEnd()}${markerText}${suffix.trimStart()}`;
}

export function buildContextPacket(root = process.cwd()) {
  let packet = '';
  for (const [label, relative, maxBytes] of sources) {
    const file = path.join(root, relative);
    const raw = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : `[missing ${relative}]`;
    const content = truncateUtf8(raw, maxBytes, `[${relative} truncated; read the source for full content]`);
    packet += `## ${label}\n${content.trim()}\n\n`;
  }

  return truncateUtf8(packet, 12 * 1024, '[context packet truncated; read the source files]');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.stdout.write(buildContextPacket());
}
