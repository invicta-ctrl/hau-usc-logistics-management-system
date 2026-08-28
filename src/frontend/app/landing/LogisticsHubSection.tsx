import type { Route } from "../appTypes";
import { DolMark } from "../brand/BrandMarks";
import { appRouteHash } from "../routeHash";
import { LEDGER_STEPS } from "./landingData";

export function LogisticsHubSection({
  onNavigate,
  onRequireExternalRequest,
}: {
  onNavigate: (r: Route) => void;
  onRequireExternalRequest: () => void;
}) {
  /* R3-A1-A2 three-context tiles. Each `sub` states the real access rule for
     that path, so nobody discovers a sign-in wall only after committing. */
  const actionTiles: { label: string; sub: string; key: Route; href: string; onSelect: () => void; primary: boolean }[] = [
    { label: "Start a request",  key: "external-request",
      href: appRouteHash("staff-signin"),
      sub: "Supplies, event materials, venue and activity support for your USC office. Staff sign-in required.",
      onSelect: onRequireExternalRequest, primary: true },
    { label: "Browse equipment", key: "borrow",
      href: appRouteHash("borrow"),
      sub: "See reusable items and ask to borrow. No account needed.",
      onSelect: () => onNavigate("borrow"), primary: false },
    { label: "Track lending",    key: "tracking",
      href: appRouteHash("tracking"),
      sub: "Use your reference and private code. No account needed.",
      onSelect: () => onNavigate("tracking"), primary: false },
    { label: "Staff sign in",    key: "staff-signin",
      href: appRouteHash("staff-signin"),
      sub: "Open the workspaces authorized for your account.",
      onSelect: () => onNavigate("staff-signin"), primary: false },
  ];

  return (
    <section id="logistics" aria-labelledby="logistics-heading" className="landing-hub w-full">
      <div className="max-w-[1520px] mx-auto px-5 md:px-8 py-14">
        <div className="landing-hub__heading pb-5 mb-8">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2 id="logistics-heading">
              The Logistics hub
            </h2>
            <p className="landing-hub__availability">
              Public equipment lending is available without sign-in.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <DolMark size={42} />
              <div className="flex flex-col">
                <span className="landing-hub__wordmark">
                  Department of Logistics
                </span>
                <span className="landing-hub__org">
                  University Student Council
                </span>
              </div>
            </div>
            <p className="landing-hub__summary">
              Equipment and supplies for council activities. Ask for what an activity needs, borrow reusable items with an agreed return date, and see where your request stands.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {actionTiles.map((tile) => (
                <a
                  key={tile.key}
                  href={tile.href}
                  onClick={(event) => {
                    event.preventDefault();
                    tile.onSelect();
                  }}
                  className={`landing-hub__action ${tile.primary ? "landing-hub__action--primary" : "landing-hub__action--secondary"} flex flex-col gap-1 rounded-[14px] px-5 py-[17px] text-left transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2`}
                >
                  <span className="landing-hub__action-label">
                    {tile.label}
                  </span>
                  <span className="landing-hub__action-copy">
                    {tile.sub}
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <ol aria-label="Logistics request lifecycle" className="flex flex-col">
              {LEDGER_STEPS.map((step) => (
                <li
                  key={step.num}
                  className="landing-hub__ledger-row grid py-3"
                >
                  <span className="landing-hub__ledger-number">
                    {step.num}
                  </span>
                  <div>
                    <p className="landing-hub__ledger-label">
                      {step.label}
                    </p>
                    <p className="landing-hub__ledger-copy">
                      {step.body}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
