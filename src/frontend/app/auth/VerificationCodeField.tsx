/* R3-A1-A2 §19 — shared 8-digit verification-code field.
 *
 * This reuses the pattern the project already ships in `AccountAccessPanel`
 * (numeric `inputMode`, `autoComplete="one-time-code"`, `pattern="[0-9]{8}"`,
 * exact length 8) rather than introducing a segmented OTP control. The segmented
 * control in `components/ui/input-otp.tsx` looks tidier but is materially worse
 * here: it fights paste on several mobile browsers, and every code in this
 * product can carry a meaningful leading zero, which per-slot inputs routinely
 * eat. A single field pastes cleanly and announces as one value.
 *
 * Accessibility: real label, `aria-describedby` wired to hint and error,
 * `aria-invalid` on failure, `role="alert"` on the error text, and no
 * colour-only signalling — every failure state carries words.
 */

import { useEffect, useId, useRef } from "react";

export type VerificationState =
  | "code-entry"
  | "invalid"
  | "expired"
  | "too-many-attempts"
  | "resending"
  | "resend-cooldown"
  | "verifying"
  | "verified"
  | "server-error";

/** Words for every state. Nothing here is communicated by colour alone. */
const STATE_MESSAGE: Partial<Record<VerificationState, string>> = {
  invalid: "That code is not correct. Check all 8 digits and try again.",
  expired: "That code has expired. Request a new one to continue.",
  "too-many-attempts": "Too many attempts. Request a new code before trying again.",
  verified: "Code verified.",
  "server-error": "The verification service is temporarily unavailable. Try again shortly.",
};

const FAILED_STATES: VerificationState[] = ["invalid", "expired", "too-many-attempts", "server-error"];

export function VerificationCodeField({
  value,
  onChange,
  state,
  serverMessage,
  onResend,
  resendAvailableIn,
  disabled,
}: {
  value: string;
  onChange: (next: string) => void;
  state: VerificationState;
  /** Server-supplied copy, preferred over the generic message when present. */
  serverMessage?: string;
  onResend: () => void;
  /** Seconds remaining before a resend is allowed. 0 means resend is available. */
  resendAvailableIn: number;
  disabled?: boolean;
}) {
  const inputId = useId();
  const hintId = `${inputId}-hint`;
  const errorId = `${inputId}-error`;
  const inputRef = useRef<HTMLInputElement>(null);
  const failed = FAILED_STATES.includes(state);
  const message = serverMessage || STATE_MESSAGE[state] || "";

  // Focus the field when it becomes the thing that needs correcting, so keyboard
  // and screen-reader users are not left hunting for the invalid input.
  useEffect(() => {
    if (failed) inputRef.current?.focus();
  }, [failed, state]);

  const busy = state === "verifying" || state === "resending";

  return (
    <div className="account-code-field">
      <label htmlFor={inputId}>
        8-digit verification code
        <input
          id={inputId}
          ref={inputRef}
          required
          inputMode="numeric"
          autoComplete="one-time-code"
          spellCheck={false}
          autoCorrect="off"
          autoCapitalize="off"
          pattern="[0-9]{8}"
          minLength={8}
          maxLength={8}
          value={value}
          disabled={disabled || busy}
          aria-invalid={failed}
          aria-describedby={message ? `${hintId} ${errorId}` : hintId}
          onChange={(event) => onChange(event.target.value.replace(/\D/gu, "").slice(0, 8))}
        />
      </label>

      <small id={hintId}>
        Enter all 8 digits. A leading zero is part of the code. Codes expire, and requesting a new one
        invalidates the previous code.
      </small>

      {message && (
        <p
          id={errorId}
          role={failed ? "alert" : "status"}
          aria-live={failed ? "assertive" : "polite"}
          className={failed ? "account-code-error" : "account-code-ok"}
        >
          {failed ? "Problem: " : ""}{message}
        </p>
      )}

      <div className="account-code-resend">
        <button
          type="button"
          onClick={onResend}
          disabled={disabled || busy || resendAvailableIn > 0}
        >
          {state === "resending"
            ? "Sending a new code…"
            : resendAvailableIn > 0
              ? `Resend available in ${resendAvailableIn}s`
              : "Send a new code"}
        </button>
      </div>
    </div>
  );
}
