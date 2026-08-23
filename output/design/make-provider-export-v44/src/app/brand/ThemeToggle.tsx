import { Moon, Sun } from "lucide-react";

export function ThemeToggle({ dark, onToggle, small }: { dark: boolean; onToggle: () => void; small?: boolean }) {
  const sz = small ? 22 : 26;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={dark}
      className="nav-glass relative flex items-center gap-0.5 rounded-full p-[3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c] transition-colors"
style={{ minWidth: 44, minHeight: 44, justifyContent: "center" }}
    >
      <span
        className="inline-flex items-center justify-center rounded-full transition-colors"
        style={{ width: sz, height: sz, background: !dark ? "#e8b93c" : "transparent" }}
        aria-hidden="true"
      >
        <Sun size={small ? 12 : 14} strokeWidth={1.5} color={!dark ? "#40070a" : "#f6e29a"} />
      </span>
      <span
        className="inline-flex items-center justify-center rounded-full transition-colors"
        style={{ width: sz, height: sz, background: dark ? "rgba(232,185,60,0.18)" : "transparent" }}
        aria-hidden="true"
      >
        <Moon size={small ? 12 : 14} strokeWidth={1.5} color="#f6e29a" />
      </span>
    </button>
  );
}
