import type { FrontendVersion } from "../../integration/backend";

export type PreviewIndexGate = {
  readonly validatedPlayground: boolean;
  readonly indexAllowed: boolean;
};

export function projectPreviewIndexGate(version: FrontendVersion): PreviewIndexGate {
  const trusted = version.playground === true;
  return Object.freeze({
    validatedPlayground: trusted,
    indexAllowed: trusted,
  });
}
