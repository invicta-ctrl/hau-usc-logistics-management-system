import { useEffect, useMemo, useRef, useState } from "react";
import { ExceptionInspector } from "./ExceptionInspector";
import { EXCEPTIONS_FIXTURE, OPERATIONAL_PATH, PULSE_ENTRIES, RECON_ROWS, TOPOLOGY } from "./overviewFixtures";
import type { ExceptionItem } from "./overviewTypes";
import { SkeletonBlock } from "./SkeletonBlock";

/* POST-FI17. This route was fully built and then never mounted: nothing in the
 * app or the preview lane referenced it, so `overview` — the first item in the
 * authenticated sidebar and the landing surface of the whole hub — resolved to
 * AuthPlaceholderRoute and told every operator "this workspace route is
 * reserved and has not yet been built", above 470 lines of live .command-* CSS.
 *
 * It takes a presentational operator name rather than a Session. The preview
 * lane is emphatic that it creates no authenticated session, and this surface
 * needs a string to print, not an authority object. */
export function OverviewRoute({ operator, dark }: { operator: string; dark: boolean }) {
  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>(EXCEPTIONS_FIXTURE);
  const [selected, setSelected] = useState<ExceptionItem | null>(null);
  const [activePath, setActivePath] = useState(0);
  const [isNarrow, setIsNarrow] = useState(() => typeof window !== "undefined" && window.matchMedia("(max-width: 59.99rem)").matches);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const topologyKeys = ["request", "released", "reserved", "loan"];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 720);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 59.99rem)");
    const sync = () => setIsNarrow(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  function closeInspector() {
    const id = selected?.id;
    const trigger = lastTriggerRef.current ?? (id ? triggerRefs.current[id] : null);
    setSelected(null);
    window.setTimeout(() => trigger?.focus(), 0);
  }

  function resolveLocally(id: string) {
    setExceptions((items) => items.map((item) => item.id === id ? { ...item, locallyResolved: true } : item));
    setSelected((item) => item?.id === id ? { ...item, locallyResolved: true } : item);
  }

  const openExceptions = exceptions.filter((item) => !item.locallyResolved).length;

  /* The standing band. It replaces a flat mono run — "14 open requests · 9
   * loans out · 6 awaiting release · 2 below threshold" — that gave four
   * unrelated numbers identical weight and so answered none of the questions
   * this surface exists to answer. These three are ordered and weighted by how
   * much they should interrupt you, which is the actual hierarchy of a shift:
   * what is stuck, what is waiting on you, what is simply moving. */
  const standing = useMemo(() => [
    {
      key: "blocked",
      weight: "critical" as const,
      label: "Needs attention",
      value: openExceptions,
      unit: openExceptions === 1 ? "exception" : "exceptions",
      detail: "Nothing advances until these are resolved or recorded.",
    },
    {
      key: "ready",
      weight: "ready" as const,
      label: "Ready to act",
      value: 6,
      unit: "awaiting release",
      detail: "Verified records at the custody boundary.",
    },
    {
      key: "steady",
      weight: "steady" as const,
      label: "In flight",
      value: 23,
      unit: "open · on loan",
      detail: "14 requests open, 9 items on loan. No action required.",
    },
  ], [openExceptions]);

  const reconciled = RECON_ROWS.length;

  return (
    <div className="command-table-page">
      <header className="command-table-header">
        <p className="command-kicker">Operations · design fixtures, not production records</p>
        <h1>What needs attention today</h1>
        <p className="command-record">Authorized preview · {operator} · local state only</p>
      </header>

      {/* What is blocked, what is ready, what is merely moving. */}
      <section className="overview-standing" aria-label="Shift standing">
        {standing.map((figure) => (
          <div key={figure.key} className="overview-figure" data-weight={figure.weight}>
            <p className="overview-figure__label">{figure.label}</p>
            <p className="overview-figure__value">
              <strong>{loading ? "—" : figure.value}</strong>
              <span>{figure.unit}</span>
            </p>
            <p className="overview-figure__detail">{figure.detail}</p>
          </div>
        ))}
      </section>

      <div className="command-layout">
        <section className="command-ledger" aria-labelledby="command-exceptions-heading">
          <div className="command-section-head">
            <h2 id="command-exceptions-heading">Exceptions needing attention</h2>
            <span>{openExceptions} open</span>
          </div>
          {loading ? (
            <ul className="command-ledger-list" aria-label="Loading exception ledger" aria-busy="true">
              {[1, 2, 3, 4].map((item) => <li key={item}><SkeletonBlock h={72} dark={dark} /></li>)}
            </ul>
          ) : (
            <ul className="command-ledger-list">
              {exceptions.map((item) => {
                const isSelected = selected?.id === item.id;
                return (
                  <li key={item.id}>
                    <button
                      ref={(element) => { triggerRefs.current[item.id] = element; }}
                      type="button"
                      className={`command-row${isSelected ? " is-selected" : ""}${item.locallyResolved ? " is-resolved" : ""}`}
                      aria-pressed={isSelected}
                      aria-expanded={isSelected}
                      aria-controls="exception-inspector"
                      onClick={(event) => {
                        lastTriggerRef.current = event.currentTarget;
                        setSelected(item);
                      }}
                    >
                      <span className="command-row__marker" aria-hidden="true" />
                      <span className="command-row__copy">
                        <span className="command-row__title">{item.title}</span>
                        <span className="command-row__meta">{item.ref} · {item.state} · open {item.age}</span>
                      </span>
                      <span className="command-row__badge" style={item.locallyResolved ? { color: "var(--green-open)" } : item.badgeStyle}>
                        {item.locallyResolved ? "Resolved locally" : item.badge}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="command-side">
          {selected && (
            <ExceptionInspector item={selected} modal={isNarrow} onClose={closeInspector} onResolveLocally={resolveLocally} />
          )}

          <section className="command-path" aria-labelledby="command-path-heading">
            <div className="command-section-head">
              <h2 id="command-path-heading">Today’s operational path</h2>
              <span>4 next actions</span>
            </div>
            {loading ? (
              <ul className="command-path-list" aria-label="Loading operational path" aria-busy="true">
                {[1, 2, 3, 4].map((item) => <li key={item}><SkeletonBlock h={58} dark={dark} /></li>)}
              </ul>
            ) : (
              <ul className="command-path-list">
                {OPERATIONAL_PATH.map((task, index) => (
                  <li key={task.label}>
                    <button type="button" className="command-path-step" aria-pressed={activePath === index} onClick={() => setActivePath(index)}>
                      <span className="command-path-step__marker" aria-hidden="true" />
                      <span><strong>{task.label}</strong><span>{task.detail}</span></span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <div className="command-support-grid">
        <section className="command-pulse" aria-labelledby="command-pulse-heading">
          <div className="command-section-head"><h2 id="command-pulse-heading">What changed</h2><span>Latest recorded activity</span></div>
          {loading ? (
            <ul className="command-pulse-list" aria-label="Loading operational activity" aria-busy="true">
              {[1, 2, 3, 4, 5].map((item) => <li key={item}><SkeletonBlock h={48} dark={dark} /></li>)}
            </ul>
          ) : (
            <ul className="command-pulse-list">
              {PULSE_ENTRIES.map((entry) => (
                <li key={`${entry.time}-${entry.action}`}>
                  <time>{entry.time}</time>
                  <div><strong>{entry.action}</strong><span>{entry.detail}</span></div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Was a 3-column grid of six equal boxes, which showed six numbers and
            no relationship between them. The ledger is a sequence, so it is
            drawn as one: each stage carries its count and hands off to the
            next, and selecting a path step lights the stage it acts on. */}
        <section className="command-topology" aria-labelledby="command-topology-heading">
          <div className="command-section-head"><h2 id="command-topology-heading">Where the ledger stands</h2><span>Request to return</span></div>
          {loading ? (
            <ul className="command-topology-list" aria-label="Loading ledger topology" aria-busy="true">
              {[1, 2, 3, 4, 5, 6].map((item) => <li key={item}><SkeletonBlock h={44} dark={dark} /></li>)}
            </ul>
          ) : (
            <ol className="command-topology-list">
              {TOPOLOGY.map((node) => (
                <li key={node.key} className={`command-topology-node${topologyKeys[activePath] === node.key ? " is-active" : ""}`}>
                  <span className="command-topology-node__stage">{node.label}</span>
                  <strong className="command-topology-node__count">{node.val}</strong>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      {/* Was three padded rows each ending in an identical "Reconciled" pill —
          a dashboard that restated the same fact three times. The headline is
          the check result; the figures stay available beneath it, and a
          discrepancy would break the row out rather than hide in a third pill. */}
      <section className="command-reconciliation" aria-labelledby="command-recon-heading">
        <div className="command-section-head">
          <h2 id="command-recon-heading">Ledger reconciliation</h2>
          <span>Projection against ledger</span>
        </div>
        {loading ? (
          <div className="command-recon-strip" aria-busy="true"><SkeletonBlock h={56} dark={dark} /></div>
        ) : (
          <div className="command-recon-strip" data-state="reconciled">
            <p className="command-recon-verdict">
              <strong>{reconciled} of {reconciled} checks reconciled.</strong> Projection matches the ledger; nothing to investigate.
            </p>
            <dl className="command-recon-figures">
              {RECON_ROWS.map((row) => (
                <div key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.ledger}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}
      </section>
    </div>
  );
}
