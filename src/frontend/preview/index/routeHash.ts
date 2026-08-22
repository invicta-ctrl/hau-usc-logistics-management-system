export const PREVIEW_INDEX_HASH = "#/__preview/index";

export function isPreviewIndexHash(value: unknown): boolean {
  return value === PREVIEW_INDEX_HASH;
}
