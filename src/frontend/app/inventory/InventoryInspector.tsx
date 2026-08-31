import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import type { Route } from '../appTypes';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';
import type { InvItem, InvQty } from './inventoryTypes';
import { InventoryStateBadge } from './InventoryStateBadge';

function formatTimestamp(value: string | undefined) {
  if (!value) return 'Not reported';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? 'Not reported'
    : new Intl.DateTimeFormat('en-PH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(parsed);
}

function presentStatus(value: string | undefined) {
  return (value || 'Not reported')
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function quantity(value: InvQty, unit = '') {
  return value === '—' ? '—' : `${value} ${unit}`.trim();
}

export function InventoryInspector({
  item,
  isMobile,
  availableRoutes,
  onNavigate,
  onClose,
}: {
  item: InvItem;
  dark: boolean;
  isMobile: boolean;
  availableRoutes: Route[];
  onNavigate: (route: Route) => void;
  onClose: () => void;
}) {
  const panelRef = useRef<HTMLElement>(null);
  useDialogFocusTrap({
    open: isMobile,
    dialogRef: panelRef,
    inertSelector: isMobile ? '[data-inventory-modal-background]' : undefined,
  });

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    if (isMobile) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleEscape);
      if (isMobile) document.body.style.overflow = previousOverflow;
    };
  }, [isMobile, onClose]);

  const routes = new Set<Route>(availableRoutes);
  const actions: Array<{ route: Route; label: string; detail: string }> = [];
  if ((item.belowThreshold || item.outOfStock) && routes.has('restocking')) {
    actions.push({
      route: 'restocking',
      label: 'Open restocking',
      detail: 'Continue through the governed replenishment workflow.',
    });
  }
  if (item.lending === 'lendable' && routes.has('lending')) {
    actions.push({
      route: 'lending',
      label: 'Open lending',
      detail: 'Review circulation and current lending work.',
    });
  }
  if (typeof item.reserved === 'number' && item.reserved > 0 && routes.has('release')) {
    actions.push({
      route: 'release',
      label: 'Open Release Desk',
      detail: 'Review authorized release work linked to reservations.',
    });
  }

  return (
    <aside
      ref={panelRef}
      className={`inventory-inspector${isMobile ? ' inventory-inspector--mobile shell-sheet--viewport' : ''}`}
      role={isMobile ? 'dialog' : 'complementary'}
      aria-modal={isMobile ? true : undefined}
      aria-labelledby="inventory-inspector-title"
      tabIndex={isMobile ? -1 : undefined}
    >
      <header className="inventory-inspector__header shell-sheet__header">
        <button
          type="button"
          onClick={onClose}
          aria-label={isMobile ? 'Back to inventory' : 'Close inspector'}
          data-dialog-initial-focus={isMobile ? true : undefined}
        >
          {isMobile ? <ArrowLeft aria-hidden="true" size={17} /> : <X aria-hidden="true" size={17} />}
          {isMobile ? <span>Back to inventory</span> : null}
        </button>
        <span>inventory.item</span>
      </header>

      <div className="inventory-inspector__identity">
        <p>Record</p>
        <h2 id="inventory-inspector-title">{item.name}</h2>
        <span>
          {item.id} · {item.category}
        </span>
        <InventoryStateBadge item={item} />
        <small>
          {item.dataOrigin === 'REAL_BOOTSTRAP'
            ? 'Current authorized inventory records'
            : 'Inspection sample · actions unavailable'}
        </small>
      </div>

      <div className="inventory-inspector__body">
        <section aria-labelledby="inventory-quantity-title">
          <div className="inventory-inspector__section-head">
            <div>
              <p>Ledger-derived balance</p>
              <h3 id="inventory-quantity-title">Quantity truth</h3>
            </div>
          </div>
          {item.unconfirmed ? (
            <p className="inventory-inspector__empty">
              Quantities are guarded until this record is confirmed.
            </p>
          ) : (
            <dl className="inventory-inspector__quantities">
              <div>
                <dt>On hand</dt>
                <dd>{quantity(item.onHand, item.unit)}</dd>
              </div>
              <div>
                <dt>Reserved</dt>
                <dd>{quantity(item.reserved, item.unit)}</dd>
              </div>
              <div>
                <dt>Available</dt>
                <dd>{quantity(item.available, item.unit)}</dd>
              </div>
            </dl>
          )}
          <dl className="inventory-inspector__metadata">
            <div>
              <dt>Threshold</dt>
              <dd>{quantity(item.threshold, item.unit)}</dd>
            </div>
            <div>
              <dt>Classification</dt>
              <dd>{presentStatus(item.classificationStatus)}</dd>
            </div>
            <div>
              <dt>Condition review</dt>
              <dd>{presentStatus(item.conditionReviewState)}</dd>
            </div>
            <div>
              <dt>Maintenance review</dt>
              <dd>{presentStatus(item.maintenanceReviewState)}</dd>
            </div>
            <div>
              <dt>Record updated</dt>
              <dd>{formatTimestamp(item.updatedAt)}</dd>
            </div>
          </dl>
        </section>

        <section aria-labelledby="inventory-ledger-title">
          <div className="inventory-inspector__section-head">
            <div>
              <p>Append-only context</p>
              <h3 id="inventory-ledger-title">Recent ledger movements</h3>
            </div>
            <span>{item.recentLedger.length}</span>
          </div>
          {item.recentLedger.length ? (
            <ol className="inventory-inspector__timeline">
              {item.recentLedger.map((entry) => (
                <li key={entry.id}>
                  <div>
                    <strong>{presentStatus(entry.type)}</strong>
                    <span className={entry.signedQuantity < 0 ? 'is-negative' : 'is-positive'}>
                      {entry.signedQuantity > 0 ? '+' : ''}
                      {entry.signedQuantity} {entry.unit}
                    </span>
                  </div>
                  <p>{entry.relatedId || entry.relatedEntityType || 'No related record reported'}</p>
                  <time dateTime={entry.createdAt}>{formatTimestamp(entry.createdAt)}</time>
                </li>
              ))}
            </ol>
          ) : (
            <p className="inventory-inspector__empty">
              No recent ledger movements were returned for this item.
            </p>
          )}
        </section>

        <section aria-labelledby="inventory-reservations-title">
          <div className="inventory-inspector__section-head">
            <div>
              <p>Allocation context</p>
              <h3 id="inventory-reservations-title">Reservations</h3>
            </div>
            <span>{item.reservations.length}</span>
          </div>
          {item.reservations.length ? (
            <ol className="inventory-inspector__records">
              {item.reservations.map((reservation) => (
                <li key={reservation.id}>
                  <div>
                    <strong>{reservation.id}</strong>
                    <span>{presentStatus(reservation.status)}</span>
                  </div>
                  <p>
                    {reservation.quantity} {reservation.unit} ·{' '}
                    {reservation.link || 'No linked request reported'}
                  </p>
                  <time dateTime={reservation.updatedAt}>{formatTimestamp(reservation.updatedAt)}</time>
                </li>
              ))}
            </ol>
          ) : (
            <p className="inventory-inspector__empty">No reservations were returned for this item.</p>
          )}
        </section>

        {item.assets.length || item.assetMovementHistory.length || item.assetMaintenanceHistory.length ? (
          <section aria-labelledby="inventory-assets-title">
            <div className="inventory-inspector__section-head">
              <div>
                <p>Traceable equipment</p>
                <h3 id="inventory-assets-title">Asset context</h3>
              </div>
              <span>{item.assets.length}</span>
            </div>
            <ul className="inventory-inspector__assets">
              {item.assets.map((asset) => (
                <li key={asset.id}>
                  <strong>{asset.assetTag}</strong>
                  <span>
                    {presentStatus(asset.lifecycleStatus)} · {presentStatus(asset.condition)}
                  </span>
                </li>
              ))}
            </ul>
            {[...item.assetMovementHistory, ...item.assetMaintenanceHistory]
              .sort((a, b) => Date.parse(b.occurredAt) - Date.parse(a.occurredAt))
              .slice(0, 6)
              .map((entry) => (
                <div key={entry.id} className="inventory-inspector__asset-event">
                  <strong>{presentStatus(entry.eventType)}</strong>
                  <span>
                    {entry.newStatus ? presentStatus(entry.newStatus) : presentStatus(entry.condition)}
                  </span>
                  <time dateTime={entry.occurredAt}>{formatTimestamp(entry.occurredAt)}</time>
                </div>
              ))}
          </section>
        ) : null}

        <section aria-labelledby="inventory-action-title">
          <div className="inventory-inspector__section-head">
            <div>
              <p>Governed next steps</p>
              <h3 id="inventory-action-title">Continue work</h3>
            </div>
          </div>
          <p className="inventory-inspector__consequence">{item.consequence}</p>
          {item.dataOrigin === 'REAL_BOOTSTRAP' && actions.length ? (
            <ul className="inventory-inspector__actions">
              {actions.map((action) => (
                <li key={action.route}>
                  <button type="button" onClick={() => onNavigate(action.route)}>
                    <span>
                      <strong>{action.label}</strong>
                      <small>{action.detail}</small>
                    </span>
                    <ArrowRight aria-hidden="true" size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="inventory-inspector__empty">{item.nextAction}</p>
          )}
        </section>

        <p className="inventory-inspector__boundary">
          Stock balances are read-only here. Changes must enter through an authorized ledger-backed workflow.
          The service limits history to records related to the current result page.
        </p>
      </div>
    </aside>
  );
}
