import React, { useEffect, useRef, useState } from "react";
import {
  FrontendApiError,
  frontendBackend,
  type FrontendEventManagement,
} from "../integration/backend";
import { scopeRouteCss } from "./routeStyleScope";
type Mode = "restocking" | "procurement" | "events";
type Prev =
  | "Populated"
  | "Loading"
  | "Empty"
  | "Filtered empty"
  | "Selected record"
  | "Validation error"
  | "Stale revision"
  | "Denied"
  | "Unavailable"
  | "Locally confirmed";
const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");
const focusableIn = (dialog: HTMLElement) =>
  Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
    (element) =>
      element.getAttribute("aria-hidden") !== "true" &&
      element.offsetParent !== null,
  );
const focusDialog = (dialog: HTMLElement | null) => {
  if (!dialog) return;
  (focusableIn(dialog)[0] || dialog).focus({ preventScroll: true });
};
const keepFocusInDialog = (event: KeyboardEvent, dialog: HTMLElement) => {
  if (event.key !== "Tab") return;
  const targets = focusableIn(dialog);
  if (!targets.length) {
    event.preventDefault();
    dialog.focus({ preventScroll: true });
    return;
  }
  const first = targets[0];
  const last = targets[targets.length - 1];
  const active = document.activeElement;
  if (event.shiftKey && (active === first || !dialog.contains(active))) {
    event.preventDefault();
    last.focus({ preventScroll: true });
  } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
    event.preventDefault();
    first.focus({ preventScroll: true });
  }
};
export default function SupplyRoutes({
  dark,
  mode,
  navigate,
  inspection = false,
  eventAllowed = false,
}: {
  dark: boolean;
  mode: Mode;
  navigate?: (r: string) => void;
  /** A4-only inspection mode. It never requests protected event data. */
  inspection?: boolean;
  /** Presentation gate only; the Worker remains authoritative for event.manage. */
  eventAllowed?: boolean;
}) {
  const [prev, setPrev] = useState<Prev>("Populated"),
    [selected, setSelected] = useState(""),
    [panel, setPanel] = useState("Canvassing"),
    [task, setTask] = useState(""),
    [notice, setNotice] = useState("");
  const taskDialogRef = useRef<HTMLElement | null>(null);
  const taskTriggerRef = useRef<HTMLButtonElement | null>(null);
  const openTask = (kind: string, opener?: HTMLButtonElement | null) => {
    if (opener) taskTriggerRef.current = opener;
    setTask(kind);
  };
  const closeTask = () => {
    const restoreTarget = taskTriggerRef.current;
    setTask("");
    requestAnimationFrame(() =>
      requestAnimationFrame(() =>
        (restoreTarget?.isConnected ? restoreTarget : null)?.focus({
          preventScroll: true,
        }),
      ),
    );
  };
  useEffect(() => {
    if (mode !== "restocking" || prev !== "Selected record") return;
    setSelected("RST-2026-0044");
  }, [mode, prev]);
  useEffect(() => {
    if (!task) return;
    const frame = requestAnimationFrame(() => focusDialog(taskDialogRef.current));
    return () => cancelAnimationFrame(frame);
  }, [task]);
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const dialog = taskDialogRef.current;
      if (!task || !dialog) return;
      if (event.key === "Escape") {
        event.preventDefault();
        closeTask();
        return;
      }
      keepFocusInDialog(event, dialog);
    };
    addEventListener("keydown", onKeyDown);
    return () => removeEventListener("keydown", onKeyDown);
  }, [task]);
  if (mode === "events") {
    return (
      <ManagedEventsRoute
        dark={dark}
        inspection={inspection}
        eventAllowed={eventAllowed}
        navigate={navigate}
      />
    );
  }
  const states = [
    "Populated",
    "Loading",
    "Empty",
    "Filtered empty",
    "Selected record",
    "Validation error",
    "Stale revision",
    "Denied",
    "Unavailable",
    "Locally confirmed",
  ];
  const top = (
    <>
      <section className="sandbox">
        <b>Design fixture</b>
        <span>Synthetic prototype · no backend</span>
        <label>
          Preview state
          <select
            value={prev}
            onChange={(e) => setPrev(e.target.value as Prev)}
          >
            {states.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </section>
      <nav className="modes" aria-label="Supply routes">
        {(
          ["restocking", "procurement", "events"] as Mode[]
        ).map((x) => (
          <button
            key={x}
            className={mode === x ? "active" : ""}
            onClick={() => navigate?.(x)}
          >
            {x}
          </button>
        ))}
      </nav>
    </>
  );
  const generic =
    prev === "Loading" ? (
      <div className="skeleton" aria-busy="true" />
    ) : prev === "Empty" || prev === "Filtered empty" ? (
      <State
        k={prev}
        h="No records match this view"
        p="Change the filter or restore the populated fixture."
      >
        <button
          className="primary"
          onClick={() => setPrev("Populated")}
        >
          Clear filters
        </button>
      </State>
    ) : prev === "Denied" ? (
      <State
        k="Denied"
        h="Supply records are not available to this account"
        p="This message does not confirm whether a protected record exists."
      >
        <button
          className="primary"
          onClick={() => navigate?.("overview")}
        >
          Return to overview
        </button>
      </State>
    ) : prev === "Unavailable" ? (
      <State
        k="Unavailable"
        h="Supply service unavailable"
        p="No receiving, procurement, or event record changed."
      >
        <button
          className="primary"
          onClick={() => setPrev("Populated")}
        >
          Retry
        </button>
      </State>
    ) : null;
  return (
    <div className={"sup " + (dark ? "dark" : "light")}>
      <style>{scopeRouteCss(".sup", css, [".event-stack", ".event-cards"])}</style>
      {top}
      <header>
        <div>
          <p className="eye">Supply operations</p>
          <h1>
            {mode === "restocking"
              ? "Restocking and receiving"
              : mode === "procurement"
                ? "Procurement lifecycle"
                : "Event relationships"}
          </h1>
          <p>
            {mode === "events"
              ? "Preserve series, day, activity, request, and inventory-transfer identity."
              : "Follow authoritative sequence and keep selected-record state visible."}
          </p>
        </div>
        <small>Design fixture · not production data</small>
      </header>
      {generic || (
        <>
          {prev === "Stale revision" && (
            <section className="stale">
              <div>
                <b>Last-known record · actions paused</b>
                <span>
                  Reload the local fixture before acting.
                </span>
              </div>
              <button
                className="primary"
                onClick={() => setPrev("Populated")}
              >
                Reload
              </button>
            </section>
          )}
          <div
            className={
              prev === "Stale revision" ? "paused" : ""
            }
          >
            {mode === "restocking" ? (
              <Restocking
                selected={selected}
                setSelected={setSelected}
                setTask={openTask}
              />
            ) : mode === "procurement" ? (
              <Procurement
                selected={selected}
                setSelected={setSelected}
                panel={panel}
                setPanel={setPanel}
              />
            ) : (
              <Events
                selected={selected}
                setSelected={setSelected}
                setTask={openTask}
              />
            )}
          </div>
        </>
      )}
      {task && (
        <Task
          kind={task}
          close={closeTask}
          dialogRef={taskDialogRef}
          invalid={prev === "Validation error"}
          confirm={() => {
            closeTask();
            setPrev("Locally confirmed");
            setNotice(
              "Locally confirmed · synthetic fixture only · no service write",
            );
          }}
        />
      )}
      {prev === "Locally confirmed" && (
        <State
          k="Synthetic result"
          h="Local fixture updated"
          p="No backend, ledger, provider, inventory, procurement, or event write occurred."
        >
          <button
            className="primary"
            onClick={() => setPrev("Populated")}
          >
            Return to records
          </button>
        </State>
      )}
      <div className="live" role="status" aria-live="polite">
        {notice}
      </div>
    </div>
  );
}
function Rail({ labels }: { labels: string[] }) {
  return (
    <ol className="rail">
      {labels.map((x, i) => (
        <li key={x}>
          <b>{String(i + 1).padStart(2, "0")}</b>
          {x}
        </li>
      ))}
    </ol>
  );
}
function Restocking({
  selected,
  setSelected,
  setTask,
}: {
  selected: string;
  setSelected: (x: string) => void;
  setTask: (x: string, opener?: HTMLButtonElement | null) => void;
}) {
  const rows = [
    [
      "RST-2026-0044",
      "ITM-0051 · Wireless microphone",
      "Below threshold · 3 of 6 available",
      "12",
      "6 of 12 received",
      "Partially received",
    ],
    [
      "RST-2026-0041",
      "ITM-0104 · Disposable food pack",
      "Out of stock · 0 available",
      "500",
      "0 of 500 received",
      "Not delivered",
    ],
    [
      "RST-2026-0038",
      "ITM-0088 · Extension cord 10m",
      "Event demand · EVT-2026-009",
      "20",
      "20 of 20 received",
      "Received",
    ],
  ];
  return (
    <>
      <Rail
        labels={[
          "REQUEST",
          "CANVASS",
          "DELIVERABLE",
          "RECEIVE",
          "LEDGER",
        ]}
      />
      <div className="grid">
        <section className="plane">
          <div className="head">
            <div>
              <p className="eye">Restocking queue</p>
              <h2>Requests requiring supply action</h2>
            </div>
            <b>7 open · 2 attention</b>
          </div>
          <div className="toolbar">
            <input
              aria-label="Search restocking records"
              placeholder="Request or item"
            />
            <button onClick={(event) => setTask("restock", event.currentTarget)}>
              Restock an item
            </button>
          </div>
          <table>
            <thead>
              <tr>
                <th>Request</th>
                <th>Reason</th>
                <th>Requested</th>
                <th>Received</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r[0]}>
                  <td>
                    <button
                      className="row"
                      onClick={() => setSelected(r[0])}
                    >
                      <b>{r[0]}</b>
                      <span>{r[1]}</span>
                    </button>
                  </td>
                  <td>{r[2]}</td>
                  <td>{r[3]}</td>
                  <td>{r[4]}</td>
                  <td>
                    <em>{r[5]}</em>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Cards rows={rows} action={setSelected} />
        </section>
        <aside className="detail">
          {selected ? (
            <>
              <p className="eye">{selected}</p>
              <h2>Receiving detail</h2>
              <em>Partial</em>
              <dl>
                <div>
                  <dt>Purchase order</dt>
                  <dd>PO-2026-0031</dd>
                </div>
                <div>
                  <dt>Purpose</dt>
                  <dd>Equipment replenishment</dd>
                </div>
                <div>
                  <dt>Supplier</dt>
                  <dd>Supplier A</dd>
                </div>
                <div>
                  <dt>Ordered</dt>
                  <dd>12</dd>
                </div>
                <div>
                  <dt>Received</dt>
                  <dd>6</dd>
                </div>
                <div>
                  <dt>Outstanding</dt>
                  <dd>6</dd>
                </div>
              </dl>
              <button
                className="primary"
                onClick={(event) => setTask("receive", event.currentTarget)}
              >
                Receiving
              </button>
            </>
          ) : (
            <p>
              Select a request to inspect received and
              outstanding quantities.
            </p>
          )}
        </aside>
      </div>
    </>
  );
}
function Procurement({
  selected,
  setSelected,
  panel,
  setPanel,
}: {
  selected: string;
  setSelected: (x: string) => void;
  panel: string;
  setPanel: (x: string) => void;
}) {
  return (
    <>
      <Rail
        labels={[
          "REQUEST",
          "CANVASS",
          "DELIVERABLE",
          "RECEIVE",
          "LEDGER",
        ]}
      />
      <div className="recordband">
        <b>PRC-2026-0044</b>
        <span>Revision 5</span>
        <span>{panel}</span>
        <span>3 suppliers · 2 deliverables</span>
        <strong>Next: review compliant quotations</strong>
      </div>
      <div className="segments">
        {["Canvassing", "Suppliers", "Deliverables"].map(
          (x) => (
            <button
              className={panel === x ? "active" : ""}
              onClick={() => setPanel(x)}
              key={x}
            >
              {x}
            </button>
          ),
        )}
        <button
          disabled
          title="Not available in your authorized capability"
        >
          Contracts · unavailable
        </button>
      </div>
      <section className="plane">
        <div className="head">
          <div>
            <p className="eye">{panel}</p>
            <h2>
              {panel === "Canvassing"
                ? "Approved needs and quotations"
                : panel === "Suppliers"
                  ? "Named supplier summaries"
                  : "Delivery relationships"}
            </h2>
          </div>
          <b>Selected record persists</b>
        </div>
        {panel === "Canvassing" ? (
          <>
          <table>
            <thead>
              <tr>
                <th>Procurement</th>
                <th>Quotes</th>
                <th>Supplier</th>
                <th>Stage</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <button
                    className="row"
                    onClick={() => setSelected("PRC-2026-0044")}
                  >
                    <b>Wireless microphone ×12</b>
                    <span>PRC-2026-0044</span>
                  </button>
                </td>
                <td>3</td>
                <td>Supplier A · lowest compliant</td>
                <td>Canvass</td>
                <td>
                  <em>Canvassing</em>
                </td>
              </tr>
              <tr>
                <td>
                  <button
                    className="row"
                    onClick={() => setSelected("PRC-2026-0041")}
                  >
                    <b>Folding chair ×120</b>
                    <span>PRC-2026-0041</span>
                  </button>
                </td>
                <td>3</td>
                <td>Supplier B · awaiting approval</td>
                <td>Approval</td>
                <td>
                  <em>Awaiting approval</em>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="cards">
            <article>
              <div>
                <b>PRC-2026-0044</b>
                <em>Canvassing</em>
              </div>
              <h3>Wireless microphone ×12</h3>
              <p>3 quotes · Supplier A · lowest compliant</p>
              <button
                className="primary"
                onClick={() => setSelected("PRC-2026-0044")}
              >
                Open procurement
              </button>
            </article>
            <article>
              <div>
                <b>PRC-2026-0041</b>
                <em>Awaiting approval</em>
              </div>
              <h3>Folding chair ×120</h3>
              <p>3 quotes · Supplier B · approval pending</p>
              <button
                className="primary"
                onClick={() => setSelected("PRC-2026-0041")}
              >
                Open procurement
              </button>
            </article>
          </div>
          </>
        ) : panel === "Suppliers" ? (
          <div className="dense">
            <article>
              <b>Supplier A</b>
              <span>
                Named fixture · lowest compliant for
                PRC-2026-0044
              </span>
            </article>
            <article>
              <b>Supplier B</b>
              <span>
                Named fixture · approval pending for
                PRC-2026-0041
              </span>
            </article>
            <p>No price, award, or contract is invented.</p>
          </div>
        ) : (
          <>
          <table>
            <thead>
              <tr>
                <th>Deliverable</th>
                <th>Relationship</th>
                <th>Due</th>
                <th>Received</th>
                <th>State</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>DLV-2026-0022</b>
                  <br />
                  Sound system hire
                </td>
                <td>EVT-2026-009 · Day 1</td>
                <td>11 Sep</td>
                <td>1 of 1 received</td>
                <td>
                  <em>Received</em>
                </td>
              </tr>
              <tr>
                <td>
                  <b>DLV-2026-0019</b>
                  <br />
                  Food packs ×500
                </td>
                <td>EVT-2026-009 · Day 2</td>
                <td>14 Sep</td>
                <td>0 of 1 received</td>
                <td>
                  <em>Ordered</em>
                </td>
              </tr>
            </tbody>
          </table>
          <div className="cards">
            <article>
              <div>
                <b>DLV-2026-0022</b>
                <em>Received</em>
              </div>
              <h3>Sound system hire</h3>
              <p>EVT-2026-009 · Day 1 · 1 of 1 received</p>
            </article>
            <article>
              <div>
                <b>DLV-2026-0019</b>
                <em>Ordered</em>
              </div>
              <h3>Food packs ×500</h3>
              <p>EVT-2026-009 · Day 2 · 0 of 1 received</p>
            </article>
          </div>
          </>
        )}
      </section>
    </>
  );
}
type EventLoadState = "loading" | "ready" | "denied" | "unavailable";

