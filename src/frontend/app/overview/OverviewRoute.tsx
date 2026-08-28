import { useEffect, useRef, useState } from 'react';
import type { Route } from '../appTypes';
import { ExceptionInspector } from './ExceptionInspector';
import {
  EXCEPTIONS_FIXTURE,
  OPERATIONAL_PATH,
  PROVENANCE,
  RECENT_EVENTS,
  RECON_ROWS,
  RECON_SOURCE,
  STANDING,
} from './overviewFixtures';
import type { ExceptionItem } from './overviewTypes';
import { SkeletonBlock } from './SkeletonBlock';

/* POST-FI17-DESIGN-RECOVERY-02, step 3. Corrected against the CURRENT Figma
 * authority for this surface — frame 434:61, "CURRENT · R2 Glass Operations
 * Command Table". The previous pass never read it, and three of its headline
 * decisions went the other way:
 *
 *   R8  the h1 is "Administrator overview", not "What needs attention today"
 *   R4  the standing figures are ONE quiet run under a NOW · N EXCEPTIONS
 *       label, not three weighted cards. Figma carries the priority in the
 *       label; card chrome here contradicts "glass is localised to layers
 *       that earn it" (Figma 568:13).
 *   R3  reconciliation is a real MEASURE / LEDGER / PROJECTION / STATE table.
 *       The previous pass called it a fake dashboard and collapsed it; ledger
 *       against projection IS the reconciliation evidence.
 *   R2  every exception row states its own next action, in gold. This is the
 *       strongest idea on the Figma frame and it was missing entirely.
 *   R5  the header carries Reconcile + Open Release Desk.
 *
 * Not a pixel copy. Two deliberate departures, both justified above Figma by
 * DESIGN.md's authority order (owner instruction first):
 *   - the rows stay interactive buttons opening the inspector, which is what
 *     Figma's own lede describes ("Select a record to see evidence and the
 *     permitted next action");
 *   - "Evidence and provenance" carries three recent confirmed events, because
 *     the owner's Overview brief requires this surface to answer "what
 *     changed?" and Figma's panel shows only the last one.
 *
 * Dropped: the activity feed and the ledger-topology spine the previous pass
 * built. Neither exists on the Figma CURRENT frame; both came from orphaned
 * component code rather than from any design authority. */
