import type { CSSProperties } from "react";

import type { Route } from "../appTypes";
import HeroMotion from "./HeroMotion";

export function HeroSection({
  onNavigate,
}: {
  onNavigate: (route: Route) => void;
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
            <button
              type="button"
              className="atrium__primary"
              aria-label="Start a logistics request in the public Request Center. No sign-in needed."
              onClick={() => onNavigate("request")}
            >
              Start a logistics request
            </button>

            <button
              type="button"
              className="atrium__secondary hero-action--glass"
              onClick={() => onNavigate("borrow")}
            >
              Browse public lending
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
              Track request
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
