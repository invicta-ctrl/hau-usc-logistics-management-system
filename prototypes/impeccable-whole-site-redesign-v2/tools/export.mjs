/* Export the modular preview into one shareable HTML file.
   The modular source under src/ and styles/ stays authoritative; this only
   inlines it so the result opens from the filesystem without a server
   (browsers refuse ES modules over file://).

   Usage, from the repository root:
     node prototypes/impeccable-whole-site-redesign/tools/export.mjs

   No dependencies. Makes no network request. */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join, posix, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const previewRoot = resolve(here, '..');
const repoRoot = resolve(previewRoot, '..', '..');

const STYLES = [
  'styles/tokens.css',
  'styles/base.css',
  'styles/shell.css',
  'styles/components.css',
  'styles/surfaces.css',
  'styles/responsive.css',
];

const ENTRY = 'src/app.js';

/* ---------- module graph ---------- */

const modules = new Map();

function moduleKey(fromKey, spec) {
  return posix.normalize(posix.join(posix.dirname(fromKey), spec));
}

function collect(key) {
  if (modules.has(key)) return;
  const source = readFileSync(join(previewRoot, key), 'utf8');
  const deps = [];

  let code = source
    // import * as ns from './x.js'
    .replace(/^import\s+\*\s+as\s+(\w+)\s+from\s+'([^']+)';?$/gm, (_m, ns, spec) => {
      const dep = moduleKey(key, spec);
      deps.push(dep);
      return `const ${ns} = __req(${JSON.stringify(dep)});`;
    })
    // import { a, b } from './x.js'
    .replace(/^import\s+\{([^}]+)\}\s+from\s+'([^']+)';?$/gm, (_m, names, spec) => {
      const dep = moduleKey(key, spec);
      deps.push(dep);
      return `const {${names.replace(/\s+as\s+/g, ': ')}} = __req(${JSON.stringify(dep)});`;
    });

  // Collect exported binding names, then strip the `export` keyword.
  const exported = new Set();
  for (const m of code.matchAll(/^export\s+(?:async\s+)?(?:function|const|let|class)\s+(\w+)/gm)) {
    exported.add(m[1]);
  }
  code = code.replace(/^export\s+(?=(?:async\s+)?(?:function|const|let|class)\s)/gm, '');

  if (/^export\s+default/m.test(code)) {
    throw new Error(`Default exports are not supported by this exporter: ${key}`);
  }

  modules.set(key, {
    code,
    exports: [...exported],
  });

  for (const dep of deps) collect(dep);
}

collect(ENTRY);

const registry = [...modules.entries()]
  .map(
    ([key, mod]) => `__mods[${JSON.stringify(key)}] = function (module, __req) {
${mod.code}
module.exports = { ${mod.exports.join(', ')} };
};`,
  )
  .join('\n\n');

const runtime = `(function () {
  var __mods = {};
  var __cache = {};
  function __req(id) {
    if (__cache[id]) return __cache[id].exports;
    var module = { exports: {} };
    __cache[id] = module;
    __mods[id](module, __req);
    return module.exports;
  }

${registry}

  __req(${JSON.stringify(ENTRY)});
})();`;

/* ---------- assemble ---------- */

const css = STYLES.map(
  (file) => `/* ===== ${file} ===== */\n${readFileSync(join(previewRoot, file), 'utf8')}`,
).join('\n\n');

const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#610b0f" />
    <meta name="robots" content="noindex, nofollow" />
    <title>HAU-USC Logistics · Whole-site redesign preview</title>
    <!--
      Generated export. Do not edit.
      Authoritative source: prototypes/impeccable-whole-site-redesign-v2/
      Regenerate: node prototypes/impeccable-whole-site-redesign-v2/tools/export.mjs
      Non-production design preview. No live service is contacted.
      All data shown is illustrative and sanitized.
    -->
    <style>
${css}
    </style>
  </head>
  <body data-theme="light">
    <a class="skip-link" href="#surface-main">Skip to main content</a>
    <div id="app"></div>
    <noscript>
      <p style="padding: 24px">
        This design preview needs JavaScript to switch between surfaces. It makes no
        network requests.
      </p>
    </noscript>
    <script>
${runtime}
    </script>
  </body>
</html>
`;

const outDir = join(repoRoot, 'output', 'design');
mkdirSync(outDir, { recursive: true });
const outFile = join(outDir, 'HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v2.html');
writeFileSync(outFile, html, 'utf8');

console.log(`Modules inlined : ${modules.size}`);
console.log(`Stylesheets     : ${STYLES.length}`);
console.log(`Bytes           : ${Buffer.byteLength(html, 'utf8')}`);
console.log(`Written         : ${outFile}`);
