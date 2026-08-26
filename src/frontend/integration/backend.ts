type Json = Record<string, unknown>;

export type FrontendUser = {
  accountId: string;
  displayName: string;
  roleId: string;
  capabilities: string[];
};

export type FrontendSession = {
  user: FrontendUser;
  csrfToken: string;
};

export type FrontendVersion = {
  playground: boolean;
};

export type FrontendAdminAccount = {
  accessId: string;
  displayName: string;
  roleId: string;
  status: string;
  firstLoginPending: boolean;
  locked: boolean;
};

export type FrontendAdminAccountDirectory = {
  page: number;
  pageSize: number;
  total: number;
  items: FrontendAdminAccount[];
};

export type FrontendStaffDirectoryItem = {
  /** Opaque runtime-only key. It must never be rendered or copied into the DOM. */
  opaquePersonId: string;
  displayName: string | null;
  accessId: string | null;
  linkState: string;
  emailState: string;
  assignmentSummary: {
    activeCount: number;
    historicalCount: number;
    quarantinedCount: number;
    provenanceState: string;
  };
};

export type FrontendStaffDirectory = {
  page: number;
  pageSize: number;
  query: string;
  total: number;
  items: FrontendStaffDirectoryItem[];
};

export type FrontendStaffActivityItem = {
  occurredAt: string;
  eventType: string;
  actionCode: string;
  linkState: string;
  previousLinkState: string;
  assignmentState: string;
  previousAssignmentState: string;
  oldEffectiveFrom: string;
  oldEffectiveTo: string;
  newEffectiveFrom: string;
  newEffectiveTo: string;
};

export type FrontendStaffActivityHistory = {
  historyStartsAt: string;
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  items: FrontendStaffActivityItem[];
};

/** FI-11 deliberately omits the reference-link identifier and revision internals. */
export type FrontendReferenceLink = {
  label: string;
  destination: string;
  linkType: string;
  audience: string;
  status: string;
  syncState: string;
  updatedAt: string;
  archivedAt: string;
};

/** FI-11 projects only public slot metadata; R2 and version internals never cross this boundary. */
export type FrontendBrandAssetSlot = {
  label: string;
  publicPath: string;
  publicationState: 'PUBLISHED' | 'NOT_PUBLISHED';
  publishedAt: string;
};

/** FI-11 flattens supported event data without exposing relational or audit identifiers. */
export type FrontendManagedEvent = {
  name: string;
  seriesName: string;
  date: string;
  activityType: string;
  status: string;
  timeStatus: string;
};

export type FrontendEventManagement = {
  series: Array<{ name: string; code: string; status: string }>;
  days: Array<{ seriesName: string; name: string; date: string; status: string }>;
  activities: FrontendManagedEvent[];
};

/** A successful technical response is not itself a user-facing health assertion. */
export type FrontendSystemStatus = {
  technicalResponse: 'RESPONSE_RECEIVED';
  readiness: 'REPORTED_READY' | 'NOT_REPORTED_READY';
};

export type FrontendInventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  onHand: number;
  reserved: number;
  availableToPromise: number;
  reorderThreshold: number;
  lowStockState: 'DISABLED' | 'LOW' | 'NORMAL';
  isLendable: boolean;
  lendingStatus: string;
  inventoryKind: string;
  classificationStatus: string;
  conditionReviewState: string;
  maintenanceReviewState: string;
  updatedAt: string;
};

export type FrontendInventoryBootstrap = {
  inventoryItems: FrontendInventoryItem[];
  scopeRevision: { token: string; updatedAt: string } | null;
};

export type FrontendRequestLine = {
  id: string;
  requestId: string;
  eventId: string;
  itemId: string;
  description: string;
  specification: string;
  category: string;
  quantity: number;
  unit: string;
  fulfillmentSource: string;
  neededAt: string;
  returnDue: string;
  releasedQuantity: number;
  receivedQuantity: number;
  status: string;
  workflowRevision: number;
  createdAt: string;
  updatedAt: string;
};
export type FrontendRequest = {
  id: string;
  type: string;
  stage: string;
  parentRequestId: string;
  eventSeriesId: string;
  eventDayId: string;
  eventId: string;
  ownerCommitteeId: string;
  catalogType: string;
  department: string;
  requesterName: string;
  purpose: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
};
export type FrontendRequestEventSeries = {
  id: string;
  code: string;
  name: string;
  status: string;
};
export type FrontendRequestEventDay = {
  id: string;
  seriesId: string;
  name: string;
  date: string;
  status: string;
};
export type FrontendRequestEvent = {
  id: string;
  seriesId: string;
  name: string;
  startAt: string;
  endAt: string;
  eventDayId: string;
  activityType: string;
  timeStatus: string;
  venue: string;
  status: string;
};
/** Reference-only catalog projection used to contextualize a request line. */
export type FrontendRequestInventoryReference = {
  id: string;
  name: string;
  category: string;
  unit: string;
  status: string;
  catalogType: string;
};
export type RequestBootstrapOptions = {
  page?: number;
  pageSize?: number;
  query?: string;
  filter?: string;
  signal?: AbortSignal;
};
export type FrontendRequestBootstrap = {
  requests: FrontendRequest[];
  requestLines: FrontendRequestLine[];
  eventSeries: FrontendRequestEventSeries[];
  eventDays: FrontendRequestEventDay[];
  events: FrontendRequestEvent[];
  inventoryItems: FrontendRequestInventoryReference[];
  pagination: { page: number; pageSize: number; total: number; hasMore: boolean };
  scopeRevision: { token: string; updatedAt: string } | null;
};

/** FI-07: a deliberately narrow projection of the existing authenticated lending module. */
export type FrontendLendingAssetOption = {
  id: string;
  itemId: string;
  assetTag: string;
  serialNumber: string;
  condition: string;
  status: string;
};

export type FrontendLendingHistoryEntry = {
  previousStatus: string;
  newStatus: string;
  changedAt: string;
  changedBy: string;
  reason: string;
  metadata: Json;
};

export type FrontendLendingTicket = {
  id: string;
  itemId: string;
  requestedItemId: string;
  quantity: number;
  requestedQuantity: number;
  unit: string;
  studentIdNumber: string;
  borrowerName: string;
  borrowerType: string;
  department: string;
  contact: string;
  email: string;
  courseYear: string;
  positionRole: string;
  purpose: string;
  dueAt: string;
  requestedStartAt: string;
  requestedEndAt: string;
  ticketType: string;
  status: string;
  reviewDecision: string;
  reviewNotes: string;
  rejectionReason: string;
  substitutionNote: string;
  eligibilitySource: string;
  eligibilityReviewedBy: string;
  eligibilityReviewedAt: string;
  assetOptions: FrontendLendingAssetOption[];
  history: FrontendLendingHistoryEntry[];
  createdAt: string;
  updatedAt: string;
};

/** Optional inventory values remain absent when the server redacts them. */
export type FrontendLendingInventoryItem = {
  id: string;
  name: string;
  category: string;
  unit: string;
  status: string;
  catalogType: string;
  stockArea: string;
  storageLocation?: string;
  isLendable: boolean;
  lendingKind: string;
  lendingStatus: string;
  lendingAudience: string;
  eligibilityRule: string;
  conditionTracked: boolean;
  conditionReviewState?: string;
  maintenanceReviewState?: string;
  availableToPromise?: number;
  lendableAvailable?: number;
  readyToClaim?: number;
  onLoan?: number;
  overdue?: number;
  damaged?: number;
  maintenance?: number;
  traceableAssets?: number;
  availableAssets?: number;
  maximumLoanQuantity?: number;
};

export type LendingBootstrapOptions = {
  page?: number;
  pageSize?: number;
  signal?: AbortSignal;
};

export type FrontendLendingBootstrap = {
  lendingTickets: FrontendLendingTicket[];
  inventoryItems: FrontendLendingInventoryItem[];
  pagination: { page: number; pageSize: number; total: number; hasMore: boolean };
  scopeRevision: { token: string; updatedAt: string };
};

export type FrontendLendingMutationReceipt = {
  ticketId: string;
  status: string;
  replayed: boolean;
  correlationId: string;
};

export type FrontendEvidenceReceipt = {
  evidenceId: string;
  uploadStatus: string;
  duplicate: boolean;
  correlationId: string;
};

