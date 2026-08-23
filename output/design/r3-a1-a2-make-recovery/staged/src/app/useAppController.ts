import { useCallback, useEffect, useRef, useState } from "react";
import { isAuthRoute } from "./appRoutes";
import type { AuthGateState, AuthPreviewOutcome, AuthRoute, EntryIntent, Route, Session } from "./appTypes";
import { resolvePostAuthDestination, resolveStaffHome, type DenialReason } from "./entryIntent";
import { useTheme } from "./hooks/useTheme";
import { scrollToRouteStart } from "./shared/scrollToRouteStart";

/* R3-A1-A2 — FIGMA MAKE PROTOTYPE controller.
 *
 * The routing model here is the real one: entry intent is first-class, explicit
 * intent beats capability-based defaults, and Home preserves the session.
 * Only the *identity* is simulated, and §27 requires that the simulation
 * represent the corrected product model rather than a convenient one.
 *
 * Note what the previous prototype did that this does not: it granted
 * `capabilities: [...AUTH_ROUTES]` — every capability — to whoever signed in.
 * That made every routing decision trivially "authorized" and hid the entire
 * question the owner is actually asking about. Each persona below now carries a
 * realistic capability set, so the prototype can genuinely demonstrate a non-DOL
 * requester being routed differently from DOL staff, and an ineligible account
 * being refused.
 */

/** Personas mirror `src/domain/permissions.js` in the product. */
const PERSONAS: Record<string, { session: Session | null; state?: AuthGateState }> = {
  /* ROLES.REQUESTER — view.request, request.create, lending.create. No view.internal. */
  requester: {
    session: {
      authenticated: true,
      displayName: "USC Officer",
      role: "USC Staff / Officer",
      initials: "UO",
      capabilities: ["request-center", "profile"],
      requesterEligible: true,
      internalOperator: false,
    },
  },
  /* ROLES.DOL_STAFF — carries view.internal and request.create. */
  dol: {
    session: {
      authenticated: true,
      displayName: "DOL Staff",
      role: "DOL Staff",
      initials: "DS",
      capabilities: ["overview", "inventory", "request-center", "lending", "release", "restocking", "procurement", "profile"],
      requesterEligible: true,
      internalOperator: true,
    },
  },
  /* Signed in, but holds neither requester eligibility nor internal capability. */
  ineligible: {
    session: {
      authenticated: true,
      displayName: "Angelite Student",
      role: "Student",
      initials: "AS",
      capabilities: [],
      requesterEligible: false,
      internalOperator: false,
    },
  },
  "session-expired": { session: null, state: "session-expired" },
  "invalid-credentials": { session: null, state: "invalid-credentials" },
  "activation-required": { session: null, state: "activation-required" },
  "reset-required": { session: null, state: "invalid-credentials" },
};

