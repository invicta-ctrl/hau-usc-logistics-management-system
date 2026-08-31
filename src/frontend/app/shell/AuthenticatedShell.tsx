import { useState, type CSSProperties, type ReactNode } from 'react';
import { AUTH_ROUTE_INTENT_LABELS } from '../appRoutes';
import type { AuthRoute, Route } from '../appTypes';
import { useRouteFocus } from '../hooks/useRouteFocus';
import { appRouteHash } from '../routeHash';
import { AuthMobileDrawer } from './AuthMobileDrawer';
import { AuthShellSidebar } from './AuthShellSidebar';
import { AuthShellTopbar } from './AuthShellTopbar';
import { MOBILE_DOCK, visibleNavigationItems } from './navConfig';
import type { ShellPresentation } from './presentation';

export function AuthenticatedShell({
  presentation,
  route,
  navigate,
  onHome,
  onSignOut,
  dark,
  onToggle,
  inspection = false,
  onBackToPreview,
  children,
}: {
  presentation: ShellPresentation;
  route: AuthRoute;
  navigate: (r: Route) => void;
  onHome: () => void;
  onSignOut: () => void;
  dark: boolean;
  onToggle: () => void;
  inspection?: boolean;
  onBackToPreview?: () => void;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mobileDock = visibleNavigationItems(MOBILE_DOCK, [...presentation.visibleRoutes]);
  const routeLabel = AUTH_ROUTE_INTENT_LABELS[route];
  useRouteFocus({ routeKey: route, label: routeLabel, focusOnMount: true });

  return (
    <div
      className="auth-shell"
      data-auth-route={route}
      data-has-mobile-dock={mobileDock.length > 0}
      data-preview-inspection={inspection ? 'true' : undefined}
      data-preview-route={inspection ? route : undefined}
    >
      <div className="auth-shell__background" data-auth-shell-background>
        <AuthShellSidebar
          route={route}
          navigate={navigate}
          presentation={presentation}
          onHome={onHome}
          onSignOut={onSignOut}
          inspection={inspection}
          onBackToPreview={onBackToPreview}
        />

        <div className="auth-shell__workspace">
          <AuthShellTopbar
            navigate={navigate}
            presentation={presentation}
            dark={dark}
            onToggle={onToggle}
            onOpenDrawer={() => setDrawerOpen(true)}
            inspection={inspection}
            onBackToPreview={onBackToPreview}
          />

          <main
            className="auth-shell__main route-focus-target"
            id="main-content"
            tabIndex={-1}
            aria-label={routeLabel}
          >
            {inspection ? (
              <section
                className="preview-inspection-banner mx-4 mt-4 rounded-[8px] px-4 py-3 flex flex-wrap items-center justify-between gap-3"
                style={{
                  background: 'var(--theme-warning)',
                  border: '1px solid var(--border)',
                  color: 'var(--theme-page)',
                }}
                role="note"
                aria-label="Playground inspection"
              >
                <p
                  style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.35px' }}
                >
                  PLAYGROUND INSPECTION · Sample data · Actions are unavailable.
                </p>
                <a
                  href="#/__preview/index"
                  className="preview-action"
                  onClick={(event) => {
                    event.preventDefault();
                    onBackToPreview?.();
                  }}
                >
                  Back to Playground Index
                </a>
              </section>
            ) : null}
            {children}
          </main>

          {mobileDock.length > 0 ? (
            <nav
              className="auth-shell__dock"
              style={
                {
                  background: 'var(--sidebar)',
                  borderTop: '1px solid var(--sidebar-border)',
                  '--dock-item-count': mobileDock.length,
                } as CSSProperties
              }
              aria-label="Quick navigation"
            >
              {mobileDock.map((item) => (
                <a
                  key={item.route}
                  href={appRouteHash(item.route)}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(item.route);
                  }}
                  className="auth-shell__dock-link focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sidebar-ring)]"
                  aria-current={route === item.route ? 'page' : undefined}
                  aria-label={item.label}
                >
                  <item.Icon
                    size={20}
                    strokeWidth={1.5}
                    color={
                      route === item.route
                        ? 'var(--sidebar-primary)'
                        : 'color-mix(in oklch, var(--sidebar-foreground) 62%, transparent)'
                    }
                  />
                  <span
                    className="auth-shell__dock-label"
                    style={{
                      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                      fontSize: 10,
                      color:
                        route === item.route
                          ? 'var(--sidebar-primary)'
                          : 'color-mix(in oklch, var(--sidebar-foreground) 68%, transparent)',
                      letterSpacing: -0.1,
                    }}
                  >
                    {item.mobileLabel ?? item.label}
                  </span>
                </a>
              ))}
            </nav>
          ) : null}
        </div>
      </div>

      <AuthMobileDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        route={route}
        navigate={navigate}
        presentation={presentation}
        onHome={onHome}
        onSignOut={onSignOut}
        dark={dark}
        onToggle={onToggle}
        inspection={inspection}
        onBackToPreview={onBackToPreview}
      />
    </div>
  );
}
