import { LogOut } from "lucide-react";
import type { AuthRoute, Route, Session } from "../appTypes";
import { CombinedLockup } from "../brand/BrandMarks";
import { NAV_ADMINISTRATION, NAV_OPERATIONS } from "./navConfig";
import { SidebarNavItem } from "./SidebarNavItem";

export function AuthShellSidebar({
  route,
  navigate,
  session,
  onSignOut,
}: {
  route: AuthRoute;
  navigate: (r: Route) => void;
  session: Session;
  onSignOut: () => void;
}) {
  return (
    <aside
      className="hidden lg:flex flex-col fixed left-0 top-0 bottom-0 z-20 overflow-y-auto"
      style={{ width: 168, background: "#40070a", borderRight: "1px solid rgba(242,209,92,0.18)" }}
      aria-label="Workspace navigation"
    >
      {/* Brand */}
      <div className="flex flex-col gap-1 px-4 py-4" style={{ borderBottom: "1px solid rgba(242,209,92,0.14)" }}>
        <div className="flex flex-col items-start gap-1">
          <CombinedLockup width={118} />
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: "#f6e29a", letterSpacing: ".7px", textTransform: "uppercase" }}>
            Institutional logistics ledger
          </span>
        </div>
      </div>

      {/* Operations */}
      <nav className="flex flex-col gap-0.5 px-2 pt-4 pb-2" aria-label="Operations">
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "rgba(250,238,203,0.38)", letterSpacing: "1px", textTransform: "uppercase", paddingLeft: 12, marginBottom: 4 }}>
          Operations
        </p>
        {NAV_OPERATIONS.map((item) => (
          <SidebarNavItem
            key={item.route}
            item={item}
            active={route === item.route}
            onClick={() => navigate(item.route)}
          />
        ))}
      </nav>

      {/* Administration */}
      <nav className="flex flex-col gap-0.5 px-2 pt-3 pb-2" style={{ borderTop: "1px solid rgba(242,209,92,0.1)" }} aria-label="Administration">
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "rgba(250,238,203,0.38)", letterSpacing: "1px", textTransform: "uppercase", paddingLeft: 12, marginBottom: 4 }}>
          Administration
        </p>
        {NAV_ADMINISTRATION.map((item) => (
          <SidebarNavItem
            key={item.route}
            item={item}
            active={route === item.route}
            onClick={() => navigate(item.route)}
          />
        ))}
      </nav>

      {/* Sign out */}
      <div className="mt-auto px-2 pb-5 pt-3" style={{ borderTop: "1px solid rgba(242,209,92,0.1)" }}>
        <div className="flex items-center gap-2 px-3 py-2 mb-2">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 26, height: 26, background: "#e8b93c" }}
            aria-hidden="true"
          >
            <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 10, fontWeight: 600, color: "#40070a" }}>
              {session.initials}
            </span>
          </div>
          <div className="flex flex-col min-w-0">
            <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, color: "#faeecb", letterSpacing: -0.1, lineHeight: "14px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {session.displayName}
            </span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "rgba(250,238,203,0.5)", letterSpacing: "0.3px" }}>
              {session.role}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center gap-2 px-3 py-2 w-full rounded-[8px] text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
        >
          <LogOut size={14} strokeWidth={1.5} color="rgba(250,238,203,0.5)" />
          <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 12, color: "rgba(250,238,203,0.5)", letterSpacing: -0.1 }}>
            Sign out
          </span>
        </button>
      </div>
    </aside>
  );
}
