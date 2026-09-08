import { useEffect, useRef, useState } from 'react';
import {
  FrontendApiError,
  type FrontendAdminResetAccount,
  type FrontendAdminResetTemporaryPasswordCommand,
  type FrontendAdminResetTemporaryPasswordReceipt,
} from '../../integration/backend';

type Notice = { tone: 'error' | 'success' | 'warning'; message: string } | null;
type Phase = 'ready' | 'sending' | 'uncertain' | 'refresh-needed' | 'receipt';

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The server did not return a usable response.';
}

function knownRejection(error: unknown) {
  return error instanceof FrontendApiError && error.status >= 400 && error.status < 500;
}

function clientRequestId() {
  return `admin-reset-${globalThis.crypto.randomUUID()}`;
}

export function TemporaryPasswordResetPanel({
  account,
  enabled,
  onReset,
  onRefresh,
  onLockChange,
}: {
  account: FrontendAdminResetAccount | null;
  enabled: boolean;
  onReset: (command: FrontendAdminResetTemporaryPasswordCommand) => Promise<FrontendAdminResetTemporaryPasswordReceipt>;
  onRefresh: () => Promise<void>;
  onLockChange: (locked: boolean) => void;
}) {
  const [currentAccessId, setCurrentAccessId] = useState('');
  const [confirmCurrentAccessId, setConfirmCurrentAccessId] = useState('');
  const [reason, setReason] = useState('');
  const [phase, setPhase] = useState<Phase>('ready');
  const [notice, setNotice] = useState<Notice>(null);
  const [receipt, setReceipt] = useState<FrontendAdminResetTemporaryPasswordReceipt | null>(null);
  const pendingRef = useRef(false);
  const snapshotRef = useRef<FrontendAdminResetTemporaryPasswordCommand | null>(null);
  const selectionRef = useRef<string | null>(account?.accountId ?? null);

  const clearLocalState = () => {
    pendingRef.current = false;
    snapshotRef.current = null;
    setCurrentAccessId('');
    setConfirmCurrentAccessId('');
    setReason('');
    setReceipt(null);
    setNotice(null);
    setPhase('ready');
  };
  const clearCredentialOnly = () => {
    setReceipt((current) => (current ? { ...current, credential: null } : null));
  };

  useEffect(() => {
    selectionRef.current = account?.accountId ?? null;
    clearLocalState();
  }, [account?.accountId]);

  useEffect(() => {
    const locked = ['sending', 'uncertain', 'refresh-needed'].includes(phase);
    onLockChange(locked);
    return () => onLockChange(false);
  }, [onLockChange, phase]);

  useEffect(
    () => () => {
      pendingRef.current = false;
      snapshotRef.current = null;
    },
    [],
  );

  if (!enabled || !account) return null;

  const locked = phase !== 'ready';
  const validate = () => {
    if (currentAccessId.trim() !== account.accessId || confirmCurrentAccessId.trim() !== account.accessId) {
      return 'Type the selected account access ID in both confirmation fields.';
    }
    const trimmedReason = reason.trim();
    if (trimmedReason.length < 8 || trimmedReason.length > 500) {
      return 'Provide a reset reason between 8 and 500 characters.';
    }
    return null;
  };

  const refreshAfterReceipt = async (savedReceipt: FrontendAdminResetTemporaryPasswordReceipt) => {
    try {
      await onRefresh();
      if (selectionRef.current !== savedReceipt.accountId) return;
      setReceipt(savedReceipt);
      setPhase('receipt');
      setNotice(
        savedReceipt.credentialUnavailable
          ? { tone: 'warning', message: 'The server confirmed the prior reset, but its one-time credential cannot be recovered.' }
          : { tone: 'success', message: 'The current account directory was refreshed after the reset.' },
      );
    } catch (error) {
      if (selectionRef.current !== savedReceipt.accountId) return;
      setReceipt(savedReceipt);
      setPhase('refresh-needed');
      setNotice({ tone: 'warning', message: `The reset was recorded, but the current account directory could not be refreshed: ${errorMessage(error)}` });
    }
  };

  const submit = async (captured?: FrontendAdminResetTemporaryPasswordCommand) => {
    if (pendingRef.current) return;
    const validationError = captured ? null : validate();
    if (validationError) {
      setNotice({ tone: 'error', message: validationError });
      return;
    }
    const command =
      captured ?? {
        accountId: account.accountId,
        expectedRevision: account.revision,
        currentAccessId: currentAccessId.trim(),
        confirmCurrentAccessId: confirmCurrentAccessId.trim(),
        reason: reason.trim(),
        clientRequestId: clientRequestId(),
      };
    snapshotRef.current = command;
    pendingRef.current = true;
    setPhase('sending');
    setNotice(null);
    try {
      const savedReceipt = await onReset(command);
      if (selectionRef.current !== command.accountId) return;
      await refreshAfterReceipt(savedReceipt);
    } catch (error) {
      if (selectionRef.current !== command.accountId) return;
      if (knownRejection(error)) {
        snapshotRef.current = null;
        setPhase('ready');
        setNotice({ tone: 'error', message: errorMessage(error) });
      } else {
        setPhase('uncertain');
        setNotice({ tone: 'warning', message: `The server did not confirm this reset. Retry the captured request before issuing another reset: ${errorMessage(error)}` });
      }
    } finally {
      pendingRef.current = false;
    }
  };

  return (
    <section className="administration-records-boundary mt-5" aria-labelledby="temporary-password-reset-title">
      <b>ONE-TIME CREDENTIAL · ACCESS ADMIN</b>
      <h3 id="temporary-password-reset-title">Reset temporary password</h3>
      <p>
        This revokes the account’s sessions and returns it to starter status. The temporary password is kept only in this open panel and cleared when dismissed or left.
      </p>
      {(phase === 'receipt' || phase === 'refresh-needed') && receipt?.credential ? (
        <section aria-label="One-time temporary credential" className="mt-4 rounded-lg border border-border p-3">
          <p role="status">Give this credential to {receipt.credential.accessId} through the approved private channel.</p>
          <label>
            Temporary password
            <input value={receipt.credential.temporaryPassword} readOnly autoComplete="off" />
          </label>
          {phase === 'receipt' ? <button type="button" onClick={clearLocalState}>Dismiss and clear credential</button> : null}
        </section>
      ) : phase === 'receipt' ? (
        <section className="mt-4" aria-label="Reset result">
          <p role="status">The reset result is complete. No temporary credential is available for replay.</p>
          <button type="button" onClick={clearLocalState}>Dismiss reset result</button>
        </section>
      ) : null}
      {phase === 'refresh-needed' ? (
        <div className="mt-4 flex flex-wrap gap-3">
          {receipt?.credential ? <button type="button" onClick={clearCredentialOnly}>Clear credential</button> : null}
          <button type="button" onClick={() => receipt && void refreshAfterReceipt(receipt)}>Reload current account directory</button>
        </div>
      ) : phase === 'uncertain' ? (
        <div className="mt-4 flex flex-wrap gap-3">
          <button type="button" onClick={() => snapshotRef.current && void submit(snapshotRef.current)}>Retry captured reset</button>
        </div>
      ) : phase === 'ready' || phase === 'sending' ? (
        <form
          className="mt-4 grid gap-3"
          aria-label="Reset selected account temporary password"
          onSubmit={(event) => {
            event.preventDefault();
            void submit();
          }}
        >
          <label>
            Current access ID
            <input value={currentAccessId} onChange={(event) => setCurrentAccessId(event.target.value)} disabled={locked} autoComplete="off" />
          </label>
          <label>
            Confirm current access ID
            <input value={confirmCurrentAccessId} onChange={(event) => setConfirmCurrentAccessId(event.target.value)} disabled={locked} autoComplete="off" />
          </label>
          <label>
            Reset reason
            <textarea value={reason} onChange={(event) => setReason(event.target.value)} disabled={locked} minLength={8} maxLength={500} />
          </label>
          <button type="submit" disabled={locked}>Reset selected account password</button>
        </form>
      ) : null}
      {notice ? <p role={notice.tone === 'error' ? 'alert' : 'status'} aria-live="polite" className="mt-3">{notice.message}</p> : null}
    </section>
  );
}
