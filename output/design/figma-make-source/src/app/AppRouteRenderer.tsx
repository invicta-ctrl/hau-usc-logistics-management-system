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
import { AuthenticatedShell } from "./shell/AuthenticatedShell";

export function AppRouteRenderer({ controller }: { controller: AppController }) {
  const {
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
  } = controller;

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
        intendedRoute={intendedRoute}
        previewOutcome={previewOutcome}
        onPreviewOutcome={setPreviewOutcome}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: dark ? "#40070a" : "#f2eae5" }}>
      <PublicNavbar dark={dark} onToggle={toggleTheme} onNavigate={navigate} onRequireAuth={requireAuth} />

      {route !== "landing" ? (
        <PublicFlows route={route as PublicSubRoute} onBack={goHome} dark={dark} onRequireAuth={requireAuth} />
      ) : (
        <LandingPage onNavigate={navigate} onRequireAuth={requireAuth} />
      )}

      {route === "landing" && <Footer onNavigate={navigate} onRequireAuth={requireAuth} />}
    </div>
  );
}
