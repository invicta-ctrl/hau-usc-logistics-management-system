import type {
  AccessRequirement,
  BackendStatus,
  ImplementationStatus,
  PreviewMode,
  RouteGroup,
} from "./vocabulary";

export type PreviewRouteEntry = {
  readonly id: string;
  readonly route: string;
  readonly label: string;
  readonly group: RouteGroup;
  readonly description: string;
  readonly implementationStatus: ImplementationStatus;
  readonly backendStatus: BackendStatus;
  readonly access: AccessRequirement;
  readonly previewMode: PreviewMode;
};

const REGISTRY: readonly PreviewRouteEntry[] = Object.freeze([
  Object.freeze({
    id: "landing",
    route: "landing",
    label: "Landing",
    group: "PUBLIC",
    description: "Public landing, current announcements, and the poster-first atrium hero.",
    implementationStatus: "ACCEPTED",
    backendStatus: "REAL_BACKEND",
    access: "PUBLIC",
    previewMode: "REAL_MODULE",
  }),
  Object.freeze({
    id: "request",
    route: "request",
    label: "Public Request Center",
    group: "PUBLIC",
    description: "Public equipment and supply request flow backed by the request service.",
    implementationStatus: "ACCEPTED",
    backendStatus: "REAL_BACKEND",
    access: "PUBLIC",
    previewMode: "REAL_MODULE",
  }),
  Object.freeze({
    id: "tracking",
    route: "tracking",
    label: "Track Record",
    group: "PUBLIC",
    description: "Public request and lending status lookup through the tracking service.",
    implementationStatus: "ACCEPTED",
    backendStatus: "REAL_BACKEND",
    access: "PUBLIC",
    previewMode: "REAL_MODULE",
  }),
  Object.freeze({
    id: "borrow",
    route: "borrow",
    label: "Public Lending",
    group: "PUBLIC",
    description: "Public borrower-safe lending catalog and submission flow.",
    implementationStatus: "ACCEPTED",
    backendStatus: "REAL_BACKEND",
    access: "PUBLIC",
    previewMode: "REAL_MODULE",
  }),
  Object.freeze({
    id: "staff-signin",
    route: "staff-signin",
    label: "Staff Sign In",
    group: "PUBLIC",
    description: "Staff authentication entry point backed by the session and login services.",
    implementationStatus: "ACCEPTED",
    backendStatus: "REAL_BACKEND",
    access: "PUBLIC",
    previewMode: "REAL_MODULE",
  }),
  Object.freeze({
    id: "overview",
    route: "overview",
    label: "Operations overview",
    group: "STAFF",
    description: "Authenticated operations overview with preserved visual components and no active backend calls.",
    implementationStatus: "SURFACE_PREVIEW",
    backendStatus: "VISUAL_ONLY",
    access: "AUTHENTICATED",
    previewMode: "SURFACE_PREVIEW",
  }),
  Object.freeze({
    id: "inventory",
    route: "inventory",
    label: "Inventory",
    group: "STAFF",
    description: "Authenticated inventory surface with preserved visual components and no active backend calls.",
    implementationStatus: "SURFACE_PREVIEW",
    backendStatus: "VISUAL_ONLY",
    access: "AUTHENTICATED",
    previewMode: "SURFACE_PREVIEW",
  }),
  Object.freeze({
    id: "request-center",
    route: "request-center",
    label: "Staff Request Center",
    group: "STAFF",
    description: "Authenticated staff request surface with preserved visual components and no active backend calls.",
    implementationStatus: "SURFACE_PREVIEW",
    backendStatus: "VISUAL_ONLY",
    access: "AUTHENTICATED",
    previewMode: "SURFACE_PREVIEW",
  }),
  Object.freeze({
    id: "lending",
    route: "lending",
    label: "Lending Hub",
    group: "STAFF",
    description: "Authenticated lending hub surface with preserved visual components and no active backend calls.",
    implementationStatus: "SURFACE_PREVIEW",
    backendStatus: "VISUAL_ONLY",
    access: "AUTHENTICATED",
    previewMode: "SURFACE_PREVIEW",
  }),
  Object.freeze({
    id: "release",
    route: "release",
    label: "Release Desk",
    group: "STAFF",
    description: "Authenticated release desk surface with preserved visual components and no active backend calls.",
    implementationStatus: "SURFACE_PREVIEW",
    backendStatus: "VISUAL_ONLY",
    access: "AUTHENTICATED",
    previewMode: "SURFACE_PREVIEW",
  }),
  Object.freeze({
    id: "restocking",
    route: "restocking",
    label: "Restocking",
    group: "STAFF",
    description: "Authenticated restocking surface with preserved visual components and no active backend calls.",
    implementationStatus: "SURFACE_PREVIEW",
    backendStatus: "VISUAL_ONLY",
    access: "AUTHENTICATED",
    previewMode: "SURFACE_PREVIEW",
  }),
  Object.freeze({
    id: "procurement",
    route: "procurement",
    label: "Procurement",
    group: "STAFF",
    description: "Authenticated procurement surface with preserved visual components and no active backend calls.",
    implementationStatus: "SURFACE_PREVIEW",
    backendStatus: "VISUAL_ONLY",
    access: "AUTHENTICATED",
    previewMode: "SURFACE_PREVIEW",
  }),
  Object.freeze({
    id: "events",
    route: "events",
    label: "Events",
    group: "STAFF",
    description: "Authenticated events surface with preserved visual components and no active backend calls.",
    implementationStatus: "SURFACE_PREVIEW",
    backendStatus: "VISUAL_ONLY",
    access: "AUTHENTICATED",
    previewMode: "SURFACE_PREVIEW",
  }),
  Object.freeze({
    id: "administration",
    route: "administration",
    label: "Administration",
    group: "ADMINISTRATION",
    description: "Authenticated administration surface with preserved visual components and no active backend calls.",
    implementationStatus: "SURFACE_PREVIEW",
    backendStatus: "VISUAL_ONLY",
    access: "AUTHENTICATED",
    previewMode: "SURFACE_PREVIEW",
  }),
  Object.freeze({
    id: "profile",
    route: "profile",
    label: "Account profile",
    group: "ADMINISTRATION",
    description: "Authenticated account profile surface with preserved visual components and no active backend calls.",
    implementationStatus: "SURFACE_PREVIEW",
    backendStatus: "VISUAL_ONLY",
    access: "AUTHENTICATED",
    previewMode: "SURFACE_PREVIEW",
  }),
]);

export const PREVIEW_INDEX_REGISTRY: readonly PreviewRouteEntry[] = REGISTRY;

export function listPreviewRoutes(): readonly PreviewRouteEntry[] {
  return REGISTRY;
}
