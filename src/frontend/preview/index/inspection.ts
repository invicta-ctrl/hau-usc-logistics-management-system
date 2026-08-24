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
    location?.hostname === '127.0.0.1' &&
    location.port === '4173' &&
    indexAllowed &&
    indexOpen &&
    explicitIndexAction,
  );
}
