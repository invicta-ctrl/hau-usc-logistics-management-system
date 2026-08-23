import { Menu, Search } from "lucide-react";
import type { AuthRoute, Route, Session } from "../appTypes";
import { ThemeToggle } from "../brand/ThemeToggle";
import { NAV_ADMINISTRATION, NAV_OPERATIONS } from "./navConfig";

export function AuthShellTopbar({
  route,
  navigate,
  session,
  dark,
  onToggle,
  onOpenDrawer,
}: {
  route: AuthRoute;
  navigate: (r: Route) => void;
  session: Session;
  dark: boolean;
  onToggle: () => void;
  onOpenDrawer: () => void;
}) {
  const allItems = [...NAV_OPERATIONS, ...NAV_ADMINISTRATION];
  const current = allItems.find((i) => i.route === route);
  const label = current?.label ?? "Workspace";

  return (
    <header
      className="sticky top-0 z-10 flex items-center gap-3 px-4 py-2"
      style={{ background: "#40070a", borderBottom: "1px solid rgba(242,209,92,0.18)", minHeight: 56 }}
      aria-label="Workspace command bar"
    >
      {/* Navigate (mobile only) */}
      <button
        type="button"
        onClick={onOpenDrawer}
        className="lg:hidden flex items-center gap-2 rounded-[8px] px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c] transition-colors hover:bg-white/8"
        style={{ minHeight: 40 }}
        aria-label="Open navigation"
      >
        <Menu size={16} strokeWidth={1.6} color="#faeecb" />
        <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: "#faeecb", letterSpacing: -0.15 }}>
          Navigate
        </span>
      </button>

      {/* Route label (desktop) */}
      <span className="hidden lg:block" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: "rgba(250,238,203,0.7)", letterSpacing: -0.15 }}>
        {label}
      </span>

      {/* Spacer */}
      <div className="flex-1 hidden lg:flex items-center">
        <div
          className="flex items-center gap-2 rounded-[8px] px-3 py-2 cursor-default select-none"
          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(242,209,92,0.12)", maxWidth: 240 }}
          aria-hidden="true"
        >
          <Search size={13} strokeWidth={1.5} color="rgba(250,238,203,0.35)" />
          <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 12, color: "rgba(250,238,203,0.35)", letterSpacing: -0.1 }}>
            Search
          </span>
          <span
            className="ml-auto rounded px-1.5 py-0.5"
            style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "rgba(250,238,203,0.3)", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(242,209,92,0.1)" }}
          >
            ⌘K
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div className="ml-auto flex items-center gap-2">
        {/* Scope pill */}
        <span
          className="hidden sm:inline-flex items-center rounded-full px-3 py-1"
          style={{ background: "rgba(232,185,60,0.14)", border: "1px solid rgba(232,185,60,0.3)", fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#e8b93c", letterSpacing: "0.5px" }}
        >
          {session.role}
        </span>

        {/* Theme toggle (desktop) */}
        <div className="hidden lg:block">
          <ThemeToggle dark={dark} onToggle={onToggle} small />
        </div>

        {/* Avatar */}
        <button
          type="button"
          onClick={() => navigate("profile")}
          className="flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
          aria-label={`${session.displayName} — go to profile`}
          style={{ width: 34, height: 34, background: "#e8b93c", flexShrink: 0 }}
        >
          <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 12, fontWeight: 600, color: "#40070a" }}>
            {session.initials}
          </span>
        </button>
      </div>
    </header>
  );
}
