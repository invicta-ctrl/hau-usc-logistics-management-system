import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const LOCAL_BRAND_ASSET_SOURCES = Object.freeze([
  {
    source: 'output/design/figma-make-source/src/assets/production/loginBackground.ts',
    key: 'brand/login-background',
  },
  {
    source: 'output/design/figma-make-source/src/assets/production/uscLogo.ts',
    key: 'brand/usc-logo',
  },
  {
    source: 'output/design/figma-make-source/src/assets/production/dolLogo.ts',
    key: 'brand/dol-logo',
  },
  {
    source: 'output/design/figma-make-source/src/assets/production/combinedLockup.ts',
    key: 'brand/combined-lockup',
  },
  {
    source: 'output/design/figma-make-source/src/assets/production/favicon.ts',
    key: 'brand/favicon',
  },
  {
    source: 'output/design/figma-make-source/src/assets/production/defaultItemImage.ts',
    key: 'brand/default-item-image',
  },
]);

const DATA_URI = /^data:([A-Za-z][A-Za-z0-9!#$&^_.+-]*\/[A-Za-z0-9!#$&^_.+-]+);base64,((?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?)$/u;
const DATA_URI_LITERAL = /(['"])(data:[^'"]*)\1/u;

export function parseBase64DataUri(value) {
  if (typeof value !== 'string') throw new TypeError('brand asset data URI must be a string');
  const match = DATA_URI.exec(value);
  if (!match || !match[2]) throw new Error('brand asset must be a non-empty base64 data URI');

  const bytes = Buffer.from(match[2], 'base64');
  if (!bytes.length) throw new Error('brand asset data URI decoded to no bytes');
  return { contentType: match[1], bytes };
}

export function extractDataUriLiteral(source) {
  if (typeof source !== 'string') throw new TypeError('brand asset source must be a string');
  const match = DATA_URI_LITERAL.exec(source);
  if (!match) throw new Error('brand asset source must contain one quoted data URI');
  return match[2];
}

export async function seedLocalBrandAssets({ repoRoot, state, privateRoot, wrangler }) {
  const outputDirectory = path.join(privateRoot, 'brand-assets');
  await mkdir(outputDirectory, { recursive: true });

  for (const { source, key } of LOCAL_BRAND_ASSET_SOURCES) {
    const dataUri = extractDataUriLiteral(await readFile(path.join(repoRoot, source), 'utf8'));
    const { contentType, bytes } = parseBase64DataUri(dataUri);
    const output = path.join(outputDirectory, path.basename(source, '.ts'));
    await writeFile(output, bytes);
    execFileSync(
      process.execPath,
      [
        wrangler,
        'r2',
        'object',
        'put',
        `hau-usc-logistics-local-assets/${key}`,
        '--local',
        '--persist-to',
        state,
        '--file',
        output,
        '--content-type',
        contentType,
      ],
      { cwd: repoRoot, stdio: ['ignore', 'inherit', 'inherit'], windowsHide: true },
    );
  }
}
