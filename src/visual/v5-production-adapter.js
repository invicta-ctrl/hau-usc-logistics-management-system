function addClasses(element, ...classes) {
  if (!element) return;
  const missing = classes.filter((name) => !element.classList.contains(name));
  if (missing.length) element.classList.add(...missing);
}

const NAV_ICON_PATHS = Object.freeze({
  overview: '<path d="m4 10 8-6 8 6v9a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z" stroke-linejoin="round"/>',
  request:
    '<rect x="5" y="5" width="14" height="16" rx="2"/><path d="M9 5.5V4h6v1.5M8 10h8M8 14h6" stroke-linecap="round"/>',
  lending:
    '<path d="M5 4h11a2 2 0 0 1 2 2v10H7a2 2 0 0 0-2 2V4Z" stroke-linejoin="round"/><path d="M7 20h12V8h-1M9 8h5M9 12h5" stroke-linecap="round" stroke-linejoin="round"/><path d="m3 16 2 2 2-2" stroke-linecap="round" stroke-linejoin="round"/>',
  release: '<path d="m5 12 4 4L19 6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
  restocking: '<path d="M12 4v15m-6-6 6 6 6-6" stroke-linecap="round" stroke-linejoin="round"/>',
  procurement:
    '<rect x="4" y="7" width="16" height="13" rx="2"/><path d="M9 7V5h6v2M4 12h16M10 12v2h4v-2" stroke-linecap="round" stroke-linejoin="round"/>',
  inventory:
    '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9Z" stroke-linejoin="round"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9" stroke-linejoin="round"/>',
  referenceAdmin:
    '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.3 1a7 7 0 0 0-1.7-1L14.7 3h-4l-.3 2.1a7 7 0 0 0-1.7 1l-2.3-1-2 3.4 2 1.5a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.3-1a7 7 0 0 0 1.7 1l.3 2.1h4l.3-2.1a7 7 0 0 0 1.7-1l2.3 1 2-3.4-2-1.5c.1-.3.1-.7.1-1Z" stroke-width="1.4" stroke-linejoin="round"/>',
});

const PAGE_TITLES = Object.freeze({
  overview: 'Control Centre',
  request: 'Requests needing review',
  lending: 'Lending hub',
  release: 'Release Desk',
  restocking: 'Restocking and receiving',
  procurement: 'Procurement',
  inventory: 'Inventory',
  referenceAdmin: 'Administration',
});

function iconMarkup(path) {
  return `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="1.8">${path}</svg>`;
}

function ensureRailBrand(rail) {
  const brand = rail?.querySelector('.brand');
  if (!brand) return;
  const legacyLockup = brand.querySelector('.brand-media-lockup');
  if (brand.dataset.v5Brand !== undefined && !legacyLockup) return;
  brand.dataset.v5Brand = '';
  brand.innerHTML = `<span class="rail__marks" aria-hidden="true"><span class="rail__mark">HAU</span><span class="rail__mark">USC</span></span>
    <span class="rail__name">HAU-USC Logistics<span class="rail__department">Department of Logistics</span></span>
    <span class="rail__system-code">Campus logistics</span>`;
}

