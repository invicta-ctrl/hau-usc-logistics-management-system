import { useCallback, useEffect, useState } from 'react';
import { AUTH_ROUTES, isAuthRoute } from './appRoutes';
import type { AuthGateState, AuthRoute, EntryIntent, Route, Session } from './appTypes';
import { resolvePostAuthDestination, resolveStaffHome, type DenialReason } from './entryIntent';
import { useTheme } from './hooks/useTheme';
import { scrollToRouteStart } from './shared/scrollToRouteStart';
import { FrontendApiError, frontendBackend, type FrontendUser } from '../integration/backend';
import {
  canApproveInternalLending,
  canHandoffInternalLending,
  canReturnInternalLending,
  canReviewInternalRequests,
  canUploadLendingEvidence,
  isEligibleRequester,
  isInternalOperator,
  isRouteAuthorized,
} from '../integration/routeAccess';

function initials(value: string) {
  const parts = value.split(/\s+/u).filter(Boolean);
  return (parts.length > 1 ? `${parts[0][0]}${parts.at(-1)?.[0] ?? ''}` : value.slice(0, 2)).toUpperCase();
}

function projectSession(user: FrontendUser): Session {
  return {
    authenticated: true,
    displayName: user.displayName,
    role: user.roleId,
    initials: initials(user.displayName),
    capabilities: AUTH_ROUTES.filter((route) => isRouteAuthorized(user, route)),
    requesterEligible: isEligibleRequester(user),
    internalOperator: isInternalOperator(user),
    canReviewRequests: canReviewInternalRequests(user),
    canApproveLending: canApproveInternalLending(user),
    canHandoffLending: canHandoffInternalLending(user),
    canReturnLending: canReturnInternalLending(user),
    canUploadLendingEvidence: canUploadLendingEvidence(user),
  };
}

