import type { InvItem } from "./inventoryTypes";

export function InventoryStateBadge({ item }: { item: InvItem }) {
  if (item.unconfirmed) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: -0.1, background: "#ece3d3", color: "#5d4a4f", border: "1px solid #cdbfa7" }}>
        <span style={{ width: 7, height: 7, background: "#5d4a4f", borderRadius: 2, flexShrink: 0, display: "inline-block" }} />
        Unconfirmed
      </span>
    );
  }
  if (item.outOfStock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: -0.1, background: "#fbe6e8", color: "#9c2630", border: "1px solid #e3aeb3" }}>
        <span style={{ width: 7, height: 7, background: "#9c2630", borderRadius: "50%", flexShrink: 0, display: "inline-block" }} />
        Out of stock
      </span>
    );
  }
  if (item.belowThreshold) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: -0.1, background: "#fbe6e8", color: "#9c2630", border: "1px solid #e3aeb3" }}>
        <span style={{ width: 7, height: 7, background: "#9c2630", borderRadius: "50%", flexShrink: 0, display: "inline-block" }} />
        Below threshold
      </span>
    );
  }
  if (item.lending === "not-lendable") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: -0.1, background: "#ece3d3", color: "#5d4a4f", border: "1px solid #cdbfa7" }}>
        Not lendable
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5" style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: -0.1, background: "#e2f3e9", color: "#1f6b41", border: "1px solid #a8d3ba" }}>
      <span style={{ width: 7, height: 7, background: "#1f6b41", borderRadius: "50%", flexShrink: 0, display: "inline-block" }} />
      Lendable
    </span>
  );
}
