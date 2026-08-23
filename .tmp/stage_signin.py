import io, os, sys

P = os.path.join('output', 'design', 'r3-a1-a2-make-recovery', 'staged', 'src', 'app', 'auth', 'StaffSignInPage.tsx')
SRC = os.path.join('output', 'design', 'figma-make-source', 'src', 'app', 'auth', 'StaffSignInPage.tsx')

s = io.open(SRC, encoding='utf-8').read()


def rep(a, b):
    global s
    assert a in s, a[:90]
    s = s.replace(a, b)


rep('''import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import type { AuthGateState, AuthPreviewOutcome, AuthRoute } from "../appTypes";
import { AUTH_ROUTE_INTENT_LABELS } from "../appRoutes";''',
'''import { useState, type FormEvent } from "react";
import { ArrowLeft, Eye, EyeOff } from "lucide-react";
import type { AuthGateState, AuthPreviewOutcome, AuthRoute, EntryIntent, Session } from "../appTypes";
import { AUTH_ROUTE_INTENT_LABELS } from "../appRoutes";
import { DENIAL_COPY, type DenialReason } from "../entryIntent";
import { AccountRecoveryPanel, type RecoveryMode } from "./AccountRecoveryPanel";''')

rep('''  authState,
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
}) {''',
'''  authState,
  entryIntent,
  intendedRoute,
  denialReason,
  session,
  onOpenExternalRequest,
  onSignOut,
  previewOutcome,
  onPreviewOutcome,
}: {
  onSignIn: (outcome: AuthPreviewOutcome) => void;
  onBack: () => void;
  dark: boolean;
  onToggle: () => void;
  authState: AuthGateState;
  entryIntent: EntryIntent;
  intendedRoute: AuthRoute | null;
  denialReason: DenialReason | null;
  session: Session | null;
  onOpenExternalRequest: () => void;
  onSignOut: () => void;
  previewOutcome: AuthPreviewOutcome;
  onPreviewOutcome: (outcome: AuthPreviewOutcome) => void;
}) {''')

rep('''  const [error, setError] = useState<string | null>(null);
  const c = ap(dark);
  const busy = authState === "loading" || authState === "authenticated" || authState === "authorized";
  const intendedLabel = intendedRoute ? AUTH_ROUTE_INTENT_LABELS[intendedRoute] : "Operations overview";''',
'''  const [error, setError] = useState<string | null>(null);
  const [recoveryMode, setRecoveryMode] = useState<RecoveryMode | null>(null);
  const c = ap(dark);
  const busy = authState === "loading" || authState === "authenticated" || authState === "authorized";

  /* R3-A1-A2: the gateway names the destination the user actually asked for. A
     generic sign-in has no destination to name and must not invent one — the old
     "Operations overview" default told accounts without Overview capability that
     they were being sent somewhere they could not go. */
  const intendedLabel = entryIntent === "EXTERNAL_REQUEST_CENTER"
    ? "the External Request Center"
    : intendedRoute
      ? AUTH_ROUTE_INTENT_LABELS[intendedRoute]
      : "";''')

rep('''  const statusCopy: Partial<Record<AuthGateState, { title: string; detail: string }>> = {
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
  };''',
'''  const statusCopy: Partial<Record<AuthGateState, { title: string; detail: string }>> = {
    "auth-required": {
      title: "Sign in required",
      detail: intendedLabel
        ? `Sign in to continue to ${intendedLabel}. Access is then checked against your account permissions.`
        : "Sign in with your USC account. Where you land depends on what your account is authorized for.",
    },
    loading: {
      title: "Checking identity",
      detail: "The local preview is evaluating the selected persona.",
    },
    authenticated: {
      title: "Identity accepted",
      detail: "Checking what this account is authorized for.",
    },
    authorized: {
      title: "Access authorized",
      detail: intendedLabel ? `Opening ${intendedLabel}.` : "Opening the destination for this account.",
    },
    denied: denialReason
      ? DENIAL_COPY[denialReason]
      : {
          title: "Not available for this account",
          detail: "This account is signed in but is not authorized to open that destination.",
        },
    "session-expired": {
      title: "Session expired",
      detail: "Sign in again to continue.",
    },
    "activation-required": {
      title: "Account activation required",
      detail: "This account exists but has no password yet. Use Activate account below.",
    },
    "invalid-credentials": {
      title: "Sign in failed",
      detail: "That identifier and password combination was not accepted. Check both and try again.",
    },
  };''')

