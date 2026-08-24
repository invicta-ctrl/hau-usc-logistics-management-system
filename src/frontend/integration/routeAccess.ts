import type { AuthRoute } from '../app/appTypes';
import type { FrontendUser } from './backend';

const ROUTE_CAPABILITY: Partial<Record<AuthRoute, string>> = {
  overview: 'view.internal',
  inventory: 'view.inventory',
  'request-center': 'view.request',
  lending: 'view.internal',
  release: 'fulfillment.release',
  restocking: 'view.inventory',
  procurement: 'view.internal',
  events: 'event.manage',
  administration: 'access.admin',
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
const REQUESTER_CAPABILITY = 'request.create';
const INTERNAL_CAPABILITY = 'view.internal';
const REQUEST_REVIEW_CAPABILITY = 'request.review';
const LENDING_APPROVE_CAPABILITY = 'lending.approve';
const LENDING_HANDOFF_CAPABILITY = 'lending.handoff';
const LENDING_RETURN_CAPABILITY = 'lending.return';
const EVIDENCE_UPLOAD_CAPABILITY = 'evidence.upload';

export function isRouteAuthorized(user: FrontendUser, route: AuthRoute): boolean {
  if (route === 'request-center') {
    return user.capabilities.includes('view.internal') && user.capabilities.includes('view.request');
  }
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

/** Server-derived review capability used only to present enabled FI-06 controls. */
export function canReviewInternalRequests(user: FrontendUser): boolean {
  return user.capabilities.includes(REQUEST_REVIEW_CAPABILITY);
}

/** FI-07 presentation gates only; every lending command is still re-authorized by the Worker. */
export function canApproveInternalLending(user: FrontendUser): boolean {
  return user.capabilities.includes(LENDING_APPROVE_CAPABILITY);
}

export function canHandoffInternalLending(user: FrontendUser): boolean {
  return user.capabilities.includes(LENDING_HANDOFF_CAPABILITY);
}

export function canReturnInternalLending(user: FrontendUser): boolean {
  return user.capabilities.includes(LENDING_RETURN_CAPABILITY);
}

export function canUploadLendingEvidence(user: FrontendUser): boolean {
  return user.capabilities.includes(EVIDENCE_UPLOAD_CAPABILITY);
}
