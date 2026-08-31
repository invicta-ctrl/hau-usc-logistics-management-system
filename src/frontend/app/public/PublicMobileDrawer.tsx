import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { Route } from '../appTypes';
import { UscMark } from '../brand/BrandMarks';
import { ThemeToggle } from '../brand/ThemeToggle';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';
import { appRouteHash } from '../routeHash';
import { NAV_LINKS } from './publicNavConfig';

export function PublicMobileDrawer({
  open,
  onClose,
  route,
  dark,
  onToggleTheme,
  onNavigate,
  onOpenSection,
}: {
  open: boolean;
  onClose: () => void;
  route: Route;
  dark: boolean;
  onToggleTheme: () => void;
  onNavigate: (r: Route) => void;
  onOpenSection: (sectionId: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap({
    open,
    dialogRef,
    inertSelector: '[data-public-shell-chrome], #main-content, [data-public-shell-footer]',
  });

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const frame = requestAnimationFrame(() => setVisible(true));
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener('keydown', handle);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div
        className="shell-drawer-backdrop"
        data-visible={visible}
        style={{ background: 'rgba(0,0,0,0.5)' }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        tabIndex={-1}
        className="shell-drawer shell-drawer--end"
        data-visible={visible}
        style={{
          background: '#40070a',
          borderLeft: '1px solid rgba(242,209,92,0.22)',
        }}
      >
        <div
          className="shell-drawer__header flex items-center justify-between pb-4 border-b"
          style={{ borderColor: 'rgba(242,209,92,0.22)' }}
        >
          <div className="flex items-center gap-3">
            <UscMark size={36} />
            <span
              style={{
                fontFamily: "'Newsreader', Georgia, serif",
                color: '#fff',
                fontSize: 14,
                letterSpacing: -0.075,
              }}
            >
              University Student Council
            </span>
          </div>
          <button
            onClick={onClose}
            data-dialog-initial-focus
            className="flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            aria-label="Close menu"
            style={{ width: 44, height: 44 }}
          >
            <X size={18} color="#faeecb" />
          </button>
        </div>

        <nav className="shell-drawer__body flex flex-col gap-1 px-5 py-6" aria-label="Site navigation">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(event) => {
                event.preventDefault();
                onClose();
                onOpenSection(link.href.slice(1));
              }}
              className="shell-control flex items-center gap-2 px-3 py-3 rounded-[8px] text-[15px] leading-none transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
              aria-current={route === 'landing' && link.active ? 'page' : undefined}
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                color: route === 'landing' && link.active ? '#ffffff' : '#faeecb',
                background: route === 'landing' && link.active ? 'rgba(232,185,60,0.1)' : 'transparent',
                borderLeft:
                  route === 'landing' && link.active ? '2px solid #e8b93c' : '2px solid transparent',
              }}
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div
          className="shell-drawer__footer mt-auto flex flex-col gap-3 px-5 pt-4 border-t"
          style={{ borderColor: 'rgba(242,209,92,0.18)' }}
        >
          <a
            href={appRouteHash('external-request')}
            onClick={(event) => {
              event.preventDefault();
              onClose();
              onNavigate('external-request');
            }}
            className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            style={{
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              background: '#e8b93c',
              color: '#40070a',
              minHeight: 48,
              border: '1px solid #d1b478',
            }}
          >
            Start a logistics request
          </a>
          <a
            href="/"
            onClick={(event) => {
              event.preventDefault();
              onClose();
              onOpenSection('hero');
            }}
            className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            style={{
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              color: '#faeecb',
              minHeight: 48,
              border: '1px solid #d1b478',
            }}
          >
            Home
          </a>
          <a
            href={appRouteHash('staff-signin')}
            onClick={(event) => {
              event.preventDefault();
              onClose();
              onNavigate('staff-signin');
            }}
            className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            style={{
              fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
              color: '#faeecb',
              minHeight: 48,
              border: '1px solid #d1b478',
            }}
          >
            Staff sign in
          </a>
          <div className="flex items-center justify-between pt-1">
            <span
              style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: '#f6e29a', fontSize: 11 }}
            >
              Theme
            </span>
            <ThemeToggle dark={dark} onToggle={onToggleTheme} />
          </div>
        </div>
      </div>
    </>
  );
}
