import { useMemo } from 'react';
import type { FrontendOperationalModuleBootstrap } from '../../integration/backend';
import { readable } from './operationUtils';
import { releaseHistoryFromBootstrap } from './releaseModel';

function releaseDateTime(value: string) {
  if (!value) return '';
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf())
    ? value
    : new Intl.DateTimeFormat('en-PH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(parsed);
}

export function ReleaseHistory({ bootstrap }: { bootstrap: FrontendOperationalModuleBootstrap }) {
  const history = useMemo(() => releaseHistoryFromBootstrap(bootstrap), [bootstrap]);
  return (
    <section
      className="mt-7 border-t border-border pt-5"
      aria-labelledby="release-history-title"
      data-release-station-background
    >
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.12em] opacity-70">Receipt and history</p>
          <h2 id="release-history-title" className="mt-1 font-serif text-3xl">
            Recent releases and corrections
          </h2>
        </div>
        <span className="font-mono text-xs opacity-70">
          {history.confirmations.length + history.corrections.length} authorized records · revision{' '}
          {bootstrap.scopeRevision.token}
        </span>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <section
          className="rounded-xl border border-border bg-card p-4"
          aria-labelledby="release-receipts-title"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id="release-receipts-title" className="font-serif text-2xl">
              Release receipts
            </h3>
            <span className="font-mono text-xs opacity-70">{history.confirmations.length}</span>
          </div>
          {history.confirmations.length ? (
            <ol className="mt-3 divide-y divide-border">
              {history.confirmations.slice(0, 8).map((receipt) => (
                <li key={receipt.id} className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4">
                  <div className="min-w-0">
                    <strong className="block truncate">{receipt.recipientName}</strong>
                    <span className="mt-1 block text-xs opacity-70">
                      {receipt.recipientRole || 'Role not reported'} ·{' '}
                      {receipt.department || 'Department not reported'}
                    </span>
                    <span className="mt-1 block break-words font-mono text-[11px] opacity-70">
                      {receipt.id} · {receipt.requestId}
                    </span>
                  </div>
                  <div className="text-start text-xs sm:text-end">
                    <strong className="block">{receipt.quantity}</strong>
                    <span className="mt-1 block opacity-70">{readable(receipt.status)}</span>
                    {receipt.releasedAt ? (
                      <span className="mt-1 block opacity-70">{releaseDateTime(receipt.releasedAt)}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 border-y border-dashed border-border py-6 text-sm opacity-70">
              No release receipt is included in this authorized page.
            </p>
          )}
        </section>
        <section
          className="rounded-xl border border-border bg-card p-4"
          aria-labelledby="release-corrections-title"
        >
          <div className="flex items-center justify-between gap-3">
            <h3 id="release-corrections-title" className="font-serif text-2xl">
              Corrections
            </h3>
            <span className="font-mono text-xs opacity-70">{history.corrections.length}</span>
          </div>
          {history.corrections.length ? (
            <ol className="mt-3 divide-y divide-border">
              {history.corrections.slice(0, 8).map((correction) => (
                <li
                  key={correction.id}
                  className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-4"
                >
                  <div className="min-w-0">
                    <strong className="block break-words">
                      {correction.reason || 'Correction recorded'}
                    </strong>
                    <span className="mt-1 block break-words font-mono text-[11px] opacity-70">
                      {correction.id} · release {correction.releaseGroupId}
                    </span>
                  </div>
                  <div className="text-start text-xs sm:text-end">
                    <strong className="block">{correction.quantity} corrected</strong>
                    <span className="mt-1 block opacity-70">{readable(correction.status)}</span>
                    {correction.correctedAt ? (
                      <span className="mt-1 block opacity-70">{releaseDateTime(correction.correctedAt)}</span>
                    ) : null}
                  </div>
                </li>
              ))}
            </ol>
          ) : (
            <p className="mt-3 border-y border-dashed border-border py-6 text-sm opacity-70">
              No correction is included in this authorized page.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}
