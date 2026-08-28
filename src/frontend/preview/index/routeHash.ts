import { AUTH_ROUTES } from '../../app/appRoutes';
import type { AuthRoute } from '../../app/appTypes';

export const PREVIEW_INDEX_HASH = '#/__preview/index';
export const PREVIEW_INSPECTION_HASH_PREFIX = '#/__preview/inspect/';

export function isPreviewIndexHash(value: unknown): boolean {
  return value === PREVIEW_INDEX_HASH;
}

export function previewInspectionHash(route: AuthRoute | 'external-request'): string {
  return `${PREVIEW_INSPECTION_HASH_PREFIX}${route}`;
}

export function previewInspectionRouteFromHash(value: unknown): AuthRoute | 'external-request' | null {
  if (typeof value !== 'string' || !value.startsWith(PREVIEW_INSPECTION_HASH_PREFIX)) return null;
  const route = value.slice(PREVIEW_INSPECTION_HASH_PREFIX.length);
  if (route === 'external-request' || AUTH_ROUTES.includes(route as AuthRoute)) {
    return route as AuthRoute | 'external-request';
  }
  return null;
}
