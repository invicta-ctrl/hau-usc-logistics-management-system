import { useState, type FormEvent } from "react";
import {
  FrontendApiError,
  frontendBackend,
  type AccountApplicationStatus,
} from "../../integration/backend";

type Mode = "apply" | "status";
type ApplyStep = "email" | "code" | "application" | "receipt";

const ACCESS_PRESETS = [
  { id: "REQUESTER_ONLY", label: "Requester only", roleId: "REQUESTER", committeeIds: [], workspaceIds: [], internalLendingOperations: false },
  { id: "FOOD_OPERATOR", label: "Food Committee staff", roleId: "DOL_STAFF", committeeIds: ["COM_FOOD"], workspaceIds: ["food"], internalLendingOperations: false },
  { id: "INVENTORY_OPERATOR", label: "Inventory and Pantry staff", roleId: "DOL_STAFF", committeeIds: ["COM_INVENTORY_PANTRY"], workspaceIds: ["inventory-pantry"], internalLendingOperations: false },
  { id: "MATERIALS_OPERATOR", label: "Materials Committee staff", roleId: "DOL_STAFF", committeeIds: ["COM_MATERIALS"], workspaceIds: ["materials"], internalLendingOperations: false },
  { id: "LENDING_STAFF", label: "Internal Lending staff", roleId: "DOL_STAFF", committeeIds: ["COM_INVENTORY_PANTRY"], workspaceIds: ["inventory-pantry"], internalLendingOperations: true },
] as const;

const WITHDRAWABLE = new Set([
  "EMAIL_UNVERIFIED", "DRAFT", "PENDING_ADMIN_REVIEW", "CHANGES_REQUESTED",
  "PENDING_DIRECTOR_APPROVAL", "APPROVED_ACTIVATION_REQUIRED",
]);

const messageFor = (error: unknown) => error instanceof FrontendApiError
  ? error.message
  : "The account-application service is temporarily unavailable.";

