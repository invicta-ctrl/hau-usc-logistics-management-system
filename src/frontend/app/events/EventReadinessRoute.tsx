import { useEffect, useState, type ReactNode } from 'react';
import {
  FrontendApiError,
  frontendBackend,
  type FrontendEventManagement,
  type FrontendEventManagementCommandProjection,
} from '../../integration/backend';
import { EventManagementPanel } from './EventManagementPanel';

/* Hallmark · design-system: DESIGN.md · macrostructure: Activity readiness report · mode: inspect */

type EventLoadState = 'loading' | 'ready' | 'denied' | 'unavailable';
type EventCommandSaveState = 'refreshed' | 'recorded' | 'retry' | 'rejected';

const previewEventManagement: FrontendEventManagement = {
  series: [{ name: 'Sanitized event series', code: 'PREVIEW-SERIES', status: 'PREVIEW_ONLY' }],
  days: [
    {
      seriesName: 'Sanitized event series',
      name: 'Preview day',
      date: '',
      status: 'PREVIEW_ONLY',
    },
  ],
  activities: [
    {
      name: 'Preview activity',
      seriesName: 'Sanitized event series',
      date: '',
      activityType: 'PREVIEW_ONLY',
      status: 'PREVIEW_ONLY',
      timeStatus: 'NOT_LIVE',
    },
  ],
};

export function readableEventValue(value: string) {
  return value
    ? value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/gu, (letter) => letter.toUpperCase())
    : 'Not reported';
}

function EventState({
  kind,
  title,
  description,
  action,
  alert = false,
}: {
  kind: string;
  title: string;
  description: string;
  action?: ReactNode;
  alert?: boolean;
}) {
  return (
    <section className="events-state" role={alert ? 'alert' : 'status'}>
      <p className="events-eyebrow">{kind}</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {action}
    </section>
  );
}

function CollectionEmpty({ children }: { children: ReactNode }) {
  return (
    <div className="events-collection-empty" role="status">
      <p>{children}</p>
      <small>Nothing was inferred from another event collection.</small>
    </div>
  );
}

