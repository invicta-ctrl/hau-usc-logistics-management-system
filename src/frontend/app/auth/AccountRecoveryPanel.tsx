/* R3-A1-A2 §17-§19 — Activate account · Forgot password.
 *
 * TWO DISTINCT OPERATIONS, deliberately not merged:
 *
 *   "Activate account"      establishes credentials for an **existing eligible
 *                           staff identity**. It never creates an identity and
 *                           never grants DOL/internal capability — the server
 *                           decides both.
 *   "Apply for staff access" (in `AccountAccessPanel`) asks for an identity that
 *                           does not exist yet, and is reviewed and approved.
 *
 * Conflating them would turn activation into open staff registration, which
 * §31 forbids.
 *
 * Both flows here share one shape: identify -> 8-digit emailed code -> set
 * password. Neither reveals whether an account exists: step 1 always answers
 * with the same generic confirmation.
 */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { FrontendApiError, frontendBackend } from "../../integration/backend";
import { VerificationCodeField, type VerificationState } from "./VerificationCodeField";

export type RecoveryMode = "activate" | "reset";

type Step = "identify" | "code" | "password" | "done";

const COPY: Record<RecoveryMode, { title: string; lede: string; submit: string; success: string }> = {
  activate: {
    title: "Activate your account",
    lede:
      "For staff who already have a HAU-USC Logistics identity but have not set a password yet. Enter the identifier or email registered with the Department of Logistics.",
    submit: "Activate account",
    success: "Your account is activated. You can now sign in with your new password.",
  },
  reset: {
    title: "Reset your password",
    lede:
      "Enter the identifier or email registered with your account. If the account exists, we send an 8-digit verification code to its registered email.",
    submit: "Update password",
    success: "Your password has been updated. You can now sign in with it.",
  },
};

/** Uniform, non-enumerating confirmation. Identical whether or not the account exists. */
const GENERIC_CONFIRMATION =
  "If this account exists, a verification code has been sent to its registered email.";

/* Colour note. `#fff7e6` and `#f7f0e2` below are the input and card treatments
 * the sibling `AccountAccessPanel` already ships, and both panels render in the
 * same slot on the sign-in page — diverging one of them would be a visible
 * inconsistency, so they are matched deliberately rather than tokenised here.
 * That whole account-panel family predates R3-A1-A2 and is light-mode only.
 *
 * These are now declared in `DESIGN.md` frontmatter (`panel-input`,
 * `destructive`, `green-open`), so the detector reads them as the system tokens
 * they are rather than as drift. Declaring what actually ships was the fix;
 * suppressing the finding would not have been. Converting both panels to
 * theme-aware tokens stays open as FE-R3-013, and must be done to the pair.
 *
 * Values introduced by this file that had a shipped token available use it:
 * `var(--green-open)`, `var(--destructive)`. */
const PANEL_CSS = `
  .account-recovery{display:flex;flex-direction:column;gap:22px;color:#241416;font-family:"IBM Plex Sans",system-ui,sans-serif}
  .account-recovery .account-close,.account-recovery .account-access-form button{min-height:44px;padding:10px 14px;border:1px solid #d1b478;border-radius:10px;color:#610b0f;background:transparent}
  .account-recovery .account-primary{background:#e8b93c;color:#40070a;border-color:#d1b478;font-weight:650}
  .account-recovery .account-primary[disabled]{opacity:.55}
  .account-recovery .account-access-form{display:flex;flex-direction:column;gap:14px}
  .account-recovery h2{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:20px;font-weight:700;letter-spacing:-.6px}
  .account-recovery p,.account-recovery small{color:#6f5a60;font-size:11px;line-height:1.55}
  .account-recovery label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:550;color:#241416}
  .account-recovery input{min-height:44px;padding:10px 12px;border:1px solid #d1b478;border-radius:10px;background:#fff7e6;color:#241416;font:inherit}
  .account-recovery input[aria-invalid="true"]{border-color:var(--destructive);border-width:2px}
  .account-code-field{display:flex;flex-direction:column;gap:8px}
  .account-code-field input{letter-spacing:.34em;font-variant-numeric:tabular-nums}
  .account-code-error{color:var(--destructive)!important;font-weight:600}
  .account-code-ok{color:var(--green-open)!important;font-weight:600}
  .account-code-resend button{align-self:flex-start}
  .account-status-card{display:grid;gap:12px;padding:16px;border:1px solid #d1b478;border-radius:14px;background:#f7f0e2}
`;

