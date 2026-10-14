// How high a capital letter's top sits above the baseline, as a fraction of sizeMm, measured on
// the bundled font through layoutArcText. Not the font's `ascender`, which leaves room for
// accents this text never uses. Remeasure if the font changes.
const GLYPH_ASCENT_RATIO = 0.69;

// How tall a line of all-caps text stands above its baseline.
export const estimateAscentMm = (sizeMm: number): number => {
  return sizeMm * GLYPH_ASCENT_RATIO;
};
