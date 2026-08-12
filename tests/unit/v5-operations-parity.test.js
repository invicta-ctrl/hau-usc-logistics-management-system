import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createOperationsParityController } from '../../src/v5/integration/operations-parity.js';

const dataKey = (attribute) =>
  attribute
    .slice(5)
    .split('-')
    .map((part, index) => (index ? `${part[0].toUpperCase()}${part.slice(1)}` : part))
    .join('');

function matches(element, selector) {
  return selector.split(',').some((candidate) => {
    const normalized = candidate.trim();
    const tag = /^([a-z][a-z0-9-]*)/iu.exec(normalized)?.[1];
    if (tag && element.tagName !== tag.toUpperCase()) return false;
    for (const match of normalized.matchAll(/\[([^=\]]+)(?:="([^"]*)")?\]/gu)) {
      const [, attribute, expected] = match;
      let actual;
      if (attribute.startsWith('data-')) actual = element.dataset[dataKey(attribute)];
      else actual = element[attribute];
      if (expected === undefined) {
        if (actual === undefined) return false;
      } else if (String(actual) !== expected) return false;
    }
    return Boolean(tag || normalized.startsWith('['));
  });
}

class FakeElement {
  constructor(tagName) {
    this.tagName = tagName.toUpperCase();
    this.children = [];
    this.parentElement = null;
    this.dataset = {};
    this.className = '';
    this.id = '';
    this.name = '';
    this.type = '';
    this.value = '';
    this.checked = false;
    this.disabled = false;
    this.required = false;
    this.readOnly = false;
    this.hidden = false;
    this.inert = false;
    this.textContent = '';
    this.attributes = {};
  }

  append(...children) {
    for (const child of children) {
      child.parentElement = this;
      this.children.push(child);
    }
  }

  querySelectorAll(selector) {
    const result = [];
    const visit = (node) => {
      for (const child of node.children) {
        if (matches(child, selector)) result.push(child);
        visit(child);
      }
    };
    visit(this);
    return result;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] ?? null;
  }

  closest(selector) {
    let node = this;
    while (node) {
      if (matches(node, selector)) return node;
      node = node.parentElement;
    }
    return null;
  }

  remove() {
    if (!this.parentElement) return;
    this.parentElement.children = this.parentElement.children.filter((child) => child !== this);
    this.parentElement = null;
  }

  setAttribute(name, value) {
    if (name.startsWith('data-')) this.dataset[dataKey(name)] = String(value);
    else this.attributes[name] = String(value);
  }

  getAttribute(name) {
    if (name.startsWith('data-')) return this.dataset[dataKey(name)] ?? null;
    return this.attributes[name] ?? null;
  }

  removeAttribute(name) {
    if (name.startsWith('data-')) delete this.dataset[dataKey(name)];
    else delete this.attributes[name];
  }

  focus() {
    this.focused = true;
  }

  scrollIntoView(options) {
    this.scrolled = options;
  }

  reportValidity() {
    return this.querySelectorAll('input, select, textarea').every((control) => {
      if (!control.required || control.disabled) return true;
      return control.type === 'checkbox' ? control.checked : Boolean(String(control.value).trim());
    });
  }
}

class FakeDocument extends FakeElement {
  constructor() {
    super('document');
    const main = new FakeElement('main');
    main.id = 'surface-main';
    this.append(main);
  }

  createElement(tagName) {
    return new FakeElement(tagName);
  }

  getElementById(id) {
    let found = null;
    const visit = (node) => {
      if (node.id === id) found = node;
      for (const child of node.children) visit(child);
    };
    visit(this);
    return found;
  }
}

function setup(route) {
  const document = new FakeDocument();
  vi.stubGlobal('document', document);
  vi.stubGlobal('location', { hash: `#/${route}` });
  vi.stubGlobal('crypto', { randomUUID: () => '00000000-0000-4000-8000-000000000001' });
  return document;
}

function contextualMount(document, route) {
  const mount = document.createElement('section');
  mount.dataset.v5ContextualMount = route;
  document.getElementById('surface-main').append(mount);
  return mount;
}

