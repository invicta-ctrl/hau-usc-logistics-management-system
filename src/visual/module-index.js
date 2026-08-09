const PUBLIC_MODULES = Object.freeze([
  Object.freeze({
    group: 'Public services',
    label: 'Request Center',
    purpose: 'Send a logistics request or check its progress.',
    href: '/request',
  }),
  Object.freeze({
    group: 'Public services',
    label: 'Track a request',
    purpose: 'Use your request ID and private tracking code.',
    href: '/request#request-tracking',
  }),
  Object.freeze({
    group: 'Public services',
    label: 'Lending Center',
    purpose: 'Borrow reusable office equipment and record its return.',
    href: '/lending',
  }),
  Object.freeze({
    group: 'Public services',
    label: 'Track a loan',
    purpose: 'Use your lending reference and private tracking code.',
    href: '/lending#lending-tracking',
  }),
  Object.freeze({
    group: 'Account access',
    label: 'Apply for access',
    purpose: 'Start a staff account application.',
    href: '/register',
  }),
  Object.freeze({
    group: 'Account access',
    label: 'Application status',
    purpose: 'Check or withdraw an existing application.',
    href: '/application-status',
  }),
]);

const ROUTE_SEGMENTS = Object.freeze({
  overview: '',
  request: 'requests',
  lending: 'lending',
  release: 'release',
  restocking: 'restocking',
  procurement: 'procurement',
  inventory: 'inventory',
});

const arrowIconMarkup =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const closeIconMarkup =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';
const searchIconMarkup =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" stroke-width="1.8"/><path d="m16 16 4 4" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function staffSignInHref() {
  return document.body?.dataset.runtimeMode === 'mock' ? '/login' : 'https://logistics.hausc.org/login';
}

function publicModules() {
  return [
    ...PUBLIC_MODULES,
    {
      group: 'Account access',
      label: 'Staff sign in',
      purpose: 'Open your authorized logistics workspace.',
      href: staffSignInHref(),
    },
  ];
}

function workspaceRoot() {
  const slug = location.pathname.split('/').filter(Boolean)[0];
  return ['admin', 'director', 'food', 'inventory', 'materials'].includes(slug) ? `/${slug}` : '';
}

function navigationLabel(button) {
  const copy = button.querySelector('.nav-copy');
  if (!copy) return button.textContent.trim();
  const clone = copy.cloneNode(true);
  clone.querySelector('small')?.remove();
  return clone.textContent.trim();
}

function navigationPurpose(button) {
  return button.querySelector('.nav-copy small')?.textContent.trim() || 'Open this authorized module.';
}

function authenticatedModules() {
  const root = workspaceRoot();
  if (!root) return [];
  return [...document.querySelectorAll('#primaryNav button')]
    .filter(
      (button) =>
        !button.hidden &&
        !button.disabled &&
        button.getAttribute('aria-hidden') !== 'true' &&
        (button.dataset.view || button.dataset.adminView),
    )
    .map((button) => {
      const view = button.dataset.view;
      const segment = ROUTE_SEGMENTS[view];
      return {
        group: button.dataset.adminView ? 'Administration' : 'Your workspace',
        label: navigationLabel(button),
        purpose: navigationPurpose(button),
        href: view && segment !== undefined ? `${root}${segment ? `/${segment}` : ''}` : '',
        view,
        adminView: button.dataset.adminView,
      };
    });
}

function itemMarkup(item) {
  const content = `<span><b>${escapeHtml(item.label)}</b><span>${escapeHtml(item.purpose)}</span></span><span class="index-item__arrow">${arrowIconMarkup}</span>`;
  if (item.view || item.adminView) {
    return `<button class="index-item" type="button" data-module-index-view="${escapeHtml(item.view)}" data-module-index-admin="${escapeHtml(item.adminView)}">${content}</button>`;
  }
  return `<a class="index-item" href="${escapeHtml(item.href)}">${content}</a>`;
}

function groupedMarkup(items) {
  const groups = [...new Set(items.map((item) => item.group))];
  return groups
    .map((group) => {
      const entries = items.filter((item) => item.group === group);
      return `<section class="index-group" data-module-index-group><h2>${escapeHtml(group)}</h2><div class="index-list">${entries.map(itemMarkup).join('')}</div></section>`;
    })
    .join('');
}

