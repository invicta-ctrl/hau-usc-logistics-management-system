import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

type Loan = {
  id: string;
  /** Production splits the verb: a consumable is issued, a reusable is handed off. */
  kind?: "reusable" | "consumable";
  item: string;
  timing: string;
  evidence: string;
  state: string;
};
type Preview =
  | "Default"
  | "Loading"
  | "Filtered empty"
  | "Page error"
  | "Stale data"
  | "Permission limited";
const fixture: Loan[] = [
  {
    id: "LN-2026-0091",
    kind: "consumable",
    item: "Marker pens ×24",
    timing: "Submitted 2h ago",
    evidence: "Not required",
    state: "For review",
  },
  {
    id: "LN-2026-0087",
    kind: "reusable",
    item: "Wireless microphone ×2",
    timing: "Due in 2 days",
    evidence: "Not required",
    state: "On loan",
  },
  {
    id: "LN-2026-0085",
    item: "Extension cord 10m ×4",
    timing: "Overdue 1 day",
    evidence: "—",
    state: "Overdue",
  },
  {
    id: "LN-2026-0081",
    item: "Trestle table 6ft ×6",
    timing: "Returned",
    evidence: "Recorded",
    state: "Returned",
  },
  {
    id: "LN-2026-0079",
    item: "Folding chair ×40",
    timing: "Ready to claim from 12 Sep",
    evidence: "—",
    state: "Ready to claim",
  },
];