export type FrontendProfile = {
  displayName: string;
  legalName: string;
  verifiedEmail: string;
  username: string;
  contactNumber: string;
  affiliation: {
    institutionId: string;
    departmentId: string;
    departmentDisplayName: string;
    courseId: string;
    yearLevel: string;
  };
  roleId: string;
  committeeIds: string[];
  accountCode: string;
  accessSummary: {
    roleId: string;
    roleLabel: string;
    committeeIds: string[];
    capabilities: string[];
    workspaceIds: string[];
    defaultWorkspaceId: string;
    scopeMode: string;
  };
  revision: string;
  credentialVersion: number;
  updatedAt: string;
  avatar: {
    available: false;
    initials: string;
    fallback: 'INITIALS';
  };
};

export type PublicLendingItem = {
  id: string;
  productId: string;
  name: string;
  aliases: string[];
  category: string;
  type: 'REUSABLE' | 'CONSUMABLE';
  availability: 'AVAILABLE' | 'LIMITED' | 'ELIGIBILITY_REQUIRED' | 'CURRENTLY_UNAVAILABLE' | 'MAINTENANCE';
  unit: string;
  maximumQuantity: number;
  defaultLoanDays: number;
  dueDateRequired: boolean;
  acknowledgmentRequired: boolean;
  eligibility: string;
  handlingNotes: string;
  description: string;
  restrictions: string;
  imageUrl: string;
  conditionTracked: boolean;
};

export type PublicLendingCatalog = {
  items: PublicLendingItem[];
  uscDepartments: string[];
};

export type PublicRequestOptions = {
  requesterTypes: string[];
  categories: string[];
  items: Array<{ id: string; name: string; category: string; unit: string }>;
  eventSeries: Array<{ id: string; code: string; name: string; status: string }>;
  events: Array<{
    id: string;
    seriesId: string;
    name: string;
    startAt: string;
    endAt: string;
    venue: string;
    status: string;
  }>;
  references: Array<{ id: string; group: string; name: string; category: string; unit: string }>;
  stockAreas: string[];
};

export type PublicSubmissionReceipt = {
  id: string;
  trackingCode: string;
  status: string;
  submittedAt: string;
  replayed: boolean;
};

export type PublicTrackingResult = {
  kind: 'request' | 'lending';
  id: string;
  status: string;
  submittedAt: string;
  updatedAt: string;
  lines: Array<{ label: string; category: string; quantity: number; unit: string; status: string }>;
  history: Array<{ status: string; at: string }>;
};

/* R3-A1-A2 — authenticated External Request Center.
 *
 * These project `GET/POST /api/portal/request`, which the Worker authorizes with
 * `authorize(request, auth, CAPABILITIES.REQUEST_CREATE)` and scopes to
 * `requester_account_id = <session account>`. Requester identity is taken from
 * the session server-side; the frontend never supplies it. This is the real
 * boundary the External Request Center is gated on — not a browser-side check.
 */

export type RequesterPortalRequestLine = {
  description: string;
  specification: string;
  category: string;
  quantity: number;
  unit: string;
  status: string;
};

export type RequesterPortalRequest = {
  id: string;
  requestType: string;
  parentRequestId: string;
  eventSeriesId: string;
  eventId: string;
  event: string;
  subEvent: string;
  department: string;
  purpose: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lines: RequesterPortalRequestLine[];
  history: Array<{ status: string; at: string }>;
};

export type RequesterPortal = {
  profile: { displayName: string; departmentId: string };
  eventSeries: Array<{ id: string; code: string; name: string }>;
  events: Array<{
    id: string;
    seriesId: string;
    name: string;
    activityType: string;
    startsAt: string;
    endsAt: string;
    venue: string;
  }>;
  /** Approved choices per category, server-owned. */
  choices: Record<string, string[]>;
  units: string[];
  requests: RequesterPortalRequest[];
};

export type RequesterSubmissionReceipt = {
  id: string;
  requestType: string;
  parentRequestId: string;
  department: string;
  event: string;
  subEvent: string;
  status: string;
  submittedAt: string;
  replayed: boolean;
};

export type AccountApplicationStatus = {
  applicationCode: string;
  state: string;
  revision: number;
  submittedAt: string;
  updatedAt: string;
  nextStep: string;
  changeRequestSummary: string;
  accountCode: string;
  activationReady: boolean;
  statusToken?: string;
  replayed: boolean;
};

export class FrontendApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly correlationId: string;

  constructor({
    code = 'REQUEST_FAILED',
    message = 'The service could not complete that request.',
    status = 0,
    correlationId = '',
  }: { code?: string; message?: string; status?: number; correlationId?: string } = {}) {
    super(message);
    this.name = 'FrontendApiError';
    this.code = code;
    this.status = status;
    this.correlationId = correlationId;
  }
}

function asRecord(value: unknown): Json {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Json) : {};
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(asString).filter(Boolean) : [];
}

function asNumber(value: unknown): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function requiredNumber(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    incomplete(`The response did not include ${field}.`);
  }
  return value;
}

function requiredPositiveInteger(value: unknown, field: string, maximum?: number): number {
  if (
    typeof value !== 'number' ||
    !Number.isInteger(value) ||
    value < 1 ||
    (maximum !== undefined && value > maximum)
  ) {
    incomplete(`The response included an invalid ${field}.`);
  }
  return value;
}

function requiredNonNegativeInteger(value: unknown, field: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 0) {
    incomplete(`The response included an invalid ${field}.`);
  }
  return value;
}

/** Never turn a redacted inventory value into a misleading zero. */
function optionalNumber(value: unknown, field: string): number | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  incomplete(`The response included an invalid ${field}.`);
}

function records(value: unknown): Json[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function incomplete(message: string): never {
  throw new FrontendApiError({ code: 'INCOMPLETE_RESPONSE', message, status: 502 });
}

function requiredString(value: unknown, field: string): string {
  const result = asString(value);
  if (!result) incomplete(`The response did not include ${field}.`);
  return result;
}

/** Strip query/hash data from a governed destination before it reaches visible UI. */
function governedDestination(value: string): string {
  try {
    const parsed = new URL(value, 'https://governed.local');
    if (value.startsWith('/')) return parsed.pathname || '/';
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      incomplete('The reference link destination did not use a supported protocol.');
    }
    return `${parsed.protocol}//${parsed.host}${parsed.pathname === '/' ? '' : parsed.pathname}`;
  } catch {
    incomplete('The reference link destination did not match the supported contract.');
  }
}

/** A canonical nullable text field may be blank, but may not be omitted or malformed. */
function requiredText(value: unknown, field: string): string {
  if (value !== null && typeof value !== 'string') incomplete(`The response did not include ${field}.`);
  return typeof value === 'string' ? value.trim() : '';
}

/** A capability-redacted text field may be absent, but cannot silently coerce malformed data. */
function optionalText(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'string') return value.trim();
  incomplete(`The response included an invalid ${field}.`);
}

function requiredStrings(value: unknown, field: string): string[] {
  if (!Array.isArray(value)) incomplete(`The response did not include ${field}.`);
  return asStrings(value);
}

function requiredBoolean(value: unknown, field: string): boolean {
  if (typeof value !== 'boolean') incomplete(`The response did not include ${field}.`);
  return value;
}

function requiredRecord(value: unknown, field: string): Json {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    incomplete(`The response did not include ${field}.`);
  }
  return value as Json;
}

function requiredRecords(value: unknown, field: string): Json[] {
  if (!Array.isArray(value)) incomplete(`The response did not include ${field}.`);
  return value.map((entry, index) => requiredRecord(entry, `${field}[${index}]`));
}

function projectScopeRevision(value: unknown, field: string) {
  if (value === null) return null;
  const revision = requiredRecord(value, field);
  return {
    token: requiredString(revision.token, `${field}.token`),
    updatedAt: requiredString(revision.updatedAt, `${field}.updatedAt`),
  };
}

function positiveInteger(value: number | undefined, fallback: number) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 1) return fallback;
  return Math.floor(value);
}

/** Builds the exact bounded same-origin Request bootstrap URL for one server page. */
export function buildRequestBootstrapPath({ page, pageSize, query, filter }: RequestBootstrapOptions = {}) {
  const params = new URLSearchParams({
    page: String(positiveInteger(page, 1)),
    pageSize: String(positiveInteger(pageSize, 25)),
  });
  const normalizedQuery = asString(query);
  const normalizedFilter = asString(filter);
  if (normalizedQuery) params.set('query', normalizedQuery);
  if (normalizedFilter) params.set('filter', normalizedFilter);
  return `/api/bootstrap/request?${params.toString()}`;
}