export function useAppController() {
  const [dark, setDark] = useTheme();
  const [route, setRoute] = useState<Route>('landing');
  const [session, setSession] = useState<Session | null>(null);
  const [authState, setAuthState] = useState<AuthGateState>('signed-out');
  const [authError, setAuthError] = useState<string | null>(null);
  const [activationExpiresAt, setActivationExpiresAt] = useState('');
  const [playground, setPlayground] = useState(false);

  useEffect(() => {
    let active = true;
    void frontendBackend
      .version()
      .then((version) => {
        if (active) setPlayground(version.playground);
      })
      .catch(() => {
        if (active) setPlayground(false);
      });
    return () => {
      active = false;
    };
  }, []);

  /* R3-A1-A2 entry intent. `entryIntent` is what the user explicitly opened;
   * `intendedRoute` is the specific internal route behind an
   * OTHER_INTERNAL_DESTINATION intent. They are separate because a DOL account
   * arriving through "Start a logistics request" has an explicit external
   * intent and no internal target at all. */
  const [entryIntent, setEntryIntent] = useState<EntryIntent>('GENERIC_STAFF_SIGN_IN');
  const [intendedRoute, setIntendedRoute] = useState<AuthRoute | null>(null);
  const [denialReason, setDenialReason] = useState<DenialReason | null>(null);
  /** True while an authenticated DOL account is deliberately using requester mode. */
  const [requesterMode, setRequesterMode] = useState(false);

  const moveTo = useCallback((nextRoute: Route) => {
    setRoute(nextRoute);
    scrollToRouteStart();
  }, []);

  const applyDecision = useCallback(
    (next: Session, intent: EntryIntent, target: AuthRoute | null) => {
      const decision = resolvePostAuthDestination(next, intent, target);
      if (decision.outcome === 'denied') {
        // Denial is truthful and recoverable: the gateway states the access state
        // and offers Home and Public Lending. It never says why another account
        // would have been allowed.
        setDenialReason(decision.reason);
        setRequesterMode(false);
        setAuthState('denied');
        moveTo('staff-signin');
        return;
      }
      setDenialReason(null);
      setRequesterMode(decision.requesterMode);
      setAuthState('authorized');
      moveTo(decision.route);
    },
    [moveTo],
  );

  /**
   * Send the user to the identity gateway, remembering what they were trying to
   * open. An already-authorized session skips the gateway entirely — being
   * signed in should not make an explicit destination harder to reach.
   */
  const requireAuth = useCallback(
    (intent: EntryIntent, target: AuthRoute | null = null) => {
      setEntryIntent(intent);
      setIntendedRoute(target);
      setAuthError(null);
      setDenialReason(null);

      if (session) {
        applyDecision(session, intent, target);
        return;
      }

      setAuthState('loading');
      moveTo('staff-signin');
      void frontendBackend
        .session()
        .then((current) => {
          if (!current) {
            setAuthState('auth-required');
            return;
          }
          const next = projectSession(current.user);
          setSession(next);
          applyDecision(next, intent, target);
        })
        .catch((error: unknown) => {
          setAuthError(
            error instanceof FrontendApiError
              ? error.message
              : 'The authentication service is temporarily unavailable.',
          );
          setAuthState('service-error');
        });
    },
    [applyDecision, moveTo, session],
  );

  /** Open the External Request Center, authenticating first if needed. */
  const requireExternalRequest = useCallback(() => {
    requireAuth('EXTERNAL_REQUEST_CENTER');
  }, [requireAuth]);

  const navigate = useCallback(
    (next: Route) => {
      if (next === 'external-request') {
        requireExternalRequest();
        return;
      }
      if (isAuthRoute(next)) {
        requireAuth(next === 'request-center' ? 'INTERNAL_REQUEST_HUB' : 'OTHER_INTERNAL_DESTINATION', next);
        return;
      }
      if (next === 'staff-signin') {
        // Generic identity gateway: no pre-committed destination. Binding it to a
        // capability-gated route would deny otherwise-valid accounts that merely
        // lack that one capability.
        setEntryIntent('GENERIC_STAFF_SIGN_IN');
        setIntendedRoute(null);
        setDenialReason(null);
        setAuthError(null);
        setActivationExpiresAt('');
        setAuthState(session ? 'authorized' : 'signed-out');
      }
      moveTo(next);
    },
    [moveTo, requireAuth, requireExternalRequest, session],
  );

  /**
   * R3-A1-A2: Home is Home, not logout.
   *
   * Home returns to the landing surface, scrolls to top and drops transient
   * navigation intent. It deliberately does **not** touch `session`, so an
   * authenticated user stays authenticated. Sign Out remains the only normal
   * action that destroys a session.
   */
  const goHome = useCallback(() => {
    setEntryIntent('GENERIC_STAFF_SIGN_IN');
    setIntendedRoute(null);
    setDenialReason(null);
    setAuthError(null);
    setActivationExpiresAt('');
    setRequesterMode(false);
    setAuthState(session ? 'authorized' : 'signed-out');
    moveTo('landing');
  }, [moveTo, session]);

  /** DOL requester-mode shortcut. Routes to the capability-appropriate internal
   *  home, never blindly to Overview. */
  const openLogisticsHub = useCallback(() => {
    const home = resolveStaffHome(session);
    if (!home) {
      setDenialReason('NO_INTERNAL_CAPABILITY');
      setAuthState('denied');
      moveTo('staff-signin');
      return;
    }
    setRequesterMode(false);
    setEntryIntent('OTHER_INTERNAL_DESTINATION');
    setIntendedRoute(home);
    moveTo(home);
  }, [moveTo, session]);

  const handleSignIn = useCallback(
    async (accessId: string, password: string) => {
      setAuthError(null);
      setDenialReason(null);
      setAuthState('loading');
      try {
        const result = await frontendBackend.login(accessId, password);
        if (result.activationRequired) {
          setSession(null);
          setActivationExpiresAt(result.activationExpiresAt);
          setAuthState('activation-required');
          return;
        }
        if (!result.session) {
          setSession(null);
          setAuthState('service-error');
          setAuthError('The authentication service returned an incomplete session.');
          return;
        }
        const next = projectSession(result.session.user);
        setSession(next);
        setActivationExpiresAt('');
        applyDecision(next, entryIntent, intendedRoute);
      } catch (error) {
        setSession(null);
        setAuthError(
          error instanceof FrontendApiError
            ? error.message
            : 'The authentication service is temporarily unavailable.',
        );
        setAuthState('service-error');
      }
    },
    [applyDecision, entryIntent, intendedRoute],
  );

  const handleActivate = useCallback(
    async (
      profile: { fullName: string; mobileNumber: string; email: string },
      password: string,
      confirmPassword: string,
    ) => {
      setAuthError(null);
      setDenialReason(null);
      setAuthState('loading');
      try {
        const activated = await frontendBackend.activateStarter(profile, password, confirmPassword);
        const next = projectSession(activated.user);
        setSession(next);
        setActivationExpiresAt('');
        applyDecision(next, entryIntent, intendedRoute);
      } catch (error) {
        setSession(null);
        setAuthError(
          error instanceof FrontendApiError
            ? error.message
            : 'The activation service is temporarily unavailable.',
        );
        setAuthState('service-error');
      }
    },
    [applyDecision, entryIntent, intendedRoute],
  );

  const handlePlaygroundSignIn = useCallback(async () => {
    setAuthError(null);
    setDenialReason(null);
    setAuthState('loading');
    try {
      const authenticated = await frontendBackend.playgroundSession();
      const next = projectSession(authenticated.user);
      setSession(next);
      setActivationExpiresAt('');
      applyDecision(next, entryIntent, intendedRoute);
    } catch (error) {
      setSession(null);
      setAuthError(
        error instanceof FrontendApiError
          ? error.message
          : 'The Playground session service is temporarily unavailable.',
      );
      setAuthState('service-error');
    }
  }, [applyDecision, entryIntent, intendedRoute]);

  const handleSignOut = useCallback(async () => {
    try {
      await frontendBackend.logout();
    } finally {
      setSession(null);
      setAuthState('signed-out');
      setAuthError(null);
      setEntryIntent('GENERIC_STAFF_SIGN_IN');
      setIntendedRoute(null);
      setDenialReason(null);
      setRequesterMode(false);
      setActivationExpiresAt('');
      moveTo('landing');
    }
  }, [moveTo]);

  const toggleTheme = useCallback(() => setDark((value) => !value), [setDark]);

  return {
    dark,
    route,
    session,
    authState,
    authError,
    playground,
    entryIntent,
    intendedRoute,
    denialReason,
    requesterMode,
    navigate,
    requireAuth,
    requireExternalRequest,
    openLogisticsHub,
    goHome,
    handleSignIn,
    handlePlaygroundSignIn,
    handleActivate,
    handleSignOut,
    activationExpiresAt,
    toggleTheme,
  };
}

export type AppController = ReturnType<typeof useAppController>;
