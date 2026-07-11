import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = resolve(
  repositoryRoot,
  process.argv[2] || 'legacy/HAU-USC_Logistics-Prototype.original.html',
);
const source = await readFile(baselinePath, 'utf8');

const styleMatch = source.match(/<style>([\s\S]*?)<\/style>/i);
const bodyMatch = source.match(/<body>([\s\S]*?)<\/body>/i);
if (!styleMatch || !bodyMatch) {
  throw new Error('The authoritative prototype is missing its style or body element.');
}

const body = bodyMatch[1];
const scriptMatch = body.match(/\s*<script>([\s\S]*?)<\/script>\s*$/i);
if (!scriptMatch) {
  throw new Error('The authoritative prototype is missing its inline runtime.');
}

const markup = body.slice(0, scriptMatch.index);
const viewIds = [
  'overview',
  'request',
  'lending',
  'release',
  'restocking',
  'procurement',
  'inventory',
];

function findBalancedSection(html, id) {
  const startPattern = new RegExp(`<section\\b[^>]*\\bid=["']${id}["'][^>]*>`, 'i');
  const match = startPattern.exec(html);
  if (!match) throw new Error(`Missing authoritative view: ${id}`);

  const tokenPattern = /<section\b[^>]*>|<\/section>/gi;
  tokenPattern.lastIndex = match.index;
  let depth = 0;
  let token;
  while ((token = tokenPattern.exec(html))) {
    depth += token[0].startsWith('</') ? -1 : 1;
    if (depth === 0) {
      return { start: match.index, end: tokenPattern.lastIndex, html: html.slice(match.index, tokenPattern.lastIndex) };
    }
  }
  throw new Error(`Unclosed authoritative view: ${id}`);
}

const views = viewIds.map((id) => ({ id, ...findBalancedSection(markup, id) }));
const firstView = views[0];
const lastView = views.at(-1);
const generatedNotice = '<!-- Generated from legacy/HAU-USC_Logistics-Prototype.original.html. Do not hand-edit. -->\n';

const css = styleMatch[1].trim();
const cssModules = [
  ['tokens-base', ':root{'],
  ['shell', '.app-shell{'],
  ['components', '.panel,.card{'],
  ['overview', '.hero{'],
  ['forms', 'form{display:grid'],
  ['tables', '.table-wrap{'],
  ['overlays', '.drawer-backdrop,.modal-backdrop{'],
  ['responsive', '@media(max-width:1180px)'],
].map(([name, marker]) => ({ name, start: css.indexOf(marker) }));

if (cssModules.some(({ start }) => start < 0)) {
  throw new Error('The authoritative stylesheet no longer matches the documented module boundaries.');
}

for (let index = 0; index < cssModules.length; index += 1) {
  cssModules[index].end = cssModules[index + 1]?.start ?? css.length;
}

const outputs = new Map([
  ['src/visual/shell-before.html', generatedNotice + markup.slice(0, firstView.start)],
  ['src/visual/shell-after.html', generatedNotice + markup.slice(lastView.end)],
  ['src/visual/runtime.js', scriptMatch[1].trim() + '\n'],
  ...cssModules.map(({ name, start, end }) => [
    `src/styles/visual/${name}.css`,
    css.slice(start, end).trim() + '\n',
  ]),
  ...views.map(({ id, html }) => [`src/visual/views/${id}.html`, generatedNotice + html + '\n']),
]);

for (const [relativePath, content] of outputs) {
  const outputPath = resolve(repositoryRoot, relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content);
}

console.log(`Extracted ${views.length} views, authoritative CSS, and runtime from ${baselinePath}`);
