import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import type { AuthGateState, AuthRoute, EntryIntent, Session } from "../appTypes";
import { AUTH_ROUTE_INTENT_LABELS } from "../appRoutes";
import { DENIAL_COPY, type DenialReason } from "../entryIntent";
import { AccountRecoveryPanel, type RecoveryMode } from "./AccountRecoveryPanel";
import { ThemeToggle } from "../brand/ThemeToggle";
import { DolMark, UscMark } from "../brand/BrandMarks";
import { ap } from "../theme/palette";
import { loginBackground } from "../../../ProductionAssets";
import { AccountAccessPanel } from "./AccountAccessPanel";

export function StaffSignInPage({
  onSignIn,
  onBack,
  dark,
  onToggle,
  authState,
  authError,
  entryIntent,
  intendedRoute,
  denialReason,
  session,
  onSignOut,
  onActivate,
  onOpenExternalRequest,
  activationExpiresAt,
}: {
  onSignIn: (identifier: string, password: string) => Promise<void>;
  onBack: () => void;
  dark: boolean;
  onToggle: () => void;
  authState: AuthGateState;
  authError: string | null;
  entryIntent: EntryIntent;
  intendedRoute: AuthRoute | null;
  denialReason: DenialReason | null;
  session: Session | null;
  onSignOut: () => Promise<void>;
  onOpenExternalRequest: () => void;
  onActivate: (profile: { fullName: string; mobileNumber: string; email: string }, password: string, confirmPassword: string) => Promise<void>;
  activationExpiresAt: string;
}) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accessMode, setAccessMode] = useState<"apply" | "status" | null>(null);
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode | null>(null);
  const c = ap(dark);
  const busy = authState === "loading";

  /* R3-A1-A2: the gateway names the destination the user actually asked for.
     A generic sign-in has no destination to name and must not invent one — the
     old "Operations overview" default told accounts without Overview capability
     that they were being sent somewhere they could not go. */
  const intendedLabel = entryIntent === "EXTERNAL_REQUEST_CENTER"
    ? "the External Request Center"
    : intendedRoute
      ? AUTH_ROUTE_INTENT_LABELS[intendedRoute]
      : "";

  const statusCopy: Partial<Record<AuthGateState, { title: string; detail: string }>> = {
    "auth-required": {
      title: "Sign in required",
      detail: intendedLabel
        ? `Sign in to continue to ${intendedLabel}. Access is then checked against your account permissions.`
        : "Sign in with your USC account. Where you land depends on what your account is authorized for.",
    },
    loading: {
      title: "Checking identity",
      detail: "Your credentials are being verified by the authorized service.",
    },
    authorized: {
      // FI-04 is not implemented: no internal workspace renders in this release.
      // Saying otherwise here would overstate what the branch actually ships.
      title: "Access authorized",
      detail: intendedRoute
        ? `Identity and access are confirmed for ${AUTH_ROUTE_INTENT_LABELS[intendedRoute]}. That workspace is not yet available in this release.`
        : "Identity and access are confirmed.",
    },
    denied: denialReason
      ? DENIAL_COPY[denialReason]
      : {
          title: "Not available for this account",
          detail: "Your account is signed in but is not authorized to open that destination.",
        },
    "activation-required": {
      title: "Account activation required",
      detail: "Complete the first-sign-in activation process before continuing.",
    },
    "service-error": {
      title: "Sign in unavailable",
      detail: authError || "The authentication service is temporarily unavailable. Please try again shortly.",
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
    void onSignIn(identifier.trim(), password);
  }

  function handleActivationSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (busy) return;
    const values = new FormData(e.currentTarget);
    const nextPassword = String(values.get("newPassword") ?? "");
    const confirmPassword = String(values.get("confirmPassword") ?? "");
    if (nextPassword !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }
    setError(null);
    void onActivate({
      fullName: String(values.get("fullName") ?? "").trim(),
      mobileNumber: String(values.get("mobileNumber") ?? "").trim(),
      email: String(values.get("email") ?? "").trim(),
    }, nextPassword, confirmPassword);
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
          className={`material-g3 w-full ${accessMode || recoveryMode ? "max-w-[760px]" : "max-w-[420px]"} flex flex-col gap-8 rounded-[18px] p-6 md:p-8`}
          style={{
            color: c.text,
          }}
        >
          {recoveryMode ? (
            <AccountRecoveryPanel
              mode={recoveryMode}
              onClose={() => setRecoveryMode(null)}
              onSignIn={() => setRecoveryMode(null)}
            />
          ) : accessMode ? (
            <AccountAccessPanel initialMode={accessMode} onClose={() => setAccessMode(null)} />
          ) : <>
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
              {authState === "auth-required" ? "Sign in to continue" : "Staff sign in"}
            </h1>
            <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: c.muted, letterSpacing: -0.15, lineHeight: "20px" }}>
              Sign in with your USC account to submit logistics requests or access the workspaces authorized
              for your account.
            </p>
          </div>

          {status && (
            <div
              className="auth-gate-status"
              data-state={authState}
              role={authState === "denied" || authState === "service-error" ? "alert" : "status"}
              aria-live="polite"
            >
              <strong>{status.title}</strong>
              <span>{status.detail}</span>
            </div>
          )}

          {authState === "authorized" ? (
            <div className="flex flex-col gap-3">
              {session?.requesterEligible && (
                <button
                  type="button"
                  onClick={onOpenExternalRequest}
                  className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
                  style={{ background: "#e8b93c", color: "#40070a", minHeight: 48, border: "1px solid #d1b478", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
                >
                  Open External Request Center
                </button>
              )}
              <button
                type="button"
                onClick={() => void onSignOut()}
                className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
                style={{ color: dark ? "#faeecb" : "#610b0f", minHeight: 48, border: "1px solid #d1b478", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
              >
                Sign out
              </button>
            </div>
          ) : authState === "denied" ? (
            /* Truthful, recoverable denial. Offers the paths this account can
               actually take and never hints at internal directory membership. */
            <div className="flex flex-col gap-3">
              <button
                type="button"
                onClick={onBack}
                className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
                style={{ background: "#e8b93c", color: "#40070a", minHeight: 48, border: "1px solid #d1b478", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
              >
                Home
              </button>
              <button
                type="button"
                onClick={() => void onSignOut()}
                className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
                style={{ color: dark ? "#faeecb" : "#610b0f", minHeight: 48, border: "1px solid #d1b478", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
              >
                Sign out
              </button>
            </div>
          ) : authState === "activation-required" ? (
            <form onSubmit={handleActivationSubmit} className="flex flex-col gap-4" noValidate>
              {activationExpiresAt && <p className="text-xs" style={{ color: c.muted }}>Complete activation before {new Date(activationExpiresAt).toLocaleString()}.</p>}
              <label className="flex flex-col gap-1.5">Full name<input name="fullName" required autoComplete="name" className="rounded-[10px] px-4 py-3" style={{ background: c.m2, border: `1px solid ${c.border}`, color: c.text }} /></label>
              <label className="flex flex-col gap-1.5">Mobile number<input name="mobileNumber" required autoComplete="tel" className="rounded-[10px] px-4 py-3" style={{ background: c.m2, border: `1px solid ${c.border}`, color: c.text }} /></label>
              <label className="flex flex-col gap-1.5">Email address<input name="email" required type="email" autoComplete="email" className="rounded-[10px] px-4 py-3" style={{ background: c.m2, border: `1px solid ${c.border}`, color: c.text }} /></label>
              <label className="flex flex-col gap-1.5">New password<input name="newPassword" required type="password" autoComplete="new-password" className="rounded-[10px] px-4 py-3" style={{ background: c.m2, border: `1px solid ${c.border}`, color: c.text }} /></label>
              <label className="flex flex-col gap-1.5">Confirm password<input name="confirmPassword" required type="password" autoComplete="new-password" className="rounded-[10px] px-4 py-3" style={{ background: c.m2, border: `1px solid ${c.border}`, color: c.text }} /></label>
              {error && <p role="alert" style={{ color: "#d4183d" }}>{error}</p>}
              <button type="submit" className="rounded-[10px] text-[13px] font-semibold" style={{ background: "#e8b93c", color: "#40070a", minHeight: 48 }}>Activate account</button>
            </form>
          ) : <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
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
                  aria-controls="signin-pw"
                  aria-pressed={showPw}
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

            <button
              type="submit"
              disabled={busy}
              className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
              style={{ background: "#e8b93c", color: "#40070a", minHeight: 48, border: "1px solid #d1b478", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}
            >
              {authState === "loading" ? "Checking identity…" : "Sign in"}
            </button>
          </form>}

          {/* R3-A1-A2 §17 / §31. Three separate operations, kept separate on
              purpose: activating an identity that already exists, recovering a
              password for one, and applying for an identity that does not exist
              yet. Collapsing the first into the third would create open staff
              registration. */}
          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-label="Account access help">
              <button type="button" onClick={() => setRecoveryMode("activate")}
                className="text-[13px] underline underline-offset-4 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8b93c]"
                style={{ color: dark ? "#f6e29a" : "#610b0f", background: "none", minHeight: 44, fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
                No password yet? Activate account
              </button>
              <button type="button" onClick={() => setRecoveryMode("reset")}
                className="text-[13px] underline underline-offset-4 rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8b93c]"
                style={{ color: dark ? "#f6e29a" : "#610b0f", background: "none", minHeight: 44, fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
                Forgot password?
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="Account application links">
              <button type="button" onClick={() => setAccessMode("apply")}
                className="rounded-[10px] text-[13px] font-semibold"
                style={{ color: dark ? "#faeecb" : "#610b0f", minHeight: 42, border: "1px solid #d1b478" }}>
                Apply for staff access
              </button>
              <button type="button" onClick={() => setAccessMode("status")}
                className="rounded-[10px] text-[13px] font-semibold"
                style={{ color: dark ? "#faeecb" : "#610b0f", minHeight: 42, border: "1px solid #d1b478" }}>
                Check application status
              </button>
            </div>
          </div>
          </>}

          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[13px] tracking-[-0.15px] transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#610b0f] rounded-sm self-start"
            style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: dark ? "#f6e29a" : "#610b0f", background: "none" }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Home
          </button>
        </div>
      </main>
    </div>
  );
}
