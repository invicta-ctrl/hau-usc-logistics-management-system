import React, { useEffect, useState } from "react";
import {
  FrontendApiError,
  frontendBackend,
  type FrontendAdminAccount,
  type FrontendBrandAssetSlot,
  type FrontendReferenceLink,
  type FrontendStaffActivityHistory,
  type FrontendStaffDirectoryItem,
  type FrontendSystemStatus,
} from "../integration/backend";
import {
  uscLogo,
  dolLogo,
  combinedLockup,
  loginBackground,
  favicon,
  defaultItemImage,
} from "../../ProductionAssets";
import { scopeRouteCss } from "./routeStyleScope";
type Tab =
  | "Accounts & access"
  | "Staff directory"
  | "Reference administration"
  | "Link registry"
  | "Brand & media"
  | "System status"
  | "Activity";
type Prev =
  | "Populated"
  | "Loading"
  | "Empty"
  | "Filtered empty"
  | "Pending activation"
  | "Denied"
  | "Outdated record"
  | "Validation error"
  | "Unavailable"
  | "Save checked";
const tabs: Tab[] = [
  "Accounts & access",
  "Staff directory",
  "Reference administration",
  "Link registry",
  "Brand & media",
  "System status",
  "Activity",
];
type Fi10Tab = "Accounts & access" | "Staff directory" | "Activity";
type Fi11Tab = "Reference administration" | "Link registry" | "Brand & media" | "System status";
type AdminTab = Fi10Tab | Fi11Tab;
type Fi10LoadState = "loading" | "ready" | "denied" | "unavailable";
type Fi10PreviewState = "Populated" | "Loading" | "Empty" | "Denied" | "Unavailable";

const fi10Tabs: Fi10Tab[] = ["Accounts & access", "Staff directory", "Activity"];
const fi11Tabs: Fi11Tab[] = ["Reference administration", "Link registry", "Brand & media", "System status"];
const administrationTabs: AdminTab[] = [...fi10Tabs, ...fi11Tabs];
const previewAccounts: FrontendAdminAccount[] = [
  {
    accessId: "SANITIZED-ACCOUNT-A",
    displayName: "Sample account",
    roleId: "WITHHELD_IN_PREVIEW",
    status: "PREVIEW_ONLY",
    firstLoginPending: false,
    locked: false,
  },
  {
    accessId: "SANITIZED-ACCOUNT-B",
    displayName: "Sample account",
    roleId: "WITHHELD_IN_PREVIEW",
    status: "PREVIEW_ONLY",
    firstLoginPending: false,
    locked: false,
  },
];
const previewDirectory: FrontendStaffDirectoryItem[] = [
  {
    opaquePersonId: "preview-fi10-person-a",
    displayName: null,
    accessId: null,
    linkState: "PREVIEW_ONLY",
    emailState: "NOT_EXPOSED",
    assignmentSummary: {
      activeCount: 0,
      historicalCount: 0,
      quarantinedCount: 0,
      provenanceState: "PREVIEW_ONLY",
    },
  },
  {
    opaquePersonId: "preview-fi10-person-b",
    displayName: null,
    accessId: null,
    linkState: "PREVIEW_ONLY",
    emailState: "NOT_EXPOSED",
    assignmentSummary: {
      activeCount: 0,
      historicalCount: 0,
      quarantinedCount: 0,
      provenanceState: "PREVIEW_ONLY",
    },
  },
];
const previewReferenceLinks: FrontendReferenceLink[] = [
  {
    label: "Sanitized governed destination",
    destination: "/preview/reference",
    linkType: "INTERNAL",
    audience: "PREVIEW_ONLY",
    status: "PREVIEW_ONLY",
    syncState: "NOT_LIVE",
    updatedAt: "",
    archivedAt: "",
  },
];
const previewBrandSlots: FrontendBrandAssetSlot[] = [
  {
    label: "Sanitized brand slot",
    publicPath: "/brand/preview-only",
    publicationState: "NOT_PUBLISHED",
    publishedAt: "",
  },
];
const previewSystemStatus: FrontendSystemStatus = {
  technicalResponse: "RESPONSE_RECEIVED",
  readiness: "NOT_REPORTED_READY",
  playground: null,
};

function humanize(value: string) {
  return value
    ? value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not reported";
}

