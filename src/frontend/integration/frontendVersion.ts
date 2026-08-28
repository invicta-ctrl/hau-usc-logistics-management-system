import { frontendBackend, type FrontendVersion } from './backend';

export function createSharedFrontendVersionLoader(
  requestVersion: () => Promise<FrontendVersion> = () => frontendBackend.version(),
) {
  let request: Promise<FrontendVersion> | null = null;

  return () => {
    request ??= requestVersion();
    return request;
  };
}

/** One fail-closed capability request is shared by every consumer for this page load. */
export const loadFrontendVersion = createSharedFrontendVersionLoader();
