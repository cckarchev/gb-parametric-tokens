import { ColorGroupSpec } from "../types";

export const BASE_COLOR_GROUP_ID = "base";

// The fixed second color-group role every generated line and icon is tagged with, so it
// resolves to the guild-derived relief color (see catalog/deriveReliefColor.ts) instead of
// silently falling back to the body's own, always-implicit BASE_COLOR_GROUP_ID above.
export const TEXT_COLOR_GROUP_ID = "text";

const FALLBACK_DISPLAY_COLOR = "#CCCCCC";

type ColorGroupDisplay = { name: string; color: string };

export const resolveColorGroupId = (colorGroup?: string): string => {
  return colorGroup ?? BASE_COLOR_GROUP_ID;
};

export const resolveColorGroupDisplay = (
  colorGroupId: string,
  colorGroups: ColorGroupSpec[],
): ColorGroupDisplay => {
  const found = colorGroups.find((group) => group.id === colorGroupId);

  if (found) {
    return { name: found.name, color: found.color };
  }

  return { name: colorGroupId, color: FALLBACK_DISPLAY_COLOR };
};
