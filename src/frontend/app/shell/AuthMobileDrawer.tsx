import { useEffect, useRef, useState } from 'react';
import { LogOut, X } from 'lucide-react';
import type { AuthRoute, Route } from '../appTypes';
import { DolMark } from '../brand/BrandMarks';
import { ThemeToggle } from '../brand/ThemeToggle';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';
import { usePrefersReducedMotion } from '../hooks/usePrefersReducedMotion';
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
  const reducedMotion = usePrefersReducedMotion();
  const operations = visibleNavigationItems(NAV_OPERATIONS, [...presentation.visibleRoutes]);
  const administration = visibleNavigationItems(NAV_ADMINISTRATION, [...presentation.visibleRoutes]);

  useDialogFocusTrap({ open, dialogRef });

  useEffect(() => {
    if (!open) {
      setVisible(false);
      return;
    }
    document.body.style.overflow = 'hidden';
    const id = requestAnimationFrame(() => setVisible(true));
    const handle = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handle);
    return () => {
      cancelAnimationFrame(id);
      document.removeEventListener('keydown', handle);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(36,20,22,0.44)',
          opacity: visible ? 1 : 0,
          transition: reducedMotion ? 'none' : 'opacity 280ms',
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
        className="fixed left-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: 280,
          background: '#40070a',
          borderRight: '1px solid rgba(242,209,92,0.22)',
          transform: visible ? 'translateX(0)' : 'translateX(-100%)',
          transition: reducedMotion ? 'none' : 'transform 280ms cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-4"
          style={{ borderBottom: '1px solid rgba(242,209,92,0.18)' }}
        >
          <div className="flex flex-col items-start gap-1.5">
            <div className="flex items-center gap-2.5">
              <DolMark size={38} />
              <div className="flex flex-col gap-0.5">
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 8,
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
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#faeecb',
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
                color: '#f6e29a',
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
            className="flex items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            aria-label="Close navigation"
            style={{ width: 44, height: 44 }}
          >
            <X size={18} color="#faeecb" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-y-auto px-2 py-4 flex flex-col gap-4">
          {operations.length > 0 && (
            <nav className="flex flex-col gap-0.5" aria-label="Operations">
              <p
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
                <button
                  key={item.route}
                  type="button"
                  onClick={() => {
                    navigate(item.route);
                    onClose();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] w-full text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
                  style={{
                    background: route === item.route ? 'rgba(232,185,60,0.12)' : 'transparent',
                    borderLeft: route === item.route ? '2px solid #e8b93c' : '2px solid transparent',
                  }}
                  aria-current={route === item.route ? 'page' : undefined}
                >
                  <item.Icon
                    size={15}
                    strokeWidth={1.6}
                    color={route === item.route ? '#e8b93c' : 'rgba(250,238,203,0.65)'}
                  />
                  <span
                    style={{
                      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                      fontSize: 14,
                      color: route === item.route ? '#faeecb' : 'rgba(250,238,203,0.75)',
                      letterSpacing: -0.15,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>
          )}

          {administration.length > 0 && (
            <nav
              className="flex flex-col gap-0.5"
              style={{ borderTop: '1px solid rgba(242,209,92,0.1)', paddingTop: 16 }}
              aria-label="Administration"
            >
              <p
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
                <button
                  key={item.route}
                  type="button"
                  onClick={() => {
                    navigate(item.route);
                    onClose();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-[8px] w-full text-left transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
                  style={{
                    background: route === item.route ? 'rgba(232,185,60,0.12)' : 'transparent',
                    borderLeft: route === item.route ? '2px solid #e8b93c' : '2px solid transparent',
                  }}
                  aria-current={route === item.route ? 'page' : undefined}
                >
                  <item.Icon
                    size={15}
                    strokeWidth={1.6}
                    color={route === item.route ? '#e8b93c' : 'rgba(250,238,203,0.65)'}
                  />
                  <span
                    style={{
                      fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                      fontSize: 14,
                      color: route === item.route ? '#faeecb' : 'rgba(250,238,203,0.75)',
                      letterSpacing: -0.15,
                    }}
                  >
                    {item.label}
                  </span>
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 pb-6 pt-3 flex flex-col gap-3"
          style={{ borderTop: '1px solid rgba(242,209,92,0.12)' }}
        >
          <button
            type="button"
            onClick={() => {
              onHome();
              onClose();
            }}
            className="flex items-center gap-2 rounded-[8px] px-3 py-2 transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
          >
            <span
              style={{
                fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                fontSize: 13,
                color: 'rgba(250,238,203,0.76)',
                letterSpacing: -0.1,
              }}
            >
              Home
            </span>
          </button>
          <div className="flex items-center justify-between">
            <span
              style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", fontSize: 11, color: '#f6e29a' }}
            >
              Theme
            </span>
            <ThemeToggle dark={dark} onToggle={onToggle} small />
          </div>
          {inspection ? (
            <button
              type="button"
              onClick={() => {
                onBackToPreview?.();
                onClose();
              }}
              className="flex items-center gap-2 rounded-[8px] px-3 py-2 transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            >
              <span
                style={{
                  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                  fontSize: 13,
                  color: 'rgba(250,238,203,0.76)',
                  letterSpacing: -0.1,
                }}
              >
                Back to Preview Index
              </span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                onSignOut();
                onClose();
              }}
              className="flex items-center gap-2 rounded-[8px] px-3 py-2 transition-colors hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            >
              <LogOut size={14} strokeWidth={1.5} color="rgba(250,238,203,0.6)" />
              <span
                style={{
                  fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
                  fontSize: 13,
                  color: 'rgba(250,238,203,0.6)',
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
