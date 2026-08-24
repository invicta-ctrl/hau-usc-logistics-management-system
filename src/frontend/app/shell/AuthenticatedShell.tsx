import { useState, type ReactNode } from 'react';
import type { AuthRoute, Route, Session } from '../appTypes';
import { AuthMobileDrawer } from './AuthMobileDrawer';
import { AuthShellSidebar } from './AuthShellSidebar';
import { AuthShellTopbar } from './AuthShellTopbar';
import { MOBILE_DOCK, visibleNavigationItems } from './navConfig';

export function AuthenticatedShell({
  session,
  route,
  navigate,
  onHome,
  onSignOut,
  dark,
  onToggle,
  children,
}: {
  session: Session;
  route: AuthRoute;
  navigate: (r: Route) => void;
  onHome: () => void;
  onSignOut: () => void;
  dark: boolean;
  onToggle: () => void;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const mobileDock = visibleNavigationItems(MOBILE_DOCK, session.capabilities);

  return (
    <div className="min-h-screen flex" style={{ background: dark ? '#1c1917' : '#fffdf8' }}>
      <AuthShellSidebar
        route={route}
        navigate={navigate}
        session={session}
        onHome={onHome}
        onSignOut={onSignOut}
      />

      <div className="flex flex-col flex-1 min-w-0 lg:ml-[76px] xl:ml-[272px] min-h-screen">
        <AuthShellTopbar
          navigate={navigate}
          session={session}
          dark={dark}
          onToggle={onToggle}
          onOpenDrawer={() => setDrawerOpen(true)}
        />

        <main className="flex-1 min-w-0 overflow-x-hidden pb-20 lg:pb-8" id="main-content">
          {children}
        </main>

        {/* Mobile bottom dock */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-10 flex items-center justify-around px-1 py-2"
          style={{ background: '#40070a', borderTop: '1px solid rgba(242,209,92,0.18)', minHeight: 60 }}
          aria-label="Quick navigation"
        >
          {mobileDock.map((item) => (
            <button
              key={item.route}
              type="button"
              onClick={() => navigate(item.route)}
              className="flex flex-col items-center gap-1 px-2 py-1 rounded-[8px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
              aria-current={route === item.route ? 'page' : undefined}
            >
              <item.Icon
                size={20}
                strokeWidth={1.5}
                color={route === item.route ? '#e8b93c' : 'rgba(250,238,203,0.5)'}
              />
              <span
                style={{
                  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                  fontSize: 10,
                  color: route === item.route ? '#e8b93c' : 'rgba(250,238,203,0.5)',
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
        session={session}
        onHome={onHome}
        onSignOut={onSignOut}
        dark={dark}
        onToggle={onToggle}
      />
    </div>
  );
}