const requestId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export function AccountAccessPanel({ initialMode = "apply", onClose }: { initialMode?: Mode; onClose: () => void }) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [applyStep, setApplyStep] = useState<ApplyStep>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [verificationReceipt, setVerificationReceipt] = useState("");
  const [statusToken, setStatusToken] = useState("");
  const [application, setApplication] = useState<AccountApplicationStatus | null>(null);
  const [withdrawReason, setWithdrawReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const switchMode = (next: Mode) => {
    setMode(next);
    setError("");
    setNotice("");
    setApplication(null);
  };

  async function startEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const result = await frontendBackend.startAccountApplicationEmail(email.trim());
      setNotice(`If the address is eligible, an 8-digit code was sent. Retry after ${result.nextAttemptAt || "the resend interval"}.`);
      setApplyStep("code");
    } catch (nextError) {
      setError(messageFor(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function confirmEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !/^\d{8}$/u.test(code)) {
      setError("Enter the exact 8-digit verification code, including any leading zero.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await frontendBackend.confirmAccountApplicationEmail(email.trim(), code);
      setVerificationReceipt(result.verificationReceipt);
      setCode("");
      setApplyStep("application");
      setNotice("Email ownership confirmed for this application session.");
    } catch (nextError) {
      setError(messageFor(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function submitApplication(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    const preset = ACCESS_PRESETS.find((entry) => entry.id === values.get("accessPreset"));
    if (!preset || values.get("password") !== values.get("confirmPassword")) {
      setError("Choose a valid access preset and make sure both passwords match.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await frontendBackend.submitAccountApplication({
        clientRequestId: requestId("application-submit"),
        verificationReceipt,
        legalName: values.get("legalName"),
        contactNumber: values.get("contactNumber"),
        departmentId: values.get("departmentId"),
        courseId: values.get("courseId"),
        yearLevel: Number(values.get("yearLevel")),
        requestedUsername: values.get("requestedUsername"),
        requestedAccountType: preset.id,
        requestedRoleId: preset.roleId,
        requestedCommitteeIds: preset.committeeIds,
        requestedWorkspaceIds: preset.workspaceIds,
        lendingSelfService: values.get("lendingSelfService") === "on",
        internalLendingOperations: preset.internalLendingOperations,
        requestCenterAccess: values.get("requestCenterAccess") === "on",
        password: values.get("password"),
        confirmPassword: values.get("confirmPassword"),
      });
      setVerificationReceipt("");
      setStatusToken(result.statusToken || "");
      setApplication(result);
      setApplyStep("receipt");
      setNotice("The service confirmed the application submission.");
    } catch (nextError) {
      setError(messageFor(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function loadStatus(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    if (busy || !statusToken.trim()) {
      setError("Enter the private status token from the application receipt.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      setApplication(await frontendBackend.accountApplicationStatus(statusToken.trim()));
      setNotice("Status loaded from the account-application service.");
    } catch (nextError) {
      setApplication(null);
      setError(messageFor(nextError));
    } finally {
      setBusy(false);
    }
  }

  async function withdraw() {
    if (!application || busy || !withdrawReason.trim()) {
      setError("Enter a reason before withdrawing this application.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const result = await frontendBackend.withdrawAccountApplication(statusToken.trim(), {
        expectedRevision: application.revision,
        reason: withdrawReason.trim(),
        clientRequestId: requestId("application-withdraw"),
      });
      setApplication(result);
      setWithdrawReason("");
      setNotice("The service confirmed the withdrawal.");
    } catch (nextError) {
      setError(messageFor(nextError));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="account-access-panel" aria-busy={busy}>
      <style>{`
        .account-access-panel{display:flex;flex-direction:column;gap:22px;color:#241416;font-family:"IBM Plex Sans",system-ui,sans-serif}
        .account-access-tabs{display:grid;grid-template-columns:1fr 1fr;gap:8px}
        .account-access-tabs button,.account-close,.account-access-form button{min-height:42px;padding:10px 14px;border:1px solid #d1b478;border-radius:10px;color:#610b0f}
        .account-access-tabs button[aria-selected="true"],.account-primary{background:#e8b93c!important;color:#40070a!important;border-color:#d1b478!important;font-weight:650}
        .account-access-form{display:flex;flex-direction:column;gap:14px}
        .account-access-form h2{font-family:"Bricolage Grotesque",system-ui,sans-serif;font-size:24px;font-weight:700;letter-spacing:-.6px}
        .account-access-form p,.account-access-form small{color:#6f5a60;font-size:12px;line-height:1.55}
        .account-access-form label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:550}
        .account-access-form input,.account-access-form select,.account-access-form textarea{min-height:44px;padding:10px 12px;border:1px solid #d1b478;border-radius:10px;background:#fff7e6;color:#241416;font:inherit}
        .account-access-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
        .account-access-form .account-check{display:grid;grid-template-columns:22px 1fr;align-items:start;font-weight:400;line-height:1.45}
        .account-access-form .account-check input{min-height:20px;width:20px;padding:0}
        .account-status-card{display:grid;gap:8px;padding:16px;border:1px solid #d1b478;border-radius:12px;background:#f7f0e2}
        .account-status-card p{display:flex;justify-content:space-between;gap:16px;font-size:12px}.account-status-card span{color:#6f5a60}
        .account-token-warning{display:block!important;color:#9c2630!important}.account-status-token{overflow-wrap:anywhere;padding:10px;border-radius:8px;background:#fffdf8}
        @media(max-width:640px){.account-access-grid{grid-template-columns:1fr}.account-access-tabs{grid-template-columns:1fr}}
      `}</style>
      <div className="account-access-tabs" role="tablist" aria-label="Account access">
        <button type="button" role="tab" aria-selected={mode === "apply"} onClick={() => switchMode("apply")}>Apply for access</button>
        <button type="button" role="tab" aria-selected={mode === "status"} onClick={() => switchMode("status")}>Application status</button>
      </div>

      {error && <p className="auth-gate-status" data-state="service-error" role="alert">{error}</p>}
      {notice && <p className="auth-gate-status" data-state="authorized" role="status">{notice}</p>}

      {mode === "apply" && applyStep === "email" && <form className="account-access-form" onSubmit={startEmail}>
        <h2>Create a staff account</h2>
        <p>Verification confirms email ownership. It does not grant staff access.</p>
        <label>Approved email address<input required type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <small>The response is the same whether or not an address is already known.</small>
        <button className="account-primary" disabled={busy}>{busy ? "Sending…" : "Send verification code"}</button>
      </form>}

      {mode === "apply" && applyStep === "code" && <form className="account-access-form" onSubmit={confirmEmail}>
        <h2>Enter verification code</h2>
        <label>8-digit verification code<input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{8}" minLength={8} maxLength={8} value={code} onChange={(event) => setCode(event.target.value)} /></label>
        <small>Enter all 8 digits. A leading zero is part of the code. Codes expire and a resend invalidates the previous code.</small>
        <button className="account-primary" disabled={busy}>{busy ? "Confirming…" : "Confirm email"}</button>
        <button type="button" onClick={() => { setApplyStep("email"); setCode(""); setError(""); }}>Use a different email</button>
      </form>}

      {mode === "apply" && applyStep === "application" && <form className="account-access-form" onSubmit={submitApplication}>
        <h2>Staff account application</h2>
        <div className="account-access-grid">
          <label>Full legal name<input name="legalName" autoComplete="name" maxLength={200} required /></label>
          <label>Contact number<input name="contactNumber" autoComplete="tel" maxLength={24} required /></label>
          <label>USC department ID<input name="departmentId" maxLength={128} required /></label>
          <label>Course ID<input name="courseId" maxLength={128} required /></label>
          <label>Year level<select name="yearLevel" required defaultValue=""><option value="">Select year</option>{Array.from({ length: 10 }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</select></label>
          <label>Requested username<input name="requestedUsername" autoComplete="username" minLength={4} maxLength={32} pattern="[a-z0-9](?:[a-z0-9]|[._-](?=[a-z0-9])){2,30}[a-z0-9]" required /></label>
        </div>
        <label>Access preset<select name="accessPreset" required>{ACCESS_PRESETS.map((preset) => <option key={preset.id} value={preset.id}>{preset.label}</option>)}</select></label>
        <label className="account-check"><input name="lendingSelfService" type="checkbox" /> Request Lending self-service</label>
        <label className="account-check"><input name="requestCenterAccess" type="checkbox" defaultChecked /> Request Center access</label>
        <div className="account-access-grid">
          <label>Password<input name="password" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
          <label>Confirm password<input name="confirmPassword" type="password" autoComplete="new-password" minLength={12} maxLength={128} required /></label>
        </div>
        <label className="account-check"><input type="checkbox" required /> I confirm these details are accurate and accept the privacy and acceptable-use requirements.</label>
        <button className="account-primary" disabled={busy}>{busy ? "Submitting…" : "Submit application for review"}</button>
      </form>}

      {mode === "apply" && applyStep === "receipt" && application && <ApplicationStatusCard application={application} statusToken={statusToken} />}

      {mode === "status" && <>
        <form className="account-access-form" onSubmit={loadStatus}>
          <h2>Check application status</h2>
          <p>The token stays in page memory and is sent only as an authorization header.</p>
          <label>Private status token<input type="password" autoComplete="off" minLength={20} maxLength={512} required value={statusToken} onChange={(event) => setStatusToken(event.target.value)} /></label>
          <button className="account-primary" disabled={busy}>{busy ? "Checking…" : "Check status"}</button>
        </form>
        {application && <>
          <ApplicationStatusCard application={application} />
          {WITHDRAWABLE.has(application.state) && <div className="account-access-form">
            <label>Withdrawal reason<textarea value={withdrawReason} onChange={(event) => setWithdrawReason(event.target.value)} /></label>
            <button type="button" disabled={busy} onClick={() => void withdraw()}>Withdraw application</button>
          </div>}
        </>}
      </>}

      <button type="button" className="account-close" onClick={onClose}>Return to staff sign in</button>
    </section>
  );
}

function ApplicationStatusCard({ application, statusToken = "" }: { application: AccountApplicationStatus; statusToken?: string }) {
  return <div className="account-status-card" role="status">
    <p><span>Application reference</span><strong>{application.applicationCode}</strong></p>
    <p><span>Current status</span><strong>{application.state.replaceAll("_", " ")}</strong></p>
    <p><span>Revision</span><strong>{application.revision}</strong></p>
    {application.nextStep && <p><span>Next step</span><strong>{application.nextStep}</strong></p>}
    {application.changeRequestSummary && <p><span>Requested changes</span><strong>{application.changeRequestSummary}</strong></p>}
    {application.accountCode && <p><span>Account code</span><strong>{application.accountCode}</strong></p>}
    {statusToken && <>
      <p className="account-token-warning">Save this private status token now. It cannot be recovered and should not be shared.</p>
      <code className="account-status-token">{statusToken}</code>
    </>}
  </div>;
}
