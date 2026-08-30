import { createHash } from 'node:crypto';
import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const MAX_DEPLOY_ASSET_BYTES = 20_000_000;
const MAX_ENTRY_HTML_BYTES = 100_000;

function sha256(body) {
  return createHash('sha256').update(body).digest('hex');
}

async function filesUnder(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolute = path.join(directory, entry.name);
    if (entry.isSymbolicLink()) {
      throw new Error(`Build artifacts cannot contain symbolic links: ${absolute}`);
    }
    if (entry.isDirectory()) files.push(...(await filesUnder(absolute)));
    else if (entry.isFile()) files.push(absolute);
  }
  return files;
}

export async function createBuildArtifactManifest(directory) {
  const root = path.resolve(directory);
  const files = await filesUnder(root);
  const entries = [];
  for (const file of files.sort()) {
    const fileStat = await lstat(file);
    if (!fileStat.isFile()) throw new Error(`Unexpected build artifact entry: ${file}`);
    const body = await readFile(file);
    entries.push({
      path: path.relative(root, file).replaceAll('\\', '/'),
      bytes: body.byteLength,
      sha256: sha256(body),
    });
  }
  const manifestSha256 = sha256(`${JSON.stringify(entries)}\n`);
  return {
    fileCount: entries.length,
    totalBytes: entries.reduce((total, entry) => total + entry.bytes, 0),
    manifestSha256,
    files: entries,
  };
}

function tagAttribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}=["']([^"']+)["']`, 'iu'))?.[1] ?? null;
}

function localArtifactPath(reference) {
  if (!reference.startsWith('/') || reference.startsWith('//')) {
    throw new Error(`Application entry assets must be root-relative for SPA deep links: ${reference}`);
  }
  const pathname = new URL(reference, 'https://artifact.invalid').pathname;
  const decoded = decodeURIComponent(pathname).replace(/^\/+/, '');
  if (!decoded || decoded.split('/').includes('..')) {
    throw new Error(`Invalid application artifact reference: ${reference}`);
  }
  return decoded;
}

export async function validateNormalApplicationArtifact(directory) {
  const root = path.resolve(directory);
  const indexPath = path.join(root, 'index.html');
  const htmlBody = await readFile(indexPath);
  const html = htmlBody.toString('utf8');
  const manifest = await createBuildArtifactManifest(root);
  const paths = new Set(manifest.files.map((entry) => entry.path));

  if (!html.includes('<div id="app"></div>') || !html.includes('HAU-USC Logistics')) {
    throw new Error('The build entry is not the canonical HAU-USC React application.');
  }
  if (htmlBody.byteLength > MAX_ENTRY_HTML_BYTES) {
    throw new Error(
      `The build entry is ${htmlBody.byteLength} bytes; refusing a historical inlined/single-file artifact.`,
    );
  }

  const tags = [...html.matchAll(/<(?:script|link)\b[^>]*>/giu)].map((match) => match[0]);
  const moduleScripts = tags.filter(
    (tag) => /^<script\b/iu.test(tag) && tagAttribute(tag, 'type') === 'module' && tagAttribute(tag, 'src'),
  );
  const stylesheets = tags.filter(
    (tag) => /^<link\b/iu.test(tag) && tagAttribute(tag, 'rel') === 'stylesheet' && tagAttribute(tag, 'href'),
  );
  const inlineScripts = tags.filter((tag) => /^<script\b/iu.test(tag) && !tagAttribute(tag, 'src'));

  if (moduleScripts.length !== 1) {
    throw new Error(`Expected one external module entry; found ${moduleScripts.length}.`);
  }
  if (stylesheets.length < 1) throw new Error('Expected at least one external stylesheet.');
  if (inlineScripts.length > 0 || /<style\b/iu.test(html)) {
    throw new Error('The canonical application entry must not inline executable JavaScript or CSS.');
  }

  const directReferences = [
    ...moduleScripts.map((tag) => tagAttribute(tag, 'src')),
    ...stylesheets.map((tag) => tagAttribute(tag, 'href')),
  ];
  for (const reference of directReferences) {
    const artifactPath = localArtifactPath(reference);
    if (!paths.has(artifactPath)) {
      throw new Error(`The application entry references a missing artifact: ${reference}`);
    }
    if (!/^assets\/.+-[A-Za-z0-9_-]{8,}\.(?:css|js)$/u.test(artifactPath)) {
      throw new Error(`The application entry must reference content-hashed CSS/JS assets: ${reference}`);
    }
  }

  const emittedJavaScript = manifest.files.filter((entry) => entry.path.endsWith('.js'));
  const emittedCss = manifest.files.filter((entry) => entry.path.endsWith('.css'));
  if (emittedJavaScript.length < 1 || emittedCss.length < 1) {
    throw new Error('The canonical application build must emit external JavaScript and CSS.');
  }
  const oversized = manifest.files.filter((entry) => entry.bytes > MAX_DEPLOY_ASSET_BYTES);
  if (oversized.length > 0) {
    throw new Error(
      `Build assets exceed the ${MAX_DEPLOY_ASSET_BYTES}-byte deployment budget: ${oversized
        .map((entry) => entry.path)
        .join(', ')}`,
    );
  }

  return {
    ...manifest,
    entryHtmlBytes: htmlBody.byteLength,
    entryHtmlSha256: sha256(htmlBody),
    directAssetRequests: directReferences.length,
    emittedJavaScriptFiles: emittedJavaScript.length,
    emittedCssFiles: emittedCss.length,
  };
}