export default function LendingHubRoute({
  dark,
  navigate,
}: {
  dark: boolean;
  navigate?: (r: string) => void;
}) {
  const [loans, setLoans] = useState(fixture);
  const [selected, setSelected] = useState<Loan | null>(null);
  const [preview, setPreview] = useState<Preview>("Default");
  const [query, setQuery] = useState("");
  const [returning, setReturning] = useState(false);
  const [notice, setNotice] = useState("");
  const refs = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );
  const focusIdRef = useRef<string | null>(null);
  const restorePendingRef = useRef(false);
  const rows = useMemo(
    () =>
      loans.filter((x) =>
        (x.id + " " + x.item)
          .toLowerCase()
          .includes(query.toLowerCase()),
      ),
    [loans, query],
  );
  const close = () => {
    const id = selected?.id;
    if (id) focusIdRef.current = id;
    restorePendingRef.current = true;
    setSelected(null);
    setReturning(false);
  };
  useEffect(() => {
    if (selected || restorePendingRef.current === false) return;
    restorePendingRef.current = false;
    const id = focusIdRef.current;
    requestAnimationFrame(() => requestAnimationFrame(() => {
      const candidates = id
        ? Array.from(document.querySelectorAll<HTMLButtonElement>(`[data-loan-trigger="${id}"]`))
        : [];
      const target = candidates.find((el) => el.offsetParent !== null) || (id ? refs.current[id] : null);
      target?.focus({ preventScroll: true });
    }));
  }, [selected]);
  const openLoan = (loan: Loan, trigger: HTMLButtonElement) => {
    focusIdRef.current = loan.id;
    refs.current[loan.id] = trigger;
    setSelected(loan);
  };
  useEffect(() => {
    const f = (e: KeyboardEvent) => {
      if (e.key === "Escape" && selected) close();
    };
    addEventListener("keydown", f);
    return () => removeEventListener("keydown", f);
  }, [selected]);
  const confirm = () => {
    if (!selected) return;
    const id = selected.id;
    setLoans((xs) =>
      xs.map((x) =>
        x.id === id
          ? {
              ...x,
              timing: "Returned just now",
              evidence: "Recorded locally",
              state: "Returned",
            }
          : x,
      ),
    );
    setReturning(false);
    focusIdRef.current = id;
    restorePendingRef.current = true;
    setSelected(null);
    setNotice(
      "Prototype confirmation · local fixture only · no service call",
    );
  };
  const normal =
    preview === "Default" ||
    preview === "Filtered empty" ||
    preview === "Stale data";
  return (
    <div className={"lend " + (dark ? "dark" : "light")}>
      <style>{css}</style>
      <section className="sandbox">
        <div>
          <strong>Design fixture</strong>
          <span>Local synthetic state · no backend</span>
        </div>
        <label>
          Preview state
          <select
            value={preview}
            onChange={(e) =>
              setPreview(e.target.value as Preview)
            }
          >
            {[
              "Default",
              "Loading",
              "Filtered empty",
              "Page error",
              "Stale data",
              "Permission limited",
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </section>
      <header>
        <div>
          <p className="eye">Lending Hub</p>
          <h1>Loans and custody</h1>
          <p>
            Find a loan, understand custody, then complete the
            permitted next action.
          </p>
        </div>
        <small>Design fixture · not production data</small>
      </header>
      <ol className="steps">
        {[
          "FIND",
          "SELECT",
          "UNDERSTAND",
          "ACT",
          "CONFIRM",
          "REFRESH",
        ].map((x, i) => (
          <li key={x}>
            <b>{String(i + 1).padStart(2, "0")}</b>
            {x}
          </li>
        ))}
      </ol>
      {preview === "Loading" ? (
        <div className="grid busy" aria-busy="true">
          <section />
          <aside />
        </div>
      ) : preview === "Page error" ? (
        <State
          k="Page error"
          h="Loans could not be loaded"
          p="No local record changed."
        >
          <button
            className="primary"
            onClick={() => setPreview("Default")}
          >
            Retry
          </button>
        </State>
      ) : preview === "Permission limited" ? (
        <State
          k="Permission limited"
          h="Loan records are not available to this account"
          p="This message does not confirm whether any protected record exists."
        >
          <button
            className="primary"
            onClick={() => navigate?.("overview")}
          >
            Return to overview
          </button>
        </State>
      ) : (
        <>
          {preview === "Stale data" && (
            <section className="stale">
              <div>
                <strong>Last-known loan data</strong>
                <span>
                  Revision may have changed. Actions are paused.
                </span>
              </div>
              <div>
                <button
                  className="primary"
                  onClick={() => setPreview("Default")}
                >
                  Reload
                </button>
                <button
                  onClick={() =>
                    setNotice(
                      "Reviewed locally · no service interaction occurred",
                    )
                  }
                >
                  Review
                </button>
              </div>
            </section>
          )}
          <div
            className={
              "grid " +
              (preview === "Stale data" ? "paused" : "")
            }
          >
            <section className="queue">
              <div className="sectionHead">
                <div>
                  <p className="eye">Queue</p>
                  <h2>Loans in authorized scope</h2>
                </div>
                <b>9 open · 1 overdue · 9 of 24</b>
              </div>
              <div className="filters">
                <label>
                  Search loans
                  <input
                    type="search"
                    placeholder="Loan ID or item"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                </label>
                <button onClick={() => setQuery("")}>
                  Clear filters
                </button>
              </div>
              {preview === "Filtered empty" || !rows.length ? (
                <div className="empty">
                  <h3>No loans match these filters</h3>
                  <p>Change the search or clear filters.</p>
                  <button
                    className="primary"
                    onClick={() => {
                      setQuery("");
                      setPreview("Default");
                    }}
                  >
                    Clear filters
                  </button>
                </div>
              ) : (
                <>
                  <table>
                    <thead>
                      <tr>
                        <th>Loan</th>
                        <th>Timing</th>
                        <th>Evidence</th>
                        <th>State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((x) => (
                        <tr key={x.id}>
                          <td>
                            <button
                              className="row"
                              data-loan-trigger={x.id}
                              ref={(n) => {
                                refs.current[x.id] = n;
                              }}
                              onClick={(e) => openLoan(x, e.currentTarget)}
                            >
                              <b>{x.item}</b>
                              <span>{x.id}</span>
                            </button>
                          </td>
                          <td>{x.timing}</td>
                          <td>{x.evidence}</td>
                          <td>
                            <em>{x.state}</em>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="cards">
                    {rows.map((x) => (
                      <article key={x.id}>
                        <div>
                          <b>{x.id}</b>
                          <em>{x.state}</em>
                        </div>
                        <h3>{x.item}</h3>
                        <p>
                          {x.timing} · Evidence {x.evidence}
                        </p>
                        <button
                          className="primary"
                          data-loan-trigger={x.id}
                          ref={(n) => {
                            refs.current[x.id] = n;
                          }}
                          onClick={(e) => openLoan(x, e.currentTarget)}
                        >
                          Open loan
                        </button>
                      </article>
                    ))}
                  </div>
                </>
              )}
            </section>
            {selected ? (
              <aside
                className="inspector"
                role="dialog"
                aria-modal="true"
                aria-labelledby="loan-title"
              >
                <div className="sectionHead">
                  <div>
                    <p className="eye">{selected.id}</p>
                    <h2 id="loan-title">{selected.item}</h2>
                  </div>
                  <button
                    className="close"
                    onClick={close}
                    aria-label="Close loan details"
                  >
                    ×
                  </button>
                </div>
                <em>{selected.state}</em>
                <section>
                  <h3>Custody</h3>
                  <dl>
                    <div>
                      <dt>Borrower</dt>
                      <dd>USC Staff/Officer</dd>
                    </div>
                    <div>
                      <dt>Student ID</dt>
                      <dd>2026-00417 · synthetic fixture</dd>
                    </div>
                    <div>
                      <dt>Contact</dt>
                      <dd>+63 9•• ••• ••41</dd>
                    </div>
                    <div>
                      <dt>Return by</dt>
                      <dd>14 Sep 2026 · 17:00</dd>
                    </div>
                  </dl>
                </section>
                <section>
                  <h3>Lifecycle</h3>
                  <ol>
                    <li>
                      <b>Approved</b> · 4d ago
                    </li>
                    <li>
                      <b>Handed off</b> · 2d ago · condition
                      recorded
                    </li>
                    <li>
                      <b>Return</b> · Not yet returned
                    </li>
                  </ol>
                </section>
                <section className="gate">
                  <b>
                    PROPOSED UX · CONTRACT-GATED · NOT
                    IMPLEMENTATION-READY
                  </b>
                  <strong>Due reminder — unavailable</strong>
                  <p>
                    No scheduler or notification contract is
                    approved.
                  </p>
                  <button disabled>Remind borrower</button>
                </section>
                <div className="actions">
                  <button
                    className="primary"
                    disabled={selected.state === "Returned"}
                    onClick={() => setReturning(true)}
                  >
                    {selected.state === "For review"
                      ? "Review"
                      : selected.state === "Ready to claim"
                        ? selected.kind === "consumable"
                          ? "Confirm issue"
                          : "Confirm handoff"
                        : selected.state === "Returned"
                          ? "Returned"
                          : "Inspect return"}
                  </button>
                  <button
                    onClick={() =>
                      setNotice(
                        "Register asset opened locally · no service call",
                      )
                    }
                  >
                    Register asset
                  </button>
                  <button
                    onClick={() =>
                      setNotice(
                        "Maintenance log opened locally · no service call",
                      )
                    }
                  >
                    Log maintenance
                  </button>
                  <button
                    disabled
                    title="Cancellation is not permitted in this state"
                  >
                    Cancel loan
                  </button>
                  <button
                    disabled
                    title="Monitoring service is unavailable"
                  >
                    Monitor
                  </button>
                </div>
              </aside>
            ) : (
              <aside className="none">
                Select a loan to inspect custody and permitted
                actions.
              </aside>
            )}
          </div>
        </>
      )}
      {returning && selected && (
        <div className="veil">
          <section
            className="confirm"
            role="dialog"
            aria-modal="true"
            aria-labelledby="return-title"
          >
            <p className="eye">Custody consequence</p>
            <h2 id="return-title">Confirm returned items</h2>
            <p>
              <b>{selected.item}</b>
              <br />
              {selected.id}
            </p>
            <label>
              Condition
              <select>
                <option>Returned in working condition</option>
                <option>Returned with damage noted</option>
                <option>
                  Quantity requires reconciliation
                </option>
              </select>
            </label>
            <label>
              Evidence note
              <textarea
                rows={3}
                placeholder="Optional local prototype note"
              />
            </label>
            <p className="consequence">
              Confirming changes only this local design fixture.
              No service or ledger write occurs.
            </p>
            <div className="actions">
              <button className="primary" onClick={confirm}>
                Confirm returned items
              </button>
              <button onClick={() => setReturning(false)}>
                Cancel
              </button>
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
    <section
      className="state"
      role={k === "Page error" ? "alert" : undefined}
    >
      <p className="eye">{k}</p>
      <h2>{h}</h2>
      <p>{p}</p>
      {children}
    </section>
  );
}
const css = `
.lend{--bg:var(--paper-warm);--m1:var(--paper-mid);--m2:var(--paper-light);--m3:color-mix(in oklch, var(--gold-vivid) 18%, var(--paper-light));--text:var(--ink-deep);--muted:var(--ink-mid);--line:var(--border-paper);--ox:var(--oxblood-mid);--gold:var(--ink-light);min-height:100%;min-width:0;padding:24px;background:var(--bg);color:var(--text);font-family:"IBM Plex Sans",Inter,Arial,sans-serif}.lend *{box-sizing:border-box}.lend button,.lend input,.lend select,.lend textarea{font:inherit;min-height:44px;border:1px solid var(--line);background:var(--m1);color:var(--text);padding:10px 12px}.lend button:focus-visible,.lend input:focus-visible,.lend select:focus-visible,.lend textarea:focus-visible{outline:3px solid var(--gold);outline-offset:2px}.lend button:disabled{opacity:.45}.sandbox,header,.sectionHead,.filters,.stale{display:flex;justify-content:space-between;align-items:center;gap:16px}.sandbox,header,.steps,.grid,.stale,.state,.live{max-width:1440px;margin-left:auto;margin-right:auto}.sandbox{padding:9px 12px;background:var(--m2);border:1px dashed var(--line);font-size:12px}.sandbox div,.sandbox label{display:flex;gap:10px;align-items:center}.sandbox span,header p,.state p{color:var(--muted)}header{margin-top:22px;align-items:flex-end}header h1{font:700 clamp(28px,3vw,38px)/1.08 "Bricolage Grotesque","IBM Plex Sans",sans-serif;margin:4px 0 10px;letter-spacing:-.035em}header p{margin:0}.eye{margin:0;color:var(--gold)!important;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}header small{border:1px solid var(--line);padding:8px}.steps{display:grid;grid-template-columns:repeat(6,1fr);list-style:none;padding:0;margin-top:20px;border:1px solid var(--line);background:var(--m2)}.steps li{padding:10px 12px;border-right:1px solid var(--line);font-size:11px;font-weight:800}.steps li:last-child{border:0}.steps b{display:block;color:var(--gold);font-size:10px}.grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(330px,.75fr);gap:16px;margin-top:16px;align-items:start}.queue,.inspector,.none,.state,.stale,.confirm{background:var(--m1);border:1px solid var(--line)}.sectionHead{padding:17px 18px;border-bottom:1px solid var(--line)}h2{font-family:"Bricolage Grotesque","IBM Plex Sans",sans-serif;margin:3px 0}h3{margin:0 0 10px}.filters{justify-content:flex-start;padding:12px 18px;background:var(--m2);border-bottom:1px solid var(--line)}.filters label{display:grid;gap:4px;color:var(--muted);font-size:11px}.filters input{width:min(330px,42vw)}.primary{background:var(--ox)!important;color:#fff!important;border-color:var(--ox)!important;font-weight:800}.lend table{width:100%;border-collapse:collapse}.lend th,.lend td{text-align:left;padding:13px 15px;border-bottom:1px solid var(--line);font-size:13px}.lend th{background:var(--m2);font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.row{display:grid;text-align:left;border:0!important;background:transparent!important;padding:0!important}.row span{color:var(--muted);font-size:11px}em{font-style:normal;display:inline-block;border:1px solid var(--line);background:var(--m2);padding:5px 8px;font-size:11px;font-weight:800}.cards{display:none}.inspector{position:sticky;top:16px;padding:17px;max-height:calc(100vh - 32px);overflow:auto}.inspector>.sectionHead{padding:0 0 14px}.close{width:44px;font-size:22px}.inspector section{padding:15px 0;border-bottom:1px solid var(--line)}dl{display:grid;gap:8px;margin:0}dl div{display:grid;grid-template-columns:100px 1fr;gap:10px}dt{color:var(--muted);font-size:12px}dd{margin:0;font-weight:650}.gate{padding:13px!important;margin:15px 0;background:var(--m2);border-left:4px solid var(--gold)!important;display:grid;gap:7px}.gate>b{font-size:10px;color:var(--gold)}.gate p{margin:0;color:var(--muted);font-size:12px}.actions{display:flex;gap:8px;flex-wrap:wrap}.none{min-height:340px;display:grid;place-items:center;text-align:center;color:var(--muted);padding:20px}.stale{margin-top:14px;padding:12px;border-left:4px solid var(--gold)}.stale div{display:flex;gap:8px;align-items:center}.stale span{color:var(--muted)}.paused{opacity:.65;pointer-events:none}.empty,.state{padding:42px 20px}.busy section,.busy aside{min-height:500px;border:1px solid var(--line);background:var(--m2)}.veil{position:fixed;inset:0;z-index:60;background:#120b0bba;display:grid;place-items:center;padding:16px}.confirm{width:min(520px,100%);padding:22px;display:grid;gap:13px}.confirm label{display:grid;gap:5px}.consequence{background:var(--m2);padding:12px;color:var(--muted)}.live{min-height:24px;margin-top:12px;color:var(--muted);font-size:12px}
@media(max-width:768px){.lend{padding:14px}.sandbox,header,.stale{flex-direction:column;align-items:flex-start}.sandbox label{width:100%;justify-content:space-between}.steps{grid-template-columns:repeat(3,1fr)}.steps li:nth-child(3){border-right:0}.steps li:nth-child(-n+3){border-bottom:1px solid var(--line)}.grid{grid-template-columns:1fr}.lend table{display:none}.cards{display:grid;gap:10px;padding:12px}.cards article{padding:13px;border:1px solid var(--line)}.cards article>div{display:flex;justify-content:space-between}.cards article p{color:var(--muted)}.cards .primary{width:100%;min-height:48px}.inspector{position:fixed;inset:0;z-index:50;max-height:none}.none{display:none}.filters{flex-direction:column;align-items:stretch}.filters input,.filters button{width:100%}.actions{display:grid}.actions button{width:100%;min-height:48px}}@media(max-width:390px){.lend{padding:12px}header h1{font-size:32px}.sectionHead{flex-direction:column;align-items:flex-start}dl div{grid-template-columns:1fr;gap:2px}.steps li{padding:9px 7px;font-size:10px}}`;


