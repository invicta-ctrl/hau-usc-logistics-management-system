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

export type PublicLendingItem = {
  id: string;
  productId: string;
  name: string;
  aliases: string[];
  category: string;
  type: "REUSABLE" | "CONSUMABLE";
  availability: "AVAILABLE" | "LIMITED" | "ELIGIBILITY_REQUIRED" | "CURRENTLY_UNAVAILABLE" | "MAINTENANCE";
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
  events: Array<{ id: string; seriesId: string; name: string; startAt: string; endAt: string; venue: string; status: string }>;
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
  kind: "request" | "lending";
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

  constructor({ code = "REQUEST_FAILED", message = "The service could not complete that request.", status = 0 }: { code?: string; message?: string; status?: number } = {}) {
    super(message);
    this.name = "FrontendApiError";
    this.code = code;
    this.status = status;
  }
}

function asRecord(value: unknown): Json {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Json : {};
}

function asString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function asStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.map(asString).filter(Boolean) : [];
}

function asNumber(value: unknown): number {
  const result = Number(value);
  return Number.isFinite(result) ? result : 0;
}

function records(value: unknown): Json[] {
  return Array.isArray(value) ? value.map(asRecord) : [];
}

function incomplete(message: string): never {
  throw new FrontendApiError({ code: "INCOMPLETE_RESPONSE", message, status: 502 });
}

function projectUser(value: unknown): FrontendUser | null {
  const user = asRecord(value);
  const authorization = asRecord(user.authorization);
  const capabilities = asStrings(authorization.capabilities);
  const accountId = asString(user.accountId);
  if (!accountId || authorization.active !== true || asString(authorization.mappingStatus) !== "MAPPED") return null;
  return {
    accountId,
    displayName: asString(user.displayName) || accountId,
    roleId: asString(authorization.roleId) || "REQUESTER",
    capabilities,
  };
}

export class FrontendBackend {
  private csrfToken = "";

  private async request(path: string, { method = "POST", body, csrf = false, signal, bearerToken = "" }: { method?: string; body?: unknown; csrf?: boolean; signal?: AbortSignal; bearerToken?: string } = {}): Promise<Json> {
    const headers: Record<string, string> = { accept: "application/json" };
    if (body !== undefined) headers["content-type"] = "application/json";
    if (csrf && this.csrfToken) headers["x-csrf-token"] = this.csrfToken;
    if (bearerToken) headers.authorization = `Bearer ${bearerToken}`;
    let response: Response;
    try {
      response = await fetch(path, {
        method,
        credentials: "include",
        headers,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal,
      });
    } catch (error) {
      if ((error as { name?: string } | null)?.name === "AbortError") throw error;
      throw new FrontendApiError({ code: "SERVICE_UNAVAILABLE", message: "The service is temporarily unavailable." });
    }
    const payload = asRecord(await response.json().catch(() => null));
    if (!response.ok) {
      throw new FrontendApiError({
        code: asString(payload.code) || "REQUEST_FAILED",
        message: asString(payload.message) || "The service could not complete that request.",
        status: response.status,
      });
    }
    return payload;
  }

  private sessionFrom(payload: Json): FrontendSession | null {
    if (asString(payload.state) !== "AUTHENTICATED") return null;
    const user = projectUser(payload.user);
    const csrfToken = asString(payload.csrfToken);
    if (!user || !csrfToken) return null;
    this.csrfToken = csrfToken;
    return { user, csrfToken };
  }

  async session(): Promise<FrontendSession | null> {
    try {
      return this.sessionFrom(await this.request("/api/auth/session", { method: "GET" }));
    } catch (error) {
      if (error instanceof FrontendApiError && [401, 403].includes(error.status)) {
        this.csrfToken = "";
        return null;
      }
      throw error;
    }
  }

  async version(signal?: AbortSignal): Promise<FrontendVersion> {
    const payload = await this.request("/api/version", { method: "GET", signal });
    return { playground: payload.playground === true };
  }

  async login(accessId: string, password: string): Promise<{ session: FrontendSession | null; activationRequired: boolean; activationExpiresAt: string }> {
    const payload = await this.request("/api/auth/login", { body: { accessId, password } });
    const activationRequired = asString(payload.state) === "ACTIVATION_REQUIRED";
    if (activationRequired) {
      const csrfToken = asString(payload.csrfToken);
      if (!csrfToken) incomplete("The activation response did not include its required security token.");
      this.csrfToken = csrfToken;
    }
    return {
      session: this.sessionFrom(payload),
      activationRequired,
      activationExpiresAt: activationRequired ? asString(payload.expiresAt) : "",
    };
  }

