// SPEC.md §9: guild color goes on the base, never the relief. Relief color is
// derived from the base's relative luminance so it always contrasts against it,
// instead of a fixed color that disappears against dark guilds (Morticians,
// Ratcatchers) or washes out against bright ones (Order). darkColor is a
// dark-mode UI variant, not a print color, and must never be used here.
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

  return (
    ((channel + SRGB_GAMMA_OFFSET) / SRGB_GAMMA_SCALE) ** SRGB_GAMMA_EXPONENT
  );
};

const HEX_RADIX = 16;
const HEX_DIGITS_PER_CHANNEL = 2;
const CHANNEL_MAX = 255;

// The channelIndex-th channel of a "#rrggbb" color's digits, as 0..1.
const hexChannel = (hex: string, channelIndex: number): number => {
  const start = channelIndex * HEX_DIGITS_PER_CHANNEL;
  const digits = hex.slice(start, start + HEX_DIGITS_PER_CHANNEL);

  return Number.parseInt(digits, HEX_RADIX) / CHANNEL_MAX;
};

const relativeLuminance = (hexColor: string): number => {
  const hex = hexColor.replace("#", "");
  const red = hexChannel(hex, 0);
  const green = hexChannel(hex, 1);
  const blue = hexChannel(hex, 2);

  return (
    LUMINANCE_RED_WEIGHT * srgbChannelToLinear(red) +
    LUMINANCE_GREEN_WEIGHT * srgbChannelToLinear(green) +
    LUMINANCE_BLUE_WEIGHT * srgbChannelToLinear(blue)
  );
};

export const deriveReliefColor = (baseColorHex: string): string =>
  relativeLuminance(baseColorHex) < RELIEF_LUMINANCE_THRESHOLD
    ? LIGHT_RELIEF_COLOR
    : DARK_RELIEF_COLOR;
