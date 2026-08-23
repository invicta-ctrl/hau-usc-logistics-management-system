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

/* R3-A1-A2. Both predicates read the same server-derived capability array the
 * Worker authorizes against — they do not re-derive policy in the browser.
 *
 *   request.create  gates POST /api/portal/request   (External Request Center)
 *   view.internal   gates the DOL/internal operational surfaces
 *
 * `src/domain/permissions.js` gives ROLES.REQUESTER exactly
 * [view.request, request.create, lending.create] and no view.internal, while
 * DOL_STAFF / COMMITTEE_HEAD / DIRECTOR / ADMINISTRATOR all carry view.internal.
 * That is the product's own non-DOL-vs-DOL line, so the frontend reuses it
 * instead of inventing a parallel one. */
const REQUESTER_CAPABILITY = "request.create";
const INTERNAL_CAPABILITY = "view.internal";

export function isRouteAuthorized(user: FrontendUser, route: AuthRoute): boolean {
  const required = ROUTE_CAPABILITY[route];
  return !required || user.capabilities.includes(required);
}

/** Eligible USC requester — may open the External Request Center. */
export function isEligibleRequester(user: FrontendUser): boolean {
  return user.capabilities.includes(REQUESTER_CAPABILITY);
}

/** DOL / internal operator — may open Main Logistics Hub surfaces. */
export function isInternalOperator(user: FrontendUser): boolean {
  return user.capabilities.includes(INTERNAL_CAPABILITY);
}
