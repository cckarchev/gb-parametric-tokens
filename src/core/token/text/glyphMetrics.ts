import { findFontEntry } from "./fontCatalog";

// How tall a line of all-caps text stands above its baseline, in the font named
// by fontId (undefined is the body font).
export const estimateAscentMm = (
  sizeMm: number,
  fontId: string | undefined,
): number => {
  const { ascentRatio } = findFontEntry(fontId).metrics;

  return sizeMm * ascentRatio;
};
