import type { CSSProperties } from 'react';

import type { Route } from '../appTypes';
import { appRouteHash } from '../routeHash';
import HeroMotion from './HeroMotion';
import heroVideoSrc from '../../assets/hero/hausc-institutional-logistics-hero.mp4';

export function HeroSection({
  onNavigate,
  onRequireExternalRequest,
}: {
  onNavigate: (route: Route) => void;
  onRequireExternalRequest: () => void;
}) {
  return (
    <section id="hero" aria-labelledby="hero-heading" className="digital-atrium civic-ledger-hero">
      <div className="atrium__stage">
        <div className="atrium__copy atrium__reveal" style={{ '--i': 0 } as CSSProperties}>
          <p className="atrium__institution">HAU-USC · Institutional Logistics Ledger</p>

          <h1 id="hero-heading" className="atrium__title">
            Logistics services and records
          </h1>

          <p className="atrium__lede">
            Request equipment or supplies, use public lending, or sign in to manage authorized logistics work.
          </p>

          <div className="atrium__actions">
            {/* R3A1A2-REQUEST-AUTH-GATE. The External Request Center is for
                verified USC staff and officers, so this control leads to staff
                sign-in first and carries the EXTERNAL_REQUEST_CENTER intent
                through it. The label says so, rather than letting a student
                discover the gate only after committing to the flow. */}
            <a
              href={appRouteHash('staff-signin')}
              className="atrium__primary atrium__action--stacked"
              aria-label="Start a logistics request. Staff sign-in required for USC staff and officers."
              onClick={(event) => {
                event.preventDefault();
                onRequireExternalRequest();
              }}
            >
              Start a logistics request
              <span className="atrium__action-note">USC staff sign-in required</span>
            </a>

            <a
              href={appRouteHash('borrow')}
              className="atrium__secondary hero-action--glass atrium__action--stacked"
              onClick={(event) => {
                event.preventDefault();
                onNavigate('borrow');
              }}
            >
              Browse public lending
              <span className="atrium__action-note">No sign-in needed</span>
            </a>
          </div>

          <div className="atrium__secondary-paths" aria-label="Other logistics paths">
            <a
              href={appRouteHash('tracking')}
              className="atrium__text-action"
              onClick={(event) => {
                event.preventDefault();
                onNavigate('tracking');
              }}
            >
              Track lending
            </a>

            <a
              href={appRouteHash('staff-signin')}
              className="atrium__text-action"
              onClick={(event) => {
                event.preventDefault();
                onNavigate('staff-signin');
              }}
            >
              Staff sign in
            </a>
          </div>
        </div>
      </div>

      <div className="atrium__media" data-civic-ledger-media>
        <HeroMotion videoSrc={heroVideoSrc} />
      </div>
    </section>
  );
}
