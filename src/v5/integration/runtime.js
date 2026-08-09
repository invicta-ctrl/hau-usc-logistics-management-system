import {
  applyAccounts,
  applyHealth,
  applyOperationalState,
  roleForV5,
  viewModelCounts,
  workspaceForV5,
} from './view-models.js';

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

const ROUTE_CAPABILITY = Object.freeze({
  'request.queue': 'view.request',
  'inventory.catalog': 'view.inventory',
  'inventory.item': 'view.inventory',
  'admin.access': 'access.admin',
  'admin.directory': 'access.admin',
  'admin.reference': 'reference.manage',
  'admin.links': 'reference.manage',
  'admin.brand': 'brand.manage',
  'owner.health': 'system.diagnostics',
  'audit.activity': 'view.audit',
});

const ROUTE_STATES = Object.freeze({
  'request.queue': new Set(['populated', 'loading', 'empty', 'stale', 'denied']),
  'inventory.catalog': new Set(['populated', 'loading']),
  'admin.overview': new Set(['populated', 'loading', 'empty', 'unavailable']),
  'lending.queue': new Set(['populated', 'empty']),
  'admin.access': new Set(['populated', 'denied']),
  'owner.health': new Set(['populated', 'denied']),
  'public.signin': new Set(['populated', 'loading', 'error', 'unavailable']),
  'public.request-intake': new Set(['populated', 'error']),
});

const ROUTES_WITHOUT_DATA_SLOT = new Set(['public.register']);

