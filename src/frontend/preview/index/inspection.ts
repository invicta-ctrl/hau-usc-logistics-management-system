import type { AuthRoute, Route } from '../../app/appTypes';
import type { PreviewFilter } from './vocabulary';

export type PreviewInspectionState =
  | Readonly<{ mode: 'OFF' }>
  | Readonly<{ mode: 'LOCAL_INDEX_INSPECTION'; route: AuthRoute | 'external-request' }>;

export type PreviewIndexBrowseState = Readonly<{
  query: string;
  filter: PreviewFilter;
  scrollTop: number;
}>;

export const PREVIEW_INSPECTION_OFF: PreviewInspectionState = Object.freeze({ mode: 'OFF' });

export function isProtectedPreviewRoute(route: Route): route is AuthRoute | 'external-request' {
  return (
    route === 'external-request' ||
    [
      'overview',
      'inventory',
      'request-center',
      'lending',
      'release',
      'restocking',
      'procurement',
      'events',
      'administration',
      'profile',
    ].includes(route)
  );
}

/* The one origin the A4 gate below admits. Exported so the Index can name it
 * when it declines, instead of leaving the control silently inert — the message
 * and the gate then cannot drift apart. Changing these values is an
 * authorization change, not a design change. */
export const LOCAL_INSPECTION_HOSTNAME = '127.0.0.1';
export const LOCAL_INSPECTION_PORT = '4173';
export const LOCAL_INSPECTION_ORIGIN = `${LOCAL_INSPECTION_HOSTNAME}:${LOCAL_INSPECTION_PORT}`;

export function localPreviewInspectionAllowed({
  indexAllowed,
  indexOpen,
  explicitIndexAction,
  dev = import.meta.env.DEV,
  location = typeof window === 'undefined' ? undefined : window.location,
}: {
  indexAllowed: boolean;
  indexOpen: boolean;
  explicitIndexAction: boolean;
  dev?: boolean;
  location?: Pick<Location, 'hostname' | 'port'>;
}): boolean {
  return Boolean(
    dev &&
    location?.hostname === LOCAL_INSPECTION_HOSTNAME &&
    location.port === LOCAL_INSPECTION_PORT &&
    indexAllowed &&
    indexOpen &&
    explicitIndexAction,
  );
}
