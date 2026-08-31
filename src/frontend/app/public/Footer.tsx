import type { Route } from '../appTypes';
import { UscMark } from '../brand/BrandMarks';
import { appRouteHash } from '../routeHash';
import { openLandingSection } from './landingSectionNavigation';

export function Footer({ onNavigate, onHome }: { onNavigate: (r: Route) => void; onHome: () => void }) {
  return (
    <footer className="public-shell__footer w-full" data-public-shell-footer aria-label="Site footer">
      <div className="max-w-[1520px] mx-auto px-5 md:px-8 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <UscMark size={36} />
              <div className="flex flex-col">
                <span className="public-shell__footer-council">University Student Council</span>
                <span className="public-shell__footer-campus">Holy Angel University</span>
              </div>
            </div>
            <p className="public-shell__footer-motto">Laus Deo Semper</p>
          </div>

          <nav aria-label="Services">
            <p className="public-shell__footer-label mb-4">Services</p>
            <ul className="flex flex-col gap-2">
              <li>
                <a
                  href="#logistics"
                  onClick={(event) => {
                    event.preventDefault();
                    openLandingSection('logistics', onHome);
                  }}
                  className="public-shell__footer-link shell-control flex items-center gap-2 transition-opacity hover:opacity-80 rounded-sm"
                >
                  Logistics hub
                  <span className="public-shell__footer-badge px-2 py-0.5 rounded-full">Open</span>
                </a>
              </li>
            </ul>
          </nav>

          <div className="flex flex-col gap-3">
            <p className="public-shell__footer-label">Access</p>
            <a
              href={appRouteHash('external-request')}
              onClick={(event) => {
                event.preventDefault();
                onNavigate('external-request');
              }}
              className="public-shell__footer-action public-shell__footer-action--primary shell-control flex items-center justify-center rounded-[10px] transition-opacity hover:opacity-90 active:opacity-75"
            >
              Start a logistics request
            </a>
            <a
              href="/"
              onClick={(event) => {
                event.preventDefault();
                openLandingSection('hero', onHome);
              }}
              className="public-shell__footer-action shell-control flex items-center justify-center rounded-[10px] transition-opacity hover:opacity-90 active:opacity-75"
            >
              Home
            </a>
            <a
              href={appRouteHash('staff-signin')}
              onClick={(event) => {
                event.preventDefault();
                onNavigate('staff-signin');
              }}
              className="public-shell__footer-action shell-control flex items-center justify-center rounded-[10px] transition-opacity hover:opacity-90 active:opacity-75"
            >
              Staff sign in
            </a>
          </div>
        </div>

        <div className="public-shell__footer-rule flex flex-wrap items-center gap-4 mt-10 pt-6">
          <p className="public-shell__footer-legal">Holy Angel University · Angeles City, Pampanga</p>
        </div>
      </div>
    </footer>
  );
}
