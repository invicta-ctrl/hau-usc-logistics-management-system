import { config } from './config.js';
import { createStore } from './store.js';
import { createSelectors } from './selectors.js';
import { createRouter } from './router.js';
import { MockService } from '../services/mock-service.js';
import { AppsScriptService } from '../services/apps-script-service.js';
import { RestService } from '../services/rest-service.js';
import { assertServiceContract } from '../services/service-contract.js';
import { appShell, NAV } from '../components/app-shell.js';
import { openDrawer, closeLayer } from '../components/modal.js';
import * as overview from '../features/overview/index.js';
import * as requests from '../features/requests/index.js';
import * as lending from '../features/lending/index.js';
import * as release from '../features/release/index.js';
import * as restocking from '../features/restocking/index.js';
import * as procurement from '../features/procurement/index.js';
import * as inventory from '../features/inventory/index.js';
import * as reports from '../features/reports/index.js';

const modules = { overview, requests, lending, release, restocking, procurement, inventory, reports };
const TITLES = Object.fromEntries(NAV.map(([id, title]) => [id, title]));

function createAdapter(store) {
  if (config.backendMode === 'apps-script') return new AppsScriptService();
  if (config.backendMode === 'rest') return new RestService();
  return new MockService(store);
}

export function bootstrap(host) {
  const store = createStore();
  const selectors = createSelectors();
  const service = assertServiceContract(createAdapter(store));
  const ui = {
    activeView: 'overview',
    requestDraftLines: [],
    inventoryPage: 1,
    canvassPage: 1,
    procurementTab: 'deliverables',
  };
  let requestOnly = false;

  const toast = (message, error = false) => {
    const region = host.querySelector('.toast-region');
    if (!region) return;
    const node = document.createElement('div');
    node.className = 'toast';
    if (error) node.style.background = 'var(--danger)';
    node.textContent = message;
    region.append(node);
    setTimeout(() => node.remove(), 4500);
  };

  const publicState = () => {
    const safe = selectors.sanitizedBootstrap(store.getState());
    return {
      ...safe,
      inventoryItems: safe.catalogSuggestions,
      requests: [],
      requestLines: [],
      reservations: [],
      ledgerTransactions: [],
      quotes: [],
      lendingTickets: [],
      restockRequests: [],
      restockReceipts: [],
      deliverables: [],
      deliverableReceipts: [],
      suppliers: [],
      evidenceFiles: [],
      eventTasks: [],
      auditLog: [],
      examWeeks: store.getState().examWeeks,
      demoToday: store.getState().demoToday,
      revisions: { inventory: 0 },
    };
  };

  const context = () => ({
    state: requestOnly ? publicState() : store.getState(),
    fullState: store.getState(),
    requestOnly,
    store,
    selectors,
    service,
    ui,
    toast,
    renderActive,
    navigate: (view) => router.navigate(view),
  });

  function renderShell() {
    host.innerHTML = appShell({ active: ui.activeView, requestOnly, role: store.getState().role });
    const role = host.querySelector('[data-role-switch]');
    if (role) {
      role.value = store.getState().role;
      role.addEventListener('change', () =>
        store.update(
          (state) => {
            state.role = role.value;
          },
          { views: ['active'], shared: true },
        ),
      );
    }
    host.addEventListener('click', globalClick);
    updateShared();
  }

  function updateShared() {
    const title = host.querySelector('[data-view-title]');
    if (title) title.textContent = TITLES[ui.activeView] ?? 'HAU-USC Logistics';
    host
      .querySelectorAll('[data-navigate]')
      .forEach((button) => button.toggleAttribute('aria-current', button.dataset.navigate === ui.activeView));
    const warning = host.querySelector('#global-warning');
    if (warning)
      warning.innerHTML = store.getWarning()
        ? `<div class="alert error"><div><strong>Preview state recovered</strong><p>${store.getWarning()}</p></div></div>`
        : '';
  }

  function renderActive() {
    const root = host.querySelector('#view-root');
    const module = modules[ui.activeView];
    if (!root || !module) return;
    const ctx = context();
    root.innerHTML = module.render(ctx);
    module.mount?.(ctx, root);
    updateShared();
  }

  function navigate(view) {
    if (requestOnly) view = 'requests';
    if (!modules[view]) view = 'overview';
    ui.activeView = view;
    closeLayer();
    renderActive();
    host.querySelector('#main-content')?.focus({ preventScroll: true });
  }

  function globalClick(event) {
    const nav = event.target.closest('[data-navigate]');
    if (nav) {
      router.navigate(nav.dataset.navigate);
      return;
    }
    if (event.target.closest('[data-open-more]')) openMore();
  }

  function openMore() {
    const secondary = NAV.filter(([id]) => !['overview', 'requests', 'release', 'inventory'].includes(id));
    openDrawer({
      title: 'More logistics modules',
      body: `<nav class="desktop-nav" aria-label="Additional modules">${secondary.map(([id, title, description]) => `<button type="button" data-more-nav="${id}"><strong>${title}</strong><small>${description}</small></button>`).join('')}</nav><div class="alert section-gap"><div><strong>Preview role</strong><p>${store.getState().role.replaceAll('_', ' ')} · UI visibility is not production security.</p></div></div>`,
      onMount(root, close) {
        root.querySelectorAll('[data-more-nav]').forEach((button) =>
          button.addEventListener('click', () => {
            close();
            router.navigate(button.dataset.moreNav);
          }),
        );
      },
    });
  }

  const router = createRouter({
    onNavigate(view, options) {
      const modeChanged = requestOnly !== options.requestOnly;
      requestOnly = options.requestOnly;
      ui.activeView = view;
      if (!host.querySelector('.app-shell') || modeChanged) renderShell();
      navigate(view);
    },
  });

  store.subscribe((_state, change) => {
    if (change.shared) updateShared();
    if (change.views.includes('active') || change.views.includes(ui.activeView)) renderActive();
  });
  router.start();
}
