import {
  BOOTSTRAP_MODULE_CONTRACT,
  ESSENTIAL_BOOTSTRAP_CONTRACT,
  ESSENTIAL_BOOTSTRAP_VERSION,
} from '../../src/app/bootstrap-contract.js';

const user = (requestOnly) => ({
  id: requestOnly ? 'PUBLIC' : 'SYNTHETIC-USER-001',
  displayName: requestOnly ? 'Requester' : 'Synthetic Operator',
  role: requestOnly ? 'REQUESTER' : 'ADMIN',
  committee: '',
  permissions: {
    review: !requestOnly,
    release: !requestOnly,
    receive: !requestOnly,
    admin: !requestOnly,
    manageCatalog: !requestOnly,
  },
  scopes: { committee: [] },
});

export function createEssentialBootstrapFixture({ backendMode = 'mock', environment = 'STAGING', requestOnly = false } = {}) {
  const navigation = requestOnly
    ? [{ id: 'request', label: 'Request Center', enabled: true }]
    : [
      { id: 'overview', label: 'Operations Overview', enabled: true },
      { id: 'request', label: 'Request Center', enabled: true },
      { id: 'inventory', label: 'Inventory Management', enabled: true },
    ];
  return {
    ok: true,
    correlationId: 'COR-SYNTHETIC-001',
    contract: ESSENTIAL_BOOTSTRAP_CONTRACT,
    contractVersion: ESSENTIAL_BOOTSTRAP_VERSION,
    appVersion: '0.5.0',
    schemaVersion: '1.1.0',
    backendMode,
    environment,
    requestOnly,
    activeModule: requestOnly ? 'request' : 'overview',
    currentUser: user(requestOnly),
    navigation,
    moduleConfig: {
      maxPageSize: 50,
      defaultPageSize: 10,
      legacyEndpointAvailable: true,
      activeModuleOnly: true,
    },
    revision: null,
    metrics: { readCount: 3, cacheHits: 1 },
  };
}

export function createBootstrapModuleFixture({ backendMode = 'mock', environment = 'STAGING', module = 'request', requestOnly = false, cacheSafe = true, rows = 2 } = {}) {
  const items = Array.from({ length: rows }, (_, index) => ({
    id: `SYNTHETIC-ITEM-${String(index + 1).padStart(3, '0')}`,
    name: `Synthetic Item ${index + 1}`,
    aliases: [`synthetic-${index + 1}`],
    category: 'Office Supplies',
    stockArea: 'Inventory',
    handling: 'Consumable',
    unit: 'piece',
    status: 'ACTIVE',
    availabilityProtected: requestOnly,
  }));
  const events = Array.from({ length: rows }, (_, index) => ({
    id: `SYNTHETIC-EVENT-${String(index + 1).padStart(3, '0')}`,
    seriesId: 'SYNTHETIC-SERIES-001',
    code: `SYN-EVENT-${index + 1}`,
    name: `Synthetic Event ${index + 1}`,
    startAt: '2026-07-20T08:00:00.000Z',
    endAt: '2026-07-20T09:00:00.000Z',
    venue: 'Synthetic Venue',
    status: 'ACTIVE',
  }));
  const dataByModule = {
    request: {
      eventSeries: [{ id: 'SYNTHETIC-SERIES-001', code: 'SYN-001', name: 'Synthetic Series', status: 'ACTIVE' }],
      events,
      inventoryItems: items,
    },
    overview: { eventSeries: [], events, requests: [], requestLines: [], inventoryItems: items, lendingTickets: [], restockRequests: [], deliverables: [], roadmapMilestones: [] },
    lending: { inventoryItems: items, lendingTickets: [] },
    release: { eventSeries: [], events: [], requests: [], requestLines: [], lendingTickets: [], releaseConfirmations: [] },
    restocking: { inventoryItems: items, restockRequests: [], restockRecords: [], canvassReferences: [] },
    procurement: { eventSeries: [], events, requests: [], requestLines: [], deliverables: [], canvassReferences: [] },
    inventory: { inventoryItems: items },
  };
  return {
    ok: true,
    correlationId: 'COR-SYNTHETIC-002',
    contract: BOOTSTRAP_MODULE_CONTRACT,
    contractVersion: ESSENTIAL_BOOTSTRAP_VERSION,
    appVersion: '0.5.0',
    schemaVersion: '1.1.0',
    backendMode,
    environment,
    requestOnly,
    module,
    data: dataByModule[module],
    pagination: { page: 1, pageSize: 10, total: rows, hasMore: false },
    revision: null,
    cache: { safe: cacheSafe, scope: cacheSafe ? 'PUBLIC_REFERENCE' : 'SESSION_OPERATIONAL', ttlMs: cacheSafe ? 300_000 : 0 },
    metrics: { readCount: 2, cacheHits: 1 },
  };
}
