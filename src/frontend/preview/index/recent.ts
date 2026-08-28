import type { Route } from '../../app/appTypes';
import { listPreviewRoutes } from './registry';

export const PREVIEW_RECENT_ROUTES_KEY = 'hau-playground-recent-routes-v1';
const DEFAULT_LIMIT = 4;

function knownRoutes(): ReadonlySet<string> {
  return new Set(listPreviewRoutes().map((entry) => entry.route));
}

export function normalizeRecentPreviewRoutes(value: unknown, limit = DEFAULT_LIMIT): Route[] {
  if (!Array.isArray(value)) return [];
  const allowed = knownRoutes();
  const routes: Route[] = [];
  for (const item of value) {
    if (typeof item !== 'string' || !allowed.has(item) || routes.includes(item as Route)) continue;
    routes.push(item as Route);
    if (routes.length === limit) break;
  }
  return routes;
}

export function readRecentPreviewRoutes(storage: Pick<Storage, 'getItem'> | null = window.localStorage): Route[] {
  if (!storage) return [];
  try {
    const stored = storage.getItem(PREVIEW_RECENT_ROUTES_KEY);
    return stored ? normalizeRecentPreviewRoutes(JSON.parse(stored)) : [];
  } catch {
    return [];
  }
}

export function recordRecentPreviewRoute(
  route: Route,
  current: readonly Route[],
  storage: Pick<Storage, 'setItem'> | null = window.localStorage,
): Route[] {
  const next = normalizeRecentPreviewRoutes([route, ...current]);
  try {
    storage?.setItem(PREVIEW_RECENT_ROUTES_KEY, JSON.stringify(next));
  } catch {
    // The launcher remains fully usable when browser storage is unavailable.
  }
  return next;
}
