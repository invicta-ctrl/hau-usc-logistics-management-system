import io, os, sys

BASE = os.path.join('output', 'design', 'r3-a1-a2-make-recovery', 'staged', 'src')


def edit(path, reps):
    full = os.path.join(BASE, path)
    s = io.open(full, encoding='utf-8').read()
    for a, b in reps:
        assert a in s, (path, a[:70])
        s = s.replace(a, b)
    io.open(full, 'w', encoding='utf-8', newline='').write(s)
    sys.stdout.write('ok %s\n' % path)


edit('app/landing/LandingPage.tsx', [
    ('import type { AuthRoute, Route } from "../appTypes";',
     'import type { Route } from "../appTypes";'),
    ('''export function LandingPage({
  onNavigate,
  onRequireAuth,
}: {
  onNavigate: (route: Route) => void;
  onRequireAuth: (route: AuthRoute) => void;
}) {''',
     '''export function LandingPage({
  onNavigate,
  onRequireExternalRequest,
}: {
  onNavigate: (route: Route) => void;
  /* R3-A1-A2: starting a logistics request is an authenticated action. The
     landing page states the intent; the controller owns the auth gate. */
  onRequireExternalRequest: () => void;
}) {'''),
    ('''      <HeroSection
        onNavigate={onNavigate}
      />''',
     '''      <HeroSection
        onNavigate={onNavigate}
        onRequireExternalRequest={onRequireExternalRequest}
      />'''),
    ('''      <LogisticsHubSection
        onNavigate={onNavigate}
        onRequireAuth={onRequireAuth}
      />''',
     '''      <LogisticsHubSection
        onNavigate={onNavigate}
        onRequireExternalRequest={onRequireExternalRequest}
      />'''),
])

edit('app/landing/HeroSection.tsx', [
    ('''export function HeroSection({
  onNavigate,
}: {
  onNavigate: (route: Route) => void;
}) {''',
     '''export function HeroSection({
  onNavigate,
  onRequireExternalRequest,
}: {
  onNavigate: (route: Route) => void;
  onRequireExternalRequest: () => void;
}) {'''),
    ('''            <button
              type="button"
              className="atrium__primary"
              aria-label="Start a logistics request in the public Request Center. No sign-in needed."
              onClick={() => onNavigate("request")}
            >
              Start a logistics request
            </button>''',
     '''            {/* R3A1A2-REQUEST-AUTH-GATE. The External Request Center is for
                verified USC staff and officers, so this control leads to staff
                sign-in first and carries the EXTERNAL_REQUEST_CENTER intent
                through it. The label says so, rather than letting a student
                discover the gate only after committing to the flow. */}
            <button
              type="button"
              className="atrium__primary atrium__action--stacked"
              aria-label="Start a logistics request. Staff sign-in required for USC staff and officers."
              onClick={onRequireExternalRequest}
            >
              Start a logistics request
              <span className="atrium__action-note">USC staff sign-in required</span>
            </button>'''),
    ('''              className="atrium__secondary hero-action--glass"
              onClick={() => onNavigate("borrow")}
            >
              Browse public lending
            </button>''',
     '''              className="atrium__secondary hero-action--glass atrium__action--stacked"
              onClick={() => onNavigate("borrow")}
            >
              Browse public lending
              <span className="atrium__action-note">No sign-in needed</span>
            </button>'''),
    ('''              onClick={() => onNavigate("tracking")}
            >
              Track request
            </button>''',
     '''              onClick={() => onNavigate("tracking")}
            >
              Track lending
            </button>'''),
])

