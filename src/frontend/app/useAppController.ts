import { useCallback, useState } from "react";
import { AUTH_ROUTES, isAuthRoute } from "./appRoutes";
import type { AuthGateState, AuthRoute, Route, Session } from "./appTypes";
import { useTheme } from "./hooks/useTheme";
import { scrollToRouteStart } from "./shared/scrollToRouteStart";
import { FrontendApiError, frontendBackend, type FrontendUser } from "../integration/backend";
import { isRouteAuthorized } from "../integration/routeAccess";

function initials(value: string) {
  const parts = value.split(/\s+/u).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ""}` : value.slice(0, 2)).toUpperCase();
}

function projectSession(user: FrontendUser): Session {
  return {
    authenticated: true,
    displayName: user.displayName,
    role: user.roleId,
    initials: initials(user.displayName),
    capabilities: AUTH_ROUTES.filter((route) => isRouteAuthorized(user, route)),
  };
}

export function useAppController() {
  const [dark, setDark] = useTheme();
  const [route, setRoute] = useState<Route>("landing");
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthGateState>("signed-out");
  const [authError, setAuthError] = useState<string | null>(null);
  const [intendedRoute, setIntendedRoute] = useState<AuthRoute | null>(null);
  const [activationExpiresAt, setActivationExpiresAt] = useState("");

  const moveTo = useCallback((nextRoute: Route) => {
    setRoute(nextRoute);
    scrollToRouteStart();
  }, []);

  const requireAuth = useCallback((target: AuthRoute) => {
    setIntendedRoute(target);
    if (session?.capabilities.includes(target)) {
      setAuthState("authorized");
      moveTo("staff-signin");
      return;
    }
    if (session) {
      setAuthState("denied");
      moveTo("staff-signin");
      return;
    }
    setAuthError(null);
    setAuthState("loading");
    moveTo("staff-signin");
    void frontendBackend.session().then((current) => {
      if (!current) {
        setAuthState("auth-required");
        return;
      }
      const nextSession = projectSession(current.user);
      setSession(nextSession);
      if (nextSession.capabilities.includes(target)) {
        setAuthState("authorized");
        moveTo("staff-signin");
      } else {
        setAuthState("denied");
      }
    }).catch((error: unknown) => {
      setAuthError(error instanceof FrontendApiError ? error.message : "The authentication service is temporarily unavailable.");
      setAuthState("service-error");
    });
  }, [moveTo, session]);

  const navigate = useCallback((next: Route) => {
    if (isAuthRoute(next)) {
      requireAuth(next);
      return;
    }

    if (next === "staff-signin") {
      setAuthState("signed-out");
      setAuthError(null);
      setIntendedRoute(null);
      setActivationExpiresAt("");
    }
    moveTo(next);
  }, [moveTo, requireAuth]);

  const goHome = useCallback(() => {
    setAuthState("signed-out");
    setAuthError(null);
    setIntendedRoute(null);
    setActivationExpiresAt("");
    moveTo("landing");
  }, [moveTo]);

  const handleSignIn = useCallback(async (accessId: string, password: string) => {
    const target = intendedRoute ?? "overview";
    setAuthError(null);
    setAuthState("loading");
    try {
      const result = await frontendBackend.login(accessId, password);
      if (result.activationRequired) {
        setSession(null);
        setActivationExpiresAt(result.activationExpiresAt);
        setAuthState("activation-required");
        return;
      }
      if (!result.session) {
        setSession(null);
        setAuthState("service-error");
        setAuthError("The authentication service returned an incomplete session.");
        return;
      }
      const nextSession = projectSession(result.session.user);
      setSession(nextSession);
      setActivationExpiresAt("");
      if (nextSession.capabilities.includes(target)) {
        setAuthState("authorized");
        setIntendedRoute(target);
      } else {
        setAuthState("denied");
      }
    } catch (error) {
      setSession(null);
      setAuthError(error instanceof FrontendApiError ? error.message : "The authentication service is temporarily unavailable.");
      setAuthState("service-error");
    }
  }, [intendedRoute, moveTo]);

  const handleActivate = useCallback(async (
    profile: { fullName: string; mobileNumber: string; email: string },
    password: string,
    confirmPassword: string,
  ) => {
    const target = intendedRoute ?? "overview";
    setAuthError(null);
    setAuthState("loading");
    try {
      const activated = await frontendBackend.activateStarter(profile, password, confirmPassword);
      const nextSession = projectSession(activated.user);
      setSession(nextSession);
      setActivationExpiresAt("");
      if (nextSession.capabilities.includes(target)) {
        setAuthState("authorized");
        setIntendedRoute(target);
      } else {
        setAuthState("denied");
      }
    } catch (error) {
      setSession(null);
      setAuthError(error instanceof FrontendApiError ? error.message : "The activation service is temporarily unavailable.");
      setAuthState("service-error");
    }
  }, [intendedRoute]);

  const handleSignOut = useCallback(async () => {
    try {
      await frontendBackend.logout();
    } finally {
      setSession(null);
      setAuthState("signed-out");
      setAuthError(null);
      setIntendedRoute(null);
      setActivationExpiresAt("");
      moveTo("landing");
    }
  }, [moveTo]);

  const toggleTheme = useCallback(() => setDark((value) => !value), [setDark]);

  return {
    dark,
    route,
    session,
    authState,
    authError,
    intendedRoute,
    navigate,
    requireAuth,
    goHome,
    handleSignIn,
    handleActivate,
    handleSignOut,
    activationExpiresAt,
    toggleTheme,
  };
}

export type AppController = ReturnType<typeof useAppController>;
