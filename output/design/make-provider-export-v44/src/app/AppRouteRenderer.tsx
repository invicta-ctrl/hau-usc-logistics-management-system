import AdministrationRoute from "./AdministrationRoute";
import LendingHubRoute from "./LendingHubRoute";
import PublicFlows from "./PublicFlows";
import ReleaseDeskRoute from "./ReleaseDeskRoute";
import RequestCenterRoute from "./RequestCenterRouteWithStates";
import SupplyRoutes from "./SupplyRoutes";
import { isAuthRoute } from "./appRoutes";
import type { PublicSubRoute } from "./appTypes";
import type { AppController } from "./useAppController";
import { AuthPlaceholderRoute } from "./auth/AuthPlaceholderRoute";
import { StaffSignInPage } from "./auth/StaffSignInPage";
import { InventoryRoute } from "./inventory/InventoryRoute";
import { LandingPage } from "./landing/LandingPage";
import { OverviewRoute } from "./overview/OverviewRoute";
import { Footer } from "./public/Footer";
import { PublicNavbar } from "./public/PublicNavbar";
import { ProfileRoute } from "./profile/ProfileRoute";
import { ExternalRequestCenter } from "./request/ExternalRequestCenter";
import { AuthenticatedShell } from "./shell/AuthenticatedShell";

export function AppRouteRenderer({ controller }: { controller: AppController }) {
  const {
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
    requireExternalRequest,
    openLogisticsHub,
    goHome,
    handleSignIn,
    handleSignOut,
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

  /* Context C — Main Logistics Hub. */
  if (session && isAuthRoute(route)) {
    return (
      <AuthenticatedShell
        session={session}
        route={route}
        navigate={navigate}
        onSignOut={handleSignOut}
        dark={dark}
        onToggle={toggleTheme}
      >
        {route === "overview" && <OverviewRoute session={session} dark={dark} />}
        {route === "profile" && <ProfileRoute session={session} dark={dark} onToggle={toggleTheme} />}
        {route === "inventory" && <InventoryRoute dark={dark} navigate={navigate} />}
        {route === "request-center" && <RequestCenterRoute dark={dark} navigate={navigate} />}
        {route === "lending" && <LendingHubRoute dark={dark} navigate={navigate} />}
        {route === "release" && <ReleaseDeskRoute dark={dark} navigate={navigate} />}
        {(route === "restocking" || route === "procurement" || route === "events") && (
          <SupplyRoutes dark={dark} mode={route} navigate={navigate} />
        )}
        {route === "administration" && <AdministrationRoute dark={dark} navigate={navigate} />}
        {route !== "overview" &&
          route !== "profile" &&
          route !== "inventory" &&
          route !== "request-center" &&
          route !== "lending" &&
          route !== "release" &&
          route !== "restocking" &&
          route !== "procurement" &&
          route !== "events" &&
          route !== "administration" && <AuthPlaceholderRoute route={route} />}
      </AuthenticatedShell>
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
        entryIntent={entryIntent}
        intendedRoute={intendedRoute}
        denialReason={denialReason}
        session={session}
        onOpenExternalRequest={requireExternalRequest}
        onSignOut={handleSignOut}
        previewOutcome={previewOutcome}
        onPreviewOutcome={setPreviewOutcome}
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
