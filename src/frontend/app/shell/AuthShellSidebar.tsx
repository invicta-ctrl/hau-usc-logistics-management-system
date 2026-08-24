import { LogOut } from 'lucide-react';
import type { AuthRoute, Route, Session } from '../appTypes';
import { DolMark, UscMark } from '../brand/BrandMarks';
import { NAV_ADMINISTRATION, NAV_OPERATIONS, visibleNavigationItems } from './navConfig';
import { SidebarNavItem } from './SidebarNavItem';

export function AuthShellSidebar({
  route,
  navigate,
  session,
  onHome,
  onSignOut,
}: {
  route: AuthRoute;
  navigate: (r: Route) => void;
  session: Session;
  onHome: () => void;
  onSignOut: () => void;
}) {
  const operations = visibleNavigationItems(NAV_OPERATIONS, session.capabilities);
  const administration = visibleNavigationItems(NAV_ADMINISTRATION, session.capabilities);

  return (
    <aside
      className="hidden lg:flex w-[76px] xl:w-[272px] flex-col fixed left-0 top-0 bottom-0 z-20 overflow-y-auto"
      style={{ background: '#40070a', borderRight: '1px solid rgba(242,209,92,0.18)' }}
      aria-label="Workspace navigation"
    >
      {/* Brand */}
      <button
        type="button"
        onClick={onHome}
        className="flex items-center justify-center px-2 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#e8b93c] xl:items-start xl:justify-start xl:px-4"
        style={{ borderBottom: '1px solid rgba(242,209,92,0.14)' }}
        aria-label="Home"
      >
        <div className="flex flex-col items-center gap-1 xl:items-start">
          <span className="xl:hidden">
            <DolMark size={34} />
          </span>
          <span className="hidden xl:flex items-center gap-2">
            <UscMark size={46} />
            <DolMark size={36} />
            <span className="flex flex-col gap-0.5">
              <span
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 7,
                  color: '#f6e29a',
                  letterSpacing: '.8px',
                  textTransform: 'uppercase',
                }}
              >
                HAU–USC
              </span>
              <span
                style={{
                  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#faeecb',
                  lineHeight: 1.1,
                }}
              >
                Department of Logistics
              </span>
            </span>
          </span>
          <span
            className="hidden xl:block"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
              color: '#f6e29a',
              letterSpacing: '.7px',
              textTransform: 'uppercase',
            }}
          >
            Institutional logistics ledger
          </span>
        </div>
      </button>

      {/* Operations */}
      {operations.length > 0 && (
        <nav className="flex flex-col gap-0.5 px-2 pt-4 pb-2" aria-label="Operations">
          <p
            className="hidden xl:block"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              color: 'rgba(250,238,203,0.38)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              paddingLeft: 12,
              marginBottom: 4,
            }}
          >
            Operations
          </p>
          {operations.map((item) => (
            <SidebarNavItem
              key={item.route}
              item={item}
              active={route === item.route}
              onClick={() => navigate(item.route)}
            />
          ))}
        </nav>
      )}

      {/* Administration */}
      {administration.length > 0 && (
        <nav
          className="flex flex-col gap-0.5 px-2 pt-3 pb-2"
          style={{ borderTop: '1px solid rgba(242,209,92,0.1)' }}
          aria-label="Administration"
        >
          <p
            className="hidden xl:block"
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9,
              color: 'rgba(250,238,203,0.38)',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              paddingLeft: 12,
              marginBottom: 4,
            }}
          >
            Administration
          </p>
          {administration.map((item) => (
            <SidebarNavItem
              key={item.route}
              item={item}
              active={route === item.route}
              onClick={() => navigate(item.route)}
            />
          ))}
        </nav>
      )}

      {/* Sign out */}
      <div className="mt-auto px-2 pb-5 pt-3" style={{ borderTop: '1px solid rgba(242,209,92,0.1)' }}>
        <div className="flex items-center justify-center gap-2 px-2 py-2 mb-2 xl:justify-start xl:px-3">
          <div
            className="flex items-center justify-center rounded-full shrink-0"
            style={{ width: 26, height: 26, background: '#e8b93c' }}
            aria-hidden="true"
          >
            <span
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 10,
                fontWeight: 600,
                color: '#40070a',
              }}
            >
              {session.initials}
            </span>
          </div>
          <div className="hidden xl:flex flex-col min-w-0">
            <span
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 11,
                color: '#faeecb',
                letterSpacing: -0.1,
                lineHeight: '14px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {session.displayName}
            </span>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9,
                color: 'rgba(250,238,203,0.5)',
                letterSpacing: '0.3px',
              }}
            >
              {session.role}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="flex items-center justify-center px-2 py-2 w-full rounded-[8px] text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c] xl:justify-start xl:gap-2 xl:px-3"
          aria-label="Sign out"
          title="Sign out"
        >
          <LogOut size={14} strokeWidth={1.5} color="rgba(250,238,203,0.5)" />
          <span
            className="hidden xl:inline"
            style={{
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              fontSize: 12,
              color: 'rgba(250,238,203,0.5)',
              letterSpacing: -0.1,
            }}
          >
            Sign out
          </span>
        </button>
      </div>
    </aside>
  );
}
