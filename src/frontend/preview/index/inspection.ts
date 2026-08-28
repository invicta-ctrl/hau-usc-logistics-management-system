import type { AuthRoute, Route } from '../../app/appTypes';
import type { PreviewFilter } from './vocabulary';

export type PreviewInspectionState =
  | Readonly<{ mode: 'OFF' }>
  | Readonly<{ mode: 'LOCAL_INDEX_INSPECTION'; route: AuthRoute | 'external-request' }>;

export type PreviewIndexBrowseState = Readonly<{
  query: string;
  filter: PreviewFilter;
  scrollTop: number;
}>;

export const PREVIEW_INSPECTION_OFF: PreviewInspectionState = Object.freeze({ mode: 'OFF' });

export function isProtectedPreviewRoute(route: Route): route is AuthRoute | 'external-request' {
  return (
    route === 'external-request' ||
    [
      'overview',
      'inventory',
      'request-center',
      'lending',
      'release',
      'restocking',
      'procurement',
      'events',
      'administration',
      'profile',
    ].includes(route)
  );
}

/* The loopback host the A4 gate accepts, and the two ports involved.
 *
 * 4173 is the designated frontend playground preview, bound by
 * scripts/frontend-preview-supervisor.mjs (PREVIEW_HOST/PREVIEW_PORT). It is
 * admitted always, exactly as before.
 *
 * 4174 is the isolated local design preview. The owner put the post-FI17 design
 * pass on it so 4173 stays free for the parallel FM program, then asked for
 * 4173's preview capability there. It is admitted ONLY behind the explicit
 * opt-in below — never by default.
 *
 * Exported so the Index can name the admitted origins when it declines, instead
 * of leaving the control silently inert; message and gate cannot then drift. */
export const LOCAL_INSPECTION_HOSTNAME = '127.0.0.1';
export const DESIGNATED_INSPECTION_PORT = '4173';
export const LOCAL_DESIGN_PREVIEW_PORT = '4174';

/* The opt-in.
 *
 * The Preview Index fails closed by design, and three e2e guarantees say so in
 * as many words: it must not trust spoofed storage or a malformed `playground`
 * value, and it must fail closed WHEN THE VERSION ENDPOINT ERRORS. That last one
 * is precisely the isolated design preview's situation — a bare `vite` dev
 * server has no backend, so /api/version falls through to the SPA and version()
 * rejects. The absent launcher on 4174 was that contract working, not a bug.
 *
 * So the capability is not switched on by relaxing the default. It is an
 * explicit, deliberate act by whoever starts the preview:
 *
 *     VITE_HAU_LOCAL_DESIGN_PREVIEW=1 npx vite --port 4174 --host 127.0.0.1
 *
 * Unset — every test run, every CI run, every ordinary `npm run dev` — the gate
 * behaves exactly as it did before this change.
 *
 * It is also ANDed with `dev` everywhere it is used, so even if the variable
 * were present during a build it is dead: `import.meta.env.DEV` is false in all
 * builds, App.tsx additionally gates the whole Index on MODE !== 'production',
 * and scripts/verify-preview-absent.mjs proves the modules are absent from the
 * production bundle.
 *
 * What it deliberately does NOT do: serve a local /api/version claiming
 * playground: true. That would state something false about the backend and
 * would weaken the control that keeps preview tooling off Production. The opt-in
 * asserts only a checkable fact about where the code is running. */
const localDesignPreviewOptIn = (): boolean =>
  import.meta.env.VITE_HAU_LOCAL_DESIGN_PREVIEW === '1';

function admittedInspectionPorts(localDesignPreview: boolean): readonly string[] {
  return localDesignPreview
    ? [DESIGNATED_INSPECTION_PORT, LOCAL_DESIGN_PREVIEW_PORT]
    : [DESIGNATED_INSPECTION_PORT];
}

export function localInspectionOrigins(
  localDesignPreview: boolean = localDesignPreviewOptIn(),
): readonly string[] {
  return admittedInspectionPorts(localDesignPreview).map(
    (port) => `${LOCAL_INSPECTION_HOSTNAME}:${port}`,
  );
}

export function localPreviewInspectionAllowed({
  indexAllowed,
  indexOpen,
  explicitIndexAction,
  dev = import.meta.env.DEV,
  localDesignPreview = localDesignPreviewOptIn(),
  location = typeof window === 'undefined' ? undefined : window.location,
}: {
  indexAllowed: boolean;
  indexOpen: boolean;
  explicitIndexAction: boolean;
  dev?: boolean;
  localDesignPreview?: boolean;
  location?: Pick<Location, 'hostname' | 'port'>;
}): boolean {
  return Boolean(
    dev &&
    location?.hostname === LOCAL_INSPECTION_HOSTNAME &&
    admittedInspectionPorts(Boolean(dev && localDesignPreview)).includes(location.port) &&
    indexAllowed &&
    indexOpen &&
    explicitIndexAction,
  );
}

/* Whether the Index may appear at all.
 *
 * The server is still the authority on any real deployment: a playground
 * attestation admits it, and nothing else does — spoofed storage, a malformed
 * flag, or an erroring endpoint all still fail closed, unchanged.
 *
 * The one addition is the explicit local-design-preview opt-in described above,
 * which admits a dev server on the admitted loopback origin without claiming
 * anything about a backend. */
export function previewIndexAvailable({
  playgroundAttested,
  dev = import.meta.env.DEV,
  localDesignPreview = localDesignPreviewOptIn(),
  location = typeof window === 'undefined' ? undefined : window.location,
}: {
  playgroundAttested: boolean;
  dev?: boolean;
  localDesignPreview?: boolean;
  location?: Pick<Location, 'hostname' | 'port'>;
}): boolean {
  if (playgroundAttested) return true;
  if (!dev || !localDesignPreview) return false;
  return Boolean(
    location?.hostname === LOCAL_INSPECTION_HOSTNAME &&
    admittedInspectionPorts(true).includes(location.port),
  );
}
