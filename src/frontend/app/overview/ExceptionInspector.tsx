import { useEffect, useRef } from "react";
import { CheckCircle2, X } from "lucide-react";
import type { ExceptionItem } from "./overviewTypes";

export function ExceptionInspector({
  item,
  modal,
  onClose,
  onResolveLocally,
}: {
  item: ExceptionItem;
  modal: boolean;
  onClose: () => void;
  onResolveLocally: (id: string) => void;
}) {
  const panelRef = useRef<HTMLElement>(null);

  useEffect(() => {
    panelRef.current?.focus();
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const previousOverflow = document.body.style.overflow;
    if (modal) document.body.style.overflow = "hidden";
    document.addEventListener("keydown", handle);
    return () => {
      document.removeEventListener("keydown", handle);
      if (modal) document.body.style.overflow = previousOverflow;
    };
  }, [modal, onClose]);

  return (
    <>
      {modal && <div className="command-inspector-backdrop" onClick={onClose} aria-hidden="true" />}
      <aside
        ref={panelRef}
        id="exception-inspector"
        role={modal ? "dialog" : "complementary"}
        aria-modal={modal || undefined}
        aria-labelledby="inspector-title"
        className="command-inspector material-g3"
        tabIndex={-1}
      >
        <div className="command-inspector__head">
          <p className="command-record">Exception · {item.ref}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inspector"
          >
            <X size={16} strokeWidth={1.5} aria-hidden="true" />
          </button>
        </div>

        <div className="command-inspector__body">
          <span className="command-inspector__badge" style={item.badgeStyle}>{item.badge}</span>
          <div>
            <h2 id="inspector-title">{item.title}</h2>
            <p className="command-record">Open {item.age}</p>
          </div>
          <dl className="command-inspector__fields">
            {[
              ["Record", item.ref],
              ["State", item.state],
              ["Owner", item.owner],
              ["Consequence", item.consequence],
              ["Next action", item.nextAction],
            ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>

          {item.locallyResolved ? (
            <div className="command-local-success" role="status">
              <CheckCircle2 size={16} strokeWidth={1.5} aria-hidden="true" />
              <span>Marked resolved in this view only. No service confirmed a record change.</span>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => onResolveLocally(item.id)}
              className="command-inspector__action"
            >
              Mark resolved in this view
            </button>
          )}

          <p className="command-inspector__note">Local design fixture only. No data is submitted and no backend confirms any change.</p>
        </div>
      </aside>
    </>
  );
}