function dateLabel(value: string) {
  if (!value) return "Not reported";
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat("en-PH", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
}

export default function AdministrationRoute({
  dark,
  navigate,
  inspection = false,
  accessAllowed = true,
  capabilities = [],
}: {
  dark: boolean;
  navigate?: (r: string) => void;
  /** A4-only inspection mode. It never requests protected administration data. */
  inspection?: boolean;
  /** Presentation aid only; the Worker still enforces access.admin independently. */
  accessAllowed?: boolean;
  /** Presentation gates only; each server endpoint remains independently authoritative. */
  capabilities?: readonly string[];
}) {
  const [tab, setTab] = useState<AdminTab>("Accounts & access");
  const [previewState, setPreviewState] = useState<Fi10PreviewState>("Populated");
  const [accountState, setAccountState] = useState<Fi10LoadState>(inspection ? "ready" : "loading");
  const [directoryState, setDirectoryState] = useState<Fi10LoadState>(inspection ? "ready" : "loading");
  const [accounts, setAccounts] = useState<FrontendAdminAccount[]>(inspection ? previewAccounts : []);
  const [directory, setDirectory] = useState<FrontendStaffDirectoryItem[]>(
    inspection ? previewDirectory : [],
  );
  const [selectedAccount, setSelectedAccount] = useState<FrontendAdminAccount | null>(
    inspection ? previewAccounts[0] : null,
  );
  const [selectedStaff, setSelectedStaff] = useState<FrontendStaffDirectoryItem | null>(null);
  const [activity, setActivity] = useState<FrontendStaffActivityHistory | null>(null);
  const [activityState, setActivityState] = useState<Fi10LoadState | "selection">("selection");
  const [reloadKey, setReloadKey] = useState(0);
  const [activityReloadKey, setActivityReloadKey] = useState(0);
  const [referenceLinks, setReferenceLinks] = useState<FrontendReferenceLink[]>([]);
  const [referenceState, setReferenceState] = useState<Fi10LoadState>(inspection ? "ready" : "loading");
  const [brandSlots, setBrandSlots] = useState<FrontendBrandAssetSlot[]>([]);
  const [brandState, setBrandState] = useState<Fi10LoadState>(inspection ? "ready" : "loading");
  const [systemStatus, setSystemStatus] = useState<FrontendSystemStatus | null>(null);
  const [systemState, setSystemState] = useState<Fi10LoadState>(inspection ? "ready" : "loading");
  const [resetConfirmation, setResetConfirmation] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetNotice, setResetNotice] = useState("");
  const [fi11ReloadKey, setFi11ReloadKey] = useState(0);
  const hasCapability = (capability: string) => inspection || capabilities.includes(capability);

  useEffect(() => {
    if (inspection) {
      setAccounts(previewAccounts);
      setDirectory(previewDirectory);
      setSelectedAccount(previewAccounts[0]);
      setAccountState("ready");
      setDirectoryState("ready");
      return;
    }
    if (!accessAllowed) {
      setAccountState("denied");
      setDirectoryState("denied");
      return;
    }
    const abort = new AbortController();
    setAccountState("loading");
    setDirectoryState("loading");
    void frontendBackend
      .adminAccountDirectory(abort.signal)
      .then((accountResult) => {
        if (abort.signal.aborted) return;
        setAccounts(accountResult.items);
        setSelectedAccount(accountResult.items[0] ?? null);
        setAccountState("ready");
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        setAccountState(error instanceof FrontendApiError && [401, 403].includes(error.status) ? "denied" : "unavailable");
      });
    void frontendBackend
      .staffDirectory(abort.signal)
      .then((directoryResult) => {
        if (abort.signal.aborted) return;
        setDirectory(directoryResult.items);
        setDirectoryState("ready");
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        setDirectoryState(error instanceof FrontendApiError && [401, 403].includes(error.status) ? "denied" : "unavailable");
      });
    return () => abort.abort();
  }, [accessAllowed, inspection, reloadKey]);

  useEffect(() => {
    if (inspection || tab !== "Activity" || !selectedStaff) {
      setActivity(null);
      setActivityState("selection");
      return;
    }
    const abort = new AbortController();
    setActivityState("loading");
    void frontendBackend
      .staffAccountActivityHistory(selectedStaff.opaquePersonId, abort.signal)
      .then((result) => {
        if (abort.signal.aborted) return;
        setActivity(result);
        setActivityState("ready");
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        setActivityState(error instanceof FrontendApiError && [401, 403].includes(error.status) ? "denied" : "unavailable");
      });
    return () => abort.abort();
  }, [activityReloadKey, inspection, selectedStaff, tab]);

  useEffect(() => {
    if (tab !== "Link registry") return;
    if (inspection) {
      setReferenceLinks(previewReferenceLinks);
      setReferenceState("ready");
      return;
    }
    if (!hasCapability("reference.manage")) {
      setReferenceState("denied");
      return;
    }
    const abort = new AbortController();
    setReferenceState("loading");
    void frontendBackend
      .referenceLinks(abort.signal)
      .then((items) => {
        if (abort.signal.aborted) return;
        setReferenceLinks(items);
        setReferenceState("ready");
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        setReferenceState(error instanceof FrontendApiError && [401, 403].includes(error.status) ? "denied" : "unavailable");
      });
    return () => abort.abort();
  }, [capabilities, fi11ReloadKey, inspection, tab]);

  useEffect(() => {
    if (tab !== "Brand & media") return;
    if (inspection) {
      setBrandSlots(previewBrandSlots);
      setBrandState("ready");
      return;
    }
    if (!hasCapability("brand.manage")) {
      setBrandState("denied");
      return;
    }
    const abort = new AbortController();
    setBrandState("loading");
    void frontendBackend
      .brandAssetSlots(abort.signal)
      .then((items) => {
        if (abort.signal.aborted) return;
        setBrandSlots(items);
        setBrandState("ready");
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        setBrandState(error instanceof FrontendApiError && [401, 403].includes(error.status) ? "denied" : "unavailable");
      });
    return () => abort.abort();
  }, [capabilities, fi11ReloadKey, inspection, tab]);

  useEffect(() => {
    if (tab !== "System status") return;
    if (inspection) {
      setSystemStatus(previewSystemStatus);
      setSystemState("ready");
      return;
    }
    if (!hasCapability("system.admin")) {
      setSystemState("denied");
      return;
    }
    const abort = new AbortController();
    setSystemState("loading");
    void frontendBackend
      .systemStatus(abort.signal)
      .then((status) => {
        if (abort.signal.aborted) return;
        setSystemStatus(status);
        setSystemState("ready");
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        setSystemState(error instanceof FrontendApiError && [401, 403].includes(error.status) ? "denied" : "unavailable");
      });
    return () => abort.abort();
  }, [capabilities, fi11ReloadKey, inspection, tab]);

  const visibleState: Fi10LoadState | "empty" =
    inspection
      ? previewState === "Loading"
        ? "loading"
        : previewState === "Denied"
          ? "denied"
          : previewState === "Unavailable"
            ? "unavailable"
            : previewState === "Empty"
              ? "empty"
              : "ready"
      : tab === "Accounts & access"
        ? accountState
        : directoryState;

  function retry() {
    if (inspection) {
      setPreviewState("Populated");
      return;
    }
    setReloadKey((value) => value + 1);
  }

  function reviewStaffActivity(staff: FrontendStaffDirectoryItem) {
    setSelectedStaff(staff);
    setTab("Activity");
  }

  function retryFi11() {
    if (inspection) {
      setPreviewState("Populated");
      return;
    }
    setFi11ReloadKey((value) => value + 1);
  }

  async function requestPlaygroundReset() {
    if (inspection || resetBusy || resetConfirmation !== "RESET PLAYGROUND") return;
    setResetBusy(true);
    setResetNotice("");
    try {
      const receipt = await frontendBackend.requestPlaygroundReset(resetConfirmation);
      setResetConfirmation("");
      setResetNotice(
        receipt.state === "RESETTING"
          ? "Reset request accepted. This session will be invalidated when the reset completes."
          : `Reset request accepted with state ${humanize(receipt.state)}.`,
      );
      setFi11ReloadKey((value) => value + 1);
    } catch (error) {
      setResetNotice(
        error instanceof FrontendApiError && error.status === 409
          ? "A Playground reset or baseline refresh is already in progress."
          : "The reset request was not accepted. No reset was started from this screen.",
      );
    } finally {
      setResetBusy(false);
    }
  }

  let content: React.ReactNode;
  const isFi10Tab = fi10Tabs.includes(tab as Fi10Tab);
  if (!isFi10Tab) {
    content = (
      <Fi11Panel
        tab={tab as Fi11Tab}
        inspection={inspection}
        previewState={previewState}
        links={referenceLinks}
        referenceState={referenceState}
        brandSlots={brandSlots}
        brandState={brandState}
        systemStatus={systemStatus}
        systemState={systemState}
        resetConfirmation={resetConfirmation}
        resetBusy={resetBusy}
        resetNotice={resetNotice}
        onResetConfirmationChange={setResetConfirmation}
        onRequestReset={requestPlaygroundReset}
        onRetry={retryFi11}
      />
    );
  } else if (visibleState === "loading") {
    content = <div className="skeleton" aria-busy="true" aria-label="Loading administration records" />;
  } else if (visibleState === "denied") {
    content = (
      <State
        k="Denied"
        h="Access administration is not available to your account"
        p="This message does not confirm whether an account or person exists."
      >
        <button className="primary" onClick={() => navigate?.("overview")}>
          Back to overview
        </button>
      </State>
    );
  } else if (visibleState === "unavailable") {
    content = (
      <State
        k="Unavailable"
        h="Administration records are temporarily unavailable"
        p="No account, staff, or activity record was changed."
      >
        <button className="primary" onClick={retry}>
          Retry read-only load
        </button>
      </State>
    );
  } else if (visibleState === "empty") {
    content = (
      <State
        k="Sanitized preview"
        h="No administration records are shown in this preview state"
              p="Inspection mode does not include staff roster or activity records."
      >
        <button className="primary" onClick={retry}>
                Restore sample data
        </button>
      </State>
    );
  } else {
    content = (
      <Fi10Panel
        tab={tab}
        accounts={accounts}
        directory={directory}
        selectedAccount={selectedAccount}
        selectedStaff={selectedStaff}
        activity={inspection ? null : activity}
        activityState={inspection ? "selection" : activityState}
        inspection={inspection}
        onSelectAccount={setSelectedAccount}
        onReviewActivity={reviewStaffActivity}
        onRetryActivity={() => setActivityReloadKey((value) => value + 1)}
      />
    );
  }

  return (
    <div className={"adm " + (dark ? "dark" : "light")} data-fi10-administration="true" data-fi11-administration="true">
      <style>{scopeRouteCss(".adm", css)}</style>
      {inspection ? (
        <section className="sandbox" data-fi10-inspection="true">
            <b>Inspection mode</b>
            <span>Sample data · Actions unavailable</span>
          <label>
            Preview state
            <select
              aria-label="Administration preview state"
              value={previewState}
              onChange={(event) => setPreviewState(event.target.value as Fi10PreviewState)}
            >
              {(["Populated", "Loading", "Empty", "Denied", "Unavailable"] as Fi10PreviewState[]).map((state) => (
                <option key={state}>{state}</option>
              ))}
            </select>
          </label>
        </section>
      ) : null}
      <header>
        <div>
          <p className="eye">Administration + governance</p>
          <h1>Authorized system controls</h1>
          <p>Review the current authorized records. Changes are available only in their assigned workflows.</p>
        </div>
            <small>{inspection ? "Sample data" : "Current authorized records"}</small>
      </header>
      <nav className="tabs" aria-label="Administration sections" data-fi10-tabs="true" data-fi11-tabs="true">
        {administrationTabs.map((item) => (
          <button
            className={tab === item ? "active" : ""}
            key={item}
            type="button"
            aria-current={tab === item ? "page" : undefined}
            onClick={() => setTab(item)}
          >
            {item}
          </button>
        ))}
      </nav>
      <select
        className="tab-select"
        value={tab}
        aria-label="Administration section"
        onChange={(event) => setTab(event.target.value as AdminTab)}
      >
        {administrationTabs.map((item) => (
          <option key={item}>{item}</option>
        ))}
      </select>
      {content}
    </div>
  );
}

