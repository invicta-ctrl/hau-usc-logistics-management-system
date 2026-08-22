import type { ap } from "../theme/palette";
import type { InvQty } from "./inventoryTypes";

export function InventoryQtyCell({ val, low = false, c }: { val: InvQty; low?: boolean; c: ReturnType<typeof ap> }) {
  const isEm = val === "—";
  return (
    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: isEm ? c.muted : low ? "#9c2630" : c.text, letterSpacing: -0.15 }}>
      {isEm ? "—" : val}
    </span>
  );
}
