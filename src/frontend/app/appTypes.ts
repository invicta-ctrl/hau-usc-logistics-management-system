/* R3-A1-A2 three-context route and identity model.
 *
 * A. PUBLIC              — Public Lending Hub, no sign-in.
 * B. AUTHENTICATED       — External Request Center, eligible USC requester.
 *    REQUESTER
 * C. AUTHENTICATED DOL   — Main Logistics Hub, internal capability gated.
 *
 * `PublicSubRoute` no longer carries "request". The logistics Request Center is
 * not public; it is `external-request`, which requires a session. See
 * `.codex/specs/accepted/2026-08-23-r3-a1-a2-owner-routing-identity-three-context.md`.
 */

/** Context A. Reachable with no session, ever. */
export type PublicSubRoute = "tracking" | "borrow";

/** Context B. Requires a session and a server-derived eligible requester. */
export type RequesterRoute = "external-request";

/** Context C. Requires a session and a server-derived internal capability. */
export type AuthRoute =
  | "overview"
  | "inventory"
  | "request-center"
  | "lending"
  | "release"
  | "restocking"
  | "procurement"
  | "events"
  | "administration"
  | "profile";

export type Route = "landing" | "staff-signin" | PublicSubRoute | RequesterRoute | AuthRoute;

/* Entry intent is what the user explicitly asked to open. It is a first-class
 * concept and is never inferred from a capability string: a DOL account that
 * deliberately opened the External Request Center is in requester mode and must
 * not be thrown into the Main Logistics Hub. */
export type EntryIntent =
  | "GENERIC_STAFF_SIGN_IN"
  | "EXTERNAL_REQUEST_CENTER"
  | "INTERNAL_REQUEST_HUB"
  | "OTHER_INTERNAL_DESTINATION";

export type AuthGateState =
  | "signed-out"
  | "auth-required"
  | "loading"
  | "authorized"
  | "denied"
  | "activation-required"
  | "service-error";

export type Session = {
  authenticated: true;
  displayName: string;
  role: string;
  initials: string;
  /** Internal (context C) routes this account may open, derived from server capabilities. */
  capabilities: AuthRoute[];
  /** Server-derived `request.create`. Gate for the External Request Center. */
  requesterEligible: boolean;
  /** Server-derived `view.internal`. Marks a DOL/internal operator. */
  internalOperator: boolean;
  /** Server-derived `request.review`. Presentation gate only; the Worker rechecks every mutation. */
  canReviewRequests: boolean;
};
