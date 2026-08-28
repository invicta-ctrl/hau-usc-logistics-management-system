export const IMPLEMENTATION_STATUS = ['ACCEPTED', 'IN_PROGRESS', 'SURFACE_PREVIEW', 'NOT_STARTED'] as const;
export type ImplementationStatus = (typeof IMPLEMENTATION_STATUS)[number];

export const BACKEND_STATUS = ['REAL_BACKEND', 'PARTIAL', 'VISUAL_ONLY'] as const;
export type BackendStatus = (typeof BACKEND_STATUS)[number];

export const ACCESS_REQUIREMENT = ['PUBLIC', 'AUTHENTICATED'] as const;
export type AccessRequirement = (typeof ACCESS_REQUIREMENT)[number];

export const PREVIEW_MODE = ['REAL_MODULE', 'SURFACE_PREVIEW'] as const;
export type PreviewMode = (typeof PREVIEW_MODE)[number];

export const ROUTE_GROUP = ['PUBLIC', 'REQUESTER', 'STAFF', 'ADMINISTRATION'] as const;
export type RouteGroup = (typeof ROUTE_GROUP)[number];

export const COMPLETENESS_CLASSIFICATION = [
  'COMPLETE_REAL',
  'COMPLETE_SAFE_PREVIEW',
  'BACKEND_WIRED_COMPLETE',
  'VISUAL_PREVIEW_COMPLETE',
  'OWNER_DEFERRED',
  'UNFINISHED_PLACEHOLDER',
  'BROKEN',
  'UNVERIFIED',
] as const;
export type CompletenessClassification = (typeof COMPLETENESS_CLASSIFICATION)[number];

export const COMPLETENESS_CLASSIFICATION_LABELS: Readonly<Record<CompletenessClassification, string>> =
  Object.freeze({
    COMPLETE_REAL: 'Ready',
    COMPLETE_SAFE_PREVIEW: 'Ready for inspection',
    BACKEND_WIRED_COMPLETE: 'Connected and complete',
    VISUAL_PREVIEW_COMPLETE: 'Inspection complete',
    OWNER_DEFERRED: 'Deferred',
    UNFINISHED_PLACEHOLDER: 'Not started',
    BROKEN: 'Needs attention',
    UNVERIFIED: 'Not verified',
  });

export const PREVIEW_FILTER = [
  'ALL',
  'ACCEPTED',
  'IN_PROGRESS',
  'BACKEND_WIRED',
  'PREVIEW_ONLY',
  'NOT_STARTED',
  'PUBLIC',
  'AUTHENTICATED',
] as const;
export type PreviewFilter = (typeof PREVIEW_FILTER)[number];

export const PREVIEW_FILTER_LABELS: Readonly<Record<PreviewFilter, string>> = Object.freeze({
  ALL: 'All',
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  BACKEND_WIRED: 'Connected',
  PREVIEW_ONLY: 'Inspection only',
  NOT_STARTED: 'Not started',
  PUBLIC: 'Public',
  AUTHENTICATED: 'Authenticated',
});

export const IMPLEMENTATION_STATUS_LABELS: Readonly<Record<ImplementationStatus, string>> = Object.freeze({
  ACCEPTED: 'Accepted',
  IN_PROGRESS: 'In progress',
  SURFACE_PREVIEW: 'Inspection only',
  NOT_STARTED: 'Not started',
});

export const BACKEND_STATUS_LABELS: Readonly<Record<BackendStatus, string>> = Object.freeze({
  REAL_BACKEND: 'Connected',
  PARTIAL: 'Partially connected',
  VISUAL_ONLY: 'Inspection only',
});

export const ACCESS_REQUIREMENT_LABELS: Readonly<Record<AccessRequirement, string>> = Object.freeze({
  PUBLIC: 'Public',
  AUTHENTICATED: 'Authenticated',
});

export const PREVIEW_MODE_LABELS: Readonly<Record<PreviewMode, string>> = Object.freeze({
  REAL_MODULE: 'Operational page',
  SURFACE_PREVIEW: 'Inspection page',
});

export const ROUTE_GROUP_LABELS: Readonly<Record<RouteGroup, string>> = Object.freeze({
  PUBLIC: 'Public',
  REQUESTER: 'External requester',
  STAFF: 'Staff',
  ADMINISTRATION: 'Administration',
});
