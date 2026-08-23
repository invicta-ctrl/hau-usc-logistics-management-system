import { useEffect, useRef, type CSSProperties, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { ap } from "../theme/palette";
import type { InvItem, InvQty } from "./inventoryTypes";
import { InventoryStateBadge } from "./InventoryStateBadge";

export function InventoryInspector({
  item,
  dark,
  isMobile,
  onClose,
}: {
  item: InvItem;
  dark: boolean;
  isMobile: boolean;
  onClose: () => void;
}) {
  const c = ap(dark);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    if (isMobile) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, isMobile]);

  function Field({ label, children }: { label: string; children: ReactNode }) {
    return (
      <div className="flex flex-col gap-1">
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: c.muted, letterSpacing: "0.9px", textTransform: "uppercase" }}>{label}</p>
        <div style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: c.text, letterSpacing: -0.15, lineHeight: "20px" }}>{children}</div>
      </div>
    );
  }

  const panelStyle: CSSProperties = isMobile
    ? { position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", background: c.m1, overflowY: "auto" }
    : { position: "fixed", top: 0, right: 0, bottom: 0, width: "min(480px, 100vw)", zIndex: 60, display: "flex", flexDirection: "column", background: c.m1, borderLeft: `1px solid ${c.border}`, boxShadow: "-4px 0 24px rgba(0,0,0,0.18)", overflowY: "auto" };

  const isEm = (v: InvQty) => v === "—";

  return (
    <>
      {/* Backdrop (desktop only) */}
      {!isMobile && (
        <div
          className="fixed inset-0 z-50"
          style={{ background: "rgba(0,0,0,0.32)" }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="inv-inspector-title"
        style={panelStyle}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
          {isMobile ? (
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c] rounded-[6px]"
              style={{ minHeight: 44, minWidth: 44, color: c.muted, fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13 }}
              aria-label="Back to inventory"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              <span>Back to inventory</span>
            </button>
          ) : (
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="flex items-center justify-center rounded-[8px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
              style={{ width: 44, height: 44, color: c.muted, background: c.m2, border: `1px solid ${c.border}` }}
              aria-label="Close inspector"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          )}
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: c.muted, letterSpacing: "0.8px", textTransform: "uppercase" }}>
            inventory.item
          </span>
        </div>

        {/* Identity */}
        <div className="px-5 py-5 shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: c.muted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 6 }}>
            RECORD
          </p>
          <p id="inv-inspector-title" style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 20, color: c.text, letterSpacing: -0.5, fontVariationSettings: '"opsz" 14, "wdth" 100' }}>
            {item.name}
          </p>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: c.muted, marginTop: 4, letterSpacing: -0.1 }}>
            {item.id} · {item.category}
          </p>
          <div className="mt-3">
            <InventoryStateBadge item={item} />
          </div>
          {/* DESIGN FIXTURE notice */}
          <div className="mt-3 rounded-[6px] px-3 py-1.5" style={{ background: dark ? "rgba(232,185,60,0.08)" : "#fbeed2", border: "1px solid #dcbe8a" }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: "#7d5518", letterSpacing: "0.9px", textTransform: "uppercase" }}>
              Design fixture · not production data
            </p>
          </div>
        </div>

        {/* Fields */}
        <div className="px-5 py-5 flex flex-col gap-5 flex-1">
          {/* STATE */}
          <Field label="STATE">
            <InventoryStateBadge item={item} />
          </Field>

          {/* QUANTITY TRUTH */}
          <Field label="QUANTITY TRUTH">
            {item.unconfirmed ? (
              <p style={{ color: c.muted, fontStyle: "italic" }}>Not confirmed in this design fixture</p>
            ) : (
              <div className="flex gap-6 mt-1">
                {(["On hand", "Reserved", "Available"] as const).map((lbl, i) => {
                  const vals: InvQty[] = [item.onHand, item.reserved, item.available];
                  const isLow = lbl === "Available" && !isEm(item.available) && typeof item.available === "number" && typeof item.threshold === "number" && (item.available as number) < (item.threshold as number);
                  return (
                    <div key={lbl} className="flex flex-col gap-0.5 items-end">
                      <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 9, color: c.muted, letterSpacing: "0.9px", textTransform: "uppercase" }}>{lbl}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 600, letterSpacing: -0.2, color: isLow ? "#9c2630" : c.text }}>{vals[i]}</span>
                    </div>
                  );
                })}
                <div className="flex flex-col gap-0.5 items-end">
                  <span style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 9, color: c.muted, letterSpacing: "0.9px", textTransform: "uppercase" }}>Threshold</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 18, fontWeight: 600, letterSpacing: -0.2, color: c.muted }}>{item.threshold}</span>
                </div>
              </div>
            )}
          </Field>

          {/* REVISION / PROVENANCE */}
          <Field label="REVISION / PROVENANCE">
            <p style={{ color: c.muted, fontStyle: "italic" }}>No movement entries included in this design fixture.</p>
            <p style={{ marginTop: 4 }}>Owner: <span style={{ color: c.muted }}>DOL Staff queue</span></p>
          </Field>

          {/* CONSEQUENCE */}
          <Field label="CONSEQUENCE">
            <p style={{ lineHeight: "20px" }}>{item.consequence}</p>
          </Field>

          {/* NEXT ACTION */}
          <Field label="NEXT ACTION">
            <p style={{ lineHeight: "20px" }}>{item.nextAction}</p>
          </Field>

          {/* Local-only notice */}
          <div className="rounded-[8px] px-4 py-3 mt-2" style={{ background: c.m2, border: `1px solid ${c.border}` }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: c.muted, letterSpacing: "0.7px", textTransform: "uppercase", marginBottom: 4 }}>
              Local design fixture
            </p>
            <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 12, color: c.muted, lineHeight: "18px" }}>
              This view is session-local. No data has been submitted and no service has confirmed any value shown here.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
