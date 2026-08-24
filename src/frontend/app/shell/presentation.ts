import type { AuthRoute, Session } from '../appTypes';

/** Presentational shell data. It deliberately carries no authenticated flag or server authority. */
export type ShellPresentation = Readonly<{
  displayName: string;
  roleLabel: string;
  initials: string;
  visibleRoutes: readonly AuthRoute[];
}>;

export function shellPresentationFromSession(session: Session): ShellPresentation {
  return {
    displayName: session.displayName,
    roleLabel: session.role,
    initials: session.initials,
    visibleRoutes: session.capabilities,
  };
}

export const LOCAL_PREVIEW_OPERATOR: ShellPresentation = Object.freeze({
  displayName: 'Preview Operator',
  roleLabel: 'DOL Preview',
  initials: 'PO',
  visibleRoutes: [
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
  ],
});
