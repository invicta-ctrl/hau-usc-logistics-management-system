export const WORKSPACE_ROUTES = Object.freeze({
  administrator: Object.freeze({ slug: 'admin', path: '/admin' }),
  director: Object.freeze({ slug: 'director', path: '/director' }),
  food: Object.freeze({ slug: 'food', path: '/food' }),
  'inventory-pantry': Object.freeze({ slug: 'inventory', path: '/inventory' }),
  materials: Object.freeze({ slug: 'materials', path: '/materials' }),
});

const BY_SLUG = new Map(
  Object.entries(WORKSPACE_ROUTES).map(([workspaceId, route]) => [route.slug, workspaceId]),
);

export function workspaceRouteFromPath(pathname = '/') {
  const segments = String(pathname).split('/').filter(Boolean);
  const legacy = segments[0] === 'app';
  const slug = legacy ? segments[1] : segments[0];
  const workspaceId = BY_SLUG.get(slug) ?? '';
  if (!workspaceId) return { workspaceId: '', module: '', canonicalPath: '', legacy: false };
  const module = segments[legacy ? 2 : 1] ?? '';
  const canonicalPath = `${WORKSPACE_ROUTES[workspaceId].path}${module ? `/${module}` : ''}`;
  return { workspaceId, module, canonicalPath, legacy };
}

export function workspacePath(workspaceId, module = '') {
  const route = WORKSPACE_ROUTES[workspaceId];
  if (!route) return '';
  const suffix = String(module ?? '')
    .trim()
    .replace(/^\/+|\/+$/gu, '');
  return `${route.path}${suffix ? `/${suffix}` : ''}`;
}

export function isInternalWorkspacePath(pathname = '/') {
  return Boolean(workspaceRouteFromPath(pathname).workspaceId);
}
