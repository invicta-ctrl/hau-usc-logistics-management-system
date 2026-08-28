import { Menu, Search } from 'lucide-react';
import type { Route } from '../appTypes';
import { ThemeToggle } from '../brand/ThemeToggle';
import type { ShellPresentation } from './presentation';

export function AuthShellTopbar({
  navigate,
  presentation,
  dark,
  onToggle,
  onOpenDrawer,
  inspection = false,
  onBackToPreview,
}: {
  navigate: (r: Route) => void;
  presentation: ShellPresentation;
  dark: boolean;
  onToggle: () => void;
  onOpenDrawer: () => void;
  inspection?: boolean;
  onBackToPreview?: () => void;
}) {
  const localPreview = typeof window !== 'undefined' && window.location.hostname === '127.0.0.1';
  const commandBackground = dark ? '#40070a' : '#fffaf0';
  const commandForeground = dark ? '#faeecb' : '#40070a';
  const commandMuted = dark ? 'rgba(250,238,203,0.35)' : 'rgba(64,7,10,0.42)';
  const commandSurface = dark ? 'rgba(255,255,255,0.06)' : 'rgba(64,7,10,0.04)';
  const commandBorder = dark ? 'rgba(242,209,92,0.12)' : 'rgba(64,7,10,0.14)';
  const navigateBackground = dark ? 'transparent' : '#40070a';
  const navigateForeground = dark ? commandForeground : '#faeecb';

  return (
    <header
      className="sticky top-0 z-10"
      style={{
        background: commandBackground,
        borderBottom: dark ? '1px solid rgba(242,209,92,0.18)' : '1px solid rgba(64,7,10,0.18)',
      }}
      aria-label="Workspace command bar"
    >
      <div
        className="flex items-center justify-between gap-2 px-4 py-1"
        style={{ background: '#40070a', borderBottom: '1px solid rgba(242,209,92,0.12)' }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: 'rgba(250,238,203,0.62)',
            letterSpacing: '0.55px',
          }}
        >
          {localPreview ? 'LOCAL LIVE PREVIEW · NOT A DEPLOYMENT' : 'SHELL STATUS'}
        </span>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: 'rgba(250,238,203,0.46)',
            letterSpacing: '0.45px',
            textAlign: 'right',
          }}
        >
          SERVER-AUTHORIZED · CAPABILITY-PROJECTED
        </span>
      </div>

      <div
        className="flex items-center gap-3 px-4 py-2"
        style={{ minHeight: 56, background: commandBackground }}
        data-command-surface={dark ? 'dark-command' : 'light-paper'}
      >
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex items-center gap-2 rounded-[8px] px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c] transition-colors hover:bg-white/8"
          style={{ minHeight: 40, background: navigateBackground }}
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
            fontSize: 11,
            color: commandForeground,
            letterSpacing: '0.35px',
            textTransform: 'uppercase',
          }}
        >
          HAU-USC Logistics
        </span>

        <div className="flex-1 hidden lg:flex items-center">
          <div
            className="flex w-full max-w-[180px] xl:max-w-[240px] items-center gap-2 rounded-[8px] px-3 py-2 cursor-default select-none"
            style={{ background: commandSurface, border: `1px solid ${commandBorder}` }}
            aria-hidden="true"
            data-command-search
          >
            <Search size={13} strokeWidth={1.5} color={commandMuted} />
            <span
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 12,
                color: commandMuted,
                letterSpacing: -0.1,
              }}
            >
              Search
            </span>
            <span
              className="ml-auto rounded px-1.5 py-0.5"
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: commandMuted,
                background: commandSurface,
                border: `1px solid ${commandBorder}`,
              }}
            >
              ⌘K
            </span>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span
            className="hidden sm:inline-flex items-center rounded-full px-3 py-1"
            style={{
              background: 'rgba(232,185,60,0.14)',
              border: '1px solid rgba(232,185,60,0.3)',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              color: '#e8b93c',
              letterSpacing: '0.5px',
            }}
          >
            {presentation.roleLabel}
          </span>
          <div className="hidden lg:block" data-theme-control>
            <ThemeToggle dark={dark} onToggle={onToggle} small />
          </div>
          <button
            type="button"
            onClick={() => navigate('profile')}
            className="flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            aria-label={`${presentation.displayName} — go to profile`}
            style={{ width: 34, height: 34, background: '#e8b93c', flexShrink: 0 }}
          >
            <span
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: '#40070a',
              }}
            >
              {presentation.initials}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