function ActivityReports({ activities }: { activities: FrontendEventManagement['activities'] }) {
  return (
    <section className="events-activity-section" aria-labelledby="event-activity-readiness-title">
      <div className="events-section-heading">
        <div>
          <p className="events-eyebrow">Primary report</p>
          <h2 id="event-activity-readiness-title">Activity logistics readiness</h2>
          <p>
            Each row repeats only the reported activity, series/date context, activity type, timing, and
            status. A reported status is not converted into a readiness score.
          </p>
        </div>
        <span>{activities.length} loaded</span>
      </div>
      {activities.length ? (
        <div className="events-activity-list" data-event-readiness-activities>
          {activities.map((activity, index) => (
            <article
              key={`${activity.seriesName}-${activity.name}-${activity.date}-${activity.activityType}-${index}`}
            >
              <div className="events-activity-lead">
                <div>
                  <h3>{activity.name}</h3>
                  <p>
                    {activity.seriesName || 'Series not reported'} · {activity.date || 'Date not reported'}
                  </p>
                </div>
                <span className="events-status">{readableEventValue(activity.status)}</span>
              </div>
              <dl className="events-facts">
                <div>
                  <dt>Activity type</dt>
                  <dd>{readableEventValue(activity.activityType)}</dd>
                </div>
                <div>
                  <dt>Reported timing</dt>
                  <dd>{readableEventValue(activity.timeStatus)}</dd>
                </div>
                <div>
                  <dt>Recorded status</dt>
                  <dd>{readableEventValue(activity.status)}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <CollectionEmpty>No activity logistics reports are loaded in this bounded view.</CollectionEmpty>
      )}
    </section>
  );
}

function ScheduleContext({
  series,
  days,
}: {
  series: FrontendEventManagement['series'];
  days: FrontendEventManagement['days'];
}) {
  return (
    <details className="events-schedule-context">
      <summary>
        <span>
          <strong>Series and day context</strong>
          <small>Secondary schedule records · read-only</small>
        </span>
        <span aria-hidden="true">{series.length + days.length} loaded</span>
      </summary>
      <div className="events-context-grid">
        <section aria-labelledby="event-series-context-title">
          <div className="events-context-heading">
            <h2 id="event-series-context-title">Series</h2>
            <span>{series.length}</span>
          </div>
          {series.length ? (
            <div className="events-context-list">
              {series.map((entry, index) => (
                <article key={`${entry.name}-${entry.code}-${index}`}>
                  <h3>{entry.name}</h3>
                  <p>{entry.code || 'Display code not reported'}</p>
                  <span>{readableEventValue(entry.status)}</span>
                </article>
              ))}
            </div>
          ) : (
            <CollectionEmpty>No event series are loaded in this bounded view.</CollectionEmpty>
          )}
        </section>
        <section aria-labelledby="event-days-context-title">
          <div className="events-context-heading">
            <h2 id="event-days-context-title">Days</h2>
            <span>{days.length}</span>
          </div>
          {days.length ? (
            <div className="events-context-list">
              {days.map((entry, index) => (
                <article key={`${entry.seriesName}-${entry.name}-${entry.date}-${index}`}>
                  <h3>{entry.name}</h3>
                  <p>
                    {entry.seriesName || 'Series not reported'} · {entry.date || 'Date not reported'}
                  </p>
                  <span>{readableEventValue(entry.status)}</span>
                </article>
              ))}
            </div>
          ) : (
            <CollectionEmpty>No event days are loaded in this bounded view.</CollectionEmpty>
          )}
        </section>
      </div>
    </details>
  );
}

export function EventReadinessRoute({
  dark,
  inspection = false,
  eventAllowed = false,
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
  const [loadState, setLoadState] = useState<EventLoadState>(inspection ? 'ready' : 'loading');
  const [reloadKey, setReloadKey] = useState(0);
  const [commandProjection, setCommandProjection] = useState<FrontendEventManagementCommandProjection | null>(null);
  const [commandPending, setCommandPending] = useState<'series' | 'day' | 'activity' | null>(null);
  const [commandNotice, setCommandNotice] = useState('');
  const [commandReloadRequired, setCommandReloadRequired] = useState(false);
  const [commandUnavailable, setCommandUnavailable] = useState(false);

  useEffect(() => {
    if (inspection) {
      setEventManagement(previewEventManagement);
      setLoadState('ready');
      return;
    }
    if (!eventAllowed) {
      setEventManagement(null);
      setLoadState('denied');
      return;
    }
    const abort = new AbortController();
    setCommandProjection(null);
    setCommandUnavailable(false);
    setLoadState('loading');
    void frontendBackend
      .eventManagementWithCommandProjection(abort.signal)
      .then(({ report, commandProjection: commands }) => {
        if (abort.signal.aborted) return;
        setEventManagement(report);
        setCommandProjection(commands);
        setCommandUnavailable(commands === null);
        setCommandReloadRequired(false);
        setLoadState('ready');
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        setCommandProjection(null);
        setLoadState(
          error instanceof FrontendApiError && [401, 403].includes(error.status) ? 'denied' : 'unavailable',
        );
      });
    return () => abort.abort();
  }, [eventAllowed, inspection, reloadKey]);

  async function saveCommand(
    kind: 'series' | 'day' | 'activity',
    command: Record<string, unknown>,
  ): Promise<EventCommandSaveState> {
    if (commandPending || commandReloadRequired) return 'rejected';
    setCommandPending(kind);
    setCommandNotice('');
    try {
      const receipt =
        kind === 'series'
          ? await frontendBackend.saveEventSeries(command)
          : kind === 'day'
            ? await frontendBackend.saveEventDay(command)
            : await frontendBackend.saveEventActivity(command);
      try {
        const { report, commandProjection: commands } = await frontendBackend.eventManagementWithCommandProjection();
        setEventManagement(report);
        setCommandProjection(commands);
        setCommandUnavailable(commands === null);
        if (commands === null) {
          setCommandReloadRequired(true);
          setCommandNotice(
            'Event saved, but event management could not refresh. Reload before another event change.',
          );
          return 'recorded';
        }
        setCommandReloadRequired(false);
        setCommandNotice('Event saved. The current server report was refreshed.');
        return 'refreshed';
      } catch {
        setCommandReloadRequired(true);
        setCommandNotice(
          'Event saved, but the current server report could not be refreshed. Reload before another event change.',
        );
        return 'recorded';
      }
    } catch (error) {
      if (error instanceof FrontendApiError && error.status >= 400 && error.status < 500) {
        setCommandNotice(error.message);
        return 'rejected';
      }
      setCommandNotice(
        'We could not confirm whether the event was saved. Retrying uses the same captured event details.',
      );
      return 'retry';
    } finally {
      setCommandPending(null);
    }
  }

  const isEmpty =
    eventManagement !== null &&
    eventManagement.series.length === 0 &&
    eventManagement.days.length === 0 &&
    eventManagement.activities.length === 0;

  let content: ReactNode;
  if (loadState === 'loading') {
    content = (
      <div className="events-loading" aria-busy="true" aria-label="Loading event logistics readiness">
        {[0, 1, 2].map((row) => (
          <span key={row} />
        ))}
      </div>
    );
  } else if (loadState === 'denied') {
    content = (
      <EventState
        alert
        kind="Denied"
        title="Event logistics reports are unavailable to this account"
        description="This response does not confirm whether a protected event or activity record exists."
        action={
          <button type="button" onClick={() => navigate?.('overview')}>
            Return to overview
          </button>
        }
      />
    );
  } else if (loadState === 'unavailable') {
    content = (
      <EventState
        alert
        kind="Unavailable"
        title="Event logistics readiness is temporarily unavailable"
        description="No event, activity, request, inventory, or ledger record was changed."
        action={
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
            Retry read-only load
          </button>
        }
      />
    );
  } else if (isEmpty) {
    content = (
      <EventState
        kind="No current reports"
        title="No event logistics readiness is currently reported"
        description="This bounded read-only view does not create, infer, or score activity readiness."
        action={
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
            Refresh read-only view
          </button>
        }
      />
    );
  } else {
    const data = eventManagement ?? previewEventManagement;
    content = (
      <>
        <ActivityReports activities={data.activities} />
        <ScheduleContext series={data.series} days={data.days} />
      </>
    );
  }

  return (
    <div className={`events-workspace fbr-f2-events${dark ? ' events-workspace--dark' : ''}`} data-fi11-events="true">
      {inspection ? (
        <section className="events-inspection" data-fi11-events-inspection="true">
          <strong>Inspection mode</strong>
          <span>Sample data · Actions unavailable</span>
        </section>
      ) : null}
      <header className="events-header">
        <div>
          <p className="events-eyebrow">Events · logistics report</p>
          <h1>Event logistics readiness</h1>
          <p>
            Review only the supported activity, series, day, timing, and status fields reported by the
            authorized event service. Blank or absent values remain not reported.
          </p>
        </div>
        <small>{inspection ? 'Sample data' : 'Current authorized reports'}</small>
      </header>
      <aside className="events-readonly-note">
        {inspection || !eventAllowed
          ? 'Read-only projection · no event, request, inventory, supplier, or readiness score is created here.'
          : 'Readiness reports remain read-only. Authorized event commands are recorded only through the governed management surface below.'}
      </aside>
      {content}
      {eventAllowed && !inspection && loadState === 'ready' && commandProjection ? (
        <EventManagementPanel
          key={reloadKey}
          projection={commandProjection}
          pending={commandPending}
          reloadRequired={commandReloadRequired}
          notice={commandNotice}
          onSave={saveCommand}
          onReload={() => setReloadKey((value) => value + 1)}
        />
      ) : null}
      {eventAllowed && !inspection && loadState === 'ready' && commandUnavailable ? (
        <aside className="events-command-unavailable" role="status">
          <p>Event reports are available, but event management cannot load right now.</p>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
            Reload event workspace
          </button>
        </aside>
      ) : null}
      {eventAllowed && !inspection && loadState === 'ready' && commandReloadRequired && !commandProjection ? (
        <section className="events-command-recovery" aria-label="Event command refresh required">
          <p role="status">{commandNotice}</p>
          <button type="button" onClick={() => setReloadKey((value) => value + 1)}>
            Reload event workspace
          </button>
        </section>
      ) : null}
    </div>
  );
}
