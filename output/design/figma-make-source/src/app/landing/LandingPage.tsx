import type { AuthRoute, Route } from "../appTypes";
import { CurrentSection } from "./CurrentSection";
import { HeroSection } from "./HeroSection";
import { LogisticsHubSection } from "./LogisticsHubSection";

export function LandingPage({
  onNavigate,
  onRequireAuth,
}: {
  onNavigate: (route: Route) => void;
  onRequireAuth: (route: AuthRoute) => void;
}) {
  return (
    <main id="main-content" className="flex flex-col flex-1">
      <HeroSection
        onNavigate={onNavigate}
      />

      <CurrentSection />

      <LogisticsHubSection
        onNavigate={onNavigate}
        onRequireAuth={onRequireAuth}
      />
    </main>
  );
}
