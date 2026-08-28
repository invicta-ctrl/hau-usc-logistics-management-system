import React, { useEffect, useRef, useState } from "react";
import { scopeRouteCss } from "./routeStyleScope";
type Rec = {
  id: string;
  title: string;
  owner: string;
  ready: string;
  released: string;
  state: string;
};
const records: Rec[] = [
  {
    id: "REQ-2026-0136",
    title: "Sports Fest sound system",
    owner: "Authorized staff member · Department A",
    ready: "3 ready",
    released: "0/3 released",
    state: "Ready to release",
  },
  {
    id: "REQ-2026-0131",
    title: "Leadership Summit materials",
    owner: "Department B",
    ready: "8 ready",
    released: "5/8 released",
    state: "Partially released",
  },
  {
    id: "REQ-2026-0128",
    title: "Outreach Drive food packs",
    owner: "Department C",
    ready: "2 ready",
    released: "2/2 released",
    state: "Released",
  },
  {
    id: "REQ-2026-0124",
    title: "Orientation chairs and tables",
    owner: "Department D",
    ready: "4 ready",
    released: "0/4 released",
    state: "Ready to release",
  },
];
/* POST-FI17. Every release state rendered in identical neutral chrome, so
 * "Ready to release" (act now), "Partially released" (in progress) and
 * "Released" (done) were visually interchangeable and the desk's whole job —
 * make the next safe action obvious — fell to the operator re-reading four
 * rows of prose. The key drives colour; the label is still the record's. */
function stateKey(state: string): "ready" | "partial" | "done" {
  if (state === "Released") return "done";
  if (state === "Partially released") return "partial";
  return "ready";
}

type Prev =
  | "Populated"
  | "Focused task"
  | "Required correction"
  | "Loading"
  | "Empty"
  | "Filtered empty"
  | "Stale revision"
  | "Denied"
  | "Unavailable"
  | "Validation error"
  | "Confirmed success";