const text = (...values) => {
  for (const value of values) {
    const normalized = String(value ?? '').trim();
    if (normalized) return normalized;
  }
  return '';
};

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
        button.dataset.act = 'noop';
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
    inventoryDetail: null,
    profile: null,
    selectedRequestId: '',
    selectedLoanId: '',
    selectedReleaseId: '',
    selectedInventoryId: '',
    lastPublicRequest: null,
    lastPublicLending: null,
    connectedRoutes: new Set(),
    failedRoutes: new Map(),
    dynamicMedia: 'NOT_PRESENT',
    started: false,
  };

  function capabilities() {
    return new Set(integration.essential?.currentUser?.authorization?.capabilities ?? []);
  }

  function allowed(currentRoute) {
    const needed = ROUTE_CAPABILITY[currentRoute] ?? 'view.internal';
    return currentRoute === 'account.profile' || capabilities().has(needed);
  }

  function render(nextVariant) {
    if (nextVariant) app.integrationState.variant = nextVariant;
    app.integrationRender();
    queueMicrotask(afterRender);
  }

  function routeState(currentRoute, wanted, fallback = 'populated') {
    return ROUTE_STATES[currentRoute]?.has(wanted) ? wanted : fallback;
  }

  function toast(message, error = false) {
    app.integrationToast(text(message), error ? 'error' : 'info');
  }

  function persistentReceipt(message) {
    const region = document.getElementById('toast-region');
    if (!region) return;
    const node = document.createElement('div');
    node.className = 'toast';
    node.setAttribute('role', 'status');
    node.textContent = message;
    region.append(node);
  }

  async function ensureAuthenticated() {
    if (integration.session && integration.state) return true;
    integration.session = await backend.session();
    if (!integration.session) return false;
    const boot = await backend.bootstrap();
    integration.essential = boot.essential;
    integration.state = boot.state;
    app.integrationState.role = roleForV5(boot.essential.currentUser);
    app.integrationState.workspace = workspaceForV5(boot.essential.currentUser);
    return true;
  }

  async function loadModule(currentRoute, module) {
    const loaded = await backend.module(integration.state, module);
    integration.state = loaded.state;
    if (!integration.selectedRequestId) {
      integration.selectedRequestId = text(integration.state.requests?.[0]?.id);
    }
    if (!integration.selectedLoanId) {
      integration.selectedLoanId = text(integration.state.lendingTickets?.[0]?.id);
    }
    if (!integration.selectedReleaseId) {
      integration.selectedReleaseId = text(integration.state.requests?.[0]?.id);
    }
    if (!integration.selectedInventoryId) {
      integration.selectedInventoryId = text(integration.state.inventoryItems?.[0]?.id);
    }
    if (currentRoute === 'inventory.item' && integration.selectedInventoryId) {
      integration.inventoryDetail = await backend.api.getInventoryItem({
        itemId: integration.selectedInventoryId,
      });
      const detailItem = integration.inventoryDetail?.item;
      integration.state = {
        ...integration.state,
        inventoryItems: detailItem
          ? [
              ...integration.state.inventoryItems.filter(
                (item) => text(item.id, item.itemId) !== integration.selectedInventoryId,
              ),
              detailItem,
            ]
          : integration.state.inventoryItems,
        ledgerTransactions: firstCollection(
          integration.inventoryDetail,
          'ledgerTransactions',
          'movements',
          'ledger',
        ),
      };
    }
    applyOperationalState(integration.state, {
      selectedRequestId: integration.selectedRequestId,
      selectedInventoryId: integration.selectedInventoryId,
    });
    integration.connectedRoutes.add(currentRoute);
    integration.failedRoutes.delete(currentRoute);
    return loaded.response;
  }

  async function loadSpecial(currentRoute) {
    if (currentRoute === 'events.series') {
      const result = await backend.commands.getEventManagement({});
      integration.state = {
        ...integration.state,
        eventSeries: firstCollection(result, 'eventSeries', 'series'),
        eventDays: firstCollection(result, 'eventDays', 'days'),
        events: firstCollection(result, 'events', 'activities'),
      };
      applyOperationalState(integration.state, {
        selectedRequestId: integration.selectedRequestId,
        selectedInventoryId: integration.selectedInventoryId,
      });
    } else if (currentRoute === 'admin.access' || currentRoute === 'admin.directory') {
      const result = await backend.api.listAccessAccounts({ limit: 100, offset: 0 });
      integration.accessDirectory = result;
      applyAccounts(result);
    } else if (currentRoute === 'admin.reference') {
      integration.referenceWorkspace = await backend.commands.getReferenceAdminWorkspace({
        domain: 'VENUES',
        status: 'ALL',
        limit: 100,
      });
    } else if (currentRoute === 'admin.links') {
      integration.referenceLinks = await backend.api.listReferenceLinks({ page: 1, pageSize: 100 });
    } else if (currentRoute === 'admin.brand') {
      integration.brandAssets = await backend.api.listBrandAssets({});
    } else if (currentRoute === 'account.profile') {
      integration.profile = await backend.profile();
    } else if (currentRoute === 'owner.health') {
      const [health, readiness, version, evidence] = await Promise.all([
        backend.health(),
        backend.readiness(),
        backend.version(),
        backend.api.getEvidenceSystemStatus({}).catch(() => null),
      ]);
      applyHealth({ health, readiness, version, evidence });
    }
    integration.connectedRoutes.add(currentRoute);
  }

  async function loadAdvertisements() {
    const result = await backend.publicAdvertisements();
    integration.advertisements = firstCollection(result, 'items', 'advertisements');
    integration.connectedRoutes.add('public.landing');
    const mediaUrl = text(integration.advertisements[0]?.mediaUrl, integration.advertisements[0]?.imageUrl);
    if (mediaUrl) {
      integration.dynamicMedia = await new Promise((resolve) => {
        const image = new Image();
        image.addEventListener('load', () => resolve('PASS'), { once: true });
        image.addEventListener('error', () => resolve('FAIL'), { once: true });
        image.src = mediaUrl;
      });
    }
  }

  async function loadPublic(currentRoute) {
    if (currentRoute === 'public.landing') await loadAdvertisements();
    if (currentRoute === 'public.request-intake') {
      integration.requestOptions ??= await backend.publicRequestOptions();
      integration.connectedRoutes.add(currentRoute);
    }
    if (currentRoute === 'public.lending-intake') {
      integration.lendingCatalog ??= await backend.publicLendingCatalog();
      integration.connectedRoutes.add(currentRoute);
    }
  }

  async function loadRoute(currentRoute = route(), { refresh = false } = {}) {
    try {
      if (PUBLIC_ROUTES.has(currentRoute)) {
        await loadPublic(currentRoute);
        afterRender();
        return;
      }
      const authenticated = await ensureAuthenticated();
      if (!authenticated) {
        app.integrationGo('public.signin');
        return;
      }
      if (!allowed(currentRoute)) {
        integration.failedRoutes.set(currentRoute, 'DENIED');
        render(routeState(currentRoute, 'denied'));
        return;
      }
      if (ROUTES_WITHOUT_DATA_SLOT.has(currentRoute)) {
        integration.failedRoutes.set(currentRoute, 'PROTOTYPE_ONLY_UNSUPPORTED');
        afterRender();
        return;
      }
      const loading = routeState(currentRoute, 'loading', 'populated');
      if (loading === 'loading') render('loading');
      const module = MODULE_BY_ROUTE[currentRoute];
      if (module) await loadModule(currentRoute, module, { refresh });
      else if (SPECIAL_ROUTES.has(currentRoute)) await loadSpecial(currentRoute);
      else return;
      const counts = viewModelCounts();
      const empty =
        (currentRoute === 'request.queue' && counts.requests === 0) ||
        (currentRoute === 'lending.queue' && counts.loans === 0) ||
        (currentRoute === 'admin.overview' && counts.requests + counts.inventory === 0);
      render(routeState(currentRoute, empty ? 'empty' : 'populated'));
    } catch (error) {
      integration.failedRoutes.set(currentRoute, text(error?.code, 'SERVICE_ERROR'));
      if (!PUBLIC_ROUTES.has(currentRoute) && String(error?.code ?? '').startsWith('AUTH_')) {
        app.integrationGo('public.signin');
        app.integrationState.variant = 'unavailable';
        app.integrationRender();
        queueMicrotask(afterRender);
      } else if (currentRoute === 'public.signin') render(routeState(currentRoute, 'unavailable'));
      else if (PUBLIC_ROUTES.has(currentRoute)) render(routeState(currentRoute, 'error'));
      else render(routeState(currentRoute, 'denied'));
      toast(safeMessage(error), true);
    }
  }

  function bindAnnouncement() {
    const item = integration.advertisements[0];
    if (!item) return;
    const section = document.querySelector('.landing-updates');
    const summary = section?.querySelector('p');
    const link = section?.querySelector('a');
    if (summary) summary.textContent = text(item.summary, item.body, item.title, summary.textContent);
    const target = text(item.url, item.targetUrl);
    if (link && /^https:\/\//u.test(target)) link.href = target;
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
    if (form.elements.parentRequest) {
      setOptions(form.elements.parentRequest, [], 'Select an illustrative request', (entry) => entry);
    }
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
      control.closest('label').hidden = selected && staff;
    }
    const department = form.elements.uscDepartment;
    if (department) {
      department.disabled = !selected || !staff;
      department.required = selected && staff;
      department.closest('label').hidden = selected && !staff;
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

  function bindDirectory() {
    const result = integration.accessDirectory;
    if (!result) return;
    const accounts = firstCollection(result, 'accounts', 'items', 'directory', 'rows');
    const root = document.getElementById('surface-main');
    setFact(
      root,
      'Active entries',
      String(accounts.filter((entry) => text(entry.status) === 'ACTIVE').length),
    );
    setFact(
      root,
      'Quarantined source rows',
      String(
        accounts.filter((entry) => ['NEEDS_REVIEW', 'UNKNOWN_ROLE'].includes(text(entry.mappingStatus)))
          .length,
      ),
    );
    setFact(root, 'Last synchronisation', text(result.updatedAt, result.generatedAt, 'Not reported'));
    setFact(root, 'Inconsistent runs', String(Number(result.inconsistentRuns ?? 0)));
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
    const summary = root?.querySelector('.page-head p, .track-summary p, .detail__head > p');
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
    const summary = root?.querySelector('.page-head p, .track-summary p, .detail__head > p');
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

  function afterRender() {
    const currentRoute = route();
    if (currentRoute === 'public.landing') bindAnnouncement();
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
    if (app.integrationState.requestType === 'ADDITIONAL') {
      toast('Additional requests require private verification that this V5 form does not collect.', true);
      return;
    }
    if (!app.integrationState.requestDraft.length) {
      toast('Add at least one requested item.', true);
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    const button = form.querySelector('[data-act="request-preview-submit"]');
    button.disabled = true;
    try {
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

  async function trackPublicRequest() {
    const form = document.querySelector('#request-track-panel form');
    if (!form?.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    try {
      integration.lastPublicRequest = await backend.trackPublicRequest({
        requestId: values.requestSearch,
        trackingCode: values.trackingCode,
      });
      integration.connectedRoutes.add('public.request-tracking');
      form.elements.trackingCode.value = '';
      app.integrationGo('public.request-tracking');
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
    render('loading');
    try {
      const result = await backend.login(values.u, values.p);
      if (!result?.user) {
        render('error');
        return;
      }
      integration.session = result;
      integration.state = null;
      await ensureAuthenticated();
      app.integrationGo(
        integration.essential?.currentUser?.authorization?.defaultWorkspaceId === 'director'
          ? 'director.overview'
          : 'admin.overview',
      );
    } catch (error) {
      render(error?.code === 'AUTH_SERVICE_UNAVAILABLE' ? 'unavailable' : 'error');
    }
  }

  async function signOut() {
    try {
      await backend.logout();
    } finally {
      integration.session = null;
      integration.essential = null;
      integration.state = null;
      app.integrationCloseOverlay();
      app.integrationGo('public.signin');
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
    const button = event.target.closest('button');
    if (route() === 'public.verify' && button?.textContent?.includes('Resend confirmation')) {
      event.preventDefault();
      event.stopImmediatePropagation();
      toast('No verified application email session is present in this V5 route.', true);
      return;
    }
    const target = event.target.closest('[data-act]');
    if (!target) return;
    const action = target.dataset.act;
    if (action === 'request-preview-submit') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void submitPublicRequest();
      return;
    }
    if (action === 'request-preview-track') {
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
      void loadRoute(route(), { refresh: true }).then(() => toast('Current authorized data loaded.'));
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
    if (['confirm-return', 'confirm-release', 'noop'].includes(action)) {
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

  function onSubmit(event) {
    const form = event.target;
    const currentRoute = route();
    if (currentRoute === 'public.signin') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void signIn(form);
    } else if (currentRoute === 'public.lending-intake') {
      event.preventDefault();
      event.stopImmediatePropagation();
      void submitPublicLending(form);
    } else if (['public.register', 'public.application'].includes(currentRoute)) {
      event.preventDefault();
      event.stopImmediatePropagation();
      toast(
        'This V5 form does not collect the complete verified account-application contract and remains non-destructive.',
        true,
      );
    } else if (currentRoute === 'account.profile') {
      event.preventDefault();
      event.stopImmediatePropagation();
      toast('Password confirmation is not present in V5, so this control remains non-destructive.', true);
    }
  }

  async function start() {
    if (integration.started) return integration;
    integration.started = true;
    document.addEventListener('click', onClick, true);
    document.addEventListener('change', onChange, true);
    document.addEventListener('submit', onSubmit, true);
    window.addEventListener('hashchange', () => void loadRoute());
    await loadRoute();
    return integration;
  }

  return Object.freeze({
    start,
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
      };
    },
  });
}
