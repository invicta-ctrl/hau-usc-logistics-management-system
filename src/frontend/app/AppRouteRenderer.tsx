import PublicFlows from "./PublicFlows";
import { isAuthRoute } from "./appRoutes";
import type { PublicSubRoute } from "./appTypes";
import type { AppController } from "./useAppController";
import { StaffSignInPage } from "./auth/StaffSignInPage";
import { LandingPage } from "./landing/LandingPage";
import { Footer } from "./public/Footer";
import { PublicNavbar } from "./public/PublicNavbar";
import { ExternalRequestCenter } from "./request/ExternalRequestCenter";

export function AppRouteRenderer({ controller }: { controller: AppController }) {
  const {
    dark,
    route,
    session,
    authState,
    authError,
    entryIntent,
    intendedRoute,
    denialReason,
    requesterMode,
    navigate,
    requireExternalRequest,
    openLogisticsHub,
    goHome,
    handleSignIn,
    handleActivate,
    handleSignOut,
    activationExpiresAt,
    toggleTheme,
  } = controller;

  /* Context B — External Request Center. Only reachable with a session; the
   * controller routes here exclusively through `resolvePostAuthDestination`, so
   * an unauthenticated user can never land on it. */
  if (route === "external-request" && session) {
    return (
      <ExternalRequestCenter
        session={session}
        dark={dark}
        onToggleTheme={toggleTheme}
        onHome={goHome}
        onOpenLogisticsHub={openLogisticsHub}
        onSignOut={handleSignOut}
        requesterMode={requesterMode}
      />
    );
  }

  /* Context C — Main Logistics Hub. FI-04 is not implemented: no internal
   * workspace renders in this release. The gateway states that truthfully and
   * names the destination the account resolved to, rather than showing an empty
   * shell that implies a working workspace. */
  if (session && isAuthRoute(route)) {
    return (
      <StaffSignInPage
        onSignIn={handleSignIn}
        onBack={goHome}
        dark={dark}
        onToggle={toggleTheme}
        authState="authorized"
        authError={null}
        entryIntent={entryIntent}
        intendedRoute={route}
        denialReason={null}
        session={session}
        onSignOut={handleSignOut}
        onActivate={handleActivate}
        onOpenExternalRequest={requireExternalRequest}
        activationExpiresAt={activationExpiresAt}
      />
    );
  }

  if (route === "staff-signin") {
    return (
      <StaffSignInPage
        onSignIn={handleSignIn}
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
    <div className="min-h-screen flex flex-col" style={{ background: dark ? "#40070a" : "#f2eae5" }}>
      <PublicNavbar dark={dark} onToggle={toggleTheme} onNavigate={navigate} onHome={goHome} />

      {route !== "landing" ? (
        <PublicFlows route={route as PublicSubRoute} onBack={goHome} dark={dark} onNavigate={navigate} />
      ) : (
        <LandingPage onNavigate={navigate} onRequireExternalRequest={requireExternalRequest} />
      )}

      {route === "landing" && <Footer onNavigate={navigate} onHome={goHome} />}
    </div>
  );
}
