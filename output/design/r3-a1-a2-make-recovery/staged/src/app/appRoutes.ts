import type { AuthRoute, Route } from "./appTypes";

export const AUTH_ROUTES: AuthRoute[] = [
  "overview",
  "inventory",
  "request-center",
  "lending",
  "release",
  "restocking",
  "procurement",
  "events",
  "administration",
  "profile",
];

export const AUTH_ROUTE_INTENT_LABELS: Record<AuthRoute, string> = {
  overview: "Operations overview",
  inventory: "Inventory",
  "request-center": "Internal Request Hub",
  lending: "Internal Lending Hub",
  release: "Release Desk",
  restocking: "Restocking",
  procurement: "Procurement",
  events: "Events",
  administration: "Administration",
  profile: "Account profile",
};

export const AUTH_PLACEHOLDER_LABELS: Partial<Record<AuthRoute, string>> = {
  inventory: "Inventory",
  "request-center": "Request Center",
  lending: "Lending",
  release: "Release",
  restocking: "Restocking",
  procurement: "Procurement",
  events: "Events",
  administration: "Administration",
};

export function isAuthRoute(route: Route): route is AuthRoute {
  return AUTH_ROUTES.includes(route as AuthRoute);
}
