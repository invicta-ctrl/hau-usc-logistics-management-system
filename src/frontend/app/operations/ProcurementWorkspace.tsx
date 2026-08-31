import { useEffect, useMemo, useState } from 'react';
import type { FrontendOperationalModuleBootstrap } from '../../integration/backend';
import { readable } from './operationUtils';
import { procurementConsequence, procurementRecordsFromBootstrap } from './supplyModel';

function statusTone(status: string) {
  if (['CANCELLED', 'REJECTED'].includes(status)) return 'rejected';
  if (['RECEIVED', 'READY_TO_RELEASE', 'RELEASED', 'COMPLETED'].includes(status)) return 'complete';
  if (['PROCURED', 'PARTIALLY_RECEIVED'].includes(status)) return 'ready';
  return 'review';
}

export function ProcurementWorkspace({ bootstrap }: { bootstrap: FrontendOperationalModuleBootstrap }) {
  const records = useMemo(() => procurementRecordsFromBootstrap(bootstrap), [bootstrap]);
  const [selectedId, setSelectedId] = useState('');
  const selected = records.find((row) => row.id === selectedId) ?? records[0] ?? null;

  useEffect(() => {
    if (selected) setSelectedId(selected.id);
  }, [selected?.id]);

  if (!records.length) {
    return (
      <section className="border-y border-dashed border-border px-4 py-10 text-center" aria-live="polite">
        <p className="font-semibold">No procurement work is reported</p>
        <p className="mt-1 text-sm opacity-70">
          No authorized deliverable is available in this bounded page. No sample record was added.
        </p>
      </section>
    );
  }

  return (
    <section aria-labelledby="procurement-workspace-title">
      <div className="border-y border-border bg-card/40 px-4 py-5">
        <p className="text-xs font-bold uppercase tracking-[.14em]">Procurement consequence workspace</p>
        <h2 id="procurement-workspace-title" className="mt-1 font-serif text-2xl">
          Deliverable, canvass, supplier, next governed step
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 opacity-75">
          Select one deliverable to inspect its requested and received quantity, linked supplier references,
          and the exact next consequence already supported by the operational record. This workspace does not
          simulate procurement writes.
        </p>
      </div>

      <div className="supply-station__layout mt-4">
        <section
          className="rounded-xl border border-border bg-card p-4"
          aria-labelledby="procurement-list-title"
        >
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[.12em] opacity-70">Authorized queue</p>
              <h3 id="procurement-list-title" className="mt-1 font-serif text-2xl">
                Deliverables
              </h3>
            </div>
            <span className="font-mono text-xs opacity-70">{records.length} loaded</span>
          </div>
          <div className="supply-record-list">
            {records.map((record) => (
              <button
                type="button"
                key={record.id}
                aria-current={selected?.id === record.id ? 'true' : undefined}
                onClick={() => setSelectedId(record.id)}
              >
                <span className="flex items-start justify-between gap-3">
                  <strong>{record.itemName}</strong>
                  <span
                    className={`custody-status custody-status--${statusTone(record.status)} px-2 py-0.5 text-[.625rem] font-bold uppercase tracking-[.06em]`}
                  >
                    {readable(record.status)}
                  </span>
                </span>
                <small>{record.id}</small>
                <small>
                  {record.received} of {record.requested} {record.unit} received
                </small>
              </button>
            ))}
          </div>
        </section>

        {selected ? (
          <section
            className="rounded-xl border border-border bg-card p-4"
            aria-labelledby="procurement-detail-title"
          >
            <div className="border-b border-border pb-4">
              <p className="text-xs font-bold uppercase tracking-[.12em] opacity-70">Selected deliverable</p>
              <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
                <h3 id="procurement-detail-title" className="font-serif text-2xl">
                  {selected.itemName}
                </h3>
                <span
                  className={`custody-status custody-status--${statusTone(selected.status)} px-2.5 py-1 text-xs font-bold uppercase tracking-[.06em]`}
                >
                  {readable(selected.status)}
                </span>
              </div>
              <p className="mt-2 font-mono text-xs opacity-65">
                {selected.id} · request {selected.requestId || 'not reported'}
              </p>
            </div>

            <dl className="supply-fact-grid mt-4">
              <div>
                <dt>Requested</dt>
                <dd>
                  {selected.requested} {selected.unit}
                </dd>
              </div>
              <div>
                <dt>Received</dt>
                <dd>
                  {selected.received} {selected.unit}
                </dd>
              </div>
              <div>
                <dt>Outstanding</dt>
                <dd>
                  {selected.outstanding} {selected.unit}
                </dd>
              </div>
              <div>
                <dt>Needed</dt>
                <dd>{selected.neededAt || 'Not reported'}</dd>
              </div>
              <div>
                <dt>Budget</dt>
                <dd>{readable(selected.budgetStatus)}</dd>
              </div>
              <div>
                <dt>Procurement</dt>
                <dd>{readable(selected.procurementStatus || selected.status)}</dd>
              </div>
              <div>
                <dt>Receiving</dt>
                <dd>{readable(selected.receiptStatus || selected.status)}</dd>
              </div>
              <div>
                <dt>Department</dt>
                <dd>{selected.requestDepartment || 'Not reported'}</dd>
              </div>
            </dl>

            {selected.requestPurpose || selected.itemSpec || selected.note ? (
              <section
                className="mt-4 rounded-xl border border-border bg-muted/50 p-4"
                aria-label="Deliverable context"
              >
                <p className="text-xs font-bold uppercase tracking-[.1em] opacity-65">Operational context</p>
                <p className="mt-2 text-sm leading-6">
                  {selected.itemSpec || selected.requestPurpose || selected.note}
                </p>
              </section>
            ) : null}

            <section className="mt-5" aria-labelledby="procurement-quotes-title">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[.1em] opacity-65">Canvass evidence</p>
                  <h4 id="procurement-quotes-title" className="mt-1 font-serif text-xl">
                    Linked supplier references
                  </h4>
                </div>
                <span className="font-mono text-xs opacity-65">{selected.quotes.length}</span>
              </div>
              {selected.quotes.length ? (
                <div className="supplier-reference-list">
                  {selected.quotes.map((quote) => (
                    <article key={quote.id} className="rounded-lg border border-border p-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <h5 className="font-semibold">{quote.supplierName}</h5>
                          <p className="mt-1 text-xs opacity-65">
                            {quote.location || 'Location not reported'} · checked{' '}
                            {quote.checkedAt || 'not reported'}
                          </p>
                        </div>
                        {quote.preferred ? (
                          <span className="custody-status custody-status--complete px-2 py-1 text-xs font-bold">
                            Preferred
                          </span>
                        ) : null}
                      </div>
                      <dl className="mt-3 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                        <div>
                          <dt className="text-xs uppercase tracking-[.08em] opacity-60">Price</dt>
                          <dd className="mt-1 font-semibold">
                            {quote.price ? quote.price.toLocaleString() : 'Not reported'} / {quote.unit}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-[.08em] opacity-60">Receipt</dt>
                          <dd className="mt-1 font-semibold">{readable(quote.receiptStatus)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-[.08em] opacity-60">Reliability</dt>
                          <dd className="mt-1 font-semibold">{readable(quote.reliability)}</dd>
                        </div>
                        <div>
                          <dt className="text-xs uppercase tracking-[.08em] opacity-60">Evidence</dt>
                          <dd className="mt-1 font-semibold">
                            {quote.evidenceAttached ? 'Protected · attached' : 'Not reported'}
                          </dd>
                        </div>
                      </dl>
                      {quote.preferredRationale ? (
                        <p className="mt-3 border-t border-dashed border-border pt-3 text-sm opacity-75">
                          {quote.preferredRationale}
                        </p>
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="border-y border-dashed border-border px-4 py-6 text-center">
                  <p className="font-semibold">No linked supplier reference is loaded in this page</p>
                  <p className="mt-1 text-sm opacity-70">
                    {selected.preferredCanvassId
                      ? 'A preferred canvass is recorded, but its supplier detail is outside this bounded page.'
                      : 'No supplier or price was inferred.'}
                  </p>
                </div>
              )}
            </section>

            <section className="custody-summary mt-5" aria-label="Procurement consequence">
              <p className="custody-summary__heading">Next governed consequence</p>
              <p className="custody-summary__copy text-sm leading-6">{procurementConsequence(selected)}</p>
            </section>
          </section>
        ) : null}
      </div>
    </section>
  );
}
