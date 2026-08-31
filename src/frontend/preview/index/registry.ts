import type {
  AccessRequirement,
  BackendStatus,
  CompletenessClassification,
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
  readonly completeness: CompletenessClassification;
};

const REGISTRY: readonly PreviewRouteEntry[] = Object.freeze([
  Object.freeze({
    id: 'landing',
    route: 'landing',
    label: 'Landing',
    group: 'PUBLIC',
    description: 'Public landing page with announcements and links to logistics services.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'PUBLIC',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
  Object.freeze({
    id: 'external-request',
    route: 'external-request',
    label: 'External Request Center',
    group: 'REQUESTER',
    description: 'Submit and track requests for an authorized USC office. Staff sign-in required.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
  Object.freeze({
    id: 'tracking',
    route: 'tracking',
    label: 'Track Record',
    group: 'PUBLIC',
    description: 'Check a request or loan using its reference and private code.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'PUBLIC',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
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
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
  Object.freeze({
    id: 'staff-signin',
    route: 'staff-signin',
    label: 'Staff Sign In',
    group: 'PUBLIC',
    description: 'Sign in to open the workspaces authorized for a staff account.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'PUBLIC',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
  Object.freeze({
    id: 'overview',
    route: 'overview',
    label: 'Operations overview',
    group: 'STAFF',
    description:
      'Review authorized requests, events, inventory, and work queues. Inspection uses sample data.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'PARTIAL',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
    completeness: 'COMPLETE_REAL',
  }),
  Object.freeze({
    id: 'inventory',
    route: 'inventory',
    label: 'Inventory',
    group: 'STAFF',
    description: 'Review current inventory quantities and item status. Inspection uses sample data.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
  Object.freeze({
    id: 'request-center',
    route: 'request-center',
    label: 'Internal Request Hub',
    group: 'STAFF',
    description: 'Review and route internal logistics requests. Department of Logistics access required.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
  Object.freeze({
    id: 'lending',
    route: 'lending',
    label: 'Internal Lending Hub',
    group: 'STAFF',
    description:
      'Review lending records, custody, handoffs, and returns. Department of Logistics access required.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
  Object.freeze({
    id: 'release',
    route: 'release',
    label: 'Release Desk',
    group: 'STAFF',
    description:
      'Review ready work and record physical handoffs. Inspection uses sample data and does not change records.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
  Object.freeze({
    id: 'restocking',
    route: 'restocking',
    label: 'Restocking',
    group: 'STAFF',
    description:
      'Review restock requests and receiving records. Inspection uses sample data and does not change records.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
  Object.freeze({
    id: 'procurement',
    route: 'procurement',
    label: 'Procurement',
    group: 'STAFF',
    description:
      'Review procurement work, canvass references, and linked requests. Inspection uses sample data.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
  Object.freeze({
    id: 'events',
    route: 'events',
    label: 'Events',
    group: 'STAFF',
    description: 'Review authorized event records and logistics requirements. Inspection uses sample data.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
  Object.freeze({
    id: 'administration',
    route: 'administration',
    label: 'Administration',
    group: 'ADMINISTRATION',
    description:
      'Review authorized accounts, directory, activity, references, brand assets, and system status. Inspection uses sample data.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
  Object.freeze({
    id: 'profile',
    route: 'profile',
    label: 'Account profile',
    group: 'ADMINISTRATION',
    description: 'Review account details and update appearance preferences. Inspection uses sample data.',
    implementationStatus: 'ACCEPTED',
    backendStatus: 'REAL_BACKEND',
    access: 'AUTHENTICATED',
    previewMode: 'REAL_MODULE',
    completeness: 'BACKEND_WIRED_COMPLETE',
  }),
]);

export const PREVIEW_INDEX_REGISTRY: readonly PreviewRouteEntry[] = REGISTRY;

export function listPreviewRoutes(): readonly PreviewRouteEntry[] {
  return REGISTRY;
}
