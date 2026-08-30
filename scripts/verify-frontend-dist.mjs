import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateNormalApplicationArtifact } from './build-artifact-lib.mjs';

const artifactDirectory = resolve('dist');
const html = await readFile(resolve(artifactDirectory, 'index.html'), 'utf8');
if (/name=["']hau-deploy-target["']/iu.test(html)) {
  throw new Error('The canonical application build must not carry a staging or Production deploy marker.');
}

const report = await validateNormalApplicationArtifact(artifactDirectory);
console.log(
  `Verified normal application artifact: ${report.fileCount} files, ${report.totalBytes.toLocaleString()} bytes, ` +
    `${report.directAssetRequests} direct assets, manifest sha256 ${report.manifestSha256.slice(0, 16)}...`,
);
