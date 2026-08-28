import { isAppRoute } from './appRoutes';
import type { Route } from './appTypes';

const APP_ROUTE_HASH_PREFIX = '#/route/';

export function appRouteHash(route: Route): string {
  return route === 'landing' ? '' : `${APP_ROUTE_HASH_PREFIX}${route}`;
}

export function appRouteFromHash(value: unknown): Route | null {
  if (value === '') return 'landing';
  if (typeof value !== 'string' || !value.startsWith(APP_ROUTE_HASH_PREFIX)) return null;
  const route = value.slice(APP_ROUTE_HASH_PREFIX.length);
  return isAppRoute(route) ? route : null;
}
