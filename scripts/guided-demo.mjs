import { shareableModules } from './shareable-module-registry.mjs';

export const guidedDemoSteps = Object.freeze([
  Object.freeze({
    id: 'overview',
    title: 'Operations Overview',
    purpose: 'Start with the operational picture: what is upcoming, ready, at risk, or complete.',
    highlights: Object.freeze([
      'Upcoming event readiness and committee context',
      'Operational queue counts that open matching records',
      'Recent completions and roadmap visibility',
    ]),
  }),
  Object.freeze({
    id: 'request',
    title: 'Request Center',
    purpose: 'Build one logistics request with clear event, catalog, quantity, and routing context.',
    highlights: Object.freeze([
      'Predictive catalog matching and explicit selection',
      'Composite Food, Materials, and Venue or Equipment sections',
      'Line summaries before a request is submitted',
    ]),
  }),
  Object.freeze({
    id: 'lending',
    title: 'Office Lending Hub',
    purpose: 'Show the controlled review, claim, handoff, due-date, and return lifecycle.',
    highlights: Object.freeze([
      'Availability-aware item search',
      'Different handling for consumables and loanable assets',
      'Overdue and return status derived from authoritative records',
    ]),
  }),
  Object.freeze({
    id: 'release',
    title: 'Release Desk',
    purpose: 'Demonstrate the final physical handoff checkpoint before stock leaves custody.',
    highlights: Object.freeze([
      'One queue for approved requests and lending tickets',
      'Recipient confirmation and release evidence context',
      'Traceable release history after handoff',
    ]),
  }),
  Object.freeze({
    id: 'restocking',
    title: 'Restocking',
    purpose: 'Review a catalog restock line, its prerequisites, and cumulative receiving progress.',
    highlights: Object.freeze([
      'Server-shaped allowed actions and disabled reasons',
      'Preferred quote and receiving prerequisites',
      'Line-level receipt history without sibling completion',
    ]),
  }),
  Object.freeze({
    id: 'procurement',
    title: 'Procurement & Deliverables',
    purpose: 'Connect canvassing, delivery receiving, and event-item registration in one flow.',
    highlights: Object.freeze([
      'Event deliverables queue and canvass library',
      'Supplier, receipt, and evidence context',
      'Automatic event-item provenance after receiving',
    ]),
  }),
  Object.freeze({
    id: 'inventory',
    title: 'Inventory Management',
    purpose: 'Finish with stock truth, availability, history, and controlled reference actions.',
    highlights: Object.freeze([
      'On-hand, reserved, and available-to-promise quantities',
      'Search, filters, stock status, and ledger history',
      'Permission-gated reference administration entry point',
    ]),
  }),
]);

function replaceRequired(html, from, to, label) {
  if (!html.includes(from)) throw new Error(`Cannot create guided demo: missing ${label}.`);
  return html.replace(from, to);
}

const guidedDemoStyles = `<style id="guidedDemoStyles">
.demo-guide-launcher,.demo-guide{position:fixed;z-index:1200}.demo-guide-launcher{right:1rem;bottom:1rem;min-height:44px;padding:.7rem 1rem;border:0;border-radius:999px;background:#610b0f;color:#fff;box-shadow:0 10px 30px rgba(40,16,16,.25);font:700 .9rem/1.2 system-ui,sans-serif;cursor:pointer}.demo-guide{right:1rem;bottom:1rem;width:min(390px,calc(100vw - 2rem));max-height:calc(100vh - 2rem);overflow:auto;border:1px solid rgba(97,11,15,.2);border-radius:20px;background:#fffaf0;color:#2d1616;box-shadow:0 18px 54px rgba(40,16,16,.3);font:400 .95rem/1.5 system-ui,sans-serif}.demo-guide[hidden],.demo-guide-launcher[hidden]{display:none}.demo-guide__header,.demo-guide__body,.demo-guide__footer{padding:1rem}.demo-guide__header{display:flex;align-items:flex-start;justify-content:space-between;gap:1rem;border-bottom:1px solid rgba(97,11,15,.14)}.demo-guide__header p,.demo-guide__body p{margin:.25rem 0;color:#654}.demo-guide__header strong{display:block;color:#610b0f}.demo-guide__close{min-width:44px;min-height:44px;border:1px solid rgba(97,11,15,.2);border-radius:12px;background:#fff;color:#610b0f;font-size:1.25rem;cursor:pointer}.demo-guide__eyebrow{margin:0 0 .35rem;color:#8d6818;font-size:.75rem;font-weight:800;letter-spacing:.08em;text-transform:uppercase}.demo-guide h2{margin:0;color:#4a080c;font:700 1.35rem/1.2 Georgia,serif}.demo-guide ul{margin:.75rem 0 0;padding-left:1.2rem}.demo-guide li+li{margin-top:.35rem}.demo-guide__footer{display:grid;grid-template-columns:1fr 1fr;gap:.6rem;border-top:1px solid rgba(97,11,15,.14)}.demo-guide__footer button{min-height:44px;border-radius:12px;padding:.65rem .8rem;font-weight:700;cursor:pointer}.demo-guide__footer .demo-primary{grid-column:1/-1;border:0;background:#610b0f;color:#fff}.demo-guide__footer .demo-secondary{border:1px solid rgba(97,11,15,.25);background:#fff;color:#610b0f}.demo-guide__footer button:disabled{cursor:not-allowed;opacity:.45}.demo-guided-highlight{outline:4px solid rgba(208,164,46,.65);outline-offset:4px;border-radius:16px}.demo-guide__sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@media(max-width:600px){.demo-guide{right:0;bottom:0;width:100%;max-height:72vh;border-radius:20px 20px 0 0}.demo-guide-launcher{right:.75rem;bottom:.75rem}}@media(prefers-reduced-motion:no-preference){.demo-guide,.demo-guide-launcher{transition:opacity .16s ease,transform .16s ease}.demo-guided-highlight{scroll-margin-top:1rem}}
</style>`;

