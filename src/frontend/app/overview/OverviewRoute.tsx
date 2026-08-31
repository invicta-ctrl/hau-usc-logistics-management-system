import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, RefreshCw, ShieldAlert } from 'lucide-react';
import {
  FrontendApiError,
  frontendBackend,
  type FrontendOperationalModuleBootstrap,
} from '../../integration/backend';
import type { Route, Session } from '../appTypes';
import { presentStatus, projectOverview, type OverviewSignal } from './overviewData';

type OverviewLoadState = 'loading' | 'ready' | 'refreshing' | 'stale' | 'error' | 'denied';

function formatTimestamp(value: string) {
  if (!value) return 'Time not reported';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? 'Time not reported'
    : new Intl.DateTimeFormat('en-PH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(parsed);
}

function SignalList({
  values,
  empty,
  navigate,
  availableRoutes,
}: {
  values: OverviewSignal[];
  empty: string;
  navigate: (route: Route) => void;
  availableRoutes: Set<Route>;
}) {
  if (values.length === 0) return <p className="operations-overview__empty">{empty}</p>;
  return (
    <ol className="operations-overview__signal-list">
      {values.map((signal) => {
        const canOpen = availableRoutes.has(signal.route);
        return (
          <li key={signal.key} className="operations-overview__signal">
            <div className="operations-overview__signal-copy">
              <p className="operations-overview__eyebrow">{signal.eyebrow}</p>
              <h3>{signal.title}</h3>
              <p>{signal.detail}</p>
              <div className="operations-overview__signal-meta">
                <span>{presentStatus(signal.status)}</span>
                {signal.updatedAt ? (
                  <time dateTime={signal.updatedAt}>{formatTimestamp(signal.updatedAt)}</time>
                ) : null}
              </div>
            </div>
            {canOpen ? (
              <button
                type="button"
                onClick={() => navigate(signal.route)}
                aria-label={`Open ${signal.title}`}
              >
                <ArrowRight aria-hidden="true" size={16} strokeWidth={1.7} />
              </button>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}

const WORKSPACES: Array<{ route: Route; label: string; detail: string }> = [
  { route: 'request-center', label: 'Review requests', detail: 'Triage and route submitted work.' },
  { route: 'inventory', label: 'Inspect inventory', detail: 'Search stock truth and record context.' },
  { route: 'lending', label: 'Run lending', detail: 'Review loans, claims, handoffs, and returns.' },
  { route: 'release', label: 'Open Release Desk', detail: 'Complete authorized physical releases.' },
  { route: 'restocking', label: 'Manage restocking', detail: 'Receive and reconcile replenishment.' },
  { route: 'procurement', label: 'Open procurement', detail: 'Continue canvassing and deliverables.' },
  { route: 'events', label: 'Review events', detail: 'Confirm schedules and preparation context.' },
];

export function OverviewRoute({ session, navigate }: { session: Session; navigate: (route: Route) => void }) {
  const [loadState, setLoadState] = useState<OverviewLoadState>('loading');
  const [bootstrap, setBootstrap] = useState<FrontendOperationalModuleBootstrap | null>(null);
  const bootstrapRef = useRef<FrontendOperationalModuleBootstrap | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const abort = new AbortController();
    setLoadState(bootstrapRef.current ? 'refreshing' : 'loading');
    setErrorMessage('');
    void frontendBackend
      .operationalModuleBootstrap('overview', abort.signal)
      .then((result) => {
        if (abort.signal.aborted) return;
        bootstrapRef.current = result;
        setBootstrap(result);
        setLoadState('ready');
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        if (error instanceof FrontendApiError && [401, 403].includes(error.status)) {
          setLoadState('denied');
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : 'The overview could not be loaded.');
        setLoadState(bootstrapRef.current ? 'stale' : 'error');
      });
    return () => abort.abort();
  }, [reloadKey]);

  const projection = bootstrap ? projectOverview(bootstrap.data) : null;
  const availableRoutes = new Set<Route>(session.capabilities);
  const workspaces = WORKSPACES.filter((entry) => availableRoutes.has(entry.route));

  if (loadState === 'denied') {
    return (
      <main className="operations-overview layout-container" aria-labelledby="overview-title">
        <section className="operations-overview__state surface-content">
          <ShieldAlert aria-hidden="true" size={24} />
          <h1 id="overview-title">Overview access is limited</h1>
          <p>This operational projection is not available for the current session.</p>
        </section>
      </main>
    );
  }

  if (loadState === 'error' && !bootstrap) {
    return (
      <main className="operations-overview layout-container" aria-labelledby="overview-title">
        <section className="operations-overview__state surface-content">
          <AlertTriangle aria-hidden="true" size={24} />
          <h1 id="overview-title">Overview unavailable</h1>
          <p>{errorMessage || 'No data has been changed. Try loading the authorized projection again.'}</p>
          <button
            type="button"
            className="operations-overview__primary-action"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            <RefreshCw aria-hidden="true" size={16} />
            Retry
          </button>
        </section>
      </main>
    );
  }

  return (
    <main
      className="operations-overview layout-container"
      aria-labelledby="overview-title"
      aria-busy={loadState === 'loading' || loadState === 'refreshing'}
    >
      <header className="operations-overview__header">
        <div>
          <p className="operations-overview__kicker">Main Logistics Hub</p>
          <h1 id="overview-title">Good work starts with the next clear action.</h1>
          <p className="operations-overview__lede">
            {session.displayName}, this view organizes the current authorized projection by attention,
            readiness, blockage, and recent change.
          </p>
        </div>
        <button
          type="button"
          className="operations-overview__refresh"
          onClick={() => setReloadKey((value) => value + 1)}
          disabled={loadState === 'loading' || loadState === 'refreshing'}
        >
          <RefreshCw aria-hidden="true" size={16} />
          {loadState === 'refreshing' ? 'Refreshing…' : 'Refresh overview'}
        </button>
      </header>

      {loadState === 'loading' && !projection ? (
        <section className="operations-overview__loading surface-content" role="status">
          <span className="operations-overview__pulse" aria-hidden="true" />
          <p>Loading the current authorized work…</p>
        </section>
      ) : null}

      {loadState === 'stale' ? (
        <div className="operations-overview__notice" role="status">
          <AlertTriangle aria-hidden="true" size={17} />
          <span>Refresh failed. The last successful projection remains visible and may be out of date.</span>
        </div>
      ) : null}

      {projection ? (
        <>
          <section className="operations-overview__brief surface-content" aria-label="Operational brief">
            <div>
              <p className="operations-overview__kicker">Current brief</p>
              <p className="operations-overview__brief-copy">
                <strong>{projection.attention.length}</strong> visible signals need attention;{' '}
                <strong>{projection.ready.length}</strong> are ready to continue;{' '}
                <strong>{projection.blocked.length}</strong> are blocked in this bounded view.
              </p>
            </div>
            <p className="operations-overview__revision">
              Authorized source · revision {bootstrap?.scopeRevision.token}
              <br />
              <time dateTime={bootstrap?.scopeRevision.updatedAt}>
                {formatTimestamp(bootstrap?.scopeRevision.updatedAt ?? '')}
              </time>
            </p>
          </section>

          <div className="operations-overview__grid">
            <section
              className="operations-overview__panel operations-overview__panel--attention surface-content"
              aria-labelledby="overview-attention-title"
            >
              <div className="operations-overview__section-head">
                <div>
                  <p className="operations-overview__kicker">Act first</p>
                  <h2 id="overview-attention-title">Needs attention</h2>
                </div>
                <AlertTriangle aria-hidden="true" size={20} />
              </div>
              <SignalList
                values={projection.attention}
                empty="No attention signals appear in the current bounded projection."
                navigate={navigate}
                availableRoutes={availableRoutes}
              />
            </section>

            <div className="operations-overview__side-stack">
              <section
                className="operations-overview__panel surface-content"
                aria-labelledby="overview-ready-title"
              >
                <div className="operations-overview__section-head">
                  <div>
                    <p className="operations-overview__kicker">Can move now</p>
                    <h2 id="overview-ready-title">Ready</h2>
                  </div>
                  <CheckCircle2 aria-hidden="true" size={20} />
                </div>
                <SignalList
                  values={projection.ready}
                  empty="No ready signals appear in this projection."
                  navigate={navigate}
                  availableRoutes={availableRoutes}
                />
              </section>

              <section
                className="operations-overview__panel surface-content"
                aria-labelledby="overview-blocked-title"
              >
                <div className="operations-overview__section-head">
                  <div>
                    <p className="operations-overview__kicker">Needs resolution</p>
                    <h2 id="overview-blocked-title">Blocked</h2>
                  </div>
                  <ShieldAlert aria-hidden="true" size={20} />
                </div>
                <SignalList
                  values={projection.blocked}
                  empty="No blocked signals appear in this projection."
                  navigate={navigate}
                  availableRoutes={availableRoutes}
                />
              </section>
            </div>
          </div>

          <div className="operations-overview__lower-grid">
            <section
              className="operations-overview__panel surface-content"
              aria-labelledby="overview-changed-title"
            >
              <div className="operations-overview__section-head">
                <div>
                  <p className="operations-overview__kicker">Recent record activity</p>
                  <h2 id="overview-changed-title">What changed</h2>
                </div>
                <Clock3 aria-hidden="true" size={20} />
              </div>
              <SignalList
                values={projection.changed}
                empty="No dated changes appear in this bounded projection."
                navigate={navigate}
                availableRoutes={availableRoutes}
              />
            </section>

            <nav className="operations-overview__panel surface-content" aria-labelledby="overview-work-title">
              <div className="operations-overview__section-head">
                <div>
                  <p className="operations-overview__kicker">Your authorized workspaces</p>
                  <h2 id="overview-work-title">Continue work</h2>
                </div>
              </div>
              {workspaces.length ? (
                <ul className="operations-overview__workspace-list">
                  {workspaces.map((entry) => (
                    <li key={entry.route}>
                      <button type="button" onClick={() => navigate(entry.route)}>
                        <span>
                          <strong>{entry.label}</strong>
                          <small>{entry.detail}</small>
                        </span>
                        <ArrowRight aria-hidden="true" size={16} />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="operations-overview__empty">
                  No additional workspace is assigned to this session.
                </p>
              )}
              <p className="operations-overview__scope-note">
                This brief summarizes {projection.sourceRecordCount} records returned by the bounded module
                projection; it is not a global system total.
              </p>
            </nav>
          </div>
        </>
      ) : null}
    </main>
  );
}
