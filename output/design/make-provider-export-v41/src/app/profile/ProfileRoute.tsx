import { useState, type FormEvent } from "react";
import { User } from "lucide-react";
import type { Session } from "../appTypes";
import { DolMark, UscMark } from "../brand/BrandMarks";
import { ThemeToggle } from "../brand/ThemeToggle";
import { ACCOUNT_ACTIVITY } from "./profileFixtures";

export function ProfileRoute({
  session,
  dark,
  onToggle,
}: {
  session: Session;
  dark: boolean;
  onToggle: () => void;
}) {
  const [editName, setEditName] = useState(session.displayName);
  const [nameSaved, setNameSaved] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  function handleSaveName(e: FormEvent) {
    e.preventDefault();
    setIsDirty(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 3000);
  }

  function handleCancelName() {
    setEditName(session.displayName);
    setIsDirty(false);
    setNameSaved(false);
  }

  return (
    <div className="max-w-[1100px] mx-auto px-5 md:px-8 py-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex items-center gap-2" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: "var(--muted-foreground)" }}>
          <li>Account</li>
          <li aria-hidden="true">/</li>
          <li style={{ color: "var(--foreground)" }}>Profile</li>
        </ol>
      </nav>

      {/* Identity band */}
      <div
        className="rounded-[14px] overflow-hidden mb-6"
        style={{ background: "#40070a", border: "1px solid rgba(242,209,92,0.22)" }}
      >
        {/* Avatar + name */}
        <div className="flex items-center gap-5 px-6 py-6">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 72, height: 72, background: "#e8b93c" }}
            aria-label="Portrait placeholder"
            role="img"
          >
            <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 24, fontWeight: 700, color: "#40070a" }}>
              {session.initials}
            </span>
          </div>
          <div className="flex flex-col gap-1">
            <h1
              style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: "clamp(18px, 3vw, 24px)", color: "#fff", letterSpacing: "-0.6px", fontVariationSettings: '"opsz" 14, "wdth" 100' }}
            >
              {session.displayName}
            </h1>
            <div className="flex items-center gap-2">
              <UscMark size={24} />
              <DolMark size={22} />
              <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 12, color: "#f6e29a" }}>
                Department of Logistics · University Student Council
              </span>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2 px-6 pb-5">
          {[
            { label: "DOL Staff", style: { background: "rgba(232,185,60,0.2)", color: "#e8b93c", border: "1px solid rgba(232,185,60,0.35)" } },
            { label: "Assigned access scope", style: { background: "transparent", color: "rgba(250,238,203,0.5)", border: "1px solid rgba(242,209,92,0.14)" } },
            { label: "Active", style: { background: "rgba(31,107,65,0.2)", color: "#6bc98d", border: "1px solid rgba(31,107,65,0.3)" } },
          ].map((badge) => (
            <span
              key={badge.label}
              className="inline-flex items-center rounded-full px-3 py-1"
              style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.4px", ...badge.style }}
            >
              {badge.label}
            </span>
          ))}
        </div>
      </div>

      {/* 2-col layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
        {/* Main: info sections */}
        <div className="flex flex-col gap-6">
          {/* Personal information */}
          <section
            className="rounded-[12px] overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            aria-labelledby="personal-info-heading"
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2
                id="personal-info-heading"
                style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--foreground)", letterSpacing: -0.2 }}
              >
                Personal information
              </h2>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.4px", marginTop: 2 }}>
                Read-only · Managed at account creation
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {[
                { label: "Preferred name", val: "Not included in this design fixture" },
                { label: "Contact email", val: "Not included in this design fixture" },
                { label: "Username", val: "Not included in this design fixture" },
                { label: "Last verified sign-in", val: "Not included in this design fixture" },
              ].map((field, i) => (
                <div
                  key={field.label}
                  className="px-5 py-4"
                  style={{ borderTop: i >= 2 ? "1px solid var(--border)" : "none", borderLeft: i % 2 === 1 ? "1px solid var(--border)" : "none" }}
                >
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>
                    {field.label}
                  </p>
                  <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: "var(--foreground)", letterSpacing: -0.15 }}>
                    {field.val}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* USC information */}
          <section
            className="rounded-[12px] overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            aria-labelledby="usc-info-heading"
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2
                id="usc-info-heading"
                style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--foreground)", letterSpacing: -0.2 }}
              >
                University Student Council information
              </h2>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.4px", marginTop: 2 }}>
                Staff directory source · Read-only
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-0">
              {[
                { label: "Title", val: "Not included in this design fixture" },
                { label: "Department", val: "Department of Logistics" },
                { label: "Honours", val: "Not included in this design fixture" },
                { label: "Term", val: "Not included in this design fixture" },
              ].map((field, i) => (
                <div
                  key={field.label}
                  className="px-5 py-4"
                  style={{ borderTop: i >= 2 ? "1px solid var(--border)" : "none", borderLeft: i % 2 === 1 ? "1px solid var(--border)" : "none" }}
                >
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>
                    {field.label}
                  </p>
                  <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: "var(--foreground)", letterSpacing: -0.15 }}>
                    {field.val}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* Account and access */}
          <section
            className="rounded-[12px] overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            aria-labelledby="account-access-heading"
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2
                id="account-access-heading"
                style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--foreground)", letterSpacing: -0.2 }}
              >
                Account and access
              </h2>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.4px", marginTop: 2 }}>
                Assigned access scope · Roles and capabilities are managed by authorized account records.
              </p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-5">
              {/* Capabilities */}
              <div>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 8 }}>
                  Capabilities
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Review", "Reserve", "Release", "Reconcile"].map((cap) => (
                    <span
                      key={cap}
                      className="inline-flex items-center rounded-[6px] px-2.5 py-1"
                      style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#1f6b41", background: "rgba(31,107,65,0.1)", border: "1px solid rgba(31,107,65,0.22)", letterSpacing: "0.3px" }}
                    >
                      {cap}
                    </span>
                  ))}
                </div>
              </div>
              {/* Session */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>
                  Session
                </p>
                <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: "var(--foreground)", letterSpacing: -0.15 }}>
                  Expires on sign-out. No persistent token is stored.
                </p>
              </div>
            </div>
          </section>

          {/* Preferences (editable) */}
          <section
            className="rounded-[12px] overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            aria-labelledby="preferences-heading"
          >
            <div className="px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2
                id="preferences-heading"
                style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 14, color: "var(--foreground)", letterSpacing: -0.2 }}
              >
                Preferences
              </h2>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.4px", marginTop: 2 }}>
                Session-local only · Changes are not persisted beyond sign-out
              </p>
            </div>
            <div className="px-5 py-4 flex flex-col gap-5">
              {/* Display name preference */}
              <form onSubmit={handleSaveName} className="flex flex-col gap-3">
                <div>
                  <label
                    htmlFor="pref-name"
                    style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: "var(--foreground)", display: "block", marginBottom: 6 }}
                  >
                    Display name preference
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="pref-name"
                      type="text"
                      value={editName}
                      onChange={(e) => { setEditName(e.target.value); setIsDirty(true); setNameSaved(false); }}
                      className="flex-1 rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#e8b93c] focus:ring-offset-0"
                      style={{ background: "var(--input-background)", border: "1px solid var(--border)", color: "var(--foreground)", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
                    />
                    <button
                      type="submit"
                      className="flex items-center justify-center rounded-[8px] px-4 text-[12px] font-semibold transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
                      style={{ background: "var(--primary)", color: "var(--primary-foreground)", minHeight: 38, border: "1px solid transparent", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", minWidth: 60 }}
                    >
                      {nameSaved ? "Saved" : "Save"}
                    </button>
                    {isDirty && (
                      <button
                        type="button"
                        onClick={handleCancelName}
                        className="flex items-center justify-center rounded-[8px] px-4 text-[12px] font-semibold transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
                        style={{ background: "transparent", color: "var(--foreground)", minHeight: 38, border: "1px solid var(--border)", fontFamily: "'IBM Plex Sans', system-ui, sans-serif", minWidth: 60 }}
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                  {isDirty && (
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#d4183d", marginTop: 6, letterSpacing: "0.3px" }}>
                      Unsaved change · local only
                    </p>
                  )}
                  {nameSaved && (
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "#1f6b41", marginTop: 6, letterSpacing: "0.3px" }}>
                      Saved locally. No service has confirmed this change. No record has been submitted.
                    </p>
                  )}
                </div>
              </form>
              {/* Theme */}
              <div style={{ borderTop: "1px solid var(--border)", paddingTop: 16 }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
                      Theme
                    </p>
                    <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", marginTop: 2 }}>
                      {dark ? "Dark" : "Light"} · persists in this browser
                    </p>
                  </div>
                  <ThemeToggle dark={dark} onToggle={onToggle} small />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar: account activity + CONTRACT-GATED notice */}
        <div className="flex flex-col gap-4">
          {/* Account activity */}
          <section
            className="rounded-[12px] overflow-hidden"
            style={{ background: "var(--card)", border: "1px solid var(--border)" }}
            aria-labelledby="activity-heading"
          >
            <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
              <h2
                id="activity-heading"
                style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontWeight: 600, fontSize: 13, color: "var(--foreground)", letterSpacing: -0.15 }}
              >
                Account activity
              </h2>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", marginTop: 2, letterSpacing: "0.3px" }}>
                Session-scoped only
              </p>
            </div>
            <div className="flex flex-col">
              <div className="px-4 pt-3 pb-1">
                <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, letterSpacing: "0.9px", textTransform: "uppercase", color: "var(--muted-foreground)", opacity: 0.6 }}>
                  LOCAL DESIGN FIXTURE
                </span>
              </div>
              {ACCOUNT_ACTIVITY.map((entry, i) => (
                <div
                  key={i}
                  className="px-4 py-3"
                  style={{ borderTop: i > 0 ? "1px solid var(--border)" : "none" }}
                >
                  <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.3px" }}>
                    {entry.when}
                  </p>
                  <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 12, color: "var(--foreground)", letterSpacing: -0.1, marginTop: 2, lineHeight: "18px" }}>
                    {entry.action}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* CONTRACT-GATED: portrait + biography */}
          <div
            className="rounded-[12px] px-4 py-4 flex flex-col gap-3"
            style={{ background: "var(--muted)", border: "1px solid var(--border)" }}
            role="note"
            aria-label="Portrait and biography — not available"
          >
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "var(--muted-foreground)", letterSpacing: "1px", textTransform: "uppercase" }}>
              Contract-gated
            </p>
            <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 12, color: "var(--muted-foreground)", letterSpacing: -0.1, lineHeight: "18px" }}>
              Portrait and biography editing are not implementation-ready. No upload or editing is available here.
            </p>
            <div
              className="rounded-[8px] flex items-center justify-center"
              style={{ height: 72, background: "var(--border)", border: "1px dashed var(--border)" }}
              aria-hidden="true"
            >
              <User size={20} strokeWidth={1} color="var(--muted-foreground)" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
