import { ColorGroupSpec } from "../types";

export const BASE_COLOR_GROUP_ID = "base";

const FALLBACK_DISPLAY_COLOR = "#CCCCCC";

export type ColorGroupDisplay = { name: string; color: string };

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