const previewEventManagement: FrontendEventManagement = {
  series: [
    {
      name: "Sanitized event series",
      code: "PREVIEW-SERIES",
      status: "PREVIEW_ONLY",
    },
  ],
  days: [
    {
      seriesName: "Sanitized event series",
      name: "Preview day",
      date: "",
      status: "PREVIEW_ONLY",
    },
  ],
  activities: [
    {
      name: "Preview activity",
      seriesName: "Sanitized event series",
      date: "",
      activityType: "PREVIEW_ONLY",
      status: "PREVIEW_ONLY",
      timeStatus: "NOT_LIVE",
    },
  ],
};

function readableEventValue(value: string) {
  return value
    ? value
        .replaceAll("_", " ")
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : "Not reported";
}

function ManagedEventsRoute({
  dark,
  inspection,
  eventAllowed,
  navigate,
}: {
  dark: boolean;
  inspection: boolean;
  eventAllowed: boolean;
  navigate?: (route: string) => void;
}) {
  const [eventManagement, setEventManagement] = useState<FrontendEventManagement | null>(
    inspection ? previewEventManagement : null,
  );
  const [loadState, setLoadState] = useState<EventLoadState>(inspection ? "ready" : "loading");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (inspection) {
      setEventManagement(previewEventManagement);
      setLoadState("ready");
      return;
    }
    if (!eventAllowed) {
      setEventManagement(null);
      setLoadState("denied");
      return;
    }
    const abort = new AbortController();
    setLoadState("loading");
    void frontendBackend
      .eventManagement(abort.signal)
      .then((result) => {
        if (abort.signal.aborted) return;
        setEventManagement(result);
        setLoadState("ready");
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        setLoadState(error instanceof FrontendApiError && [401, 403].includes(error.status) ? "denied" : "unavailable");
      });
    return () => abort.abort();
  }, [eventAllowed, inspection, reloadKey]);

  const isEmpty =
    eventManagement !== null &&
    eventManagement.series.length === 0 &&
    eventManagement.days.length === 0 &&
    eventManagement.activities.length === 0;

  let content: React.ReactNode;
  if (loadState === "loading") {
    content = <div className="skeleton" aria-busy="true" aria-label="Loading event relationships" />;
  } else if (loadState === "denied") {
    content = (
      <State
        k="Denied"
        h="Event records are not available to this account"
        p="This message does not confirm whether an event record exists."
      >
        <button className="primary" type="button" onClick={() => navigate?.("overview")}>
          Return to overview
        </button>
      </State>
    );
  } else if (loadState === "unavailable") {
    content = (
      <State
        k="Unavailable"
        h="Event relationships are temporarily unavailable"
        p="No event, activity, request, inventory, or ledger record was changed."
      >
        <button className="primary" type="button" onClick={() => setReloadKey((value) => value + 1)}>
          Retry read-only load
        </button>
      </State>
    );
  } else if (isEmpty) {
    content = (
      <State
        k="No current records"
        h="No event relationships are currently reported"
        p="This read-only view does not create or infer event, activity, request, or inventory links."
      >
        <button className="primary" type="button" onClick={() => setReloadKey((value) => value + 1)}>
          Refresh read-only view
        </button>
      </State>
    );
  } else {
    const data = eventManagement ?? previewEventManagement;
    content = (
      <div className="event-stack">
        <section className="plane" aria-labelledby="event-series-title">
          <div className="head">
            <div>
              <p className="eye">Event series</p>
              <h2 id="event-series-title">Series and governed relationships</h2>
            </div>
            <b>Read-only projection</b>
          </div>
          <table>
            <thead>
              <tr><th>Series</th><th>Display code</th><th>State</th></tr>
            </thead>
            <tbody>
              {data.series.map((series) => (
                <tr key={`${series.name}-${series.code}`}>
                  <td><b>{series.name}</b></td>
                  <td>{series.code || "Not reported"}</td>
                  <td><em>{readableEventValue(series.status)}</em></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="event-cards" aria-label="Event series">
            {data.series.map((series) => (
              <article key={`${series.name}-${series.code}`}>
                <b>{series.name}</b><span>{series.code || "No display code reported"}</span><em>{readableEventValue(series.status)}</em>
              </article>
            ))}
          </div>
        </section>
        <section className="plane" aria-labelledby="event-days-title">
          <div className="head">
            <div>
              <p className="eye">Event days</p>
              <h2 id="event-days-title">Current day relationships</h2>
            </div>
            <b>No write controls</b>
          </div>
          <table>
            <thead>
              <tr><th>Series</th><th>Day</th><th>Date</th><th>State</th></tr>
            </thead>
            <tbody>
              {data.days.map((day) => (
                <tr key={`${day.seriesName}-${day.name}-${day.date}`}>
                  <td>{day.seriesName}</td><td><b>{day.name}</b></td><td>{day.date || "Not reported"}</td><td><em>{readableEventValue(day.status)}</em></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="event-cards" aria-label="Event days">
            {data.days.map((day) => (
              <article key={`${day.seriesName}-${day.name}-${day.date}`}>
                <b>{day.name}</b><span>{day.seriesName} · {day.date || "Date not reported"}</span><em>{readableEventValue(day.status)}</em>
              </article>
            ))}
          </div>
        </section>
        <section className="plane" aria-labelledby="event-activities-title">
          <div className="head">
            <div>
              <p className="eye">Activities</p>
              <h2 id="event-activities-title">Read-only activity relationships</h2>
            </div>
            <b>Server projection is authoritative</b>
          </div>
          <table>
            <thead>
              <tr><th>Activity</th><th>Series</th><th>Type</th><th>Timing</th><th>State</th></tr>
            </thead>
            <tbody>
              {data.activities.map((activity) => (
                <tr key={`${activity.seriesName}-${activity.name}-${activity.date}-${activity.activityType}`}>
                  <td><b>{activity.name}</b></td><td>{activity.seriesName}</td><td>{readableEventValue(activity.activityType)}</td><td>{readableEventValue(activity.timeStatus)}</td><td><em>{readableEventValue(activity.status)}</em></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="event-cards" aria-label="Event activities">
            {data.activities.map((activity) => (
              <article key={`${activity.seriesName}-${activity.name}-${activity.date}-${activity.activityType}`}>
                <b>{activity.name}</b><span>{activity.seriesName} · {readableEventValue(activity.activityType)} · {readableEventValue(activity.timeStatus)}</span><em>{readableEventValue(activity.status)}</em>
              </article>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className={`sup ${dark ? "dark" : "light"}`} data-fi11-events="true">
      <style>{scopeRouteCss(".sup", css, [".event-stack", ".event-cards"])}</style>
      {inspection ? (
        <section className="sandbox" data-fi11-events-inspection="true">
            <b>Sanitized Preview inspection</b>
          <span>Synthetic preview · no session, backend, or protected data</span>
        </section>
      ) : null}
      <header>
        <div>
          <p className="eye">Events</p>
          <h1>Read-only event relationships</h1>
          <p>Review the current authorized projection without creating or changing an event record.</p>
        </div>
        <small>{inspection ? "Sanitized fixture · not production data" : "Authenticated read-only data"}</small>
      </header>
      <Rail labels={["SERIES", "DAY", "ACTIVITY", "READ-ONLY", "NO CHANGES"]} />
      {content}
    </div>
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
            <em>{r[5]}</em>
          </div>
          <h3>{r[1]}</h3>
          <p>
            {r[2]} · {r[4]}
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
function Task({
  kind,
  close,
  dialogRef,
  invalid,
  confirm,
}: {
  kind: string;
  close: () => void;
  dialogRef: React.RefObject<HTMLElement | null>;
  invalid: boolean;
  confirm: () => void;
}) {
  return (
    <div className="veil">
      <section
        ref={dialogRef}
        className="task"
        role="dialog"
        aria-modal="true"
        aria-labelledby="supply-task-title"
        aria-describedby="supply-task-description"
        tabIndex={-1}
      >
        <p className="eye">
          {kind === "event"
            ? "New event"
            : "Record-native task"}
        </p>
        <h2 id="supply-task-title">
          {kind === "event"
            ? "Create synthetic event"
            : "Update selected supply record"}
        </h2>
        {kind === "event" ? (
          <>
            <label>
              Series name
              <input required />
            </label>
            <label>
              Dates
              <input required placeholder="02–04 Sep" />
            </label>
            <label>
              Day and activity
              <input required />
            </label>
          </>
        ) : (
          <>
            <label>
              Quantity
              <input type="number" min="1" defaultValue="6" />
            </label>
            <label>
              Reason
              <textarea rows={3} required />
            </label>
          </>
        )}
        {invalid && (
          <p role="alert">Complete required fields.</p>
        )}
        <p id="supply-task-description" className="warning">
          Local prototype only. No inventory, procurement, receiving,
          event, or ledger write. Receiving values are cumulative and prior
          receipts remain unchanged.
        </p>
        <div className="actions">
          <button className="primary" onClick={confirm}>
            Confirm local preview
          </button>
          <button onClick={close}>Cancel</button>
        </div>
      </section>
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
.event-stack{display:grid;gap:16px;margin-top:16px}.event-stack .plane{overflow:auto}.event-cards{display:none}
@media(max-width:768px){.event-cards{display:grid;gap:10px;padding:12px}.event-cards article{display:grid;gap:8px;border:1px solid var(--line);padding:13px}.event-cards span{color:var(--muted);font-size:12px}}
.sup{--bg:#fffdf8;--m1:#fff;--m2:#f7f0e2;--text:#241416;--muted:#6f5a60;--line:#e6dcc9;--ox:#6f1624;--gold:#a77417;min-height:100%;min-width:0;padding:24px;background:var(--bg);color:var(--text);font-family:"IBM Plex Sans",Inter,Arial,sans-serif}.sup.dark{--bg:#1c1917;--m1:#242120;--m2:#2d2927;--text:#faf9f7;--muted:#b9aaa7;--line:#49413d;--ox:#8e2134;--gold:#d0a64a}.sup *{box-sizing:border-box}.sup button,.sup input,.sup select,.sup textarea{font:inherit;min-height:44px;padding:10px 12px;border:1px solid var(--line);background:var(--m1);color:var(--text)}.sup button:focus-visible,.sup input:focus-visible,.sup select:focus-visible,.sup textarea:focus-visible{outline:3px solid var(--gold);outline-offset:2px}.sup button:disabled{opacity:.45}.sandbox,header,.head,.toolbar,.stale,.recordband{display:flex;justify-content:space-between;align-items:center;gap:14px}.sandbox,.modes,header,.rail,.grid,.plane,.stale,.recordband,.segments,.state,.skeleton,.live{max-width:1440px;margin-left:auto;margin-right:auto}.sandbox{padding:10px 12px;border:1px dashed var(--line);background:var(--m2);font-size:12px}.sandbox span{color:var(--muted)}.sandbox label{display:flex;gap:8px;align-items:center}.modes,.segments{display:flex;margin-top:12px}.modes button,.segments button{flex:1;text-transform:capitalize}.modes .active,.segments .active{background:var(--ox);color:#fff;border-color:var(--ox);font-weight:800}header{margin-top:22px;align-items:flex-end}header h1{font:700 clamp(28px,3vw,38px)/1.08 "Bricolage Grotesque","IBM Plex Sans",sans-serif;margin:4px 0 10px}header p{margin:0;color:var(--muted)}header small{border:1px solid var(--line);padding:8px}.eye{margin:0;color:var(--gold)!important;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.rail{display:grid;grid-template-columns:repeat(5,1fr);list-style:none;padding:0;margin-top:20px;border:1px solid var(--line);background:var(--m2)}.rail li{padding:10px;border-right:1px solid var(--line);font-size:10px;font-weight:800}.rail b{display:block;color:var(--gold)}.grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(330px,.75fr);gap:16px;margin-top:16px;align-items:start}.plane,.detail,.state,.task{background:var(--m1);border:1px solid var(--line)}.head{padding:17px;border-bottom:1px solid var(--line)}h2{font-family:"Bricolage Grotesque","IBM Plex Sans",sans-serif;margin:3px 0}.toolbar{justify-content:flex-start;padding:12px;background:var(--m2)}.toolbar input{width:min(360px,48vw)}.sup table{width:100%;border-collapse:collapse}.sup th,.sup td{text-align:left;padding:13px 15px;border-bottom:1px solid var(--line);font-size:13px}.sup th{background:var(--m2);font-size:10px;color:var(--muted);text-transform:uppercase}.row{display:grid;text-align:left;border:0!important;padding:0!important;background:transparent!important}.row span{color:var(--muted);font-size:11px}em{font-style:normal;display:inline-block;padding:5px 8px;background:var(--m2);border:1px solid var(--line);font-size:11px;font-weight:800}.cards{display:none}.detail{position:sticky;top:16px;padding:17px}.detail dl{display:grid;gap:8px}.detail dl div{display:grid;grid-template-columns:120px 1fr}.detail dt{color:var(--muted)}.detail dd{margin:0;font-weight:700}.detail li{padding:8px 0}.detail li span{display:block;color:var(--muted)}.warning{padding:12px;background:var(--m2);color:var(--muted)}.recordband{margin-top:14px;padding:12px;background:var(--m2);border:1px solid var(--line);font-size:12px}.segments{margin-top:8px}.dense{display:grid;gap:8px;padding:16px}.dense article{display:flex;justify-content:space-between;padding:12px;border-bottom:1px solid var(--line)}.stale{margin-top:14px;padding:12px;border:1px solid var(--line);border-left:4px solid var(--gold)}.stale span{color:var(--muted)}.paused{opacity:.65;pointer-events:none}.state{padding:42px 20px;margin-top:16px}.state p{color:var(--muted)}.skeleton{height:520px;margin-top:16px;background:var(--m2);border:1px solid var(--line)}.primary{background:var(--ox)!important;color:#fff!important;border-color:var(--ox)!important;font-weight:800}.veil{position:fixed;inset:0;z-index:60;background:#120b0bba;display:grid;place-items:center;padding:16px}.task{width:min(580px,100%);padding:22px;display:grid;gap:13px}.task label{display:grid;gap:5px}.actions{display:flex;gap:8px}.live{min-height:24px;margin-top:12px;color:var(--muted);font-size:12px}
@media(max-width:768px){.sup{padding:14px}.sandbox,header,.stale,.recordband{flex-direction:column;align-items:flex-start}.modes,.segments{display:grid;grid-template-columns:1fr}.rail{grid-template-columns:1fr}.rail li{border-bottom:1px solid var(--line)}.grid{grid-template-columns:1fr}.sup table{display:none}.cards{display:grid;gap:10px;padding:12px}.cards article{border:1px solid var(--line);padding:13px}.cards article>div{display:flex;justify-content:space-between}.cards .primary{width:100%;min-height:48px}.detail{position:relative;top:auto}.toolbar{flex-direction:column;align-items:stretch}.toolbar input,.toolbar button{width:100%}.actions{display:grid}.actions button{width:100%;min-height:48px}}@media(max-width:390px){.sup{padding:12px}header h1{font-size:32px}.head,.dense article{flex-direction:column;align-items:flex-start}.detail dl div{grid-template-columns:1fr}}`;;
