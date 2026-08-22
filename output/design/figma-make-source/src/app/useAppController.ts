import { useCallback, useEffect, useRef, useState } from "react";
import { AUTH_ROUTES, isAuthRoute } from "./appRoutes";
import type { AuthGateState, AuthPreviewOutcome, AuthRoute, Route, Session } from "./appTypes";
import { useTheme } from "./hooks/useTheme";
import { scrollToRouteStart } from "./shared/scrollToRouteStart";

export function useAppController() {
  const [dark, setDark] = useTheme();
  const [route, setRoute] = useState<Route>("landing");
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthGateState>("signed-out");
  const [intendedRoute, setIntendedRoute] = useState<AuthRoute | null>(null);
  const [previewOutcome, setPreviewOutcome] = useState<AuthPreviewOutcome>("authorized");
  const authTimers = useRef<Array<ReturnType<typeof setTimeout>>>([]);

  const clearAuthTimers = useCallback(() => {
    authTimers.current.forEach((timer) => clearTimeout(timer));
    authTimers.current = [];
  }, []);

  useEffect(() => clearAuthTimers, [clearAuthTimers]);

  const moveTo = useCallback((nextRoute: Route) => {
    setRoute(nextRoute);
    scrollToRouteStart();
  }, []);

  const requireAuth = useCallback((target: AuthRoute) => {
    clearAuthTimers();
    setIntendedRoute(target);
    if (session?.capabilities.includes(target)) {
      setAuthState("authorized");
      moveTo(target);
      return;
    }
    setAuthState(session ? "denied" : "auth-required");
    moveTo("staff-signin");
  }, [clearAuthTimers, moveTo, session]);

  const navigate = useCallback((next: Route) => {
    if (isAuthRoute(next)) {
      requireAuth(next);
      return;
    }

    clearAuthTimers();
    if (next === "staff-signin") {
      setAuthState("signed-out");
      setIntendedRoute(null);
    }
    moveTo(next);
  }, [clearAuthTimers, moveTo, requireAuth]);

  const goHome = useCallback(() => {
    clearAuthTimers();
    setAuthState("signed-out");
    setIntendedRoute(null);
    moveTo("landing");
  }, [clearAuthTimers, moveTo]);

  const handleSignIn = useCallback((outcome: AuthPreviewOutcome) => {
    clearAuthTimers();
    const target = intendedRoute ?? "overview";
    setAuthState("loading");

    authTimers.current.push(setTimeout(() => setAuthState("authenticated"), 420));
    authTimers.current.push(setTimeout(() => {
      if (outcome === "denied") {
        setSession(null);
        setAuthState("denied");
        return;
      }
      if (outcome === "session-expired") {
        setSession(null);
        setAuthState("session-expired");
        return;
      }

      setSession({
        authenticated: true,
        displayName: "Authorized Staff",
        role: "DOL Staff",
        initials: "AS",
        capabilities: [...AUTH_ROUTES],
      });
      setAuthState("authorized");
      authTimers.current.push(setTimeout(() => {
        setIntendedRoute(null);
        moveTo(target);
      }, 360));
    }, 840));
  }, [clearAuthTimers, intendedRoute, moveTo]);

  const handleSignOut = useCallback(() => {
    clearAuthTimers();
    setSession(null);
    setAuthState("signed-out");
    setIntendedRoute(null);
    moveTo("landing");
  }, [clearAuthTimers, moveTo]);

  const toggleTheme = useCallback(() => setDark((value) => !value), [setDark]);

  return {
    dark,
    route,
    session,
    authState,
    intendedRoute,
    previewOutcome,
    setPreviewOutcome,
    navigate,
    requireAuth,
    goHome,
    handleSignIn,
    handleSignOut,
    toggleTheme,
  };
}

export type AppController = ReturnType<typeof useAppController>;
