import PublicFlows from "./PublicFlows";
import { isAuthRoute } from "./appRoutes";
import type { PublicSubRoute } from "./appTypes";
import type { AppController } from "./useAppController";
import { StaffSignInPage } from "./auth/StaffSignInPage";
import { LandingPage } from "./landing/LandingPage";
import { Footer } from "./public/Footer";
import { PublicNavbar } from "./public/PublicNavbar";

export function AppRouteRenderer({ controller }: { controller: AppController }) {
  const {
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
  } = controller;

  if (session && isAuthRoute(route)) {
    return (
      <StaffSignInPage
        onSignIn={handleSignIn}
        onBack={goHome}
        dark={dark}
        onToggle={toggleTheme}
        authState="authorized"
        authError={null}
        intendedRoute={route}
        onSignOut={handleSignOut}
        onActivate={handleActivate}
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
        intendedRoute={intendedRoute}
        onSignOut={handleSignOut}
        onActivate={handleActivate}
        activationExpiresAt={activationExpiresAt}
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
