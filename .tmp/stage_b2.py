import io, os, sys

BASE = os.path.join('output', 'design', 'r3-a1-a2-make-recovery', 'staged', 'src')


def edit(path, reps):
    full = os.path.join(BASE, path)
    s = io.open(full, encoding='utf-8').read()
    for a, b in reps:
        assert a in s, (path, a[:80])
        s = s.replace(a, b)
    io.open(full, 'w', encoding='utf-8', newline='').write(s)
    sys.stdout.write('ok %s\n' % path)


# PublicNavbar must hand the one semantic Home down to the drawer.
edit('app/public/PublicNavbar.tsx', [
    ('''      <PublicMobileDrawer
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}''',
     '''      <PublicMobileDrawer
        onHome={onHome}
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}'''),
])

# Drawer: external-request intent plus its own Home affordance.
edit('app/public/PublicMobileDrawer.tsx', [
    ('''            onClick={() => { onClose(); onNavigate("request"); }}''',
     '''            onClick={() => { onClose(); onNavigate("external-request"); }}'''),
    ('''            Start a logistics request
          </button>''',
     '''            Start a logistics request
          </button>
          <button
            onClick={() => { onClose(); onHome(); }}
            className="flex items-center justify-center rounded-[10px] text-[13px] font-semibold tracking-[-0.13px] transition-opacity hover:opacity-90 active:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            style={{ fontFamily: "'IBM Plex Sans', system-ui, sans-serif", color: "#faeecb", minHeight: 48, border: "1px solid #d1b478" }}
          >
            Home
          </button>'''),
])

# Final switch: "request" leaves PublicSubRoute now that no caller uses it.
edit('app/appTypes.ts', [
    ('''/* R3-A1-A2 three-context route and identity model.
 *
 *   A. PUBLIC            Public Lending Hub, no sign-in, ever.
 *   B. AUTH REQUESTER    External Request Center, eligible USC requester.
 *   C. AUTH DOL          Main Logistics Hub, internal capability gated.
 *
 * CHECKPOINT A is additive on purpose: "request" stays in PublicSubRoute for now
 * so every existing caller still type-checks. Checkpoint B removes it in the same
 * save as the callers that stop using it.
 */
export type PublicSubRoute = "request" | "tracking" | "borrow";''',
     '''/* R3-A1-A2 three-context route and identity model.
 *
 *   A. PUBLIC            Public Lending Hub, no sign-in, ever.
 *   B. AUTH REQUESTER    External Request Center, eligible USC requester.
 *   C. AUTH DOL          Main Logistics Hub, internal capability gated.
 *
 * `PublicSubRoute` no longer carries "request". The logistics Request Center is
 * not public; it is `external-request`, which requires a session.
 */
export type PublicSubRoute = "tracking" | "borrow";'''),
])

sys.stdout.write('checkpoint B wiring staged\n')