  async activateStarter(profile: { fullName: string; mobileNumber: string; email: string }, password: string, confirmPassword: string): Promise<FrontendSession> {
    if (!this.csrfToken) incomplete("The activation session is no longer available. Sign in again.");
    const payload = await this.request("/api/auth/activate", {
      body: { profile, password, confirmPassword },
      csrf: true,
    });
    const session = this.sessionFrom(payload);
    if (!session) incomplete("The activation service returned an incomplete authenticated session.");
    return session;
  }

  async logout(): Promise<void> {
    try {
      if (this.csrfToken) await this.request("/api/auth/logout", { body: {}, csrf: true });
    } finally {
      this.csrfToken = "";
    }
  }

  async publicAdvertisements(signal?: AbortSignal): Promise<Json> {
    return this.request("/api/public/advertisements", { method: "GET", signal });
  }

  async publicLendingCatalog(signal?: AbortSignal): Promise<PublicLendingCatalog> {
    const payload = await this.request("/api/public/lending/catalog", { method: "GET", signal });
    const items = records(payload.items).map((item) => ({
      id: asString(item.id),
      productId: asString(item.productId),
      name: asString(item.name),
      aliases: asStrings(item.aliases),
      category: asString(item.category),
      type: asString(item.type) === "CONSUMABLE" ? "CONSUMABLE" as const : "REUSABLE" as const,
      availability: asString(item.availability) as PublicLendingItem["availability"],
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
    })).filter((item) => item.id && item.name && item.unit);
    return { items, uscDepartments: asStrings(payload.uscDepartments) };
  }

  async submitPublicLending(command: Json): Promise<PublicSubmissionReceipt> {
    const payload = await this.request("/api/public/lending", { body: command });
    const id = asString(payload.submissionId);
    const trackingCode = asString(payload.trackingCode);
    const status = asString(payload.status);
    if (!id || !trackingCode || !status) return incomplete("The lending service returned an incomplete receipt.");
    return { id, trackingCode, status, submittedAt: asString(payload.submittedAt), replayed: payload.replayed === true };
  }

  async trackPublicLending(command: Json): Promise<PublicTrackingResult> {
    const payload = await this.request("/api/public/lending/track", { body: command });
    const id = asString(payload.submissionId);
    const status = asString(payload.status);
    if (!id || !status) return incomplete("The lending service returned an incomplete status.");
    return {
      kind: "lending",
      id,
      status,
      submittedAt: asString(payload.submittedAt),
      updatedAt: asString(payload.updatedAt),
      lines: records(payload.lines).map((line) => ({
        label: asString(line.itemName) || "Requested item",
        category: asString(line.ticketType),
        quantity: asNumber(line.quantity),
        unit: asString(line.unit),
        status: asString(line.status),
      })),
      history: records(payload.history).map((entry) => ({ status: asString(entry.status), at: asString(entry.changedAt) })),
    };
  }

  async publicRequestOptions(signal?: AbortSignal): Promise<PublicRequestOptions> {
    const payload = await this.request("/api/public/request/options", { method: "GET", signal });
    return {
      requesterTypes: asStrings(payload.requesterTypes),
      categories: asStrings(payload.categories),
      items: records(payload.items).map((item) => ({ id: asString(item.id), name: asString(item.name), category: asString(item.category), unit: asString(item.unit) })).filter((item) => item.id && item.name),
      eventSeries: records(payload.eventSeries).map((series) => ({ id: asString(series.id), code: asString(series.code), name: asString(series.name), status: asString(series.status) })).filter((series) => series.id && series.name),
      events: records(payload.events).map((event) => ({ id: asString(event.id), seriesId: asString(event.seriesId), name: asString(event.name), startAt: asString(event.startAt), endAt: asString(event.endAt), venue: asString(event.venue), status: asString(event.status) })).filter((event) => event.id && event.name),
      references: records(payload.references).map((reference) => ({ id: asString(reference.id), group: asString(reference.group), name: asString(reference.name), category: asString(reference.category), unit: asString(reference.unit) })).filter((reference) => reference.id && reference.name),
      stockAreas: asStrings(payload.stockAreas),
    };
  }

  async submitPublicRequest(command: Json): Promise<PublicSubmissionReceipt> {
    const payload = await this.request("/api/public/request", { body: command });
    const id = asString(payload.requestId);
    const trackingCode = asString(payload.trackingCode);
    const status = asString(payload.status);
    if (!id || !trackingCode || !status) return incomplete("The request service returned an incomplete receipt.");
    return { id, trackingCode, status, submittedAt: "", replayed: payload.replayed === true };
  }

