import { useMemo } from 'react';
import type { FrontendOperationalModuleBootstrap } from '../../integration/backend';
import { readable } from './operationUtils';
import { receivingHistoryFromBootstrap } from './supplyModel';

export function ReceivingHistory({ bootstrap }: { bootstrap: FrontendOperationalModuleBootstrap }) {
  const rows = useMemo(() => receivingHistoryFromBootstrap(bootstrap), [bootstrap]);
  return (
    <section className="mt-6 border-t border-border pt-5" aria-labelledby="receiving-history-title">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[.12em] opacity-70">Cumulative proof</p>
          <h2 id="receiving-history-title" className="mt-1 font-serif text-2xl">
            Recent receiving records
          </h2>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-bold tabular-nums">
          {rows.length}
        </span>
      </div>
      {rows.length ? (
        <div className="supply-history-list">
          {rows.slice(0, 12).map((row) => (
            <article key={row.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold">{row.itemName}</h3>
                  <p className="mt-1 font-mono text-xs opacity-65">
                    {row.restockId} · receipt {row.id}
                  </p>
                </div>
                <span className="custody-status custody-status--complete px-2.5 py-1 text-xs font-bold">
                  Received
                </span>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs uppercase tracking-[.08em] opacity-60">Quantity</dt>
                  <dd className="mt-1 font-semibold">
                    {row.quantity} {row.unit}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[.08em] opacity-60">Invoice</dt>
                  <dd className="mt-1 font-semibold">{row.invoiceNumber || readable(row.invoiceStatus)}</dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[.08em] opacity-60">Evidence</dt>
                  <dd className="mt-1 font-semibold">
                    {row.hasEvidence ? 'Protected · attached' : 'Not reported'}
                  </dd>
                </div>
                <div>
                  <dt className="text-xs uppercase tracking-[.08em] opacity-60">Received</dt>
                  <dd className="mt-1 font-semibold">{row.receivedAt || 'Time not reported'}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      ) : (
        <div className="border-y border-dashed border-border px-4 py-8 text-center">
          <p className="font-semibold">No receiving history is reported</p>
          <p className="mt-1 text-sm opacity-70">
            No authorized receipt record is available in this bounded page. No sample record was added.
          </p>
        </div>
      )}
      {rows.length > 12 ? (
        <p className="mt-3 text-xs opacity-65">Showing 12 of {rows.length} records in this bounded page.</p>
      ) : null}
    </section>
  );
}
