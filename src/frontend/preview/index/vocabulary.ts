export const IMPLEMENTATION_STATUS = [
  "ACCEPTED",
  "IN_PROGRESS",
  "SURFACE_PREVIEW",
  "NOT_STARTED",
] as const;
export type ImplementationStatus = (typeof IMPLEMENTATION_STATUS)[number];

export const BACKEND_STATUS = ["REAL_BACKEND", "PARTIAL", "VISUAL_ONLY"] as const;
export type BackendStatus = (typeof BACKEND_STATUS)[number];

export const ACCESS_REQUIREMENT = ["PUBLIC", "AUTHENTICATED"] as const;
export type AccessRequirement = (typeof ACCESS_REQUIREMENT)[number];

export const PREVIEW_MODE = ["REAL_MODULE", "SURFACE_PREVIEW"] as const;
export type PreviewMode = (typeof PREVIEW_MODE)[number];

export const ROUTE_GROUP = ["PUBLIC", "STAFF", "ADMINISTRATION"] as const;
export type RouteGroup = (typeof ROUTE_GROUP)[number];

export const PREVIEW_FILTER = [
  "ALL",
  "ACCEPTED",
  "IN_PROGRESS",
  "BACKEND_WIRED",
  "PREVIEW_ONLY",
  "NOT_STARTED",
  "PUBLIC",
  "AUTHENTICATED",
] as const;
export type PreviewFilter = (typeof PREVIEW_FILTER)[number];

export const PREVIEW_FILTER_LABELS: Readonly<Record<PreviewFilter, string>> = Object.freeze({
  ALL: "All",
  ACCEPTED: "Accepted",
  IN_PROGRESS: "In progress",
  BACKEND_WIRED: "Backend-wired",
  PREVIEW_ONLY: "Preview-only",
  NOT_STARTED: "Not started",
  PUBLIC: "Public",
  AUTHENTICATED: "Authenticated",
});

export const IMPLEMENTATION_STATUS_LABELS: Readonly<Record<ImplementationStatus, string>> = Object.freeze({
  ACCEPTED: "ACCEPTED",
  IN_PROGRESS: "IN PROGRESS",
  SURFACE_PREVIEW: "SURFACE PREVIEW",
  NOT_STARTED: "NOT STARTED",
});

export const BACKEND_STATUS_LABELS: Readonly<Record<BackendStatus, string>> = Object.freeze({
  REAL_BACKEND: "REAL BACKEND",
  PARTIAL: "PARTIAL",
  VISUAL_ONLY: "VISUAL ONLY",
});

export const ACCESS_REQUIREMENT_LABELS: Readonly<Record<AccessRequirement, string>> = Object.freeze({
  PUBLIC: "Public",
  AUTHENTICATED: "Authenticated",
});

export const PREVIEW_MODE_LABELS: Readonly<Record<PreviewMode, string>> = Object.freeze({
  REAL_MODULE: "Real module",
  SURFACE_PREVIEW: "Surface preview",
});

export const ROUTE_GROUP_LABELS: Readonly<Record<RouteGroup, string>> = Object.freeze({
  PUBLIC: "Public",
  STAFF: "Staff",
  ADMINISTRATION: "Administration",
});
