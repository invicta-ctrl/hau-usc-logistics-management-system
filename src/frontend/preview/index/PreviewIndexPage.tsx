import { useEffect, useMemo, useRef, useState } from 'react';
import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Route } from '../../app/appTypes';
import { appRouteHash } from '../../app/routeHash';
import { FrontendApiError, frontendBackend, type FrontendSystemStatus } from '../../integration/backend';
import type { PreviewIndexBrowseState } from './inspection';
import { readRecentPreviewRoutes, recordRecentPreviewRoute } from './recent';
import { listPreviewRoutes, type PreviewRouteEntry } from './registry';
import { filterPreviewRoutes, groupPreviewRoutes, searchPreviewRoutes } from './selectors';
import {
  ACCESS_REQUIREMENT_LABELS,
  BACKEND_STATUS_LABELS,
  IMPLEMENTATION_STATUS_LABELS,
  PREVIEW_FILTER,
  PREVIEW_FILTER_LABELS,
  PREVIEW_MODE_LABELS,
  ROUTE_GROUP_LABELS,
  type PreviewFilter,
} from './vocabulary';
import './PreviewIndex.css';

type QaStatus =
  | Readonly<{ state: 'loading' }>
  | Readonly<{ state: 'authorization-required' }>
  | Readonly<{ state: 'unavailable' }>
  | Readonly<{ state: 'ready'; value: FrontendSystemStatus }>;

let qaStatusRequest: Promise<FrontendSystemStatus> | null = null;

function loadQaStatus(): Promise<FrontendSystemStatus> {
  qaStatusRequest ??= frontendBackend.systemStatus();
  return qaStatusRequest;
}

function routeHref(entry: PreviewRouteEntry, inspection: boolean): string {
  return inspection ? `#/__preview/inspect/${entry.route}` : appRouteHash(entry.route);
}

