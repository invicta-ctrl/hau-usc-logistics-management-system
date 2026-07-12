import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = await readFile(resolve('dist/index.html'), 'utf8');
const runtimeConfiguration =
  '<script>globalThis.__HAU_RUNTIME_CONFIG__={backendMode:"apps-script",appEnvironment:"STAGING"};</script>';

function requireMatch(value, pattern, label) {
  const match = value.match(pattern);
  if (!match) throw new Error(`Could not locate ${label} in dist/index.html.`);
  return match;
}

function stripContainerTag(block, tagName) {
  return block
    .replace(new RegExp(`^<${tagName}\\b[^>]*>`, 'i'), '')
    .replace(new RegExp(`</${tagName}>\\s*$`, 'i'), '');
}

const htmlOpen = requireMatch(source, /<html\b[^>]*>/i, 'the html element')[0];
const headOpen = requireMatch(source, /<head\b[^>]*>/i, 'the head element');
const headCloseIndex = source.search(/<\/head>/i);
const bodyOpen = requireMatch(source, /<body\b[^>]*>/i, 'the body element');
const bodyCloseIndex = source.search(/<\/body>/i);

if (headCloseIndex < headOpen.index || bodyCloseIndex < bodyOpen.index) {
  throw new Error('dist/index.html has an invalid document structure.');
}

const headInner = source.slice(headOpen.index + headOpen[0].length, headCloseIndex);
const bodyInner = source.slice(bodyOpen.index + bodyOpen[0].length, bodyCloseIndex);
const stylePattern = /<style\b[^>]*>[\s\S]*?<\/style>/gi;
const scriptPattern = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const styleBlocks = [...headInner.matchAll(stylePattern), ...bodyInner.matchAll(stylePattern)].map(
  (match) => match[0],
);
const scriptBlocks = [...headInner.matchAll(scriptPattern), ...bodyInner.matchAll(scriptPattern)].map(
  (match) => match[0],
);
const styles = styleBlocks.map((block) => stripContainerTag(block, 'style')).join('\n');
const scripts = scriptBlocks.map((block) => stripContainerTag(block, 'script')).join('\n;\n');
const headShell = headInner.replace(stylePattern, '').replace(scriptPattern, '').trim();
const body = bodyInner.replace(stylePattern, '').replace(scriptPattern, '').trim();

if (!styles.includes('.app-shell')) throw new Error('Apps Script styles are missing the application shell.');
if (!body.includes('id="loading"') || !body.includes('id="primaryNav"')) {
  throw new Error('Apps Script body is missing required application markup.');
}
if (!scripts.includes('DOMContentLoaded')) {
  throw new Error('Apps Script bundle is missing the application bootstrap script.');
}

// Vite can rename init during minification. Capture whichever identifier is registered for
// DOMContentLoaded, then invoke that function directly because this script sits after the body.
const bootstrapPattern = /document\.addEventListener\((['"])DOMContentLoaded\1,\s*([A-Za-z_$][\w$]*)\);/;
const bootstrapMatch = scripts.match(bootstrapPattern);
if (!bootstrapMatch) {
  throw new Error('Could not locate the application DOMContentLoaded bootstrap for Apps Script hardening.');
}
const initIdentifier = bootstrapMatch[2];
const appsScriptScripts = scripts.replace(bootstrapPattern, `setTimeout(${initIdentifier},0);`);

const index = `<!doctype html>\n${htmlOpen}\n  ${headOpen[0]}\n    ${headShell}\n    ${runtimeConfiguration}\n    <style>\n<?!= include_('AppStyles'); ?>\n    </style>\n  </head>\n  ${bodyOpen[0]}\n    <?!= include_('AppBody'); ?>\n    <script>\n      globalThis.__HAU_APP_SCRIPT_LOADED__ = true;\n<?!= include_('AppScript'); ?>\n    </script>\n  </body>\n</html>\n`;
const appStyles = `${styles.trim()}\n`;
const appBody = `${body}\n`;
const appScript = `${appsScriptScripts.trim()}\n`;

await mkdir(resolve('apps-script'), { recursive: true });
await Promise.all([
  writeFile(resolve('apps-script/Index.html'), index),
  writeFile(resolve('apps-script/AppStyles.html'), appStyles),
  writeFile(resolve('apps-script/AppBody.html'), appBody),
  writeFile(resolve('apps-script/AppScript.html'), appScript),
]);

console.log(
  `Created split Apps Script bundle (${index.length.toLocaleString()} shell, ${appBody.length.toLocaleString()} body, ${appStyles.length.toLocaleString()} styles, ${appScript.length.toLocaleString()} script bytes).`,
);
