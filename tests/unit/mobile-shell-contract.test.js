import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '..', '..');
const source = (path) => readFile(resolve(root, path), 'utf8');

describe('MFR-002 U03 mobile-first shell contract', () => {
  it('uses one safe-area and dynamic-viewport frame across the five accepted widths', async () => {
    const [css, shell, sidebar] = await Promise.all([
      source('src/frontend/styles/shell.css'),
      source('src/frontend/app/shell/AuthenticatedShell.tsx'),
      source('src/frontend/app/shell/AuthShellSidebar.tsx'),
    ]);

    expect(css).toContain('block-size: var(--viewport-block)');
    expect(css).toContain('max(var(--space-2xs), var(--safe-area-bottom))');
    expect(css).toContain('grid-template-columns: repeat(var(--dock-item-count, 5), minmax(0, 1fr))');
    expect(css).toContain('@media (min-width: 64rem)');
    expect(css).toContain('inline-size: 4.75rem');
    expect(css).toContain('@media (min-width: 80rem)');
    expect(css).toContain('inline-size: 17rem');
    expect(css).toContain('@media (max-width: 22.499rem)');
    expect(shell).toContain('data-has-mobile-dock');
    expect(shell).toContain("'--dock-item-count': mobileDock.length");
    expect(sidebar).toContain('auth-shell__sidebar');
  });

  it('keeps route context and modal isolation deterministic for keyboard and assistive technology', async () => {
    const [routeFocus, focusTrap, renderer, authenticatedShell] = await Promise.all([
      source('src/frontend/app/hooks/useRouteFocus.ts'),
      source('src/frontend/app/hooks/useDialogFocusTrap.ts'),
      source('src/frontend/app/AppRouteRenderer.tsx'),
      source('src/frontend/app/shell/AuthenticatedShell.tsx'),
    ]);

    expect(routeFocus).toContain("document.getElementById('main-content')");
    expect(routeFocus).toContain('main.focus({ preventScroll: true })');
    expect(routeFocus.match(/requestAnimationFrame/g)?.length).toBeGreaterThanOrEqual(2);
    expect(routeFocus).toContain('document.title = `${label} · HAU-USC Logistics`');
    expect(focusTrap).toContain('inertSelector');
    expect(focusTrap).toContain('snapshot.element.inert = true');
    expect(focusTrap).toContain('snapshot.element.inert = snapshot.inert');
    expect(renderer).toContain('APP_ROUTE_LABELS[route]');
    expect(authenticatedShell).toContain('focusOnMount: true');
  });

  it('unmounts closed drawers and gives open drawers safe viewport, focus, scroll and motion behavior', async () => {
    const [css, authDrawer, publicDrawer] = await Promise.all([
      source('src/frontend/styles/shell.css'),
      source('src/frontend/app/shell/AuthMobileDrawer.tsx'),
      source('src/frontend/app/public/PublicMobileDrawer.tsx'),
    ]);

    for (const drawer of [authDrawer, publicDrawer]) {
      expect(drawer).toContain('if (!open) return null');
      expect(drawer).toContain('data-visible={visible}');
      expect(drawer).toContain('data-dialog-initial-focus');
      expect(drawer).toContain("document.body.style.overflow = 'hidden'");
      expect(drawer).toContain('document.body.style.overflow = originalOverflow');
    }
    expect(authDrawer).toContain("inertSelector: '[data-auth-shell-background]'");
    expect(publicDrawer).toContain('[data-public-shell-chrome], #main-content, [data-public-shell-footer]');
    expect(css).toContain('.shell-drawer--start');
    expect(css).toContain('.shell-drawer--end');
    expect(css).toContain(".shell-drawer[data-visible='true']");
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
  });

  it('shares viewport-bound sheet and sticky-action behavior without changing route semantics', async () => {
    const [css, inventory, requests, lending] = await Promise.all([
      source('src/frontend/styles/shell.css'),
      source('src/frontend/app/inventory/InventoryInspector.tsx'),
      source('src/frontend/app/request/InternalRequestHub.tsx'),
      source('src/frontend/app/lending/InternalLendingHub.tsx'),
    ]);

    expect(css).toContain('.shell-sheet--viewport');
    expect(css).toContain('.shell-sheet--responsive');
    expect(css).toContain('.shell-sheet__actions');
    expect(css).toContain('inset-block-end: 0');
    expect(inventory).toContain('shell-sheet--viewport');
    expect(requests).toContain('shell-sheet__actions');
    expect(lending).toContain('shell-sheet--responsive');
    expect(lending).toContain('shell-modal__surface');
  });

  it('keeps public shell links semantic and every shared main landmark focusable', async () => {
    const [
      navbar,
      drawer,
      navLink,
      landingNavigation,
      footer,
      controller,
      landing,
      publicFlows,
      signIn,
      requester,
    ] = await Promise.all([
      source('src/frontend/app/public/PublicNavbar.tsx'),
      source('src/frontend/app/public/PublicMobileDrawer.tsx'),
      source('src/frontend/app/public/NavLink.tsx'),
      source('src/frontend/app/public/landingSectionNavigation.ts'),
      source('src/frontend/app/public/Footer.tsx'),
      source('src/frontend/app/useAppController.ts'),
      source('src/frontend/app/landing/LandingPage.tsx'),
      source('src/frontend/app/PublicFlows.tsx'),
      source('src/frontend/app/auth/StaffSignInPage.tsx'),
      source('src/frontend/app/request/ExternalRequestCenter.tsx'),
    ]);

    expect(navbar).toContain('openLandingSection');
    expect(landingNavigation).toContain("section.scrollIntoView({ block: 'start', behavior: 'auto' })");
    expect(landingNavigation).toContain('focusTarget.focus({ preventScroll: true })');
    expect(footer).toContain('openLandingSection("logistics", onHome)');
    expect(footer).toContain('openLandingSection("hero", onHome)');
    expect(drawer).toContain('onOpenSection(link.href.slice(1))');
    expect(navLink).toContain("aria-current={active ? 'page' : undefined}");
    expect(controller).toContain("window.scrollTo({ top: 0, left: 0, behavior: 'auto' })");
    for (const main of [landing, publicFlows, signIn, requester]) {
      expect(main).toContain('id="main-content"');
      expect(main).toContain('tabIndex={-1}');
    }
  });
});
