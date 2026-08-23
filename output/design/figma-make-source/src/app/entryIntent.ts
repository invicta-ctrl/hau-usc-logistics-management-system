/* R3-A1-A2 entry-intent resolution.
 *
 *   AUTHENTICATION = who is this user?
 *   AUTHORIZATION  = what may this account access?
 *   ENTRY INTENT   = what did the user explicitly try to open?
 *
 * Priority:
 *   1. Preserve explicit valid entry intent.
 *   2. Check server-derived authorization.
 *   3. Use capability-based default routing only when there was no explicit
 *      destination.
 *
 * This module is pure so the routing matrix in `docs/frontend/ROUTING.md` can be
 * asserted directly in unit tests without mounting the app.
 */

import type { AuthRoute, EntryIntent, Route, Session } from "./appTypes";

/** Default internal home order. First capability the account actually holds wins.
 *  Deliberately not "always Overview": an account may lack `view.internal`
 *  summary access while still owning, say, Release. */
export const STAFF_HOME_ORDER: AuthRoute[] = [
  "overview",
  "request-center",
  "inventory",
  "lending",
  "release",
  "restocking",
  "procurement",
  "events",
  "administration",
  "profile",
];

/** Capability-appropriate internal home for a session. `null` when the account
 *  holds no internal route at all, which is the non-DOL requester case. */
export function resolveStaffHome(session: Session | null): AuthRoute | null {
  if (!session) return null;
  return STAFF_HOME_ORDER.find((route) => session.capabilities.includes(route)) ?? null;
}

/** The internal destination an intent names, if it names one. */
export function intendedInternalRoute(
  intent: EntryIntent,
  requested: AuthRoute | null,
): AuthRoute | null {
  if (intent === "INTERNAL_REQUEST_HUB") return "request-center";
  if (intent === "OTHER_INTERNAL_DESTINATION") return requested;
  return null;
}

export type PostAuthDecision =
  | { outcome: "authorized"; route: Route; requesterMode: boolean }
  | { outcome: "denied"; reason: DenialReason };

export type DenialReason =
  /** Signed in, but the account is not an eligible USC requester. */
  | "NOT_ELIGIBLE_REQUESTER"
  /** Signed in, but the account lacks the capability for the internal route asked for. */
  | "NO_INTERNAL_CAPABILITY"
  /** Signed in, but the account holds neither requester eligibility nor any internal route. */
  | "NO_ACCESS_AT_ALL";

/**
 * Resolve where an authenticated session lands, given what it explicitly asked
 * for. Every branch here is a row of the owner-approved routing matrix.
 */
export function resolvePostAuthDestination(
  session: Session,
  intent: EntryIntent,
  requestedInternalRoute: AuthRoute | null,
): PostAuthDecision {
  // 1. Explicit external-requester intent wins, for DOL and non-DOL alike. A
  //    DOL account that chose "Start a logistics request" is in requester mode;
  //    it keeps its operational identity and is offered Open Logistics Hub, but
  //    it is not redirected away from what it asked for.
  if (intent === "EXTERNAL_REQUEST_CENTER") {
    if (!session.requesterEligible) return { outcome: "denied", reason: "NOT_ELIGIBLE_REQUESTER" };
    return { outcome: "authorized", route: "external-request", requesterMode: true };
  }

  // 2. Explicit internal intent. Checked against server-derived capability.
  const internalTarget = intendedInternalRoute(intent, requestedInternalRoute);
  if (internalTarget) {
    if (!session.capabilities.includes(internalTarget)) {
      return { outcome: "denied", reason: "NO_INTERNAL_CAPABILITY" };
    }
    return { outcome: "authorized", route: internalTarget, requesterMode: false };
  }

  // 3. No explicit destination — generic staff sign-in. Capabilities choose the
  //    default home: internal operators get the Main Logistics Hub, eligible
  //    requesters without internal capability get the External Request Center.
  const staffHome = resolveStaffHome(session);
  if (session.internalOperator && staffHome) {
    return { outcome: "authorized", route: staffHome, requesterMode: false };
  }
  if (session.requesterEligible) {
    return { outcome: "authorized", route: "external-request", requesterMode: true };
  }
  if (staffHome) {
    return { outcome: "authorized", route: staffHome, requesterMode: false };
  }
  return { outcome: "denied", reason: "NO_ACCESS_AT_ALL" };
}

/** Human-readable, non-enumerating denial copy. Never names directory membership
 *  or whether some other account would have been allowed. */
export const DENIAL_COPY: Record<DenialReason, { title: string; detail: string }> = {
  NOT_ELIGIBLE_REQUESTER: {
    title: "Not available for this account",
    detail:
      "The External Request Center is for verified USC staff and officers. Your account is signed in but is not currently eligible to submit logistics requests. Public Lending remains open to you.",
  },
  NO_INTERNAL_CAPABILITY: {
    title: "Not available for this account",
    detail:
      "Your account is signed in but is not authorized to open that workspace. Return Home or continue in the areas your account does cover.",
  },
  NO_ACCESS_AT_ALL: {
    title: "Not available for this account",
    detail:
      "Your account is signed in but has no logistics workspace or requester access assigned. Public Lending remains open to you. Contact the Department of Logistics if you believe this is wrong.",
  },
};