  async trackPublicRequest(command: Json): Promise<PublicTrackingResult> {
    const payload = await this.request("/api/public/request/track", { body: command });
    const request = asRecord(payload.request);
    const id = asString(request.id);
    const status = asString(request.status);
    if (!id || !status) return incomplete("The request service returned an incomplete status.");
    return {
      kind: "request",
      id,
      status,
      submittedAt: asString(request.createdAt),
      updatedAt: asString(request.updatedAt),
      lines: records(request.lines).map((line) => ({
        label: asString(line.description) || "Requested item",
        category: asString(line.category),
        quantity: asNumber(line.quantity),
        unit: asString(line.unit),
        status: asString(line.status),
      })),
      history: records(request.history).map((entry) => ({ status: asString(entry.status), at: asString(entry.at) })),
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
    flow: "activate" | "reset",
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
    flow: "activate" | "reset",
    identifier: string,
    code: string,
  ): Promise<{ token: string; expiresAt: string }> {
    const payload = await this.request(`/api/auth/${flow}/verify`, { body: { identifier, code } });
    const token = asString(payload.token) || asString(payload.activationToken) || asString(payload.resetToken);
    if (!token) return incomplete("The verification service returned an incomplete result.");
    return { token, expiresAt: asString(payload.expiresAt) };
  }

  /** Step 3a. Activates an existing eligible staff identity. Never creates one. */
  async completeAccountActivation(token: string, password: string, confirmPassword: string): Promise<void> {
    await this.request("/api/auth/activate/complete", {
      body: { activationToken: token, password, confirmPassword },
    });
  }

  /** Step 3b. `/api/auth/reset/complete` already exists and takes this shape. */
  async completePasswordReset(token: string, password: string, confirmPassword: string): Promise<void> {
    await this.request("/api/auth/reset/complete", {
      body: { resetToken: token, password, confirmPassword },
    });
  }

  /* ---- R3-A1-A2 authenticated External Request Center ---- */

  async requesterPortal(signal?: AbortSignal): Promise<RequesterPortal> {
    const payload = await this.request("/api/portal/request", { method: "GET", signal });
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
        .map((series) => ({ id: asString(series.id), code: asString(series.code), name: asString(series.name) }))
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
        requestType: asString(request.requestType) || "NEW",
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
    const payload = await this.request("/api/portal/request", { body: command, csrf: true });
    const id = asString(payload.requestId) || asString(payload.id);
    const status = asString(payload.status);
    if (!id || !status) return incomplete("The request service returned an incomplete receipt.");
    return {
      id,
      requestType: asString(payload.requestType) || "NEW",
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
    const payload = await this.request("/api/portal/request/cancel", { body: command, csrf: true });
    const id = asString(payload.requestId) || asString(payload.id);
    const status = asString(payload.status);
    if (!id || !status) return incomplete("The request service returned an incomplete cancellation result.");
    return { id, status };
  }

  async startAccountApplicationEmail(email: string): Promise<{ accepted: boolean; nextAttemptAt: string }> {
    const payload = await this.request("/api/account-applications/email/start", { body: { email } });
    return { accepted: payload.accepted === true, nextAttemptAt: asString(payload.nextAttemptAt) };
  }

  async confirmAccountApplicationEmail(email: string, code: string): Promise<{ verificationReceipt: string; expiresAt: string }> {
    const payload = await this.request("/api/account-applications/email/confirm", { body: { email, code } });
    const verificationReceipt = asString(payload.verificationReceipt);
    if (!verificationReceipt) return incomplete("The verification service returned an incomplete confirmation.");
    return { verificationReceipt, expiresAt: asString(payload.expiresAt) };
  }

  private applicationStatusFrom(payload: Json): AccountApplicationStatus {
    const applicationCode = asString(payload.applicationCode);
    const state = asString(payload.state);
    if (!applicationCode || !state) return incomplete("The application service returned an incomplete status.");
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

  async submitAccountApplication(command: Json, statusToken = ""): Promise<AccountApplicationStatus> {
    return this.applicationStatusFrom(await this.request("/api/account-applications", { body: command, bearerToken: statusToken }));
  }

  async accountApplicationStatus(statusToken: string): Promise<AccountApplicationStatus> {
    return this.applicationStatusFrom(await this.request("/api/account-applications/status", { method: "GET", bearerToken: statusToken }));
  }

  async withdrawAccountApplication(statusToken: string, command: Json): Promise<AccountApplicationStatus> {
    return this.applicationStatusFrom(await this.request("/api/account-applications/withdraw", { body: command, bearerToken: statusToken }));
  }
}

export const frontendBackend = new FrontendBackend();
