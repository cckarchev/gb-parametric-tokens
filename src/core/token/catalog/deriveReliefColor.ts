// The fixed second color-group role every generated line and icon is tagged with, so it
// resolves to the guild-derived relief color instead of silently falling back to "base" (see
// mesh/colorGroups.ts's BASE_COLOR_GROUP_ID for the body's own, always-implicit id).
export const TEXT_COLOR_GROUP_ID = "text";

// SPEC.md §9: guild color goes on the base, never the relief. Relief color is derived from the
// base's relative luminance so it always contrasts against it, instead of a fixed color that
// disappears against dark guilds (Morticians, Ratcatchers) or washes out against bright ones
// (Order). darkColor is a dark-mode UI variant, not a print color, and must never be used here.
const RELIEF_LUMINANCE_THRESHOLD = 0.2;
const LIGHT_RELIEF_COLOR = "#FFFFFF";
const DARK_RELIEF_COLOR = "#000000";

const SRGB_LINEAR_THRESHOLD = 0.04045;
const SRGB_LINEAR_DIVISOR = 12.92;
const SRGB_GAMMA_OFFSET = 0.055;
const SRGB_GAMMA_SCALE = 1.055;
const SRGB_GAMMA_EXPONENT = 2.4;
const LUMINANCE_RED_WEIGHT = 0.2126;
const LUMINANCE_GREEN_WEIGHT = 0.7152;
const LUMINANCE_BLUE_WEIGHT = 0.0722;

const srgbChannelToLinear = (channel: number): number => {
  if (channel <= SRGB_LINEAR_THRESHOLD) {
    return channel / SRGB_LINEAR_DIVISOR;
  }

  return ((channel + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_SCALE) ** SRGB_GAMMA_EXPONENT;
};

const relativeLuminance = (hexColor: string): number => {
  const hex = hexColor.replace("#", "");
  const red = Number.parseInt(hex.slice(0, 2), 16) / 255;
  const green = Number.parseInt(hex.slice(2, 4), 16) / 255;
  const blue = Number.parseInt(hex.slice(4, 6), 16) / 255;

  return (
    LUMINANCE_RED_WEIGHT * srgbChannelToLinear(red) +
    LUMINANCE_GREEN_WEIGHT * srgbChannelToLinear(green) +
    LUMINANCE_BLUE_WEIGHT * srgbChannelToLinear(blue)
  );
};

export const deriveReliefColor = (baseColorHex: string): string => {
  return relativeLuminance(baseColorHex) < RELIEF_LUMINANCE_THRESHOLD
    ? LIGHT_RELIEF_COLOR
    : DARK_RELIEF_COLOR;
};
