import { useEffect, useRef, useState } from 'react';
import { LogOut, X } from 'lucide-react';
import type { AuthRoute, Route } from '../appTypes';
import { DolMark } from '../brand/BrandMarks';
import { ThemeToggle } from '../brand/ThemeToggle';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';
import { appRouteHash } from '../routeHash';
import { NAV_ADMINISTRATION, NAV_OPERATIONS, visibleNavigationItems } from './navConfig';
import type { ShellPresentation } from './presentation';

export function AuthMobileDrawer({
  open,
  onClose,
  route,
  navigate,
  presentation,
  onHome,
  onSignOut,
  dark,
  onToggle,
  inspection = false,
  onBackToPreview,
}: {
  open: boolean;
  onClose: () => void;
  route: AuthRoute;
  navigate: (r: Route) => void;
  presentation: ShellPresentation;
  onHome: () => void;
  onSignOut: () => void;
  dark: boolean;
  onToggle: () => void;
  inspection?: boolean;
  onBackToPreview?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  const operations = visibleNavigationItems(NAV_OPERATIONS, [...presentation.visibleRoutes]);
  const administration = visibleNavigationItems(NAV_ADMINISTRATION, [...presentation.visibleRoutes]);

  useDialogFocusTrap({ open, dialogRef, inertSelector: '[data-auth-shell-background]' });

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const id = requestAnimationFrame(() => setVisible(true));
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('keydown', handle);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="shell-drawer-backdrop"
        data-visible={visible}
        style={{
          background: 'rgba(36,20,22,0.44)',
        }}
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Drawer — only rendered while open */}
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Workspace navigation"
        tabIndex={-1}
        className="shell-drawer shell-drawer--start"
        data-visible={visible}
        style={{
          background: 'var(--sidebar)',
          borderRight: '1px solid var(--sidebar-border)',
        }}
      >
        {/* Header */}
        <div
          className="shell-drawer__header flex items-center justify-between pb-4"
          style={{ borderBottom: '1px solid var(--sidebar-border)' }}
        >
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex items-center gap-2.5">
              <DolMark size={38} />
              <div className="flex flex-col gap-0.5">
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 8,
                    color: 'var(--sidebar-primary)',
                    letterSpacing: '.8px',
                    textTransform: 'uppercase',
                  }}
                >
                  HAU–USC
                </span>
                <span
                  style={{
                    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: 'var(--sidebar-foreground)',
                    lineHeight: 1.1,
                  }}
                >
                  Department of Logistics
                </span>
              </div>
            </div>
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 8,
                color: 'var(--sidebar-primary)',
                letterSpacing: '.7px',
                textTransform: 'uppercase',
              }}
            >
              Institutional logistics ledger
            </span>
          </div>
          <button
            onClick={onClose}
            data-dialog-initial-focus
            className="flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sidebar-ring)]"
            aria-label="Close navigation"
            style={{ width: 44, height: 44 }}
          >
            <X size={18} color="var(--sidebar-foreground)" />
          </button>
        </div>

        {/* Nav */}
        <div className="shell-drawer__body px-2 py-4 flex flex-col gap-4">
          {operations.length > 0 && (
            <nav className="flex flex-col gap-0.5" aria-label="Operations">
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9,
                  color: 'color-mix(in oklch, var(--sidebar-foreground) 42%, transparent)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  paddingLeft: 12,
                  marginBottom: 4,
                }}
              >
                Operations
              </p>
              {operations.map((item) => (
                <a
                  key={item.route}
                  href={appRouteHash(item.route)}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(item.route);
                    onClose();
                  }}
                  className="shell-control flex items-center gap-3 px-3 py-2.5 rounded-[8px] w-full text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sidebar-ring)]"
                  style={{
                    background: route === item.route ? 'var(--sidebar-accent)' : 'transparent',
                    borderLeft:
                      route === item.route ? '2px solid var(--sidebar-primary)' : '2px solid transparent',
                  }}
                  aria-current={route === item.route ? 'page' : undefined}
                >
                  <item.Icon
                    size={15}
                    strokeWidth={1.6}
                    color={
                      route === item.route
                        ? 'var(--sidebar-primary)'
                        : 'color-mix(in oklch, var(--sidebar-foreground) 65%, transparent)'
                    }
                  />
                  <span
                    style={{
                      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                      fontSize: 14,
                      color:
                        route === item.route
                          ? 'var(--sidebar-foreground)'
                          : 'color-mix(in oklch, var(--sidebar-foreground) 75%, transparent)',
                      letterSpacing: -0.15,
                    }}
                  >
                    {item.label}
                  </span>
                </a>
              ))}
            </nav>
          )}

          {administration.length > 0 && (
            <nav
              className="flex flex-col gap-0.5"
              style={{ borderTop: '1px solid var(--sidebar-border)', paddingTop: 16 }}
              aria-label="Administration"
            >
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9,
                  color: 'color-mix(in oklch, var(--sidebar-foreground) 42%, transparent)',
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  paddingLeft: 12,
                  marginBottom: 4,
                }}
              >
                Administration
              </p>
              {administration.map((item) => (
                <a
                  key={item.route}
                  href={appRouteHash(item.route)}
                  onClick={(event) => {
                    event.preventDefault();
                    navigate(item.route);
                    onClose();
                  }}
                  className="shell-control flex items-center gap-3 px-3 py-2.5 rounded-[8px] w-full text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sidebar-ring)]"
                  style={{
                    background: route === item.route ? 'var(--sidebar-accent)' : 'transparent',
                    borderLeft:
                      route === item.route ? '2px solid var(--sidebar-primary)' : '2px solid transparent',
                  }}
                  aria-current={route === item.route ? 'page' : undefined}
                >
                  <item.Icon
                    size={15}
                    strokeWidth={1.6}
                    color={
                      route === item.route
                        ? 'var(--sidebar-primary)'
                        : 'color-mix(in oklch, var(--sidebar-foreground) 65%, transparent)'
                    }
                  />
                  <span
                    style={{
                      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                      fontSize: 14,
                      color:
                        route === item.route
                          ? 'var(--sidebar-foreground)'
                          : 'color-mix(in oklch, var(--sidebar-foreground) 75%, transparent)',
                      letterSpacing: -0.15,
                    }}
                  >
                    {item.label}
                  </span>
                </a>
              ))}
            </nav>
          )}
        </div>

        {/* Footer */}
        <div
          className="shell-drawer__footer px-4 pt-3 flex flex-col gap-3"
          style={{ borderTop: '1px solid var(--sidebar-border)' }}
        >
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              onHome();
              onClose();
            }}
            className="shell-control flex items-center gap-2 rounded-[8px] px-3 py-2 transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sidebar-ring)]"
          >
            <span
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 13,
                color: 'color-mix(in oklch, var(--sidebar-foreground) 76%, transparent)',
                letterSpacing: -0.1,
              }}
            >
              Home
            </span>
          </a>
          <div className="flex items-center justify-between">
            <span
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 11,
                color: 'var(--sidebar-primary)',
              }}
            >
              Theme
            </span>
            <ThemeToggle dark={dark} onToggle={onToggle} small />
          </div>
          {inspection ? (
            <a
              href="#/__preview/index"
              onClick={(event) => {
                event.preventDefault();
                onBackToPreview?.();
                onClose();
              }}
              className="shell-control flex items-center gap-2 rounded-[8px] px-3 py-2 transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sidebar-ring)]"
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                  fontSize: 13,
                  color: 'color-mix(in oklch, var(--sidebar-foreground) 76%, transparent)',
                  letterSpacing: -0.1,
                }}
              >
                Back to Playground Index
              </span>
            </a>
          ) : (
            <button
              type="button"
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="shell-control flex items-center gap-2 rounded-[8px] px-3 py-2 transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sidebar-ring)]"
            >
              <LogOut
                size={14}
                strokeWidth={1.5}
                color="color-mix(in oklch, var(--sidebar-foreground) 60%, transparent)"
              />
              <span
                style={{
                  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                  fontSize: 13,
                  color: 'color-mix(in oklch, var(--sidebar-foreground) 60%, transparent)',
                  letterSpacing: -0.1,
                }}
              >
                Sign out
              </span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