export function OverviewRoute({
  operator,
  dark,
  navigate,
}: {
  operator: string;
  dark: boolean;
  navigate?: (route: Route) => void;
}) {
  const [loading, setLoading] = useState(true);
  const [exceptions, setExceptions] = useState<ExceptionItem[]>(EXCEPTIONS_FIXTURE);
  const [selected, setSelected] = useState<ExceptionItem | null>(null);
  const [activePath, setActivePath] = useState(0);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lastTriggerRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 720);
    return () => clearTimeout(timer);
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

  const open = exceptions.filter((item) => !item.locallyResolved);
  const openCount = open.length;
  const countWord =
    openCount === 1 ? 'One exception requires' : `${numberWord(openCount)} exceptions require`;

  return (
    <div className="command-table-page">
      <header className="overview-head">
        <div className="overview-head__copy">
          <p className="command-kicker">Overview</p>
          <h1>Administrator overview</h1>
          <p className="overview-lede">
            {countWord} review. Select a record to see evidence and the permitted next action.
          </p>
        </div>

        {/* R5. Figma pairs a quiet reconcile with the gold primary. */}
        <div className="overview-head__actions">
          <button type="button" className="overview-action">
            Reconcile
          </button>
          <button type="button" className="overview-action is-primary" onClick={() => navigate?.('release')}>
            Open Release Desk
          </button>
        </div>
      </header>

      {/* R4. One quiet run. The NOW label carries the priority, not card chrome. */}
      <section className="overview-standing" aria-label="Current standing">
        <p className="overview-standing__now">
          Now · {openCount} {openCount === 1 ? 'exception' : 'exceptions'}
        </p>
        <ul className="overview-standing__run">
          {STANDING.map((figure) => (
            <li key={figure.label}>
              <strong>{loading ? '—' : figure.value}</strong> {figure.label}
            </li>
          ))}
        </ul>
        <p className="overview-standing__stamp">Reconciled {PROVENANCE.lastConfirmedEvent}</p>
      </section>

      <section className="command-ledger" aria-labelledby="command-exceptions-heading">
        <div className="command-section-head">
          <h2 id="command-exceptions-heading">Exception command table</h2>
          <span>{openCount} open · highest consequence first</span>
        </div>

        {loading ? (
          <ul className="command-ledger-list" aria-label="Loading exception ledger" aria-busy="true">
            {[1, 2, 3, 4].map((item) => (
              <li key={item}>
                <SkeletonBlock h={76} dark={dark} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="command-ledger-list">
            {/* Column headings, echoed as a row on narrow widths by the cells' own labels. */}
            <div className="command-row command-row--head" aria-hidden="true">
              <span>Record</span>
              <span>Current state</span>
              <span>Evidence</span>
              <span>Next action</span>
            </div>
            <ul>
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
                      <span className="command-row__record">
                        <span className="command-row__ref">
                          {item.ref} · {item.title}
                        </span>
                        <span className="command-row__lane">{item.lane}</span>
                      </span>
                      <span className="command-row__state" data-label="State">
                        {item.currentState}
                      </span>
                      <span className="command-row__evidence" data-label="Evidence">
                        <span className="status-pill" data-tone={item.locallyResolved ? 'done' : item.tone}>
                          {item.locallyResolved ? 'Resolved locally' : item.evidence}
                        </span>
                      </span>
                      {/* R2 — the per-row next action, in gold. */}
                      <span className="command-row__next" data-label="Next action">
                        {item.locallyResolved ? '—' : item.nextActionLabel}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {selected && (
        <ExceptionInspector
          item={selected}
          modal
          onClose={closeInspector}
          onResolveLocally={resolveLocally}
        />
      )}

      <div className="overview-twoup">
        <section className="command-path" aria-labelledby="command-path-heading">
          <div className="command-section-head">
            <h2 id="command-path-heading">Today’s operational path</h2>
            <span>{OPERATIONAL_PATH.length} next actions</span>
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

        <section className="command-provenance" aria-labelledby="command-provenance-heading">
          <div className="command-section-head">
            <h2 id="command-provenance-heading">Evidence and provenance</h2>
            <span>Ledger {PROVENANCE.ledgerRevision}</span>
          </div>
          <div className="provenance-body">
            <dl className="provenance-facts">
              <div>
                <dt>Projection snapshot</dt>
                <dd>{PROVENANCE.projectionSnapshot}</dd>
              </div>
              <div>
                <dt>Last confirmed event</dt>
                <dd>{PROVENANCE.lastConfirmedEvent}</dd>
              </div>
              <div>
                <dt>Data</dt>
                <dd>{PROVENANCE.fixtureNote}</dd>
              </div>
            </dl>
            <div className="provenance-recent">
              <p className="provenance-recent__title">What changed</p>
              <ul>
                {RECENT_EVENTS.map((entry) => (
                  <li key={entry.time}>
                    <time>{entry.time}</time>
                    <span>{entry.action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="provenance-gap">{PROVENANCE.gap}</p>
        </section>
      </div>

      {/* R3 — restored. Ledger against projection is the reconciliation evidence. */}
      <section className="command-reconciliation" aria-labelledby="command-recon-heading">
        <div className="command-section-head">
          <h2 id="command-recon-heading">Reconciliation and provenance</h2>
          <span>
            {RECON_ROWS.length} of {RECON_ROWS.length} reconciled
          </span>
        </div>
        {loading ? (
          <SkeletonBlock h={160} dark={dark} />
        ) : (
          <div className="recon-table-wrap">
            <table className="recon-table">
              <thead>
                <tr>
                  <th scope="col">Measure</th>
                  <th scope="col">Ledger</th>
                  <th scope="col">Projection</th>
                  <th scope="col">State</th>
                </tr>
              </thead>
              <tbody>
                {RECON_ROWS.map((row) => {
                  const matched = row.ledger === row.projection;
                  return (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      <td>{row.ledger}</td>
                      <td>{row.projection}</td>
                      <td>
                        <span className="status-pill" data-tone={matched ? 'done' : 'alert'}>
                          {matched ? 'Reconciled' : 'Discrepancy'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="command-record recon-source">{RECON_SOURCE}</p>
      </section>
    </div>
  );
}

function numberWord(n: number) {
  return ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'][n] ?? String(n);
}
