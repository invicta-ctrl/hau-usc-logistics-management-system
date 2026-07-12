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
function bridgeRuntime(runtime) {
  return runtime
    .replace(
      "'use strict';",
      "import { backendMode, createLegacyRuntimeAdapter } from '../services/legacy-runtime-adapter.js';\n  'use strict';",
    )
    .replace(
      "function persist(){ state.updatedAt=isoNow(); try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){toast('Preview changes could not be saved locally. Storage may be full.',true);} }",
      "function persist(){ state.updatedAt=isoNow(); if(backendMode!=='mock')return; try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}catch(e){toast('Preview changes could not be saved locally. Storage may be full.',true);} }",
    )
    .replace(
      "function commit(message,type='success'){ persist(); renderAll(); if(message)toast(message,type==='error'); }",
      "async function commit(message,type='success'){ persist(); if(backendMode!=='mock'){try{state=await services.loadBootstrapData({requestOnly:document.body.classList.contains('request-mode')});normalizeStateRecords();}catch(error){toast(`${error.message}${error.correlationId?` · ${error.correlationId}`:''}`,true);return;}}renderAll();if(message)toast(message,type==='error'); }",
    )
    .replace(
      "function resetDemoData(){ if(!confirm('Reset all local preview changes and restore the original demo scenarios?'))return;",
      "function resetDemoData(){ if(backendMode!=='mock'){toast('Reset Demo Data is available only in local preview mode.',true);return;}if(!confirm('Reset all local preview changes and restore the original demo scenarios?'))return;",
    )
    .replace(
      '<label class="span-2">Condition / expiry notes<textarea name="notes"></textarea></label>',
      '<label class="span-2">Merge reason / condition notes<textarea name="notes" required></textarea></label><label class="span-2 checkbox"><input name="semanticConfirmed" type="checkbox" value="true" required> I confirm the destination is the same material, category, handling, and unit.</label>',
    )
    .replace(
      '<label>Destination<select name="destinationArea"><option value="Inventory">Inventory</option><option value="Pantry">Pantry</option></select></label><label>Unit<input name="unit"',
      '<label>Destination<select name="destinationArea"><option value="Inventory">Inventory</option><option value="Pantry">Pantry</option></select></label><label>Handling<select name="handling" required><option value="Consumable">Consumable</option><option value="Loanable">Loanable</option><option value="Reusable Asset">Reusable asset</option></select></label><label>Unit<input name="unit"',
    )
    .replace(
      "  async function performDeliverableAction(d,line,action){try{\n    if(action==='MATCH')",
      "  async function performDeliverableAction(d,line,action){try{\n    if(backendMode!=='mock'&&!['MATCH','RECEIVE'].includes(action)){if(action==='ACCEPT'||action==='SPLIT')await services.reviewRequest(d.requestId,'ACCEPT','Accepted from Deliverables queue');else if(action==='REJECT')await services.reviewRequest(d.requestId,'REJECT','Rejected from Deliverables queue');else await services.transitionDeliverable({deliverableId:d.id,status:action,note:`Moved to ${statusLabel(action)}`});closeModal();await commit(`${d.id} updated.`);return;}if(backendMode!=='mock'&&action==='MATCH')return toast('Inventory matching is applied server-side during request review.',true);\n    if(action==='MATCH')",
    )
    .replace(
      "  function selectPreferredCanvass(lineId,canId){const d=deliverableForLine(lineId);",
      "  async function selectPreferredCanvass(lineId,canId){if(backendMode!=='mock'){try{await services.selectPreferredCanvass({canvassId:canId,rationale:'Selected in the quote comparison view'});await commit(`Preferred quote ${canId} selected.`);}catch(error){toast(error.message,true);}return;}const d=deliverableForLine(lineId);",
    )
    .replace('const services={', 'const mockServices={')
    .replace(
      '  async function mockUpload(file,meta)',
      '  const services=createLegacyRuntimeAdapter(mockServices);\n  async function mockUpload(file,meta)',
    )
    .replace(
      "function init(){\n    state=loadState();normalizeStateRecords();\n    const requestOnly=new URLSearchParams(location.search).get('request')==='1';if(requestOnly){document.body.classList.add('request-mode');ui.view='request';}\n    populateStaticOptions();bindGlobalEvents();setupUploaders();renderAll();byId('loading').classList.add('hidden');\n  }",
      "async function init(){\n    const requestOnly=new URLSearchParams(location.search).get('request')==='1';\n    try{state=backendMode==='mock'?loadState():await services.loadBootstrapData({requestOnly});}catch(error){byId('loading').classList.add('hidden');toast(`${error.message||'Backend unavailable'}${error.correlationId?` · ${error.correlationId}`:''}`,true);return;}\n    normalizeStateRecords();if(requestOnly){document.body.classList.add('request-mode');ui.view='request';}\n    if(backendMode!=='mock'){const badge=document.querySelector('.preview-badge');if(badge)badge.textContent='● Apps Script · staging';const foot=document.querySelector('.sidebar-foot');if(foot)foot.innerHTML='<strong><span class=\"live-dot\"></span>Apps Script staging</strong>Server authorization, Sheets repositories, and audit logging are active.';}\n    populateStaticOptions();bindGlobalEvents();setupUploaders();renderAll();byId('loading').classList.add('hidden');\n  }",
    );
}
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
  ['src/visual/runtime.js', bridgeRuntime(scriptMatch[1]).trim() + '\n'],
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
