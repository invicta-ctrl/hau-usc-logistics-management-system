import {
  applyAccounts,
  applyHealth,
  applyOperationalState,
  clearBackendViewModels,
  roleForV5,
  staffAccountActivityHistoryProjection,
  viewModelCounts,
  workspaceForV5,
} from './view-models.js';
import { createAdminParityController, renderStaffAccountActivityHistoryPanel } from './admin-parity.js';
import { createOperationsParityController } from './operations-parity.js';
import {
  createRevisionPoller,
  normalizeScopedRevisionPayload,
  revisionChanged,
} from '../../app/revision-sync.js';
import landingMediaUrl from '../assets/images/usc-facebook-cover-youth-development-day-2026.jpg?url';

const MODULE_BY_ROUTE = Object.freeze({
  'admin.overview': 'overview',
  'director.overview': 'overview',
  'food.overview': 'overview',
  'inventory.overview': 'overview',
  'materials.overview': 'overview',
  'request.queue': 'request',
  'lending.queue': 'lending',
  'lending.detail': 'lending',
  'release.desk': 'release',
  'inventory.catalog': 'inventory',
  'inventory.item': 'inventory',
  'restocking.queue': 'restocking',
  'procurement.board': 'procurement',
  'audit.activity': 'overview',
});

const PUBLIC_ROUTES = new Set([
  'index',
  'public.landing',
  'public.signin',
  'public.register',
  'public.verify',
  'public.application',
  'public.application-status',
  'public.request-intake',
  'public.request-tracking',
  'public.lending-intake',
  'public.lending-tracking',
  'public.policy',
]);

const SPECIAL_ROUTES = new Set([
  'events.series',
  'admin.access',
  'admin.directory',
  'admin.reference',
  'admin.links',
  'admin.brand',
  'account.profile',
  'owner.health',
]);

const DEFAULT_ROUTE_BY_WORKSPACE = Object.freeze({
  administrator: 'admin.overview',
  director: 'director.overview',
  food: 'food.overview',
  'inventory-pantry': 'inventory.overview',
  materials: 'materials.overview',
});

const WORKSPACE_BY_OVERVIEW_ROUTE = Object.freeze({
  'admin.overview': 'administrator',
  'director.overview': 'director',
  'food.overview': 'food',
  'inventory.overview': 'inventory-pantry',
  'materials.overview': 'materials',
});

const AUTHENTICATED_ROUTE_IDS = new Set([...Object.keys(MODULE_BY_ROUTE), ...SPECIAL_ROUTES]);

export function selectDefaultWorkspaceRoute(defaultWorkspaceId, authorizedRoutes = []) {
  const workspaceId = String(defaultWorkspaceId ?? '')
    .trim()
    .toLowerCase();
  const allowedRoutes = [
    ...new Set(
      (Array.isArray(authorizedRoutes) ? authorizedRoutes : [])
        .map((routeId) => String(routeId ?? '').trim())
        .filter((routeId) => AUTHENTICATED_ROUTE_IDS.has(routeId)),
    ),
  ];
  const mappedRoute = DEFAULT_ROUTE_BY_WORKSPACE[workspaceId];
  if (mappedRoute && allowedRoutes.includes(mappedRoute)) return mappedRoute;
  if (allowedRoutes.includes('account.profile')) return 'account.profile';
  return allowedRoutes[0] ?? 'public.signin';
}

export function isV5AuthenticationBoundaryCode(value) {
  const code = String(value ?? '')
    .trim()
    .toUpperCase();
  return code === 'SESSION_REQUIRED' || code === 'SESSION_INVALID' || code.startsWith('AUTH_');
}

export function createV5ScopedRevisionReader({
  readRevision,
  onAuthenticationBoundary,
  captureContext = () => null,
  isContextCurrent = () => true,
} = {}) {
  if (typeof readRevision !== 'function') throw new TypeError('A revision reader is required.');
  if (typeof onAuthenticationBoundary !== 'function') {
    throw new TypeError('An authentication-boundary handler is required.');
  }
  if (typeof captureContext !== 'function' || typeof isContextCurrent !== 'function') {
    throw new TypeError('Revision context guards must be functions.');
  }
  let epoch = 0;
  const guardedRead = async (...args) => {
    const readEpoch = epoch;
    const context = captureContext(...args);
    try {
      return await readRevision(...args);
    } catch (error) {
      if (isV5AuthenticationBoundaryCode(error?.code) && readEpoch === epoch && isContextCurrent(context)) {
        onAuthenticationBoundary(error);
      }
      throw error;
    }
  };
  guardedRead.invalidate = () => {
    epoch += 1;
  };
  return guardedRead;
}

export function canCommitV5RevisionRefresh({ scope, expectedRevision, returnedRevision } = {}) {
  const expectedScope = String(scope ?? '')
    .trim()
    .toLowerCase();
  return Boolean(
    expectedScope &&
    String(expectedRevision?.scope ?? '')
      .trim()
      .toLowerCase() === expectedScope &&
    String(returnedRevision?.scope ?? '')
      .trim()
      .toLowerCase() === expectedScope &&
    Number.isInteger(expectedRevision?.token) &&
    expectedRevision.token >= 0 &&
    returnedRevision?.token === expectedRevision.token,
  );
}

export function createV5AsyncBoundary({ getRoute, getAuthGeneration, isActive } = {}) {
  if (typeof getRoute !== 'function') throw new TypeError('A current route reader is required.');
  if (typeof getAuthGeneration !== 'function') {
    throw new TypeError('An authentication generation reader is required.');
  }
  if (typeof isActive !== 'function') throw new TypeError('A runtime activity reader is required.');

  let navigationGeneration = 0;
  let runtimeGeneration = 0;
  let signInGeneration = 0;
  const captureRuntime = (parent = () => true) => {
    const expectedRuntime = runtimeGeneration;
    return () => parent() && isActive() && runtimeGeneration === expectedRuntime;
  };

  return Object.freeze({
    beginRoute(expectedRoute, parent = () => true) {
      const expectedNavigation = ++navigationGeneration;
      const expectedRuntime = runtimeGeneration;
      const expectedAuth = getAuthGeneration();
      return () =>
        parent() &&
        isActive() &&
        runtimeGeneration === expectedRuntime &&
        navigationGeneration === expectedNavigation &&
        getAuthGeneration() === expectedAuth &&
        getRoute() === expectedRoute;
    },
    beginSignIn(parent = () => true) {
      const expectedSignIn = ++signInGeneration;
      const expectedNavigation = ++navigationGeneration;
      const expectedRuntime = runtimeGeneration;
      return () =>
        parent() &&
        isActive() &&
        runtimeGeneration === expectedRuntime &&
        navigationGeneration === expectedNavigation &&
        signInGeneration === expectedSignIn &&
        getRoute() === 'public.signin';
    },
    captureRuntime,
    invalidateNavigation() {
      navigationGeneration += 1;
    },
    invalidateSignIn() {
      signInGeneration += 1;
    },
    invalidateRuntime() {
      runtimeGeneration += 1;
      navigationGeneration += 1;
      signInGeneration += 1;
    },
  });
}

const ROUTE_CAPABILITY = Object.freeze({
  'admin.overview': 'view.internal',
  'director.overview': 'view.all.summary',
  'food.overview': 'view.internal',
  'inventory.overview': 'view.inventory',
  'materials.overview': 'view.internal',
  'request.queue': 'view.request',
  'lending.queue': 'view.internal',
  'lending.detail': 'view.internal',
  'release.desk': 'fulfillment.release',
  'inventory.catalog': 'view.inventory',
  'inventory.item': 'view.inventory',
  'restocking.queue': 'view.inventory',
  'procurement.board': 'view.internal',
  'events.series': 'event.manage',
  'admin.access': 'access.admin',
  'admin.directory': 'access.admin',
  'admin.reference': 'reference.manage',
  'admin.links': 'reference.manage',
  'admin.brand': 'brand.manage',
  'owner.health': 'system.diagnostics',
  'audit.activity': 'view.audit',
});

function normalizedValues(values, { lowercase = false } = {}) {
  return new Set(
    (Array.isArray(values) ? values : [])
      .map((value) => String(value ?? '').trim())
      .map((value) => (lowercase ? value.toLowerCase() : value))
      .filter(Boolean),
  );
}

export function isV5RouteAuthorized(currentRoute, capabilityValues = [], workspaceIds = []) {
  if (currentRoute === 'account.profile') return true;
  const neededCapability = ROUTE_CAPABILITY[currentRoute] ?? 'view.internal';
  if (!normalizedValues(capabilityValues).has(neededCapability)) return false;
  const requiredWorkspaceId = WORKSPACE_BY_OVERVIEW_ROUTE[currentRoute];
  return !requiredWorkspaceId || normalizedValues(workspaceIds, { lowercase: true }).has(requiredWorkspaceId);
}

const ROUTE_STATES = Object.freeze({
  'request.queue': new Set(['populated', 'loading', 'empty', 'stale', 'denied']),
  'inventory.catalog': new Set(['populated', 'loading']),
  'admin.overview': new Set(['populated', 'loading', 'empty', 'unavailable', 'denied']),
  'director.overview': new Set(['populated', 'denied']),
  'food.overview': new Set(['populated', 'denied']),
  'inventory.overview': new Set(['populated', 'denied']),
  'materials.overview': new Set(['populated', 'denied']),
  'lending.queue': new Set(['populated', 'empty']),
  'admin.access': new Set(['populated', 'denied']),
  'admin.directory': new Set(['populated', 'empty', 'denied']),
  'owner.health': new Set(['populated', 'denied']),
  'public.signin': new Set(['populated', 'loading', 'error', 'unavailable']),
  'public.request-intake': new Set(['populated', 'error']),
});

export function resolveV5RouteState(currentRoute, wanted, fallback = 'populated') {
  return ROUTE_STATES[currentRoute]?.has(wanted) ? wanted : fallback;
}

const ROUTES_WITHOUT_DATA_SLOT = new Set(['public.register']);
const ROUTE_SEARCH_LABELS = Object.freeze({
  'lending.queue': 'loans',
  'release.desk': 'releases',
});

const text = (...values) => {
  for (const value of values) {
    const normalized = String(value ?? '').trim();
    if (normalized) return normalized;
  }
  return '';
};

const PLAYGROUND_REAL_LOGIN_KEY = 'hau-usc-playground-real-login';
const RELEASE_VERSION_PATTERN =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u;

function realLoginRequested() {
  try {
    return sessionStorage.getItem(PLAYGROUND_REAL_LOGIN_KEY) === 'true';
  } catch {
    return false;
  }
}

function setRealLoginRequested(value) {
  try {
    if (value) sessionStorage.setItem(PLAYGROUND_REAL_LOGIN_KEY, 'true');
    else sessionStorage.removeItem(PLAYGROUND_REAL_LOGIN_KEY);
  } catch {
    // The server-owned environment guard remains authoritative. Storage only
    // remembers whether this browser asked to exercise the real login path.
  }
}

