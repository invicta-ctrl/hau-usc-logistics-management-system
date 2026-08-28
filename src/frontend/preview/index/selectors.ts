import { PREVIEW_INDEX_REGISTRY } from "./registry";
import type { PreviewRouteEntry } from "./registry";
import type { PreviewFilter, RouteGroup } from "./vocabulary";

export type PreviewRouteGroup = {
  readonly group: RouteGroup;
  readonly items: PreviewRouteEntry[];
};

function normalizeSearchValue(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function fuzzyTokenScore(token: string, value: string): number | null {
  const exactIndex = value.indexOf(token);
  if (exactIndex >= 0) return exactIndex;

  let cursor = 0;
  let score = 12;
  let previousMatch = -1;
  for (const character of token) {
    const match = value.indexOf(character, cursor);
    if (match < 0) return null;
    score += previousMatch < 0 ? match : match - previousMatch - 1;
    previousMatch = match;
    cursor = match + 1;
  }
  return score;
}

function previewRouteSearchScore(
  entry: PreviewRouteEntry,
  tokens: readonly string[],
  directFieldsOnly = false,
): number | null {
  const fields = [
    normalizeSearchValue(entry.label),
    normalizeSearchValue(entry.route),
    normalizeSearchValue(entry.group),
    normalizeSearchValue(entry.description),
  ].slice(0, directFieldsOnly ? 2 : 4);
  let total = 0;
  for (const token of tokens) {
    const scores = fields
      .map((field, fieldIndex) => {
        const score = fuzzyTokenScore(token, field);
        return score === null ? null : score + fieldIndex * 4;
      })
      .filter((score): score is number => score !== null);
    if (!scores.length) return null;
    total += Math.min(...scores);
  }
  return total;
}

function rankFuzzyPreviewRoutes(
  entries: readonly PreviewRouteEntry[],
  tokens: readonly string[],
  directFieldsOnly: boolean,
): PreviewRouteEntry[] {
  return entries
    .map((entry, index) => ({ entry, index, score: previewRouteSearchScore(entry, tokens, directFieldsOnly) }))
    .filter((result): result is { entry: PreviewRouteEntry; index: number; score: number } => result.score !== null)
    .sort((left, right) => left.score - right.score || left.index - right.index)
    .map(({ entry }) => entry);
}

export function searchPreviewRoutes(
  query: string,
  entries: readonly PreviewRouteEntry[] = PREVIEW_INDEX_REGISTRY,
): PreviewRouteEntry[] {
  const tokens = normalizeSearchValue(query).split(' ').filter(Boolean);
  if (!tokens.length) return [...entries];
  const exactMatch = (entry: PreviewRouteEntry, directFieldsOnly: boolean) => {
    const fields = [entry.route, entry.label, entry.group, entry.description]
      .slice(0, directFieldsOnly ? 2 : 4)
      .map(normalizeSearchValue);
    return tokens.every((token) => fields.some((field) => field.includes(token)));
  };
  const directExactMatches = entries.filter((entry) => exactMatch(entry, true));
  if (directExactMatches.length) return directExactMatches;
  const exactMatches = entries.filter((entry) => exactMatch(entry, false));
  if (exactMatches.length) return exactMatches;
  const directFuzzyMatches = rankFuzzyPreviewRoutes(entries, tokens, true);
  return directFuzzyMatches.length ? directFuzzyMatches : rankFuzzyPreviewRoutes(entries, tokens, false);
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
      return entries.filter((entry) => entry.previewMode === "SURFACE_PREVIEW");
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
