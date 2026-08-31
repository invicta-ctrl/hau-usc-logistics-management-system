import type { AuthRoute, Route } from './appTypes';

export const AUTH_ROUTES: AuthRoute[] = [
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
];

export const APP_ROUTES: Route[] = [
  'landing',
  'tracking',
  'borrow',
  'staff-signin',
  'external-request',
  ...AUTH_ROUTES,
];

/* R3-A1-A2 vocabulary. The public-facing name "Request Center" now belongs
 * exclusively to the authenticated External Request Center (context B). The
 * internal DOL surface is the **Request Hub** (context C). FE-R3-012 tracked
 * this collision; renaming here and in the preview registry closes it. */
export const AUTH_ROUTE_INTENT_LABELS: Record<AuthRoute, string> = {
  overview: 'Operations overview',
  inventory: 'Inventory',
  'request-center': 'Internal Request Hub',
  lending: 'Internal Lending Hub',
  release: 'Release Desk',
  restocking: 'Restocking',
  procurement: 'Procurement',
  events: 'Events',
  administration: 'Administration',
  profile: 'Account profile',
};

/** One presentational route name for document titles and focus context. */
export const APP_ROUTE_LABELS: Record<Route, string> = {
  landing: 'Home',
  tracking: 'Track lending',
  borrow: 'Public Lending Hub',
  'staff-signin': 'Staff sign in',
  'external-request': 'External Request Center',
  ...AUTH_ROUTE_INTENT_LABELS,
};

export const AUTH_PLACEHOLDER_LABELS: Partial<Record<AuthRoute, string>> = {
  inventory: 'Inventory',
  'request-center': 'Internal Request Hub',
  lending: 'Internal Lending Hub',
  release: 'Release',
  restocking: 'Restocking',
  procurement: 'Procurement',
  events: 'Events',
  administration: 'Administration',
};

export function isAuthRoute(route: Route): route is AuthRoute {
  return AUTH_ROUTES.includes(route as AuthRoute);
}

export function isAppRoute(value: unknown): value is Route {
  return typeof value === 'string' && APP_ROUTES.includes(value as Route);
}
