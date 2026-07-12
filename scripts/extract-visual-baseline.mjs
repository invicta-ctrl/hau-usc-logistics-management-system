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
  const normalizedRuntime = runtime.replace(/\r\n?/g, '\n');

  return normalizedRuntime
    .replace(
      "'use strict';",
      "import { appEnvironment, backendMode, createLegacyRuntimeAdapter } from '../services/legacy-runtime-adapter.js';\n  'use strict';",
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
      "  function renderAll(){\n    renderOverview();renderRequestSelectors();renderRequestDraft();renderLending();renderReleaseDesk();renderRestocking();renderProcurement();renderInventory();\n  }",
      "  function renderAll(){\n    if(document.body.classList.contains('request-mode')){renderRequestSelectors();renderRequestDraft();return;}renderOverview();renderRequestSelectors();renderRequestDraft();renderLending();renderReleaseDesk();renderRestocking();renderProcurement();renderInventory();\n  }",
    )
    .replace(
      "  function openDrawer(title,body){const d=byId('drawer');d.innerHTML=`<div class=\"drawer-head\"",
      "  let layerReturnFocus=null;\n  function openDrawer(title,body){layerReturnFocus=document.activeElement;const d=byId('drawer');d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','drawerTitle');d.innerHTML=`<div class=\"drawer-head\"",
    )
    .replace(
      "  function closeDrawer(){byId('drawerBackdrop').classList.remove('show')}",
      "  function closeDrawer(){const wasOpen=byId('drawerBackdrop').classList.contains('show');byId('drawerBackdrop').classList.remove('show');if(wasOpen){layerReturnFocus?.focus();layerReturnFocus=null;}}",
    )
    .replace(
      "  function openModal(title,body,onReady){const m=byId('modal');m.innerHTML=`<div class=\"modal-head\"",
      "  function openModal(title,body,onReady){layerReturnFocus=document.activeElement;const m=byId('modal');m.setAttribute('role','dialog');m.setAttribute('aria-modal','true');m.setAttribute('aria-labelledby','modalTitle');m.innerHTML=`<div class=\"modal-head\"",
    )
    .replace(
      "if(onReady)onReady(m);setTimeout(()=>m.querySelector('input,select,button')?.focus(),20)}\n  function closeModal(){byId('modalBackdrop').classList.remove('show')}",
      "if(onReady)onReady(m);m.onkeydown=e=>{if(e.key!=='Tab')return;const focusable=[...m.querySelectorAll('button,input,select,textarea,[href],[tabindex]:not([tabindex=\"-1\"])')].filter(x=>!x.disabled);if(!focusable.length)return;const first=focusable[0],last=focusable.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}};setTimeout(()=>m.querySelector('input,select,button')?.focus(),20)}\n  function closeModal(){const wasOpen=byId('modalBackdrop').classList.contains('show');byId('modalBackdrop').classList.remove('show');if(wasOpen){layerReturnFocus?.focus();layerReturnFocus=null;}}",
    )
    .replace(
      "function init(){\n    state=loadState();normalizeStateRecords();\n    const requestOnly=new URLSearchParams(location.search).get('request')==='1';if(requestOnly){document.body.classList.add('request-mode');ui.view='request';}\n    populateStaticOptions();bindGlobalEvents();setupUploaders();renderAll();byId('loading').classList.add('hidden');\n  }",
      "function sanitizeRequestOnlyState(source){const copy=typeof structuredClone==='function'?structuredClone(source):JSON.parse(JSON.stringify(source));copy.inventoryItems=copy.inventoryItems.map(item=>({...item,openingOnHand:Math.max(0,Number(item.openingOnHand||0)+copy.ledgerTransactions.filter(tx=>tx.itemId===item.id).reduce((sum,tx)=>sum+(tx.direction==='IN'?1:-1)*Number(tx.quantity||0),0)-copy.reservations.filter(r=>r.itemId===item.id&&r.status==='ACTIVE').reduce((sum,r)=>sum+Number(r.quantity||0),0))}));['requests','requestLines','reservations','ledgerTransactions','restockRequests','restockRecords','lendingTickets','releaseConfirmations','deliverables','canvassReferences','evidenceFiles','statusHistory','auditLog','roadmapMilestones'].forEach(name=>copy[name]=[]);return copy;}\n  async function init(){\n    const requestOnly=document.body.dataset.requestOnly==='true'||new URLSearchParams(location.search).get('request')==='1';\n    try{state=backendMode==='mock'?loadState():await services.loadBootstrapData({requestOnly});if(requestOnly&&backendMode==='mock')state=sanitizeRequestOnlyState(state);}catch(error){byId('loading').classList.add('hidden');toast(`${error.message||'Backend unavailable'}${error.correlationId?` · ${error.correlationId}`:''}`,true);return;}\n    normalizeStateRecords();if(requestOnly){document.body.classList.add('request-mode');ui.view='request';}\n    if(backendMode!=='mock'){const environment=String(appEnvironment||'').trim().toLowerCase();const safeEnvironment=environment==='staging'||environment==='production'?environment:'unknown';const label=`● Apps Script · ${safeEnvironment}`;const internalBadge=document.querySelector('.app-header .preview-badge');if(internalBadge)internalBadge.textContent=label;const portalBadge=document.querySelector('.portal-header .preview-badge');if(portalBadge)portalBadge.textContent=label;const reset=byId('resetDemo');if(reset){reset.hidden=true;reset.disabled=true;reset.tabIndex=-1;reset.setAttribute('aria-hidden','true');}const foot=document.querySelector('.sidebar-foot');if(foot)foot.innerHTML=`<strong><span class=\"live-dot\"></span>Apps Script ${safeEnvironment}</strong>Server authorization, Sheets repositories, and audit logging are active.`;}\n    populateStaticOptions();bindGlobalEvents();setupUploaders();renderAll();byId('loading').classList.add('hidden');\n  }",
    )
    .replace(
      "}}const atp=availableToPromise(item.id);",
      "}}if(state.catalogAvailabilityProtected||item.availabilityProtected)return{type:'review',message:'Exact stock balances are protected. DOL review will verify availability and apply the full, partial, or procurement route before any reservation.',parts:[{quantity:requested,itemId:item.id,fulfillmentSource:'PENDING_REVIEW',proposedStatus:'FOR_REVIEW'}]};const atp=availableToPromise(item.id);",
    )
    .replace(
      "d.type==='partial'?'Split: Stock + Canvassing':'For Canvassing'",
      "d.type==='partial'?'Split: Stock + Canvassing':d.type==='review'?'Pending DOL Stock Review':'For Canvassing'",
    )
    .replace(
      "l.fulfillmentSource==='ISSUE_FROM_STOCK'?'Issue from Stock':'For Canvassing'",
      "l.fulfillmentSource==='ISSUE_FROM_STOCK'?'Issue from Stock':l.fulfillmentSource==='PENDING_REVIEW'?'Pending DOL Stock Review':'For Canvassing'",
    )
    .replace(
      "||'<div class=\"empty\">No requested items yet. Selecting a catalog item will show its live available-to-promise quantity.</div>';const stock=",
      "||`<div class=\"empty\">No requested items yet. ${state.catalogAvailabilityProtected?'Exact stock balances remain internal and routing is confirmed during DOL review.':'Selecting a catalog item will show its live available-to-promise quantity.'}</div>`;const stock=",
    )
    .replace(
      "const stock=ui.requestDraftLines.filter(l=>l.fulfillmentSource==='ISSUE_FROM_STOCK').length,proc=ui.requestDraftLines.length-stock;",
      "const stock=ui.requestDraftLines.filter(l=>l.fulfillmentSource==='ISSUE_FROM_STOCK').length,pending=ui.requestDraftLines.filter(l=>l.fulfillmentSource==='PENDING_REVIEW').length,proc=ui.requestDraftLines.length-stock-pending;",
    )
    .replace(
      "${stock} stock-routed \u00B7 ${proc} canvassing/procurement-routed. Submission",
      "${stock} stock-routed \u00B7 ${proc} canvassing/procurement-routed${pending?` \u00B7 ${pending} pending DOL routing`:''}. Submission",
    )
    .replace(
      "openDrawer('Request submitted',`<div class=\"mode-note\"><strong>${esc(rec.id)}</strong><br>${esc(rec.displayName)}<br>Status: ${esc(statusLabel(rec.status))}</div><p class=\"small muted\" style=\"margin-top:14px\">The request is saved in local preview state. No stock was reduced and no Google Sheet was changed.</p>`)",
      "const storageNote=backendMode==='mock'?'The request is saved in local preview state. No stock was reduced and no Google Sheet was changed.':'The request was recorded for DOL review. Submission did not reduce physical stock.';openDrawer('Request submitted',`<div class=\"mode-note\"><strong>${esc(rec.id)}</strong><br>${esc(rec.displayName)}<br>Status: ${esc(statusLabel(rec.status))}</div><p class=\"small muted\" style=\"margin-top:14px\">${storageNote}</p>`)",
    )
    .replace(
      "normalizeStateRecords();if(requestOnly){document.body.classList.add('request-mode');ui.view='request';}",
      "normalizeStateRecords();if(requestOnly){document.body.classList.add('request-mode');ui.view='request';document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id==='request'));}",
    )
    .replace(
      "byId('resetDemo').addEventListener('click',resetDemoData);",
      "if(backendMode==='mock')byId('resetDemo').addEventListener('click',resetDemoData);",
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
