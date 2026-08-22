import type { AuthRoute } from "../app/appTypes";
import type { FrontendUser } from "./backend";

const ROUTE_CAPABILITY: Partial<Record<AuthRoute, string>> = {
  overview: "view.internal",
  inventory: "view.inventory",
  "request-center": "view.request",
  lending: "view.internal",
  release: "fulfillment.release",
  restocking: "view.inventory",
  procurement: "view.internal",
  events: "event.manage",
  administration: "access.admin",
};

export function isRouteAuthorized(user: FrontendUser, route: AuthRoute): boolean {
  const required = ROUTE_CAPABILITY[route];
  return !required || user.capabilities.includes(required);
}
