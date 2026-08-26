import type {
  AccessRequirement,
  BackendStatus,
  ImplementationStatus,
  PreviewMode,
  RouteGroup,
} from './vocabulary';
import type { Route } from '../../app/appTypes';

export type PreviewRouteEntry = {
  readonly id: string;
  readonly route: Route;
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
    id: 'landing',
    route: 'landing',
    label: 'Landing',
    group: 'PUBLIC',
    description: 'Public landing, current announcements, and the poster-first atrium hero.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'PUBLIC',
    previewMode: 'REAL_MODULE',
  }),
  Object.freeze({
    id: 'external-request',
    route: 'external-request',
    label: 'External Request Center',
    group: 'REQUESTER',
    description:
      'Authenticated USC requester surface backed by GET/POST /api/portal/request. R3-A1-A2: sign-in required; this is no longer a public portal.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
  }),
  Object.freeze({
    id: 'tracking',
    route: 'tracking',
    label: 'Track Record',
    group: 'PUBLIC',
    description: 'Public request and lending status lookup through the tracking service.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'PUBLIC',
    previewMode: 'REAL_MODULE',
  }),
  Object.freeze({
    id: 'borrow',
    route: 'borrow',
    label: 'Public Lending',
    group: 'PUBLIC',
    description: 'Public borrower-safe lending catalog and submission flow.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'PUBLIC',
    previewMode: 'REAL_MODULE',
  }),
  Object.freeze({
    id: 'staff-signin',
    route: 'staff-signin',
    label: 'Staff Sign In',
    group: 'PUBLIC',
    description: 'Staff authentication entry point backed by the session and login services.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'PUBLIC',
    previewMode: 'REAL_MODULE',
  }),
  Object.freeze({
    id: 'overview',
    route: 'overview',
    label: 'Operations overview',
    group: 'STAFF',
    description:
      'Authenticated operations overview with preserved visual components and no active backend calls.',
    implementationStatus: 'SURFACE_PREVIEW',
    backendStatus: 'VISUAL_ONLY',
    access: 'AUTHENTICATED',
    previewMode: 'SURFACE_PREVIEW',
  }),
  Object.freeze({
    id: 'inventory',
    route: 'inventory',
    label: 'Inventory',
    group: 'STAFF',
    description:
      'Authenticated Inventory surface projected through the existing read-only module bootstrap. Local inspection uses a deterministic fixture with no protected request.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
  }),
  Object.freeze({
    id: 'request-center',
    route: 'request-center',
    label: 'Internal Request Hub',
    group: 'STAFF',
    description:
      'DOL-only Internal Request Hub projected through the existing read-only bootstrap; local inspection uses a no-network fixture.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
  }),
  Object.freeze({
    id: 'lending',
    route: 'lending',
    label: 'Internal Lending Hub',
    group: 'STAFF',
    description:
      'DOL-only lending queue projected from the strict lending bootstrap; local inspection uses a deterministic no-network fixture and action simulation.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
  }),
  Object.freeze({
    id: 'release',
    route: 'release',
    label: 'Release Desk',
    group: 'STAFF',
    description:
      'Capability-gated Release Desk visual module. Local inspection uses deterministic synthetic states and action simulation with no protected request or mutation.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'VISUAL_ONLY',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
  }),
  Object.freeze({
    id: 'restocking',
    route: 'restocking',
    label: 'Restocking',
    group: 'STAFF',
    description:
      'Authenticated Restocking and receiving real module. Local inspection is deterministic synthetic presentation with no protected request or mutation.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'VISUAL_ONLY',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
  }),
  Object.freeze({
    id: 'procurement',
    route: 'procurement',
    label: 'Procurement',
    group: 'STAFF',
    description:
      'Authenticated Procurement lifecycle real module. Local inspection is deterministic synthetic presentation with no protected request or mutation.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'VISUAL_ONLY',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
  }),
  Object.freeze({
    id: 'events',
    route: 'events',
    label: 'Events',
    group: 'STAFF',
    description: 'Authenticated events surface with preserved visual components and no active backend calls.',
    implementationStatus: 'SURFACE_PREVIEW',
    backendStatus: 'VISUAL_ONLY',
    access: 'AUTHENTICATED',
    previewMode: 'SURFACE_PREVIEW',
  }),
  Object.freeze({
    id: 'administration',
    route: 'administration',
    label: 'Administration',
    group: 'ADMINISTRATION',
    description:
      'Authenticated FI-10 Accounts, Directory, and Activity module uses supported read-only administration data. Local inspection is a sanitized deterministic presentation with no protected request or mutation.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
  }),
  Object.freeze({
    id: 'profile',
    route: 'profile',
    label: 'Account profile',
    group: 'ADMINISTRATION',
    description:
      'Authenticated read-only profile surface. Local inspection uses an explicit deterministic presentation fixture.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
  }),
]);

export const PREVIEW_INDEX_REGISTRY: readonly PreviewRouteEntry[] = REGISTRY;

export function listPreviewRoutes(): readonly PreviewRouteEntry[] {
  return REGISTRY;
}
