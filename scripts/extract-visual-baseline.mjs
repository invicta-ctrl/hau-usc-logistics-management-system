import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const baselinePath = resolve(
  repositoryRoot,
  process.argv[2] || 'legacy/HAU-USC_Logistics-Prototype.original.html',
);
const source = (await readFile(baselinePath, 'utf8')).replace(/\r\n?/g, '\n');

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
const p0StartupBridge = String.raw`function sanitizeRequestOnlyState(source){const copy=typeof structuredClone==='function'?structuredClone(source):JSON.parse(JSON.stringify(source));copy.inventoryItems=copy.inventoryItems.map(item=>{const safe={...item,openingOnHand:Math.max(0,Number(item.openingOnHand||0)+copy.ledgerTransactions.filter(tx=>tx.itemId===item.id).reduce((sum,tx)=>sum+(tx.direction==='IN'?1:-1)*Number(tx.quantity||0),0)-copy.reservations.filter(r=>r.itemId===item.id&&r.status==='ACTIVE').reduce((sum,r)=>sum+Number(r.quantity||0),0))};['lendingAudience','maximumLoanQuantity','defaultLoanDays','approvalRequired','reorderThreshold','storageLocation','notes','verificationNote','legacy'].forEach(name=>delete safe[name]);return safe;});['requests','requestLines','reservations','ledgerTransactions','restockRequests','restockRecords','lendingTickets','releaseConfirmations','deliverables','canvassReferences','evidenceFiles','statusHistory','auditLog','roadmapMilestones'].forEach(name=>copy[name]=[]);return copy;}
  function startupTestHook(stage){if(globalThis.__HAU_BOOTSTRAP_TEST_MODE__===true&&typeof globalThis.__HAU_BOOTSTRAP_STAGE_HOOK__==='function')globalThis.__HAU_BOOTSTRAP_STAGE_HOOK__(stage);}
  function applyAppsScriptEnvironmentLabel(){if(backendMode!=='mock'){const environment=String(appEnvironment||'').trim().toLowerCase();const safeEnvironment=environment==='staging'||environment==='production'?environment:'unknown';const label='â— Apps Script Â· '+safeEnvironment;const internalBadge=document.querySelector('.app-header .preview-badge');if(internalBadge)internalBadge.textContent=label;const portalBadge=document.querySelector('.portal-header .preview-badge');if(portalBadge)portalBadge.textContent=label;const reset=byId('resetDemo');if(reset){reset.hidden=true;reset.disabled=true;reset.tabIndex=-1;reset.setAttribute('aria-hidden','true');}const foot=document.querySelector('.sidebar-foot');if(foot)foot.innerHTML='<strong><span class="live-dot"></span>Apps Script '+safeEnvironment+'</strong>Server authorization, Sheets repositories, and audit logging are active.';}}
  function activeModuleName(){return document.body.classList.contains('request-mode')?'request':(ui.view||'overview');}
  function applyEssentialNavigation(value){if(!useEssentialBootstrap)return;const allowed=new Set((value.navigation||[]).filter(entry=>entry.enabled===true).map(entry=>entry.id));document.querySelectorAll('#primaryNav [data-view]').forEach(button=>{const enabled=allowed.has(button.dataset.view);button.hidden=!enabled;button.disabled=!enabled;button.setAttribute('aria-hidden',String(!enabled));});if(!allowed.has(ui.view)){ui.view=value.activeModule||'overview';document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id===ui.view));}}
  async function loadActiveModule(requestOnly){if(!useEssentialBootstrap)return state;const module=activeModuleName();const pageSize=Number(state.moduleConfig?.defaultPageSize||10);const params={requestOnly:requestOnly||document.body.classList.contains('request-mode'),page:1,pageSize};const result=await moduleDataController.load(module,params);state=mergeBootstrapModule(state,result,{backendMode});normalizeStateRecords();return state;}
  async function init(){
    const requestOnly=document.body.dataset.requestOnly==='true'||new URLSearchParams(location.search).get('request')==='1';
    const loadingUi=createBootstrapUi();
    let controller;
    loadingUi.retryButton.onclick=()=>{loadingUi.reset();controller?.start();};
    controller=createBootstrapController({
      load:()=>{startupTestHook(BOOTSTRAP_STAGES.REQUEST);if(useEssentialBootstrap)return services.loadEssentialBootstrap({requestOnly});return backendMode==='mock'?loadState():services.loadBootstrapData({requestOnly});},
      onUpdate:event=>loadingUi.update(event),
      onReady:()=>loadingUi.finalize({ok:true}),
      onFailure:failure=>loadingUi.finalize({ok:false,failure}),
      steps:{
        validate(value){startupTestHook(BOOTSTRAP_STAGES.RESPONSE_VALIDATION);if(useEssentialBootstrap){const validated=validateEssentialBootstrap(value,{backendMode});if(validated.requestOnly!==requestOnly)throw new Error('Bootstrap session mode changed unexpectedly.');return validated;}return validateBootstrapEnvelope(value,{backendMode});},
        normalize(value){startupTestHook(BOOTSTRAP_STAGES.NORMALIZATION);state=useEssentialBootstrap?createStateFromEssentialBootstrap(value,{requestOnly}):(requestOnly&&backendMode==='mock'?sanitizeRequestOnlyState(value):value);normalizeStateRecords();if(useEssentialBootstrap){moduleDataController=createModuleDataController({load:(module,params)=>services.loadBootstrapModule(module,params),validate:(moduleValue,context)=>{const validated=validateBootstrapModule(moduleValue,{backendMode,module:context.module});if(validated.requestOnly!==context.request.requestOnly)throw new Error('Module session mode changed unexpectedly.');return validated;},maxPageSize:state.moduleConfig.maxPageSize});}if(requestOnly){document.body.classList.add('request-mode');ui.view='request';document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id==='request'));}applyEssentialNavigation(value);applyAppsScriptEnvironmentLabel();return state;},
        staticOptions(value){startupTestHook(BOOTSTRAP_STAGES.STATIC_OPTIONS);populateStaticOptions();return value;},
        extensions(value){startupTestHook(BOOTSTRAP_STAGES.EXTENSIONS);runtimeExtensions=createRuntimeExtensions({backendMode,services,getState:()=>state,acceptState:acceptAuthoritativeState,commit,toast,openModal,closeModal,isRequestOnly:()=>document.body.classList.contains('request-mode'),hasUnsavedRuntimeState:()=>ui.requestDraftLines.length>0||Object.values(ui.uploads).some(Boolean)});runtimeExtensions.install();return value;},
        bindings(value){startupTestHook(BOOTSTRAP_STAGES.BINDINGS);bindGlobalEvents();setupUploaders();return value;},
        activeModule(value){startupTestHook(BOOTSTRAP_STAGES.ACTIVE_MODULE);return loadActiveModule(requestOnly);},
        firstRender(value){startupTestHook(BOOTSTRAP_STAGES.FIRST_RENDER);renderAll();return value;},
        postRender(value){startupTestHook(BOOTSTRAP_STAGES.POST_RENDER);runtimeExtensions?.afterRender();runtimeExtensions?.start();return value;},
      },
    });
    controller.start();
  }
`;
const p0InitBridge = p0StartupBridge
  .replace(
    /(?=\n {2}async function init\(\)\{)/,
    "\n  async function loadAuthoritativeState(requestOnly){if(!useEssentialBootstrap)return services.loadBootstrapData({requestOnly});const essential=await services.loadEssentialBootstrap({requestOnly});const next=createStateFromEssentialBootstrap(essential,{requestOnly});moduleDataController?.clear();const module=requestOnly?'request':activeModuleName();const params={requestOnly:requestOnly||document.body.classList.contains('request-mode'),page:1,pageSize:Number(next.moduleConfig?.defaultPageSize||10)};const moduleValue=await moduleDataController.load(module,params);return mergeBootstrapModule(next,moduleValue,{backendMode});}"
  )
  .replace(/^function sanitizeRequestOnlyState[\s\S]*?\n(?=\x20{2}function startupTestHook)/, '')
  .replace('commit,toast,openModal', 'commit,loadAuthoritativeState,toast,openModal')
  .replace(/const label='[^']*'\+safeEnvironment;/, "const label='\\u25CF Apps Script \\u00B7 '+safeEnvironment;");
function bridgeRuntime(runtime) {
  const normalizedRuntime = runtime.replace(/\r\n?/g, '\n');

  return normalizedRuntime
    .replace(
      "'use strict';",
      "import { appEnvironment, backendMode, bootstrapContractVersion, createLegacyRuntimeAdapter } from '../services/legacy-runtime-adapter.js';\nimport { projectClientAuthorization } from '../domain/permissions.js';\nimport { validateEssentialBootstrap, validateBootstrapModule, createStateFromEssentialBootstrap, mergeBootstrapModule } from '../app/bootstrap-contract.js';\nimport { createModuleDataController } from '../app/module-data-controller.js';\nimport { BOOTSTRAP_STAGES, createBootstrapController, validateBootstrapEnvelope } from './bootstrap-controller.js';\nimport { createBootstrapUi } from './bootstrap-ui.js';\nimport { createRuntimeExtensions } from './runtime-extensions.js';\n  'use strict';",
    )
    .replace(
      "  let state;\n  const ui=",
      "  let state;\n  let runtimeExtensions;\n  let moduleDataController;\n  let activeModuleRequest;\n  const useEssentialBootstrap=backendMode==='apps-script'&&bootstrapContractVersion>=2;\n  const ui=",
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
      "  function showView(name){if(document.body.classList.contains('request-mode'))name='request';ui.view=name;document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===name));document.querySelectorAll('#primaryNav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));safeText(byId('pageTitle'),VIEW_TITLES[name]||'Logistics');window.scrollTo({top:0,behavior:'smooth'});renderAll();}",
      "  async function loadAndRenderModule(name){if(!moduleDataController)return;const params={requestOnly:document.body.classList.contains('request-mode'),page:1,pageSize:Number(state.moduleConfig?.defaultPageSize||10)};activeModuleRequest={module:name,params};try{const result=await moduleDataController.load(name,params);if(ui.view!==name)return;state=mergeBootstrapModule(state,result,{backendMode});normalizeStateRecords();renderAll();runtimeExtensions?.afterRender();}catch(error){if(error?.code!=='MODULE_LOAD_CANCELLED')toast(error?.message||'The active module could not be loaded.',true);}finally{if(activeModuleRequest?.module===name)activeModuleRequest=null;}}\n  function showView(name){if(document.body.classList.contains('request-mode'))name='request';if(useEssentialBootstrap&&activeModuleRequest&&activeModuleRequest.module!==name)moduleDataController.cancel(activeModuleRequest.module,activeModuleRequest.params);ui.view=name;document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===name));document.querySelectorAll('#primaryNav [data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===name));safeText(byId('pageTitle'),VIEW_TITLES[name]||'Logistics');window.scrollTo({top:0,behavior:'smooth'});if(useEssentialBootstrap){void loadAndRenderModule(name);return;}renderAll();}",
    )
    .replace(
      "  function renderAll(){\n    renderOverview();renderRequestSelectors();renderRequestDraft();renderLending();renderReleaseDesk();renderRestocking();renderProcurement();renderInventory();\n  }",
      "  function renderActiveModule(){if(document.body.classList.contains('request-mode')){renderRequestSelectors();renderRequestDraft();return;}if(ui.view==='overview')renderOverview();else if(ui.view==='request'){renderRequestSelectors();renderRequestDraft();}else if(ui.view==='lending')renderLending();else if(ui.view==='release')renderReleaseDesk();else if(ui.view==='restocking')renderRestocking();else if(ui.view==='procurement')renderProcurement();else if(ui.view==='inventory')renderInventory();else renderOverview();}\n  function renderAll(){if(useEssentialBootstrap){renderActiveModule();return;}if(document.body.classList.contains('request-mode')){renderRequestSelectors();renderRequestDraft();return;}renderOverview();renderRequestSelectors();renderRequestDraft();renderLending();renderReleaseDesk();renderRestocking();renderProcurement();renderInventory();\n  }",
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
    )
    .replace(
      /async function commit\(message,type='success'\)[\s\S]*?(?=\n {2}function resetDemoData)/,
      "function acceptAuthoritativeState(next){state=next;normalizeStateRecords();renderAll();runtimeExtensions?.afterRender();}\n  async function commit(message,type='success',mutationResult={}){persist();if(backendMode!=='mock'){try{acceptAuthoritativeState(await services.loadBootstrapData({requestOnly:document.body.classList.contains('request-mode')}));}catch(error){runtimeExtensions?.showRecordedRefreshFailure({correlationId:mutationResult?.correlationId,error});toast(`The action was recorded, but the screen could not refresh.${mutationResult?.correlationId?` Correlation ID: ${mutationResult.correlationId}.`:''}`,true);return false;}}else{renderAll();runtimeExtensions?.afterRender();}if(message)toast(message,type==='error');return true;}"
    )
    .replace(
      "acceptAuthoritativeState(await services.loadBootstrapData({requestOnly:document.body.classList.contains('request-mode')}));",
      "acceptAuthoritativeState(await loadAuthoritativeState(document.body.classList.contains('request-mode')));",
    )
    .replace(
      /function sanitizeRequestOnlyState[\s\S]*?(?=\n {2}function normalizeStateRecords)/,
      "function sanitizeRequestOnlyState(source){const copy=typeof structuredClone==='function'?structuredClone(source):JSON.parse(JSON.stringify(source));copy.inventoryItems=copy.inventoryItems.map(item=>{const safe={...item,openingOnHand:Math.max(0,Number(item.openingOnHand||0)+copy.ledgerTransactions.filter(tx=>tx.itemId===item.id).reduce((sum,tx)=>sum+(tx.direction==='IN'?1:-1)*Number(tx.quantity||0),0)-copy.reservations.filter(r=>r.itemId===item.id&&r.status==='ACTIVE').reduce((sum,r)=>sum+Number(r.quantity||0),0))};['lendingAudience','maximumLoanQuantity','defaultLoanDays','approvalRequired','reorderThreshold','storageLocation','notes','verificationNote','legacy'].forEach(name=>delete safe[name]);return safe;});['requests','requestLines','reservations','ledgerTransactions','restockRequests','restockRecords','lendingTickets','releaseConfirmations','deliverables','canvassReferences','evidenceFiles','statusHistory','auditLog','roadmapMilestones'].forEach(name=>copy[name]=[]);return copy;}\n  async function init(){\n    const requestOnly=document.body.dataset.requestOnly==='true'||new URLSearchParams(location.search).get('request')==='1';\n    try{state=backendMode==='mock'?loadState():await services.loadBootstrapData({requestOnly});if(requestOnly&&backendMode==='mock')state=sanitizeRequestOnlyState(state);}catch(error){byId('loading').classList.add('hidden');toast(`${error.message||'Backend unavailable'}${error.correlationId?` · ${error.correlationId}`:''}`,true);return;}\n    normalizeStateRecords();if(requestOnly){document.body.classList.add('request-mode');ui.view='request';document.querySelectorAll('.view').forEach(view=>view.classList.toggle('active',view.id==='request'));}\n    if(backendMode!=='mock'){const environment=String(appEnvironment||'').trim().toLowerCase();const safeEnvironment=environment==='staging'||environment==='production'?environment:'unknown';const label=`● Apps Script · ${safeEnvironment}`;const internalBadge=document.querySelector('.app-header .preview-badge');if(internalBadge)internalBadge.textContent=label;const portalBadge=document.querySelector('.portal-header .preview-badge');if(portalBadge)portalBadge.textContent=label;const reset=byId('resetDemo');if(reset){reset.hidden=true;reset.disabled=true;reset.tabIndex=-1;reset.setAttribute('aria-hidden','true');}const foot=document.querySelector('.sidebar-foot');if(foot)foot.innerHTML=`<strong><span class=\"live-dot\"></span>Apps Script ${safeEnvironment}</strong>Server authorization, Sheets repositories, and audit logging are active.`;}\n    populateStaticOptions();runtimeExtensions=createRuntimeExtensions({backendMode,services,getState:()=>state,acceptState:acceptAuthoritativeState,commit,toast,openModal,closeModal,isRequestOnly:()=>document.body.classList.contains('request-mode'),hasUnsavedRuntimeState:()=>ui.requestDraftLines.length>0||Object.values(ui.uploads).some(Boolean)});runtimeExtensions.install();bindGlobalEvents();setupUploaders();renderAll();runtimeExtensions.afterRender();byId('loading').classList.add('hidden');runtimeExtensions.start();\n  }\n"
    )
    .replace(
      /async function init[\s\S]*?(?=\n {2}function normalizeStateRecords)/,
      p0InitBridge,
    )
    .replace(
      "    state.statusHistory=state.statusHistory||[];state.auditLog=state.auditLog||[];",
      "    state.statusHistory=state.statusHistory||[];state.auditLog=state.auditLog||[];state.currentUser=state.currentUser||{id:CURRENT_ACTOR.id,displayName:CURRENT_ACTOR.name,role:'ADMIN',permissions:{review:true,release:true,receive:true,admin:true,manageCatalog:true}};state.currentUser.permissions=state.currentUser.permissions||{};if(backendMode==='mock')state.currentUser.permissions.manageCatalog=true;state.currentUser=projectClientAuthorization(state.currentUser,{requireCanonical:backendMode==='apps-script'&&useEssentialBootstrap});state.inventoryItems.forEach(item=>{item.handlingCode=String(item.handlingCode||item.handling||'NON_CIRCULATING').trim().toUpperCase().replace(/[\\s-]+/g,'_');item.catalogType=item.catalogType||(item.stockArea==='Pantry'?'PANTRY':'OFFICE_INVENTORY');item.storageLocation=item.storageLocation||'TO_BE_ASSIGNED';item.reorderThreshold=Number(item.reorderThreshold||0);item.lendingAudience=item.lendingAudience||(item.status!=='ACTIVE'||item.handlingCode==='NON_CIRCULATING'?'NOT_AVAILABLE_FOR_LENDING':['ITM-0001','ITM-0005','ITM-0006'].includes(item.id)?'STUDENTS_AND_STAFF':'USC_STAFF_ONLY');item.defaultLoanDays=item.defaultLoanDays??(['LOANABLE','REUSABLE_ASSET'].includes(item.handlingCode)?3:'');item.maximumLoanQuantity=item.maximumLoanQuantity??(item.handlingCode==='NON_CIRCULATING'?'':2);item.approvalRequired=item.approvalRequired!==false;item.onHand=itemOnHand(item.id);item.reserved=activeReservationQuantity(item.id);item.availableToPromise=availableToPromise(item.id);});",
    )
    .replace(
      /function itemAvailabilityStatus\(item\)[\s\S]*?(?=\n {2}function latestMovement)/,
      "function itemAvailabilityStatus(item){if(item.status==='ARCHIVED')return'ARCHIVED';if(item.status==='INACTIVE')return'INACTIVE';if(item.status==='VERIFY')return'VERIFY';const on=itemOnHand(item.id),atp=availableToPromise(item.id);if(on<=0)return'OUT_OF_STOCK';if(atp<=Number(item.reorderThreshold||0))return'LOW_STOCK';return'IN_STOCK';}"
    )
    .replace(
      /setOptions\(byId\('lendingItem'\),items,'id',i=>`[\s\S]*?`\);/,
      "runtimeExtensions?.lending?.setItems(items);"
    )
    .replace(
      /function renderLendingAvailability\(\)[\s\S]*?(?=\n {2}function lendingFilteredRows)/,
      "function renderLendingAvailability(){runtimeExtensions?.lending?.renderAvailability();}"
    )
    .replace(
      /async function submitLending\(e\)[\s\S]*?(?=\n {2}function openLendingDetails)/,
      "async function submitLending(e){e.preventDefault();const f=e.currentTarget;if(!f.reportValidity())return;const validation=runtimeExtensions?.lending?.validate();if(validation&&!validation.valid)return toast(validation.message,true);const p=Object.fromEntries(new FormData(f).entries());if(!p.itemId)return toast('Select an inventory item from the suggestions before submitting.',true);if(!p.studentIdNumber.trim())return toast('Student ID Number is required.',true);if(p.dueAt)p.dueAt=new Date(p.dueAt).toISOString();const button=e.submitter||f.querySelector('[type=submit]');button.disabled=true;button.textContent='Creating…';try{const t=await services.createLendingTicket(p);f.reset();runtimeExtensions?.markFormClean(f);await commit(`Ticket ${t.id} created for review.`,'success',t);}catch(err){toast(`${err.message}${err.correlationId?` · ${err.correlationId}`:''}`,true);}finally{button.disabled=false;button.textContent='Create For Review Ticket';}}"
    )
    .replace(
      /async function submitRequestForm\(e\)[\s\S]*?(?=\n\n {2}\/\* =+)/,
      "async function submitRequestForm(e){e.preventDefault();const f=e.currentTarget;if(!f.reportValidity())return;if(!ui.requestDraftLines.length)return toast('Add at least one request line before submitting.',true);const button=e.submitter||f.querySelector('[type=submit]');button.disabled=true;const fd=new FormData(f),payload=Object.fromEntries(fd.entries());payload.lines=ui.requestDraftLines;try{const rec=await services.submitRequest(payload);ui.requestDraftLines=[];f.reset();runtimeExtensions?.markFormClean(f);document.querySelector('[name=\"requestType\"][value=\"EVENT_LOGISTICS\"]').checked=true;resetComposer();await commit(`Request ${rec.id} submitted for DOL review.`,'success',rec);const storageNote=backendMode==='mock'?'The request is saved in local preview state. No stock was reduced and no Google Sheet was changed.':'The request was recorded for DOL review. Submission did not reduce physical stock.';openDrawer('Request submitted',`<div class=\"mode-note\"><strong>${esc(rec.id)}</strong><br>${esc(rec.displayName)}<br>Status: ${esc(statusLabel(rec.status))}</div><p class=\"small muted\" style=\"margin-top:14px\">${storageNote}</p>`);}catch(err){toast(`${err.message}${err.correlationId?` · ${err.correlationId}`:''}`,true);}finally{button.disabled=false;}}"
    )
    .replace(
      /async function submitRestockReceive\(e\)[\s\S]*?(?=\n {2}function renderRecentRestocks)/,
      "async function submitRestockReceive(e){e.preventDefault();const f=e.currentTarget;if(!f.reportValidity())return;if(!confirm('Confirm receiving and post a PURCHASE_RECEIPT ledger transaction?'))return;const button=e.submitter||f.querySelector('[type=submit]');button.disabled=true;const p=Object.fromEntries(new FormData(f).entries());p.file=ui.uploads.restock?.file||null;try{const rec=await services.receiveRestock(p);f.reset();runtimeExtensions?.markFormClean(f);ui.uploads.restock=null;renderFixedUploaders();await commit(`Restock ${rec.id} received and logged.`,'success',rec);}catch(err){toast(`${err.message}${err.correlationId?` · ${err.correlationId}`:''}`,true);}finally{button.disabled=false;}}"
    )
    .replace(
      /async function submitCanvass\(e\)[\s\S]*?(?=\n {2}function renderQuoteComparison)/,
      "async function submitCanvass(e){e.preventDefault();const f=e.currentTarget;if(!f.reportValidity())return;const button=e.submitter||f.querySelector('[type=submit]');button.disabled=true;const p=Object.fromEntries(new FormData(f).entries());p.file=ui.uploads.canvass?.file||null;try{const rec=await services.saveCanvassReference(p);f.reset();runtimeExtensions?.markFormClean(f);f.elements.checkedAt.value=dateInputValue(isoNow());ui.uploads.canvass=null;renderFixedUploaders();await commit(`Canvass reference ${rec.id} saved.`,'success',rec);}catch(err){toast(`${err.message}${err.correlationId?` · ${err.correlationId}`:''}`,true);}finally{button.disabled=false;}}"
    )
    .replace(
      /async function submitDeliverableReceive\(e\)[\s\S]*?(?=\n {2}function eventItemAvailable)/,
      "async function submitDeliverableReceive(e){e.preventDefault();const f=e.currentTarget;if(!f.reportValidity())return;if(!confirm('Confirm receiving, assign an EIT ID, and post the event-item receipt to the ledger?'))return;const button=e.submitter||f.querySelector('[type=submit]');button.disabled=true;const p=Object.fromEntries(new FormData(f).entries());p.file=ui.uploads.deliverable?.file||null;try{const d=await services.receiveDeliverable(p);f.reset();runtimeExtensions?.markFormClean(f);ui.uploads.deliverable=null;renderFixedUploaders();await commit(`${d.eventItemId} received and routed to the Release Desk.`,'success',d);}catch(err){toast(`${err.message}${err.correlationId?` · ${err.correlationId}`:''}`,true);}finally{button.disabled=false;}}"
    )
    .replace(
      /function uploaderHtml\(key,[\s\S]*?(?=\n {2}function filePreviewHtml)/,
      "function uploaderHtml(key,{accept='image/*,application/pdf',capture=false,label='Receipt or evidence'}={}){const u=ui.uploads[key],modeLabel=backendMode==='mock'?'Mock Drive upload':'Secure Drive upload';return `<div class=\"uploader\" data-uploader=\"${key}\"><div class=\"label-row\"><strong>${esc(label)}</strong><span class=\"pill\">${modeLabel}</span></div><input id=\"${key}File\" class=\"hidden\" type=\"file\" accept=\"${accept}\" ${capture?'capture=\"environment\"':''}><div class=\"dropzone\" tabindex=\"0\" role=\"button\" data-pick-file=\"${key}\"><span><strong>Choose a file</strong> or drag and drop<br><small>Images and PDF files are accepted. Mobile camera capture is supported where available.</small></span></div><div class=\"file-preview ${u?'':'hidden'}\" data-file-preview=\"${key}\">${u?filePreviewHtml(u):''}</div></div>`;}"
    )
    .replace(
      "u.progress>=100?'Ready for mock Drive upload':`Preparing ${u.progress||0}%`",
      "u.progress>=100?(backendMode==='mock'?'Ready for mock Drive upload':'Ready for secure upload'):`Preparing ${u.progress||0}%`",
    )
    .replace(
      /function bindInventoryEvents\(\)[\s\S]*?(?=\n {2}function inventoryFilteredRows)/,
      "function bindInventoryEvents(){\n    ['inventorySearch','inventoryAreaFilter','inventoryHandlingFilter','inventoryStatusFilter'].forEach(id=>byId(id).addEventListener('input',debounce(()=>{ui.inventoryPage=1;renderInventory()},120)));byId('clearInventoryFilters').onclick=()=>{byId('inventorySearch').value='';byId('inventoryAreaFilter').value='ALL';byId('inventoryHandlingFilter').value='ALL';byId('inventoryStatusFilter').value='ALL';ui.inventoryPage=1;renderInventory()};\n    byId('inventoryTable').addEventListener('click',e=>{const b=e.target.closest('[data-inventory-action]');if(!b)return;const id=b.dataset.itemId,action=b.dataset.inventoryAction;if(action==='edit')runtimeExtensions.openCatalogItem(id);if(action==='history')openInventoryHistory(id);if(action==='restock')openInventoryRestock(id);if(action==='context')openInventoryContext(id);if(action==='transfer')openInventoryLocationTransfer(id);if(action==='archive')archiveInventoryItem(id);if(action==='restore')runtimeExtensions.restoreItem(id).catch(err=>toast(err.message,true));});byId('inventoryPagination').addEventListener('click',e=>{const b=e.target.closest('[data-page-action]');if(!b)return;ui.inventoryPage+=b.dataset.pageAction==='next'?1:-1;renderInventory()});byId('adminCatalogException').onclick=openAdminCatalogException;\n  }"
    )
    .replace(
      /function inventoryFilteredRows\(\)[\s\S]*?(?=\n {2}function renderInventory)/,
      "function inventoryFilteredRows(){const q=normalize(byId('inventorySearch').value),area=byId('inventoryAreaFilter').value,handling=normalize(byId('inventoryHandlingFilter').value),status=byId('inventoryStatusFilter').value;return state.inventoryItems.filter(i=>(status==='ARCHIVED'?i.status==='ARCHIVED':i.status!=='ARCHIVED')&&(!q||normalize(`${i.id} ${i.name} ${(i.aliases||[]).join(' ')} ${i.category} ${i.stockArea} ${i.provenance?.originEventItemId||''}`).includes(q))&&(area==='ALL'||i.stockArea===area)&&(handling==='all'||normalize(i.handlingCode||i.handling)===handling)&&(status==='ALL'||itemAvailabilityStatus(i)===status)).sort((a,b)=>a.id.localeCompare(b.id));}"
    )
    .replace(
      /function inventoryActions\(i\)[\s\S]*?(?=\n {2}function openInventoryHistory)/,
      "function inventoryActions(i){return runtimeExtensions.inventoryActions(i);}"
    )
    .replace(
      /function openInventoryLocationTransfer\(id\)[\s\S]*?(?=\n {2}function archiveInventoryItem)/,
      "function openInventoryLocationTransfer(id){const i=getItem(id);openModal(`Transfer ${i.id} storage context`,`<form id=\"inventoryTransferForm\"><div class=\"mode-note\">This action changes storage area/location only. Quantity remains ledger-controlled.</div><div class=\"form-grid\" style=\"margin-top:14px\"><label>Stock area<input name=\"stockArea\" value=\"${esc(i.stockArea)}\" required></label><label>Storage location<input name=\"storageLocation\" value=\"${esc(i.storageLocation)}\" required></label><label class=\"span-2\">Transfer note<textarea name=\"note\"></textarea></label></div><button class=\"primary\" type=\"submit\">Update Storage Context</button></form>`,m=>{const f=m.querySelector('#inventoryTransferForm');f.onsubmit=async e=>{e.preventDefault();if(!f.reportValidity())return;const button=e.submitter||f.querySelector('[type=submit]');button.disabled=true;button.textContent='Updating…';const p=Object.fromEntries(new FormData(f).entries());p.itemId=id;try{await runtimeExtensions.updateStorage(p);runtimeExtensions.markFormClean(f);closeModal();}catch(err){toast(`${err.message}${err.correlationId?` · ${err.correlationId}`:''}`,true);button.disabled=false;button.textContent='Update Storage Context';}};});}"
    )
    .replace(
      /function archiveInventoryItem\(id\)[\s\S]*?(?=\n {2}function openAdminCatalogException)/,
      "async function archiveInventoryItem(id){const i=getItem(id);if(!confirm(`Archive ${i.name}? Historical ledger records will remain.`))return;try{await runtimeExtensions.archiveItem(id);}catch(err){toast(`${err.message}${err.correlationId?` · ${err.correlationId}`:''}`,true);}}"
    )
    .replace(
      /function openAdminCatalogException\(\)[\s\S]*?(?=\n\n {2}\/\* =+)/,
      "function openAdminCatalogException(){runtimeExtensions.openCreateCatalogItem();}"
    )
    .replace(
      /function bindLendingEvents\(\)[\s\S]*?(?=\n {2}function renderLending)/,
      "function bindLendingEvents(){\n    byId('lendingForm').addEventListener('submit',submitLending);byId('lendingItem').addEventListener('change',renderLendingAvailability);\n    byId('lendingTabs').addEventListener('click',e=>{const b=e.target.closest('[data-loan-tab]');if(b){ui.lendingTab=b.dataset.loanTab;renderLending()}});\n    ['lendingSearch','lendingItemFilter','lendingBorrowerFilter'].forEach(id=>byId(id).addEventListener('input',debounce(renderLendingTickets,100)));byId('clearLendingFilters').onclick=()=>{byId('lendingSearch').value='';byId('lendingItemFilter').value='ALL';byId('lendingBorrowerFilter').value='ALL';renderLendingTickets()};\n    byId('lendingTickets').addEventListener('click',async e=>{const b=e.target.closest('[data-loan-action]');if(!b)return;const id=b.dataset.ticketId,action=b.dataset.loanAction;if(action==='details')return openLendingDetails(id);if(action==='return')return openReturnModal(id);b.disabled=true;try{if(action==='approve'){const result=await services.approveLendingTicket(id);await commit(`Ticket ${id} is ready to claim.`,'success',result);}if(action==='handoff'){if(!confirm('Confirm the physical handoff and post the ledger movement?'))return;const result=await services.confirmLoanHandoff(id);await commit(`Handoff confirmed for ${id}.`,'success',result);}if(action==='reject'&&backendMode==='mock'){const t=state.lendingTickets.find(x=>x.id===id);appendStatus(t,'REJECTED','Rejected by DOL');audit('REJECT_LENDING','LENDING',id);await commit(`Ticket ${id} rejected.`);}}catch(err){toast(`${err.message}${err.correlationId?` · ${err.correlationId}`:''}`,true);}finally{b.disabled=false;}});\n  }"
    )
    .replace(
      "if(d==='FOR_REVIEW')actions.push(`<button class=\"primary mini\" data-loan-action=\"approve\" data-ticket-id=\"${t.id}\">Approve</button><button class=\"danger mini\" data-loan-action=\"reject\" data-ticket-id=\"${t.id}\">Reject</button>`);",
      "if(d==='FOR_REVIEW')actions.push(`<button class=\"primary mini\" data-loan-action=\"approve\" data-ticket-id=\"${t.id}\">Approve</button>${backendMode==='mock'?`<button class=\"danger mini\" data-loan-action=\"reject\" data-ticket-id=\"${t.id}\">Reject</button>`:''}`);",
    )
    .replace(
      /function openReturnModal\(id\)[\s\S]*?(?=\n\n {2}\/\* =+)/,
      "function openReturnModal(id){const t=state.lendingTickets.find(x=>x.id===id);openModal(`Return ${t.id}`,`<form id=\"returnForm\"><label>Return condition / note<textarea name=\"note\">Returned in good condition</textarea></label><button class=\"primary\" type=\"submit\">Post LOAN_RETURN</button></form>`,m=>m.querySelector('#returnForm').onsubmit=async e=>{e.preventDefault();if(!confirm('Confirm the physical return and post LOAN_RETURN to the ledger?'))return;const button=e.submitter||e.currentTarget.querySelector('[type=submit]');button.disabled=true;try{const result=await services.confirmReturn(id,new FormData(e.currentTarget).get('note'));runtimeExtensions.markFormClean(e.currentTarget);closeModal();await commit(`Return confirmed for ${id}.`,'success',result);}catch(err){toast(`${err.message}${err.correlationId?` · ${err.correlationId}`:''}`,true);button.disabled=false;}});}"
    )
    .replace(
      "await services.confirmLoanHandoff(id);commit(`Handoff confirmed for ${id}.`)",
      "const result=await services.confirmLoanHandoff(id);await commit(`Handoff confirmed for ${id}.`,'success',result)",
    )
    .replace(
      "await services.confirmRelease({requestId:r.id,eventId:r.eventId,recipientName:fd.get('recipientName'),recipientRole:fd.get('recipientRole'),department:fd.get('department'),notes:fd.get('notes'),lines:linesPayload,file:ui.uploads.release?.file||null});closeModal();ui.uploads.release=null;commit(`Release recorded for ${r.id}.`)",
      "const button=e.submitter||f.querySelector('[type=submit]');button.disabled=true;button.textContent='Posting…';const result=await services.confirmRelease({requestId:r.id,eventId:r.eventId,recipientName:fd.get('recipientName'),recipientRole:fd.get('recipientRole'),department:fd.get('department'),notes:fd.get('notes'),lines:linesPayload,file:ui.uploads.release?.file||null});runtimeExtensions.markFormClean(f);closeModal();ui.uploads.release=null;await commit(`Release recorded for ${r.id}.`,'success',result)",
    )
    .replace(
      "await commit(`Release recorded for ${r.id}.`,'success',result)}catch(err){toast(err.message,true)}}})}",
      "await commit(`Release recorded for ${r.id}.`,'success',result)}catch(err){toast(`${err.message}${err.correlationId?` · ${err.correlationId}`:''}`,true);button.disabled=false;button.textContent='Confirm Physical Release';}}})}",
    )
    .replace(
      "const fd=new FormData(f);try{const button=e.submitter||f.querySelector('[type=submit]');button.disabled=true;button.textContent='Posting…';const result=",
      "const fd=new FormData(f);const button=e.submitter||f.querySelector('[type=submit]');button.disabled=true;button.textContent='Posting…';try{const result=",
    )
    .replace(
      "const result=await services.transferEventItemToInventory(p);closeModal();commit(`${d.eventItemId} transferred to ${result.target.id} with linked ledger records.`)",
      "const result=await services.transferEventItemToInventory(p);runtimeExtensions.markFormClean(f);closeModal();await commit(`${d.eventItemId} transferred to ${result.target.id} with linked ledger records.`,'success',result)",
    )
    .replace(
      "await services.selectPreferredCanvass({canvassId:canId,rationale:'Selected in the quote comparison view'});await commit(`Preferred quote ${canId} selected.`);",
      "const result=await services.selectPreferredCanvass({canvassId:canId,rationale:'Selected in the quote comparison view'});await commit(`Preferred quote ${canId} selected.`,'success',result);",
    )
    .replace(
      "if(backendMode!=='mock'&&!['MATCH','RECEIVE'].includes(action)){if(action==='ACCEPT'||action==='SPLIT')await services.reviewRequest(d.requestId,'ACCEPT','Accepted from Deliverables queue');else if(action==='REJECT')await services.reviewRequest(d.requestId,'REJECT','Rejected from Deliverables queue');else await services.transitionDeliverable({deliverableId:d.id,status:action,note:`Moved to ${statusLabel(action)}`});closeModal();await commit(`${d.id} updated.`);return;}",
      "if(backendMode!=='mock'&&!['MATCH','RECEIVE'].includes(action)){let result;if(action==='ACCEPT'||action==='SPLIT')result=await services.reviewRequest(d.requestId,'ACCEPT','Accepted from Deliverables queue');else if(action==='REJECT')result=await services.reviewRequest(d.requestId,'REJECT','Rejected from Deliverables queue');else result=await services.transitionDeliverable({deliverableId:d.id,status:action,note:`Moved to ${statusLabel(action)}`});closeModal();await commit(`${d.id} updated.`,'success',result);return;}",
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

const p0OverlayCss = `
    .loading-panel{width:min(460px,calc(100% - 32px));padding:26px 24px;border:1px solid rgba(97,11,15,.14);border-radius:18px;background:rgba(255,255,255,.94);box-shadow:0 18px 60px rgba(36,5,7,.16);text-align:center}
    .loading-panel[role="alert"]{border-color:rgba(123,23,27,.35)}.loading-title{display:block;font-size:18px;color:var(--oxblood)}.loading-detail{margin:9px 0 0;color:var(--muted);font-size:12px;line-height:1.5}.loading-support{margin:12px 0 0;color:var(--muted);font-size:11px}.loading-retry{margin-top:15px}.loading-retry[hidden]{display:none!important}.loading-overlay[data-state="slow"] .spinner{animation-duration:1.4s}
`;

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
    `${css.slice(start, end).trim()}${name === 'overlays' ? p0OverlayCss.trim() : ''}\n`,
  ]),
  ...views.map(({ id, html }) => [`src/visual/views/${id}.html`, generatedNotice + html + '\n']),
]);

for (const [relativePath, content] of outputs) {
  const outputPath = resolve(repositoryRoot, relativePath);
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content);
}

console.log(`Extracted ${views.length} views, authoritative CSS, and runtime from ${baselinePath}`);
