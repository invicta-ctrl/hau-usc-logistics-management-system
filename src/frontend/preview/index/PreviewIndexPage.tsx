import { useEffect, useMemo, useRef, useState } from "react";
import type { Route } from "../../app/appTypes";
import { listPreviewRoutes } from "./registry";
import type { PreviewRouteEntry } from "./registry";
import { filterPreviewRoutes, groupPreviewRoutes, searchPreviewRoutes } from "./selectors";
import {
  ACCESS_REQUIREMENT_LABELS,
  BACKEND_STATUS_LABELS,
  IMPLEMENTATION_STATUS_LABELS,
  PREVIEW_FILTER,
  PREVIEW_FILTER_LABELS,
  PREVIEW_MODE_LABELS,
  ROUTE_GROUP_LABELS,
  type PreviewFilter,
} from "./vocabulary";
import "./PreviewIndex.css";

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
  onSurface,
  surfaceTriggerRef,
}: {
  entry: PreviewRouteEntry;
  onOpen: (entry: PreviewRouteEntry) => void;
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
          <EntryMeta label="Status" value={IMPLEMENTATION_STATUS_LABELS[entry.implementationStatus]} kind="status" />
          <EntryMeta label="Backend" value={BACKEND_STATUS_LABELS[entry.backendStatus]} kind="backend" />
          <EntryMeta label="Access" value={ACCESS_REQUIREMENT_LABELS[entry.access]} kind="access" />
          <EntryMeta label="Mode" value={PREVIEW_MODE_LABELS[entry.previewMode]} kind="mode" />
        </dl>
      </div>
      <div className="preview-entry-actions">
        <button
          type="button"
          className="preview-action"
          data-action="open"
          onClick={() => onOpen(entry)}
        >
          Open
        </button>
        {entry.previewMode === "SURFACE_PREVIEW" ? (
          <button
            type="button"
            className="preview-action preview-action-secondary"
            data-action="surface"
            ref={(node) => surfaceTriggerRef(entry.route, node)}
            onClick={(event) => onSurface(entry, event.currentTarget)}
          >
            Surface Preview
          </button>
        ) : null}
      </div>
    </li>
  );
}

function SurfacePreview({
  entry,
  onClose,
}: {
  entry: PreviewRouteEntry;
  onClose: () => void;
}) {
  const backRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    backRef.current?.focus();
  }, []);

  return (
    <section className="preview-surface" aria-labelledby="preview-surface-heading" data-preview-surface>
      <header className="preview-surface-header">
        <div>
          <p className="preview-surface-eyebrow">Surface preview</p>
          <h2 id="preview-surface-heading">{entry.label}</h2>
        </div>
        <button ref={backRef} type="button" className="preview-action" data-action="surface-back" onClick={onClose}>
          Back
        </button>
      </header>
      <div className="preview-surface-body">
        <p className="preview-surface-note" role="note">
          Visual reference only. This surface is not functionally wired and does not indicate acceptance.
        </p>
        <dl className="preview-surface-sample">
          <div><dt>Sample record</dt><dd>Pending review</dd></div>
          <div><dt>Sample category</dt><dd>General</dd></div>
          <div><dt>Sample status</dt><dd>Not available</dd></div>
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
}: {
  navigate: (route: Route) => void;
  onClose: () => void;
  onCancelLauncherRestore: () => void;
  returnFocusRequestedRef: { current: boolean };
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<PreviewFilter>("ALL");
  const [surfaceRoute, setSurfaceRoute] = useState<string | null>(null);
  const surfaceTriggers = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  const surfaceEntry = useMemo(
    () => (surfaceRoute ? listPreviewRoutes().find((entry) => entry.route === surfaceRoute) ?? null : null),
    [surfaceRoute],
  );

  const visibleEntries = useMemo(() => {
    const filtered = filterPreviewRoutes(filter);
    return searchPreviewRoutes(query, filtered);
  }, [filter, query]);

  const groups = useMemo(() => groupPreviewRoutes(visibleEntries), [visibleEntries]);

  const openRoute = (entry: PreviewRouteEntry) => {
    onCancelLauncherRestore();
    onClose();
    navigate(entry.route);
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
    navigate("staff-signin");
  };

  return (
    <main id="preview-index" className="preview-index" data-preview-index>
      <div className="preview-index-inner">
        <header className="preview-index-header">
          <div>
            <p className="preview-index-eyebrow">Private operator surface</p>
            <h1 ref={headingRef} tabIndex={-1} className="preview-index-title">
              Preview Module Index
            </h1>
            <p className="preview-index-subtitle">
              Canonical route inventory. Visual-only surfaces are not functional acceptance.
            </p>
          </div>
          <button type="button" className="preview-action" data-action="back" onClick={onClose}>
            Back
          </button>
        </header>

        <div className="preview-index-list" style={{ display: surfaceRoute ? "none" : undefined }}>
          <div className="preview-index-controls">
            <label className="preview-search">
              <span className="preview-sr-only">Search preview routes</span>
              <input
                type="search"
                data-preview-search
                placeholder="Search routes"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <div className="preview-filters" role="group" aria-label="Filter preview routes">
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
            {visibleEntries.length} {visibleEntries.length === 1 ? "route" : "routes"}
          </p>

          {visibleEntries.length === 0 ? (
            <p className="preview-empty" data-preview-empty>
              No preview routes match the current search and filters.
            </p>
          ) : (
            groups.map((group) => (
              <section key={group.group} className="preview-group" data-preview-group={group.group} aria-labelledby={`preview-group-${group.group}`}>
                <h2 id={`preview-group-${group.group}`} className="preview-group-title">
                  {ROUTE_GROUP_LABELS[group.group]}
                </h2>
                <ul className="preview-entry-list">
                  {group.items.map((entry) => (
                    <PreviewEntryRow
                      key={entry.route}
                      entry={entry}
                      onOpen={openRoute}
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

          <button type="button" className="preview-action preview-action-test-login" data-action="test-login" onClick={testRealLogin}>
            Test Real Login Flow
          </button>
        </div>

        {surfaceEntry ? <SurfacePreview entry={surfaceEntry} onClose={closeSurface} /> : null}
      </div>
    </main>
  );
}
