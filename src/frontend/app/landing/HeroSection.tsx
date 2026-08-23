import type { CSSProperties } from "react";

import type { Route } from "../appTypes";
import HeroMotion from "./HeroMotion";

export function HeroSection({
  onNavigate,
  onRequireExternalRequest,
}: {
  onNavigate: (route: Route) => void;
  onRequireExternalRequest: () => void;
}) {
  return (
    <section
      id="hero"
      aria-labelledby="hero-heading"
      className="digital-atrium"
    >
      <HeroMotion />

      <div className="atrium__stage">
        <div
          className="atrium__copy atrium__reveal"
          style={{ "--i": 0 } as CSSProperties}
        >
          <p className="atrium__institution">
            HAU-USC · Institutional Logistics Ledger
          </p>

          <h1 id="hero-heading" className="atrium__title">
            Every request. Every handoff. On record.
          </h1>

          <p className="atrium__lede">
            HAU-USC Logistics coordinates equipment and supply services
            through a governed record—from first request to confirmed return.
          </p>

          <div className="atrium__actions">
            {/* R3A1A2-REQUEST-AUTH-GATE. The External Request Center is for
                verified USC staff and officers, so this control leads to staff
                sign-in first and carries the EXTERNAL_REQUEST_CENTER intent
                through it. The label says so, rather than letting a student
                discover the gate only after committing to the flow. */}
            <button
              type="button"
              className="atrium__primary atrium__action--stacked"
              aria-label="Start a logistics request. Staff sign-in required for USC staff and officers."
              onClick={onRequireExternalRequest}
            >
              Start a logistics request
              <span className="atrium__action-note">USC staff sign-in required</span>
            </button>

            <button
              type="button"
              className="atrium__secondary hero-action--glass atrium__action--stacked"
              onClick={() => onNavigate("borrow")}
            >
              Browse public lending
              <span className="atrium__action-note">No sign-in needed</span>
            </button>
          </div>

          <div
            className="atrium__secondary-paths"
            aria-label="Other logistics paths"
          >
            <button
              type="button"
              className="atrium__text-action"
              onClick={() => onNavigate("tracking")}
            >
              Track lending
            </button>

            <button
              type="button"
              className="atrium__text-action"
              onClick={() => onNavigate("staff-signin")}
            >
              Staff sign in
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
