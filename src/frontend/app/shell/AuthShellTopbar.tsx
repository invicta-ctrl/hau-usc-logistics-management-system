import { Menu } from 'lucide-react';
import { AUTH_ROUTE_INTENT_LABELS } from '../appRoutes';
import type { AuthRoute, Route } from '../appTypes';
import { appRouteHash } from '../routeHash';
import { ThemeToggle } from '../brand/ThemeToggle';
import type { ShellPresentation } from './presentation';

export function AuthShellTopbar({
  route,
  navigate,
  presentation,
  dark,
  onToggle,
  onOpenDrawer,
  inspection = false,
  onBackToPreview,
}: {
  route: AuthRoute;
  navigate: (r: Route) => void;
  presentation: ShellPresentation;
  dark: boolean;
  onToggle: () => void;
  onOpenDrawer: () => void;
  inspection?: boolean;
  onBackToPreview?: () => void;
}) {
  const localPreview = typeof window !== 'undefined' && window.location.hostname === '127.0.0.1';
  const commandBackground = 'var(--theme-surface-raised)';
  const commandForeground = 'var(--theme-text)';
  const commandMuted = 'var(--theme-text-muted)';
  const commandSurface = 'var(--theme-surface-muted)';
  const commandBorder = 'var(--theme-border)';
  const navigateBackground = 'var(--sidebar)';
  const navigateForeground = 'var(--sidebar-foreground)';
  const routeLabel = AUTH_ROUTE_INTENT_LABELS[route];

  return (
    <header
      className="auth-shell__topbar"
      style={{
        background: commandBackground,
        borderBottom: '1px solid var(--theme-border)',
      }}
      aria-label="Workspace command bar"
    >
      <div
        className="auth-shell__environment flex items-center justify-between gap-2"
        style={{ background: 'var(--sidebar)', borderBottom: '1px solid var(--sidebar-border)' }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 8,
            color: 'color-mix(in oklch, var(--sidebar-foreground) 68%, transparent)',
            letterSpacing: '0.55px',
          }}
        >
          {localPreview ? 'PLAYGROUND' : 'SIGNED-IN WORKSPACE'}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 8,
            color: 'color-mix(in oklch, var(--sidebar-foreground) 54%, transparent)',
            letterSpacing: '0.45px',
            textAlign: 'right',
          }}
        >
          AUTHORIZED ACCOUNT
        </span>
      </div>

      <div
        className="auth-shell__command flex items-center gap-3 py-2"
        style={{ background: commandBackground }}
        data-command-surface={dark ? 'dark-command' : 'light-paper'}
      >
        <button
          type="button"
          onClick={onOpenDrawer}
          className="shell-control flex items-center gap-2 rounded-[8px] px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--sidebar-ring)] transition-colors hover:bg-white/8"
          style={{ background: navigateBackground }}
          aria-label="Open navigation"
          data-navigate-surface={dark ? 'dark-command' : 'light-oxblood'}
        >
          <Menu size={16} strokeWidth={1.6} color={navigateForeground} />
          <span
            style={{
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              fontSize: 13,
              color: navigateForeground,
              letterSpacing: -0.15,
            }}
          >
            Navigate
          </span>
        </button>

        <span
          className="hidden min-[360px]:block lg:hidden flex-1 truncate text-center"
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 9,
            color: commandForeground,
            letterSpacing: '0.35px',
            textTransform: 'uppercase',
          }}
        >
          HAU-USC Logistics
        </span>

        <div
          className="workbench-command flex-1 hidden lg:flex items-center gap-3 px-3"
          style={{ background: commandSurface, border: `1px solid ${commandBorder}` }}
          data-command-panel
          aria-label={`Current workspace: ${routeLabel}`}
        >
          <div
            className="min-w-0 flex items-center gap-2"
          >
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                color: commandMuted,
                letterSpacing: '0.45px',
                textTransform: 'uppercase',
              }}
            >
              Workbench
            </span>
            <span
              className="truncate"
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 13,
                color: commandForeground,
                fontWeight: 650,
                letterSpacing: '-0.1px',
              }}
            >
              {routeLabel}
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span
            className="hidden sm:inline-flex items-center rounded-full px-3 py-1"
            style={{
              background: 'var(--theme-selection)',
              border: '1px solid var(--theme-border)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 10,
              color: 'var(--theme-text)',
              letterSpacing: '0.5px',
            }}
          >
            {presentation.roleLabel}
          </span>
          <div className="hidden lg:block" data-theme-control>
            <ThemeToggle dark={dark} onToggle={onToggle} small />
          </div>
          <a
            href={appRouteHash('profile')}
            onClick={(event) => {
              event.preventDefault();
              navigate('profile');
            }}
            className="shell-control flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ring)]"
            aria-label={`${presentation.displayName} — go to profile`}
            style={{ width: 44, height: 44, background: 'var(--theme-accent)', flexShrink: 0 }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: 'var(--theme-accent-text)',
              }}
            >
              {presentation.initials}
            </span>
          </a>
        </div>
      </div>
    </header>
  );
}
