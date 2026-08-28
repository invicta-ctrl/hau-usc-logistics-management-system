import React, { useState } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import RequestCenterRoute from "./RequestCenterRoute";

// ── palette (mirrors RequestCenterRoute) ──────────────────────────────────────

function ap(dark: boolean) {
  return {
    m1:     dark ? "#242120" : "#ffffff",
    m2:     dark ? "#2d2927" : "#f7f0e2",
    border: dark ? "rgba(250,249,247,0.10)" : "#e6dcc9",
    text:   dark ? "#faf9f7" : "#241416",
    muted:  dark ? "rgba(250,249,247,0.46)" : "#6f5a60",
  } as const;
}

const mono    = "'IBM Plex Mono', monospace";
const sans    = "'IBM Plex Sans', system-ui, sans-serif";
const display = "'Bricolage Grotesque', system-ui, sans-serif";

// ── types ─────────────────────────────────────────────────────────────────────

type PreviewState = "default" | "error" | "stale" | "permission";

// ── wrapper ───────────────────────────────────────────────────────────────────

export default function RequestCenterRouteWithStates({
  dark,
  navigate,
}: {
  dark: boolean;
  navigate: (route: string) => void;
}) {
  const c = ap(dark);
  const [previewState, setPreviewState] = useState<PreviewState>("default");
  const [reviewed, setReviewed] = useState(false);

  function handleSetPreviewState(s: PreviewState) {
    setPreviewState(s);
    if (s !== "stale") setReviewed(false);
  }

  // ── shared preview-state select ───────────────────────────────────────────

  const previewSelect = (
    <div className="px-4 md:px-8 pt-4 max-w-[1280px] mx-auto flex justify-end">
      <div className="flex items-center gap-2">
        <label
          htmlFor="rc-preview-state"
          style={{
            fontFamily: mono,
            fontSize: 9,
            color: c.muted,
            letterSpacing: "0.9px",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          Preview state
        </label>
        <select
          id="rc-preview-state"
          value={previewState}
          onChange={(e) => handleSetPreviewState(e.target.value as PreviewState)}
          className="rounded-[6px] px-2 py-1 text-[11px] focus:outline-none focus:ring-2 focus:ring-[#e8b93c]"
          style={{
            fontFamily: sans,
            background: c.m2,
            color: c.muted,
            border: `1px solid ${c.border}`,
            cursor: "pointer",
          }}
        >
          <option value="default">Default</option>
          <option value="error">Page error</option>
          <option value="stale">Stale data</option>
          <option value="permission">Permission limited</option>
        </select>
      </div>
    </div>
  );

  // ── page error ────────────────────────────────────────────────────────────

  if (previewState === "error") {
    return (
      <div>
        {previewSelect}
        <div className="px-4 md:px-8 py-8 max-w-[1280px] mx-auto">
          <div
            className="rounded-[12px] flex flex-col items-center justify-center py-16 gap-4 text-center"
            style={{ border: `1px solid ${c.border}`, background: c.m1 }}
          >
            <AlertTriangle size={22} strokeWidth={1.5} color="#c8152a" />
            <div className="flex flex-col gap-1">
              <p
                style={{
                  fontFamily: display,
                  fontWeight: 700,
                  fontSize: 16,
                  color: c.text,
                  letterSpacing: "-0.3px",
                }}
              >
                Request queue unavailable
              </p>
              <p style={{ fontFamily: sans, fontSize: 13, color: c.muted, letterSpacing: -0.1 }}>
                Could not load request data for this session.
              </p>
            </div>
            <button
              type="button"
              onClick={() => handleSetPreviewState("default")}
              className="inline-flex items-center gap-2 rounded-[8px] px-5 py-2.5 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c] transition-opacity hover:opacity-85"
              style={{
                fontFamily: sans,
                fontWeight: 600,
                background: c.m2,
                color: c.text,
                border: `1px solid ${c.border}`,
                cursor: "pointer",
              }}
            >
              <RefreshCw size={13} strokeWidth={1.5} />
              Retry
            </button>
            <p
              style={{
                fontFamily: mono,
                fontSize: 9,
                color: c.muted,
                letterSpacing: "0.5px",
                textTransform: "uppercase",
              }}
            >
              Local only · no service was contacted
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── permission limited ────────────────────────────────────────────────────

  if (previewState === "permission") {
    return (
      <div>
        {previewSelect}
        <div className="px-4 md:px-8 py-8 max-w-[1280px] mx-auto">
          <div
            className="rounded-[12px] flex flex-col items-center justify-center py-20 gap-4 text-center"
            style={{ border: `1px solid ${c.border}`, background: c.m1 }}
          >
            <p
              style={{
                fontFamily: display,
                fontWeight: 700,
                fontSize: 16,
                color: c.text,
                letterSpacing: "-0.3px",
              }}
            >
              Content not available
            </p>
            <p
              style={{
                fontFamily: sans,
                fontSize: 13,
                color: c.muted,
                maxWidth: 320,
                lineHeight: "20px",
                letterSpacing: -0.1,
              }}
            >
              This area is not available at your current access level.
            </p>
            <button
              type="button"
              onClick={() => navigate("overview")}
              className="rounded-[8px] px-5 py-2.5 text-[13px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c] transition-opacity hover:opacity-85"
              style={{
                fontFamily: sans,
                fontWeight: 600,
                background: c.m2,
                color: c.text,
                border: `1px solid ${c.border}`,
                cursor: "pointer",
              }}
            >
              Return to overview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── stale data ────────────────────────────────────────────────────────────

  if (previewState === "stale") {
    return (
      <div>
        {previewSelect}
        <div className="px-4 md:px-8 pt-3 pb-0 max-w-[1280px] mx-auto flex flex-col gap-2">
          {/* Stale warning banner */}
          <div
            className="rounded-[10px] px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
            style={{
              background: "rgba(232,185,60,0.07)",
              border: "1px solid rgba(200,153,47,0.32)",
            }}
          >
            <AlertTriangle
              size={15}
              strokeWidth={1.5}
              color="#c8992f"
              style={{ flexShrink: 0, marginTop: 1 }}
            />
            <div className="flex-1 min-w-0">
              <p
                style={{
                  fontFamily: sans,
                  fontWeight: 600,
                  fontSize: 12,
                  color: dark ? "#e8b93c" : "#7d5518",
                  letterSpacing: -0.1,
                  marginBottom: 2,
                }}
              >
                Last-known values
              </p>
              <p
                style={{
                  fontFamily: sans,
                  fontSize: 12,
                  color: dark ? "rgba(232,185,60,0.70)" : "#7d5518",
                  lineHeight: "17px",
                  letterSpacing: -0.1,
                }}
              >
                Queue data is not live in this session. No service refresh occurred. Actions are disabled.
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                type="button"
                onClick={() => handleSetPreviewState("default")}
                className="rounded-[7px] px-3 py-1.5 text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c] transition-opacity hover:opacity-85"
                style={{
                  fontFamily: sans,
                  fontWeight: 500,
                  background: c.m2,
                  color: c.text,
                  border: `1px solid ${c.border}`,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Reload (local)
              </button>
              <button
                type="button"
                onClick={() => setReviewed(true)}
                className="rounded-[7px] px-3 py-1.5 text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c] transition-opacity hover:opacity-85"
                style={{
                  fontFamily: sans,
                  fontWeight: 500,
                  background: "transparent",
                  color: dark ? "#e8b93c" : "#7d5518",
                  border: "1px solid rgba(200,153,47,0.40)",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Review request
              </button>
            </div>
          </div>

          {/* Reviewed confirmation */}
          {reviewed && (
            <div
              className="rounded-[8px] px-4 py-2.5"
              style={{
                background: "rgba(31,107,65,0.07)",
                border: "1px solid rgba(31,107,65,0.22)",
              }}
            >
              <p
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  color: "#1f6b41",
                  letterSpacing: "0.4px",
                }}
              >
                Sample request reviewed. No operational record changed.
              </p>
            </div>
          )}
        </div>

        {/* Child — geometry preserved, all interactions disabled */}
        <div
          aria-disabled="true"
          style={{ pointerEvents: "none", opacity: 0.6, userSelect: "none" }}
        >
          <RequestCenterRoute dark={dark} navigate={navigate} />
        </div>
      </div>
    );
  }

  // ── default ───────────────────────────────────────────────────────────────

  return (
    <div>
      {previewSelect}
      <RequestCenterRoute dark={dark} navigate={navigate} />
    </div>
  );
}