/** Builds the exact bounded same-origin Lending bootstrap URL for one server page. */
export function buildLendingBootstrapPath({ page, pageSize }: LendingBootstrapOptions = {}) {
  const params = new URLSearchParams({
    page: String(positiveInteger(page, 1)),
    pageSize: String(Math.min(positiveInteger(pageSize, 25), 50)),
  });
  return `/api/bootstrap/lending?${params.toString()}`;
}

function lendingMutationReceipt(payload: Json, field: string): FrontendLendingMutationReceipt {
  const ticketId = asString(payload.ticketId) || asString(payload.id);
  if (!ticketId) incomplete(`The ${field} receipt did not include ticketId.`);
  return {
    ticketId,
    status: requiredString(payload.status, `${field} receipt.status`),
    replayed: payload.replayed === true,
    correlationId: asString(payload.correlationId),
  };
}

function projectProfile(value: unknown): FrontendProfile {
  const profile = asRecord(value);
  const affiliation = asRecord(profile.affiliation);
  const accessSummary = asRecord(profile.accessSummary);
  const avatar = asRecord(profile.avatar);
  const credentialVersion = profile.credentialVersion;

  if (
    profile.affiliation === null ||
    typeof profile.affiliation !== 'object' ||
    Array.isArray(profile.affiliation)
  ) {
    incomplete('The profile response did not include affiliation.');
  }
  if (
    profile.accessSummary === null ||
    typeof profile.accessSummary !== 'object' ||
    Array.isArray(profile.accessSummary)
  ) {
    incomplete('The profile response did not include accessSummary.');
  }
  if (profile.avatar === null || typeof profile.avatar !== 'object' || Array.isArray(profile.avatar)) {
    incomplete('The profile response did not include avatar.');
  }
  if (typeof credentialVersion !== 'number' || !Number.isFinite(credentialVersion)) {
    incomplete('The profile response did not include credentialVersion.');
  }
  if (avatar.available !== false || asString(avatar.fallback) !== 'INITIALS') {
    incomplete('The profile response did not match the supported avatar contract.');
  }

  return {
    displayName: requiredString(profile.displayName, 'displayName'),
    legalName: requiredString(profile.legalName, 'legalName'),
    verifiedEmail: asString(profile.verifiedEmail),
    username: asString(profile.username),
    contactNumber: asString(profile.contactNumber),
    affiliation: {
      institutionId: asString(affiliation.institutionId),
      departmentId: asString(affiliation.departmentId),
      departmentDisplayName: asString(affiliation.departmentDisplayName),
      courseId: asString(affiliation.courseId),
      yearLevel: asString(affiliation.yearLevel),
    },
    roleId: requiredString(profile.roleId, 'roleId'),
    committeeIds: requiredStrings(profile.committeeIds, 'committeeIds'),
    accountCode: requiredString(profile.accountCode, 'accountCode'),
    accessSummary: {
      roleId: requiredString(accessSummary.roleId, 'accessSummary.roleId'),
      roleLabel: requiredString(accessSummary.roleLabel, 'accessSummary.roleLabel'),
      committeeIds: requiredStrings(accessSummary.committeeIds, 'accessSummary.committeeIds'),
      capabilities: requiredStrings(accessSummary.capabilities, 'accessSummary.capabilities'),
      workspaceIds: requiredStrings(accessSummary.workspaceIds, 'accessSummary.workspaceIds'),
      defaultWorkspaceId: asString(accessSummary.defaultWorkspaceId),
      scopeMode: asString(accessSummary.scopeMode),
    },
    revision: requiredString(profile.revision, 'revision'),
    credentialVersion,
    updatedAt: requiredString(profile.updatedAt, 'updatedAt'),
    avatar: {
      available: false,
      initials: requiredString(avatar.initials, 'avatar.initials'),
      fallback: 'INITIALS',
    },
  };
}

function projectUser(value: unknown): FrontendUser | null {
  const user = asRecord(value);
  const authorization = asRecord(user.authorization);
  const capabilities = asStrings(authorization.capabilities);
  const accountId = asString(user.accountId);
  if (!accountId || authorization.active !== true || asString(authorization.mappingStatus) !== 'MAPPED')
    return null;
  return {
    accountId,
    displayName: asString(user.displayName) || accountId,
    roleId: asString(authorization.roleId) || 'REQUESTER',
    capabilities,
  };
}

export class FrontendBackend {
  private csrfToken = '';

