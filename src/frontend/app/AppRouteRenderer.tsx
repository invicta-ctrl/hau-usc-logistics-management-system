import PublicFlows from './PublicFlows';
import { isAuthRoute } from './appRoutes';
import type { PublicSubRoute } from './appTypes';
import type { AppController } from './useAppController';
import { StaffSignInPage } from './auth/StaffSignInPage';
import { AuthPlaceholderRoute } from './auth/AuthPlaceholderRoute';
import { OverviewRoute } from './overview/OverviewRoute';
import { LandingPage } from './landing/LandingPage';
import { ProfileRoute } from './profile/ProfileRoute';
import { InventoryRoute } from './inventory/InventoryRoute';
import { InternalRequestHub } from './request/InternalRequestHub';
import { InternalLendingHub } from './lending/InternalLendingHub';
import SupplyRoutes from './SupplyRoutes';
import { OperationalModuleRoute } from './operations/OperationalModuleRoute';
import AdministrationRoute from './AdministrationRoute';
import { Footer } from './public/Footer';
import { PublicNavbar } from './public/PublicNavbar';
import { ExternalRequestCenter } from './request/ExternalRequestCenter';
import { AuthenticatedShell } from './shell/AuthenticatedShell';
import { shellPresentationFromSession } from './shell/presentation';

export function AppRouteRenderer({ controller }: { controller: AppController }) {
  const {
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
    requireExternalRequest,
    openLogisticsHub,
    goHome,
    handleSignIn,
    handlePlaygroundSignIn,
    handleActivate,
    handleSignOut,
    activationExpiresAt,
    toggleTheme,
    themePreference,
    setThemePreference,
    handleSessionRevoked,
  } = controller;

  /* Context B — External Request Center. Only reachable with a session; the
   * controller routes here exclusively through `resolvePostAuthDestination`, so
   * an unauthenticated user can never land on it. */
  if (route === 'external-request' && session) {
    return (
      <ExternalRequestCenter
        presentation={{ displayName: session.displayName, internalOperator: session.internalOperator }}
        dark={dark}
        onToggleTheme={toggleTheme}
        onHome={goHome}
        onOpenLogisticsHub={openLogisticsHub}
        onSignOut={handleSignOut}
        requesterMode={requesterMode}
      />
    );
  }

  /* Context C — Main Logistics Hub. The shell is now an FI-04 surface. It is
   * mounted only after the controller's server-derived capability projection
   * admits a concrete AuthRoute; later module routes remain truthful stubs. */
  if (session && isAuthRoute(route)) {
    return (
      <AuthenticatedShell
        presentation={shellPresentationFromSession(session)}
        route={route}
        navigate={navigate}
        onHome={goHome}
        onSignOut={handleSignOut}
        dark={dark}
        onToggle={toggleTheme}
      >
        {route === 'profile' ? (
          <ProfileRoute
            dark={dark}
            onToggle={toggleTheme}
            themePreference={themePreference}
            onApplyTheme={setThemePreference}
            onSessionRevoked={handleSessionRevoked}
          />
        ) : route === 'overview' ? (
          <OverviewRoute session={session} />
        ) : route === 'inventory' ? (
          <InventoryRoute dark={dark} navigate={navigate} />
        ) : route === 'request-center' ? (
          <InternalRequestHub dark={dark} navigate={navigate} canReviewRequests={session.canReviewRequests} />
        ) : route === 'lending' ? (
          <InternalLendingHub
            dark={dark}
            navigate={navigate}
            canApproveLending={session.canApproveLending}
            canHandoffLending={session.canHandoffLending}
            canReturnLending={session.canReturnLending}
            canUploadLendingEvidence={session.canUploadLendingEvidence}
          />
        ) : route === 'release' ? (
          <OperationalModuleRoute
            module="release"
            canMutate={session.serverCapabilities.includes('fulfillment.release')}
            canUploadEvidence={session.serverCapabilities.includes('evidence.upload')}
          />
        ) : route === 'restocking' ? (
          <OperationalModuleRoute
            module="restocking"
            canMutate={session.serverCapabilities.includes('fulfillment.receive')}
            canUploadEvidence={session.serverCapabilities.includes('evidence.upload')}
          />
        ) : route === 'procurement' ? (
          <OperationalModuleRoute module="procurement" />
        ) : route === 'events' ? (
          <SupplyRoutes
            dark={dark}
            mode="events"
            navigate={navigate}
            eventAllowed={session.serverCapabilities.includes('event.manage')}
          />
        ) : route === 'administration' ? (
          <AdministrationRoute
            dark={dark}
            navigate={navigate}
            accessAllowed={session.serverCapabilities.includes('access.admin')}
            capabilities={session.serverCapabilities}
          />
        ) : (
          <AuthPlaceholderRoute route={route} />
        )}
      </AuthenticatedShell>
    );
  }

  if (route === 'staff-signin') {
    return (
      <StaffSignInPage
        onSignIn={handleSignIn}
        onPlaygroundSignIn={handlePlaygroundSignIn}
        playground={playground}
        onBack={goHome}
        dark={dark}
        onToggle={toggleTheme}
        authState={authState}
        authError={authError}
        entryIntent={entryIntent}
        intendedRoute={intendedRoute}
        denialReason={denialReason}
        session={session}
        onSignOut={handleSignOut}
        onActivate={handleActivate}
        onOpenExternalRequest={requireExternalRequest}
        activationExpiresAt={activationExpiresAt}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: dark ? '#40070a' : '#f2eae5' }}>
      <PublicNavbar dark={dark} onToggle={toggleTheme} onNavigate={navigate} onHome={goHome} />

      {route !== 'landing' ? (
        <PublicFlows route={route as PublicSubRoute} onBack={goHome} dark={dark} onNavigate={navigate} />
      ) : (
        <LandingPage onNavigate={navigate} onRequireExternalRequest={requireExternalRequest} />
      )}

      {route === 'landing' && <Footer onNavigate={navigate} onHome={goHome} />}
    </div>
  );
}