function EntryMeta({ label, value, kind }: { label: string; value: string; kind: string }) {
  return (
    <div className="preview-entry-meta" data-preview-entry-meta={kind}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function PreviewEntryRow({
  entry,
  onOpen,
  onOpenPreview,
  onRouteKeyDown,
}: {
  entry: PreviewRouteEntry;
  onOpen: (entry: PreviewRouteEntry) => void;
  onOpenPreview: (entry: PreviewRouteEntry) => void;
  onRouteKeyDown: (event: ReactKeyboardEvent<HTMLAnchorElement>) => void;
}) {
  const authenticated = entry.access === 'AUTHENTICATED';
  return (
    <li className="preview-entry" data-preview-route={entry.route}>
      <div className="preview-entry-main">
        <div className="preview-entry-heading">
          <h3 className="preview-entry-label">{entry.label}</h3>
          <span className="preview-entry-route">{entry.route}</span>
        </div>
        <p className="preview-entry-description">{entry.description}</p>
        <dl className="preview-entry-metas">
          <EntryMeta label="Status" value={IMPLEMENTATION_STATUS_LABELS[entry.implementationStatus]} kind="status" />
          <EntryMeta label="Connection" value={BACKEND_STATUS_LABELS[entry.backendStatus]} kind="backend" />
          <EntryMeta label="Access" value={ACCESS_REQUIREMENT_LABELS[entry.access]} kind="access" />
          <EntryMeta label="Mode" value={PREVIEW_MODE_LABELS[entry.previewMode]} kind="mode" />
        </dl>
      </div>
      <div className="preview-entry-actions">
        {authenticated ? (
          <>
            <a
              href={routeHref(entry, true)}
              className="preview-action"
              data-action="open-preview"
              data-preview-route-link
              onKeyDown={onRouteKeyDown}
              onClick={(event) => {
                event.preventDefault();
                onOpenPreview(entry);
              }}
            >
              Open inspection
            </a>
            <a
              href={routeHref(entry, false)}
              className="preview-action preview-action-secondary"
              data-action="test-real-access"
              onClick={(event) => {
                event.preventDefault();
                onOpen(entry);
              }}
            >
              Check signed-in access
            </a>
          </>
        ) : (
          <a
            href={routeHref(entry, false)}
            className="preview-action"
            data-action="open"
            data-preview-route-link
            onKeyDown={onRouteKeyDown}
            onClick={(event) => {
              event.preventDefault();
              onOpen(entry);
            }}
          >
            Open page
          </a>
        )}
      </div>
    </li>
  );
}

function QaStatusStrip({ status, onOpenReset }: { status: QaStatus; onOpenReset: () => void }) {
  const playground = status.state === 'ready' ? status.value.playground : null;
  const protectedValue = status.state === 'unavailable' ? 'Not available' : 'Owner sign-in required';
  const backendLabel =
    status.state === 'loading'
      ? 'Checking'
      : status.state === 'ready'
        ? status.value.readiness === 'REPORTED_READY'
          ? 'Ready'
          : 'Responding'
        : status.state === 'authorization-required'
          ? 'Available · owner sign-in required'
          : 'Unavailable';
  return (
    <section className="preview-qa-status" aria-labelledby="preview-qa-status-heading">
      <div className="preview-section-heading">
        <div>
          <p className="preview-index-eyebrow">Current QA context</p>
          <h2 id="preview-qa-status-heading">Playground runtime</h2>
        </div>
        <span className="preview-environment-badge">Isolated Playground</span>
      </div>
      <dl className="preview-status-strip" aria-live="polite">
        <div><dt>Backend</dt><dd data-preview-backend-health>{backendLabel}</dd></div>
        <div><dt>Baseline</dt><dd data-preview-baseline>{playground ? `${playground.baselineId} · v${playground.baselineVersion}` : protectedValue}</dd></div>
        <div><dt>Generation</dt><dd data-preview-generation>{playground ? playground.generation : '—'}</dd></div>
        <div><dt>Working state</dt><dd>{playground?.workingState ?? 'Not available'}</dd></div>
      </dl>
      <a
        href={appRouteHash('administration')}
        className="preview-reset-shortcut"
        data-action="reset-shortcut"
        onClick={(event) => {
          event.preventDefault();
          onOpenReset();
        }}
      >
        Open authorized reset controls
      </a>
    </section>
  );
}

export function PreviewIndexPage({
  navigate,
  onClose,
  onCancelLauncherRestore,
  browseState,
  onBrowseStateChange,
  onOpenPreview,
}: {
  navigate: (route: Route) => void;
  onClose: () => void;
  onCancelLauncherRestore: () => void;
  returnFocusRequestedRef: { current: boolean };
  browseState: PreviewIndexBrowseState;
  onBrowseStateChange: (state: PreviewIndexBrowseState) => void;
  onOpenPreview: (entry: PreviewRouteEntry) => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLElement>(null);
  const [query, setQuery] = useState(browseState.query);
  const [filter, setFilter] = useState<PreviewFilter>(browseState.filter);
  const [recentRoutes, setRecentRoutes] = useState<Route[]>(() => readRecentPreviewRoutes());
  const [qaStatus, setQaStatus] = useState<QaStatus>({ state: 'loading' });

  useEffect(() => {
    headingRef.current?.focus();
    if (browseState.scrollTop) requestAnimationFrame(() => window.scrollTo({ top: browseState.scrollTop }));
  }, [browseState.scrollTop]);

  useEffect(() => {
    onBrowseStateChange({ query, filter, scrollTop: window.scrollY });
  }, [filter, onBrowseStateChange, query]);

  useEffect(() => {
    let active = true;
    loadQaStatus()
      .then((value) => {
        if (active) setQaStatus({ state: 'ready', value });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setQaStatus(
          error instanceof FrontendApiError && [401, 403].includes(error.status)
            ? { state: 'authorization-required' }
            : { state: 'unavailable' },
        );
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.matches('input, textarea, select, [contenteditable="true"]')) return;
      event.preventDefault();
      searchRef.current?.focus();
    };
    window.addEventListener('keydown', focusSearch);
    return () => window.removeEventListener('keydown', focusSearch);
  }, []);

  useEffect(() => {
    const skipLink = document.querySelector<HTMLAnchorElement>('.skip-link');
    if (!skipLink) return;
    const activate = (event: Event) => {
      event.preventDefault();
      headingRef.current?.focus();
    };
    skipLink.addEventListener('click', activate);
    return () => skipLink.removeEventListener('click', activate);
  }, []);

  const visibleEntries = useMemo(
    () => searchPreviewRoutes(query, filterPreviewRoutes(filter)),
    [filter, query],
  );
  const groups = useMemo(() => groupPreviewRoutes(visibleEntries), [visibleEntries]);
  const recentEntries = useMemo(
    () => recentRoutes
      .map((route) => listPreviewRoutes().find((entry) => entry.route === route))
      .filter((entry): entry is PreviewRouteEntry => Boolean(entry)),
    [recentRoutes],
  );

  const remember = (entry: PreviewRouteEntry) => {
    setRecentRoutes((current) => recordRecentPreviewRoute(entry.route, current));
  };
  const openRoute = (entry: PreviewRouteEntry) => {
    remember(entry);
    onBrowseStateChange({ query, filter, scrollTop: window.scrollY });
    onCancelLauncherRestore();
    navigate(entry.route);
  };
  const openPreviewRoute = (entry: PreviewRouteEntry) => {
    remember(entry);
    onBrowseStateChange({ query, filter, scrollTop: window.scrollY });
    onOpenPreview(entry);
  };
  const openPreferredRoute = (entry: PreviewRouteEntry) => {
    if (entry.access === 'AUTHENTICATED') openPreviewRoute(entry);
    else openRoute(entry);
  };
  const openReset = () => {
    const administration = listPreviewRoutes().find((entry) => entry.route === 'administration');
    if (administration) openRoute(administration);
  };
  const testRealLogin = () => {
    onCancelLauncherRestore();
    onClose();
    navigate('staff-signin');
  };

  const focusRouteLink = (event: ReactKeyboardEvent<HTMLAnchorElement>, direction: number | 'first' | 'last') => {
    const links = [...(mainRef.current?.querySelectorAll<HTMLAnchorElement>('[data-preview-route-link]') ?? [])];
    if (!links.length) return;
    const current = links.indexOf(event.currentTarget);
    const next = direction === 'first'
      ? 0
      : direction === 'last'
        ? links.length - 1
        : (current + direction + links.length) % links.length;
    event.preventDefault();
    links[next]?.focus();
  };
  const onRouteKeyDown = (event: ReactKeyboardEvent<HTMLAnchorElement>) => {
    if (event.key === 'ArrowDown') focusRouteLink(event, 1);
    if (event.key === 'ArrowUp') focusRouteLink(event, -1);
    if (event.key === 'Home') focusRouteLink(event, 'first');
    if (event.key === 'End') focusRouteLink(event, 'last');
  };

  return (
    <main ref={mainRef} id="main-content" className="preview-index" data-preview-index>
      <div className="preview-index-inner">
        <header className="preview-index-header">
          <div>
            <p className="preview-index-eyebrow">QA and demo launcher</p>
            <h1 ref={headingRef} tabIndex={-1} className="preview-index-title">Playground Index</h1>
            <p className="preview-index-subtitle">Find a workspace, inspect its current route, or verify real signed-in access.</p>
          </div>
          <button type="button" className="preview-action preview-action-secondary" data-action="back" onClick={onClose}>Back</button>
        </header>

        <QaStatusStrip status={qaStatus} onOpenReset={openReset} />

        {recentEntries.length ? (
          <section className="preview-recent" aria-labelledby="preview-recent-heading" data-preview-recent>
            <div className="preview-section-heading">
              <h2 id="preview-recent-heading">Recently visited</h2>
              <span>{recentEntries.length} saved locally</span>
            </div>
            <ul>
              {recentEntries.map((entry) => (
                <li key={entry.route}>
                  <a
                    href={routeHref(entry, entry.access === 'AUTHENTICATED')}
                    data-preview-recent-route={entry.route}
                    onClick={(event) => {
                      event.preventDefault();
                      openPreferredRoute(entry);
                    }}
                  >
                    <span>{entry.label}</span><small>{entry.route}</small>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="preview-index-list" aria-labelledby="preview-workspaces-heading">
          <div className="preview-section-heading">
            <div>
              <h2 id="preview-workspaces-heading">Workspaces</h2>
              <p>Press <kbd>/</kbd> to search. Use ↑ and ↓ between primary route links.</p>
            </div>
            <p className="preview-result-count" aria-live="polite" data-preview-count>
              {visibleEntries.length} {visibleEntries.length === 1 ? 'route' : 'routes'}
            </p>
          </div>
          <div className="preview-index-controls">
            <label className="preview-search">
              <span className="preview-sr-only">Search Playground pages</span>
              <input
                ref={searchRef}
                type="search"
                data-preview-search
                placeholder="Search workspaces by name, route, or purpose"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape' && query) {
                    event.preventDefault();
                    setQuery('');
                  }
                  if (event.key === 'ArrowDown') {
                    const first = mainRef.current?.querySelector<HTMLAnchorElement>('[data-preview-route-link]');
                    if (first) {
                      event.preventDefault();
                      first.focus();
                    }
                  }
                }}
              />
            </label>
            <div className="preview-filters" role="group" aria-label="Filter Playground pages">
              {PREVIEW_FILTER.map((item) => (
                <button key={item} type="button" className="preview-filter" data-filter={item} aria-pressed={filter === item} onClick={() => setFilter(item)}>
                  {PREVIEW_FILTER_LABELS[item]}
                </button>
              ))}
            </div>
          </div>

          {visibleEntries.length === 0 ? (
            <p className="preview-empty" data-preview-empty>No Playground pages match the current search and filters.</p>
          ) : (
            groups.map((group) => (
              <section key={group.group} className="preview-group" data-preview-group={group.group} aria-labelledby={`preview-group-${group.group}`}>
                <h3 id={`preview-group-${group.group}`} className="preview-group-title">{ROUTE_GROUP_LABELS[group.group]}</h3>
                <ul className="preview-entry-list">
                  {group.items.map((entry) => (
                    <PreviewEntryRow key={entry.route} entry={entry} onOpen={openRoute} onOpenPreview={openPreviewRoute} onRouteKeyDown={onRouteKeyDown} />
                  ))}
                </ul>
              </section>
            ))
          )}

          <button type="button" className="preview-action preview-action-secondary preview-action-test-login" data-action="test-login" onClick={testRealLogin}>Test staff sign-in</button>
        </section>
      </div>
    </main>
  );
}
