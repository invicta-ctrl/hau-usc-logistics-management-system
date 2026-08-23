/* R3-A1-A2 three-context route and identity model.
 *
 *   A. PUBLIC            Public Lending Hub, no sign-in, ever.
 *   B. AUTH REQUESTER    External Request Center, eligible USC requester.
 *   C. AUTH DOL          Main Logistics Hub, internal capability gated.
 *
 * CHECKPOINT A is additive on purpose: "request" stays in PublicSubRoute for now
 * so every existing caller still type-checks. Checkpoint B removes it in the same
 * save as the callers that stop using it.
 */
export type PublicSubRoute = "request" | "tracking" | "borrow";

/** Context B. Requires a session and a server-derived eligible requester. */
export type RequesterRoute = "external-request";

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
  | "authenticated"
  | "authorized"
  | "denied"
  | "session-expired"
  | "activation-required"
  | "invalid-credentials";

/* R3-A1-A2 §27. The prototype may simulate identity outcomes, but the simulation
 * has to represent the corrected product model, and it must be labelled as
 * simulation. These are the personas the owner named. */
export type AuthPreviewOutcome =
  | "requester"            // eligible non-DOL USC staff/officer
  | "dol"                  // DOL / internal-capable staff
  | "ineligible"           // signed in, but neither requester nor internal
  | "session-expired"
  | "invalid-credentials"
  | "activation-required"
  | "reset-required";

export type Session = {
  authenticated: true;
  displayName: string;
  role: string;
  initials: string;
  /** Internal (context C) routes this account may open. */
  capabilities: AuthRoute[];
  /** Mirrors server-derived `request.create`. Gate for the External Request Center. */
  requesterEligible: boolean;
  /** Mirrors server-derived `view.internal`. Marks a DOL/internal operator. */
  internalOperator: boolean;
};
