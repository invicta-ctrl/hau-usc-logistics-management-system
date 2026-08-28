import { useEffect, useMemo, useRef, useState } from 'react';
import type { Route } from '../../app/appTypes';
import { listPreviewRoutes } from './registry';
import type { PreviewRouteEntry } from './registry';
import type { PreviewIndexBrowseState } from './inspection';
import { filterPreviewRoutes, groupPreviewRoutes, searchPreviewRoutes } from './selectors';
import {
  ACCESS_REQUIREMENT_LABELS,
  BACKEND_STATUS_LABELS,
  COMPLETENESS_CLASSIFICATION_LABELS,
  IMPLEMENTATION_STATUS_LABELS,
  PREVIEW_FILTER,
  PREVIEW_FILTER_LABELS,
  PREVIEW_MODE_LABELS,
  ROUTE_GROUP_LABELS,
  type PreviewFilter,
} from './vocabulary';
import './PreviewIndex.css';

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
  onSurface,
  surfaceTriggerRef,
}: {
  entry: PreviewRouteEntry;
  onOpen: (entry: PreviewRouteEntry) => void;
  onOpenPreview: (entry: PreviewRouteEntry) => void;
  onSurface: (entry: PreviewRouteEntry, trigger: HTMLButtonElement) => void;
  surfaceTriggerRef: (route: string, node: HTMLButtonElement | null) => void;
}) {
  return (
    <li className="preview-entry" data-preview-route={entry.route}>
      <div className="preview-entry-main">
        <h3 className="preview-entry-label">{entry.label}</h3>
        <p className="preview-entry-route">{entry.route}</p>
        <p className="preview-entry-description">{entry.description}</p>
        <dl className="preview-entry-metas">
          <EntryMeta
            label="Status"
            value={IMPLEMENTATION_STATUS_LABELS[entry.implementationStatus]}
            kind="status"
          />
          <EntryMeta label="Connection" value={BACKEND_STATUS_LABELS[entry.backendStatus]} kind="backend" />
          <EntryMeta label="Access" value={ACCESS_REQUIREMENT_LABELS[entry.access]} kind="access" />
          <EntryMeta label="Mode" value={PREVIEW_MODE_LABELS[entry.previewMode]} kind="mode" />
          <EntryMeta
            label="Completeness"
            value={COMPLETENESS_CLASSIFICATION_LABELS[entry.completeness]}
            kind="completeness"
          />
        </dl>
      </div>
      <div className="preview-entry-actions">
        {entry.access === 'AUTHENTICATED' ? (
          <>
            <button
              type="button"
              className="preview-action"
              data-action="open-preview"
              onClick={() => onOpenPreview(entry)}
            >
              Open inspection
            </button>
            <button
              type="button"
              className="preview-action preview-action-secondary"
              data-action="test-real-access"
              onClick={() => onOpen(entry)}
            >
              Check signed-in access
            </button>
          </>
        ) : (
          <button type="button" className="preview-action" data-action="open" onClick={() => onOpen(entry)}>
            Open page
          </button>
        )}
        {entry.previewMode === 'SURFACE_PREVIEW' ? (
          <button
            type="button"
            className="preview-action preview-action-secondary"
            data-action="surface"
            ref={(node) => surfaceTriggerRef(entry.route, node)}
            onClick={(event) => onSurface(entry, event.currentTarget)}
          >
            Open inspection page
          </button>
        ) : null}
      </div>
    </li>
  );
}

function SurfacePreview({ entry, onClose }: { entry: PreviewRouteEntry; onClose: () => void }) {
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    backRef.current?.focus();
  }, []);

  return (
    <section className="preview-surface" aria-labelledby="preview-surface-heading" data-preview-surface>
      <header className="preview-surface-header">
        <div>
          <p className="preview-surface-eyebrow">Inspection page</p>
          <h2 id="preview-surface-heading">{entry.label}</h2>
        </div>
        <button
          ref={backRef}
          type="button"
          className="preview-action"
          data-action="surface-back"
          onClick={onClose}
        >
          Back to index
        </button>
      </header>
      <div className="preview-surface-body">
        <p className="preview-surface-note" role="note">
          Sample data · Actions unavailable. This page is not an accepted operational workflow.
        </p>
        <dl className="preview-surface-sample">
          <div>
            <dt>Sample record</dt>
            <dd>Pending review</dd>
          </div>
          <div>
            <dt>Sample category</dt>
            <dd>General</dd>
          </div>
          <div>
            <dt>Sample status</dt>
            <dd>Not available</dd>
          </div>
        </dl>
      </div>
    </section>
  );
}

