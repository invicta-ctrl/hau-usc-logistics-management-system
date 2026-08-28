import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';

const MAX_ASSET_BYTES = 25_000_000;
const HERO_BASENAME = 'hausc-institutional-logistics-hero.mp4';
const projectRoot = resolve(import.meta.dirname, '..');
const buildRoot = resolve(projectRoot, process.argv[2] ?? '.wrangler/build/staging');
const sourcePath = join(projectRoot, 'src', 'frontend', 'assets', 'hero', HERO_BASENAME);
const indexPath = join(buildRoot, 'index.html');
const heroBuildDirectory = join(buildRoot, 'hero');

const fail = (message) => {
  throw new Error(`Cloudflare hero media verification failed: ${message}`);
};
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const partPattern = new RegExp(`^${HERO_BASENAME.replaceAll('.', '\\.') }\\.part(\\d+)$`);
const partNames = readdirSync(heroBuildDirectory)
  .map((name) => ({ name, match: name.match(partPattern) }))
  .filter(({ match }) => match)
  .sort((left, right) => Number(left.match[1]) - Number(right.match[1]))
  .map(({ name }) => name);

if (partNames.length < 2) fail(`expected at least two media parts, found ${partNames.length}.`);
const parts = partNames.map((name) => {
  const path = join(heroBuildDirectory, name);
  const size = statSync(path).size;
  if (size > MAX_ASSET_BYTES) fail(`${name} is ${size} bytes, above the ${MAX_ASSET_BYTES}-byte limit.`);
  return readFileSync(path);
});

const source = readFileSync(sourcePath);
const reconstructed = Buffer.concat(parts);
if (reconstructed.length !== source.length || sha256(reconstructed) !== sha256(source)) {
  fail('the emitted parts do not reconstruct the accepted source media byte-for-byte.');
}

const index = readFileSync(indexPath, 'utf8');
if (Buffer.byteLength(index) > MAX_ASSET_BYTES) fail('index.html exceeds the Cloudflare per-asset limit.');
for (const partName of partNames) {
  if (!index.includes(`hero/${partName}`)) fail(`index.html does not reference hero/${partName}.`);
}

console.log(
  JSON.stringify({
    message: 'Verified byte-identical chunked hero media for Cloudflare.',
    sourceBytes: source.length,
    parts: parts.map((part) => part.length),
    sourceSha256: sha256(source),
    indexBytes: Buffer.byteLength(index),
  }),
);