const guidedDemoMarkup = `<button id="demoGuideLauncher" class="demo-guide-launcher" type="button" aria-controls="demoGuide">Guided demo</button>
<aside id="demoGuide" class="demo-guide" role="dialog" aria-modal="false" aria-labelledby="demoGuideTitle" hidden>
  <header class="demo-guide__header">
    <div><strong>HAU-USC Logistics</strong><p>Guided offline demonstration</p></div>
    <button id="demoGuideClose" class="demo-guide__close" type="button" aria-label="Close guided demo">&times;</button>
  </header>
  <div class="demo-guide__body">
    <p id="demoGuideCount" class="demo-guide__eyebrow"></p>
    <h2 id="demoGuideTitle" tabindex="-1"></h2>
    <p id="demoGuidePurpose"></p>
    <ul id="demoGuideHighlights"></ul>
  </div>
  <footer class="demo-guide__footer">
    <button id="demoGuideBack" class="demo-secondary" type="button">Previous</button>
    <button id="demoGuideNext" class="demo-secondary" type="button">Next module</button>
    <button id="demoGuideOpen" class="demo-primary" type="button">Open this module</button>
  </footer>
</aside>
<p id="demoGuideLive" class="demo-guide__sr" aria-live="polite"></p>`;

function guidedDemoScript() {
  const steps = JSON.stringify(guidedDemoSteps).replaceAll('<', '\\u003c');
  return `<script id="guidedDemoScript">
(()=>{const steps=${steps};let index=0;const byId=id=>document.getElementById(id);const launcher=byId('demoGuideLauncher');const panel=byId('demoGuide');const title=byId('demoGuideTitle');const count=byId('demoGuideCount');const purpose=byId('demoGuidePurpose');const highlights=byId('demoGuideHighlights');const back=byId('demoGuideBack');const next=byId('demoGuideNext');const openButton=byId('demoGuideOpen');const closeButton=byId('demoGuideClose');const live=byId('demoGuideLive');function clearHighlight(){document.querySelectorAll('.demo-guided-highlight').forEach(node=>node.classList.remove('demo-guided-highlight'));}function activate(){const step=steps[index];const nav=document.querySelector('#primaryNav [data-view="'+step.id+'"]');if(nav)nav.click();clearHighlight();const target=document.getElementById(step.id);if(target){target.classList.add('demo-guided-highlight');target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});}live.textContent=step.title+' module opened.';}function render(){const step=steps[index];count.textContent='Step '+(index+1)+' of '+steps.length;title.textContent=step.title;purpose.textContent=step.purpose;highlights.replaceChildren(...step.highlights.map(value=>{const item=document.createElement('li');item.textContent=value;return item;}));back.disabled=index===0;next.textContent=index===steps.length-1?'Restart tour':'Next module';openButton.textContent='Open '+step.title;live.textContent='Guided demo step '+(index+1)+': '+step.title;}function show(){panel.hidden=false;launcher.hidden=true;render();title.focus();}function hide(){panel.hidden=true;launcher.hidden=false;clearHighlight();launcher.focus();}launcher.addEventListener('click',show);closeButton.addEventListener('click',hide);openButton.addEventListener('click',activate);back.addEventListener('click',()=>{if(index>0){index-=1;render();activate();}});next.addEventListener('click',()=>{index=index===steps.length-1?0:index+1;render();activate();});document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!panel.hidden){event.preventDefault();hide();}});window.addEventListener('load',render,{once:true});})();
</script>`;
}

export function createGuidedDemoShareable(standalone) {
  if (guidedDemoSteps.length !== shareableModules.length) {
    throw new Error('Guided demo steps must match the authoritative shareable module registry.');
  }
  for (const [index, module] of shareableModules.entries()) {
    if (guidedDemoSteps[index]?.id !== module.id) {
      throw new Error('Guided demo order must match the authoritative shareable module registry.');
    }
  }

  let html = standalone;
  html = replaceRequired(
    html,
    '<html lang="en">',
    '<html lang="en" data-shareable-module="overview" data-guided-demo="true">',
    'root HTML element',
  );
  html = replaceRequired(
    html,
    '<title>HAU-USC Logistics Prototype</title>',
    '<title>HAU-USC Logistics - Guided Demo</title>',
    'document title',
  );
  html = replaceRequired(html, '</head>', `${guidedDemoStyles}\n</head>`, 'head closing tag');
  html = replaceRequired(
    html,
    '</body>',
    `${guidedDemoMarkup}\n${guidedDemoScript()}\n</body>`,
    'body closing tag',
  );
  return html.replace(/[ \t]+$/gm, '');
}

export function assertGuidedDemoShareable(standalone, guidedDemo) {
  const expected = createGuidedDemoShareable(standalone);
  if (guidedDemo !== expected) {
    throw new Error(
      'The guided demo does not match the deterministic output generated from dist/index.html.',
    );
  }
}
