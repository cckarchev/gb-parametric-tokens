import {
  FALLBACK_ICON_ID,
  type ManifestEntry,
} from "@/core/token/icons/iconManifest";
import { resolveIconId } from "@/core/token/icons/resolveIconId";
import { resolveIconPath } from "@/core/token/icons/resolveIconPath";
import type {
  LoadIconSource,
  LoadIconSourceResult,
} from "@/core/token/relief/computeReliefComponents";

export const createLoadIconSource =
  (manifest: ManifestEntry[]): LoadIconSource =>
  async (iconId: string): Promise<LoadIconSourceResult> => {
    const { resolvedId, substituted } = resolveIconId(
      iconId,
      manifest,
      FALLBACK_ICON_ID,
    );
    const resolvedEntry = manifest.find((entry) => entry.id === resolvedId);
    const iconPath = resolvedEntry
      ? resolveIconPath(resolvedEntry)
      : `${resolvedId}.svg`;
    const response = await fetch(`/icons/${iconPath}`);

    if (!response.ok) {
      throw new Error(
        `Failed to load icon "${resolvedId}": ${response.statusText}`,
      );
    }

    const svgSource = await response.text();

    return { svgSource, resolvedId, substituted };
  };
