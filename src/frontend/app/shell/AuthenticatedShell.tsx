import { useState, type ReactNode } from 'react';
import type { AuthRoute, Route } from '../appTypes';
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

  return (
    <div
      className="min-h-screen flex"
      style={{ background: 'var(--background)' }}
      data-preview-inspection={inspection ? 'true' : undefined}
      data-preview-route={inspection ? route : undefined}
    >
      <AuthShellSidebar
        route={route}
        navigate={navigate}
        presentation={presentation}
        onHome={onHome}
        onSignOut={onSignOut}
        inspection={inspection}
        onBackToPreview={onBackToPreview}
      />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-[76px] xl:ml-[272px] min-h-screen">
        <AuthShellTopbar
          navigate={navigate}
          presentation={presentation}
          dark={dark}
          onToggle={onToggle}
          onOpenDrawer={() => setDrawerOpen(true)}
          inspection={inspection}
          onBackToPreview={onBackToPreview}
        />

        <main className="flex-1 min-w-0 overflow-x-hidden pb-20 lg:pb-8" id="main-content">
          {inspection ? (
            <section
              className="mx-4 mt-4 rounded-[8px] px-4 py-3 flex flex-wrap items-center justify-between gap-3"
              style={{ background: 'var(--theme-warning)', border: '1px solid var(--border)', color: 'var(--theme-page)' }}
              role="note"
              aria-label="Playground inspection"
            >
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, letterSpacing: '0.35px' }}>
                PLAYGROUND INSPECTION · Sample data · Actions are unavailable.
              </p>
              <button type="button" className="preview-action" onClick={onBackToPreview}>
                Back to Playground Index
              </button>
            </section>
          ) : null}
          {children}
        </main>

        {/* Mobile bottom dock */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-10 flex items-center justify-around px-1 py-2"
          style={{ background: 'var(--sidebar)', borderTop: '1px solid var(--sidebar-border)', minHeight: 60 }}
          aria-label="Quick navigation"
        >
          {mobileDock.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className="flex flex-col items-center gap-1 px-2 py-1 rounded-[8px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sidebar-ring)]"
              aria-current={route === item.route ? 'page' : undefined}
            >
              <item.Icon
                size={20}
                strokeWidth={1.5}
                color={route === item.route ? 'var(--sidebar-primary)' : 'color-mix(in oklch, var(--sidebar-foreground) 52%, transparent)'}
              />
              <span
                style={{
                  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                  fontSize: 10,
                  color: route === item.route ? 'var(--sidebar-primary)' : 'color-mix(in oklch, var(--sidebar-foreground) 52%, transparent)',
                  letterSpacing: -0.1,
                }}
              >
                {item.label}
              </span>
            </button>
          ))}
        </nav>
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
