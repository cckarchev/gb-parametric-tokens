import { ManifestEntry } from "./iconManifest";

export type ResolveIconIdResult = { resolvedId: string; substituted: boolean };

export const resolveIconId = (
  iconId: string,
  manifest: ManifestEntry[],
  fallbackId: string,
): ResolveIconIdResult => {
  const isKnown = manifest.some((entry) => entry.id === iconId);

  if (isKnown) {
    return { resolvedId: iconId, substituted: false };
  }

  return { resolvedId: fallbackId, substituted: true };
};