export function PreviewIndexPage({
  navigate,
  onClose,
  onCancelLauncherRestore,
  returnFocusRequestedRef,
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
  const [query, setQuery] = useState(browseState.query);
  const [filter, setFilter] = useState<PreviewFilter>(browseState.filter);
  const [surfaceRoute, setSurfaceRoute] = useState<string | null>(null);
  const surfaceTriggers = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    headingRef.current?.focus();
    if (browseState.scrollTop) {
      requestAnimationFrame(() => window.scrollTo({ top: browseState.scrollTop }));
    }
  }, [browseState.scrollTop]);

  useEffect(() => {
    onBrowseStateChange({ query, filter, scrollTop: window.scrollY });
  }, [filter, onBrowseStateChange, query]);

  useEffect(() => {
    const skipLink = document.querySelector<HTMLAnchorElement>('.skip-link');
    if (!skipLink) return;

    const activate = (event: Event) => {
      event.preventDefault();
      headingRef.current?.focus();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        activate(event);
      }
    };

    skipLink.addEventListener('click', activate);
    skipLink.addEventListener('keydown', onKeyDown);
    return () => {
      skipLink.removeEventListener('click', activate);
      skipLink.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const surfaceEntry = useMemo(
    () => (surfaceRoute ? (listPreviewRoutes().find((entry) => entry.route === surfaceRoute) ?? null) : null),
    [surfaceRoute],
  );

  const visibleEntries = useMemo(() => {
    const filtered = filterPreviewRoutes(filter);
    return searchPreviewRoutes(query, filtered);
  }, [filter, query]);

  const groups = useMemo(() => groupPreviewRoutes(visibleEntries), [visibleEntries]);

  const openRoute = (entry: PreviewRouteEntry) => {
    onBrowseStateChange({ query, filter, scrollTop: window.scrollY });
    onCancelLauncherRestore();
    navigate(entry.route);
  };

  const openPreviewRoute = (entry: PreviewRouteEntry) => {
    onBrowseStateChange({ query, filter, scrollTop: window.scrollY });
    onOpenPreview(entry);
  };

  const openSurface = (entry: PreviewRouteEntry, trigger: HTMLButtonElement) => {
    surfaceTriggers.current.set(entry.route, trigger);
    setSurfaceRoute(entry.route);
  };

  const closeSurface = () => {
    const route = surfaceRoute;
    setSurfaceRoute(null);
    requestAnimationFrame(() => {
      if (route) surfaceTriggers.current.get(route)?.focus();
    });
  };

  const testRealLogin = () => {
    onCancelLauncherRestore();
    onClose();
    navigate('staff-signin');
  };

  return (
    <main id="main-content" className="preview-index" data-preview-index>
      <div className="preview-index-inner">
        <header className="preview-index-header">
          <div>
            <p className="preview-index-eyebrow">Playground inspection</p>
            <h1 ref={headingRef} tabIndex={-1} className="preview-index-title">
              Playground Index
            </h1>
            <p className="preview-index-subtitle">
              Review each page, its access requirement, and its current readiness.
            </p>
          </div>
          <button type="button" className="preview-action" data-action="back" onClick={onClose}>
            Back
          </button>
        </header>

        <div className="preview-index-list" style={{ display: surfaceRoute ? 'none' : undefined }}>
          <div className="preview-index-controls">
            <label className="preview-search">
              <span className="preview-sr-only">Search Playground pages</span>
              <input
                type="search"
                data-preview-search
                placeholder="Search pages"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="preview-filters" role="group" aria-label="Filter Playground pages">
              {PREVIEW_FILTER.map((item) => (
                <button
                  key={item}
                  type="button"
                  className="preview-filter"
                  data-filter={item}
                  aria-pressed={filter === item}
                  onClick={() => setFilter(item)}
                >
                  {PREVIEW_FILTER_LABELS[item]}
                </button>
              ))}
            </div>
          </div>

          <p className="preview-result-count" aria-live="polite" data-preview-count>
            {visibleEntries.length} {visibleEntries.length === 1 ? 'route' : 'routes'}
          </p>

          {visibleEntries.length === 0 ? (
            <p className="preview-empty" data-preview-empty>
              No Playground pages match the current search and filters.
            </p>
          ) : (
            groups.map((group) => (
              <section
                key={group.group}
                className="preview-group"
                data-preview-group={group.group}
                aria-labelledby={`preview-group-${group.group}`}
              >
                <h2 id={`preview-group-${group.group}`} className="preview-group-title">
                  {ROUTE_GROUP_LABELS[group.group]}
                </h2>
                <ul className="preview-entry-list">
                  {group.items.map((entry) => (
                    <PreviewEntryRow
                      key={entry.route}
                      entry={entry}
                      onOpen={openRoute}
                      onOpenPreview={openPreviewRoute}
                      onSurface={openSurface}
                      surfaceTriggerRef={(route, node) => {
                        if (node) surfaceTriggers.current.set(route, node);
                        else surfaceTriggers.current.delete(route);
                      }}
                    />
                  ))}
                </ul>
              </section>
            ))
          )}

          <button
            type="button"
            className="preview-action preview-action-test-login"
            data-action="test-login"
            onClick={testRealLogin}
          >
            Test staff sign-in
          </button>
        </div>

        {surfaceEntry ? <SurfacePreview entry={surfaceEntry} onClose={closeSurface} /> : null}
      </div>
    </main>
  );
}
