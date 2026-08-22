import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import type { AuthGateState, AuthPreviewOutcome, AuthRoute } from "../appTypes";
import { AUTH_ROUTE_INTENT_LABELS } from "../appRoutes";
import { ThemeToggle } from "../brand/ThemeToggle";
import { DolMark, UscMark } from "../brand/BrandMarks";
import { ap } from "../theme/palette";
import { loginBackground } from "../../../ProductionAssets";

export function StaffSignInPage({
  onSignIn,
  onBack,
  dark,
  onToggle,
  authState,
  intendedRoute,
  previewOutcome,
  onPreviewOutcome,
}: {
  onSignIn: (outcome: AuthPreviewOutcome) => void;
  onBack: () => void;
  dark: boolean;
  onToggle: () => void;
  authState: AuthGateState;
  intendedRoute: AuthRoute | null;
  previewOutcome: AuthPreviewOutcome;
  onPreviewOutcome: (outcome: AuthPreviewOutcome) => void;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const c = ap(dark);
  const busy = authState === "loading" || authState === "authenticated" || authState === "authorized";
  const intendedLabel = intendedRoute ? AUTH_ROUTE_INTENT_LABELS[intendedRoute] : "Operations overview";

  const statusCopy: Partial<Record<AuthGateState, { title: string; detail: string }>> = {
    "auth-required": {
      title: "Sign in required",
      detail: `After authorization, this prototype returns to ${intendedLabel}.`,
    },
    loading: {
      title: "Checking identity",
      detail: "The local preview is evaluating the selected outcome.",
    },
    authenticated: {
      title: "Identity accepted",
      detail: `Checking permission for ${intendedLabel}.`,
    },
    authorized: {
      title: "Access authorized",
      detail: `Opening ${intendedLabel}.`,
    },
    denied: {
      title: "Access denied",
      detail: `This preview identity cannot open ${intendedLabel}. Choose another preview outcome or return to public services.`,
    },
    "session-expired": {
      title: "Session expired",
      detail: `Sign in again to return to ${intendedLabel}.`,
    },
  };
  const status = statusCopy[authState];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (!identifier.trim() || !password.trim()) {
      setError("Enter your identifier and password to continue.");
      return;
    }
    setError(null);
    onSignIn(previewOutcome);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: c.bg }}>
      {/* Minimal topbar */}
      <div
        className="flex items-center justify-between px-5 md:px-8 py-[14px]"
        style={{ background: "#40070a", borderBottom: "1px solid rgba(242,209,92,0.22)" }}
      >
        <div className="flex items-center gap-3">
          <UscMark size={36} />
          <span style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: -0.075 }}>
            University Student Council
          </span>
        </div>
        <ThemeToggle dark={dark} onToggle={onToggle} />
      </div>

      {/* Form */}
      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-5 py-14"
        style={{
          backgroundImage: `linear-gradient(${dark ? "rgba(18,11,11,.58)" : "rgba(64,7,10,.48)"}, ${dark ? "rgba(18,11,11,.68)" : "rgba(64,7,10,.58)"}), url(${loginBackground})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div
          aria-busy={busy}
          className="material-g3 w-full max-w-[420px] flex flex-col gap-8 rounded-[18px] p-6 md:p-8"
          style={{
            color: c.text,
          }}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <DolMark size={34} />
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: dark ? "#e8b93c" : "#7d5518", letterSpacing: "1px", textTransform: "uppercase" }}>
                Department of Logistics
              </p>
            </div>
            <h1
              style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 28, color: c.text, letterSpacing: "-0.8px", fontVariationSettings: '"opsz" 14, "wdth" 100' }}
            >
              {authState === "auth-required" || authState === "session-expired" ? "Sign in to continue" : "Staff sign in"}
            </h1>
            <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: c.muted, letterSpacing: -0.15, lineHeight: "20px" }}>
              Access the logistics workspace. The authorized account record determines what you can view and do.
            </p>
          </div>

          {status && (
            <div
              className="auth-gate-status"
              data-state={authState}
              role={authState === "denied" || authState === "session-expired" ? "alert" : "status"}
              aria-live="polite"
            >
              <strong>{status.title}</strong>
              <span>{status.detail}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signin-id"
                style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: c.text }}
              >
                Identifier
              </label>
              <input
                id="signin-id"
                type="text"
                autoComplete="username"
                 value={identifier}
                 disabled={busy}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? "signin-error" : undefined}
                onChange={(e) => { setIdentifier(e.target.value); setError(null); }}
                placeholder="Username, account code, or email"
                className="rounded-[10px] px-4 py-3 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#e8b93c] focus:ring-offset-0"
                style={{ background: c.m2, border: `1px solid ${c.border}`, color: c.text, fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="signin-pw"
                style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, fontWeight: 500, color: c.text }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="signin-pw"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                 value={password}
                 disabled={busy}
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "signin-error" : undefined}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  placeholder="Enter your password"
                  className="w-full rounded-[10px] px-4 py-3 pr-12 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#e8b93c] focus:ring-offset-0"
                  style={{ background: c.m2, border: `1px solid ${c.border}`, color: c.text, fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center rounded focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
                  aria-label={showPw ? "Hide password" : "Show password"}
                  style={{ width: 32, height: 32 }}
                >
                  {showPw
                    ? <EyeOff size={15} color={dark ? "#e8b93c" : "#7d5518"} />
                    : <Eye size={15} color={dark ? "#e8b93c" : "#7d5518"} />}
                </button>
              </div>
              <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, color: c.muted, letterSpacing: -0.1, marginTop: 2 }}>
                If you have trouble signing in, contact your system administrator.
              </p>
            </div>

            {error && (
              <p id="signin-error" role="alert" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 12, color: "#d4183d", letterSpacing: -0.1 }}>
                {error}
              </p>
            )}

            <details className="auth-preview">
              <summary>Preview access outcomes</summary>
              <label htmlFor="auth-preview-outcome" className="flex flex-col gap-1">
                Local outcome
                <select
                  id="auth-preview-outcome"
                  value={previewOutcome}
                  disabled={busy}
                  onChange={(e) => onPreviewOutcome(e.target.value as AuthPreviewOutcome)}
                >
                  <option value="authorized">Authorized</option>
                  <option value="denied">Access denied</option>
                  <option value="session-expired">Session expired</option>
                </select>
              </label>
              <p className="mt-2 leading-5">
                Local design simulation only. No identity provider, account, session, email, or data service is connected.
              </p>
            </details>

            <button
              type="submit"
              disabled={busy}
              className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
              style={{ background: "#e8b93c", color: "#40070a", minHeight: 48, border: "1px solid #d1b478", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
            >
              {authState === "loading"
                ? "Checking identity…"
                : authState === "authenticated"
                  ? "Checking access…"
                  : authState === "authorized"
                    ? `Opening ${intendedLabel}…`
                    : authState === "session-expired"
                      ? "Sign in again"
                      : "Sign in"}
            </button>
          </form>

          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[13px] tracking-[-0.15px] transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#610b0f] rounded-sm self-start"
            style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: dark ? "#f6e29a" : "#610b0f", background: "none" }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Return to public front door
          </button>
        </div>
      </main>
    </div>
  );
}