function ensureDialog() {
  let dialog = document.getElementById('moduleIndexDialog');
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.id = 'moduleIndexDialog';
  dialog.className = 'module-index-dialog';
  dialog.setAttribute('aria-labelledby', 'moduleIndexTitle');
  document.body.append(dialog);
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    closeModuleIndex(dialog);
  });
  dialog.addEventListener('click', (event) => {
    if (event.target === dialog || event.target.closest('[data-module-index-close]')) {
      closeModuleIndex(dialog);
      return;
    }
    const button = event.target.closest('[data-module-index-view], [data-module-index-admin]');
    if (!button) return;
    const target = button.dataset.moduleIndexView
      ? document.querySelector(`#primaryNav [data-view="${CSS.escape(button.dataset.moduleIndexView)}"]`)
      : document.querySelector(
          `#primaryNav [data-admin-view="${CSS.escape(button.dataset.moduleIndexAdmin)}"]`,
        );
    target?.click();
    closeModuleIndex(dialog);
  });
  dialog.addEventListener('input', (event) => {
    if (!event.target.matches('[data-module-index-search]')) return;
    const query = event.target.value.trim().toLocaleLowerCase();
    let matches = 0;
    dialog.querySelectorAll('.index-item').forEach((item) => {
      const visible = !query || item.textContent.toLocaleLowerCase().includes(query);
      item.hidden = !visible;
      if (visible) matches += 1;
    });
    dialog.querySelectorAll('[data-module-index-group]').forEach((group) => {
      group.hidden = !group.querySelector('.index-item:not([hidden])');
    });
    dialog.querySelector('[data-module-index-status]').textContent =
      `${matches} destination${matches === 1 ? '' : 's'} available`;
  });
  return dialog;
}

function closeModuleIndex(dialog = document.getElementById('moduleIndexDialog')) {
  dialog?.close();
  if (location.hash === '#module-index') {
    history.replaceState(history.state, '', `${location.pathname}${location.search}`);
  }
  document.querySelector('[data-module-index-open]')?.focus({ preventScroll: true });
}

export function openModuleIndex() {
  const dialog = ensureDialog();
  const modules = [...publicModules(), ...authenticatedModules()];
  dialog.innerHTML = `<div class="index-wrap">
    <header class="module-index-head">
      <div><h1 id="moduleIndexTitle">Find a logistics module</h1><p>Open a public service or an area already available to your account.</p></div>
      <button class="icon-button" type="button" data-module-index-close aria-label="Close module index">${closeIconMarkup}</button>
    </header>
    <label class="module-index-search" for="moduleIndexSearch"><span>Search modules</span><input id="moduleIndexSearch" type="search" autocomplete="off" data-module-index-search placeholder="Request, lending, inventory..."></label>
    <p class="visually-hidden" data-module-index-status aria-live="polite">${modules.length} destinations available</p>
    ${groupedMarkup(modules)}
  </div>`;
  if (typeof dialog.showModal === 'function') dialog.showModal();
  else dialog.setAttribute('open', '');
  dialog.querySelector('[data-module-index-search]')?.focus({ preventScroll: true });
}

function bindOpeners(root = document) {
  root.querySelectorAll('[data-module-index-open]:not([data-module-index-bound])').forEach((opener) => {
    opener.dataset.moduleIndexBound = '';
    opener.addEventListener('click', (event) => {
      event.preventDefault();
      if (location.pathname === '/portals') {
        history.replaceState(history.state, '', `${location.pathname}${location.search}#module-index`);
      }
      openModuleIndex();
    });
  });
}

function installInternalOpener() {
  const meta = document.querySelector('[data-internal-shell-context] .internal-shell-context-meta');
  if (!meta || meta.querySelector('[data-module-index-open]')) return;
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'searchpill module-index-opener';
  button.dataset.moduleIndexOpen = '';
  button.innerHTML = `${searchIconMarkup}<span>Find a module</span><kbd>/</kbd>`;
  meta.prepend(button);
}

export function installModuleIndex() {
  installInternalOpener();
  bindOpeners();
  const observer = new MutationObserver(() => {
    installInternalOpener();
    bindOpeners();
    if (
      location.pathname === '/portals' &&
      location.hash === '#module-index' &&
      !document.getElementById('moduleIndexDialog')?.open
    )
      openModuleIndex();
  });
  observer.observe(document.body, { childList: true, subtree: true });
  if (location.pathname === '/portals' && location.hash === '#module-index') queueMicrotask(openModuleIndex);
  document.addEventListener('keydown', (event) => {
    if (event.key !== '/' || event.ctrlKey || event.metaKey || event.altKey) return;
    if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) return;
    if (!document.querySelector('.app-shell:not([hidden])')) return;
    event.preventDefault();
    openModuleIndex();
  });
}
