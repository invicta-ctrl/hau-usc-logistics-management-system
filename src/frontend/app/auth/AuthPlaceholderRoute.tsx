import type { AuthRoute } from "../appTypes";
import { AUTH_PLACEHOLDER_LABELS } from "../appRoutes";

export function AuthPlaceholderRoute({ route }: { route: AuthRoute }) {
  const label = AUTH_PLACEHOLDER_LABELS[route] ?? route;
  return (
    <div className="px-5 md:px-8 py-12 max-w-[720px] mx-auto">
      <div className="flex flex-col gap-4">
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "1px", textTransform: "uppercase" }}>
          {label}
        </p>
        <h1
          style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: "clamp(22px, 3vw, 30px)", color: "var(--foreground)", letterSpacing: "-0.8px", fontVariationSettings: '"opsz" 14, "wdth" 100' }}
        >
          {label}
        </h1>
        <p style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 13, color: "var(--muted-foreground)", letterSpacing: -0.15, lineHeight: "21px" }}>
          This page is not available from the current workspace.
        </p>
      </div>
      <div
        className="mt-8 rounded-[12px] flex items-center justify-center"
        style={{ background: "var(--muted)", border: "1px dashed var(--border)", minHeight: 200 }}
        aria-label="Page unavailable"
      >
        <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: "var(--muted-foreground)", letterSpacing: "0.9px", textTransform: "uppercase" }}>
          Page unavailable
        </p>
      </div>
    </div>
  );
}
