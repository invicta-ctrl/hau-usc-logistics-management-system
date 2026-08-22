import { PREVIEW_INDEX_REGISTRY } from "./registry";
import type { PreviewRouteEntry } from "./registry";
import type { PreviewFilter, RouteGroup } from "./vocabulary";

export type PreviewRouteGroup = {
  readonly group: RouteGroup;
  readonly items: PreviewRouteEntry[];
};

export function searchPreviewRoutes(
  query: string,
  entries: readonly PreviewRouteEntry[] = PREVIEW_INDEX_REGISTRY,
): PreviewRouteEntry[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [...entries];
  return entries.filter((entry) =>
    [entry.route, entry.label, entry.description].some((value) => value.toLowerCase().includes(needle)),
  );
}

export function filterPreviewRoutes(
  filter: PreviewFilter,
  entries: readonly PreviewRouteEntry[] = PREVIEW_INDEX_REGISTRY,
): PreviewRouteEntry[] {
  switch (filter) {
    case "ALL":
      return [...entries];
    case "ACCEPTED":
      return entries.filter((entry) => entry.implementationStatus === "ACCEPTED");
    case "IN_PROGRESS":
      return entries.filter((entry) => entry.implementationStatus === "IN_PROGRESS");
    case "BACKEND_WIRED":
      return entries.filter((entry) => entry.backendStatus === "REAL_BACKEND");
    case "PREVIEW_ONLY":
      return entries.filter((entry) => entry.backendStatus === "VISUAL_ONLY");
    case "NOT_STARTED":
      return entries.filter((entry) => entry.implementationStatus === "NOT_STARTED");
    case "PUBLIC":
      return entries.filter((entry) => entry.access === "PUBLIC");
    case "AUTHENTICATED":
      return entries.filter((entry) => entry.access === "AUTHENTICATED");
  }
}

export function groupPreviewRoutes(
  entries: readonly PreviewRouteEntry[] = PREVIEW_INDEX_REGISTRY,
): PreviewRouteGroup[] {
  const groups = new Map<RouteGroup, PreviewRouteEntry[]>();
  const order: RouteGroup[] = [];
  for (const entry of entries) {
    if (!groups.has(entry.group)) {
      groups.set(entry.group, []);
      order.push(entry.group);
    }
    groups.get(entry.group)!.push(entry);
  }
  return order.map((group) => ({ group, items: groups.get(group)! }));
}
