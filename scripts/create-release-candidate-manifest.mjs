import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { productionCandidateEvidence } from './production-authorization.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const sha256File = async (file) =>
  createHash('sha256').update(await readFile(path.join(repoRoot, file))).digest('hex');

export async function createReleaseCandidateManifest() {
  const packageMetadata = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  const candidate = await productionCandidateEvidence({ requireRepositoryReady: false });
  return {
    schemaVersion: 1,
    releaseVersion: packageMetadata.version,
    candidate,
    artifacts: {
      cloudflareHtmlSha256: await sha256File('dist/index.html'),
      shareableHtmlSha256: await sha256File('HAU-USC_Logistics-Prototype-Shareable.html'),
      appsScriptHtmlSha256: await sha256File('apps-script/AppScript.html'),
    },
  };
}

async function run() {
  const output = process.argv[2];
  if (!output) throw new Error('Usage: node scripts/create-release-candidate-manifest.mjs <output-path>');
  const resolved = path.resolve(repoRoot, output);
  const relative = path.relative(repoRoot, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error('The release manifest output must remain inside the repository workspace.');
  }
  await mkdir(path.dirname(resolved), { recursive: true });
  await writeFile(resolved, `${JSON.stringify(await createReleaseCandidateManifest(), null, 2)}\n`, {
    flag: 'wx',
  });
  console.log(`Release candidate manifest created for ${path.basename(resolved)}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