function simplifyNavigationCopy(button, key) {
  const copy = button.querySelector('.nav-copy');
  const labels = {
    procurement: 'Procurement',
    inventory: 'Inventory',
  };
  const label = labels[key];
  if (!copy || !label) return;
  const textNode = [...copy.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
  if (textNode && textNode.textContent !== label) textNode.textContent = label;
}

function ensureNavigationLabels(navigation) {
  if (!navigation || navigation.querySelector('[data-v5-nav-label="operations"]')) return;
  const operations = document.createElement('span');
  operations.className = 'label rail__section-label';
  operations.dataset.v5NavLabel = 'operations';
  operations.innerHTML = '<b>Operations</b><i>O-BANK</i>';
  navigation.prepend(operations);
  const administrationButton = navigation.querySelector('[data-admin-view]');
  if (!administrationButton) return;
  const administration = document.createElement('span');
  administration.className = 'label rail__section-label';
  administration.dataset.v5NavLabel = 'administration';
  administration.innerHTML = '<b>Administration</b><i>A-BANK</i>';
  administrationButton.before(administration);
}

function syncNavigationState(root = document) {
  const navigation = root.querySelector('#primaryNav');
  ensureNavigationLabels(navigation);
  let operationIndex = 0;
  let administrationIndex = 0;
  root.querySelectorAll('#primaryNav button').forEach((button) => {
    addClasses(button, 'nav-item');
    const icon = button.querySelector('.nav-icon');
    addClasses(icon, 'nav-item__icon');
    addClasses(button.querySelector('.nav-copy'), 'nav-item__text');
    const key = button.dataset.view || button.dataset.adminView;
    simplifyNavigationCopy(button, key);
    if (icon && NAV_ICON_PATHS[key] && icon.dataset.v5Icon !== key) {
      icon.dataset.v5Icon = key;
      icon.innerHTML = iconMarkup(NAV_ICON_PATHS[key]);
    }
    const bank = button.dataset.adminView ? 'A' : 'O';
    const index = button.dataset.adminView ? ++administrationIndex : ++operationIndex;
    let code = button.querySelector('.nav-item__code');
    if (!code) {
      code = document.createElement('span');
      code.className = 'nav-item__code';
      code.setAttribute('aria-hidden', 'true');
      button.append(code);
    }
    const nextCode = `${bank}-${String(index).padStart(2, '0')}`;
    if (code.textContent !== nextCode) code.textContent = nextCode;
    if (button.classList.contains('active')) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });
}

function ensureStage(workspace) {
  let stage = workspace.querySelector(':scope > [data-v5-stage]');
  if (!stage) {
    stage = document.createElement('div');
    stage.className = 'v5-stage-main';
    stage.dataset.v5Stage = '';
    stage.innerHTML = '<div class="main__inner"></div>';
    workspace.append(stage);
  }
  const inner = stage.querySelector('.main__inner');
  const header = workspace.querySelector(':scope > .app-header');
  if (header) inner.prepend(header);
  workspace.querySelectorAll(':scope > .view').forEach((view) => inner.append(view));
}

function syncPagePresentation() {
  const active = document.querySelector('.view.active');
  const pageTitle = document.getElementById('pageTitle');
  const nextTitle = PAGE_TITLES[active?.id];
  if (pageTitle && nextTitle && pageTitle.textContent !== nextTitle) pageTitle.textContent = nextTitle;

  const overview = document.getElementById('overview');
  const hero = overview?.querySelector(':scope > .hero');
  if (overview && hero && overview.firstElementChild !== hero) overview.prepend(hero);
  const rolePanel = overview?.querySelector(':scope > #roleExperiencePanel');
  const metrics = overview?.querySelector(':scope > #overviewMetrics');
  if (rolePanel && metrics && rolePanel.previousElementSibling !== metrics) metrics.after(rolePanel);
  overview?.querySelector('#roadmap')?.closest('article')?.toggleAttribute('hidden', true);
  const releaseScope = document.getElementById('releaseScopeSummary');
  const releaseScopeCopy = 'Your assigned workspace and view filter this shared queue.';
  if (releaseScope && releaseScope.textContent !== releaseScopeCopy) {
    releaseScope.textContent = releaseScopeCopy;
  }
}

function ensureScopeSwitcher(context) {
  const controls = context?.querySelector('.shell-context-controls');
  if (!controls) return;
  const rail = document.querySelector('.sidebar.rail');
  let switcher = document.querySelector('[data-v5-scope-switcher]');
  if (!switcher) {
    switcher = document.createElement('details');
    switcher.className = 'rail-scope';
    switcher.dataset.v5ScopeSwitcher = '';
    switcher.innerHTML = `<summary class="scope-button"><span class="avatar" data-v5-scope-avatar>A</span><span class="scope-button__text"><b data-v5-scope-name>Workspace</b><span>Change workspace</span></span><svg class="icon icon--sm" viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></summary>`;
  }
  const railFoot = rail?.querySelector('.sidebar-foot');
  if (rail && switcher.parentElement !== rail) {
    if (railFoot) railFoot.before(switcher);
    else rail.append(switcher);
  }
  if (controls.parentElement !== switcher) switcher.append(controls);
  const selected = controls.querySelector('#shellWorkspaceSelect option:checked')?.textContent || 'Workspace';
  const label = selected
    .replace(/^[A-Z]\s*·\s*/u, '')
    .split('—')[0]
    .trim();
  const name = switcher.querySelector('[data-v5-scope-name]');
  const avatar = switcher.querySelector('[data-v5-scope-avatar]');
  if (name && name.textContent !== label) name.textContent = label;
  const nextAvatar = label.charAt(0).toUpperCase() || 'W';
  if (avatar && avatar.textContent !== nextAvatar) avatar.textContent = nextAvatar;
}

function arrangeTopbar(context) {
  const workspace = context?.closest('.production-workspace');
  const stage = workspace?.querySelector(':scope > [data-v5-stage]');
  if (workspace && stage && context.parentElement !== workspace) stage.before(context);
  const primary = context?.querySelector('.internal-shell-context-primary');
  const meta = context?.querySelector('.internal-shell-context-meta');
  const controls = meta?.querySelector('.signature-controls');
  const menu = controls?.querySelector('[data-signature-menu]');
  const back = controls?.querySelector('[data-signature-back]');
  if (menu && menu.parentElement !== context) context.prepend(menu);
  if (back && back.parentElement !== context) menu?.after(back);
  addClasses(primary, 'topbar__route');
  addClasses(meta, 'topbar__actions');
  ensureScopeSwitcher(context);
}

function enhanceShell() {
  const shell = document.querySelector('.app-shell');
  if (!shell) return;
  addClasses(shell, 'shell');
  const rail = shell.querySelector('.sidebar');
  addClasses(rail, 'rail');
  ensureRailBrand(rail);
  addClasses(rail?.querySelector('.brand'), 'rail__brand');
  addClasses(rail?.querySelector('#primaryNav'), 'rail__scroll');
  addClasses(rail?.querySelector('.sidebar-foot'), 'rail__foot');
  const workspace = shell.querySelector('.main');
  addClasses(workspace, 'workspace', 'production-workspace');
  addClasses(workspace?.querySelector('.app-header'), 'page-head', 'production-page-head');
  if (workspace) ensureStage(workspace);
  syncNavigationState(shell);
  syncPagePresentation();
}

function enhanceDynamicShell() {
  const context = document.querySelector('[data-internal-shell-context]');
  if (context) {
    addClasses(context, 'topbar', 'production-topbar');
    arrangeTopbar(context);
  }
  syncNavigationState();
  syncPagePresentation();
}

export function installV5ProductionFrontend() {
  document.documentElement.dataset.frontendBaseline = 'v5';
  enhanceShell();
  enhanceDynamicShell();
  const observer = new MutationObserver(() => {
    enhanceShell();
    enhanceDynamicShell();
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['class', 'hidden', 'aria-hidden'],
  });
}