export function useAppController() {
  const [dark, setDark] = useTheme();
  const [route, setRoute] = useState<Route>("landing");
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthGateState>("signed-out");
  const [previewOutcome, setPreviewOutcome] = useState<AuthPreviewOutcome>("requester");
  const authTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  /* Entry intent is what the user explicitly opened; `intendedRoute` is the
     specific internal route behind an OTHER_INTERNAL_DESTINATION intent. They
     are separate because a DOL account arriving through "Start a logistics
     request" has an explicit external intent and no internal target at all. */
  const [entryIntent, setEntryIntent] = useState<EntryIntent>("GENERIC_STAFF_SIGN_IN");
  const [intendedRoute, setIntendedRoute] = useState<AuthRoute | null>(null);
  const [denialReason, setDenialReason] = useState<DenialReason | null>(null);
  /** True while an authenticated DOL account is deliberately using requester mode. */
  const [requesterMode, setRequesterMode] = useState(false);

  const clearAuthTimers = useCallback(() => {
    authTimers.current.forEach((timer) => clearTimeout(timer));
    authTimers.current = [];
  }, []);

  useEffect(() => clearAuthTimers, [clearAuthTimers]);

  const moveTo = useCallback((nextRoute: Route) => {
    setRoute(nextRoute);
    scrollToRouteStart();
  }, []);

  const applyDecision = useCallback((next: Session, intent: EntryIntent, target: AuthRoute | null) => {
    const decision = resolvePostAuthDestination(next, intent, target);
    if (decision.outcome === "denied") {
      // Truthful and recoverable: the gateway states the access state and offers
      // Home and Public Lending. It never says why another account would pass.
      setDenialReason(decision.reason);
      setRequesterMode(false);
      setAuthState("denied");
      moveTo("staff-signin");
      return;
    }
    setDenialReason(null);
    setRequesterMode(decision.requesterMode);
    setAuthState("authorized");
    moveTo(decision.route);
  }, [moveTo]);

  /**
   * Send the user to the identity gateway, remembering what they were trying to
   * open. An already-authorized session skips the gateway entirely — being
   * signed in should not make an explicit destination harder to reach.
   */
  const requireAuth = useCallback((intent: EntryIntent, target: AuthRoute | null = null) => {
    clearAuthTimers();
    setEntryIntent(intent);
    setIntendedRoute(target);
    setDenialReason(null);

    if (session) {
      applyDecision(session, intent, target);
      return;
    }
    setAuthState("auth-required");
    moveTo("staff-signin");
  }, [applyDecision, clearAuthTimers, moveTo, session]);

  /** Open the External Request Center, authenticating first if needed. */
  const requireExternalRequest = useCallback(() => {
    requireAuth("EXTERNAL_REQUEST_CENTER");
  }, [requireAuth]);

  const navigate = useCallback((next: Route) => {
    if (next === "external-request") {
      requireExternalRequest();
      return;
    }
    if (isAuthRoute(next)) {
      requireAuth(next === "request-center" ? "INTERNAL_REQUEST_HUB" : "OTHER_INTERNAL_DESTINATION", next);
      return;
    }

    clearAuthTimers();
    if (next === "staff-signin") {
      // Generic identity gateway: no pre-committed destination. Binding it to a
      // capability-gated route would deny otherwise-valid accounts that merely
      // lack that one capability.
      setEntryIntent("GENERIC_STAFF_SIGN_IN");
      setIntendedRoute(null);
      setDenialReason(null);
      setAuthState(session ? "authorized" : "signed-out");
    }
    moveTo(next);
  }, [clearAuthTimers, moveTo, requireAuth, requireExternalRequest, session]);

  /**
   * R3-A1-A2: Home is Home, not logout.
   *
   * Home returns to the landing surface, scrolls to top and drops transient
   * navigation intent. It deliberately does NOT touch `session`, so an
   * authenticated user stays authenticated. Sign Out remains the only normal
   * action that destroys a session.
   *
   * The previous prototype reset `authState` and `intendedRoute` here, which
   * made Home behave as a partial sign-out.
   */
  const goHome = useCallback(() => {
    clearAuthTimers();
    setEntryIntent("GENERIC_STAFF_SIGN_IN");
    setIntendedRoute(null);
    setDenialReason(null);
    setRequesterMode(false);
    setAuthState(session ? "authorized" : "signed-out");
    moveTo("landing");
  }, [clearAuthTimers, moveTo, session]);

  /** DOL requester-mode shortcut. Routes to the capability-appropriate internal
   *  home, never blindly to Overview. */
  const openLogisticsHub = useCallback(() => {
    const home = resolveStaffHome(session);
    if (!home) {
      setDenialReason("NO_INTERNAL_CAPABILITY");
      setAuthState("denied");
      moveTo("staff-signin");
      return;
    }
    setRequesterMode(false);
    setEntryIntent("OTHER_INTERNAL_DESTINATION");
    setIntendedRoute(home);
    moveTo(home);
  }, [moveTo, session]);

  const handleSignIn = useCallback((outcome: AuthPreviewOutcome) => {
    clearAuthTimers();
    setDenialReason(null);
    setAuthState("loading");

    authTimers.current.push(setTimeout(() => setAuthState("authenticated"), 420));
    authTimers.current.push(setTimeout(() => {
      const persona = PERSONAS[outcome];
      if (!persona || !persona.session) {
        setSession(null);
        setAuthState(persona?.state ?? "denied");
        return;
      }
      setSession(persona.session);
      authTimers.current.push(setTimeout(() => {
        applyDecision(persona.session as Session, entryIntent, intendedRoute);
      }, 360));
    }, 840));
  }, [applyDecision, clearAuthTimers, entryIntent, intendedRoute]);

  const handleSignOut = useCallback(() => {
    clearAuthTimers();
    setSession(null);
    setAuthState("signed-out");
    setEntryIntent("GENERIC_STAFF_SIGN_IN");
    setIntendedRoute(null);
    setDenialReason(null);
    setRequesterMode(false);
    moveTo("landing");
  }, [clearAuthTimers, moveTo]);

  const toggleTheme = useCallback(() => setDark((value) => !value), [setDark]);

  return {
    dark,
    route,
    session,
    authState,
    entryIntent,
    intendedRoute,
    denialReason,
    requesterMode,
    previewOutcome,
    setPreviewOutcome,
    navigate,
    requireAuth,
    requireExternalRequest,
    openLogisticsHub,
    goHome,
    handleSignIn,
    handleSignOut,
    toggleTheme,
  };
}

export type AppController = ReturnType<typeof useAppController>;