function newEventTrigger(document) {
  const wrap = document.createElement('div');
  wrap.dataset.v5NewEventWrap = '';
  wrap.hidden = true;
  wrap.inert = true;
  const trigger = document.createElement('button');
  trigger.dataset.v5NewEvent = '';
  trigger.disabled = true;
  trigger.setAttribute('aria-disabled', 'true');
  wrap.append(trigger);
  document.getElementById('surface-main').append(wrap);
  return { wrap, trigger };
}

function form(document, id) {
  return document.querySelector(`form[data-v5-command="${id}"]`);
}

function control(formElement, name) {
  return formElement.querySelectorAll('input, select, textarea').find((candidate) => candidate.name === name);
}

function submit(controller, formElement) {
  const submitter = formElement.querySelector('[type="submit"]');
  return controller.onSubmit({
    target: formElement,
    submitter,
    preventDefault: vi.fn(),
    stopImmediatePropagation: vi.fn(),
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('V5 operations parity controller', () => {
  it('exposes every governed operations family on its existing V5 route', () => {
    const capabilities = [
      'request.review',
      'request.missing_information',
      'request.reject',
      'fulfillment.canvass',
      'fulfillment.procure',
      'fulfillment.reserve',
      'fulfillment.receive',
      'fulfillment.release',
      'lending.create',
      'lending.approve',
      'lending.handoff',
      'lending.return',
      'inventory.merge_event_item',
      'inventory.adjust',
      'inventory.classify',
      'event.manage',
      'reference.catalog.manage',
      'view.internal',
    ];
    const state = {
      role: 'SYSTEM_OWNER',
      requests: [{ id: 'REQ-REAL-1' }],
      requestLines: [{ id: 'RL-REAL-1', requestId: 'REQ-REAL-1', itemId: 'ITM-REAL-1' }],
      lendingTickets: [{ id: 'LND-REAL-1', quantity: 2, itemId: 'ITM-REAL-1' }],
      inventoryItems: [
        {
          id: 'ITM-REAL-1',
          status: 'ACTIVE',
          classificationStatus: 'NEEDS_CLASSIFICATION',
        },
      ],
      restockRequests: [{ id: 'RST-REAL-1', revision: 3, unit: 'piece' }],
      deliverables: [{ id: 'DEL-REAL-1', eventItemId: 'EVI-REAL-1', unit: 'piece' }],
      canvassReferences: [{ id: 'CNV-REAL-1', supplierName: 'Authorized supplier' }],
      releaseConfirmations: [{ id: 'REL-REAL-1' }],
      eventSeries: [{ id: 'SER-REAL-1', revision: 2 }],
      eventDays: [{ id: 'DAY-REAL-1', eventSeriesId: 'SER-REAL-1', revision: 2 }],
      eventActivities: [{ id: 'ACT-REAL-1', eventDayId: 'DAY-REAL-1', revision: 2 }],
    };
    const selection = {
      selectedRequestId: 'REQ-REAL-1',
      selectedLoanId: 'LND-REAL-1',
      selectedReleaseId: 'REQ-REAL-1',
      selectedReleaseConfirmationId: 'REL-REAL-1',
      selectedInventoryId: 'ITM-REAL-1',
      selectedRestockId: 'RST-REAL-1',
      selectedDeliverableId: 'DEL-REAL-1',
      selectedEventSeriesId: 'SER-REAL-1',
      selectedEventDayId: 'DAY-REAL-1',
      selectedActivityId: 'ACT-REAL-1',
      selectedComponentId: 'CMP-REAL-1',
    };
    const routes = {
      'request.queue': ['request-review', 'request-information', 'request-reject', 'request-reserve'],
      'lending.queue': ['lending-create'],
      'lending.detail': ['lending-approve', 'lending-handoff', 'lending-return', 'asset-register', 'asset-maintenance'],
      'release.desk': ['release-confirm', 'release-correct'],
      'inventory.catalog': ['inventory-create', 'inventory-bulk-classify'],
      'inventory.item': [
        'inventory-update',
        'inventory-storage',
        'inventory-lifecycle',
        'inventory-classify',
        'inventory-cycle-count',
      ],
      'restocking.queue': ['restock-transition', 'restock-receive'],
      'procurement.board': [
        'canvass-create',
        'canvass-preferred',
        'deliverable-transition',
        'deliverable-receive',
        'event-item-transfer',
      ],
      'events.series': ['event-series-save', 'event-day-save', 'event-activity-save', 'event-link'],
      'food.overview': ['food-component-update'],
      'materials.overview': ['materials-component-update'],
    };

    for (const [route, expectedForms] of Object.entries(routes)) {
      const document = setup(route);
      const controller = createOperationsParityController({
        backend: { commands: {}, api: {} },
        app: {},
        getState: () => state,
        getSelection: () => selection,
        getCapabilities: () => capabilities,
        refresh: vi.fn(),
        toast: vi.fn(),
      });
      controller.afterRender();
      expect(
        document.querySelectorAll('form[data-v5-command]').map((entry) => entry.dataset.v5Command),
        route,
      ).toEqual(expectedForms);
    }
  });

  it('renders only exact-capability request controls and calls the review adapter exactly', async () => {
    const document = setup('request.queue');
    const reviewRequest = vi.fn().mockResolvedValue({ ok: true });
    const refresh = vi.fn().mockResolvedValue(undefined);
    const controller = createOperationsParityController({
      backend: { commands: { reviewRequest, reserveStock: vi.fn() }, api: {} },
      app: {},
      getState: () => ({
        requests: [{ id: 'REQ-REAL-1' }],
        requestLines: [{ id: 'RL-REAL-1', requestId: 'REQ-REAL-1', itemId: 'ITM-REAL-1' }],
      }),
      getSelection: () => ({ selectedRequestId: 'REQ-REAL-1' }),
      getCapabilities: () => new Set(['request.review', 'request.missing_information']),
      refresh,
      toast: vi.fn(),
    });

    expect(controller.afterRender()).toBe(2);
    expect(document.querySelector('[data-v5-parity-actions]').dataset.v5ParityActions).toBe('request.queue');
    expect(form(document, 'request-review')).not.toBeNull();
    expect(form(document, 'request-information')).not.toBeNull();
    expect(form(document, 'request-reject')).toBeNull();
    control(form(document, 'request-information'), 'note').value =
      'Please provide the approved activity date.';

    expect(submit(controller, form(document, 'request-information'))).toBe(true);
    await vi.waitFor(() => {
      expect(reviewRequest).toHaveBeenCalledWith(
        'REQ-REAL-1',
        'MISSING_INFORMATION',
        'Please provide the approved activity date.',
      );
      expect(refresh).toHaveBeenCalledOnce();
    });
  });

  it('uses a selected-route mount when present and preserves the root fallback otherwise', () => {
    const mountedDocument = setup('request.queue');
    const mount = contextualMount(mountedDocument, 'request.queue');
    const mountedController = createOperationsParityController({
      backend: { commands: {}, api: {} },
      app: {},
      getState: () => ({
        requests: [{ id: 'REQ-MOUNT-1' }],
        requestLines: [{ id: 'RQL-MOUNT-1', requestId: 'REQ-MOUNT-1', itemId: 'ITM-MOUNT-1' }],
      }),
      getSelection: () => ({ selectedRequestId: 'REQ-MOUNT-1' }),
      getCapabilities: () => ['request.review'],
      refresh: vi.fn(),
      toast: vi.fn(),
    });

    expect(mountedController.afterRender()).toBe(1);
    const mountedSection = mount.querySelector('[data-v5-operations-parity]');
    expect(mountedSection.dataset.v5ParityMount).toBe('contextual');
    expect(mountedSection.querySelector('h2').textContent).toBe('Selected request actions');
    expect(
      form(mountedDocument, 'request-review').closest('[data-v5-contextual-mount="request.queue"]'),
    ).toBe(mount);

    const fallbackDocument = setup('request.queue');
    const fallbackController = createOperationsParityController({
      backend: { commands: {}, api: {} },
      app: {},
      getState: () => ({
        requests: [{ id: 'REQ-FALLBACK-1' }],
        requestLines: [{ id: 'RQL-FALLBACK-1', requestId: 'REQ-FALLBACK-1', itemId: 'ITM-FALLBACK-1' }],
      }),
      getSelection: () => ({ selectedRequestId: 'REQ-FALLBACK-1' }),
      getCapabilities: () => ['request.review'],
      refresh: vi.fn(),
      toast: vi.fn(),
    });

    expect(fallbackController.afterRender()).toBe(1);
    const fallbackSection = fallbackDocument.querySelector('[data-v5-operations-parity]');
    expect(fallbackSection.dataset.v5ParityMount).toBe('fallback');
    expect(fallbackSection.parentElement).toBe(fallbackDocument.getElementById('surface-main'));
    expect(fallbackSection.querySelector('h2').textContent).toBe('Selected request actions');
  });

  it('chooses the active request drawer mount instead of an inert desktop mount', () => {
    const document = setup('request.queue');
    const inertDesktopMount = contextualMount(document, 'request.queue');
    document.getElementById('surface-main').inert = true;
    const drawer = document.createElement('aside');
    drawer.className = 'drawer';
    const activeDrawerMount = document.createElement('section');
    activeDrawerMount.dataset.v5ContextualMount = 'request.queue';
    drawer.append(activeDrawerMount);
    document.append(drawer);
    const controller = createOperationsParityController({
      backend: { commands: {}, api: {} },
      app: {},
      getState: () => ({
        requests: [{ id: 'REQ-DRAWER-1' }],
        requestLines: [{ id: 'RQL-DRAWER-1', requestId: 'REQ-DRAWER-1' }],
      }),
      getSelection: () => ({ selectedRequestId: 'REQ-DRAWER-1' }),
      getCapabilities: () => ['request.review'],
      refresh: vi.fn(),
      toast: vi.fn(),
    });

    expect(controller.afterRender()).toBe(1);
    expect(form(document, 'request-review').closest('[data-v5-contextual-mount="request.queue"]')).toBe(
      activeDrawerMount,
    );
    expect(inertDesktopMount.querySelector('[data-v5-operations-parity]')).toBeNull();
  });

  it('keeps mobile release selection in the release review plane before app drawer bubbling', async () => {
    const runtime = await readFile(new URL('../../src/v5/integration/runtime.js', import.meta.url), 'utf8');
    const start = runtime.indexOf("if (action === 'select:release') {");
    const end = runtime.indexOf("if (action === 'go:lending.detail')", start);
    const releaseSelection = runtime.slice(start, end);

    expect(start).toBeGreaterThanOrEqual(0);
    expect(end).toBeGreaterThan(start);
    expect(releaseSelection).toMatch(
      /document\.querySelector\('\.frame'\)[\s\S]*frame \? frame\.clientWidth : window\.innerWidth[\s\S]*event\.preventDefault\(\);[\s\S]*event\.stopImmediatePropagation\(\);[\s\S]*queueMicrotask\(afterRender\);[\s\S]*return;/u,
    );
  });

  it('clears route-local search state at every session boundary', async () => {
    const runtime = await readFile(new URL('../../src/v5/integration/runtime.js', import.meta.url), 'utf8');
    const projectionStart = runtime.indexOf('function clearAuthenticatedProjection()');
    const generationStart = runtime.indexOf('function advanceAuthGeneration');
    const boundaryStart = runtime.indexOf('function handleAuthenticationBoundary');
    const signOutStart = runtime.indexOf('async function signOut()');
    const playgroundOperationStart = runtime.indexOf('async function requestPlaygroundOperation');
    const clearAuthenticatedProjection = runtime.slice(projectionStart, generationStart);
    const advanceAuthGeneration = runtime.slice(generationStart, boundaryStart);
    const signOut = runtime.slice(signOutStart, playgroundOperationStart);

    expect(projectionStart).toBeGreaterThanOrEqual(0);
    expect(generationStart).toBeGreaterThan(projectionStart);
    expect(boundaryStart).toBeGreaterThan(generationStart);
    expect(signOutStart).toBeGreaterThan(boundaryStart);
    expect(playgroundOperationStart).toBeGreaterThan(signOutStart);

    expect(runtime).toMatch(
      /result\?\.state === 'ACTIVATION_REQUIRED'[\s\S]*integration\.activationCsrfToken = result\.csrfToken;[\s\S]*integration\.routeSearch\.clear\(\);[\s\S]*integration\.session = null;/u,
    );
    expect(runtime).toMatch(
      /if \(!result\?\.user\)[\s\S]*return;[\s\S]*\}\s*integration\.routeSearch\.clear\(\);[\s\S]*integration\.session = result;/u,
    );
    expect(clearAuthenticatedProjection).toMatch(
      /integration\.state = null;[\s\S]*integration\.routeSearch\.clear\(\);[\s\S]*clearBackendViewModels\(\);/u,
    );
    expect(advanceAuthGeneration).toMatch(
      /integration\.authGeneration \+= 1;[\s\S]*clearAuthenticatedProjection\(\);/u,
    );
    expect(signOut).toMatch(
      /advanceAuthGeneration\(\);[\s\S]*const logout = backend\.logout\(\)[\s\S]*app\.integrationGo\('public\.signin'\);[\s\S]*const confirmed = await logout;/u,
    );
    expect(runtime).toMatch(
      /action === 'resume-playground'[\s\S]*integration\.session = null;[\s\S]*integration\.routeSearch\.clear\(\);[\s\S]*advanceAuthGeneration\(\);[\s\S]*app\.integrationGo\('index'\);/u,
    );
    expect([...runtime.matchAll(/integration\.routeSearch\.clear\(\)/gu)]).toHaveLength(4);
  });

  it('renders the governed return form from a real selected loan and sends exact quantities', async () => {
    const document = setup('lending.detail');
    const confirmReturn = vi.fn().mockResolvedValue({ ok: true });
    const controller = createOperationsParityController({
      backend: { commands: { confirmReturn }, api: {} },
      app: {},
      getState: () => ({ lendingTickets: [{ id: 'LND-REAL-1', quantity: 2, itemId: 'ITM-REAL-1' }] }),
      getSelection: () => ({ selectedLoanId: 'LND-REAL-1' }),
      getCapabilities: () => ['lending.return'],
      refresh: vi.fn(),
      toast: vi.fn(),
    });

    expect(controller.afterRender()).toBe(2);
    const returnForm = form(document, 'lending-return');
    expect(control(returnForm, 'ticketId').value).toBe('LND-REAL-1');
    control(returnForm, 'conditionLabel').value = 'GOOD';
    control(returnForm, 'evidenceId').value = 'EVD-REAL-1';

    submit(controller, returnForm);
    await vi.waitFor(() =>
      expect(confirmReturn).toHaveBeenCalledWith('LND-REAL-1', {
        returnedQuantity: 2,
        lostQuantity: 0,
        damagedBeyondUseQuantity: 0,
        conditionLabel: 'GOOD',
        evidenceId: 'EVD-REAL-1',
      }),
    );
  });

  it('keeps R1 lending presentation optional where the contract is optional and release identities distinct', async () => {
    const lendingDocument = setup('lending.queue');
    const createLendingTicket = vi.fn().mockResolvedValue({ ok: true });
    const lendingController = createOperationsParityController({
      backend: { commands: { createLendingTicket }, api: {} },
      app: {},
      getState: () => ({
        inventoryItems: [{ id: 'ITM-REAL-1', name: 'Cable reel', unit: 'piece', status: 'ACTIVE' }],
      }),
      getSelection: () => ({}),
      getCapabilities: () => ['lending.create'],
      refresh: vi.fn(),
      toast: vi.fn(),
    });

    expect(lendingController.afterRender()).toBe(1);
    const lendingForm = form(lendingDocument, 'lending-create');
    expect(lendingForm.querySelectorAll('label').map((node) => node.textContent)).toEqual(
      expect.arrayContaining(['Student ID No.', 'Contact Number']),
    );
    expect(control(lendingForm, 'borrowerType').children.map((node) => node.textContent)).toContain(
      'USC Staff/Officer',
    );
    expect(control(lendingForm, 'studentIdNumber')).toMatchObject({ required: true, maxLength: 8 });
    expect(control(lendingForm, 'contact').required).toBe(false);
    expect(control(lendingForm, 'notes')).toBeUndefined();

    control(lendingForm, 'itemId').value = 'ITM-REAL-1';
    control(lendingForm, 'borrowerName').value = 'Authorized borrower';
    control(lendingForm, 'borrowerType').value = 'USC_STAFF';
    control(lendingForm, 'studentIdNumber').value = '12345678';
    control(lendingForm, 'department').value = 'Logistics';
    control(lendingForm, 'quantity').value = '2';
    control(lendingForm, 'ticketType').value = 'LOAN';
    control(lendingForm, 'purpose').value = 'Authorized event support.';
    submit(lendingController, lendingForm);
    await vi.waitFor(() =>
      expect(createLendingTicket).toHaveBeenCalledWith({
        itemId: 'ITM-REAL-1',
        borrowerName: 'Authorized borrower',
        borrowerType: 'USC_STAFF',
        studentIdNumber: '12345678',
        department: 'Logistics',
        quantity: 2,
        ticketType: 'LOAN',
        purpose: 'Authorized event support.',
        unit: 'piece',
        clientRequestId: 'lending-create:00000000-0000-4000-8000-000000000001',
      }),
    );

    const releaseDocument = setup('release.desk');
    const releaseMount = contextualMount(releaseDocument, 'release.desk');
    const confirmRelease = vi.fn().mockResolvedValue({ ok: true });
    const releaseController = createOperationsParityController({
      backend: { commands: { confirmRelease }, api: {} },
      app: {},
      getState: () => ({
        requests: [{ id: 'REQ-REAL-1' }],
        requestLines: [{ id: 'RL-REAL-1', requestId: 'REQ-REAL-1', description: 'Cable reel' }],
      }),
      getSelection: () => ({ selectedRequestId: 'REQ-REAL-1', selectedReleaseId: 'REQ-REAL-1' }),
      getCapabilities: () => ['fulfillment.release'],
      refresh: vi.fn(),
      toast: vi.fn(),
    });

    expect(releaseController.afterRender()).toBe(1);
    const releaseForm = form(releaseDocument, 'release-confirm');
    expect(releaseForm.closest('[data-v5-contextual-mount="release.desk"]')).toBe(releaseMount);
    expect(releaseForm.querySelectorAll('label').map((node) => node.textContent)).toEqual(
      expect.arrayContaining(['Request Ticket ID', 'Release item']),
    );
    expect(control(releaseForm, 'recipientConfirmed').required).toBe(true);
    control(releaseForm, 'requestLineId').value = 'RL-REAL-1';
    control(releaseForm, 'quantity').value = '1';
    control(releaseForm, 'recipientName').value = 'Authorized recipient';
    control(releaseForm, 'recipientRole').value = 'Officer';
    control(releaseForm, 'department').value = 'Logistics';
    control(releaseForm, 'evidenceId').value = 'EVD-REAL-1';
    control(releaseForm, 'recipientConfirmed').checked = true;
    submit(releaseController, releaseForm);
    await vi.waitFor(() =>
      expect(confirmRelease).toHaveBeenCalledWith({
        requestId: 'REQ-REAL-1',
        lines: [{ requestLineId: 'RL-REAL-1', quantity: 1 }],
        recipientName: 'Authorized recipient',
        recipientRole: 'Officer',
        department: 'Logistics',
        evidenceId: 'EVD-REAL-1',
        recipientConfirmed: true,
        clientRequestId: 'release:00000000-0000-4000-8000-000000000001',
      }),
    );
  });

  it('fails closed when selected request and release IDs diverge', () => {
    const document = setup('release.desk');
    const mount = contextualMount(document, 'release.desk');
    const confirmRelease = vi.fn().mockResolvedValue({ ok: true });
    const controller = createOperationsParityController({
      backend: { commands: { confirmRelease }, api: {} },
      app: {},
      getState: () => ({
        requests: [{ id: 'REQ-RELEASE-A' }, { id: 'REQ-RELEASE-B' }],
        requestLines: [
          { id: 'RQL-RELEASE-A', requestId: 'REQ-RELEASE-A', description: 'Authorized A' },
          { id: 'RQL-RELEASE-B', requestId: 'REQ-RELEASE-B', description: 'Authorized B' },
        ],
      }),
      getSelection: () => ({ selectedRequestId: 'REQ-RELEASE-A', selectedReleaseId: 'REQ-RELEASE-B' }),
      getCapabilities: () => ['fulfillment.release'],
      refresh: vi.fn(),
      toast: vi.fn(),
    });

    expect(controller.afterRender()).toBe(0);
    expect(form(document, 'release-confirm')).toBeNull();
    expect(mount.querySelector('[data-v5-operations-parity]')).toBeNull();
    expect(confirmRelease).not.toHaveBeenCalled();
  });

  it('keeps New Event hidden and inert without capability, then focuses the exact existing form when authorized', () => {
    const unavailableDocument = setup('events.series');
    contextualMount(unavailableDocument, 'events.series');
    const unavailableTrigger = newEventTrigger(unavailableDocument);
    const unavailableController = createOperationsParityController({
      backend: { commands: {}, api: {} },
      app: {},
      getState: () => ({ eventSeries: [] }),
      getSelection: () => ({}),
      getCapabilities: () => [],
      refresh: vi.fn(),
      toast: vi.fn(),
    });

    expect(unavailableController.afterRender()).toBe(0);
    expect(unavailableTrigger.wrap.hidden).toBe(true);
    expect(unavailableTrigger.wrap.inert).toBe(true);
    expect(unavailableTrigger.trigger.disabled).toBe(true);

    const availableDocument = setup('events.series');
    const eventMount = contextualMount(availableDocument, 'events.series');
    const availableTrigger = newEventTrigger(availableDocument);
    const availableController = createOperationsParityController({
      backend: { commands: {}, api: {} },
      app: {},
      getState: () => ({ eventSeries: [] }),
      getSelection: () => ({}),
      getCapabilities: () => ['event.manage'],
      refresh: vi.fn(),
      toast: vi.fn(),
    });

    expect(availableController.afterRender()).toBe(4);
    expect(availableTrigger.wrap.hidden).toBe(false);
    expect(availableTrigger.wrap.inert).toBe(false);
    expect(availableTrigger.trigger.disabled).toBe(false);
    const createForm = form(availableDocument, 'event-series-save');
    expect(createForm.closest('[data-v5-contextual-mount="events.series"]')).toBe(eventMount);

    expect(
      availableController.onClick({
        target: availableTrigger.trigger,
        preventDefault: vi.fn(),
        stopImmediatePropagation: vi.fn(),
      }),
    ).toBe(true);
    expect(createForm.scrolled).toMatchObject({ block: 'start' });
    expect(createForm.querySelector('input, select, textarea, button').focused).toBe(true);
  });

  it('passes a cycle count through the current direct API path with the real selected item', async () => {
    const document = setup('inventory.item');
    const call = vi.fn().mockResolvedValue({ ok: true });
    const controller = createOperationsParityController({
      backend: { commands: {}, api: { _call: call } },
      app: {},
      getState: () => ({
        inventoryItems: [
          {
            id: 'ITM-REAL-9',
            name: 'Cable reel',
            unit: 'piece',
            status: 'ACTIVE',
            updatedAt: '2026-08-09T04:00:00.000Z',
          },
        ],
      }),
      getSelection: () => ({ selectedInventoryId: 'ITM-REAL-9' }),
      getCapabilities: () => new Set(['inventory.adjust']),
      refresh: vi.fn(),
      toast: vi.fn(),
    });

    expect(controller.afterRender()).toBe(1);
    const cycleForm = form(document, 'inventory-cycle-count');
    expect(control(cycleForm, 'itemId').value).toBe('ITM-REAL-9');
    control(cycleForm, 'countedQuantity').value = '7';
    control(cycleForm, 'reason').value = 'Physical cycle count witnessed by the inventory team.';

    submit(controller, cycleForm);
    await vi.waitFor(() =>
      expect(call).toHaveBeenCalledWith('postCycleCountAdjustment', {
        itemId: 'ITM-REAL-9',
        countedQuantity: 7,
        reason: 'Physical cycle count witnessed by the inventory team.',
        clientRequestId: 'postCycleCountAdjustment:00000000-0000-4000-8000-000000000001',
      }),
    );
  });
});