rep('''            <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: c.muted, letterSpacing: -0.15, lineHeight: "20px" }}>
              Access the logistics workspace. The authorized account record determines what you can view and do.
            </p>''',
'''            <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: c.muted, letterSpacing: -0.15, lineHeight: "20px" }}>
              Sign in with your USC account to submit logistics requests or access the workspaces authorized
              for your account.
            </p>''')

# Widen the card when the recovery panel is open, and render it in place of the form.
rep('''          className="material-g3 w-full max-w-[420px] flex flex-col gap-8 rounded-[18px] p-6 md:p-8"''',
    '''          className={`material-g3 w-full ${recoveryMode ? "max-w-[720px]" : "max-w-[420px]"} flex flex-col gap-8 rounded-[18px] p-6 md:p-8`}''')

rep('''          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <DolMark size={34} />''',
'''          {recoveryMode ? (
            <AccountRecoveryPanel
              mode={recoveryMode}
              onClose={() => setRecoveryMode(null)}
              onSignIn={() => setRecoveryMode(null)}
            />
          ) : <>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3 mb-2">
              <DolMark size={34} />''')

# Persona selector, replacing the three-outcome one.
rep('''            <details className="auth-preview">
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
            </details>''',
'''            {/* R3-A1-A2 §27. The prototype may simulate identity, but the
                personas must represent the corrected product model — which is
                exactly what makes the routing demonstrable. Each one carries a
                realistic capability set rather than "everything". */}
            <details className="auth-preview">
              <summary>Preview identity</summary>
              <label htmlFor="auth-preview-outcome" className="flex flex-col gap-1">
                Simulated persona
                <select
                  id="auth-preview-outcome"
                  value={previewOutcome}
                  disabled={busy}
                  onChange={(e) => onPreviewOutcome(e.target.value as AuthPreviewOutcome)}
                >
                  <option value="requester">Eligible USC requester (non-DOL)</option>
                  <option value="dol">DOL / internal staff</option>
                  <option value="ineligible">Signed in but ineligible</option>
                  <option value="invalid-credentials">Invalid credentials</option>
                  <option value="activation-required">Activation required</option>
                  <option value="session-expired">Session expired</option>
                </select>
              </label>
              <p className="mt-2 leading-5">
                Local design simulation only. No identity provider, account, session, email, or data service is
                connected. Where each persona lands is decided by the real entry-intent rules in
                <code> entryIntent.ts</code>, not by the persona picker.
              </p>
            </details>''')

# Authorized / denied actions, and the front-door rename.
rep('''          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[13px] tracking-[-0.15px] transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#610b0f] rounded-sm self-start"
            style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: dark ? "#f6e29a" : "#610b0f", background: "none" }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} />
            Return to public front door
          </button>''',
'''          {/* R3-A1-A2 §17 / §31. Three separate operations, kept separate on
              purpose: activating an identity that already exists, recovering a
              password for one, and — in the product — applying for an identity
              that does not exist yet. Collapsing the first into the third would
              create open staff registration. */}
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

          {/* Truthful, recoverable denial: the paths this account can actually
              take, and nothing about internal directory membership. */}
          {authState === "denied" && (
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={onBack}
                className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold"
                style={{ background: "#e8b93c", color: "#40070a", minHeight: 44, paddingLeft: 16, paddingRight: 16, border: "1px solid #d1b478", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
                Home
              </button>
              <button type="button" onClick={onSignOut}
                className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold"
                style={{ color: dark ? "#faeecb" : "#610b0f", minHeight: 44, paddingLeft: 16, paddingRight: 16, border: "1px solid #d1b478", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
                Sign out
              </button>
            </div>
          )}

          {authState === "authorized" && session?.requesterEligible && (
            <button type="button" onClick={onOpenExternalRequest}
              className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold"
              style={{ background: "#e8b93c", color: "#40070a", minHeight: 44, border: "1px solid #d1b478", fontFamily: "'IBM Plex Sans', system-ui, sans-serif" }}>
              Open External Request Center
            </button>
          )}
          </>}

          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-[13px] tracking-[-0.15px] transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#610b0f] rounded-sm self-start"
            style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: dark ? "#f6e29a" : "#610b0f", background: "none" }}
          >
            <ArrowLeft size={14} strokeWidth={1.5} aria-hidden="true" />
            Home
          </button>''')

io.open(P, 'w', encoding='utf-8', newline='').write(s)
sys.stdout.write('staged StaffSignInPage %d bytes\n' % len(s.encode('utf-8')))