edit('app/landing/LogisticsHubSection.tsx', [
    ('import type { AuthRoute, Route } from "../appTypes";',
     'import type { Route } from "../appTypes";'),
    ('''export function LogisticsHubSection({
  onNavigate,
  onRequireAuth,
}: {
  onNavigate: (r: Route) => void;
  onRequireAuth: (r: AuthRoute) => void;
}) {''',
     '''export function LogisticsHubSection({
  onNavigate,
  onRequireExternalRequest,
}: {
  onNavigate: (r: Route) => void;
  onRequireExternalRequest: () => void;
}) {'''),
    ('''  const actionTiles: { label: string; sub: string; route: Route | AuthRoute; primary: boolean; protected?: boolean }[] = [
    { label: "Start a request",    sub: "Say what an activity, office or committee needs. No account needed.", route: "request", primary: true },
    { label: "Browse equipment",  sub: "See reusable items and ask to borrow. No account needed.",                    route: "borrow",         primary: false },
    { label: "Track a request",   sub: "Use your reference. No account needed.",                          route: "tracking",       primary: false },
    { label: "Staff sign in",     sub: "Open the authorized logistics workspace.",                       route: "staff-signin",   primary: false },
  ];''',
     '''  /* R3-A1-A2 three-context tiles. Each `sub` states the real access rule for
     that path, so nobody discovers a sign-in wall only after committing. */
  const actionTiles: { label: string; sub: string; key: string; onSelect: () => void; primary: boolean }[] = [
    { label: "Start a request",  key: "external-request",
      sub: "Supplies, event materials, venue and activity support for your USC office. Staff sign-in required.",
      onSelect: onRequireExternalRequest, primary: true },
    { label: "Browse equipment", key: "borrow",
      sub: "See reusable items and ask to borrow. No account needed.",
      onSelect: () => onNavigate("borrow"), primary: false },
    { label: "Track lending",    key: "tracking",
      sub: "Use your reference and private code. No account needed.",
      onSelect: () => onNavigate("tracking"), primary: false },
    { label: "Staff sign in",    key: "staff-signin",
      sub: "Open the workspaces authorized for your account.",
      onSelect: () => onNavigate("staff-signin"), primary: false },
  ];'''),
    ('''                <button
                  key={tile.route}
                  onClick={() => tile.protected ? onRequireAuth(tile.route as AuthRoute) : onNavigate(tile.route as Route)}''',
     '''                <button
                  key={tile.key}
                  onClick={tile.onSelect}'''),
])

edit('app/public/Footer.tsx', [
    ('''export function Footer({
  onNavigate,
}: {
  onNavigate: (r: Route) => void;
}) {''',
     '''export function Footer({
  onNavigate,
  onHome,
}: {
  onNavigate: (r: Route) => void;
  onHome: () => void;
}) {'''),
    ('''            <button
              onClick={() => onNavigate("request")}''',
     '''            <button
              onClick={() => onNavigate("external-request")}'''),
    ('''              Start a logistics request
            </button>''',
     '''              Start a logistics request
            </button>
            <button
              onClick={onHome}
              className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
              style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#faeecb", minHeight: 40, paddingLeft: 16, paddingRight: 16, border: "1px solid #d1b478" }}
            >
              Home
            </button>'''),
])

edit('app/public/PublicNavbar.tsx', [
    ('''export function PublicNavbar({
  dark,
  onToggle,
  onNavigate,
}: {
  dark: boolean;
  onToggle: () => void;
  onNavigate: (r: Route) => void;
}) {''',
     '''export function PublicNavbar({
  dark,
  onToggle,
  onNavigate,
  onHome,
}: {
  dark: boolean;
  onToggle: () => void;
  onNavigate: (r: Route) => void;
  /* R3A1A2-HOME-ROUTING. One semantic Home for every surface: land, scroll to
     top, close transient chrome, keep the session. Never a sign-out. */
  onHome: () => void;
}) {'''),
    ('''          <a
            href="#hero"
            className="flex items-center gap-3 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8b93c] rounded-sm"
            aria-label="HAU-USC home"
          >''',
     '''          <button
            type="button"
            onClick={onHome}
            className="flex items-center gap-3 shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#e8b93c] rounded-sm"
            aria-label="HAU-USC home"
            style={{ background: "none" }}
          >'''),
    ('''              </span>
            </span>
          </a>

          <nav className="hidden lg:flex items-center gap-5 flex-1 justify-end" aria-label="Site navigation">''',
     '''              </span>
            </span>
          </button>

          <nav className="hidden lg:flex items-center gap-5 flex-1 justify-end" aria-label="Site navigation">'''),
])

edit('app/public/PublicMobileDrawer.tsx', [
    ('''  onToggleTheme,
  onNavigate,
}: {
  open: boolean;
  onClose: () => void;
  dark: boolean;
  onToggleTheme: () => void;
  onNavigate: (r: Route) => void;
}) {''',
     '''  onToggleTheme,
  onNavigate,
  onHome,
}: {
  open: boolean;
  onClose: () => void;
  dark: boolean;
  onToggleTheme: () => void;
  onNavigate: (r: Route) => void;
  onHome: () => void;
}) {'''),
])

edit('styles/index.css', [
    ('.atrium__secondary-paths {',
     '''/* R3-A1-A2. The two hero actions now carry their access rule on the control
   itself, so a student does not discover the staff gate only after committing
   to the flow. The note wraps at narrow widths rather than overflowing. */
.atrium__action--stacked {
  flex-direction: column;
  gap: 0.25rem;
  padding-block: 0.5rem;
  line-height: 1.2;
  white-space: normal;
  text-align: center;
}

.atrium__action-note {
  font-size: 0.6875rem;
  font-weight: 500;
  letter-spacing: 0.01em;
  opacity: 0.78;
  text-wrap: balance;
}

.atrium__secondary-paths {'''),
])

sys.stdout.write('checkpoint B partial staged\n')