export function AccountRecoveryPanel({
  mode,
  onClose,
  onSignIn,
}: {
  mode: RecoveryMode;
  onClose: () => void;
  onSignIn: () => void;
}) {
  const copy = COPY[mode];
  const [step, setStep] = useState<Step>("identify");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [token, setToken] = useState("");
  const [codeState, setCodeState] = useState<VerificationState>("code-entry");
  const [serverMessage, setServerMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  /** Set when the service itself is missing or unreachable. Reported plainly
   *  rather than dressed up as a user mistake. */
  const [serviceUnavailable, setServiceUnavailable] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((current) => {
        if (current <= 1 && timerRef.current) clearInterval(timerRef.current);
        return Math.max(0, current - 1);
      });
    }, 1000);
  }, []);

  const reportFailure = useCallback((cause: unknown) => {
    const apiError = cause instanceof FrontendApiError ? cause : null;
    // A 404 means the route is not deployed. That is a service gap, not a bad
    // code — saying "invalid code" here would be a lie.
    if (apiError && (apiError.status === 404 || apiError.code === "NOT_FOUND")) {
      setServiceUnavailable(
        mode === "activate"
          ? "Self-service activation is not available on this service yet. Ask the Department of Logistics to activate your account."
          : "Self-service password reset is not available on this service yet. Ask the Department of Logistics to reset your password.",
      );
      return;
    }
    if (apiError?.code === "VERIFICATION_EXPIRED") { setCodeState("expired"); setServerMessage(apiError.message); return; }
    if (apiError?.code === "VERIFICATION_ATTEMPTS_EXCEEDED") { setCodeState("too-many-attempts"); setServerMessage(apiError.message); return; }
    if (apiError?.code === "VERIFICATION_INVALID") { setCodeState("invalid"); setServerMessage(apiError.message); return; }
    if (step === "code") { setCodeState("server-error"); setServerMessage(apiError?.message ?? ""); return; }
    setError(apiError?.message ?? "The service is temporarily unavailable. Please try again.");
  }, [mode, step]);

  async function requestCode(event?: FormEvent) {
    event?.preventDefault();
    if (busy || !identifier.trim()) {
      setError("Enter your registered identifier or email address.");
      return;
    }
    setBusy(true);
    setError("");
    setServerMessage("");
    setCodeState("resending");
    try {
      const result = await frontendBackend.startIdentityVerification(mode, identifier.trim());
      setNotice(GENERIC_CONFIRMATION);
      setCodeState("code-entry");
      setStep("code");
      startCooldown(result.resendAvailableInSeconds);
    } catch (cause) {
      setCodeState("code-entry");
      reportFailure(cause);
    } finally {
      setBusy(false);
    }
  }

  async function verifyCode(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    if (!/^\d{8}$/u.test(code)) {
      setCodeState("invalid");
      setServerMessage("Enter the exact 8-digit verification code, including any leading zero.");
      return;
    }
    setBusy(true);
    setCodeState("verifying");
    setServerMessage("");
    try {
      const result = await frontendBackend.verifyIdentityCode(mode, identifier.trim(), code);
      setToken(result.token);
      setCodeState("verified");
      setStep("password");
    } catch (cause) {
      reportFailure(cause);
    } finally {
      setBusy(false);
    }
  }

  async function setPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") ?? "");
    const confirmPassword = String(values.get("confirmPassword") ?? "");
    if (password !== confirmPassword) {
      setError("Passwords must match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      if (mode === "activate") await frontendBackend.completeAccountActivation(token, password, confirmPassword);
      else await frontendBackend.completePasswordReset(token, password, confirmPassword);
      setStep("done");
    } catch (cause) {
      reportFailure(cause);
    } finally {
      setBusy(false);
    }
  }

  if (serviceUnavailable) {
    return (
      <section className="account-recovery">
        <style>{PANEL_CSS}</style>
        <div className="account-access-form" role="alert">
        <h2>{copy.title}</h2>
        <p>{serviceUnavailable}</p>
        <p className="account-code-hint">
          Signing in with an existing password is unaffected.
        </p>
          <button type="button" className="account-close" onClick={onClose}>Back to sign in</button>
        </div>
      </section>
    );
  }

  return (
    <section className="account-recovery" aria-busy={busy}>
      <style>{PANEL_CSS}</style>
      <h2>{copy.title}</h2>

      {step === "identify" && (
        <form className="account-access-form" onSubmit={requestCode} noValidate>
          <p>{copy.lede}</p>
          <label>
            Registered identifier or email
            <input
              required
              autoComplete="username"
              spellCheck={false}
              value={identifier}
              onChange={(event) => { setIdentifier(event.target.value); setError(""); }}
              placeholder="e.g. j.dela.cruz…"
              aria-invalid={Boolean(error)}
            />
          </label>
          {error && <p role="alert" className="account-code-error">Problem: {error}</p>}
          <button className="account-primary" disabled={busy}>
            {busy ? "Sending…" : "Send verification code"}
          </button>
          <button type="button" className="account-close" onClick={onClose}>Back to sign in</button>
        </form>
      )}

      {step === "code" && (
        <form className="account-access-form" onSubmit={verifyCode} noValidate>
          {notice && <p role="status" aria-live="polite">{notice}</p>}
          <VerificationCodeField
            value={code}
            onChange={(next) => { setCode(next); if (codeState !== "code-entry") { setCodeState("code-entry"); setServerMessage(""); } }}
            state={codeState}
            serverMessage={serverMessage}
            onResend={() => void requestCode()}
            resendAvailableIn={cooldown}
            disabled={busy}
          />
          <button className="account-primary" disabled={busy || code.length !== 8}>
            {codeState === "verifying" ? "Checking code…" : "Verify code"}
          </button>
          <button type="button" className="account-close" onClick={onClose}>Back to sign in</button>
        </form>
      )}

      {step === "password" && (
        <form className="account-access-form" onSubmit={setPassword} noValidate>
          <p role="status" aria-live="polite">Code verified. Choose a password for your account.</p>
          <label>
            New password
            <input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
          </label>
          <label>
            Confirm password
            <input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required />
          </label>
          {error && <p role="alert" className="account-code-error">Problem: {error}</p>}
          <button className="account-primary" disabled={busy}>{busy ? "Saving…" : copy.submit}</button>
          <button type="button" className="account-close" onClick={onClose}>Back to sign in</button>
        </form>
      )}

      {step === "done" && (
        <div className="account-status-card" role="status" aria-live="polite">
          <p>{copy.success}</p>
          <button type="button" className="account-primary" onClick={onSignIn}>Go to sign in</button>
        </div>
      )}
    </section>
  );
}