  private async request(
    path: string,
    {
      method = 'POST',
      body,
      csrf = false,
      signal,
      bearerToken = '',
    }: { method?: string; body?: unknown; csrf?: boolean; signal?: AbortSignal; bearerToken?: string } = {},
  ): Promise<Json> {
    const headers: Record<string, string> = { accept: 'application/json' };
    if (body !== undefined) headers['content-type'] = 'application/json';
    if (csrf && this.csrfToken) headers['x-csrf-token'] = this.csrfToken;
    if (bearerToken) headers.authorization = `Bearer ${bearerToken}`;
    let response: Response;
    try {
      response = await fetch(path, {
        method,
        credentials: 'include',
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
    } catch (error) {
      if ((error as { name?: string } | null)?.name === 'AbortError') throw error;
      throw new FrontendApiError({
        code: 'SERVICE_UNAVAILABLE',
        message: 'The service is temporarily unavailable.',
      });
    }
    const payload = asRecord(await response.json().catch(() => null));
    if (!response.ok) {
      throw new FrontendApiError({
        code: asString(payload.code) || 'REQUEST_FAILED',
        message: asString(payload.message) || 'The service could not complete that request.',
        status: response.status,
        correlationId: asString(payload.correlationId),
      });
    }
    return payload;
  }

  private sessionFrom(payload: Json): FrontendSession | null {
    if (asString(payload.state) !== 'AUTHENTICATED') return null;
    const user = projectUser(payload.user);
    const csrfToken = asString(payload.csrfToken);
    if (!user || !csrfToken) return null;
    this.csrfToken = csrfToken;
    return { user, csrfToken };
  }

  async session(): Promise<FrontendSession | null> {
    try {
      return this.sessionFrom(await this.request('/api/auth/session', { method: 'GET' }));
    } catch (error) {
      if (error instanceof FrontendApiError && [401, 403].includes(error.status)) {
        this.csrfToken = '';
        return null;
      }
      throw error;
    }
  }

  async profile(signal?: AbortSignal): Promise<FrontendProfile> {
    const payload = await this.request('/api/me/profile', { method: 'GET', signal });
    return projectProfile(payload.profile);
  }

  async version(signal?: AbortSignal): Promise<FrontendVersion> {
    const payload = await this.request('/api/version', { method: 'GET', signal });
    return { playground: payload.playground === true };
  }

  /**
   * FI-10: read only the existing access-admin account directory. Raw account
   * identifiers and revision tokens deliberately do not cross this projection.
   */
  async adminAccountDirectory(signal?: AbortSignal): Promise<FrontendAdminAccountDirectory> {
    const payload = await this.request('/api/admin/access/directory', {
      body: { page: 1, pageSize: 25, status: 'ALL' },
      csrf: true,
      signal,
    });
    if (payload.ok !== true || !Array.isArray(payload.items)) {
      incomplete('The account directory response did not match the supported access-admin contract.');
    }
    return {
      page: requiredNumber(payload.page, 'account directory page'),
      pageSize: requiredNumber(payload.pageSize, 'account directory pageSize'),
      total: requiredNumber(payload.total, 'account directory total'),
      items: records(payload.items).map((row) => ({
        accessId: requiredString(row.accessId, 'account directory accessId'),
        displayName: requiredString(row.displayName, 'account directory displayName'),
        roleId: requiredString(row.roleId, 'account directory roleId'),
        status: requiredString(row.status, 'account directory status'),
        firstLoginPending: row.firstLoginPending === true,
        locked: row.locked === true,
      })),
    };
  }

  /**
   * FI-10: preserve the canonical directory's conditional business-identity
   * exposure. The opaque person identifier is retained only to read a selected
   * record's activity and is never part of a display projection.
   */
  async staffDirectory(signal?: AbortSignal): Promise<FrontendStaffDirectory> {
    const payload = await this.request('/api/admin/staff-directory', {
      body: { page: 1, pageSize: 25 },
      signal,
    });
    if (payload.ok !== true || !Array.isArray(payload.items)) {
      incomplete('The staff directory response did not match the supported canonical directory contract.');
    }
    return {
      page: requiredNumber(payload.page, 'staff directory page'),
      pageSize: requiredNumber(payload.pageSize, 'staff directory pageSize'),
      query: asString(payload.query),
      total: requiredNumber(payload.total, 'staff directory total'),
      items: records(payload.items).map((row) => {
        const assignmentSummary = asRecord(row.assignmentSummary);
        return {
          opaquePersonId: requiredString(row.personId, 'staff directory personId'),
          displayName: asString(row.displayName) || null,
          accessId: asString(row.accessId) || null,
          linkState: requiredString(row.linkState, 'staff directory linkState'),
          emailState: requiredString(row.emailState, 'staff directory emailState'),
          assignmentSummary: {
            activeCount: requiredNumber(assignmentSummary.activeCount, 'staff directory active assignments'),
            historicalCount: requiredNumber(
              assignmentSummary.historicalCount,
              'staff directory historical assignments',
            ),
            quarantinedCount: requiredNumber(
              assignmentSummary.quarantinedCount,
              'staff directory quarantined assignments',
            ),
            provenanceState: requiredString(
              assignmentSummary.provenanceState,
              'staff directory assignment provenance',
            ),
          },
        };
      }),
    };
  }

  /**
   * FI-10: project only non-sensitive retained activity fields. The Worker
   * supplies account/correlation identifiers for backend traceability, but this
   * presentation model intentionally drops them before React receives data.
   */
  async staffAccountActivityHistory(
    opaquePersonId: string,
    signal?: AbortSignal,
  ): Promise<FrontendStaffActivityHistory> {
    const payload = await this.request('/api/admin/staff-account-activity-history', {
      body: { personId: opaquePersonId, page: 1, pageSize: 25 },
      signal,
    });
    if (payload.ok !== true || !Array.isArray(payload.items)) {
      incomplete('The staff activity response did not match the supported retained-history contract.');
    }
    return {
      historyStartsAt: asString(payload.historyStartsAt),
      page: requiredNumber(payload.page, 'staff activity page'),
      pageSize: requiredNumber(payload.pageSize, 'staff activity pageSize'),
      total: requiredNumber(payload.total, 'staff activity total'),
      totalPages: requiredNumber(payload.totalPages, 'staff activity totalPages'),
      items: records(payload.items).map((row) => ({
        occurredAt: asString(row.occurredAt),
        eventType: asString(row.eventType),
        actionCode: asString(row.actionCode),
        linkState: asString(row.linkState),
        previousLinkState: asString(row.previousLinkState),
        assignmentState: asString(row.assignmentState),
        previousAssignmentState: asString(row.previousAssignmentState),
        oldEffectiveFrom: asString(row.oldEffectiveFrom),
        oldEffectiveTo: asString(row.oldEffectiveTo),
        newEffectiveFrom: asString(row.newEffectiveFrom),
        newEffectiveTo: asString(row.newEffectiveTo),
      })),
    };
  }

  /**
   * FI-11: render only governed, human-readable reference-link fields. IDs,
   * revisions, and correlation data are intentionally removed before React.
   */
  async referenceLinks(signal?: AbortSignal): Promise<FrontendReferenceLink[]> {
    const payload = await this.request('/api/admin/reference-links/list', {
      body: { page: 1, pageSize: 50 },
      csrf: true,
      signal,
    });
    if (payload.ok !== true || !Array.isArray(payload.items)) {
      incomplete('The Reference Link Registry response did not match the supported read-only contract.');
    }
    return records(payload.items).map((row) => ({
      label: requiredString(row.label, 'reference link label'),
      destination: governedDestination(requiredString(row.url, 'reference link url')),
      linkType: requiredString(row.linkType, 'reference link type'),
      audience: requiredString(row.audience, 'reference link audience'),
      status: requiredString(row.status, 'reference link status'),
      syncState: requiredString(row.syncState, 'reference link syncState'),
      updatedAt: asString(row.updatedAt),
      archivedAt: asString(row.archivedAt),
    }));
  }

  /**
   * FI-11: the only permitted brand view is public slot/path/publication
   * metadata. Version, object, hash, actor, and audit data remain server-only.
   */
  async brandAssetSlots(signal?: AbortSignal): Promise<FrontendBrandAssetSlot[]> {
    const payload = await this.request('/api/owner/brand-assets/list', {
      body: {},
      csrf: true,
      signal,
    });
    if (payload.ok !== true || !Array.isArray(payload.slots)) {
      incomplete('The governed brand asset response did not match the supported read-only contract.');
    }
    return records(payload.slots).map((row) => ({
      label: requiredString(row.label, 'brand asset label'),
      publicPath: requiredString(row.public_path ?? row.publicPath, 'brand asset public path'),
      publicationState: asString(row.published_version_id ?? row.publishedVersionId)
        ? 'PUBLISHED'
        : 'NOT_PUBLISHED',
      publishedAt: asString(row.published_at ?? row.publishedAt),
    }));
  }

  /**
   * FI-11: retain event relationships only long enough to assemble a safe
   * read-only display projection. No raw link, source, history, or actor data
   * is returned to the UI.
   */
  async eventManagement(signal?: AbortSignal): Promise<FrontendEventManagement> {
    const payload = await this.request('/api/getEventManagement', {
      body: {},
      csrf: true,
      signal,
    });
    if (
      payload.ok !== true ||
      !Array.isArray(payload.eventSeries) ||
      !Array.isArray(payload.eventDays) ||
      !Array.isArray(payload.activities)
    ) {
      incomplete('The Event Management response did not match the supported read-only contract.');
    }
    const series = records(payload.eventSeries).map((row) => ({
      opaqueId: requiredString(row.id, 'event series id'),
      name: requiredString(row.name, 'event series name'),
      code: asString(row.code),
      status: requiredString(row.status, 'event series status'),
    }));
    const seriesById = new Map(series.map((entry) => [entry.opaqueId, entry]));
    const days = records(payload.eventDays).map((row) => ({
      opaqueId: requiredString(row.id, 'event day id'),
      seriesId: requiredString(row.seriesId, 'event day seriesId'),
      name: requiredString(row.name, 'event day name'),
      date: asString(row.date),
      status: requiredString(row.status, 'event day status'),
    }));
    const dayById = new Map(days.map((entry) => [entry.opaqueId, entry]));
    return {
      series: series.map(({ opaqueId: _opaqueId, ...entry }) => entry),
      days: days.map(({ opaqueId: _opaqueId, seriesId, ...entry }) => ({
        ...entry,
        seriesName: seriesById.get(seriesId)?.name || 'Series not reported',
      })),
      activities: records(payload.activities).map((row) => {
        const day = dayById.get(asString(row.eventDayId));
        return {
          name: requiredString(row.name, 'event activity name'),
          seriesName: day ? seriesById.get(day.seriesId)?.name || 'Series not reported' : 'Series not reported',
          date: day?.date || '',
          activityType: asString(row.activityType),
          status: requiredString(row.status, 'event activity status'),
          timeStatus: asString(row.timeStatus),
        };
      }),
    };
  }

  /**
   * FI-11: public technical endpoints are read only after system.admin has
   * admitted presentation. Their raw release, schema, migration, dependency,
   * and correlation fields deliberately never cross this projection.
   */
  async systemStatus(signal?: AbortSignal): Promise<FrontendSystemStatus> {
    await this.request('/api/health', { method: 'GET', signal });
    try {
      const readiness = await this.request('/api/readiness', { method: 'GET', signal });
      return {
        technicalResponse: 'RESPONSE_RECEIVED',
        readiness: readiness.ok === true && readiness.ready === true ? 'REPORTED_READY' : 'NOT_REPORTED_READY',
      };
    } catch (error) {
      if (error instanceof FrontendApiError && error.status === 503) {
        return { technicalResponse: 'RESPONSE_RECEIVED', readiness: 'NOT_REPORTED_READY' };
      }
      throw error;
    }
  }

  /**
   * FI-05: the authenticated Inventory projection is deliberately read from the
   * existing module bootstrap.  The Worker remains the sole authority for the
   * session, `view.inventory` capability, operational scope, and ledger-derived
   * quantities; this adapter supplies no identity, capability, or stock values.
   */
  async inventoryBootstrap(signal?: AbortSignal): Promise<FrontendInventoryBootstrap> {
    const payload = await this.request('/api/bootstrap/inventory', { method: 'GET', signal });
    if (asString(payload.contract) !== 'bootstrap-module' || asString(payload.module) !== 'inventory') {
      incomplete('The inventory response did not match the supported module bootstrap contract.');
    }
    const data = asRecord(payload.data);
    if (!Array.isArray(data.inventoryItems)) {
      incomplete('The inventory response did not include inventoryItems.');
    }
    const revision = asRecord(payload.scopeRevision);
    return {
      inventoryItems: records(data.inventoryItems).map((item) => ({
        id: requiredString(item.id, 'inventoryItems.id'),
        name: requiredString(item.name, 'inventoryItems.name'),
        category: requiredString(item.category, 'inventoryItems.category'),
        unit: requiredString(item.unit, 'inventoryItems.unit'),
        onHand: requiredNumber(item.onHand, 'inventoryItems.onHand'),
        reserved: requiredNumber(item.reserved, 'inventoryItems.reserved'),
        availableToPromise: requiredNumber(item.availableToPromise, 'inventoryItems.availableToPromise'),
        reorderThreshold: requiredNumber(item.reorderThreshold, 'inventoryItems.reorderThreshold'),
        lowStockState: asString(item.lowStockState) as FrontendInventoryItem['lowStockState'],
        isLendable: item.isLendable === true,
        lendingStatus: asString(item.lendingStatus),
        inventoryKind: asString(item.inventoryKind),
        classificationStatus: asString(item.classificationStatus),
        conditionReviewState: asString(item.conditionReviewState),
        maintenanceReviewState: asString(item.maintenanceReviewState),
        updatedAt: requiredString(item.updatedAt, 'inventoryItems.updatedAt'),
      })),
      scopeRevision:
        revision.token && revision.updatedAt
          ? { token: asString(revision.token), updatedAt: asString(revision.updatedAt) }
          : null,
    };
  }

  /**
   * FI-06: project only the existing authenticated Request bootstrap v2. The
   * Worker controls scope, pagination, lifecycle values, and catalog truth; this
   * adapter fails closed rather than filling in a partial review queue locally.
   */
  async requestBootstrap(options: RequestBootstrapOptions = {}): Promise<FrontendRequestBootstrap> {
    const payload = await this.request(buildRequestBootstrapPath(options), {
      method: 'GET',
      signal: options.signal,
    });
    if (
      asString(payload.contract) !== 'bootstrap-module' ||
      asString(payload.module) !== 'request' ||
      requiredNumber(payload.contractVersion, 'request bootstrap contractVersion') !== 2 ||
      payload.requestOnly === true
    ) {
      incomplete('The response did not match the authenticated Request bootstrap v2 contract.');
    }

    const data = requiredRecord(payload.data, 'request bootstrap data');
    const mapRequest = (row: Json): FrontendRequest => ({
      id: requiredString(row.id, 'requests.id'),
      type: requiredString(row.type, 'requests.type'),
      stage: asString(row.stage),
      parentRequestId: asString(row.parentRequestId),
      eventSeriesId: asString(row.eventSeriesId),
      eventDayId: asString(row.eventDayId),
      eventId: asString(row.eventId),
      ownerCommitteeId: asString(row.ownerCommitteeId),
      catalogType: asString(row.catalogType),
      department: asString(row.department),
      requesterName: asString(row.requesterName),
      purpose: asString(row.purpose),
      status: requiredString(row.status, 'requests.status'),
      priority: asString(row.priority),
      createdAt: requiredString(row.createdAt, 'requests.createdAt'),
      updatedAt: requiredString(row.updatedAt, 'requests.updatedAt'),
    });
    const mapLine = (row: Json): FrontendRequestLine => ({
      id: requiredString(row.id, 'requestLines.id'),
      requestId: requiredString(row.requestId, 'requestLines.requestId'),
      eventId: asString(row.eventId),
      itemId: asString(row.itemId),
      description: requiredString(row.description, 'requestLines.description'),
      specification: asString(row.specification),
      category: asString(row.category),
      quantity: requiredNumber(row.quantity, 'requestLines.quantity'),
      unit: requiredString(row.unit, 'requestLines.unit'),
      fulfillmentSource: asString(row.fulfillmentSource),
      neededAt: asString(row.neededAt),
      returnDue: asString(row.returnDue),
      releasedQuantity: requiredNumber(row.releasedQuantity, 'requestLines.releasedQuantity'),
      receivedQuantity: requiredNumber(row.receivedQuantity, 'requestLines.receivedQuantity'),
      status: requiredString(row.status, 'requestLines.status'),
      workflowRevision: requiredNumber(row.workflowRevision, 'requestLines.workflowRevision'),
      createdAt: requiredString(row.createdAt, 'requestLines.createdAt'),
      updatedAt: requiredString(row.updatedAt, 'requestLines.updatedAt'),
    });
    const mapEventSeries = (row: Json): FrontendRequestEventSeries => ({
      id: requiredString(row.id, 'eventSeries.id'),
      code: requiredString(row.code, 'eventSeries.code'),
      name: requiredString(row.name, 'eventSeries.name'),
      status: requiredString(row.status, 'eventSeries.status'),
    });
    const mapEventDay = (row: Json): FrontendRequestEventDay => ({
      id: requiredString(row.id, 'eventDays.id'),
      seriesId: requiredString(row.seriesId, 'eventDays.seriesId'),
      name: requiredString(row.name, 'eventDays.name'),
      date: requiredString(row.date, 'eventDays.date'),
      status: requiredString(row.status, 'eventDays.status'),
    });
    const mapEvent = (row: Json): FrontendRequestEvent => ({
      id: requiredString(row.id, 'events.id'),
      seriesId: requiredString(row.seriesId, 'events.seriesId'),
      name: requiredString(row.name, 'events.name'),
      startAt: requiredString(row.startAt, 'events.startAt'),
      endAt: requiredString(row.endAt, 'events.endAt'),
      eventDayId: asString(row.eventDayId),
      activityType: asString(row.activityType),
      timeStatus: asString(row.timeStatus),
      venue: asString(row.venue),
      status: requiredString(row.status, 'events.status'),
    });
    const mapInventoryReference = (row: Json): FrontendRequestInventoryReference => ({
      id: requiredString(row.id, 'inventoryItems.id'),
      name: requiredString(row.name, 'inventoryItems.name'),
      category: requiredString(row.category, 'inventoryItems.category'),
      unit: requiredString(row.unit, 'inventoryItems.unit'),
      status: requiredString(row.status, 'inventoryItems.status'),
      catalogType: asString(row.catalogType),
    });
    const pagination = requiredRecord(payload.pagination, 'request pagination');
    return {
      requests: requiredRecords(data.requests, 'requests').map(mapRequest),
      requestLines: requiredRecords(data.requestLines, 'requestLines').map(mapLine),
      eventSeries: requiredRecords(data.eventSeries, 'eventSeries').map(mapEventSeries),
      eventDays: requiredRecords(data.eventDays, 'eventDays').map(mapEventDay),
      events: requiredRecords(data.events, 'events').map(mapEvent),
      inventoryItems: requiredRecords(data.inventoryItems, 'inventoryItems').map(mapInventoryReference),
      pagination: {
        page: requiredNumber(pagination.page, 'pagination.page'),
        pageSize: requiredNumber(pagination.pageSize, 'pagination.pageSize'),
        total: requiredNumber(pagination.total, 'pagination.total'),
        hasMore: requiredBoolean(pagination.hasMore, 'pagination.hasMore'),
      },
      scopeRevision: projectScopeRevision(payload.scopeRevision, 'request scopeRevision'),
    };
  }

  /**
   * FI-07: project the canonical authenticated lending queue and fail closed on
   * a wrong module/version/request-only payload or any partial queue row.
   */
  async lendingBootstrap(options: LendingBootstrapOptions = {}): Promise<FrontendLendingBootstrap> {
    const payload = await this.request(buildLendingBootstrapPath(options), {
      method: 'GET',
      signal: options.signal,
    });
    if (
      payload.ok !== true ||
      asString(payload.contract) !== 'bootstrap-module' ||
      asString(payload.module) !== 'lending' ||
      requiredNumber(payload.contractVersion, 'lending bootstrap contractVersion') !== 2 ||
      payload.requestOnly !== false
    ) {
      incomplete('The response did not match the authenticated Lending bootstrap v2 contract.');
    }
    const data = requiredRecord(payload.data, 'lending bootstrap data');
    const mapAsset = (row: Json): FrontendLendingAssetOption => {
      const status = requiredString(row.status, 'assetOptions.status');
      if (status !== 'AVAILABLE') {
        incomplete('The response included an asset option that is not an available review candidate.');
      }
      return {
        id: requiredString(row.id, 'assetOptions.id'),
        itemId: requiredString(row.itemId, 'assetOptions.itemId'),
        assetTag: requiredText(row.assetTag, 'assetOptions.assetTag'),
        serialNumber: requiredText(row.serialNumber, 'assetOptions.serialNumber'),
        condition: requiredText(row.condition, 'assetOptions.condition'),
        status,
      };
    };
    const mapHistory = (row: Json): FrontendLendingHistoryEntry => ({
      previousStatus: requiredText(row.previousStatus, 'history.previousStatus'),
      newStatus: requiredString(row.newStatus, 'history.newStatus'),
      changedAt: requiredString(row.changedAt, 'history.changedAt'),
      changedBy: requiredText(row.changedBy, 'history.changedBy'),
      reason: requiredText(row.reason, 'history.reason'),
      metadata: requiredRecord(row.metadata, 'history.metadata'),
    });
    const mapTicket = (row: Json): FrontendLendingTicket => ({
      id: requiredString(row.id, 'lendingTickets.id'),
      itemId: requiredString(row.itemId, 'lendingTickets.itemId'),
      requestedItemId: requiredString(row.requestedItemId, 'lendingTickets.requestedItemId'),
      quantity: requiredNumber(row.quantity, 'lendingTickets.quantity'),
      requestedQuantity: requiredNumber(row.requestedQuantity, 'lendingTickets.requestedQuantity'),
      unit: requiredString(row.unit, 'lendingTickets.unit'),
      studentIdNumber: requiredText(row.studentIdNumber, 'lendingTickets.studentIdNumber'),
      borrowerName: requiredText(row.borrowerName, 'lendingTickets.borrowerName'),
      borrowerType: requiredString(row.borrowerType, 'lendingTickets.borrowerType'),
      department: requiredText(row.department, 'lendingTickets.department'),
      contact: requiredText(row.contact, 'lendingTickets.contact'),
      email: requiredText(row.email, 'lendingTickets.email'),
      courseYear: requiredText(row.courseYear, 'lendingTickets.courseYear'),
      positionRole: requiredText(row.positionRole, 'lendingTickets.positionRole'),
      purpose: requiredText(row.purpose, 'lendingTickets.purpose'),
      dueAt: requiredText(row.dueAt, 'lendingTickets.dueAt'),
      requestedStartAt: requiredText(row.requestedStartAt, 'lendingTickets.requestedStartAt'),
      requestedEndAt: requiredText(row.requestedEndAt, 'lendingTickets.requestedEndAt'),
      ticketType: requiredString(row.ticketType, 'lendingTickets.ticketType'),
      status: requiredString(row.status, 'lendingTickets.status'),
      reviewDecision: requiredText(row.reviewDecision, 'lendingTickets.reviewDecision'),
      reviewNotes: requiredText(row.reviewNotes, 'lendingTickets.reviewNotes'),
      rejectionReason: requiredText(row.rejectionReason, 'lendingTickets.rejectionReason'),
      substitutionNote: requiredText(row.substitutionNote, 'lendingTickets.substitutionNote'),
      eligibilitySource: requiredText(row.eligibilitySource, 'lendingTickets.eligibilitySource'),
      eligibilityReviewedBy: requiredText(row.eligibilityReviewedBy, 'lendingTickets.eligibilityReviewedBy'),
      eligibilityReviewedAt: requiredText(row.eligibilityReviewedAt, 'lendingTickets.eligibilityReviewedAt'),
      assetOptions: requiredRecords(row.assetOptions, 'lendingTickets.assetOptions').map(mapAsset),
      history: requiredRecords(row.history, 'lendingTickets.history').map(mapHistory),
      createdAt: requiredString(row.createdAt, 'lendingTickets.createdAt'),
      updatedAt: requiredString(row.updatedAt, 'lendingTickets.updatedAt'),
    });
    const mapInventoryItem = (row: Json): FrontendLendingInventoryItem => {
      const storageLocation = optionalText(row.storageLocation, 'inventoryItems.storageLocation');
      const conditionReviewState = optionalText(
        row.conditionReviewState,
        'inventoryItems.conditionReviewState',
      );
      const maintenanceReviewState = optionalText(
        row.maintenanceReviewState,
        'inventoryItems.maintenanceReviewState',
      );
      const availableToPromise = optionalNumber(row.availableToPromise, 'inventoryItems.availableToPromise');
      const lendableAvailable = optionalNumber(row.lendableAvailable, 'inventoryItems.lendableAvailable');
      const readyToClaim = optionalNumber(row.readyToClaim, 'inventoryItems.readyToClaim');
      const onLoan = optionalNumber(row.onLoan, 'inventoryItems.onLoan');
      const overdue = optionalNumber(row.overdue, 'inventoryItems.overdue');
      const damaged = optionalNumber(row.damaged, 'inventoryItems.damaged');
      const maintenance = optionalNumber(row.maintenance, 'inventoryItems.maintenance');
      const traceableAssets = optionalNumber(row.traceableAssets, 'inventoryItems.traceableAssets');
      const availableAssets = optionalNumber(row.availableAssets, 'inventoryItems.availableAssets');
      const maximumLoanQuantity = optionalNumber(
        row.maximumLoanQuantity,
        'inventoryItems.maximumLoanQuantity',
      );
      return {
        id: requiredString(row.id, 'inventoryItems.id'),
        name: requiredString(row.name, 'inventoryItems.name'),
        category: requiredString(row.category, 'inventoryItems.category'),
        unit: requiredString(row.unit, 'inventoryItems.unit'),
        status: requiredString(row.status, 'inventoryItems.status'),
        catalogType: requiredText(row.catalogType, 'inventoryItems.catalogType'),
        stockArea: requiredText(row.stockArea, 'inventoryItems.stockArea'),
        ...(storageLocation ? { storageLocation } : {}),
        isLendable: requiredBoolean(row.isLendable, 'inventoryItems.isLendable'),
        lendingKind: requiredText(row.lendingKind, 'inventoryItems.lendingKind'),
        lendingStatus: requiredText(row.lendingStatus, 'inventoryItems.lendingStatus'),
        lendingAudience: requiredText(row.lendingAudience, 'inventoryItems.lendingAudience'),
        eligibilityRule: requiredText(row.eligibilityRule, 'inventoryItems.eligibilityRule'),
        conditionTracked: requiredBoolean(row.conditionTracked, 'inventoryItems.conditionTracked'),
        ...(conditionReviewState ? { conditionReviewState } : {}),
        ...(maintenanceReviewState ? { maintenanceReviewState } : {}),
        ...(availableToPromise !== undefined ? { availableToPromise } : {}),
        ...(lendableAvailable !== undefined ? { lendableAvailable } : {}),
        ...(readyToClaim !== undefined ? { readyToClaim } : {}),
        ...(onLoan !== undefined ? { onLoan } : {}),
        ...(overdue !== undefined ? { overdue } : {}),
        ...(damaged !== undefined ? { damaged } : {}),
        ...(maintenance !== undefined ? { maintenance } : {}),
        ...(traceableAssets !== undefined ? { traceableAssets } : {}),
        ...(availableAssets !== undefined ? { availableAssets } : {}),
        ...(maximumLoanQuantity !== undefined ? { maximumLoanQuantity } : {}),
      };
    };
    const pagination = requiredRecord(payload.pagination, 'lending pagination');
    const scopeRevision = projectScopeRevision(payload.scopeRevision, 'lending scopeRevision');
    if (!scopeRevision) incomplete('The response did not include lending scopeRevision.');
    return {
      lendingTickets: requiredRecords(data.lendingTickets, 'lendingTickets').map(mapTicket),
      inventoryItems: requiredRecords(data.inventoryItems, 'inventoryItems').map(mapInventoryItem),
      pagination: {
        page: requiredPositiveInteger(pagination.page, 'lending pagination.page'),
        pageSize: requiredPositiveInteger(pagination.pageSize, 'lending pagination.pageSize', 50),
        total: requiredNonNegativeInteger(pagination.total, 'lending pagination.total'),
        hasMore: requiredBoolean(pagination.hasMore, 'lending pagination.hasMore'),
      },
      scopeRevision,
    };
  }

  async approveLendingTicket(command: {
    ticketId: string;
    decision: 'APPROVE' | 'PARTIAL_APPROVE' | 'SUBSTITUTE' | 'REJECT';
    identityVerified?: boolean;
    identityVerificationSource?: string;
    approvedQuantity?: number;
    substitutionItemId?: string;
    reviewReason?: string;
    reviewNotes?: string;
    assetIds?: string[];
    clientRequestId: string;
  }): Promise<FrontendLendingMutationReceipt> {
    return lendingMutationReceipt(
      await this.request('/api/approveLendingTicket', { body: command, csrf: true }),
      'lending review',
    );
  }

  async confirmLendingHandoff(command: {
    ticketId: string;
    conditionLabel?: string;
    notes?: string;
    clientRequestId: string;
  }): Promise<FrontendLendingMutationReceipt> {
    return lendingMutationReceipt(
      await this.request('/api/confirmLendingHandoff', { body: command, csrf: true }),
      'lending handoff',
    );
  }

  async uploadLendingReturnEvidence(command: {
    evidenceType: 'LENDING_RETURN_PHOTO';
    relatedEntityType: 'LENDING';
    relatedEntityId: string;
    lendingTicketId: string;
    originalFileName: string;
    mimeType: string;
    base64: string;
    clientRequestId: string;
  }): Promise<FrontendEvidenceReceipt> {
    const payload = await this.request('/api/uploadEvidence', { body: command, csrf: true });
    const evidenceId = asString(payload.evidenceId) || asString(payload.id);
    if (!evidenceId) incomplete('The lending evidence receipt did not include evidenceId.');
    return {
      evidenceId,
      uploadStatus: requiredString(payload.uploadStatus, 'lending evidence receipt.uploadStatus'),
      duplicate: payload.duplicate === true,
      correlationId: asString(payload.correlationId),
    };
  }

  async confirmLendingReturn(command: {
    ticketId: string;
    conditionLabel: string;
    evidenceId: string;
    returnedQuantity: number;
    lostQuantity: number;
    damagedBeyondUseQuantity: number;
    notes?: string;
    clientRequestId: string;
  }): Promise<FrontendLendingMutationReceipt> {
    return lendingMutationReceipt(
      await this.request('/api/confirmReturn', { body: command, csrf: true }),
      'lending return',
    );
  }

  async reviewRequest(command: {
    requestId: string;
    decision: 'ACCEPT' | 'REJECT' | 'MISSING_INFORMATION';
    lineDecisions?: Array<{ lineId: string; decision: string }>;
    note?: string;
    clientRequestId: string;
  }): Promise<{ requestId: string; status: string; replayed: boolean; correlationId: string }> {
    const payload = await this.request('/api/reviewRequest', { body: command, csrf: true });
    const requestId = asString(payload.requestId) || asString(payload.id);
    if (!requestId) incomplete('The review receipt did not include requestId.');
    return {
      requestId,
      status: requiredString(payload.status, 'review receipt.status'),
      replayed: payload.replayed === true,
      correlationId: asString(payload.correlationId),
    };
  }

  async login(
    accessId: string,
    password: string,
  ): Promise<{ session: FrontendSession | null; activationRequired: boolean; activationExpiresAt: string }> {
    const payload = await this.request('/api/auth/login', { body: { accessId, password } });
    const activationRequired = asString(payload.state) === 'ACTIVATION_REQUIRED';
    if (activationRequired) {
      const csrfToken = asString(payload.csrfToken);
      if (!csrfToken) incomplete('The activation response did not include its required security token.');
      this.csrfToken = csrfToken;
    }
    return {
      session: this.sessionFrom(payload),
      activationRequired,
      activationExpiresAt: activationRequired ? asString(payload.expiresAt) : '',
    };
  }

  async activateStarter(
    profile: { fullName: string; mobileNumber: string; email: string },
    password: string,
    confirmPassword: string,
  ): Promise<FrontendSession> {
    if (!this.csrfToken) incomplete('The activation session is no longer available. Sign in again.');
    const payload = await this.request('/api/auth/activate', {
      body: { profile, password, confirmPassword },
      csrf: true,
    });
    const session = this.sessionFrom(payload);
    if (!session) incomplete('The activation service returned an incomplete authenticated session.');
    return session;
  }

  async logout(): Promise<void> {
    try {
      if (this.csrfToken) await this.request('/api/auth/logout', { body: {}, csrf: true });
    } finally {
      this.csrfToken = '';
    }
  }

  async publicAdvertisements(signal?: AbortSignal): Promise<Json> {
    return this.request('/api/public/advertisements', { method: 'GET', signal });
  }

  async publicLendingCatalog(signal?: AbortSignal): Promise<PublicLendingCatalog> {
    const payload = await this.request('/api/public/lending/catalog', { method: 'GET', signal });
    const items = records(payload.items)
      .map((item) => ({
        id: asString(item.id),
        productId: asString(item.productId),
        name: asString(item.name),
        aliases: asStrings(item.aliases),
        category: asString(item.category),
        type: asString(item.type) === 'CONSUMABLE' ? ('CONSUMABLE' as const) : ('REUSABLE' as const),
        availability: asString(item.availability) as PublicLendingItem['availability'],
        unit: asString(item.unit),
        maximumQuantity: Math.max(1, asNumber(item.maximumQuantity)),
        defaultLoanDays: Math.max(0, asNumber(item.defaultLoanDays)),
        dueDateRequired: item.dueDateRequired === true,
        acknowledgmentRequired: item.acknowledgmentRequired === true,
        eligibility: asString(item.eligibility),
        handlingNotes: asString(item.handlingNotes),
        description: asString(item.description),
        restrictions: asString(item.restrictions),
        imageUrl: asString(item.imageUrl),
        conditionTracked: item.conditionTracked === true,
      }))
      .filter((item) => item.id && item.name && item.unit);
    return { items, uscDepartments: asStrings(payload.uscDepartments) };
  }

  async submitPublicLending(command: Json): Promise<PublicSubmissionReceipt> {
    const payload = await this.request('/api/public/lending', { body: command });
    const id = asString(payload.submissionId);
    const trackingCode = asString(payload.trackingCode);
    const status = asString(payload.status);
    if (!id || !trackingCode || !status)
      return incomplete('The lending service returned an incomplete receipt.');
    return {
      id,
      trackingCode,
      status,
      submittedAt: asString(payload.submittedAt),
      replayed: payload.replayed === true,
    };
  }

  async trackPublicLending(command: Json): Promise<PublicTrackingResult> {
    const payload = await this.request('/api/public/lending/track', { body: command });
    const id = asString(payload.submissionId);
    const status = asString(payload.status);
    if (!id || !status) return incomplete('The lending service returned an incomplete status.');
    return {
      kind: 'lending',
      id,
      status,
      submittedAt: asString(payload.submittedAt),
      updatedAt: asString(payload.updatedAt),
      lines: records(payload.lines).map((line) => ({
        label: asString(line.itemName) || 'Requested item',
        category: asString(line.ticketType),
        quantity: asNumber(line.quantity),
        unit: asString(line.unit),
        status: asString(line.status),
      })),
      history: records(payload.history).map((entry) => ({
        status: asString(entry.status),
        at: asString(entry.changedAt),
      })),
    };
  }

  async publicRequestOptions(signal?: AbortSignal): Promise<PublicRequestOptions> {
    const payload = await this.request('/api/public/request/options', { method: 'GET', signal });
    return {
      requesterTypes: asStrings(payload.requesterTypes),
      categories: asStrings(payload.categories),
      items: records(payload.items)
        .map((item) => ({
          id: asString(item.id),
          name: asString(item.name),
          category: asString(item.category),
          unit: asString(item.unit),
        }))
        .filter((item) => item.id && item.name),
      eventSeries: records(payload.eventSeries)
        .map((series) => ({
          id: asString(series.id),
          code: asString(series.code),
          name: asString(series.name),
          status: asString(series.status),
        }))
        .filter((series) => series.id && series.name),
      events: records(payload.events)
        .map((event) => ({
          id: asString(event.id),
          seriesId: asString(event.seriesId),
          name: asString(event.name),
          startAt: asString(event.startAt),
          endAt: asString(event.endAt),
          venue: asString(event.venue),
          status: asString(event.status),
        }))
        .filter((event) => event.id && event.name),
      references: records(payload.references)
        .map((reference) => ({
          id: asString(reference.id),
          group: asString(reference.group),
          name: asString(reference.name),
          category: asString(reference.category),
          unit: asString(reference.unit),
        }))
        .filter((reference) => reference.id && reference.name),
      stockAreas: asStrings(payload.stockAreas),
    };
  }

  async submitPublicRequest(command: Json): Promise<PublicSubmissionReceipt> {
    const payload = await this.request('/api/public/request', { body: command });
    const id = asString(payload.requestId);
    const trackingCode = asString(payload.trackingCode);
    const status = asString(payload.status);
    if (!id || !trackingCode || !status)
      return incomplete('The request service returned an incomplete receipt.');
    return { id, trackingCode, status, submittedAt: '', replayed: payload.replayed === true };
  }

  async trackPublicRequest(command: Json): Promise<PublicTrackingResult> {
    const payload = await this.request('/api/public/request/track', { body: command });
    const request = asRecord(payload.request);
    const id = asString(request.id);
    const status = asString(request.status);
    if (!id || !status) return incomplete('The request service returned an incomplete status.');
    return {
      kind: 'request',
      id,
      status,
      submittedAt: asString(request.createdAt),
      updatedAt: asString(request.updatedAt),
      lines: records(request.lines).map((line) => ({
        label: asString(line.description) || 'Requested item',
        category: asString(line.category),
        quantity: asNumber(line.quantity),
        unit: asString(line.unit),
        status: asString(line.status),
      })),
      history: records(request.history).map((entry) => ({
        status: asString(entry.status),
        at: asString(entry.at),
      })),
    };
  }

  /* ---- R3-A1-A2 identity recovery: activate an existing account, reset a password ----
   *
   * These bind to the contract R3-A1-A2 §17-§19 requires. Three of the five
   * routes do not exist in the Worker yet — `src/auth/http-contract.js` declares
   * only session/login/activate/logout/reset-complete, and the only reset path
   * consumes an admin-issued `resetToken`. They are called for real anyway, so
   * that the moment the accepted backend amendment lands the frontend is already
   * correct. Until then the Worker answers 404 and the caller surfaces a truthful
   * "not available yet" state — it never simulates a success.
   *
   * Recorded as BACKEND_CONTRACT_GAP_SELF_SERVICE_IDENTITY.
   */

  /** Step 1. Never reveals whether the identifier exists. */
  async startIdentityVerification(
    flow: 'activate' | 'reset',
    identifier: string,
  ): Promise<{ accepted: boolean; resendAvailableInSeconds: number }> {
    const payload = await this.request(`/api/auth/${flow}/start`, { body: { identifier } });
    return {
      accepted: payload.accepted !== false,
      resendAvailableInSeconds: asNumber(payload.resendAvailableInSeconds) || 60,
    };
  }

  /** Step 2. Exchanges the 8-digit code for a short-lived single-use token. */
  async verifyIdentityCode(
    flow: 'activate' | 'reset',
    identifier: string,
    code: string,
  ): Promise<{ token: string; expiresAt: string }> {
    const payload = await this.request(`/api/auth/${flow}/verify`, { body: { identifier, code } });
    const token =
      asString(payload.token) || asString(payload.activationToken) || asString(payload.resetToken);
    if (!token) return incomplete('The verification service returned an incomplete result.');
    return { token, expiresAt: asString(payload.expiresAt) };
  }

  /** Step 3a. Activates an existing eligible staff identity. Never creates one. */
  async completeAccountActivation(token: string, password: string, confirmPassword: string): Promise<void> {
    await this.request('/api/auth/activate/complete', {
      body: { activationToken: token, password, confirmPassword },
    });
  }

  /** Step 3b. `/api/auth/reset/complete` already exists and takes this shape. */
  async completePasswordReset(token: string, password: string, confirmPassword: string): Promise<void> {
    await this.request('/api/auth/reset/complete', {
      body: { resetToken: token, password, confirmPassword },
    });
  }

  /* ---- R3-A1-A2 authenticated External Request Center ---- */

  async requesterPortal(signal?: AbortSignal): Promise<RequesterPortal> {
    const payload = await this.request('/api/portal/request', { method: 'GET', signal });
    const profile = asRecord(payload.profile);
    const choices: Record<string, string[]> = {};
    for (const [category, values] of Object.entries(asRecord(payload.choices))) {
      choices[category] = asStrings(values);
    }
    return {
      profile: {
        displayName: asString(profile.displayName),
        departmentId: asString(profile.departmentId),
      },
      eventSeries: records(payload.eventSeries)
        .map((series) => ({
          id: asString(series.id),
          code: asString(series.code),
          name: asString(series.name),
        }))
        .filter((series) => series.id && series.name),
      events: records(payload.events)
        .map((event) => ({
          id: asString(event.id),
          seriesId: asString(event.seriesId),
          name: asString(event.name),
          activityType: asString(event.activityType),
          startsAt: asString(event.startsAt),
          endsAt: asString(event.endsAt),
          venue: asString(event.venue),
        }))
        .filter((event) => event.id && event.name),
      choices,
      units: asStrings(payload.units),
      requests: records(payload.requests).map((request) => ({
        id: asString(request.id),
        requestType: asString(request.requestType) || 'NEW',
        parentRequestId: asString(request.parentRequestId),
        eventSeriesId: asString(request.eventSeriesId),
        eventId: asString(request.eventId),
        event: asString(request.event),
        subEvent: asString(request.subEvent),
        department: asString(request.department),
        purpose: asString(request.purpose),
        status: asString(request.status),
        createdAt: asString(request.createdAt),
        updatedAt: asString(request.updatedAt),
        lines: records(request.lines).map((line) => ({
          description: asString(line.description),
          specification: asString(line.specification),
          category: asString(line.category),
          quantity: asNumber(line.quantity),
          unit: asString(line.unit),
          status: asString(line.status),
        })),
        history: records(request.history).map((entry) => ({
          status: asString(entry.status),
          at: asString(entry.at),
        })),
      })),
    };
  }

  async submitRequesterRequest(command: Json): Promise<RequesterSubmissionReceipt> {
    const payload = await this.request('/api/portal/request', { body: command, csrf: true });
    const id = asString(payload.requestId) || asString(payload.id);
    const status = asString(payload.status);
    if (!id || !status) return incomplete('The request service returned an incomplete receipt.');
    return {
      id,
      requestType: asString(payload.requestType) || 'NEW',
      parentRequestId: asString(payload.parentRequestId),
      department: asString(payload.department),
      event: asString(payload.event),
      subEvent: asString(payload.subEvent),
      status,
      submittedAt: asString(payload.submittedAt),
      replayed: payload.replayed === true,
    };
  }

  async cancelRequesterRequest(command: Json): Promise<{ id: string; status: string }> {
    const payload = await this.request('/api/portal/request/cancel', { body: command, csrf: true });
    const id = asString(payload.requestId) || asString(payload.id);
    const status = asString(payload.status);
    if (!id || !status) return incomplete('The request service returned an incomplete cancellation result.');
    return { id, status };
  }

  async startAccountApplicationEmail(email: string): Promise<{ accepted: boolean; nextAttemptAt: string }> {
    const payload = await this.request('/api/account-applications/email/start', { body: { email } });
    return { accepted: payload.accepted === true, nextAttemptAt: asString(payload.nextAttemptAt) };
  }

  async confirmAccountApplicationEmail(
    email: string,
    code: string,
  ): Promise<{ verificationReceipt: string; expiresAt: string }> {
    const payload = await this.request('/api/account-applications/email/confirm', { body: { email, code } });
    const verificationReceipt = asString(payload.verificationReceipt);
    if (!verificationReceipt)
      return incomplete('The verification service returned an incomplete confirmation.');
    return { verificationReceipt, expiresAt: asString(payload.expiresAt) };
  }

  private applicationStatusFrom(payload: Json): AccountApplicationStatus {
    const applicationCode = asString(payload.applicationCode);
    const state = asString(payload.state);
    if (!applicationCode || !state)
      return incomplete('The application service returned an incomplete status.');
    const result: AccountApplicationStatus = {
      applicationCode,
      state,
      revision: asNumber(payload.revision),
      submittedAt: asString(payload.submittedAt),
      updatedAt: asString(payload.updatedAt),
      nextStep: asString(payload.nextStep),
      changeRequestSummary: asString(payload.changeRequestSummary),
      accountCode: asString(payload.accountCode),
      activationReady: payload.activationReady === true,
      replayed: payload.replayed === true,
    };
    const statusToken = asString(payload.statusToken);
    if (statusToken) result.statusToken = statusToken;
    return result;
  }

  async submitAccountApplication(command: Json, statusToken = ''): Promise<AccountApplicationStatus> {
    return this.applicationStatusFrom(
      await this.request('/api/account-applications', { body: command, bearerToken: statusToken }),
    );
  }

  async accountApplicationStatus(statusToken: string): Promise<AccountApplicationStatus> {
    return this.applicationStatusFrom(
      await this.request('/api/account-applications/status', { method: 'GET', bearerToken: statusToken }),
    );
  }

  async withdrawAccountApplication(statusToken: string, command: Json): Promise<AccountApplicationStatus> {
    return this.applicationStatusFrom(
      await this.request('/api/account-applications/withdraw', { body: command, bearerToken: statusToken }),
    );
  }
}

export const frontendBackend = new FrontendBackend();