function Fi10Panel({
  tab,
  accounts,
  directory,
  selectedAccount,
  selectedStaff,
  activity,
  activityState,
  inspection,
  onSelectAccount,
  onReviewActivity,
  onRetryActivity,
}: {
  tab: Fi10Tab;
  accounts: FrontendAdminAccount[];
  directory: FrontendStaffDirectoryItem[];
  selectedAccount: FrontendAdminAccount | null;
  selectedStaff: FrontendStaffDirectoryItem | null;
  activity: FrontendStaffActivityHistory | null;
  activityState: Fi10LoadState | "selection";
  inspection: boolean;
  onSelectAccount: (account: FrontendAdminAccount) => void;
  onReviewActivity: (staff: FrontendStaffDirectoryItem) => void;
  onRetryActivity: () => void;
}) {
  if (tab === "Accounts & access") {
    return (
      <div className="grid">
        <section className="plane">
          <div className="head">
            <div>
              <p className="eye">Account access</p>
              <h2>Assigned identity and access</h2>
            </div>
            <b>Current authorized records</b>
          </div>
          {accounts.length === 0 ? (
            <p className="note">No account records are available in the current response.</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Account</th>
                    <th scope="col">Access ID</th>
                    <th scope="col">Role</th>
                    <th scope="col">State</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map((account) => (
                    <tr key={account.accessId}>
                      <td>
                        <button className="row" type="button" onClick={() => onSelectAccount(account)}>
                          <b>{account.displayName}</b>
                          <span>Authorized display identity</span>
                        </button>
                      </td>
                      <td>{account.accessId}</td>
                      <td>{humanize(account.roleId)}</td>
                      <td>
                        <em>{account.locked ? "Locked" : account.firstLoginPending ? "Pending activation" : humanize(account.status)}</em>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="cards">
                {accounts.map((account) => (
                  <article key={account.accessId}>
                    <div>
                      <b>{account.displayName}</b>
                      <em>{account.locked ? "Locked" : humanize(account.status)}</em>
                    </div>
                    <p>{account.accessId} · {humanize(account.roleId)}</p>
                    <button className="primary" type="button" onClick={() => onSelectAccount(account)}>
                      Inspect account
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
        <aside className="detail">
          <p className="eye">Read-only account record</p>
          <h2>{selectedAccount?.displayName || "No account selected"}</h2>
          {selectedAccount ? (
            <dl>
              <div>
                <dt>Access ID</dt>
                <dd>{selectedAccount.accessId}</dd>
              </div>
              <div>
                <dt>Role</dt>
                <dd>{humanize(selectedAccount.roleId)}</dd>
              </div>
              <div>
                <dt>Account state</dt>
                <dd>{selectedAccount.locked ? "Locked" : humanize(selectedAccount.status)}</dd>
              </div>
              <div>
                <dt>Activation</dt>
                <dd>{selectedAccount.firstLoginPending ? "Pending activation" : "No pending activation reported"}</dd>
              </div>
            </dl>
          ) : (
            <p className="note">Select an account record to inspect the supported read-only fields.</p>
          )}
          <section className="gate">
            <b>Read-only account record</b>
            <p>Changes to access, roles, approval, or account state remain in their existing authorized workflow.</p>
            <button disabled type="button">Modify access unavailable</button>
          </section>
        </aside>
      </div>
    );
  }

  if (tab === "Staff directory") {
    return (
      <div className="grid">
        <section className="plane">
          <div className="head">
            <div>
              <p className="eye">Staff directory</p>
              <h2>Authorized staff records</h2>
            </div>
            <b>{inspection ? "Sample data" : "Protected identity fields"}</b>
          </div>
          {directory.length === 0 ? (
            <p className="note">No staff records are available for this account.</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th scope="col">Person</th>
                    <th scope="col">Access identity</th>
                    <th scope="col">Link state</th>
                    <th scope="col">Assignment summary</th>
                    <th scope="col">Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {directory.map((staff, index) => (
                    <tr key={staff.opaquePersonId}>
                      <td>{staff.displayName || "Identity withheld by directory policy"}</td>
                      <td>{staff.accessId || "Withheld"}</td>
                      <td><em>{humanize(staff.linkState)}</em></td>
                      <td>{staff.assignmentSummary.activeCount} current · {staff.assignmentSummary.historicalCount} retained</td>
                      <td>
                        <button
                          className="row"
                          type="button"
                          aria-label={"Review activity for directory record " + (index + 1)}
                          onClick={() => onReviewActivity(staff)}
                        >
                          <b>Review activity</b>
                          <span>Read-only retained history</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="cards">
                {directory.map((staff, index) => (
                  <article key={staff.opaquePersonId}>
                    <div>
                      <b>{staff.displayName || "Identity withheld by directory policy"}</b>
                      <em>{humanize(staff.linkState)}</em>
                    </div>
                    <p>{staff.accessId || "Access identity withheld"} · {staff.assignmentSummary.activeCount} current assignment(s)</p>
                    <button
                      className="primary"
                      type="button"
                      aria-label={"Review activity for directory record " + (index + 1)}
                      onClick={() => onReviewActivity(staff)}
                    >
                      Review activity
                    </button>
                  </article>
                ))}
              </div>
            </>
          )}
        </section>
        <aside className="detail">
          <p className="eye">Directory privacy</p>
          <h2>{selectedStaff?.displayName || "Select a staff record"}</h2>
          {selectedStaff ? (
            <dl>
              <div>
                <dt>Access identity</dt>
                <dd>{selectedStaff.accessId || "Withheld by directory policy"}</dd>
              </div>
              <div>
                <dt>Link state</dt>
                <dd>{humanize(selectedStaff.linkState)}</dd>
              </div>
              <div>
                <dt>Email state</dt>
                <dd>{humanize(selectedStaff.emailState)}</dd>
              </div>
              <div>
                <dt>Assignment provenance</dt>
                <dd>{humanize(selectedStaff.assignmentSummary.provenanceState)}</dd>
              </div>
            </dl>
          ) : (
            <p className="note">Select a record to review retained activity without exposing protected identifiers.</p>
          )}
          <section className="gate">
            <b>PRIVACY-BOUND · READ-ONLY</b>
            <p>Contact details, birthdays, raw person identifiers, and roster editing are not exposed here.</p>
            <button disabled type="button">Edit directory unavailable</button>
          </section>
        </aside>
      </div>
    );
  }

  return (
    <section className="plane" data-fi10-activity="true">
      <div className="head">
        <div>
          <p className="eye">Append-only activity</p>
          <h2>Retained staff account activity</h2>
        </div>
        <b>{inspection ? "Sanitized preview · no live history" : "One row per retained event"}</b>
      </div>
      {inspection ? (
              <p className="note">Staff activity is unavailable in inspection mode. Use Administration to review authorized account activity.</p>
      ) : !selectedStaff || activityState === "selection" ? (
        <p className="note">Select a staff directory record to review its retained activity.</p>
      ) : activityState === "loading" ? (
        <div className="skeleton" aria-busy="true" aria-label="Loading selected staff activity" />
      ) : activityState === "denied" ? (
        <State
          k="Denied"
          h="Activity history is not available to your account"
          p="This message does not confirm whether an activity record exists."
        >
          <button className="primary" type="button" onClick={onRetryActivity}>Retry read-only load</button>
        </State>
      ) : activityState === "unavailable" ? (
        <State
          k="Unavailable"
          h="Retained activity is temporarily unavailable"
          p="No history was changed or removed."
        >
          <button className="primary" type="button" onClick={onRetryActivity}>Retry read-only load</button>
        </State>
      ) : !activity || activity.items.length === 0 ? (
        <p className="note">No retained activity is available in the current response. The history remains append-only and read-only.</p>
      ) : (
        <>
          <table>
            <thead>
              <tr>
                <th scope="col">Occurred</th>
                <th scope="col">Event</th>
                <th scope="col">Action</th>
                <th scope="col">State transition</th>
                <th scope="col">Effective window</th>
              </tr>
            </thead>
            <tbody>
              {activity.items.map((entry, index) => (
                <tr key={entry.occurredAt + entry.eventType + entry.actionCode + index}>
                  <td>{dateLabel(entry.occurredAt)}</td>
                  <td>{humanize(entry.eventType)}</td>
                  <td>{humanize(entry.actionCode)}</td>
                  <td>{humanize(entry.previousLinkState || entry.previousAssignmentState)} → {humanize(entry.linkState || entry.assignmentState)}</td>
                  <td>{dateLabel(entry.newEffectiveFrom || entry.oldEffectiveFrom)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cards">
            {activity.items.map((entry, index) => (
              <article key={entry.occurredAt + entry.eventType + entry.actionCode + index}>
                <div>
                  <b>{humanize(entry.actionCode)}</b>
                  <em>{humanize(entry.eventType)}</em>
                </div>
                <p>{dateLabel(entry.occurredAt)} · {humanize(entry.linkState || entry.assignmentState)}</p>
              </article>
            ))}
          </div>
        </>
      )}
      <p className="note">This view includes only authorized activity details.</p>
    </section>
  );
}

function Fi11Panel({
  tab,
  inspection,
  previewState,
  links,
  referenceState,
  brandSlots,
  brandState,
  systemStatus,
  systemState,
  resetConfirmation,
  resetBusy,
  resetNotice,
  onResetConfirmationChange,
  onRequestReset,
  onRetry,
}: {
  tab: Fi11Tab;
  inspection: boolean;
  previewState: Fi10PreviewState;
  links: FrontendReferenceLink[];
  referenceState: Fi10LoadState;
  brandSlots: FrontendBrandAssetSlot[];
  brandState: Fi10LoadState;
  systemStatus: FrontendSystemStatus | null;
  systemState: Fi10LoadState;
  resetConfirmation: string;
  resetBusy: boolean;
  resetNotice: string;
  onResetConfirmationChange: (value: string) => void;
  onRequestReset: () => void;
  onRetry: () => void;
}) {
  const fixtureState: Fi10LoadState | 'empty' =
    previewState === 'Loading'
      ? 'loading'
      : previewState === 'Denied'
        ? 'denied'
        : previewState === 'Unavailable'
          ? 'unavailable'
          : previewState === 'Empty'
            ? 'empty'
            : 'ready';
  const state = inspection ? fixtureState : tab === 'Link registry' ? referenceState : tab === 'Brand & media' ? brandState : tab === 'System status' ? systemState : 'ready';

  if (state === 'loading') {
    return <div className="skeleton" aria-busy="true" aria-label={`Loading ${tab.toLowerCase()} records`} />;
  }
  if (state === 'denied') {
    return (
      <State
        k="Denied"
        h={`${tab} is not available to your account`}
        p="This message does not confirm whether protected records or technical detail exist."
      />
    );
  }
  if (state === 'unavailable') {
    return (
      <State
        k="Unavailable"
        h={`${tab} is temporarily unavailable`}
        p="No operational record was changed."
      >
        <button className="primary" type="button" onClick={onRetry}>Retry read-only load</button>
      </State>
    );
  }
  if (state === 'empty') {
    return (
      <State
        k="Sanitized preview"
        h={`No ${tab.toLowerCase()} records are shown in this preview state`}
        p="Inspection mode does not include protected or current technical data."
      >
          <button className="primary" type="button" onClick={onRetry}>Restore sample data</button>
      </State>
    );
  }

  if (tab === 'Reference administration') {
    return (
      <section className="plane" data-fi11-reference-administration="true">
        <div className="head">
          <div>
            <p className="eye">Reference administration</p>
            <h2>Reference sets are unavailable</h2>
          </div>
          <b>Records unavailable</b>
        </div>
        <p className="note">
          This page does not include reference-set records. The Link Registry separately lists the available approved destinations.
        </p>
        <section className="gate">
          <b>READ-ONLY · NO REFERENCE-SET MUTATION</b>
          <p>Reference-set changes are not available from this page.</p>
          <button type="button" disabled>Reference-set actions unavailable</button>
        </section>
      </section>
    );
  }

  if (tab === 'Link registry') {
    return (
      <section className="plane" data-fi11-link-registry="true">
        <div className="head">
          <div>
            <p className="eye">Governed destinations</p>
            <h2>Link Registry</h2>
          </div>
          <b>{inspection ? 'Sample data · actions unavailable' : 'Current authorized records'}</b>
        </div>
        {links.length === 0 ? (
          <p className="note">No governed destinations are available in the current response.</p>
        ) : (
          <>
            <table>
              <thead>
                <tr><th scope="col">Label</th><th scope="col">Destination</th><th scope="col">Audience</th><th scope="col">State</th><th scope="col">Verification</th></tr>
              </thead>
              <tbody>
                {links.map((link, index) => (
                  <tr key={`${link.label}-${index}`}>
                    <td><b>{link.label}</b><br /><span>{humanize(link.linkType)}</span></td>
                    <td>{link.destination}</td>
                    <td>{humanize(link.audience)}</td>
                    <td><em>{humanize(link.status)}</em></td>
                    <td>{humanize(link.syncState)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="cards">
              {links.map((link, index) => (
                <article key={`${link.label}-card-${index}`}>
                  <div><b>{link.label}</b><em>{humanize(link.status)}</em></div>
                  <p>{link.destination}</p>
                  <p>{humanize(link.audience)} · {humanize(link.syncState)}</p>
                </article>
              ))}
            </div>
          </>
        )}
        <p className="note">Internal link identifiers are not shown.</p>
      </section>
    );
  }

  if (tab === 'Brand & media') {
    return (
      <section className="plane" data-fi11-brand-media="true">
        <div className="head">
          <div>
            <p className="eye">Governed brand media</p>
            <h2>Published public asset references</h2>
          </div>
          <b>{inspection ? 'Sample data · actions unavailable' : 'Current brand assets'}</b>
        </div>
        {brandSlots.length === 0 ? (
          <p className="note">No public brand asset slots are available in the current response.</p>
        ) : (
          <>
            <table>
              <thead><tr><th scope="col">Slot</th><th scope="col">Public path</th><th scope="col">Publication state</th><th scope="col">Published</th></tr></thead>
              <tbody>
                {brandSlots.map((slot, index) => (
                  <tr key={`${slot.label}-${index}`}>
                    <td><b>{slot.label}</b></td>
                    <td>{slot.publicPath}</td>
                    <td><em>{humanize(slot.publicationState)}</em></td>
                    <td>{dateLabel(slot.publishedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="cards">
              {brandSlots.map((slot, index) => (
                <article key={`${slot.label}-card-${index}`}>
                  <div><b>{slot.label}</b><em>{humanize(slot.publicationState)}</em></div>
                  <p>{slot.publicPath}</p>
                  <p>{slot.publishedAt ? `Published ${dateLabel(slot.publishedAt)}` : 'No published timestamp reported'}</p>
                </article>
              ))}
            </div>
          </>
        )}
        <section className="gate">
          <b>READ-ONLY</b>
          <p>Upload, replacement, publishing, and rollback are not available from this page.</p>
          <button type="button" disabled>Brand media actions unavailable</button>
        </section>
      </section>
    );
  }

  return (
    <section className="plane" data-fi11-system-status="true">
      <div className="head">
        <div>
          <p className="eye">Owner system report</p>
          <h2>Redacted technical response</h2>
        </div>
          <b>{inspection ? 'Inspection mode' : 'System status'}</b>
      </div>
      {inspection ? (
            <p className="note">Current system readiness is unavailable in inspection mode.</p>
      ) : systemStatus ? (
        <dl>
          <div><dt>Technical response</dt><dd>Current response received</dd></div>
          <div><dt>Readiness response</dt><dd>{systemStatus.readiness === 'REPORTED_READY' ? 'Current readiness response reports ready' : 'Current readiness response does not report ready'}</dd></div>
        </dl>
      ) : (
        <p className="note">No current technical response is available to present.</p>
      )}
      {systemStatus?.playground ? (
        <section className="gate" data-playground-reset-center="true">
          <b>ISOLATED STAGING PLAYGROUND · SYSTEM OWNER</b>
          <h3>Playground controls</h3>
          <dl>
            <div><dt>Baseline</dt><dd>{systemStatus.playground.baselineId} · v{systemStatus.playground.baselineVersion}</dd></div>
            <div><dt>Reset generation</dt><dd>{systemStatus.playground.generation}</dd></div>
            <div><dt>Working state</dt><dd>{humanize(systemStatus.playground.workingState)}</dd></div>
            <div><dt>Last reset</dt><dd>{systemStatus.playground.lastReset ? `${humanize(systemStatus.playground.lastReset.status)} · ${dateLabel(systemStatus.playground.lastReset.completedAt)}` : "No reset receipt reported"}</dd></div>
          </dl>
          <p>
            Resetting ends every current Playground session, removes transient work, restores governed working files to the sealed baseline, and requires a new Playground session.
          </p>
          {systemStatus.playground.lastReset?.consequences.length ? (
            <ul>
              {systemStatus.playground.lastReset.consequences.map((consequence) => <li key={consequence}>{consequence}</li>)}
            </ul>
          ) : null}
          <label htmlFor="playground-reset-confirmation">
            Type <b>RESET PLAYGROUND</b> to confirm
          </label>
          <input
            id="playground-reset-confirmation"
            value={resetConfirmation}
            onChange={(event) => onResetConfirmationChange(event.target.value)}
            autoComplete="off"
            spellCheck={false}
            disabled={resetBusy || !systemStatus.playground.resetAvailable}
          />
          <button
            className="primary"
            type="button"
            onClick={onRequestReset}
            disabled={
              resetBusy ||
              !systemStatus.playground.resetAvailable ||
              resetConfirmation !== systemStatus.playground.confirmationPhrase
            }
          >
            {resetBusy ? "Resetting Playground…" : "Reset Playground"}
          </button>
          {systemStatus.playground.pendingOperation ? (
            <p role="status">Reset progress: {humanize(systemStatus.playground.pendingOperation.state)}</p>
          ) : null}
          {resetNotice ? <p className="live" role="status" aria-live="polite">{resetNotice}</p> : null}
        </section>
      ) : (
        <section className="gate">
          <b>REDACTED · READ-ONLY</b>
          <p>Playground reset is available only inside the isolated Playground environment.</p>
          <button type="button" disabled>System actions unavailable</button>
        </section>
      )}
    </section>
  );
}

export function LegacyAdministrationFixture({
  dark,
  navigate,
}: {
  dark: boolean;
  navigate?: (r: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("Accounts & access"),
    [prev, setPrev] = useState<Prev>("Populated"),
    [selected, setSelected] = useState("Inventory committee"),
    [dirty, setDirty] = useState(false),
    [reason, setReason] = useState("Committee reassignment"),
    [notice, setNotice] = useState("");
  const state = [
    "Populated",
    "Loading",
    "Empty",
    "Filtered empty",
    "Pending activation",
    "Denied",
    "Outdated record",
    "Validation error",
    "Unavailable",
    "Save checked",
  ];
  const content =
    prev === "Loading" ? (
      <div className="skeleton" aria-busy="true" />
    ) : prev === "Denied" ? (
      <State
        k="Denied"
        h="Access administration is not available to your account"
        p="This message does not confirm whether an account or person exists."
      >
        <button
          className="primary"
          onClick={() => navigate?.("overview")}
        >
          Back to overview
        </button>
      </State>
    ) : prev === "Outdated record" ? (
      <State
        k="Outdated record"
        h="This account record changed"
        p="No access change was applied. Reload the current account record."
      >
        <button
          className="primary"
          onClick={() => setPrev("Populated")}
        >
          Reload account record
        </button>
      </State>
    ) : prev === "Unavailable" ? (
      <State
        k="Unavailable"
        h="Administration service unavailable"
        p="No role, roster, reference, media, or audit record changed."
      >
        <button
          className="primary"
          onClick={() => setPrev("Populated")}
        >
          Retry administration records
        </button>
      </State>
    ) : prev === "Empty" || prev === "Filtered empty" ? (
      <State
        k={prev}
        h="No administration records match this view"
        p="Restore the sample records without changing any operational data."
      >
        <button
          className="primary"
          onClick={() => setPrev("Populated")}
        >
          Clear filters
        </button>
      </State>
    ) : prev === "Save checked" ? (
      <State
        k="Inspection result"
        h="Sample change recorded"
        p="No operational record was changed."
      >
        <button
          className="primary"
          onClick={() => setPrev("Populated")}
        >
          Return to access
        </button>
      </State>
    ) : (
      <Panel
        tab={tab}
        selected={selected}
        setSelected={setSelected}
        dirty={dirty}
        setDirty={setDirty}
        reason={reason}
        setReason={setReason}
        setPrev={setPrev}
        setNotice={setNotice}
      />
    );
  return (
    <div className={"adm " + (dark ? "dark" : "light")}>
      <style>{scopeRouteCss(".adm", css)}</style>
      <section className="sandbox">
        <b>Inspection mode</b>
        <span>Sample data · Actions unavailable</span>
        <label>
          Inspection state
          <select
            value={prev}
            onChange={(e) => setPrev(e.target.value as Prev)}
          >
            {state.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </section>
      <header>
        <div>
          <p className="eye">Administration + governance</p>
          <h1>Authorized system controls</h1>
          <p>
            Review the consequence, permission, and current record
            before any permitted action.
          </p>
        </div>
        <small>Sample data</small>
      </header>
      <nav
        className="tabs"
        aria-label="Administration sections"
      >
        {tabs.map((x) => (
          <button
            className={tab === x ? "active" : ""}
            key={x}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </nav>
      <select
        className="tab-select"
        value={tab}
        aria-label="Administration section"
        onChange={(e) => setTab(e.target.value as Tab)}
      >
        {tabs.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      {content}
      <div className="live" role="status" aria-live="polite">
        {notice}
      </div>
    </div>
  );
}
function Panel({
  tab,
  selected,
  setSelected,
  dirty,
  setDirty,
  reason,
  setReason,
  setPrev,
  setNotice,
}: {
  tab: Tab;
  selected: string;
  setSelected: (x: string) => void;
  dirty: boolean;
  setDirty: (x: boolean) => void;
  reason: string;
  setReason: (x: string) => void;
  setPrev: (x: Prev) => void;
  setNotice: (x: string) => void;
}) {
  if (tab === "Accounts & access")
    return (
      <div className="grid">
        <section className="plane">
          <div className="head">
            <div>
              <p className="eye">Account versions</p>
              <h2>Assigned identity and access</h2>
            </div>
            <b>Current authorized records</b>
          </div>
          <table>
            <thead>
              <tr>
                <th scope="col">Account</th>
                <th scope="col">Scope</th>
                <th scope="col">State</th>
                <th scope="col">Version</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Administrator",
                  "Full operations",
                  "Active",
                  "14",
                ],
                [
                  "Inventory committee",
                  "Inventory and receiving",
                  "Active",
                  "9",
                ],
                [
                  "Food committee",
                  "Requests",
                  "Pending activation",
                  "2",
                ],
              ].map((r) => (
                <tr key={r[0]}>
                  <td>
                    <button
                      className="row"
                      onClick={() => setSelected(r[0])}
                    >
                      <b>Masked account</b>
                      <span>{r[0]}</span>
                    </button>
                  </td>
                  <td>{r[1]}</td>
                  <td>
                    <em>{r[2]}</em>
                  </td>
                  <td>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Cards
            rows={[
              [
                "Administrator",
                "Full operations",
                "Active",
                "14",
              ],
              [
                "Inventory committee",
                "Inventory and receiving",
                "Active",
                "9",
              ],
              [
                "Food committee",
                "Requests",
                "Pending activation",
                "2",
              ],
            ]}
            action={setSelected}
          />
        </section>
        <aside className="detail">
          <p className="eye">{selected}</p>
          <h2>Access change preview</h2>
          <p>The current account record must remain current.</p>
          <dl>
            <div>
              <dt>Record receiving</dt>
              <dd>Allowed → Allowed</dd>
            </div>
            <div>
              <dt>Confirm release</dt>
              <dd>Not allowed → Allowed</dd>
            </div>
            <div>
              <dt>Administer references</dt>
              <dd>Not allowed → Not allowed</dd>
            </div>
          </dl>
          <label className="check">
            <input
              type="checkbox"
              checked={dirty}
              onChange={(e) => setDirty(e.target.checked)}
            />
            Preview confirm-release capability
          </label>
          <div className="actions">
            <button
              className="primary"
              disabled={!dirty}
              onClick={() => setPrev("Save checked")}
            >
              Save access change
            </button>
            <button onClick={() => setDirty(false)}>
              Discard changes
            </button>
          </div>
        </aside>
      </div>
    );
  if (tab === "Staff directory")
    return (
      <div className="grid">
        <section className="plane">
          <div className="head">
            <div>
              <p className="eye">Directory</p>
              <h2>Authorized staff records</h2>
            </div>
            <b>12 of 34 people</b>
          </div>
          <table>
            <thead>
              <tr>
                <th scope="col">Person</th>
                <th scope="col">Area</th>
                <th scope="col">Role</th>
                <th scope="col">State</th>
                <th scope="col">Contact</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Inventory", "Committee head", "Active"],
                ["Food", "Member", "Active"],
                ["Materials", "Member", "Pending activation"],
              ].map((r) => (
                <tr key={r[0]}>
                  <td>Authorized staff member</td>
                  <td>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td>
                    <em>{r[2]}</em>
                  </td>
                  <td>Masked — reveal needs a purpose</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Cards
            rows={[
              ["Inventory", "Committee head", "Active", ""],
              ["Food", "Member", "Active", ""],
              ["Materials", "Member", "Pending activation", ""],
            ]}
            action={() => {}}
          />
        </section>
        <aside className="detail">
          <p className="eye">Selected protected record</p>
          <h2>Inventory committee</h2>
          <dl>
            <div>
              <dt>Role</dt>
              <dd>Committee head</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>Active</dd>
            </div>
            <div>
              <dt>Activated</dt>
              <dd>04 Aug 2026</dd>
            </div>
            <div>
              <dt>Last reviewed</dt>
              <dd>01 Sep 2026</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>Masked — reveal needs a purpose</dd>
            </div>
          </dl>
          <section className="gate">
            <b>
              Staff information changes unavailable
            </b>
            <p>
              These fields cannot be changed from this page.
            </p>
            <button disabled>Add staff information</button>
            <button disabled>Edit fields</button>
            <button disabled>Reveal contact</button>
          </section>
          <label>
            Governance reason
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="actions">
            <button
              onClick={() =>
                setNotice("Sample consequence shown")
              }
            >
              Preview change
            </button>
            <button
              disabled={!reason.trim()}
              onClick={() =>
                setNotice(
                  "Sample change recorded",
                )
              }
            >
              Apply
            </button>
            <button
              onClick={() =>
                setNotice("Sample change rolled back")
              }
            >
              Roll back
            </button>
          </div>
        </aside>
      </div>
    );
  if (tab === "System status")
    return (
      <section className="plane">
        <div className="head">
          <div>
            <p className="eye">System status</p>
          <h2>STAGING · Service checks passed</h2>
          </div>
          <em>Production denial guard active</em>
        </div>
        <table>
          <thead>
            <tr>
              <th scope="col">Dependency</th>
              <th scope="col">State</th>
              <th scope="col">Source</th>
              <th scope="col">Last verified</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Playground mode",
                "True",
                "Inspection sample",
                "Now",
              ],
              [
                "Schema",
                "30 · migration 0030",
                "Inspection sample",
                "Now",
              ],
              [
                "D1",
                "Isolated · connected",
                "Inspection sample",
                "Now",
              ],
              [
                "Static assets",
                "Served",
                "Inspection sample",
                "Now",
              ],
              [
                "Brand / evidence assets",
                "R2 isolated",
                "Inspection sample",
                "Now",
              ],
            ].map((r) => (
              <tr key={r[0]}>
                {r.map((v, i) => (
                  <td key={i}>{i === 1 ? <em>{v}</em> : v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  if (tab === "Reference administration")
    return (
      <Dense
        title="Reference sets"
        rows={[
          [
            "Departments",
            "18 rows",
            "Version 14",
            "Published",
          ],
          [
            "Item categories",
            "9 rows",
            "Version 6 · draft 7",
            "Draft",
          ],
        ]}
      />
    );
  if (tab === "Link registry")
    return (
      <Dense
        title="Governed links"
        rows={[
          [
            "Official USC page",
            "HTTPS validated",
            "Published",
            "Read-only",
          ],
          ["Policy", "Same-origin", "Published", "Read-only"],
        ]}
      />
    );
  if (tab === "Brand & media")
    return <BrandMedia />;
  return (
    <section className="plane">
      <div className="head">
        <div>
          <p className="eye">Append-only activity</p>
          <h2>Verified operational events</h2>
        </div>
        <b>One row per event</b>
      </div>
      <table>
        <thead>
          <tr>
            <th scope="col">Time</th>
            <th scope="col">Event</th>
            <th scope="col">Record</th>
            <th scope="col">Evidence</th>
          </tr>
        </thead>
        <tbody>
          {[
            [
              "09:42",
              "Release confirmed",
              "REQ-2026-0136",
              "3 lines · evidence attached",
            ],
            [
              "09:18",
              "Receiving recorded",
              "PO-2026-0031",
              "Partial · 2 of 5 lines",
            ],
            [
              "08:55",
              "Loan flagged overdue",
              "LN-2026-0085",
              "Overdue state recorded",
            ],
            [
              "08:30",
              "Request returned for correction",
              "REQ-2026-0139",
              "Reason recorded",
            ],
            [
              "08:02",
              "Department list published",
              "Version 14",
              "Published",
            ],
          ].map((r) => (
            <tr key={r[0]}>
              {r.map((v, i) => (
                <td key={i}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">
        Automated reminders are unavailable. No duplicate activity rows.
      </p>
    </section>
  );
}
const brandAssets = [
  [uscLogo, "USC logo", "Published", "Public identity"],
  [dolLogo, "DOL logo", "Published", "Current Logistics hub"],
  [combinedLockup, "Combined lockup", "Published", "Operational shell"],
  [loginBackground, "Login background", "Published", "Staff sign-in"],
  [favicon, "Favicon", "Published but unlinked in Production", "Browser identity"],
  [defaultItemImage, "Default item image", "Published · catalog empty", "Lending placeholder"],
] as const;
function BrandMedia() {
  return (
    <section className="plane">
      <div className="head">
        <div>
          <p className="eye">Production web-asset parity</p>
          <h2>Governed asset slots and current fallback</h2>
        </div>
        <b>Current sample assets</b>
      </div>
      <table className="asset-table">
        <thead><tr><th scope="col">Image</th><th scope="col">Asset</th><th scope="col">Production state</th><th scope="col">Inspection use</th></tr></thead>
        <tbody>{brandAssets.map(([src, name, state, use]) => (
          <tr key={name}>
            <td><img className="asset-preview" src={src} alt="" /></td>
            <td><b>{name}</b></td><td>{state}</td><td>{use}</td>
          </tr>
        ))}</tbody>
      </table>
      <div className="asset-cards">{brandAssets.map(([src, name, state, use]) => (
        <article key={name}><img className="asset-preview" src={src} alt="" /><div><b>{name}</b><span>{state}</span><small>{use}</small></div></article>
      ))}</div>
      <p className="note">Brand and media changes are unavailable in inspection mode.</p>
    </section>
  );
}
function Dense({
  title,
  rows,
}: {
  title: string;
  rows: string[][];
}) {
  return (
    <section className="plane">
      <div className="head">
        <div>
          <p className="eye">Administration</p>
          <h2>{title}</h2>
        </div>
      <b>Sample data · read-only</b>
      </div>
      <table>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((v, i) => (
                <td key={i}>{i === 0 ? <b>{v}</b> : v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
function Cards({
  rows,
  action,
}: {
  rows: string[][];
  action: (x: string) => void;
}) {
  return (
    <div className="cards">
      {rows.map((r) => (
        <article key={r[0]}>
          <div>
            <b>{r[0]}</b>
            <em>{r[2]}</em>
          </div>
          <p>
            {r[1]} · {r[3] || "—"}
          </p>
          <button
            className="primary"
            onClick={() => action(r[0])}
          >
            Open record
          </button>
        </article>
      ))}
    </div>
  );
}
function State({
  k,
  h,
  p,
  children,
}: {
  k: string;
  h: string;
  p: string;
  children: React.ReactNode;
}) {
  return (
    <section className="state">
      <p className="eye">{k}</p>
      <h2>{h}</h2>
      <p>{p}</p>
      {children}
    </section>
  );
}
const css = `
.adm{--bg:#fffdf8;--m1:#fff;--m2:#f7f0e2;--text:#241416;--muted:#6f5a60;--line:#e6dcc9;--ox:#6f1624;--gold:#a77417;min-height:100%;min-width:0;padding:24px;background:var(--bg);color:var(--text);font-family:"IBM Plex Sans",Inter,Arial,sans-serif}.adm.dark{--bg:#1c1917;--m1:#242120;--m2:#2d2927;--text:#faf9f7;--muted:#b9aaa7;--line:#49413d;--ox:#8e2134;--gold:#d0a64a}.adm *{box-sizing:border-box}.adm button,.adm input,.adm select{font:inherit;min-height:44px;padding:10px 12px;border:1px solid var(--line);background:var(--m1);color:var(--text)}.adm button:focus-visible,.adm input:focus-visible,.adm select:focus-visible{outline:3px solid var(--gold);outline-offset:2px}.adm button:disabled{opacity:.45}.sandbox,header,.head{display:flex;justify-content:space-between;align-items:center;gap:14px}.sandbox,header,.tabs,.grid,.plane,.state,.skeleton,.live{max-width:1440px;margin-left:auto;margin-right:auto}.sandbox{padding:10px 12px;border:1px dashed var(--line);background:var(--m2);font-size:12px}.sandbox span{color:var(--muted)}.sandbox label{display:flex;gap:8px;align-items:center}header{margin-top:22px;align-items:flex-end}header h1{font:700 clamp(28px,3vw,38px)/1.08 "Bricolage Grotesque","IBM Plex Sans",sans-serif;margin:4px 0 10px}header p{margin:0;color:var(--muted)}header small{border:1px solid var(--line);padding:8px}.eye{margin:0;color:var(--gold)!important;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.tabs{display:grid;grid-template-columns:repeat(3,1fr);margin-top:20px}.tabs .active{background:var(--ox);color:#fff;border-color:var(--ox);font-weight:800}.grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(340px,.75fr);gap:16px;margin-top:16px;align-items:start}.plane,.detail,.state{background:var(--m1);border:1px solid var(--line)}.head{padding:17px;border-bottom:1px solid var(--line)}h2{font-family:"Bricolage Grotesque","IBM Plex Sans",sans-serif;margin:3px 0}.adm table{width:100%;border-collapse:collapse}.adm th,.adm td{text-align:left;padding:13px 15px;border-bottom:1px solid var(--line);font-size:13px}.adm th{background:var(--m2);font-size:10px;color:var(--muted);text-transform:uppercase}.row{display:grid;text-align:left;border:0!important;padding:0!important;background:transparent!important}.row span{color:var(--muted);font-size:11px}em{font-style:normal;display:inline-block;padding:5px 8px;background:var(--m2);border:1px solid var(--line);font-size:11px;font-weight:800}.cards{display:none}.detail{position:sticky;top:16px;padding:17px}.detail dl{display:grid;gap:9px}.detail dl div{display:grid;grid-template-columns:145px 1fr;gap:8px}.detail dt{color:var(--muted)}.detail dd{margin:0;font-weight:700}.detail label{display:grid;gap:5px;margin:14px 0}.check{grid-template-columns:24px 1fr!important;align-items:center}.check input{min-height:20px}.actions{display:flex;gap:8px;flex-wrap:wrap}.primary{background:var(--ox)!important;color:#fff!important;border-color:var(--ox)!important;font-weight:800}.gate{display:grid;gap:7px;padding:13px;margin:14px 0;background:var(--m2);border-left:4px solid var(--gold)}.gate>b{font-size:10px;color:var(--gold)}.gate p{color:var(--muted);font-size:12px}.state{padding:42px 20px;margin-top:16px}.state p{color:var(--muted)}.skeleton{height:520px;margin-top:16px;background:var(--m2);border:1px solid var(--line)}.note{padding:12px;color:var(--muted)}.live{min-height:24px;margin-top:12px;color:var(--muted);font-size:12px}
.asset-preview{width:64px;height:48px;object-fit:contain;background:var(--m2);border:1px solid var(--line)}.asset-cards{display:none}.tab-select{display:none}@media(max-width:900px){.tabs{grid-template-columns:repeat(2,1fr)}}@media(max-width:768px){.adm{padding:14px}.sandbox,header{flex-direction:column;align-items:flex-start}.tabs{display:none}.tab-select{display:block;width:100%;margin-top:14px}.grid{grid-template-columns:1fr}.adm table{display:none}.asset-cards{display:grid;gap:0}.asset-cards article{display:grid;grid-template-columns:72px 1fr;gap:12px;align-items:center;padding:12px;border-bottom:1px solid var(--line)}.asset-cards article div{display:grid;gap:3px}.asset-cards span,.asset-cards small{color:var(--muted)}.cards{display:grid;gap:10px;padding:12px}.cards article{border:1px solid var(--line);padding:13px}.cards article>div{display:flex;justify-content:space-between}.cards .primary{width:100%;min-height:48px}.detail{position:relative;top:auto}.actions{display:grid}.actions button{width:100%;min-height:48px}}@media(max-width:390px){.adm{padding:12px}header h1{font-size:32px}.head{flex-direction:column;align-items:flex-start}.detail dl div{grid-template-columns:1fr}}`;
