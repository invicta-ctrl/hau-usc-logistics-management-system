import type { Route } from "../appTypes";
import { UscMark } from "../brand/BrandMarks";

export function Footer({
  onNavigate,
  onHome,
}: {
  onNavigate: (r: Route) => void;
  onHome: () => void;
}) {
  return (
    <footer className="w-full" style={{ background: "#40070a", borderTop: "1px solid rgba(242,209,92,0.16)" }} aria-label="Site footer">
      <div className="max-w-[1520px] mx-auto px-5 md:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <UscMark size={36} />
              <div className="flex flex-col">
                <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: -0.075, lineHeight: "18px" }}>
                  University Student Council
                </span>
                <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 10, color: "#f6e29a", letterSpacing: 0.22 }}>
                  Holy Angel University
                </span>
              </div>
            </div>
            <p style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 11, color: "#faeecb", letterSpacing: -0.15 }}>
              Laus Deo Semper
            </p>
          </div>

          <nav aria-label="Services">
            <p className="text-[10px] tracking-[1px] uppercase mb-4" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#c8992f" }}>
              Services
            </p>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href="#logistics"
                  className="flex items-center gap-2 text-[13px] tracking-[-0.15px] transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c] rounded-sm"
                  style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#faeecb" }}
                >
                  Logistics hub
                  <span className="text-[9px] tracking-[0.9px] uppercase px-2 py-0.5 rounded-full" style={{ fontFamily: "'IBM Plex Mono', monospace", background: "rgba(232,185,60,0.18)", color: "#e8b93c" }}>
                    Open
                  </span>
                </a>
              </li>
            </ul>
          </nav>

          <div className="flex flex-col gap-3">
            <p className="text-[10px] tracking-[1px] uppercase" style={{ fontFamily: "'IBM Plex Mono', monospace", color: "#c8992f" }}>
              Access
            </p>
            <button
              onClick={() => onNavigate("external-request")}
              className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
              style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: "#e8b93c", color: "#40070a", minHeight: 40, paddingLeft: 16, paddingRight: 16, border: "1px solid #d1b478" }}
            >
              Start a logistics request
            </button>
            <button
              onClick={onHome}
              className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
              style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#faeecb", minHeight: 40, paddingLeft: 16, paddingRight: 16, border: "1px solid #d1b478" }}
            >
              Home
            </button>
            <button
              onClick={() => onNavigate("staff-signin")}
              className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
              style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#faeecb", minHeight: 40, paddingLeft: 16, paddingRight: 16, border: "1px solid #d1b478" }}
            >
              Staff sign in
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-10 pt-6" style={{ borderTop: "1px solid rgba(242,209,92,0.14)" }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "rgba(250,238,203,0.45)", letterSpacing: "0.6px", textTransform: "uppercase" }}>
            Holy Angel University · Angeles City, Pampanga
          </p>
        </div>
      </div>
    </footer>
  );
}
