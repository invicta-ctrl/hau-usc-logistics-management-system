import { useEffect, useRef, useState } from 'react';
import type { Session } from '../appTypes';
import { ExceptionInspector } from './ExceptionInspector';
import {
  EXCEPTIONS_FIXTURE,
  OPERATIONAL_PATH,
  PULSE_ENTRIES,
  RECON_ROWS,
  TOPOLOGY,
} from './overviewFixtures';
import type { ExceptionItem } from './overviewTypes';
import { SkeletonBlock } from './SkeletonBlock';

export function OverviewPreviewRoute({ session, dark }: { session: Session; dark: boolean }) {
  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>(EXCEPTIONS_FIXTURE);
  const [selected, setSelected] = useState<ExceptionItem | null>(null);
  const [activePath, setActivePath] = useState(0);
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 59.99rem)').matches,
  );
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);
  const topologyKeys = ['request', 'released', 'reserved', 'loan'];

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 720);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(max-width: 59.99rem)');
    const sync = () => setIsNarrow(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  function closeInspector() {
    const id = selected?.id;
    const trigger = lastTriggerRef.current ?? (id ? triggerRefs.current[id] : null);
    setSelected(null);
    window.setTimeout(() => trigger?.focus(), 0);
  }

  function resolveLocally(id: string) {
    setExceptions((items) =>
      items.map((item) => (item.id === id ? { ...item, locallyResolved: true } : item)),
    );
    setSelected((item) => (item?.id === id ? { ...item, locallyResolved: true } : item));
  }

  return (
    <div className="command-table-page">
      <header className="command-table-header">
        <p className="command-kicker">Operations</p>
        <h1>Operations overview</h1>
        <p className="command-summary">
          <strong>14</strong> open requests · <strong>9</strong> loans out · <strong>6</strong> awaiting
          release · <strong>2</strong> below threshold
        </p>
        <p className="command-record">Signed in as {session.displayName}</p>
      </header>

      <div className="command-layout">
        <section className="command-ledger" aria-labelledby="command-exceptions-heading">
          <div className="command-section-head">
            <h2 id="command-exceptions-heading">Exceptions needing attention</h2>
            <span>{exceptions.filter((item) => !item.locallyResolved).length} open</span>
          </div>
          {loading ? (
            <ul className="command-ledger-list" aria-label="Loading exception ledger" aria-busy="true">
              {[1, 2, 3, 4].map((item) => (
                <li key={item}>
                  <SkeletonBlock h={72} dark={dark} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="command-ledger-list">
              {exceptions.map((item) => {
                const isSelected = selected?.id === item.id;
                return (
                  <li key={item.id}>
                    <button
                      ref={(element) => {
                        triggerRefs.current[item.id] = element;
                      }}
                      type="button"
                      className={`command-row${isSelected ? ' is-selected' : ''}${item.locallyResolved ? ' is-resolved' : ''}`}
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
                        <span className="command-row__meta">
                          {item.ref} · {item.state} · open {item.age}
                        </span>
                      </span>
                      <span
                        className="command-row__badge"
                        style={item.locallyResolved ? { color: 'var(--green-open)' } : item.badgeStyle}
                      >
                        {item.locallyResolved ? 'Marked resolved' : item.badge}
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
            <ExceptionInspector
              item={selected}
              modal={isNarrow}
              onClose={closeInspector}
              onResolveLocally={resolveLocally}
            />
          )}

          <section className="command-path" aria-labelledby="command-path-heading">
            <div className="command-section-head">
              <h2 id="command-path-heading">Today’s operational path</h2>
              <span>4 next actions</span>
            </div>
            {loading ? (
              <ul className="command-path-list" aria-label="Loading operational path" aria-busy="true">
                {[1, 2, 3, 4].map((item) => (
                  <li key={item}>
                    <SkeletonBlock h={58} dark={dark} />
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="command-path-list">
                {OPERATIONAL_PATH.map((task, index) => (
                  <li key={task.label}>
                    <button
                      type="button"
                      className="command-path-step"
                      aria-pressed={activePath === index}
                      onClick={() => setActivePath(index)}
                    >
                      <span className="command-path-step__marker" aria-hidden="true" />
                      <span>
                        <strong>{task.label}</strong>
                        <span>{task.detail}</span>
                      </span>
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
          <div className="command-section-head">
            <h2 id="command-pulse-heading">Operational pulse</h2>
            <span>Latest recorded activity</span>
          </div>
          {loading ? (
            <ul className="command-pulse-list" aria-label="Loading operational activity" aria-busy="true">
              {[1, 2, 3, 4, 5].map((item) => (
                <li key={item}>
                  <SkeletonBlock h={48} dark={dark} />
                </li>
              ))}
            </ul>
          ) : (
            <ul className="command-pulse-list">
              {PULSE_ENTRIES.map((entry) => (
                <li key={`${entry.time}-${entry.action}`}>
                  <time>{entry.time}</time>
                  <div>
                    <strong>{entry.action}</strong>
                    <span>{entry.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="command-topology" aria-labelledby="command-topology-heading">
          <div className="command-section-head">
            <h2 id="command-topology-heading">Ledger topology</h2>
            <span>Request to return</span>
          </div>
          {loading ? (
            <ul className="command-topology-list" aria-label="Loading ledger topology" aria-busy="true">
              {[1, 2, 3, 4, 5, 6].map((item) => (
                <li key={item}>
                  <SkeletonBlock h={58} dark={dark} />
                </li>
              ))}
            </ul>
          ) : (
            <ol className="command-topology-list">
              {TOPOLOGY.map((node) => (
                <li
                  key={node.key}
                  className={`command-topology-node${topologyKeys[activePath] === node.key ? ' is-active' : ''}`}
                >
                  <span>{node.label}</span>
                  <strong>{node.val}</strong>
                </li>
              ))}
            </ol>
          )}
        </section>
      </div>

      <section className="command-reconciliation" aria-labelledby="command-recon-heading">
        <div className="command-section-head">
          <h2 id="command-recon-heading">Ledger reconciliation</h2>
          <span>Projection against ledger</span>
        </div>
        {loading ? (
          <ul className="command-recon-list" aria-label="Loading reconciliation" aria-busy="true">
            {[1, 2, 3].map((item) => (
              <li key={item}>
                <SkeletonBlock h={56} dark={dark} />
              </li>
            ))}
          </ul>
        ) : (
          <ul className="command-recon-list">
            {RECON_ROWS.map((row) => (
              <li className="command-recon-row" key={row.label}>
                <strong>{row.label}</strong>
                <div className="command-recon-values">
                  <span>Current view {row.projection}</span>
                  <span>Ledger {row.ledger}</span>
                </div>
                <span className="command-recon-state">Reconciled</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
