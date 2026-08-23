import { useEffect } from "react";
import { X } from "lucide-react";
import type { Route } from "../appTypes";
import { UscMark } from "../brand/BrandMarks";
import { ThemeToggle } from "../brand/ThemeToggle";
import { NAV_LINKS } from "./publicNavConfig";

export function PublicMobileDrawer({
  open,
  onClose,
  dark,
  onToggleTheme,
  onNavigate,
  onHome,
}: {
  open: boolean;
  onClose: () => void;
  dark: boolean;
  onToggleTheme: () => void;
  onNavigate: (r: Route) => void;
  onHome: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col"
        style={{ width: "min(320px, 100vw)", background: "#40070a", borderLeft: "1px solid rgba(242,209,92,0.22)" }}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "rgba(242,209,92,0.22)" }}>
          <div className="flex items-center gap-3">
            <UscMark size={36} />
            <span style={{ fontFamily: "'Newsreader', Georgia, serif", color: "#fff", fontSize: 14, letterSpacing: -0.075 }}>
              University Student Council
            </span>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            aria-label="Close menu"
            style={{ width: 44, height: 44 }}
          >
            <X size={18} color="#faeecb" />
          </button>
        </div>

        <nav className="flex flex-col gap-1 px-5 py-6" aria-label="Site navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-3 rounded-[8px] text-[15px] leading-none transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                color: link.active ? "#ffffff" : "#faeecb",
                background: link.active ? "rgba(232,185,60,0.1)" : "transparent",
                borderLeft: link.active ? "2px solid #e8b93c" : "2px solid transparent",
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="mt-auto flex flex-col gap-3 px-5 pb-8 pt-4 border-t" style={{ borderColor: "rgba(242,209,92,0.18)" }}>
          <button
            onClick={() => { onClose(); onNavigate("external-request"); }}
            className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", background: "#e8b93c", color: "#40070a", minHeight: 48, border: "1px solid #d1b478" }}
          >
            Start a logistics request
          </button>
          <button
            onClick={() => { onClose(); onHome(); }}
            className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#faeecb", minHeight: 48, border: "1px solid #d1b478" }}
          >
            Home
          </button>
          <button
            onClick={() => { onClose(); onNavigate("staff-signin"); }}
            className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#faeecb", minHeight: 48, border: "1px solid #d1b478" }}
          >
            Staff sign in
          </button>
          <div className="flex items-center justify-between pt-1">
            <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#f6e29a", fontSize: 11 }}>Theme</span>
            <ThemeToggle dark={dark} onToggle={onToggleTheme} />
          </div>
        </div>
      </div>
    </>
  );
}
