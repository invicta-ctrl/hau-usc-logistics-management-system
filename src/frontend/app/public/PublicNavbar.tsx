import { useState } from "react";
import { Menu } from "lucide-react";
import type { Route } from "../appTypes";
import { DolMark, UscMark } from "../brand/BrandMarks";
import { ThemeToggle } from "../brand/ThemeToggle";
import { NavLink } from "./NavLink";
import { PublicMobileDrawer } from "./PublicMobileDrawer";
import { NAV_LINKS } from "./publicNavConfig";

export function PublicNavbar({
  dark,
  onToggle,
  onNavigate,
}: {
  dark: boolean;
  onToggle: () => void;
  onNavigate: (r: Route) => void;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-30 w-full public-nav--glass">
        <div className="flex items-center gap-5 px-5 md:px-8 py-[14px] md:py-[17px] max-w-[1520px] mx-auto w-full">
          <a
            href="#hero"
            className="flex items-center gap-3 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8b93c] rounded-sm"
            aria-label="HAU-USC home"
          >
            <UscMark size={46} />
            <span className="hidden sm:flex flex-col">
              <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 15, color: "#fff", letterSpacing: -0.075, lineHeight: "18.75px" }}>
                University Student Council
              </span>
              <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, color: "#f6e29a", letterSpacing: 0.22, lineHeight: "13.75px" }}>
                Holy Angel University
              </span>
            </span>
            <span className="hidden min-[415px]:inline-flex items-center gap-2 pl-3" style={{ borderLeft: "1px solid rgba(242,209,92,.28)" }}>
              <DolMark size={34} />
              <span className="hidden md:inline" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 10, color: "#f6e29a", lineHeight: 1.2 }}>
                Department of<br />Logistics
              </span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-5 flex-1 justify-end" aria-label="Site navigation">
            {NAV_LINKS.map((link) => <NavLink key={link.href} {...link} />)}
          </nav>

          <div className="hidden lg:flex items-center gap-3 ml-auto lg:ml-0">
            <ThemeToggle dark={dark} onToggle={onToggle} />
            <button
              type="button"
              onClick={() => onNavigate("staff-signin")}
              className="flex items-center justify-center rounded-[10px] text-[11px] font-semibold tracking-[-0.11px] whitespace-nowrap transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
              style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#faeecb", minHeight: 32, paddingLeft: 13, paddingRight: 13, border: "1px solid #d1b478" }}
            >
              Staff sign in
            </button>
          </div>

          <div className="flex lg:hidden items-center gap-2 ml-auto">
            <ThemeToggle dark={dark} onToggle={onToggle} />
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation menu"
              aria-expanded={mobileOpen}
              className="flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
              style={{ width: 44, height: 44 }}
            >
              <Menu size={20} color="#faeecb" />
            </button>
          </div>
        </div>
      </header>

      <PublicMobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        dark={dark}
        onToggleTheme={onToggle}
        onNavigate={onNavigate}
      />
    </>
  );
}
