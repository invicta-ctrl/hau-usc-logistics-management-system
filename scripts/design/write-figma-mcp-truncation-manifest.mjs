import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '../..');
const mirrorRoot = join(root, 'output/design/figma-make-source');
const outputRoot = join(root, 'docs/frontend');
const reachable = new Map([
  ['src/app/PublicFlows.tsx', { disposition: 'recovered_from_verified_make_v39_mirror', active: 'src/frontend/app/PublicFlows.tsx', proof: 'Native prefix 22,746 bytes before marker and suffix 23,424 bytes after marker match the authorized current Make v39 mirror, except terminal newline.' }],
  ['src/app/RequestCenterRoute.tsx', { disposition: 'recovered_from_verified_make_v39_mirror', active: 'src/frontend/app/RequestCenterRoute.tsx', proof: 'Native prefix 21,611 bytes before marker and suffix 23,051 bytes after marker match the authorized current Make v39 mirror, except terminal newline.' }],
  ['src/assets/production/combinedLockup.ts', { disposition: 'replaced_by_accepted_backend_media_contract', active: 'src/frontend/assets/production/combinedLockup.ts', proof: 'Active module exports /brand/combined-lockup.' }],
  ['src/assets/production/currentProductionCover.ts', { disposition: 'deleted_and_replaced_by_public_advertisement_feed', active: null, proof: 'Current section fetches GET /api/public/advertisements and uses published imageUrl with altText.' }],
  ['src/assets/production/loginBackground.ts', { disposition: 'replaced_by_accepted_backend_media_contract', active: 'src/frontend/assets/production/loginBackground.ts', proof: 'Active module exports /brand/login-background.' }],
  ['src/assets/production/uscLogo.ts', { disposition: 'replaced_by_accepted_backend_media_contract', active: 'src/frontend/assets/production/uscLogo.ts', proof: 'Active module exports /brand/usc-logo.' }],
]);

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (await Promise.all(entries.map((entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]))).flat();
}

const hash = (value) => createHash('sha256').update(value).digest('hex');
const files = await walk(mirrorRoot);
const resources = [];
for (const path of files) {
  const bytes = await readFile(path);
  const text = bytes.toString('utf8');
  if (!/…\d+ tokens truncated…/u.test(text)) continue;
  const resource = relative(mirrorRoot, path).replaceAll('\\', '/');
  const recovery = reachable.get(resource);
  resources.push({ resource, sha256: hash(bytes), reachableFromProductionEntry: Boolean(recovery), ...(recovery ?? { disposition: 'preserved_incomplete_generated_or_reference_mirror_only', active: null, proof: 'Native MCP transport inserted a literal truncation marker; this generated/reference source is not runtime-reachable and is not copied into the active production graph.' }) });
}
resources.sort((a, b) => a.resource.localeCompare(b.resource));
if (resources.length !== 47 || resources.filter((entry) => entry.reachableFromProductionEntry).length !== 6) throw new Error(`Expected 47 truncated mirrors and 6 reachable files; found ${resources.length} and ${resources.filter((entry) => entry.reachableFromProductionEntry).length}.`);

await mkdir(outputRoot, { recursive: true });
await writeFile(join(outputRoot, 'FIGMA_MCP_TRUNCATION_MANIFEST.json'), `${JSON.stringify({ schemaVersion: 1, source: 'native-figma-mcp-make-v39', transportLimitation: 'Literal …N tokens truncated… markers are transport artifacts and not byte-complete source.', resourceCount: resources.length, reachableCount: 6, resources }, null, 2)}\n`);