const isTaskPreviewState = (state: Prev) =>
  state === "Focused task" ||
  state === "Required correction" ||
  state === "Validation error";
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
export default function ReleaseDeskRoute({
  dark,
  navigate,
}: {
  dark: boolean;
  navigate?: (r: string) => void;
}) {
  const [prev, setPrev] = useState<Prev>("Populated"),
    [sel, setSel] = useState<Rec | null>(null),
    [task, setTask] = useState(false),
    [note, setNote] = useState(""),
    [notice, setNotice] = useState(""),
    [handoffConfirmed, setHandoffConfirmed] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const taskTriggerRef = useRef<HTMLButtonElement | null>(null);
  const previewStateRef = useRef<HTMLSelectElement | null>(null);
  const detailDialogRef = useRef<HTMLElement | null>(null);
  const taskDialogRef = useRef<HTMLElement | null>(null);
  const confirmedActionRef = useRef<HTMLButtonElement | null>(null);
  const focusIdRef = useRef<string | null>(null);
  const restorePendingRef = useRef(false);
  const refs = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );
  const taskPreviewState = isTaskPreviewState(prev);
  const taskVisible = task || taskPreviewState;
  const closeDetails = () => {
    restorePendingRef.current = true;
    setTask(false);
    setSel(null);
  };
  const closeTask = () => {
    const restoreTarget = task
      ? taskTriggerRef.current
      : previewStateRef.current;
    setTask(false);
    if (taskPreviewState) setPrev("Populated");
    requestAnimationFrame(() => requestAnimationFrame(() =>
      (restoreTarget?.isConnected
        ? restoreTarget
        : previewStateRef.current)?.focus({ preventScroll: true }),
    ));
  };
  useEffect(() => {
    if (taskVisible || sel || !restorePendingRef.current) return;
    restorePendingRef.current = false;
    const id = focusIdRef.current;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const candidates = id
        ? Array.from(document.querySelectorAll<HTMLButtonElement>(`[data-release-trigger="${id}"]`))
        : [];
      const target = candidates.find((el) => el.offsetParent !== null) || triggerRef.current;
      target?.focus({ preventScroll: true });
    }));
  }, [taskVisible, sel]);
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      const dialog = taskVisible
        ? taskDialogRef.current
        : sel
          ? detailDialogRef.current
          : null;
      if (!dialog) return;
      if (e.key === "Escape") {
        e.preventDefault();
        if (taskVisible) closeTask();
        else closeDetails();
        return;
      }
      keepFocusInDialog(e, dialog);
    };
    addEventListener("keydown", f);
    return () => removeEventListener("keydown", f);
  }, [sel, task, taskPreviewState, taskVisible]);
  useEffect(() => {
    if (!sel || taskVisible) return;
    const frame = requestAnimationFrame(() => focusDialog(detailDialogRef.current));
    return () => cancelAnimationFrame(frame);
  }, [sel, taskVisible]);
  useEffect(() => {
    if (!taskVisible) return;
    const frame = requestAnimationFrame(() => focusDialog(taskDialogRef.current));
    return () => cancelAnimationFrame(frame);
  }, [taskVisible]);
  useEffect(() => {
    if (prev !== "Confirmed success") return;
    const frame = requestAnimationFrame(() =>
      confirmedActionRef.current?.focus({ preventScroll: true }),
    );
    return () => cancelAnimationFrame(frame);
  }, [prev]);
  const pick = (r: Rec, el?: HTMLButtonElement | null) => {
    if (el) triggerRef.current = el;
    focusIdRef.current = r.id;
    setSel(r);
    setTask(false);
    setHandoffConfirmed(false);
    setNote("");
  };
  const confirm = () => {
    if (!note.trim()) {
      setPrev("Validation error");
      return;
    }
    setPrev("Loading");
    setTimeout(() => {
      setPrev("Confirmed success");
      setTask(false);
      setNotice(
        "Synthetic confirmation only · no service or ledger write",
      );
    }, 500);
  };
  const queue = (
    <section className="queue">
      <div className="head">
        <div>
          <p className="eye">Ready queue</p>
          <h2>Records at the custody boundary</h2>
        </div>
        <b>6 ready · 18 in scope</b>
      </div>
      <div className="filters">
        <input
          aria-label="Search this one shared queue — event requests and approved lending/consumables"
          placeholder="Request ID or activity"
        />
        <button>Clear filters</button>
      </div>
      <table>
        <thead>
          <tr>
            <th>Request</th>
            <th>Ready</th>
            <th>Released</th>
            <th>State</th>
          </tr>
        </thead>
        <tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <td>
                <button
                  className="row"
                  data-release-trigger={r.id}
                  ref={(n) => {
                    refs.current[r.id] = n;
                  }}
                  onClick={(e) => pick(r, e.currentTarget)}
                >
                  <b>{r.title}</b>
                  <span>
                    {r.id} · {r.owner}
                  </span>
                </button>
              </td>
              <td>{r.ready}</td>
              <td>{r.released}</td>
              <td>
                <em data-state={stateKey(r.state)}>{r.state}</em>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="cards">
        {records.map((r) => (
          <article key={r.id}>
            <div>
              <b>{r.id}</b>
              <em data-state={stateKey(r.state)}>{r.state}</em>
            </div>
            <h3>{r.title}</h3>
            <p>
              {r.ready} · {r.released}
            </p>
            <button
              className="primary"
              data-release-trigger={r.id}
              ref={(n) => {
                refs.current[r.id] = n;
              }}
              onClick={(e) => pick(r, e.currentTarget)}
            >
              {r.state === "Released"
                ? "View release"
                : "Open release"}
            </button>
          </article>
        ))}
      </div>
    </section>
  );
  return (
    <div className={"rel " + (dark ? "dark" : "light")}>
      <style>{scopeRouteCss(".rel", css)}</style>
      <section className="sandbox">
        <b>Design fixture</b>
        <span>Synthetic prototype · no backend</span>
        <label>
          Preview state
          <select
            ref={previewStateRef}
            value={prev}
            onChange={(e) => setPrev(e.target.value as Prev)}
          >
            {[
              "Populated",
              "Focused task",
              "Required correction",
              "Loading",
              "Empty",
              "Filtered empty",
              "Stale revision",
              "Denied",
              "Unavailable",
              "Validation error",
              "Confirmed success",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </section>
      <header>
        <div>
          <p className="eye">Release Desk</p>
          <h1>Confirm physical release</h1>
          <p>
            Verify the ready record, custody consequence, and
            synthetic result.
          </p>
        </div>
        <small>Design fixture · not production data</small>
      </header>
      <ol className="steps">
        {[
          "FIND READY RECORD",
          "SELECT",
          "VERIFY PREFILLED DATA",
          "RECORD CORRECTION",
          "CONFIRM CONSEQUENCE",
          "SIMULATED RESPONSE",
          "REFRESH",
        ].map((x, i) => (
          <li key={x}>
            <b>{String(i + 1).padStart(2, "0")}</b>
            {x}
          </li>
        ))}
      </ol>
      {prev === "Loading" ? (
        <div className="grid busy" aria-busy="true">
          <section />
          <aside />
        </div>
      ) : prev === "Denied" ? (
        <State
          k="Denied"
          h="Release records are not available to this account"
          p="This message does not confirm whether any protected record exists."
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
          h="Release service unavailable"
          p="No release was recorded. Verified local counts remain: chairs 120 of 120; tables 12 of 12."
        >
          <button
            className="primary"
            onClick={() => setPrev("Populated")}
          >
            Retry
          </button>
        </State>
      ) : prev === "Empty" || prev === "Filtered empty" ? (
        <State
          k={prev}
          h="No ready releases match this view"
          p="Keep filters visible so the queue can be restored."
        >
          <button
            className="primary"
            onClick={() => setPrev("Populated")}
          >
            Clear filters
          </button>
        </State>
      ) : prev === "Confirmed success" ? (
        <State
          k="Synthetic confirmation"
          h="RLS-2026-0231"
          p="Three lines against REQ-2026-0136 · ledger preview 09:42 · no real audit write."
        >
          <button
            ref={confirmedActionRef}
            className="primary"
            onClick={() => setPrev("Populated")}
          >
            Next release
          </button>
          <button
            onClick={() =>
              setNotice(
                "Read-only synthetic audit summary opened",
              )
            }
          >
            View audit entry
          </button>
        </State>
      ) : (
        <>
          {prev === "Stale revision" && (
            <section className="stale">
              <div>
                <b>
                  Last-known release projection · revision 3
                </b>
                <span>Actions paused until local reload.</span>
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
              "grid " +
              (prev === "Stale revision" ? "paused" : "")
            }
          >
            {queue}
            {sel ? (
              <aside
                ref={detailDialogRef}
                className="detail"
                role="dialog"
                aria-modal="true"
                aria-labelledby="release-title"
                tabIndex={-1}
              >
                <div className="head">
                  <div>
                    <p className="eye">{sel.id}</p>
                    <h2 id="release-title">{sel.title}</h2>
                  </div>
                  <button
                    className="close"
                    onClick={closeDetails}
                    aria-label="Close release details"
                  >
                    ×
                  </button>
                </div>
                <em data-state={stateKey(sel.state)}>{sel.state}</em>
                <dl>
                  <div>
                    <dt>Owner</dt>
                    <dd>{sel.owner}</dd>
                  </div>
                  <div>
                    <dt>Projection revision</dt>
                    <dd>3</dd>
                  </div>
                  <div>
                    <dt>Previous release</dt>
                    <dd>RLS-2026-0230</dd>
                  </div>
                </dl>
                <section>
                  <h3>Approved lines</h3>
                  <ul>
                    <li>
                      <b>Folding chair ITM-0042</b>
                      <span>120 verified</span>
                    </li>
                    <li>
                      <b>Wireless microphone ITM-0051</b>
                      <span>Release 3 of 4 · short by 1</span>
                    </li>
                    <li>
                      <b>Trestle table ITM-0067</b>
                      <span>12 verified</span>
                    </li>
                  </ul>
                </section>
                <section className="gate">
                  <b>
                    PROPOSED UX · CONTRACT-GATED · NOT
                    IMPLEMENTATION-READY
                  </b>
                  <strong>Add photograph — Disabled</strong>
                  <p>
                    Protected media contract unavailable.
                    Existing reference EVD-2026-0118 is
                    read-only.
                  </p>
                  <button disabled>Add photograph</button>
                </section>
                <section className="gate">
                  <b>V-26 LOCAL SIMULATION PREREQUISITE</b>
                  <label className="hoff-label">
                    <input
                      type="checkbox"
                      id="v26-handoff"
                      checked={handoffConfirmed}
                      onChange={(e) =>
                        setHandoffConfirmed(e.target.checked)
                      }
                    />
                    Recipient confirmed the physical handoff ·
                    required
                  </label>
                  <p>
                    Removal or replacement of this prerequisite
                    is contract-gated.
                  </p>
                </section>
                <div className="actions">
                  <button
                    className="primary"
                    disabled={
                      sel.state === "Released" ||
                      !handoffConfirmed
                    }
                    onClick={(e) => {
                      taskTriggerRef.current = e.currentTarget;
                      setTask(true);
                    }}
                  >
                    {sel.state === "Released"
                      ? "View release"
                      : "Record physical release"}
                  </button>
                  <button
                    onClick={() =>
                      setNotice(
                        "Request opened locally · no service call",
                      )
                    }
                  >
                    Open request
                  </button>
                </div>
              </aside>
            ) : (
              <aside className="none">
                Select a ready record to verify custody and
                permitted actions.
              </aside>
            )}
          </div>
        </>
      )}
      {taskVisible && (
        <div className="veil">
          <section
            ref={taskDialogRef}
            className="task"
            role="dialog"
            aria-modal="true"
            aria-labelledby="task-title"
            tabIndex={-1}
          >
            <p className="eye">Focused release task</p>
            <h2 id="task-title">
              REQ-2026-0136 · 3 of 3 approved lines
            </h2>
            <ul>
              <li>Folding chair ×120 · verified</li>
              <li>
                Wireless microphone · release 3 of 4 · short by
                1
              </li>
              <li>Trestle table ×12 · verified</li>
            </ul>
            <label>
              Required correction note
              <textarea
                rows={4}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Explain the microphone shortfall"
              />
            </label>
            {prev === "Validation error" && (
              <p className="error" role="alert">
                Add the correction note before confirming.
              </p>
            )}
            <p className="consequence">
              Nothing is released until a service confirms. This
              sandbox produces only a synthetic result.
            </p>
            <div className="actions">
              <button className="primary" onClick={confirm}>
                Confirm release of 3 lines
              </button>
              <button
                onClick={() =>
                  setNotice(
                    "Verification saved locally · no service call",
                  )
                }
              >
                Save verification
              </button>
              <button onMouseDown={(e) => e.preventDefault()} onClick={closeTask}>Cancel</button>
            </div>
          </section>
        </div>
      )}
      <div className="live" role="status" aria-live="polite">
        {notice}
      </div>
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
      <div className="actions">{children}</div>
    </section>
  );
}
const css = `
.rel{--bg:var(--paper-warm);--m1:var(--paper-mid);--m2:var(--paper-light);--text:var(--ink-deep);--muted:var(--ink-mid);--line:var(--border-paper);--ox:var(--oxblood-mid);--gold:var(--ink-light);min-height:100%;min-width:0;padding:24px;background:var(--bg);color:var(--text);font-family:"IBM Plex Sans",Inter,Arial,sans-serif}.rel *{box-sizing:border-box}.rel button,.rel input,.rel select,.rel textarea{font:inherit;min-height:44px;padding:10px 12px;border:1px solid var(--line);background:var(--m1);color:var(--text)}.rel button:focus-visible,.rel input:focus-visible,.rel select:focus-visible,.rel textarea:focus-visible{outline:3px solid var(--gold);outline-offset:2px}.rel button:disabled{opacity:.45}.sandbox,header,.head,.filters,.stale{display:flex;justify-content:space-between;align-items:center;gap:14px}.sandbox,header,.steps,.grid,.state,.stale,.live{max-width:1440px;margin-left:auto;margin-right:auto}.sandbox{padding:10px 12px;border:1px dashed var(--line);background:var(--m2);font-size:12px}.sandbox span{color:var(--muted)}.sandbox label{display:flex;gap:8px;align-items:center}header{margin-top:22px;align-items:flex-end}header h1{font:700 clamp(28px,3vw,38px)/1.08 "Bricolage Grotesque","IBM Plex Sans",sans-serif;margin:4px 0 10px}header p{margin:0;color:var(--muted)}header small{border:1px solid var(--line);padding:8px}.eye{margin:0;color:var(--gold)!important;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.steps{display:grid;grid-template-columns:repeat(7,1fr);list-style:none;padding:0;margin-top:20px;border-top:1px solid var(--line);border-bottom:1px solid var(--line);background:transparent}.steps li{padding:9px 10px;border-right:1px solid var(--line);font-size:10px;font-weight:600;color:var(--muted)}.steps li:last-child{border-right:0}.steps b{display:block;color:var(--gold)}.grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(340px,.75fr);gap:16px;margin-top:16px;align-items:start}.queue,.detail,.none,.state,.stale,.task{background:var(--m1);border:1px solid var(--line)}.head{padding:17px;border-bottom:1px solid var(--line)}h2{font-family:"Bricolage Grotesque","IBM Plex Sans",sans-serif;margin:3px 0}.filters{justify-content:flex-start;padding:12px;background:var(--m2)}.filters input{width:min(360px,48vw)}.rel table{width:100%;border-collapse:collapse}.rel th,.rel td{text-align:left;padding:13px 15px;border-bottom:1px solid var(--line);font-size:13px}.rel th{background:var(--m2);font-size:10px;color:var(--muted);text-transform:uppercase}.row{display:grid;text-align:left;border:0!important;padding:0!important;background:transparent!important}.row span{font-size:11px;color:var(--muted)}em{font-style:normal;display:inline-block;padding:5px 8px;background:var(--m2);border:1px solid var(--line);font-size:11px;font-weight:800}em[data-state="ready"]{background:color-mix(in oklch,var(--gold-vivid) 20%,var(--m1));border-color:var(--gold-vivid);color:var(--ink-deep)}em[data-state="partial"]{background:var(--m2);border-color:var(--border-warm);color:var(--muted)}em[data-state="done"]{background:color-mix(in oklch,var(--green-open) 10%,var(--m1));border-color:color-mix(in oklch,var(--green-open) 42%,var(--line));color:var(--green-open);font-weight:600}.cards{display:none}.detail{position:sticky;top:16px;padding:17px;max-height:calc(100vh - 32px);overflow:auto}.detail>.head{padding:0 0 14px}.close{width:44px;font-size:22px}.detail dl{display:grid;gap:8px;margin:15px 0}.detail dl div{display:grid;grid-template-columns:120px 1fr;gap:10px}.detail dt{color:var(--muted)}.detail dd{margin:0;font-weight:700}.detail section{padding:14px 0;border-top:1px solid var(--line)}.detail li{display:flex;justify-content:space-between;gap:12px;padding:7px 0}.detail li span{color:var(--muted);text-align:right}.gate{display:grid;gap:7px;background:var(--m2);border-left:4px solid var(--gold)!important;padding:13px!important}.gate>b{font-size:10px;color:var(--gold)}.gate p{margin:0;color:var(--muted);font-size:12px}.actions{display:flex;flex-wrap:wrap;gap:8px}.primary{background:var(--ox)!important;border-color:var(--ox)!important;color:#fff!important;font-weight:800}.none{min-height:340px;display:grid;place-items:center;padding:20px;text-align:center;color:var(--muted)}.state{padding:42px 20px;margin-top:16px}.state p{color:var(--muted)}.stale{margin-top:14px;padding:12px;border-left:4px solid var(--gold)}.stale span{color:var(--muted)}.paused{opacity:.65;pointer-events:none}.busy section,.busy aside{min-height:500px;background:var(--m2);border:1px solid var(--line)}.veil{position:fixed;inset:0;z-index:60;background:#120b0bba;display:grid;place-items:center;padding:16px}.task{width:min(620px,100%);padding:22px;display:grid;gap:13px}.task label{display:grid;gap:5px}.consequence{padding:12px;background:var(--m2);color:var(--muted)}.error{color:#b12630;font-weight:800}.live{min-height:24px;margin-top:12px;color:var(--muted);font-size:12px}
@media(max-width:768px){.rel{padding:14px}.sandbox,header,.stale{flex-direction:column;align-items:flex-start}.steps{grid-template-columns:repeat(2,1fr)}.steps li{border-bottom:1px solid var(--line)}.grid{grid-template-columns:1fr}.rel table{display:none}.cards{display:grid;gap:10px;padding:12px}.cards article{border:1px solid var(--line);padding:13px}.cards article>div{display:flex;justify-content:space-between}.cards .primary{width:100%;min-height:48px}.detail{position:fixed;inset:0;z-index:50;max-height:none}.none{display:none}.filters{flex-direction:column;align-items:stretch}.filters input,.filters button{width:100%}.actions{display:grid}.actions button{width:100%;min-height:48px}}@media(max-width:390px){.rel{padding:12px}header h1{font-size:32px}.head{flex-direction:column;align-items:flex-start}.detail dl div{grid-template-columns:1fr;gap:2px}.detail li{display:grid}}`;
