import { FALLBACK_ICON_ID, ManifestEntry } from "../core/token/icons/iconManifest";
import { resolveIconId } from "../core/token/icons/resolveIconId";
import { LoadIconSource, LoadIconSourceResult } from "../core/token/relief/computeReliefComponents";

export const createLoadIconSource = (manifest: ManifestEntry[]): LoadIconSource => {
  return async (iconId: string): Promise<LoadIconSourceResult> => {
    const { resolvedId, substituted } = resolveIconId(iconId, manifest, FALLBACK_ICON_ID);
    const response = await fetch(`/icons/${resolvedId}.svg`);

    if (!response.ok) {
      throw new Error(`Failed to load icon "${resolvedId}": ${response.statusText}`);
    }

    const svgSource = await response.text();

    return { svgSource, resolvedId, substituted };
  };
};
