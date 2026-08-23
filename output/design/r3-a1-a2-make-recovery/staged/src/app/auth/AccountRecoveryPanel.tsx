/* R3-A1-A2 §17-§19 — Activate account · Forgot password.  FIGMA MAKE PROTOTYPE.
 *
 * TWO DISTINCT OPERATIONS, deliberately not merged:
 *
 *   "Activate account"      establishes credentials for an existing eligible
 *                           staff identity. It never creates an identity and
 *                           never grants DOL/internal capability.
 *   "Apply for staff access" asks for an identity that does not exist yet and is
 *                           reviewed and approved.
 *
 * Conflating them would turn activation into open staff registration, which §31
 * forbids.
 *
 * PROTOTYPE HONESTY (§27). This file simulates the flow so the interaction can be
 * evaluated. It states two separate truths on screen and never blurs them:
 *   1. nothing here is real — no email is sent, no code is issued, no password
 *      is stored;
 *   2. the server contract for self-service activation and password reset does
 *      not exist yet — BACKEND_CONTRACT_GAP_SELF_SERVICE_IDENTITY.
 * A simulated success is never presented as provider behaviour.
 */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { VerificationCodeField, type VerificationState } from "./VerificationCodeField";

export type RecoveryMode = "activate" | "reset";

type Step = "identify" | "code" | "password" | "done";

const COPY: Record<RecoveryMode, { title: string; lede: string; submit: string; success: string }> = {
  activate: {
    title: "Activate your account",
    lede:
      "For staff who already have a HAU-USC Logistics identity but have not set a password yet. Enter the identifier or email registered with the Department of Logistics.",
    submit: "Activate account",
    success: "Simulated: the account would now be activated and you would return to Staff sign in.",
  },
  reset: {
    title: "Reset your password",
    lede:
      "Enter the identifier or email registered with your account. If the account exists, an 8-digit verification code is sent to its registered email.",
    submit: "Update password",
    success: "Simulated: the password would now be updated and you would return to Staff sign in.",
  },
};

/** Uniform, non-enumerating confirmation. Identical whether or not an account exists. */
const GENERIC_CONFIRMATION =
  "If this account exists, a verification code has been sent to its registered email.";

/** The prototype accepts this and rejects everything else, so the invalid,
 *  expired and attempt-limited states can actually be exercised. */
const DEMO_CODE = "01234567";

/* Uses the Make project's own tokens from src/styles/theme.css and index.css
 * (--destructive, --green-open, --input-background, --card, --border,
 * --foreground, --muted-foreground) rather than literals, so the panel follows
 * the light/dark themes the rest of the prototype already honours. The gold
 * accents match the institutional identity anchors used across the app. */