const route = () => location.hash.replace(/^#\/?/u, '') || 'index';
const newId = (prefix) => `${prefix}:${crypto.randomUUID()}`;

function safeMessage(error) {
  const message = text(error?.message, 'The service could not complete this action.');
  const reference = text(error?.correlationId);
  return reference ? `${message} Reference: ${reference}.` : message;
}

function setOptions(select, values, placeholder, value, label = value) {
  if (!select) return;
  const previous = select.value;
  select.replaceChildren(new Option(placeholder, ''));
  values.forEach((entry) => select.add(new Option(label(entry), value(entry))));
  if ([...select.options].some((option) => option.value === previous)) select.value = previous;
}

function setFact(root, label, value) {
  const entry = [...(root?.querySelectorAll('.facts > div') ?? [])].find(
    (node) => node.querySelector('dt')?.textContent?.trim() === label,
  );
  const valueRoot = entry?.querySelector('dd');
  if (!valueRoot) return;
  const chip = valueRoot.querySelector('.chip');
  if (chip) chip.textContent = text(value, 'Not recorded');
  else valueRoot.textContent = text(value, 'Not recorded');
}

function setPageHead({ title, lede, crumb } = {}) {
  const root = document.getElementById('surface-main');
  const heading = root?.querySelector('.page-head h1, .public__head h1');
  const summary = root?.querySelector('.page-head__title > p, .public__head > p');
  const currentCrumb = root?.querySelector('.breadcrumbs [aria-current="page"]');
  if (heading && title) heading.textContent = title;
  if (summary && lede) summary.textContent = lede;
  if (currentCrumb && crumb) currentCrumb.textContent = crumb;
}

function setTimeline(root, steps) {
  const timeline = root?.querySelector('.timeline');
  if (!timeline) return;
  timeline.replaceChildren();
  for (const step of steps) {
    const item = document.createElement('li');
    item.dataset.done = String(Boolean(step.done));
    item.dataset.current = String(Boolean(step.current));
    const marker = document.createElement('span');
    marker.className = 'timeline__dot';
    const body = document.createElement('span');
    body.className = 'timeline__body';
    const title = document.createElement('b');
    const meta = document.createElement('span');
    title.textContent = text(step.title, 'Update');
    meta.textContent = text(step.meta, 'Not recorded');
    body.append(title, meta);
    item.append(marker, body);
    timeline.append(item);
  }
}

function replaceQueueRows(root, rows) {
  const table = root?.querySelector('table.q');
  const tbody = table?.querySelector('tbody');
  const headings = [...(table?.querySelectorAll('thead th') ?? [])];
  if (!tbody) return;
  tbody.replaceChildren();
  for (const row of rows) {
    const tr = document.createElement('tr');
    row.cells.forEach((cell, index) => {
      const node = document.createElement(index === 0 ? 'th' : 'td');
      if (index === 0) {
        node.scope = 'row';
        const button = document.createElement('button');
        button.className = 'q__link';
        button.type = 'button';
        button.dataset.act = 'open-parity-actions';
        button.dataset.ref = text(row.ref);
        const title = document.createElement('b');
        const subtitle = document.createElement('span');
        title.textContent = text(cell?.title, cell, row.ref);
        subtitle.textContent = text(cell?.subtitle, row.ref);
        button.append(title, subtitle);
        node.append(button);
      } else {
        node.className = headings[index]?.className ?? '';
        if (cell?.status) {
          const chip = document.createElement('span');
          chip.className = 'chip';
          chip.textContent = text(cell.status).replaceAll('_', ' ');
          node.append(chip);
        } else {
          node.textContent = text(cell?.value, cell, 'Not recorded');
        }
      }
      tr.append(node);
    });
    tbody.append(tr);
  }
}

function normalizeRouteDecision(value) {
  return (
    {
      'Issue from Stock': 'ISSUE_FROM_STOCK',
      'Procurement Required': 'PROCUREMENT_REQUIRED',
      'Review Available Stock': 'STOCK_REVIEW',
      'Pending Decision': 'PENDING_DECISION',
    }[text(value)] ?? ''
  );
}

function firstCollection(result, ...keys) {
  if (Array.isArray(result)) return result;
  for (const key of keys) if (Array.isArray(result?.[key])) return result[key];
  return [];
}

export function createV5RevisionSync({
  readRevision,
  refresh,
  getScope,
  getSession,
  getGeneration = () => 0,
  getRoute = getScope,
  acceptedRevisions = new Map(),
  documentTarget = globalThis.document,
  windowTarget = globalThis.window,
  isOnline = () => globalThis.navigator?.onLine !== false,
  schedule,
  cancel,
  now,
  random,
} = {}) {
  if (typeof readRevision !== 'function') throw new TypeError('A revision reader is required.');
  if (typeof refresh !== 'function') throw new TypeError('A revision refresh is required.');
  if (typeof getScope !== 'function') throw new TypeError('An active revision scope is required.');
  if (typeof getSession !== 'function') throw new TypeError('An active session reader is required.');

  const currentTime = typeof now === 'function' ? now : () => Date.now();
  let started = false;
  let epoch = 0;
  let lastActiveAt = currentTime();
  const activeScope = () =>
    getSession()
      ? String(getScope() ?? '')
          .trim()
          .toLowerCase()
      : '';
  const visible = () => documentTarget?.visibilityState !== 'hidden';
  const seed = (scope, revision, { isCurrent } = {}) => {
    if (typeof isCurrent === 'function' && !isCurrent()) return false;
    const expectedScope = String(scope ?? '')
      .trim()
      .toLowerCase();
    if (!revision || revision.scope !== expectedScope || revision.token === undefined) return false;
    let normalized;
    try {
      normalized = normalizeScopedRevisionPayload(
        {
          contract: 'scoped-revision',
          contractVersion: 1,
          enabled: true,
          globalRevision: 0,
          environment: '',
          metrics: {},
          ...revision,
          scope: expectedScope,
        },
        expectedScope,
      );
    } catch {
      return false;
    }
    const accepted = acceptedRevisions.get(expectedScope);
    if (accepted && normalized.token < accepted.token) return false;
    acceptedRevisions.set(expectedScope, normalized);
    return true;
  };

  const createPoller = () =>
    createRevisionPoller({
      readRevision,
      getScope: activeScope,
      isVisible: visible,
      isOnline,
      isActive: () => {
        if (!getSession()) return false;
        if (typeof documentTarget?.hasFocus !== 'function') return true;
        return documentTarget.hasFocus() || currentTime() - lastActiveAt <= 60_000;
      },
      onRevision: async (incoming) => {
        const accepted = acceptedRevisions.get(incoming.scope);
        if (!accepted) {
          seed(incoming.scope, incoming);
          return true;
        }
        if (!revisionChanged(accepted, incoming)) return true;
        const refreshEpoch = epoch;
        const refreshGeneration = getGeneration();
        const refreshRoute = getRoute();
        const isCurrent = () =>
          epoch === refreshEpoch &&
          getGeneration() === refreshGeneration &&
          getRoute() === refreshRoute &&
          activeScope() === incoming.scope;
        if (!isCurrent()) return false;
        const refreshed = await refresh(incoming.scope, incoming, {
          epoch: refreshEpoch,
          generation: refreshGeneration,
          route: refreshRoute,
          isCurrent,
        });
        if (refreshed === false || !isCurrent()) return false;
        return !revisionChanged(acceptedRevisions.get(incoming.scope), incoming);
      },
      schedule,
      cancel,
      now,
      random,
    });
  let poller = createPoller();

  const resetPoller = () => {
    poller.stop();
    poller = createPoller();
    lastActiveAt = currentTime();
    if (started) poller.start();
  };

  const onVisibilityChange = () => {
    if (visible()) void poller.resume('visible');
    else poller.pause('hidden');
  };
  const onFocus = () => {
    lastActiveAt = currentTime();
    void poller.resume('focus');
  };
  const onOnline = () => void poller.resume('online');
  const onOffline = () => poller.pause('offline');

  return Object.freeze({
    start() {
      if (started) return;
      started = true;
      documentTarget?.addEventListener?.('visibilitychange', onVisibilityChange);
      windowTarget?.addEventListener?.('focus', onFocus);
      windowTarget?.addEventListener?.('online', onOnline);
      windowTarget?.addEventListener?.('offline', onOffline);
      poller.start();
    },
    stop() {
      if (!started) return;
      started = false;
      poller.stop();
      documentTarget?.removeEventListener?.('visibilitychange', onVisibilityChange);
      windowTarget?.removeEventListener?.('focus', onFocus);
      windowTarget?.removeEventListener?.('online', onOnline);
      windowTarget?.removeEventListener?.('offline', onOffline);
    },
    seed,
    clear() {
      epoch += 1;
      acceptedRevisions.clear();
      resetPoller();
    },
    check(reason = 'manual') {
      return poller.check(reason);
    },
    resume(reason = 'resume') {
      return poller.resume(reason);
    },
    acceptedToken(scope) {
      return acceptedRevisions.get(
        String(scope ?? '')
          .trim()
          .toLowerCase(),
      )?.token;
    },
    get inFlight() {
      return poller.inFlight;
    },
    get failures() {
      return poller.failures;
    },
  });
}

export function createV5Runtime({ backend, app }) {
  const integration = {
    session: null,
    essential: null,
    state: null,
    requestOptions: null,
    lendingCatalog: null,
    advertisements: [],
    referenceWorkspace: null,
    referenceLinks: null,
    brandAssets: null,
    accessDirectory: null,
    staffDirectory: null,
    staffAccountActivityHistory: null,
    staffAccountActivityHistoryStatus: 'idle',
    inventoryDetail: null,
    profile: null,
    selectedRequestId: '',
    selectedLoanId: '',
    selectedReleaseId: '',
    selectedInventoryId: '',
    selectedRestockId: '',
    selectedDeliverableId: '',
    selectedReleaseConfirmationId: '',
    selectedEventSeriesId: '',
    selectedEventDayId: '',
    selectedActivityId: '',
    selectedComponentId: '',
    selectedStaffActivityPersonId: '',
    activationCsrfToken: '',
    lastPublicRequest: null,
    lastPublicLending: null,
    connectedRoutes: new Set(),
    failedRoutes: new Map(),
    dynamicMedia: 'NOT_PRESENT',
    releaseIdentity: null,
    playgroundVerified: false,
    playgroundStatus: null,
    scopedRevisions: new Map(),
    routeSearch: new Map(),
    authGeneration: 0,
    started: false,
  };

  const asyncBoundary = createV5AsyncBoundary({
    getRoute: route,
    getAuthGeneration: () => integration.authGeneration,
    isActive: () => integration.started,
  });

  let authenticationBoundaryInProgress = false;
  const handleScopedRevisionAuthenticationBoundary = (error) => {
    if (authenticationBoundaryInProgress || !integration.started) return;
    authenticationBoundaryInProgress = true;
    try {
      handleAuthenticationBoundary(error);
    } finally {
      authenticationBoundaryInProgress = false;
    }
  };
  const scopedRevisionReader = createV5ScopedRevisionReader({
    readRevision: (scope) => backend.commands.getScopedRevision(scope),
    onAuthenticationBoundary: handleScopedRevisionAuthenticationBoundary,
    captureContext: (scope, request = {}) => ({
      authGeneration: integration.authGeneration,
      requestId: request.requestId,
      route: route(),
      scope: String(scope ?? '')
        .trim()
        .toLowerCase(),
    }),
    isContextCurrent: (context) =>
      integration.started &&
      Boolean(integration.session) &&
      context.authGeneration === integration.authGeneration &&
      context.route === route() &&
      context.scope === MODULE_BY_ROUTE[route()],
  });
  const revisionSync = createV5RevisionSync({
    readRevision: scopedRevisionReader,
    refresh: async (scope, incoming, { isCurrent }) => {
      const currentRoute = route();
      if (MODULE_BY_ROUTE[currentRoute] !== scope || !isCurrent()) return false;
      const committed = await loadRoute(currentRoute, {
        refresh: true,
        canCommit: isCurrent,
        expectedRevision: incoming,
      });
      return (
        committed !== false &&
        isCurrent() &&
        route() === currentRoute &&
        !revisionChanged(integration.scopedRevisions.get(scope), incoming)
      );
    },
    getScope: () => MODULE_BY_ROUTE[route()] ?? '',
    getSession: () => integration.session,
    getGeneration: () => integration.authGeneration,
    getRoute: route,
    acceptedRevisions: integration.scopedRevisions,
  });
  let signOutInFlight = null;

  function clearAuthenticatedProjection() {
    integration.session = null;
    integration.essential = null;
    integration.state = null;
    integration.accessDirectory = null;
    integration.staffDirectory = null;
    integration.staffAccountActivityHistory = null;
    integration.staffAccountActivityHistoryStatus = 'idle';
    integration.inventoryDetail = null;
    integration.profile = null;
    integration.referenceWorkspace = null;
    integration.referenceLinks = null;
    integration.brandAssets = null;
    integration.playgroundStatus = null;
    integration.activationCsrfToken = '';
    integration.selectedRequestId = '';
    integration.selectedLoanId = '';
    integration.selectedReleaseId = '';
    integration.selectedInventoryId = '';
    integration.selectedRestockId = '';
    integration.selectedDeliverableId = '';
    integration.selectedReleaseConfirmationId = '';
    integration.selectedEventSeriesId = '';
    integration.selectedEventDayId = '';
    integration.selectedActivityId = '';
    integration.selectedComponentId = '';
    integration.selectedStaffActivityPersonId = '';
    integration.connectedRoutes.clear();
    integration.failedRoutes.clear();
    integration.routeSearch.clear();
    clearBackendViewModels();
  }

  function advanceAuthGeneration({ invalidateNavigation = true } = {}) {
    integration.authGeneration += 1;
    if (invalidateNavigation) asyncBoundary.invalidateNavigation();
    scopedRevisionReader.invalidate();
    revisionSync.clear();
    clearAuthenticatedProjection();
  }

  function handleAuthenticationBoundary(error) {
    if (!isV5AuthenticationBoundaryCode(error?.code)) return false;
    const unavailable = String(error?.code ?? '').toUpperCase() === 'AUTH_SERVICE_UNAVAILABLE';
    asyncBoundary.invalidateSignIn();
    advanceAuthGeneration();
    app.integrationSetAuthorizedRoutes([]);
    app.integrationCloseOverlay();
    app.integrationGo('public.signin');
    app.integrationState.variant = unavailable ? 'unavailable' : 'populated';
    app.integrationRender();
    queueMicrotask(afterRender);
    toast(
      unavailable ? 'The sign-in service is temporarily unavailable.' : 'Your session ended. Sign in again.',
      true,
    );
    return true;
  }

  function capabilities() {
    return new Set(integration.essential?.currentUser?.authorization?.capabilities ?? []);
  }

  function allowed(currentRoute) {
    const authorization = integration.essential?.currentUser?.authorization;
    return isV5RouteAuthorized(currentRoute, authorization?.capabilities, authorization?.workspaceIds);
  }

  function authorizedRouteIds() {
    return [...new Set([...Object.keys(MODULE_BY_ROUTE), ...SPECIAL_ROUTES])].filter(allowed);
  }

  function syncAuthorizedRoutes() {
    const routeIds = authorizedRouteIds();
    app.integrationSetAuthorizedRoutes(
      routeIds,
      text(
        integration.essential?.currentUser?.displayName,
        integration.essential?.currentUser?.name,
        integration.session?.user?.displayName,
      ),
    );
  }

  function render(nextVariant) {
    const restoreMainFocus = document.activeElement?.id === 'surface-main';
    if (nextVariant) app.integrationState.variant = nextVariant;
    app.integrationRender();
    queueMicrotask(() => {
      afterRender();
      if (restoreMainFocus) document.dispatchEvent(new CustomEvent('hau:v5-focus-main'));
    });
  }

  function toast(message, error = false) {
    app.integrationToast(text(message), error ? 'error' : 'info');
  }

  function focusParityActions() {
    const actions = document.querySelector('[data-v5-parity-actions]');
    if (!actions) return false;
    actions.scrollIntoView({ behavior: 'smooth', block: 'start' });
    actions.querySelector('button,input,select,textarea')?.focus({ preventScroll: true });
    return true;
  }

  function applyRouteSearch(currentRoute) {
    const label = ROUTE_SEARCH_LABELS[currentRoute];
    if (!label) return;
    const root = document.getElementById('surface-main');
    const search = root?.querySelector(`[data-v5-route-search="${currentRoute}"]`);
    const status = root?.querySelector(`[data-v5-route-search-status="${currentRoute}"]`);
    const rows = [...(root?.querySelectorAll('table.q tbody tr') ?? [])];
    const query = text(search?.value, integration.routeSearch.get(currentRoute)).toLowerCase();
    integration.routeSearch.set(currentRoute, query);
    let visible = 0;
    for (const row of rows) {
      const matches = !query || text(row.textContent).toLowerCase().includes(query);
      row.hidden = !matches;
      if (matches) visible += 1;
    }
    if (!status) return;
    if (!rows.length) status.textContent = `No authorized ${label} are available.`;
    else if (!visible) status.textContent = `No authorized ${label} match the current search.`;
    else status.textContent = `${visible} of ${rows.length} authorized ${label} shown.`;
  }

  function bindRouteSearch(currentRoute) {
    if (!ROUTE_SEARCH_LABELS[currentRoute]) return;
    const root = document.getElementById('surface-main');
    const search = root?.querySelector(`[data-v5-route-search="${currentRoute}"]`);
    if (!search) return;
    search.value = integration.routeSearch.get(currentRoute) ?? '';
    applyRouteSearch(currentRoute);
  }

  const selection = () => ({
    selectedRequestId: integration.selectedRequestId,
    selectedLoanId: integration.selectedLoanId,
    selectedReleaseId: integration.selectedReleaseId,
    selectedInventoryId: integration.selectedInventoryId,
    selectedRestockId: text(integration.selectedRestockId, integration.state?.restockRequests?.[0]?.id),
    selectedDeliverableId: text(integration.selectedDeliverableId, integration.state?.deliverables?.[0]?.id),
    selectedReleaseConfirmationId: text(
      integration.selectedReleaseConfirmationId,
      integration.state?.releaseConfirmations?.[0]?.id,
    ),
    selectedEventSeriesId: text(integration.selectedEventSeriesId, integration.state?.eventSeries?.[0]?.id),
    selectedEventDayId: text(integration.selectedEventDayId, integration.state?.eventDays?.[0]?.id),
    selectedActivityId: text(
      integration.selectedActivityId,
      integration.state?.events?.[0]?.id,
      integration.state?.eventActivities?.[0]?.id,
    ),
    selectedComponentId: text(
      integration.selectedComponentId,
      integration.state?.compositeComponents?.[0]?.id,
      integration.state?.foodComponents?.[0]?.id,
      integration.state?.materialsComponents?.[0]?.id,
    ),
  });

  const refreshCurrentRoute = () => loadRoute(route(), { refresh: true });
  const operationsParity = createOperationsParityController({
    backend,
    app,
    getState: () => integration.state ?? {},
    getSelection: selection,
    getCapabilities: capabilities,
    refresh: refreshCurrentRoute,
    toast,
  });
  const adminParity = createAdminParityController({
    backend,
    app,
    getState: () => app.integrationState,
    getIntegration: () => integration,
    getCapabilities: capabilities,
    refresh: refreshCurrentRoute,
    toast,
  });

  function persistentReceipt(message) {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const node = document.createElement('div');
    node.className = 'toast';
    node.setAttribute('role', 'status');
    node.textContent = message;
    region.append(node);
  }

  async function ensureAuthenticated({ canCommit = () => true } = {}) {
    if (!canCommit()) return false;
    const pendingSignOut = signOutInFlight;
    if (pendingSignOut) {
      await pendingSignOut;
      if (!canCommit()) return false;
    }
    if (integration.session && integration.state) return true;
    let session = await backend.session();
    if (!canCommit()) return false;
    if (!session && integration.playgroundVerified && !realLoginRequested()) {
      const issued = await backend.playgroundSession();
      if (!canCommit()) return false;
      session = issued?.user ? issued : null;
    }
    if (!session) return false;
    const boot = await backend.bootstrap();
    if (!canCommit()) return false;
    integration.session = session;
    integration.essential = boot.essential;
    integration.state = boot.state;
    app.integrationState.role = roleForV5(boot.essential.currentUser);
    app.integrationState.workspace = workspaceForV5(boot.essential.currentUser);
    syncAuthorizedRoutes();
    return true;
  }

  async function loadModule(currentRoute, module, { canCommit = () => true, expectedRevision = null } = {}) {
    const loaded = await backend.module(integration.state, module);
    if (!canCommit()) return false;
    let nextState = loaded.state;
    const returnedRevision = nextState.scopeRevisions?.[module];
    if (
      expectedRevision &&
      !canCommitV5RevisionRefresh({ scope: module, expectedRevision, returnedRevision })
    ) {
      return false;
    }
    const selectedRequestId = text(integration.selectedRequestId, nextState.requests?.[0]?.id);
    const selectedLoanId = text(integration.selectedLoanId, nextState.lendingTickets?.[0]?.id);
    const selectedReleaseId = text(integration.selectedReleaseId, nextState.requests?.[0]?.id);
    const selectedInventoryId = text(integration.selectedInventoryId, nextState.inventoryItems?.[0]?.id);
    let inventoryDetail = integration.inventoryDetail;
    if (currentRoute === 'inventory.item' && selectedInventoryId) {
      inventoryDetail = await backend.api.getInventoryItem({
        itemId: selectedInventoryId,
      });
      if (!canCommit()) return false;
      const detailItem = inventoryDetail?.item;
      nextState = {
        ...nextState,
        inventoryItems: detailItem
          ? [
              ...nextState.inventoryItems.filter(
                (item) => text(item.id, item.itemId) !== selectedInventoryId,
              ),
              detailItem,
            ]
          : nextState.inventoryItems,
        ledgerTransactions: firstCollection(inventoryDetail, 'ledgerTransactions', 'movements', 'ledger'),
      };
    }
    if (!canCommit()) return false;
    integration.state = nextState;
    integration.selectedRequestId = selectedRequestId;
    integration.selectedLoanId = selectedLoanId;
    integration.selectedReleaseId = selectedReleaseId;
    integration.selectedInventoryId = selectedInventoryId;
    if (currentRoute === 'inventory.item') integration.inventoryDetail = inventoryDetail;
    revisionSync.seed(module, nextState.scopeRevisions?.[module], { isCurrent: canCommit });
    applyOperationalState(integration.state, {
      selectedRequestId: integration.selectedRequestId,
      selectedInventoryId: integration.selectedInventoryId,
    });
    integration.connectedRoutes.add(currentRoute);
    integration.failedRoutes.delete(currentRoute);
    return loaded.response;
  }

  async function loadSpecial(currentRoute, { canCommit = () => true } = {}) {
    if (currentRoute === 'events.series') {
      const result = await backend.commands.getEventManagement({});
      if (!canCommit()) return false;
      const nextState = {
        ...integration.state,
        eventSeries: firstCollection(result, 'eventSeries', 'series'),
        eventDays: firstCollection(result, 'eventDays', 'days'),
        events: firstCollection(result, 'events', 'activities'),
      };
      if (!canCommit()) return false;
      integration.state = nextState;
      applyOperationalState(nextState, {
        selectedRequestId: integration.selectedRequestId,
        selectedInventoryId: integration.selectedInventoryId,
      });
    } else if (currentRoute === 'admin.access') {
      const result = await backend.api.listAccessAccounts({ limit: 100, offset: 0 });
      if (!canCommit()) return false;
      integration.accessDirectory = result;
      applyAccounts(result);
    } else if (currentRoute === 'admin.directory') {
      const result = await backend.api.listCanonicalStaffDirectory({ page: 1, pageSize: 25 });
      if (!canCommit()) return false;
      integration.staffDirectory = result;
    } else if (currentRoute === 'admin.reference') {
      const result = await backend.commands.getReferenceAdminWorkspace({
        domain: 'VENUES',
        status: 'ALL',
        limit: 100,
      });
      if (!canCommit()) return false;
      integration.referenceWorkspace = result;
    } else if (currentRoute === 'admin.links') {
      const result = await backend.api.listReferenceLinks({ page: 1, pageSize: 100 });
      if (!canCommit()) return false;
      integration.referenceLinks = result;
    } else if (currentRoute === 'admin.brand') {
      const result = await backend.api.listBrandAssets({});
      if (!canCommit()) return false;
      integration.brandAssets = result;
    } else if (currentRoute === 'account.profile') {
      const result = await backend.profile();
      if (!canCommit()) return false;
      integration.profile = result;
    } else if (currentRoute === 'owner.health') {
      const [health, readiness, version, evidence] = await Promise.all([
        backend.health(),
        backend.readiness(),
        backend.version(),
        backend.api.getEvidenceSystemStatus({}).catch(() => null),
      ]);
      if (!canCommit()) return false;
      applyHealth({ health, readiness, version, evidence });
    }
    if (!canCommit()) return false;
    integration.connectedRoutes.add(currentRoute);
    return true;
  }

  async function loadAdvertisements({ canCommit = () => true } = {}) {
    const result = await backend.publicAdvertisements();
    if (!canCommit()) return false;
    const advertisements = firstCollection(result, 'items', 'advertisements');
    const mediaUrl = text(advertisements[0]?.mediaUrl, advertisements[0]?.imageUrl);
    let dynamicMedia = 'NOT_PRESENT';
    if (mediaUrl) {
      dynamicMedia = await new Promise((resolve) => {
        const image = new Image();
        image.addEventListener('load', () => resolve('PASS'), { once: true });
        image.addEventListener('error', () => resolve('FAIL'), { once: true });
        image.src = mediaUrl;
      });
    }
    if (!canCommit()) return false;
    integration.advertisements = advertisements;
    integration.dynamicMedia = dynamicMedia;
    integration.connectedRoutes.add('public.landing');
    return true;
  }

  async function verifyPlaygroundContext({ canCommit = () => true } = {}) {
    let releaseIdentity = null;
    let playgroundVerified = false;
    try {
      const [identity, health] = await Promise.all([backend.version(), backend.health()]);
      releaseIdentity = identity;
      const appVersion = text(identity?.appVersion);
      const releaseVersion = text(identity?.releaseVersion);
      const candidateSha = text(identity?.candidateSha);
      playgroundVerified = Boolean(
        identity?.ok === true &&
        identity?.playground === true &&
        String(identity?.environment ?? '').toUpperCase() === 'STAGING' &&
        health?.ok === true &&
        String(health?.environment ?? '').toUpperCase() === 'STAGING' &&
        health?.database?.connected === true &&
        health?.dependencies?.d1 === true &&
        health?.dependencies?.brandAssets === true &&
        health?.dependencies?.evidenceAssets === true &&
        RELEASE_VERSION_PATTERN.test(appVersion) &&
        appVersion === releaseVersion &&
        /^[0-9a-f]{40}$/u.test(candidateSha),
      );
    } catch {
      releaseIdentity = null;
      playgroundVerified = false;
    }
    if (!canCommit()) return false;
    integration.releaseIdentity = releaseIdentity;
    integration.playgroundVerified = playgroundVerified;
    app.integrationSetPlaygroundContext(
      integration.playgroundVerified,
      integration.playgroundVerified ? integration.releaseIdentity : null,
    );
    return true;
  }

  async function loadPublic(currentRoute, { canCommit = () => true } = {}) {
    if (!canCommit()) return false;
    if (currentRoute === 'index' && integration.playgroundVerified) {
      const authenticated = await ensureAuthenticated({ canCommit });
      if (!canCommit()) return false;
      if (authenticated && capabilities().has('system.admin')) {
        const playgroundStatus = await backend.playgroundStatus();
        if (!canCommit()) return false;
        integration.playgroundStatus = playgroundStatus;
      }
    }
    if (currentRoute === 'public.landing') {
      return loadAdvertisements({ canCommit });
    }
    if (currentRoute === 'public.request-intake') {
      if (!integration.requestOptions) {
        const requestOptions = await backend.publicRequestOptions();
        if (!canCommit()) return false;
        integration.requestOptions = requestOptions;
      }
      if (!canCommit()) return false;
      integration.connectedRoutes.add(currentRoute);
    }
    if (currentRoute === 'public.lending-intake') {
      if (!integration.lendingCatalog) {
        const lendingCatalog = await backend.publicLendingCatalog();
        if (!canCommit()) return false;
        integration.lendingCatalog = lendingCatalog;
      }
      if (!canCommit()) return false;
      integration.connectedRoutes.add(currentRoute);
    }
    return canCommit();
  }

  async function loadRoute(
    currentRoute = route(),
    { refresh = false, canCommit: parentCanCommit = () => true, expectedRevision = null } = {},
  ) {
    const canCommit = asyncBoundary.beginRoute(currentRoute, parentCanCommit);
    try {
      if (!canCommit()) return false;
      if (PUBLIC_ROUTES.has(currentRoute)) {
        const committed = await loadPublic(currentRoute, { canCommit });
        if (committed === false || !canCommit()) return false;
        afterRender();
        return true;
      }
      const authenticated = await ensureAuthenticated({ canCommit });
      if (!canCommit()) return false;
      if (!authenticated) {
        app.integrationGo('public.signin');
        return true;
      }
      if (!allowed(currentRoute)) {
        integration.failedRoutes.set(currentRoute, 'DENIED');
        render(resolveV5RouteState(currentRoute, 'denied'));
        return true;
      }
      if (ROUTES_WITHOUT_DATA_SLOT.has(currentRoute)) {
        integration.failedRoutes.set(currentRoute, 'PROTOTYPE_ONLY_UNSUPPORTED');
        afterRender();
        return true;
      }
      const loading = resolveV5RouteState(currentRoute, 'loading', 'populated');
      if (loading === 'loading' && !expectedRevision) render('loading');
      const module = MODULE_BY_ROUTE[currentRoute];
      if (module) {
        const committed = await loadModule(currentRoute, module, {
          refresh,
          canCommit,
          expectedRevision: refresh ? expectedRevision : null,
        });
        if (committed === false || !canCommit()) return false;
      } else if (SPECIAL_ROUTES.has(currentRoute)) {
        const committed = await loadSpecial(currentRoute, { canCommit });
        if (committed === false || !canCommit()) return false;
      } else return false;
      if (!canCommit()) return false;
      const counts = viewModelCounts();
      const empty =
        (currentRoute === 'request.queue' && counts.requests === 0) ||
        (currentRoute === 'lending.queue' && counts.loans === 0) ||
        (currentRoute === 'admin.overview' && counts.requests + counts.inventory === 0);
      render(resolveV5RouteState(currentRoute, empty ? 'empty' : 'populated'));
      return true;
    } catch (error) {
      if (!canCommit()) return false;
      if (handleAuthenticationBoundary(error)) return false;
      if (expectedRevision) return false;
      integration.failedRoutes.set(currentRoute, text(error?.code, 'SERVICE_ERROR'));
      if (currentRoute === 'public.signin') render(resolveV5RouteState(currentRoute, 'unavailable'));
      else if (PUBLIC_ROUTES.has(currentRoute)) render(resolveV5RouteState(currentRoute, 'error'));
      else render(resolveV5RouteState(currentRoute, 'denied'));
      toast(safeMessage(error), true);
      return false;
    }
  }

  function bindAnnouncement() {
    const item = integration.advertisements[0];
    if (!item) return;
    const section = document.querySelector('.landing-updates');
    const hero = document.querySelector('.landing-hero');
    const heroTitle = hero?.querySelector('h1');
    const heroSummary = hero?.querySelector('.landing-hero__content > p');
    const heroLink = hero?.querySelector('.landing-link');
    const heading = section?.querySelector('h2');
    const summary = section?.querySelector('p:not(.eyebrow)');
    const link = section?.querySelector('a');
    const title = text(item.title);
    const description = text(item.description, item.summary, item.body);
    const target = text(item.destinationUrl, item.url, item.targetUrl);
    const callToAction = text(item.callToAction, 'View official page');
    if (hero) hero.dataset.eventActive = 'true';
    if (heroTitle && title) heroTitle.textContent = title;
    if (heroSummary && description) heroSummary.textContent = description;
    if (heroLink) {
      heroLink.firstChild.textContent = callToAction;
      if (/^https:\/\//u.test(target)) heroLink.href = target;
    }
    if (heading && title) heading.textContent = title;
    if (summary && description) summary.textContent = description;
    if (link) {
      link.firstChild.textContent = callToAction;
      if (/^https:\/\//u.test(target)) link.href = target;
    }
    const mediaUrl = text(item.mediaUrl, item.imageUrl);
    const media = document.querySelector('.landing-hero__media');
    if (media && mediaUrl && (/^\//u.test(mediaUrl) || /^https:\/\//u.test(mediaUrl))) {
      media.src = mediaUrl;
      media.alt = text(item.altText, item.title);
    }
  }

  function syncRequestPurpose() {
    const form = document.getElementById('request-center-form');
    if (!form) return;
    const event = form.elements.requestPurpose?.value === 'EVENT_ACTIVITY_SUPPORT';
    const office = form.elements.requestPurpose?.value === 'OFFICE_INVENTORY_PANTRY';
    const eventFields = [
      ...form.querySelectorAll('[data-request-event-field]'),
      form.elements.startDate?.closest('label'),
      form.elements.endDate?.closest('label'),
    ].filter(Boolean);
    const officeFields = [...form.querySelectorAll('[data-request-office-field]')];
    eventFields.forEach((label) => {
      label.hidden = !event;
      label.querySelectorAll('input,select').forEach((control) => {
        control.disabled = !event;
        control.required = event;
      });
    });
    officeFields.forEach((label) => {
      label.hidden = !office;
      label.querySelectorAll('input,select').forEach((control) => {
        control.disabled = !office;
        control.required = office;
      });
    });
  }

  function syncRequestEvents() {
    const form = document.getElementById('request-center-form');
    if (!form || !integration.requestOptions) return;
    const seriesId = form.elements.eventSeries?.value;
    setOptions(
      form.elements.event,
      firstCollection(integration.requestOptions, 'events').filter(
        (event) => text(event.seriesId, event.eventSeriesId) === seriesId,
      ),
      seriesId ? 'Select Sub-event' : 'Select Event first',
      (event) => text(event.id),
      (event) => text(event.name, event.code, event.id),
    );
    form.elements.event.disabled = !seriesId;
  }

  function bindPublicRequest() {
    const form = document.getElementById('request-center-form');
    if (!form || !integration.requestOptions) return;
    setOptions(
      form.elements.eventSeries,
      firstCollection(integration.requestOptions, 'eventSeries'),
      'Select Event',
      (series) => text(series.id),
      (series) => text(series.name, series.code, series.id),
    );
    setOptions(
      form.elements.stockArea,
      firstCollection(integration.requestOptions, 'stockAreas'),
      'Select stock area',
      (area) => text(area),
    );
    const additional = app.integrationState.requestType === 'ADDITIONAL';
    form.querySelectorAll('[data-request-parent-wrap] input').forEach((control) => {
      control.disabled = !additional;
      control.required = additional;
    });
    syncRequestEvents();
    syncRequestPurpose();
  }

  function syncLendingBorrower() {
    const form = document.querySelector('#surface-main form.form-grid');
    if (!form || route() !== 'public.lending-intake') return;
    const staff = ['USC officer', 'USC staff'].includes(form.elements.k?.value);
    const selected = Boolean(form.elements.k?.value);
    for (const name of ['courseYear', 'academicDepartment']) {
      const control = form.elements[name];
      if (!control) continue;
      control.disabled = !selected || staff;
      control.required = selected && !staff;
      const wrapper = control.closest('label,.field');
      if (wrapper) wrapper.hidden = selected && staff;
    }
    const department = form.elements.uscDepartment;
    if (department) {
      department.disabled = !selected || !staff;
      department.required = selected && staff;
      const wrapper = department.closest('label,.field');
      if (wrapper) wrapper.hidden = selected && !staff;
    }
  }

  function bindPublicLending() {
    const form = document.querySelector('#surface-main form.form-grid');
    const catalog = integration.lendingCatalog;
    if (!form || !catalog) return;
    setOptions(
      form.elements.i,
      firstCollection(catalog, 'items'),
      'Select item',
      (item) => text(item.id),
      (item) => text(item.name, item.productId, item.id),
    );
    setOptions(
      form.elements.uscDepartment,
      firstCollection(catalog, 'uscDepartments'),
      'Select department',
      (department) => text(department),
    );
    syncLendingBorrower();
  }

  function bindRequestDetail() {
    const request = integration.state?.requests?.find(
      (entry) => text(entry.id, entry.requestId) === integration.selectedRequestId,
    );
    if (!request) return;
    document.querySelectorAll('.split__detail, .drawer').forEach((root) => {
      const heading = root.querySelector('.detail__title h2');
      const summary = root.querySelector('.detail__head > p');
      if (heading) heading.textContent = text(request.purpose, request.title, request.id);
      if (summary)
        summary.textContent = `${text(request.id)} · ${text(request.requesterGroup, request.organization, request.requesterName)} · needed ${text(request.neededDate, request.dateStart, 'Not set')}`;
      const status = root.querySelector('.detail__title .chip');
      if (status) status.textContent = text(request.status, 'FOR_REVIEW').replaceAll('_', ' ');
      setFact(root, 'Event', text(request.eventName, request.eventId, 'Not linked'));
      setFact(root, 'Committee', text(request.ownerCommitteeId, request.committeeId, 'Unassigned'));
      setFact(root, 'Submitted', text(request.createdAt)?.slice(0, 10));
      setFact(root, 'Lines routed', `${viewModelCounts().requestLines} loaded`);
      const evidence = root.querySelector('.evidence');
      if (evidence) evidence.replaceChildren();
    });
  }

  function bindLoanDetail() {
    const loan = integration.state?.lendingTickets?.find(
      (entry) => text(entry.id, entry.ticketId) === integration.selectedLoanId,
    );
    if (!loan) return;
    const item = integration.state?.inventoryItems?.find(
      (entry) => text(entry.id, entry.itemId) === text(loan.itemId, loan.item_id),
    );
    const id = text(loan.id, loan.ticketId);
    const title = text(loan.itemName, item?.name, loan.itemId, id);
    const borrower = text(loan.borrowerName, loan.borrowerGroup, 'Borrower');
    setPageHead({ title, lede: `Loan ${id} · ${borrower}`, crumb: id });
    const root = document.getElementById('surface-main');
    setFact(root, 'Status', text(loan.status, 'FOR_REVIEW'));
    setFact(root, 'Return by', text(loan.dueDate, loan.returnBy)?.slice(0, 10));
    setFact(root, 'Borrower type', text(loan.borrowerType, loan.borrowerGroup, 'Not recorded'));
    setFact(root, 'Quantity', `${Number(loan.quantity ?? 0)} ${text(loan.unit, item?.unit, 'piece')}`);
    setFact(root, 'Handed over', text(loan.handedOffAt)?.slice(0, 10));
    setFact(root, 'Condition at handoff', text(loan.conditionOut, 'Not recorded'));
    const noticeTitle = root?.querySelector('.notice b');
    if (noticeTitle) {
      noticeTitle.textContent = `Loan status: ${text(loan.status, 'FOR_REVIEW').replaceAll('_', ' ')}`;
    }
    setTimeline(root, [
      { title: 'Requested', meta: text(loan.createdAt)?.slice(0, 10), done: true },
      { title: 'Approved', meta: text(loan.approvedAt)?.slice(0, 10), done: Boolean(loan.approvedAt) },
      {
        title: 'Handed over',
        meta: text(loan.handedOffAt)?.slice(0, 10),
        done: Boolean(loan.handedOffAt),
      },
      {
        title: 'Current state',
        meta: text(loan.status, 'FOR_REVIEW').replaceAll('_', ' '),
        current: true,
      },
      { title: 'Returned', meta: text(loan.returnedAt)?.slice(0, 10), done: Boolean(loan.returnedAt) },
    ]);
  }

  function bindReleaseDetail() {
    const request = integration.state?.requests?.find(
      (entry) => text(entry.id, entry.requestId) === integration.selectedReleaseId,
    );
    if (!request) return;
    const lines =
      integration.state?.requestLines?.filter(
        (line) => text(line.requestId, line.request_id) === integration.selectedReleaseId,
      ) ?? [];
    const total = lines.reduce((sum, line) => sum + Number(line.requestedQuantity ?? line.quantity ?? 0), 0);
    const released = lines.reduce(
      (sum, line) => sum + Number(line.releasedQuantity ?? line.quantityReleased ?? 0),
      0,
    );
    const remaining = Math.max(0, total - released);
    const root = document.getElementById('surface-main');
    const heading = [...(root?.querySelectorAll('.section__head h2') ?? [])].at(-1);
    if (heading) heading.textContent = `Record a release · ${integration.selectedReleaseId}`;
    setFact(root, 'Reserved', `${total} units`);
    setFact(root, 'Already released', `${released} units`);
    setFact(root, 'Remaining', `${remaining} units`);
    setFact(
      root,
      'Recipient',
      text(request.requesterGroup, request.organization, request.requesterName, 'Requester'),
    );
    const quantity = document.getElementById('rel-q');
    const recipient = document.getElementById('rel-c');
    if (quantity) {
      quantity.max = String(remaining);
      quantity.value = String(Math.min(remaining, Math.max(1, Number(quantity.value) || 1)));
    }
    if (recipient) {
      recipient.value = text(request.requesterGroup, request.organization, request.requesterName);
    }
  }

  function bindInventoryDetail() {
    const item = integration.state?.inventoryItems?.find(
      (entry) => text(entry.id, entry.itemId) === integration.selectedInventoryId,
    );
    if (!item) return;
    const id = text(item.id, item.itemId);
    const unit = text(item.unit, 'piece');
    const onHand = Number(item.onHand ?? item.quantityOnHand ?? 0);
    const reserved = Number(item.reserved ?? item.reservedQuantity ?? 0);
    setPageHead({
      title: text(item.name, item.itemName, id),
      lede: `${text(item.category, 'Unclassified')} · ${text(item.handling, item.handlingCode, 'Unverified')} · ${id}`,
      crumb: id,
    });
    const root = document.getElementById('surface-main');
    setFact(root, 'On hand', `${onHand} ${unit}`);
    setFact(root, 'Reserved', `${reserved} ${unit}`);
    setFact(root, 'Available', `${Number(item.availableToPromise ?? onHand - reserved)} ${unit}`);
    setFact(root, 'Condition', text(item.condition, 'Not recorded'));
    setFact(root, 'Lending audience', text(item.lendingAudience, 'Not recorded').replaceAll('_', ' '));
    setFact(root, 'Last counted', text(item.lastCountedAt)?.slice(0, 10));
    const caption = root?.querySelector('table.ledger caption');
    if (caption) caption.textContent = `Append-only movement history for ${id}.`;
  }

  async function loadStaffAccountActivityHistory(personId) {
    const canonicalPersonId = text(personId);
    if (!canonicalPersonId || route() !== 'admin.directory' || !allowed('admin.directory')) return;
    const expectedGeneration = integration.authGeneration;
    integration.selectedStaffActivityPersonId = canonicalPersonId;
    integration.staffAccountActivityHistory = null;
    integration.staffAccountActivityHistoryStatus = 'loading';
    render();
    try {
      const result = await backend.api.listStaffAccountActivityHistory({
        personId: canonicalPersonId,
        page: 1,
        pageSize: 25,
      });
      if (
        !integration.started ||
        expectedGeneration !== integration.authGeneration ||
        route() !== 'admin.directory' ||
        integration.selectedStaffActivityPersonId !== canonicalPersonId
      ) {
        return;
      }
      integration.staffAccountActivityHistory = staffAccountActivityHistoryProjection(result);
      integration.staffAccountActivityHistoryStatus = 'loaded';
    } catch {
      if (
        !integration.started ||
        expectedGeneration !== integration.authGeneration ||
        route() !== 'admin.directory' ||
        integration.selectedStaffActivityPersonId !== canonicalPersonId
      ) {
        return;
      }
      integration.staffAccountActivityHistory = null;
      integration.staffAccountActivityHistoryStatus = 'error';
    }
    render();
  }

  function bindDirectory() {
    const result = integration.staffDirectory;
    if (!result) return;
    const people = firstCollection(result, 'items');
    const root = document.getElementById('surface-main');
    setFact(root, 'Canonical people', String(Number(result.total ?? people.length)));
    setFact(
      root,
      'Quarantined records',
      String(people.filter((entry) => text(entry.linkState) === 'QUARANTINED').length),
    );
    setFact(
      root,
      'Active assignments',
      String(people.reduce((total, entry) => total + Number(entry.assignmentSummary?.activeCount ?? 0), 0)),
    );
    setFact(root, 'Directory state', people.length ? 'Loaded' : 'No canonical people');
    const body = root?.querySelector('[data-canonical-staff-directory] tbody');
    renderStaffAccountActivityHistoryPanel(root?.querySelector('[data-staff-account-activity-history]'), {
      status: integration.staffAccountActivityHistoryStatus,
      history: integration.staffAccountActivityHistory,
    });
    if (!body) return;
    body.replaceChildren();
    for (const person of people) {
      const row = document.createElement('tr');
      const identity = document.createElement('th');
      identity.scope = 'row';
      identity.textContent = text(person.personId, 'Not recorded');
      const account = document.createElement('td');
      account.textContent =
        text(person.displayName) && text(person.accessId)
          ? `${text(person.displayName)} · ${text(person.accessId)}`
          : 'Not linked';
      const link = document.createElement('td');
      link.textContent = text(person.linkState, 'UNLINKED').replaceAll('_', ' ');
      const email = document.createElement('td');
      email.textContent = text(person.emailState, 'NONE').replaceAll('_', ' ');
      const assignments = document.createElement('td');
      assignments.textContent = String(Number(person.assignmentSummary?.activeCount ?? 0));
      const activity = document.createElement('td');
      const activityButton = document.createElement('button');
      activityButton.className = 'btn btn--quiet';
      activityButton.type = 'button';
      activityButton.dataset.act = 'load-staff-account-activity-history';
      activityButton.dataset.personId = text(person.personId);
      activityButton.textContent = 'View history';
      activity.append(activityButton);
      row.append(identity, account, link, email, assignments, activity);
      body.append(row);
    }
  }

  function bindReferenceAdmin() {
    const items = firstCollection(integration.referenceWorkspace, 'items', 'records', 'rows');
    replaceQueueRows(
      document.getElementById('surface-main'),
      items.map((item) => ({
        ref: text(item.id),
        cells: [
          {
            title: text(item.payload?.displayName, item.displayName, item.id),
            subtitle: text(item.domain),
          },
          { value: String(Number(item.revision ?? 0)) },
          { status: text(item.status, 'ACTIVE') },
        ],
      })),
    );
  }

  function bindReferenceLinks() {
    const items = firstCollection(integration.referenceLinks, 'items', 'links', 'rows');
    replaceQueueRows(
      document.getElementById('surface-main'),
      items.map((item) => ({
        ref: text(item.id, item.key),
        cells: [
          {
            title: text(item.label, item.name, item.key, item.id),
            subtitle: text(item.description, item.route),
          },
          { value: text(item.usedBy, item.route, item.targetType, 'Not recorded') },
          { status: text(item.status, 'ACTIVE') },
        ],
      })),
    );
  }

  function bindBrandAssets() {
    const slots = firstCollection(integration.brandAssets, 'slots', 'items', 'assets');
    replaceQueueRows(
      document.getElementById('surface-main'),
      slots.map((slot) => ({
        ref: text(slot.slot, slot.id, slot.key),
        cells: [
          {
            title: text(slot.label, slot.name, slot.slot, slot.id),
            subtitle: text(slot.description, slot.usage),
          },
          { value: String(Number(slot.publishedVersion ?? slot.version ?? slot.currentVersion ?? 0)) },
          { value: text(slot.publishedAt, slot.updatedAt, 'Not published').slice(0, 10) },
          { status: text(slot.status, slot.state, 'ACTIVE') },
        ],
      })),
    );
  }

  function bindProfile() {
    const profile = integration.profile?.profile ?? integration.profile;
    if (!profile) return;
    const root = document.getElementById('surface-main');
    setFact(root, 'Role', text(profile.roleLabel, profile.role, integration.essential?.currentUser?.role));
    setFact(
      root,
      'Scope',
      text(profile.scopeLabel, integration.essential?.currentUser?.authorization?.scopeMode),
    );
    setFact(
      root,
      'Committee',
      text(profile.committee, integration.essential?.currentUser?.committee, 'Not applicable'),
    );
    setFact(root, 'Account state', text(profile.status, profile.accountStatus, 'ACTIVE'));
  }

  function bindPublicTracking() {
    const result = integration.lastPublicRequest;
    const request = result?.request ?? result;
    const id = text(request?.id, result?.requestId);
    const root = document.getElementById('surface-main');
    if (!id) {
      const heading = root?.querySelector('h1');
      const summary = root?.querySelector('.public__head > p');
      const status = root?.querySelector('.chip');
      if (heading) heading.textContent = 'Request tracking';
      if (summary) summary.textContent = 'Open this route from a verified request lookup.';
      if (status) status.textContent = 'NOT LOADED';
      setTimeline(root, [
        { title: 'Private tracking required', meta: 'No request record is loaded', current: true },
      ]);
      return;
    }
    const heading = root?.querySelector('h1');
    if (heading) heading.textContent = `Request ${id}`;
    const currentStatus = text(request?.status, result?.status, 'FOR_REVIEW');
    const status = root?.querySelector('.chip');
    if (status) status.textContent = currentStatus.replaceAll('_', ' ');
    const summary = root?.querySelector(
      '.public__head > p, .page-head p, .track-summary p, .detail__head > p',
    );
    if (summary) {
      summary.textContent = `${text(request?.requestPurpose, request?.requestType, 'Request')} · last updated ${text(request?.updatedAt, result?.updatedAt, 'not reported')}`;
    }
    setFact(root, 'Request', id);
    setFact(root, 'Status', currentStatus.replaceAll('_', ' '));
    setFact(root, 'Purpose', text(request?.requestPurpose, request?.requestType, 'Not reported'));
    const history = firstCollection(result, 'statusHistory', 'history', 'timeline');
    setTimeline(
      root,
      history.length
        ? history.map((entry, index) => ({
            title: text(entry.status, entry.action, 'Status update').replaceAll('_', ' '),
            meta: text(entry.at, entry.changedAt, entry.createdAt),
            done: index < history.length - 1,
            current: index === history.length - 1,
          }))
        : [{ title: currentStatus.replaceAll('_', ' '), meta: 'Current request status', current: true }],
    );
  }

  function bindPublicLendingTracking() {
    const result = integration.lastPublicLending;
    const submission = result?.submission ?? result;
    const id = text(submission?.submissionId, submission?.id, result?.submissionId);
    const root = document.getElementById('surface-main');
    if (!id) {
      const heading = root?.querySelector('h1');
      const summary = root?.querySelector('.public__head > p');
      const status = root?.querySelector('.chip');
      if (heading) heading.textContent = 'Loan tracking';
      if (summary) summary.textContent = 'Open this route from a verified lending lookup.';
      if (status) status.textContent = 'NOT LOADED';
      setTimeline(root, [
        { title: 'Private tracking required', meta: 'No lending record is loaded', current: true },
      ]);
      return;
    }
    const heading = root?.querySelector('h1');
    if (heading) heading.textContent = `Loan ${id}`;
    const currentStatus = text(submission?.status, result?.status, 'FOR_REVIEW');
    const status = root?.querySelector('.chip');
    if (status) status.textContent = currentStatus.replaceAll('_', ' ');
    const lines = firstCollection(result, 'lines', 'items');
    const quantity = lines.reduce((sum, line) => sum + Number(line.quantity ?? 0), 0);
    const summary = root?.querySelector(
      '.public__head > p, .page-head p, .track-summary p, .detail__head > p',
    );
    if (summary) {
      summary.textContent = `${lines.length} lending line${lines.length === 1 ? '' : 's'} · ${quantity} unit${quantity === 1 ? '' : 's'}`;
    }
    setFact(root, 'Submission', id);
    setFact(root, 'Status', currentStatus.replaceAll('_', ' '));
    setFact(root, 'Items', `${lines.length} line${lines.length === 1 ? '' : 's'}`);
    const history = firstCollection(result, 'history', 'statusHistory', 'timeline');
    setTimeline(
      root,
      history.length
        ? history.map((entry, index) => ({
            title: text(entry.status, entry.action, 'Status update').replaceAll('_', ' '),
            meta: text(entry.at, entry.changedAt, entry.createdAt),
            done: index < history.length - 1,
            current: index === history.length - 1,
          }))
        : [{ title: currentStatus.replaceAll('_', ' '), meta: 'Current lending status', current: true }],
    );
  }

  function bindPlaygroundIndex() {
    const status = integration.playgroundStatus;
    const root = document.getElementById('surface-main');
    if (!root || !status?.playground || root.querySelector('[data-v5-playground-status]')) return;
    const section = document.createElement('section');
    section.className = 'panel';
    section.dataset.v5PlaygroundStatus = '';
    section.dataset.v5ParityActions = '';
    section.innerHTML = `<div class="panel__body">
      <div class="section__head"><div><span class="label">Private operator surface</span><h2>Playground status and recovery</h2></div></div>
      <dl class="facts">
        <div><dt>Candidate</dt><dd data-playground-value="candidate"></dd></div>
        <div><dt>Production</dt><dd data-playground-value="production"></dd></div>
        <div><dt>Clean baseline</dt><dd data-playground-value="baseline"></dd></div>
        <div><dt>Schema</dt><dd data-playground-value="schema"></dd></div>
        <div><dt>D1 baseline parity</dt><dd data-playground-value="d1"></dd></div>
        <div><dt>R2 baseline parity</dt><dd data-playground-value="r2"></dd></div>
        <div><dt>Working state</dt><dd data-playground-value="working"></dd></div>
        <div><dt>Last reset</dt><dd data-playground-value="reset"></dd></div>
      </dl>
      <form class="form-grid" data-v5-playground-operation>
        <label class="field">Confirmation phrase<input name="confirmation" autocomplete="off" required /></label>
        <label class="request-ack"><input type="checkbox" name="discardActiveSession" /><span><b>Discard active test session</b><small>Required to refresh the baseline while a valuable manual test session is active or dirty.</small></span></label>
        <div class="page-head__actions">
          <button class="btn btn--primary" type="submit" name="kind" value="RESET">Reset Workspace</button>
          <button class="btn" type="submit" name="kind" value="REFRESH_BASELINE">Refresh Baseline From Production</button>
          <button class="btn btn--quiet" type="button" data-act="test-real-login">Test Real Login Flow</button>
        </div>
        <p role="status" data-playground-operation-result></p>
      </form>
    </div>`;
    const values = {
      candidate: `${text(status.candidate?.version)} · ${text(status.candidate?.commit)} · artifact ${text(status.candidate?.artifact)}`,
      production: `${text(status.production?.version)} · ${text(status.production?.identity)}`,
      baseline: `${text(status.cleanBaseline?.sourceProductionVersion)} · captured ${text(status.cleanBaseline?.capturedAt, 'not reported')}`,
      schema: `production ${text(status.production?.schema)} · baseline ${text(status.cleanBaseline?.schema)} · working ${text(status.workingSchema?.version)}`,
      d1: text(status.d1BaselineParity),
      r2: text(status.r2BaselineParity),
      working: `${text(status.workingState)}${status.activeTestSession ? ' · active test session protected' : ''}`,
      reset: text(status.lastReset, 'Not reported'),
    };
    Object.entries(values).forEach(([key, value]) => {
      const target = section.querySelector(`[data-playground-value="${key}"]`);
      if (target) target.textContent = value;
    });
    root.append(section);
  }

  function afterRender() {
    const currentRoute = route();
    if (currentRoute === 'index') bindPlaygroundIndex();
    if (currentRoute === 'public.landing') {
      const media = document.querySelector('.landing-hero__media');
      if (media) {
        media.src = landingMediaUrl;
        media.alt = 'USC Youth Development Day 2026 official cover';
      }
      bindAnnouncement();
    }
    if (
      currentRoute === 'public.signin' &&
      integration.playgroundVerified &&
      realLoginRequested() &&
      !document.querySelector('[data-act="resume-playground"]')
    ) {
      const card = document.querySelector('.auth-card');
      const resume = document.createElement('button');
      resume.className = 'btn btn--quiet';
      resume.type = 'button';
      resume.dataset.act = 'resume-playground';
      resume.textContent = 'Resume unlocked playground';
      card?.append(resume);
    }
    if (currentRoute === 'public.request-intake') bindPublicRequest();
    if (currentRoute === 'public.lending-intake') bindPublicLending();
    if (currentRoute === 'request.queue') bindRequestDetail();
    if (currentRoute === 'lending.detail') bindLoanDetail();
    if (currentRoute === 'release.desk') bindReleaseDetail();
    if (currentRoute === 'inventory.item') bindInventoryDetail();
    if (currentRoute === 'admin.directory') bindDirectory();
    if (currentRoute === 'admin.reference') bindReferenceAdmin();
    if (currentRoute === 'admin.links') bindReferenceLinks();
    if (currentRoute === 'admin.brand') bindBrandAssets();
    if (currentRoute === 'account.profile') bindProfile();
    if (currentRoute === 'public.request-tracking') bindPublicTracking();
    if (currentRoute === 'public.lending-tracking') bindPublicLendingTracking();
    if (currentRoute === 'public.application-status') {
      const root = document.getElementById('surface-main');
      const summary = root?.querySelector('.public__head > p');
      if (summary) summary.textContent = 'A private status token is required to load an application.';
      setTimeline(root, [
        {
          title: 'Application not loaded',
          meta: 'Use the protected status link issued after submission',
          current: true,
        },
      ]);
    }
    adminParity.afterRender();
    if (app.integrationState.variant !== 'denied') operationsParity.afterRender();
    bindRouteSearch(currentRoute);
  }

  function resolveRequestLine(line) {
    const options = integration.requestOptions ?? {};
    const category = text(line.category);
    const description = text(line.description);
    const item = firstCollection(options, 'items').find((candidate) =>
      [candidate.id, candidate.name]
        .map((value) => text(value).toLowerCase())
        .includes(description.toLowerCase()),
    );
    const reference = firstCollection(options, 'references').find((candidate) =>
      [candidate.id, candidate.name]
        .map((value) => text(value).toLowerCase())
        .includes(description.toLowerCase()),
    );
    return {
      category,
      description,
      specification: text(line.specification),
      quantity: Number(line.quantity),
      unit: text(line.unit),
      ...(category === 'Inventory Item' && item ? { itemId: item.id } : {}),
      ...(['Venue / Facility', 'Logistics / Equipment'].includes(category) && reference
        ? { referenceId: reference.id }
        : {}),
    };
  }

  async function submitPublicRequest() {
    const form = document.getElementById('request-center-form');
    if (!form?.reportValidity()) return;
    if (!app.integrationState.requestDraft.length) {
      toast('Add at least one requested item.', true);
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    const button = form.querySelector('[data-act="request-submit"]');
    button.disabled = true;
    try {
      let related = {};
      if (app.integrationState.requestType === 'ADDITIONAL') {
        const verified = await backend.relatedPublicRequest({
          requestId: values.parentRequestId,
          trackingCode: values.parentTrackingCode,
        });
        related =
          values.requestPurpose === 'EVENT_ACTIVITY_SUPPORT'
            ? { originalRequestId: verified.reference.id }
            : { relatedRequestId: verified.reference.id };
      }
      const result = await backend.submitPublicRequest({
        clientRequestId: newId('public-request'),
        requestPurpose: values.requestPurpose,
        requesterName: values.requesterName,
        requesterType: values.requesterType,
        organization: values.organization,
        email: values.email,
        contactNumber: values.contactNumber,
        eventSeriesId: values.eventSeries,
        eventId: values.event,
        startDate: values.startDate,
        endDate: values.endDate,
        stockArea: values.stockArea,
        neededDate: values.neededDate,
        purpose: values.purpose,
        ...related,
        dataUseAcknowledged: values.dataUseAcknowledged === 'on',
        acceptableUseAcknowledged: values.acceptableUseAcknowledged === 'on',
        evidenceConsentAcknowledged: values.evidenceConsentAcknowledged === 'on',
        lines: app.integrationState.requestDraft.map(resolveRequestLine),
      });
      integration.lastPublicRequest = result;
      integration.connectedRoutes.add('public.request-intake');
      form.querySelectorAll('input,select,textarea,button').forEach((control) => {
        control.disabled = true;
      });
      persistentReceipt(
        `Request ${result.requestId} was submitted. Private tracking code: ${result.trackingCode}. Save both values now.`,
      );
    } catch (error) {
      button.disabled = false;
      app.integrationState.variant = 'error';
      render('error');
      toast(safeMessage(error), true);
    }
  }

  async function trackPublicRequest(form = document.querySelector('#request-track-panel form')) {
    if (!form?.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    try {
      integration.lastPublicRequest = await backend.trackPublicRequest({
        requestId: text(values.requestSearch, values.ref),
        trackingCode: values.trackingCode,
      });
      integration.connectedRoutes.add('public.request-tracking');
      form.elements.trackingCode.value = '';
      app.integrationGo('public.request-tracking');
      app.integrationState.variant = 'populated';
      app.integrationRender();
      queueMicrotask(afterRender);
    } catch (error) {
      form.elements.trackingCode.value = '';
      toast(safeMessage(error), true);
    }
  }

  async function trackPublicLending(form) {
    if (!form?.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    try {
      integration.lastPublicLending = await backend.trackPublicLending({
        submissionId: values.submissionId,
        trackingCode: values.trackingCode,
      });
      integration.connectedRoutes.add('public.lending-tracking');
      form.elements.trackingCode.value = '';
      app.integrationGo('public.lending-tracking');
      app.integrationState.variant = 'populated';
      app.integrationRender();
      queueMicrotask(afterRender);
    } catch (error) {
      form.elements.trackingCode.value = '';
      toast(safeMessage(error), true);
    }
  }

  async function submitPublicLending(form) {
    if (!form.reportValidity()) return;
    if (form.elements.ev?.files?.length) {
      toast(
        'Direct public evidence upload is not accepted by the current contract. Present approved identity evidence at handoff.',
        true,
      );
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    const button = form.querySelector('[type="submit"]');
    button.disabled = true;
    try {
      const borrowerType = ['USC officer', 'USC staff'].includes(values.k) ? 'USC_STAFF' : 'ANGELITE';
      const responsibility = values.borrowerResponsibilityAcknowledged === 'on';
      const result = await backend.submitPublicLending({
        clientRequestId: newId('public-lending'),
        borrowerType,
        borrowerName: values.borrowerName,
        studentId: values.studentId,
        courseYear: values.courseYear,
        academicDepartment: values.academicDepartment,
        uscDepartment: values.uscDepartment,
        contactNumber: values.contactNumber,
        email: values.email,
        purpose: values.purpose,
        pickupDate: values.pickupDate,
        dueDate: values.r,
        responsibilityAcknowledged: responsibility,
        dataUseAcknowledged: values.dataUseAcknowledged === 'on',
        acceptableUseAcknowledged: values.acceptableUseAcknowledged === 'on',
        borrowerResponsibilityAcknowledged: responsibility,
        evidenceConsentAcknowledged: values.evidenceConsentAcknowledged === 'on',
        lines: [{ itemId: values.i, quantity: Number(values.quantity) }],
      });
      integration.lastPublicLending = result;
      integration.connectedRoutes.add('public.lending-intake');
      form.querySelectorAll('input,select,textarea,button').forEach((control) => {
        control.disabled = true;
      });
      persistentReceipt(
        `Submission ${result.submissionId} was recorded. Private tracking code: ${result.trackingCode}. Save both values now.`,
      );
    } catch (error) {
      button.disabled = false;
      toast(safeMessage(error), true);
    }
  }

  async function signIn(form) {
    const values = Object.fromEntries(new FormData(form));
    const canCommit = asyncBoundary.beginSignIn();
    if (!canCommit()) return;
    render('loading');
    try {
      const pendingSignOut = signOutInFlight;
      if (pendingSignOut) {
        await pendingSignOut;
        if (!canCommit()) return;
      }
      const result = await backend.login(values.u, values.p);
      if (!canCommit()) return;
      if (result?.state === 'ACTIVATION_REQUIRED' && result.csrfToken) {
        integration.session = null;
        advanceAuthGeneration({ invalidateNavigation: false });
        if (!canCommit()) return;
        integration.activationCsrfToken = result.csrfToken;
        integration.routeSearch.clear();
        render('populated');
        toast('Starter account verified. Complete activation below.');
        return;
      }
      if (!result?.user) {
        if (!canCommit()) return;
        render('error');
        return;
      }
      integration.routeSearch.clear();
      advanceAuthGeneration({ invalidateNavigation: false });
      if (!canCommit()) return;
      integration.session = result;
      setRealLoginRequested(false);
      integration.activationCsrfToken = '';
      const expectedAuthGeneration = integration.authGeneration;
      const canCommitSession = () => canCommit() && integration.authGeneration === expectedAuthGeneration;
      const authenticated = await ensureAuthenticated({ canCommit: canCommitSession });
      if (!authenticated || !canCommitSession()) return;
      app.integrationGo(
        selectDefaultWorkspaceRoute(
          integration.essential?.currentUser?.authorization?.defaultWorkspaceId,
          authorizedRouteIds(),
        ),
      );
    } catch (error) {
      if (!canCommit()) return;
      const code = String(error?.code ?? '').toUpperCase();
      if (code === 'SESSION_REQUIRED' || code === 'SESSION_INVALID') {
        handleAuthenticationBoundary(error);
        return;
      }
      render(error?.code === 'AUTH_SERVICE_UNAVAILABLE' ? 'unavailable' : 'error');
    }
  }

  async function signOut() {
    asyncBoundary.invalidateSignIn();
    advanceAuthGeneration();
    const expectedAuthGeneration = integration.authGeneration;
    app.integrationSetAuthorizedRoutes([]);
    app.integrationCloseOverlay();
    const logout = backend.logout().then(
      () => true,
      () => false,
    );
    signOutInFlight = logout;
    app.integrationGo('public.signin');
    const confirmed = await logout;
    if (signOutInFlight === logout) signOutInFlight = null;
    if (!confirmed && integration.started && integration.authGeneration === expectedAuthGeneration) {
      toast('The local session ended, but the server could not confirm sign out.', true);
    }
  }

  async function requestPlaygroundOperation(form, kind) {
    if (!form?.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    const result = form.querySelector('[data-playground-operation-result]');
    const button = form.querySelector(`[name="kind"][value="${kind}"]`);
    if (button) button.disabled = true;
    try {
      const response = await backend.requestPlaygroundOperation({
        kind,
        confirmation: values.confirmation,
        discardActiveSession: values.discardActiveSession === 'on',
      });
      if (result)
        result.textContent = `${response.state}. Safe operator reference ${response.operationReference}.`;
      integration.playgroundStatus = await backend.playgroundStatus();
      document.querySelector('[data-v5-playground-status]')?.remove();
      bindPlaygroundIndex();
    } catch (error) {
      if (result) result.textContent = safeMessage(error);
    } finally {
      if (button) button.disabled = false;
    }
  }

  async function acceptRequest() {
    const requestId = integration.selectedRequestId;
    const selects = [...document.querySelectorAll('[aria-label="Routing decision"]')];
    const lines =
      integration.state?.requestLines?.filter(
        (line) => text(line.requestId, line.request_id) === requestId,
      ) ?? [];
    const decisions = selects.map((select, index) => ({
      lineId: text(lines[index]?.id, lines[index]?.requestLineId),
      decision: normalizeRouteDecision(select.value),
    }));
    if (
      !requestId ||
      decisions.length !== lines.length ||
      decisions.some((entry) => !entry.lineId || entry.decision === 'PENDING_DECISION')
    ) {
      toast('Choose a route for every line before submitting.', true);
      return;
    }
    try {
      await backend.commands.reviewRequest(
        requestId,
        'ACCEPT',
        'Accepted from the V5 request review queue.',
        decisions,
      );
      app.integrationCloseOverlay();
      await loadRoute('request.queue', { refresh: true });
      toast(`${requestId} was accepted and routed.`);
    } catch (error) {
      toast(safeMessage(error), true);
    }
  }

  function onClick(event) {
    const searchReset = event.target?.closest?.('[data-v5-route-search-reset]');
    if (searchReset) {
      event.preventDefault?.();
      event.stopImmediatePropagation?.();
      const searchRoute = text(searchReset.dataset.v5RouteSearchReset);
      if (ROUTE_SEARCH_LABELS[searchRoute]) {
        integration.routeSearch.delete(searchRoute);
        const search = document.querySelector(`[data-v5-route-search="${searchRoute}"]`);
        if (search) {
          search.value = '';
          search.focus?.();
        }
        applyRouteSearch(searchRoute);
      }
      return;
    }
    if (adminParity.onClick(event) || operationsParity.onClick(event)) return;
    const target = event.target.closest('[data-act]');
    if (!target) return;
    const action = target.dataset.act;
    if (action === 'open-parity-actions') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!focusParityActions()) {
        toast('No governed action is available for this record and role.', true);
      }
      return;
    }
    if (action === 'load-staff-account-activity-history') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void loadStaffAccountActivityHistory(target.dataset.personId);
      return;
    }
    if (action === 'test-real-login') {
      event.preventDefault();
      event.stopImmediatePropagation();
      setRealLoginRequested(true);
      void signOut();
      return;
    }
    if (action === 'resume-playground') {
      event.preventDefault();
      event.stopImmediatePropagation();
      setRealLoginRequested(false);
      asyncBoundary.invalidateSignIn();
      integration.session = null;
      integration.routeSearch.clear();
      advanceAuthGeneration();
      app.integrationGo('index');
      return;
    }
    if (action === 'request-submit') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void submitPublicRequest();
      return;
    }
    if (action === 'request-track') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void trackPublicRequest();
      return;
    }
    if (route() !== 'public.verify' && target.textContent?.trim() === 'Sign out') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void signOut();
      return;
    }
    if (action === 'refresh') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void loadRoute(route(), { refresh: true })
        .then(() => revisionSync.check('manual'))
        .then(() => toast('Current authorized data loaded.'));
      return;
    }
    if (action === 'confirm-accept') {
      event.preventDefault();
      event.stopImmediatePropagation();
      const pending = [...document.querySelectorAll('[aria-label="Routing decision"]')].some(
        (select) => normalizeRouteDecision(select.value) === 'PENDING_DECISION',
      );
      if (pending) toast('Choose a route for every line before submitting.', true);
      else app.integrationOpenOverlay('confirm');
      return;
    }
    if (action === 'confirm-done') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void acceptRequest();
      return;
    }
    if (['confirm-return', 'confirm-release'].includes(action)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      toast(
        'This V5 control does not collect the complete governed command and remains non-destructive.',
        true,
      );
      return;
    }
    if (action === 'select:request') {
      integration.selectedRequestId = text(target.dataset.ref);
      applyOperationalState(integration.state ?? {}, {
        selectedRequestId: integration.selectedRequestId,
        selectedInventoryId: integration.selectedInventoryId,
      });
      queueMicrotask(() => render());
    }
    if (action === 'select:release') {
      integration.selectedReleaseId = text(target.dataset.ref);
      const frame = document.querySelector('.frame');
      const narrow = (frame ? frame.clientWidth : window.innerWidth) < 1181;
      if (narrow) {
        event.preventDefault();
        event.stopImmediatePropagation();
        queueMicrotask(afterRender);
        return;
      }
      queueMicrotask(afterRender);
    }
    if (action === 'go:lending.detail') integration.selectedLoanId = text(target.dataset.ref);
    if (action === 'go:inventory.item') integration.selectedInventoryId = text(target.dataset.ref);
  }

  function onChange(event) {
    const control = event.target;
    if (control.matches('[aria-label="Routing decision"]')) {
      const index = [...document.querySelectorAll('[aria-label="Routing decision"]')].indexOf(control);
      const lines =
        integration.state?.requestLines?.filter(
          (line) => text(line.requestId, line.request_id) === integration.selectedRequestId,
        ) ?? [];
      if (lines[index]) lines[index].fulfillmentSource = normalizeRouteDecision(control.value);
      return;
    }
    if (control.matches('[name="requestPurpose"]')) syncRequestPurpose();
    if (control.matches('[name="eventSeries"]')) {
      event.stopImmediatePropagation();
      syncRequestEvents();
    }
    if (control.matches('[name="k"]')) syncLendingBorrower();
  }

  function onInput(event) {
    const search = event.target?.closest?.('[data-v5-route-search]');
    if (!search) return;
    const searchRoute = text(search.dataset.v5RouteSearch);
    if (!ROUTE_SEARCH_LABELS[searchRoute]) return;
    integration.routeSearch.set(searchRoute, text(search.value).toLowerCase());
    applyRouteSearch(searchRoute);
  }

  function onSubmit(event) {
    if (adminParity.onSubmit(event) || operationsParity.onSubmit(event)) return;
    const form = event.target;
    const currentRoute = route();
    if (form.matches('[data-v5-playground-operation]')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      void requestPlaygroundOperation(form, event.submitter?.value);
    } else if (currentRoute === 'public.signin') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void signIn(form);
    } else if (currentRoute === 'public.lending-intake') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void submitPublicLending(form);
    } else if (currentRoute === 'public.request-tracking') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void trackPublicRequest(form);
    } else if (currentRoute === 'public.lending-tracking') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void trackPublicLending(form);
    } else if (currentRoute === 'public.register') {
      event.preventDefault();
      event.stopImmediatePropagation();
      toast(
        'Direct public account creation is unsupported. Use the verified account application flow.',
        true,
      );
    } else if (currentRoute === 'public.application') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!focusParityActions()) toast('The verified application form is unavailable.', true);
    } else if (currentRoute === 'account.profile') {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (!focusParityActions()) toast('The governed profile controls are unavailable.', true);
    }
  }

  async function start() {
    if (integration.started) return integration;
    integration.started = true;
    const canCommit = asyncBoundary.captureRuntime();
    document.addEventListener('click', onClick, true);
    document.addEventListener('change', onChange, true);
    document.addEventListener('input', onInput, true);
    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('hau:v5-rendered', afterRender);
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('beforeunload', stop, { once: true });
    const contextCommitted = await verifyPlaygroundContext({ canCommit });
    if (contextCommitted === false || !canCommit()) return integration;
    await loadRoute();
    if (!canCommit()) return integration;
    revisionSync.start();
    return integration;
  }

  async function onHashChange() {
    const loaded = await loadRoute();
    if (loaded === false) return;
    await revisionSync.resume('scope-change');
  }

  function stop() {
    if (!integration.started) return;
    integration.started = false;
    asyncBoundary.invalidateRuntime();
    scopedRevisionReader.invalidate();
    revisionSync.stop();
    revisionSync.clear();
    document.removeEventListener('click', onClick, true);
    document.removeEventListener('change', onChange, true);
    document.removeEventListener('input', onInput, true);
    document.removeEventListener('submit', onSubmit, true);
    document.removeEventListener('hau:v5-rendered', afterRender);
    window.removeEventListener('hashchange', onHashChange);
    window.removeEventListener('beforeunload', stop);
  }

  return Object.freeze({
    start,
    stop,
    loadRoute,
    afterRender,
    status() {
      return {
        currentRoute: route(),
        authenticated: Boolean(integration.session),
        connectedRoutes: [...integration.connectedRoutes].sort(),
        failedRoutes: Object.fromEntries(integration.failedRoutes),
        counts: viewModelCounts(),
        dynamicMedia: integration.dynamicMedia,
        playgroundVerified: integration.playgroundVerified,
      };
    },
  });
}
