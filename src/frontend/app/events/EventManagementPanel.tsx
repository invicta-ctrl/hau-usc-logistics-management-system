import { useRef, useState, type FormEvent } from 'react';
import type { FrontendEventManagementCommandProjection } from '../../integration/backend';

type CommandKind = 'series' | 'day' | 'activity';
type CommandSaveState = 'refreshed' | 'recorded' | 'retry' | 'rejected';
type CapturedCommand = Readonly<Record<string, string>>;

export function EventManagementPanel({
  projection,
  pending,
  reloadRequired,
  notice,
  onSave,
  onReload,
}: {
  projection: FrontendEventManagementCommandProjection;
  pending: CommandKind | null;
  notice: string;
  reloadRequired: boolean;
  onSave: (kind: CommandKind, command: Record<string, unknown>) => Promise<CommandSaveState>;
  onReload: () => void;
}) {
  const [seriesId, setSeriesId] = useState(projection.series[0]?.id ?? '');
  const [dayId, setDayId] = useState(projection.days[0]?.id ?? '');
  const pendingRef = useRef(false);
  const capturedCommands = useRef<Partial<Record<CommandKind, CapturedCommand>>>({});
  const [retryKind, setRetryKind] = useState<CommandKind | null>(null);
  const fieldsLocked = pending !== null || reloadRequired || retryKind !== null;
  const commandLocked = (kind: CommandKind) =>
    pending !== null || reloadRequired || (retryKind !== null && retryKind !== kind);

  async function submit(kind: CommandKind, event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pendingRef.current || commandLocked(kind)) return;
    const form = event.currentTarget;
    pendingRef.current = true;
    try {
      const command =
        capturedCommands.current[kind] ??
        Object.freeze({
          ...Object.fromEntries(
            Array.from(new FormData(form).entries(), ([key, value]) => [key, String(value)]),
          ),
          clientRequestId: crypto.randomUUID(),
        });
      capturedCommands.current[kind] = command;
      const result = await onSave(kind, command);
      if (result === 'refreshed' || result === 'recorded') {
        delete capturedCommands.current[kind];
        setRetryKind(null);
        form.reset();
      } else if (result === 'rejected') {
        delete capturedCommands.current[kind];
        setRetryKind(null);
      } else {
        setRetryKind(kind);
      }
    } finally {
      pendingRef.current = false;
    }
  }

  return (
    <section className="events-command-panel" aria-labelledby="event-command-title">
      <div className="events-section-heading">
        <div>
          <p className="events-eyebrow">Manage events</p>
          <h2 id="event-command-title">Manage events</h2>
          <p>Save event records using the permitted forms. The current server report refreshes after each save.</p>
        </div>
      </div>
      <div className="events-command-grid">
        <form aria-label="Create event series" onSubmit={(event) => void submit('series', event)}>
          <h3>Main event</h3>
          <label>Main event name<input name="name" required maxLength={200} disabled={fieldsLocked} /></label>
          <label>Event year<input name="year" type="number" min="2000" max="2200" required disabled={fieldsLocked} /></label>
          <label>Reason<textarea name="reason" minLength={8} maxLength={500} required disabled={fieldsLocked} /></label>
          <input type="hidden" name="status" value="ACTIVE" />
          <button type="submit" disabled={commandLocked('series')}>{pending === 'series' ? 'Saving…' : retryKind === 'series' ? 'Retry captured main event' : 'Create main event'}</button>
        </form>
        <form aria-label="Create event day" onSubmit={(event) => void submit('day', event)}>
          <h3>Event day</h3>
          <label>Parent main event<select name="eventSeriesId" value={seriesId} onChange={(event) => setSeriesId(event.target.value)} required disabled={fieldsLocked}><option value="">Select a main event</option>{projection.series.filter((entry) => entry.status !== 'ARCHIVED').map((entry) => <option key={entry.id} value={entry.id}>{entry.name}</option>)}</select></label>
          <label>Date<input name="date" type="date" required disabled={fieldsLocked} /></label>
          <label>Reason<textarea name="reason" minLength={8} maxLength={500} required disabled={fieldsLocked} /></label>
          <input type="hidden" name="status" value="UPCOMING" />
          <button type="submit" disabled={commandLocked('day') || !seriesId}>{pending === 'day' ? 'Saving…' : retryKind === 'day' ? 'Retry captured event day' : 'Add event day'}</button>
        </form>
        <form aria-label="Create event activity" onSubmit={(event) => void submit('activity', event)}>
          <h3>Activity</h3>
          <label>Event day<select name="eventDayId" value={dayId} onChange={(event) => setDayId(event.target.value)} required disabled={fieldsLocked}><option value="">Select an event day</option>{projection.days.filter((entry) => entry.status !== 'ARCHIVED').map((entry) => <option key={entry.id} value={entry.id}>{entry.name} · {entry.date}</option>)}</select></label>
          <label>Activity name<input name="name" required maxLength={240} disabled={fieldsLocked} /></label>
          <label>Activity type<input name="activityType" required maxLength={120} disabled={fieldsLocked} /></label>
          <label>Venue<input name="venue" required maxLength={240} disabled={fieldsLocked} /></label>
          <label>Reason<textarea name="reason" minLength={8} maxLength={500} required disabled={fieldsLocked} /></label>
          <input type="hidden" name="timeStatus" value="TBA" /><input type="hidden" name="status" value="UPCOMING" />
          <button type="submit" disabled={commandLocked('activity') || !dayId}>{pending === 'activity' ? 'Saving…' : retryKind === 'activity' ? 'Retry captured activity' : 'Add activity'}</button>
        </form>
      </div>
      {notice ? <p role="status">{notice}</p> : null}
      {reloadRequired ? (
        <button type="button" onClick={onReload}>
          Reload event workspace
        </button>
      ) : null}
    </section>
  );
}
