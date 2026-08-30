import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateNormalApplicationArtifact } from './build-artifact-lib.mjs';
import { productionCandidateEvidence } from './production-authorization.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

export async function createReleaseCandidateManifest() {
  const packageMetadata = JSON.parse(await readFile(path.join(repoRoot, 'package.json'), 'utf8'));
  const [candidate, canonicalApplication] = await Promise.all([
    productionCandidateEvidence({ requireRepositoryReady: false }),
    validateNormalApplicationArtifact(path.join(repoRoot, 'dist')),
  ]);
  if (candidate.distSha256 !== canonicalApplication.entryHtmlSha256) {
    throw new Error('Candidate identity and canonical application entry hashes do not match.');
  }
  return {
    schemaVersion: 2,
    releaseVersion: packageMetadata.version,
    candidate,
    artifacts: { canonicalApplication },
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
