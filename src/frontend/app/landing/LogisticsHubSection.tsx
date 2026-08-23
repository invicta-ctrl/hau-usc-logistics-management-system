import type { AuthRoute, Route } from "../appTypes";
import { DolMark } from "../brand/BrandMarks";
import { LEDGER_STEPS } from "./landingData";

export function LogisticsHubSection({
  onNavigate,
  onRequireAuth,
}: {
  onNavigate: (r: Route) => void;
  onRequireAuth: (r: AuthRoute) => void;
}) {
  const actionTiles: { label: string; sub: string; route: Route | AuthRoute; primary: boolean; protected?: boolean }[] = [
    { label: "Start a request",    sub: "Say what an activity, office or committee needs. No account needed.", route: "request",      primary: true },
    { label: "Browse equipment",  sub: "See reusable items and ask to borrow. No account needed.",             route: "borrow",       primary: false },
    { label: "Track a request",   sub: "Use your reference. No account needed.",                               route: "tracking",     primary: false },
    { label: "Staff sign in",     sub: "Open the authorized logistics workspace.",                             route: "staff-signin", primary: false },
  ];

  return (
    <section id="logistics" aria-labelledby="logistics-heading" className="w-full" style={{ background: "#40070a" }}>
      <div className="max-w-[1520px] mx-auto px-5 md:px-8 py-14">
        <div className="pb-5 mb-8" style={{ borderBottom: "1px solid rgba(242,209,92,0.2)" }}>
          <p className="text-[10px] tracking-[1px] uppercase mb-3" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#e8b93c" }}>
            Open now
          </p>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <h2
              id="logistics-heading"
              style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: "clamp(28px, 4vw, 38px)", color: "#ffffff", letterSpacing: "-1.064px", lineHeight: "41.04px", fontVariationSettings: '"opsz" 14, "wdth" 100' }}
            >
              The Logistics hub
            </h2>
            <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, color: "#f6e29a", letterSpacing: -0.15, fontVariationSettings: '"wdth" 100' }}>
              {"The council’s only specialised service currently running"}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-4">
              <DolMark size={42} />
              <div className="flex flex-col">
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 20, color: "#fff", letterSpacing: -0.15, lineHeight: "24px" }}>
                  Department of Logistics
                </span>
                <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, color: "#f6e29a", letterSpacing: -0.15, fontVariationSettings: '"wdth" 100' }}>
                  University Student Council
                </span>
              </div>
            </div>
            <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: "#faeecb", letterSpacing: -0.15, lineHeight: "21.45px", maxWidth: 406, fontVariationSettings: '"wdth" 100' }}>
              Equipment and supplies for council activities. Ask for what an activity needs, borrow reusable items with an agreed return date, and see where your request stands.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {actionTiles.map((tile) => (
                <button
                  key={tile.route}
                  onClick={() => tile.protected ? onRequireAuth(tile.route as AuthRoute) : onNavigate(tile.route as Route)}
                  className="flex flex-col gap-1 rounded-[14px] px-5 py-[17px] text-left transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
                  style={{ background: tile.primary ? "#e8b93c" : "rgba(255,253,248,0.05)", border: tile.primary ? "1px solid #f2d15c" : "1px solid rgba(242,209,92,0.26)" }}
                >
                  <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 500, fontSize: 13, color: tile.primary ? "#40070a" : "#ffffff", letterSpacing: -0.15, fontVariationSettings: '"wdth" 100' }}>
                    {tile.label}
                  </span>
                  <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, color: tile.primary ? "#610b0f" : "rgba(250,238,203,0.72)", letterSpacing: -0.15, lineHeight: "16.5px", fontVariationSettings: '"wdth" 100' }}>
                    {tile.sub}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col">
            <ol aria-label="Logistics request lifecycle" className="flex flex-col">
              {LEDGER_STEPS.map((step, i) => (
                <li
                  key={step.num}
                  className="grid py-3"
                  style={{ gridTemplateColumns: "26px 1fr", columnGap: 16, borderTop: i > 0 ? "1px solid rgba(242,209,92,0.16)" : "none" }}
                >
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "rgba(250,238,203,0.72)", letterSpacing: -0.15, lineHeight: "16.5px", paddingTop: 2 }}>
                    {step.num}
                  </span>
                  <div>
                    <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 500, fontSize: 13, color: "#ffffff", letterSpacing: -0.15, lineHeight: "19.5px", fontVariationSettings: '"wdth" 100' }}>
                      {step.label}
                    </p>
                    <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, color: "rgba(250,238,203,0.72)", letterSpacing: -0.15, lineHeight: "16.5px", fontVariationSettings: '"wdth" 100' }}>
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
