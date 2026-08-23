import type { Route } from "../appTypes";
import { CurrentSection } from "./CurrentSection";
import { HeroSection } from "./HeroSection";
import { LogisticsHubSection } from "./LogisticsHubSection";

export function LandingPage({
  onNavigate,
  onRequireExternalRequest,
}: {
  onNavigate: (route: Route) => void;
  /* R3-A1-A2: starting a logistics request is an authenticated action. The
     landing page states the intent; the controller owns the auth gate. */
  onRequireExternalRequest: () => void;
}) {
  return (
    <main id="main-content" className="flex flex-col flex-1">
      <HeroSection
        onNavigate={onNavigate}
        onRequireExternalRequest={onRequireExternalRequest}
      />

      <CurrentSection />

      <LogisticsHubSection
        onNavigate={onNavigate}
        onRequireExternalRequest={onRequireExternalRequest}
      />
    </main>
  );
}