const PANEL_CSS = `
  .account-recovery{display:flex;flex-direction:column;gap:20px;color:var(--foreground);font-family:"IBM Plex Sans",system-ui,sans-serif}
  .account-recovery h2{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:22px;font-weight:700;letter-spacing:-.6px}
  .account-recovery p,.account-recovery small{color:var(--muted-foreground);font-size:12px;line-height:1.55}
  .account-recovery label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:550;color:var(--foreground)}
  .account-recovery input{min-height:44px;padding:10px 12px;border:1px solid var(--border);border-radius:10px;background:var(--input-background);color:var(--foreground);font:inherit}
  .account-recovery input[aria-invalid="true"]{border-color:var(--destructive);border-width:2px}
  .account-recovery form{display:flex;flex-direction:column;gap:14px}
  .account-recovery button{min-height:44px;padding:10px 14px;border:1px solid var(--border);border-radius:10px;color:var(--foreground);background:transparent;font:inherit}
  .account-recovery .account-primary{background:var(--gold-vivid);color:var(--oxblood-deep);border-color:var(--gold-mid);font-weight:650}
  .account-recovery .account-primary[disabled]{opacity:.55}
  .account-code-field{display:flex;flex-direction:column;gap:8px}
  .account-code-field input{letter-spacing:.34em;font-variant-numeric:tabular-nums}
  .account-code-error{color:var(--destructive)!important;font-weight:600}
  .account-code-ok{color:var(--green-open)!important;font-weight:600}
  .account-code-resend button{align-self:flex-start}
  .account-sim{display:grid;gap:6px;padding:12px 14px;border:1px dashed var(--border);border-radius:10px;background:var(--card)}
  .account-sim b{font-family:"IBM Plex Mono",monospace;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:var(--gold-deep,#7d5518)}
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
  const [codeState, setCodeState] = useState<VerificationState>("code-entry");
  const [serverMessage, setServerMessage] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [attempts, setAttempts] = useState(0);
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

  function requestCode(event?: FormEvent) {
    event?.preventDefault();
    if (busy || !identifier.trim()) {
      setError("Enter your registered identifier or email address.");
      return;
    }
    setBusy(true);
    setError("");
    setServerMessage("");
    setCodeState("resending");
    // Simulated latency only. No request leaves the prototype.
    window.setTimeout(() => {
      setNotice(GENERIC_CONFIRMATION);
      setCodeState("code-entry");
      setCode("");
      setAttempts(0);
      setStep("code");
      startCooldown(30);
      setBusy(false);
    }, 420);
  }

  function verifyCode(event: FormEvent) {
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
    window.setTimeout(() => {
      setBusy(false);
      if (code === DEMO_CODE) {
        setCodeState("verified");
        setStep("password");
        return;
      }
      const next = attempts + 1;
      setAttempts(next);
      if (next >= 3) {
        setCodeState("too-many-attempts");
        setServerMessage("Too many attempts. Request a new code before trying again.");
        return;
      }
      setCodeState("invalid");
      setServerMessage("");
    }, 380);
  }

  function setPassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    if (String(values.get("password") ?? "") !== String(values.get("confirmPassword") ?? "")) {
      setError("Passwords must match.");
      return;
    }
    setError("");
    setStep("done");
  }

  return (
    <section className="account-recovery" aria-busy={busy}>
      <style>{PANEL_CSS}</style>
      <h2>{copy.title}</h2>

      {/* Two separate truths, stated separately, on every step. */}
      <div className="account-sim" role="note">
        <b>Prototype simulation</b>
        <span>
          Nothing here is real: no email is sent, no code is issued, and no password is stored.
          Use <strong>{DEMO_CODE}</strong> to exercise the verified path; any other 8 digits
          exercise the invalid and attempt-limited states.
        </span>
        <b>Backend contract gap</b>
        <span>
          BACKEND_CONTRACT_GAP_SELF_SERVICE_IDENTITY — the server has no self-service activation
          or password-reset route yet. This screen is the accepted design for that contract, not
          evidence that it exists.
        </span>
      </div>

      {step === "identify" && (
        <form onSubmit={requestCode} noValidate>
          <p>{copy.lede}</p>
          <label>
            Registered identifier or email
            <input
              required
              autoComplete="username"
              value={identifier}
              onChange={(event) => { setIdentifier(event.target.value); setError(""); }}
              placeholder="Username, account code, or email"
              aria-invalid={Boolean(error)}
            />
          </label>
          {error && <p role="alert" className="account-code-error">Problem: {error}</p>}
          <button className="account-primary" disabled={busy}>
            {busy ? "Sending…" : "Send verification code"}
          </button>
          <button type="button" onClick={onClose}>Back to sign in</button>
        </form>
      )}

      {step === "code" && (
        <form onSubmit={verifyCode} noValidate>
          {notice && <p role="status" aria-live="polite">{notice}</p>}
          <VerificationCodeField
            value={code}
            onChange={(next) => {
              setCode(next);
              if (codeState !== "code-entry" && codeState !== "too-many-attempts") {
                setCodeState("code-entry");
                setServerMessage("");
              }
            }}
            state={codeState}
            serverMessage={serverMessage}
            onResend={() => requestCode()}
            resendAvailableIn={cooldown}
            disabled={busy}
          />
          <button className="account-primary" disabled={busy || code.length !== 8 || codeState === "too-many-attempts"}>
            {codeState === "verifying" ? "Checking code…" : "Verify code"}
          </button>
          <button type="button" onClick={onClose}>Back to sign in</button>
        </form>
      )}

      {step === "password" && (
        <form onSubmit={setPassword} noValidate>
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
          <button className="account-primary">{copy.submit}</button>
          <button type="button" onClick={onClose}>Back to sign in</button>
        </form>
      )}

      {step === "done" && (
        <div className="account-sim" role="status" aria-live="polite">
          <b>Simulated result</b>
          <span>{copy.success}</span>
          <button type="button" className="account-primary" onClick={onSignIn}>Go to sign in</button>
        </div>
      )}
    </section>
  );
}
