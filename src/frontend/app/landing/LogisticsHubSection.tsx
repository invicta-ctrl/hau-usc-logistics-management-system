import type { Route } from "../appTypes";
import { DolMark } from "../brand/BrandMarks";
import { LEDGER_STEPS } from "./landingData";

export function LogisticsHubSection({
  onNavigate,
  onRequireExternalRequest,
}: {
  onNavigate: (r: Route) => void;
  onRequireExternalRequest: () => void;
}) {
  /* R3-A1-A2 three-context tiles. Each `sub` states the real access rule for
     that path, so nobody discovers a sign-in wall only after committing.
     POST-FI17: these were four equal-weight tiles in a 2x2 grid, which said
     the four paths were interchangeable. They are not — starting a request is
     the reason this surface exists and the other three are ways around it. The
     primary now leads the block at full width; the rest form a quieter row. */
  const primaryTile = {
    label: "Start a request",
    sub: "Supplies, event materials, venue and activity support for your USC office.",
    note: "Staff sign-in required",
    onSelect: onRequireExternalRequest,
  };

  const secondaryTiles: { label: string; sub: string; key: string; onSelect: () => void }[] = [
    { label: "Browse equipment", key: "borrow",
      sub: "See reusable items and ask to borrow. No account needed.",
      onSelect: () => onNavigate("borrow") },
    { label: "Track lending", key: "tracking",
      sub: "Use your reference and private code. No account needed.",
      onSelect: () => onNavigate("tracking") },
    { label: "Staff sign in", key: "staff-signin",
      sub: "Open the workspaces authorized for your account.",
      onSelect: () => onNavigate("staff-signin") },
  ];

  return (
    <section id="logistics" aria-labelledby="logistics-heading" className="logistics-hub">
      <div className="logistics-hub__stage">
        <div className="logistics-hub__head">
          <p className="logistics-hub__eyebrow">Open now</p>
          <h2 id="logistics-heading" className="logistics-hub__heading">The Logistics hub</h2>
          <p className="logistics-hub__standing">
            {"The council’s only specialised service currently running"}
          </p>
        </div>

        <div className="logistics-hub__body">
          <div className="logistics-hub__offer">
            <div className="logistics-hub__identity">
              <DolMark size={42} />
              <div>
                <span className="logistics-hub__dept">Department of Logistics</span>
                <span className="logistics-hub__council">University Student Council</span>
              </div>
            </div>

            <p className="logistics-hub__lede">
              Equipment and supplies for council activities. Ask for what an activity needs,
              borrow reusable items with an agreed return date, and see where your request stands.
            </p>

            <div className="logistics-hub__actions">
              <button type="button" className="logistics-hub__tile is-primary" onClick={primaryTile.onSelect}>
                <span className="logistics-hub__tile-label">{primaryTile.label}</span>
                <span className="logistics-hub__tile-sub">{primaryTile.sub}</span>
                <span className="logistics-hub__tile-note">{primaryTile.note}</span>
              </button>

              <div className="logistics-hub__alternates">
                {secondaryTiles.map((tile) => (
                  <button key={tile.key} type="button" className="logistics-hub__tile" onClick={tile.onSelect}>
                    <span className="logistics-hub__tile-label">{tile.label}</span>
                    <span className="logistics-hub__tile-sub">{tile.sub}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <ol aria-label="Logistics request lifecycle" className="logistics-hub__ledger">
            {LEDGER_STEPS.map((step) => (
              <li key={step.num} className="logistics-hub__step">
                <span className="logistics-hub__step-num">{step.num}</span>
                <div>
                  <p className="logistics-hub__step-label">{step.label}</p>
                  <p className="logistics-hub__step-body">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
